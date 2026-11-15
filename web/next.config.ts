import type { NextConfig } from "next"

// Địa chỉ Backend (FastAPI). Mặc định là cổng chạy local theo backend/README.md.
const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000"

const nextConfig: NextConfig = {
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${BACKEND_URL}/:path*` }]
  },
}

export default nextConfig
