from datetime import datetime, timedelta, timezone

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError

from app.config import get_settings

_ph = PasswordHasher()
# Hash giả để vẫn tốn thời gian băm khi email không tồn tại, tránh lộ email nào có tài khoản
# qua độ trễ phản hồi.
_DUMMY_HASH = _ph.hash("khong-phai-mat-khau-that")

ALGORITHM = "HS256"


def hash_password(password: str) -> str:
    return _ph.hash(password)


def verify_password(password: str, password_hash: str | None) -> bool:
    try:
        ok = _ph.verify(password_hash or _DUMMY_HASH, password)
    except (VerificationError, InvalidHashError):
        return False
    return ok and password_hash is not None


def create_access_token(user_id: int, role: str) -> tuple[str, int]:
    s = get_settings()
    now = datetime.now(timezone.utc)
    expires = timedelta(minutes=s.jwt_expire_minutes)
    payload = {"sub": str(user_id), "role": role, "iat": now, "exp": now + expires}
    return jwt.encode(payload, s.jwt_secret, algorithm=ALGORITHM), int(expires.total_seconds())


def decode_access_token(token: str) -> dict:
    """Ném jwt.PyJWTError nếu token sai, hết hạn hoặc thiếu claim bắt buộc."""
    return jwt.decode(
        token,
        get_settings().jwt_secret,
        algorithms=[ALGORITHM],  # chốt cứng thuật toán, không tin header của token
        options={"require": ["exp", "sub"]},
    )
