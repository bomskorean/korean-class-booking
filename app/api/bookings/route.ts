export const dynamic = "force-dynamic";
// 予約作成 API（PRD 3.1/3.7/6.4）
// 流れ：チケット確認 → 占有区間でカレンダー再確認(busy) → トランザクションで保留→確定 →
//        Googleカレンダーにイベント作成 → 通知(メール/LINE)
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { occupancyFor, overlapsAny } from "@/lib/slots";
import { getBusy, createEvent } from "@/lib/calendar";

const Body = z.object({
  userId: z.string(),
  slotId: z.string(),
  type: z.enum(["trial", "regular"]),
});

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const { userId, slotId, type } = parsed.data;

  const slot = await prisma.slot.findUnique({ where: { id: slotId } });
  if (!slot || slot.status !== "OPEN") return NextResponse.json({ error: "slot unavailable" }, { status: 409 });

  // 二重予約防止：占有区間をカレンダー busy と再照合
  const occ = occupancyFor(slot.startAt, type);
  const busy = await getBusy(occ.start, occ.end);
  if (overlapsAny(occ, busy)) return NextResponse.json({ error: "calendar conflict" }, { status: 409 });

  // TODO: 正規は UserTicket を hold→消化確定。trial は 1人1回チェック。
  // TODO: DB トランザクション + 行ロックで同時予約を排他制御。
  const booking = await prisma.booking.create({
    data: { userId, slotId, type: type === "trial" ? "TRIAL" : "REGULAR", status: "CONFIRMED" },
  });

  const eventId = await createEvent({
    summary: `${type === "trial" ? "無料体験" : "正規レッスン"} (${userId})`,
    start: occ.start,
    end: occ.end,
  });
  await prisma.slot.update({ where: { id: slotId }, data: { gcalEventId: eventId, bookedCount: { increment: 1 } } });

  // TODO: notifyBookingConfirmed(line) / Resend メール送信
  return NextResponse.json({ ok: true, bookingId: booking.id });
}
