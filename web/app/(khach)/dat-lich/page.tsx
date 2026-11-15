"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useState } from "react"
import { toast } from "sonner"

import { ErrorNote } from "@/components/error-note"
import { AppPage } from "@/components/layout/app-page"
import { PageHeader } from "@/components/layout/page-header"
import { RequireAuth } from "@/components/shell/require-auth"
import { SlotPicker } from "@/components/slot-picker"
import { Button } from "@/components/ui/button"
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
    <section className="flex flex-col gap-4" aria-labelledby={`step-${n}`}>
      <h2 id={`step-${n}`} className="flex items-center gap-3 text-xl">
        <span className="inline-flex size-7 items-center justify-center rounded-sm bg-primary font-sans text-sm font-semibold text-primary-foreground">{n}</span>
        {title}
      </h2>
      {children}
    </section>
  )
}

function Row({ k, v }: { k: string; v: string | null }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className={v ? "text-right font-medium" : "text-right text-muted-foreground"}>{v ?? "Chưa chọn"}</dd>
    </div>
  )
}

function BookingForm() {
  const router = useRouter()
  const params = useSearchParams()
  const preset = params.get("service")
  const presetVehicle = params.get("vehicle")
  const vehicles = useApi(() => api.vehicles(), [])
  const services = useApi(() => api.services(), [])
  const [vehicleId, setVehicleId] = useState(presetVehicle ?? "")
  const [serviceId, setServiceId] = useState(preset ?? "")
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

  const submitButton = (
    <Button size="lg" disabled={!ready || busy} onClick={submit} className="w-full">{busy && <Spinner />}Đặt lịch</Button>
  )

  return (
    <AppPage className="pb-28 lg:pb-12">
      <PageHeader eyebrow="Đặt lịch" title="Đặt lịch bảo dưỡng" description="Chọn xe, dịch vụ và khung giờ. Trung tâm sẽ xác nhận lịch của Quý khách." />

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-start lg:gap-12">
        <div className="flex min-w-0 flex-col gap-10">
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
              <RadioGroup value={serviceId} onValueChange={setServiceId} className="grid gap-3 sm:grid-cols-2">
                {(services.data ?? []).map((s) => (
                  <Label key={s.service_id} htmlFor={`svc-${s.service_id}`} className="flex cursor-pointer items-start gap-3 rounded-md border bg-card p-4 font-normal transition-colors hover:border-primary/60 has-data-[state=checked]:border-primary has-data-[state=checked]:bg-accent">
                    <RadioGroupItem id={`svc-${s.service_id}`} value={String(s.service_id)} className="mt-0.5" />
                    <span className="flex flex-1 flex-col gap-0.5">
                      <span className="font-medium">{s.name}</span>
                      <span className="text-xs text-muted-foreground">{s.duration_minutes} phút · {formatVND(s.reference_price)}</span>
                    </span>
                  </Label>
                ))}
              </RadioGroup>
            )}
          </Step>

          <Step n={3} title="Thời gian"><SlotPicker value={slot?.slot_id ?? null} onChange={setSlot} /></Step>

          <Step n={4} title="Ghi chú (không bắt buộc)">
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} rows={3} placeholder="Ví dụ: xe có tiếng kêu ở bánh trước." aria-label="Ghi chú cho Trung tâm" />
          </Step>
        </div>

        {/* Tóm tắt: cột phải, dính khi cuộn (desktop). Trên mobile thay bằng thanh đặt lịch cố định ở đáy. */}
        <aside className="stitch hidden flex-col gap-5 rounded-lg border bg-card p-6 lg:sticky lg:top-24 lg:flex">
          <h2 className="text-lg">Tóm tắt</h2>
          <dl className="flex flex-col gap-3 text-sm">
            <Row k="Xe" v={vehicle?.license_plate ?? null} />
            <Row k="Dịch vụ" v={service?.name ?? null} />
            <Row k="Ngày" v={slot ? formatDate(slot.slot_date) : null} />
            <Row k="Giờ" v={slot ? formatRange(slot.start_time, slot.end_time) : null} />
            <Row k="Giá tham khảo" v={service ? formatVND(service.reference_price) : null} />
          </dl>
          <ErrorNote error={error} />
          {submitButton}
          {!ready && <p className="text-xs text-muted-foreground">Chọn đủ xe, dịch vụ và khung giờ để đặt lịch.</p>}
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 p-3 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-1">
          <div className="min-w-0 flex-1 text-sm">
            <p className="truncate font-medium">{service?.name ?? "Chưa chọn dịch vụ"}</p>
            <p className="truncate text-xs text-muted-foreground">{slot ? `${formatDate(slot.slot_date)} · ${formatRange(slot.start_time, slot.end_time)}` : "Chưa chọn thời gian"}</p>
          </div>
          <div className="w-32 shrink-0">{submitButton}</div>
        </div>
      </div>
    </AppPage>
  )
}

export default function BookingPage() {
  return <RequireAuth><Suspense><BookingForm /></Suspense></RequireAuth>
}
