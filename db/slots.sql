-- Viec #23 - Sinh khung gio (F07), co the chay lai nhieu lan (ON CONFLICT DO NOTHING).
-- BR07: Thu Hai - Thu Bay, 8 khung 1 gio: 08-12 va 13-17, nghi trua 12-13, nghi Chu nhat.
-- BR08: max_capacity mac dinh 3 xe moi khung.
-- BR25: ngay tinh theo gio Viet Nam (UTC+7), khong theo gio may chu.
--
-- Mac dinh sinh tu hom nay den hom nay + 28 ngay (du phu 14 ngay dat truoc cua BR10).
-- Muon sinh them: chay lai file nay, ngay mai se co them 1 ngay moi.

INSERT INTO time_slots (slot_date, start_time, end_time, max_capacity)
SELECT d::date, t.start_time, t.start_time + interval '1 hour', 3
FROM generate_series(
        (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date,
        (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date + 28,
        interval '1 day') AS d
CROSS JOIN (VALUES ('08:00'::time), ('09:00'), ('10:00'), ('11:00'),
                   ('13:00'), ('14:00'), ('15:00'), ('16:00')) AS t(start_time)
WHERE extract(isodow FROM d) <> 7          -- bo Chu nhat (isodow: Thu Hai=1 ... Chu nhat=7)
ON CONFLICT (slot_date, start_time) DO NOTHING;
