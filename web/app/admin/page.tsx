"use client"

import { CalendarCheck, CheckCheck, Clock, Wrench } from "lucide-react"
import Link from "next/link"

import { AppointmentActions } from "@/components/admin/appointment-actions"
import { ErrorNote } from "@/components/error-note"
import { AdminPage } from "@/components/layout/admin-page"
import { PageHeader } from "@/components/layout/page-header"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { api, type AppointmentStatus } from "@/lib/api"
import { useAuth } from "@/lib/auth"
import { STATUS_LABEL, formatDate, formatRange, formatTime, todayISO } from "@/lib/format"
import { useApi } from "@/lib/use-api"

const KPIS = [
  { status: "PENDING", icon: Clock },
  { status: "CONFIRMED", icon: CalendarCheck },
  { status: "IN_PROGRESS", icon: Wrench },
  { status: "COMPLETED", icon: CheckCheck },
] as const satisfies readonly { status: AppointmentStatus; icon: unknown }[]

export default function AdminHome() {
  const { user } = useAuth()
  const today = todayISO()
  const todayList = useApi(() => api.appointments({ date: today }), [today])
  const pending = useApi(() => api.appointments({ status: "PENDING" }), [])
  const reloadAll = () => { todayList.reload(); pending.reload() }
  const count = (s: AppointmentStatus) => (todayList.data ?? []).filter((a) => a.status === s).length
  const byTime = (todayList.data ?? []).slice().sort((a, b) => a.slot.start_time.localeCompare(b.slot.start_time))
  const queue = (pending.data ?? []).slice().sort((a, b) => (a.slot.slot_date + a.slot.start_time).localeCompare(b.slot.slot_date + b.slot.start_time))

  return (
    <AdminPage>
      <PageHeader
        size="sm"
        title="Tổng quan"
        description={`Xin chào ${user?.full_name ?? ""}. Hôm nay là ${formatDate(today)}.`}
        actions={<Button asChild variant="outline"><Link href="/admin/lich-hen">Tất cả lịch hẹn</Link></Button>}
      />
      <ErrorNote error={todayList.error ?? pending.error} who="staff" />

      <section aria-label="Lịch hẹn hôm nay theo trạng thái" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {KPIS.map(({ status, icon: Icon }) => (
          <div key={status} className="flex flex-col gap-2 rounded-lg border bg-card p-(--card-pad)">
            <p className="flex items-center gap-2 text-sm text-muted-foreground"><Icon className="size-4" />{STATUS_LABEL[status]}</p>
            {todayList.loading ? <Skeleton className="h-9 w-12" /> : <p className="font-heading text-3xl font-semibold tabular-nums">{count(status)}</p>}
          </div>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
        <section aria-labelledby="today-title" className="flex flex-col gap-3 lg:col-span-7">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="today-title" className="text-lg">Lịch hôm nay</h2>
            <span className="text-sm text-muted-foreground tabular-nums">{todayList.loading ? "" : `${byTime.length} lịch`}</span>
          </div>
          {todayList.loading ? (
            <div className="flex flex-col gap-2">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-14" />)}</div>
          ) : byTime.length === 0 ? (
            <p className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">Hôm nay chưa có lịch hẹn nào.</p>
          ) : (
            <ul className="divide-y rounded-lg border bg-card">
              {byTime.map((a) => (
                <li key={a.appointment_id} className="flex items-center gap-4 px-(--card-pad) py-2.5">
                  <span className="w-12 shrink-0 font-heading font-semibold tabular-nums">{formatTime(a.slot.start_time)}</span>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-medium">{a.service.name}</span>
                    <span className="truncate text-xs text-muted-foreground">{a.customer.full_name} · <span className="tabular-nums">{a.vehicle.license_plate}</span></span>
                  </div>
                  <StatusBadge status={a.status} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="queue-title" className="flex flex-col gap-3 lg:col-span-5">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="queue-title" className="text-lg">Chờ xác nhận</h2>
            <span className="text-sm text-muted-foreground tabular-nums">{pending.loading ? "" : `${queue.length} lịch`}</span>
          </div>
          {pending.loading ? (
            <div className="flex flex-col gap-2">{Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-24" />)}</div>
          ) : queue.length === 0 ? (
            <p className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">Không có lịch nào đang chờ xác nhận.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {queue.map((a) => (
                <li key={a.appointment_id} className="flex flex-col gap-3 rounded-lg border bg-card p-(--card-pad)">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium tabular-nums">#{a.appointment_id} · {a.service.name}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">{formatDate(a.slot.slot_date)} · {formatRange(a.slot.start_time, a.slot.end_time)}</span>
                    <span className="text-xs text-muted-foreground">{a.customer.full_name} · <span className="tabular-nums">{a.vehicle.license_plate}</span></span>
                  </div>
                  <AppointmentActions a={a} onDone={reloadAll} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AdminPage>
  )
}
