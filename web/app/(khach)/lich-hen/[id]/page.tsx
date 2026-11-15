"use client"

import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

import { AppointmentHistory } from "@/components/appointment-detail"
import { AppointmentTicket } from "@/components/appointment-ticket"
import { AppPage } from "@/components/layout/app-page"
import { PageHeader } from "@/components/layout/page-header"
import { ErrorNote } from "@/components/error-note"
import { RequireAuth } from "@/components/shell/require-auth"
import { SlotPicker } from "@/components/slot-picker"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { api, errorText, type Appointment, type Slot } from "@/lib/api"
import { useApi } from "@/lib/use-api"

function Reschedule({ a, onDone }: { a: Appointment; onDone: () => void }) {
  const [open, setOpen] = useState(false)
  const [slot, setSlot] = useState<Slot | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>(null)
  async function submit() {
    if (!slot) return
    setBusy(true)
    setError(null)
    try {
      await api.rescheduleAppointment(a.appointment_id, { slot_id: slot.slot_id })
      toast.success("Quý khách đã đổi lịch thành công.")
      setOpen(false)
      onDone()
    } catch (e) {
      setError(e)
    } finally {
      setBusy(false)
    }
  }
  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setSlot(null); setError(null) } }}>
      <DialogTrigger asChild><Button variant="outline">Đổi lịch</Button></DialogTrigger>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Đổi lịch</DialogTitle>
          <DialogDescription>Chọn ngày và khung giờ mới cho lịch hẹn #{a.appointment_id}.</DialogDescription>
        </DialogHeader>
        <SlotPicker value={slot?.slot_id ?? null} onChange={setSlot} />
        <ErrorNote error={error} />
        <DialogFooter>
          <Button disabled={!slot || busy} onClick={submit}>{busy && <Spinner />}Xác nhận đổi</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Cancel({ a, onDone }: { a: Appointment; onDone: () => void }) {
  const [busy, setBusy] = useState(false)
  async function run() {
    setBusy(true)
    try {
      await api.cancelAppointment(a.appointment_id)
      toast.success("Quý khách đã hủy lịch hẹn.")
      onDone()
    } catch (e) {
      toast.error(errorText(e))
    } finally {
      setBusy(false)
    }
  }
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild><Button variant="destructive">Hủy lịch</Button></AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Quý khách có chắc muốn hủy lịch hẹn này?</AlertDialogTitle>
          <AlertDialogDescription>Khung giờ sẽ được trả lại cho khách khác. Thao tác không thể hoàn tác.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Giữ lịch</AlertDialogCancel>
          <AlertDialogAction disabled={busy} onClick={run}>{busy && <Spinner />}Hủy lịch</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function Detail() {
  const { id } = useParams<{ id: string }>()
  const { data, error, loading, reload } = useApi(() => api.appointment(Number(id)), [id])
  const canChange = data && (data.status === "PENDING" || data.status === "CONFIRMED")
  return (
    <AppPage>
      <PageHeader
        eyebrow="Lịch hẹn"
        title={data ? `Lịch hẹn #${data.appointment_id}` : "Lịch hẹn"}
        description={data ? `${data.service.name} · ${data.vehicle.license_plate}` : undefined}
        actions={<Button asChild variant="outline"><Link href="/lich-hen"><ArrowLeft className="size-4" />Tất cả lịch hẹn</Link></Button>}
      />
      <ErrorNote error={error} />
      {loading ? <Skeleton className="h-72 w-full" /> : data && (
        <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
          <div className="flex flex-col gap-4 lg:col-span-8">
            <AppointmentTicket a={data} />
            {canChange && (
              <div className="flex flex-wrap gap-2">
                <Reschedule a={data} onDone={reload} />
                <Cancel a={data} onDone={reload} />
              </div>
            )}
          </div>
          <div className="rounded-lg border bg-card p-6 lg:col-span-4"><AppointmentHistory a={data} /></div>
        </div>
      )}
    </AppPage>
  )
}

export default function AppointmentPage() {
  return <RequireAuth><Detail /></RequireAuth>
}
