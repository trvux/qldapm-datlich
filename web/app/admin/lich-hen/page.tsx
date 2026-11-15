"use client"

import { Search } from "lucide-react"
import { useState } from "react"

import { AppointmentActions } from "@/components/admin/appointment-actions"
import { AppointmentDetail } from "@/components/appointment-detail"
import { ErrorNote } from "@/components/error-note"
import { AdminPage } from "@/components/layout/admin-page"
import { PageHeader } from "@/components/layout/page-header"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/date-picker"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { api, type Appointment, type AppointmentStatus } from "@/lib/api"
import { ALL_STATUSES, STATUS_LABEL, formatDate, formatRange } from "@/lib/format"
import { useApi } from "@/lib/use-api"

export default function AdminAppointmentsPage() {
  const [status, setStatus] = useState<AppointmentStatus | "ALL">("ALL")
  const [date, setDate] = useState("")
  const [q, setQ] = useState("")
  const [open, setOpen] = useState<Appointment | null>(null)
  // Lấy theo ngày (nếu có), lọc trạng thái và tìm kiếm ở phía client để các tab có số lượng đúng
  const { data, error, loading, reload } = useApi(() => api.appointments({ date: date || undefined }), [date])
  const all = data ?? []
  const counts = (s: AppointmentStatus | "ALL") => (s === "ALL" ? all.length : all.filter((a) => a.status === s).length)
  const needle = q.trim().toLowerCase()
  const items = all
    .filter((a) => status === "ALL" || a.status === status)
    .filter((a) => !needle || [String(a.appointment_id), a.customer.full_name, a.vehicle.license_plate, a.service.name].some((t) => t.toLowerCase().includes(needle)))
    .sort((a, b) => (a.slot.slot_date + a.slot.start_time).localeCompare(b.slot.slot_date + b.slot.start_time))

  const afterAction = () => { setOpen(null); reload() }

  return (
    <AdminPage>
      <PageHeader size="sm" title="Lịch hẹn" description={loading ? "Đang tải" : `${items.length} trên ${all.length} lịch hẹn`} />

      <Tabs value={status} onValueChange={(v) => setStatus(v as AppointmentStatus | "ALL")}>
        <div className="-mx-3 overflow-x-auto px-3 sm:mx-0 sm:px-0">
          <TabsList className="w-max">
            <TabsTrigger value="ALL">Tất cả <span className="tabular-nums text-muted-foreground">{counts("ALL")}</span></TabsTrigger>
            {ALL_STATUSES.map((s) => <TabsTrigger key={s} value={s}>{STATUS_LABEL[s]} <span className="tabular-nums text-muted-foreground">{counts(s)}</span></TabsTrigger>)}
          </TabsList>
        </div>
      </Tabs>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative sm:w-72">
          <Search aria-hidden className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm theo mã, khách, biển số, dịch vụ" aria-label="Tìm lịch hẹn" className="pl-8" />
        </div>
        <DatePicker value={date} onChange={setDate} placeholder="Lọc theo ngày" aria-label="Lọc theo ngày" className="sm:w-52" />
        {(date || q) && <Button variant="ghost" onClick={() => { setDate(""); setQ("") }}>Xóa lọc</Button>}
      </div>

      <ErrorNote error={error} who="staff" />
      {loading ? (
        <div className="flex flex-col gap-2">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-12" />)}</div>
      ) : items.length === 0 ? (
        <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">Không có lịch hẹn nào khớp bộ lọc.</p>
      ) : (
        <>
          {/* Mobile: thẻ */}
          <ul className="flex flex-col gap-2 md:hidden">
            {items.map((a) => (
              <li key={a.appointment_id} className="flex flex-col gap-2 rounded-lg border bg-card p-3">
                <button type="button" className="flex flex-col gap-1.5 text-left" onClick={() => setOpen(a)}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium tabular-nums">#{a.appointment_id} · {a.service.name}</span>
                    <StatusBadge status={a.status} />
                  </div>
                  <span className="text-xs text-muted-foreground tabular-nums">{formatDate(a.slot.slot_date)} · {formatRange(a.slot.start_time, a.slot.end_time)}</span>
                  <span className="text-xs text-muted-foreground">{a.customer.full_name} · <span className="tabular-nums">{a.vehicle.license_plate}</span></span>
                </button>
                <AppointmentActions a={a} onDone={reload} />
              </li>
            ))}
          </ul>
          {/* Tablet và desktop: bảng */}
          <div className="hidden overflow-x-auto rounded-lg border bg-card md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Mã</TableHead>
                  <TableHead>Thời gian</TableHead>
                  <TableHead>Khách</TableHead>
                  <TableHead>Xe</TableHead>
                  <TableHead>Dịch vụ</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((a) => (
                  <TableRow key={a.appointment_id}>
                    <TableCell className="tabular-nums"><button type="button" onClick={() => setOpen(a)} className="font-medium text-primary underline-offset-4 hover:underline">#{a.appointment_id}</button></TableCell>
                    <TableCell className="tabular-nums">{formatDate(a.slot.slot_date)} · {formatRange(a.slot.start_time, a.slot.end_time)}</TableCell>
                    <TableCell>{a.customer.full_name}</TableCell>
                    <TableCell className="tabular-nums">{a.vehicle.license_plate}</TableCell>
                    <TableCell>{a.service.name}</TableCell>
                    <TableCell><StatusBadge status={a.status} /></TableCell>
                    <TableCell className="text-right"><div className="flex justify-end"><AppointmentActions a={a} onDone={reload} /></div></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      <Sheet open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Chi tiết lịch hẹn</SheetTitle>
            <SheetDescription>Thông tin và lịch sử xử lý.</SheetDescription>
          </SheetHeader>
          {open && (
            <div className="flex flex-col gap-6 px-4 pb-6">
              <AppointmentDetail a={open} />
              <AppointmentActions a={open} onDone={afterAction} size="default" />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </AdminPage>
  )
}
