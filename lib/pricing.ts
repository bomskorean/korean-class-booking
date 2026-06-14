// チケット商品マスタ（PRD 3.2・契約書 第4-5条 / 全て税込）
// 割引パターン：4回券から1回あたり -50円。12回券は -200円(=3,500円)。

export interface PackageDef {
  name: string;
  count: number;
  price: number;       // 税込（円）
  unitPrice: number;
  validMonths: number; // 有効期間（初回レッスン日起算）
}

export const PACKAGES: PackageDef[] = [
  { name: "1回",    count: 1,  price: 4000,  unitPrice: 4000, validMonths: 2 },
  { name: "2回",    count: 2,  price: 8000,  unitPrice: 4000, validMonths: 2 },
  { name: "3回",    count: 3,  price: 12000, unitPrice: 4000, validMonths: 2 },
  { name: "4回券",  count: 4,  price: 15600, unitPrice: 3900, validMonths: 3 },
  { name: "5回券",  count: 5,  price: 19250, unitPrice: 3850, validMonths: 3 },
  { name: "6回券",  count: 6,  price: 22800, unitPrice: 3800, validMonths: 4 },
  { name: "7回券",  count: 7,  price: 26250, unitPrice: 3750, validMonths: 4 },
  { name: "8回券",  count: 8,  price: 29600, unitPrice: 3700, validMonths: 5 },
  { name: "12回券", count: 12, price: 42000, unitPrice: 3500, validMonths: 7 },
];

// 返金精算は購入時の単価で計算（PRD 提案 / 契約書 第10条 改訂）
export function refundAmount(pkg: PackageDef, usedCount: number, fees = 0): number {
  const settled = usedCount * pkg.unitPrice;
  return Math.max(0, pkg.price - settled - fees);
}

// 有効期限：初回レッスン日 + validMonths。
// 購入後30日以内に初回レッスンが無ければ購入日起算（南용 방지 가드）。
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
