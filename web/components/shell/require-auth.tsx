"use client"

import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"

import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/lib/auth"

/** Trang cần đăng nhập: chưa có phiên thì chuyển tới /dang-nhap và quay lại sau. */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!loading && !user) router.replace(`/dang-nhap?next=${encodeURIComponent(pathname)}`)
  }, [loading, user, router, pathname])

  if (loading || !user) {
    return (
      <div className="flex flex-col gap-3" role="status" aria-label="Đang kiểm tra phiên đăng nhập">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }
  return <>{children}</>
}
