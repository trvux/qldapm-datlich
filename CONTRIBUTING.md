# Quy ước làm việc chung

Áp dụng cho cả 3 thành viên. Ngắn gọn có chủ đích: nhóm 3 người, 3 Sprint, mỗi Sprint 1 tuần.

## 1. Branch

```
main                     luôn chạy được; chỉ nhận code qua Pull Request
feature/<số việc>-<tên>  làm 1 việc (1 thẻ Trello), ví dụ feature/31-man-hinh-dat-lich
fix/<số việc>-<tên>      sửa lỗi, ví dụ fix/42-loi-dat-lich-trung
```

- Tách branch từ `main` mới nhất. Mỗi branch chỉ làm **một việc**, để Pull Request nhỏ và dễ review.
- Không commit thẳng vào `main`. Không `git push --force` lên `main`.
- Tên theo số việc `#NN` trong bảng phân công để từ commit lần ngược về thẻ Trello và ngược lại.

## 2. Commit

Theo quy ước nhóm đã ghi trên Trello, thêm số việc ở cuối:

```
feat: đặt lịch và kiểm tra trùng năng lực (#29)
chore: bộ test đăng nhập và đặt lịch (#32)
fix: sửa lỗi hiển thị số chỗ còn lại (#43)
```

`feat` là chức năng mới, `fix` là sửa lỗi, `chore` là phần còn lại (test, tài liệu, cấu hình).

## 3. Pull Request và Trello

1. Làm xong trên branch, push, mở Pull Request vào `main` (có sẵn mẫu, điền số việc và link thẻ Trello).
2. **Một người khác** trong nhóm review. Việc này tương ứng cột **"6. Chờ kiểm tra (Review/QA)"** trên Trello.
3. Review đạt thì gộp bằng **Squash and merge**: mỗi việc còn đúng 1 commit trên `main`, tên commit chính là `feat: ... (#NN)`.
4. Gộp xong mới kéo thẻ sang **"7. Hoàn thành (Done - Đạt DoD)"** (xem thẻ DoD trên Trello).

## 4. Tag theo Sprint

Cuối mỗi Sprint, sau buổi Review/Retro (Việc #18, #33, #52), Scrum Master gắn tag lên `main`:

```bash
git tag -a sprint-2 -m "Sprint 2: backend đặt lịch, đăng nhập, giao diện đặt lịch"
git push origin sprint-2
```

Tag là mốc bàn giao của Sprint, dùng để chạy lại kết quả đã báo cáo (EVM kỳ 1, 2, 3).

## 5. Hai bên Backend - Frontend

- **Hợp đồng là `docs/api/Viec22_DacTa_API.md` và `docs/api/openapi.json`.** Muốn đổi đường dẫn, tên trường hay mã lỗi: sửa tài liệu trong **cùng Pull Request** và báo bên kia (rủi ro R4 trong Risk Register: lỗi tích hợp).
- **Cấu trúc CSDL đã đóng băng** (`backend/db/schema.sql`, Việc #10). Muốn đổi phải báo cả nhóm trước.
- Backend thêm chức năng bằng cách tạo hoặc sửa file trong `backend/app/routers/`, mỗi chức năng một file, để hai người làm Backend không đụng nhau.
- Chạy `uv run pytest` trong `backend/` trước khi mở Pull Request có đụng Backend.

## 6. Không đưa vào repo

Mật khẩu, khóa, file `.env`, `node_modules`, `.venv`. Đã có trong `.gitignore`; dùng `.env.example` để chia sẻ tên biến.
