import { cn } from "@/lib/utils"

/* Minh họa kiểu bản vẽ kỹ thuật nét đơn sắc (màu theo currentColor), cùng ngôn ngữ với logo. */

const WIRE = (
  <g>
    <circle r="22" />
    <circle r="17" opacity=".6" />
    <circle r="4" />
    <g strokeWidth="1">
      {[0, 30, 60, 90, 120, 150].map((a) => (
        <path key={a} d="M0 -17 L0 17" transform={`rotate(${a})`} />
      ))}
    </g>
  </g>
)

/** Xe thể thao cổ (roadster) nhìn nghiêng. Dáng chung, không nhái mẫu xe hay hãng nào. */
export function Roadster({ className, dashed }: { className?: string; dashed?: boolean }) {
  return (
    <svg
      viewBox="0 0 400 150"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
      strokeLinecap="round"
      strokeDasharray={dashed ? "6 6" : undefined}
      aria-hidden="true"
      className={cn("w-full", className)}
    >
      <path d="M30 112 L30 98 Q30 88 48 86 L170 72 L196 52 L204 52 L214 74 L290 74 Q312 72 330 82 L366 94 Q376 98 376 108 L376 112 L333 112 A28 28 0 0 0 277 112 L123 112 A28 28 0 0 0 67 112 Z" />
      <path d="M196 52 L186 74" />
      <path d="M214 74 L222 90 L262 90 L290 74" opacity=".7" />
      <circle cx="54" cy="94" r="6" />
      <path d="M30 104 L44 104" opacity=".7" />
      <g transform="translate(95 112)">{WIRE}</g>
      <g transform="translate(305 112)">{WIRE}</g>
    </svg>
  )
}

/** Huy hiệu tròn viền kép có số, dùng cho các bước hoặc điểm nhấn. */
export function Roundel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("relative inline-flex size-12 items-center justify-center", className)}>
      <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" className="absolute inset-0 size-full" aria-hidden="true">
        <circle cx="50" cy="50" r="47" strokeWidth="3" />
        <circle cx="50" cy="50" r="41" strokeWidth="1.5" />
      </svg>
      <span className="font-heading text-lg font-semibold">{children}</span>
    </span>
  )
}
