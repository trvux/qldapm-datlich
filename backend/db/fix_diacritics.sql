-- Sửa dữ liệu mẫu đã nạp bằng seed.sql bản cũ (tên không dấu) sang tên có dấu.
-- Chỉ đổi cột chữ hiển thị; không đổi khóa, giá, thời lượng. Chạy lại nhiều lần vẫn an toàn.
-- Chạy:  docker exec -i datlich-postgres psql -U datlich -d datlich < db/fix_diacritics.sql

BEGIN;

UPDATE users SET full_name = 'Nguyễn Văn Quản Lý' WHERE email = 'manager@xyz.vn';
UPDATE users SET full_name = 'Trần Thị Nhân Viên' WHERE email = 'staff1@xyz.vn';
UPDATE users SET full_name = 'Lê Văn Tiếp Nhận' WHERE email = 'staff2@xyz.vn';
UPDATE users SET full_name = 'Phạm Minh Khách' WHERE email = 'khach1@example.com';
UPDATE users SET full_name = 'Hoàng Thu Khách' WHERE email = 'khach2@example.com';
UPDATE users SET full_name = 'Võ Quốc Khách' WHERE email = 'khach3@example.com';
UPDATE users SET full_name = 'Tài Khoản Bị Khóa' WHERE email = 'locked@example.com';

UPDATE services SET name = 'Bảo dưỡng định kỳ 10.000 km', description = 'Thay dầu động cơ, lọc dầu, kiểm tra tổng quát 30 hạng mục' WHERE name = 'Bao duong dinh ky 10.000 km';
UPDATE services SET name = 'Thay dầu động cơ', description = 'Thay dầu động cơ và lọc dầu chính hãng' WHERE name = 'Thay dau dong co';
UPDATE services SET name = 'Kiểm tra hệ thống phanh', description = 'Kiểm tra má phanh, đĩa phanh, dầu phanh; vệ sinh hệ thống' WHERE name = 'Kiem tra he thong phanh';
UPDATE services SET name = 'Thay má phanh', description = 'Thay má phanh trước hoặc sau, cân chỉnh và chạy thử' WHERE name = 'Thay ma phanh';
UPDATE services SET name = 'Kiểm tra điều hòa ô tô', description = 'Đo áp suất gas, vệ sinh dàn lạnh, kiểm tra block' WHERE name = 'Kiem tra dieu hoa o to';
UPDATE services SET name = 'Cân chỉnh thước lái, đảo lốp', description = 'Cân chỉnh góc đặt bánh xe và đảo lốp 4 bánh' WHERE name = 'Can chinh thuoc lai, dao lop';
UPDATE services SET name = 'Sửa chữa động cơ', description = 'Chẩn đoán và sửa chữa động cơ theo báo giá cụ thể' WHERE name = 'Sua chua dong co';
UPDATE services SET name = 'Rửa xe và vệ sinh nội thất', description = 'Dịch vụ đã ngừng cung cấp (dùng để test BR05)' WHERE name = 'Rua xe va ve sinh noi that';

COMMIT;
