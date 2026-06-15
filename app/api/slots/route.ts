export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateSlots, LessonKind, Busy } from "@/lib/slots";

const OPEN_HOUR_JST = 10;
const CLOSE_HOUR_JST = 21;

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const dateStr = searchParams.get("date");
  const kind = (searchParams.get("kind") ?? "trial") as LessonKind;

  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return NextResponse.json({ error: "invalid date" }, { status: 400 });
  }

  const [y, m, d] = dateStr.split("-").map(Number);
  // JST(UTC+9) → UTC: subtract 9 hours
  const dayStart = new Date(Date.UTC(y, m - 1, d, OPEN_HOUR_JST - 9, 0, 0));
  const dayEnd = new Date(Date.UTC(y, m - 1, d, CLOSE_HOUR_JST - 9, 0, 0));

  // Existing confirmed bookings in DB → busy
  const [bookedSlots, closedSlots] = await Promise.all([
    prisma.slot.findMany({
      where: {
        startAt: { lt: dayEnd },
        blockEndAt: { gt: dayStart },
        bookings: { some: { status: { notIn: ["CANCELLED"] } } },
      },
    }),
    // Admin-blocked slots
    prisma.slot.findMany({
      where: {
        startAt: { lt: dayEnd },
        blockEndAt: { gt: dayStart },
        status: "CLOSED",
      },
    }),
  ]);

  const busy: Busy[] = [
    ...bookedSlots.map((s) => ({ start: s.startAt, end: s.blockEndAt })),
    ...closedSlots.map((s) => ({ start: s.startAt, end: s.blockEndAt })),
  ];

  // Google Calendar busy — skip if not configured
  try {
    const { getBusy } = await import("@/lib/calendar");
    const gcalBusy = await getBusy(dayStart, dayEnd);
    busy.push(...gcalBusy);
  } catch {
    // not configured in dev
  }

  const slots = generateSlots(dayStart, dayEnd, kind, busy);

  return NextResponse.json({
    slots: slots.map((s) => ({
      startAt: s.start.toISOString(),
      displayEndAt: s.displayEnd.toISOString(),
      available: s.available,
    })),
  });
}
