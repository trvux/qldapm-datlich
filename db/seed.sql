-- Viec #23 - Du lieu mau de trinh dien (chay sau schema.sql)
-- BR02: khong co dang ky tai khoan, tai khoan 3 vai tro tao san o day.
-- Mat khau luu dang argon2id (BR01). Mat khau demo ghi trong README.

-- Quan ly (role 3): Manager@123
-- Nhan vien (role 2): Staff@1234
-- Khach hang (role 1): Customer@123
INSERT INTO users (role_id, full_name, email, phone, password_hash, is_active) VALUES
 (3, 'Nguyen Van Quan Ly',  'manager@xyz.vn',     '0900000001', '$argon2id$v=19$m=65536,t=3,p=4$YgE5+vguyCmcuMJRg69m0A$guGjDQPXSrLDF8YEq7lcniG5wUoWJyzs7xlwLiyBPUQ', true),
 (2, 'Tran Thi Nhan Vien',  'staff1@xyz.vn',      '0900000002', '$argon2id$v=19$m=65536,t=3,p=4$pz+6igqKSv9Pz2bCzStGrA$wepcEzlYFePdI+sWaozb5nTYA0mxIHj+4OTYUfHqbNw', true),
 (2, 'Le Van Tiep Nhan',    'staff2@xyz.vn',      '0900000003', '$argon2id$v=19$m=65536,t=3,p=4$pz+6igqKSv9Pz2bCzStGrA$wepcEzlYFePdI+sWaozb5nTYA0mxIHj+4OTYUfHqbNw', true),
 (1, 'Pham Minh Khach',     'khach1@example.com', '0911111111', '$argon2id$v=19$m=65536,t=3,p=4$wNRwNxps2W3OdCeylov4SA$QM0ZfgT1fb9N3xSm33FijuydXTjbqDZ3WymkTMnRl6U', true),
 (1, 'Hoang Thu Khach',     'khach2@example.com', '0922222222', '$argon2id$v=19$m=65536,t=3,p=4$wNRwNxps2W3OdCeylov4SA$QM0ZfgT1fb9N3xSm33FijuydXTjbqDZ3WymkTMnRl6U', true),
 (1, 'Vo Quoc Khach',       'khach3@example.com', '0933333333', '$argon2id$v=19$m=65536,t=3,p=4$wNRwNxps2W3OdCeylov4SA$QM0ZfgT1fb9N3xSm33FijuydXTjbqDZ3WymkTMnRl6U', true),
 -- Tai khoan bi khoa (BR02): dung de demo/test khong dang nhap duoc
 (1, 'Tai Khoan Bi Khoa',   'locked@example.com', NULL,         '$argon2id$v=19$m=65536,t=3,p=4$wNRwNxps2W3OdCeylov4SA$QM0ZfgT1fb9N3xSm33FijuydXTjbqDZ3WymkTMnRl6U', false);

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
 ('Bao duong dinh ky 10.000 km',  'Thay dau dong co, loc dau, kiem tra tong quat 30 hang muc',     60,  850000, true),
 ('Thay dau dong co',             'Thay dau dong co va loc dau chinh hang',                         30,  550000, true),
 ('Kiem tra he thong phanh',      'Kiem tra ma phanh, dia phanh, dau phanh; vet sinh he thong',     45,  250000, true),
 ('Thay ma phanh',                'Thay ma phanh truoc hoac sau, can chinh va chay thu',            60, 1200000, true),
 ('Kiem tra dieu hoa o to',       'Do ap suat gas, ve sinh dan lanh, kiem tra block',               45,  300000, true),
 ('Can chinh thuoc lai, dao lop', 'Can chinh goc dat banh xe va dao lop 4 banh',                    60,  450000, true),
 ('Sua chua dong co',             'Chan doan va sua chua dong co theo bao gia cu the',             240, 3500000, true),
 ('Rua xe va ve sinh noi that',   'Dich vu da ngung cung cap (dung de test BR05)',                  60,  200000, false);
