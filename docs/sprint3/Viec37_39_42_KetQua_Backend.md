# Kết quả Backend Sprint 3

**Việc #37, #39, #42 (Sprint 3, Câu 8)** · Người thực hiện: Huỳnh Bảo Huy · Branch: `feature/37-doi-huy-lich`
Môi trường: macOS (Apple Silicon), Python 3.15.0, PostgreSQL 18 (Docker), FastAPI 0.162

## 1. Phạm vi

| Việc | Nội dung | Trạng thái |
|---|---|---|
| #37 | Đổi và hủy lịch (F05, BR19-BR22) | **Xong Backend**, có test. Frontend của F05 chưa có. |
| #39 | Báo cáo thống kê (F08, BR24) | **Xong Backend**, có test. Frontend của F08 chưa có. |
| #42 | Sửa lỗi Backend | **Mới rà soát phía Backend**, tìm và sửa 1 lỗi. Chưa có danh sách lỗi từ Việc #40 (Tri chạy test) nên chưa sửa lỗi nào từ đó. |

Đặc tả request, response, mã lỗi: [`docs/api/Viec22_DacTa_API.md`](../api/Viec22_DacTa_API.md) mục 3.10, 3.11.

## 2. Cách chạy lại

```bash
cd backend
docker compose up -d
uv sync
uv run pytest -v
```

## 3. Kết quả

**133 / 133 test đạt** (79 của Sprint 2 + 54 mới). Chạy liên tiếp nhiều lần đều đạt, không chập chờn.

| Nhóm | File | Số test | Nội dung chính |
|---|---|---:|---|
| Đổi, hủy lịch (#37) | `backend/tests/test_change_cancel.py` | 31 | Hủy trả chỗ ngay (BR20); biên đúng 4 giờ (BR19); chỉ `PENDING`/`CONFIRMED` đổi hủy được; đổi lịch đưa lịch về `PENDING` (BR22); tối đa 2 lần đổi và lần đổi lỗi không bị tính; khung mới hết chỗ thì lịch cũ giữ nguyên (BR21); khung mới phải qua BR07-BR11; trùng xe; phân quyền và lịch người khác trả 404; đồng thời: bấm hủy 4 lần, 3 khách đổi vào 1 chỗ cuối, hủy-đổi-đặt chạm nhau không deadlock |
| Báo cáo (#39) | `backend/tests/test_reports.py` | 14 | Chỉ Quản lý; đếm theo ngày hẹn, trạng thái, dịch vụ; ba bảng luôn cộng đúng `total`; lọc khoảng ngày gồm hai đầu; dịch vụ đã ngừng chỉ hiện khi còn lịch cũ (BR05); khoảng ngày mặc định và giới hạn 366 ngày |
| Dữ liệu bất thường (#42) | `backend/tests/test_hardening.py` | 9 | ID vượt BIGINT, ký tự NUL trong chuỗi |

Kiểm tra bộ test có thật sự bắt lỗi: chèn thử 3 lỗi cố ý vào `appointments.py` (so sánh biên 4 giờ `<` thành `<=`, bỏ kiểm tra hạn 2 lần đổi, không đưa lịch về `PENDING` khi đổi). Cả 3 lần đều có test thất bại đúng chỗ, sau đó đã khôi phục code.

## 4. Quyết định thiết kế cho phần tài liệu BR chưa nói rõ

| Tình huống | Cách xử lý | Lý do |
|---|---|---|
| Đổi sang đúng khung giờ hiện tại | `422 SAME_SLOT` | "Đổi là đổi ngày giờ" (BR21); đổi sang chính nó không có nghĩa |
| Lịch `CONFIRMED` bị đổi | `handled_by` về `null` | Chưa có nhân viên nào xác nhận khung mới; lịch sử vẫn ghi ai đã xác nhận khung cũ |
| Lần đổi thất bại | Không tăng `change_count` | Chỉ lần đổi thành công mới làm khách mất một lượt |
| Thứ tự khóa | Dòng khách, rồi các khung giờ theo `slot_id` tăng dần, rồi dòng lịch | Cùng thứ tự với đặt lịch nên không deadlock |
| Báo cáo | Cả ba truy vấn chạy trong một snapshot `REPEATABLE READ` | Tổng ba bảng luôn khớp nhau kể cả khi có khách đặt lịch giữa chừng |

## 5. Lỗi đã tìm và sửa (Việc #42)

Phương pháp: đọc toàn bộ `backend/app/`, rồi viết test đưa dữ liệu bất thường vào mọi điểm nhập (đường dẫn, JSON body, chuỗi). Chưa đo tải.

| # | Lỗi | Mức độ | Sửa |
|---|---|---|---|
| 1 | Chuỗi có ký tự NUL (`\x00`) làm PostgreSQL ném `DataError`, API trả **500** `INTERNAL_ERROR`. Tái hiện ở `POST /auth/login` (email), và cùng cơ chế ở ghi chú, hãng xe, lý do từ chối. | Thấp: không lộ dữ liệu, nhưng báo lỗi hệ thống sai và đầy log | `app/errors.py`: thêm handler cho `psycopg.DataError`, trả `422 VALIDATION_ERROR`. Test: `test_hardening.py` |

Đã thử và **không** thấy lỗi: ID quá lớn ở đường dẫn và body (đều trả 404 hoặc 422, không 500).

## 6. Giới hạn đã biết, chưa làm

- Chưa giới hạn số lần đăng nhập sai (đã ghi ở mục 7 của tài liệu API). Không sửa vì ngoài phạm vi đã chốt.
- Chưa chạy qua giao diện: Frontend F05, F08 chưa có. Khi Tri xong, cần một lượt chạy tay (Việc #40).
- Chưa đo hiệu năng khi nhiều người dùng. Pool kết nối tối đa 10.
- **Việc #42 còn mở:** khi Tri đưa danh sách lỗi từ #40, cần sửa tiếp phần Backend và chạy lại bộ test này.
