import { Eyebrow, StripeRule } from "@/components/brand/motifs"
import { cn } from "@/lib/utils"

/**
 * Đầu trang dùng cho MỌI trang trong app (khách và admin).
 * Quy tắc: tiêu đề và mô tả căn trái; nút hành động chính nằm góc phải từ sm trở lên, xếp dưới và full-width trên mobile.
 */
export function PageHeader({
  eyebrow, title, description, actions, size = "lg", className,
}: { eyebrow?: string; title: React.ReactNode; description?: React.ReactNode; actions?: React.ReactNode; size?: "lg" | "sm"; className?: string }) {
  return (
    <header className={cn("flex flex-col gap-5", className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
        <div className="flex min-w-0 max-w-2xl flex-col gap-2">
          {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
          <h1 className={size === "lg" ? "text-3xl sm:text-4xl" : "text-2xl"}>{title}</h1>
          {description && <p className="text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center [&>*]:w-full sm:[&>*]:w-auto">{actions}</div>}
      </div>
      <StripeRule className="text-border" />
    </header>
  )
}
