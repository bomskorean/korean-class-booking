// 予約スロット生成ロジック（PRD 3.7）
// 無料体験：表示50分 / 占有60分(50+休憩10) / 開始は正時(60分グリッド)
// 正規   ：表示50分 / 占有70分(1h10m)      / 開始は30分グリッド
// Googleカレンダーの busy 区間と重なるスロットは自動ブロック。

export type LessonKind = "trial" | "regular";

export interface Busy { start: Date; end: Date }
export interface Slot {
  start: Date;
  displayEnd: Date; // start + 50分
  blockEnd: Date;   // start + 60 or 70分
  available: boolean;
}

export const RULES = {
  trial:   { display: 50, block: 60, gridMin: 60 },
  regular: { display: 50, block: 70, gridMin: 30 },
} as const;

/**
 * 営業時間内の候補開始時刻を生成し、既存予約/カレンダーbusyと重なるものを除外。
 * @param dayStart 営業開始（その日の）
 * @param dayEnd   営業終了（最終レッスンが収まる範囲）
 * @param kind     trial | regular
 * @param busy     既存の占有区間（自システム予約 + Googleカレンダー）
 */
export function generateSlots(
  dayStart: Date,
  dayEnd: Date,
  kind: LessonKind,
  busy: Busy[],
): Slot[] {
  const { display, block, gridMin } = RULES[kind];
  const slots: Slot[] = [];

  // グリッド開始時刻に正規化（trial=正時、regular=:00/:30）
  const cursor = new Date(dayStart);
  cursor.setSeconds(0, 0);
  if (gridMin === 60) cursor.setMinutes(0);
  else cursor.setMinutes(cursor.getMinutes() < 30 ? 0 : 30);

  while (cursor < dayEnd) {
    const start = new Date(cursor);
    const displayEnd = addMin(start, display);
    const blockEnd = addMin(start, block);

    if (blockEnd <= dayEnd) {
      const available = !overlapsAny({ start, end: blockEnd }, busy);
      slots.push({ start, displayEnd, blockEnd, available });
    }
    cursor.setMinutes(cursor.getMinutes() + gridMin);
  }
  return slots;
}

export function overlapsAny(a: Busy, list: Busy[]): boolean {
  return list.some((b) => a.start < b.end && b.start < a.end);
}

function addMin(d: Date, m: number): Date {
  return new Date(d.getTime() + m * 60_000);
}

/** 予約確定時にカレンダーへ書き込む占有区間（block長） */
export function occupancyFor(start: Date, kind: LessonKind): Busy {
  return { start, end: addMin(start, RULES[kind].block) };
}
