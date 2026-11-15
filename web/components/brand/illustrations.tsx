import type { BodyType } from "@/lib/vehicle-body"
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

/*
 * Silhouette thân xe kiểu đặc (huy hiệu men): thân tô màu hiện tại (xanh đua), kính và đường chia cửa cắt bằng màu nền thẻ,
 * bánh có vòng hở quanh vành, mặt đường là dải ô cờ có phối cảnh bên dưới.
 * Tỷ lệ dài/cao, vị trí bánh và đường nóc của các dáng xe con (micro, sedan, hatchback, wagon, coupe, supercar, roadster,
 * cabriolet, crossover, SUV, MPV) được sinh từ số đo trên ảnh tham khảo 16 loại xe (11 điểm lấy mẫu mỗi dáng, làm mượt
 * bằng đường cong Catmull-Rom); chỉ dùng số đo, không chép nét vẽ. Bốn dáng còn lại (bán tải, xe tải nhẹ, van, campervan)
 * vẽ tay rồi chỉnh chiều cao cho đúng tỷ lệ đo được. Dáng chung, không nhái mẫu xe hay hãng nào.
 */
/* Tạo khối bằng đậm nhạt của chính thang xanh đua (brand-50 đến brand-950 trong globals.css), không dùng màu ngoài thương hiệu. */
const B = (n: number) => `var(--brand-${n})`
const W = { fill: "url(#marque-glass)", stroke: B(900), strokeWidth: 1.2, strokeOpacity: 0.7, strokeLinejoin: "round" } as const
const L = { stroke: B(950), strokeOpacity: 0.55, fill: "none", strokeWidth: 1.8, strokeLinecap: "round" } as const
const ARCHES = "L325 112 A30 30 0 0 0 265 112 L135 112 A30 30 0 0 0 75 112 Z"

const SPECS: Partial<Record<BodyType, { d: string; wins: string[]; lines: string[]; shine: string[]; inter: string[]; wheels: [number, number]; r: number; yc: number }>> = {
  micro: { d: "M95.6 108.5 L95.6 78.8 Q95.6 73.3 100.2 70.3 L101.5 69.4 Q106.1 66.4 108.8 61.6 L126.3 30.7 Q129 26 134.5 26 L215.4 26 Q220.9 26 225.1 29.4 L268.8 65.2 Q273.1 68.7 278.4 69.9 L292.8 73.2 Q298.1 74.5 300.7 79.3 L301.8 81.2 Q304.4 86 304.4 91.5 L304.4 108.5 L294 108.5 A33.5 33.5 0 0 0 227.1 108.5 L172.9 108.5 A33.5 33.5 0 0 0 106 108.5Z", wins: ["M124.9 59.5 L135.3 30.6 L174 30.6 L188 60.5Z", "M191.3 60.6 L176 30.6 L219.8 30.6 L262.6 61.8Z"], lines: ["M189.6 61.5 L189.6 100.5"], shine: ["M116.9 61.5 L270.6 63.8"], inter: [], wheels: [139.5, 260.5], r: 29.5, yc: 108.5 },
  sedan: { d: "M43 113 L43 84.7 Q43 79.2 47.7 76.3 L47.8 76.2 Q52.4 73.3 57.9 73.3 L106.6 73.3 Q112.1 73.3 116.9 70.7 L163.8 45.5 Q168.6 42.9 174.1 42.9 L232.2 42.9 Q237.7 42.9 242.6 45.3 L292.4 69 Q297.3 71.4 302.8 71.8 L339 74.8 Q344.4 75.3 348.2 79.3 L353.3 84.9 Q357 89 357 94.5 L357 113 L329.5 113 A29 29 0 0 0 271.5 113 L125.4 113 A29 29 0 0 0 67.4 113Z", wins: ["M124.6 70.4 L170.2 45.9 L202.3 45.9 L203.6 70.4Z", "M207.4 70.4 L203.9 45.9 L236.1 45.9 L286.4 70.4Z"], lines: ["M205.5 71.4 L205.5 105"], shine: ["M116.6 72.4 L294.4 72.4"], inter: [], wheels: [96.4, 300.5], r: 25.0, yc: 113.0 },
  hatchback: { d: "M54.4 112.6 L54.4 85.6 Q54.4 80.1 59.3 77.6 L61.2 76.7 Q66.1 74.2 70.1 70.4 L97 45 Q101 41.2 106.5 41.2 L223.6 41.2 Q229.1 41.2 234 43.7 L282.4 67.7 Q287.4 70.2 292.8 70.9 L328.5 75.5 Q333.9 76.2 337.8 80.1 L341.8 84.2 Q345.6 88.1 345.6 93.6 L345.6 112.6 L322.6 112.6 A29.4 29.4 0 0 0 263.7 112.6 L136.3 112.6 A29.4 29.4 0 0 0 77.4 112.6Z", wins: ["M87.9 69.2 L108.3 44.2 L159.4 44.2 L169.5 69.2Z", "M174.1 69.2 L162.2 44.2 L227.7 44.2 L278.6 69.2Z"], lines: ["M171.8 70.2 L171.8 104.6"], shine: ["M79.9 71.2 L286.6 71.2"], inter: [], wheels: [106.8, 293.2], r: 25.4, yc: 112.6 },
  wagon: { d: "M43 111.2 L43 80.5 Q43 75 46.1 71.8 L46.1 71.8 Q49.3 68.7 50.7 63.4 L55.8 43.6 Q57.1 38.2 62.6 38.2 L244.7 38.2 Q250.2 38.2 255.1 40.8 L298.8 64 Q303.6 66.6 309.1 67.4 L342.1 72.1 Q347.6 72.9 350.9 77.3 L353.7 81.1 Q357 85.5 357 91 L357 111.2 L331.3 111.2 A30.8 30.8 0 0 0 269.7 111.2 L127.2 111.2 A30.8 30.8 0 0 0 65.6 111.2Z", wins: ["M66.5 64.5 L69.7 41.4 L139.1 41.4 L154.3 64.5Z", "M159.7 64.5 L143.4 41.4 L248.7 41.4 L292.6 64.5Z"], lines: ["M157 65.5 L157 103.2"], shine: ["M58.5 66.5 L300.6 66.5"], inter: [], wheels: [96.4, 300.5], r: 26.8, yc: 111.2 },
  coupe: { d: "M43.9 112.1 L43.9 84.6 Q43.9 79.1 48.5 76.1 L48.6 76 Q53.2 73 58.7 73 L107.1 73 Q112.6 73 117.6 70.9 L170 48.8 Q175 46.6 180.5 46.6 L225.7 46.6 Q231.2 46.6 236.3 48.6 L288.5 69 Q293.7 71 299.2 71.5 L338.2 74.6 Q343.6 75.1 347.3 79.2 L352.5 85.1 Q356.1 89.3 356.1 94.8 L356.1 112.1 L329.8 112.1 A29.9 29.9 0 0 0 270 112.1 L126.8 112.1 A29.9 29.9 0 0 0 67.1 112.1Z", wins: ["M131.3 70 L178.1 50.7 L229.7 50.7 L281.2 70Z"], lines: [], shine: [], inter: [], wheels: [97.0, 299.9], r: 25.9, yc: 112.1 },
  crossover: { d: "M54.4 111.2 L54.4 78.4 Q54.4 72.9 58.8 69.8 L58.8 69.8 Q63.1 66.6 68.3 64.7 L69.6 64.3 Q74.8 62.4 78.9 58.7 L99.8 39.8 Q103.9 36.2 109.4 36.2 L229.4 36.2 Q234.9 36.2 239.8 38.8 L282.5 61.9 Q287.4 64.5 292.8 65 L328.5 68.2 Q333.9 68.7 337.4 73 L342.2 79.1 Q345.6 83.4 345.6 88.9 L345.6 111.2 L326.9 111.2 A30.8 30.8 0 0 0 265.3 111.2 L134.7 111.2 A30.8 30.8 0 0 0 73.1 111.2Z", wins: ["M95.2 60.3 L109.7 40.3 L164.5 40.3 L176.7 60.3Z", "M181.1 60.3 L167.5 40.3 L232 40.3 L277.2 60.3Z"], lines: ["M178.9 61.3 L178.9 103.2"], shine: ["M87.2 62.3 L285.2 62.3"], inter: [], wheels: [103.9, 296.1], r: 26.8, yc: 111.2 },
  suv: { d: "M53.5 110.3 L53.5 71.9 Q53.5 66.4 56.5 63.1 L56.5 63.1 Q59.4 59.9 60.8 54.6 L65.3 37 Q66.7 31.7 72.2 31.7 L241.4 31.7 Q246.9 31.7 251.5 34.6 L286.2 56.9 Q290.8 59.9 296.3 60.4 L329.3 63.7 Q334.8 64.2 338.1 68.6 L343.1 75.1 Q346.5 79.4 346.5 84.9 L346.5 110.3 L331.3 110.3 A31.7 31.7 0 0 0 267.9 110.3 L135 110.3 A31.7 31.7 0 0 0 71.7 110.3Z", wins: ["M74 56.6 L75.5 36 L141.4 36 L154.7 56.6Z", "M159.7 56.6 L145.5 36 L245.4 36 L282 56.6Z"], lines: ["M157.2 57.6 L157.2 102.3"], shine: ["M66 58.6 L290 58.6"], inter: [], wheels: [103.3, 299.6], r: 27.7, yc: 110.3 },
  mpv: { d: "M43 107.2 L43 66.2 Q43 60.7 47.4 57.4 L48.1 56.8 Q52.4 53.5 53.9 48.2 L60.3 26.2 Q61.8 20.9 67.3 20.9 L213.3 20.9 Q218.8 20.9 223.8 23.2 L295.5 56 Q300.5 58.3 306 58.9 L342.1 62.6 Q347.6 63.1 350.6 67.7 L354 73 Q357 77.6 357 83.1 L357 107.2 L338.4 107.2 A34.8 34.8 0 0 0 268.8 107.2 L131.2 107.2 A34.8 34.8 0 0 0 61.6 107.2Z", wins: ["M71.3 51.1 L74.4 25.7 L119.3 25.7 L140.2 51.8Z", "M145.4 51.9 L122.7 25.7 L160.3 25.7 L203 52.5Z", "M208.2 52.6 L163.7 25.7 L215.7 25.7 L287.9 53.5Z"], lines: ["M142.8 52.9 L142.8 99.2", "M205.6 53.6 L205.6 99.2"], shine: ["M63.3 53.1 L295.9 55.5"], inter: [], wheels: [96.4, 303.6], r: 30.8, yc: 107.2 },
  roadster: { d: "M58.8 114.3 L58.8 89.7 Q58.8 84.2 63.7 81.6 L68 79.3 Q72.9 76.8 78.4 76.8 L138 76.8 Q143.5 76.8 148.1 79.8 L150.2 81.2 Q154.8 84.2 160.3 84.2 L194.5 84.2 Q200 84.2 203.5 80 L213.4 68 Q216.9 63.8 222.4 63.8 L222.7 63.8 Q228.2 63.8 232.8 66.8 L243.4 73.8 Q248 76.8 253.5 77 L324.4 80.2 Q329.9 80.5 333.8 84.4 L337.3 87.8 Q341.2 91.6 341.2 97.1 L341.2 114.3 L318 114.3 A27.7 27.7 0 0 0 262.7 114.3 L137.3 114.3 A27.7 27.7 0 0 0 82 114.3Z", wins: ["M212.7 82.3 L219.8 66.6 L227.7 66.6 L239.5 78.6Z"], lines: [], shine: [], inter: ["M157.6 83.7 L198.6 83.7 L195.8 89.8 L161.9 89.8Z"], wheels: [109.6, 290.4], r: 23.7, yc: 114.3 },
  cabriolet: { d: "M43.9 113 L43.9 84.7 Q43.9 79.2 48.2 75.8 L52 72.8 Q56.4 69.4 61.9 69.4 L132.1 69.4 Q137.6 69.4 142.2 72.3 L142.3 72.4 Q146.9 75.3 152.4 75.3 L194.5 75.3 Q200 75.3 203 70.7 L212.6 56.3 Q215.6 51.8 221.1 51.8 L225.7 51.8 Q231.2 51.8 235.7 55 L248.6 64.2 Q253.1 67.4 258.6 67.6 L338.1 69.3 Q343.6 69.4 347.3 73.5 L352.4 79.1 Q356.1 83.1 356.1 88.6 L356.1 113 L328.9 113 A29 29 0 0 0 270.9 113 L125.9 113 A29 29 0 0 0 68 113Z", wins: ["M214.1 73.3 L221.9 54.7 L229.7 54.7 L245.3 70.4Z"], lines: [], shine: [], inter: ["M150 74.8 L200 74.8 L196.9 82.1 L153.2 82.1Z"], wheels: [97.0, 299.9], r: 25.0, yc: 113.0 },
  supercar: { d: "M48 114 L48 98 Q50 90 62 88 L96 78 Q124 72 144 62 Q160 58 186 58 L222 58 Q238 58 252 66 L292 80 L340 88 Q356 92 358 104 L358 114 L328 114 A28 28 0 0 0 272 114 L126 114 A28 28 0 0 0 70 114 Z", wins: ["M148 76 L160 65 Q170 61 190 61 L222 61 Q235 61 246 69 L270 76Z"], lines: ["M150 92 Q190 88 230 92"], shine: ["M100 80 Q140 70 160 60"], inter: [], wheels: [98, 300], r: 24, yc: 114 },
}

/** Bốn dáng vẽ tay, bánh ở x = 105 và 295, tâm y = 112, bán kính 26 (vòm 30). */
const HAND: Partial<Record<BodyType, { body: string; detail: React.ReactNode }>> = {
  pickup: {
    body: `M43.4 112 L43.4 70.2 L155 70.2 L155 46.6 Q155 38.8 162.2 33.6 L212.6 31 Q221.6 31 228.8 38.8 L255.8 70.2 L344 78 Q356.6 83.3 356.6 96.4 L356.6 112 ${ARCHES}`,
    detail: (
      <>      <path d="M164 67.5 L169.4 44.1 L210.8 41.4 L219.8 67.5Z" {...W} />
      <path d="M52.4 83.3 L147.8 83.3" {...L} />
      </>
    ),
  },
  minitruck: {
    body: `M40 112 L40 71.3 L214 71.3 L214 44.2 Q214 35.2 224 32.9 L272 30.6 Q288 30.6 298 41.9 L322 71.3 L352 78.1 Q362 82.6 362 96.2 L362 112 ${ARCHES}`,
    detail: (
      <>      <path d="M224 69.1 L230 44.2 L272 41.9 L292 69.1Z" {...W} />
      <path d="M46 84.9 L208 84.9" {...L} />
      </>
    ),
  },
  van: {
    body: `M40 112 L40 40.3 Q40 32.1 52 32.1 L268 32.1 Q284 32.1 292 43.5 L326 82.7 L354 87.5 Q364 90.8 364 102.2 L364 112 ${ARCHES}`,
    detail: (
      <>      <path d="M262 43.5 L292 81 L246 81 L246 43.5Z" {...W} />
      <path d="M120 50.1 L196 50.1 L196 68 L120 68Z" {...W} />
      <path d="M214 43.5 L214 105.5" {...L} />
      </>
    ),
  },
  campervan: {
    body: `M40 112 L40 45.5 Q40 37.9 52 37.9 L268 37.9 Q284 37.9 292 48.5 L326 84.8 L354 89.3 Q364 92.3 364 102.9 L364 112 ${ARCHES}`,
    detail: (
      <>      <path d="M262 48.5 L292 83.3 L246 83.3 L246 48.5Z" {...W} />
      <path d="M120 54.5 L196 54.5 L196 71.2 L120 71.2Z" {...W} />
      <path d="M214 48.5 L214 106" {...L} />
      </>
    ),
  },
}

const Wheel = ({ cx, cy, r }: { cx: number; cy: number; r: number }) => (
  <g transform={`translate(${cx} ${cy})`}>
    <circle r={r} fill={B(950)} />
    <circle r={r * 0.68} fill={B(200)} />
    <circle r={r * 0.68} fill="none" stroke={B(400)} strokeWidth={r * 0.05} />
    <g className="car-wheel" style={{ animationDuration: `${((2 * Math.PI * r) / CONTACT_SPEED).toFixed(2)}s` }}>
      {[0, 72, 144, 216, 288].map((a) => (
        <path key={a} d={`M0 ${-r * 0.12} L0 ${-r * 0.6}`} stroke={B(700)} strokeWidth={r * 0.1} strokeLinecap="round" transform={`rotate(${a})`} />
      ))}
      <circle r={r * 0.14} fill={B(800)} />
    </g>
  </g>
)

/** Ba hàng mặt đường từ xa (sát bánh xe) đến gần: y, cao, rộng ô, độ đậm. Tốc độ tỷ lệ với rộng ô nên hàng gần chạy nhanh hơn. */
const ROAD_ROWS = [
  { y: 139, h: 3, c: 5, o: 0.55, v: 71 },
  { y: 142, h: 5, c: 9, o: 0.75, v: 90 },
  { y: 147, h: 8, c: 15, o: 0.95, v: 112 },
]
/**
 * Gió: vệt khí kéo ra từ đuôi xe (slipstream), không lơ lửng trên trời. Mỗi vệt mọc ra ngay mặt sau của xe, dài dần rồi trượt về sau
 * và thu nhỏ, mờ dần từ sát xe sang trong suốt. Độ cao nằm trong chiều cao thân xe (tính từ đỉnh mặt sau), độ dài và chu kỳ khác nhau.
 */
const WIND = [
  { dy: 10, len: 92, dur: 3.1, delay: 0.2 },
  { dy: 24, len: 64, dur: 3.7, delay: 1.3 },
  { dy: 38, len: 80, dur: 3.4, delay: 2.2 },
]

/** Tốc độ lăn của bánh = tốc độ hàng đường sát bánh (đơn vị/giây), nên bánh bán kính r quay một vòng trong 2 * pi * r / v giây. */
const CONTACT_SPEED = ROAD_ROWS[0].v

/** Silhouette đặc theo kiểu thân xe, tô màu chữ hiện tại; xe không nhận ra dùng roadster (dáng đặc trưng của thương hiệu). */
export function VehicleSilhouette({ body, className }: { body: BodyType; className?: string }) {
  const spec = SPECS[body]
  const wheels: [number, number] = spec?.wheels ?? [105, 295]
  const r = spec?.r ?? 26
  const yc = spec?.yc ?? 112
  const dBody = (spec ? spec.d : HAND[body]?.body) ?? ""
  const rear = dBody.match(/^M([\d.]+) [\d.]+ L[\d.]+ ([\d.]+)/)
  const rearX = rear ? Number(rear[1]) : 40
  const rearTop = rear ? Number(rear[2]) : 80
  return (
    <svg viewBox="8 2 384 154" aria-hidden="true" className={cn("w-full", className)}>
      <defs>
        <linearGradient id="marque-body" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" style={{ stopColor: B(400) }} />
          <stop offset=".3" style={{ stopColor: B(500) }} />
          <stop offset=".55" style={{ stopColor: B(600) }} />
          <stop offset=".86" style={{ stopColor: B(800) }} />
          <stop offset="1" style={{ stopColor: B(900) }} />
        </linearGradient>
        <linearGradient id="marque-glass" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" style={{ stopColor: B(50) }} />
          <stop offset=".55" style={{ stopColor: B(100) }} />
          <stop offset="1" style={{ stopColor: B(300) }} />
        </linearGradient>
        {ROAD_ROWS.map((row, i) => (
          <pattern key={i} id={`marque-road-${i}`} width={row.c * 2} height={row.h} patternUnits="userSpaceOnUse" patternTransform={`translate(${i % 2 ? row.c : 0} 0)`}>
            <rect width={row.c} height={row.h} fill="currentColor" />
          </pattern>
        ))}
        <linearGradient id="marque-road-fade" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset=".2" stopColor="#fff" />
          <stop offset=".8" stopColor="#fff" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="marque-wind" x1="1" x2="0" y1="0" y2="0">
          <stop offset="0" style={{ stopColor: "var(--muted-foreground)", stopOpacity: 0.55 }} />
          <stop offset="1" style={{ stopColor: "var(--muted-foreground)", stopOpacity: 0 }} />
        </linearGradient>
        <mask id="marque-road-mask" maskUnits="userSpaceOnUse" x="8" y="136" width="384" height="22">
          <rect x="8" y="136" width="384" height="22" fill="url(#marque-road-fade)" />
        </mask>
      </defs>
      {/* Bóng đổ dưới xe, để xe đứng trên mặt đường chứ không lơ lửng */}
      <ellipse cx="200" cy="140" rx="150" ry="4" fill="currentColor" opacity=".16" />
      {/*
        Mặt đường có phối cảnh: ba hàng ô cờ của thương hiệu, hàng gần người xem to, đậm và chạy nhanh hơn hàng xa (thị sai),
        hai đầu mờ dần như đường mất hút. Chu kỳ trôi mỗi hàng bằng chu kỳ ô của nó nên cùng một nhịp (xem globals.css).
      */}
      <g mask="url(#marque-road-mask)">
        {ROAD_ROWS.map((row, i) => (
          <g key={i} className="car-road" style={{ "--p": `${row.c * 2}px`, "--t": `${((row.c * 2) / row.v).toFixed(3)}s` } as React.CSSProperties}>
            <rect x={-40} y={row.y} width={480} height={row.h} fill={`url(#marque-road-${i})`} opacity={row.o} />
          </g>
        ))}
      </g>
      <g className="car-drive">
        {/* Gió: vệt khí mọc ra từ mặt sau của xe rồi trượt về sau và mờ dần */}
        <g aria-hidden>
          {WIND.map((w, i) => {
            const y = Math.min(rearTop + w.dy, yc - 10)
            return (
              <rect
                key={i}
                className="car-wind"
                x={rearX - w.len}
                y={y}
                width={w.len}
                height={2.2}
                rx={1.1}
                fill="url(#marque-wind)"
                style={{ "--wd": `${w.dur}s`, "--wl": `${w.delay}s` } as React.CSSProperties}
              />
            )
          })}
        </g>
        <g className="car-body">
          {/* Thân xe: chuyển sắc đậm nhạt theo chiều cao (sáng ở nóc, tối ở gầm), thêm viền sáng mảnh ở mép trên để lộ khối */}
          <path d={spec ? spec.d : HAND[body]?.body} fill="url(#marque-body)" stroke={B(300)} strokeWidth={1.6} strokeOpacity={0.5} strokeLinejoin="round" />
          {spec ? (
            <>
              {spec.shine.map((d, i) => <path key={`s${i}`} d={d} fill="none" stroke={B(300)} strokeOpacity={0.65} strokeWidth={1.8} strokeLinecap="round" />)}
              {spec.lines.map((d, i) => <path key={`l${i}`} d={d} fill="none" stroke={B(950)} strokeOpacity={0.55} strokeWidth={1.8} strokeLinecap="round" />)}
              {spec.inter.map((d, i) => <path key={`i${i}`} d={d} fill={B(950)} opacity={0.85} />)}
              {spec.wins.map((w, i) => <path key={i} d={w} {...W} />)}
            </>
          ) : HAND[body]?.detail}
        </g>
        {/* Vòm bánh tối sâu: nửa trên của đĩa tối lấp khoảng hở giữa lốp và thân xe */}
        {wheels.map((cx) => (
          <path key={cx} d={`M${cx - r - 4} ${yc} A${r + 4} ${r + 4} 0 0 1 ${cx + r + 4} ${yc}Z`} fill={B(950)} opacity={0.9} />
        ))}
        <Wheel cx={wheels[0]} cy={yc} r={r} />
        <Wheel cx={wheels[1]} cy={yc} r={r} />
      </g>
    </svg>
  )
}
