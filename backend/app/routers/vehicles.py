import psycopg
from fastapi import APIRouter, Depends
from psycopg import errors as pg_errors

from app.db import get_conn
from app.deps import CUSTOMER, CurrentUser, require_roles
from app.errors import AppError
from app.schemas import VehicleCreate, VehicleOut

router = APIRouter(prefix="/vehicles", tags=["Xe của khách"])

_COLS = "vehicle_id, license_plate, brand, model, year"


@router.get("", response_model=list[VehicleOut])
def my_vehicles(
    user: CurrentUser = Depends(require_roles(CUSTOMER)),
    conn: psycopg.Connection = Depends(get_conn),
):
    return conn.execute(
        f"SELECT {_COLS} FROM vehicles WHERE user_id = %s ORDER BY vehicle_id", (user.user_id,)
    ).fetchall()


@router.post("", response_model=VehicleOut, status_code=201)
def add_vehicle(
    body: VehicleCreate,
    user: CurrentUser = Depends(require_roles(CUSTOMER)),
    conn: psycopg.Connection = Depends(get_conn),
):
    try:
        return conn.execute(
            f"""INSERT INTO vehicles (user_id, license_plate, brand, model, year)
                VALUES (%s, %s, %s, %s, %s) RETURNING {_COLS}""",
            (user.user_id, body.license_plate, body.brand, body.model, body.year),
        ).fetchone()
    except pg_errors.UniqueViolation:
        # BR12: biển số là duy nhất toàn hệ thống
        raise AppError(409, "LICENSE_PLATE_EXISTS", "Biển số này đã được đăng ký.")
