"use client"

import { api, type Policy } from "@/lib/api"
import { useApi } from "@/lib/use-api"

const DAY_NAMES = ["", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ nhật"]

const hm = (t: string) => t.slice(0, 5)

/** "Thứ Hai đến Thứ Bảy" từ danh sách thứ ISO (1 = Thứ Hai); rời rạc thì liệt kê bằng dấu phẩy. */
export function formatOpenDays(days: number[]): string {
  const d = [...days].sort((a, b) => a - b)
  if (d.length === 0) return ""
  const contiguous = d.every((x, i) => i === 0 || x === d[i - 1] + 1)
  return d.length > 2 && contiguous ? `${DAY_NAMES[d[0]]} đến ${DAY_NAMES[d[d.length - 1]]}` : d.map((x) => DAY_NAMES[x]).join(", ")
}

/** Dạng hiển thị của quy định, tính từ dữ liệu Backend (GET /policy); không đặt cứng con số nào ở đây. */
export function describePolicy(p: Policy) {
  return {
    ...p,
    openDays: formatOpenDays(p.open_days),
    hours: `${hm(p.open_time)} - ${hm(p.lunch_start)} và ${hm(p.lunch_end)} - ${hm(p.close_time)}`,
    span: `${hm(p.open_time)} - ${hm(p.close_time)}`,
    lunch: `${hm(p.lunch_start)} - ${hm(p.lunch_end)}`,
  }
}

export type PolicyView = ReturnType<typeof describePolicy>

/** Lấy quy định đặt lịch từ Backend. `policy` là null khi đang tải hoặc lỗi; nơi dùng tự quyết định chữ thay thế. */
export function usePolicy() {
  const { data, loading, error } = useApi(() => api.policy(), [])
  return { policy: data ? describePolicy(data) : null, loading, error }
}
