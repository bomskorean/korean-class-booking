export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const slots = await prisma.slot.findMany({
    where: { status: "CLOSED" },
    orderBy: { startAt: "asc" },
  });
  return NextResponse.json({ slots });
}

const Body = z.object({
  date:      z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/), // HH:MM (JST)
  endTime:   z.string().regex(/^\d{2}:\d{2}$/), // HH:MM (JST)
});

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const { date, startTime, endTime } = parsed.data;
  const [y, m, d] = date.split("-").map(Number);
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);

  // JST(UTC+9) → UTC
  const startAt = new Date(Date.UTC(y, m - 1, d, sh - 9, sm, 0));
  const endAt   = new Date(Date.UTC(y, m - 1, d, eh - 9, em, 0));

  if (endAt <= startAt) {
    return NextResponse.json({ error: "終了時刻は開始時刻より後にしてください" }, { status: 400 });
  }

  const durationMin = Math.round((endAt.getTime() - startAt.getTime()) / 60_000);

  const slot = await prisma.slot.create({
    data: {
      courseId:        "REGULAR",
      startAt,
      displayEndAt:    endAt,
      blockEndAt:      endAt,
      displayDuration: durationMin,
      blockDuration:   durationMin,
      status:          "CLOSED",
    },
  });

  return NextResponse.json({ ok: true, slot });
}
