/** Participant journey phase, derived from cohort dates relative to now. */
export type Phase = "before" | "during" | "after";

export function derivePhase(
  startDate: Date | string,
  endDate: Date | string,
  now: Date = new Date(),
): Phase {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const t = now.getTime();
  if (t < start) return "before";
  if (t > end) return "after";
  return "during";
}

/** Week index (1-based) within a cohort, clamped to [1, totalWeeks]. */
export function currentWeek(
  startDate: Date | string,
  totalWeeks: number,
  now: Date = new Date(),
): number {
  const start = new Date(startDate).getTime();
  const diffWeeks = Math.floor((now.getTime() - start) / (1000 * 60 * 60 * 24 * 7)) + 1;
  return Math.min(Math.max(diffWeeks, 1), totalWeeks);
}

export function progressPct(completedWeeks: number, totalWeeks: number): number {
  if (totalWeeks <= 0) return 0;
  return Math.round((completedWeeks / totalWeeks) * 100);
}

/** Minimal shape of the participant context needed to derive the journey. */
type JourneyInput = {
  status: string;
  cohort: { startDate: Date | string; endDate: Date | string };
  moduleProgress: { status: string }[];
};

/** Derive phase/week/progress for an enrollment. Honors an optional preview override. */
export function deriveJourney(enr: JourneyInput, override?: Phase) {
  const totalWeeks = 24;
  const phase = override ?? derivePhase(enr.cohort.startDate, enr.cohort.endDate);
  const week = currentWeek(enr.cohort.startDate, totalWeeks);
  const completed = enr.moduleProgress.filter((m) => m.status === "COMPLETED").length;
  const pct = enr.status === "COMPLETED" ? 100 : progressPct(completed, totalWeeks);
  return { phase, week, totalWeeks, completed, pct };
}
