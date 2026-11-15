-- Du lieu mau bo sung de thu giao dien: du 6 trang thai, tra rai nhieu ngay (bao cao, tong quan, chi tiet lich hen).
-- Chay SAU schema.sql, seed.sql, slots.sql. KHONG nam trong bo test (conftest chi nap 3 file tren).
-- Ngay tinh theo gio Viet Nam, tuong doi so voi hom nay, nen du lieu luon "tuoi" khi chay lai.
-- An toan chay lai: neu bang appointments da co du lieu thi khong them gi.
-- Mot so dong co the bi bo qua neu ngay lech roi vao Chu nhat (khong co khung gio).
--
-- Chay:  docker exec -i datlich-postgres psql -U datlich -d datlich < db/seed_demo.sql

BEGIN;

-- Khung gio 14 ngay da qua (de co lich COMPLETED), bo Chu nhat nhu slots.sql
INSERT INTO time_slots (slot_date, start_time, end_time, max_capacity)
SELECT d::date, t.start_time, t.start_time + interval '1 hour', 3
FROM generate_series(
        (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date - 14,
        (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date - 1,
        interval '1 day') AS d
CROSS JOIN (VALUES ('08:00'::time), ('09:00'), ('10:00'), ('11:00'),
                   ('13:00'), ('14:00'), ('15:00'), ('16:00')) AS t(start_time)
WHERE extract(isodow FROM d) <> 7
ON CONFLICT (slot_date, start_time) DO NOTHING;

CREATE TEMP TABLE demo_appt (
    email text, plate text, service text, day_offset int, start_time time,
    status text, handler_email text, note text, reject_reason text, change_count smallint
) ON COMMIT DROP;

INSERT INTO demo_appt VALUES
 -- Hoan thanh (qua khu)
 ('khach1@example.com','51A-123.45','Bảo dưỡng định kỳ 10.000 km',-10,'08:00','COMPLETED','staff1@xyz.vn',NULL,NULL,0),
 ('khach2@example.com','59C-111.22','Thay má phanh',-9,'09:00','COMPLETED','staff2@xyz.vn',NULL,NULL,0),
 ('khach3@example.com','60A-777.88','Sửa chữa động cơ',-7,'13:00','COMPLETED','staff1@xyz.vn','Xe rung khi chạy ở 60 km/h',NULL,0),
 ('khach1@example.com','51F-678.90','Thay dầu động cơ',-6,'10:00','COMPLETED','staff2@xyz.vn',NULL,NULL,0),
 ('khach2@example.com','30H-333.44','Kiểm tra điều hòa ô tô',-5,'14:00','COMPLETED','staff1@xyz.vn',NULL,NULL,0),
 ('khach3@example.com','29A-555.66','Cân chỉnh thước lái, đảo lốp',-4,'15:00','COMPLETED','staff2@xyz.vn',NULL,NULL,0),
 ('khach1@example.com','51A-123.45','Kiểm tra hệ thống phanh',-3,'09:00','COMPLETED','staff1@xyz.vn',NULL,NULL,0),
 ('khach2@example.com','59C-111.22','Thay dầu động cơ',-2,'11:00','COMPLETED','staff1@xyz.vn',NULL,NULL,0),
 -- Da huy
 ('khach3@example.com','60A-777.88','Kiểm tra hệ thống phanh',-4,'16:00','CANCELLED',NULL,NULL,NULL,0),
 ('khach1@example.com','51F-678.90','Bảo dưỡng định kỳ 10.000 km',3,'10:00','CANCELLED',NULL,NULL,NULL,0),
 ('khach2@example.com','30H-333.44','Cân chỉnh thước lái, đảo lốp',5,'13:00','CANCELLED',NULL,NULL,NULL,0),
 -- Tu choi
 ('khach3@example.com','29A-555.66','Sửa chữa động cơ',-2,'16:00','REJECTED','staff2@xyz.vn',NULL,'Hết phụ tùng, xin Quý khách đặt lại sau 3 ngày.',0),
 ('khach1@example.com','51A-123.45','Thay má phanh',1,'08:00','REJECTED','staff1@xyz.vn',NULL,'Khung giờ này kín lịch kỹ thuật viên.',0),
 -- Dang thuc hien (hom nay)
 ('khach2@example.com','59C-111.22','Bảo dưỡng định kỳ 10.000 km',0,'08:00','IN_PROGRESS','staff1@xyz.vn',NULL,NULL,0),
 ('khach3@example.com','60A-777.88','Thay dầu động cơ',0,'09:00','IN_PROGRESS','staff2@xyz.vn',NULL,NULL,0),
 -- Da xac nhan
 ('khach1@example.com','51F-678.90','Kiểm tra điều hòa ô tô',0,'14:00','CONFIRMED','staff1@xyz.vn',NULL,NULL,0),
 ('khach1@example.com','51A-123.45','Cân chỉnh thước lái, đảo lốp',2,'09:00','CONFIRMED','staff2@xyz.vn',NULL,NULL,0),
 ('khach2@example.com','30H-333.44','Bảo dưỡng định kỳ 10.000 km',1,'10:00','CONFIRMED','staff1@xyz.vn','Xe đã chạy 10.200 km',NULL,0),
 ('khach3@example.com','29A-555.66','Thay dầu động cơ',2,'15:00','CONFIRMED','staff2@xyz.vn',NULL,NULL,0),
 -- Cho xac nhan (BR11: moi khach toi da 3 lich cho/da xac nhan)
 ('khach1@example.com','51F-678.90','Thay má phanh',4,'11:00','PENDING',NULL,'Má phanh trước kêu khi đạp nhẹ',NULL,0),
 ('khach2@example.com','59C-111.22','Sửa chữa động cơ',3,'13:00','PENDING',NULL,NULL,NULL,1),
 ('khach2@example.com','59C-111.22','Kiểm tra hệ thống phanh',7,'08:00','PENDING',NULL,NULL,NULL,0),
 ('khach3@example.com','60A-777.88','Kiểm tra điều hòa ô tô',4,'16:00','PENDING',NULL,NULL,NULL,0);

INSERT INTO appointments (customer_id, vehicle_id, service_id, slot_id, handled_by, status, note, reject_reason, change_count, created_at, updated_at)
SELECT c.user_id, v.vehicle_id, s.service_id, ts.slot_id,
       CASE WHEN d.status IN ('CONFIRMED','IN_PROGRESS','COMPLETED','REJECTED') THEN h.user_id END,
       d.status, d.note, d.reject_reason, d.change_count,
       LEAST(now() - interval '1 hour', (ts.slot_date + ts.start_time) AT TIME ZONE 'Asia/Ho_Chi_Minh' - interval '2 days'),
       LEAST(now(), (ts.slot_date + ts.start_time) AT TIME ZONE 'Asia/Ho_Chi_Minh')
FROM demo_appt d
JOIN users c ON c.email = d.email
JOIN vehicles v ON v.license_plate = d.plate AND v.user_id = c.user_id
JOIN services s ON s.name = d.service
JOIN time_slots ts ON ts.slot_date = (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date + d.day_offset AND ts.start_time = d.start_time
LEFT JOIN users h ON h.email = d.handler_email
WHERE NOT EXISTS (SELECT 1 FROM appointments);

-- Lich su trang thai: moi lich di tu PENDING toi trang thai hien tai
INSERT INTO appointment_status_history (appointment_id, old_status, new_status, changed_by, changed_at, note)
SELECT a.appointment_id,
       lag(p.s) OVER (PARTITION BY a.appointment_id ORDER BY p.ord),
       p.s,
       CASE WHEN p.s IN ('PENDING','CANCELLED') THEN a.customer_id
            ELSE COALESCE(a.handled_by, (SELECT user_id FROM users WHERE email = 'staff1@xyz.vn')) END,
       a.created_at + (p.ord - 1) * interval '30 minutes',
       CASE WHEN p.s = 'REJECTED' THEN a.reject_reason
            WHEN p.s = 'PENDING' AND p.ord > 1 THEN 'Đổi khung giờ' END
FROM appointments a
CROSS JOIN LATERAL unnest(
    CASE
        WHEN a.status = 'PENDING' AND a.change_count > 0 THEN ARRAY['PENDING','CONFIRMED','PENDING']
        WHEN a.status = 'PENDING' THEN ARRAY['PENDING']
        WHEN a.status = 'CONFIRMED' THEN ARRAY['PENDING','CONFIRMED']
        WHEN a.status = 'IN_PROGRESS' THEN ARRAY['PENDING','CONFIRMED','IN_PROGRESS']
        WHEN a.status = 'COMPLETED' THEN ARRAY['PENDING','CONFIRMED','IN_PROGRESS','COMPLETED']
        WHEN a.status = 'CANCELLED' THEN ARRAY['PENDING','CANCELLED']
        WHEN a.status = 'REJECTED' THEN ARRAY['PENDING','REJECTED']
    END) WITH ORDINALITY AS p(s, ord)
WHERE NOT EXISTS (SELECT 1 FROM appointment_status_history);

COMMIT;
