import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { occupancyFor, overlapsAny } from "@/lib/slots";

const Body = z.object({
  startAt:  z.string().datetime(),
  ticketId: z.string(),
});

export async function POST(req: NextRequest) {
  const userId = req.cookies.get("dev_session")?.value;
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  const { startAt: startAtStr, ticketId } = parsed.data;
  const startAt = new Date(startAtStr);
  const occ = occupancyFor(startAt, "regular"); // block = 70分

  // チケット確認
  const ticket = await prisma.userTicket.findFirst({
    where: { id: ticketId, userId, status: "ACTIVE", remainingCount: { gt: 0 } },
    include: { package: true },
  });
  if (!ticket) {
    return NextResponse.json({ error: "no_ticket", message: "有効なチケットが見つかりません。" }, { status: 409 });
  }
  if (ticket.expiresAt && ticket.expiresAt < new Date()) {
    return NextResponse.json({ error: "ticket_expired", message: "チケットの有効期限が切れています。" }, { status: 409 });
  }

  // スロット空き確認
  const conflicting = await prisma.slot.findFirst({
    where: {
      startAt: { lt: occ.end },
      blockEndAt: { gt: occ.start },
      bookings: { some: { status: { notIn: ["CANCELLED"] } } },
    },
  });
  if (conflicting) {
    return NextResponse.json({ error: "slot_taken", message: "ご指定の時間はすでに予約が入っています。別の時間をお選びください。" }, { status: 409 });
  }

  // Google Calendar 競合確認（未設定時はスキップ）
  try {
    const { getBusy } = await import("@/lib/calendar");
    const busy = await getBusy(occ.start, occ.end);
    if (overlapsAny(occ, busy)) {
      return NextResponse.json({ error: "calendar_conflict", message: "ご指定の時間はすでに予約が入っています。別の時間をお選びください。" }, { status: 409 });
    }
  } catch { /* 未設定 */ }

  const newRemaining = ticket.remainingCount - 1;

  // トランザクション: Slot作成 → Booking作成 → チケット消化
  const result = await prisma.$transaction(async (tx) => {
    const displayEnd = new Date(startAt.getTime() + 50 * 60_000);
    const blockEnd   = new Date(startAt.getTime() + 70 * 60_000);

    const slot = await tx.slot.create({
      data: {
        courseId: "REGULAR",
        startAt,
        displayEndAt: displayEnd,
        blockEndAt:   blockEnd,
        displayDuration: 50,
        blockDuration:   70,
        bookedCount: 1,
        status: "FULL",
      },
    });

    const booking = await tx.booking.create({
      data: {
        userId,
        slotId:       slot.id,
        type:         "REGULAR",
        status:       "CONFIRMED",
        usedTicketId: ticketId,
      },
    });

    // 初回レッスン日起算の有効期限を設定
    const isFirstLesson = ticket.validFrom === null;
    const expiresAt = isFirstLesson
      ? (() => { const d = new Date(startAt); d.setMonth(d.getMonth() + ticket.package.validMonths); return d; })()
      : ticket.expiresAt;

    await tx.userTicket.update({
      where: { id: ticketId },
      data: {
        remainingCount: newRemaining,
        status:         newRemaining === 0 ? "USED_UP" : "ACTIVE",
        ...(isFirstLesson ? { validFrom: startAt, expiresAt } : {}),
      },
    });

    return { slot, booking };
  });

  const dateJst = startAt.toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
  console.log(`[MAIL MOCK] 正規レッスン予約完了 ${dateJst} userId=${userId} bookingId=${result.booking.id} 残り${newRemaining}回`);

  return NextResponse.json({
    ok: true,
    bookingId:      result.booking.id,
    startAt:        startAt.toISOString(),
    remainingAfter: newRemaining,
  });
}
