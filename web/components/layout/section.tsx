import { Container } from "@/components/layout/container"
import { Eyebrow } from "@/components/brand/motifs"
import { cn } from "@/lib/utils"

/**
 * Một mục của trang landing. Nhịp dọc cố định (py-16, md:py-24); đầu mục luôn căn trái,
 * nút hành động (nếu có) nằm bên phải từ md trở lên.
 */
export function Section({
  id, eyebrow, title, description, actions, tone = "default", className, children,
}: {
  id?: string; eyebrow?: string; title?: React.ReactNode; description?: React.ReactNode; actions?: React.ReactNode
  tone?: "default" | "muted" | "brand"; className?: string; children: React.ReactNode
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
          <div className="mb-10 flex flex-col gap-5 md:mb-14 md:flex-row md:items-end md:justify-between">
            <div className="flex max-w-2xl flex-col gap-3">
              {eyebrow && <Eyebrow className={brand ? "text-band-foreground" : undefined}>{eyebrow}</Eyebrow>}
              {title && <h2 className="text-3xl sm:text-4xl">{title}</h2>}
              {description && <p className={cn("text-base sm:text-lg", brand ? "text-band-foreground/80" : "text-muted-foreground")}>{description}</p>}
            </div>
            {actions && <div className="flex shrink-0 flex-col gap-2 sm:flex-row [&>*]:w-full sm:[&>*]:w-auto">{actions}</div>}
          </div>
        )}
        {children}
      </Container>
    </section>
  )
}
