"""Việc #37: đổi và hủy lịch (F05, BR19-BR22)."""
from datetime import datetime, timedelta

import pytest

from app import rules
from tests.conftest import book
from tests.test_booking import at, slot_dt, slot_info
from tests.test_e2e_flow import _fire, _logins


def _book(client, vehicle_id, slot, service_id=1):
    r = book(client, vehicle_id, slot["slot_id"], service_id=service_id)
    assert r.status_code == 201, r.text
    return r.json()


def _cancel(client, appt_id):
    return client.post(f"/appointments/{appt_id}/cancel")


def _resched(client, appt_id, slot_id, **extra):
    return client.post(f"/appointments/{appt_id}/reschedule", json={"slot_id": slot_id, **extra})


def _code(r):
    return r.json()["error"]["code"]


def _extra_slot(db, day, start, end):
    """Khung giờ nhập tay (để thử ngoài giờ làm việc). Chạy lại nhiều lần vẫn được."""
    return db.execute(
        """INSERT INTO time_slots (slot_date, start_time, end_time) VALUES (%s, %s, %s)
           ON CONFLICT (slot_date, start_time) DO UPDATE SET end_time = EXCLUDED.end_time
           RETURNING slot_id""",
        (day, start, end),
    ).fetchone()["slot_id"]


# ======================================= HỦY LỊCH =======================================


def test_cancel_pending_returns_slot_and_logs_history(customer1, vehicle_ids, open_slots):
    s = open_slots[0]
    a = _book(customer1, vehicle_ids["c1"][0], s)
    assert slot_info(customer1, s["slot_id"], s["slot_date"])["booked"] == 1

    r = _cancel(customer1, a["appointment_id"])
    assert r.status_code == 200
    out = r.json()
    assert out["status"] == "CANCELLED"  # BR20
    assert [(h["old_status"], h["new_status"]) for h in out["history"]] == [
        (None, "PENDING"),
        ("PENDING", "CANCELLED"),
    ]
    assert out["history"][-1]["changed_by"] == out["customer"]["user_id"]
    after = slot_info(customer1, s["slot_id"], s["slot_date"])
    assert (after["booked"], after["remaining"]) == (0, 3)  # chỗ được trả lại ngay


def test_cancel_confirmed_is_allowed(customer1, staff, vehicle_ids, open_slots):
    a = _book(customer1, vehicle_ids["c1"][0], open_slots[0])
    assert staff.post(f"/appointments/{a['appointment_id']}/confirm").status_code == 200
    r = _cancel(customer1, a["appointment_id"])
    assert r.status_code == 200
    assert [h["new_status"] for h in r.json()["history"]] == ["PENDING", "CONFIRMED", "CANCELLED"]
    assert r.json()["history"][-1]["old_status"] == "CONFIRMED"


def test_cancel_frees_last_seat_for_another_customer(customer1, customer2, vehicle_ids, open_slots, db):
    s = open_slots[0]
    db.execute("UPDATE time_slots SET max_capacity = 1 WHERE slot_id = %s", (s["slot_id"],))
    a = _book(customer1, vehicle_ids["c1"][0], s)
    assert book(customer2, vehicle_ids["c2"][0], s["slot_id"]).status_code == 409  # hết chỗ
    assert _cancel(customer1, a["appointment_id"]).status_code == 200
    assert book(customer2, vehicle_ids["c2"][0], s["slot_id"]).status_code == 201


def test_cancel_frees_customer_booking_limit(customer1, vehicle_ids, open_slots):
    """BR11: lịch đã hủy không còn tính vào giới hạn 3 lịch hiệu lực."""
    ids = [_book(customer1, vehicle_ids["c1"][0], open_slots[i])["appointment_id"] for i in range(3)]
    assert book(customer1, vehicle_ids["c1"][0], open_slots[3]["slot_id"]).status_code == 409
    assert _cancel(customer1, ids[0]).status_code == 200
    assert book(customer1, vehicle_ids["c1"][0], open_slots[3]["slot_id"]).status_code == 201


def test_cancel_deadline_is_exactly_four_hours(customer1, vehicle_ids, open_slots, monkeypatch):
    """BR19: đúng 4 giờ vẫn hủy được, thiếu 1 giây thì không."""
    s = open_slots[0]
    a = _book(customer1, vehicle_ids["c1"][0], s)
    start = slot_dt(s)

    at(monkeypatch, start - timedelta(hours=4) + timedelta(seconds=1))  # còn 3:59:59
    r = _cancel(customer1, a["appointment_id"])
    assert (r.status_code, _code(r)) == (422, "CHANGE_TOO_LATE")
    assert customer1.get(f"/appointments/{a['appointment_id']}").json()["status"] == "PENDING"

    at(monkeypatch, start - timedelta(hours=4))  # đúng 4 giờ
    assert _cancel(customer1, a["appointment_id"]).status_code == 200


@pytest.mark.parametrize("status", ["IN_PROGRESS", "COMPLETED", "CANCELLED", "REJECTED"])
def test_cancel_not_allowed_in_other_statuses(customer1, vehicle_ids, open_slots, db, status):
    """BR19: chỉ Chờ xác nhận / Đã xác nhận mới hủy được."""
    a = _book(customer1, vehicle_ids["c1"][0], open_slots[0])
    db.execute("UPDATE appointments SET status = %s WHERE appointment_id = %s", (status, a["appointment_id"]))
    r = _cancel(customer1, a["appointment_id"])
    assert (r.status_code, _code(r)) == (409, "INVALID_STATUS_TRANSITION")
    assert db.execute(
        "SELECT status FROM appointments WHERE appointment_id = %s", (a["appointment_id"],)
    ).fetchone()["status"] == status


def test_cancel_twice_second_is_rejected(customer1, vehicle_ids, open_slots):
    a = _book(customer1, vehicle_ids["c1"][0], open_slots[0])
    assert _cancel(customer1, a["appointment_id"]).status_code == 200
    r = _cancel(customer1, a["appointment_id"])
    assert (r.status_code, _code(r)) == (409, "INVALID_STATUS_TRANSITION")


def test_cancel_permissions(anon, customer1, customer2, staff, manager, vehicle_ids, open_slots):
    a = _book(customer1, vehicle_ids["c1"][0], open_slots[0])
    aid = a["appointment_id"]
    assert _cancel(anon, aid).status_code == 401
    assert (_cancel(staff, aid).status_code, _code(_cancel(staff, aid))) == (403, "FORBIDDEN")
    assert _cancel(manager, aid).status_code == 403
    # Lịch của khách khác: 404, không lộ là có tồn tại (BR23)
    r = _cancel(customer2, aid)
    assert (r.status_code, _code(r)) == (404, "APPOINTMENT_NOT_FOUND")
    assert _cancel(customer1, 999999).status_code == 404
    assert customer1.get(f"/appointments/{aid}").json()["status"] == "PENDING"


# ======================================= ĐỔI LỊCH =======================================


def test_reschedule_moves_the_seat_and_logs_history(customer1, vehicle_ids, open_slots):
    old, new = open_slots[0], open_slots[1]
    a = _book(customer1, vehicle_ids["c1"][0], old)

    r = _resched(customer1, a["appointment_id"], new["slot_id"])
    assert r.status_code == 200, r.text
    out = r.json()
    assert out["slot"]["slot_id"] == new["slot_id"]
    assert (out["status"], out["change_count"]) == ("PENDING", 1)
    assert len(out["history"]) == 2
    h = out["history"][-1]
    assert (h["old_status"], h["new_status"]) == ("PENDING", "PENDING")
    assert h["note"].startswith("Đổi lịch lần 1: ")
    assert slot_info(customer1, old["slot_id"], old["slot_date"])["booked"] == 0  # trả chỗ cũ
    assert slot_info(customer1, new["slot_id"], new["slot_date"])["booked"] == 1  # giữ chỗ mới


def test_reschedule_confirmed_goes_back_to_pending(customer1, staff, vehicle_ids, open_slots):
    """BR22: lịch đã xác nhận mà đổi thì phải được nhân viên xác nhận lại."""
    a = _book(customer1, vehicle_ids["c1"][0], open_slots[0])
    assert staff.post(f"/appointments/{a['appointment_id']}/confirm").status_code == 200

    out = _resched(customer1, a["appointment_id"], open_slots[1]["slot_id"]).json()
    assert out["status"] == "PENDING"
    assert out["handled_by"] is None
    assert (out["history"][-1]["old_status"], out["history"][-1]["new_status"]) == ("CONFIRMED", "PENDING")
    # Nhân viên xác nhận lại bình thường
    assert staff.post(f"/appointments/{a['appointment_id']}/confirm").json()["status"] == "CONFIRMED"


def test_reschedule_can_change_service_too(customer1, vehicle_ids, open_slots):
    a = _book(customer1, vehicle_ids["c1"][0], open_slots[0], service_id=1)
    out = _resched(customer1, a["appointment_id"], open_slots[1]["slot_id"], service_id=3).json()
    assert out["service"]["service_id"] == 3
    assert "dịch vụ #1 -> #3" in out["history"][-1]["note"]
    # Không gửi service_id thì giữ nguyên
    out = _resched(customer1, a["appointment_id"], open_slots[2]["slot_id"]).json()
    assert out["service"]["service_id"] == 3


def test_reschedule_to_full_slot_keeps_old_appointment(customer1, customer2, vehicle_ids, open_slots, db):
    """BR21: khung mới hết chỗ thì lịch cũ giữ nguyên, không bị hủy trước."""
    old, full = open_slots[0], open_slots[1]
    db.execute("UPDATE time_slots SET max_capacity = 1 WHERE slot_id = %s", (full["slot_id"],))
    _book(customer2, vehicle_ids["c2"][0], full)
    a = _book(customer1, vehicle_ids["c1"][0], old)

    r = _resched(customer1, a["appointment_id"], full["slot_id"])
    assert (r.status_code, _code(r)) == (409, "SLOT_FULL")
    cur = customer1.get(f"/appointments/{a['appointment_id']}").json()
    assert (cur["slot"]["slot_id"], cur["status"], cur["change_count"]) == (old["slot_id"], "PENDING", 0)
    assert len(cur["history"]) == 1
    assert slot_info(customer1, old["slot_id"], old["slot_date"])["booked"] == 1  # vẫn giữ chỗ cũ


def test_failed_reschedule_does_not_consume_a_change(customer1, vehicle_ids, open_slots, db):
    a = _book(customer1, vehicle_ids["c1"][0], open_slots[0])
    for _ in range(3):  # 3 lần thất bại liên tiếp không được tính vào hạn 2 lần
        assert _resched(customer1, a["appointment_id"], 999999).status_code == 404
    assert _resched(customer1, a["appointment_id"], open_slots[1]["slot_id"]).status_code == 200
    assert _resched(customer1, a["appointment_id"], open_slots[2]["slot_id"]).status_code == 200


def test_reschedule_limit_is_two(customer1, vehicle_ids, open_slots, db):
    """BR22: lần đổi thứ 3 bị chặn, và change_count dừng ở 2."""
    a = _book(customer1, vehicle_ids["c1"][0], open_slots[0])
    aid = a["appointment_id"]
    assert _resched(customer1, aid, open_slots[1]["slot_id"]).json()["change_count"] == 1
    assert _resched(customer1, aid, open_slots[2]["slot_id"]).json()["change_count"] == 2
    r = _resched(customer1, aid, open_slots[3]["slot_id"])
    assert (r.status_code, _code(r)) == (409, "CHANGE_LIMIT_REACHED")
    cur = customer1.get(f"/appointments/{aid}").json()
    assert (cur["slot"]["slot_id"], cur["change_count"]) == (open_slots[2]["slot_id"], 2)
    # Hủy thì vẫn được (hạn 2 lần chỉ áp cho việc đổi)
    assert _cancel(customer1, aid).status_code == 200


def test_reschedule_to_same_slot_rejected(customer1, vehicle_ids, open_slots):
    a = _book(customer1, vehicle_ids["c1"][0], open_slots[0])
    r = _resched(customer1, a["appointment_id"], open_slots[0]["slot_id"])
    assert (r.status_code, _code(r)) == (422, "SAME_SLOT")


def test_reschedule_checks_old_slot_deadline_of_four_hours(customer1, vehicle_ids, open_slots, monkeypatch):
    """BR19 tính theo khung giờ HIỆN TẠI của lịch, không phải khung mới."""
    old, new = open_slots[0], open_slots[5]
    a = _book(customer1, vehicle_ids["c1"][0], old)
    start = slot_dt(old)

    at(monkeypatch, start - timedelta(hours=4) + timedelta(seconds=1))
    r = _resched(customer1, a["appointment_id"], new["slot_id"])
    assert (r.status_code, _code(r)) == (422, "CHANGE_TOO_LATE")

    at(monkeypatch, start - timedelta(hours=4))
    assert _resched(customer1, a["appointment_id"], new["slot_id"]).status_code == 200


@pytest.mark.parametrize("status", ["IN_PROGRESS", "COMPLETED", "CANCELLED", "REJECTED"])
def test_reschedule_not_allowed_in_other_statuses(customer1, vehicle_ids, open_slots, db, status):
    a = _book(customer1, vehicle_ids["c1"][0], open_slots[0])
    db.execute("UPDATE appointments SET status = %s WHERE appointment_id = %s", (status, a["appointment_id"]))
    r = _resched(customer1, a["appointment_id"], open_slots[1]["slot_id"])
    assert (r.status_code, _code(r)) == (409, "INVALID_STATUS_TRANSITION")


def test_reschedule_new_slot_must_satisfy_booking_rules(customer1, vehicle_ids, open_slots, db, monkeypatch):
    """BR21: khung mới phải qua BR07-BR10, giống lúc đặt mới."""
    old = open_slots[-1]  # lịch cũ ở xa, để dù lùi/tiến đồng hồ vẫn còn > 4 giờ (qua BR19)
    a = _book(customer1, vehicle_ids["c1"][0], old)
    aid = a["appointment_id"]
    # Khung nhập tay trong cửa sổ 14 ngày để BR07 (giờ làm việc) là lý do duy nhất bị chặn.
    # Phải xóa sau test vì test_slots_have_8_per_day_and_no_sunday_or_lunch đếm khung giờ.
    today = rules.now_vn().date()
    sun = today + timedelta(days=3 + (6 - (today + timedelta(days=3)).weekday()) % 7)
    assert sun.isoweekday() == 7 and (sun - today).days <= 9
    extra = [
        _extra_slot(db, sun, "09:00", "10:00"),  # Chủ nhật
        _extra_slot(db, today + timedelta(days=3), "12:00", "13:00"),  # giờ nghỉ trưa
    ]
    try:
        for sid in extra:
            r = _resched(customer1, aid, sid)
            assert (r.status_code, _code(r)) == (422, "SLOT_NOT_WORKING_HOUR"), sid
    finally:
        db.execute("DELETE FROM time_slots WHERE slot_id = ANY(%s)", (extra,))

    # BR10: khung mới quá gần (dưới 2 giờ) hoặc quá xa (trên 14 ngày) hoặc đã qua
    target = open_slots[0]
    start = slot_dt(target)
    at(monkeypatch, start - timedelta(hours=2) + timedelta(seconds=1))
    r = _resched(customer1, aid, target["slot_id"])
    assert (r.status_code, _code(r)) == (422, "BOOKING_TOO_SOON")
    at(monkeypatch, start - timedelta(days=14) - timedelta(seconds=1))
    r = _resched(customer1, aid, target["slot_id"])
    assert (r.status_code, _code(r)) == (422, "BOOKING_TOO_FAR")
    at(monkeypatch, start + timedelta(minutes=1))
    r = _resched(customer1, aid, target["slot_id"])
    assert (r.status_code, _code(r)) == (422, "SLOT_IN_PAST")

    # Không lần nào trong số này được làm hỏng lịch cũ
    cur = customer1.get(f"/appointments/{aid}").json()
    assert (cur["slot"]["slot_id"], cur["change_count"]) == (old["slot_id"], 0)


def test_reschedule_service_rules(customer1, vehicle_ids, open_slots):
    a = _book(customer1, vehicle_ids["c1"][0], open_slots[0])
    aid = a["appointment_id"]
    r = _resched(customer1, aid, open_slots[1]["slot_id"], service_id=8)  # dịch vụ đã ngừng (BR05)
    assert (r.status_code, _code(r)) == (422, "SERVICE_INACTIVE")
    r = _resched(customer1, aid, open_slots[1]["slot_id"], service_id=999)
    assert (r.status_code, _code(r)) == (404, "SERVICE_NOT_FOUND")
    assert customer1.get(f"/appointments/{aid}").json()["change_count"] == 0


def test_reschedule_vehicle_already_booked_in_new_slot(customer1, vehicle_ids, open_slots):
    """BR11: cùng một xe không có 2 lịch hiệu lực trong cùng khung giờ."""
    v = vehicle_ids["c1"][0]
    a = _book(customer1, v, open_slots[0])
    _book(customer1, v, open_slots[1])
    r = _resched(customer1, a["appointment_id"], open_slots[1]["slot_id"])
    assert (r.status_code, _code(r)) == (409, "VEHICLE_ALREADY_BOOKED")


def test_reschedule_works_even_at_booking_limit(customer1, vehicle_ids, open_slots):
    """Đổi lịch không làm tăng số lịch hiệu lực nên không bị giới hạn 3 lịch (BR11) chặn."""
    ids = [_book(customer1, vehicle_ids["c1"][0], open_slots[i])["appointment_id"] for i in range(3)]
    assert _resched(customer1, ids[0], open_slots[5]["slot_id"]).status_code == 200


def test_reschedule_permissions_and_validation(anon, customer1, customer2, staff, manager, vehicle_ids, open_slots):
    a = _book(customer1, vehicle_ids["c1"][0], open_slots[0])
    aid, sid = a["appointment_id"], open_slots[1]["slot_id"]
    assert _resched(anon, aid, sid).status_code == 401
    assert _resched(staff, aid, sid).status_code == 403
    assert _resched(manager, aid, sid).status_code == 403
    r = _resched(customer2, aid, sid)
    assert (r.status_code, _code(r)) == (404, "APPOINTMENT_NOT_FOUND")
    assert _resched(customer1, 999999, sid).status_code == 404
    r = customer1.post(f"/appointments/{aid}/reschedule", json={})
    assert (r.status_code, _code(r)) == (422, "VALIDATION_ERROR")
    assert customer1.get(f"/appointments/{aid}").json()["change_count"] == 0


# ================================ ĐỒNG THỜI (BR13, deadlock) ================================


def test_concurrent_double_cancel_only_one_succeeds(base_url, vehicle_ids, open_slots, db):
    client = _logins(base_url)["c1"]
    a = _book(client, vehicle_ids["c1"][0], open_slots[0])
    results = _fire([lambda: _cancel(client, a["appointment_id"]) for _ in range(4)])
    assert sorted(r.status_code for r in results) == [200, 409, 409, 409]
    assert db.execute(
        "SELECT count(*) n FROM appointment_status_history WHERE appointment_id = %s AND new_status = 'CANCELLED'",
        (a["appointment_id"],),
    ).fetchone()["n"] == 1
    client.close()


def test_concurrent_reschedules_into_last_seat(base_url, vehicle_ids, open_slots, db):
    """3 khách cùng đổi vào khung giờ chỉ còn 1 chỗ: đúng 1 người được, 2 người còn giữ lịch cũ."""
    target = open_slots[9]
    db.execute("UPDATE time_slots SET max_capacity = 1 WHERE slot_id = %s", (target["slot_id"],))
    clients = _logins(base_url)
    appts = {
        k: _book(clients[k], vehicle_ids[k][0], open_slots[i])
        for i, k in enumerate(("c1", "c2", "c3"))
    }
    results = _fire(
        [lambda k=k: _resched(clients[k], appts[k]["appointment_id"], target["slot_id"]) for k in appts]
    )
    assert sorted(r.status_code for r in results) == [200, 409, 409], [r.text for r in results]
    assert {_code(r) for r in results if r.status_code == 409} == {"SLOT_FULL"}
    assert db.execute(
        "SELECT count(*) n FROM appointments WHERE slot_id = %s AND status = 'PENDING'", (target["slot_id"],)
    ).fetchone()["n"] == 1
    # Mỗi khách vẫn còn đúng 1 lịch (không ai mất chỗ)
    assert db.execute(
        "SELECT count(*) n FROM appointments WHERE status = 'PENDING'"
    ).fetchone()["n"] == 3
    for c in clients.values():
        c.close()


def test_concurrent_cancel_and_reschedule_never_deadlock(base_url, vehicle_ids, open_slots, db):
    """Hủy, đổi, đặt mới của cùng một khách và khung giờ chạm nhau cùng lúc: không treo, không sai số liệu."""
    client = _logins(base_url)["c1"]
    v = vehicle_ids["c1"]
    a = _book(client, v[0], open_slots[0])
    b = _book(client, v[1], open_slots[1])
    results = _fire(
        [
            lambda: _resched(client, a["appointment_id"], open_slots[1]["slot_id"]),
            lambda: _cancel(client, b["appointment_id"]),
            lambda: _resched(client, b["appointment_id"], open_slots[0]["slot_id"]),
            lambda: book(client, v[0], open_slots[2]["slot_id"]),
        ]
    )
    assert all(r.status_code in (200, 201, 409) for r in results), [r.text for r in results]
    # Dù thứ tự thực thi thế nào, số chỗ đang giữ trong mỗi khung phải khớp số lịch thật
    for s in open_slots[:3]:
        info = slot_info(client, s["slot_id"], s["slot_date"])
        real = db.execute(
            "SELECT count(*) n FROM appointments WHERE slot_id = %s AND status = ANY(%s)",
            (s["slot_id"], rules.SLOT_OCCUPYING),
        ).fetchone()["n"]
        assert info["booked"] == real <= info["max_capacity"]
    client.close()
