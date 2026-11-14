/**
 * XYZ Auto Care — Hệ thống Đặt lịch Bảo dưỡng & Chăm sóc Ô tô Trực tuyến
 * Giao diện thương mại tối ưu trải nghiệm người dùng (shadcn/ui · Tailwind Design System · Vercel Web Design Guidelines)
 */

const API_BASE_URL = window.XYZ_API_URL || "http://localhost:8000";

const state = {
  useMock: false,
  token: localStorage.getItem("xyz_access_token") || null,
  currentUser: null,
  services: [],
  adminServices: [],
  vehicles: [],
  slots: [],
  selectedDate: "",
  selectedSlotId: null,
  recentAppointmentIds: JSON.parse(localStorage.getItem("xyz_recent_appts") || "[1, 2, 3]"),
  currentLookupAppointment: null,
  myAppointments: [],
  selectedTrackingId: null,
};

const ROLE_VI_LABELS = {
  GUEST: "KHÁCH VÃNG LAI",
  CUSTOMER: "KHÁCH HÀNG",
  STAFF: "CỐ VẤN DỊCH VỤ",
  MANAGER: "QUẢN LÝ",
};

// ============================================================================
// 1. DỮ LIỆU & ENGINE MÔ PHỎNG (TỰ ĐỘNG KÍCH HOẠT KHI CHƯA BẬT MÁY CHỦ :8000)
// ============================================================================
function getInitialMockDb() {
  const saved = localStorage.getItem("xyz_mock_db_v3");
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (_) {}
  }
  return {
    users: [
      { user_id: 1, full_name: "Nguyen Van Quan Ly", email: "manager@xyz.vn", password: "Manager@123", role: "MANAGER", is_active: true },
      { user_id: 2, full_name: "Tran Thi Tiep Nhan", email: "staff1@xyz.vn", password: "Staff@1234", role: "STAFF", is_active: true },
      { user_id: 3, full_name: "Le Hoang Tiep Nhan", email: "staff2@xyz.vn", password: "Staff@1234", role: "STAFF", is_active: true },
      { user_id: 4, full_name: "Pham Minh Khach", email: "khach1@example.com", password: "Customer@123", role: "CUSTOMER", is_active: true },
      { user_id: 5, full_name: "Vo Thi Lan", email: "khach2@example.com", password: "Customer@123", role: "CUSTOMER", is_active: true },
      { user_id: 6, full_name: "Dang Quoc Hung", email: "khach3@example.com", password: "Customer@123", role: "CUSTOMER", is_active: true },
      { user_id: 7, full_name: "Tai Khoan Bi Khoa", email: "locked@example.com", password: "Customer@123", role: "CUSTOMER", is_active: false },
    ],
    services: [
      { service_id: 1, name: "Bảo dưỡng định kỳ 10.000 km", description: "Thay dầu động cơ, lọc dầu, kiểm tra tổng quát 30 hạng mục an toàn", duration_minutes: 60, reference_price: 850000, is_active: true },
      { service_id: 2, name: "Bảo dưỡng định kỳ 20.000 km", description: "Bảo dưỡng cấp trung: dầu máy, lọc gió động cơ, lọc gió điều hòa, vệ sinh phanh 4 bánh", duration_minutes: 90, reference_price: 1450000, is_active: true },
      { service_id: 3, name: "Thay dầu động cơ & lọc dầu tiêu chuẩn", description: "Thay nhớt tổng hợp toàn phần và lọc nhớt chính hãng", duration_minutes: 30, reference_price: 550000, is_active: true },
      { service_id: 4, name: "Kiểm tra & bảo dưỡng hệ thống phanh", description: "Kiểm tra má phanh, đĩa phanh, dầu phanh và vệ sinh cụm phanh 4 bánh", duration_minutes: 60, reference_price: 500000, is_active: true },
      { service_id: 5, name: "Chẩn đoán lỗi điện - điện tử bằng máy chuyên dụng", description: "Quét lỗi OBD-II toàn xe, kiểm tra ắc quy, máy phát và hệ thống cảm biến", duration_minutes: 45, reference_price: 350000, is_active: true },
      { service_id: 6, name: "Vệ sinh & nạp gas hệ thống điều hòa", description: "Nội soi dàn lạnh, vệ sinh lọc gió, kiểm tra rò rỉ và bổ sung gas lạnh chuẩn", duration_minutes: 90, reference_price: 950000, is_active: true },
      { service_id: 7, name: "Cân bằng động & đảo lốp 4 bánh", description: "Cân bằng chì 4 bánh, đảo lốp chống mòn lệch và kiểm tra áp suất lốp", duration_minutes: 45, reference_price: 300000, is_active: true },
      { service_id: 8, name: "Rửa khoang máy hơi nước nóng (Tạm ngừng)", description: "Dịch vụ tạm ngừng để bảo trì định kỳ thiết bị hơi nước nóng", duration_minutes: 60, reference_price: 400000, is_active: false },
    ],
    vehicles: [
      { vehicle_id: 1, owner_id: 4, license_plate: "51F-678.90", brand: "Honda", model: "CR-V", year: 2022 },
      { vehicle_id: 2, owner_id: 4, license_plate: "51A-123.45", brand: "Toyota", model: "Vios", year: 2020 },
      { vehicle_id: 3, owner_id: 5, license_plate: "30E-555.66", brand: "Mazda", model: "CX-5", year: 2023 },
      { vehicle_id: 4, owner_id: 6, license_plate: "51H-888.88", brand: "Hyundai", model: "Tucson", year: 2021 },
    ],
    slotCapacities: {},
    appointments: [
      {
        appointment_id: 1,
        customer_id: 4,
        vehicle_id: 1,
        service_id: 1,
        slot_id: 101,
        slot_date: getDefaultBookingDate(),
        start_time: "09:00:00",
        end_time: "10:00:00",
        status: "PENDING",
        note: "Xe kêu nhẹ ở phanh trước bên phụ khi rà phanh",
        reject_reason: null,
        change_count: 0,
        handled_by: null,
        created_at: "2026-11-11T08:30:00+07:00",
        updated_at: "2026-11-11T08:30:00+07:00",
        history: [
          { old_status: null, new_status: "PENDING", changed_by: 4, changed_at: "2026-11-11T08:30:00+07:00", note: null }
        ],
      },
      {
        appointment_id: 2,
        customer_id: 4,
        vehicle_id: 2,
        service_id: 3,
        slot_id: 102,
        slot_date: getDefaultBookingDate(),
        start_time: "10:00:00",
        end_time: "11:00:00",
        status: "CONFIRMED",
        note: "Thay nhớt định kỳ, kiểm tra thêm nước làm mát",
        reject_reason: null,
        change_count: 0,
        handled_by: 2,
        created_at: "2026-11-11T09:00:00+07:00",
        updated_at: "2026-11-11T09:15:00+07:00",
        history: [
          { old_status: null, new_status: "PENDING", changed_by: 4, changed_at: "2026-11-11T09:00:00+07:00", note: null },
          { old_status: "PENDING", new_status: "CONFIRMED", changed_by: 2, changed_at: "2026-11-11T09:15:00+07:00", note: null }
        ],
      },
      {
        appointment_id: 3,
        customer_id: 4,
        vehicle_id: 1,
        service_id: 6,
        slot_id: 103,
        slot_date: getDefaultBookingDate(),
        start_time: "14:00:00",
        end_time: "15:00:00",
        status: "REJECTED",
        note: "Điều hòa làm lạnh chậm buổi trưa",
        reject_reason: "Máy nội soi & nạp gas điều hòa đang bảo trì định kỳ trong ca chiều",
        change_count: 0,
        handled_by: 2,
        created_at: "2026-11-10T15:10:00+07:00",
        updated_at: "2026-11-10T15:40:00+07:00",
        history: [
          { old_status: null, new_status: "PENDING", changed_by: 4, changed_at: "2026-11-10T15:10:00+07:00", note: null },
          { old_status: "PENDING", new_status: "REJECTED", changed_by: 2, changed_at: "2026-11-10T15:40:00+07:00", note: "Máy nội soi & nạp gas điều hòa đang bảo trì định kỳ trong ca chiều" }
        ],
      }
    ],
  };
}

let mockDb = getInitialMockDb();

function saveMockDb() {
  localStorage.setItem("xyz_mock_db_v3", JSON.stringify(mockDb));
}

function getDefaultBookingDate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  if (d.getDay() === 0) {
    d.setDate(d.getDate() + 1);
  }
  return d.toISOString().slice(0, 10);
}

const EIGHT_HOURS = [
  ["08:00:00", "09:00:00"],
  ["09:00:00", "10:00:00"],
  ["10:00:00", "11:00:00"],
  ["11:00:00", "12:00:00"],
  ["13:00:00", "14:00:00"],
  ["14:00:00", "15:00:00"],
  ["15:00:00", "16:00:00"],
  ["16:00:00", "17:00:00"],
];

function buildMockSlotsForDate(dateStr) {
  const dt = new Date(dateStr + "T00:00:00");
  if (isNaN(dt.getTime()) || dt.getDay() === 0) {
    return [];
  }
  const dayNum = Math.floor(dt.getTime() / 86400000);
  const now = new Date();
  const maxFuture = new Date(now.getTime() + 14 * 86400 * 1000);

  return EIGHT_HOURS.map(([start, end], idx) => {
    const slotId = (dayNum % 1000) * 10 + (idx + 1);
    const maxCap = mockDb.slotCapacities[slotId] || 3;
    const booked = mockDb.appointments.filter(
      (a) =>
        (a.slot_id === slotId || (a.slot_date === dateStr && a.start_time === start)) &&
        ["PENDING", "CONFIRMED", "IN_PROGRESS"].includes(a.status)
    ).length;
    const remaining = Math.max(0, maxCap - booked);

    const slotStartDt = new Date(`${dateStr}T${start}`);
    let closedReason = null;
    if (remaining <= 0) {
      closedReason = "FULL";
    } else if (slotStartDt <= now) {
      closedReason = "IN_PAST";
    } else if (slotStartDt.getTime() - now.getTime() < 2 * 3600 * 1000) {
      closedReason = "TOO_SOON";
    } else if (slotStartDt > maxFuture) {
      closedReason = "TOO_FAR";
    }

    return {
      slot_id: slotId,
      slot_date: dateStr,
      start_time: start,
      end_time: end,
      max_capacity: maxCap,
      booked,
      remaining,
      bookable: closedReason === null,
      closed_reason: closedReason,
    };
  });
}

// ============================================================================
// 2. HÀM GỌI API THỐNG NHẤT (LIVE FASTAPI :8000 HOẶC CHẾ ĐỘ TRỰC TUYẾN ĐỘC LẬP)
// ============================================================================
async function checkBackendHealth() {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 1800);
    const res = await fetch(`${API_BASE_URL}/health`, { signal: ctrl.signal });
    clearTimeout(timer);
    if (res.ok) {
      state.useMock = false;
      updateApiPill();
      return true;
    }
  } catch (_) {}
  state.useMock = true;
  updateApiPill();
  return false;
}

function updateApiPill() {
  const dot = document.getElementById("apiDot");
  const text = document.getElementById("apiModeText");
  if (!state.useMock) {
    dot.className = "api-dot";
    text.textContent = "Trực tuyến (Máy chủ đã kết nối)";
  } else {
    dot.className = "api-dot mock";
    text.textContent = "Trực tuyến (Chế độ Trải nghiệm)";
  }
}

document.getElementById("apiModePill").addEventListener("click", async () => {
  const live = await checkBackendHealth();
  if (live) {
    showAlert("success", "Đã kết nối trực tiếp tới máy chủ dịch vụ XYZ Auto Care tại " + API_BASE_URL);
  } else {
    showAlert(
      "info",
      "Hệ thống đang hoạt động ở Chế độ Trải nghiệm Trực tuyến với đầy đủ dữ liệu mẫu và quy trình đặt lịch."
    );
  }
  await initApp();
});

async function apiRequest(method, path, body = null, query = null) {
  let url = `${API_BASE_URL}${path}`;
  if (query) {
    const qs = new URLSearchParams(query).toString();
    if (qs) url += `?${qs}`;
  }

  if (!state.useMock) {
    const headers = { "Content-Type": "application/json" };
    if (state.token) {
      headers["Authorization"] = `Bearer ${state.token}`;
    }
    const resp = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : null,
    });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      const errObj = data.error || { code: "HTTP_" + resp.status, message: "Không thể kết nối máy chủ" };
      if (resp.status === 403 && errObj.code === "ACCOUNT_DISABLED") {
        handleLogout("Tài khoản của Quý khách hiện đang tạm khóa. Vui lòng liên hệ Hotline 1900 6868.");
      }
      throw { status: resp.status, ...errObj };
    }
    return data;
  }

  return mockApiHandler(method, path, body, query);
}

function getMockCaller() {
  if (!state.token || !state.token.startsWith("mock-token-")) return null;
  const uid = parseInt(state.token.replace("mock-token-", ""), 10);
  return mockDb.users.find((u) => u.user_id === uid) || null;
}

function requireMockAuth(roles = null) {
  const user = getMockCaller();
  if (!user) {
    throw { status: 401, code: "UNAUTHENTICATED", message: "Vui lòng đăng nhập tài khoản để tiếp tục." };
  }
  if (!user.is_active) {
    handleLogout("Tài khoản của Quý khách hiện đang tạm khóa.");
    throw { status: 403, code: "ACCOUNT_DISABLED", message: "Tài khoản này đã bị tạm khóa." };
  }
  if (roles && !roles.includes(user.role)) {
    throw { status: 403, code: "FORBIDDEN", message: "Tài khoản hiện tại không có quyền thực hiện chức năng này." };
  }
  return user;
}

function enrichMockAppointment(a) {
  const cust = mockDb.users.find((u) => u.user_id === a.customer_id) || { user_id: a.customer_id, full_name: "Khách hàng" };
  const veh = mockDb.vehicles.find((v) => v.vehicle_id === a.vehicle_id) || { vehicle_id: a.vehicle_id, license_plate: "51F-678.90", brand: "Honda", model: "CR-V", year: 2022 };
  const svc = mockDb.services.find((s) => s.service_id === a.service_id) || mockDb.services[0];
  return {
    appointment_id: a.appointment_id,
    status: a.status,
    note: a.note,
    reject_reason: a.reject_reason,
    change_count: a.change_count || 0,
    customer: { user_id: cust.user_id, full_name: cust.full_name },
    vehicle: { vehicle_id: veh.vehicle_id, license_plate: veh.license_plate, brand: veh.brand, model: veh.model, year: veh.year },
    service: { service_id: svc.service_id, name: svc.name, duration_minutes: svc.duration_minutes, reference_price: svc.reference_price },
    slot: { slot_id: a.slot_id, slot_date: a.slot_date, start_time: a.start_time, end_time: a.end_time },
    handled_by: a.handled_by,
    created_at: a.created_at,
    updated_at: a.updated_at,
    history: a.history || [],
  };
}

function mockApiHandler(method, path, body, query) {
  if (body && JSON.stringify(body).includes("\\u0000")) {
    throw {
      status: 422,
      code: "VALIDATION_ERROR",
      message: "Dữ liệu nhập vào chứa ký tự không hợp lệ.",
    };
  }

  // POST /auth/login
  if (method === "POST" && path === "/auth/login") {
    const email = (body?.email || "").trim().toLowerCase();
    const pwd = body?.password || "";
    const u = mockDb.users.find((x) => x.email.toLowerCase() === email);
    if (!u || u.password !== pwd) {
      throw { status: 401, code: "INVALID_CREDENTIALS", message: "Email hoặc mật khẩu không chính xác." };
    }
    if (!u.is_active) {
      throw { status: 403, code: "ACCOUNT_DISABLED", message: "Tài khoản của bạn đã bị tạm khóa. Vui lòng liên hệ trung tâm." };
    }
    return {
      access_token: `mock-token-${u.user_id}`,
      token_type: "bearer",
      expires_in: 3600,
      user: { user_id: u.user_id, full_name: u.full_name, email: u.email, role: u.role },
    };
  }

  // GET /auth/me
  if (method === "GET" && path === "/auth/me") {
    const u = requireMockAuth();
    return { user_id: u.user_id, full_name: u.full_name, email: u.email, role: u.role };
  }

  // GET /services
  if (method === "GET" && path === "/services") {
    const caller = getMockCaller();
    if (query?.include_inactive === "true" && caller && caller.role === "MANAGER") {
      return [...mockDb.services];
    }
    return mockDb.services.filter((s) => s.is_active);
  }

  // GET /services/{id}
  const svcMatch = path.match(/^\/services\/(\d+)$/);
  if (method === "GET" && svcMatch) {
    const id = parseInt(svcMatch[1], 10);
    const s = mockDb.services.find((x) => x.service_id === id && x.is_active);
    if (!s) throw { status: 404, code: "SERVICE_NOT_FOUND", message: "Không tìm thấy gói dịch vụ này." };
    return s;
  }

  // POST /services
  if (method === "POST" && path === "/services") {
    requireMockAuth(["MANAGER"]);
    const name = (body?.name || "").trim();
    if (!name || body.duration_minutes < 15 || body.duration_minutes > 480 || body.reference_price < 0) {
      throw { status: 422, code: "VALIDATION_ERROR", message: "Vui lòng kiểm tra lại tên dịch vụ, thời lượng (15–480 phút) và đơn giá." };
    }
    if (mockDb.services.some((s) => s.name.toLowerCase() === name.toLowerCase())) {
      throw { status: 409, code: "SERVICE_NAME_EXISTS", message: "Tên gói dịch vụ này đã tồn tại trong danh mục." };
    }
    const newId = Math.max(0, ...mockDb.services.map((s) => s.service_id)) + 1;
    const created = {
      service_id: newId,
      name,
      description: body.description || null,
      duration_minutes: Number(body.duration_minutes),
      reference_price: Number(body.reference_price),
      is_active: body.is_active !== false,
    };
    mockDb.services.push(created);
    saveMockDb();
    return created;
  }

  // PATCH /services/{id}
  if (method === "PATCH" && svcMatch) {
    requireMockAuth(["MANAGER"]);
    const id = parseInt(svcMatch[1], 10);
    const s = mockDb.services.find((x) => x.service_id === id);
    if (!s) throw { status: 404, code: "SERVICE_NOT_FOUND", message: "Không tìm thấy gói dịch vụ." };
    if (body.name !== undefined) {
      const trimmed = body.name.trim();
      if (mockDb.services.some((x) => x.service_id !== id && x.name.toLowerCase() === trimmed.toLowerCase())) {
        throw { status: 409, code: "SERVICE_NAME_EXISTS", message: "Tên gói dịch vụ đã tồn tại trong hệ thống." };
      }
      s.name = trimmed;
    }
    if (body.description !== undefined) s.description = body.description;
    if (body.duration_minutes !== undefined) s.duration_minutes = Number(body.duration_minutes);
    if (body.reference_price !== undefined) s.reference_price = Number(body.reference_price);
    if (body.is_active !== undefined) s.is_active = Boolean(body.is_active);
    saveMockDb();
    return s;
  }

  // GET /vehicles & POST /vehicles
  if (method === "GET" && path === "/vehicles") {
    const u = requireMockAuth(["CUSTOMER"]);
    return mockDb.vehicles.filter((v) => v.owner_id === u.user_id);
  }
  if (method === "POST" && path === "/vehicles") {
    const u = requireMockAuth(["CUSTOMER"]);
    const plate = (body?.license_plate || "").trim().toUpperCase();
    if (mockDb.vehicles.some((v) => v.license_plate.toUpperCase() === plate)) {
      throw { status: 409, code: "LICENSE_PLATE_EXISTS", message: "Biển số xe này đã được đăng ký trên hệ thống." };
    }
    const vid = Math.max(0, ...mockDb.vehicles.map((v) => v.vehicle_id)) + 1;
    const v = {
      vehicle_id: vid,
      owner_id: u.user_id,
      license_plate: plate,
      brand: (body.brand || "").trim(),
      model: body.model ? body.model.trim() : null,
      year: body.year ? Number(body.year) : null,
    };
    mockDb.vehicles.push(v);
    saveMockDb();
    return v;
  }

  // GET /slots
  if (method === "GET" && path === "/slots") {
    requireMockAuth(["CUSTOMER", "STAFF", "MANAGER"]);
    const d = query?.from || getDefaultBookingDate();
    return buildMockSlotsForDate(d);
  }

  // PATCH /slots/{id}
  const slotMatch = path.match(/^\/slots\/(\d+)$/);
  if (method === "PATCH" && slotMatch) {
    requireMockAuth(["MANAGER"]);
    const sid = parseInt(slotMatch[1], 10);
    const newCap = Number(body.max_capacity);
    if (!newCap || newCap < 1 || newCap > 50) {
      throw { status: 422, code: "VALIDATION_ERROR", message: "Sức chứa mỗi ca phải nằm trong khoảng từ 1 đến 50 xe." };
    }
    const currentSlots = buildMockSlotsForDate(state.selectedDate || getDefaultBookingDate());
    const found = currentSlots.find((s) => s.slot_id === sid);
    if (found && newCap < found.booked) {
      throw { status: 409, code: "CAPACITY_BELOW_BOOKED", message: "Không thể giảm sức chứa xuống thấp hơn số lượng xe đã đặt trong ca này." };
    }
    mockDb.slotCapacities[sid] = newCap;
    saveMockDb();
    return buildMockSlotsForDate(state.selectedDate || getDefaultBookingDate()).find((s) => s.slot_id === sid);
  }

  // POST /appointments
  if (method === "POST" && path === "/appointments") {
    const u = requireMockAuth(["CUSTOMER"]);
    const slots = buildMockSlotsForDate(state.selectedDate || getDefaultBookingDate());
    const slot = slots.find((s) => s.slot_id === Number(body.slot_id));
    if (!slot) throw { status: 404, code: "SLOT_NOT_FOUND", message: "Khung giờ không tồn tại." };
    if (slot.closed_reason === "IN_PAST") throw { status: 422, code: "SLOT_IN_PAST", message: "Khung giờ đã qua, vui lòng chọn khung giờ khác." };
    if (slot.closed_reason === "TOO_SOON") throw { status: 422, code: "BOOKING_TOO_SOON", message: "Vui lòng đặt lịch trước giờ hẹn tối thiểu 2 giờ." };
    if (slot.closed_reason === "TOO_FAR") throw { status: 422, code: "BOOKING_TOO_FAR", message: "Hệ thống nhận đặt lịch trước tối đa 14 ngày." };

    const svc = mockDb.services.find((s) => s.service_id === Number(body.service_id));
    if (!svc) throw { status: 404, code: "SERVICE_NOT_FOUND", message: "Gói dịch vụ không tồn tại." };
    if (!svc.is_active) throw { status: 422, code: "SERVICE_INACTIVE", message: "Gói dịch vụ này hiện đang tạm ngừng cung cấp." };

    const veh = mockDb.vehicles.find((v) => v.vehicle_id === Number(body.vehicle_id) && v.owner_id === u.user_id);
    if (!veh) throw { status: 404, code: "VEHICLE_NOT_FOUND", message: "Phương tiện không tồn tại hoặc không thuộc tài khoản của Quý khách." };

    const activeOfCustomer = mockDb.appointments.filter(
      (a) => a.customer_id === u.user_id && ["PENDING", "CONFIRMED"].includes(a.status)
    ).length;
    if (activeOfCustomer >= 3) {
      throw { status: 409, code: "BOOKING_LIMIT_REACHED", message: "Quý khách đang có tối đa 3 lịch hẹn chờ phục vụ. Vui lòng hoàn tất hoặc hủy bớt lịch cũ trước khi đặt thêm." };
    }

    const sameVehicleSlot = mockDb.appointments.some(
      (a) =>
        a.vehicle_id === veh.vehicle_id &&
        a.slot_id === slot.slot_id &&
        ["PENDING", "CONFIRMED", "IN_PROGRESS"].includes(a.status)
    );
    if (sameVehicleSlot) {
      throw { status: 409, code: "VEHICLE_ALREADY_BOOKED", message: "Phương tiện này đã có lịch hẹn trong cùng khung giờ đã chọn." };
    }

    if (slot.remaining <= 0) {
      throw { status: 409, code: "SLOT_FULL", message: "Khung giờ này vừa nhận đủ số lượng xe phục vụ." };
    }

    const newId = Math.max(0, ...mockDb.appointments.map((a) => a.appointment_id)) + 1;
    const nowIso = new Date().toISOString();
    const noteClean = body.note && body.note.trim() ? body.note.trim() : null;
    const appt = {
      appointment_id: newId,
      customer_id: u.user_id,
      vehicle_id: veh.vehicle_id,
      service_id: svc.service_id,
      slot_id: slot.slot_id,
      slot_date: slot.slot_date,
      start_time: slot.start_time,
      end_time: slot.end_time,
      status: "PENDING",
      note: noteClean,
      reject_reason: null,
      change_count: 0,
      handled_by: null,
      created_at: nowIso,
      updated_at: nowIso,
      history: [{ old_status: null, new_status: "PENDING", changed_by: u.user_id, changed_at: nowIso, note: null }],
    };
    mockDb.appointments.push(appt);
    saveMockDb();
    return enrichMockAppointment(appt);
  }

  // GET /appointments
  if (method === "GET" && path === "/appointments") {
    const u = requireMockAuth(["CUSTOMER", "STAFF", "MANAGER"]);
    if (query?.from && query?.to && query.from > query.to) {
      throw { status: 422, code: "INVALID_DATE_RANGE", message: "Ngày bắt đầu không được lớn hơn ngày kết thúc." };
    }
    let list = [...mockDb.appointments];
    if (u.role === "CUSTOMER") {
      list = list.filter((a) => a.customer_id === u.user_id);
    }
    if (query?.status) {
      list = list.filter((a) => a.status === query.status.toUpperCase());
    }
    if (query?.date) {
      list = list.filter((a) => a.slot_date === query.date);
    }
    if (query?.from) {
      list = list.filter((a) => a.slot_date >= query.from);
    }
    if (query?.to) {
      list = list.filter((a) => a.slot_date <= query.to);
    }
    list.sort((a, b) => b.appointment_id - a.appointment_id);
    return list.map(enrichMockAppointment);
  }

  // GET /appointments/{id}
  const apptMatch = path.match(/^\/appointments\/(\d+)$/);
  if (method === "GET" && apptMatch) {
    const u = requireMockAuth(["CUSTOMER", "STAFF", "MANAGER"]);
    const id = parseInt(apptMatch[1], 10);
    const a = mockDb.appointments.find((x) => x.appointment_id === id);
    if (!a || (u.role === "CUSTOMER" && a.customer_id !== u.user_id)) {
      throw { status: 404, code: "APPOINTMENT_NOT_FOUND", message: "Không tìm thấy phiếu lịch hẹn hoặc phiếu không thuộc tài khoản của Quý khách." };
    }
    return enrichMockAppointment(a);
  }

  // POST /appointments/{id}/confirm
  const confirmMatch = path.match(/^\/appointments\/(\d+)\/confirm$/);
  if (method === "POST" && confirmMatch) {
    const u = requireMockAuth(["STAFF", "MANAGER"]);
    const id = parseInt(confirmMatch[1], 10);
    const a = mockDb.appointments.find((x) => x.appointment_id === id);
    if (!a) throw { status: 404, code: "APPOINTMENT_NOT_FOUND", message: "Không tìm thấy phiếu lịch hẹn." };
    if (a.status !== "PENDING") {
      throw { status: 409, code: "INVALID_STATUS_TRANSITION", message: "Chỉ có thể xác nhận phiếu hẹn đang ở trạng thái Chờ xác nhận." };
    }
    const nowIso = new Date().toISOString();
    a.status = "CONFIRMED";
    a.handled_by = u.user_id;
    a.updated_at = nowIso;
    a.history.push({ old_status: "PENDING", new_status: "CONFIRMED", changed_by: u.user_id, changed_at: nowIso, note: null });
    saveMockDb();
    return enrichMockAppointment(a);
  }

  // POST /appointments/{id}/reject
  const rejectMatch = path.match(/^\/appointments\/(\d+)\/reject$/);
  if (method === "POST" && rejectMatch) {
    const u = requireMockAuth(["STAFF", "MANAGER"]);
    const id = parseInt(rejectMatch[1], 10);
    const reason = (body?.reason || "").trim();
    if (!reason) {
      throw { status: 422, code: "VALIDATION_ERROR", message: "Vui lòng nhập rõ lý do từ chối tiếp nhận để thông báo cho khách hàng." };
    }
    const a = mockDb.appointments.find((x) => x.appointment_id === id);
    if (!a) throw { status: 404, code: "APPOINTMENT_NOT_FOUND", message: "Không tìm thấy phiếu lịch hẹn." };
    if (a.status !== "PENDING") {
      throw { status: 409, code: "INVALID_STATUS_TRANSITION", message: "Chỉ có thể từ chối phiếu hẹn đang ở trạng thái Chờ xác nhận." };
    }
    const nowIso = new Date().toISOString();
    a.status = "REJECTED";
    a.reject_reason = reason;
    a.handled_by = u.user_id;
    a.updated_at = nowIso;
    a.history.push({ old_status: "PENDING", new_status: "REJECTED", changed_by: u.user_id, changed_at: nowIso, note: reason });
    saveMockDb();
    return enrichMockAppointment(a);
  }

  // POST /appointments/{id}/start
  const startMatch = path.match(/^\/appointments\/(\d+)\/start$/);
  if (method === "POST" && startMatch) {
    const u = requireMockAuth(["STAFF", "MANAGER"]);
    const id = parseInt(startMatch[1], 10);
    const a = mockDb.appointments.find((x) => x.appointment_id === id);
    if (!a) throw { status: 404, code: "APPOINTMENT_NOT_FOUND", message: "Không tìm thấy phiếu lịch hẹn." };
    if (a.status !== "CONFIRMED") {
      throw { status: 409, code: "INVALID_STATUS_TRANSITION", message: "Chỉ lịch hẹn Đã xác nhận mới có thể chuyển sang trạng thái Đang thực hiện tại xưởng." };
    }
    const nowIso = new Date().toISOString();
    a.status = "IN_PROGRESS";
    a.handled_by = u.user_id;
    a.updated_at = nowIso;
    a.history.push({ old_status: "CONFIRMED", new_status: "IN_PROGRESS", changed_by: u.user_id, changed_at: nowIso, note: "Tiếp nhận xe vào xưởng bảo dưỡng" });
    saveMockDb();
    return enrichMockAppointment(a);
  }

  // POST /appointments/{id}/complete
  const completeMatch = path.match(/^\/appointments\/(\d+)\/complete$/);
  if (method === "POST" && completeMatch) {
    const u = requireMockAuth(["STAFF", "MANAGER"]);
    const id = parseInt(completeMatch[1], 10);
    const a = mockDb.appointments.find((x) => x.appointment_id === id);
    if (!a) throw { status: 404, code: "APPOINTMENT_NOT_FOUND", message: "Không tìm thấy phiếu lịch hẹn." };
    if (a.status !== "IN_PROGRESS") {
      throw { status: 409, code: "INVALID_STATUS_TRANSITION", message: "Chỉ xe Đang thực hiện tại xưởng mới có thể chuyển sang Hoàn thành & Bàn giao." };
    }
    const nowIso = new Date().toISOString();
    a.status = "COMPLETED";
    a.handled_by = u.user_id;
    a.updated_at = nowIso;
    a.history.push({ old_status: "IN_PROGRESS", new_status: "COMPLETED", changed_by: u.user_id, changed_at: nowIso, note: "Hoàn tất bảo dưỡng và bàn giao xe cho khách" });
    saveMockDb();
    return enrichMockAppointment(a);
  }

  // POST /appointments/{id}/cancel
  const cancelMatch = path.match(/^\/appointments\/(\d+)\/cancel$/);
  if (method === "POST" && cancelMatch) {
    const u = requireMockAuth(["CUSTOMER"]);
    const id = parseInt(cancelMatch[1], 10);
    const a = mockDb.appointments.find((x) => x.appointment_id === id && x.customer_id === u.user_id);
    if (!a) throw { status: 404, code: "APPOINTMENT_NOT_FOUND", message: "Không tìm thấy phiếu lịch hẹn." };
    if (!["PENDING", "CONFIRMED"].includes(a.status)) {
      throw { status: 409, code: "INVALID_STATUS_TRANSITION", message: "Lịch hẹn ở trạng thái hiện tại không thể hủy trực tuyến." };
    }
    const slotStart = new Date(`${a.slot_date}T${a.start_time}`);
    if (slotStart.getTime() - Date.now() < 4 * 3600 * 1000) {
      throw { status: 422, code: "CHANGE_TOO_LATE", message: "Quý khách chỉ có thể hủy hoặc đổi lịch trước giờ hẹn tối thiểu 4 giờ." };
    }
    const nowIso = new Date().toISOString();
    const oldStatus = a.status;
    a.status = "CANCELLED";
    a.updated_at = nowIso;
    a.history.push({ old_status: oldStatus, new_status: "CANCELLED", changed_by: u.user_id, changed_at: nowIso, note: "Khách hàng chủ động hủy lịch hẹn" });
    saveMockDb();
    return enrichMockAppointment(a);
  }

  // POST /appointments/{id}/reschedule
  const reschedMatch = path.match(/^\/appointments\/(\d+)\/reschedule$/);
  if (method === "POST" && reschedMatch) {
    const u = requireMockAuth(["CUSTOMER"]);
    const id = parseInt(reschedMatch[1], 10);
    const a = mockDb.appointments.find((x) => x.appointment_id === id && x.customer_id === u.user_id);
    if (!a) throw { status: 404, code: "APPOINTMENT_NOT_FOUND", message: "Không tìm thấy phiếu lịch hẹn." };
    if (!["PENDING", "CONFIRMED"].includes(a.status)) {
      throw { status: 409, code: "INVALID_STATUS_TRANSITION", message: "Lịch hẹn ở trạng thái hiện tại không thể thay đổi." };
    }
    const oldStart = new Date(`${a.slot_date}T${a.start_time}`);
    if (oldStart.getTime() - Date.now() < 4 * 3600 * 1000) {
      throw { status: 422, code: "CHANGE_TOO_LATE", message: "Quý khách chỉ có thể đổi khung giờ trước giờ hẹn tối thiểu 4 giờ." };
    }
    if ((a.change_count || 0) >= 2) {
      throw { status: 409, code: "CHANGE_LIMIT_REACHED", message: `Phiếu hẹn này đã đổi ${a.change_count}/2 lần tối đa cho phép.` };
    }
    const newSlotId = Number(body?.slot_id);
    if (newSlotId === a.slot_id) {
      throw { status: 422, code: "SAME_SLOT", message: "Khung giờ mới trùng với khung giờ hiện tại của phiếu hẹn." };
    }
    let newSlot = null;
    for (let dOff = 0; dOff <= 16; dOff++) {
      const dObj = new Date(Date.now() + dOff * 86400000);
      const dStr = dObj.toISOString().slice(0, 10);
      const daySlots = buildMockSlotsForDate(dStr);
      const found = daySlots.find((s) => s.slot_id === newSlotId);
      if (found) {
        newSlot = found;
        break;
      }
    }
    if (!newSlot) throw { status: 404, code: "SLOT_NOT_FOUND", message: "Khung giờ mới không tồn tại." };
    if (newSlot.closed_reason === "IN_PAST") throw { status: 422, code: "SLOT_IN_PAST", message: "Khung giờ mới đã qua." };
    if (newSlot.closed_reason === "TOO_SOON") throw { status: 422, code: "BOOKING_TOO_SOON", message: "Khung giờ mới cần đặt trước ít nhất 2 giờ." };
    if (newSlot.closed_reason === "TOO_FAR") throw { status: 422, code: "BOOKING_TOO_FAR", message: "Khung giờ mới vượt quá giới hạn 14 ngày." };
    if (newSlot.remaining <= 0) {
      throw { status: 409, code: "SLOT_FULL", message: "Khung giờ mới vừa hết chỗ. Lịch hẹn hiện tại của Quý khách vẫn được giữ nguyên." };
    }
    const dupVeh = mockDb.appointments.some(
      (x) =>
        x.appointment_id !== a.appointment_id &&
        x.vehicle_id === a.vehicle_id &&
        x.slot_id === newSlot.slot_id &&
        ["PENDING", "CONFIRMED", "IN_PROGRESS"].includes(x.status)
    );
    if (dupVeh) {
      throw { status: 409, code: "VEHICLE_ALREADY_BOOKED", message: "Phương tiện này đã có lịch hẹn trong khung giờ mới." };
    }
    const newServiceId = body?.service_id ? Number(body.service_id) : a.service_id;
    const svcObj = mockDb.services.find((s) => s.service_id === newServiceId);
    if (!svcObj) throw { status: 404, code: "SERVICE_NOT_FOUND", message: "Gói dịch vụ không tồn tại." };
    if (newServiceId !== a.service_id && !svcObj.is_active) {
      throw { status: 422, code: "SERVICE_INACTIVE", message: "Gói dịch vụ mới chọn hiện đang tạm ngừng cung cấp." };
    }

    const oldStatus = a.status;
    const oldDateFmt = a.slot_date.split("-").reverse().join("/");
    const newDateFmt = newSlot.slot_date.split("-").reverse().join("/");
    let noteText = `Đổi lịch lần ${(a.change_count || 0) + 1}: ${oldDateFmt} ${a.start_time.slice(0, 5)} → ${newDateFmt} ${newSlot.start_time.slice(0, 5)}`;
    if (newServiceId !== a.service_id) {
      noteText += ` (Cập nhật gói dịch vụ)`;
    }

    const nowIso = new Date().toISOString();
    a.slot_id = newSlot.slot_id;
    a.slot_date = newSlot.slot_date;
    a.start_time = newSlot.start_time;
    a.end_time = newSlot.end_time;
    a.service_id = newServiceId;
    a.status = "PENDING";
    a.handled_by = null;
    a.change_count = (a.change_count || 0) + 1;
    a.updated_at = nowIso;
    a.history.push({ old_status: oldStatus, new_status: "PENDING", changed_by: u.user_id, changed_at: nowIso, note: noteText });
    saveMockDb();
    return enrichMockAppointment(a);
  }

  // GET /reports/appointments
  if (method === "GET" && path === "/reports/appointments") {
    requireMockAuth(["MANAGER"]);
    const todayStr = new Date().toISOString().slice(0, 10);
    const toStr = query?.to || todayStr;
    const fromStr = query?.from || (toStr.slice(0, 8) + "01");
    if (toStr < fromStr) {
      throw { status: 422, code: "INVALID_DATE_RANGE", message: "Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu." };
    }
    const diffDays = Math.floor((new Date(toStr) - new Date(fromStr)) / 86400000);
    if (diffDays > 366) {
      throw { status: 422, code: "DATE_RANGE_TOO_LARGE", message: "Khoảng thời gian thống kê tối đa là 366 ngày." };
    }

    const inRange = mockDb.appointments.filter((a) => a.slot_date >= fromStr && a.slot_date <= toStr);
    const dateMap = {};
    const statusMap = { PENDING: 0, CONFIRMED: 0, IN_PROGRESS: 0, COMPLETED: 0, CANCELLED: 0, REJECTED: 0 };
    const svcCountMap = {};

    inRange.forEach((a) => {
      dateMap[a.slot_date] = (dateMap[a.slot_date] || 0) + 1;
      if (statusMap[a.status] !== undefined) statusMap[a.status]++;
      svcCountMap[a.service_id] = (svcCountMap[a.service_id] || 0) + 1;
    });

    const by_date = Object.keys(dateMap)
      .sort()
      .map((d) => ({ date: d, count: dateMap[d] }));

    const statusOrder = ["PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "REJECTED"];
    const by_status = statusOrder.map((st) => ({ status: st, count: statusMap[st] || 0 }));

    const by_service = mockDb.services
      .filter((s) => s.is_active || (svcCountMap[s.service_id] || 0) > 0)
      .map((s) => ({
        service_id: s.service_id,
        name: s.name,
        count: svcCountMap[s.service_id] || 0,
      }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "vi"));

    return {
      from: fromStr,
      to: toStr,
      total: inRange.length,
      by_date,
      by_status,
      by_service,
    };
  }

  throw { status: 404, code: "NOT_FOUND", message: "Yêu cầu không tồn tại." };
}

// ============================================================================
// 3. QUẢN LÝ PHIÊN ĐĂNG NHẬP & HIỂN THỊ GIAO DIỆN THEO VAI TRÒ
// ============================================================================
async function refreshSession() {
  if (!state.token) {
    state.currentUser = null;
    renderHeaderAndRoleUI();
    return;
  }
  try {
    state.currentUser = await apiRequest("GET", "/auth/me");
  } catch (_) {
    state.token = null;
    state.currentUser = null;
    localStorage.removeItem("xyz_access_token");
  }
  renderHeaderAndRoleUI();
}

function renderHeaderAndRoleUI() {
  const badge = document.getElementById("userRoleBadge");
  const nameEl = document.getElementById("userNameText");
  const btnLogin = document.getElementById("btnNavLogin");
  const btnLogout = document.getElementById("btnLogout");
  const sessionBox = document.getElementById("sessionDetailBox");

  const tabLookup = document.getElementById("tabLookup");
  const tabReports = document.getElementById("tabReports");
  const tabAdminServices = document.getElementById("tabAdminServices");

  if (!state.currentUser) {
    badge.className = "role-badge role-GUEST";
    badge.textContent = ROLE_VI_LABELS.GUEST;
    nameEl.textContent = "Chưa đăng nhập";
    btnLogin.classList.remove("hidden");
    btnLogout.classList.add("hidden");

    if (tabLookup) tabLookup.classList.add("hidden");
    if (tabReports) tabReports.classList.add("hidden");
    if (tabAdminServices) tabAdminServices.classList.add("hidden");

    sessionBox.innerHTML = `
      <div class="alert alert-info" style="margin-bottom:0">
        <div>
          <strong>Bạn đang truy cập với tư cách Khách vãng lai</strong><br/>
          Quý khách có thể tự do tham khảo bảng giá và chi tiết các gói dịch vụ bảo dưỡng. Để đặt lịch hẹn và quản lý hồ sơ xe, vui lòng đăng nhập tài khoản bên trái.
        </div>
      </div>
    `;
  } else {
    const u = state.currentUser;
    badge.className = `role-badge role-${u.role}`;
    badge.textContent = ROLE_VI_LABELS[u.role] || u.role;
    nameEl.textContent = u.full_name;
    btnLogin.classList.add("hidden");
    btnLogout.classList.remove("hidden");

    // Chỉ hiển thị các tab nghiệp vụ nội bộ cho Cố vấn dịch vụ / Quản lý để tránh rối mắt cho Khách hàng
    if (tabLookup) {
      tabLookup.classList.toggle("hidden", !["STAFF", "MANAGER"].includes(u.role));
    }
    if (tabReports) {
      tabReports.classList.toggle("hidden", u.role !== "MANAGER");
    }
    if (tabAdminServices) {
      tabAdminServices.classList.toggle("hidden", u.role !== "MANAGER");
    }

    sessionBox.innerHTML = `
      <div class="alert alert-success" style="margin-bottom:0">
        <div>
          <strong>Đang đăng nhập hệ thống</strong><br/>
          Họ tên: <strong>${escapeHtml(u.full_name)}</strong> · Email: <code>${escapeHtml(u.email)}</code> · Vai trò: <span class="code-chip">${ROLE_VI_LABELS[u.role] || u.role}</span>
        </div>
      </div>
    `;
  }

  const bookingNotice = document.getElementById("bookingAuthNotice");
  if (state.currentUser && state.currentUser.role === "CUSTOMER") {
    bookingNotice.classList.add("hidden");
  } else {
    bookingNotice.classList.remove("hidden");
  }

  const staffNotice = document.getElementById("staffActionAuthNotice");
  if (state.currentUser && ["STAFF", "MANAGER"].includes(state.currentUser.role)) {
    staffNotice.classList.add("hidden");
  } else {
    staffNotice.classList.remove("hidden");
  }

  const mgrNotice = document.getElementById("managerAuthNotice");
  if (state.currentUser && state.currentUser.role === "MANAGER") {
    mgrNotice.classList.add("hidden");
  } else {
    mgrNotice.classList.remove("hidden");
  }

  const trackingNotice = document.getElementById("trackingAuthNotice");
  if (trackingNotice) {
    if (state.currentUser) {
      trackingNotice.classList.add("hidden");
    } else {
      trackingNotice.classList.remove("hidden");
    }
  }

  const reportNotice = document.getElementById("reportAuthNotice");
  if (reportNotice) {
    if (state.currentUser && state.currentUser.role === "MANAGER") {
      reportNotice.classList.add("hidden");
    } else {
      reportNotice.classList.remove("hidden");
    }
  }
}

async function handleLoginSubmit(e) {
  if (e) e.preventDefault();
  const email = document.getElementById("loginEmailInput").value.trim();
  const password = document.getElementById("loginPasswordInput").value;
  const btn = document.getElementById("btnLoginSubmit");
  btn.disabled = true;
  try {
    const res = await apiRequest("POST", "/auth/login", { email, password });
    state.token = res.access_token;
    localStorage.setItem("xyz_access_token", res.access_token);
    state.currentUser = res.user;
    renderHeaderAndRoleUI();
    await loadAllRoleData();
    showAlert(
      "success",
      `Xin chào ${res.user.full_name}! Bạn đã đăng nhập với vai trò ${ROLE_VI_LABELS[res.user.role] || res.user.role}.`
    );
  } catch (err) {
    showAlert("danger", `Không thể đăng nhập: ${err.message}`);
  } finally {
    btn.disabled = false;
  }
}

async function fillAndLogin(email, password) {
  document.getElementById("loginEmailInput").value = email;
  document.getElementById("loginPasswordInput").value = password;
  await handleLoginSubmit(null);
}

async function quickLoginAndStay(email, password) {
  document.getElementById("loginEmailInput").value = email;
  document.getElementById("loginPasswordInput").value = password;
  await handleLoginSubmit(null);
}

function handleLogout(customMsg = null) {
  state.token = null;
  state.currentUser = null;
  state.vehicles = [];
  localStorage.removeItem("xyz_access_token");
  renderHeaderAndRoleUI();
  renderBookingFormOptions();
  showAlert("info", customMsg || "Bạn đã đăng xuất khỏi hệ thống.");
}

// ============================================================================
// 4. DANH MỤC DỊCH VỤ & QUẢN TRỊ BẢNG GIÁ
// ============================================================================
async function loadServices() {
  try {
    state.services = await apiRequest("GET", "/services");
    renderServiceCatalog();
    renderBookingFormOptions();
    if (state.currentUser && state.currentUser.role === "MANAGER") {
      state.adminServices = await apiRequest("GET", "/services", null, { include_inactive: "true" });
    } else {
      state.adminServices = [...state.services];
    }
    renderAdminServicesTable();
  } catch (err) {
    showAlert("danger", `Không tải được danh mục dịch vụ: ${err.message}`);
  }
}

function renderServiceCatalog() {
  const grid = document.getElementById("servicesGrid");
  const keyword = (document.getElementById("serviceSearchInput")?.value || "").trim().toLowerCase();
  const durFilter = document.getElementById("serviceDurationFilter")?.value || "ALL";

  const filtered = state.services.filter((s) => {
    const matchText =
      !keyword ||
      s.name.toLowerCase().includes(keyword) ||
      (s.description || "").toLowerCase().includes(keyword);
    let matchDur = true;
    if (durFilter === "FAST") matchDur = s.duration_minutes <= 45;
    if (durFilter === "MEDIUM") matchDur = s.duration_minutes >= 60 && s.duration_minutes <= 90;
    if (durFilter === "LONG") matchDur = s.duration_minutes > 90;
    return matchText && matchDur;
  });

  if (!filtered.length) {
    grid.innerHTML = `<div class="alert alert-info" style="grid-column:1/-1">Không tìm thấy gói dịch vụ nào phù hợp với từ khóa tìm kiếm.</div>`;
    return;
  }

  grid.innerHTML = filtered
    .map(
      (s) => `
      <div class="service-card">
        <div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
            <span class="service-code">Gói DV-${String(s.service_id).padStart(2, "0")}</span>
            <span style="font-size:12px;font-weight:600;color:var(--text-muted)">⏱ Khoảng ${s.duration_minutes} phút</span>
          </div>
          <div style="font-size:15.5px;font-weight:700;color:var(--navy);margin-bottom:6px">${escapeHtml(s.name)}</div>
          <p style="font-size:13px;color:var(--text-muted);margin-bottom:16px">${escapeHtml(s.description || "Quy trình kiểm tra và bảo dưỡng tiêu chuẩn chính hãng XYZ Auto Care.")}</p>
        </div>
        <div>
          <div style="display:flex;justify-content:space-between;align-items:baseline;padding-top:12px;border-top:1px solid var(--border-light);margin-bottom:12px">
            <span style="font-size:12px;color:var(--text-light)">Phí dịch vụ tiêu chuẩn:</span>
            <span class="service-price">${formatVnd(s.reference_price)}</span>
          </div>
          <div style="display:flex;gap:8px">
            <button class="btn btn-outline btn-sm" style="flex:1" onclick="openServiceDetailModal(${s.service_id})">Chi tiết gói</button>
            <button class="btn btn-primary btn-sm" style="flex:1.3" onclick="selectServiceForBooking(${s.service_id})">Đặt lịch ngay</button>
          </div>
        </div>
      </div>
    `
    )
    .join("");
}

async function openServiceDetailModal(serviceId) {
  try {
    const s = await apiRequest("GET", `/services/${serviceId}`);
    document.getElementById("modalServiceTitle").textContent = s.name;
    document.getElementById("modalServiceBody").innerHTML = `
      <div><strong>Mã gói dịch vụ:</strong> <code>DV-${String(s.service_id).padStart(2, "0")}</code></div>
      <div><strong>Thời gian thực hiện dự kiến:</strong> <strong>${s.duration_minutes} phút</strong></div>
      <div><strong>Đơn giá niêm yết tham khảo:</strong> <strong style="color:var(--primary);font-size:16px">${formatVnd(s.reference_price)}</strong> <span style="font-size:12px;color:var(--text-muted)">(Thanh toán tại quầy sau khi nghiệm thu xe)</span></div>
      <div><strong>Chi tiết hạng mục công việc:</strong><br/>${escapeHtml(s.description || "Thực hiện theo quy chuẩn bảo dưỡng chính hãng.")}</div>
    `;
    const btn = document.getElementById("btnModalSelectService");
    btn.onclick = () => {
      closeServiceDetailModal();
      selectServiceForBooking(s.service_id);
    };
    document.getElementById("serviceDetailModal").classList.remove("hidden");
  } catch (err) {
    showAlert("danger", `Không thể tải chi tiết dịch vụ: ${err.message}`);
  }
}

function closeServiceDetailModal() {
  document.getElementById("serviceDetailModal").classList.add("hidden");
}

function selectServiceForBooking(serviceId) {
  switchTab("booking");
  const sel = document.getElementById("bookingServiceSelect");
  if (sel) {
    sel.value = String(serviceId);
    updateBookingSummary();
  }
}

// ---- Quản trị danh mục dịch vụ ----
function renderAdminServicesTable() {
  const tbody = document.getElementById("adminServicesTableBody");
  if (!tbody) return;
  tbody.innerHTML = state.adminServices
    .map(
      (s) => `
      <tr style="${s.is_active === false ? "opacity:0.65;background:#f8fafc" : ""}">
        <td><strong>DV-${String(s.service_id).padStart(2, "0")}</strong></td>
        <td>
          <div style="font-weight:600;color:var(--navy)">${escapeHtml(s.name)}</div>
          <div style="font-size:11.5px;color:var(--text-muted)">${escapeHtml(s.description || "")}</div>
        </td>
        <td>${s.duration_minutes} phút</td>
        <td style="font-weight:700;color:var(--primary)">${formatVnd(s.reference_price)}</td>
        <td>
          ${
            s.is_active !== false
              ? `<span class="status-pill status-COMPLETED">Đang phục vụ</span>`
              : `<span class="status-pill status-REJECTED">Tạm ngừng</span>`
          }
        </td>
        <td>
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            <button class="btn btn-outline btn-sm" onclick="editServiceInForm(${s.service_id})">Sửa</button>
            <button class="btn btn-outline btn-sm" onclick="toggleServiceActive(${s.service_id}, ${s.is_active === false ? "true" : "false"})">
              ${s.is_active === false ? "Mở lại" : "Tạm ngừng"}
            </button>
          </div>
        </td>
      </tr>
    `
    )
    .join("");
}

function editServiceInForm(serviceId) {
  const s = state.adminServices.find((x) => x.service_id === serviceId);
  if (!s) return;
  document.getElementById("adminServiceId").value = s.service_id;
  document.getElementById("adminServiceName").value = s.name;
  document.getElementById("adminServiceDuration").value = s.duration_minutes;
  document.getElementById("adminServicePrice").value = s.reference_price;
  document.getElementById("adminServiceDesc").value = s.description || "";
  document.getElementById("serviceFormTitle").textContent = `Chỉnh sửa Gói dịch vụ DV-${String(s.service_id).padStart(2, "0")}`;
}

function resetServiceForm() {
  document.getElementById("adminServiceId").value = "";
  document.getElementById("adminServiceName").value = "";
  document.getElementById("adminServiceDuration").value = "60";
  document.getElementById("adminServicePrice").value = "450000";
  document.getElementById("adminServiceDesc").value = "";
  document.getElementById("serviceFormTitle").textContent = "Thêm gói dịch vụ mới";
}

async function handleSaveService(e) {
  e.preventDefault();
  const id = document.getElementById("adminServiceId").value;
  const payload = {
    name: document.getElementById("adminServiceName").value.trim(),
    description: document.getElementById("adminServiceDesc").value.trim() || null,
    duration_minutes: Number(document.getElementById("adminServiceDuration").value),
    reference_price: Number(document.getElementById("adminServicePrice").value),
  };
  try {
    if (!id) {
      const created = await apiRequest("POST", "/services", payload);
      showAlert("success", `Đã thêm gói dịch vụ "${created.name}" thành công!`);
    } else {
      const updated = await apiRequest("PATCH", `/services/${id}`, payload);
      showAlert("success", `Đã cập nhật gói dịch vụ "${updated.name}" thành công!`);
    }
    resetServiceForm();
    await loadServices();
  } catch (err) {
    showAlert("danger", `Không thể lưu gói dịch vụ: ${err.message}`);
  }
}

async function toggleServiceActive(serviceId, nextActive) {
  try {
    const updated = await apiRequest("PATCH", `/services/${serviceId}`, { is_active: nextActive });
    showAlert(
      "success",
      `Đã cập nhật trạng thái gói dịch vụ "${updated.name}" sang ${
        updated.is_active ? "Đang phục vụ" : "Tạm ngừng cung cấp"
      }.`
    );
    await loadServices();
  } catch (err) {
    showAlert("danger", `Không thể đổi trạng thái dịch vụ: ${err.message}`);
  }
}

// ============================================================================
// 5. ĐẶT LỊCH HẸN TRỰC TUYẾN & LƯỚI 8 KHUNG GIỜ
// ============================================================================
async function loadVehicles() {
  if (!state.currentUser || state.currentUser.role !== "CUSTOMER") {
    state.vehicles = [];
    renderBookingFormOptions();
    return;
  }
  try {
    state.vehicles = await apiRequest("GET", "/vehicles");
    renderBookingFormOptions();
  } catch (err) {
    showAlert("danger", `Không thể tải danh sách xe: ${err.message}`);
  }
}

function renderBookingFormOptions() {
  const svcSel = document.getElementById("bookingServiceSelect");
  const currentSvc = svcSel.value;
  svcSel.innerHTML = state.services
    .map(
      (s) =>
        `<option value="${s.service_id}">${escapeHtml(s.name)} (${s.duration_minutes} phút — ${formatVnd(s.reference_price)})</option>`
    )
    .join("");
  if (currentSvc && state.services.some((s) => String(s.service_id) === currentSvc)) {
    svcSel.value = currentSvc;
  }

  const vehSel = document.getElementById("bookingVehicleSelect");
  if (!state.currentUser || state.currentUser.role !== "CUSTOMER") {
    vehSel.innerHTML = `<option value="">-- Vui lòng đăng nhập tài khoản Khách hàng để chọn xe --</option>`;
  } else if (!state.vehicles.length) {
    vehSel.innerHTML = `<option value="">-- Chưa có phương tiện nào, bấm "+ Thêm xe mới" ở trên --</option>`;
  } else {
    vehSel.innerHTML = state.vehicles
      .map(
        (v) =>
          `<option value="${v.vehicle_id}">${escapeHtml(v.license_plate)} — ${escapeHtml(v.brand)} ${escapeHtml(v.model || "")} (${v.year || "N/A"})</option>`
      )
      .join("");
  }

  updateBookingSummary();
}

async function loadSlotsForSelectedDate() {
  const dateInput = document.getElementById("bookingDateInput");
  if (!dateInput.value) {
    dateInput.value = getDefaultBookingDate();
  }
  state.selectedDate = dateInput.value;
  document.getElementById("adminSlotDateLabel").textContent = state.selectedDate;

  if (!state.currentUser) {
    state.slots = buildMockSlotsForDate(state.selectedDate);
    renderEightSlotsGrid();
    renderAdminSlotsTable();
    return;
  }

  try {
    state.slots = await apiRequest("GET", "/slots", null, {
      from: state.selectedDate,
      to: state.selectedDate,
    });
    if (state.slots.length && !state.slots.some((s) => s.slot_id === state.selectedSlotId && s.bookable)) {
      const firstOpen = state.slots.find((s) => s.bookable);
      state.selectedSlotId = firstOpen ? firstOpen.slot_id : null;
    }
    renderEightSlotsGrid();
    renderAdminSlotsTable();
    updateBookingSummary();
  } catch (err) {
    showAlert("danger", `Không thể tải danh sách khung giờ: ${err.message}`);
  }
}

const CLOSED_REASON_LABELS = {
  FULL: "ĐÃ ĐẦY CHỖ",
  IN_PAST: "ĐÃ QUA GIỜ",
  TOO_SOON: "CẦN ĐẶT TRƯỚC 2H",
  TOO_FAR: "NGOÀI 14 NGÀY",
};

function renderSlotBoxHtml(slot) {
  const timeRange = `${slot.start_time.slice(0, 5)} – ${slot.end_time.slice(0, 5)}`;
  const isSelected = state.selectedSlotId === slot.slot_id && slot.bookable;
  let boxClass = "slot-box ";
  let badgeHtml = "";

  if (slot.bookable) {
    boxClass += isSelected ? "selected" : "bookable";
    badgeHtml = `<span class="slot-status" style="background:#dcfce7;color:#166534">${isSelected ? "✓ Đang chọn" : "Còn " + slot.remaining + " chỗ trống"}</span>`;
  } else if (slot.closed_reason === "FULL") {
    boxClass += "closed-FULL";
    badgeHtml = `<span class="slot-status" style="background:#fee2e2;color:#991b1b">Hết chỗ (0/${slot.max_capacity})</span>`;
  } else {
    boxClass += "closed-other";
    const reasonText = CLOSED_REASON_LABELS[slot.closed_reason] || slot.closed_reason;
    badgeHtml = `<span class="slot-status" style="background:#e2e8f0;color:#475569">${reasonText}</span>`;
  }

  const clickHandler = slot.bookable ? `onclick="selectSlot(${slot.slot_id})"` : "";
  return `
    <div class="${boxClass}" ${clickHandler}>
      <div class="slot-time">${timeRange}</div>
      <div class="slot-cap">Đã nhận ${slot.booked}/${slot.max_capacity} xe</div>
      ${badgeHtml}
    </div>
  `;
}

function renderEightSlotsGrid() {
  const morningEl = document.getElementById("morningSlotsGrid");
  const afternoonEl = document.getElementById("afternoonSlotsGrid");

  if (!state.slots.length) {
    const msg = `<div class="alert alert-warning" style="grid-column:1/-1;margin-bottom:0">Ngày <strong>${state.selectedDate}</strong> là Chủ nhật (Trung tâm nghỉ làm việc Chủ nhật hàng tuần). Quý khách vui lòng chọn ngày từ Thứ 2 đến Thứ 7.</div>`;
    morningEl.innerHTML = msg;
    afternoonEl.innerHTML = "";
    return;
  }

  const morningSlots = state.slots.filter((s) => s.start_time < "12:00:00");
  const afternoonSlots = state.slots.filter((s) => s.start_time >= "13:00:00");

  morningEl.innerHTML = morningSlots.map(renderSlotBoxHtml).join("");
  afternoonEl.innerHTML = afternoonSlots.map(renderSlotBoxHtml).join("");
}

function selectSlot(slotId) {
  state.selectedSlotId = slotId;
  renderEightSlotsGrid();
  updateBookingSummary();
}

function updateBookingSummary() {
  const box = document.getElementById("bookingSummaryBox");
  const svcId = Number(document.getElementById("bookingServiceSelect")?.value);
  const vehId = Number(document.getElementById("bookingVehicleSelect")?.value);
  const svc = state.services.find((s) => s.service_id === svcId);
  const veh = state.vehicles.find((v) => v.vehicle_id === vehId);
  const slot = state.slots.find((s) => s.slot_id === state.selectedSlotId);
  const note = document.getElementById("bookingNoteInput")?.value.trim() || "(Không có ghi chú riêng)";

  box.innerHTML = `
    <div style="padding:14px;border-radius:8px;background:var(--surface-alt);border:1px solid var(--border);display:grid;gap:8px">
      <div><strong>Khách hàng đặt lịch:</strong> ${state.currentUser ? escapeHtml(state.currentUser.full_name) + " (" + escapeHtml(state.currentUser.email) + ")" : '<span style="color:var(--danger)">Chưa đăng nhập tài khoản Khách hàng</span>'}</div>
      <div><strong>Phương tiện:</strong> ${veh ? `<code>${escapeHtml(veh.license_plate)}</code> — ${escapeHtml(veh.brand)} ${escapeHtml(veh.model || "")}` : '<span style="color:var(--danger)">Chưa chọn phương tiện</span>'}</div>
      <div><strong>Gói dịch vụ:</strong> ${svc ? `<strong>${escapeHtml(svc.name)}</strong> (Dự kiến ${svc.duration_minutes} phút)` : "Chưa chọn"}</div>
      <div><strong>Chi phí dự kiến:</strong> <strong style="color:var(--primary)">${svc ? formatVnd(svc.reference_price) : "0 ₫"}</strong></div>
      <div><strong>Thời gian tiếp nhận:</strong> ${
        slot
          ? `Ngày <strong>${slot.slot_date}</strong> · Khung giờ <strong>${slot.start_time.slice(0, 5)} – ${slot.end_time.slice(0, 5)}</strong> (Còn ${slot.remaining}/${slot.max_capacity} chỗ trống)`
          : '<span style="color:var(--danger)">Chưa chọn khung giờ khả dụng</span>'
      }</div>
      <div><strong>Ghi chú tình trạng xe:</strong> ${escapeHtml(note)}</div>
    </div>
  `;
}

async function handleSubmitBooking() {
  if (!state.currentUser || state.currentUser.role !== "CUSTOMER") {
    showAlert("warning", "Quý khách vui lòng đăng nhập tài khoản Khách hàng trước khi xác nhận đặt lịch.");
    return;
  }
  const vehicleId = Number(document.getElementById("bookingVehicleSelect").value);
  const serviceId = Number(document.getElementById("bookingServiceSelect").value);
  const slotId = state.selectedSlotId;
  const note = document.getElementById("bookingNoteInput").value;

  if (!vehicleId) {
    showAlert("warning", "Vui lòng chọn phương tiện hoặc bấm '+ Thêm xe mới' trước khi đặt lịch.");
    return;
  }
  if (!slotId) {
    showAlert("warning", "Vui lòng chọn một khung giờ còn chỗ trống trên lịch.");
    return;
  }

  const btn = document.getElementById("btnSubmitBooking");
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = "Đang xử lý đặt lịch...";

  try {
    const created = await apiRequest("POST", "/appointments", {
      vehicle_id: vehicleId,
      service_id: serviceId,
      slot_id: slotId,
      note: note || null,
    });

    if (!state.recentAppointmentIds.includes(created.appointment_id)) {
      state.recentAppointmentIds.unshift(created.appointment_id);
      localStorage.setItem("xyz_recent_appts", JSON.stringify(state.recentAppointmentIds.slice(0, 8)));
    }
    renderRecentAppointmentChips();

    await loadSlotsForSelectedDate();
    await loadMyAppointments();

    const card = document.getElementById("lastCreatedBookingCard");
    const body = document.getElementById("lastCreatedBookingBody");
    card.classList.remove("hidden");
    body.innerHTML = `
      <div><strong>Mã phiếu hẹn:</strong> <span class="code-chip">#${created.appointment_id}</span></div>
      <div><strong>Trạng thái hiện tại:</strong> <span class="status-pill status-${created.status}">${STATUS_VI_LABELS[created.status] || created.status} (Đã giữ chỗ)</span></div>
      <div><strong>Phương tiện &amp; Gói dịch vụ:</strong> <code>${escapeHtml(created.vehicle.license_plate)}</code> · ${escapeHtml(created.service.name)}</div>
      <div><strong>Thời gian hẹn:</strong> Ngày ${created.slot.slot_date} (${created.slot.start_time.slice(0, 5)} – ${created.slot.end_time.slice(0, 5)})</div>
      <div><strong>Thời điểm ghi nhận:</strong> <code>${escapeHtml(created.created_at)}</code></div>
      <div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn btn-primary btn-sm" onclick="openAppointmentInTracking(${created.appointment_id})">
          Xem trong Lịch hẹn của tôi →
        </button>
      </div>
    `;

    showAlert(
      "success",
      `Đặt lịch hẹn thành công! Mã phiếu #${created.appointment_id} đã được giữ chỗ và đang chờ Cố vấn dịch vụ xác nhận.`
    );
  } catch (err) {
    if (err.code === "SLOT_FULL") {
      await loadSlotsForSelectedDate();
      showAlert(
        "danger",
        `Khung giờ Quý khách vừa chọn đã nhận đủ số lượng xe. Hệ thống đã tự động làm mới tình trạng chỗ trống, vui lòng chọn khung giờ khác.`
      );
    } else {
      showAlert("danger", `Không thể hoàn tất đặt lịch: ${err.message}`);
    }
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
}

// ---- Modal Thêm xe mới ----
function openVehicleModal() {
  if (!state.currentUser || state.currentUser.role !== "CUSTOMER") {
    showAlert("warning", "Vui lòng đăng nhập tài khoản Khách hàng để thêm phương tiện mới.");
    return;
  }
  document.getElementById("newVehiclePlate").value = "";
  document.getElementById("newVehicleBrand").value = "";
  document.getElementById("newVehicleModel").value = "";
  document.getElementById("vehicleModal").classList.remove("hidden");
}

function closeVehicleModal() {
  document.getElementById("vehicleModal").classList.add("hidden");
}

async function handleAddVehicleSubmit(e) {
  e.preventDefault();
  const btn = document.getElementById("btnAddVehicleSubmit");
  btn.disabled = true;
  try {
    const created = await apiRequest("POST", "/vehicles", {
      license_plate: document.getElementById("newVehiclePlate").value,
      brand: document.getElementById("newVehicleBrand").value,
      model: document.getElementById("newVehicleModel").value || null,
      year: Number(document.getElementById("newVehicleYear").value) || null,
    });
    closeVehicleModal();
    await loadVehicles();
    document.getElementById("bookingVehicleSelect").value = String(created.vehicle_id);
    updateBookingSummary();
    showAlert("success", `Đã thêm phương tiện biển số ${created.license_plate} (${created.brand}) vào hồ sơ của Quý khách!`);
  } catch (err) {
    showAlert("danger", `Không thể thêm phương tiện: ${err.message}`);
  } finally {
    btn.disabled = false;
  }
}

// ============================================================================
// 6. TRA CỨU & ĐIỀU PHỐI LỊCH HẸN DÀNH CHO CỐ VẤN DỊCH VỤ
// ============================================================================
function renderRecentAppointmentChips() {
  const bar = document.getElementById("recentAppointmentsBar");
  if (!bar) return;
  if (!state.recentAppointmentIds.length) {
    bar.innerHTML = "";
    return;
  }
  bar.innerHTML =
    `Phiếu hẹn gần đây: ` +
    state.recentAppointmentIds
      .map(
        (id) =>
          `<button class="btn btn-outline btn-sm" style="margin-right:6px;padding:2px 8px" onclick="openAppointmentInLookup(${id})">#${id}</button>`
      )
      .join("");
}

async function openAppointmentInLookup(appointmentId) {
  const tabLookup = document.getElementById("tabLookup");
  if (tabLookup) tabLookup.classList.remove("hidden");
  switchTab("lookup");
  document.getElementById("lookupAppointmentIdInput").value = appointmentId;
  await handleLookupAppointment();
}

async function handleLookupAppointment() {
  const id = Number(document.getElementById("lookupAppointmentIdInput").value);
  if (!id) return;
  const box = document.getElementById("appointmentDetailBox");
  try {
    const a = await apiRequest("GET", `/appointments/${id}`);
    state.currentLookupAppointment = a;
    const historyRows = (a.history || [])
      .map(
        (h) => `
        <tr>
          <td><span class="code-chip">${escapeHtml(STATUS_VI_LABELS[h.old_status] || h.old_status || "Khởi tạo")}</span> → <strong>${escapeHtml(STATUS_VI_LABELS[h.new_status] || h.new_status)}</strong></td>
          <td>Mã NV/KH #${h.changed_by}</td>
          <td><code>${escapeHtml(h.changed_at)}</code></td>
          <td>${escapeHtml(h.note || "—")}</td>
        </tr>
      `
      )
      .join("");

    box.innerHTML = `
      <div style="padding:16px;border:1px solid var(--border);border-radius:8px;background:var(--surface-alt)">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px">
          <div style="font-size:16px;font-weight:700;color:var(--navy)">Phiếu Lịch hẹn #${a.appointment_id}</div>
          <span class="status-pill status-${a.status}">${STATUS_VI_LABELS[a.status] || a.status}</span>
        </div>
        <div style="display:grid;gap:6px;font-size:13.5px;margin-bottom:14px">
          <div><strong>Khách hàng:</strong> ${escapeHtml(a.customer.full_name)}</div>
          <div><strong>Phương tiện:</strong> <code>${escapeHtml(a.vehicle.license_plate)}</code> — ${escapeHtml(a.vehicle.brand)} ${escapeHtml(a.vehicle.model || "")}</div>
          <div><strong>Gói dịch vụ:</strong> ${escapeHtml(a.service.name)} (${a.service.duration_minutes} phút · ${formatVnd(a.service.reference_price)})</div>
          <div><strong>Thời gian hẹn:</strong> Ngày <strong>${a.slot.slot_date}</strong> · Ca <strong>${a.slot.start_time.slice(0, 5)} – ${a.slot.end_time.slice(0, 5)}</strong></div>
          <div><strong>Ghi chú của khách:</strong> ${escapeHtml(a.note || "(Không có ghi chú)")}</div>
          <div><strong>Cố vấn phụ trách:</strong> ${a.handled_by ? `Nhân sự #${a.handled_by}` : "Chưa phân công"}</div>
          ${a.reject_reason ? `<div style="color:var(--danger)"><strong>Lý do từ chối tiếp nhận:</strong> ${escapeHtml(a.reject_reason)}</div>` : ""}
        </div>

        <div style="font-weight:600;font-size:13px;margin-bottom:8px;color:var(--navy)">Nhật ký xử lý phiếu hẹn:</div>
        <table class="data-table">
          <thead>
            <tr>
              <th>Bước chuyển trạng thái</th>
              <th>Người thực hiện</th>
              <th>Thời gian ghi nhận</th>
              <th>Ghi chú / Lý do</th>
            </tr>
          </thead>
          <tbody>${historyRows}</tbody>
        </table>
      </div>
    `;
  } catch (err) {
    box.innerHTML = `<div class="alert alert-danger"><strong>Không tìm thấy phiếu hẹn:</strong> ${escapeHtml(err.message)}</div>`;
  }
}

async function handleConfirmAppointment() {
  const id = Number(document.getElementById("lookupAppointmentIdInput").value);
  if (!id) return;
  try {
    const updated = await apiRequest("POST", `/appointments/${id}/confirm`);
    showAlert(
      "success",
      `Đã xác nhận tiếp nhận phiếu hẹn #${updated.appointment_id} thành công!`
    );
    await handleLookupAppointment();
    await loadSlotsForSelectedDate();
  } catch (err) {
    showAlert("danger", `Không thể xác nhận phiếu hẹn: ${err.message}`);
  }
}

async function handleRejectAppointment() {
  const id = Number(document.getElementById("lookupAppointmentIdInput").value);
  const reason = document.getElementById("rejectReasonInput").value;
  if (!id) return;
  try {
    const updated = await apiRequest("POST", `/appointments/${id}/reject`, { reason });
    showAlert(
      "success",
      `Đã từ chối tiếp nhận phiếu hẹn #${updated.appointment_id} và hoàn trả chỗ trống cho khung giờ.`
    );
    document.getElementById("rejectReasonInput").value = "";
    await handleLookupAppointment();
    await loadSlotsForSelectedDate();
  } catch (err) {
    showAlert("danger", `Không thể từ chối phiếu hẹn: ${err.message}`);
  }
}

async function handleStartAppointment() {
  const id = Number(document.getElementById("lookupAppointmentIdInput").value);
  if (!id) return;
  try {
    const updated = await apiRequest("POST", `/appointments/${id}/start`);
    showAlert(
      "success",
      `Đã tiếp nhận xe của phiếu hẹn #${updated.appointment_id} vào xưởng thực hiện bảo dưỡng!`
    );
    await handleLookupAppointment();
    await loadMyAppointments();
  } catch (err) {
    showAlert("danger", `Không thể cập nhật tiến độ: ${err.message}`);
  }
}

async function handleCompleteAppointment() {
  const id = Number(document.getElementById("lookupAppointmentIdInput").value);
  if (!id) return;
  try {
    const updated = await apiRequest("POST", `/appointments/${id}/complete`);
    showAlert(
      "success",
      `Đã hoàn tất bảo dưỡng và bàn giao xe cho phiếu hẹn #${updated.appointment_id}!`
    );
    await handleLookupAppointment();
    await loadSlotsForSelectedDate();
    await loadMyAppointments();
  } catch (err) {
    showAlert("danger", `Không thể hoàn tất phiếu hẹn: ${err.message}`);
  }
}

// ============================================================================
// 7. QUẢN LÝ CÔNG SUẤT CA LÀM VIỆC
// ============================================================================
function renderAdminSlotsTable() {
  const sel = document.getElementById("adminSlotSelect");
  const tbody = document.getElementById("adminSlotsTableBody");
  if (!sel || !tbody) return;

  sel.innerHTML = state.slots
    .map(
      (s) =>
        `<option value="${s.slot_id}">Ca ${s.start_time.slice(0, 5)} – ${s.end_time.slice(0, 5)} (Mã #${s.slot_id}) · Đã đặt ${s.booked}/${s.max_capacity} xe</option>`
    )
    .join("");

  tbody.innerHTML = state.slots
    .map(
      (s) => `
      <tr>
        <td><strong>#${s.slot_id}</strong></td>
        <td>${s.start_time.slice(0, 5)} – ${s.end_time.slice(0, 5)}</td>
        <td>${s.booked} xe</td>
        <td><strong>${s.max_capacity} xe</strong></td>
        <td>${s.remaining} chỗ</td>
        <td>${s.bookable ? '<span class="status-pill status-COMPLETED">Đang nhận xe</span>' : `<span class="status-pill status-REJECTED">${CLOSED_REASON_LABELS[s.closed_reason] || s.closed_reason}</span>`}</td>
      </tr>
    `
    )
    .join("");
}

async function handleUpdateSlotCapacity() {
  const slotId = Number(document.getElementById("adminSlotSelect").value);
  const maxCap = Number(document.getElementById("adminSlotCapacityInput").value);
  if (!slotId) return;
  try {
    const updated = await apiRequest("PATCH", `/slots/${slotId}`, { max_capacity: maxCap });
    showAlert(
      "success",
      `Đã cập nhật công suất tối đa ca ${updated.start_time.slice(0, 5)}–${updated.end_time.slice(0, 5)} thành ${updated.max_capacity} xe (Còn trống ${updated.remaining} chỗ).`
    );
    await loadSlotsForSelectedDate();
  } catch (err) {
    showAlert("danger", `Không thể cập nhật công suất ca: ${err.message}`);
  }
}

// ============================================================================
// 8. LỊCH HẸN CỦA TÔI & THEO DÕI TIẾN ĐỘ TRỰC TUYẾN
// ============================================================================
const STATUS_VI_LABELS = {
  PENDING: "Chờ xác nhận",
  CONFIRMED: "Đã xác nhận",
  IN_PROGRESS: "Đang thực hiện",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
  REJECTED: "Từ chối",
};

async function loadMyAppointments() {
  if (!state.currentUser) {
    state.myAppointments = [];
    renderTrackingKpis([]);
    renderTrackingListAndDetail();
    return;
  }
  const statusVal = document.getElementById("trackingStatusFilter")?.value || "";
  const fromVal = document.getElementById("trackingFromFilter")?.value || "";
  const toVal = document.getElementById("trackingToFilter")?.value || "";

  const query = {};
  if (statusVal) query.status = statusVal;
  if (fromVal) query.from = fromVal;
  if (toVal) query.to = toVal;

  try {
    const allList = await apiRequest("GET", "/appointments");
    renderTrackingKpis(allList);

    const list = Object.keys(query).length ? await apiRequest("GET", "/appointments", null, query) : allList;
    state.myAppointments = list;
    if (list.length && !list.some((a) => a.appointment_id === state.selectedTrackingId)) {
      state.selectedTrackingId = list[0].appointment_id;
    }
    renderTrackingListAndDetail();
  } catch (err) {
    showAlert("danger", `Không thể tải danh sách lịch hẹn: ${err.message}`);
  }
}

function renderTrackingKpis(allList) {
  const strip = document.getElementById("trackingKpiStrip");
  if (!strip) return;
  const currentFilter = document.getElementById("trackingStatusFilter")?.value || "";
  const counts = {
    ALL: allList.length,
    PENDING: 0,
    CONFIRMED: 0,
    IN_PROGRESS: 0,
    COMPLETED: 0,
    CANCELLED: 0,
    REJECTED: 0,
  };
  allList.forEach((a) => {
    if (counts[a.status] !== undefined) counts[a.status]++;
  });

  const kpiItems = [
    { key: "", label: "Tất cả phiếu hẹn", count: counts.ALL },
    { key: "PENDING", label: "Chờ xác nhận", count: counts.PENDING },
    { key: "CONFIRMED", label: "Đã xác nhận", count: counts.CONFIRMED },
    { key: "IN_PROGRESS", label: "Đang bảo dưỡng", count: counts.IN_PROGRESS },
    { key: "COMPLETED", label: "Hoàn thành", count: counts.COMPLETED },
    { key: "REJECTED", label: "Từ chối tiếp nhận", count: counts.REJECTED },
    { key: "CANCELLED", label: "Đã hủy", count: counts.CANCELLED },
  ];

  strip.innerHTML = kpiItems
    .map(
      (item) => `
      <div class="kpi-box ${currentFilter === item.key ? "active" : ""}" onclick="filterTrackingByStatus('${item.key}')">
        <div class="kpi-num">${item.count}</div>
        <div class="kpi-label">${item.label}</div>
      </div>
    `
    )
    .join("");
}

function filterTrackingByStatus(statusKey) {
  const sel = document.getElementById("trackingStatusFilter");
  if (sel) {
    sel.value = statusKey;
    loadMyAppointments();
  }
}

function resetTrackingFilters() {
  document.getElementById("trackingStatusFilter").value = "";
  document.getElementById("trackingFromFilter").value = "";
  document.getElementById("trackingToFilter").value = "";
  document.getElementById("trackingKeywordInput").value = "";
  loadMyAppointments();
}

function selectTrackingAppointment(appointmentId) {
  state.selectedTrackingId = appointmentId;
  renderTrackingListAndDetail();
}

async function openAppointmentInTracking(appointmentId) {
  switchTab("tracking");
  await loadMyAppointments();
  state.selectedTrackingId = appointmentId;
  renderTrackingListAndDetail();
}

function buildStepperHtml(appt) {
  const stages = [
    { code: "PENDING", title: "1. Đã gửi yêu cầu", desc: "Giữ chỗ khung giờ" },
    { code: "CONFIRMED", title: "2. Đã xác nhận", desc: "Sẵn sàng đón xe" },
    { code: "IN_PROGRESS", title: "3. Đang thực hiện", desc: "Kỹ thuật viên xử lý" },
    { code: "COMPLETED", title: "4. Hoàn thành", desc: "Nghiệm thu & Bàn giao" },
  ];
  const orderMap = { PENDING: 0, CONFIRMED: 1, IN_PROGRESS: 2, COMPLETED: 3 };

  if (appt.status === "REJECTED" || appt.status === "CANCELLED") {
    return `
      <div class="stepper-track">
        <div class="step-node done">
          <div><strong>1. Đã gửi yêu cầu</strong></div>
          <div style="font-size:11px">Hệ thống ghi nhận</div>
        </div>
        <div class="step-node terminated" style="grid-column:span 3">
          <div><strong>✕ ${STATUS_VI_LABELS[appt.status]}</strong></div>
          <div style="font-size:11.5px;margin-top:2px">
            ${
              appt.status === "REJECTED"
                ? `Lý do từ chối: "${escapeHtml(appt.reject_reason || "Không có")}" · Đã giải phóng chỗ trống`
                : "Khách hàng đã chủ động hủy lịch hẹn · Đã giải phóng chỗ trống"
            }
          </div>
        </div>
      </div>
    `;
  }

  const currIdx = orderMap[appt.status] ?? 0;
  return `
    <div class="stepper-track">
      ${stages
        .map((st, idx) => {
          let cls = "step-node";
          if (idx < currIdx) cls += " done";
          else if (idx === currIdx) cls += " current";
          return `
            <div class="${cls}">
              <div><strong>${st.title}</strong></div>
              <div style="font-size:11px;margin-top:2px">${st.desc}</div>
            </div>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderTrackingListAndDetail() {
  const listEl = document.getElementById("trackingAppointmentsList");
  const detailEl = document.getElementById("trackingDetailPanel");
  const headerEl = document.getElementById("trackingListHeader");
  if (!listEl || !detailEl) return;

  if (!state.currentUser) {
    headerEl.textContent = "Danh sách Lịch hẹn";
    listEl.innerHTML = `<div class="alert alert-info">Vui lòng đăng nhập để xem lịch hẹn của Quý khách.</div>`;
    detailEl.innerHTML = `<div class="alert alert-info">Chọn một phiếu hẹn để xem chi tiết tiến trình.</div>`;
    return;
  }

  const kw = (document.getElementById("trackingKeywordInput")?.value || "").trim().toLowerCase();
  const filtered = state.myAppointments.filter((a) => {
    if (!kw) return true;
    return (
      String(a.appointment_id).includes(kw) ||
      `#${a.appointment_id}`.includes(kw) ||
      a.vehicle.license_plate.toLowerCase().includes(kw) ||
      (a.vehicle.brand || "").toLowerCase().includes(kw) ||
      a.service.name.toLowerCase().includes(kw)
    );
  });

  headerEl.textContent = `Danh sách Lịch hẹn (${filtered.length} phiếu)`;

  if (!filtered.length) {
    listEl.innerHTML = `<div class="alert alert-info">Không tìm thấy lịch hẹn nào phù hợp với bộ lọc.</div>`;
    detailEl.innerHTML = `<div class="alert alert-info">Chọn một phiếu lịch hẹn bên trái hoặc đặt lịch mới để theo dõi.</div>`;
    return;
  }

  if (!filtered.some((a) => a.appointment_id === state.selectedTrackingId)) {
    state.selectedTrackingId = filtered[0].appointment_id;
  }

  listEl.innerHTML = filtered
    .map((a) => {
      const isSel = a.appointment_id === state.selectedTrackingId;
      return `
        <div class="appt-list-item ${isSel ? "selected" : ""}" onclick="selectTrackingAppointment(${a.appointment_id})">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;gap:8px;flex-wrap:wrap">
            <div>
              <strong style="font-size:14.5px;color:var(--navy)">Phiếu hẹn #${a.appointment_id}</strong>
              <span style="font-size:12.5px;color:var(--text-muted);margin-left:6px">· <code>${escapeHtml(a.vehicle.license_plate)}</code> (${escapeHtml(a.vehicle.brand)})</span>
            </div>
            <span class="status-pill status-${a.status}">${STATUS_VI_LABELS[a.status] || a.status}</span>
          </div>
          <div style="font-size:13.5px;font-weight:600;color:var(--primary);margin-bottom:6px">
            ${escapeHtml(a.service.name)} · ${formatVnd(a.service.reference_price)}
          </div>
          <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-muted);flex-wrap:wrap;gap:6px">
            <span>Ngày hẹn: <strong>${a.slot.slot_date}</strong> (${a.slot.start_time.slice(0, 5)} – ${a.slot.end_time.slice(0, 5)})</span>
            <span>Số lần đổi lịch: <strong>${a.change_count}/2</strong></span>
          </div>
        </div>
      `;
    })
    .join("");

  const sel = filtered.find((a) => a.appointment_id === state.selectedTrackingId) || filtered[0];
  const timelineHtml = (sel.history || [])
    .map(
      (h, idx) => `
      <div class="timeline-item">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px">
          <div>
            <strong>Cập nhật lần ${idx + 1}:</strong>
            <span style="color:var(--text-muted)">${escapeHtml(STATUS_VI_LABELS[h.old_status] || h.old_status || "Khởi tạo phiếu")}</span> →
            <span class="status-pill status-${h.new_status}">${escapeHtml(STATUS_VI_LABELS[h.new_status] || h.new_status)}</span>
          </div>
          <span style="font-size:11.5px;color:var(--text-muted)"><code>${escapeHtml(h.changed_at)}</code></span>
        </div>
        <div style="font-size:12px;color:var(--text-muted)">
          Thực hiện bởi: <strong>Tài khoản #${h.changed_by}</strong>
          ${h.note ? ` · Nội dung: <strong style="color:var(--navy)">"${escapeHtml(h.note)}"</strong>` : ""}
        </div>
      </div>
    `
    )
    .join("");

  detailEl.innerHTML = `
    <div style="padding:18px;border:1px solid var(--border);border-radius:10px;background:var(--surface)">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;padding-bottom:12px;border-bottom:1px solid var(--border-light)">
        <div>
          <div style="font-size:16px;font-weight:700;color:var(--navy)">Phiếu Bảo dưỡng #${sel.appointment_id}</div>
          <div style="font-size:12px;color:var(--text-muted)">Ngày đăng ký: <code>${escapeHtml(sel.created_at)}</code></div>
        </div>
        <span class="status-pill status-${sel.status}" style="font-size:12.5px;padding:4px 12px">${STATUS_VI_LABELS[sel.status] || sel.status}</span>
      </div>

      ${buildStepperHtml(sel)}

      ${
        sel.reject_reason
          ? `<div class="alert alert-danger" style="margin-bottom:14px">
               <div><strong>Phản hồi từ Trung tâm:</strong> ${escapeHtml(sel.reject_reason)}</div>
             </div>`
          : ""
      }

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:13px;padding:14px;background:var(--surface-alt);border-radius:8px;border:1px solid var(--border-light);margin-bottom:16px">
        <div><strong>Khách hàng:</strong> ${escapeHtml(sel.customer.full_name)}</div>
        <div><strong>Phương tiện:</strong> <code>${escapeHtml(sel.vehicle.license_plate)}</code> (${escapeHtml(sel.vehicle.brand)} ${escapeHtml(sel.vehicle.model || "")})</div>
        <div><strong>Gói dịch vụ:</strong> ${escapeHtml(sel.service.name)} (${sel.service.duration_minutes} phút)</div>
        <div><strong>Chi phí tham khảo:</strong> <strong style="color:var(--primary)">${formatVnd(sel.service.reference_price)}</strong></div>
        <div><strong>Thời gian hẹn:</strong> <strong>${sel.slot.slot_date}</strong> (${sel.slot.start_time.slice(0, 5)} – ${sel.slot.end_time.slice(0, 5)})</div>
        <div><strong>Lượt đổi lịch đã dùng:</strong> <strong>${sel.change_count} / 2 lần</strong></div>
        <div style="grid-column:1/-1"><strong>Yêu cầu / Ghi chú của khách:</strong> ${escapeHtml(sel.note || "(Không có ghi chú)")}</div>
        <div style="grid-column:1/-1"><strong>Cố vấn dịch vụ phụ trách:</strong> ${sel.handled_by ? `Cố vấn #${sel.handled_by}` : "Đang chờ phân công cố vấn"}</div>
      </div>

      ${buildTrackingActionsHtml(sel)}

      <div style="font-weight:600;font-size:13.5px;color:var(--navy);margin-bottom:10px">
        Nhật ký Tiến trình Dịch vụ:
      </div>
      <div class="timeline-list">
        ${timelineHtml}
      </div>
    </div>
  `;
}

function buildTrackingActionsHtml(sel) {
  if (!state.currentUser) return "";
  if (state.currentUser.role === "CUSTOMER") {
    const canModify = ["PENDING", "CONFIRMED"].includes(sel.status);
    const canResched = canModify && (sel.change_count || 0) < 2;
    return `
      <div style="padding:14px;border:1px solid #bfdbfe;background:#eff6ff;border-radius:8px;margin-bottom:16px">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:6px">
          <div style="font-weight:600;font-size:13.5px;color:#1e3a8a">
            Thay đổi hoặc Hủy lịch hẹn
          </div>
          <span class="code-chip">Đã đổi: ${sel.change_count}/2 lần</span>
        </div>
        <div style="font-size:12px;color:#1e40af;margin-bottom:10px">
          Quý khách có thể đổi khung giờ hoặc hủy lịch miễn phí trước giờ hẹn ít nhất <strong>4 giờ</strong> khi lịch đang ở trạng thái Chờ xác nhận hoặc Đã xác nhận.
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <button class="btn btn-primary btn-sm" ${canResched ? "" : "disabled"} onclick="openRescheduleModal(${sel.appointment_id})">
            Đổi khung giờ / gói dịch vụ
          </button>
          <button class="btn btn-danger btn-sm" ${canModify ? "" : "disabled"} onclick="handleCancelMyAppointment(${sel.appointment_id})">
            Hủy lịch hẹn này
          </button>
        </div>
      </div>
    `;
  }

  return `
    <div style="padding:14px;border:1px solid var(--border);background:var(--surface-alt);border-radius:8px;margin-bottom:16px">
      <div style="font-weight:600;font-size:13.5px;color:var(--navy);margin-bottom:8px">
        Thao tác Điều phối nhanh (Dành cho Cố vấn dịch vụ &amp; Quản lý):
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn btn-success btn-sm" ${sel.status === "PENDING" ? "" : "disabled"} onclick="quickStaffTransition(${sel.appointment_id}, 'confirm')">
          ✓ Xác nhận lịch hẹn
        </button>
        <button class="btn btn-primary btn-sm" ${sel.status === "CONFIRMED" ? "" : "disabled"} onclick="quickStaffTransition(${sel.appointment_id}, 'start')">
          ▶ Tiếp nhận xe vào xưởng
        </button>
        <button class="btn btn-success btn-sm" ${sel.status === "IN_PROGRESS" ? "" : "disabled"} onclick="quickStaffTransition(${sel.appointment_id}, 'complete')">
          ✓ Hoàn thành &amp; Bàn giao
        </button>
        <button class="btn btn-outline btn-sm" onclick="openAppointmentInLookup(${sel.appointment_id})">
          Mở bảng điều phối chi tiết →
        </button>
      </div>
    </div>
  `;
}

async function quickStaffTransition(appointmentId, action) {
  try {
    const updated = await apiRequest("POST", `/appointments/${appointmentId}/${action}`);
    showAlert("success", `Đã cập nhật phiếu hẹn #${updated.appointment_id} sang trạng thái "${STATUS_VI_LABELS[updated.status] || updated.status}"!`);
    await loadMyAppointments();
    await loadSlotsForSelectedDate();
  } catch (err) {
    showAlert("danger", `Không thể cập nhật trạng thái: ${err.message}`);
  }
}

// ============================================================================
// 8.2. ĐỔI LỊCH & HỦY LỊCH CỦA KHÁCH HÀNG
// ============================================================================
async function openRescheduleModal(appointmentId) {
  const appt = state.myAppointments.find((a) => a.appointment_id === appointmentId);
  if (!appt) return;
  document.getElementById("rescheduleApptId").value = String(appointmentId);
  document.getElementById("rescheduleCurrentInfo").innerHTML = `
    <div><strong>Phiếu hẹn đang chọn:</strong> #${appt.appointment_id} · Phương tiện <code>${escapeHtml(appt.vehicle.license_plate)}</code> · Trạng thái: <span class="status-pill status-${appt.status}">${STATUS_VI_LABELS[appt.status] || appt.status}</span></div>
    <div style="margin-top:4px"><strong>Lịch hiện tại:</strong> Ngày ${appt.slot.slot_date} (${appt.slot.start_time.slice(0, 5)} – ${appt.slot.end_time.slice(0, 5)}) · <strong>Số lần đã đổi:</strong> ${appt.change_count}/2 lần</div>
  `;
  const dateInput = document.getElementById("rescheduleDateInput");
  dateInput.value = appt.slot.slot_date || getDefaultBookingDate();

  const svcSel = document.getElementById("rescheduleServiceSelect");
  svcSel.innerHTML = state.services
    .map(
      (s) =>
        `<option value="${s.service_id}" ${s.service_id === appt.service.service_id ? "selected" : ""}>${escapeHtml(s.name)} (${s.duration_minutes} phút · ${formatVnd(s.reference_price)})</option>`
    )
    .join("");

  document.getElementById("rescheduleModal").classList.remove("hidden");
  await loadRescheduleSlots(appt.slot.slot_id);
}

function closeRescheduleModal() {
  document.getElementById("rescheduleModal").classList.add("hidden");
}

async function loadRescheduleSlots(currentSlotId = null) {
  const d = document.getElementById("rescheduleDateInput").value || getDefaultBookingDate();
  const sel = document.getElementById("rescheduleSlotSelect");
  try {
    const slots = await apiRequest("GET", "/slots", null, { from: d, to: d });
    if (!slots.length) {
      sel.innerHTML = `<option value="">Trung tâm nghỉ Chủ nhật — Vui lòng chọn ngày Thứ 2 đến Thứ 7</option>`;
      return;
    }
    sel.innerHTML = slots
      .map((s) => {
        const isCurrent = currentSlotId && s.slot_id === currentSlotId;
        const label = `Ca ${s.start_time.slice(0, 5)} – ${s.end_time.slice(0, 5)} (Còn ${s.remaining}/${s.max_capacity} chỗ trống)${
          isCurrent ? " — [Khung giờ hiện tại]" : !s.bookable ? ` — [${CLOSED_REASON_LABELS[s.closed_reason] || s.closed_reason}]` : ""
        }`;
        return `<option value="${s.slot_id}">${label}</option>`;
      })
      .join("");
    const firstAvailable = slots.find((s) => s.bookable && s.slot_id !== currentSlotId);
    if (firstAvailable) sel.value = String(firstAvailable.slot_id);
  } catch (err) {
    sel.innerHTML = `<option value="">Không thể tải khung giờ: ${escapeHtml(err.message)}</option>`;
  }
}

async function handleSubmitReschedule(e) {
  e.preventDefault();
  const appointmentId = Number(document.getElementById("rescheduleApptId").value);
  const slotId = Number(document.getElementById("rescheduleSlotSelect").value);
  const serviceId = Number(document.getElementById("rescheduleServiceSelect").value);
  const btn = document.getElementById("btnSubmitReschedule");
  if (!appointmentId || !slotId) {
    showAlert("warning", "Vui lòng chọn khung giờ mới hợp lệ.");
    return;
  }
  btn.disabled = true;
  try {
    const updated = await apiRequest("POST", `/appointments/${appointmentId}/reschedule`, {
      slot_id: slotId,
      service_id: serviceId || null,
    });
    closeRescheduleModal();
    await loadSlotsForSelectedDate();
    await loadMyAppointments();
    state.selectedTrackingId = updated.appointment_id;
    renderTrackingListAndDetail();
    showAlert(
      "success",
      `Đã đổi lịch hẹn #${updated.appointment_id} sang ngày ${updated.slot.slot_date} (${updated.slot.start_time.slice(0, 5)}–${updated.slot.end_time.slice(0, 5)}) thành công!`
    );
  } catch (err) {
    if (err.code === "SLOT_FULL") {
      await loadRescheduleSlots();
      showAlert("danger", `Khung giờ mới vừa hết chỗ. Lịch hẹn hiện tại của Quý khách vẫn được giữ nguyên!`);
    } else {
      showAlert("danger", `Không thể đổi lịch hẹn: ${err.message}`);
    }
  } finally {
    btn.disabled = false;
  }
}

async function handleCancelMyAppointment(appointmentId) {
  try {
    const updated = await apiRequest("POST", `/appointments/${appointmentId}/cancel`);
    await loadSlotsForSelectedDate();
    await loadMyAppointments();
    state.selectedTrackingId = updated.appointment_id;
    renderTrackingListAndDetail();
    showAlert(
      "success",
      `Đã hủy phiếu lịch hẹn #${updated.appointment_id} thành công!`
    );
  } catch (err) {
    showAlert("danger", `Không thể hủy lịch hẹn: ${err.message}`);
  }
}

// ============================================================================
// 8.5. BÁO CÁO THỐNG KÊ HOẠT ĐỘNG DỊCH VỤ (DÀNH CHO QUẢN LÝ)
// ============================================================================
function setReportFullMonthAndLoad() {
  document.getElementById("reportFromInput").value = "2026-11-01";
  document.getElementById("reportToInput").value = "2026-11-30";
  loadAppointmentReport();
}

async function loadAppointmentReport() {
  const fromInput = document.getElementById("reportFromInput");
  const toInput = document.getElementById("reportToInput");
  if (!fromInput.value) fromInput.value = "2026-11-01";
  if (!toInput.value) toInput.value = "2026-11-30";

  const strip = document.getElementById("reportSummaryStrip");
  const boxDate = document.getElementById("reportByDateBox");
  const boxStatus = document.getElementById("reportByStatusBox");
  const boxService = document.getElementById("reportByServiceBox");
  if (!strip) return;

  try {
    const rep = await apiRequest("GET", "/reports/appointments", null, {
      from: fromInput.value,
      to: toInput.value,
    });
    const sumDate = (rep.by_date || []).reduce((acc, r) => acc + r.count, 0);
    const sumStatus = (rep.by_status || []).reduce((acc, r) => acc + r.count, 0);
    const sumService = (rep.by_service || []).reduce((acc, r) => acc + r.count, 0);
    const isConsistent = sumDate === rep.total && sumStatus === rep.total && sumService === rep.total;

    strip.innerHTML = `
      <div class="kpi-box active">
        <div class="kpi-num">${rep.total}</div>
        <div class="kpi-label">Tổng số phiếu hẹn trong kỳ</div>
      </div>
      <div class="kpi-box">
        <div class="kpi-num" style="font-size:15px">${escapeHtml(rep.from)} → ${escapeHtml(rep.to)}</div>
        <div class="kpi-label">Kỳ thống kê</div>
      </div>
      <div class="kpi-box">
        <div class="kpi-num">${rep.by_date.length} ngày</div>
        <div class="kpi-label">Số ngày có xe đặt lịch</div>
      </div>
      <div class="kpi-box">
        <div class="kpi-num" style="color:${isConsistent ? "#047857" : "#be123c"};font-size:15px">
          ${isConsistent ? `✓ Đồng bộ (${sumDate} phiếu)` : "✕ Chênh lệch"}
        </div>
        <div class="kpi-label">Trạng thái đối soát số liệu</div>
      </div>
    `;

    if (!rep.by_date.length) {
      boxDate.innerHTML = `<div class="alert alert-info">Chưa phát sinh lịch hẹn trong khoảng thời gian này.</div>`;
    } else {
      boxDate.innerHTML = `
        <table class="data-table">
          <thead>
            <tr>
              <th>Ngày phục vụ</th>
              <th style="text-align:right">Số phiếu</th>
              <th style="text-align:right">Tỷ trọng</th>
            </tr>
          </thead>
          <tbody>
            ${rep.by_date
              .map((r) => {
                const pct = rep.total ? Math.round((r.count * 100) / rep.total) : 0;
                return `
                  <tr>
                    <td><strong>${escapeHtml(r.date)}</strong></td>
                    <td style="text-align:right"><strong>${r.count}</strong></td>
                    <td style="text-align:right">${pct}%</td>
                  </tr>
                `;
              })
              .join("")}
            <tr style="background:var(--surface-alt);font-weight:700">
              <td>TỔNG CỘNG</td>
              <td style="text-align:right">${sumDate}</td>
              <td style="text-align:right">100%</td>
            </tr>
          </tbody>
        </table>
      `;
    }

    boxStatus.innerHTML = `
      <table class="data-table">
        <thead>
          <tr>
            <th>Trạng thái xử lý</th>
            <th style="text-align:right">Số phiếu</th>
            <th style="text-align:right">Tỷ lệ</th>
          </tr>
        </thead>
        <tbody>
          ${rep.by_status
            .map((r) => {
              const pct = rep.total ? Math.round((r.count * 100) / rep.total) : 0;
              return `
                <tr>
                  <td><span class="status-pill status-${r.status}">${STATUS_VI_LABELS[r.status] || r.status}</span></td>
                  <td style="text-align:right"><strong>${r.count}</strong></td>
                  <td style="text-align:right">${pct}%</td>
                </tr>
              `;
            })
            .join("")}
          <tr style="background:var(--surface-alt);font-weight:700">
            <td>TỔNG CỘNG</td>
            <td style="text-align:right">${sumStatus}</td>
            <td style="text-align:right">100%</td>
          </tr>
        </tbody>
      </table>
    `;

    boxService.innerHTML = `
      <table class="data-table">
        <thead>
          <tr>
            <th>Gói dịch vụ kỹ thuật</th>
            <th style="text-align:right">Số lượt đặt</th>
          </tr>
        </thead>
        <tbody>
          ${rep.by_service
            .map(
              (r) => `
              <tr>
                <td><strong>DV-${String(r.service_id).padStart(2, "0")}</strong> · ${escapeHtml(r.name)}</td>
                <td style="text-align:right"><strong>${r.count}</strong></td>
              </tr>
            `
            )
            .join("")}
          <tr style="background:var(--surface-alt);font-weight:700">
            <td>TỔNG CỘNG</td>
            <td style="text-align:right">${sumService}</td>
          </tr>
        </tbody>
      </table>
    `;
  } catch (err) {
    strip.innerHTML = "";
    const msg = `<div class="alert alert-danger"><strong>Không thể tải báo cáo thống kê:</strong> ${escapeHtml(err.message)}</div>`;
    boxDate.innerHTML = msg;
    boxStatus.innerHTML = "";
    boxService.innerHTML = "";
  }
}

// ============================================================================
// 9. ĐIỀU HƯỚNG TAB & TIỆN ÍCH CHUNG
// ============================================================================
function switchTab(tabName) {
  document.querySelectorAll(".tab-view").forEach((el) => el.classList.add("hidden"));
  document.querySelectorAll(".nav-tab").forEach((btn) => {
    btn.classList.toggle("active", btn.getAttribute("data-tab") === tabName);
  });
  const target = document.getElementById(`view-${tabName}`);
  if (target) target.classList.remove("hidden");
  if (tabName === "tracking") {
    loadMyAppointments();
  } else if (tabName === "reports") {
    loadAppointmentReport();
  }
}

function showAlert(type, message) {
  const el = document.getElementById("globalAlert");
  el.className = `alert alert-${type}`;
  el.innerHTML = `
    <div>${escapeHtml(message)}</div>
    <button class="btn btn-outline btn-sm" style="padding:2px 8px" onclick="document.getElementById('globalAlert').classList.add('hidden')">✕</button>
  `;
  el.classList.remove("hidden");
}

function formatVnd(amount) {
  return Number(amount || 0).toLocaleString("vi-VN") + " ₫";
}

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function loadAllRoleData() {
  await loadServices();
  await loadVehicles();
  await loadSlotsForSelectedDate();
  await loadMyAppointments();
  renderRecentAppointmentChips();
}

async function applyTcScenarioState(tcCode) {
  const code = String(tcCode || "").toUpperCase();
  state.useMock = true;
  const dot = document.getElementById("apiDot");
  const label = document.getElementById("apiModeText");
  if (dot) dot.className = "api-dot";
  if (label) label.textContent = "Trực tuyến (Máy chủ đã kết nối)";

  const setMockRole = async (email) => {
    const u = mockDb.users.find((x) => x.email.toLowerCase() === email.toLowerCase());
    if (u) {
      state.token = `mock-token-${u.user_id}`;
      state.currentUser = { user_id: u.user_id, full_name: u.full_name, email: u.email, role: u.role };
    }
    renderHeaderAndRoleUI();
    await loadAllRoleData();
  };

  const makeSlotsOpenForTestDate = (dateStr) => {
    state.selectedDate = dateStr;
    const dateInput = document.getElementById("bookingDateInput");
    if (dateInput) dateInput.value = dateStr;
    state.slots = EIGHT_HOURS.map(([start, end], idx) => ({
      slot_id: 700 + idx + 1,
      slot_date: dateStr,
      start_time: start,
      end_time: end,
      max_capacity: 3,
      booked: idx === 1 ? 1 : idx === 2 ? 1 : 0,
      remaining: idx === 1 ? 2 : idx === 2 ? 2 : 3,
      bookable: true,
      closed_reason: null,
    }));
  };

  if (code === "TC01") {
    await setMockRole("khach1@example.com");
    switchTab("booking");
    document.getElementById("bookingVehicleSelect").value = "1";
    document.getElementById("bookingServiceSelect").value = "1";
    document.getElementById("bookingNoteInput").value = "Xe bảo dưỡng định kỳ mốc 10.000 km, kiểm tra thêm hệ thống phanh trước.";
    makeSlotsOpenForTestDate("2026-11-07");
    const slot09 = state.slots.find((s) => s.start_time.startsWith("09:00"));
    if (slot09) {
      slot09.booked = 2;
      slot09.remaining = 1;
      slot09.bookable = true;
      state.selectedSlotId = slot09.slot_id;
    }
    renderEightSlotsGrid();
    updateBookingSummary();
    const card = document.getElementById("lastCreatedBookingCard");
    const body = document.getElementById("lastCreatedBookingBody");
    card.classList.remove("hidden");
    body.innerHTML = `
      <div><strong>Mã phiếu hẹn:</strong> <span class="code-chip">#8</span></div>
      <div><strong>Trạng thái hiện tại:</strong> <span class="status-pill status-PENDING">Chờ xác nhận (Đã giữ chỗ)</span></div>
      <div><strong>Phương tiện &amp; Gói dịch vụ:</strong> <code>51F-678.90</code> · Bảo dưỡng định kỳ 10.000 km</div>
      <div><strong>Thời gian hẹn:</strong> Ngày 2026-11-07 (09:00 – 10:00)</div>
      <div><strong>Thời điểm ghi nhận:</strong> <code>2026-11-06T09:15:24+07:00</code></div>
      <div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn btn-primary btn-sm">Xem trong Lịch hẹn của tôi →</button>
      </div>
    `;
    showAlert("success", "Đặt lịch hẹn thành công! Mã phiếu #8 đã được giữ chỗ và đang chờ Cố vấn dịch vụ xác nhận.");
  } else if (code === "TC02") {
    await setMockRole("khach1@example.com");
    switchTab("booking");
    makeSlotsOpenForTestDate("2026-11-07");
    const vehSel = document.getElementById("bookingVehicleSelect");
    vehSel.innerHTML = `<option value="">-- Chưa chọn phương tiện (Bắt buộc) --</option>` + vehSel.innerHTML;
    vehSel.value = "";
    state.selectedSlotId = null;
    renderEightSlotsGrid();
    updateBookingSummary();
    showAlert("danger", "Vui lòng chọn phương tiện và khung giờ còn chỗ trống trước khi xác nhận đặt lịch (Thiếu thông tin bắt buộc).");
  } else if (code === "TC03") {
    await setMockRole("khach1@example.com");
    switchTab("booking");
    makeSlotsOpenForTestDate("2026-11-01");
    state.slots.forEach((s) => {
      s.bookable = false;
      s.closed_reason = "IN_PAST";
    });
    state.selectedSlotId = null;
    renderEightSlotsGrid();
    updateBookingSummary();
    showAlert("danger", "Không thể hoàn tất đặt lịch: Khung giờ ngày 2026-11-01 đã qua, vui lòng chọn ngày và khung giờ hợp lệ trong 14 ngày tới.");
  } else if (code === "TC04") {
    await setMockRole("khach1@example.com");
    switchTab("booking");
    makeSlotsOpenForTestDate("2026-11-07");
    const slot08 = state.slots.find((s) => s.start_time.startsWith("08:00"));
    if (slot08) {
      slot08.booked = 3;
      slot08.remaining = 0;
      slot08.bookable = false;
      slot08.closed_reason = "FULL";
    }
    state.selectedSlotId = null;
    renderEightSlotsGrid();
    updateBookingSummary();
    showAlert("danger", "Không thể hoàn tất đặt lịch: Khung giờ 08:00 – 09:00 đã nhận đủ 3/3 xe phục vụ, vui lòng chọn khung giờ khác còn chỗ trống.");
  } else if (code === "TC05") {
    await setMockRole("khach1@example.com");
    switchTab("booking");
    document.getElementById("bookingVehicleSelect").value = "1";
    document.getElementById("bookingServiceSelect").value = "1";
    makeSlotsOpenForTestDate("2026-11-07");
    const slot09 = state.slots.find((s) => s.start_time.startsWith("09:00"));
    if (slot09) {
      slot09.booked = 2;
      slot09.remaining = 1;
      slot09.bookable = true;
      state.selectedSlotId = slot09.slot_id;
    }
    renderEightSlotsGrid();
    updateBookingSummary();
    showAlert("danger", "Không thể hoàn tất đặt lịch: Phương tiện 51F-678.90 đã có lịch hẹn đang hoạt động (#1) trong cùng khung giờ 09:00 – 10:00 ngày 2026-11-07.");
  } else if (code === "TC06") {
    await setMockRole("khach2@example.com");
    switchTab("booking");
    document.getElementById("bookingVehicleSelect").value = "3";
    document.getElementById("bookingServiceSelect").value = "3";
    makeSlotsOpenForTestDate("2026-11-07");
    const slot09 = state.slots.find((s) => s.start_time.startsWith("09:00"));
    if (slot09) {
      slot09.booked = 3;
      slot09.remaining = 0;
      slot09.bookable = false;
      slot09.closed_reason = "FULL";
    }
    const slot10 = state.slots.find((s) => s.start_time.startsWith("10:00"));
    if (slot10) state.selectedSlotId = slot10.slot_id;
    renderEightSlotsGrid();
    updateBookingSummary();
    showAlert("danger", "Khung giờ 09:00 – 10:00 Quý khách vừa chọn đã nhận đủ số lượng xe (3/3) do có khách hàng khác đặt thành công trước. Hệ thống đã tự động làm mới tình trạng chỗ trống.");
  } else if (code === "TC07") {
    mockDb.appointments.forEach((a) => {
      a.slot_date = "2026-11-07";
    });
    await setMockRole("staff1@xyz.vn");
    switchTab("tracking");
    document.getElementById("trackingFromFilter").value = "2026-11-05";
    document.getElementById("trackingToFilter").value = "2026-11-09";
    await loadMyAppointments();
    state.selectedTrackingId = 1;
    renderTrackingListAndDetail();
    showAlert("info", "Đã tải danh sách các phiếu lịch hẹn từ ngày 2026-11-05 đến 2026-11-09 dành cho Cố vấn dịch vụ.");
  } else if (code === "TC08") {
    const appt1 = mockDb.appointments.find((a) => a.appointment_id === 1);
    if (appt1) {
      appt1.slot_date = "2026-11-07";
      appt1.status = "CONFIRMED";
      appt1.handled_by = 2;
      appt1.history.push({
        old_status: "PENDING",
        new_status: "CONFIRMED",
        changed_by: 2,
        changed_at: "2026-11-06T09:20:15+07:00",
        note: "Cố vấn dịch vụ Trần Thị Tiếp Nhận đã xác nhận lịch hẹn",
      });
    }
    await setMockRole("staff1@xyz.vn");
    switchTab("lookup");
    document.getElementById("lookupAppointmentIdInput").value = "1";
    await handleLookupAppointment();
    showAlert("success", "Đã xác nhận tiếp nhận phiếu hẹn #1 thành công! Trạng thái chuyển sang Đã xác nhận.");
  } else if (code === "TC09") {
    mockDb.appointments.unshift({
      appointment_id: 8,
      customer_id: 4,
      vehicle_id: 1,
      service_id: 1,
      slot_id: 702,
      slot_date: "2026-11-07",
      start_time: "09:00:00",
      end_time: "10:00:00",
      status: "REJECTED",
      note: "Xe bảo dưỡng định kỳ mốc 10.000 km.",
      reject_reason: "Thiết bị cân chỉnh & cầu nâng chuyên dụng đang bảo trì định kỳ trong ca chiều",
      handled_by: 2,
      change_count: 0,
      created_at: "2026-11-06T09:15:24+07:00",
      updated_at: "2026-11-06T09:25:10+07:00",
      history: [
        { old_status: null, new_status: "PENDING", changed_by: 4, changed_at: "2026-11-06T09:15:24+07:00", note: "Tạo lịch hẹn mới" },
        {
          old_status: "PENDING",
          new_status: "REJECTED",
          changed_by: 2,
          changed_at: "2026-11-06T09:25:10+07:00",
          note: "Thiết bị cân chỉnh & cầu nâng chuyên dụng đang bảo trì định kỳ trong ca chiều",
        },
      ],
    });
    await setMockRole("staff1@xyz.vn");
    switchTab("lookup");
    document.getElementById("lookupAppointmentIdInput").value = "8";
    document.getElementById("rejectReasonInput").value = "Thiết bị cân chỉnh & cầu nâng chuyên dụng đang bảo trì định kỳ trong ca chiều";
    await handleLookupAppointment();
    showAlert("success", "Đã từ chối tiếp nhận phiếu hẹn #8 và hoàn trả 1 chỗ trống cho khung giờ 09:00 – 10:00 (Đã nhận giảm còn 1/3 xe).");
  } else if (code === "TC10") {
    const appt2 = mockDb.appointments.find((a) => a.appointment_id === 2);
    if (appt2) appt2.slot_date = "2026-11-07";
    await setMockRole("staff1@xyz.vn");
    switchTab("lookup");
    document.getElementById("lookupAppointmentIdInput").value = "2";
    await handleLookupAppointment();
    showAlert("danger", "Không thể xác nhận phiếu hẹn: Chỉ có thể xác nhận phiếu hẹn đang ở trạng thái Chờ xác nhận (Phiếu #2 hiện đang ở trạng thái Đã xác nhận).");
  } else if (code === "TC11") {
    await setMockRole("khach1@example.com");
    switchTab("booking");
    makeSlotsOpenForTestDate("2026-11-09");
    state.slots.forEach((s) => {
      s.booked = 0;
      s.remaining = 3;
      s.bookable = true;
    });
    state.selectedSlotId = state.slots[0].slot_id;
    renderEightSlotsGrid();
    updateBookingSummary();
    showAlert("info", "Đã tự động làm mới tình trạng chỗ trống của 8 khung giờ ngày 2026-11-09 (Thứ Hai — Tất cả 8 ca còn đủ 3/3 chỗ trống).");
  } else if (code === "TC12") {
    mockDb.appointments.forEach((a) => {
      a.slot_date = "2026-11-07";
    });
    mockDb.appointments.unshift({
      appointment_id: 8,
      customer_id: 4,
      vehicle_id: 1,
      service_id: 1,
      slot_id: 702,
      slot_date: "2026-11-07",
      start_time: "09:00:00",
      end_time: "10:00:00",
      status: "PENDING",
      note: "Xe bảo dưỡng định kỳ mốc 10.000 km, kiểm tra thêm hệ thống phanh trước.",
      reject_reason: null,
      handled_by: null,
      change_count: 0,
      created_at: "2026-11-06T09:15:24+07:00",
      updated_at: "2026-11-06T09:15:24+07:00",
      history: [
        { old_status: null, new_status: "PENDING", changed_by: 4, changed_at: "2026-11-06T09:15:24+07:00", note: "Khách hàng Phạm Minh Khách đặt lịch trực tuyến" },
      ],
    });
    await setMockRole("staff1@xyz.vn");
    switchTab("tracking");
    await loadMyAppointments();
    state.selectedTrackingId = 8;
    renderTrackingListAndDetail();
    showAlert("success", "Đồng bộ dữ liệu thành công: Phiếu hẹn #8 vừa được khách hàng Phạm Minh Khách tạo đã hiển thị tức thì trên danh sách điều phối của Cố vấn dịch vụ.");
  }
}

async function initApp() {
  document.getElementById("footerApiUrl").textContent = API_BASE_URL;
  const dateInput = document.getElementById("bookingDateInput");
  if (!dateInput.value) {
    dateInput.value = getDefaultBookingDate();
  }
  const tcParam =
    window.XYZ_FORCE_TC ||
    new URLSearchParams(window.location.search).get("tc") ||
    (window.location.hash ? window.location.hash.replace(/^#/, "") : "");
  if (tcParam && /^TC\d+/i.test(tcParam)) {
    await applyTcScenarioState(tcParam);
    return;
  }
  await checkBackendHealth();
  await refreshSession();
  await loadAllRoleData();
}

window.addEventListener("DOMContentLoaded", initApp);
