import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { POLICY } from "@/lib/policy"

const ITEMS = [
  { q: "Đặt lịch trước bao lâu?", a: `Quý khách đặt trước giờ hẹn ít nhất ${POLICY.minLeadHours} giờ và không quá ${POLICY.maxAdvanceDays} ngày. Khung giờ đã qua, đã đầy hoặc quá gần sẽ bị làm mờ, kèm lý do.` },
  { q: "Tôi có thể có bao nhiêu lịch cùng lúc?", a: `Tối đa ${POLICY.maxActive} lịch đang hiệu lực. Hoàn thành hoặc hủy một lịch để đặt thêm.` },
  { q: "Đổi hoặc hủy lịch thế nào?", a: `Vào Lịch hẹn, chọn lịch rồi chọn Đổi lịch hoặc Hủy lịch. Chỉ thực hiện được trước giờ hẹn ít nhất ${POLICY.changeLeadHours} giờ, và mỗi lịch đổi tối đa ${POLICY.maxChanges} lần.` },
  { q: "Giá hiển thị có phải giá cuối cùng không?", a: "Giá chỉ để tham khảo, chưa gồm phụ tùng phát sinh. Hệ thống không thanh toán trực tuyến; Quý khách thanh toán tại Trung tâm." },
  { q: "Trung tâm làm việc khi nào?", a: `${POLICY.openDays}, ${POLICY.hours}. Nghỉ trưa 12:00 - 13:00 và nghỉ Chủ nhật.` },
  { q: "Vì sao lịch của tôi bị từ chối?", a: "Nhân viên luôn ghi lý do khi từ chối. Quý khách xem lý do trong chi tiết lịch hẹn và có thể đặt lại khung giờ khác." },
]

export function Faq() {
  return (
    <Accordion type="single" collapsible className="w-full">
      {ITEMS.map((it, i) => (
        <AccordionItem key={it.q} value={`q${i}`}>
          <AccordionTrigger className="text-left text-base">{it.q}</AccordionTrigger>
          <AccordionContent className="text-muted-foreground">{it.a}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
