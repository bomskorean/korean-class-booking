import { describe, it, expect } from "vitest";
import { generateSlots, occupancyFor } from "./slots";

const D = (h: number, m = 0) => new Date(2026, 5, 15, h, m, 0, 0);

describe("slot generation (PRD 3.7)", () => {
  it("regular: 10:00予約 → 次の予約可能は11:30", () => {
    const busy = [occupancyFor(D(10, 0), "regular")]; // 10:00-11:10
    const slots = generateSlots(D(10), D(13), "regular", busy);
    const avail = slots.filter((s) => s.available).map((s) => s.start.getHours() + ":" + s.start.getMinutes());
    expect(slots.find((s) => s.start.getHours() === 10 && s.start.getMinutes() === 30)!.available).toBe(false);
    expect(slots.find((s) => s.start.getHours() === 11 && s.start.getMinutes() === 0)!.available).toBe(false);
    expect(avail[0]).toBe("11:30");
  });

  it("trial: 開始は正時のみ・10:00予約 → 次は11:00", () => {
    const busy = [occupancyFor(D(10, 0), "trial")]; // 10:00-11:00
    const slots = generateSlots(D(10), D(13), "trial", busy);
    expect(slots.every((s) => s.start.getMinutes() === 0)).toBe(true);
    const avail = slots.filter((s) => s.available).map((s) => s.start.getHours());
    expect(avail[0]).toBe(11);
  });
});
