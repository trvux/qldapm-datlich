import psycopg
from fastapi import APIRouter, Depends

from app.db import get_conn
from app.deps import CurrentUser, get_current_user
from app.errors import AppError
from app.schemas import LoginRequest, TokenOut, UserOut
from app.security import create_access_token, verify_password

router = APIRouter(prefix="/auth", tags=["Auth (F09)"])


@router.post("/login", response_model=TokenOut)
def login(body: LoginRequest, conn: psycopg.Connection = Depends(get_conn)):
    row = conn.execute(
        """SELECT u.user_id, u.full_name, u.email, u.password_hash, u.is_active, r.role_name
           FROM users u JOIN roles r ON r.role_id = u.role_id
           WHERE lower(u.email) = %s""",
        (body.email,),
    ).fetchone()

    # Email không tồn tại và sai mật khẩu trả CÙNG một lỗi (và cùng tốn thời gian băm),
    # để người ngoài không dò được email nào đã có tài khoản.
    if not verify_password(body.password, row["password_hash"] if row else None):
        raise AppError(401, "INVALID_CREDENTIALS", "Email hoặc mật khẩu không đúng.")
    # BR02: chỉ báo "bị khóa" sau khi đã đúng mật khẩu
    if not row["is_active"]:
        raise AppError(403, "ACCOUNT_DISABLED", "Tài khoản đã bị khóa.")

    token, expires_in = create_access_token(row["user_id"], row["role_name"])
    return TokenOut(
        access_token=token,
        expires_in=expires_in,
        user=UserOut(
            user_id=row["user_id"],
            full_name=row["full_name"],
            email=row["email"],
            role=row["role_name"],
        ),
    )


@router.get("/me", response_model=UserOut)
def me(user: CurrentUser = Depends(get_current_user)):
    return UserOut(
        user_id=user.user_id, full_name=user.full_name, email=user.email, role=user.role
    )
