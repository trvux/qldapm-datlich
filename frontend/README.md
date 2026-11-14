# Frontend

Người phụ trách: Trần Ngọc Tôn Tri. Thư mục này **chưa có code**; dựng giao diện ở Việc #24 (khung giao diện + trang đăng nhập).

Công nghệ đề bài không ràng buộc phần giao diện. Gợi ý Next.js (chưa chốt, Tri quyết định và ghi lại ở đây):

```bash
cd frontend
npx create-next-app@latest .
```

## Nối với Backend

- Backend chạy ở `http://localhost:8000` (xem `backend/README.md`). Đặt vào biến môi trường, đừng gõ cứng:
  `NEXT_PUBLIC_API_URL=http://localhost:8000` (file `.env.local`, không đưa lên Git).
- Backend đã cho phép CORS từ `http://localhost:3000`.
- **Hợp đồng API:** [`docs/api/Viec22_DacTa_API.md`](../docs/api/Viec22_DacTa_API.md) (mục 2 danh sách endpoint, mục 5 luồng gọi màn hình đặt lịch). Bản máy đọc được: [`docs/api/openapi.json`](../docs/api/openapi.json), import được vào Postman.
- Tài khoản demo để đăng nhập thử: `backend/README.md`.
- Frontend chỉ cần xử lý theo `error.code` trong response lỗi, không cần tự kiểm tra giờ làm việc hay giới hạn lịch; Backend đã kiểm tra.

## Việc cần làm trước khi code Việc #31 (màn hình đặt lịch)

Wireframe đang lệch quy tắc nghiệp vụ: vẽ 4 "Ca" 2 giờ, trong khi quy tắc và CSDL là **8 khung 1 giờ**. Cần sửa wireframe trước, xem `docs/api/Viec22_DacTa_API.md` mục 8 và mục "Sửa wireframe" bên dưới.

### Dữ liệu đúng để vẽ

- 8 khung mỗi ngày: 08:00-09:00, 09:00-10:00, 10:00-11:00, 11:00-12:00, 13:00-14:00, 14:00-15:00, 15:00-16:00, 16:00-17:00. Nghỉ trưa 12:00-13:00 không có ô. Không có Chủ nhật.
- Mỗi khung tối đa 3 xe. Mỗi ô hiển thị "Đã đặt x/3". Ô đủ 3 xe là "HẾT CHỖ".
- Ô không đặt được (đã qua, còn dưới 2 giờ, xa hơn 14 ngày) cần tô mờ. API trả sẵn `bookable` và `closed_reason`.

### Sửa wireframe

| Màn | Cần sửa |
|---|---|
| WF-03 Đặt lịch | Thay 4 nút "Ca" bằng lưới 8 ô (4 sáng, 4 chiều, tách bằng nhãn nghỉ trưa). Ô xe: dropdown "Xe của tôi" + nút "Thêm xe mới" (biển số, hãng, dòng, năm) thay vì nhập tay. |
| WF-04 Theo dõi, đổi/hủy | Đổi "Ca 1 (08:00-10:00)" thành "08:00-09:00" ở thẻ lịch và 2 dòng bảng (`13:00-15:00` thành `13:00-14:00`). Thống nhất kiểu mã lịch với WF-05. Thanh trạng thái thêm "Bị từ chối" và "Đã hủy". |
| WF-05 Nhân viên | Bỏ 4 ô Ca ở đầu danh sách hoặc đổi thành 8 ô theo giờ (bộ lọc Ngày và Lọc đã có, giữ nguyên). Cột "Khung giờ" ghi theo 1 giờ. Nút "Từ chối" cần ô nhập lý do (BR15). Tab 2 đổi `(F01)` thành `(F02)` (BR03). Sửa chỗ số điện thoại đè lên cột Biển số. |
| WF-07 Báo cáo | Biểu đồ "Hiệu suất theo Ca 1-4" đổi thành theo 8 khung giờ, hoặc bỏ. BR24 chỉ yêu cầu thống kê theo ngày hẹn, trạng thái, dịch vụ. |
| Frame tổng `00_TAT_CA_7_MAN_HINH` | Cập nhật lại sau khi sửa các màn trên. |
