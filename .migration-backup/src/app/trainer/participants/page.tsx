import Link from "next/link";
import { requireRole } from "@/lib/session";
import { db } from "@/lib/db";
import { enrollmentScope } from "@/lib/scope";
import { currentWeek } from "@/lib/cohort";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { initials, formatDate } from "@/lib/utils";
import { computeProgress, avatarPalette } from "@/components/trainer/progress-util";

export const dynamic = "force-dynamic";

const TOTAL_WEEKS = 24;

export default async function TrainerParticipantsPage() {
  const principal = await requireRole("TRAINER", "ADMIN");

  // Tenant-safe: only enrollments in the trainer's cohorts (admins unrestricted).
  const enrollments = await db.enrollment.findMany({
    where: enrollmentScope(principal),
    include: {
      user: { include: { company: true } },
      cohort: true,
      moduleProgress: true,
    },
    orderBy: [{ cohort: { startDate: "asc" } }, { createdAt: "asc" }],
  });

  const rows = enrollments.map((e, i) => {
    const completed = e.moduleProgress.filter((m) => m.status === "COMPLETED").length;
    const week = currentWeek(e.cohort.startDate, TOTAL_WEEKS);
    const stats = computeProgress(completed, week, TOTAL_WEEKS, e.status === "COMPLETED");
    return {
      id: e.id,
      name: e.user.name ?? e.user.email,
      email: e.user.email,
      company: e.user.company?.name ?? "Independent",
      cohort: e.cohort.name,
      lastActivity: e.updatedAt,
      palette: avatarPalette(i),
      ...stats,
    };
  });

  return (
    <div className="flex flex-col gap-5">
      <div>
        <div className="label-caps">Participants</div>
        <h2 className="mt-1 font-display text-[24px] text-ink">All participants</h2>
        <p className="mt-1 text-[13px] text-muted-2">
          {rows.length} {rows.length === 1 ? "participant" : "participants"} across your cohorts.
        </p>
      </div>

      <Card className="min-w-0 overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left">
          <thead>
            <tr className="border-b border-hair-3 bg-[#fafbfd]">
              {["Participant", "Email", "Company", "Cohort", "Progress", "Status", "Last activity"].map(
                (h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-[10.5px] font-semibold uppercase tracking-label text-muted-3"
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-[#f1f3f8] last:border-0 hover:bg-[#fafbfd]">
                <td className="px-5 py-3">
                  <Link
                    href={`/trainer/participants/${r.id}`}
                    className="flex items-center gap-2.5"
                  >
                    <Avatar
                      label={initials(r.name)}
                      size={30}
                      style={{ background: r.palette.bg, color: r.palette.fg }}
                    />
                    <span className="text-[13px] font-semibold text-ink">{r.name}</span>
                  </Link>
                </td>
                <td className="px-5 py-3 text-[12.5px] text-muted-2">{r.email}</td>
                <td className="px-5 py-3 text-[12.5px] text-[#62657a]">{r.company}</td>
                <td className="px-5 py-3 text-[12.5px] text-[#62657a]">{r.cohort}</td>
                <td className="px-5 py-3">
                  <span className="flex items-center gap-2">
                    <span className="block h-[6px] w-[100px] overflow-hidden rounded-pill bg-[#e3e7f1]">
                      <span
                        className="block h-full"
                        style={{ width: `${r.pct}%`, background: r.behind ? "#e0a32e" : "#024794" }}
                      />
                    </span>
                    <span className="text-[11px] font-semibold text-muted-2">{r.pct}%</span>
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
                <td className="px-5 py-3 text-[12px] text-muted-3">
                  {formatDate(r.lastActivity, { month: "short", day: "numeric" })}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-[13px] text-muted">
                  No participants found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
