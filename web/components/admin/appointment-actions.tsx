"use client"

import { Check, Play, Flag, X } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { api, errorText, type Appointment } from "@/lib/api"

/** Thao tác của nhân viên theo trạng thái: PENDING xác nhận/từ chối, CONFIRMED bắt đầu, IN_PROGRESS hoàn thành. */
export function AppointmentActions({ a, onDone, size = "sm" }: { a: Appointment; onDone: () => void; size?: "sm" | "default" }) {
  const [busy, setBusy] = useState<string | null>(null)
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState("")

  async function run(key: string, fn: () => Promise<unknown>, ok: string) {
    setBusy(key)
    try {
      await fn()
      toast.success(ok)
      setRejecting(false)
      setReason("")
      onDone()
    } catch (e) {
      toast.error(errorText(e, "staff"))
    } finally {
      setBusy(null)
    }
  }
  const id = a.appointment_id

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {a.status === "PENDING" && (
          <>
            <Button size={size} disabled={!!busy} onClick={() => run("confirm", () => api.confirmAppointment(id), `Đã xác nhận lịch #${id}.`)}>
              {busy === "confirm" ? <Spinner /> : <Check className="size-4" />}Xác nhận
            </Button>
            <Button size={size} variant="outline" disabled={!!busy} onClick={() => setRejecting(true)}><X className="size-4" />Từ chối</Button>
          </>
        )}
        {a.status === "CONFIRMED" && (
          <Button size={size} disabled={!!busy} onClick={() => run("start", () => api.startAppointment(id), `Lịch #${id}: xe đã đến, bắt đầu thực hiện.`)}>
            {busy === "start" ? <Spinner /> : <Play className="size-4" />}Bắt đầu
          </Button>
        )}
        {a.status === "IN_PROGRESS" && (
          <Button size={size} disabled={!!busy} onClick={() => run("done", () => api.completeAppointment(id), `Đã hoàn thành lịch #${id}.`)}>
            {busy === "done" ? <Spinner /> : <Flag className="size-4" />}Hoàn thành
          </Button>
        )}
      </div>
      <Dialog open={rejecting} onOpenChange={setRejecting}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Từ chối lịch #{id}</DialogTitle>
            <DialogDescription>Lý do được gửi cho khách và là bắt buộc.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`reason-${id}`}>Lý do</Label>
            <Textarea id={`reason-${id}`} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} />
          </div>
          <DialogFooter>
            <Button variant="destructive" disabled={!reason.trim() || !!busy} onClick={() => run("reject", () => api.rejectAppointment(id, reason.trim()), `Đã từ chối lịch #${id}.`)}>
              {busy === "reject" && <Spinner />}Từ chối lịch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
