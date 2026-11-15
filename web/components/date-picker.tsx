"use client"

import { CalendarIcon } from "lucide-react"
import { useState } from "react"
import { vi } from "react-day-picker/locale"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { formatDate, toISODate } from "@/lib/format"
import { cn } from "@/lib/utils"

const parse = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number)
  return new Date(y, m - 1, d)
}

/**
 * Chọn ngày bằng Calendar của shadcn (thay <input type="date"> của trình duyệt).
 * `value` và `onChange` dạng YYYY-MM-DD; `value` rỗng là chưa chọn. `min`/`max` cũng dạng YYYY-MM-DD.
 */
export function DatePicker({
  value,
  onChange,
  min,
  max,
  placeholder = "Chọn ngày",
  className,
  ...props
}: {
  value: string
  onChange: (iso: string) => void
  min?: string
  max?: string
  placeholder?: string
  className?: string
  id?: string
  "aria-label"?: string
}) {
  const [open, setOpen] = useState(false)
  const selected = value ? parse(value) : undefined
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn("justify-start font-normal tabular-nums", !value && "text-muted-foreground", className)}
          {...props}
        >
          <CalendarIcon aria-hidden data-icon="inline-start" />
          {value ? formatDate(value) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          locale={vi}
          weekStartsOn={1}
          selected={selected}
          defaultMonth={selected}
          disabled={[...(min ? [{ before: parse(min) }] : []), ...(max ? [{ after: parse(max) }] : [])]}
          onSelect={(d) => {
            if (!d) return
            onChange(toISODate(d))
            setOpen(false)
          }}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  )
}
