"use client"

import { useState } from "react"

import { AppointmentActions } from "@/components/admin/appointment-actions"
import { AppointmentDetail } from "@/components/appointment-detail"
import { ErrorNote } from "@/components/error-note"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { api, type Appointment, type AppointmentStatus } from "@/lib/api"
import { ALL_STATUSES, STATUS_LABEL, formatDate, formatRange } from "@/lib/format"
import { useApi } from "@/lib/use-api"

export default function AdminAppointmentsPage() {
  const [status, setStatus] = useState<AppointmentStatus | "ALL">("ALL")
  const [date, setDate] = useState("")
  const [open, setOpen] = useState<Appointment | null>(null)
  const { data, error, loading, reload } = useApi(() => api.appointments({ status: status === "ALL" ? undefined : status, date: date || undefined }), [status, date])
  const items = (data ?? []).slice().sort((a, b) => (a.slot.slot_date + a.slot.start_time).localeCompare(b.slot.slot_date + b.slot.start_time))

  // làm mới dữ liệu rồi đồng bộ lại lịch đang mở trong ngăn chi tiết
  const afterAction = () => { setOpen(null); reload() }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl">Lịch hẹn</h1>
        <p className="text-sm text-muted-foreground">{loading ? "Đang tải" : `${items.length} lịch hẹn`}</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="f-status" className="text-xs text-muted-foreground">Trạng thái</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as AppointmentStatus | "ALL")}>
            <SelectTrigger id="f-status" className="w-full sm:w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả</SelectItem>
              {ALL_STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="f-date" className="text-xs text-muted-foreground">Ngày</Label>
          <Input id="f-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full sm:w-44" />
        </div>
        {(status !== "ALL" || date) && <Button variant="ghost" onClick={() => { setStatus("ALL"); setDate("") }}>Xóa lọc</Button>}
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
    </div>
  )
}
