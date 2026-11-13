"""Việc #42: dữ liệu đầu vào bất thường không được làm API trả 500 (lỗi hệ thống)."""
import pytest

from tests.conftest import book

BIG = 2**63  # vượt BIGINT của PostgreSQL (tối đa 2**63 - 1)
NUL = "a\x00b"  # PostgreSQL không cho ký tự NUL trong cột text


def _not_500(r):
    assert r.status_code < 500, (r.status_code, r.text)
    return r


@pytest.mark.parametrize("path", ["/appointments/{}", "/services/{}"])
def test_huge_id_in_path_is_404_not_500(customer1, path):
    r = _not_500(customer1.get(path.format(BIG)))
    assert r.status_code in (404, 422)


@pytest.mark.parametrize("action", ["cancel", "confirm"])
def test_huge_appointment_id_on_actions(customer1, staff, action):
    client = customer1 if action == "cancel" else staff
    _not_500(client.post(f"/appointments/{BIG}/{action}"))


def test_huge_ids_in_booking_body(customer1, vehicle_ids, open_slots):
    ok = dict(vehicle_id=vehicle_ids["c1"][0], service_id=1, slot_id=open_slots[0]["slot_id"])
    for field in ("vehicle_id", "service_id", "slot_id"):
        _not_500(customer1.post("/appointments", json={**ok, field: BIG}))


def test_huge_ids_in_reschedule_body(customer1, vehicle_ids, open_slots):
    a = book(customer1, vehicle_ids["c1"][0], open_slots[0]["slot_id"]).json()
    url = f"/appointments/{a['appointment_id']}/reschedule"
    _not_500(customer1.post(url, json={"slot_id": BIG}))
    _not_500(customer1.post(url, json={"slot_id": open_slots[1]["slot_id"], "service_id": BIG}))


def test_huge_slot_id_in_capacity_update(manager):
    _not_500(manager.patch(f"/slots/{BIG}", json={"max_capacity": 3}))


def test_nul_in_login_email_is_validation_error(anon):
    r = anon.post("/auth/login", json={"email": NUL, "password": "x"})
    assert (r.status_code, r.json()["error"]["code"]) == (422, "VALIDATION_ERROR")


def test_nul_character_in_text_fields(anon, customer1, staff, vehicle_ids, open_slots):
    _not_500(anon.post("/auth/login", json={"email": NUL, "password": "x"}))
    _not_500(anon.post("/auth/login", json={"email": "khach1@example.com", "password": NUL}))
    _not_500(customer1.post("/vehicles", json={"license_plate": "51A-999.99", "brand": NUL}))
    _not_500(customer1.post("/vehicles", json={"license_plate": "51A-999.98", "brand": "Kia", "model": NUL}))
    r = book(customer1, vehicle_ids["c1"][0], open_slots[0]["slot_id"], note=NUL)
    _not_500(r)
    appt = book(customer1, vehicle_ids["c1"][1], open_slots[1]["slot_id"]).json()
    _not_500(staff.post(f"/appointments/{appt['appointment_id']}/reject", json={"reason": NUL}))
