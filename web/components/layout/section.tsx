import { Container } from "@/components/layout/container"
import { Eyebrow } from "@/components/brand/motifs"
import { protect } from "@/lib/text"
import { cn } from "@/lib/utils"

/**
 * Một mục của trang landing. Nhịp dọc cố định (py-16, md:py-24); đầu mục (eyebrow, tiêu đề, mô tả) căn giữa theo mặc định,
 * nút hành động (nếu có) nằm dưới mô tả, cũng căn giữa. `align="start"` để căn trái và đặt nút bên phải từ md.
 */
export function Section({
  id, eyebrow, title, description, actions, tone = "default", align = "center", className, children,
}: {
  id?: string; eyebrow?: string; title?: React.ReactNode; description?: React.ReactNode; actions?: React.ReactNode
  tone?: "default" | "muted" | "brand"; align?: "start" | "center"; className?: string; children: React.ReactNode
}) {
  const brand = tone === "brand"
  return (
    <section
      id={id}
      className={cn(
        "py-16 md:py-24",
        tone === "muted" && "border-y bg-muted/50",
        brand && "bg-band text-band-foreground",
        className
      )}
    >
      <Container>
        {(title || eyebrow) && (
          <div className={cn("mb-10 flex flex-col gap-5 md:mb-14", align === "center" ? "items-center text-center" : "md:flex-row md:items-end md:justify-between")}>
            <div className={cn("flex max-w-2xl flex-col gap-3", align === "center" && "items-center")}>
              {eyebrow && <Eyebrow className={cn(brand && "text-band-foreground", align === "center" && "justify-center")}>{eyebrow}</Eyebrow>}
              {title && <h2 className="text-3xl sm:text-4xl">{protect(title)}</h2>}
              {description && <p className={cn("text-base sm:text-lg", brand ? "text-band-foreground/80" : "text-muted-foreground")}>{protect(description)}</p>}
            </div>
            {actions && <div className={cn("flex shrink-0 flex-col gap-2 sm:flex-row [&>*]:w-full sm:[&>*]:w-auto", align === "center" && "justify-center")}>{actions}</div>}
          </div>
        )}
        {children}
      </Container>
    </section>
  )
}
