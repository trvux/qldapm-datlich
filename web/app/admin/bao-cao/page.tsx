"use client"

import { useState } from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { ErrorNote } from "@/components/error-note"
import { RequireManager } from "@/components/shell/admin-shell"
import { StatusBadge } from "@/components/status-badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/lib/api"
import { addDays, formatShortDate, todayISO } from "@/lib/format"
import { useApi } from "@/lib/use-api"

const chartConfig = { count: { label: "Số lịch hẹn", color: "var(--chart-1)" } } satisfies ChartConfig

function Report() {
  const [from, setFrom] = useState(addDays(todayISO(), -13))
  const [to, setTo] = useState(addDays(todayISO(), 7))
  const { data, error, loading } = useApi(() => api.report(from, to), [from, to])
  const maxService = Math.max(1, ...(data?.by_service ?? []).map((s) => s.count))

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1"><h1 className="text-2xl">Báo cáo</h1><p className="text-sm text-muted-foreground">Thống kê lịch hẹn theo ngày, trạng thái và dịch vụ.</p></div>
      <div className="grid grid-cols-2 gap-3 sm:flex sm:items-end">
        <div className="flex flex-col gap-1.5"><Label htmlFor="r-from" className="text-xs text-muted-foreground">Từ ngày</Label><Input id="r-from" type="date" value={from} max={to} onChange={(e) => e.target.value && setFrom(e.target.value)} /></div>
        <div className="flex flex-col gap-1.5"><Label htmlFor="r-to" className="text-xs text-muted-foreground">Đến ngày</Label><Input id="r-to" type="date" value={to} min={from} onChange={(e) => e.target.value && setTo(e.target.value)} /></div>
      </div>
      <ErrorNote error={error} who="staff" />
      {loading || !data ? <div className="grid gap-3 lg:grid-cols-3"><Skeleton className="h-64 lg:col-span-2" /><Skeleton className="h-64" /></div> : (
        <div className="grid gap-3 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle className="text-base">Lịch hẹn theo ngày</CardTitle><CardDescription className="tabular-nums">Tổng {data.total} lịch</CardDescription></CardHeader>
            <CardContent>
              {data.by_date.length === 0 ? <p className="text-sm text-muted-foreground">Không có dữ liệu trong khoảng này.</p> : (
                <ChartContainer config={chartConfig} className="h-56 w-full">
                  <BarChart data={data.by_date.map((d) => ({ ...d, label: formatShortDate(d.date) }))} margin={{ left: -16, right: 4 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} interval="preserveStartEnd" />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent hideLabel={false} />} />
                    <Bar dataKey="count" fill="var(--color-count)" radius={3} />
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
          <div className="flex flex-col gap-3">
            <Card size="sm">
              <CardHeader><CardTitle className="text-base">Theo trạng thái</CardTitle></CardHeader>
              <CardContent><ul className="flex flex-col gap-2">{data.by_status.map((s) => <li key={s.status} className="flex items-center justify-between"><StatusBadge status={s.status} /><span className="font-medium tabular-nums">{s.count}</span></li>)}</ul></CardContent>
            </Card>
            <Card size="sm">
              <CardHeader><CardTitle className="text-base">Theo dịch vụ</CardTitle></CardHeader>
              <CardContent>
                <ul className="flex flex-col gap-3">
                  {data.by_service.map((s) => (
                    <li key={s.service_id} className="flex flex-col gap-1">
                      <div className="flex items-baseline justify-between gap-2 text-sm"><span className="truncate">{s.name}</span><span className="font-medium tabular-nums">{s.count}</span></div>
                      <div className="h-1.5 rounded-sm bg-secondary"><div className="h-full rounded-sm bg-primary" style={{ width: `${(s.count / maxService) * 100}%` }} /></div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminReportPage() { return <RequireManager><Report /></RequireManager> }
