# Backend - đặt lịch bảo dưỡng ô tô XYZ

Thư mục `backend/` của repo dự án tổng (xem [README gốc](../README.md)). Người phụ trách: Huỳnh Bảo Huy. Mọi lệnh trong file này chạy **trong thư mục `backend/`**.

## Việc đã làm trong Sprint 2

| Việc | Nội dung | Sản phẩm |
|---|---|---|
| #22 | Chốt API Backend - Frontend | [`docs/api/Viec22_DacTa_API.md`](../docs/api/Viec22_DacTa_API.md), [`docs/api/openapi.json`](../docs/api/openapi.json) |
| #23 | Tạo bảng DB + dữ liệu mẫu | [`db/schema.sql`](db/schema.sql), [`db/seed.sql`](db/seed.sql), [`db/slots.sql`](db/slots.sql), [`docker-compose.yml`](docker-compose.yml) |
| #25 | Đăng nhập, phân quyền (Backend) | `app/routers/auth.py`, `app/security.py`, `app/deps.py` |
| #29 | Đặt lịch + kiểm tra trùng/năng lực (F03, F07) | `app/appointments.py`, `app/routers/slots.py`, `app/routers/appointments.py` |
| #32 | Test thử luồng đặt lịch từ đầu đến cuối | [`docs/sprint2/Viec32_KetQua_ChayThu.md`](../docs/sprint2/Viec32_KetQua_ChayThu.md), `tests/` |

Ngoài kế hoạch, để chạy được luồng "nhân viên xác nhận lịch": `GET /services` (chỉ đọc), `GET/POST /vehicles`, `confirm` và `reject` bản tối thiểu. Các phần này được đánh dấu rõ trong code và tài liệu API; Tri (#26) và Quang (#27) có thể giữ hoặc thay.

## Chạy nhanh

Cần Docker, [uv](https://docs.astral.sh/uv/) và Python 3.13 trở lên.

```bash
cp .env.example .env     # rồi đổi JWT_SECRET thành chuỗi ngẫu nhiên (có hướng dẫn trong file)
docker compose up -d     # PostgreSQL 18 ở cổng 5434, tự nạp schema + dữ liệu mẫu lần đầu
uv sync
uv run uvicorn app.main:app --reload
```

Mở Swagger UI: http://localhost:8000/docs · Kiểm tra sống: http://localhost:8000/health

Dựng lại CSDL từ đầu (mất hết dữ liệu): `docker compose down -v && docker compose up -d`.
Sinh thêm khung giờ cho các ngày mới: `docker exec -i datlich-postgres psql -U datlich -d datlich < db/slots.sql`.

## Tài khoản demo

| Vai trò | Email | Mật khẩu |
|---|---|---|
| Quản lý | `manager@xyz.vn` | `Manager@123` |
| Nhân viên | `staff1@xyz.vn`, `staff2@xyz.vn` | `Staff@1234` |
| Khách hàng | `khach1@example.com`, `khach2@example.com`, `khach3@example.com` | `Customer@123` |
| Bị khóa (để test BR02) | `locked@example.com` | `Customer@123` |

Mỗi khách có 2 xe. Có 8 dịch vụ (1 đã ngừng để test BR05) và khung giờ cho 28 ngày tới, mỗi khung tối đa 3 xe.

## Chạy test

```bash
uv run pytest -v
```

79 test, chạy trên PostgreSQL thật qua HTTP, tự tạo database `datlich_test` riêng. Chi tiết ở `docs/sprint2/Viec32_KetQua_ChayThu.md`.

## Cấu trúc

```
app/
  main.py            khởi tạo FastAPI, CORS, router
  config.py          cấu hình từ .env (kể cả tham số nghiệp vụ BR10, BR11)
  db.py              pool kết nối PostgreSQL
  security.py        băm mật khẩu argon2, JWT
  deps.py            lấy người dùng hiện tại, kiểm tra vai trò (BR03)
  rules.py           quy tắc giờ làm việc, múi giờ VN, trạng thái chiếm chỗ
  appointments.py    nghiệp vụ đặt lịch (1 transaction, khóa dòng) và xử lý của nhân viên
  routers/           auth, services, vehicles, slots, appointments
db/                  schema (Việc #10, đã đóng băng), dữ liệu mẫu, sinh khung giờ
tests/               test đăng nhập, đặt lịch, đầu-cuối và đồng thời
```

## Ghi chú thiết kế

- **Ngôn ngữ: Python.** Đề bài (mục 2.3) ràng buộc Java hoặc Python, nên không dùng Go dù là ngôn ngữ quen thuộc.
- **Chống đặt vượt chỗ (BR13):** kiểm tra và lưu lịch trong một transaction, khóa dòng khung giờ bằng `SELECT ... FOR UPDATE`. Chỉ mục duy nhất một phần trong CSDL là lưới an toàn chống trùng xe (BR11).
- **Chỗ trống luôn được tính, không lưu:** `remaining = max_capacity - số lịch đang chiếm chỗ`, nên hủy hoặc từ chối tự trả chỗ và số liệu không thể lệch.
- **Thứ tự khóa:** luôn khóa dòng khách trước, dòng khung giờ sau (khung giờ theo `slot_id` tăng dần) để các luồng đổi/hủy ở Sprint 3 không deadlock.
- **Không có `JWT_SECRET` mặc định:** thiếu biến này thì app không khởi động.

## Vấn đề đang mở

Wireframe WF-03 vẽ 4 ca 2 giờ nhưng quy tắc nghiệp vụ và CSDL dùng 8 khung 1 giờ. Cần cả nhóm chọn hướng, xem `docs/api/Viec22_DacTa_API.md` mục 8.
