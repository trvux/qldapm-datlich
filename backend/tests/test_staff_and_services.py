"""Việc #26, #27, #38: quản lý dịch vụ (F01), danh sách lịch hẹn, bắt đầu và hoàn thành (F04).

Các endpoint này đã có trong đặc tả API (mục 6 của Viec22) và Frontend đã gọi sẵn.
"""
import pytest

from tests.conftest import book


def _book(client, vehicle_id, slot, service_id=1):
    r = book(client, vehicle_id, slot["slot_id"], service_id=service_id)
    assert r.status_code == 201, r.text
    return r.json()["appointment_id"]


def _slot_row(client, slot):
    rows = client.get("/slots", params={"from": slot["slot_date"], "to": slot["slot_date"]}).json()
    return next(s for s in rows if s["slot_id"] == slot["slot_id"])


def _post(client, aid, action):
    r = client.post(f"/appointments/{aid}/{action}")
    return r.status_code, (r.json().get("error", {}).get("code") if r.status_code >= 400 else None)


def _new_service(manager, **over):
    body = {"name": "Cân chỉnh thước lái 3D", "duration_minutes": 45, "reference_price": 450000, **over}
    r = manager.post("/services", json=body)
    assert r.status_code == 201, r.text
    return r.json()


# ---------- F01: thêm, sửa, ngừng dịch vụ ----------


def test_public_list_has_is_active_and_hides_inactive(anon):
    items = anon.get("/services").json()
    assert len(items) == 7
    assert all(s["is_active"] is True for s in items)
    assert 8 not in [s["service_id"] for s in items]


def test_include_inactive_is_manager_only_and_silent_for_others(anon, customer1, staff, manager):
    ids = lambda c: {s["service_id"] for s in c.get("/services", params={"include_inactive": "true"}).json()}  # noqa: E731
    assert 8 in ids(manager)
    # Người khác không bị báo lỗi nhưng không thấy dịch vụ ngừng (BR05).
    for client in (anon, customer1, staff):
        assert 8 not in ids(client)
    inactive = next(s for s in manager.get("/services", params={"include_inactive": "true"}).json() if s["service_id"] == 8)
    assert inactive["is_active"] is False


def test_only_manager_can_create_or_update(anon, customer1, staff):
    body = {"name": "Dịch vụ mới", "duration_minutes": 30, "reference_price": 100000}
    assert anon.post("/services", json=body).status_code == 401
    assert anon.patch("/services/1", json={"reference_price": 1}).status_code == 401
    for client in (customer1, staff):
        r = client.post("/services", json=body)
        assert (r.status_code, r.json()["error"]["code"]) == (403, "FORBIDDEN")
        r = client.patch("/services/1", json={"reference_price": 1})
        assert (r.status_code, r.json()["error"]["code"]) == (403, "FORBIDDEN")


def test_manager_creates_service_with_defaults(manager, anon):
    created = _new_service(manager, name="  Phủ gầm chống rỉ sét  ", description="   ")
    assert created["name"] == "Phủ gầm chống rỉ sét"  # cắt khoảng trắng hai đầu
    assert created["description"] is None  # mô tả toàn khoảng trắng thành null
    assert created["is_active"] is True
    assert created["reference_price"] == 450000
    assert anon.get(f"/services/{created['service_id']}").json()["name"] == "Phủ gầm chống rỉ sét"


def test_duplicate_name_is_409_even_against_inactive_service(manager):
    inactive_name = next(
        s["name"] for s in manager.get("/services", params={"include_inactive": "true"}).json() if s["service_id"] == 8
    )
    body = {"name": inactive_name, "duration_minutes": 30, "reference_price": 1}
    r = manager.post("/services", json=body)
    assert (r.status_code, r.json()["error"]["code"]) == (409, "SERVICE_NAME_EXISTS")
    one = _new_service(manager, name="Rửa động cơ")
    r = manager.post("/services", json={**body, "name": one["name"]})
    assert r.status_code == 409


@pytest.mark.parametrize(
    "bad",
    [
        {"name": "", "duration_minutes": 30, "reference_price": 1},
        {"name": "   ", "duration_minutes": 30, "reference_price": 1},
        {"name": "A" * 151, "duration_minutes": 30, "reference_price": 1},
        {"name": "B", "duration_minutes": 0, "reference_price": 1},  # BR04: thời lượng > 0
        {"name": "B", "duration_minutes": -5, "reference_price": 1},
        {"name": "B", "duration_minutes": 30, "reference_price": -1},  # BR04: giá >= 0
        {"name": "B", "duration_minutes": "ba muoi", "reference_price": 1},
        {"name": "B", "duration_minutes": 30},  # thiếu giá
        {"duration_minutes": 30, "reference_price": 1},  # thiếu tên
    ],
)
def test_create_validation_br04(manager, bad):
    r = manager.post("/services", json=bad)
    assert (r.status_code, r.json()["error"]["code"]) == (422, "VALIDATION_ERROR")


def test_br04_boundaries_are_accepted(manager):
    _new_service(manager, name="Giá 0 đồng", duration_minutes=1, reference_price=0)


def test_nul_byte_in_name_is_422_not_500(manager):
    r = manager.post("/services", json={"name": "a\u0000b", "duration_minutes": 30, "reference_price": 1})
    assert (r.status_code, r.json()["error"]["code"]) == (422, "VALIDATION_ERROR")


def test_patch_updates_only_given_fields(manager):
    s = _new_service(manager, description="mô tả cũ")
    sid = s["service_id"]
    r = manager.patch(f"/services/{sid}", json={"reference_price": 400000})
    assert r.status_code == 200
    out = r.json()
    assert out["reference_price"] == 400000
    assert (out["name"], out["description"], out["duration_minutes"]) == (s["name"], "mô tả cũ", 45)
    # Đặt description = null là xóa mô tả; không gửi thì giữ nguyên
    assert manager.patch(f"/services/{sid}", json={"description": None}).json()["description"] is None
    # Body rỗng: không đổi gì, trả bản hiện tại
    assert manager.patch(f"/services/{sid}", json={}).json()["reference_price"] == 400000


def test_patch_rejects_null_for_required_columns_and_bad_values(manager):
    sid = _new_service(manager)["service_id"]
    for body in ({"name": None}, {"duration_minutes": None}, {"reference_price": None}, {"is_active": None},
                 {"duration_minutes": 0}, {"reference_price": -1}, {"name": "  "}):
        r = manager.patch(f"/services/{sid}", json=body)
        assert (r.status_code, r.json()["error"]["code"]) == (422, "VALIDATION_ERROR"), body


def test_patch_unknown_and_duplicate(manager):
    r = manager.patch("/services/99999", json={"reference_price": 1})
    assert (r.status_code, r.json()["error"]["code"]) == (404, "SERVICE_NOT_FOUND")
    assert manager.patch("/services/99999", json={}).status_code == 404
    a, b = _new_service(manager, name="Dịch vụ A"), _new_service(manager, name="Dịch vụ B")
    r = manager.patch(f"/services/{b['service_id']}", json={"name": a["name"]})
    assert (r.status_code, r.json()["error"]["code"]) == (409, "SERVICE_NAME_EXISTS")
    # Giữ nguyên tên của chính nó không phải là trùng
    assert manager.patch(f"/services/{b['service_id']}", json={"name": b["name"]}).status_code == 200


def test_deactivate_then_reactivate_br05(manager, anon, customer1, vehicle_ids, open_slots):
    sid = _new_service(manager, name="Dịch vụ sẽ ngừng")["service_id"]
    aid = _book(customer1, vehicle_ids["c1"][0], open_slots[0], service_id=sid)

    assert manager.patch(f"/services/{sid}", json={"is_active": False}).json()["is_active"] is False
    # Ngừng: ẩn khỏi danh sách và chi tiết công khai, không đặt mới được
    assert sid not in [s["service_id"] for s in anon.get("/services").json()]
    assert anon.get(f"/services/{sid}").status_code == 404
    r = book(customer1, vehicle_ids["c1"][1], open_slots[1]["slot_id"], service_id=sid)
    assert (r.status_code, r.json()["error"]["code"]) == (422, "SERVICE_INACTIVE")
    # Lịch cũ giữ nguyên thông tin dịch vụ (BR05)
    old = customer1.get(f"/appointments/{aid}").json()
    assert old["service"]["service_id"] == sid and old["service"]["name"] == "Dịch vụ sẽ ngừng"

    assert manager.patch(f"/services/{sid}", json={"is_active": True}).json()["is_active"] is True
    assert anon.get(f"/services/{sid}").status_code == 200


def test_there_is_no_delete_for_services_br05(manager):
    assert manager.delete("/services/1").status_code == 405


# ---------- F04/F06: danh sách lịch hẹn ----------


def test_list_requires_login(anon):
    assert anon.get("/appointments").status_code == 401


def test_customer_sees_only_own_staff_and_manager_see_all(customer1, customer2, staff, manager, vehicle_ids, open_slots):
    a1 = _book(customer1, vehicle_ids["c1"][0], open_slots[0])
    a2 = _book(customer2, vehicle_ids["c2"][0], open_slots[1])

    assert [a["appointment_id"] for a in customer1.get("/appointments").json()] == [a1]  # BR23
    assert [a["appointment_id"] for a in customer2.get("/appointments").json()] == [a2]
    for client in (staff, manager):  # BR18
        assert [a["appointment_id"] for a in client.get("/appointments").json()] == [a2, a1]  # mới nhất trước


def test_list_returns_full_appointment_shape(staff, customer1, vehicle_ids, open_slots):
    aid = _book(customer1, vehicle_ids["c1"][0], open_slots[0])
    item = staff.get("/appointments").json()[0]
    assert item == customer1.get(f"/appointments/{aid}").json()  # cùng dạng và cùng nội dung với chi tiết


def test_filter_by_status(staff, customer1, vehicle_ids, open_slots):
    a1 = _book(customer1, vehicle_ids["c1"][0], open_slots[0])
    a2 = _book(customer1, vehicle_ids["c1"][1], open_slots[1])
    assert staff.post(f"/appointments/{a1}/confirm").status_code == 200

    ids = lambda **p: [a["appointment_id"] for a in staff.get("/appointments", params=p).json()]  # noqa: E731
    assert ids(status="CONFIRMED") == [a1]
    assert ids(status="PENDING") == [a2]
    assert ids(status="COMPLETED") == []  # không có thì trả mảng rỗng, không phải lỗi
    r = staff.get("/appointments", params={"status": "DONE"})
    assert (r.status_code, r.json()["error"]["code"]) == (422, "VALIDATION_ERROR")
    # Khách cũng lọc được, nhưng vẫn chỉ trong phạm vi lịch của mình
    assert [a["appointment_id"] for a in customer1.get("/appointments", params={"status": "PENDING"}).json()] == [a2]


def test_filter_by_date_and_range_uses_appointment_date(staff, customer1, vehicle_ids, open_slots):
    first = open_slots[0]
    second = next(s for s in open_slots if s["slot_date"] != first["slot_date"])
    a1 = _book(customer1, vehicle_ids["c1"][0], first)
    a2 = _book(customer1, vehicle_ids["c1"][1], second)
    d1, d2 = sorted([first["slot_date"], second["slot_date"]])
    by_date = {first["slot_date"]: a1, second["slot_date"]: a2}

    ids = lambda **p: sorted(a["appointment_id"] for a in staff.get("/appointments", params=p).json())  # noqa: E731
    assert ids(date=d1) == [by_date[d1]]
    assert ids(date=d2) == [by_date[d2]]
    assert ids(**{"from": d1, "to": d2}) == sorted([a1, a2])  # hai đầu đều được tính
    assert ids(**{"from": d2}) == [by_date[d2]]
    assert ids(to=d1) == [by_date[d1]]
    assert ids(date=d1, status="CONFIRMED") == []  # các bộ lọc kết hợp bằng AND


def test_invalid_date_range_and_format(staff):
    r = staff.get("/appointments", params={"from": "2026-12-10", "to": "2026-12-01"})
    assert (r.status_code, r.json()["error"]["code"]) == (422, "INVALID_DATE_RANGE")
    r = staff.get("/appointments", params={"date": "khong-phai-ngay"})
    assert (r.status_code, r.json()["error"]["code"]) == (422, "VALIDATION_ERROR")


# ---------- F04: bắt đầu xử lý và hoàn thành ----------


def test_full_lifecycle_and_slot_occupancy(staff, manager, customer1, vehicle_ids, open_slots):
    slot = open_slots[0]
    start_remaining = _slot_row(customer1, slot)["remaining"]
    aid = _book(customer1, vehicle_ids["c1"][0], slot)
    assert _slot_row(customer1, slot)["remaining"] == start_remaining - 1  # giữ chỗ từ lúc đặt (BR14)

    assert staff.post(f"/appointments/{aid}/confirm").status_code == 200
    r = staff.post(f"/appointments/{aid}/start")
    assert r.status_code == 200 and r.json()["status"] == "IN_PROGRESS"
    assert _slot_row(customer1, slot)["remaining"] == start_remaining - 1  # Đang thực hiện vẫn chiếm chỗ (BR08)

    r = manager.post(f"/appointments/{aid}/complete")  # Quản lý cũng được (BR03)
    assert r.status_code == 200 and r.json()["status"] == "COMPLETED"
    assert _slot_row(customer1, slot)["remaining"] == start_remaining  # Hoàn thành trả chỗ (BR08)

    out = customer1.get(f"/appointments/{aid}").json()
    assert [(h["old_status"], h["new_status"]) for h in out["history"]] == [
        (None, "PENDING"), ("PENDING", "CONFIRMED"), ("CONFIRMED", "IN_PROGRESS"), ("IN_PROGRESS", "COMPLETED"),
    ]
    # Ghi lại ai bấm từng bước; handled_by vẫn là người xác nhận (BR16)
    assert out["handled_by"] == out["history"][1]["changed_by"]
    assert out["history"][2]["changed_by"] != out["customer"]["user_id"]


def test_cannot_skip_or_reverse_br17(staff, customer1, vehicle_ids, open_slots):
    aid = _book(customer1, vehicle_ids["c1"][0], open_slots[0])
    bad = (409, "INVALID_STATUS_TRANSITION")

    # PENDING chưa được start hay complete (nhảy cóc)
    assert _post(staff, aid, "start") == bad
    assert _post(staff, aid, "complete") == bad
    assert _post(staff, aid, "confirm") == (200, None)
    # CONFIRMED chưa được complete, không confirm lại
    assert _post(staff, aid, "complete") == bad
    assert _post(staff, aid, "confirm") == bad
    assert _post(staff, aid, "start") == (200, None)
    # Đang thực hiện: không start lại, không quay lại xác nhận hay từ chối
    assert _post(staff, aid, "start") == bad
    assert _post(staff, aid, "confirm") == bad
    assert staff.post(f"/appointments/{aid}/reject", json={"reason": "x"}).status_code == 409
    assert _post(staff, aid, "complete") == (200, None)
    # Hoàn thành là trạng thái cuối, không đi ngược
    for action in ("start", "complete", "confirm"):
        assert _post(staff, aid, action) == bad


def test_start_complete_rejected_for_rejected_or_cancelled(staff, customer1, vehicle_ids, open_slots):
    rejected = _book(customer1, vehicle_ids["c1"][0], open_slots[0])
    assert staff.post(f"/appointments/{rejected}/reject", json={"reason": "Hết phụ tùng"}).status_code == 200
    cancelled = _book(customer1, vehicle_ids["c1"][1], open_slots[1])
    assert customer1.post(f"/appointments/{cancelled}/cancel").status_code == 200
    for aid in (rejected, cancelled):
        for action in ("start", "complete"):
            r = staff.post(f"/appointments/{aid}/{action}")
            assert (r.status_code, r.json()["error"]["code"]) == (409, "INVALID_STATUS_TRANSITION")


@pytest.mark.parametrize("action", ["start", "complete"])
def test_only_staff_and_manager_may_advance(anon, customer1, staff, vehicle_ids, open_slots, action):
    aid = _book(customer1, vehicle_ids["c1"][0], open_slots[0])
    assert staff.post(f"/appointments/{aid}/confirm").status_code == 200
    assert anon.post(f"/appointments/{aid}/{action}").status_code == 401
    r = customer1.post(f"/appointments/{aid}/{action}")  # kể cả lịch của chính mình
    assert (r.status_code, r.json()["error"]["code"]) == (403, "FORBIDDEN")
    assert customer1.get(f"/appointments/{aid}").json()["status"] == "CONFIRMED"  # không đổi


@pytest.mark.parametrize("action", ["start", "complete"])
def test_unknown_appointment_is_404(staff, action):
    r = staff.post(f"/appointments/99999/{action}")
    assert (r.status_code, r.json()["error"]["code"]) == (404, "APPOINTMENT_NOT_FOUND")


def test_in_progress_cannot_be_changed_by_customer_br19(staff, customer1, vehicle_ids, open_slots):
    aid = _book(customer1, vehicle_ids["c1"][0], open_slots[0])
    staff.post(f"/appointments/{aid}/confirm")
    staff.post(f"/appointments/{aid}/start")
    assert customer1.post(f"/appointments/{aid}/cancel").status_code == 409
    r = customer1.post(f"/appointments/{aid}/reschedule", json={"slot_id": open_slots[1]["slot_id"]})
    assert r.status_code == 409


def test_report_counts_completed(manager, staff, customer1, vehicle_ids, open_slots):
    slot = open_slots[0]
    aid = _book(customer1, vehicle_ids["c1"][0], slot)
    for step in ("confirm", "start", "complete"):
        assert staff.post(f"/appointments/{aid}/{step}").status_code == 200
    out = manager.get("/reports/appointments", params={"from": slot["slot_date"], "to": slot["slot_date"]}).json()
    assert {x["status"]: x["count"] for x in out["by_status"]}["COMPLETED"] == 1
    assert out["total"] == 1
