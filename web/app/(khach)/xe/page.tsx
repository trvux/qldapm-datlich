"use client"

import { CarFront } from "lucide-react"

import { PlateBadge } from "@/components/brand/motifs"
import { ErrorNote } from "@/components/error-note"
import { AppPage } from "@/components/layout/app-page"
import { PageHeader } from "@/components/layout/page-header"
import { RequireAuth } from "@/components/shell/require-auth"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { VehicleDialog } from "@/components/vehicle-dialog"
import { api } from "@/lib/api"
import { useApi } from "@/lib/use-api"

function Vehicles() {
  const { data, error, loading, reload } = useApi(() => api.vehicles(), [])
  return (
    <AppPage>
      <PageHeader eyebrow="Tài khoản" title="Xe của tôi" description="Xe đã đăng ký để đặt lịch." actions={<VehicleDialog onCreated={reload} />} />
      <ErrorNote error={error} />
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-36" />)}</div>
      ) : (data ?? []).length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon"><CarFront /></EmptyMedia>
            <EmptyTitle>Quý khách chưa có xe nào</EmptyTitle>
            <EmptyDescription>Thêm xe để bắt đầu đặt lịch bảo dưỡng.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data!.map((v) => (
            <li key={v.vehicle_id} className="stitch flex flex-col items-start gap-4 rounded-lg border bg-card p-6">
              <PlateBadge>{v.license_plate}</PlateBadge>
              <div className="flex flex-col gap-0.5">
                <p className="text-lg font-medium">{[v.brand, v.model].filter(Boolean).join(" ")}</p>
                <p className="text-sm text-muted-foreground">{v.year ? `Năm sản xuất ${v.year}` : "Chưa ghi năm sản xuất"}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </AppPage>
  )
}

export default function VehiclesPage() {
  return <RequireAuth><Vehicles /></RequireAuth>
}
