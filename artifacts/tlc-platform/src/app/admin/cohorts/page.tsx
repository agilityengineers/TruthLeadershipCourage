import { requireRole } from "@/lib/session";
import { useListCohorts } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatPrice } from "@/lib/utils";
import { CloneCohortDialog } from "@/components/admin/admin-dialogs";

const STATUS_VARIANT: Record<string, "success" | "default" | "warning" | "neutral"> = {
  RUNNING: "success",
  ENROLLING: "default",
  DRAFT: "warning",
  COMPLETED: "neutral",
  ARCHIVED: "neutral",
};

export default function CohortsPage() {
  requireRole("ADMIN");
  const { data } = useListCohorts();
  const cohorts = data ?? [];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-[22px] text-ink">Cohorts</h2>
          <p className="text-[13px] text-muted-2">
            One program (TLC), many cohorts. Launch the next one by cloning — never a code change.
          </p>
        </div>
        <CloneCohortDialog cohorts={cohorts.map((c) => ({ id: c.id, name: c.name }))} />
      </div>

      <Card className="overflow-hidden p-0">
        <div className="grid grid-cols-[1.4fr_1fr_1fr_0.8fr_0.8fr_0.8fr] border-b border-hair-3 bg-soft-2 px-5 py-2.5 text-[10.5px] font-semibold uppercase tracking-[.07em] text-muted-3">
          <span>Cohort</span>
          <span>Dates</span>
          <span>Trainer</span>
          <span>Price</span>
          <span>Seats</span>
          <span>Status</span>
        </div>
        {cohorts.map((c) => (
          <div
            key={c.id}
            className="grid grid-cols-[1.4fr_1fr_1fr_0.8fr_0.8fr_0.8fr] items-center border-b border-[#f1f3f8] px-5 py-3 last:border-0"
          >
            <span className="text-[13px] font-semibold text-ink">
              {c.name}
              {c.isPrivate && <span className="ml-1.5 text-[11px] font-normal text-mq">· private</span>}
            </span>
            <span className="text-[12px] text-muted">
              {formatDate(c.startDate, { month: "short", year: "numeric" })} –{" "}
              {formatDate(c.endDate, { month: "short", year: "numeric" })}
            </span>
            <span className="text-[12.5px] text-muted">{c.trainerName ?? "—"}</span>
            <span className="text-[12.5px] font-semibold text-ink">
              {c.price > 0 ? formatPrice(c.price, c.currency) : "—"}
            </span>
            <span className="text-[12.5px] text-ink">
              {c.enrollmentCount}
              {c.capacity > 0 ? ` / ${c.capacity}` : ""}
            </span>
            <span>
              <Badge variant={STATUS_VARIANT[c.status] ?? "neutral"} size="sm">
                {c.status}
              </Badge>
            </span>
          </div>
        ))}
      </Card>
    </div>
  );
}
