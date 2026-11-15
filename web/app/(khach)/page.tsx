import { ArrowRight } from "lucide-react"
import Link from "next/link"

import { Roadster, Roundel } from "@/components/brand/illustrations"
import { Button } from "@/components/ui/button"

const STEPS = [
  { n: "1", title: "Chọn dịch vụ", body: "Bảo dưỡng định kỳ, thay dầu, kiểm tra phanh và các hạng mục khác." },
  { n: "2", title: "Chọn giờ", body: "Xem khung giờ còn chỗ trong 14 ngày tới và giữ chỗ cho xe." },
  { n: "3", title: "Xác nhận", body: "Trung tâm xác nhận lịch hẹn. Quý khách theo dõi trạng thái ngay trên trang." },
]

export default function HomePage() {
  return (
    <div className="flex flex-col gap-16 sm:gap-20">
      <section className="grid items-center gap-8 lg:grid-cols-[1fr_1.1fr] lg:gap-12">
        <div className="flex flex-col items-start gap-5">
          <h1 className="text-4xl leading-[1.1] sm:text-5xl">Bảo dưỡng xe, đặt lịch trong một phút.</h1>
          <p className="max-w-prose text-base text-muted-foreground sm:text-lg">
            Chọn dịch vụ, chọn giờ, Trung tâm giữ chỗ cho xe của Quý khách. Theo dõi trạng thái lịch hẹn mọi lúc.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg"><Link href="/dat-lich">Đặt lịch</Link></Button>
            <Button asChild size="lg" variant="outline"><Link href="/dich-vu">Xem dịch vụ</Link></Button>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4 text-primary sm:p-8" style={{ backgroundImage: "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)", backgroundSize: "24px 24px", backgroundBlendMode: "multiply" }}>
          <Roadster />
        </div>
      </section>

      <section aria-labelledby="steps-title" className="flex flex-col gap-6">
        <h2 id="steps-title" className="text-2xl">Ba bước đặt lịch</h2>
        <ol className="grid gap-4 md:grid-cols-3">
          {STEPS.map((s) => (
            <li key={s.n} className="flex gap-4 rounded-lg border bg-card p-(--card-pad) sm:p-5">
              <Roundel className="shrink-0 text-primary">{s.n}</Roundel>
              <div className="flex flex-col gap-1">
                <h3 className="text-base">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
        <Button asChild variant="link" className="self-start px-0">
          <Link href="/dich-vu">Xem các dịch vụ <ArrowRight className="size-4" /></Link>
        </Button>
      </section>
    </div>
  )
}
