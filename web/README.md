# Marque: giao diện web

Giao diện đặt lịch bảo dưỡng và sửa chữa ô tô, thương hiệu **Marque**. Next.js + shadcn/ui (`radix-vega`), dùng **bun** cho mọi lệnh. Có hai khu: **khách** và **admin** (nhân viên, quản lý); cả hai responsive cho mobile, tablet, desktop.

## Chạy

Cần [bun](https://bun.sh) và Backend đang chạy (xem [`../backend/README.md`](../backend/README.md)).

```bash
bun install
bun run dev -p 3100    # http://localhost:3100
```

| Lệnh | Việc |
|---|---|
| `bun run dev` | Chạy dev |
| `bun run build` / `bun run start` | Build và chạy production |
| `bun run lint` / `bun run typecheck` | Kiểm tra mã |

Web gọi API qua đường dẫn cùng nguồn `/api`, Next chuyển tiếp sang Backend (`next.config.ts`), nên không dính CORS. Địa chỉ Backend lấy từ biến môi trường `BACKEND_URL` (mặc định `http://localhost:8000`). **Đích chuyển tiếp được cố định lúc build**, nên khi build phải đặt biến này: `BACKEND_URL=http://localhost:8000 bun run build`. Muốn gọi thẳng Backend thì đặt `NEXT_PUBLIC_API_URL` (khi đó cần thêm origin vào `CORS_ORIGINS` của Backend).

Tài khoản demo (cùng bộ với Backend):

| Vai trò | Email | Mật khẩu |
|---|---|---|
| Khách hàng | `khach1@example.com` | `Customer@123` |
| Nhân viên | `staff1@xyz.vn` | `Staff@1234` |
| Quản lý | `manager@xyz.vn` | `Manager@123` |

## Màn hình

| Khu | Đường dẫn | Vai trò |
|---|---|---|
| Khách | `/`, `/dich-vu` | Công khai |
| Khách | `/dat-lich`, `/lich-hen`, `/lich-hen/[id]`, `/xe` | Đã đăng nhập |
| Admin | `/admin`, `/admin/lich-hen` | Nhân viên, Quản lý |
| Admin | `/admin/dich-vu`, `/admin/khung-gio`, `/admin/bao-cao` | Quản lý |

Đăng nhập ở `/dang-nhap`. Các thao tác theo đúng [`docs/api/openapi.json`](../docs/api/openapi.json); lỗi hiển thị theo mã lỗi (`lib/api.ts`), không theo chữ của Backend.

## Cấu trúc

```
app/(khach)/       Khu khách (header ngang, menu dạng ngăn kéo trên mobile)
app/admin/         Khu admin (thanh bên, thu thành ngăn kéo trên mobile)
app/globals.css    Toàn bộ token thương hiệu (màu, radius, mật độ, chuyển động)
components/ui/     Component shadcn (đã chỉnh theo thương hiệu)
components/layout/ Khung dùng chung: Container, PageHeader, Section, AppPage, AdminPage
components/brand/  Logo, minh họa và mô-típ (motifs.tsx: dải ô cờ, sọc đôi, khung khiên, biển số)
components/shell/  Header, footer, thanh bên, đăng nhập
components/landing/ Các khối của trang chủ (dịch vụ, hỏi đáp)
lib/api.ts         Gọi API, kiểu dữ liệu, thông báo lỗi
lib/auth.tsx       Phiên đăng nhập (token trong localStorage)
lib/policy.ts      Quy định đặt lịch hiển thị cho khách (giá trị mặc định của Backend; TODO: lấy từ API)
lib/photos.ts      Ảnh minh họa và alt
public/images/     Ảnh Unsplash đã nén; nguồn và tác giả trong CREDITS.md
app/*-icon, favicon.ico, opengraph-image.png, manifest.ts   Icon, ảnh OG, PWA
```

## Quy tắc layout

Mọi trang dùng chung một khung để không lệch trái, giữa, phải:

- Khu khách: `Container` (một bề rộng cho header, nội dung, footer); trang app bọc bằng `AppPage`, mục landing bằng `Section` (nhịp dọc `py-16`, `md:py-24`). Khu admin: `AdminPage`.
- Đầu trang luôn là `PageHeader`: tiêu đề và mô tả **căn trái**, nút hành động chính **góc phải** từ `sm` (xếp dưới, full-width trên mobile).
- Mọi chữ căn trái. Chỉ căn giữa ở khối đăng nhập và trạng thái trống; số trong bảng căn phải.

## Thương hiệu

Mọi quyết định nằm trong `app/globals.css`: xanh đua `#1F4D3A` (thang `brand-50` đến `brand-950`, bậc 600 là gốc), neutral ấm, `--radius: 0.5rem`, viền 1px, **không shadow**. Heading Noto Serif, nội dung Inter, icon Lucide. Hai mật độ: mặc định "Vừa" cho khách (control 40px), class `.density-compact` cho admin (control 32px, chuyển động 120ms thay vì 200ms). Tự theo chế độ sáng/tối của hệ thống; luôn tôn trọng `prefers-reduced-motion`.

## Thêm component

Khởi tạo bằng preset Vega: `bunx --bun shadcn@latest init --preset b59iOu9f6m --template next`. Thêm component:

```bash
bunx --bun shadcn@latest add <tên>
```

Tệp `.mcp.json` đăng ký shadcn MCP cho Claude Code (`bunx --bun shadcn@latest mcp`). TODO: chưa kiểm kết nối MCP; sau khi mở lại Claude Code, chạy `/mcp` để xem trạng thái.
