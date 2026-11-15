import type { AppointmentStatus } from "@/lib/api"

/** Ngày dạng YYYY-MM-DD, phân tích thủ công để không bị lệch múi giờ. */
function parseDate(d: string): Date {
  const [y, m, day] = d.split("-").map(Number)
  return new Date(y, m - 1, day)
}

const WEEKDAY = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"]

export const formatDate = (d: string) => {
  const dt = parseDate(d)
  return `${WEEKDAY[dt.getDay()]}, ${String(dt.getDate()).padStart(2, "0")}/${String(dt.getMonth() + 1).padStart(2, "0")}/${dt.getFullYear()}`
}
export const formatShortDate = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`
export const formatTime = (t: string) => t.slice(0, 5)
export const formatRange = (a: string, b: string) => `${formatTime(a)} - ${formatTime(b)}`
export const formatVND = (n: number) => new Intl.NumberFormat("vi-VN").format(n) + " đ"
export const formatDateTime = (iso: string) => {
  const dt = new Date(iso)
  return `${dt.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} ${dt.toLocaleDateString("vi-VN")}`
}
export const toISODate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
export const todayISO = () => toISODate(new Date())
export const addDays = (iso: string, n: number) => {
  const d = parseDate(iso)
  d.setDate(d.getDate() + n)
  return toISODate(d)
}

export const STATUS_LABEL: Record<AppointmentStatus, string> = {
  PENDING: "Chờ xác nhận",
  CONFIRMED: "Đã xác nhận",
  IN_PROGRESS: "Đang thực hiện",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
  REJECTED: "Từ chối",
}
export const ALL_STATUSES = Object.keys(STATUS_LABEL) as AppointmentStatus[]

/** Lý do khung giờ không nhận lịch (closed_reason của GET /slots, xem docs/api). */
export const SLOT_CLOSED_LABEL: Record<string, string> = {
  FULL: "Hết chỗ",
  IN_PAST: "Đã qua",
  TOO_SOON: "Cần đặt trước ít nhất 2 giờ",
  TOO_FAR: "Chưa mở đặt",
}
export const slotClosedLabel = (reason?: string | null) => (reason && SLOT_CLOSED_LABEL[reason]) || "Không nhận lịch"
