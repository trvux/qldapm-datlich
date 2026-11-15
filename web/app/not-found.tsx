import Link from "next/link"

import { Roundel } from "@/components/brand/illustrations"
import { Container } from "@/components/layout/container"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <main className="flex min-h-svh items-center">
      <Container className="flex flex-col items-start gap-6 py-16 text-primary">
        <Roundel className="size-20 text-2xl">404</Roundel>
        <div className="flex flex-col gap-2 text-foreground">
          <h1 className="text-3xl sm:text-4xl">Không tìm thấy trang</h1>
          <p className="max-w-md text-muted-foreground">Đường dẫn có thể đã đổi hoặc không còn tồn tại. Quý khách quay lại trang chủ hoặc đặt lịch mới.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg"><Link href="/">Về trang chủ</Link></Button>
          <Button asChild size="lg" variant="outline"><Link href="/dat-lich">Đặt lịch</Link></Button>
        </div>
      </Container>
    </main>
  )
}
