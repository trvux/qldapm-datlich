"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useState } from "react"
import { toast } from "sonner"

import { LogoCompact } from "@/components/brand/logo"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { ApiError, errorText } from "@/lib/api"
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
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-xl">Đăng nhập</CardTitle>
        <CardDescription>Dùng tài khoản của Trung tâm Dịch vụ Ô tô XYZ.</CardDescription>
      </CardHeader>
      <CardContent>
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
          <Button type="submit" disabled={busy || !email || !password}>
            {busy && <Spinner />}Đăng nhập
          </Button>
        </form>
        <div className="mt-6 border-t pt-4">
          <p className="mb-2 text-xs text-muted-foreground">Tài khoản demo (điền nhanh)</p>
          <div className="flex flex-wrap gap-2">
            {DEMO.map((d) => (
              <Button key={d.label} type="button" variant="outline" size="sm" onClick={() => { setEmail(d.email); setPassword(d.password) }}>
                {d.label}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function LoginPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 px-4 py-10">
      <Link href="/" aria-label="Marque, trang chủ" className="text-primary"><LogoCompact className="h-12" /></Link>
      <Suspense><LoginForm /></Suspense>
    </div>
  )
}
