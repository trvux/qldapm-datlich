from datetime import date, timedelta

import psycopg
from fastapi import APIRouter, Depends, Query

from app import rules
from app.db import get_conn
from app.deps import MANAGER, CurrentUser, require_roles
from app.errors import AppError
from app.schemas import AppointmentReport

router = APIRouter(prefix="/reports", tags=["Báo cáo thống kê (F08)"])

MAX_RANGE_DAYS = 366

# Thứ tự cố định để Frontend vẽ biểu đồ không bị nhảy cột
_STATUS_ORDER = ["PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "REJECTED"]


@router.get("/appointments", response_model=AppointmentReport, response_model_by_alias=True)
def appointment_report(
    date_from: date | None = Query(None, alias="from", description="Mặc định: ngày 1 của tháng này"),
    date_to: date | None = Query(None, alias="to", description="Mặc định: hôm nay (giờ VN)"),
    _: CurrentUser = Depends(require_roles(MANAGER)),
    conn: psycopg.Connection = Depends(get_conn),
):
    """Thống kê lịch hẹn theo ngày hẹn, trạng thái, dịch vụ (F08, BR24).

    "Ngày hẹn" là ngày của khung giờ (slot_date), không phải ngày khách bấm đặt. Số liệu đếm
    trực tiếp từ bảng appointments, không có bảng thống kê riêng nên không bao giờ lệch.
    """
    today = rules.now_vn().date()
    end = date_to or today
    start = date_from or end.replace(day=1)
    if end < start:
        raise AppError(422, "INVALID_DATE_RANGE", "`to` phải lớn hơn hoặc bằng `from`.")
    if (end - start).days > MAX_RANGE_DAYS:
        raise AppError(422, "DATE_RANGE_TOO_LARGE", f"Tối đa {MAX_RANGE_DAYS} ngày mỗi lần xem.")

    # Cả 3 truy vấn chạy trong cùng một snapshot để tổng của 3 bảng luôn khớp nhau, kể cả khi
    # có khách đặt lịch giữa chừng.
    with conn.transaction():
        conn.execute("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY")
        by_date = conn.execute(
            """SELECT t.slot_date AS date, count(*)::int AS count
               FROM appointments a JOIN time_slots t ON t.slot_id = a.slot_id
               WHERE t.slot_date BETWEEN %s AND %s
               GROUP BY t.slot_date ORDER BY t.slot_date""",
            (start, end),
        ).fetchall()
        by_status_rows = conn.execute(
            """SELECT a.status, count(*)::int AS count
               FROM appointments a JOIN time_slots t ON t.slot_id = a.slot_id
               WHERE t.slot_date BETWEEN %s AND %s
               GROUP BY a.status""",
            (start, end),
        ).fetchall()
        # Dịch vụ đang hoạt động luôn có mặt (kể cả 0 lịch); dịch vụ đã ngừng chỉ hiện nếu
        # còn lịch cũ trong khoảng này (BR05: lịch cũ giữ nguyên thông tin dịch vụ).
        by_service = conn.execute(
            """SELECT s.service_id, s.name, count(a.appointment_id)::int AS count
               FROM services s
               LEFT JOIN (appointments a JOIN time_slots t ON t.slot_id = a.slot_id
                                                          AND t.slot_date BETWEEN %s AND %s)
                      ON a.service_id = s.service_id
               GROUP BY s.service_id, s.name, s.is_active
               HAVING s.is_active OR count(a.appointment_id) > 0
               ORDER BY count DESC, s.name""",
            (start, end),
        ).fetchall()

    counts = {r["status"]: r["count"] for r in by_status_rows}
    return {
        "date_from": start,
        "date_to": end,
        "total": sum(counts.values()),
        "by_date": by_date,
        "by_status": [{"status": s, "count": counts.get(s, 0)} for s in _STATUS_ORDER],
        "by_service": by_service,
    }
