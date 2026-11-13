import psycopg
from fastapi import APIRouter, Depends, Response

from app import appointments as svc
from app.db import get_conn
from app.deps import CUSTOMER, MANAGER, STAFF, CurrentUser, get_current_user, require_roles
from app.errors import AppError
from app.schemas import AppointmentCreate, AppointmentOut, RejectRequest, RescheduleRequest

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


# ---- Bản tối thiểu của F04 để chạy được luồng "nhân viên xác nhận lịch" (Việc #32). ----
# Danh sách/lọc lịch, bắt đầu xử lý, hoàn thành thuộc Việc #27 (Quang).


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
