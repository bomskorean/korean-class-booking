export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const slots = await prisma.slot.findMany({
    where: { status: "OPEN" },
    orderBy: { startAt: "asc" },
  });
  return NextResponse.json({ slots });
}

const Body = z.object({
  date:      z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/), // HH:MM (JST)
  mode:      z.enum(["ONLINE", "OFFLINE", "BOTH"]).default("BOTH"),
});

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const { date, startTime, mode } = parsed.data;
  const [y, m, d] = date.split("-").map(Number);
  const [sh, sm] = startTime.split(":").map(Number);

  // JST(UTC+9) → UTC
  const startAt      = new Date(Date.UTC(y, m - 1, d, sh - 9, sm, 0));
  const displayEndAt = new Date(startAt.getTime() + 50 * 60_000);
  const blockEndAt   = new Date(startAt.getTime() + 60 * 60_000);

  const duplicate = await prisma.slot.findFirst({
    where: { startAt, status: "OPEN" },
  });
  if (duplicate) {
    return NextResponse.json({ error: "その時間帯はすでに登録されています" }, { status: 409 });
  }

  const slot = await prisma.slot.create({
    data: {
      courseId:        "REGULAR",
      startAt,
      displayEndAt,
      blockEndAt,
      displayDuration: 50,
      blockDuration:   60,
      mode,
      status:          "OPEN",
    },
  });

  return NextResponse.json({ ok: true, slot });
}
