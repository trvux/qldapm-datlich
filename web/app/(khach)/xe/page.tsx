"use client"

import { CarFront } from "lucide-react"

import { ErrorNote } from "@/components/error-note"
import { RequireAuth } from "@/components/shell/require-auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { VehicleDialog } from "@/components/vehicle-dialog"
import { api } from "@/lib/api"
import { useApi } from "@/lib/use-api"

function Vehicles() {
  const { data, error, loading, reload } = useApi(() => api.vehicles(), [])
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl">Xe của tôi</h1>
          <p className="text-muted-foreground">Xe đã đăng ký để đặt lịch.</p>
        </div>
        <VehicleDialog onCreated={reload} />
      </div>
      <ErrorNote error={error} />
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-28" />)}</div>
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
            <li key={v.vehicle_id}>
              <Card>
                <CardHeader>
                  <CardTitle className="tabular-nums">{v.license_plate}</CardTitle>
                  <CardDescription>{[v.brand, v.model].filter(Boolean).join(" ")}</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">{v.year ? `Năm ${v.year}` : "Chưa ghi năm sản xuất"}</CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function VehiclesPage() {
  return <RequireAuth><Vehicles /></RequireAuth>
}
