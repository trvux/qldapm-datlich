from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str
    # Không có giá trị mặc định: thiếu JWT_SECRET thì app không khởi động được.
    jwt_secret: str = Field(min_length=32)
    jwt_expire_minutes: int = 60
    cors_origins: str = "http://localhost:3000"

    # Tham số nghiệp vụ (mục 8 của tài liệu quy tắc nghiệp vụ, Việc #8)
    booking_min_lead_hours: int = 2          # BR10: đặt trước giờ hẹn ít nhất 2 giờ
    booking_max_advance_days: int = 14       # BR10: không đặt quá 14 ngày
    max_active_appointments: int = 3         # BR11: tối đa 3 lịch đang hiệu lực / khách
    change_min_lead_hours: int = 4           # BR19: đổi/hủy trước giờ hẹn ít nhất 4 giờ
    max_changes_per_appointment: int = 2     # BR22: mỗi lịch đổi tối đa 2 lần


@lru_cache
def get_settings() -> Settings:
    return Settings()
