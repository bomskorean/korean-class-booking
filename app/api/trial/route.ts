import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { occupancyFor, overlapsAny } from "@/lib/slots";

const Body = z.object({
  // Intake
  studyPeriod: z.enum(["1m", "3m", "6m", "1y+", "undecided"]),
  motivations: z.array(z.string()).min(1),
  experience: z.enum(["beginner", "self", "academy", "both"]),
  textbooks: z.array(z.string()).default([]),
  selfLevel: z.string().optional(),
  preferredMode: z.enum(["OFFLINE", "ONLINE", "BOTH"]).default("BOTH"),
  goalText: z.string().optional(),
  referralSource: z.string().optional(),
  // Contact
  name: z.string().min(1),
  email: z.string().email(),
  lineUserId: z.string().optional(),
  // Slot
  startAt: z.string().datetime(),
});

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", message: "入力内容に誤りがあります。" }, { status: 400 });
  }
  const body = parsed.data;
  const startAt = new Date(body.startAt);
  const occ = occupancyFor(startAt, "trial"); // block = 60分

  // 1人1回チェック: 同メールアドレスで未キャンセルのTRIAL予約があればNG
  const existingUser = await prisma.user.findUnique({ where: { email: body.email } });
  if (existingUser) {
    const existingTrial = await prisma.booking.findFirst({
      where: { userId: existingUser.id, type: "TRIAL", status: { notIn: ["CANCELLED"] } },
    });
    if (existingTrial) {
      return NextResponse.json(
        { error: "already_booked", message: "このメールアドレスでは既に無料体験のご予約があります。" },
        { status: 409 },
      );
    }
  }

  // スロット空き確認（DB）
  const conflicting = await prisma.slot.findFirst({
    where: {
      startAt: { lt: occ.end },
      blockEndAt: { gt: occ.start },
      bookings: { some: { status: { notIn: ["CANCELLED"] } } },
    },
  });
  if (conflicting) {
    return NextResponse.json(
      { error: "slot_taken", message: "ご指定の時間はすでに予約が入っています。別の時間をお選びください。" },
      { status: 409 },
    );
  }

  // Google Calendar 競合確認（未設定の場合はスキップ）
  try {
    const { getBusy } = await import("@/lib/calendar");
    const busy = await getBusy(occ.start, occ.end);
    if (overlapsAny(occ, busy)) {
      return NextResponse.json(
        { error: "calendar_conflict", message: "ご指定の時間はすでに予約が入っています。別の時間をお選びください。" },
        { status: 409 },
      );
    }
  } catch {
    // not configured in dev
  }

  // トランザクション: User → Slot → TrialIntake → Booking → intake更新
  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.upsert({
      where: { email: body.email },
      update: {
        name: body.name,
        ...(body.lineUserId ? { lineUserId: body.lineUserId } : {}),
      },
      create: {
        name: body.name,
        email: body.email,
        role: "STUDENT",
        ...(body.lineUserId ? { lineUserId: body.lineUserId } : {}),
      },
    });

    const displayEnd = new Date(startAt.getTime() + 50 * 60_000);
    const blockEnd = new Date(startAt.getTime() + 60 * 60_000);
    const slot = await tx.slot.create({
      data: {
        courseId: "REGULAR",
        startAt,
        displayEndAt: displayEnd,
        blockEndAt: blockEnd,
        displayDuration: 50,
        blockDuration: 60,
        bookedCount: 1,
        status: "FULL",
      },
    });

    const booking = await tx.booking.create({
      data: {
        userId: user.id,
        slotId: slot.id,
        type: "TRIAL",
        status: "CONFIRMED",
      },
    });

    const intake = await tx.trialIntake.create({
      data: {
        userId: user.id,
        bookingId: booking.id,
        studyPeriod: body.studyPeriod,
        motivations: JSON.stringify(body.motivations),
        experience: body.experience,
        textbooks: JSON.stringify(body.textbooks),
        selfLevel: body.selfLevel,
        preferredMode: body.preferredMode,
        goalText: body.goalText,
        referralSource: body.referralSource,
      },
    });

    return { user, slot, booking, intake };
  });

  // メール通知（開発中: ログ出力のみ）
  const dateJst = startAt.toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
  console.log(`
[MAIL MOCK] ─────────────────────────────
To      : ${body.email}
Subject : 【馬賑韓国語教室】無料体験レッスンのご予約が完了しました
─────────────────────────────────────────
${body.name} 様

無料体験レッスンのご予約を承りました。

　日時　: ${dateJst}（50分）
　予約ID: ${result.booking.id}

詳細は後日メールにてご連絡いたします。

馬賑韓国語教室
─────────────────────────────────────────`);

  return NextResponse.json({
    ok: true,
    bookingId: result.booking.id,
    startAt: startAt.toISOString(),
  });
}
