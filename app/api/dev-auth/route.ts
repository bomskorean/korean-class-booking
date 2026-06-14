// 開発専用: テスト学生を選んでセッションCookieをセット
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const COOKIE = "dev_session";

export async function GET(req: NextRequest) {
  const userId = req.cookies.get(COOKIE)?.value ?? null;

  const [user, students] = await Promise.all([
    userId
      ? prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, email: true } })
      : null,
    prisma.user.findMany({
      where: { role: "STUDENT" },
      select: { id: true, name: true, email: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return NextResponse.json({ user, students });
}

export async function POST(req: NextRequest) {
  const { userId } = z.object({ userId: z.string() }).parse(await req.json());
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, userId, { path: "/", httpOnly: true, sameSite: "lax" });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete("dev_session");
  return res;
}
