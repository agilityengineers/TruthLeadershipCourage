import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { fulfillEnrollment } from "@/server/fulfillment";

export const dynamic = "force-dynamic";

/**
 * Stripe webhook. On checkout.session.completed / payment_intent.succeeded we
 * fulfill the enrollment (mark paid, activate seat, ship workbook, welcome
 * email). The enrollmentId travels in metadata. NOTE: This is the ONLY place
 * payment state changes from the customer flow — no card UI in the app.
 */
export async function POST(req: Request) {
  if (!stripe) return new Response("Stripe not configured", { status: 503 });

  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const body = await req.text();

  let event;
  try {
    event = secret && sig ? stripe.webhooks.constructEvent(body, sig, secret) : JSON.parse(body);
  } catch (err) {
    return new Response(`Webhook signature error: ${(err as Error).message}`, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed" || event.type === "payment_intent.succeeded") {
      const obj = event.data.object as {
        metadata?: { enrollmentId?: string };
        id?: string;
        amount_total?: number;
        amount?: number;
        payment_intent?: string;
      };
      const enrollmentId = obj.metadata?.enrollmentId;
      if (enrollmentId) {
        await fulfillEnrollment({
          enrollmentId,
          externalId: (obj.payment_intent as string) ?? obj.id,
          processor: "STRIPE",
          amount: obj.amount_total ?? obj.amount,
        });
      }
    } else if (event.type === "charge.refunded") {
      const obj = event.data.object as { payment_intent?: string };
      if (obj.payment_intent) {
        await db.payment.updateMany({
          where: { externalId: obj.payment_intent },
          data: { status: "REFUNDED" },
        });
      }
    }
  } catch (err) {
    return new Response(`Handler error: ${(err as Error).message}`, { status: 500 });
  }

  return Response.json({ received: true });
}
