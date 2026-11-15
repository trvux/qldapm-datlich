"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useState } from "react"
import { toast } from "sonner"

import { ErrorNote } from "@/components/error-note"
import { RequireAuth } from "@/components/shell/require-auth"
import { SlotPicker } from "@/components/slot-picker"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { VehicleDialog } from "@/components/vehicle-dialog"
import { api, errorText, type Slot } from "@/lib/api"
import { formatDate, formatRange, formatVND } from "@/lib/format"
import { useApi } from "@/lib/use-api"

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3" aria-labelledby={`step-${n}`}>
      <h2 id={`step-${n}`} className="flex items-center gap-2 text-lg">
        <span className="inline-flex size-6 items-center justify-center rounded-sm bg-primary text-xs font-semibold text-primary-foreground tabular-nums">{n}</span>
        {title}
      </h2>
      {children}
    </section>
  )
}

function BookingForm() {
  const router = useRouter()
  const preset = useSearchParams().get("service")
  const vehicles = useApi(() => api.vehicles(), [])
  const services = useApi(() => api.services(), [])
  const [vehicleId, setVehicleId] = useState<string>("")
  const [serviceId, setServiceId] = useState<string>(preset ?? "")
  const [slot, setSlot] = useState<Slot | null>(null)
  const [note, setNote] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>(null)

  const vehicle = vehicles.data?.find((v) => String(v.vehicle_id) === vehicleId)
  const service = services.data?.find((s) => String(s.service_id) === serviceId)
  const ready = !!vehicle && !!service && !!slot

  async function submit() {
    if (!vehicle || !service || !slot) return
    setBusy(true)
    setError(null)
    try {
      const a = await api.createAppointment({ vehicle_id: vehicle.vehicle_id, service_id: service.service_id, slot_id: slot.slot_id, note: note.trim() || null })
      toast.success("Quý khách đã đặt lịch thành công.")
      router.push(`/lich-hen/${a.appointment_id}`)
    } catch (e) {
      setError(e)
      toast.error(errorText(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl">Đặt lịch</h1>
        <p className="text-muted-foreground">Chọn xe, dịch vụ và thời gian.</p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <div className="flex min-w-0 flex-col gap-8">
          <Step n={1} title="Xe">
            <ErrorNote error={vehicles.error} />
            {vehicles.loading ? <Skeleton className="h-10 w-full" /> : (
              <div className="flex flex-col gap-2 sm:flex-row">
                <Select value={vehicleId} onValueChange={setVehicleId}>
                  <SelectTrigger className="w-full sm:flex-1" aria-label="Chọn xe"><SelectValue placeholder={(vehicles.data ?? []).length ? "Chọn xe" : "Chưa có xe, hãy thêm xe"} /></SelectTrigger>
                  <SelectContent>
                    {(vehicles.data ?? []).map((v) => (
                      <SelectItem key={v.vehicle_id} value={String(v.vehicle_id)}>{v.license_plate} · {[v.brand, v.model].filter(Boolean).join(" ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <VehicleDialog onCreated={(v) => { vehicles.reload(); setVehicleId(String(v.vehicle_id)) }} />
              </div>
            )}
          </Step>

          <Step n={2} title="Dịch vụ">
            <ErrorNote error={services.error} />
            {services.loading ? <Skeleton className="h-40 w-full" /> : (
              <RadioGroup value={serviceId} onValueChange={setServiceId} className="grid gap-2 sm:grid-cols-2">
                {(services.data ?? []).map((s) => (
                  <Label key={s.service_id} htmlFor={`svc-${s.service_id}`} className="flex cursor-pointer items-start gap-3 rounded-md border p-3 font-normal has-data-[state=checked]:border-primary has-data-[state=checked]:bg-accent">
                    <RadioGroupItem id={`svc-${s.service_id}`} value={String(s.service_id)} className="mt-0.5" />
                    <span className="flex flex-1 flex-col gap-0.5">
                      <span className="font-medium">{s.name}</span>
                      <span className="text-xs text-muted-foreground tabular-nums">{s.duration_minutes} phút · {formatVND(s.reference_price)}</span>
                    </span>
                  </Label>
                ))}
              </RadioGroup>
            )}
          </Step>

          <Step n={3} title="Thời gian"><SlotPicker value={slot?.slot_id ?? null} onChange={setSlot} /></Step>

          <Step n={4} title="Ghi chú (không bắt buộc)">
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder="Ví dụ: xe có tiếng kêu ở bánh trước." aria-label="Ghi chú cho Trung tâm" />
          </Step>
        </div>

        <Card className="lg:sticky lg:top-24">
          <CardHeader><CardTitle className="text-lg">Tóm tắt</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-4 text-sm">
            <dl className="flex flex-col gap-2.5">
              <Row k="Xe" v={vehicle ? `${vehicle.license_plate}` : null} />
              <Row k="Dịch vụ" v={service?.name ?? null} />
              <Row k="Ngày" v={slot ? formatDate(slot.slot_date) : null} />
              <Row k="Giờ" v={slot ? formatRange(slot.start_time, slot.end_time) : null} />
              <Row k="Giá tham khảo" v={service ? formatVND(service.reference_price) : null} />
            </dl>
            <ErrorNote error={error} />
            <Button size="lg" disabled={!ready || busy} onClick={submit}>{busy && <Spinner />}Đặt lịch</Button>
            {!ready && <p className="text-xs text-muted-foreground">Chọn đủ xe, dịch vụ và khung giờ để đặt lịch.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Row({ k, v }: { k: string; v: string | null }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className={v ? "text-right font-medium tabular-nums" : "text-right text-muted-foreground"}>{v ?? "Chưa chọn"}</dd>
    </div>
  )
}

export default function BookingPage() {
  return <RequireAuth><Suspense><BookingForm /></Suspense></RequireAuth>
}
