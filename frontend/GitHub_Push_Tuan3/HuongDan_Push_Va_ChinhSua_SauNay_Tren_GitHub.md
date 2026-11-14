# HƯỚNG DẪN PUSH GIAO DIỆN TUẦN 3 LÊN GITHUB & CÁCH SỬA CHỮA DỄ DÀNG SAU NÀY

- **Kho mã nguồn nhóm:** `https://github.com/trvux/qldapm-datlich`
- **Phạm vi file của Trần Ngọc Tôn Tri (Tuần 3 — Việc #38 & #43):**
  - Chỉ nằm trong thư mục `frontend/` (`index.html`, `styles.css`, `app.js`, `README.md`) và `docs/testing/` (`Viec38_BaoCao_TheoDoi_TrangThai_LichHen_F06.md`, `Viec43_BaoCao_SuaLoi_Frontend.md`).
  - **Tuyệt đối không chạm vào** thư mục `backend/` và `db/` của Huỳnh Bảo Huy để đảm bảo **139/139 bài test Pytest** trên GitHub luôn chạy Pass 100% và không gây xung đột (conflict).

---

## CÁCH 1: ĐẨY LÊN TRỰC TIẾP QUA GITHUB WEB (NHANH NHẤT — 30 GIÂY, KHÔNG CẦN CÀI GIT)

Do máy tính hiện chưa cài đặt Git CLI (`git.exe`) và chưa lưu khóa đăng nhập GitHub trong Windows, bạn có thể đẩy lên GitHub Web y hệt như ở Tuần 2 chỉ với 3 bước:

### Bước 1: Tạo nhánh (hoặc cập nhật trên nhánh của bạn)
1. Mở trình duyệt vào: **`https://github.com/trvux/qldapm-datlich`**
2. Bấm vào ô chọn nhánh **`main`** (góc trên bên trái) -> gõ tên nhánh đúng quy ước `CONTRIBUTING.md`:
   - `feature/38-43-hoan-thien-frontend-sprint3`
   - Bấm **Create branch: feature/38-43-hoan-thien-frontend-sprint3 from 'main'** (hoặc chọn luôn nhánh `main` nếu nhóm thống nhất đẩy thẳng).

### Bước 2: Upload 4 file trong thư mục `frontend/`
1. Trên GitHub Web, bấm vào thư mục **`frontend/`** -> bấm nút **Add file** (góc phải) -> chọn **Upload files**.
2. Mở thư mục `d:\TT\Test\QLDAPM_TonTri_Tuan3\GitHub_Push_Tuan3\frontend\` trên máy tính của bạn, kéo thả 4 file sau vào trình duyệt:
   - `index.html`
   - `styles.css`
   - `app.js`
   - `README.md`
3. Ở khung **Commit changes** bên dưới, dán tiêu đề Commit đúng chuẩn Scrum của nhóm:
   ```text
   [#38][#43] Hoan thien giao dien thuong mai Frontend Sprint 3 va dong bo F05 F06 F08
   ```
4. Ở ô mô tả chi tiết (Extended description), dán:
   ```text
   - Toi uu giao dien thuong mai sach gon theo chuan shadcn/ui, Tailwind Design System va Vercel Web Design Guidelines
   - Hoan thien man hinh Lich hen cua toi (F06 - Viec #38), Doi/Huy lich hen (F05), Bao cao thong ke 3 bang (F08)
   - Khoa nut thao tac sai trang thai va dong bo kiem tra chan ky tu NUL (\u0000) tai Viec #43
   ```
5. Bấm nút xanh **Commit changes**.

### Bước 3: Tạo Pull Request để ghép vào `main` (nếu dùng nhánh `feature/...`)
1. Bấm **Compare & pull request** -> đặt tiêu đề:
   `[#38][#43] Hoàn thiện giao diện thương mại Frontend Sprint 3 (F05, F06, F08) & Sửa lỗi tích hợp`
2. Bấm **Create pull request** -> sau đó có thể bấm **Merge pull request** để cập nhật chính thức vào `main`.

---

## CÁCH 2: CHẠY SCRIPT TỰ ĐỘNG ĐẨY LÊN GITHUB API (`Push_Len_GitHub_Bang_Token.ps1`)

Nếu bạn có **GitHub Personal Access Token (PAT)** của tài khoản có quyền ghi vào repo `trvux/qldapm-datlich`:
1. Mở PowerShell và chạy lệnh:
   ```powershell
   powershell -ExecutionPolicy Bypass -File "d:\TT\Test\QLDAPM_TonTri_Tuan3\GitHub_Push_Tuan3\Push_Len_GitHub_Bang_Token.ps1" -Token "ghp_xxx..." -Branch "main"
   ```
2. Script sẽ tự động gọi trực tiếp GitHub REST API (không cần cài `git.exe`), đẩy từng file `frontend/index.html`, `frontend/styles.css`, `frontend/app.js`, `frontend/README.md` và `docs/testing/...` lên GitHub kèm đúng mã SHA để không bao giờ bị lỗi xung đột.

---

## CÁCH SỬA CHỮA GIAO DIỆN DỄ DÀNG VỀ SAU (TRÊN GITHUB WEB & VS CODE WEB)

Khi đã đẩy code lên `https://github.com/trvux/qldapm-datlich`, bất kỳ lúc nào bạn hoặc thành viên trong nhóm muốn chỉnh sửa giao diện sau này:

1. **Sửa trực tiếp bằng VS Code Web (Không cần cài phần mềm):**
   - Mở trang `https://github.com/trvux/qldapm-datlich` trên trình duyệt.
   - Nhấn phím **`.` (dấu chấm)** trên bàn phím (hoặc đổi địa chỉ từ `github.com` thành **`https://github.dev/trvux/qldapm-datlich`**).
   - Toàn bộ giao diện **Visual Studio Code Web** sẽ mở ra ngay trên trình duyệt của bạn!
2. **Cấu trúc 3 file cực kỳ dễ sửa trong `frontend/`:**
   - `frontend/index.html`: Chứa bố cục khung trang, tiêu đề, tên các Tab điều hướng (*Dịch vụ & Bảng giá*, *Đặt lịch hẹn*, *Lịch hẹn của tôi*, *Tiếp nhận & Điều phối*, *Báo cáo thống kê*, *Quản trị hệ thống*, *Tài khoản*).
   - `frontend/styles.css`: Chứa toàn bộ bảng màu thương mại ở ngay đầu file (`:root { --primary: #1d4ed8; --navy: #0f172a; ... }`). Muốn đổi tông màu chủ đạo hoặc bo góc chỉ cần sửa đúng biến ở dòng 5–30.
   - `frontend/app.js`: Chứa cấu hình địa chỉ máy chủ ở dòng 6 (`const API_BASE_URL = window.XYZ_API_URL || "http://localhost:8000";`), dữ liệu mẫu trải nghiệm ở mục `1.` và các hàm xử lý từng màn hình được chia theo đúng mục từ `1.` đến `9.`.
3. **Lưu và cập nhật lại lên GitHub:**
   - Sau khi sửa trong `github.dev`, bấm biểu tượng **Source Control** ở thanh bên trái -> nhập nội dung commit -> bấm **Commit & Push** là cập nhật tức thì lên GitHub!
