import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { enrollmentScope } from "@/lib/scope";
import { Card } from "@/components/ui/card";
import { KpiTile, LabelCaps } from "@/components/brand/primitives";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { initials } from "@/lib/utils";

export default function CompanyOverview() {
  const principal = requireRole("COMPANY_VIEWER", "ADMIN");

  // Strictly tenant-scoped: a viewer only sees their own company's enrollments.
  const enrollments = db.enrollment.findMany({
    where: enrollmentScope(principal),
    include: { user: true, cohort: true, moduleProgress: true },
    orderBy: { createdAt: "desc" },
  });

  const total = enrollments.length;
  const completed = enrollments.filter((e) => e.status === "COMPLETED").length;
  const avg =
    total === 0
      ? 0
      : Math.round(
          enrollments.reduce(
            (a, e) => a + Math.round((e.moduleProgress.filter((m) => m.status === "COMPLETED").length / 24) * 100),
            0,
          ) / total,
        );
  const since = new Date(Date.now() - 14 * 864e5);
  const engaged = enrollments.filter((e) =>
    e.moduleProgress.some((m) => m.completedAt && m.completedAt > since),
  ).length;

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <KpiTile value={total} label="Your participants" color="#024794" />
        <KpiTile value={`${avg}%`} label="Avg. progress" color="#262161" />
        <KpiTile value={completed} label="Completed" color="#1c7d4d" />
        <KpiTile value={engaged} label="Active (14 days)" color="#662d91" />
      </div>

      <Card className="overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-hair-3 px-5 py-[18px]">
          <h4 className="text-[17px] text-ink">Your people's progress</h4>
          <LabelCaps>Read-only</LabelCaps>
        </div>
        <div className="grid grid-cols-[1.6fr_1fr_1.2fr_0.8fr] border-b border-hair-3 bg-soft-2 px-5 py-2.5 text-[10.5px] font-semibold uppercase tracking-[.07em] text-muted-3">
          <span>Participant</span>
          <span>Cohort</span>
          <span>Progress</span>
          <span>Status</span>
        </div>
        {enrollments.map((e) => {
          const pct = Math.round((e.moduleProgress.filter((m) => m.status === "COMPLETED").length / 24) * 100);
          return (
            <div
              key={e.id}
              className="grid grid-cols-[1.6fr_1fr_1.2fr_0.8fr] items-center border-b border-[#f1f3f8] px-5 py-3 last:border-0"
            >
              <span className="flex items-center gap-2.5">
                <Avatar label={initials(e.user.name)} size={30} />
                <span className="text-[13px] font-semibold text-ink">{e.user.name}</span>
              </span>
              <span className="text-[12.5px] text-muted">{e.cohort.name}</span>
              <span className="flex items-center gap-2">
                <span className="h-1.5 w-[110px] overflow-hidden rounded-pill bg-[#e3e7f1]">
                  <span
                    className="block h-full rounded-pill"
                    style={{ width: `${pct}%`, background: pct < 50 ? "#e0a32e" : "#024794" }}
                  />
                </span>
                <span className="text-[11.5px] text-muted-2">{pct}%</span>
              </span>
              <span>
                <Badge variant={pct < 50 ? "warning" : "success"} size="sm">
                  {pct < 50 ? "Behind" : "On track"}
                </Badge>
              </span>
            </div>
          );
        })}
        {enrollments.length === 0 && (
          <div className="px-5 py-6 text-[13px] text-muted">No participants from your company yet.</div>
        )}
      </Card>
      <p className="text-[12px] text-muted-3">
        As a company viewer you have read-only visibility into your organization's participants.
        You can't edit content, message participants, or see other companies' data.
      </p>
    </div>
  );
}
