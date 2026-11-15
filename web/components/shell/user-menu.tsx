"use client"

import { LogOut, UserRound } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { isStaffRole, useAuth } from "@/lib/auth"

const ROLE_LABEL = { CUSTOMER: "Khách hàng", STAFF: "Nhân viên", MANAGER: "Quản lý" } as const

export function UserMenu({ area }: { area: "khach" | "admin" }) {
  const { user, logout } = useAuth()
  const router = useRouter()
  if (!user) return null
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="max-w-56 gap-2 px-2.5" aria-label={`Tài khoản ${user.full_name}`}>
          <UserRound className="size-4 shrink-0" />
          <span className="hidden truncate sm:inline">{user.full_name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5 font-normal">
          <span className="truncate font-medium">{user.full_name}</span>
          <span className="truncate text-xs text-muted-foreground">{user.email} · {ROLE_LABEL[user.role]}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isStaffRole(user.role) && (
          <DropdownMenuItem asChild>
            <Link href={area === "admin" ? "/" : "/admin"}>{area === "admin" ? "Trang khách hàng" : "Khu nhân viên"}</Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onSelect={() => { logout(); router.push("/") }}>
          <LogOut className="size-4" />Đăng xuất
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
