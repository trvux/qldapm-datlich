"""Việc #25: đăng nhập và phân quyền (F09, BR01-BR03)."""
from datetime import datetime, timedelta, timezone

import jwt
import pytest

from tests.conftest import PASSWORDS, book


def login(client, email, password):
    return client.post("/auth/login", json={"email": email, "password": password})


@pytest.mark.parametrize(
    "email,role",
    [
        ("khach1@example.com", "CUSTOMER"),
        ("staff1@xyz.vn", "STAFF"),
        ("manager@xyz.vn", "MANAGER"),
    ],
)
def test_login_success_per_role(anon, email, role):
    r = login(anon, email, PASSWORDS[email])
    assert r.status_code == 200
    body = r.json()
    assert body["token_type"] == "bearer"
    assert body["expires_in"] == 3600
    assert body["user"]["role"] == role
    assert "password" not in str(body).lower()


def test_login_email_is_case_and_space_insensitive(anon):
    assert login(anon, "  KHACH1@Example.com ", "Customer@123").status_code == 200


def test_wrong_password_and_unknown_email_are_indistinguishable(anon):
    wrong_pw = login(anon, "khach1@example.com", "sai-mat-khau")
    unknown = login(anon, "khong-ton-tai@example.com", "Customer@123")
    assert wrong_pw.status_code == unknown.status_code == 401
    assert wrong_pw.json() == unknown.json()
    assert wrong_pw.json()["error"]["code"] == "INVALID_CREDENTIALS"


def test_locked_account_cannot_login_but_only_after_correct_password(anon):
    """BR02: tài khoản khóa (is_active=false) không đăng nhập được."""
    ok_pw = login(anon, "locked@example.com", "Customer@123")
    assert ok_pw.status_code == 403
    assert ok_pw.json()["error"]["code"] == "ACCOUNT_DISABLED"
    # Sai mật khẩu thì không được biết tài khoản đang bị khóa
    assert login(anon, "locked@example.com", "sai").json()["error"]["code"] == "INVALID_CREDENTIALS"


def test_passwords_are_stored_hashed(db):
    """BR01: không lưu mật khẩu gốc."""
    rows = db.execute("SELECT password_hash FROM users").fetchall()
    assert rows and all(r["password_hash"].startswith("$argon2id$") for r in rows)


def test_login_validation(anon):
    assert anon.post("/auth/login", json={"email": "a@b.c"}).status_code == 422
    assert anon.post("/auth/login", json={}).status_code == 422
    assert anon.post("/auth/login", json={"email": "a@b.c", "password": "x" * 500}).status_code == 422


def test_me_returns_current_user(customer1):
    r = customer1.get("/auth/me")
    assert r.status_code == 200
    assert r.json()["email"] == "khach1@example.com"


def test_protected_endpoint_without_token_is_401(anon):
    r = anon.get("/slots")
    assert r.status_code == 401
    assert r.json()["error"]["code"] == "UNAUTHENTICATED"


@pytest.mark.parametrize("token", ["khong.phai.jwt", "abc"])
def test_garbage_token_is_401(anon, token):
    r = anon.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 401
    assert r.json()["error"]["code"] == "TOKEN_INVALID"


def _forge(secret, *, alg="HS256", exp_delta=timedelta(minutes=5), sub="4"):
    now = datetime.now(timezone.utc)
    return jwt.encode({"sub": sub, "iat": now, "exp": now + exp_delta}, secret, algorithm=alg)


def test_expired_token_is_rejected(anon):
    from app.config import get_settings

    tok = _forge(get_settings().jwt_secret, exp_delta=timedelta(minutes=-1))
    r = anon.get("/auth/me", headers={"Authorization": f"Bearer {tok}"})
    assert r.status_code == 401


def test_token_signed_with_other_secret_is_rejected(anon):
    tok = _forge("a-different-secret-" + "y" * 32)
    assert anon.get("/auth/me", headers={"Authorization": f"Bearer {tok}"}).status_code == 401


def test_token_with_alg_none_is_rejected(anon):
    now = datetime.now(timezone.utc)
    tok = jwt.encode({"sub": "4", "exp": now + timedelta(minutes=5)}, key=None, algorithm="none")
    assert anon.get("/auth/me", headers={"Authorization": f"Bearer {tok}"}).status_code == 401


def test_token_without_exp_is_rejected(anon):
    from app.config import get_settings

    tok = jwt.encode({"sub": "4"}, get_settings().jwt_secret, algorithm="HS256")
    assert anon.get("/auth/me", headers={"Authorization": f"Bearer {tok}"}).status_code == 401


def test_deactivating_account_takes_effect_immediately(customer1, db):
    """Token còn hạn nhưng tài khoản vừa bị khóa thì bị chặn ngay (BR02)."""
    assert customer1.get("/auth/me").status_code == 200
    db.execute("UPDATE users SET is_active = false WHERE email = 'khach1@example.com'")
    r = customer1.get("/auth/me")
    assert r.status_code == 403
    assert r.json()["error"]["code"] == "ACCOUNT_DISABLED"
    # fixture _clean trả is_active về lại ở test sau


# ---- Ma trận phân quyền BR03 ----


def test_services_are_public(anon):
    assert anon.get("/services").status_code == 200
    assert anon.get("/services/1").status_code == 200


def test_inactive_service_hidden_from_public(anon):
    """BR05: dịch vụ ngừng hoạt động không hiển thị cho khách."""
    names = [s["service_id"] for s in anon.get("/services").json()]
    assert 8 not in names
    assert anon.get("/services/8").status_code == 404


def test_only_customer_can_book(staff, manager, anon, vehicle_ids, open_slots):
    args = (vehicle_ids["c1"][0], open_slots[0]["slot_id"])
    assert book(anon, *args).status_code == 401
    assert book(staff, *args).status_code == 403
    assert book(manager, *args).status_code == 403
    assert book(staff, *args).json()["error"]["code"] == "FORBIDDEN"


def test_only_staff_or_manager_can_confirm(customer1, staff, manager, vehicle_ids, open_slots):
    a = book(customer1, vehicle_ids["c1"][0], open_slots[0]["slot_id"]).json()["appointment_id"]
    assert customer1.post(f"/appointments/{a}/confirm").status_code == 403
    assert customer1.post(f"/appointments/{a}/reject", json={"reason": "x"}).status_code == 403
    assert staff.post(f"/appointments/{a}/confirm").status_code == 200
    b = book(customer1, vehicle_ids["c1"][0], open_slots[1]["slot_id"]).json()["appointment_id"]
    assert manager.post(f"/appointments/{b}/confirm").status_code == 200


def test_only_manager_can_configure_capacity(customer1, staff, manager, open_slots):
    sid = open_slots[0]["slot_id"]
    assert customer1.patch(f"/slots/{sid}", json={"max_capacity": 5}).status_code == 403
    assert staff.patch(f"/slots/{sid}", json={"max_capacity": 5}).status_code == 403
    assert manager.patch(f"/slots/{sid}", json={"max_capacity": 5}).status_code == 200


def test_vehicles_are_customer_only(staff, manager, customer1):
    assert staff.get("/vehicles").status_code == 403
    assert manager.get("/vehicles").status_code == 403
    assert customer1.get("/vehicles").status_code == 200


def test_unknown_route_uses_error_format(anon):
    r = anon.get("/khong-co-route-nay")
    assert r.status_code == 404
    assert r.json()["error"]["code"] == "NOT_FOUND"
