import Link from "next/link"

import { LogoCompact } from "@/components/brand/logo"
import { Chequy } from "@/components/brand/motifs"
import { Container } from "@/components/layout/container"
import { POLICY } from "@/lib/policy"

const COLS = [
  { title: "Dịch vụ", links: [{ href: "/dich-vu", label: "Tất cả dịch vụ" }, { href: "/dat-lich", label: "Đặt lịch" }, { href: "/#hoi-dap", label: "Câu hỏi thường gặp" }] },
  { title: "Tài khoản", links: [{ href: "/dang-nhap", label: "Đăng nhập" }, { href: "/lich-hen", label: "Lịch hẹn" }, { href: "/xe", label: "Xe của tôi" }] },
]

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t">
      <Chequy size={6} rows={1} className="text-primary/70" />
      <Container className="grid gap-10 py-12 md:grid-cols-12">
        <div className="flex flex-col gap-4 md:col-span-5">
          <Link href="/" aria-label="Marque, trang chủ" className="text-primary"><LogoCompact className="h-10" /></Link>
          <p className="max-w-sm text-sm text-muted-foreground">Đặt lịch bảo dưỡng và sửa chữa ô tô trực tuyến. Xe đúng giờ, đúng cách.</p>
        </div>
        {COLS.map((c) => (
          <nav key={c.title} aria-label={c.title} className="flex flex-col gap-3 md:col-span-2">
            <h2 className="font-sans text-sm font-semibold tracking-normal">{c.title}</h2>
            <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
              {c.links.map((l) => <li key={l.href}><Link href={l.href} className="hover:text-foreground hover:underline">{l.label}</Link></li>)}
            </ul>
          </nav>
        ))}
        <div className="flex flex-col gap-3 md:col-span-3">
          <h2 className="font-sans text-sm font-semibold tracking-normal">Giờ làm việc</h2>
          <p className="text-sm text-muted-foreground">{POLICY.openDays}<br />{POLICY.hours}</p>
        </div>
      </Container>
      <div className="border-t">
        <Container className="flex flex-col gap-2 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Marque</p>
          <p>Ảnh minh họa: <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground">Unsplash</a></p>
        </Container>
      </div>
    </footer>
  )
}
