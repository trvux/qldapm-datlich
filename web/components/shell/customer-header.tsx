"use client"

import { Menu } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"

import { LogoCompact } from "@/components/brand/logo"
import { ThemeToggle } from "@/components/shell/theme-toggle"
import { UserMenu } from "@/components/shell/user-menu"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useAuth } from "@/lib/auth"
import { cn } from "@/lib/utils"

const NAV = [
  { href: "/dich-vu", label: "Dịch vụ" },
  { href: "/dat-lich", label: "Đặt lịch" },
  { href: "/lich-hen", label: "Lịch hẹn" },
  { href: "/xe", label: "Xe của tôi" },
]

function NavLinks({ onNavigate, className }: { onNavigate?: () => void; className?: string }) {
  const pathname = usePathname()
  return (
    <nav className={cn("flex", className)} aria-label="Điều hướng chính">
      {NAV.map((n) => {
        const active = pathname === n.href || pathname.startsWith(n.href + "/")
        return (
          <Link
            key={n.href}
            href={n.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
              active && "bg-accent text-accent-foreground"
            )}
          >
            {n.label}
          </Link>
        )
      })}
    </nav>
  )
}

export function CustomerHeader() {
  const { user, loading } = useAuth()
  const [open, setOpen] = useState(false)
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4 sm:px-6">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden" aria-label="Mở menu">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72">
            <SheetHeader>
              <SheetTitle><LogoCompact className="h-10 text-primary" /></SheetTitle>
            </SheetHeader>
            <NavLinks onNavigate={() => setOpen(false)} className="flex-col gap-1 px-4" />
          </SheetContent>
        </Sheet>
        <Link href="/" aria-label="Marque, trang chủ" className="mr-2 flex items-center text-primary">
          <LogoCompact className="h-10" />
        </Link>
        <NavLinks className="hidden items-center gap-1 md:flex" />
        <div className="ml-auto flex items-center gap-1">
          <ThemeToggle />
          {loading ? null : user ? (
            <UserMenu area="khach" />
          ) : (
            <Button asChild><Link href="/dang-nhap">Đăng nhập</Link></Button>
          )}
        </div>
      </div>
    </header>
  )
}
