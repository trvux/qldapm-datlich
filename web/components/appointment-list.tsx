import Link from "next/link"

import { StatusBadge } from "@/components/status-badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { Appointment } from "@/lib/api"
import { formatDate, formatRange } from "@/lib/format"

/** Mobile: thẻ xếp dọc. Từ md trở lên: bảng. Cùng một dữ liệu, hai cách trình bày. */
export function AppointmentList({ items }: { items: Appointment[] }) {
  return (
    <>
      <ul className="flex flex-col gap-3 md:hidden">
        {items.map((a) => (
          <li key={a.appointment_id}>
            <Link href={`/lich-hen/${a.appointment_id}`} className="flex flex-col gap-2 rounded-lg border bg-card p-4 transition-colors hover:bg-muted">
              <div className="flex items-start justify-between gap-3">
                <span className="font-medium">{a.service.name}</span>
                <StatusBadge status={a.status} />
              </div>
              <p className="text-sm text-muted-foreground tabular-nums">{formatDate(a.slot.slot_date)} · {formatRange(a.slot.start_time, a.slot.end_time)}</p>
              <p className="text-sm text-muted-foreground tabular-nums">{a.vehicle.license_plate} · Mã #{a.appointment_id}</p>
            </Link>
          </li>
        ))}
      </ul>
      <div className="hidden rounded-lg border bg-card md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">Mã</TableHead>
              <TableHead>Dịch vụ</TableHead>
              <TableHead>Xe</TableHead>
              <TableHead>Thời gian</TableHead>
              <TableHead>Trạng thái</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((a) => (
              <TableRow key={a.appointment_id} className="cursor-pointer">
                <TableCell className="tabular-nums"><Link href={`/lich-hen/${a.appointment_id}`} className="font-medium text-primary underline-offset-4 hover:underline">#{a.appointment_id}</Link></TableCell>
                <TableCell>{a.service.name}</TableCell>
                <TableCell className="tabular-nums">{a.vehicle.license_plate}</TableCell>
                <TableCell className="tabular-nums">{formatDate(a.slot.slot_date)} · {formatRange(a.slot.start_time, a.slot.end_time)}</TableCell>
                <TableCell><StatusBadge status={a.status} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  )
}
