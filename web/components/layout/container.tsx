import { cn } from "@/lib/utils"

/** Khung chứa duy nhất cho header, nội dung và footer của khu khách: cùng bề rộng, cùng lề. */
export function Container({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8", className)} {...props} />
}
