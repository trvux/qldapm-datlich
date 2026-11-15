"use client"

import { useState } from "react"
import { toast } from "sonner"

import { ErrorNote } from "@/components/error-note"
import { RequireManager } from "@/components/shell/admin-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { api, errorText, type Slot } from "@/lib/api"
import { addDays, formatDate, formatRange, slotClosedLabel, todayISO } from "@/lib/format"
import { useApi } from "@/lib/use-api"

function CapacityEditor({ slot, onSaved }: { slot: Slot; onSaved: () => void }) {
  const [value, setValue] = useState(String(slot.max_capacity))
  const [busy, setBusy] = useState(false)
  const changed = Number(value) !== slot.max_capacity
  async function save() {
    setBusy(true)
    try { await api.updateSlotCapacity(slot.slot_id, Number(value)); toast.success("Đã đổi số xe tối đa."); onSaved() }
    catch (e) { toast.error(errorText(e, "staff")); setValue(String(slot.max_capacity)) }
    finally { setBusy(false) }
  }
  return (
    <div className="flex items-center gap-2">
      <Input type="number" inputMode="numeric" min={0} value={value} onChange={(e) => setValue(e.target.value)} className="w-20 tabular-nums" aria-label={`Số xe tối đa, ${formatRange(slot.start_time, slot.end_time)}`} />
      <Button size="sm" variant="outline" disabled={!changed || busy || value === ""} onClick={save}>Lưu</Button>
    </div>
  )
}

function Slots() {
  const [from] = useState(todayISO())
  const to = addDays(from, 6)
  const { data, error, loading, reload } = useApi(() => api.slots(from, to), [from, to])
  const byDate = new Map<string, Slot[]>()
  for (const s of data ?? []) byDate.set(s.slot_date, [...(byDate.get(s.slot_date) ?? []), s])
  const dates = [...byDate.keys()].sort()

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1"><h1 className="text-2xl">Khung giờ</h1><p className="text-sm text-muted-foreground">7 ngày tới. Đổi số xe tối đa của từng khung giờ.</p></div>
      <ErrorNote error={error} who="staff" />
      {loading ? <div className="flex flex-col gap-2">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-12" />)}</div>
        : dates.length === 0 ? <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">Chưa có khung giờ trong 7 ngày tới.</p>
        : dates.map((d) => (
          <section key={d} aria-labelledby={`d-${d}`} className="flex flex-col gap-2">
            <h2 id={`d-${d}`} className="text-base tabular-nums">{formatDate(d)}</h2>
            <ul className="flex flex-col gap-2 md:hidden">
              {byDate.get(d)!.map((s) => (
                <li key={s.slot_id} className="flex flex-col gap-2 rounded-lg border bg-card p-3">
                  <div className="flex items-center justify-between"><span className="font-medium tabular-nums">{formatRange(s.start_time, s.end_time)}</span>{!s.bookable && <Badge variant="cancelled">{slotClosedLabel(s.closed_reason)}</Badge>}</div>
                  <span className="text-xs text-muted-foreground tabular-nums">Đã đặt {s.booked} · Còn {s.remaining}</span>
                  <CapacityEditor slot={s} onSaved={reload} />
                </li>
              ))}
            </ul>
            <div className="hidden overflow-x-auto rounded-lg border bg-card md:block">
              <Table>
                <TableHeader><TableRow><TableHead>Khung giờ</TableHead><TableHead>Đã đặt</TableHead><TableHead>Còn lại</TableHead><TableHead>Nhận lịch</TableHead><TableHead>Số xe tối đa</TableHead></TableRow></TableHeader>
                <TableBody>
                  {byDate.get(d)!.map((s) => (
                    <TableRow key={s.slot_id}>
                      <TableCell className="font-medium tabular-nums">{formatRange(s.start_time, s.end_time)}</TableCell>
                      <TableCell className="tabular-nums">{s.booked}</TableCell>
                      <TableCell className="tabular-nums">{s.remaining}</TableCell>
                      <TableCell>{s.bookable ? <Badge variant="confirmed">Còn chỗ</Badge> : <Badge variant="cancelled">{slotClosedLabel(s.closed_reason)}</Badge>}</TableCell>
                      <TableCell><CapacityEditor slot={s} onSaved={reload} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>
        ))}
    </div>
  )
}

export default function AdminSlotsPage() { return <RequireManager><Slots /></RequireManager> }
