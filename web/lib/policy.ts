/**
 * Quy định đặt lịch hiển thị cho khách. Là giá trị mặc định của Backend
 * (backend/app/config.py và BR07, BR10, BR11, BR19, BR22).
 * TODO: lấy từ API khi Backend có endpoint cấu hình, để Backend đổi thì giao diện đổi theo.
 */
export const POLICY = {
  openDays: "Thứ Hai đến Thứ Bảy",
  hours: "08:00 - 12:00 và 13:00 - 17:00",
  maxAdvanceDays: 14,
  minLeadHours: 2,
  maxActive: 3,
  changeLeadHours: 4,
  maxChanges: 2,
} as const
