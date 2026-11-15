"""Việc #40: chạy 12 Test Case chính thức (TC01-TC12, Việc #30) trên API đang chạy và ghi kết quả thật.

Cách dùng (Backend đã chạy ở :8000, CSDL `datlich` có dữ liệu mẫu):

    cd backend
    uv run python scripts/run_test_cases.py            # in bảng Markdown
    uv run python scripts/run_test_cases.py --json out.json

Script chỉ tạo lịch hẹn mới rồi dọn lại bằng cách hủy/từ chối; không xóa dữ liệu mẫu.
Phần giao diện (ảnh chụp màn hình) chạy tay theo docs/sprint3/Viec40_KetQua_ChayTestCase.md.
"""
import argparse
import json
import sys
import threading
from datetime import date, timedelta

import httpx

BASE = "http://localhost:8000"
USERS = {
    "customer1": ("khach1@example.com", "Customer@123"),
    "customer2": ("khach2@example.com", "Customer@123"),
    "customer3": ("khach3@example.com", "Customer@123"),
    "staff": ("staff1@xyz.vn", "Staff@1234"),
}
RESULTS: list[dict] = []


def login(name: str) -> httpx.Client:
    email, password = USERS[name]
    c = httpx.Client(base_url=BASE, timeout=15)
    r = c.post("/auth/login", json={"email": email, "password": password})
    r.raise_for_status()
    c.headers["Authorization"] = f"Bearer {r.json()['access_token']}"
    return c


def record(tc: str, title: str, ok: bool | None, actual: str):
    """ok=None nghĩa là không chạy được qua API (SKIP), kèm lý do và test tự động thay thế."""
    status = "SKIP" if ok is None else ("PASS" if ok else "FAIL")
    RESULTS.append({"tc": tc, "title": title, "status": status, "actual": actual})


def code(r: httpx.Response) -> str:
    try:
        return r.json()["error"]["code"]
    except Exception:  # noqa: BLE001
        return ""


def future_slots(c: httpx.Client) -> list[dict]:
    start = date.today() + timedelta(days=2)
    rows = c.get("/slots", params={"from": start.isoformat(), "to": (start + timedelta(days=12)).isoformat()}).json()
    return [s for s in rows if s["bookable"] and s["remaining"] == s["max_capacity"]]


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--json")
    args = ap.parse_args()

    c1, c2, c3, staff = (login(n) for n in ("customer1", "customer2", "customer3", "staff"))
    v = {n: [x["vehicle_id"] for x in c.get("/vehicles").json()] for n, c in (("c1", c1), ("c2", c2), ("c3", c3))}
    slots = future_slots(c1)
    if len(slots) < 5:
        print("Không đủ khung giờ trống để chạy test", file=sys.stderr)
        return 2
    a, b, cc, d, e = (s["slot_id"] for s in slots[:5])

    def book(client, vid, sid, **extra):
        return client.post("/appointments", json={"vehicle_id": vid, "service_id": 1, "slot_id": sid, **extra})

    created: list[int] = []

    def keep(r):
        if r.status_code == 201:
            created.append(r.json()["appointment_id"])
        return r

    def remaining(sid):
        row = next(s for s in c1.get("/slots", params={"from": slots[0]["slot_date"], "to": slots[-1]["slot_date"]}).json() if s["slot_id"] == sid)
        return row["remaining"]

    # TC01 đặt lịch hợp lệ
    before = remaining(a)
    r = keep(book(c1, v["c1"][0], a, note="TC01"))
    after = remaining(a)
    record("TC01", "Đặt lịch hợp lệ", r.status_code == 201 and r.json()["status"] == "PENDING" and after == before - 1,
           f"HTTP {r.status_code}, status={r.json().get('status')}, chỗ trống {before} -> {after}")
    ap1 = r.json()["appointment_id"]

    # TC02 thiếu thông tin bắt buộc
    r = c1.post("/appointments", json={"vehicle_id": v["c1"][1], "slot_id": b})
    record("TC02", "Thiếu dịch vụ bắt buộc", r.status_code == 422 and code(r) == "VALIDATION_ERROR", f"HTTP {r.status_code} {code(r)}")

    # TC03 khung giờ đã qua
    past = c1.get("/slots", params={"from": (date.today() - timedelta(days=5)).isoformat(), "to": (date.today() - timedelta(days=1)).isoformat()}).json()
    if past:
        r = book(c1, v["c1"][1], past[0]["slot_id"])
        record("TC03", "Khung giờ đã qua", r.status_code == 422 and code(r) == "SLOT_IN_PAST", f"HTTP {r.status_code} {code(r)}")
    else:
        record("TC03", "Khung giờ đã qua", None,
               "CSDL chỉ có khung giờ từ ngày nạp dữ liệu trở đi nên không thử được qua API. "
               "Đã có test tự động: tests/test_booking.py::test_cannot_book_a_slot_in_the_past (SLOT_IN_PAST), "
               "và BOOKING_TOO_SOON ở cùng tệp")

    # TC04 khung giờ đã đủ 3 xe
    keep(book(c1, v["c1"][1], b))  # mỗi khách tối đa 3 lịch đang hiệu lực (BR11) nên chia đều giữa 3 khách
    keep(book(c2, v["c2"][0], b))
    keep(book(c3, v["c3"][0], b))
    r = book(c2, v["c2"][1], b)
    record("TC04", "Khung giờ đủ 3/3 xe", r.status_code == 409 and code(r) == "SLOT_FULL" and remaining(b) == 0, f"HTTP {r.status_code} {code(r)}, còn {remaining(b)} chỗ")

    # TC05 cùng xe, cùng khung giờ
    keep(book(c2, v["c2"][0], cc))
    r = book(c2, v["c2"][0], cc)
    record("TC05", "Trùng xe cùng khung giờ", r.status_code == 409 and code(r) == "VEHICLE_ALREADY_BOOKED", f"HTTP {r.status_code} {code(r)}")

    # TC06 hai khách tranh chỗ cuối (đặt đồng thời)
    keep(book(c3, v["c3"][0], d))
    keep(book(c3, v["c3"][1], d))
    outcomes: list[httpx.Response] = []

    def go(client, vid):
        outcomes.append(book(client, vid, d))

    threads = [threading.Thread(target=go, args=(c1, v["c1"][0])), threading.Thread(target=go, args=(c2, v["c2"][1]))]
    [t.start() for t in threads]
    [t.join() for t in threads]
    for o in outcomes:
        keep(o)
    codes = sorted(o.status_code for o in outcomes)
    record("TC06", "Hai khách tranh chỗ cuối", codes == [201, 409] and any(code(o) == "SLOT_FULL" for o in outcomes),
           f"HTTP {codes}, chỗ trống còn {remaining(d)}")

    # TC07 nhân viên xem và lọc danh sách
    allv = staff.get("/appointments").json()
    pend = staff.get("/appointments", params={"status": "PENDING"}).json()
    one_day = staff.get("/appointments", params={"date": slots[0]["slot_date"]}).json()
    ok = len(allv) >= len(created) and all(x["status"] == "PENDING" for x in pend) and all(x["slot"]["slot_date"] == slots[0]["slot_date"] for x in one_day)
    record("TC07", "Nhân viên xem và lọc danh sách", ok, f"tất cả={len(allv)}, PENDING={len(pend)}, theo ngày {slots[0]['slot_date']}={len(one_day)}")

    # TC08 nhân viên xác nhận
    r = staff.post(f"/appointments/{ap1}/confirm")
    record("TC08", "Nhân viên xác nhận lịch", r.status_code == 200 and r.json()["status"] == "CONFIRMED" and r.json().get("handled_by"),
           f"HTTP {r.status_code}, status={r.json().get('status')}, handled_by={r.json().get('handled_by')}")

    # TC09 từ chối kèm lý do, trả chỗ
    victim = created[1]
    slot_b_before = remaining(b)
    no_reason = staff.post(f"/appointments/{victim}/reject", json={})
    r = staff.post(f"/appointments/{victim}/reject", json={"reason": "Hết phụ tùng"})
    record("TC09", "Từ chối kèm lý do, trả chỗ", no_reason.status_code == 422 and r.status_code == 200 and r.json()["status"] == "REJECTED" and remaining(b) == slot_b_before + 1,
           f"thiếu lý do: HTTP {no_reason.status_code}; có lý do: HTTP {r.status_code}, status={r.json().get('status')}, chỗ {slot_b_before} -> {remaining(b)}")

    # TC10 thao tác sai trạng thái
    r1 = staff.post(f"/appointments/{ap1}/confirm")
    r2 = staff.post(f"/appointments/{created[2] if len(created) > 2 else victim}/complete")
    record("TC10", "Chặn thao tác sai trạng thái", r1.status_code == 409 and code(r1) == "INVALID_STATUS_TRANSITION" and r2.status_code == 409,
           f"confirm lần 2: HTTP {r1.status_code} {code(r1)}; complete khi chưa bắt đầu: HTTP {r2.status_code} {code(r2)}")

    # TC11 đổi ngày nạp lại đủ 8 khung giờ
    days = sorted({s["slot_date"] for s in c1.get("/slots", params={"from": slots[0]["slot_date"], "to": slots[-1]["slot_date"]}).json()})
    counts = [len(c1.get("/slots", params={"from": dd, "to": dd}).json()) for dd in days[:2]]
    record("TC11", "Đổi ngày nạp lại 8 khung giờ", all(n == 8 for n in counts), f"số khung giờ của {days[:2]} = {counts}")

    # TC12 lịch vừa tạo hiện ở cả khách và nhân viên
    mine = {x["appointment_id"] for x in c1.get("/appointments").json()}
    theirs = {x["appointment_id"] for x in staff.get("/appointments").json()}
    record("TC12", "Khách và nhân viên cùng thấy lịch vừa tạo", ap1 in mine and ap1 in theirs, f"#{ap1} có ở khách={ap1 in mine}, nhân viên={ap1 in theirs}")

    # dọn: hủy các lịch còn hiệu lực để trả chỗ (không xóa dữ liệu)
    for aid in created:
        info = staff.get(f"/appointments/{aid}").json()
        if info["status"] == "PENDING":
            staff.post(f"/appointments/{aid}/reject", json={"reason": "Dọn dữ liệu sau khi chạy test"})
        elif info["status"] == "CONFIRMED":
            owner = {cl.get("/auth/me").json()["user_id"]: cl for cl in (c1, c2, c3)}.get(info["customer"]["user_id"])
            if owner:
                owner.post(f"/appointments/{aid}/cancel")

    print("| TC | Nội dung | Kết quả | Thực tế |\n|---|---|---|---|")
    for x in RESULTS:
        print(f"| {x['tc']} | {x['title']} | {x['status']} | {x['actual']} |")
    passed = sum(x["status"] == "PASS" for x in RESULTS)
    skipped = sum(x["status"] == "SKIP" for x in RESULTS)
    print(f"\n{passed}/{len(RESULTS)} đạt, {skipped} bỏ qua (xem cột Thực tế), {len(RESULTS) - passed - skipped} lỗi")
    if args.json:
        with open(args.json, "w", encoding="utf-8") as f:
            json.dump({"date": date.today().isoformat(), "base": BASE, "results": RESULTS}, f, ensure_ascii=False, indent=2)
    return 0 if passed + skipped == len(RESULTS) else 1


if __name__ == "__main__":
    sys.exit(main())
