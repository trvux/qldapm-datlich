import { Eyebrow, StripeRule } from "@/components/brand/motifs"
import { protect } from "@/lib/text"
import { cn } from "@/lib/utils"

/**
 * Đầu trang dùng cho MỌI trang trong app.
 * Khu khách (size "lg"): eyebrow, tiêu đề, mô tả và nút hành động chính căn giữa, nút nằm dưới mô tả.
 * Khu admin (size "sm"): căn trái, nút hành động ở góc phải từ sm trở lên, xếp dưới và full-width trên mobile.
 * `align` ghi đè mặc định khi cần.
 */
export function PageHeader({
  eyebrow, title, description, actions, size = "lg", align, className,
}: {
  eyebrow?: string; title: React.ReactNode; description?: React.ReactNode; actions?: React.ReactNode
  size?: "lg" | "sm"; align?: "start" | "center"; className?: string
}) {
  const center = (align ?? (size === "lg" ? "center" : "start")) === "center"
  return (
    <header className={cn("flex flex-col gap-5", className)}>
      <div className={cn("flex flex-col gap-4", center ? "items-center gap-5 text-center" : "sm:flex-row sm:items-end sm:justify-between sm:gap-6")}>
        <div className={cn("flex min-w-0 max-w-2xl flex-col gap-2", center && "items-center")}>
          {eyebrow && <Eyebrow className={center ? "justify-center" : undefined}>{eyebrow}</Eyebrow>}
          <h1 className={size === "lg" ? "text-3xl sm:text-4xl" : "text-2xl"}>{protect(title)}</h1>
          {description && <p className="text-muted-foreground">{protect(description)}</p>}
        </div>
        {actions && <div className={cn("flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center [&>*]:w-full sm:[&>*]:w-auto", center && "justify-center")}>{actions}</div>}
      </div>
      <StripeRule className="text-border" />
    </header>
  )
}
