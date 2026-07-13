import { requireRole } from "@/lib/session";
import { useGetParticipantContext, type ParticipantContext } from "@workspace/api-client-react";
import { derivePhase, currentWeek } from "@/lib/cohort";
import { Card } from "@/components/ui/card";
import { LabelCaps } from "@/components/brand/primitives";
import { PillarBadge } from "@/components/brand/pillar-badge";
import { cn } from "@/lib/utils";
import { Check, Lock } from "lucide-react";

/**
 * The journey, module by module: a position on the path (Session 1 →
 * Intersession → Session 2), not a bar filling up. Modules complete on the
 * program's own schedule as their practice sessions pass.
 */
export default function ProgressPage() {
  requireRole("PARTICIPANT", "ADMIN");
  const { data: enr } = useGetParticipantContext();
  if (!enr) return <Card className="p-8 text-muted">No active enrollment.</Card>;

  const rows = [...enr.moduleProgress].sort(
    (a, b) => (a.module?.order ?? a.weekNo) - (b.module?.order ?? b.weekNo),
  );
  const phase = derivePhase(enr.cohort.startDate, enr.cohort.endDate);
  const week = phase === "during" ? currentWeek(enr.cohort.startDate, 24) : null;
  const session1 = rows.filter((r) => (r.module?.segment ?? "SESSION_1") === "SESSION_1");
  const session2 = rows.filter((r) => r.module?.segment === "SESSION_2");
  const completed = rows.filter((r) => r.status === "COMPLETED").length;
  const lastS1Week = Math.max(...session1.map((r) => r.module?.practiceWeekNo ?? 12), 12);
  const firstS2Week = session2.length
    ? Math.min(...session2.map((r) => r.module?.lessonWeekNo ?? 21))
    : 21;
  const inIntersession = week !== null && week > lastS1Week && week < firstS2Week;

  return (
    <div className="flex flex-col gap-5">
      <Card className="p-6">
        <LabelCaps className="mb-2">Where you are</LabelCaps>
        <div className="flex items-baseline gap-2">
          <span className="font-display text-[26px] leading-none text-indigo">
            {phase === "before"
              ? "Before day one"
              : phase === "after"
                ? "Graduated"
                : inIntersession
                  ? `Intersession · week ${week! - lastS1Week} of ${firstS2Week - lastS1Week - 1}`
                  : `Week ${week} of 24`}
          </span>
          <span className="text-[13px] text-muted-2">
            {completed} of {rows.length} modules lived
          </span>
        </div>
      </Card>

      <SegmentCard title="Session 1 · Modules 1–6" rows={session1} />

      <Card
        className={cn(
          "flex items-center justify-between p-5",
          inIntersession ? "border-teal bg-teal-soft" : "",
        )}
      >
        <div>
          <h3 className="font-display text-[15px] font-semibold text-teal">Intersession</h3>
          <p className="text-[12.5px] text-muted-2">
            Eight weeks of living it — with your two coaching 1:1s.
          </p>
        </div>
        {inIntersession && (
          <span className="text-[10px] font-semibold uppercase tracking-label text-teal">Now</span>
        )}
      </Card>

      <SegmentCard title="Session 2 · Modules 7–8" rows={session2} />

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
      ) : null}
    </div>
  );
}

type Row = ParticipantContext["moduleProgress"][number];

function SegmentCard({ title, rows }: { title: string; rows: Row[] }) {
  if (rows.length === 0) return null;
  return (
    <Card className="p-6">
      <h3 className="mb-4 font-display text-[16px] text-ink">{title}</h3>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {rows.map((m) => (
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
            <span className="text-[12px] font-semibold text-muted-3">M{m.module?.order ?? "?"}</span>
            {m.module && <PillarBadge pillar={m.module.pillar} size="sm" />}
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-medium text-ink">{m.module?.title}</div>
              {m.module?.lessonWeekNo && (
                <div className="text-[11px] text-muted-3">
                  Weeks {m.module.lessonWeekNo}–{m.module.practiceWeekNo}
                </div>
              )}
            </div>
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
  );
}
