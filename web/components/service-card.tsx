import { ArrowRight } from "lucide-react"
import Link from "next/link"

import type { Service } from "@/lib/api"

/** Thời lượng dài nhất trong danh sách, dùng làm thang (100%) cho thanh thời lượng của mọi thẻ. */
export const longestDuration = (services: Service[]) => Math.max(1, ...services.map((s) => s.duration_minutes))

const EYEBROW = "text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase"
const vnNumber = new Intl.NumberFormat("vi-VN")

/**
 * Thẻ dịch vụ dùng chung cho landing và trang /dich-vu. Mọi chữ căn trái.
 * Nửa dưới là "bảng đồng hồ": mỗi hàng có nhãn nhỏ bên trái và số đọc (font tiêu đề) bên phải,
 * cùng ngôn ngữ với thanh thời lượng. `scaleMinutes` là thời lượng ứng với thanh đầy.
 */
export function ServiceCard({ service, index, scaleMinutes }: { service: Service; index: number; scaleMinutes: number }) {
  const pct = Math.min(100, Math.round((service.duration_minutes / scaleMinutes) * 100))
  // Vạch mốc mỗi 60 phút (như thước đo), cộng hai đầu thang
  const ticks = [0, ...Array.from({ length: Math.floor((scaleMinutes - 1) / 60) }, (_, i) => ((i + 1) * 60 * 100) / scaleMinutes), 100]
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-lg border bg-card transition-colors hover:border-primary/60">
      <div className="flex flex-1 flex-col gap-4 p-6">
        <div className="flex items-baseline gap-3">
          <span aria-hidden className="grid size-7 shrink-0 place-items-center self-center rounded-full border border-primary text-primary ring-1 ring-primary/30 ring-offset-2 ring-offset-card"><span className="font-heading text-xs leading-none font-semibold">{String(index + 1).padStart(2, "0")}</span></span>
          <h3 className="text-lg leading-snug">{service.name}</h3>
        </div>
        <p className="line-clamp-3 flex-1 text-sm text-muted-foreground">{service.description || "Dịch vụ tại Trung tâm."}</p>

        <div className="flex flex-col gap-3 border-t pt-4">
          <div role="img" aria-label={`Thời lượng ${service.duration_minutes} phút, so với dịch vụ dài nhất ${scaleMinutes} phút`} className="flex flex-col gap-1.5">
            <span className={EYEBROW}>Thời lượng</span>
            <div className="grid grid-cols-[1fr_5.5rem] items-center gap-x-3 gap-y-1">
              <div className="h-2.5 w-full rounded-[3px] bg-muted">
                <div
                  className="duration-fill h-full rounded-[3px] border border-primary"
                  style={{ "--w": `${pct}%`, "--i": index } as React.CSSProperties}
                />
              </div>
              <p className="flex items-baseline justify-end gap-1">
                <span className="font-heading text-lg leading-none font-semibold text-primary">{service.duration_minutes}</span>
                <span className="text-xs text-muted-foreground">phút</span>
              </p>
              <div aria-hidden className="relative h-1.5 w-full">
                {ticks.map((t) => (
                  <span key={t} className="absolute top-0 h-full w-px -translate-x-1/2 bg-muted-foreground/50" style={{ left: `${t}%` }} />
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-baseline justify-between gap-3 border-t border-dashed pt-3">
            <span className={EYEBROW}>Giá tham khảo</span>
            <p className="flex items-baseline gap-1">
              <span className="font-heading text-lg leading-none font-semibold text-primary">{vnNumber.format(service.reference_price)}</span>
              <span className="text-xs text-muted-foreground">đ</span>
            </p>
          </div>
        </div>
      </div>

      <Link
        href={`/dat-lich?service=${service.service_id}`}
        className="relative flex items-center justify-between overflow-hidden border-t px-6 py-3 text-sm font-medium text-primary transition-colors after:absolute after:inset-0 group-hover:bg-primary group-hover:text-primary-foreground"
      >
        <span aria-hidden className="hatch-drift pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <span className="relative">Đặt lịch</span>
        <ArrowRight className="relative size-4 transition-transform group-hover:translate-x-1" />
      </Link>
    </article>
  )
}
