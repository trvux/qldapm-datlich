import { Container } from "@/components/layout/container"
import { cn } from "@/lib/utils"

/** Thân trang cho mọi trang app của khu khách: cùng khung chứa, cùng nhịp dọc. */
export function AppPage({ className, ...props }: React.ComponentProps<"div">) {
  return <Container className={cn("flex flex-col gap-8 py-8 md:gap-10 md:py-12", className)} {...props} />
}
