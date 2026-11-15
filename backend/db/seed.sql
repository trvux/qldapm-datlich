-- Viec #23 - Du lieu mau de trinh dien (chay sau schema.sql)
-- BR02: khong co dang ky tai khoan, tai khoan 3 vai tro tao san o day.
-- Mat khau luu dang argon2id (BR01). Mat khau demo ghi trong README.

-- Quan ly (role 3): Manager@123
-- Nhan vien (role 2): Staff@1234
-- Khach hang (role 1): Customer@123
INSERT INTO users (role_id, full_name, email, phone, password_hash, is_active) VALUES
 (3, 'Nguyễn Văn Quản Lý',  'manager@xyz.vn',     '0900000001', '$argon2id$v=19$m=65536,t=3,p=4$YgE5+vguyCmcuMJRg69m0A$guGjDQPXSrLDF8YEq7lcniG5wUoWJyzs7xlwLiyBPUQ', true),
 (2, 'Trần Thị Nhân Viên',  'staff1@xyz.vn',      '0900000002', '$argon2id$v=19$m=65536,t=3,p=4$pz+6igqKSv9Pz2bCzStGrA$wepcEzlYFePdI+sWaozb5nTYA0mxIHj+4OTYUfHqbNw', true),
 (2, 'Lê Văn Tiếp Nhận',    'staff2@xyz.vn',      '0900000003', '$argon2id$v=19$m=65536,t=3,p=4$pz+6igqKSv9Pz2bCzStGrA$wepcEzlYFePdI+sWaozb5nTYA0mxIHj+4OTYUfHqbNw', true),
 (1, 'Phạm Minh Khách',     'khach1@example.com', '0911111111', '$argon2id$v=19$m=65536,t=3,p=4$wNRwNxps2W3OdCeylov4SA$QM0ZfgT1fb9N3xSm33FijuydXTjbqDZ3WymkTMnRl6U', true),
 (1, 'Hoàng Thu Khách',     'khach2@example.com', '0922222222', '$argon2id$v=19$m=65536,t=3,p=4$wNRwNxps2W3OdCeylov4SA$QM0ZfgT1fb9N3xSm33FijuydXTjbqDZ3WymkTMnRl6U', true),
 (1, 'Võ Quốc Khách',       'khach3@example.com', '0933333333', '$argon2id$v=19$m=65536,t=3,p=4$wNRwNxps2W3OdCeylov4SA$QM0ZfgT1fb9N3xSm33FijuydXTjbqDZ3WymkTMnRl6U', true),
 -- Tai khoan bi khoa (BR02): dung de demo/test khong dang nhap duoc
 (1, 'Tài Khoản Bị Khóa',   'locked@example.com', NULL,         '$argon2id$v=19$m=65536,t=3,p=4$wNRwNxps2W3OdCeylov4SA$QM0ZfgT1fb9N3xSm33FijuydXTjbqDZ3WymkTMnRl6U', false);

-- Xe cua khach hang (BR12: bien so duy nhat toan he thong)
INSERT INTO vehicles (user_id, license_plate, brand, model, year)
SELECT u.user_id, v.plate, v.brand, v.model, v.year
FROM (VALUES
  ('khach1@example.com', '51A-123.45', 'Toyota', 'Vios',     2020),
  ('khach1@example.com', '51F-678.90', 'Honda',  'CR-V',     2022),
  ('khach2@example.com', '59C-111.22', 'Mazda',  'CX-5',     2021),
  ('khach2@example.com', '30H-333.44', 'Kia',    'Morning',  2019),
  ('khach3@example.com', '29A-555.66', 'Hyundai','Accent',   2023),
  ('khach3@example.com', '60A-777.88', 'Ford',   'Ranger',   2018)
) AS v(email, plate, brand, model, year)
JOIN users u ON u.email = v.email;

-- Danh muc dich vu (F01, F02): thoi luong tinh bang phut, gia tham khao VND (BR04, BR06)
INSERT INTO services (name, description, duration_minutes, reference_price, is_active) VALUES
 ('Bảo dưỡng định kỳ 10.000 km',  'Thay dầu động cơ, lọc dầu, kiểm tra tổng quát 30 hạng mục',     60,  850000, true),
 ('Thay dầu động cơ',             'Thay dầu động cơ và lọc dầu chính hãng',                         30,  550000, true),
 ('Kiểm tra hệ thống phanh',      'Kiểm tra má phanh, đĩa phanh, dầu phanh; vệ sinh hệ thống',     45,  250000, true),
 ('Thay má phanh',                'Thay má phanh trước hoặc sau, cân chỉnh và chạy thử',            60, 1200000, true),
 ('Kiểm tra điều hòa ô tô',       'Đo áp suất gas, vệ sinh dàn lạnh, kiểm tra block',               45,  300000, true),
 ('Cân chỉnh thước lái, đảo lốp', 'Cân chỉnh góc đặt bánh xe và đảo lốp 4 bánh',                    60,  450000, true),
 ('Sửa chữa động cơ',             'Chẩn đoán và sửa chữa động cơ theo báo giá cụ thể',             240, 3500000, true),
 ('Rửa xe và vệ sinh nội thất',   'Dịch vụ đã ngừng cung cấp (dùng để test BR05)',                  60,  200000, false);
