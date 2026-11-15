"use client"

import { CarFront } from "lucide-react"

import { ErrorNote } from "@/components/error-note"
import { AppPage } from "@/components/layout/app-page"
import { PageHeader } from "@/components/layout/page-header"
import { RequireAuth } from "@/components/shell/require-auth"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { VehicleCard, type VehicleStats } from "@/components/vehicle-card"
import { VehicleDialog } from "@/components/vehicle-dialog"
import { api } from "@/lib/api"
import { todayISO } from "@/lib/format"
import { useApi } from "@/lib/use-api"

function Vehicles() {
  const { data, error, loading, reload } = useApi(() => api.vehicles(), [])
  const appts = useApi(() => api.appointments(), [])
  const today = todayISO()
  // Số liệu theo xe: số lần đã hoàn thành, lần gần nhất, lịch sắp tới (đang chờ hoặc đã xác nhận)
  const stats = (id: number): VehicleStats => {
    const mine = (appts.data ?? []).filter((a) => a.vehicle.vehicle_id === id)
    const done = mine.filter((a) => a.status === "COMPLETED").map((a) => a.slot.slot_date).sort()
    const next = mine.filter((a) => ["PENDING", "CONFIRMED"].includes(a.status) && a.slot.slot_date >= today).map((a) => a.slot.slot_date).sort()
    return { visits: done.length, last: done.at(-1), next: next[0] }
  }
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
        <ul className="cards-center">
          {data!.map((v, i) => <VehicleCard key={v.vehicle_id} vehicle={v} index={i} stats={stats(v.vehicle_id)} />)}
        </ul>
      )}
    </AppPage>
  )
}

export default function VehiclesPage() {
  return <RequireAuth><Vehicles /></RequireAuth>
}
