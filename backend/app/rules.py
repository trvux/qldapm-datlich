"""Quy tắc về thời gian và trạng thái dùng chung. Mã BR## tham chiếu Việc #8."""
from datetime import date, datetime, time, timedelta
from zoneinfo import ZoneInfo

from app.config import get_settings

# BR25: toàn bộ thời gian hiển thị theo giờ Việt Nam (UTC+7)
VN_TZ = ZoneInfo("Asia/Ho_Chi_Minh")

# BR08: lịch ở các trạng thái này đang chiếm chỗ trong khung giờ.
# COMPLETED, CANCELLED, REJECTED không chiếm chỗ.
SLOT_OCCUPYING = ["PENDING", "CONFIRMED", "IN_PROGRESS"]

# BR11: giới hạn số lịch đang hiệu lực của một khách chỉ tính 2 trạng thái này.
CUSTOMER_LIMIT_STATUSES = ["PENDING", "CONFIRMED"]

# BR07: 08:00-12:00 và 13:00-17:00, nghỉ trưa 12:00-13:00
OPEN_TIME = time(8, 0)
LUNCH_START = time(12, 0)
LUNCH_END = time(13, 0)
CLOSE_TIME = time(17, 0)


def now_vn() -> datetime:
    """Tách riêng thành hàm để test có thể giả lập đồng hồ."""
    return datetime.now(VN_TZ)


def to_vn(dt: datetime) -> datetime:
    return dt.astimezone(VN_TZ)


def slot_start(slot_date: date, start_time: time) -> datetime:
    return datetime.combine(slot_date, start_time, tzinfo=VN_TZ)


def is_working_slot(slot_date: date, start_time: time, end_time: time) -> bool:
    """BR07: Thứ Hai-Thứ Bảy, trong giờ làm việc và không rơi vào giờ nghỉ trưa."""
    if slot_date.isoweekday() == 7:
        return False
    if start_time < OPEN_TIME or end_time > CLOSE_TIME:
        return False
    return not (start_time < LUNCH_END and end_time > LUNCH_START)


def closed_reason(
    slot_date: date, start_time: time, remaining: int, now: datetime
) -> str | None:
    """Lý do khung giờ chưa đặt được, hoặc None nếu đặt được (BR09, BR10).

    Thứ tự kiểm tra cũng là thứ tự báo lỗi khi đặt lịch.
    """
    s = get_settings()
    delta = slot_start(slot_date, start_time) - now
    if delta <= timedelta(0):
        return "IN_PAST"
    if delta < timedelta(hours=s.booking_min_lead_hours):
        return "TOO_SOON"
    if delta > timedelta(days=s.booking_max_advance_days):
        return "TOO_FAR"
    if remaining <= 0:
        return "FULL"
    return None
