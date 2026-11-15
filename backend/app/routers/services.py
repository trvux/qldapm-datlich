"""Dịch vụ: tra cứu (F02) và quản lý thêm, sửa, ngừng (F01, Việc #26).

BR03: tra cứu công khai; thêm, sửa, ngừng chỉ Quản lý.
BR05: không có DELETE. Muốn bỏ dịch vụ thì đặt is_active = false.
"""
import psycopg
from fastapi import APIRouter, Depends, Query
from psycopg.errors import UniqueViolation

from app.db import get_conn
from app.deps import MANAGER, CurrentUser, get_optional_user, require_roles
from app.errors import AppError
from app.schemas import ServiceCreate, ServiceOut, ServiceUpdate

router = APIRouter(prefix="/services", tags=["Dịch vụ (F01, F02)"])

_COLS = (
    "service_id, name, description, duration_minutes, reference_price::int AS reference_price, is_active"
)


def _name_exists() -> AppError:
    return AppError(409, "SERVICE_NAME_EXISTS", "Tên dịch vụ đã tồn tại.")


@router.get("", response_model=list[ServiceOut])
def list_services(
    include_inactive: bool = Query(False, description="Chỉ có tác dụng với Quản lý (BR05)"),
    user: CurrentUser | None = Depends(get_optional_user),
    conn: psycopg.Connection = Depends(get_conn),
):
    """Công khai, không cần đăng nhập (BR03). Mặc định chỉ trả dịch vụ đang hoạt động (BR05).

    Quản lý thêm `?include_inactive=true` để xem cả dịch vụ đã ngừng. Với người khác tham số
    này bị bỏ qua, không báo lỗi, để không lộ việc có dịch vụ ngừng.
    """
    see_all = include_inactive and user is not None and user.role == MANAGER
    where = "" if see_all else "WHERE is_active"
    return conn.execute(f"SELECT {_COLS} FROM services {where} ORDER BY service_id").fetchall()


@router.get("/{service_id}", response_model=ServiceOut)
def get_service(service_id: int, conn: psycopg.Connection = Depends(get_conn)):
    row = conn.execute(
        f"SELECT {_COLS} FROM services WHERE service_id = %s AND is_active", (service_id,)
    ).fetchone()
    if row is None:
        raise AppError(404, "SERVICE_NOT_FOUND", "Dịch vụ không tồn tại.")
    return row


@router.post("", response_model=ServiceOut, status_code=201)
def create_service(
    body: ServiceCreate,
    _: CurrentUser = Depends(require_roles(MANAGER)),
    conn: psycopg.Connection = Depends(get_conn),
):
    """Thêm dịch vụ (F01, BR04). Tên trùng trả 409, kể cả trùng với dịch vụ đã ngừng."""
    try:
        with conn.transaction():
            return conn.execute(
                f"""INSERT INTO services (name, description, duration_minutes, reference_price, is_active)
                    VALUES (%s, %s, %s, %s, %s) RETURNING {_COLS}""",
                (
                    body.name,
                    body.description,
                    body.duration_minutes,
                    body.reference_price,
                    body.is_active,
                ),
            ).fetchone()
    except UniqueViolation:
        raise _name_exists()


@router.patch("/{service_id}", response_model=ServiceOut)
def update_service(
    service_id: int,
    body: ServiceUpdate,
    _: CurrentUser = Depends(require_roles(MANAGER)),
    conn: psycopg.Connection = Depends(get_conn),
):
    """Sửa thông tin hoặc ngừng/kích hoạt lại dịch vụ. Lịch cũ không đổi (BR05)."""
    changes = body.model_dump(exclude_unset=True)
    try:
        with conn.transaction():
            if not changes:
                row = conn.execute(
                    f"SELECT {_COLS} FROM services WHERE service_id = %s", (service_id,)
                ).fetchone()
            else:
                # Tên cột lấy từ khóa của model Pydantic (danh sách cố định), không từ người dùng.
                assignments = ", ".join(f"{col} = %s" for col in changes)
                row = conn.execute(
                    f"UPDATE services SET {assignments} WHERE service_id = %s RETURNING {_COLS}",
                    (*changes.values(), service_id),
                ).fetchone()
    except UniqueViolation:
        raise _name_exists()
    if row is None:
        raise AppError(404, "SERVICE_NOT_FOUND", "Dịch vụ không tồn tại.")
    return row
