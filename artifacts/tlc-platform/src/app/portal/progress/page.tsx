import { requireRole } from "@/lib/session";
import { getParticipantContext, deriveJourney } from "@/server/portal-data";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { LabelCaps } from "@/components/brand/primitives";
import { PillarBadge } from "@/components/brand/pillar-badge";
import { cn } from "@/lib/utils";
import { Check, Lock } from "lucide-react";

export default function ProgressPage() {
  const principal = requireRole("PARTICIPANT", "ADMIN");
  const enr = getParticipantContext(principal.id);
  if (!enr) return <Card className="p-8 text-muted">No active enrollment.</Card>;
  const journey = deriveJourney(enr);

  return (
    <div className="flex flex-col gap-5">
      <Card className="p-6">
        <LabelCaps className="mb-2">6-month progress</LabelCaps>
        <div className="flex items-baseline gap-2">
          <span className="font-display text-[34px] leading-none text-eq">{journey.pct}%</span>
          <span className="text-[13px] text-muted-2">
            {journey.completed} of {journey.totalWeeks} weeks complete
          </span>
        </div>
        <div className="mt-3 max-w-[640px]">
          <Progress value={journey.pct} height={10} />
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="mb-4 font-display text-[18px] text-ink">Weekly modules</h3>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {enr.moduleProgress.map((m) => (
            <div
              key={m.id}
              className={cn(
                "flex items-center gap-3 rounded-[11px] border px-3.5 py-3",
                m.status === "COMPLETED"
                  ? "border-[#d6ecdf] bg-[#f5fbf7]"
                  : m.status === "AVAILABLE"
                    ? "border-eq/30 bg-[#f6f9fe]"
                    : "border-hair-2 bg-white",
              )}
            >
              <span className="text-[12px] font-semibold text-muted-3">W{m.weekNo}</span>
              {m.module && <PillarBadge pillar={m.module.pillar} size="sm" />}
              <span className="flex-1 truncate text-[13px] font-medium text-ink">
                {m.module?.title ?? `Week ${m.weekNo}`}
              </span>
              {m.status === "COMPLETED" ? (
                <Check className="h-4 w-4 text-success" />
              ) : m.status === "LOCKED" ? (
                <Lock className="h-3.5 w-3.5 text-muted-3" />
              ) : (
                <span className="text-[10px] font-semibold uppercase tracking-label text-eq">Now</span>
              )}
            </div>
          ))}
        </div>
      </Card>

      {enr.certificate ? (
        <Card className="flex items-center justify-between p-6">
          <div>
            <h3 className="font-display text-[18px] text-ink">Completion certificate</h3>
            <p className="text-[13px] text-muted-2">Serial {enr.certificate.serial}</p>
          </div>
          <a
            href={`/portal/certificate`}
            className="inline-flex h-11 items-center rounded-[9px] bg-eq px-[18px] text-[13.5px] font-semibold text-white"
          >
            View certificate
          </a>
        </Card>
      ) : journey.pct === 100 ? (
        <Card className="p-6 text-[13px] text-muted">
          Your certificate is being prepared and will appear here shortly.
        </Card>
      ) : null}
    </div>
  );
}
