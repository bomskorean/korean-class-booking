import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const slot = await prisma.slot.findUnique({ where: { id: params.id } });
  if (!slot || slot.status !== "CLOSED") {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  await prisma.slot.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
