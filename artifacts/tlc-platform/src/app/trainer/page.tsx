import { Link } from "wouter";
import { requireRole } from "@/lib/session";
import { db } from "@/lib/db";
import { cohortScope } from "@/lib/scope";
import { currentWeek } from "@/lib/cohort";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { KpiTile, LabelCaps } from "@/components/brand/primitives";
import { initials, formatDate } from "@/lib/utils";
import { computeProgress, avatarPalette } from "@/components/trainer/progress-util";

const TOTAL_WEEKS = 24;

export default function TrainerOverviewPage() {
  const principal = requireRole("TRAINER", "ADMIN");

  // Primary running cohort for the trainer (admins see all via cohortScope).
  const cohort =
    db.cohort.findFirst({
      where: { AND: [cohortScope(principal), { status: "RUNNING" }] },
      orderBy: { startDate: "asc" },
    }) ??
    db.cohort.findFirst({
      where: cohortScope(principal),
      orderBy: { startDate: "asc" },
    });

  if (!cohort) {
    return <Card className="p-8 text-muted">No cohorts assigned yet.</Card>;
  }

  const week = currentWeek(cohort.startDate, TOTAL_WEEKS);

  const enrollments = db.enrollment.findMany({
    where: { cohortId: cohort.id },
    include: {
      user: { include: { company: true } },
      moduleProgress: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const activeCount = enrollments.filter((e) => e.status === "ACTIVE").length;

  const rows = enrollments.map((e) => {
    const completed = e.moduleProgress.filter((m) => m.status === "COMPLETED").length;
    const stats = computeProgress(completed, week, TOTAL_WEEKS, e.status === "COMPLETED");
    return {
      id: e.id,
      name: e.user.name ?? e.user.email,
      company: e.user.company?.name ?? "Independent",
      ...stats,
    };
  });

  const avgCompletion =
    enrollments.length === 0
      ? 0
      : Math.round(rows.reduce((sum, r) => sum + r.pct, 0) / rows.length);
  const needNudge = rows.filter((r) => r.behind).length;

  // Upcoming events: next ~3 weekly sessions + coaching.
  const upcoming = db.event.findMany({
    where: { cohortId: cohort.id, startAt: { gte: new Date() } },
    orderBy: { startAt: "asc" },
    take: 3,
  });

  // Recent resources for this cohort.
  const resources = db.resource.findMany({
    where: { cohortId: cohort.id },
    orderBy: { createdAt: "desc" },
    take: 4,
    include: { module: true },
  });

  return (
    <div className="flex flex-col gap-5">
      {/* KPI tiles */}
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <KpiTile value={activeCount} label="Active participants" color="#024794" />
        <KpiTile value={`${avgCompletion}%`} label="Avg. weekly completion" color="#262161" />
        <KpiTile value={needNudge} label="Need a nudge" color="#662d91" />
        <KpiTile
          value={cohort.sessionDay ? cohort.sessionDay.slice(0, 3) : "—"}
          label="Next live session"
          color="#1c1a33"
        />
      </div>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[1fr_340px]">
        {/* Participants & progress */}
        <Card className="min-w-0 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-hair-3 px-5 py-[18px]">
            <h4 className="font-display text-[17px] text-ink">Participants &amp; progress</h4>
            <span className="text-[12px] font-medium text-muted-3">
              {enrollments.length} enrolled
            </span>
          </div>
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-hair-3 bg-[#fafbfd]">
                <th className="px-5 py-[11px] text-[10.5px] font-semibold uppercase tracking-label text-muted-3">
                  Participant
                </th>
                <th className="px-5 py-[11px] text-[10.5px] font-semibold uppercase tracking-label text-muted-3">
                  Company
                </th>
                <th className="px-5 py-[11px] text-[10.5px] font-semibold uppercase tracking-label text-muted-3">
                  Progress
                </th>
                <th className="px-5 py-[11px] text-[10.5px] font-semibold uppercase tracking-label text-muted-3">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const palette = avatarPalette(i);
                return (
                  <tr key={r.id} className="border-b border-[#f1f3f8] last:border-0">
                    <td className="px-5 py-3">
                      <span className="flex items-center gap-2.5">
                        <Avatar
                          label={initials(r.name)}
                          size={30}
                          style={{ background: palette.bg, color: palette.fg }}
                        />
                        <span className="text-[13px] font-semibold text-ink">{r.name}</span>
                      </span>
                    </td>
                    <td className="px-5 py-3 text-[12.5px] text-[#62657a]">{r.company}</td>
                    <td className="px-5 py-3">
                      <span className="block h-[6px] max-w-[130px] overflow-hidden rounded-pill bg-[#e3e7f1]">
                        <span
                          className="block h-full"
                          style={{
                            width: `${r.pct}%`,
                            background: r.behind ? "#e0a32e" : "#024794",
                          }}
                        />
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className="text-[11px] font-semibold"
                        style={{ color: r.behind ? "#b8860b" : "#1c7d4d" }}
                      >
                        {r.behind ? "Behind" : "On track"}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-[13px] text-muted">
                    No participants enrolled yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>

        {/* Right rail */}
        <div className="flex flex-col gap-[18px]">
          {/* Upcoming events */}
          <Card className="p-5">
            <div className="mb-3.5 flex items-center justify-between">
              <LabelCaps>Upcoming events</LabelCaps>
              <Link href="/trainer/events" className="text-[12px] font-semibold text-eq hover:underline">
                Manage
              </Link>
            </div>
            <div className="flex flex-col gap-2.5">
              {upcoming.map((ev) => {
                const isCoaching = ev.type === "COACHING_1ON1";
                return (
                  <div key={ev.id} className="flex items-center gap-3">
                    <div className="w-[42px] flex-none text-center">
                      <div className="text-[10px] font-semibold uppercase text-muted-3">
                        {formatDate(ev.startAt, { month: "short" })}
                      </div>
                      <div
                        className="font-display text-[19px] leading-none"
                        style={{ color: isCoaching ? "#662d91" : "#262161" }}
                      >
                        {formatDate(ev.startAt, { day: "numeric" })}
                      </div>
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-[13px] font-semibold text-ink">{ev.title}</div>
                      <div className="text-[11.5px] text-muted-2">
                        {formatDate(ev.startAt, {
                          weekday: "short",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                        {isCoaching ? "" : " · live virtual"}
                      </div>
                    </div>
                  </div>
                );
              })}
              {upcoming.length === 0 && (
                <div className="text-[12.5px] text-muted">No upcoming events.</div>
              )}
            </div>
          </Card>

          {/* Resources */}
          <Card className="p-5">
            <div className="mb-3.5 flex items-center justify-between">
              <LabelCaps>Resources</LabelCaps>
              <Link
                href="/trainer/resources"
                className="text-[12px] font-semibold text-eq hover:underline"
              >
                + Upload
              </Link>
            </div>
            <div className="flex flex-col gap-2.5">
              {resources.map((r) => {
                const draft = r.status === "DRAFT";
                const chip =
                  r.type === "MP4"
                    ? { bg: "#f3eefb", fg: "#662d91", label: "MP4" }
                    : draft
                      ? { bg: "#fbf3df", fg: "#b8860b", label: r.type }
                      : { bg: "#eef2fb", fg: "#024794", label: r.type };
                return (
                  <div
                    key={r.id}
                    className="flex items-center gap-3 rounded-[10px] border border-hair-2 px-3 py-2.5"
                    style={draft ? { background: "#fffdf5" } : undefined}
                  >
                    <span
                      className="flex h-[30px] w-[30px] items-center justify-center rounded-[7px] text-[11px] font-bold"
                      style={{ background: chip.bg, color: chip.fg }}
                    >
                      {chip.label}
                    </span>
                    <span className="flex-1 truncate text-[12.5px] font-semibold text-ink">
                      {r.title}
                    </span>
                    <span
                      className="text-[11px] font-medium"
                      style={{ color: draft ? "#b8860b" : "#9498ab" }}
                    >
                      {draft ? "Draft" : "Published"}
                    </span>
                  </div>
                );
              })}
              {resources.length === 0 && (
                <div className="text-[12.5px] text-muted">No resources yet.</div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
