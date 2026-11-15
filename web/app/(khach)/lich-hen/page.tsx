"use client"

import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

import { Roadster } from "@/components/brand/illustrations"
import { AppointmentList } from "@/components/appointment-list"
import { ErrorNote } from "@/components/error-note"
import { AppPage } from "@/components/layout/app-page"
import { PageHeader } from "@/components/layout/page-header"
import { RequireAuth } from "@/components/shell/require-auth"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { api, type Appointment, type AppointmentStatus } from "@/lib/api"
import { ALL_STATUSES, STATUS_LABEL, formatDate, formatRange, todayISO } from "@/lib/format"
import { useApi } from "@/lib/use-api"

/** Lịch sắp tới gần nhất, nổi bật bằng dải thương hiệu. */
function NextAppointment({ a }: { a: Appointment }) {
  return (
    <section aria-label="Lịch sắp tới" className="stitch flex flex-col gap-5 rounded-lg bg-band p-6 text-band-foreground sm:flex-row sm:items-center sm:justify-between sm:p-8">
      <div className="flex min-w-0 flex-col gap-2">
        <p className="text-xs tracking-[0.18em] uppercase opacity-80">Lịch sắp tới</p>
        <p className="font-heading text-2xl font-semibold tabular-nums sm:text-3xl">{formatDate(a.slot.slot_date)} · {formatRange(a.slot.start_time, a.slot.end_time)}</p>
        <p className="text-sm opacity-90">{a.service.name} · <span className="tabular-nums">{a.vehicle.license_plate}</span></p>
        <div className="pt-1"><StatusBadge status={a.status} /></div>
      </div>
      <Button asChild variant="secondary" size="lg"><Link href={`/lich-hen/${a.appointment_id}`}>Xem chi tiết <ArrowRight className="size-4" /></Link></Button>
    </section>
  )
}

function MyAppointments() {
  const [status, setStatus] = useState<AppointmentStatus | "ALL">("ALL")
  const { data, error, loading } = useApi(() => api.appointments(status === "ALL" ? {} : { status }), [status])
  const items = (data ?? []).slice().sort((a, b) => (b.slot.slot_date + b.slot.start_time).localeCompare(a.slot.slot_date + a.slot.start_time))
  const today = todayISO()
  const next = status === "ALL"
    ? (data ?? []).filter((a) => ["PENDING", "CONFIRMED"].includes(a.status) && a.slot.slot_date >= today)
        .sort((a, b) => (a.slot.slot_date + a.slot.start_time).localeCompare(b.slot.slot_date + b.slot.start_time))[0]
    : undefined

  return (
    <AppPage>
      <PageHeader eyebrow="Tài khoản" title="Lịch hẹn" description="Các lịch hẹn của Quý khách." actions={<Button asChild><Link href="/dat-lich">Đặt lịch</Link></Button>} />

      <Tabs value={status} onValueChange={(v) => setStatus(v as AppointmentStatus | "ALL")}>
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <TabsList className="w-max">
            <TabsTrigger value="ALL">Tất cả</TabsTrigger>
            {ALL_STATUSES.map((s) => <TabsTrigger key={s} value={s}>{STATUS_LABEL[s]}</TabsTrigger>)}
          </TabsList>
        </div>
      </Tabs>

      <ErrorNote error={error} />
      {next && <NextAppointment a={next} />}
      {loading ? (
        <div className="flex flex-col gap-3">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-24" />)}</div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-start gap-5 rounded-lg border border-dashed p-8 text-primary sm:p-10">
          <Roadster dashed className="max-w-44 opacity-70" />
          <div className="flex flex-col gap-1 text-foreground">
            <h2 className="text-xl">{status === "ALL" ? "Quý khách chưa có lịch hẹn nào" : `Không có lịch ở trạng thái ${STATUS_LABEL[status].toLowerCase()}`}</h2>
            <p className="text-sm text-muted-foreground">Đặt lịch để Trung tâm giữ chỗ cho xe của Quý khách.</p>
          </div>
          <Button asChild><Link href="/dat-lich">Đặt lịch</Link></Button>
        </div>
      ) : (
        <AppointmentList items={items} />
      )}
    </AppPage>
  )
}

export default function MyAppointmentsPage() {
  return <RequireAuth><MyAppointments /></RequireAuth>
}
