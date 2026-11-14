# BÁO CÁO KỸ THUẬT SPRINT 3 (VIỆC #43): SỬA LỖI, TỐI ƯU GIAO DIỆN THƯƠNG MẠI & HOÀN THIỆN FRONTEND

- **Dự án:** Hệ thống Quản lý Đặt lịch Bảo dưỡng và Sửa chữa Ô tô Trực tuyến — Trung tâm Dịch vụ Ô tô XYZ
- **Học phần:** Quản lý dự án phần mềm (`71ITSE41503`) — Lớp `261_71ITSE41503_01`
- **Người thực hiện:** Trần Ngọc Tôn Tri (Dev Team / Frontend & QA)
- **Phối hợp tích hợp:** Huỳnh Bảo Huy (Backend #37, #39, #42) & Nguyễn Minh Quang (Test Case #30)

---

## 1. Tổng quan phạm vi hoàn thiện Frontend tại Việc #43

1. **Tích hợp đầy đủ các chức năng Sprint 3 (F05, F08, F04):**
   - Tích hợp hộp thoại **Thay đổi Thời gian / Gói Dịch vụ Lịch hẹn** (`POST /appointments/{id}/reschedule`) và nút **Hủy lịch hẹn** (`POST /appointments/{id}/cancel`) trên màn hình **Lịch hẹn của tôi**.
   - Xây dựng màn hình **Báo cáo thống kê** (`GET /reports/appointments?from=&to=`) dành cho Quản lý Trung tâm với 3 bảng thống kê song song (*Sản lượng theo Ngày hẹn*, *Cơ cấu theo Trạng thái*, *Tỷ trọng theo Gói Dịch vụ*) và chỉ số đối soát đồng bộ dữ liệu.
   - Bổ sung thao tác **Tiếp nhận xe vào xưởng** (`/start`) và **Hoàn tất & Bàn giao xe** (`/complete`) cho Cố vấn dịch vụ.
2. **Nâng cấp toàn diện Giao diện Thương mại (Commercial UI/UX Polish):**
   - Áp dụng bộ quy chuẩn thiết kế **shadcn/ui**, **Tailwind Design System** và **Vercel Web Design Guidelines**: bảng màu trung tính `Slate/Zinc` kết hợp điểm nhấn `Royal Blue (#1D4ED8)`, chữ số `tabular-nums`, thanh Header kính mờ cố định (`backdrop-filter: blur(12px)`), hệ thống Card/Modal/Badge tinh gọn.
   - **Loại bỏ toàn bộ chú thích học thuật/kỹ thuật trên giao diện:** Ẩn toàn bộ nhãn mã việc (`Việc #24..#43`), mã quy tắc (`BR01..BR25`), mã chức năng (`F01..F09`), mã wireframe (`WF-01..WF-05`) và đường dẫn endpoint thô khỏi màn hình người dùng cuối.
   - **Phân quyền hiển thị thanh điều hướng thông minh:** Tự động ẩn các tab nội bộ (*Tiếp nhận & Điều phối*, *Báo cáo thống kê*, *Quản trị hệ thống*) khi người dùng là Khách vãng lai hoặc Khách hàng để giao diện gọn gàng, tránh rối mắt; đồng thời tích hợp thanh chuyển nhanh vai trò trải nghiệm trên Header.
3. **Khắc phục triệt để 4 lỗi giao diện & đồng bộ dữ liệu (`FE-01` đến `FE-04`):**
   - `FE-01`: Reset lựa chọn khung giờ cũ khi khách hàng đổi ngày hẹn trên biểu mẫu đặt lịch (Pass `TC11`).
   - `FE-02`: Đồng bộ hiển thị lý do từ chối/hủy lịch giữa Backend và Frontend (Pass `TC09`).
   - `FE-03`: Khóa chặt các nút thao tác khi lịch hẹn đã ở trạng thái kết thúc `COMPLETED`, `CANCELLED`, `REJECTED` (Pass `TC10`).
   - `FE-04`: Đồng bộ bộ lọc chặn ký tự `NUL (\x00)` trả về `422 VALIDATION_ERROR` ở chế độ trải nghiệm độc lập, khớp 100% với bản vá `#42` của Backend.
