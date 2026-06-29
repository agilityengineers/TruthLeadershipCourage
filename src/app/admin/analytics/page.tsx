import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { Card } from "@/components/ui/card";
import { LabelCaps } from "@/components/brand/primitives";

export const dynamic = "force-dynamic";

function pct(n: number, d: number) {
  return d > 0 ? Math.round((n / d) * 100) : 0;
}

export default async function AnalyticsPage() {
  await requireRole("ADMIN");

  const cohorts = await db.cohort.findMany({
    where: { status: { in: ["RUNNING", "COMPLETED", "ENROLLING"] } },
    include: {
      enrollments: { include: { moduleProgress: true, company: true } },
    },
    orderBy: { startDate: "desc" },
  });

  // Per-cohort completion + engagement.
  const cohortStats = cohorts.map((c) => {
    const enrs = c.enrollments;
    const avgProgress =
      enrs.length === 0
        ? 0
        : Math.round(
            enrs.reduce(
              (a, e) => a + pct(e.moduleProgress.filter((m) => m.status === "COMPLETED").length, 24),
              0,
            ) / enrs.length,
          );
    const completed = enrs.filter((e) => e.status === "COMPLETED").length;
    // Engagement proxy: participants who completed a module in the last 14 days.
    const since = new Date(Date.now() - 14 * 864e5);
    const engaged = enrs.filter((e) =>
      e.moduleProgress.some((m) => m.completedAt && m.completedAt > since),
    ).length;
    return {
      id: c.id,
      name: c.name,
      enrolled: enrs.length,
      avgProgress,
      completionRate: pct(completed, enrs.length),
      engagement: pct(engaged, enrs.length),
    };
  });

  // Company-level rollups (Tier-3 viewers see these for their own company).
  const companies = await db.company.findMany({
    include: { enrollments: { include: { moduleProgress: true } } },
  });
  const companyStats = companies
    .map((co) => {
      const enrs = co.enrollments;
      const avg =
        enrs.length === 0
          ? 0
          : Math.round(
              enrs.reduce(
                (a, e) => a + pct(e.moduleProgress.filter((m) => m.status === "COMPLETED").length, 24),
                0,
              ) / enrs.length,
            );
      return { id: co.id, name: co.name, participants: enrs.length, avg };
    })
    .filter((s) => s.participants > 0);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="font-display text-[22px] text-ink">Analytics</h2>
        <p className="text-[13px] text-muted-2">Completion, engagement, and company rollups.</p>
      </div>

      <Card className="p-6">
        <LabelCaps className="mb-4">Per-cohort completion &amp; engagement</LabelCaps>
        <div className="flex flex-col gap-4">
          {cohortStats.map((s) => (
            <div key={s.id}>
              <div className="mb-1.5 flex items-center justify-between text-[13px]">
                <span className="font-semibold text-ink">{s.name}</span>
                <span className="text-muted-2">
                  {s.enrolled} enrolled · {s.completionRate}% completed · {s.engagement}% engaged (14d)
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-pill bg-[#e3e7f1]">
                <div className="h-full rounded-pill bg-gradient-to-r from-eq to-mq" style={{ width: `${s.avgProgress}%` }} />
              </div>
              <div className="mt-1 text-[11px] text-muted-3">Avg progress {s.avgProgress}%</div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <LabelCaps className="mb-4">Company rollups</LabelCaps>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {companyStats.map((s) => (
            <div key={s.id} className="rounded-[12px] border border-hair-2 p-4">
              <div className="text-[14px] font-semibold text-ink">{s.name}</div>
              <div className="mt-1 text-[12px] text-muted-2">{s.participants} participants</div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="font-display text-[24px] text-eq">{s.avg}%</span>
                <span className="text-[11px] text-muted-2">avg progress</span>
              </div>
            </div>
          ))}
          {companyStats.length === 0 && <p className="text-[13px] text-muted">No company data yet.</p>}
        </div>
      </Card>
    </div>
  );
}
