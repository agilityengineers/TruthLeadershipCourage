"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireCapability } from "@/lib/session";
import { audit } from "@/lib/audit";
import { stripe } from "@/lib/stripe";

/**
 * Issue a refund (admin-side). Attempts a Stripe refund when configured;
 * always records a Refund row and updates the Payment status. No card UI.
 */
export async function refundPayment(input: { paymentId: string; amount?: number; reason?: string }) {
  const principal = await requireCapability("billing:manage");
  const { paymentId, amount, reason } = z
    .object({ paymentId: z.string(), amount: z.number().optional(), reason: z.string().optional() })
    .parse(input);

  const payment = await db.payment.findUnique({ where: { id: paymentId } });
  if (!payment) return { ok: false as const, error: "Payment not found" };
  if (payment.status !== "PAID" && payment.status !== "PARTIALLY_REFUNDED") {
    return { ok: false as const, error: "Only paid payments can be refunded" };
  }

  const refundAmount = amount ?? payment.amount;
  let externalId: string | undefined;

  if (stripe && payment.processor === "STRIPE" && payment.externalId?.startsWith("pi_")) {
    try {
      const r = await stripe.refunds.create({
        payment_intent: payment.externalId,
        amount: refundAmount,
      });
      externalId = r.id;
    } catch (e) {
      return { ok: false as const, error: `Stripe refund failed: ${(e as Error).message}` };
    }
  }

  await db.$transaction([
    db.refund.create({
      data: {
        paymentId,
        amount: refundAmount,
        reason,
        status: "processed",
        externalId,
        processedById: principal.id,
      },
    }),
    db.payment.update({
      where: { id: paymentId },
      data: { status: refundAmount >= payment.amount ? "REFUNDED" : "PARTIALLY_REFUNDED" },
    }),
  ]);

  await audit({
    actorId: principal.id,
    action: "payment.refund",
    entity: "Payment",
    entityId: paymentId,
    meta: { refundAmount, reason },
  });
  revalidatePath("/admin/billing");
  return { ok: true as const };
}
