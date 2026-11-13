from datetime import date, datetime, time
from typing import Literal

from pydantic import BaseModel, Field, field_validator

# ---------- Auth ----------


class LoginRequest(BaseModel):
    email: str = Field(min_length=1, max_length=150)
    password: str = Field(min_length=1, max_length=128)

    @field_validator("email")
    @classmethod
    def _norm_email(cls, v: str) -> str:
        return v.strip().lower()


class UserOut(BaseModel):
    user_id: int
    full_name: str
    email: str
    role: Literal["CUSTOMER", "STAFF", "MANAGER"]


class TokenOut(BaseModel):
    access_token: str
    token_type: Literal["bearer"] = "bearer"
    expires_in: int = Field(description="Số giây token còn hiệu lực")
    user: UserOut


# ---------- Dịch vụ (F02) ----------


class ServiceOut(BaseModel):
    service_id: int
    name: str
    description: str | None
    duration_minutes: int
    reference_price: int = Field(description="VND, chỉ để tham khảo (BR06)")


# ---------- Xe ----------


class VehicleCreate(BaseModel):
    license_plate: str = Field(min_length=4, max_length=15, pattern=r"^[A-Za-z0-9 .\-]+$")
    brand: str = Field(min_length=1, max_length=50)
    model: str | None = Field(default=None, max_length=50)
    year: int | None = Field(default=None, ge=1980, le=2100)

    @field_validator("license_plate")
    @classmethod
    def _norm_plate(cls, v: str) -> str:
        return v.strip().upper()


class VehicleOut(BaseModel):
    vehicle_id: int
    license_plate: str
    brand: str
    model: str | None
    year: int | None


# ---------- Khung giờ (F07) ----------

SlotClosedReason = Literal["FULL", "IN_PAST", "TOO_SOON", "TOO_FAR"]


class SlotOut(BaseModel):
    slot_id: int
    slot_date: date
    start_time: time
    end_time: time
    max_capacity: int
    booked: int = Field(description="Số lịch đang chiếm chỗ (PENDING, CONFIRMED, IN_PROGRESS)")
    remaining: int
    bookable: bool = Field(description="true nếu khách đặt được ngay lúc này (BR09, BR10)")
    closed_reason: SlotClosedReason | None = None


class SlotCapacityUpdate(BaseModel):
    max_capacity: int = Field(ge=1, le=50)


# ---------- Lịch hẹn (F03, F04) ----------

AppointmentStatus = Literal[
    "PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "REJECTED"
]


class AppointmentCreate(BaseModel):
    vehicle_id: int
    service_id: int
    slot_id: int
    note: str | None = Field(default=None, max_length=500)

    @field_validator("note")
    @classmethod
    def _blank_note_is_none(cls, v: str | None) -> str | None:
        return (v.strip() or None) if v is not None else None


class RescheduleRequest(BaseModel):
    slot_id: int
    service_id: int | None = Field(default=None, description="Bỏ trống thì giữ dịch vụ cũ (BR21)")


class RejectRequest(BaseModel):
    reason: str = Field(min_length=1, max_length=500)  # BR15: bắt buộc có lý do

    @field_validator("reason")
    @classmethod
    def _not_blank(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Lý do từ chối không được để trống")
        return v


class _CustomerRef(BaseModel):
    user_id: int
    full_name: str


class _SlotRef(BaseModel):
    slot_id: int
    slot_date: date
    start_time: time
    end_time: time


class _ServiceRef(BaseModel):
    service_id: int
    name: str
    duration_minutes: int
    reference_price: int


class HistoryEntry(BaseModel):
    old_status: AppointmentStatus | None
    new_status: AppointmentStatus
    changed_by: int
    changed_at: datetime
    note: str | None


class AppointmentOut(BaseModel):
    appointment_id: int
    status: AppointmentStatus
    note: str | None
    reject_reason: str | None
    change_count: int
    customer: _CustomerRef
    vehicle: VehicleOut
    service: _ServiceRef
    slot: _SlotRef
    handled_by: int | None
    created_at: datetime
    updated_at: datetime
    history: list[HistoryEntry]


# ---------- Báo cáo thống kê (F08) ----------


class ReportByDate(BaseModel):
    date: date
    count: int


class ReportByStatus(BaseModel):
    status: AppointmentStatus
    count: int


class ReportByService(BaseModel):
    service_id: int
    name: str
    count: int


class AppointmentReport(BaseModel):
    date_from: date = Field(serialization_alias="from")
    date_to: date = Field(serialization_alias="to")
    total: int
    by_date: list[ReportByDate] = Field(description="Chỉ gồm ngày có ít nhất 1 lịch, tăng dần")
    by_status: list[ReportByStatus] = Field(description="Đủ cả 6 trạng thái, kể cả số 0")
    by_service: list[ReportByService] = Field(description="Giảm dần theo số lịch")
