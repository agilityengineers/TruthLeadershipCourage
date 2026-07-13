import { requireRole } from "@/lib/session";
import { useListCohorts, useGetCohortFormOptions } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
<<<<<<< HEAD
import { Button } from "@/components/ui/button";
import { formatDate, formatPrice } from "@/lib/utils";
=======
import { formatDateOnly, formatPrice } from "@/lib/utils";
>>>>>>> 5200816f00feec6a3cfad873d9fc42eb533f97f8
import { CloneCohortDialog, CreateCohortDialog, EditCohortDialog } from "@/components/admin/admin-dialogs";
import { useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const STATUS_VARIANT: Record<string, "success" | "default" | "warning" | "neutral"> = {
  RUNNING: "success",
  ENROLLING: "default",
  DRAFT: "warning",
  COMPLETED: "neutral",
  ARCHIVED: "neutral",
};

const PUBLIC_STATUSES = new Set(["ENROLLING", "RUNNING"]);

function ProgramSetupBanner() {
  const qc = useQueryClient();
  const [loading, setLoading] = useState(false);

  async function handleSetup() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/setup/bootstrap", { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { message?: string }).message ?? "Setup failed");
      }
      toast.success("TLC program set up — you can now create cohorts.");
      qc.invalidateQueries();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not set up the program.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="flex items-start gap-4 border-amber-200 bg-amber-50 p-5">
      <div className="flex-1">
        <p className="text-[14px] font-semibold text-amber-900">Program not set up yet</p>
        <p className="mt-0.5 text-[13px] text-amber-800">
          Before you can create cohorts, the TLC program content (modules, assessments, and live-it items) needs to be
          initialized. This only needs to happen once.
        </p>
      </div>
      <Button size="sm" variant="outline" onClick={handleSetup} disabled={loading} className="shrink-0 border-amber-300 bg-white hover:bg-amber-50">
        {loading ? "Setting up…" : "Set up TLC program"}
      </Button>
    </Card>
  );
}

export default function CohortsPage() {
  requireRole("ADMIN");
  const { data } = useListCohorts();
  const { data: options } = useGetCohortFormOptions();
  const cohorts = data ?? [];
  const noProgramYet = options !== undefined && options.programs.length === 0;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-[22px] text-ink">Cohorts</h2>
          <p className="text-[13px] text-muted-2">
            One program (TLC), many cohorts. Create the next one, or clone a past cohort's schedule — never a code
            change.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          {cohorts.length > 0 && (
            <CloneCohortDialog cohorts={cohorts.map((c) => ({ id: c.id, name: c.name }))} />
          )}
          {!noProgramYet && <CreateCohortDialog />}
        </div>
      </div>

      {noProgramYet && <ProgramSetupBanner />}

      {cohorts.length === 0 && !noProgramYet ? (
        <Card className="flex flex-col items-center gap-3 p-10 text-center">
          <p className="font-display text-[17px] text-ink">No cohorts yet</p>
          <p className="max-w-[420px] text-[13px] text-muted-2">
            Create your first cohort to open enrollment and generate its public landing page. Every future cohort can
            then be launched by cloning this one.
          </p>
          <CreateCohortDialog />
        </Card>
      ) : cohorts.length > 0 ? (
        <Card className="overflow-hidden p-0">
          <div className="grid grid-cols-[1.5fr_1fr_1fr_0.7fr_0.7fr_0.8fr_1fr] border-b border-hair-3 bg-soft-2 px-5 py-2.5 text-[10.5px] font-semibold uppercase tracking-[.07em] text-muted-3">
            <span>Cohort</span>
            <span>Dates</span>
            <span>Trainer</span>
            <span>Price</span>
            <span>Seats</span>
            <span>Status</span>
            <span className="text-right">Actions</span>
          </div>
          {cohorts.map((c) => {
            const publicHref = `/cohort/${c.slug}`;
            return (
              <div
                key={c.id}
                className="grid grid-cols-[1.5fr_1fr_1fr_0.7fr_0.7fr_0.8fr_1fr] items-center border-b border-[#f1f3f8] px-5 py-3 last:border-0"
              >
                <span className="text-[13px] font-semibold text-ink">
                  {c.name}
                  {c.isPrivate && <span className="ml-1.5 text-[11px] font-normal text-mq">· private</span>}
                </span>
                <span className="text-[12px] text-muted">
                  {formatDateOnly(c.startDate, { month: "short", year: "numeric" })} –{" "}
                  {formatDateOnly(c.endDate, { month: "short", year: "numeric" })}
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
                <span className="flex items-center justify-end gap-3">
                  <EditCohortDialog cohort={c} />
                  {!c.isPrivate && PUBLIC_STATUSES.has(c.status) && (
                    <a
                      href={publicHref}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[12px] font-semibold text-muted-2 hover:text-ink"
                    >
                      View page ↗
                    </a>
                  )}
                </span>
              </div>
            );
          })}
        </Card>
      ) : null}
    </div>
  );
}
