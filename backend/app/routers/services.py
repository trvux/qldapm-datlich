"""Tra cứu dịch vụ (F02), chỉ đọc. Bản tối thiểu để luồng đặt lịch chạy được.

Quản lý dịch vụ (F01: thêm, sửa, ngừng) thuộc Việc #26 và chưa có ở đây.
"""
import psycopg
from fastapi import APIRouter, Depends

from app.db import get_conn
from app.errors import AppError
from app.schemas import ServiceOut

router = APIRouter(prefix="/services", tags=["Dịch vụ (F02)"])

_COLS = "service_id, name, description, duration_minutes, reference_price::int AS reference_price"


@router.get("", response_model=list[ServiceOut])
def list_services(conn: psycopg.Connection = Depends(get_conn)):
    """Công khai, không cần đăng nhập (BR03). Chỉ trả dịch vụ đang hoạt động (BR05)."""
    return conn.execute(
        f"SELECT {_COLS} FROM services WHERE is_active ORDER BY service_id"
    ).fetchall()


@router.get("/{service_id}", response_model=ServiceOut)
def get_service(service_id: int, conn: psycopg.Connection = Depends(get_conn)):
    row = conn.execute(
        f"SELECT {_COLS} FROM services WHERE service_id = %s AND is_active", (service_id,)
    ).fetchone()
    if row is None:
        raise AppError(404, "SERVICE_NOT_FOUND", "Dịch vụ không tồn tại.")
    return row
