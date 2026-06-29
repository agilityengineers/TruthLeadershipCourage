import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KpiTile } from "@/components/brand/primitives";
import { formatPrice, formatDate } from "@/lib/utils";
import { RefundButton } from "@/components/admin/refund-button";

const PAY_VARIANT: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  PAID: "success",
  PENDING: "warning",
  REFUNDED: "neutral",
  PARTIALLY_REFUNDED: "neutral",
  FAILED: "danger",
};

export default function BillingPage() {
  requireRole("ADMIN");
  const payments = db.payment.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      enrollment: { include: { user: true, cohort: true } },
      company: true,
      refunds: true,
    },
  });

  const collected = payments.filter((p) => p.status === "PAID").reduce((a, p) => a + p.amount, 0);
  const pending = payments.filter((p) => p.status === "PENDING").reduce((a, p) => a + p.amount, 0);
  const refunded = payments
    .flatMap((p) => p.refunds)
    .reduce((a, r) => a + r.amount, 0);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="font-display text-[22px] text-ink">Billing reconciliation</h2>
        <p className="text-[13px] text-muted-2">
          Read-only operational view. Charges run server-side via Stripe / ThriveCart.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        <KpiTile value={formatPrice(collected)} label="Collected" color="#1c7d4d" />
        <KpiTile value={formatPrice(pending)} label="Pending" color="#b8860b" />
        <KpiTile value={formatPrice(refunded)} label="Refunded" color="#b03a52" />
      </div>

      <Card className="overflow-hidden p-0">
        <div className="grid grid-cols-[1.4fr_1fr_0.8fr_0.8fr_0.8fr_0.7fr] border-b border-hair-3 bg-soft-2 px-5 py-2.5 text-[10.5px] font-semibold uppercase tracking-[.07em] text-muted-3">
          <span>Participant</span>
          <span>Cohort</span>
          <span>Amount</span>
          <span>Processor</span>
          <span>Status</span>
          <span>Action</span>
        </div>
        {payments.map((p) => (
          <div
            key={p.id}
            className="grid grid-cols-[1.4fr_1fr_0.8fr_0.8fr_0.8fr_0.7fr] items-center border-b border-[#f1f3f8] px-5 py-3 last:border-0"
          >
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-semibold text-ink">
                {p.enrollment?.user.name ?? p.company?.name ?? "—"}
              </span>
              <span className="block text-[11px] text-muted-3">
                {formatDate(p.createdAt)}
              </span>
            </span>
            <span className="text-[12.5px] text-muted">{p.enrollment?.cohort.name ?? "—"}</span>
            <span className="text-[12.5px] font-semibold text-ink">{formatPrice(p.amount, p.currency)}</span>
            <span className="text-[12px] text-muted">{p.processor}</span>
            <span>
              <Badge variant={PAY_VARIANT[p.status] ?? "neutral"} size="sm">
                {p.status}
              </Badge>
            </span>
            <span>
              {p.status === "PAID" || p.status === "PARTIALLY_REFUNDED" ? (
                <RefundButton paymentId={p.id} maxAmount={p.amount} />
              ) : (
                <span className="text-[12px] text-muted-3">—</span>
              )}
            </span>
          </div>
        ))}
        {payments.length === 0 && <div className="px-5 py-6 text-[13px] text-muted">No payments yet.</div>}
      </Card>
    </div>
  );
}
