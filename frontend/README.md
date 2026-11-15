# Frontend - Hệ thống Quản lý Đặt lịch Bảo dưỡng và Sửa chữa Ô tô Trực tuyến XYZ

Thư mục `frontend/` chứa toàn bộ mã nguồn giao diện người dùng (Single-Page Web Application) do thành viên **Trần Ngọc Tôn Tri** xây dựng và hoàn thiện qua **Sprint 2 (Việc #24, #26, #31)** và **Sprint 3 (Việc #38, #43, #48)**.

## 1. Các màn hình chức năng đã hoàn thiện (Bao phủ 100% F01 – F09)

1. **Màn hình Đăng nhập & Phân quyền (`#view-login` — F09, Việc #24):**
   - Đăng nhập bằng `email` + `password` (`POST /auth/login`), lưu JWT token và khôi phục phiên qua `GET /auth/me`.
   - Hiển thị đúng thanh điều hướng theo 4 chế độ (`GUEST`, `CUSTOMER`, `STAFF`, `MANAGER`).
   - Xử lý tài khoản bị khóa (`403 ACCOUNT_DISABLED` — BR02) và hỗ trợ 6 nút điền nhanh tài khoản mẫu kiểm thử.
2. **Màn hình Tra cứu Dịch vụ Công khai & Quản trị Dịch vụ (`#view-services` — F01, F02, Việc #26):**
   - Khách vãng lai và Khách hàng tra cứu 7 dịch vụ đang hoạt động (`GET /services`), lọc theo thời lượng, xem hộp thoại chi tiết (`GET /services/{id}`) và chuyển thẳng sang đặt lịch.
   - Quản lý (`MANAGER`) thêm dịch vụ mới (`POST /services`), sửa thông tin và chuyển trạng thái **Ngừng hoạt động / Kích hoạt lại** (`PATCH /services/{id}` — tuân thủ BR05 không xóa cứng dịch vụ).
3. **Màn hình Đặt lịch Trực tuyến & Lưới 8 Khung giờ (`#view-booking` — F03, F07, Việc #31):**
   - Quản lý danh sách **Xe của tôi** (`GET /vehicles`, `POST /vehicles` — chặn trùng biển số `409 LICENSE_PLATE_EXISTS`).
   - Hiển thị lưới **8 khung giờ 60 phút** (4 ca sáng `08:00–12:00`, dải **Nghỉ trưa cố định `12:00–13:00`**, 4 ca chiều `13:00–17:00` — BR07) kèm số lượng xe đã đặt `booked/max_capacity` (tối đa 3 xe/ca — BR08).
   - Tự động khóa các ô `bookable = false` kèm nhãn lý do (`FULL`, `IN_PAST`, `TOO_SOON`, `TOO_FAR`) và tự động tải lại lưới khung giờ khi gặp `409 SLOT_FULL` (BR13).
4. **Màn hình Theo dõi Trạng thái, Đổi & Hủy Lịch hẹn (`#view-tracking` — F05, F06, Việc #38 & #43):**
   - Dải thẻ KPI đếm theo 6 trạng thái, bộ lọc theo trạng thái/khoảng ngày, thanh tiến trình 4 bước (Visual Stepper) và Nhật ký chuyển trạng thái (`history` — BR25).
   - Tích hợp hộp thoại **Đổi lịch hẹn nguyên tử** (`POST /appointments/{id}/reschedule` — kiểm soát tối đa 2 lần đổi `change_count <= 2` theo BR22) và nút **Hủy lịch hẹn** (`POST /appointments/{id}/cancel` — BR19, BR20).
5. **Màn hình Nhân viên Tiếp nhận & Xử lý Lịch hẹn (`#view-lookup` — F04, Việc #27, #32 & #43):**
   - Xem và lọc toàn bộ lịch hẹn toàn hệ thống, tra cứu theo mã lịch, thực hiện **Xác nhận (`confirm`)**, **Từ chối kèm lý do bắt buộc (`reject` — hoàn trả chỗ trống)**, **Bắt đầu thực hiện (`start`)** và **Hoàn thành (`complete`)** theo đúng State Machine BR15–BR17.
6. **Màn hình Báo cáo Thống kê 3 Bảng cho Quản lý (`#view-reports` — F08, Việc #39 & #43):**
   - Truy vấn `GET /reports/appointments?from=&to=`, hiển thị tổng số lịch hẹn (`total`) và 3 bảng thống kê (`by_date`, `by_status` đủ 6 trạng thái, `by_service`) kèm kiểm chứng tự động `sum(by_date) == sum(by_status) == sum(by_service) == total` (BR24).

## 2. Cách khởi chạy Frontend ở cổng `3000`

```bash
cd frontend
python run_frontend.py
```

Hoặc nhấp đúp tệp `Chay_Frontend_Port3000.bat` trên Windows. Mở trình duyệt tại: **`http://localhost:3000`**.
