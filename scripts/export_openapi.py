"""Xuất OpenAPI ra docs/openapi.json để Frontend import vào Postman/Insomnia hoặc sinh type.

Chạy:  uv run python scripts/export_openapi.py
"""
import json
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

# Chỉ cần để import app; script này không kết nối CSDL
os.environ.setdefault("DATABASE_URL", "postgresql://unused@localhost/unused")
os.environ.setdefault("JWT_SECRET", "x" * 32)

from app.main import app  # noqa: E402

out = ROOT / "docs" / "openapi.json"
out.write_text(json.dumps(app.openapi(), ensure_ascii=False, indent=2) + "\n")
print(f"Đã ghi {out}")
