"""Việc #29: đặt lịch, kiểm tra trùng và năng lực (F03, F07, BR05-BR14)."""
from datetime import datetime, timedelta

import pytest

from app import rules
from tests.conftest import book


def slot_dt(slot):
    return rules.slot_start(
        datetime.fromisoformat(slot["slot_date"]).date(),
        datetime.strptime(slot["start_time"], "%H:%M:%S").time(),
    )


def slot_info(client, slot_id, around):
    r = client.get("/slots", params={"from": around, "to": around})
    return next(s for s in r.json() if s["slot_id"] == slot_id)


# ---------- Danh sách khung giờ ----------


def test_slots_have_8_per_day_and_no_sunday_or_lunch(customer1):
    today = rules.now_vn().date()
    r = customer1.get("/slots", params={"from": today.isoformat(), "to": (today + timedelta(days=13)).isoformat()})
    assert r.status_code == 200
    by_day = {}
    for s in r.json():
        by_day.setdefault(s["slot_date"], []).append(s["start_time"])
    for day, starts in by_day.items():
        assert datetime.fromisoformat(day).isoweekday() != 7, f"{day} là Chủ nhật"
        assert len(starts) == 8, day
        assert "12:00:00" not in starts
        assert starts == sorted(starts)


def test_slots_default_range_and_limits(customer1):
    assert customer1.get("/slots").status_code == 200
    r = customer1.get("/slots", params={"from": "2026-01-10", "to": "2026-01-01"})
    assert r.json()["error"]["code"] == "INVALID_DATE_RANGE"
    r = customer1.get("/slots", params={"from": "2026-01-01", "to": "2026-06-01"})
    assert r.json()["error"]["code"] == "DATE_RANGE_TOO_LARGE"
    assert customer1.get("/slots", params={"from": "khong-phai-ngay"}).status_code == 422


def test_slot_remaining_updates_after_booking(customer1, vehicle_ids, open_slots):
    s = open_slots[0]
    assert s["max_capacity"] == 3 and s["booked"] == 0 and s["remaining"] == 3
    assert book(customer1, vehicle_ids["c1"][0], s["slot_id"]).status_code == 201
    after = slot_info(customer1, s["slot_id"], s["slot_date"])
    assert (after["booked"], after["remaining"], after["bookable"]) == (1, 2, True)


# ---------- Đặt lịch thành công (BR14) ----------


def test_booking_success(customer1, vehicle_ids, open_slots):
    s = open_slots[0]
    r = book(customer1, vehicle_ids["c1"][0], s["slot_id"], service_id=2, note="  Kêu lạ ở bánh trước  ")
    assert r.status_code == 201
    assert r.headers["location"] == f"/appointments/{r.json()['appointment_id']}"
    a = r.json()
    assert a["status"] == "PENDING"  # BR14
    assert a["note"] == "Kêu lạ ở bánh trước"  # đã cắt khoảng trắng
    assert a["handled_by"] is None and a["reject_reason"] is None and a["change_count"] == 0
    assert a["customer"]["full_name"] == "Pham Minh Khach"
    assert a["service"]["service_id"] == 2 and a["service"]["reference_price"] == 550000
    assert a["slot"]["slot_id"] == s["slot_id"]
    assert a["created_at"].endswith("+07:00")  # BR25
    # Lịch sử trạng thái có đúng 1 dòng tạo mới
    assert len(a["history"]) == 1
    h = a["history"][0]
    assert (h["old_status"], h["new_status"]) == (None, "PENDING")
    assert h["changed_by"] == a["customer"]["user_id"]


def test_blank_note_becomes_null(customer1, vehicle_ids, open_slots):
    r = book(customer1, vehicle_ids["c1"][0], open_slots[0]["slot_id"], note="   ")
    assert r.status_code == 201 and r.json()["note"] is None


# ---------- Năng lực phục vụ (BR08, BR09) ----------


def test_slot_full_after_capacity_reached(customer1, customer2, customer3, vehicle_ids, open_slots):
    sid = open_slots[0]["slot_id"]
    assert book(customer1, vehicle_ids["c1"][0], sid).status_code == 201
    assert book(customer2, vehicle_ids["c2"][0], sid).status_code == 201
    assert book(customer3, vehicle_ids["c3"][0], sid).status_code == 201

    r = book(customer1, vehicle_ids["c1"][1], sid)  # xe thứ 4
    assert r.status_code == 409
    assert r.json()["error"]["code"] == "SLOT_FULL"

    full = slot_info(customer1, sid, open_slots[0]["slot_date"])
    assert (full["remaining"], full["bookable"], full["closed_reason"]) == (0, False, "FULL")


def test_failed_booking_leaves_nothing_behind(customer1, customer2, customer3, vehicle_ids, open_slots, db):
    """BR09: khi hết chỗ thì không lưu lịch hẹn và không ghi lịch sử."""
    sid = open_slots[0]["slot_id"]
    for c, k in ((customer1, "c1"), (customer2, "c2"), (customer3, "c3")):
        book(c, vehicle_ids[k][0], sid)
    assert book(customer1, vehicle_ids["c1"][1], sid).status_code == 409
    assert db.execute("SELECT count(*) n FROM appointments").fetchone()["n"] == 3
    assert db.execute("SELECT count(*) n FROM appointment_status_history").fetchone()["n"] == 3


def test_reject_frees_the_seat(customer1, customer2, customer3, staff, vehicle_ids, open_slots):
    """BR15: từ chối trả lại chỗ trống cho khung giờ."""
    sid = open_slots[0]["slot_id"]
    first = book(customer1, vehicle_ids["c1"][0], sid).json()["appointment_id"]
    book(customer2, vehicle_ids["c2"][0], sid)
    book(customer3, vehicle_ids["c3"][0], sid)
    assert book(customer1, vehicle_ids["c1"][1], sid).status_code == 409

    assert staff.post(f"/appointments/{first}/reject", json={"reason": "Hết phụ tùng"}).status_code == 200
    assert book(customer1, vehicle_ids["c1"][1], sid).status_code == 201


def test_completed_and_cancelled_do_not_occupy_seats(customer1, vehicle_ids, open_slots, db):
    """BR08: chỉ PENDING, CONFIRMED, IN_PROGRESS chiếm chỗ."""
    s = open_slots[0]
    a = book(customer1, vehicle_ids["c1"][0], s["slot_id"]).json()["appointment_id"]
    for status, expected_booked in (("IN_PROGRESS", 1), ("COMPLETED", 0), ("CANCELLED", 0)):
        db.execute("UPDATE appointments SET status = %s WHERE appointment_id = %s", (status, a))
        assert slot_info(customer1, s["slot_id"], s["slot_date"])["booked"] == expected_booked, status


# ---------- Chống trùng (BR11) ----------


def test_same_vehicle_same_slot_twice_is_rejected(customer1, vehicle_ids, open_slots):
    sid = open_slots[0]["slot_id"]
    assert book(customer1, vehicle_ids["c1"][0], sid).status_code == 201
    r = book(customer1, vehicle_ids["c1"][0], sid, service_id=3)
    assert r.status_code == 409
    assert r.json()["error"]["code"] == "VEHICLE_ALREADY_BOOKED"


def test_same_vehicle_can_rebook_after_rejection(customer1, staff, vehicle_ids, open_slots):
    sid = open_slots[0]["slot_id"]
    a = book(customer1, vehicle_ids["c1"][0], sid).json()["appointment_id"]
    staff.post(f"/appointments/{a}/reject", json={"reason": "Trùng lịch kỹ thuật"})
    assert book(customer1, vehicle_ids["c1"][0], sid).status_code == 201


def test_vehicle_unique_index_is_a_database_backstop(customer1, vehicle_ids, open_slots, db):
    """Dù code bỏ sót, CSDL vẫn chặn trùng (uq_vehicle_slot_active)."""
    sid = open_slots[0]["slot_id"]
    vid = vehicle_ids["c1"][0]
    book(customer1, vid, sid)
    with pytest.raises(Exception, match="uq_vehicle_slot_active"):
        db.execute(
            "INSERT INTO appointments (customer_id, vehicle_id, service_id, slot_id) "
            "SELECT customer_id, vehicle_id, service_id, slot_id FROM appointments LIMIT 1"
        )


def test_customer_limit_is_three_active_appointments(customer1, staff, vehicle_ids, open_slots):
    v = vehicle_ids["c1"][0]
    ids = [book(customer1, v, open_slots[i]["slot_id"]).json()["appointment_id"] for i in range(3)]
    r = book(customer1, v, open_slots[3]["slot_id"])
    assert r.status_code == 409
    assert r.json()["error"]["code"] == "BOOKING_LIMIT_REACHED"

    # Lịch bị từ chối không còn tính vào giới hạn
    staff.post(f"/appointments/{ids[0]}/reject", json={"reason": "x"})
    assert book(customer1, v, open_slots[3]["slot_id"]).status_code == 201


def test_limit_counts_confirmed_but_not_in_progress(customer1, vehicle_ids, open_slots, db):
    """BR11 chỉ nêu Chờ xác nhận và Đã xác nhận."""
    v = vehicle_ids["c1"][0]
    ids = [book(customer1, v, open_slots[i]["slot_id"]).json()["appointment_id"] for i in range(3)]
    db.execute("UPDATE appointments SET status = 'CONFIRMED' WHERE appointment_id = %s", (ids[0],))
    assert book(customer1, v, open_slots[3]["slot_id"]).status_code == 409
    db.execute("UPDATE appointments SET status = 'IN_PROGRESS' WHERE appointment_id = %s", (ids[0],))
    assert book(customer1, v, open_slots[3]["slot_id"]).status_code == 201


# ---------- Xe, dịch vụ, khung giờ hợp lệ (BR05, BR12) ----------


def test_cannot_book_with_someone_elses_vehicle(customer1, vehicle_ids, open_slots):
    r = book(customer1, vehicle_ids["c2"][0], open_slots[0]["slot_id"])
    assert r.status_code == 404
    assert r.json()["error"]["code"] == "VEHICLE_NOT_FOUND"


def test_inactive_and_missing_service(customer1, vehicle_ids, open_slots):
    v, s = vehicle_ids["c1"][0], open_slots[0]["slot_id"]
    assert book(customer1, v, s, service_id=8).json()["error"]["code"] == "SERVICE_INACTIVE"
    assert book(customer1, v, s, service_id=9999).json()["error"]["code"] == "SERVICE_NOT_FOUND"


def test_missing_slot(customer1, vehicle_ids):
    r = book(customer1, vehicle_ids["c1"][0], 999999)
    assert (r.status_code, r.json()["error"]["code"]) == (404, "SLOT_NOT_FOUND")


@pytest.mark.parametrize(
    "body",
    [
        {},
        {"vehicle_id": 1, "service_id": 1},
        {"vehicle_id": "abc", "service_id": 1, "slot_id": 1},
        {"vehicle_id": 1, "service_id": 1, "slot_id": 1, "note": "x" * 501},
    ],
)
def test_booking_validation_errors(customer1, body):
    r = customer1.post("/appointments", json=body)
    assert r.status_code == 422
    assert r.json()["error"]["code"] == "VALIDATION_ERROR"
    assert r.json()["error"]["details"]


@pytest.mark.parametrize(
    "date,start,end",
    [
        ("2099-01-04", "09:00", "10:00"),  # Chủ nhật
        ("2099-01-05", "12:00", "13:00"),  # nghỉ trưa
        ("2099-01-05", "07:00", "08:00"),  # trước giờ mở cửa
        ("2099-01-05", "17:00", "18:00"),  # sau giờ đóng cửa
    ],
)
def test_slot_outside_working_hours_rejected(customer1, vehicle_ids, db, monkeypatch, date, start, end):
    """BR07: dữ liệu khung giờ sai (do nhập tay) vẫn bị chặn ở tầng ứng dụng."""
    sid = db.execute(
        "INSERT INTO time_slots (slot_date, start_time, end_time) VALUES (%s, %s, %s) RETURNING slot_id",
        (date, start, end),
    ).fetchone()["slot_id"]
    monkeypatch.setattr(rules, "now_vn", lambda: datetime(2099, 1, 1, 9, 0, tzinfo=rules.VN_TZ))
    r = book(customer1, vehicle_ids["c1"][0], sid)
    assert (r.status_code, r.json()["error"]["code"]) == (422, "SLOT_NOT_WORKING_HOUR")


# ---------- Thời điểm đặt (BR10): giả lập đồng hồ để kiểm tra đúng biên ----------


def at(monkeypatch, moment):
    monkeypatch.setattr(rules, "now_vn", lambda: moment)


def test_lead_time_boundary_is_exactly_two_hours(customer1, vehicle_ids, open_slots, monkeypatch):
    s = open_slots[0]
    start = slot_dt(s)
    v = vehicle_ids["c1"][0]

    at(monkeypatch, start - timedelta(hours=2) + timedelta(seconds=1))  # còn 1:59:59
    r = book(customer1, v, s["slot_id"])
    assert (r.status_code, r.json()["error"]["code"]) == (422, "BOOKING_TOO_SOON")

    at(monkeypatch, start - timedelta(hours=2))  # đúng 2 giờ: được
    assert book(customer1, v, s["slot_id"]).status_code == 201


def test_cannot_book_a_slot_in_the_past(customer1, vehicle_ids, open_slots, monkeypatch):
    s = open_slots[0]
    at(monkeypatch, slot_dt(s) + timedelta(minutes=1))
    r = book(customer1, vehicle_ids["c1"][0], s["slot_id"])
    assert (r.status_code, r.json()["error"]["code"]) == (422, "SLOT_IN_PAST")


def test_advance_limit_boundary_is_exactly_14_days(customer1, vehicle_ids, open_slots, monkeypatch):
    s = open_slots[0]
    start = slot_dt(s)
    v = vehicle_ids["c1"][0]

    at(monkeypatch, start - timedelta(days=14) - timedelta(seconds=1))  # xa hơn 14 ngày 1 giây
    r = book(customer1, v, s["slot_id"])
    assert (r.status_code, r.json()["error"]["code"]) == (422, "BOOKING_TOO_FAR")

    at(monkeypatch, start - timedelta(days=14))  # đúng 14 ngày: được
    assert book(customer1, v, s["slot_id"]).status_code == 201


def test_slot_listing_reports_why_a_slot_is_closed(customer1, open_slots, monkeypatch):
    s = open_slots[0]
    start = slot_dt(s)
    for now, reason in (
        (start + timedelta(hours=1), "IN_PAST"),
        (start - timedelta(hours=1), "TOO_SOON"),
        (start - timedelta(days=20), "TOO_FAR"),
        (start - timedelta(days=3), None),
    ):
        at(monkeypatch, now)
        got = slot_info(customer1, s["slot_id"], s["slot_date"])
        assert got["closed_reason"] == reason, now
        assert got["bookable"] is (reason is None)


# ---------- Cấu hình năng lực (F07) ----------


def test_manager_changes_capacity(customer1, manager, vehicle_ids, open_slots):
    s = open_slots[0]
    r = manager.patch(f"/slots/{s['slot_id']}", json={"max_capacity": 1})
    assert r.status_code == 200 and r.json()["max_capacity"] == 1 and r.json()["remaining"] == 1
    assert book(customer1, vehicle_ids["c1"][0], s["slot_id"]).status_code == 201
    assert book(customer1, vehicle_ids["c1"][1], s["slot_id"]).json()["error"]["code"] == "SLOT_FULL"


def test_capacity_cannot_drop_below_booked(customer1, customer2, manager, vehicle_ids, open_slots):
    sid = open_slots[0]["slot_id"]
    book(customer1, vehicle_ids["c1"][0], sid)
    book(customer2, vehicle_ids["c2"][0], sid)
    r = manager.patch(f"/slots/{sid}", json={"max_capacity": 1})
    assert (r.status_code, r.json()["error"]["code"]) == (409, "CAPACITY_BELOW_BOOKED")
    assert manager.patch(f"/slots/{sid}", json={"max_capacity": 2}).status_code == 200


@pytest.mark.parametrize("value", [0, -1, 51, "ba"])
def test_capacity_validation(manager, open_slots, value):
    r = manager.patch(f"/slots/{open_slots[0]['slot_id']}", json={"max_capacity": value})
    assert r.status_code == 422


def test_capacity_missing_slot(manager):
    assert manager.patch("/slots/999999", json={"max_capacity": 3}).status_code == 404


# ---------- Xe của khách ----------


def test_add_vehicle(customer1):
    r = customer1.post("/vehicles", json={"license_plate": " 51g-999.99 ", "brand": "VinFast", "year": 2024})
    assert r.status_code == 201
    assert r.json()["license_plate"] == "51G-999.99"  # chuẩn hóa chữ hoa, bỏ khoảng trắng
    assert any(v["license_plate"] == "51G-999.99" for v in customer1.get("/vehicles").json())


def test_license_plate_is_globally_unique(customer1, customer2):
    """BR12: biển số duy nhất toàn hệ thống, kể cả khi khác chủ."""
    r = customer2.post("/vehicles", json={"license_plate": "51A-123.45", "brand": "Toyota"})
    assert (r.status_code, r.json()["error"]["code"]) == (409, "LICENSE_PLATE_EXISTS")


@pytest.mark.parametrize(
    "body",
    [
        {"license_plate": "ab", "brand": "X"},
        {"license_plate": "51A<script>", "brand": "X"},
        {"license_plate": "51A-123.45", "brand": ""},
        {"license_plate": "99Z-000.01", "brand": "X", "year": 1900},
    ],
)
def test_add_vehicle_validation(customer1, body):
    assert customer1.post("/vehicles", json=body).status_code == 422
