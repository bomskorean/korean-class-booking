export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { overlapsAny, RULES, LessonKind, Busy } from "@/lib/slots";

const OPEN_HOUR_JST  = 10;
const CLOSE_HOUR_JST = 21;

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const dateStr = searchParams.get("date");
  const kind = (searchParams.get("kind") ?? "trial") as LessonKind;

  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return NextResponse.json({ error: "invalid date" }, { status: 400 });
  }

  const [y, m, d] = dateStr.split("-").map(Number);
  const dayStart = new Date(Date.UTC(y, m - 1, d, OPEN_HOUR_JST  - 9, 0, 0));
  const dayEnd   = new Date(Date.UTC(y, m - 1, d, CLOSE_HOUR_JST - 9, 0, 0));

  // OPEN slots for the day from DB
  const [openSlots, busySlots, closedSlots] = await Promise.all([
    prisma.slot.findMany({
      where: {
        startAt: { gte: dayStart, lt: dayEnd },
        status: "OPEN",
      },
      orderBy: { startAt: "asc" },
    }),
    // Already booked
    prisma.slot.findMany({
      where: {
        startAt: { lt: dayEnd },
        blockEndAt: { gt: dayStart },
        status: "FULL",
      },
    }),
    // Admin-blocked
    prisma.slot.findMany({
      where: {
        startAt: { lt: dayEnd },
        blockEndAt: { gt: dayStart },
        status: "CLOSED",
      },
    }),
  ]);

  const busyIntervals: Busy[] = [
    ...busySlots.map((s) => ({ start: s.startAt, end: s.blockEndAt })),
    ...closedSlots.map((s) => ({ start: s.startAt, end: s.blockEndAt })),
  ];

  // Google Calendar busy — skip if not configured
  try {
    const { getBusy } = await import("@/lib/calendar");
    const gcalBusy = await getBusy(dayStart, dayEnd);
    busyIntervals.push(...gcalBusy);
  } catch {
    // not configured
  }

  const blockMin = RULES[kind].block;

  const slots = openSlots.map((s) => {
    const blockEnd = new Date(s.startAt.getTime() + blockMin * 60_000);
    const available = !overlapsAny({ start: s.startAt, end: blockEnd }, busyIntervals);
    return {
      startAt:      s.startAt.toISOString(),
      displayEndAt: s.displayEndAt.toISOString(),
      available,
    };
  });

  return NextResponse.json({ slots });
}
