import { ArrowRight } from "lucide-react"
import Link from "next/link"

import { Roundel, VehicleSilhouette } from "@/components/brand/illustrations"
import { Chequy, PlateBadge } from "@/components/brand/motifs"
import type { Vehicle } from "@/lib/api"
import { formatDate } from "@/lib/format"
import { bodyOf } from "@/lib/vehicle-body"

const EYEBROW = "text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase"

export type VehicleStats = { visits: number; last?: string; next?: string }

/** Con vít ở góc như biển đồng bắt vào taplo (chỉ trang trí). */
function Screw({ className }: { className: string }) {
  return <span aria-hidden className={`absolute size-2.5 rounded-full border border-foreground/35 bg-muted after:absolute after:inset-x-0 after:top-1/2 after:h-px after:-rotate-45 after:bg-foreground/35 ${className}`} />
}

function Row({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-dashed py-2 last:border-b-0">
      <dt className={EYEBROW}>{k}</dt>
      <dd className="font-heading text-base font-semibold">{children}</dd>
    </div>
  )
}

/**
 * Hồ sơ xe: dải ô cờ, bốn con vít ở góc như biển đồng, huy hiệu số, silhouette theo kiểu thân xe, biển số khung kép,
 * bảng thông số kẻ nét, và dải số liệu thật (số lần bảo dưỡng, lịch tới hoặc gần nhất) trước nút đặt lịch.
 */
export function VehicleCard({ vehicle: v, index, stats }: { vehicle: Vehicle; index: number; stats: VehicleStats }) {
  const name = [v.brand, v.model].filter(Boolean).join(" ")
  return (
    <li className="group relative flex flex-col overflow-hidden rounded-lg border bg-card transition-colors hover:border-primary/60">
      <Chequy size={5} rows={1} className="text-primary" />
      <Screw className="top-4 left-2" />
      <Screw className="top-4 right-2" />
      <Screw className="bottom-[4.9rem] left-2" />
      <Screw className="right-2 bottom-[4.9rem]" />

      <div className="flex flex-1 flex-col gap-4 px-6 pt-5 pb-5">
        <div className="flex items-center justify-between">
          <p className={EYEBROW}>Hồ sơ xe</p>
          <Roundel className="size-9 text-primary [&>span]:text-xs">{String(index + 1).padStart(2, "0")}</Roundel>
        </div>

        <VehicleSilhouette body={bodyOf(v.brand, v.model)} className="text-primary" />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-heading text-2xl leading-tight">{name}</h3>
          <PlateBadge className="text-sm">{v.license_plate}</PlateBadge>
        </div>

        <dl className="flex flex-col">
          <Row k="Hãng">{v.brand}</Row>
          {v.model && <Row k="Dòng xe">{v.model}</Row>}
          <Row k="Năm sản xuất">{v.year ?? "Chưa ghi"}</Row>
        </dl>
      </div>

      <div className="flex items-center justify-between gap-3 border-t bg-muted/40 px-6 py-3 text-xs text-muted-foreground">
        <span className="">{stats.visits > 0 ? `Đã bảo dưỡng ${stats.visits} lần` : "Chưa bảo dưỡng tại Trung tâm"}</span>
        <span className="text-right">
          {stats.next ? `Lịch tới: ${formatDate(stats.next)}` : stats.last ? `Gần nhất: ${formatDate(stats.last)}` : ""}
        </span>
      </div>

      <Link
        href={`/dat-lich?vehicle=${v.vehicle_id}`}
        className="relative flex items-center justify-between overflow-hidden border-t px-6 py-3 text-sm font-medium text-primary transition-colors after:absolute after:inset-0 group-hover:bg-primary group-hover:text-primary-foreground"
      >
        <span aria-hidden className="hatch-drift pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <span className="relative">Đặt lịch cho xe này</span>
        <ArrowRight className="relative size-4 transition-transform group-hover:translate-x-1" />
      </Link>
    </li>
  )
}
