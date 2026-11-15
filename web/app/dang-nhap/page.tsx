"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useState } from "react"
import { toast } from "sonner"

import Image from "next/image"

import { LogoCompact } from "@/components/brand/logo"
import { Chequy } from "@/components/brand/motifs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { ApiError, errorText } from "@/lib/api"
import { PHOTOS } from "@/lib/photos"
import { isStaffRole, useAuth } from "@/lib/auth"

const DEMO = [
  { label: "Khách", email: "khach1@example.com", password: "Customer@123" },
  { label: "Nhân viên", email: "staff1@xyz.vn", password: "Staff@1234" },
  { label: "Quản lý", email: "manager@xyz.vn", password: "Manager@123" },
]

function LoginForm() {
  const { login } = useAuth()
  const router = useRouter()
  const next = useSearchParams().get("next")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const u = await login(email.trim(), password)
      toast.success(`Xin chào ${u.full_name}.`)
      router.replace(next && next.startsWith("/") ? next : isStaffRole(u.role) ? "/admin" : "/lich-hen")
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 401
          ? "Email hoặc mật khẩu chưa đúng. Quý khách vui lòng kiểm tra lại."
          : err instanceof ApiError && err.status === 403
            ? "Tài khoản đang bị khóa. Quý khách vui lòng liên hệ Trung tâm."
            : errorText(err)
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl">Đăng nhập</h1>
        <p className="text-muted-foreground">Dùng tài khoản của Marque để đặt lịch và theo dõi lịch hẹn.</p>
      </div>
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!error} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Mật khẩu</Label>
          <Input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} aria-invalid={!!error} />
        </div>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <Button type="submit" size="lg" disabled={busy || !email || !password}>
          {busy && <Spinner />}Đăng nhập
        </Button>
      </form>
      <div className="flex flex-col gap-2 border-t pt-5">
        <p className="text-xs text-muted-foreground">Tài khoản demo (điền nhanh)</p>
        <div className="flex flex-wrap gap-2">
          {DEMO.map((d) => (
            <Button key={d.label} type="button" variant="outline" size="sm" onClick={() => { setEmail(d.email); setPassword(d.password) }}>
              {d.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-band p-10 text-band-foreground lg:flex">
        <Image src={PHOTOS.hero.src} alt={PHOTOS.hero.alt} fill priority sizes="50vw" className="object-cover opacity-45 mix-blend-luminosity" style={{ objectPosition: "70% 60%" }} />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-band/85 via-band/40 to-band/90" />
        <Link href="/" aria-label="Marque, trang chủ" className="relative"><LogoCompact className="h-12 text-band-foreground" /></Link>
        <div className="relative flex max-w-md flex-col gap-3">
          <p className="font-heading text-3xl leading-snug font-semibold text-balance">Bảo dưỡng xe<br /><span className="inline-block">đúng giờ,</span> <span className="inline-block">đúng cách.</span></p>
          <p className="text-sm text-band-foreground/80">Đặt lịch, đổi lịch và theo dõi trạng thái ngay trên trang.</p>
        </div>
        <Chequy size={8} className="absolute inset-x-0 bottom-0 text-band-foreground/90" />
      </aside>
      <main className="flex flex-col px-6 py-8 sm:px-10">
        <Link href="/" aria-label="Marque, trang chủ" className="text-primary lg:hidden"><LogoCompact className="h-10" /></Link>
        <div className="flex flex-1 items-center justify-center py-10"><Suspense><LoginForm /></Suspense></div>
      </main>
    </div>
  )
}
