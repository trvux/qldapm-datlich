from datetime import date

import psycopg
from fastapi import APIRouter, Depends, Query, Response

from app import appointments as svc
from app.db import get_conn
from app.deps import CUSTOMER, MANAGER, STAFF, CurrentUser, get_current_user, require_roles
from app.errors import AppError
from app.schemas import (
    AppointmentCreate,
    AppointmentOut,
    AppointmentStatus,
    RejectRequest,
    RescheduleRequest,
)

router = APIRouter(prefix="/appointments", tags=["Lịch hẹn (F03, F04, F05)"])


@router.post("", response_model=AppointmentOut, status_code=201)
def create(
    body: AppointmentCreate,
    response: Response,
    user: CurrentUser = Depends(require_roles(CUSTOMER)),
    conn: psycopg.Connection = Depends(get_conn),
):
    """Đặt lịch (F03). Kiểm tra trùng và năng lực (F07) trong cùng một transaction."""
    appointment_id = svc.create_appointment(conn, user.user_id, body)
    response.headers["Location"] = f"/appointments/{appointment_id}"
    return svc.fetch_appointment(conn, appointment_id)


@router.get("", response_model=list[AppointmentOut])
def list_all(
    status: AppointmentStatus | None = Query(None, description="Lọc theo trạng thái"),
    on_date: date | None = Query(None, alias="date", description="Ngày hẹn (YYYY-MM-DD)"),
    date_from: date | None = Query(None, alias="from", description="Từ ngày hẹn"),
    date_to: date | None = Query(None, alias="to", description="Đến ngày hẹn"),
    user: CurrentUser = Depends(get_current_user),
    conn: psycopg.Connection = Depends(get_conn),
):
    """Danh sách lịch hẹn, mới nhất trước (F04, F06, BR18, BR23).

    Khách chỉ thấy lịch của mình; Nhân viên và Quản lý thấy tất cả. Các bộ lọc kết hợp bằng AND.
    """
    if date_from and date_to and date_to < date_from:
        raise AppError(422, "INVALID_DATE_RANGE", "`to` phải lớn hơn hoặc bằng `from`.")
    return svc.list_appointments(
        conn,
        customer_id=user.user_id if user.role == CUSTOMER else None,
        status=status,
        on_date=on_date,
        date_from=date_from,
        date_to=date_to,
    )


@router.get("/{appointment_id}", response_model=AppointmentOut)
def get_one(
    appointment_id: int,
    user: CurrentUser = Depends(get_current_user),
    conn: psycopg.Connection = Depends(get_conn),
):
    appt = svc.fetch_appointment(conn, appointment_id)
    # BR23: khách chỉ xem lịch của mình; nhân viên và quản lý xem được tất cả.
    # Lịch của người khác trả 404 (không phải 403) để không lộ mã lịch nào tồn tại.
    if appt is None or (user.role == CUSTOMER and appt["customer"]["user_id"] != user.user_id):
        raise AppError(404, "APPOINTMENT_NOT_FOUND", "Không tìm thấy lịch hẹn.")
    return appt


@router.post("/{appointment_id}/cancel", response_model=AppointmentOut)
def cancel(
    appointment_id: int,
    user: CurrentUser = Depends(require_roles(CUSTOMER)),
    conn: psycopg.Connection = Depends(get_conn),
):
    """Khách hủy lịch của mình (F05, BR19, BR20). Chỉ khi còn từ 4 giờ trở lên."""
    svc.cancel_appointment(conn, user.user_id, appointment_id)
    return svc.fetch_appointment(conn, appointment_id)


@router.post("/{appointment_id}/reschedule", response_model=AppointmentOut)
def reschedule(
    appointment_id: int,
    body: RescheduleRequest,
    user: CurrentUser = Depends(require_roles(CUSTOMER)),
    conn: psycopg.Connection = Depends(get_conn),
):
    """Khách đổi khung giờ (và có thể đổi dịch vụ) của lịch mình (F05, BR19, BR21, BR22)."""
    svc.reschedule_appointment(conn, user.user_id, appointment_id, body)
    return svc.fetch_appointment(conn, appointment_id)


# ---- F04: nhân viên xử lý lịch (Việc #27). Danh sách/lọc ở trên; xác nhận, từ chối, bắt đầu,
# hoàn thành ở dưới. Chỉ Nhân viên và Quản lý (BR03). ----


@router.post("/{appointment_id}/confirm", response_model=AppointmentOut)
def confirm(
    appointment_id: int,
    user: CurrentUser = Depends(require_roles(STAFF, MANAGER)),
    conn: psycopg.Connection = Depends(get_conn),
):
    svc.confirm_appointment(conn, appointment_id, user.user_id)
    return svc.fetch_appointment(conn, appointment_id)


@router.post("/{appointment_id}/reject", response_model=AppointmentOut)
def reject(
    appointment_id: int,
    body: RejectRequest,
    user: CurrentUser = Depends(require_roles(STAFF, MANAGER)),
    conn: psycopg.Connection = Depends(get_conn),
):
    svc.reject_appointment(conn, appointment_id, user.user_id, body.reason)
    return svc.fetch_appointment(conn, appointment_id)


@router.post("/{appointment_id}/start", response_model=AppointmentOut)
def start(
    appointment_id: int,
    user: CurrentUser = Depends(require_roles(STAFF, MANAGER)),
    conn: psycopg.Connection = Depends(get_conn),
):
    """Xe đã đến trung tâm: Đã xác nhận -> Đang thực hiện (BR17)."""
    svc.start_appointment(conn, appointment_id, user.user_id)
    return svc.fetch_appointment(conn, appointment_id)


@router.post("/{appointment_id}/complete", response_model=AppointmentOut)
def complete(
    appointment_id: int,
    user: CurrentUser = Depends(require_roles(STAFF, MANAGER)),
    conn: psycopg.Connection = Depends(get_conn),
):
    """Xong việc: Đang thực hiện -> Hoàn thành, trả chỗ cho khung giờ (BR08, BR17)."""
    svc.complete_appointment(conn, appointment_id, user.user_id)
    return svc.fetch_appointment(conn, appointment_id)
