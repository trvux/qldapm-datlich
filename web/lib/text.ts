import type { ReactNode } from "react"

/*
 * Cụm từ ghép tiếng Việt không được ngắt dòng ở giữa (ví dụ "bảo dưỡng" không thành "bảo / dưỡng").
 * Thay khoảng trắng trong cụm bằng khoảng trắng không ngắt (U+00A0). Danh sách do người thực hiện lập từ các cụm hay gặp trong giao diện.
 */
const KEEP_TOGETHER = [
  "bảo dưỡng", "sửa chữa", "đặt lịch", "lịch hẹn", "khung giờ", "động cơ", "định kỳ", "giữ chỗ", "trực tuyến", "thanh toán",
  "hỏi đáp", "nhận xe", "đúng giờ", "đúng cách", "xe của tôi", "xác nhận", "từ chối", "hoàn thành", "dịch vụ", "khách hàng",
  "giá tham khảo", "thời lượng", "trạng thái", "đang thực hiện", "chờ xác nhận", "hồ sơ xe", "số xe", "tiếp theo", "từng bước",
  "chi tiết", "cam kết", "quy trình", "trung tâm", "báo cáo", "ghi chú", "biển số",
]
const RE = new RegExp(`(${KEEP_TOGETHER.sort((a, b) => b.length - a.length).join("|")})`, "gi")

/** Giữ các cụm từ ghép liền nhau; nhận chuỗi, các kiểu khác trả nguyên. */
export function protect(node: ReactNode): ReactNode {
  return typeof node === "string" ? node.replace(RE, (m) => m.replace(/ /g, " ")) : node
}
