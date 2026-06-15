export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const bookings = await prisma.booking.findMany({
    include: {
      user: { select: { id: true, name: true, email: true } },
      slot: { select: { startAt: true, displayEndAt: true, status: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ bookings });
}
