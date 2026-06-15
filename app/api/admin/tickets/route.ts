export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const Body = z.object({
  userId:    z.string(),
  packageId: z.string(),
  count:     z.number().int().positive(),
});

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const { userId, packageId, count } = parsed.data;

  const [user, pkg] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.ticketPackage.findUnique({ where: { id: packageId } }),
  ]);

  if (!user) return NextResponse.json({ error: "ユーザーが見つかりません" }, { status: 404 });
  if (!pkg)  return NextResponse.json({ error: "パッケージが見つかりません" }, { status: 404 });

  const ticket = await prisma.userTicket.create({
    data: {
      userId,
      packageId,
      remainingCount: count,
      status:         "ACTIVE",
      source:         "MANUAL",
    },
  });

  return NextResponse.json({ ok: true, ticket, userName: user.name, packageName: pkg.name });
}
