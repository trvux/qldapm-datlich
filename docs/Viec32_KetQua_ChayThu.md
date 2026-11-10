# Kết quả chạy thử luồng đặt lịch từ đầu đến cuối

**Việc #32 (Sprint 2, Câu 8)** · Người thực hiện: Huỳnh Bảo Huy · Effort kế hoạch: 1,5 giờ
Ngày chạy: 10/11/2026 · Môi trường: macOS (Apple Silicon), Python 3.15.0, PostgreSQL 18 (Docker), FastAPI 0.162

## 1. Phạm vi: đã kiểm và chưa kiểm

Luồng theo đề: *Khách xem dịch vụ → chọn thời gian → đặt lịch → hệ thống kiểm tra điều kiện → lưu lịch hẹn → nhân viên xác nhận lịch.*

| Phần | Trạng thái | Ghi chú |
|---|---|---|
| Backend + PostgreSQL (Việc #23, #25, #29) | **Đã kiểm** | Gọi API thật qua HTTP trên PostgreSQL thật, 79 test |
| Nhân viên xác nhận / từ chối (F04) | Đã kiểm **bản tối thiểu của Huy** | Bản đầy đủ là Việc #27 (Quang); khi Quang xong cần chạy lại bộ test này |
| Giao diện đặt lịch (Việc #31) | **Chưa kiểm** | Chưa có Frontend để chạy cùng. Việc #32 theo kế hoạch phụ thuộc #29, #27, #31, nên **#32 mới hoàn thành phần Backend** |

Nói cách khác: luồng đã chạy thông ở tầng API, chưa chạy thông qua giao diện. Khi Tri xong #31, cần một lượt chạy tay trên giao diện (mục 5).

## 2. Cách chạy lại

```bash
docker compose up -d     # PostgreSQL ở cổng 5434
uv sync
uv run pytest -v
```

Bộ test tự tạo database `datlich_test` từ `db/schema.sql`, `seed.sql`, `slots.sql`, bật uvicorn thật và gọi bằng HTTP; mỗi test bắt đầu từ trạng thái sạch. Không đụng tới database `datlich` dùng để demo.

## 3. Kết quả

**79 / 79 test đạt.** Chạy liên tiếp 5 lần, lần nào cũng 79/79 (không flaky). Thời gian mỗi lần khoảng 5 giây.

| Nhóm | File | Số test | Nội dung chính |
|---|---|---:|---|
| Đăng nhập, phân quyền (#25) | `tests/test_auth.py` | 24 | 3 vai trò đăng nhập, sai mật khẩu và email lạ trả lỗi giống nhau, tài khoản khóa (BR02), mật khẩu lưu dạng băm (BR01), token giả/hết hạn/ký sai khóa/`alg=none`/thiếu `exp` đều bị từ chối, khóa tài khoản có hiệu lực ngay, ma trận quyền (BR03) |
| Đặt lịch và quy tắc (#29) | `tests/test_booking.py` | 42 | Thành công và trạng thái ban đầu (BR14), hết chỗ (BR09), trả chỗ khi từ chối (BR15), chống trùng xe (BR11), giới hạn 3 lịch (BR11), xe của người khác (BR12), dịch vụ ngừng (BR05), giờ làm việc (BR07), biên 2 giờ và 14 ngày (BR10), cấu hình sức chứa (F07), thêm xe và biển số duy nhất |
| Luồng đầu-cuối và đồng thời (#32) | `tests/test_e2e_flow.py` | 13 | Luồng đầy đủ khách → nhân viên, luồng từ chối, không xử lý lịch hai lần, quyền xem lịch (BR23), đặt đồng thời (BR13) |

### Luồng chính đã chạy thông

| Bước | Kết quả |
|---|---|
| 1. Khách xem 7 dịch vụ đang hoạt động (1 dịch vụ ngừng bị ẩn) | Đạt |
| 2. Khách lấy danh sách xe và khung giờ còn chỗ | Đạt |
| 3. Đặt lịch, trả `201`, trạng thái `PENDING` | Đạt |
| 4. Chỗ được giữ ngay: `remaining` giảm 1 trước khi nhân viên xác nhận (BR14) | Đạt |
| 5. Nhân viên xác nhận, `handled_by` là nhân viên đó (BR16) | Đạt |
| 6. Khách thấy `CONFIRMED`, lịch sử có 2 dòng (`null→PENDING`, `PENDING→CONFIRMED`) | Đạt |
| 7. Xác nhận không làm đổi số chỗ | Đạt |

### Đặt đồng thời (BR13, rủi ro R7)

| Kịch bản | Kỳ vọng | Kết quả |
|---|---|---|
| 6 yêu cầu cùng lúc vào khung giờ còn 2 chỗ (lặp 5 vòng, 5 khung khác nhau) | Đúng 2 thành công, 4 `SLOT_FULL` | Đạt cả 5 vòng |
| 1 khách gửi 6 yêu cầu cùng lúc vào 6 khung khác nhau | Đúng 3 lịch được lưu, 3 `BOOKING_LIMIT_REACHED` | Đạt |
| Bấm đúp (4 yêu cầu giống hệt) | 1 thành công, 3 `VEHICLE_ALREADY_BOOKED` | Đạt |

**Kiểm chứng test có bắt được lỗi thật.** Mình tạm bỏ từng cơ chế khóa rồi chạy lại:

| Cố tình làm hỏng | Test đồng thời phản ứng |
|---|---|
| Bỏ `SELECT ... FOR UPDATE` trên khung giờ | 4/5 vòng **đỏ** (vượt sức chứa) |
| Bỏ khóa dòng khách hàng | Test giới hạn 3 lịch **đỏ** |

Đã khôi phục nguyên vẹn sau khi thử. Vòng còn lại của lần thử thứ nhất vẫn đạt là do hai yêu cầu may mắn không chồng lên nhau; đó là bản chất của lỗi tranh chấp, vì vậy test chạy nhiều vòng.

## 4. Danh sách lỗi và vấn đề phát hiện

Không có lỗi nào còn mở ở Backend trong phạm vi đã kiểm. Các vấn đề gặp trong lúc làm:

| # | Mức | Vấn đề | Trạng thái |
|---|---|---|---|
| 1 | Thấp | Lỗi trong chính mã test (dùng `with` trên `httpx.Client` đã mở) làm 60/79 test báo lỗi lần chạy đầu | Đã sửa, không phải lỗi sản phẩm |
| 2 | Trung bình | **Wireframe WF-03 dùng 4 ca 2 giờ, trong khi BR07 và CSDL dùng 8 khung 1 giờ** | **Mở**, cần cả nhóm chọn hướng, xem `Viec22_DacTa_API.md` mục 8 |
| 3 | Thấp | Wireframe nhập tay biển số, API chọn xe từ danh sách | Mở, Frontend xử lý theo gợi ý ở mục 8 của tài liệu API |
| 4 | Thấp | Thông báo trong `details` của `VALIDATION_ERROR` do thư viện sinh bằng tiếng Anh | Chấp nhận, đã ghi chú cho Frontend; dịch theo `field` |
| 5 | Thấp | Chưa giới hạn số lần đăng nhập sai | Chấp nhận cho đồ án, ghi ở tài liệu API mục 7 |

## 5. Còn lại để đóng Việc #32

1. Chạy lại `uv run pytest` sau khi Quang xong #27 (thay bản `confirm`/`reject` tối thiểu).
2. Khi Tri xong #31: chạy tay luồng ở mục 3 trên giao diện và chụp màn hình minh chứng (phục vụ Việc #40).
3. Nhóm chốt vấn đề #2 (khung giờ).

## 6. Giờ công

Chưa ghi giờ thực tế cho Sprint 2 vào bảng EVM (Việc #2), cần Huy tự điền theo thời gian thật; kế hoạch: #22 1,0h, #23 2,5h, #25 2,5h, #29 7,0h, #32 1,5h, tổng 14,5h.
