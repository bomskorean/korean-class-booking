// Stripe（カード＋PayPay）— PRD 3.6 / 6.2
import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2024-06-20",
});

// PayPay は payment_method_types に "paypay" を含めるだけで Checkout に表示される（JP アカウント）。
export async function createCheckout(params: {
  packageName: string;
  amount: number; // 税込（円）
  userId: string;
  packageId: string;
  successUrl: string;
  cancelUrl: string;
}) {
  return stripe.checkout.sessions.create({
    mode: "payment",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payment_method_types: ["card", "paypay"] as any,
    line_items: [{
      quantity: 1,
      price_data: {
        currency: "jpy",
        unit_amount: params.amount,
        product_data: { name: `${params.packageName}（馬賑韓国語教室）` },
      },
    }],
    metadata: { userId: params.userId, packageId: params.packageId },
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
  });
}
