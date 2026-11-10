"""Hạ tầng test cho Việc #32: chạy API thật qua HTTP trên PostgreSQL thật.

- Tạo lại database `datlich_test` từ db/schema.sql + seed.sql + slots.sql cho mỗi lần chạy.
- Khởi động uvicorn thật trong một thread; test gọi bằng httpx như Frontend sẽ gọi.
- Cần PostgreSQL đang chạy:  docker compose up -d
"""
import os
import socket
import threading
import time
from datetime import timedelta
from pathlib import Path

import httpx
import psycopg
import pytest
import uvicorn

ADMIN_URL = os.environ.get(
    "TEST_ADMIN_URL", "postgresql://datlich:datlich@localhost:5434/postgres"
)
TEST_DB = "datlich_test"
TEST_URL = ADMIN_URL.rsplit("/", 1)[0] + f"/{TEST_DB}"
DB_DIR = Path(__file__).resolve().parent.parent / "db"

# Phải đặt TRƯỚC khi import app (Settings đọc môi trường ngay lần đầu)
os.environ["DATABASE_URL"] = TEST_URL
os.environ["JWT_SECRET"] = "test-secret-" + "x" * 40

PASSWORDS = {
    "manager@xyz.vn": "Manager@123",
    "staff1@xyz.vn": "Staff@1234",
    "khach1@example.com": "Customer@123",
    "khach2@example.com": "Customer@123",
    "khach3@example.com": "Customer@123",
}


@pytest.fixture(scope="session")
def _database():
    try:
        admin = psycopg.connect(ADMIN_URL, autocommit=True, connect_timeout=5)
    except psycopg.OperationalError as e:
        pytest.exit(f"Không nối được PostgreSQL ({e}). Chạy `docker compose up -d` trước.", 2)
    admin.execute(f"DROP DATABASE IF EXISTS {TEST_DB} WITH (FORCE)")
    admin.execute(f"CREATE DATABASE {TEST_DB}")
    admin.close()
    with psycopg.connect(TEST_URL, autocommit=True) as conn:
        for name in ("schema.sql", "seed.sql", "slots.sql"):
            conn.execute((DB_DIR / name).read_text())
    yield


@pytest.fixture(scope="session")
def base_url(_database):
    from app.main import app  # import muộn: cần env đã đặt ở trên

    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        port = s.getsockname()[1]
    server = uvicorn.Server(uvicorn.Config(app, host="127.0.0.1", port=port, log_level="warning"))
    thread = threading.Thread(target=server.run, daemon=True)
    thread.start()
    for _ in range(100):
        if server.started:
            break
        time.sleep(0.1)
    else:
        pytest.exit("uvicorn không khởi động được", 2)
    yield f"http://127.0.0.1:{port}"
    server.should_exit = True
    thread.join(timeout=10)


@pytest.fixture
def db(_database):
    """Kết nối thẳng vào DB test để dựng/kiểm tra dữ liệu."""
    with psycopg.connect(TEST_URL, autocommit=True, row_factory=psycopg.rows.dict_row) as conn:
        yield conn


@pytest.fixture(autouse=True)
def _clean(_database):
    """Mỗi test bắt đầu từ trạng thái sạch: không còn lịch hẹn, sức chứa về 3, xe thêm tay bị xóa."""
    with psycopg.connect(TEST_URL, autocommit=True) as conn:
        conn.execute("TRUNCATE appointment_status_history, appointments RESTART IDENTITY")
        conn.execute("UPDATE time_slots SET max_capacity = 3")
        conn.execute("DELETE FROM vehicles WHERE vehicle_id > 6")
        conn.execute("UPDATE users SET is_active = (email <> 'locked@example.com')")
    yield


def _login(base_url: str, email: str) -> httpx.Client:
    c = httpx.Client(base_url=base_url, timeout=15)
    r = c.post("/auth/login", json={"email": email, "password": PASSWORDS[email]})
    assert r.status_code == 200, r.text
    c.headers["Authorization"] = f"Bearer {r.json()['access_token']}"
    return c


@pytest.fixture(scope="session")
def anon(base_url):
    with httpx.Client(base_url=base_url, timeout=15) as c:
        yield c


@pytest.fixture(scope="session")
def customer1(base_url):
    c = _login(base_url, "khach1@example.com")
    yield c
    c.close()


@pytest.fixture(scope="session")
def customer2(base_url):
    c = _login(base_url, "khach2@example.com")
    yield c
    c.close()


@pytest.fixture(scope="session")
def customer3(base_url):
    c = _login(base_url, "khach3@example.com")
    yield c
    c.close()


@pytest.fixture(scope="session")
def staff(base_url):
    c = _login(base_url, "staff1@xyz.vn")
    yield c
    c.close()


@pytest.fixture(scope="session")
def manager(base_url):
    c = _login(base_url, "manager@xyz.vn")
    yield c
    c.close()


@pytest.fixture(scope="session")
def vehicle_ids(customer1, customer2, customer3):
    """{khach: [vehicle_id, ...]} lấy qua API."""
    return {
        n: [v["vehicle_id"] for v in c.get("/vehicles").json()]
        for n, c in (("c1", customer1), ("c2", customer2), ("c3", customer3))
    }


@pytest.fixture
def open_slots(customer1):
    """Các khung giờ đặt được, sắp xếp theo thời gian, bắt đầu từ 2 ngày sau (tránh biên 2 giờ)."""
    from app import rules

    start = rules.now_vn().date() + timedelta(days=2)
    r = customer1.get("/slots", params={"from": start.isoformat(), "to": (start + timedelta(days=9)).isoformat()})
    assert r.status_code == 200, r.text
    slots = [s for s in r.json() if s["bookable"]]
    assert len(slots) >= 20
    return slots


def book(client: httpx.Client, vehicle_id: int, slot_id: int, service_id: int = 1, **extra):
    return client.post(
        "/appointments",
        json={"vehicle_id": vehicle_id, "service_id": service_id, "slot_id": slot_id, **extra},
    )
