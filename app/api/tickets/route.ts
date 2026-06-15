export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const userId = req.cookies.get("dev_session")?.value;
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const tickets = await prisma.userTicket.findMany({
    where: { userId, status: "ACTIVE", remainingCount: { gt: 0 } },
    include: { package: { select: { name: true, validMonths: true, unitPrice: true, courseScope: true } } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ tickets });
}
