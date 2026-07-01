import { Router, type IRouter } from "express";
import { RefundPaymentBody } from "@workspace/api-zod";
import { db, schema, eq, desc } from "../lib/db";
import { asyncHandler } from "../lib/http";
import { requireCapability } from "../lib/principal";
import { audit } from "../lib/services";

const router: IRouter = Router();

/** Admin billing reconciliation view. */
router.get(
  "/admin/payments",
  asyncHandler(async (req, res) => {
    await requireCapability(req, "billing:manage");
    const payments = await db.query.payment.findMany({
      orderBy: [desc(schema.payment.createdAt)],
      limit: 100,
      with: {
        enrollment: {
          with: {
            user: { columns: { id: true, name: true, email: true } },
            cohort: { columns: { id: true, name: true } },
          },
        },
        company: { columns: { id: true, name: true } },
        refunds: { columns: { id: true, amount: true } },
      },
    });
    res.json(
      payments.map((p) => ({
        id: p.id,
        amount: p.amount,
        currency: p.currency,
        status: p.status,
        processor: p.processor,
        createdAt: p.createdAt,
        enrollment: p.enrollment
          ? {
              user: p.enrollment.user ?? null,
              cohort: p.enrollment.cohort ?? null,
            }
          : null,
        company: p.company ?? null,
        refunds: p.refunds,
      })),
    );
  }),
);

/** Issue a refund (simulated — records a Refund row, updates Payment status). */
router.post(
  "/admin/payments/:id/refund",
  asyncHandler(async (req, res) => {
    const principal = await requireCapability(req, "billing:manage");
    const { amount, reason } = RefundPaymentBody.parse(req.body ?? {});
    const paymentId = String(req.params.id);
    const payment = await db.query.payment.findFirst({ where: eq(schema.payment.id, paymentId) });
    if (!payment) {
      res.json({ ok: false, error: "Payment not found" });
      return;
    }
    if (payment.status !== "PAID" && payment.status !== "PARTIALLY_REFUNDED") {
      res.json({ ok: false, error: "Only paid payments can be refunded" });
      return;
    }
    const refundAmount = amount ?? payment.amount;
    await db.transaction(async (tx) => {
      await tx.insert(schema.refund).values({
        paymentId,
        amount: refundAmount,
        reason: reason ?? null,
        status: "processed",
        processedById: principal.id,
      });
      await tx
        .update(schema.payment)
        .set({ status: refundAmount >= payment.amount ? "REFUNDED" : "PARTIALLY_REFUNDED" })
        .where(eq(schema.payment.id, paymentId));
    });
    await audit({
      actorId: principal.id,
      action: "payment.refund",
      entity: "Payment",
      entityId: paymentId,
      meta: { refundAmount, reason },
    });
    res.json({ ok: true });
  }),
);

export default router;
