from contextlib import asynccontextmanager

import psycopg
from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import db
from app.config import get_settings
from app.errors import install_error_handlers
from app.routers import appointments, auth, services, slots, vehicles


@asynccontextmanager
async def lifespan(_: FastAPI):
    db.open_pool()
    yield
    db.close_pool()


app = FastAPI(
    title="API Đặt lịch bảo dưỡng ô tô - Trung tâm XYZ",
    version="0.2.0",
    description="Backend Sprint 2 (Việc #22, #23, #25, #29). Mã BR## tham chiếu tài liệu "
    "Quy tắc nghiệp vụ (Việc #8).",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in get_settings().cors_origins.split(",") if o.strip()],
    allow_methods=["GET", "POST", "PATCH", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)
install_error_handlers(app)

for r in (auth, services, vehicles, slots, appointments):
    app.include_router(r.router)


@app.get("/health", tags=["Hệ thống"])
def health(conn: psycopg.Connection = Depends(db.get_conn)):
    conn.execute("SELECT 1")
    return {"status": "ok"}
