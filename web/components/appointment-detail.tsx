import { StatusBadge } from "@/components/status-badge"
import type { Appointment, AppointmentStatus } from "@/lib/api"
import { STATUS_LABEL, formatDate, formatRange, formatVND } from "@/lib/format"

function Field({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{k}</dt>
      <dd className="font-medium">{children}</dd>
    </div>
  )
}

/** Thông tin lịch hẹn. */
export function AppointmentInfo({ a }: { a: Appointment }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-xl">Lịch hẹn #{a.appointment_id}</h2>
        <StatusBadge status={a.status} />
      </div>
      <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
        <Field k="Dịch vụ">{a.service.name}</Field>
        <Field k="Giá tham khảo"><span className="">{formatVND(a.service.reference_price)}</span></Field>
        <Field k="Ngày"><span className="">{formatDate(a.slot.slot_date)}</span></Field>
        <Field k="Giờ"><span className="">{formatRange(a.slot.start_time, a.slot.end_time)}</span></Field>
        <Field k="Xe"><span className="">{a.vehicle.license_plate}</span> · {[a.vehicle.brand, a.vehicle.model].filter(Boolean).join(" ")}</Field>
        <Field k="Khách hàng">{a.customer.full_name}</Field>
        {a.note && <div className="sm:col-span-2"><Field k="Ghi chú">{a.note}</Field></div>}
        {a.reject_reason && <div className="sm:col-span-2"><Field k="Lý do từ chối"><span className="text-destructive">{a.reject_reason}</span></Field></div>}
      </dl>
      {a.change_count > 0 && <p className="text-sm text-muted-foreground">Đã đổi lịch {a.change_count} lần.</p>}
    </div>
  )
}

/** Ngày và giờ tách riêng cho cột ngày của sổ theo dõi. */
function splitDateTime(iso: string) {
  const d = new Date(iso)
  return {
    date: `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`,
    year: d.getFullYear(),
    time: d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
  }
}

/** Lịch sử trạng thái như trang sổ theo dõi của hãng xe: lề đôi bên trái, dòng kẻ ngang, cột ngày serif; mới nhất ở trên. */
export function AppointmentHistory({ a }: { a: Appointment }) {
  const rows = a.history.slice().reverse()
  return (
    <section aria-labelledby={`hist-${a.appointment_id}`} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <p className="text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">Sổ theo dõi</p>
        <h3 id={`hist-${a.appointment_id}`} className="text-base">Lịch sử trạng thái</h3>
      </div>
      <ol className="flex flex-col border-y border-l-[5px] border-double border-primary/50 pl-3">
        {rows.map((h, i) => {
          const t = splitDateTime(h.changed_at)
          return (
            <li key={i} className="grid grid-cols-[3.75rem_1fr] gap-3 border-b border-dashed py-2.5 last:border-b-0">
              <div className="flex flex-col leading-tight">
                <span className={`font-heading text-base font-semibold ${i === 0 ? "text-primary" : ""}`}>{t.date}</span>
                <span className="text-[11px] text-muted-foreground">{t.time}</span>
              </div>
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className={`text-sm ${i === 0 ? "font-semibold" : "font-medium"}`}>{STATUS_LABEL[h.new_status as AppointmentStatus]}</span>
                {h.note && <span className="text-sm text-muted-foreground">{h.note}</span>}
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

/** Thông tin kèm lịch sử, xếp dọc (dùng trong ngăn chi tiết của admin). */
export function AppointmentDetail({ a }: { a: Appointment }) {
  return (
    <div className="flex flex-col gap-6">
      <AppointmentInfo a={a} />
      <AppointmentHistory a={a} />
    </div>
  )
}
