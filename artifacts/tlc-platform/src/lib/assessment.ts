import { PILLAR_COLOR } from "./utils";

export const SCALE = [
  { label: "Rarely", value: 1 },
  { label: "Sometimes", value: 2 },
  { label: "Often", value: 3 },
  { label: "Consistently", value: 4 },
] as const;

export type QuestionLite = {
  id: string;
  theme: string;
  pillar: string;
  color: string;
  prompt: string;
  benefit: string;
};

export type GrowthCard = { theme: string; benefit: string; pillar: string; color: string };

export type Snapshot = {
  growth: GrowthCard[];
  strengths: string[];
};

/**
 * The mirror: low scores (<= 2) become growth/benefit cards; high scores (>= 3)
 * become strengths. Mirrors the prototype's results computation exactly.
 */
export function computeSnapshot(
  questions: QuestionLite[],
  answers: Record<string, number>,
): Snapshot {
  const growth: GrowthCard[] = [];
  const strengths: string[] = [];
  for (const q of questions) {
    const v = answers[q.id] ?? 0;
    if (v > 0 && v <= 2) {
      growth.push({
        theme: q.theme,
        benefit: q.benefit,
        pillar: q.pillar,
        color: q.color || PILLAR_COLOR[q.pillar] || "#024794",
      });
    } else if (v >= 3) {
      strengths.push(q.theme);
    }
  }
  return { growth, strengths };
}
