import Image from "next/image"

import { cn } from "@/lib/utils"

/* Mô-típ thương hiệu lặp lại từ logo: dải ô cờ (chequy), sọc đôi, khung hình khiên, biển số, đường chỉ khâu. */

/** Dải ô cờ theo màu chữ hiện tại. `size` là cạnh một ô (px); mặc định 2 hàng. */
export function Chequy({ className, size = 8, rows = 2 }: { className?: string; size?: number; rows?: 1 | 2 }) {
  return (
    <span
      aria-hidden
      className={cn("block w-full", className)}
      style={{
        height: size * rows,
        backgroundImage: "conic-gradient(currentColor 25%, transparent 0 50%, currentColor 0 75%, transparent 0)",
        backgroundSize: `${size * 2}px ${size * 2}px`,
      }}
    />
  )
}

/** Sọc đôi (một dày, một mảnh) như sọc đua. Màu theo chữ hiện tại. */
export function StripeRule({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("flex w-full flex-col gap-[3px]", className)}>
      <span className="h-[3px] bg-current" />
      <span className="h-px bg-current" />
    </div>
  )
}

/** Nhãn nhỏ phía trên tiêu đề, mở đầu bằng ba ô cờ. */
export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("flex items-center gap-2.5 text-xs font-medium tracking-[0.18em] text-primary uppercase", className)}>
      <Chequy size={4} className="w-6 shrink-0" />
      {children}
    </p>
  )
}

/** Ảnh cắt theo hình khiên của logo, viền kép (hai lớp khiên lồng nhau). */
export function ShieldFrame({
  src, alt, className, priority, sizes = "(min-width: 1024px) 480px, 80vw", position = "center",
}: { src: string; alt: string; className?: string; priority?: boolean; sizes?: string; position?: string }) {
  return (
    <div className={cn("relative aspect-[41/50] w-full text-primary", className)}>
      <div className="shield-clip absolute inset-0 bg-current" />
      <div className="shield-clip absolute inset-[3px] bg-background" />
      <div className="shield-clip absolute inset-[7px] overflow-hidden bg-muted">
        <Image src={src} alt={alt} fill priority={priority} sizes={sizes} className="object-cover" style={{ objectPosition: position }} />
      </div>
    </div>
  )
}

/** Biển số xe: khung kép, chữ serif. */
export function PlateBadge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-md border-2 border-foreground/80 bg-card p-0.5 font-heading text-base font-semibold tracking-wider tabular-nums", className)}>
      <span className="rounded-[4px] border border-border px-2.5 py-0.5">{children}</span>
    </span>
  )
}

/** Định nghĩa clip-path hình khiên dùng cho ShieldFrame. Đặt một lần ở layout gốc. */
export function BrandDefs() {
  return (
    <svg width="0" height="0" aria-hidden focusable="false" className="pointer-events-none absolute">
      <defs>
        <clipPath id="marque-shield" clipPathUnits="objectBoundingBox">
          <path d="M0 0H1V0.52Q1 0.84 0.5 1Q0 0.84 0 0.52Z" />
        </clipPath>
      </defs>
    </svg>
  )
}

/** Ảnh phụ với lớp chỉnh màu thương hiệu (giảm bão hòa, phủ xanh đua nhẹ) để cả bộ ảnh cùng tông. */
export function BrandPhoto({
  src, alt, className, sizes, priority, position = "center",
}: { src: string; alt: string; className?: string; sizes?: string; priority?: boolean; position?: string }) {
  return (
    <div className={cn("relative overflow-hidden bg-muted", className)}>
      <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover saturate-[.82]" style={{ objectPosition: position }} />
      <div aria-hidden className="absolute inset-0 bg-brand-700 opacity-[.16] mix-blend-multiply" />
    </div>
  )
}
