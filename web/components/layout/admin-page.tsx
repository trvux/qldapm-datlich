import { cn } from "@/lib/utils"

/** Thân trang cho mọi trang admin: một bề rộng, một nhịp dọc. Tiêu đề dùng PageHeader size="sm". */
export function AdminPage({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("mx-auto flex w-full max-w-7xl flex-col gap-6", className)} {...props} />
}
