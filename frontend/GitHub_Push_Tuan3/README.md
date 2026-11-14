# QLDAPM - Hệ thống Quản lý Đặt lịch Bảo dưỡng và Sửa chữa Ô tô Trực tuyến XYZ (Release v1.0)

Đồ án môn **Quản lý dự án phần mềm (71ITSE41503)**, lớp `261_71ITSE41503_01`, HK1 (2026–2027), Khoa Công nghệ Thông tin, Trường Đại học Văn Lang.  
Đề tài: **Xây dựng hệ thống đặt lịch bảo dưỡng và sửa chữa ô tô trực tuyến cho Trung tâm Dịch vụ Ô tô XYZ**, thực hiện theo mô hình **Scrum** trong 3 tuần (3 Sprint: `23/10/2026 – 12/11/2026`).

## 1. Thành viên nhóm & Phân công trong Repo

| Thành viên | Vai trò Scrum | Phụ trách chính trong Repo |
|---|---|---|
| **Nguyễn Minh Quang** | Scrum Master & PM | `docs/`, Quản lý lịch hẹn Nhân viên F04 (`#27`), Acceptance Criteria (`#21`), Change Request SMS (`#28`), Bộ 12 Test Case (`#30`), EVM 3 kỳ (`#16, #20, #36, #45`) |
| **Huỳnh Bảo Huy** | Product Owner & Backend | `backend/` — Thiết kế CSDL (`#10, #23`), Đặc tả API (`#22`), Auth JWT (`#25`), Đặt lịch & Sức chứa (`#29`), Đổi/Hủy lịch F05 (`#37`), Báo cáo thống kê F08 (`#39`), Kiểm thử & Sửa lỗi Backend (`#32, #42`) |
| **Trần Ngọc Tôn Tri** | Development Team (Frontend & QA) | `frontend/` & `docs/testing/` — Wireframe Figma (`#11`), Khung giao diện & Đăng nhập F09 (`#24`), Dịch vụ F01/F02 (`#26`), Đặt lịch 8 khung giờ F03/F07 (`#31`), Theo dõi trạng thái F06 (`#38`), Sửa lỗi & hoàn thiện UI F05/F08 (`#43`), Thực thi Test Case & Biên bản kiểm thử (`#40, #47`), Đóng gói Release (`#48`) |

- **Bảng công việc Trello (52 đầu việc):** https://trello.com/b/hfSS40aF
- **Kho mã nguồn GitHub:** https://github.com/trvux/qldapm-datlich

---

## 2. Cấu trúc thư mục

```text
qldapm-datlich/
├── backend/                  # FastAPI + PostgreSQL 18 (Python 3.12+)
│   ├── app/                  # Mã nguồn xử lý nghiệp vụ BR01–BR25 & 18 API endpoints
│   ├── db/                   # schema.sql (6 bảng 3NF), seed.sql, slots.sql (192 khung giờ)
│   ├── scripts/              # reset_db.py (khôi phục dữ liệu mẫu sạch)
│   ├── tests/                # 139 bài kiểm thử tự động Pytest (Pass 100%)
│   └── docker-compose.yml    # Container PostgreSQL 18-alpine (cổng 5434)
├── frontend/                 # Giao diện Web SPA hoàn chỉnh (F01–F09)
│   ├── index.html            # 6 màn hình chức năng khớp 100% Wireframe v2.0
│   ├── styles.css            # Giao diện chuẩn Responsive
│   ├── app.js                # Kết nối Live API :8000 + Chế độ Mô phỏng Fallback
│   ├── run_frontend.py       # Máy chủ chạy Frontend tại http://localhost:3000
│   └── Chay_Frontend_Port3000.bat
└── docs/
    ├── api/                  # Đặc tả API (Viec22_DacTa_API.md) & openapi.json
    ├── db/                   # Báo cáo CSDL & dữ liệu mẫu (Viec23)
    ├── sprint2/              # Báo cáo chạy thử E2E cuối Sprint 2 (Viec32)
    ├── sprint3/              # Báo cáo kết quả Backend Sprint 3 (Viec37_39_42)
    └── testing/              # Báo cáo kiểm thử TC01–TC12, biên bản #47 & hướng dẫn #48
```

---

## 3. Hướng dẫn cài đặt và chạy nhanh (Quick Start — Việc #48)

### Bước 1: Khởi chạy Cơ sở dữ liệu PostgreSQL 18 & Backend API (`http://localhost:8000`)

```bash
cd backend
cp .env.example .env          # Trên Windows PowerShell: copy .env.example .env
docker compose up -d          # Khởi tạo PostgreSQL 18 ở cổng 5434 + nạp schema/seed/slots
uv sync                       # Cài đặt thư viện Python
uv run uvicorn app.main:app --reload --port 8000
```

- Kiểm tra sức khỏe hệ thống: `http://localhost:8000/health` -> `{"status": "ok", "database": "ok"}`
- Tài liệu tương tác Swagger UI: `http://localhost:8000/docs`

### Bước 2: Khởi chạy Giao diện Người dùng Frontend (`http://localhost:3000`)

Mở một cửa sổ Terminal mới:

```bash
cd frontend
python run_frontend.py
```

Hoặc trên Windows nhấp đúp tệp `frontend/Chay_Frontend_Port3000.bat`.  
Trình duyệt sẽ mở tại **`http://localhost:3000`** và tự động kết nối tới Backend API `:8000`. *(Nếu máy chưa bật Docker, ứng dụng tự động kích hoạt **Chế độ Mô phỏng Fallback** đầy đủ dữ liệu để trải nghiệm ngay).*

### Bước 3: Chạy bộ 139 bài kiểm thử tự động (Pytest)

```bash
cd backend
uv run pytest -q
```

---

## 4. Danh sách tài khoản mẫu (`backend/db/seed.sql`)

Mật khẩu theo đúng dữ liệu khởi tạo tại `backend/db/seed.sql` và `backend/tests/conftest.py`:

| Vai trò | Họ và tên (`seed.sql`) | Email | Mật khẩu | Trạng thái | Ghi chú kiểm thử |
|---|---|---|---|---|---|
| **Quản lý (`MANAGER`)** | `Nguyen Van Quan Ly` | `manager@xyz.vn` | `Manager@123` | Hoạt động | Quản lý dịch vụ F01, Quản lý công suất F07, Xem báo cáo thống kê 3 bảng F08 |
| **Nhân viên 1 (`STAFF`)** | `Tran Thi Nhan Vien` | `staff1@xyz.vn` | `Staff@1234` | Hoạt động | Xác nhận / Từ chối / Cập nhật tiến độ lịch hẹn F04 |
| **Nhân viên 2 (`STAFF`)** | `Le Van Tiep Nhan` | `staff2@xyz.vn` | `Staff@1234` | Hoạt động | Cố vấn dịch vụ ca 2 |
| **Khách hàng 1 (`CUSTOMER`)** | `Pham Minh Khach` | `khach1@example.com` | `Customer@123` | Hoạt động | Sở hữu 2 xe (`51A-123.45` Toyota Vios, `51F-678.90` Honda CR-V); Đặt lịch F03, Theo dõi F06, Đổi/Hủy F05 |
| **Khách hàng 2 (`CUSTOMER`)** | `Hoang Thu Khach` | `khach2@example.com` | `Customer@123` | Hoạt động | Sở hữu 2 xe (`59C-111.22` Mazda CX-5, `30H-333.44` Kia Morning); Kiểm thử tranh chấp chỗ cuối (TC06) & bảo mật BR23 |
| **Khách hàng 3 (`CUSTOMER`)** | `Vo Quoc Khach` | `khach3@example.com` | `Customer@123` | Hoạt động | Sở hữu 2 xe (`29A-555.66` Hyundai Accent, `60A-777.88` Ford Ranger) |
| **Tài khoản bị khóa** | `Tai Khoan Bi Khoa` | `locked@example.com` | `Customer@123` | Bị khóa | Kiểm thử chặn đăng nhập tài khoản ngừng hoạt động (`403 ACCOUNT_DISABLED` — BR02) |

---

## 5. Tiến độ hoàn thành qua 3 Sprint

| Sprint | Thời gian | Trạng thái | Kết quả bàn giao chính |
|---|---|---|---|
| **Sprint 1 (Tuần 1)** | `23/10 – 29/10/2026` | **Hoàn thành 100%** (`18/18` việc) | Charter (`#4`), Backlog (`#6`), DoD (`#7`), BR01–BR25 (`#8`), WBS (`#9`), ERD (`#10`), Wireframe v2.0 (`#11`), Ước lượng (`#12`), Quality Plan (`#14`), Risk v1 (`#15`), EVM Baseline (`#16`), Gantt (`#17`), Retro S1 (`#18`) |
| **Sprint 2 (Tuần 2)** | `30/10 – 05/11/2026` | **Hoàn thành 100%** (`16/16` việc) | API Contract (`#22`), DB + Seed (`#23`), Giao diện & Auth F09 (`#24, #25`), Dịch vụ F01/F02 (`#26`), Nhân viên xử lý lịch F04 (`#27`), CR Nhắc lịch SMS (`#28`), Đặt lịch & Sức chứa F03/F07 (`#29, #31`), 12 Test Case (`#30`), Chạy thử E2E (`#32`), Risk v2 (`#34`) |
| **Sprint 3 (Tuần 3)** | `06/11 – 12/11/2026` | **Hoàn thành 100%** (`18/18` việc) | Đổi/Hủy lịch F05 (`#37`), Theo dõi trạng thái F06 (`#38`), Báo cáo thống kê 3 bảng F08 (`#39`), Thực thi 12/12 Test Case Pass + 12 ảnh chụp (`#40`), Sửa lỗi BE/FE (`#42, #43`), Biên bản kiểm thử (`#47`), Đóng gói Release v1.0 (`#48`), Tập dượt Demo (`#50`) |
