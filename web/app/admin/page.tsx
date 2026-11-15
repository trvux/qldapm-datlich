"use client"

import { AppointmentActions } from "@/components/admin/appointment-actions"
import { ErrorNote } from "@/components/error-note"
import { StatusBadge } from "@/components/status-badge"
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { api, type AppointmentStatus } from "@/lib/api"
import { STATUS_LABEL, formatDate, formatRange, todayISO } from "@/lib/format"
import { useAuth } from "@/lib/auth"
import { useApi } from "@/lib/use-api"

const TILES: AppointmentStatus[] = ["PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED"]

export default function AdminHome() {
  const { user } = useAuth()
  const today = todayISO()
  const todayList = useApi(() => api.appointments({ date: today }), [today])
  const pending = useApi(() => api.appointments({ status: "PENDING" }), [])
  const count = (s: AppointmentStatus) => (todayList.data ?? []).filter((a) => a.status === s).length
  const reloadAll = () => { todayList.reload(); pending.reload() }
  const queue = (pending.data ?? []).slice().sort((a, b) => (a.slot.slot_date + a.slot.start_time).localeCompare(b.slot.slot_date + b.slot.start_time))

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl">Tổng quan</h1>
        <p className="text-sm text-muted-foreground">Xin chào {user?.full_name}. Hôm nay là {formatDate(today)}.</p>
      </div>
      <ErrorNote error={todayList.error ?? pending.error} who="staff" />

      <section aria-label="Lịch hẹn hôm nay" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {TILES.map((s) => (
          <Card key={s} size="sm">
            <CardHeader><CardDescription>{STATUS_LABEL[s]}</CardDescription></CardHeader>
            <CardContent>
              {todayList.loading ? <Skeleton className="h-8 w-10" /> : <p className="font-heading text-3xl font-semibold tabular-nums">{count(s)}</p>}
            </CardContent>
          </Card>
        ))}
      </section>

      <section aria-labelledby="queue-title" className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-2">
          <h2 id="queue-title" className="text-lg">Chờ xác nhận</h2>
          <span className="text-sm text-muted-foreground tabular-nums">{pending.loading ? "" : `${queue.length} lịch`}</span>
        </div>
        {pending.loading ? (
          <div className="flex flex-col gap-2">{Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-16" />)}</div>
        ) : queue.length === 0 ? (
          <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">Không có lịch nào đang chờ xác nhận.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {queue.map((a) => (
              <li key={a.appointment_id}>
                <Card size="sm">
                  <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium tabular-nums">#{a.appointment_id} · {a.service.name}</span>
                        <StatusBadge status={a.status} />
                      </div>
                      <span className="text-sm text-muted-foreground tabular-nums">{formatDate(a.slot.slot_date)} · {formatRange(a.slot.start_time, a.slot.end_time)} · {a.vehicle.license_plate} · {a.customer.full_name}</span>
                    </div>
                    <AppointmentActions a={a} onDone={reloadAll} />
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
