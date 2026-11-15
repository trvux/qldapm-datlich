/*
 * Lớp gọi API Backend. Kiểu dữ liệu và đường dẫn theo docs/api/openapi.json (nguồn sự thật).
 * Lỗi trả về dạng { error: { code, message, details? } }; giao diện chỉ switch theo `code`.
 */

export type Role = "CUSTOMER" | "STAFF" | "MANAGER"

export type AppointmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "REJECTED"

export type User = { user_id: number; full_name: string; email: string; role: Role }
export type TokenOut = { access_token: string; token_type?: string; expires_in: number; user: User }

export type Service = {
  service_id: number
  name: string
  description: string | null
  duration_minutes: number
  reference_price: number
  is_active?: boolean
}
export type ServiceInput = {
  name: string
  description?: string | null
  duration_minutes: number
  reference_price: number
  is_active?: boolean
}

export type Vehicle = { vehicle_id: number; license_plate: string; brand: string; model: string | null; year: number | null }
export type VehicleInput = { license_plate: string; brand: string; model?: string | null; year?: number | null }

export type Slot = {
  slot_id: number
  slot_date: string
  start_time: string
  end_time: string
  max_capacity: number
  booked: number
  remaining: number
  bookable: boolean
  closed_reason?: string | null
}

export type HistoryEntry = {
  old_status: string | null
  new_status: AppointmentStatus
  changed_by: number
  changed_at: string
  note: string | null
}

export type Appointment = {
  appointment_id: number
  status: AppointmentStatus
  note: string | null
  reject_reason: string | null
  change_count: number
  customer: { user_id: number; full_name: string }
  vehicle: Vehicle
  service: { service_id: number; name: string; duration_minutes: number; reference_price: number }
  slot: { slot_id: number; slot_date: string; start_time: string; end_time: string }
  handled_by: number | null
  created_at: string
  updated_at: string
  history: HistoryEntry[]
}

export type AppointmentReport = {
  from: string
  to: string
  total: number
  by_date: { date: string; count: number }[]
  by_status: { status: AppointmentStatus; count: number }[]
  by_service: { service_id: number; name: string; count: number }[]
}

export class ApiError extends Error {
  status: number
  code: string
  details?: { field?: string; message: string }[]
  constructor(status: number, code: string, message: string, details?: ApiError["details"]) {
    super(message)
    this.status = status
    this.code = code
    this.details = details
  }
}

/**
 * Mặc định gọi qua đường dẫn cùng nguồn /api (Next chuyển tiếp sang Backend, xem next.config.ts),
 * nên không dính CORS và chạy được ở mọi cổng. Đặt NEXT_PUBLIC_API_URL để gọi thẳng Backend.
 */
export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "/api"
const TOKEN_KEY = "marque.token"

export const tokenStore = {
  get: () => (typeof window === "undefined" ? null : window.localStorage.getItem(TOKEN_KEY)),
  set: (t: string) => window.localStorage.setItem(TOKEN_KEY, t),
  clear: () => window.localStorage.removeItem(TOKEN_KEY),
}

type Query = Record<string, string | number | boolean | null | undefined>

async function request<T>(method: string, path: string, opts: { query?: Query; body?: unknown } = {}): Promise<T> {
  const qs = new URLSearchParams()
  for (const [k, v] of Object.entries(opts.query ?? {})) if (v !== undefined && v !== null && v !== "") qs.set(k, String(v))
  const url = `${API_BASE}${path}${qs.size ? `?${qs}` : ""}`
  const headers: Record<string, string> = {}
  const token = tokenStore.get()
  if (token) headers.Authorization = `Bearer ${token}`
  if (opts.body !== undefined) headers["Content-Type"] = "application/json"

  let res: Response
  try {
    res = await fetch(url, { method, headers, body: opts.body === undefined ? undefined : JSON.stringify(opts.body) })
  } catch {
    throw new ApiError(0, "NETWORK_ERROR", "Không kết nối được máy chủ.")
  }
  if (res.status === 204) return undefined as T
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const e = data?.error
    throw new ApiError(res.status, e?.code ?? "UNKNOWN", e?.message ?? "Đã có sự cố.", e?.details)
  }
  return data as T
}

const get = <T>(path: string, query?: Query) => request<T>("GET", path, { query })
const post = <T>(path: string, body?: unknown) => request<T>("POST", path, { body })
const patch = <T>(path: string, body: unknown) => request<T>("PATCH", path, { body })

export const api = {
  login: (email: string, password: string) => post<TokenOut>("/auth/login", { email, password }),
  me: () => get<User>("/auth/me"),

  services: (includeInactive = false) => get<Service[]>("/services", { include_inactive: includeInactive || undefined }),
  createService: (b: ServiceInput) => post<Service>("/services", b),
  updateService: (id: number, b: Partial<ServiceInput>) => patch<Service>(`/services/${id}`, b),

  vehicles: () => get<Vehicle[]>("/vehicles"),
  addVehicle: (b: VehicleInput) => post<Vehicle>("/vehicles", b),

  slots: (from?: string, to?: string) => get<Slot[]>("/slots", { from, to }),
  updateSlotCapacity: (id: number, max_capacity: number) => patch<Slot>(`/slots/${id}`, { max_capacity }),

  appointments: (q: { status?: AppointmentStatus; date?: string; from?: string; to?: string } = {}) =>
    get<Appointment[]>("/appointments", q),
  appointment: (id: number) => get<Appointment>(`/appointments/${id}`),
  createAppointment: (b: { vehicle_id: number; service_id: number; slot_id: number; note?: string | null }) =>
    post<Appointment>("/appointments", b),
  cancelAppointment: (id: number) => post<Appointment>(`/appointments/${id}/cancel`),
  rescheduleAppointment: (id: number, b: { slot_id: number; service_id?: number | null }) =>
    post<Appointment>(`/appointments/${id}/reschedule`, b),
  confirmAppointment: (id: number) => post<Appointment>(`/appointments/${id}/confirm`),
  rejectAppointment: (id: number, reason: string) => post<Appointment>(`/appointments/${id}/reject`, { reason }),
  startAppointment: (id: number) => post<Appointment>(`/appointments/${id}/start`),
  completeAppointment: (id: number) => post<Appointment>(`/appointments/${id}/complete`),

  report: (from?: string, to?: string) => get<AppointmentReport>("/reports/appointments", { from, to }),
}

/*
 * Thông báo lỗi theo mã (đặc tả dặn chỉ switch theo `code`; `message` của Backend chỉ là chữ tạm và xưng "Bạn").
 * Khu khách: giọng trang trọng, xưng "Quý khách". Khu nhân viên: giữ chữ trung tính của Backend.
 * Tên mã lấy từ backend/app; câu giải thích suy từ tên mã và quy tắc BR trong docs/api, chưa đối chiếu từng nhánh code.
 */
const CUSTOMER_TEXT: Record<string, string> = {
  NETWORK_ERROR: "Không kết nối được máy chủ. Quý khách vui lòng kiểm tra mạng và thử lại.",
  VALIDATION_ERROR: "Thông tin chưa hợp lệ. Quý khách vui lòng kiểm tra lại các trường đã nhập.",
  TOKEN_INVALID: "Phiên đăng nhập đã hết hạn. Quý khách vui lòng đăng nhập lại.",
  ACCOUNT_DISABLED: "Tài khoản đang bị khóa. Quý khách vui lòng liên hệ Trung tâm.",
  INVALID_CREDENTIALS: "Email hoặc mật khẩu chưa đúng. Quý khách vui lòng kiểm tra lại.",
  SLOT_FULL: "Khung giờ này đã hết chỗ. Quý khách vui lòng chọn khung giờ khác.",
  SLOT_IN_PAST: "Khung giờ này đã qua. Quý khách vui lòng chọn khung giờ khác.",
  SLOT_NOT_WORKING_HOUR: "Khung giờ này nằm ngoài giờ làm việc của Trung tâm.",
  SLOT_NOT_FOUND: "Không tìm thấy khung giờ. Quý khách vui lòng chọn lại.",
  BOOKING_TOO_SOON: "Khung giờ này quá gần. Quý khách vui lòng đặt trước giờ hẹn ít nhất 2 giờ.",
  BOOKING_TOO_FAR: "Khung giờ này còn quá xa. Quý khách vui lòng chọn ngày gần hơn.",
  BOOKING_LIMIT_REACHED: "Quý khách đã đạt số lịch hẹn hiệu lực tối đa. Vui lòng hoàn thành hoặc hủy một lịch trước khi đặt thêm.",
  VEHICLE_ALREADY_BOOKED: "Xe này đã có lịch hẹn trong khung giờ đó. Quý khách vui lòng chọn khung giờ khác.",
  CHANGE_TOO_LATE: "Đã quá gần giờ hẹn nên Quý khách không thể đổi hoặc hủy lịch này nữa.",
  CHANGE_LIMIT_REACHED: "Lịch hẹn này đã đạt số lần đổi tối đa.",
  SAME_SLOT: "Khung giờ mới trùng với khung giờ hiện tại. Quý khách vui lòng chọn khung giờ khác.",
  INVALID_STATUS_TRANSITION: "Trạng thái lịch hẹn đã thay đổi. Quý khách vui lòng tải lại trang.",
  SERVICE_INACTIVE: "Dịch vụ này đã ngừng cung cấp. Quý khách vui lòng chọn dịch vụ khác.",
  LICENSE_PLATE_EXISTS: "Biển số này đã được đăng ký.",
  APPOINTMENT_NOT_FOUND: "Không tìm thấy lịch hẹn.",
}

export function errorText(e: unknown, who: "khach" | "staff" = "khach"): string {
  const generic = who === "khach" ? "Rất tiếc, đã có sự cố. Quý khách vui lòng thử lại." : "Đã có sự cố. Vui lòng thử lại."
  if (!(e instanceof ApiError)) return generic
  if (who === "khach" && CUSTOMER_TEXT[e.code]) return CUSTOMER_TEXT[e.code]
  if (e.code === "NETWORK_ERROR") return "Không kết nối được máy chủ."
  return e.message || generic
}
