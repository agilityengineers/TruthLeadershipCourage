import { Link, Redirect } from "wouter";
import { useGetAssessment } from "@workspace/api-client-react";
import { AssessmentFlow } from "./assessment-flow";
import { useSiteSettings } from "@/lib/site-content";
import type { QuestionLite } from "@/lib/assessment";

export default function AssessmentPage() {
  // The assessment is a marketing tool that is off unless an admin turns it on.
  const { assessmentEnabled } = useSiteSettings();
  const { data: assessment } = useGetAssessment();

  const questions: QuestionLite[] = (assessment?.questions ?? []).map((q) => ({
    id: q.id,
    theme: q.theme,
    pillar: q.pillar,
    color: q.color ?? "",
    prompt: q.prompt,
    benefit: q.benefit,
  }));

  if (!assessmentEnabled) return <Redirect to="/cohorts" />;

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
