# Việc #40: Kết quả chạy Test Case TC01-TC12 và minh chứng

**Sprint 3, Câu 7/8** · Người phụ trách thẻ: Trần Ngọc Tôn Tri · Người chạy lại và ghi nhận: Huỳnh Bảo Huy (nợ kỹ thuật, xem mục 5)
Ngày chạy: 15/11/2026 · Môi trường: macOS (Apple Silicon), Python 3.15, PostgreSQL 18 (Docker, cổng 5434), Backend `localhost:8000`, Frontend `localhost:3003` chạy từ `frontend/`

## 1. Kết luận

**11/12 test case đạt, 1 test case không chạy được qua API (TC03) nhưng đã có test tự động, 0 lỗi.** Các test case TC01, TC07, TC08, TC12 còn được chạy trên giao diện thật (ảnh ở mục 4).
Bộ test tự động: `uv run pytest -q` cho **169 passed**.

## 2. Cách chạy lại

```bash
cd backend
docker compose up -d
uv run uvicorn app.main:app --port 8000        # cửa sổ 1
uv run python scripts/run_test_cases.py --json ../docs/sprint3/evidence/TC_chay_2026-11-15.json   # cửa sổ 2
uv run pytest -q
```

Script chỉ tạo lịch hẹn mới và dọn lại bằng cách từ chối hoặc hủy; không xóa dữ liệu mẫu. Kết quả gốc: [`evidence/TC_chay_2026-11-15.json`](evidence/TC_chay_2026-11-15.json).

## 3. Kết quả từng test case (kết quả thật, lấy từ script)

| TC | Nội dung | Kết quả | Thực tế ghi nhận |
|---|---|---|---|
| TC01 | Đặt lịch hợp lệ | PASS | HTTP 201, trạng thái `PENDING`, chỗ trống 3 -> 2 |
| TC02 | Thiếu thông tin bắt buộc | PASS | HTTP 422 `VALIDATION_ERROR` |
| TC03 | Khung giờ đã qua | **SKIP** | CSDL chỉ có khung giờ từ ngày nạp trở đi nên không thử được qua API. Đã có test tự động `tests/test_booking.py::test_cannot_book_a_slot_in_the_past` (`SLOT_IN_PAST`), và `BOOKING_TOO_SOON` ở cùng tệp |
| TC04 | Khung giờ đủ 3/3 xe | PASS | HTTP 409 `SLOT_FULL`, còn 0 chỗ |
| TC05 | Trùng xe cùng khung giờ | PASS | HTTP 409 `VEHICLE_ALREADY_BOOKED` |
| TC06 | Hai khách tranh chỗ cuối (đặt đồng thời) | PASS | Hai yêu cầu đồng thời nhận `[201, 409]`, chỗ trống còn 0 |
| TC07 | Nhân viên xem và lọc danh sách | PASS | Lọc theo trạng thái và theo ngày đều trả đúng tập lịch |
| TC08 | Nhân viên xác nhận | PASS | HTTP 200, `CONFIRMED`, ghi `handled_by` |
| TC09 | Từ chối kèm lý do, trả chỗ | PASS | Thiếu lý do: 422. Có lý do: 200 `REJECTED`, chỗ 0 -> 1 |
| TC10 | Chặn thao tác sai trạng thái | PASS | `confirm` lần 2 và `complete` khi chưa bắt đầu đều 409 `INVALID_STATUS_TRANSITION` |
| TC11 | Đổi ngày nạp lại 8 khung giờ | PASS | Mỗi ngày kiểm tra đều có đúng 8 khung giờ |
| TC12 | Khách và nhân viên cùng thấy lịch vừa tạo | PASS | Phiếu có ở cả hai danh sách |

Ghi chú về lần chạy đầu: script ban đầu báo 3 ca lỗi (TC03, TC05, TC06). Nguyên nhân là **script đặt quá 3 lịch cho một khách** (BR11, `BOOKING_LIMIT_REACHED`) và CSDL không có khung giờ quá khứ; đó không phải lỗi của hệ thống. Script đã được sửa cho đúng quy tắc, không nới lỏng điều kiện kiểm tra.

## 4. Minh chứng trên giao diện (chạy thật, Backend thật)

| Ảnh | Nội dung |
|---|---|
| `evidence/UI01_DatLich_ThanhCong_TC01.jpg` | Khách đặt lịch, phiếu #1 "Chờ xác nhận", ô khung giờ đổi sang 1/3 |
| `evidence/UI02_KhachTheoDoi_F06.jpg` | Khách xem phiếu: bộ đếm, bộ lọc, stepper 4 bước, nhật ký (F06) |
| `evidence/UI03_NhanVien_TiepNhan_TC07_TC08.jpg` | Màn "Tiếp nhận và Điều phối" của nhân viên |
| `evidence/UI04_NhanVien_XacNhan_TC08.jpg` | Nhân viên xác nhận, nhật ký ghi thêm dòng `CONFIRMED` |
| `evidence/UI05_NhanVien_BatDau_F04.jpg`, `UI06_NhanVien_HoanTat_F04.jpg` | `start` và `complete`, phiếu đi hết 4 trạng thái |
| `evidence/UI07_KhachDoiLich_HopThoai_F05.jpg`, `UI08_KhachDoiLich_ThanhCong_F05.jpg` | Khách đổi lịch 10:00 sang 08:00, bộ đếm 1/2 |
| `evidence/UI09_QuanLy_BaoCao_F08.jpg` | Báo cáo thống kê 3 bảng, "Đồng bộ" |
| `evidence/UI10_QuanLy_DichVu_F01.jpg` | Quản lý dịch vụ: thêm gói và tạm ngừng chạy qua `POST` và `PATCH /services` |
| `evidence/UI11_DangXuat_DaSuaLoi_FE05.jpg` | Sau khi sửa lỗi FE-05: đăng xuất không còn hiện lịch hẹn của phiên cũ |

## 5. Nợ kỹ thuật ghi nhận (15/11/2026)

| # | Phát hiện | Người phụ trách gốc | Người thực hiện bù | Trạng thái |
|---|---|---|---|---|
| 1 | Báo cáo #40 bản gốc của Tri nêu tên tệp test không tồn tại (`test_tracking_f06.py`, `test_null_bytes.py`, `test_cancel_reschedule.py`, `test_slots.py`...) và số "139 test, 11 tệp"; thực tế là 169 test trong 7 tệp | Trần Ngọc Tôn Tri | Huỳnh Bảo Huy | Đã chạy lại toàn bộ, số liệu ở tài liệu này thay thế |
| 2 | TC07 bản gốc ghi PASS ngày 10/11 trong khi `GET /appointments` chỉ có trên Backend từ PR #6 (15/11) | Trần Ngọc Tôn Tri | Huỳnh Bảo Huy | Đã chạy lại, PASS |
| 3 | Ảnh minh chứng TC01-TC12 trong báo cáo gốc chưa đối chiếu được với lần chạy thật | Trần Ngọc Tôn Tri | Huỳnh Bảo Huy | Thay bằng ảnh ở mục 4 (chưa đủ ảnh cho TC02-TC06, TC09-TC11 trên giao diện; các ca này có bằng chứng ở mức API) |
| 4 | Lỗi FE-05: đăng xuất không xóa lịch hẹn và bộ đếm của phiên cũ | Trần Ngọc Tôn Tri (#43) | Huỳnh Bảo Huy | Đã sửa trong `frontend/app.js` (`handleLogout`) |
| 5 | TC03 chưa chạy được qua API | Nhóm | Huỳnh Bảo Huy | Có test tự động thay thế; muốn chạy tay cần CSDL có khung giờ quá khứ |
