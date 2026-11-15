import { ArrowRight, CalendarCheck, ListChecks, Receipt } from "lucide-react"
import Link from "next/link"

import { Roundel } from "@/components/brand/illustrations"
import { BrandPhoto, Chequy, Eyebrow, ShieldFrame } from "@/components/brand/motifs"
import { Container } from "@/components/layout/container"
import { Section } from "@/components/layout/section"
import { Faq } from "@/components/landing/faq"
import { CtaLead, HeroPoints, PolicyFacts } from "@/components/landing/policy-sections"
import { ServicesPreview } from "@/components/landing/services-preview"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import { PHOTOS } from "@/lib/photos"

const STEPS = [
  { title: "Đặt lịch", body: "Chọn xe, dịch vụ và khung giờ còn chỗ. Lịch mới ở trạng thái Chờ xác nhận." },
  { title: "Xác nhận", body: "Nhân viên kiểm tra và xác nhận lịch, hoặc từ chối kèm lý do rõ ràng." },
  { title: "Tiếp nhận xe", body: "Xe đến đúng giờ hẹn, Trung tâm bắt đầu thực hiện. Trạng thái chuyển sang Đang thực hiện." },
  { title: "Hoàn thành", body: "Trung tâm báo hoàn thành. Quý khách xem lại lịch sử trạng thái bất cứ lúc nào." },
]

const PILLARS = [
  { icon: Receipt, title: "Minh bạch", body: "Giá tham khảo và thời lượng của từng dịch vụ hiển thị công khai trước khi Quý khách đặt lịch." },
  { icon: CalendarCheck, title: "Đúng hẹn", body: "Mỗi khung giờ có số xe tối đa. Quý khách giữ được chỗ, không phải xếp hàng chờ." },
  { icon: ListChecks, title: "Theo dõi từng bước", body: "Sáu trạng thái rõ ràng từ Chờ xác nhận đến Hoàn thành, kèm lịch sử thay đổi." },
]

const GALLERY = [
  { photo: PHOTOS.workshop, caption: "Xưởng", className: "col-span-2 row-span-2 min-h-72 md:min-h-96", position: "center" },
  { photo: PHOTOS.engine, caption: "Động cơ", className: "min-h-56", position: "center 40%" },
  { photo: PHOTOS.wheel, caption: "Nội thất", className: "min-h-56", position: "center 30%" },
  { photo: PHOTOS.headlightB, caption: "Đèn pha", className: "min-h-56", position: "center" },
  { photo: PHOTOS.headlightA, caption: "Ngoại thất", className: "min-h-56", position: "center" },
]

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative border-b">
        <Container className="grid items-center gap-12 py-12 md:py-16 lg:grid-cols-12 lg:gap-10 lg:py-24">
          <div className="flex flex-col items-start gap-6 lg:col-span-6">
            <Eyebrow>Bảo dưỡng và sửa chữa ô tô</Eyebrow>
            <h1 className="text-4xl leading-[1.08] text-balance sm:text-5xl xl:text-6xl">Bảo dưỡng xe đúng giờ, đúng cách.</h1>
            <p className="max-w-xl text-base text-muted-foreground sm:text-lg">
              Chọn dịch vụ, chọn khung giờ và giữ chỗ trực tuyến. Trung tâm xác nhận, Quý&nbsp;khách theo dõi từng bước.
            </p>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Button asChild size="lg"><Link href="/dat-lich">Đặt lịch</Link></Button>
              <Button asChild size="lg" variant="outline"><Link href="/dich-vu">Xem dịch vụ</Link></Button>
            </div>
            <HeroPoints />
          </div>

          <div className="relative mx-auto w-full max-w-md lg:col-span-6 lg:max-w-none">
            <ShieldFrame src={PHOTOS.hero.src} alt={PHOTOS.hero.alt} priority sizes="(min-width: 1024px) 560px, 90vw" position="68% 60%" className="mx-auto max-w-[26rem] lg:ml-auto lg:mr-0 lg:max-w-[28rem]" />
            <div className="absolute bottom-6 left-0 flex max-w-[16rem] flex-col gap-2 rounded-lg border bg-card p-3.5 shadow-none sm:left-4 lg:-left-2">
              <span className="text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">Ví dụ lịch hẹn</span>
              <span className="text-sm font-medium">Thay dầu động cơ · 09:00</span>
              <StatusBadge status="CONFIRMED" />
            </div>
          </div>
        </Container>
        <Chequy size={8} className="text-primary" />
      </section>

      {/* Quy định đặt lịch */}
      <section aria-label="Quy định đặt lịch" className="border-b bg-card">
        <PolicyFacts />
      </section>

      {/* Dịch vụ */}
      <Section
        id="dich-vu"
        eyebrow="Dịch vụ"
        title="Từ bảo dưỡng định kỳ đến sửa chữa động cơ"
        description="Thời lượng và giá tham khảo của từng dịch vụ hiển thị rõ ràng, để Quý khách chọn đúng thứ xe cần."
        actions={<Button asChild variant="outline"><Link href="/dich-vu">Tất cả dịch vụ <ArrowRight className="size-4" /></Link></Button>}
      >
        <ServicesPreview />
      </Section>

      {/* Quy trình */}
      <Section id="quy-trinh" tone="muted" eyebrow="Quy trình" title="Bốn bước từ đặt lịch đến nhận xe" description="Mỗi lịch hẹn đi qua các trạng thái cố định. Quý khách luôn biết xe đang ở bước nào.">
        <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-14">
          <figure className="lg:col-span-5">
            <BrandPhoto src={PHOTOS.gauges.src} alt={PHOTOS.gauges.alt} sizes="(min-width: 1024px) 460px, 100vw" className="aspect-[4/3] rounded-lg border" />
            <figcaption className="mt-2 text-xs text-muted-foreground">Ảnh: <a href={PHOTOS.gauges.creditUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">{PHOTOS.gauges.credit}</a> / Unsplash</figcaption>
          </figure>
          <ol className="flex flex-col lg:col-span-7">
            {STEPS.map((s, i) => (
              <li key={s.title} className="relative flex gap-5 pb-8 last:pb-0">
                {i < STEPS.length - 1 && <span aria-hidden className="absolute top-14 bottom-0 left-6 w-px bg-border" />}
                <Roundel className="shrink-0 bg-background text-primary">{i + 1}</Roundel>
                <div className="flex flex-col gap-1 pt-1.5">
                  <h3 className="text-lg">{s.title}</h3>
                  <p className="max-w-lg text-sm text-muted-foreground">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </Section>

      {/* Thư viện ảnh */}
      <Section id="chi-tiet" eyebrow="Chi tiết" title="Chăm từng chi tiết" description="Từ tiếng máy đến lớp sơn, mỗi chiếc xe được kiểm tra có hệ thống và ghi lại trên lịch hẹn.">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:grid-rows-2 md:gap-4">
          {GALLERY.map((g) => (
            <figure key={g.caption} className={`relative overflow-hidden rounded-lg border ${g.className}`}>
              <BrandPhoto src={g.photo.src} alt={g.photo.alt} sizes="(min-width: 768px) 25vw, 50vw" position={g.position} className="absolute inset-0" />
              <div aria-hidden className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent" />
              <figcaption className="absolute bottom-3 left-4 font-heading text-lg font-semibold text-white">{g.caption}</figcaption>
            </figure>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Ảnh: {Object.values(PHOTOS).filter((p) => p !== PHOTOS.hero && p !== PHOTOS.gauges).map((p, i) => (
            <span key={p.credit}>{i > 0 && ", "}<a href={p.creditUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">{p.credit}</a></span>
          ))} / Unsplash
        </p>
      </Section>

      {/* Cam kết */}
      <Section tone="muted" eyebrow="Cam kết" title="Rõ ràng ở từng bước">
        <ul className="grid gap-4 md:grid-cols-3">
          {PILLARS.map((p) => (
            <li key={p.title} className="stitch flex flex-col gap-4 rounded-lg border bg-card p-7">
              <span className="flex size-11 items-center justify-center rounded-md bg-accent text-accent-foreground"><p.icon className="size-5" /></span>
              <h3 className="text-xl">{p.title}</h3>
              <p className="text-sm text-muted-foreground">{p.body}</p>
            </li>
          ))}
        </ul>
      </Section>

      {/* Hỏi đáp */}
      <Section id="hoi-dap" eyebrow="Hỏi đáp" title="Câu hỏi thường gặp" description="Các quy định đặt lịch, đổi lịch và thanh toán, ngắn gọn.">
        <div className="mx-auto flex max-w-3xl flex-col gap-8">
          <Faq />
          <div className="flex justify-center"><Button asChild variant="outline"><Link href="/dat-lich">Đặt lịch ngay</Link></Button></div>
        </div>
      </Section>

      {/* Kêu gọi */}
      <Section tone="brand" className="py-14 md:py-20">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="flex flex-col items-center gap-3">
            <h2 className="text-3xl sm:text-4xl">Sẵn sàng cho lần bảo dưỡng tiếp theo?</h2>
            <CtaLead />
          </div>
          <Button asChild size="lg" className="bg-band-foreground text-band hover:bg-band-foreground/90"><Link href="/dat-lich">Đặt lịch</Link></Button>
        </div>
      </Section>
    </>
  )
}
