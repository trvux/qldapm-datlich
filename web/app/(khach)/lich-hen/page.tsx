"use client"

import Link from "next/link"
import { useState } from "react"

import { AppointmentList } from "@/components/appointment-list"
import { Roadster } from "@/components/brand/illustrations"
import { ErrorNote } from "@/components/error-note"
import { RequireAuth } from "@/components/shell/require-auth"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { api, type AppointmentStatus } from "@/lib/api"
import { ALL_STATUSES, STATUS_LABEL } from "@/lib/format"
import { useApi } from "@/lib/use-api"

function MyAppointments() {
  const [status, setStatus] = useState<AppointmentStatus | "ALL">("ALL")
  const { data, error, loading } = useApi(() => api.appointments(status === "ALL" ? {} : { status }), [status])
  const items = (data ?? []).slice().sort((a, b) => (b.slot.slot_date + b.slot.start_time).localeCompare(a.slot.slot_date + a.slot.start_time))
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl">Lịch hẹn</h1>
          <p className="text-muted-foreground">Các lịch hẹn của Quý khách.</p>
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <Select value={status} onValueChange={(v) => setStatus(v as AppointmentStatus | "ALL")}>
            <SelectTrigger className="flex-1 sm:w-48" aria-label="Lọc theo trạng thái"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
              {ALL_STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button asChild><Link href="/dat-lich">Đặt lịch</Link></Button>
        </div>
      </div>
      <ErrorNote error={error} />
      {loading ? (
        <div className="flex flex-col gap-3">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-24" />)}</div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed p-8 text-center text-primary">
          <Roadster dashed className="max-w-48 opacity-70" />
          <div className="flex flex-col gap-1 text-foreground">
            <h2 className="text-lg">Quý khách chưa có lịch hẹn nào</h2>
            <p className="text-sm text-muted-foreground">Đặt lịch để Trung tâm giữ chỗ cho xe của Quý khách.</p>
          </div>
          <Button asChild><Link href="/dat-lich">Đặt lịch</Link></Button>
        </div>
      ) : (
        <AppointmentList items={items} />
      )}
    </div>
  )
}

export default function MyAppointmentsPage() {
  return <RequireAuth><MyAppointments /></RequireAuth>
}
