import { progressPct } from "@/lib/cohort";

/**
 * Compute a participant's progress percentage and whether they're "behind"
 * relative to the cohort's current week. A participant is behind when their
 * completion lags the expected pace by more than ~15 percentage points.
 */
export function computeProgress(
  completedWeeks: number,
  currentWk: number,
  totalWeeks: number,
  isCompleted = false,
) {
  const pct = isCompleted ? 100 : progressPct(completedWeeks, totalWeeks);
  const expectedPct = Math.round((currentWk / totalWeeks) * 100);
  const behind = !isCompleted && pct < expectedPct - 15;
  return { pct, expectedPct, behind, completedWeeks };
}

const PALETTES = [
  { bg: "#b8d8e6", fg: "#262161" },
  { bg: "#d9cde8", fg: "#662d91" },
  { bg: "#cfe0c9", fg: "#3a6b2e" },
  { bg: "#e8cdd5", fg: "#9a2d4f" },
  { bg: "#dfe3f4", fg: "#262161" },
];

/** Deterministic colored avatar palette, matching the prototype's variety. */
export function avatarPalette(index: number) {
  return PALETTES[index % PALETTES.length];
}
