"use client"

import { Info } from "lucide-react"
import Link from "next/link"

import { BrandPhoto } from "@/components/brand/motifs"
import { ErrorNote } from "@/components/error-note"
import { AppPage } from "@/components/layout/app-page"
import { PageHeader } from "@/components/layout/page-header"
import { ServiceCard } from "@/components/service-card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/lib/api"
import { PHOTOS } from "@/lib/photos"
import { useApi } from "@/lib/use-api"

export default function ServicesPage() {
  const { data, error, loading } = useApi(() => api.services(), [])
  return (
    <AppPage>
      <PageHeader
        eyebrow="Dịch vụ"
        title="Bảo dưỡng và sửa chữa"
        description="Thời lượng và giá tham khảo của từng dịch vụ. Chọn dịch vụ rồi đặt lịch trong một phút."
        actions={<Button asChild><Link href="/dat-lich">Đặt lịch</Link></Button>}
      />
      <BrandPhoto src={PHOTOS.workshop.src} alt={PHOTOS.workshop.alt} priority sizes="(min-width: 1152px) 1088px, 100vw" position="center 55%" className="h-40 rounded-lg border sm:h-52" />
      <ErrorNote error={error} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading
          ? Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-52" />)
          : (data ?? []).map((s, i) => <ServiceCard key={s.service_id} service={s} index={i} />)}
      </div>
      <p className="flex items-start gap-2.5 rounded-lg border bg-muted/50 p-4 text-sm text-muted-foreground">
        <Info className="mt-0.5 size-4 shrink-0 text-primary" />
        Giá chỉ để tham khảo, chưa gồm phụ tùng phát sinh. Hệ thống không thanh toán trực tuyến; Quý khách thanh toán tại Trung tâm.
      </p>
    </AppPage>
  )
}
