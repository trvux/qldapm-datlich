"use client"

import { useMemo, useState } from "react"

import { ErrorNote } from "@/components/error-note"
import { Skeleton } from "@/components/ui/skeleton"
import { api, type Slot } from "@/lib/api"
import { addDays, formatRange, formatShortDate, slotClosedLabel, todayISO } from "@/lib/format"
import { useApi } from "@/lib/use-api"
import { usePolicy } from "@/lib/policy"
import { cn } from "@/lib/utils"

const WEEKDAY = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"]

/** Chọn ngày (dải số ngày đặt trước tối đa theo GET /policy, cuộn ngang trên mobile) rồi chọn khung giờ. Khung hết chỗ bị khóa. */
export function SlotPicker({ value, onChange }: { value: number | null; onChange: (slot: Slot) => void }) {
  const from = useMemo(() => todayISO(), [])
  const { policy, error: policyError } = usePolicy()
  const DAYS = policy?.max_advance_days ?? 0
  const to = addDays(from, Math.max(DAYS - 1, 0))
  const { data, error, loading } = useApi(() => (DAYS ? api.slots(from, to) : Promise.resolve([] as Slot[])), [from, to, DAYS])
  const [picked, setPicked] = useState<string | null>(null)

  const byDay = useMemo(() => {
    const m = new Map<string, Slot[]>()
    for (const s of data ?? []) m.set(s.slot_date, [...(m.get(s.slot_date) ?? []), s])
    return m
  }, [data])
  const days = useMemo(() => Array.from({ length: DAYS }, (_, i) => addDays(from, i)), [from, DAYS])

  // Ngày mặc định: ngày đầu tiên còn khung giờ nhận lịch, cho tới khi khách tự chọn ngày khác
  const day = picked ?? (data ? (days.find((d) => (byDay.get(d) ?? []).some((s) => s.bookable)) ?? days[0]) : null)

  if (policyError || error) return <ErrorNote error={policyError ?? error} />
  if (!policy || loading || !day) return <Skeleton className="h-40 w-full" />

  const slots = (byDay.get(day) ?? []).slice().sort((a, b) => a.start_time.localeCompare(b.start_time))
  return (
    <div className="flex flex-col gap-4">
      <div role="tablist" aria-label="Chọn ngày" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {days.map((d) => {
          const dt = new Date(d + "T00:00:00")
          const free = (byDay.get(d) ?? []).some((s) => s.bookable)
          const active = d === day
          return (
            <button
              key={d}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setPicked(d)}
              className={cn(
                "flex min-w-14 shrink-0 flex-col items-center gap-0.5 rounded-md border px-2 py-2 text-sm transition-colors",
                active ? "border-primary bg-accent text-accent-foreground" : "hover:bg-muted",
                !free && !active && "text-muted-foreground"
              )}
            >
              <span className="text-xs">{WEEKDAY[dt.getDay()]}</span>
              <span className="font-medium tabular-nums">{formatShortDate(d)}</span>
            </button>
          )
        })}
      </div>
      {slots.length === 0 ? (
        <p className="text-sm text-muted-foreground">Chưa có khung giờ cho ngày này. Quý khách vui lòng chọn ngày khác.</p>
      ) : (
        <div role="radiogroup" aria-label="Chọn khung giờ" className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {slots.map((s) => {
            const selected = s.slot_id === value
            return (
              <button
                key={s.slot_id}
                type="button"
                role="radio"
                aria-checked={selected}
                disabled={!s.bookable}
                onClick={() => onChange(s)}
                className={cn(
                  "flex min-h-(--control-h) flex-col items-center justify-center rounded-md border px-2 py-1 text-sm tabular-nums transition-colors disabled:cursor-not-allowed disabled:opacity-45",
                  selected ? "border-primary bg-accent text-accent-foreground" : "hover:bg-muted"
                )}
              >
                <span className="font-medium">{formatRange(s.start_time, s.end_time)}</span>
                {!s.bookable && <span className="text-[11px] leading-tight text-muted-foreground">{slotClosedLabel(s.closed_reason)}</span>}
              </button>
            )
          })}
        </div>
      )}
      <p className="text-xs text-muted-foreground">Khung giờ mờ không nhận lịch, lý do ghi bên dưới giờ.</p>
    </div>
  )
}
