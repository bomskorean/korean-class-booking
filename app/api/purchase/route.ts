/**
 * モック決済 API
 *
 * Stripe に移行する場合:
 *   1. このルートは Stripe Checkout セッション作成に置き換える
 *      (POST → { url: checkoutUrl } を返してフロントでリダイレクト)
 *   2. fulfillPayment は /api/purchase/webhook/route.ts の
 *      checkout.session.completed ハンドラから呼ぶ
 *   3. method を "STRIPE_CARD" に変更し、stripePaymentIntentId を渡す
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { fulfillPayment } from "@/lib/fulfillment";

const Body = z.object({ packageId: z.string() });

export async function POST(req: NextRequest) {
  const userId = req.cookies.get("dev_session")?.value;
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const { packageId } = parsed.data;

  const pkg = await prisma.ticketPackage.findUnique({ where: { id: packageId } });
  if (!pkg) return NextResponse.json({ error: "package not found" }, { status: 404 });

  const result = await fulfillPayment(userId, packageId, pkg.price, "MOCK");

  console.log(
    `[PAYMENT MOCK] userId=${userId} package=${pkg.name} ¥${pkg.price} → ticketId=${result.ticketId}`,
  );

  return NextResponse.json({ ok: true, ...result });
}
