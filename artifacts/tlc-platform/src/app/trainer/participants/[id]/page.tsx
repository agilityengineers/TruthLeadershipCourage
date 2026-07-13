import { Link, useParams } from "wouter";
import NotFound from "@/pages/not-found";
import { requireRole } from "@/lib/session";
import { useGetTrainerParticipant } from "@workspace/api-client-react";
import { currentWeek } from "@/lib/cohort";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { PillarBadge } from "@/components/brand/pillar-badge";
import { LabelCaps } from "@/components/brand/primitives";
import { initials, formatDate, cn } from "@/lib/utils";
import { computeProgress } from "@/components/trainer/progress-util";
import { IssueCertificateButton } from "@/components/trainer/issue-certificate-button";
import { Check, Lock } from "lucide-react";

const TOTAL_WEEKS = 24;

export default function ParticipantDetailPage() {
  const { id } = useParams();
  requireRole("TRAINER", "ADMIN");

  const { data: enrollment } = useGetTrainerParticipant(id ?? "");

  if (!enrollment) return <NotFound />;

  const completed = enrollment.moduleProgress.filter((m) => m.status === "COMPLETED").length;
  const totalModules = Math.max(enrollment.moduleProgress.length, 1);
  const week = currentWeek(enrollment.cohort.startDate ?? new Date().toISOString(), TOTAL_WEEKS);
  const stats = computeProgress(completed, totalModules, week, TOTAL_WEEKS, enrollment.status === "COMPLETED");
  const name = enrollment.user.name ?? enrollment.user.email;

  return (
    <div className="flex flex-col gap-5">
      <Link href="/trainer/participants" className="text-[12px] font-semibold text-eq hover:underline">
        ← All participants
      </Link>

      <Card className="flex flex-wrap items-center gap-4 p-6">
        <Avatar label={initials(name)} size={52} style={{ background: "#b8d8e6", color: "#262161" }} />
        <div className="min-w-0">
          <h2 className="font-display text-[22px] text-ink">{name}</h2>
          <div className="text-[13px] text-muted-2">
            {enrollment.user.email} · {enrollment.companyName ?? "Independent"} ·{" "}
            {enrollment.cohort.name}
          </div>
        </div>
        <div className="ml-auto text-right">
          <div className="font-display text-[30px] leading-none text-eq">{stats.pct}%</div>
          <div className="mt-1 text-[11px] font-medium text-muted-2">
            {completed} of {totalModules} modules
          </div>
        </div>
        <div className="w-full">
          <Progress value={stats.pct} height={10} />
        </div>
      </Card>

      {enrollment.status === "COMPLETED" && (
        <Card className="flex flex-wrap items-center justify-between gap-3 p-6">
          <div className="min-w-0">
            <LabelCaps className="mb-1">Completion certificate</LabelCaps>
            {enrollment.certificate ? (
              <p className="text-[13px] text-muted">
                Issued {formatDate(enrollment.certificate.issuedAt)} · Serial{" "}
                <span className="font-semibold text-ink">{enrollment.certificate.serial}</span>
              </p>
            ) : (
              <p className="text-[13px] text-muted">
                This participant has completed all weeks. Issue their certificate when ready.
              </p>
            )}
          </div>
          {!enrollment.certificate && <IssueCertificateButton enrollmentId={enrollment.id} />}
        </Card>
      )}

      <Card className="p-6">
        <LabelCaps className="mb-4">Week-by-week progress</LabelCaps>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {enrollment.moduleProgress.map((m) => (
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
                <span className="flex items-center gap-1.5 text-[10px] font-semibold text-success">
                  {m.completedAt ? formatDate(m.completedAt, { month: "short", day: "numeric" }) : ""}
                  <Check className="h-4 w-4" />
                </span>
              ) : m.status === "LOCKED" ? (
                <Lock className="h-3.5 w-3.5 text-muted-3" />
              ) : (
                <span className="text-[10px] font-semibold uppercase tracking-label text-eq">Now</span>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
