"""Nghiệp vụ lịch hẹn: đặt lịch (F03 + F07) và xử lý của nhân viên (F04, bản tối thiểu)."""
import psycopg
from psycopg import errors as pg_errors

from app import rules
from app.config import get_settings
from app.errors import AppError
from app.schemas import AppointmentCreate

_TIME_ERRORS = {
    "IN_PAST": (422, "SLOT_IN_PAST", "Khung giờ này đã qua."),
    "TOO_SOON": (422, "BOOKING_TOO_SOON", "Cần đặt lịch trước giờ hẹn ít nhất {h} giờ."),
    "TOO_FAR": (422, "BOOKING_TOO_FAR", "Chỉ được đặt lịch trước tối đa {d} ngày."),
}


def create_appointment(conn: psycopg.Connection, customer_id: int, req: AppointmentCreate) -> int:
    """Đặt lịch: toàn bộ kiểm tra và INSERT nằm trong MỘT transaction.

    Thứ tự khóa luôn là: dòng khách hàng -> dòng khung giờ. Các luồng khác sau này (đổi lịch
    F05 ở Việc #37) phải khóa theo cùng thứ tự, và khi cần khóa 2 khung giờ thì khóa theo
    slot_id tăng dần, để không bao giờ deadlock.
    """
    cfg = get_settings()
    try:
        with conn.transaction():
            # Khóa dòng khách để 2 request đồng thời của CÙNG một khách không cùng vượt được
            # giới hạn 3 lịch (BR11). FOR NO KEY UPDATE là mức khóa vừa đủ: không chặn các
            # INSERT khác chỉ để kiểm tra khóa ngoại tới users.
            conn.execute(
                "SELECT 1 FROM users WHERE user_id = %s FOR NO KEY UPDATE", (customer_id,)
            )

            # BR13: khóa dòng khung giờ. Từ đây đến COMMIT, mọi người khác đặt cùng khung giờ
            # phải xếp hàng chờ, nên số đếm chỗ trống bên dưới không thể bị đổi giữa chừng.
            slot = conn.execute(
                """SELECT slot_id, slot_date, start_time, end_time, max_capacity
                   FROM time_slots WHERE slot_id = %s FOR UPDATE""",
                (req.slot_id,),
            ).fetchone()
            if slot is None:
                raise AppError(404, "SLOT_NOT_FOUND", "Khung giờ không tồn tại.")

            # BR07, BR10: giờ làm việc và khoảng thời gian cho phép đặt
            if not rules.is_working_slot(slot["slot_date"], slot["start_time"], slot["end_time"]):
                raise AppError(422, "SLOT_NOT_WORKING_HOUR", "Khung giờ nằm ngoài giờ làm việc.")
            reason = rules.closed_reason(
                slot["slot_date"], slot["start_time"], remaining=1, now=rules.now_vn()
            )
            if reason is not None:
                status, code, msg = _TIME_ERRORS[reason]
                raise AppError(
                    status,
                    code,
                    msg.format(h=cfg.booking_min_lead_hours, d=cfg.booking_max_advance_days),
                )

            # BR05: dịch vụ ngừng hoạt động không đặt mới được
            service = conn.execute(
                "SELECT service_id, is_active FROM services WHERE service_id = %s",
                (req.service_id,),
            ).fetchone()
            if service is None:
                raise AppError(404, "SERVICE_NOT_FOUND", "Dịch vụ không tồn tại.")
            if not service["is_active"]:
                raise AppError(422, "SERVICE_INACTIVE", "Dịch vụ này đã ngừng cung cấp.")

            # BR12: xe phải thuộc khách đang đặt. Xe của người khác trả 404, không để lộ
            # việc biển số đó có tồn tại.
            vehicle = conn.execute(
                "SELECT vehicle_id FROM vehicles WHERE vehicle_id = %s AND user_id = %s",
                (req.vehicle_id, customer_id),
            ).fetchone()
            if vehicle is None:
                raise AppError(404, "VEHICLE_NOT_FOUND", "Không tìm thấy xe của bạn.")

            # BR11: tối đa 3 lịch đang hiệu lực (Chờ xác nhận hoặc Đã xác nhận)
            active = conn.execute(
                """SELECT count(*) AS n FROM appointments
                   WHERE customer_id = %s AND status = ANY(%s)""",
                (customer_id, rules.CUSTOMER_LIMIT_STATUSES),
            ).fetchone()["n"]
            if active >= cfg.max_active_appointments:
                raise AppError(
                    409,
                    "BOOKING_LIMIT_REACHED",
                    f"Bạn đang có {active} lịch hiệu lực, tối đa {cfg.max_active_appointments}.",
                )

            # BR11: một xe không có 2 lịch hiệu lực cùng khung giờ
            dup = conn.execute(
                """SELECT 1 FROM appointments
                   WHERE vehicle_id = %s AND slot_id = %s AND status = ANY(%s)""",
                (req.vehicle_id, req.slot_id, rules.SLOT_OCCUPYING),
            ).fetchone()
            if dup:
                raise AppError(
                    409, "VEHICLE_ALREADY_BOOKED", "Xe này đã có lịch trong khung giờ đó."
                )

            # BR08, BR09: năng lực phục vụ. Đếm chỉ các lịch đang chiếm chỗ, nên lịch hủy hoặc
            # bị từ chối tự động trả chỗ mà không cần cột đếm riêng.
            booked = conn.execute(
                "SELECT count(*) AS n FROM appointments WHERE slot_id = %s AND status = ANY(%s)",
                (req.slot_id, rules.SLOT_OCCUPYING),
            ).fetchone()["n"]
            if booked >= slot["max_capacity"]:
                raise AppError(409, "SLOT_FULL", "Khung giờ này đã hết chỗ.")

            # BR14: lịch mới luôn ở PENDING và giữ chỗ ngay
            appointment_id = conn.execute(
                """INSERT INTO appointments (customer_id, vehicle_id, service_id, slot_id, note)
                   VALUES (%s, %s, %s, %s, %s) RETURNING appointment_id""",
                (customer_id, req.vehicle_id, req.service_id, req.slot_id, req.note),
            ).fetchone()["appointment_id"]
            conn.execute(
                """INSERT INTO appointment_status_history
                       (appointment_id, old_status, new_status, changed_by)
                   VALUES (%s, NULL, 'PENDING', %s)""",
                (appointment_id, customer_id),
            )
            return appointment_id
    except pg_errors.UniqueViolation:
        # Lưới an toàn: chỉ mục uq_vehicle_slot_active chặn trùng ở tầng CSDL
        raise AppError(409, "VEHICLE_ALREADY_BOOKED", "Xe này đã có lịch trong khung giờ đó.")


def fetch_appointment(conn: psycopg.Connection, appointment_id: int) -> dict | None:
    row = conn.execute(
        """SELECT a.appointment_id, a.status, a.note, a.reject_reason, a.change_count,
                  a.handled_by, a.created_at, a.updated_at,
                  u.user_id AS c_id, u.full_name AS c_name,
                  v.vehicle_id, v.license_plate, v.brand, v.model, v.year,
                  s.service_id, s.name AS s_name, s.duration_minutes, s.reference_price,
                  t.slot_id, t.slot_date, t.start_time, t.end_time
           FROM appointments a
           JOIN users u      ON u.user_id = a.customer_id
           JOIN vehicles v   ON v.vehicle_id = a.vehicle_id
           JOIN services s   ON s.service_id = a.service_id
           JOIN time_slots t ON t.slot_id = a.slot_id
           WHERE a.appointment_id = %s""",
        (appointment_id,),
    ).fetchone()
    if row is None:
        return None
    history = conn.execute(
        """SELECT old_status, new_status, changed_by, changed_at, note
           FROM appointment_status_history
           WHERE appointment_id = %s ORDER BY history_id""",
        (appointment_id,),
    ).fetchall()
    return {
        "appointment_id": row["appointment_id"],
        "status": row["status"],
        "note": row["note"],
        "reject_reason": row["reject_reason"],
        "change_count": row["change_count"],
        "customer": {"user_id": row["c_id"], "full_name": row["c_name"]},
        "vehicle": {
            "vehicle_id": row["vehicle_id"],
            "license_plate": row["license_plate"],
            "brand": row["brand"],
            "model": row["model"],
            "year": row["year"],
        },
        "service": {
            "service_id": row["service_id"],
            "name": row["s_name"],
            "duration_minutes": row["duration_minutes"],
            "reference_price": int(row["reference_price"]),
        },
        "slot": {
            "slot_id": row["slot_id"],
            "slot_date": row["slot_date"],
            "start_time": row["start_time"],
            "end_time": row["end_time"],
        },
        "handled_by": row["handled_by"],
        "created_at": rules.to_vn(row["created_at"]),
        "updated_at": rules.to_vn(row["updated_at"]),
        "history": [{**h, "changed_at": rules.to_vn(h["changed_at"])} for h in history],
    }


def _decide_pending(
    conn: psycopg.Connection,
    appointment_id: int,
    staff_id: int,
    new_status: str,
    reject_reason: str | None = None,
) -> None:
    """Xác nhận / từ chối: chỉ cho phép khi lịch đang PENDING (BR15, BR17)."""
    with conn.transaction():
        row = conn.execute(
            "SELECT status FROM appointments WHERE appointment_id = %s FOR UPDATE",
            (appointment_id,),
        ).fetchone()
        if row is None:
            raise AppError(404, "APPOINTMENT_NOT_FOUND", "Không tìm thấy lịch hẹn.")
        if row["status"] != "PENDING":
            raise AppError(
                409,
                "INVALID_STATUS_TRANSITION",
                f"Lịch đang ở trạng thái {row['status']}, không thể chuyển sang {new_status}.",
            )
        # BR16: ghi nhận nhân viên và thời điểm xử lý. Không cần kiểm tra lại năng lực vì chỗ
        # đã được giữ từ lúc đặt (BR14); khi từ chối, chỗ tự trả vì không còn tính vào số đếm.
        conn.execute(
            """UPDATE appointments
               SET status = %s, handled_by = %s, reject_reason = %s, updated_at = now()
               WHERE appointment_id = %s""",
            (new_status, staff_id, reject_reason, appointment_id),
        )
        conn.execute(
            """INSERT INTO appointment_status_history
                   (appointment_id, old_status, new_status, changed_by, note)
               VALUES (%s, 'PENDING', %s, %s, %s)""",
            (appointment_id, new_status, staff_id, reject_reason),
        )


def confirm_appointment(conn: psycopg.Connection, appointment_id: int, staff_id: int) -> None:
    _decide_pending(conn, appointment_id, staff_id, "CONFIRMED")


def reject_appointment(
    conn: psycopg.Connection, appointment_id: int, staff_id: int, reason: str
) -> None:
    _decide_pending(conn, appointment_id, staff_id, "REJECTED", reject_reason=reason)
