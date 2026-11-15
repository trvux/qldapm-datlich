"use client"

import { Check } from "lucide-react"

import { Container } from "@/components/layout/container"
import { Skeleton } from "@/components/ui/skeleton"
import { usePolicy } from "@/lib/policy"

/** Các khối trang chủ dùng quy định đặt lịch lấy từ GET /policy. */

export function HeroPoints() {
  const { policy } = usePolicy()
  const points = policy
    ? [`${policy.openDays}, ${policy.span}`, `Đặt trước tối đa ${policy.max_advance_days} ngày`, "Giá tham khảo công khai"]
    : ["Giá tham khảo công khai"]
  return (
    <ul className="flex flex-col gap-2.5 pt-2 text-sm text-muted-foreground">
      {points.map((p) => (
        <li key={p} className="flex items-center gap-2.5"><Check className="size-4 shrink-0 text-primary" />{p}</li>
      ))}
    </ul>
  )
}

export function PolicyFacts() {
  const { policy, loading } = usePolicy()
  if (!policy) {
    return loading ? (
      <Container className="grid grid-cols-2 gap-x-6 gap-y-8 py-10 md:grid-cols-4 md:py-12">
        {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-16" />)}
      </Container>
    ) : null
  }
  const facts = [
    { value: policy.span, label: `${policy.openDays}, nghỉ trưa ${policy.lunch}` },
    { value: `${policy.max_advance_days} ngày`, label: "Đặt trước tối đa" },
    { value: `${policy.max_active} lịch`, label: "Đang hiệu lực cùng lúc" },
    { value: `${policy.change_lead_hours} giờ`, label: "Đổi hoặc hủy trước giờ hẹn" },
  ]
  return (
    <Container className="grid grid-cols-2 gap-x-6 gap-y-8 py-10 md:grid-cols-4 md:py-12">
      {facts.map((f) => (
        <div key={f.label} className="flex flex-col gap-1.5">
          <span className="font-heading text-2xl font-semibold tabular-nums text-primary sm:text-3xl">{f.value}</span>
          <span className="text-sm text-muted-foreground">{f.label}</span>
        </div>
      ))}
    </Container>
  )
}

export function CtaLead() {
  const { policy } = usePolicy()
  return (
    <p className="max-w-xl text-band-foreground/80">
      Chọn khung giờ còn chỗ{policy ? ` trong ${policy.max_advance_days} ngày tới` : ""}. Đặt lịch chỉ mất một phút.
    </p>
  )
}
