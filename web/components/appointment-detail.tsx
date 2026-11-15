import { StatusBadge } from "@/components/status-badge"
import type { Appointment } from "@/lib/api"
import { STATUS_LABEL, formatDate, formatDateTime, formatRange, formatVND } from "@/lib/format"
import type { AppointmentStatus } from "@/lib/api"

function Field({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{k}</dt>
      <dd className="font-medium">{children}</dd>
    </div>
  )
}

/** Thông tin lịch hẹn và lịch sử trạng thái; dùng chung cho khách và nhân viên. */
export function AppointmentDetail({ a }: { a: Appointment }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-xl tabular-nums">Lịch hẹn #{a.appointment_id}</h2>
        <StatusBadge status={a.status} />
      </div>
      <dl className="grid gap-4 sm:grid-cols-2">
        <Field k="Dịch vụ">{a.service.name}</Field>
        <Field k="Giá tham khảo"><span className="tabular-nums">{formatVND(a.service.reference_price)}</span></Field>
        <Field k="Ngày"><span className="tabular-nums">{formatDate(a.slot.slot_date)}</span></Field>
        <Field k="Giờ"><span className="tabular-nums">{formatRange(a.slot.start_time, a.slot.end_time)}</span></Field>
        <Field k="Xe"><span className="tabular-nums">{a.vehicle.license_plate}</span> · {[a.vehicle.brand, a.vehicle.model].filter(Boolean).join(" ")}</Field>
        <Field k="Khách hàng">{a.customer.full_name}</Field>
        {a.note && <div className="sm:col-span-2"><Field k="Ghi chú">{a.note}</Field></div>}
        {a.reject_reason && <div className="sm:col-span-2"><Field k="Lý do từ chối"><span className="text-destructive">{a.reject_reason}</span></Field></div>}
      </dl>
      {a.change_count > 0 && <p className="text-sm text-muted-foreground">Đã đổi lịch {a.change_count} lần.</p>}
      <section aria-labelledby={`hist-${a.appointment_id}`} className="flex flex-col gap-3">
        <h3 id={`hist-${a.appointment_id}`} className="text-base">Lịch sử trạng thái</h3>
        <ol className="flex flex-col gap-4 border-l pl-4">
          {a.history.slice().reverse().map((h, i) => (
            <li key={i} className="relative flex flex-col gap-0.5">
              <span aria-hidden className="absolute top-1.5 -left-[21px] size-2.5 rounded-full border-2 border-background bg-primary" />
              <span className="text-sm font-medium">{STATUS_LABEL[h.new_status as AppointmentStatus]}</span>
              <span className="text-xs text-muted-foreground tabular-nums">{formatDateTime(h.changed_at)}</span>
              {h.note && <span className="text-sm text-muted-foreground">{h.note}</span>}
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}
