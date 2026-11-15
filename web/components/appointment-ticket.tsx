import { Chequy, PlateBadge, StripeRule } from "@/components/brand/motifs"
import { StatusStamp } from "@/components/status-badge"
import type { Appointment } from "@/lib/api"
import { formatDate, formatDateTime, formatRange, formatVND } from "@/lib/format"

/** Mã vạch trang trí, sinh từ số phiếu nên mỗi phiếu một dạng riêng (không mang dữ liệu thật). */
function Barcode({ seed }: { seed: number }) {
  const bars = Array.from({ length: 26 }, (_, i) => ((seed * 7 + i * 13 + (i % 3) * 5) % 3) + 1)
  return (
    <div aria-hidden className="flex h-9 items-stretch gap-[2px] text-foreground/70">
      {bars.map((w, i) => <span key={i} className="bg-current" style={{ width: w }} />)}
    </div>
  )
}

const EYEBROW = "text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase"

function Field({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className={EYEBROW}>{k}</dt>
      <dd className="text-sm font-medium">{children}</dd>
    </div>
  )
}

/**
 * Phiếu lịch hẹn: dải ô cờ ở đầu, số phiếu serif, con dấu trạng thái, đường răng cưa ngăn cuống phiếu.
 * Cùng dữ liệu với AppointmentInfo nhưng trình bày như vé vào cổng giải đua của xe cổ.
 */
export function AppointmentTicket({ a }: { a: Appointment }) {
  const no = String(a.appointment_id).padStart(4, "0")
  const model = [a.vehicle.brand, a.vehicle.model].filter(Boolean).join(" ")
  return (
    <article aria-label={`Phiếu lịch hẹn số ${no}`} className="relative overflow-hidden rounded-lg bg-card shadow-[inset_0_0_0_1px_var(--border)]">
      <Chequy size={5} rows={1} className="text-primary" />
      <span aria-hidden className="punch-edge punch-edge-l" />
      <span aria-hidden className="punch-edge punch-edge-r" />
      <div className="grid md:grid-cols-[1fr_13rem]">
        <div className="flex flex-col gap-6 p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <p className={EYEBROW}>Phiếu lịch hẹn</p>
              <p className="font-heading text-4xl leading-none font-semibold text-primary">{no}</p>
            </div>
            <StatusStamp status={a.status} />
          </div>

          <div className="flex flex-col gap-1 border-y border-dashed py-4">
            <p className="font-heading text-2xl font-semibold">{formatDate(a.slot.slot_date)}</p>
            <p className="text-lg text-muted-foreground">{formatRange(a.slot.start_time, a.slot.end_time)}</p>
          </div>

          <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
            <Field k="Dịch vụ">{a.service.name}</Field>
            <Field k="Giá tham khảo"><span className="font-heading text-base font-semibold text-primary">{formatVND(a.service.reference_price)}</span></Field>
            <Field k="Xe">
              <span className="flex flex-wrap items-center gap-2"><PlateBadge className="text-sm">{a.vehicle.license_plate}</PlateBadge>{model}</span>
            </Field>
            <Field k="Khách hàng">{a.customer.full_name}</Field>
            {a.note && <div className="sm:col-span-2"><Field k="Ghi chú">{a.note}</Field></div>}
            {a.reject_reason && <div className="sm:col-span-2"><Field k="Lý do từ chối"><span className="text-destructive">{a.reject_reason}</span></Field></div>}
          </dl>
          {a.change_count > 0 && <p className="text-sm text-muted-foreground">Đã đổi lịch {a.change_count} lần.</p>}
        </div>

        {/* Cuống phiếu: ngăn bằng đường răng cưa, có hai vết khuyết ở hai đầu */}
        <div className="relative flex flex-col justify-between gap-6 border-t border-dashed bg-muted/40 p-6 md:border-t-0 md:border-l">
          <span aria-hidden className="absolute -top-2 left-0 size-4 -translate-x-1/2 rounded-full border bg-background md:top-0 md:-translate-y-1/2 md:-translate-x-1/2" />
          <span aria-hidden className="absolute -top-2 right-0 size-4 translate-x-1/2 rounded-full border bg-background md:top-auto md:right-auto md:bottom-0 md:left-0 md:translate-y-1/2 md:-translate-x-1/2" />
          <div className="flex flex-col gap-3 text-primary">
            <p className={EYEBROW}>Cuống phiếu</p>
            <p className="font-heading text-2xl font-semibold">{no}</p>
            <StripeRule />
          </div>
          <div className="flex flex-col gap-3">
            <Barcode seed={a.appointment_id} />
            <div className="flex flex-col gap-1 text-xs text-muted-foreground">
            <p>Giữ phiếu này khi đưa xe đến Trung tâm.</p>
            <p className="">Lập lúc {formatDateTime(a.created_at)}</p>
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}
