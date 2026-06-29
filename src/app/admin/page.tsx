import Link from "next/link";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { Card } from "@/components/ui/card";
import { KpiTile, LabelCaps } from "@/components/brand/primitives";
import { Avatar } from "@/components/ui/avatar";
import { initials } from "@/lib/utils";

export const dynamic = "force-dynamic";

const TIERS = [
  { tier: "TIER 1", name: "Companies", desc: "Corporate clients. Own seats, billing entity, sub-users.", color: "#024794", bg: "#fafbff" },
  { tier: "TIER 2", name: "Participants", desc: "Individual logins under a company. Take the program.", color: "#262161", bg: "#fafbff" },
  { tier: "TIER 3", name: "Company Viewers", desc: "Read-only. Client managers watch their people's progress.", color: "#b8860b", bg: "#fffdf6" },
  { tier: "TIER 4", name: "Trainers & Admins", desc: "Operational roles. Run cohorts, content, and the system.", color: "#662d91", bg: "#fdfaff" },
];

export default async function AdminOverview() {
  await requireRole("ADMIN");

  const [activeCohorts, companyCount, enrolledCount, trainerCount, companies, runningCohorts, trainers] =
    await Promise.all([
      db.cohort.count({ where: { status: "RUNNING" } }),
      db.company.count({ where: { status: "ACTIVE" } }),
      db.enrollment.count({ where: { status: { in: ["ACTIVE", "COMPLETED"] } } }),
      db.user.count({ where: { role: "TRAINER" } }),
      db.company.findMany({
        take: 5,
        orderBy: { createdAt: "asc" },
        include: {
          seats: true,
          enrollments: { include: { cohort: true } },
          users: { where: { role: "COMPANY_VIEWER" } },
        },
      }),
      db.cohort.findMany({
        where: { status: { in: ["RUNNING", "ENROLLING"] } },
        orderBy: { startDate: "asc" },
        include: { _count: { select: { enrollments: true } } },
      }),
      db.user.findMany({
        where: { role: "TRAINER" },
        include: { trainerCohorts: { include: { _count: { select: { enrollments: true } } } } },
      }),
    ]);

  return (
    <div className="flex flex-col gap-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <KpiTile value={activeCohorts} label="Active cohorts" color="#024794" />
        <KpiTile value={companyCount} label="Client companies" color="#262161" />
        <KpiTile value={enrolledCount} label="Enrolled participants" color="#662d91" />
        <KpiTile value={trainerCount} label="Trainers" color="#1c1a33" />
      </div>

      {/* Access hierarchy */}
      <Card className="p-[22px]">
        <LabelCaps className="mb-1">Access hierarchy</LabelCaps>
        <h4 className="mb-4 font-display text-[18px] text-ink">Four tiers, one tenant tree</h4>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          {TIERS.map((t) => (
            <div
              key={t.tier}
              className="rounded-[11px] border border-[#d8def0] p-4"
              style={{ borderTop: `3px solid ${t.color}`, background: t.bg }}
            >
              <div className="mb-2 text-[10.5px] font-semibold tracking-[.08em]" style={{ color: t.color }}>
                {t.tier}
              </div>
              <div className="mb-1.5 text-[14px] font-semibold text-ink">{t.name}</div>
              <p className="text-[12px] leading-relaxed text-[#6c7088]">{t.desc}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid items-start gap-5 lg:grid-cols-[1fr_340px]">
        {/* Companies table */}
        <Card className="min-w-0 overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-hair-3 px-5 py-[18px]">
            <h4 className="text-[17px] text-ink">Companies</h4>
            <Link href="/admin/companies" className="text-[12px] font-semibold text-eq">
              View all {companyCount}
            </Link>
          </div>
          <div className="grid grid-cols-[1.8fr_1fr_1fr_0.9fr] border-b border-hair-3 bg-soft-2 px-5 py-2.5 text-[10.5px] font-semibold uppercase tracking-[.07em] text-muted-3">
            <span>Company</span>
            <span>Cohort</span>
            <span>Seats</span>
            <span>Viewers</span>
          </div>
          {companies.map((c) => {
            const cohortName = c.enrollments[0]?.cohort.name ?? "—";
            const assigned = c.seats.filter((s) => s.status !== "AVAILABLE").length;
            return (
              <div
                key={c.id}
                className="grid grid-cols-[1.8fr_1fr_1fr_0.9fr] items-center border-b border-[#f1f3f8] px-5 py-3 last:border-0"
              >
                <span className="flex items-center gap-2.5">
                  <span className="flex h-[30px] w-[30px] items-center justify-center rounded-[8px] bg-[#eef2fb] text-[12px] font-bold text-eq">
                    {c.name[0]}
                  </span>
                  <span className="truncate text-[13px] font-semibold text-ink">{c.name}</span>
                </span>
                <span className="text-[12.5px] text-muted">{cohortName}</span>
                <span className="text-[12.5px] font-semibold text-ink">
                  {assigned} / {c.seats.length || c.enrollments.length}
                </span>
                <span className="text-[12.5px] text-muted">{c.users.length}</span>
              </div>
            );
          })}
          {companies.length === 0 && <div className="px-5 py-6 text-[13px] text-muted">No companies yet.</div>}
        </Card>

        <div className="flex flex-col gap-[18px]">
          {/* Cohorts running now */}
          <Card className="p-5">
            <LabelCaps className="mb-3.5">Cohorts running now</LabelCaps>
            <div className="flex flex-col gap-3">
              {runningCohorts.map((c) => {
                const pct =
                  c.capacity > 0 ? Math.min(100, Math.round((c._count.enrollments / c.capacity) * 100)) : 0;
                const barColor =
                  c.status === "ENROLLING" ? "#662d91" : c.isPrivate ? "#262161" : "#024794";
                return (
                  <div key={c.id}>
                    <div className="mb-1.5 flex items-baseline justify-between">
                      <span className="text-[13px] font-semibold text-ink">{c.name}</span>
                      <span className="text-[11px] text-muted-2">
                        {c.status === "ENROLLING" ? "Enrolling" : `Running`} · {c._count.enrollments} seats
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-pill bg-[#e3e7f1]">
                      <div className="h-full rounded-pill" style={{ width: `${pct}%`, background: barColor }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Trainers */}
          <Card className="p-5">
            <LabelCaps className="mb-3.5">Trainers</LabelCaps>
            <div className="flex flex-col gap-3">
              {trainers.map((t) => {
                const participants = t.trainerCohorts.reduce((a, c) => a + c._count.enrollments, 0);
                return (
                  <div key={t.id} className="flex items-center gap-2.5">
                    <Avatar label={initials(t.name)} size={30} style={{ background: "#662d91", color: "#fff" }} />
                    <div className="flex-1">
                      <div className="text-[12.5px] font-semibold text-ink">{t.name}</div>
                      <div className="text-[11px] text-muted-2">
                        {t.trainerCohorts.length} cohort{t.trainerCohorts.length === 1 ? "" : "s"} · {participants} participants
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
