from collections.abc import Iterator

import psycopg
from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool

from app.config import get_settings

_pool: ConnectionPool | None = None


def open_pool() -> None:
    global _pool
    # autocommit=True: mỗi câu lệnh tự commit, còn nhiều bước cần nguyên tử thì dùng
    # `with conn.transaction():` (BEGIN ... COMMIT thật). Cách này giữ ranh giới transaction
    # nằm ngay trong code nghiệp vụ, không phụ thuộc thời điểm FastAPI đóng dependency.
    _pool = ConnectionPool(
        get_settings().database_url,
        min_size=1,
        max_size=10,
        kwargs={"autocommit": True, "row_factory": dict_row},
        open=True,
    )


def close_pool() -> None:
    global _pool
    if _pool is not None:
        _pool.close()
        _pool = None


def get_conn() -> Iterator[psycopg.Connection]:
    """FastAPI dependency: mượn 1 kết nối từ pool cho mỗi request."""
    assert _pool is not None, "Pool chưa được mở"
    with _pool.connection() as conn:
        yield conn
