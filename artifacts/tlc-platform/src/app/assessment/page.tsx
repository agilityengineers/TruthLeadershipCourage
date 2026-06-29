import { Link } from "wouter";
import { db } from "@/lib/db";
import { AssessmentFlow } from "./assessment-flow";
import type { QuestionLite } from "@/lib/assessment";

export default function AssessmentPage() {
  const assessment = db.assessment.findFirst({
    where: { program: { slug: "tlc" } },
    include: { questions: { where: { active: true }, orderBy: { order: "asc" } } },
  });

  const questions: QuestionLite[] = (assessment?.questions ?? []).map((q) => ({
    id: q.id,
    theme: q.theme,
    pillar: q.pillar,
    color: q.color,
    prompt: q.prompt,
    benefit: q.benefit,
  }));

  if (questions.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-soft-3 p-6 text-center">
        <div>
          <p className="text-muted">The assessment isn't available right now.</p>
          <Link href="/" className="mt-2 inline-block font-semibold text-eq">
            ← Back to home
          </Link>
        </div>
      </div>
    );
  }

  return <AssessmentFlow questions={questions} />;
}
