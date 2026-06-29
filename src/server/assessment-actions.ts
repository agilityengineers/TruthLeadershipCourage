"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { computeSnapshot, type QuestionLite } from "@/lib/assessment";

const submitSchema = z.object({
  answers: z.record(z.string(), z.number().min(1).max(4)),
  leadEmail: z.string().email().optional().or(z.literal("")),
  leadName: z.string().optional(),
});

/**
 * Persist a completed assessment as an AssessmentResponse with a computed
 * snapshot, and return the snapshot + response id for the results screen.
 * Pre-account (lead) responses are keyed by email and linked to a User later.
 */
export async function submitAssessment(input: z.infer<typeof submitSchema>) {
  const { answers, leadEmail, leadName } = submitSchema.parse(input);

  const assessment = await db.assessment.findFirst({
    where: { program: { slug: "tlc" } },
    include: { questions: { where: { active: true }, orderBy: { order: "asc" } } },
  });
  if (!assessment) throw new Error("Assessment not configured");

  const lite: QuestionLite[] = assessment.questions.map((q) => ({
    id: q.id,
    theme: q.theme,
    pillar: q.pillar,
    color: q.color,
    prompt: q.prompt,
    benefit: q.benefit,
  }));
  const snapshot = computeSnapshot(lite, answers);

  const response = await db.assessmentResponse.create({
    data: {
      assessmentId: assessment.id,
      leadEmail: leadEmail || null,
      leadName: leadName || null,
      completedAt: new Date(),
      snapshot,
      answers: {
        create: Object.entries(answers)
          .filter(([qid]) => lite.some((q) => q.id === qid))
          .map(([questionId, value]) => ({ questionId, value })),
      },
    },
  });

  return { responseId: response.id, snapshot };
}
