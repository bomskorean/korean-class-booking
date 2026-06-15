// チケット商品マスタ（PRD 3.2 / 契約書 第4-5条 / 全て税込）
// コース × 回数（4/8/12）の組み合わせで 12 商品。

export interface PackageDef {
  courseId:    string;
  courseName:  string;
  name:        string;   // "{count}回券"
  count:       number;
  price:       number;   // 税込（円）
  unitPrice:   number;
  validMonths: number;
}

export const COURSES: { courseId: string; courseName: string }[] = [
  { courseId: "REGULAR",      courseName: "正規クラス" },
  { courseId: "SHORT",        courseName: "短期コース" },
  { courseId: "TOPIK",        courseName: "TOPIK対策" },
  { courseId: "STUDY_ABROAD", courseName: "留学準備"  },
];

export const TICKET_TIERS: { count: number; price: number; unitPrice: number; validMonths: number }[] = [
  { count: 4,  price: 15600, unitPrice: 3900, validMonths: 3 },
  { count: 8,  price: 29600, unitPrice: 3700, validMonths: 5 },
  { count: 12, price: 42000, unitPrice: 3500, validMonths: 7 },
];

export const PACKAGES: PackageDef[] = COURSES.flatMap(({ courseId, courseName }) =>
  TICKET_TIERS.map(({ count, price, unitPrice, validMonths }) => ({
    courseId,
    courseName,
    name: `${count}回券`,
    count,
    price,
    unitPrice,
    validMonths,
  }))
);

export function refundAmount(pkg: PackageDef, usedCount: number, fees = 0): number {
  const settled = usedCount * pkg.unitPrice;
  return Math.max(0, pkg.price - settled - fees);
}

export function computeExpiry(
  purchaseDate: Date,
  firstLessonDate: Date | null,
  validMonths: number,
  graceDays = 30,
): Date {
  const basis =
    firstLessonDate ??
    (daysBetween(purchaseDate, new Date()) > graceDays ? purchaseDate : null);
  const start = basis ?? firstLessonDate ?? purchaseDate;
  const d = new Date(start);
  d.setMonth(d.getMonth() + validMonths);
  return d;
}

function daysBetween(a: Date, b: Date): number {
  return Math.floor((b.getTime() - a.getTime()) / 86_400_000);
}
