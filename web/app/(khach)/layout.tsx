import { CustomerHeader } from "@/components/shell/customer-header"
import { SiteFooter } from "@/components/shell/site-footer"

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col">
      <CustomerHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  )
}
