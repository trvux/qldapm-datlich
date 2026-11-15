# Việc #38: Theo dõi trạng thái lịch hẹn (F06)

**Sprint 3, Câu 8** · Người phụ trách thẻ: Trần Ngọc Tôn Tri (Frontend) · Backend: Huỳnh Bảo Huy
Môi trường kiểm tra: macOS (Apple Silicon), Python 3.15.0, PostgreSQL 18 (Docker), FastAPI 0.162

## 1. Kết luận

**Xong.** Khách xem được trạng thái hiện tại và toàn bộ lịch sử chuyển trạng thái của lịch hẹn mình đặt. Backend có test đạt; Frontend đã có giao diện theo dõi đọc đúng dữ liệu đó.

Chuỗi trạng thái đúng BR17: `PENDING -> CONFIRMED -> IN_PROGRESS -> COMPLETED`, hoặc `REJECTED` / `CANCELLED`.

## 2. Phần Backend

| Cần cho F06 | Endpoint | Ghi chú |
|---|---|---|
| Danh sách lịch của khách | `GET /appointments` | Khách chỉ thấy lịch của mình (BR23); lọc `status`, `date`, `from`, `to` |
| Chi tiết và timeline | `GET /appointments/{id}` | Mảng `history` sắp theo thời gian, mỗi dòng có `old_status`, `new_status`, `changed_by`, `changed_at`, `note` |
| Nhân viên đẩy trạng thái | `confirm`, `reject`, `start`, `complete` | Mỗi bước ghi một dòng `history` |

Đặc tả đầy đủ: [`docs/api/Viec22_DacTa_API.md`](../api/Viec22_DacTa_API.md) mục 3.8, 3.9, 3.9b, 3.9c.

### Bằng chứng kiểm thử

Chạy `cd backend && uv run pytest -q` ngày 15/11/2026: **169 passed**.

| Test | Chứng minh điều gì |
|---|---|
| `test_staff_and_services.py::test_full_lifecycle_and_slot_occupancy` | Một lịch đi hết 4 bước; khách đọc lại thấy `history` đúng thứ tự `(None,PENDING) -> (PENDING,CONFIRMED) -> (CONFIRMED,IN_PROGRESS) -> (IN_PROGRESS,COMPLETED)`, có `changed_by` của người bấm từng bước |
| `test_e2e_flow.py::test_full_customer_to_staff_flow` | Sau khi nhân viên xác nhận, khách thấy trạng thái mới và 2 dòng lịch sử |
| `test_staff_and_services.py::test_customer_sees_only_own_staff_and_manager_see_all` | Khách chỉ thấy lịch của mình, nhân viên và quản lý thấy tất cả |
| `test_staff_and_services.py::test_cannot_skip_or_reverse_br17` | Không nhảy cóc, không đi ngược trạng thái |

## 3. Phần Frontend

Mã: `frontend/GitHub_Push_Tuan3/frontend/app.js`.

- `buildStepperHtml` vẽ 4 bước (Đã gửi yêu cầu, Đã xác nhận, Đang thực hiện, Hoàn thành); với `REJECTED` hoặc `CANCELLED` hiện nhánh kết thúc kèm lý do.
- Phần chi tiết dựng timeline từ `history` của lịch được chọn.
- Có hai chế độ: dữ liệu mô phỏng và gọi API thật (nhãn "Trực tuyến (Máy chủ đã kết nối)").

## 4. Chưa kiểm chứng

- Tôi chưa bấm thử luồng F06 trên giao diện (đặt lịch, nhân viên xác nhận, khách xem timeline) ở chế độ API thật; mới kiểm chứng ở mức API bằng test và đọc mã Frontend. Việc #40 (Tri) cần chạy tay luồng này.
- Đường dẫn Frontend hiện là `frontend/GitHub_Push_Tuan3/frontend/`, chưa đúng `frontend/`; hướng dẫn cài đặt trong Viec48 vẫn ghi `cd frontend`.
