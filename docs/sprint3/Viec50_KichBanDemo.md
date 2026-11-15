# Việc #50: Kịch bản demo (tập dượt kỹ thuật)

**Sprint 3, Câu 8** · Người phụ trách thẻ: Trần Ngọc Tôn Tri · Người thực hiện bù: Huỳnh Bảo Huy (nợ kỹ thuật)
Thời lượng dự kiến: **8 đến 10 phút**. Luồng này đã được chạy thật ngày 15/11/2026 trên Backend và Frontend thật (ảnh: `evidence/UI01` đến `UI11`).

## 1. Chuẩn bị trước giờ demo (3 phút, làm một lần)

```bash
cd backend
docker compose up -d                          # PostgreSQL 18, cổng 5434
cp .env.example .env                          # lần đầu: rồi đổi JWT_SECRET
uv sync
uv run uvicorn app.main:app --port 8000       # cửa sổ 1
cd ../frontend && python3 run_frontend.py     # cửa sổ 2, mở http://localhost:3000
```

- Kiểm tra: `http://localhost:8000/health` trả `{"status":"ok"}`; góc trên giao diện hiện **"Trực tuyến (Máy chủ đã kết nối)"**.
- Muốn bắt đầu với dữ liệu sạch (không có lịch hẹn): `docker exec datlich-postgres psql -U datlich -d datlich -c "TRUNCATE appointment_status_history, appointments RESTART IDENTITY;"`
- Nếu máy chấm không bật được Docker: giao diện tự chuyển sang **"Chế độ Trải nghiệm"** với dữ liệu mẫu; nói rõ với người xem đây là dữ liệu mô phỏng.
- Tài khoản: thẻ đăng nhập nhanh ở tab "Tài khoản" (Khách hàng 1, Cố vấn dịch vụ, Quản lý). Chi tiết ở `docs` của Việc #48.

## 2. Kịch bản từng bước

| Phút | Vai | Thao tác | Nói gì / chứng minh gì |
|---|---|---|---|
| 0:00 | Khách vãng lai | Mở tab "Dịch vụ và Bảng giá" | Danh mục 7 gói từ API (F01, F02); gói đã ngừng không hiện (BR05) |
| 1:00 | Khách 1 | Đăng nhập, tab "Đặt lịch hẹn", chọn xe, dịch vụ, ô 08:00 ngày mai, bấm "Xác nhận Đặt lịch hẹn" | Phiếu #1 "Chờ xác nhận"; ô khung giờ đổi 0/3 thành 1/3 ngay (giữ chỗ, BR14) |
| 2:30 | Khách 1 | Tab "Lịch hẹn của tôi" | Bộ đếm theo trạng thái, stepper 4 bước, nhật ký (F06) |
| 3:30 | Khách 1 | "Đổi khung giờ / gói dịch vụ", chọn 10:00, xác nhận | Bộ đếm đổi lịch 1/2 (BR22), nhật ký ghi "Đổi lịch" (F05) |
| 4:30 | Nhân viên | Đăng nhập, tab "Tiếp nhận và Điều phối", tra cứu phiếu #1, "Xác nhận" | Phiếu chuyển "Đã xác nhận", ghi nhân viên phụ trách (BR16) |
| 5:30 | Nhân viên | "Tiếp nhận xe vào xưởng", rồi "Hoàn tất và Bàn giao" | Đi đúng một chiều, không nhảy cóc (BR17); các nút sai bước bị khóa |
| 6:30 | Nhân viên | Tab "Lịch hẹn": lọc theo trạng thái và ngày | Nhân viên thấy lịch của tất cả khách (BR18) |
| 7:00 | Khách 1 | Quay lại "Lịch hẹn của tôi" | Timeline đủ 4 bước kèm người thực hiện (F06) |
| 7:30 | Quản lý | Tab "Báo cáo thống kê" | 3 bảng khớp tổng: theo ngày, trạng thái, dịch vụ (F08, BR24) |
| 8:30 | Quản lý | Tab "Quản trị hệ thống": thêm gói, tạm ngừng gói | F01; không có nút xóa (BR05) |
| 9:00 | Cả nhóm | Mở `docs/sprint3/Viec40_KetQua_ChayTestCase.md` và chạy `uv run pytest -q` | 11/12 test case đạt, 169 test tự động đạt |

## 3. Câu hỏi thường gặp và cách trả lời

- **Vì sao không có SMS nhắc lịch?** Change Request #28 đã được phân tích và hoãn sang Release 2 để bảo vệ phạm vi cốt lõi (Risk Register R1, R12).
- **Hai người đặt chỗ cuối cùng cùng lúc thì sao?** Khóa dòng `SELECT ... FOR UPDATE`: một người nhận 201, người kia 409 `SLOT_FULL` (TC06, có test đồng thời).
- **Khách có thấy lịch của khách khác không?** Không; lịch của người khác trả 404 (BR23).

## 4. Điều kiện chưa đạt (nợ kỹ thuật)

- Chưa tập dượt **cả nhóm cùng lúc** (cần 3 người). Phần tập kỹ thuật trên máy do Huỳnh Bảo Huy chạy ngày 15/11/2026.
- Bộ slide (Việc #44) và bộ đóng gói (Việc #48) là đầu vào của buổi tập dượt chính thức; xem trạng thái ở Trello.
