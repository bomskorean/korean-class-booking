export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const packages = await prisma.ticketPackage.findMany({
    orderBy: { totalCount: "asc" },
  });
  return NextResponse.json({ packages });
}
