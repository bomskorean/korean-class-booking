/**
 * 決済成功後の共通処理 — Payment + UserTicket を確定する。
 *
 * 呼び出し元:
 *  - モック決済 : POST /api/purchase (method="MOCK")
 *  - Stripe カード : checkout.session.completed Webhook → ここを呼ぶ
 *  - PayPay       : IPN Webhook → ここを呼ぶ
 *
 * Stripe 移行時は method を "STRIPE_CARD" に変え、
 * meta.stripePaymentIntentId を渡すだけでよい。
 */
import { prisma } from "@/lib/prisma";

export type PaymentMethod = "MOCK" | "STRIPE_CARD" | "PAYPAY" | "OFFLINE";

export interface FulfillmentResult {
  paymentId:      string;
  ticketId:       string;
  remainingCount: number;
  packageName:    string;
  price:          number;
}

export async function fulfillPayment(
  userId:    string,
  packageId: string,
  amount:    number,
  method:    PaymentMethod,
  meta: { stripePaymentIntentId?: string } = {},
): Promise<FulfillmentResult> {
  const pkg = await prisma.ticketPackage.findUniqueOrThrow({ where: { id: packageId } });

  // MOCK is a dev-only alias; store as OFFLINE in the DB
  const dbMethod = method === "MOCK" ? "OFFLINE" : method;

  const { payment, ticket } = await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.create({
      data: {
        userId,
        packageId,
        amount,
        method: dbMethod,
        status: "PAID",
        paidAt: new Date(),
        ...(meta.stripePaymentIntentId
          ? { stripePaymentIntentId: meta.stripePaymentIntentId }
          : {}),
      },
    });

    const ticket = await tx.userTicket.create({
      data: {
        userId,
        packageId,
        remainingCount: pkg.totalCount,
        status:         "ACTIVE",
        source:         "PAYMENT",
      },
    });

    return { payment, ticket };
  });

  return {
    paymentId:      payment.id,
    ticketId:       ticket.id,
    remainingCount: ticket.remainingCount,
    packageName:    pkg.name,
    price:          pkg.price,
  };
}
