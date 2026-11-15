"use client"

import { ErrorNote } from "@/components/error-note"
import { ServiceCard, longestDuration } from "@/components/service-card"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/lib/api"
import { useApi } from "@/lib/use-api"

/** Sáu dịch vụ đầu tiên lấy từ API thật. */
export function ServicesPreview() {
  const { data, error, loading } = useApi(() => api.services(), [])
  return (
    <>
      <ErrorNote error={error} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading
          ? Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-52" />)
          : (data ?? []).slice(0, 6).map((s, i) => <ServiceCard key={s.service_id} service={s} index={i} scaleMinutes={longestDuration(data ?? [])} />)}
      </div>
    </>
  )
}
