# QLDAPM - Hệ thống đặt lịch bảo dưỡng và sửa chữa ô tô XYZ

Đồ án môn Quản lý dự án phần mềm (71ITSE41503), lớp 261_71ITSE41503_01, HK261, Trường Đại học Văn Lang.
Đề bài: xây dựng hệ thống đặt lịch bảo dưỡng và sửa chữa ô tô trực tuyến cho Trung tâm Dịch vụ Ô tô XYZ, làm theo Scrum trong 3 tuần (3 Sprint).

## Nhóm

| Thành viên | Vai trò | Phụ trách trong repo |
|---|---|---|
| Huỳnh Bảo Huy | PO & Backend | `backend/` (CSDL, đăng nhập, đặt lịch, đổi/hủy, báo cáo) |
| Trần Ngọc Tôn Tri | Frontend & QA | `frontend/` (giao diện) |
| Nguyễn Minh Quang | Scrum Master & tài liệu | `docs/`, và chức năng F04 (Việc #27) |

Theo dõi tiến độ trên Trello: https://trello.com/b/hfSS40aF (số `#NN` trong tên thẻ là số thứ tự việc trong bảng phân công 52 việc).

## Cấu trúc repo

```
backend/    FastAPI + PostgreSQL (Python). Chạy: xem backend/README.md
frontend/   Giao diện (Tri). Xem frontend/README.md
docs/
  api/      Đặc tả API Backend - Frontend (hợp đồng giữa 2 bên) + openapi.json
  sprint2/  Tài liệu theo Sprint (kết quả chạy thử...)
```

Tài liệu quản lý dự án (Charter, WBS, EVM, Risk Register...) hiện để trên Google Drive của nhóm.

## Chạy nhanh

```bash
cd backend
cp .env.example .env     # đổi JWT_SECRET
docker compose up -d     # PostgreSQL + dữ liệu mẫu
uv sync
uv run uvicorn app.main:app --reload     # http://localhost:8000/docs
```

Tài khoản demo và chi tiết: [`backend/README.md`](backend/README.md).

## Cách làm việc chung

Đọc [`CONTRIBUTING.md`](CONTRIBUTING.md). Tóm tắt:

- Mỗi việc (thẻ Trello) là **1 branch + 1 Pull Request**, người khác review rồi mới gộp vào `main`.
- Tên branch: `feature/<số việc>-<mô tả ngắn>`, ví dụ `feature/27-quan-ly-lich-hen`.
- Commit: `feat: <nội dung> (#27)` hoặc `chore: <nội dung> (#27)`.
- Cuối mỗi Sprint gắn tag `sprint-1`, `sprint-2`, `sprint-3` lên `main`.

## Tiến độ theo Sprint

| Sprint | Trạng thái | Tag | Ghi chú |
|---|---|---|---|
| 1 (Tuần 1) | Tài liệu và thiết kế, chưa có code | - | Schema chốt ở Việc #10, nằm trong `backend/db/schema.sql` |
| 2 (Tuần 2) | Đang làm | chưa gắn | Backend của Huy xong (#22, #23, #25, #29, #32 phần Backend). Chờ Frontend (#24, #26, #31) và F04 (#27) |
| 3 (Tuần 3) | Chưa bắt đầu | - | Đổi/hủy (#37), báo cáo (#39), theo dõi trạng thái (#38), sửa lỗi |

## Vấn đề đang mở

Wireframe Figma vẽ 4 "Ca" 2 giờ, nhưng quy tắc nghiệp vụ (BR07) và CSDL dùng 8 khung 1 giờ. Tri sửa wireframe theo 8 khung 1 giờ; chi tiết ở `docs/api/Viec22_DacTa_API.md` mục 8.
