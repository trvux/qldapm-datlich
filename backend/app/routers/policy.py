from fastapi import APIRouter

from app import rules
from app.config import get_settings
from app.schemas import PolicyOut

router = APIRouter(prefix="/policy", tags=["Quy định đặt lịch"])


@router.get("", response_model=PolicyOut)
def get_policy():
    """Quy định đặt lịch để Frontend hiển thị, không phải đặt cứng ở giao diện. Công khai."""
    s = get_settings()
    return {
        "open_days": [1, 2, 3, 4, 5, 6],  # BR07: nghỉ Chủ nhật
        "open_time": rules.OPEN_TIME,
        "lunch_start": rules.LUNCH_START,
        "lunch_end": rules.LUNCH_END,
        "close_time": rules.CLOSE_TIME,
        "min_lead_hours": s.booking_min_lead_hours,
        "max_advance_days": s.booking_max_advance_days,
        "max_active": s.max_active_appointments,
        "change_lead_hours": s.change_min_lead_hours,
        "max_changes": s.max_changes_per_appointment,
    }
