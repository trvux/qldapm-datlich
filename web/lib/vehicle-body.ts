export type BodyType =
  | "micro" | "sedan" | "hatchback" | "wagon" | "coupe" | "supercar" | "roadster" | "cabriolet"
  | "crossover" | "suv" | "mpv" | "pickup" | "minitruck" | "van" | "campervan"

export const BODY_LABEL: Record<BodyType, string> = {
  micro: "Micro", sedan: "Sedan", hatchback: "Hatchback", wagon: "Wagon", coupe: "Coupe", supercar: "Supercar", roadster: "Roadster", cabriolet: "Cabriolet",
  crossover: "Crossover", suv: "SUV", mpv: "MPV", pickup: "Bán tải", minitruck: "Xe tải nhẹ", van: "Van", campervan: "Campervan",
}

const strip = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()

/*
 * Kiểu thân xe suy từ tên dòng xe. Mười lăm kiểu theo cách chia thông dụng (micro, sedan, hatchback, wagon, coupe, supercar, roadster, cabriolet,
 * crossover, SUV, MPV, bán tải, xe tải nhẹ, van, campervan) và các dòng phổ biến ở Việt Nam. Bảng do người thực hiện lập từ hiểu biết chung
 * cộng kết quả tìm kiếm web, chưa đối chiếu danh mục của hãng nào; xe không nhận ra thì dùng roadster của thương hiệu.
 * Thứ tự quan trọng: kiểu cụ thể đứng trước sedan.
 */
const RULES: [BodyType, RegExp][] = [
  ["micro", /\b(vf ?3|wuling|mini ?ev|hongguang|smart fortwo|kei|micro)\b/],
  ["campervan", /\b(camper|campervan|motorhome|caravan|rv)\b/],
  ["minitruck", /\b(porter|k200|k250|qkr|carry|frontier|mini truck|truck|xe tai)\b/],
  ["van", /\b(transit|solati|hiace|sprinter|minibus|van)\b/],
  ["pickup", /\b(ranger|hilux|navara|triton|d max|dmax|bt 50|f 150|colorado)\b/],
  ["mpv", /\b(innova|xpander|carnival|veloz|avanza|ertiga|stargazer|xl7|livina|alphard|sienta|odyssey|limo green|mpv)\b/],
  ["suv", /\b(fortuner|everest|pajero|land cruiser|prado|santa ?fe|sorento|palisade|explorer|vf ?[89]|terra|suv)\b/],
  ["crossover", /\b(cr v|crv|hr v|cx ?[0-9]+|seltos|sportage|creta|kona|x trail|rav ?4|ecosport|territory|outlander|corolla cross|raize|xforce|vf ?[567]|vf e34|tucson|crossover)\b/],
  ["hatchback", /\b(morning|i10|i20|fadil|spark|wigo|picanto|yaris|swift|brio|polo|golf|mazda ?3 sport|hatchback)\b/],
  ["wagon", /\b(wagon|estate|touring|outback|v60|v90)\b/],
  ["supercar", /\b(ferrari|lamborghini|mclaren|huracan|aventador|nsx|gt r|supercar|pagani|bugatti)\b/],
  ["cabriolet", /\b(cabriolet|convertible|cabrio|spyder|spider|open top)\b/],
  ["roadster", /\b(mx 5|miata|roadster|boxster|z4)\b/],
  ["coupe", /\b(coupe|mustang|supra|brz|camaro|challenger|370z|gt86)\b/],
  ["sedan", /\b(vios|accent|city|civic|camry|altis|corolla|mazda ?3|cerato|k3|elantra|sonata|almera|attrage|accord|ciaz|lux a|sedan)\b/],
]

/** Kiểu thân xe của dòng xe; không nhận ra thì trả roadster (dáng đặc trưng của thương hiệu). */
export function bodyOf(brand?: string | null, model?: string | null): BodyType {
  const name = strip(`${brand ?? ""} ${model ?? ""}`)
  for (const [body, re] of RULES) if (re.test(name)) return body
  return "roadster"
}
