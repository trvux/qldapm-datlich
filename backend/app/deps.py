from dataclasses import dataclass

import jwt
import psycopg
from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.db import get_conn
from app.errors import AppError
from app.security import decode_access_token

CUSTOMER = "CUSTOMER"
STAFF = "STAFF"
MANAGER = "MANAGER"

_bearer = HTTPBearer(auto_error=False)


@dataclass(frozen=True)
class CurrentUser:
    user_id: int
    full_name: str
    email: str
    role: str


def get_current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(_bearer),
    conn: psycopg.Connection = Depends(get_conn),
) -> CurrentUser:
    if creds is None:
        raise AppError(401, "UNAUTHENTICATED", "Bạn cần đăng nhập.")
    try:
        claims = decode_access_token(creds.credentials)
        user_id = int(claims["sub"])
    except (jwt.PyJWTError, ValueError):
        raise AppError(401, "TOKEN_INVALID", "Phiên đăng nhập không hợp lệ hoặc đã hết hạn.")

    # Luôn đọc lại DB thay vì tin role trong token: khóa tài khoản (BR02) hoặc đổi vai trò
    # có hiệu lực ngay, không phải đợi token hết hạn.
    row = conn.execute(
        """SELECT u.user_id, u.full_name, u.email, u.is_active, r.role_name
           FROM users u JOIN roles r ON r.role_id = u.role_id
           WHERE u.user_id = %s""",
        (user_id,),
    ).fetchone()
    if row is None:
        raise AppError(401, "TOKEN_INVALID", "Phiên đăng nhập không hợp lệ hoặc đã hết hạn.")
    if not row["is_active"]:
        raise AppError(403, "ACCOUNT_DISABLED", "Tài khoản đã bị khóa.")
    return CurrentUser(row["user_id"], row["full_name"], row["email"], row["role_name"])


def require_roles(*roles: str):
    """Dependency kiểm tra ma trận phân quyền BR03: sai vai trò trả 403."""

    def checker(user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        if user.role not in roles:
            raise AppError(403, "FORBIDDEN", "Bạn không có quyền thực hiện thao tác này.")
        return user

    return checker
