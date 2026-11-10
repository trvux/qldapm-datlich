"""Việc #32: chạy thử luồng đặt lịch từ đầu đến cuối (Câu 8) và kiểm tra đặt đồng thời (BR13).

Luồng theo đề: Khách xem dịch vụ -> chọn thời gian -> đặt lịch -> hệ thống kiểm tra điều kiện
-> lưu lịch hẹn -> nhân viên xác nhận lịch.
"""
import threading
from concurrent.futures import ThreadPoolExecutor

import httpx
import pytest

from tests.conftest import PASSWORDS, book


def test_full_customer_to_staff_flow(customer1, staff, vehicle_ids):
    # 1. Khách xem danh sách dịch vụ và chi tiết (không cần đăng nhập, nhưng đăng nhập vẫn xem được)
    services = customer1.get("/services").json()
    assert len(services) == 7  # 8 dịch vụ, 1 đã ngừng
    chosen = services[0]
    detail = customer1.get(f"/services/{chosen['service_id']}").json()
    assert detail["name"] == chosen["name"] and detail["duration_minutes"] > 0

    # 2. Khách chọn xe và khung giờ còn chỗ
    vehicle = customer1.get("/vehicles").json()[0]
    assert vehicle["vehicle_id"] == vehicle_ids["c1"][0]
    slots = customer1.get("/slots").json()
    slot = next(s for s in slots if s["bookable"] and s["slot_date"] > slots[0]["slot_date"])
    before = slot["remaining"]

    # 3. Đặt lịch: hệ thống kiểm tra điều kiện và lưu, trạng thái Chờ xác nhận
    r = book(customer1, vehicle["vehicle_id"], slot["slot_id"], chosen["service_id"], note="Xe kêu lạ")
    assert r.status_code == 201, r.text
    appt = r.json()
    assert appt["status"] == "PENDING"
    aid = appt["appointment_id"]

    # 4. Chỗ đã được giữ ngay từ lúc đặt, chưa cần chờ nhân viên (BR14)
    held = next(s for s in customer1.get("/slots", params={"from": slot["slot_date"], "to": slot["slot_date"]}).json() if s["slot_id"] == slot["slot_id"])
    assert held["remaining"] == before - 1

    # 5. Nhân viên xác nhận
    r = staff.post(f"/appointments/{aid}/confirm")
    assert r.status_code == 200, r.text
    assert r.json()["status"] == "CONFIRMED"
    staff_id = staff.get("/auth/me").json()["user_id"]
    assert r.json()["handled_by"] == staff_id  # BR16

    # 6. Khách thấy trạng thái mới và đủ lịch sử
    mine = customer1.get(f"/appointments/{aid}").json()
    assert mine["status"] == "CONFIRMED"
    assert [(h["old_status"], h["new_status"]) for h in mine["history"]] == [
        (None, "PENDING"),
        ("PENDING", "CONFIRMED"),
    ]
    assert mine["history"][1]["changed_by"] == staff_id

    # 7. Xác nhận không đổi số chỗ (đã giữ từ lúc đặt, BR16)
    after = next(s for s in customer1.get("/slots", params={"from": slot["slot_date"], "to": slot["slot_date"]}).json() if s["slot_id"] == slot["slot_id"])
    assert after["remaining"] == before - 1


def test_reject_flow_requires_reason_and_frees_seat(customer1, staff, vehicle_ids, open_slots):
    s = open_slots[0]
    aid = book(customer1, vehicle_ids["c1"][0], s["slot_id"]).json()["appointment_id"]

    # BR15: bắt buộc có lý do
    assert staff.post(f"/appointments/{aid}/reject", json={}).status_code == 422
    assert staff.post(f"/appointments/{aid}/reject", json={"reason": "   "}).status_code == 422

    r = staff.post(f"/appointments/{aid}/reject", json={"reason": "  Hết khoang trống  "})
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "REJECTED" and body["reject_reason"] == "Hết khoang trống"
    assert body["history"][-1]["note"] == "Hết khoang trống"

    after = next(x for x in customer1.get("/slots", params={"from": s["slot_date"], "to": s["slot_date"]}).json() if x["slot_id"] == s["slot_id"])
    assert after["booked"] == 0


def test_cannot_decide_an_appointment_twice(customer1, staff, vehicle_ids, open_slots):
    """BR15, BR17: chỉ xử lý lịch đang Chờ xác nhận; không đi ngược trạng thái."""
    aid = book(customer1, vehicle_ids["c1"][0], open_slots[0]["slot_id"]).json()["appointment_id"]
    assert staff.post(f"/appointments/{aid}/confirm").status_code == 200
    for path, kw in (("confirm", {}), ("reject", {"json": {"reason": "x"}})):
        r = staff.post(f"/appointments/{aid}/{path}", **kw)
        assert (r.status_code, r.json()["error"]["code"]) == (409, "INVALID_STATUS_TRANSITION")


def test_decide_missing_appointment(staff):
    assert staff.post("/appointments/999999/confirm").status_code == 404


def test_visibility_rules(customer1, customer2, staff, manager, vehicle_ids, open_slots):
    """BR23: khách chỉ xem lịch của mình; nhân viên và quản lý xem tất cả."""
    aid = book(customer1, vehicle_ids["c1"][0], open_slots[0]["slot_id"]).json()["appointment_id"]
    assert customer1.get(f"/appointments/{aid}").status_code == 200
    assert staff.get(f"/appointments/{aid}").status_code == 200
    assert manager.get(f"/appointments/{aid}").status_code == 200
    other = customer2.get(f"/appointments/{aid}")
    assert (other.status_code, other.json()["error"]["code"]) == (404, "APPOINTMENT_NOT_FOUND")
    assert customer1.get("/appointments/999999").status_code == 404


def test_health(anon):
    assert anon.get("/health").json() == {"status": "ok"}


# ---------- BR13: đặt đồng thời ----------


def _logins(base_url):
    out = {}
    for key, email in (("c1", "khach1@example.com"), ("c2", "khach2@example.com"), ("c3", "khach3@example.com")):
        c = httpx.Client(base_url=base_url, timeout=30)
        tok = c.post("/auth/login", json={"email": email, "password": PASSWORDS[email]}).json()["access_token"]
        c.headers["Authorization"] = f"Bearer {tok}"
        out[key] = c
    return out


def _fire(jobs):
    """Chạy các job (callable) đồng thời, cùng xuất phát nhờ barrier."""
    barrier = threading.Barrier(len(jobs))

    def run(job):
        barrier.wait()
        return job()

    with ThreadPoolExecutor(len(jobs)) as pool:
        return list(pool.map(run, jobs))


@pytest.mark.parametrize("round_", range(5))
def test_concurrent_booking_never_exceeds_capacity(base_url, manager, vehicle_ids, open_slots, db, round_):
    """6 yêu cầu cùng lúc vào khung giờ chỉ còn 2 chỗ: đúng 2 thành công, 4 báo hết chỗ (BR13)."""
    sid = open_slots[round_]["slot_id"]
    assert manager.patch(f"/slots/{sid}", json={"max_capacity": 2}).status_code == 200
    clients = _logins(base_url)
    jobs = [
        (lambda c=clients[k], v=vehicle_ids[k][i]: book(c, v, sid))
        for k in ("c1", "c2", "c3")
        for i in (0, 1)
    ]
    results = _fire(jobs)

    codes = sorted(r.status_code for r in results)
    assert codes == [201, 201, 409, 409, 409, 409], [r.text for r in results]
    assert {r.json()["error"]["code"] for r in results if r.status_code == 409} == {"SLOT_FULL"}
    assert db.execute(
        "SELECT count(*) n FROM appointments WHERE slot_id = %s AND status = 'PENDING'", (sid,)
    ).fetchone()["n"] == 2
    for c in clients.values():
        c.close()


def test_concurrent_booking_respects_per_customer_limit(base_url, vehicle_ids, open_slots, db):
    """Một khách bắn 6 yêu cầu cùng lúc vào 6 khung giờ khác nhau: chỉ 3 lịch được lưu (BR11)."""
    client = _logins(base_url)["c1"]
    v = vehicle_ids["c1"][0]
    results = _fire([(lambda i=i: book(client, v, open_slots[i]["slot_id"])) for i in range(6)])

    assert sorted(r.status_code for r in results) == [201, 201, 201, 409, 409, 409]
    assert {r.json()["error"]["code"] for r in results if r.status_code == 409} == {"BOOKING_LIMIT_REACHED"}
    assert db.execute(
        "SELECT count(*) n FROM appointments WHERE customer_id = (SELECT user_id FROM users WHERE email = 'khach1@example.com')"
    ).fetchone()["n"] == 3
    client.close()


def test_concurrent_double_submit_same_vehicle_same_slot(base_url, vehicle_ids, open_slots, db):
    """Bấm đặt 2 lần (double-click): chỉ 1 lịch được lưu."""
    client = _logins(base_url)["c1"]
    sid, v = open_slots[0]["slot_id"], vehicle_ids["c1"][0]
    results = _fire([lambda: book(client, v, sid) for _ in range(4)])
    assert sorted(r.status_code for r in results) == [201, 409, 409, 409]
    assert {r.json()["error"]["code"] for r in results if r.status_code == 409} == {"VEHICLE_ALREADY_BOOKED"}
    assert db.execute("SELECT count(*) n FROM appointments").fetchone()["n"] == 1
    client.close()
