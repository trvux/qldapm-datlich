import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Marque: bảo dưỡng và sửa chữa ô tô",
    short_name: "Marque",
    description: "Đặt lịch bảo dưỡng và sửa chữa ô tô trực tuyến.",
    start_url: "/",
    display: "standalone",
    background_color: "#faf9f5",
    theme_color: "#1F4D3A",
    lang: "vi",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  }
}
