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
