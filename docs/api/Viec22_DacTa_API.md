# Đặc tả API Backend - Frontend

**Việc #22 (Sprint 2, Câu 8)** · Người thực hiện: Huỳnh Bảo Huy · Effort kế hoạch: 1,0 giờ

Hệ thống đặt lịch bảo dưỡng và sửa chữa ô tô trực tuyến - Trung tâm Dịch vụ Ô tô XYZ.
Mã `BR##` tham chiếu tài liệu *Quy tắc nghiệp vụ đặt lịch* (Việc #8). Mã `F##` là chức năng trong đề bài.

> **Nguồn sự thật.** Tài liệu này mô tả đúng những gì Backend đã chạy được. Bản máy đọc được nằm ở
> [`openapi.json`](openapi.json) (import vào Postman/Insomnia) và Swagger UI tại `http://localhost:8000/docs`
> khi chạy server. Nếu hai nơi lệch nhau thì `openapi.json` đúng, hãy báo Huy sửa tài liệu này.

## 1. Quy ước chung

| Mục | Quy ước |
|---|---|
| Base URL (dev) | `http://localhost:8000` |
| Định dạng | JSON (`Content-Type: application/json`), mã hóa UTF-8 |
| Xác thực | `Authorization: Bearer <access_token>`, lấy từ `POST /auth/login`, hết hạn sau `expires_in` giây (3600) |
| CORS | Cho phép origin `http://localhost:3000` (Next.js dev). Muốn thêm origin khác: sửa `CORS_ORIGINS` trong `.env` |
| Ngày | `YYYY-MM-DD` (ví dụ `2026-11-13`) |
| Giờ | `HH:MM:SS` (ví dụ `08:00:00`), là giờ Việt Nam |
| Thời điểm | ISO 8601 kèm múi giờ `+07:00` (BR25), ví dụ `2026-11-10T13:23:31.965792+07:00` |
| Tiền | Số nguyên, đơn vị VND (BR06: chỉ tham khảo, không thanh toán) |
| Trạng thái lịch | `PENDING` Chờ xác nhận, `CONFIRMED` Đã xác nhận, `IN_PROGRESS` Đang thực hiện, `COMPLETED` Hoàn thành, `CANCELLED` Đã hủy, `REJECTED` Từ chối |
| Vai trò | `CUSTOMER` Khách hàng, `STAFF` Nhân viên tiếp nhận, `MANAGER` Quản lý |

### Định dạng lỗi (mọi endpoint)

```json
{
  "error": {
    "code": "SLOT_FULL",
    "message": "Khung giờ này đã hết chỗ.",
    "details": [{ "field": "slot_id", "message": "Field required" }]
  }
}
```

- Frontend **chỉ nên switch theo `code`**. `message` là câu tiếng Việt để hiển thị tạm, có thể đổi chữ.
- `details` chỉ có khi `code = VALIDATION_ERROR`. Trường `message` trong `details` do thư viện sinh nên bằng tiếng Anh; hãy tự dịch theo `field`.

### Mã trạng thái HTTP

| Mã | Khi nào |
|---|---|
| 200 / 201 | Thành công / tạo mới thành công |
| 401 | Chưa đăng nhập, token sai hoặc hết hạn, sai email/mật khẩu |
| 403 | Đã đăng nhập nhưng sai vai trò (BR03), hoặc tài khoản bị khóa (BR02) |
| 404 | Không tìm thấy. Lịch của người khác cũng trả 404 để không lộ mã lịch (BR23) |
| 409 | Xung đột với trạng thái hiện tại: hết chỗ, trùng lịch, quá giới hạn, sai thứ tự trạng thái |
| 422 | Dữ liệu sai định dạng hoặc vi phạm quy tắc thời gian |
| 500 | Lỗi hệ thống (`INTERNAL_ERROR`) |

## 2. Danh sách endpoint

Cột **Trạng thái**: ✓ đã chạy và có test trong Sprint 2 · ◌ đề xuất, chưa làm (xem mục 6).

| Method | Đường dẫn | Ai gọi | Chức năng | Việc | Trạng thái |
|---|---|---|---|---|---|
| POST | `/auth/login` | Công khai | Đăng nhập, nhận token | #25 | ✓ |
| GET | `/auth/me` | Đã đăng nhập | Thông tin người đang đăng nhập | #25 | ✓ |
| GET | `/services` | Công khai | Danh sách dịch vụ đang hoạt động (F02) | #26 | ✓ (chỉ đọc) |
| GET | `/services/{id}` | Công khai | Chi tiết dịch vụ (F02) | #26 | ✓ (chỉ đọc) |
| GET | `/vehicles` | Khách | Xe của tôi | #29 | ✓ |
| POST | `/vehicles` | Khách | Thêm xe | #29 | ✓ |
| GET | `/slots` | Đã đăng nhập | Khung giờ kèm số chỗ còn lại (F07) | #29 | ✓ |
| PATCH | `/slots/{id}` | Quản lý | Đổi số xe tối đa của khung giờ (F07) | #29 | ✓ |
| POST | `/appointments` | Khách | **Đặt lịch** (F03) | #29 | ✓ |
| GET | `/appointments/{id}` | Khách (của mình), Nhân viên, Quản lý | Chi tiết lịch kèm lịch sử trạng thái | #29 | ✓ |
| POST | `/appointments/{id}/confirm` | Nhân viên, Quản lý | Xác nhận lịch (F04) | #27 | ✓ (bản tối thiểu) |
| POST | `/appointments/{id}/reject` | Nhân viên, Quản lý | Từ chối lịch, bắt buộc có lý do (F04) | #27 | ✓ (bản tối thiểu) |
| POST/PATCH | `/services`, `/services/{id}` | Quản lý | Thêm, sửa, ngừng dịch vụ (F01) | #26 | ◌ |
| GET | `/appointments` | Khách (của mình), Nhân viên, Quản lý | Danh sách, lọc theo ngày và trạng thái (F04, F06) | #27, #38 | ◌ |
| POST | `/appointments/{id}/start`, `/complete` | Nhân viên | Xe đến, hoàn thành (F04) | #27 | ◌ |
| POST | `/appointments/{id}/reschedule`, `/cancel` | Khách | Đổi, hủy lịch (F05) | #37 | ◌ |
| GET | `/reports/appointments` | Quản lý | Thống kê (F08) | #39 | ◌ |
| GET | `/health` | Công khai | Kiểm tra server và DB còn sống | - | ✓ |

> `confirm` và `reject` là **bản tối thiểu Huy làm thêm để chạy được luồng "nhân viên xác nhận lịch" ở Việc #32**.
> Quang (Việc #27) có thể giữ nguyên hoặc thay bằng bản của mình, miễn không đổi đường dẫn và định dạng response ở mục 3.

## 3. Chi tiết endpoint đã chạy

Toàn bộ ví dụ dưới đây là kết quả chạy thật trên dữ liệu mẫu, đã rút gọn khi quá dài.

### 3.1. `POST /auth/login` - Đăng nhập (F09)

Request:

```json
{ "email": "khach1@example.com", "password": "Customer@123" }
```

Response `200`:

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "expires_in": 3600,
  "user": { "user_id": 4, "full_name": "Pham Minh Khach", "email": "khach1@example.com", "role": "CUSTOMER" }
}
```

| Lỗi | `code` | Ghi chú |
|---|---|---|
| 401 | `INVALID_CREDENTIALS` | Sai mật khẩu **hoặc** email không tồn tại, cố ý trả giống hệt nhau |
| 403 | `ACCOUNT_DISABLED` | Đúng mật khẩu nhưng tài khoản bị khóa (BR02) |
| 422 | `VALIDATION_ERROR` | Thiếu `email` hoặc `password` |

Email không phân biệt hoa thường. Không có API đăng ký (BR02): tài khoản tạo sẵn trong dữ liệu mẫu.

### 3.2. `GET /auth/me`

Trả về `user` giống mục trên. Dùng khi tải lại trang để biết token còn dùng được không và hiển thị đúng menu theo `role`.
Lỗi: `401 UNAUTHENTICATED` (thiếu token), `401 TOKEN_INVALID` (token sai hoặc hết hạn), `403 ACCOUNT_DISABLED`.

### 3.3. `GET /services` và `GET /services/{id}` - Tra cứu dịch vụ (F02)

Không cần đăng nhập (BR03). Chỉ trả dịch vụ đang hoạt động (BR05); dịch vụ đã ngừng trả `404 SERVICE_NOT_FOUND`.

```json
[
  {
    "service_id": 1,
    "name": "Bao duong dinh ky 10.000 km",
    "description": "Thay dau dong co, loc dau, kiem tra tong quat 30 hang muc",
    "duration_minutes": 60,
    "reference_price": 850000
  }
]
```

### 3.4. `GET /vehicles`, `POST /vehicles` - Xe của khách

`GET` trả mảng xe của người đăng nhập:

```json
[{ "vehicle_id": 2, "license_plate": "51A-123.45", "brand": "Toyota", "model": "Vios", "year": 2020 }]
```

`POST` body: `{ "license_plate": "51g-999.99", "brand": "VinFast", "model": "VF8", "year": 2024 }`. `model` và `year` không bắt buộc.
Biển số được tự chuẩn hóa thành chữ hoa, bỏ khoảng trắng hai đầu; chỉ nhận chữ, số, dấu cách, `.` và `-`, dài 4-15 ký tự.
Trả `201` kèm xe vừa tạo. Lỗi: `409 LICENSE_PLATE_EXISTS` (BR12: biển số duy nhất toàn hệ thống), `422`.

### 3.5. `GET /slots` - Khung giờ và số chỗ còn lại (F07)

Query: `from` và `to` (`YYYY-MM-DD`, đều không bắt buộc). Mặc định `from` = hôm nay (giờ VN), `to` = `from` + 14 ngày. Tối đa 31 ngày mỗi lần gọi.

```
GET /slots?from=2026-11-13&to=2026-11-13
```

```json
[
  {
    "slot_id": 25,
    "slot_date": "2026-11-13",
    "start_time": "08:00:00",
    "end_time": "09:00:00",
    "max_capacity": 3,
    "booked": 0,
    "remaining": 3,
    "bookable": true,
    "closed_reason": null
  }
]
```

- `remaining = max_capacity - booked`, tính trực tiếp từ các lịch đang chiếm chỗ (`PENDING`, `CONFIRMED`, `IN_PROGRESS`), không bao giờ lệch số (BR08).
- `bookable` là cờ để **vẽ nút bấm được hay bị mờ**. `closed_reason` cho biết vì sao không đặt được:

| `closed_reason` | Ý nghĩa | Gợi ý hiển thị |
|---|---|---|
| `FULL` | Hết chỗ (BR09) | "Hết chỗ" |
| `IN_PAST` | Khung giờ đã qua | Ẩn hoặc làm mờ |
| `TOO_SOON` | Còn chưa tới 2 giờ nữa (BR10) | "Cần đặt trước ít nhất 2 giờ" |
| `TOO_FAR` | Xa hơn 14 ngày (BR10) | Ẩn hoặc làm mờ |

- Mỗi ngày có đúng 8 khung (08-12 và 13-17), không có Chủ nhật, không có khung nghỉ trưa (BR07). Frontend không cần tự xử lý các quy tắc này.
- Lỗi: `422 INVALID_DATE_RANGE`, `422 DATE_RANGE_TOO_LARGE`.

### 3.6. `PATCH /slots/{id}` - Quản lý chỉnh sức chứa (F07)

Chỉ `MANAGER`. Body: `{ "max_capacity": 5 }` (số nguyên 1-50). Trả `SlotOut` như mục 3.5.

| Lỗi | `code` | Ghi chú |
|---|---|---|
| 409 | `CAPACITY_BELOW_BOOKED` | Khung giờ đã có nhiều lịch hơn sức chứa mới |
| 404 | `SLOT_NOT_FOUND` | |

### 3.7. `POST /appointments` - Đặt lịch (F03)

Chỉ `CUSTOMER`. Body:

```json
{ "vehicle_id": 1, "service_id": 1, "slot_id": 25, "note": "Xe kêu lạ ở bánh trước" }
```

`note` không bắt buộc, tối đa 500 ký tự; chuỗi toàn khoảng trắng được lưu thành `null`.

Response `201` kèm header `Location: /appointments/{id}`:

```json
{
  "appointment_id": 1,
  "status": "PENDING",
  "note": "Xe kêu lạ ở bánh trước",
  "reject_reason": null,
  "change_count": 0,
  "customer": { "user_id": 4, "full_name": "Pham Minh Khach" },
  "vehicle": { "vehicle_id": 1, "license_plate": "51F-678.90", "brand": "Honda", "model": "CR-V", "year": 2022 },
  "service": { "service_id": 1, "name": "Bao duong dinh ky 10.000 km", "duration_minutes": 60, "reference_price": 850000 },
  "slot": { "slot_id": 25, "slot_date": "2026-11-13", "start_time": "08:00:00", "end_time": "09:00:00" },
  "handled_by": null,
  "created_at": "2026-11-10T13:23:31.965792+07:00",
  "updated_at": "2026-11-10T13:23:31.965792+07:00",
  "history": [
    { "old_status": null, "new_status": "PENDING", "changed_by": 4, "changed_at": "2026-11-10T13:23:31.965792+07:00", "note": null }
  ]
}
```

Lịch mới luôn ở `PENDING` và **đã giữ chỗ ngay** (BR14). Các lỗi, theo thứ tự hệ thống kiểm tra:

| HTTP | `code` | Nghĩa | Quy tắc |
|---|---|---|---|
| 404 | `SLOT_NOT_FOUND` | Không có khung giờ này | |
| 422 | `SLOT_NOT_WORKING_HOUR` | Khung giờ nằm ngoài giờ làm việc | BR07 |
| 422 | `SLOT_IN_PAST` | Khung giờ đã qua | BR10 |
| 422 | `BOOKING_TOO_SOON` | Đặt trước chưa đủ 2 giờ | BR10 |
| 422 | `BOOKING_TOO_FAR` | Đặt xa quá 14 ngày | BR10 |
| 404 | `SERVICE_NOT_FOUND` | Không có dịch vụ này | |
| 422 | `SERVICE_INACTIVE` | Dịch vụ đã ngừng | BR05 |
| 404 | `VEHICLE_NOT_FOUND` | Xe không tồn tại **hoặc không phải của bạn** | BR12 |
| 409 | `BOOKING_LIMIT_REACHED` | Đã có 3 lịch `PENDING`/`CONFIRMED` | BR11 |
| 409 | `VEHICLE_ALREADY_BOOKED` | Xe này đã có lịch trong khung giờ đó | BR11 |
| 409 | `SLOT_FULL` | Khung giờ đã đủ xe | BR08, BR09 |
| 422 | `VALIDATION_ERROR` | Thiếu hoặc sai kiểu dữ liệu | |

**Lưu ý cho Frontend (Tri):**

1. Khi nhận `SLOT_FULL`, **gọi lại `GET /slots`** để cập nhật số chỗ: người khác có thể vừa đặt chỗ cuối cùng trong lúc khách đang chọn. Đây là hành vi đúng, không phải lỗi (BR13).
2. **Khóa nút "Đặt lịch" ngay khi bấm** cho tới khi có phản hồi. Bấm đúp vẫn an toàn (chỉ 1 lịch được lưu, lần 2 nhận `VEHICLE_ALREADY_BOOKED`) nhưng khách sẽ thấy lỗi gây hoang mang.
3. Không cần tự kiểm tra các quy tắc thời gian, giờ làm việc hay giới hạn lịch ở Frontend; chỉ cần hiển thị `message` hoặc ánh xạ `code` sang câu của bạn.

### 3.8. `GET /appointments/{id}`

Trả `AppointmentOut` như mục 3.7. Khách chỉ xem được lịch của mình; lịch của người khác trả `404 APPOINTMENT_NOT_FOUND`.
Nhân viên và Quản lý xem được tất cả (BR23). Mảng `history` sắp theo thời gian, dùng để vẽ timeline trạng thái (F06).

### 3.9. `POST /appointments/{id}/confirm` và `/reject` - Nhân viên xử lý (F04, bản tối thiểu)

Chỉ `STAFF`, `MANAGER`. Chỉ áp dụng cho lịch đang `PENDING`.

- `confirm`: không có body. Lịch chuyển `CONFIRMED`, ghi `handled_by` là người gọi (BR16).
- `reject`: body `{ "reason": "Hết phụ tùng" }`. **`reason` bắt buộc, không được toàn khoảng trắng** (BR15). Lịch chuyển `REJECTED`, lý do lưu ở `reject_reason`, chỗ trống được trả lại.

Response `200` là `AppointmentOut` đã cập nhật. Lỗi: `409 INVALID_STATUS_TRANSITION` (lịch không còn `PENDING`), `404 APPOINTMENT_NOT_FOUND`, `422` (thiếu lý do), `403 FORBIDDEN` (khách gọi).

## 4. Phân quyền (BR03)

| Endpoint | Công khai | Khách | Nhân viên | Quản lý |
|---|:-:|:-:|:-:|:-:|
| `GET /services`, `/services/{id}` | ✓ | ✓ | ✓ | ✓ |
| `GET /slots` | | ✓ | ✓ | ✓ |
| `PATCH /slots/{id}` | | | | ✓ |
| `GET`, `POST /vehicles` | | ✓ | | |
| `POST /appointments` | | ✓ | | |
| `GET /appointments/{id}` | | của mình | ✓ | ✓ |
| `POST /appointments/{id}/confirm`, `/reject` | | | ✓ | ✓ |

Sai vai trò: `403 FORBIDDEN`. Chưa đăng nhập: `401 UNAUTHENTICATED`.
Backend đọc lại tài khoản từ CSDL ở **mỗi request**, nên khóa tài khoản hoặc đổi vai trò có hiệu lực ngay, không cần chờ token hết hạn. Frontend nên coi mọi `403 ACCOUNT_DISABLED` như bị đăng xuất.

## 5. Luồng gọi cho màn hình đặt lịch

```
Trang dịch vụ (công khai)      GET /services
        |
Đăng nhập                      POST /auth/login          -> lưu access_token
        |
Màn hình đặt lịch              GET /services/{id}        (nếu cần chi tiết)
                               GET /vehicles             (chọn xe; chưa có xe thì POST /vehicles)
                               GET /slots?from=&to=      (vẽ lịch, tô mờ ô bookable=false)
        |
Bấm "Đặt lịch"                 POST /appointments        -> 201: hiển thị appointment_id, status
                                                          -> 409 SLOT_FULL: GET /slots lại
        |
Xem trạng thái                 GET /appointments/{id}    (history làm timeline)
```

## 6. Đề xuất cho các endpoint chưa làm (cần cả nhóm thống nhất)

Chưa đóng băng. Đây là đề xuất của Huy để Frontend lên kế hoạch; chốt lại ở buổi Planning Sprint 3 (Việc #35).

| Endpoint | Đề xuất | Việc |
|---|---|---|
| `POST /services`, `PATCH /services/{id}` | Body như `ServiceOut` không có `service_id`; ngừng dịch vụ bằng `{"is_active": false}`, **không có DELETE** (BR05) | #26 |
| `GET /appointments?status=&date=&from=&to=` | Khách chỉ thấy lịch của mình (BR23); nhân viên thấy tất cả (BR18); trả mảng `AppointmentOut` | #27, #38 |
| `POST /appointments/{id}/start`, `/complete` | `CONFIRMED -> IN_PROGRESS -> COMPLETED`, không nhảy cóc, không đi ngược (BR17) | #27 |
| `POST /appointments/{id}/cancel` | Chỉ `PENDING`/`CONFIRMED`, còn từ 4 giờ trở lên (BR19); trả chỗ ngay (BR20) | #37 |
| `POST /appointments/{id}/reschedule` | Body `{slot_id, service_id?}`; tối đa 2 lần (BR22); nếu chỗ mới hết thì giữ nguyên lịch cũ (BR21) | #37 |
| `GET /reports/appointments?from=&to=` | Chỉ Quản lý (BR24): đếm theo ngày hẹn, theo trạng thái, theo dịch vụ | #39 |

**Quy ước khóa khi viết các luồng đổi/hủy** (để không deadlock với luồng đặt lịch): luôn khóa dòng `users` trước, rồi dòng `time_slots`; khi cần khóa hai khung giờ thì khóa theo `slot_id` tăng dần. Chi tiết trong `backend/app/appointments.py`.

## 7. Giới hạn đã biết

- Chưa giới hạn số lần đăng nhập sai (chống dò mật khẩu). Chấp nhận được cho đồ án; nếu cần, thêm ở Sprint 3.
- Token là access token đơn, chưa có refresh token và chưa có endpoint đăng xuất phía server; đăng xuất = Frontend xóa token.
- Mỗi lịch chỉ 1 dịch vụ và chiếm đúng 1 khung giờ 60 phút, kể cả dịch vụ dài hơn (BR12, đã chốt để giữ phạm vi 3 tuần).

## 8. Đối chiếu với wireframe Figma (xem ngày 10/11/2026)

Đã đối chiếu màn **WF-03 Đặt lịch trực tuyến & Kiểm tra sức chứa (F03, F07)** với API ở trên.

| Điểm | Wireframe | API / quy tắc nghiệp vụ | Cần làm |
|---|---|---|---|
| Khung giờ | 4 "Ca" dài 2 giờ: 08-10, 10-12, 13-15, 15-17 | **8 khung dài 1 giờ** (BR07, đã chốt ở Việc #8 và đã có trong CSDL) | **Cả nhóm chọn 1 hướng** (xem dưới) |
| Sức chứa | "Đầy 3/3 xe", "Đã đặt 1/3" | `max_capacity = 3`, `booked`, `remaining` | Khớp. Dùng `booked` và `max_capacity` để hiển thị |
| Hết chỗ | Ca đỏ "HẾT CHỖ" | `bookable = false`, `closed_reason = "FULL"` | Khớp |
| Chọn xe | Ô nhập tay biển số + dòng xe | Chọn từ `GET /vehicles`; xe mới phải `POST /vehicles` trước | Frontend: hoặc thêm dropdown "xe của tôi / thêm xe mới", hoặc gọi `POST /vehicles` rồi `POST /appointments` khi bấm xác nhận |
| Dịch vụ | "[DV01] Bảo dưỡng định kỳ 10.000km (90p - 1.2tr)" | `service_id`, `name`, `duration_minutes`, `reference_price` | Khớp; `[DV01]` là mã hiển thị, API dùng `service_id` |
| Chọn ngày | Dropdown một ngày | `GET /slots?from=&to=` lấy theo ngày | Khớp |

**Về khung giờ 2 giờ vs 1 giờ**, hai hướng:

1. **Giữ 8 khung 1 giờ (khuyến nghị)**: không phải sửa gì ở Backend, CSDL, test và tài liệu đã chốt. Frontend vẽ lưới 8 ô thay vì 4 ô; wireframe chỉ cần sửa lại cho khớp (wireframe vốn chỉ để "vừa đủ để code", theo Risk R5).
2. **Đổi sang 4 ca 2 giờ**: chỉ cần đổi dữ liệu trong `backend/db/slots.sql` (`end_time = start_time + 2 giờ`, 4 dòng giờ bắt đầu), không đổi cấu trúc bảng. Nhưng phải sửa BR07, BR08, Acceptance Criteria (Việc #21) và Test Case (Việc #30) cho khớp.

Đã đối chiếu thêm WF-04, WF-05, WF-07 (ngày 10/11/2026):

| Màn | Điểm lệch |
|---|---|
| WF-04 Theo dõi, đổi/hủy | "Khung giờ: Ca 1 (08:00 - 10:00)" và hai dòng bảng `08:00-10:00`, `13:00-15:00` đều theo ca 2 giờ. Mã lịch `#LH-2026-015` khác kiểu `#LH-18` ở WF-05. Thanh trạng thái thiếu "Bị từ chối" và "Đã hủy" |
| WF-05 Nhân viên | 4 ô "Ca" (2/3, 3/3, 2/3, 0/3) và cột "Khung giờ" theo ca 2 giờ. Bộ lọc Ngày và Lọc đã có sẵn. Nút "Từ chối" chưa có ô nhập lý do (BR15 bắt buộc). Tab 2 ghi `(F01)` nhưng nhân viên chỉ tra cứu (F02, BR03). Số điện thoại đè lên cột Biển số ở dòng #LH-15 |
| WF-07 Báo cáo | "Hiệu suất sử dụng năng lực theo Ca 1-4"; BR24 chỉ yêu cầu thống kê theo ngày hẹn, trạng thái, dịch vụ |

Các API tương ứng thuộc Sprint 3 (mục 6).
