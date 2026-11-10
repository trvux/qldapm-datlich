from datetime import date, timedelta

import psycopg
from fastapi import APIRouter, Depends, Query

from app import rules
from app.config import get_settings
from app.db import get_conn
from app.deps import MANAGER, CurrentUser, get_current_user, require_roles
from app.errors import AppError
from app.schemas import SlotCapacityUpdate, SlotOut

router = APIRouter(prefix="/slots", tags=["Khung giờ & năng lực (F07)"])

MAX_RANGE_DAYS = 31


@router.get("", response_model=list[SlotOut])
def list_slots(
    date_from: date | None = Query(None, alias="from", description="Mặc định: hôm nay (giờ VN)"),
    date_to: date | None = Query(None, alias="to", description="Mặc định: from + 14 ngày"),
    _: CurrentUser = Depends(get_current_user),
    conn: psycopg.Connection = Depends(get_conn),
):
    """Danh sách khung giờ kèm số chỗ còn lại để Frontend vẽ lịch (BR09)."""
    now = rules.now_vn()
    start = date_from or now.date()
    end = date_to or start + timedelta(days=get_settings().booking_max_advance_days)
    if end < start:
        raise AppError(422, "INVALID_DATE_RANGE", "`to` phải lớn hơn hoặc bằng `from`.")
    if (end - start).days > MAX_RANGE_DAYS:
        raise AppError(422, "DATE_RANGE_TOO_LARGE", f"Tối đa {MAX_RANGE_DAYS} ngày mỗi lần xem.")

    rows = conn.execute(
        """SELECT s.slot_id, s.slot_date, s.start_time, s.end_time, s.max_capacity,
                  count(a.appointment_id)::int AS booked
           FROM time_slots s
           LEFT JOIN appointments a
                  ON a.slot_id = s.slot_id AND a.status = ANY(%s)
           WHERE s.slot_date BETWEEN %s AND %s
           GROUP BY s.slot_id
           ORDER BY s.slot_date, s.start_time""",
        (rules.SLOT_OCCUPYING, start, end),
    ).fetchall()

    out = []
    for r in rows:
        remaining = max(r["max_capacity"] - r["booked"], 0)
        reason = rules.closed_reason(r["slot_date"], r["start_time"], remaining, now)
        out.append({**r, "remaining": remaining, "bookable": reason is None, "closed_reason": reason})
    return out


@router.patch("/{slot_id}", response_model=SlotOut)
def update_capacity(
    slot_id: int,
    body: SlotCapacityUpdate,
    _: CurrentUser = Depends(require_roles(MANAGER)),
    conn: psycopg.Connection = Depends(get_conn),
):
    """Quản lý chỉnh số xe tối đa của một khung giờ (BR03: F07 chỉ Quản lý)."""
    with conn.transaction():
        # Cùng cơ chế khóa với lúc đặt lịch, để không ai đặt xen vào giữa lúc kiểm tra và sửa
        slot = conn.execute(
            """SELECT slot_id, slot_date, start_time, end_time FROM time_slots
               WHERE slot_id = %s FOR UPDATE""",
            (slot_id,),
        ).fetchone()
        if slot is None:
            raise AppError(404, "SLOT_NOT_FOUND", "Khung giờ không tồn tại.")
        booked = conn.execute(
            "SELECT count(*)::int AS n FROM appointments WHERE slot_id = %s AND status = ANY(%s)",
            (slot_id, rules.SLOT_OCCUPYING),
        ).fetchone()["n"]
        if body.max_capacity < booked:
            raise AppError(
                409,
                "CAPACITY_BELOW_BOOKED",
                f"Khung giờ đã có {booked} lịch, không thể giảm sức chứa xuống {body.max_capacity}.",
            )
        conn.execute(
            "UPDATE time_slots SET max_capacity = %s WHERE slot_id = %s",
            (body.max_capacity, slot_id),
        )

    remaining = body.max_capacity - booked
    reason = rules.closed_reason(slot["slot_date"], slot["start_time"], remaining, rules.now_vn())
    return {
        **slot,
        "max_capacity": body.max_capacity,
        "booked": booked,
        "remaining": remaining,
        "bookable": reason is None,
        "closed_reason": reason,
    }
