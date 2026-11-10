-- He thong quan ly dat lich bao duong va sua chua o to - Trung tam XYZ
-- PostgreSQL
-- Nguon: Viec #10 (Tuan 1) - ERD da dong bang, KHONG sua cau truc o day.
-- Muon doi cau truc phai bao ca nhom (Rui ro R4 trong Risk Register).

CREATE TABLE roles (
    role_id   SMALLINT PRIMARY KEY,
    role_name VARCHAR(20) NOT NULL UNIQUE
);

CREATE TABLE users (
    user_id       BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    role_id       SMALLINT     NOT NULL REFERENCES roles(role_id),
    full_name     VARCHAR(100) NOT NULL,
    email         VARCHAR(150) NOT NULL UNIQUE,
    phone         VARCHAR(15),
    password_hash VARCHAR(255) NOT NULL,
    is_active     BOOLEAN      NOT NULL DEFAULT true,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE vehicles (
    vehicle_id    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id       BIGINT      NOT NULL REFERENCES users(user_id),
    license_plate VARCHAR(15) NOT NULL UNIQUE,
    brand         VARCHAR(50) NOT NULL,
    model         VARCHAR(50),
    year          SMALLINT CHECK (year BETWEEN 1980 AND 2100)
);

CREATE TABLE services (
    service_id      BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name            VARCHAR(150)  NOT NULL UNIQUE,
    description     TEXT,
    duration_minutes INT          NOT NULL CHECK (duration_minutes > 0),
    reference_price NUMERIC(12,0) NOT NULL CHECK (reference_price >= 0),
    is_active       BOOLEAN       NOT NULL DEFAULT true
);

CREATE TABLE time_slots (
    slot_id      BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    slot_date    DATE     NOT NULL,
    start_time   TIME     NOT NULL,
    end_time     TIME     NOT NULL,
    max_capacity SMALLINT NOT NULL DEFAULT 3 CHECK (max_capacity > 0),
    CONSTRAINT uq_slot UNIQUE (slot_date, start_time),
    CONSTRAINT ck_slot_time CHECK (end_time > start_time)
);

CREATE TABLE appointments (
    appointment_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    customer_id    BIGINT NOT NULL REFERENCES users(user_id),
    vehicle_id     BIGINT NOT NULL REFERENCES vehicles(vehicle_id),
    service_id     BIGINT NOT NULL REFERENCES services(service_id),
    slot_id        BIGINT NOT NULL REFERENCES time_slots(slot_id),
    handled_by     BIGINT REFERENCES users(user_id),
    status         VARCHAR(20) NOT NULL DEFAULT 'PENDING'
                   CHECK (status IN ('PENDING','CONFIRMED','IN_PROGRESS','COMPLETED','CANCELLED','REJECTED')),
    note           TEXT,
    reject_reason  TEXT,
    change_count   SMALLINT NOT NULL DEFAULT 0 CHECK (change_count BETWEEN 0 AND 2),
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Mot xe khong co 2 lich dang hieu luc trong cung mot khung gio (BR11)
CREATE UNIQUE INDEX uq_vehicle_slot_active
    ON appointments (vehicle_id, slot_id)
    WHERE status IN ('PENDING','CONFIRMED','IN_PROGRESS');

CREATE INDEX idx_appt_slot_status ON appointments (slot_id, status);
CREATE INDEX idx_appt_customer    ON appointments (customer_id);

CREATE TABLE appointment_status_history (
    history_id     BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    appointment_id BIGINT      NOT NULL REFERENCES appointments(appointment_id),
    old_status     VARCHAR(20),
    new_status     VARCHAR(20) NOT NULL,
    changed_by     BIGINT      NOT NULL REFERENCES users(user_id),
    changed_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    note           TEXT
);

CREATE INDEX idx_hist_appt ON appointment_status_history (appointment_id);

INSERT INTO roles (role_id, role_name) VALUES (1,'CUSTOMER'),(2,'STAFF'),(3,'MANAGER');
