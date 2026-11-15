"use client"

import { CalendarDays, ChartColumn, Clock, LayoutDashboard, Wrench } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"

import { LogoCompact, LogoMark } from "@/components/brand/logo"
import { ThemeToggle } from "@/components/shell/theme-toggle"
import { UserMenu } from "@/components/shell/user-menu"
import { Separator } from "@/components/ui/separator"
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarRail, SidebarTrigger } from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import { isStaffRole, useAuth } from "@/lib/auth"

const MAIN = [
  { href: "/admin", label: "Tổng quan", icon: LayoutDashboard, exact: true },
  { href: "/admin/lich-hen", label: "Lịch hẹn", icon: CalendarDays },
]
const MANAGER = [
  { href: "/admin/dich-vu", label: "Dịch vụ", icon: Wrench },
  { href: "/admin/khung-gio", label: "Khung giờ", icon: Clock },
  { href: "/admin/bao-cao", label: "Báo cáo", icon: ChartColumn },
]

function NavGroup({ label, items }: { label: string; items: typeof MAIN }) {
  const pathname = usePathname()
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((it) => {
            const active = "exact" in it && it.exact ? pathname === it.href : pathname.startsWith(it.href)
            return (
              <SidebarMenuItem key={it.href}>
                <SidebarMenuButton asChild isActive={active} tooltip={it.label}>
                  <Link href={it.href}><it.icon />{it.label}</Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const allowed = !!user && isStaffRole(user.role)

  useEffect(() => {
    if (!loading && !allowed) router.replace(`/dang-nhap?next=${encodeURIComponent(pathname)}`)
  }, [loading, allowed, router, pathname])

  if (loading || !allowed) {
    return (
      <div className="density-compact flex min-h-svh items-center justify-center p-6">
        <div className="flex w-full max-w-sm flex-col gap-3" role="status" aria-label="Đang kiểm tra phiên đăng nhập">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="density-compact">
      <SidebarProvider>
        <Sidebar collapsible="icon">
          <SidebarHeader className="h-14 justify-center border-b">
            <Link href="/admin" aria-label="Marque, tổng quan" className="flex items-center text-sidebar-primary">
              <LogoCompact className="h-9 group-data-[collapsible=icon]:hidden" />
              <LogoMark compact className="hidden size-7 group-data-[collapsible=icon]:block" />
            </Link>
          </SidebarHeader>
          <SidebarContent>
            <NavGroup label="Vận hành" items={MAIN} />
            {user.role === "MANAGER" && <NavGroup label="Quản lý" items={MANAGER} />}
          </SidebarContent>
          <SidebarRail />
        </Sidebar>
        <SidebarInset className="min-w-0">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/95 px-3 backdrop-blur sm:px-4">
            <SidebarTrigger aria-label="Mở hoặc đóng thanh bên" />
            <Separator orientation="vertical" className="data-vertical:h-5 data-vertical:self-center" />
            <span className="truncate text-sm text-muted-foreground">Khu nhân viên</span>
            <div className="ml-auto flex items-center gap-1">
              <ThemeToggle />
              <UserMenu area="admin" />
            </div>
          </header>
          <div className="flex-1 p-4 sm:p-6 lg:p-8">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}

/** Trang chỉ dành cho Quản lý (dịch vụ, khung giờ, báo cáo). Nhân viên thấy thông báo thay vì dữ liệu. */
export function RequireManager({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  if (user?.role !== "MANAGER") {
    return <p className="rounded-md border p-4 text-sm text-muted-foreground">Trang này chỉ dành cho Quản lý.</p>
  }
  return <>{children}</>
}
