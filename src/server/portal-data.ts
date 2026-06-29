import { db } from "@/lib/db";
import { derivePhase, currentWeek, progressPct, type Phase } from "@/lib/cohort";

/** The participant's primary (most recent active) enrollment with everything the portal needs. */
export async function getParticipantContext(userId: string) {
  const enrollment = await db.enrollment.findFirst({
    where: { userId, status: { in: ["ACTIVE", "PENDING", "COMPLETED"] } },
    orderBy: { createdAt: "desc" },
    include: {
      user: true,
      cohort: {
        include: {
          program: { include: { modules: { orderBy: { order: "asc" } } } },
          trainer: true,
          events: { orderBy: { startAt: "asc" } },
        },
      },
      shipment: true,
      moduleProgress: { orderBy: { weekNo: "asc" }, include: { module: true } },
      bookings: { orderBy: { slot: "asc" }, include: { trainer: true } },
      certificate: true,
    },
  });
  return enrollment;
}

export type ParticipantContext = NonNullable<Awaited<ReturnType<typeof getParticipantContext>>>;

/** Derive phase/week/progress for an enrollment. Honors an optional preview override. */
export function deriveJourney(enr: ParticipantContext, override?: Phase) {
  const totalWeeks = 24;
  const phase = override ?? derivePhase(enr.cohort.startDate, enr.cohort.endDate);
  const week = currentWeek(enr.cohort.startDate, totalWeeks);
  const completed = enr.moduleProgress.filter((m) => m.status === "COMPLETED").length;
  const pct = enr.status === "COMPLETED" ? 100 : progressPct(completed, totalWeeks);
  return { phase, week, totalWeeks, completed, pct };
}
