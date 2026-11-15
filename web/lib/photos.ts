/** Ảnh minh họa từ Unsplash (xem public/images/CREDITS.md). `alt` mô tả đúng nội dung ảnh đã xem. */
export type Photo = { src: string; width: number; height: number; alt: string; credit: string; creditUrl: string }

export const PHOTOS = {
  hero: { src: "/images/hero-convertible.jpg", width: 2000, height: 1325, alt: "Xe thể thao cổ mui trần màu xanh đậm đỗ trên đồi cỏ, phía xa là biển", credit: "T", creditUrl: "https://unsplash.com/@tanyabarrow" },
  headlightA: { src: "/images/detail-headlight-a.jpg", width: 933, height: 1400, alt: "Đèn pha và cản chrome của xe cổ màu xanh đậm", credit: "Dmitry Spravko", creditUrl: "https://unsplash.com/@kaprion" },
  headlightB: { src: "/images/detail-headlight-b.jpg", width: 933, height: 1400, alt: "Đèn pha tròn của xe cổ màu xanh lục", credit: "Linus Belanger", creditUrl: "https://unsplash.com/@linusbelanger" },
  gauges: { src: "/images/detail-gauges.jpg", width: 1400, height: 933, alt: "Cụm đồng hồ trên taplo xe cổ, kim chỉ số không", credit: "Benjamin Child", creditUrl: "https://unsplash.com/@bchild311" },
  engine: { src: "/images/detail-engine.jpg", width: 933, height: 1400, alt: "Khoang động cơ xe cổ với lọc gió tròn và chi tiết chrome", credit: "Warren Valentine", creditUrl: "https://unsplash.com/@wjosiahv" },
  wheel: { src: "/images/detail-wheel.jpg", width: 1120, height: 1400, alt: "Vô lăng gỗ và nội thất da của xe cổ", credit: "Stefanie Jockschat", creditUrl: "https://unsplash.com/@stefaniejockschat" },
  workshop: { src: "/images/workshop.jpg", width: 1600, height: 1200, alt: "Xe cổ đang được phục chế trong xưởng", credit: "Adam Winger", creditUrl: "https://unsplash.com/@awcreativeut" },
} satisfies Record<string, Photo>
