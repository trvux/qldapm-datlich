import { ArrowRight, Clock } from "lucide-react"
import Link from "next/link"

import type { Service } from "@/lib/api"
import { formatVND } from "@/lib/format"

/** Thẻ dịch vụ dùng chung cho landing và trang /dich-vu. Mọi chữ căn trái. */
export function ServiceCard({ service, index }: { service: Service; index: number }) {
  return (
    <article className="group relative flex h-full flex-col gap-4 rounded-lg border bg-card p-6 transition-colors hover:border-primary/60">
      <div className="flex items-baseline gap-3">
        <span className="font-heading text-sm font-semibold text-primary tabular-nums">{String(index + 1).padStart(2, "0")}</span>
        <h3 className="text-lg leading-snug">{service.name}</h3>
      </div>
      <p className="line-clamp-3 flex-1 text-sm text-muted-foreground">{service.description || "Dịch vụ tại Trung tâm."}</p>
      <dl className="flex items-center gap-6 border-t pt-4 text-sm">
        <div className="flex items-center gap-1.5 text-muted-foreground"><Clock className="size-4" /><dd className="tabular-nums">{service.duration_minutes} phút</dd></div>
        <dd className="font-medium tabular-nums">{formatVND(service.reference_price)}</dd>
      </dl>
      <Link href={`/dat-lich?service=${service.service_id}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 after:absolute after:inset-0 hover:underline">
        Đặt lịch <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </article>
  )
}
