import { CustomerHeader } from "@/components/shell/customer-header"
import { LogoCompact } from "@/components/brand/logo"

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col">
      <CustomerHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">{children}</main>
      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <LogoCompact className="h-9 text-primary" />
          <p>Trung tâm Dịch vụ Ô tô XYZ · Đồ án môn Quản lý dự án phần mềm</p>
        </div>
      </footer>
    </div>
  )
}
