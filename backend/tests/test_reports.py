"""Việc #39: báo cáo thống kê (F08, BR24)."""
from datetime import timedelta

import pytest

from app import rules
from tests.conftest import book

STATUSES = ["PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "REJECTED"]


def _report(client, **params):
    return client.get("/reports/appointments", params=params)


def _two_days(open_slots):
    """Hai khung giờ khác ngày."""
    first = open_slots[0]
    second = next(s for s in open_slots if s["slot_date"] != first["slot_date"])
    return first, second


def _book(client, vehicle_id, slot, service_id=1):
    r = book(client, vehicle_id, slot["slot_id"], service_id=service_id)
    assert r.status_code == 201, r.text
    return r.json()["appointment_id"]


def _rng(*slots):
    ds = sorted(s["slot_date"] for s in slots)
    return {"from": ds[0], "to": ds[-1]}


# ---------- Phân quyền (BR24) ----------


def test_report_is_manager_only(anon, customer1, staff, manager):
    assert _report(anon).status_code == 401
    r = _report(customer1)
    assert (r.status_code, r.json()["error"]["code"]) == (403, "FORBIDDEN")
    assert _report(staff).status_code == 403
    assert _report(manager).status_code == 200


# ---------- Nội dung ----------


def test_empty_range_returns_zeros_not_missing_keys(manager, open_slots):
    last = open_slots[-1]["slot_date"]
    r = _report(manager, **{"from": last, "to": last})
    assert r.status_code == 200
    out = r.json()
    assert (out["from"], out["to"], out["total"], out["by_date"]) == (last, last, 0, [])
    assert [x["status"] for x in out["by_status"]] == STATUSES  # đủ 6 trạng thái, đúng thứ tự
    assert all(x["count"] == 0 for x in out["by_status"])
    # 8 dịch vụ trong dữ liệu mẫu, 1 đã ngừng => 7 dịch vụ hoạt động hiện đủ, đếm 0
    assert len(out["by_service"]) == 7
    assert all(x["count"] == 0 for x in out["by_service"])


def test_counts_by_date_status_and_service(manager, customer1, customer2, customer3, staff, vehicle_ids, open_slots, db):
    a, b = _two_days(open_slots)
    id1 = _book(customer1, vehicle_ids["c1"][0], a, service_id=1)
    id2 = _book(customer2, vehicle_ids["c2"][0], a, service_id=1)
    _book(customer3, vehicle_ids["c3"][0], b, service_id=2)  # giữ nguyên PENDING
    assert staff.post(f"/appointments/{id1}/confirm").status_code == 200
    assert customer2.post(f"/appointments/{id2}/cancel").status_code == 200

    out = _report(manager, **_rng(a, b)).json()
    assert out["total"] == 3
    assert out["by_date"] == sorted(
        [{"date": a["slot_date"], "count": 2}, {"date": b["slot_date"], "count": 1}],
        key=lambda x: x["date"],
    )
    got = {x["status"]: x["count"] for x in out["by_status"]}
    assert got == {"PENDING": 1, "CONFIRMED": 1, "IN_PROGRESS": 0, "COMPLETED": 0, "CANCELLED": 1, "REJECTED": 0}
    svc = {x["service_id"]: x["count"] for x in out["by_service"]}
    assert svc[1] == 2 and svc[2] == 1 and sum(svc.values()) == 3
    assert out["by_service"][0]["service_id"] == 1  # giảm dần theo số lịch


def test_three_breakdowns_always_sum_to_total(manager, customer1, customer2, vehicle_ids, open_slots, db):
    a, b = _two_days(open_slots)
    _book(customer1, vehicle_ids["c1"][0], a, service_id=3)
    _book(customer2, vehicle_ids["c2"][0], b, service_id=4)
    db.execute("UPDATE appointments SET status = 'COMPLETED' WHERE service_id = 4")
    out = _report(manager, **_rng(a, b)).json()
    assert out["total"] == sum(x["count"] for x in out["by_date"])
    assert out["total"] == sum(x["count"] for x in out["by_status"])
    assert out["total"] == sum(x["count"] for x in out["by_service"]) == 2


def test_date_filter_is_by_appointment_date_inclusive(manager, customer1, customer2, vehicle_ids, open_slots):
    """'Ngày hẹn' là ngày của khung giờ, và cả hai đầu from/to đều được tính."""
    a, b = _two_days(open_slots)
    _book(customer1, vehicle_ids["c1"][0], a)
    _book(customer2, vehicle_ids["c2"][0], b)
    only_a = _report(manager, **{"from": a["slot_date"], "to": a["slot_date"]}).json()
    assert only_a["total"] == 1 and only_a["by_date"] == [{"date": a["slot_date"], "count": 1}]
    only_b = _report(manager, **{"from": b["slot_date"], "to": b["slot_date"]}).json()
    assert only_b["total"] == 1 and only_b["by_date"][0]["date"] == b["slot_date"]
    assert _report(manager, **_rng(a, b)).json()["total"] == 2


def test_inactive_service_listed_only_when_it_has_appointments(manager, customer1, vehicle_ids, open_slots, db):
    """BR05: dịch vụ đã ngừng vẫn hiện nếu còn lịch cũ trong khoảng xem, nếu không thì ẩn."""
    s = open_slots[0]
    rng = {"from": s["slot_date"], "to": s["slot_date"]}
    assert 8 not in {x["service_id"] for x in _report(manager, **rng).json()["by_service"]}
    aid = _book(customer1, vehicle_ids["c1"][0], s)
    db.execute("UPDATE appointments SET service_id = 8 WHERE appointment_id = %s", (aid,))
    by_service = {x["service_id"]: x for x in _report(manager, **rng).json()["by_service"]}
    assert by_service[8]["count"] == 1


def test_report_follows_cancel_and_reschedule(manager, customer1, vehicle_ids, open_slots):
    a, b = _two_days(open_slots)
    aid = _book(customer1, vehicle_ids["c1"][0], a)
    rng = _rng(a, b)
    assert {x["date"]: x["count"] for x in _report(manager, **rng).json()["by_date"]} == {a["slot_date"]: 1}

    assert customer1.post(f"/appointments/{aid}/reschedule", json={"slot_id": b["slot_id"]}).status_code == 200
    assert {x["date"]: x["count"] for x in _report(manager, **rng).json()["by_date"]} == {b["slot_date"]: 1}

    assert customer1.post(f"/appointments/{aid}/cancel").status_code == 200
    out = _report(manager, **rng).json()
    assert {x["status"]: x["count"] for x in out["by_status"]}["CANCELLED"] == 1
    assert out["total"] == 1  # lịch hủy vẫn nằm trong thống kê (đếm theo trạng thái)


# ---------- Khoảng ngày ----------


def test_default_range_is_start_of_month_to_today(manager):
    today = rules.now_vn().date()
    out = _report(manager).json()
    assert (out["from"], out["to"]) == (today.replace(day=1).isoformat(), today.isoformat())


def test_only_from_given_uses_today_as_end(manager):
    today = rules.now_vn().date()
    start = today - timedelta(days=10)
    out = _report(manager, **{"from": start.isoformat()}).json()
    assert (out["from"], out["to"]) == (start.isoformat(), today.isoformat())


def test_invalid_ranges(manager):
    r = _report(manager, **{"from": "2026-05-10", "to": "2026-05-01"})
    assert (r.status_code, r.json()["error"]["code"]) == (422, "INVALID_DATE_RANGE")
    r = _report(manager, **{"from": "2025-01-01", "to": "2026-06-01"})
    assert (r.status_code, r.json()["error"]["code"]) == (422, "DATE_RANGE_TOO_LARGE")
    r = _report(manager, **{"from": "khong-phai-ngay"})
    assert (r.status_code, r.json()["error"]["code"]) == (422, "VALIDATION_ERROR")


def test_range_limit_is_exactly_366_days(manager):
    ok = _report(manager, **{"from": "2025-01-01", "to": "2026-01-02"})  # 366 ngày chênh lệch
    assert ok.status_code == 200
    bad = _report(manager, **{"from": "2025-01-01", "to": "2026-01-03"})  # 367
    assert bad.status_code == 422


@pytest.mark.parametrize("method", ["post", "patch", "delete"])
def test_report_is_read_only(manager, method):
    assert getattr(manager, method)("/reports/appointments").status_code == 405
