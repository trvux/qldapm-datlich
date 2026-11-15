import { Ban, CheckCheck, CircleCheck, CircleX, Clock, Wrench, type LucideIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import type { AppointmentStatus } from "@/lib/api"
import { STATUS_LABEL } from "@/lib/format"

const META: Record<AppointmentStatus, { variant: "pending" | "confirmed" | "progress" | "done" | "cancelled" | "rejected"; icon: LucideIcon }> = {
  PENDING: { variant: "pending", icon: Clock },
  CONFIRMED: { variant: "confirmed", icon: CircleCheck },
  IN_PROGRESS: { variant: "progress", icon: Wrench },
  COMPLETED: { variant: "done", icon: CheckCheck },
  CANCELLED: { variant: "cancelled", icon: CircleX },
  REJECTED: { variant: "rejected", icon: Ban },
}

/** Trạng thái luôn kèm icon: không chỉ dựa vào màu (xanh lá "đã xác nhận" gần hue accent BRG). */
export function StatusBadge({ status }: { status: AppointmentStatus }) {
  const { variant, icon: Icon } = META[status]
  return (
    <Badge variant={variant}>
      <Icon data-icon="inline-start" aria-hidden />
      {STATUS_LABEL[status]}
    </Badge>
  )
}

const STAMP_COLOR: Record<AppointmentStatus, string> = {
  PENDING: "text-status-pending-foreground",
  CONFIRMED: "text-status-confirmed-foreground",
  IN_PROGRESS: "text-status-progress-foreground",
  COMPLETED: "text-status-done-foreground",
  CANCELLED: "text-status-cancelled-foreground",
  REJECTED: "text-status-rejected-foreground",
}

/** Con dấu tròn viền kép (mô-típ huy hiệu của brand) cho trạng thái lịch hẹn; dùng trên phiếu. Vẫn kèm icon và chữ. */
export function StatusStamp({ status }: { status: AppointmentStatus }) {
  const { icon: Icon } = META[status]
  return (
    <div
      role="img"
      aria-label={`Trạng thái: ${STATUS_LABEL[status]}`}
      className={`${STAMP_COLOR[status]} flex size-24 shrink-0 -rotate-6 flex-col items-center justify-center gap-1 rounded-full border-2 border-current p-1`}
    >
      <div className="flex size-full flex-col items-center justify-center gap-1 rounded-full border border-current px-2 text-center">
        <Icon aria-hidden className="size-5" />
        <span className="font-heading text-[11px] leading-tight font-semibold tracking-[0.08em] uppercase">{STATUS_LABEL[status]}</span>
      </div>
    </div>
  )
}
