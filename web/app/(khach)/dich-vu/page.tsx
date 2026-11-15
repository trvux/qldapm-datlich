"use client"

import { Clock } from "lucide-react"
import Link from "next/link"

import { ErrorNote } from "@/components/error-note"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/lib/api"
import { formatVND } from "@/lib/format"
import { useApi } from "@/lib/use-api"

export default function ServicesPage() {
  const { data, error, loading } = useApi(() => api.services(), [])
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl">Dịch vụ</h1>
        <p className="text-muted-foreground">Giá chỉ để tham khảo, chưa bao gồm phụ tùng phát sinh. Thanh toán tại Trung tâm.</p>
      </div>
      <ErrorNote error={error} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading
          ? Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-44" />)
          : (data ?? []).map((s) => (
              <Card key={s.service_id}>
                <CardHeader>
                  <CardTitle className="text-lg">{s.name}</CardTitle>
                  <CardDescription>{s.description || "Dịch vụ tại Trung tâm."}</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between text-sm">
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground"><Clock className="size-4" />{s.duration_minutes} phút</span>
                  <span className="font-medium tabular-nums">{formatVND(s.reference_price)}</span>
                </CardContent>
                <CardFooter>
                  <Button asChild variant="outline" className="w-full"><Link href={`/dat-lich?service=${s.service_id}`}>Đặt lịch</Link></Button>
                </CardFooter>
              </Card>
            ))}
      </div>
    </div>
  )
}
