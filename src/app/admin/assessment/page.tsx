import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { Card } from "@/components/ui/card";
import { LabelCaps } from "@/components/brand/primitives";
import { AssessmentBuilder } from "@/components/admin/assessment-builder";

export const dynamic = "force-dynamic";

export default async function AdminAssessmentPage() {
  await requireRole("ADMIN");
  const assessment = await db.assessment.findFirst({
    where: { program: { slug: "tlc" } },
    include: { questions: { orderBy: { order: "asc" } } },
  });

  const responses = await db.assessmentResponse.count({
    where: { assessmentId: assessment?.id, completedAt: { not: null } },
  });

  const questions = (assessment?.questions ?? []).map((q) => ({
    id: q.id,
    theme: q.theme,
    pillar: q.pillar as "EQ" | "IQ" | "MQ",
    prompt: q.prompt,
    benefit: q.benefit,
    active: q.active,
  }));

  return (
    <div className="flex flex-col gap-5">
      <Card className="p-[22px]">
        <LabelCaps className="mb-1">Assessment Builder</LabelCaps>
        <h4 className="font-display text-[18px] text-ink">Signup assessment questions</h4>
        <p className="mt-1 max-w-[54em] text-[13px] leading-relaxed text-muted-2">
          Questions a prospect answers during signup. Each maps to the TLC benefit shown back on
          their results screen. Add, edit, or remove items here — the live assessment updates
          instantly. {responses} {responses === 1 ? "response" : "responses"} collected so far.
        </p>
      </Card>

      <AssessmentBuilder questions={questions} />
    </div>
  );
}
