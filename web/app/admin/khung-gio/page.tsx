"use client"

import { useState } from "react"
import { toast } from "sonner"

import { ErrorNote } from "@/components/error-note"
import { AdminPage } from "@/components/layout/admin-page"
import { PageHeader } from "@/components/layout/page-header"
import { RequireManager } from "@/components/shell/admin-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { api, errorText, type Slot } from "@/lib/api"
import { addDays, formatDate, formatRange, formatShortDate, slotClosedLabel, todayISO } from "@/lib/format"
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
      <Input type="number" inputMode="numeric" min={0} value={value} onChange={(e) => setValue(e.target.value)} className="w-20" aria-label={`Số xe tối đa, ${formatRange(slot.start_time, slot.end_time)}`} />
      <Button size="sm" variant="outline" disabled={!changed || busy || value === ""} onClick={save}>Lưu</Button>
    </div>
  )
}

function Slots() {
  const [from] = useState(todayISO())
  const to = addDays(from, 6)
  const { data, error, loading, reload } = useApi(() => api.slots(from, to), [from, to])
  const [picked, setPicked] = useState<string | null>(null)

  const byDate = new Map<string, Slot[]>()
  for (const s of data ?? []) byDate.set(s.slot_date, [...(byDate.get(s.slot_date) ?? []), s])
  const dates = [...byDate.keys()].sort()
  const day = picked && byDate.has(picked) ? picked : dates[0]
  const slots = (byDate.get(day) ?? []).slice().sort((a, b) => a.start_time.localeCompare(b.start_time))

  return (
    <AdminPage>
      <PageHeader size="sm" title="Khung giờ" description="7 ngày tới. Đổi số xe tối đa của từng khung giờ." />
      <ErrorNote error={error} who="staff" />
      {loading ? <Skeleton className="h-64 w-full" /> : dates.length === 0 ? (
        <p className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">Chưa có khung giờ trong 7 ngày tới.</p>
      ) : (
        <>
          <Tabs value={day} onValueChange={setPicked}>
            <div className="-mx-3 overflow-x-auto px-3 sm:mx-0 sm:px-0">
              <TabsList className="w-max">{dates.map((d) => <TabsTrigger key={d} value={d} className="">{formatShortDate(d)}</TabsTrigger>)}</TabsList>
            </div>
          </Tabs>
          <h2 className="text-lg">{formatDate(day)}</h2>
          <ul className="flex flex-col gap-2 md:hidden">
            {slots.map((s) => (
              <li key={s.slot_id} className="flex flex-col gap-2 rounded-lg border bg-card p-3">
                <div className="flex items-center justify-between gap-2"><span className="font-medium">{formatRange(s.start_time, s.end_time)}</span>{!s.bookable && <Badge variant="cancelled">{slotClosedLabel(s.closed_reason)}</Badge>}</div>
                <span className="text-xs text-muted-foreground">Đã đặt {s.booked} · Còn {s.remaining}</span>
                <CapacityEditor slot={s} onSaved={reload} />
              </li>
            ))}
          </ul>
          <div className="hidden overflow-x-auto rounded-lg border bg-card md:block">
            <Table>
              <TableHeader><TableRow><TableHead>Khung giờ</TableHead><TableHead>Đã đặt</TableHead><TableHead>Còn lại</TableHead><TableHead>Nhận lịch</TableHead><TableHead>Số xe tối đa</TableHead></TableRow></TableHeader>
              <TableBody>
                {slots.map((s) => (
                  <TableRow key={s.slot_id}>
                    <TableCell className="font-medium">{formatRange(s.start_time, s.end_time)}</TableCell>
                    <TableCell className="">{s.booked}</TableCell>
                    <TableCell className="">{s.remaining}</TableCell>
                    <TableCell>{s.bookable ? <Badge variant="confirmed">Còn chỗ</Badge> : <Badge variant="cancelled">{slotClosedLabel(s.closed_reason)}</Badge>}</TableCell>
                    <TableCell><CapacityEditor slot={s} onSaved={reload} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </AdminPage>
  )
}

export default function AdminSlotsPage() { return <RequireManager><Slots /></RequireManager> }
