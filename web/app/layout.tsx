import { Geist_Mono, Inter, Noto_Serif } from "next/font/google"

import type { Metadata, Viewport } from "next"

import "./globals.css"
import { BrandDefs } from "@/components/brand/motifs"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AuthProvider } from "@/lib/auth"
import { cn } from "@/lib/utils";

const notoSerifHeading = Noto_Serif({subsets:['latin'],variable:'--font-heading'});

const inter = Inter({subsets:['latin'],variable:'--font-sans'})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Marque | Bảo dưỡng và sửa chữa ô tô", template: "%s | Marque" },
  description: "Đặt lịch bảo dưỡng và sửa chữa ô tô trực tuyến. Chọn dịch vụ, chọn khung giờ, theo dõi trạng thái lịch hẹn.",
  applicationName: "Marque",
  openGraph: { type: "website", locale: "vi_VN", siteName: "Marque", title: "Marque | Bảo dưỡng và sửa chữa ô tô", description: "Đặt lịch bảo dưỡng và sửa chữa ô tô trực tuyến." },
  twitter: { card: "summary_large_image", title: "Marque | Bảo dưỡng và sửa chữa ô tô", description: "Đặt lịch bảo dưỡng và sửa chữa ô tô trực tuyến." },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#1F4D3A" },
    { media: "(prefers-color-scheme: dark)", color: "#1b1a17" },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="vi"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, "font-sans", inter.variable, notoSerifHeading.variable)}
    >
      <body>
        <BrandDefs />
        <ThemeProvider>
          <AuthProvider>
            <TooltipProvider>{children}</TooltipProvider>
            <Toaster position="top-center" />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
