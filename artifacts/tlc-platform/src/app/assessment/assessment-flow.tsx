import { useMemo, useState, useTransition } from "react";
import { Link } from "wouter";
import { SCALE, computeSnapshot, type QuestionLite } from "@/lib/assessment";
import { PILLAR_LABEL } from "@/lib/utils";
import { submitAssessment } from "@/server/assessment-actions";
import { cn } from "@/lib/utils";

export function AssessmentFlow({ questions }: { questions: QuestionLite[] }) {
  const total = questions.length;
  const [step, setStep] = useState(0); // 0..total-1 = questions, total = results
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [responseId, setResponseId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const isResults = step >= total;
  const current = questions[Math.min(step, total - 1)];
  const num = Math.min(step + 1, total);
  const progress = Math.round((num / total) * 100);

  const snapshot = useMemo(() => computeSnapshot(questions, answers), [questions, answers]);

  function toTop() {
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  }

  function answer(value: number) {
    const q = questions[step];
    const next = { ...answers, [q.id]: value };
    setAnswers(next);
    if (step < total - 1) {
      setStep(step + 1);
      toTop();
    } else {
      // Last question → persist and show results.
      setStep(total);
      toTop();
      startTransition(async () => {
        try {
          const res = await submitAssessment({ answers: next });
          setResponseId(res.responseId);
        } catch {
          /* results still render from client-side computation */
        }
      });
    }
  }

  function back() {
    setStep((s) => Math.max(0, s - 1));
  }

  function restart() {
    setAnswers({});
    setStep(0);
    setResponseId(null);
    toTop();
  }

  const enrollHref = responseId ? `/enroll?response=${responseId}` : "/enroll";

  return (
    <div className="flex min-h-screen flex-col items-center bg-soft-3 px-5 py-[clamp(24px,5vw,60px)] pb-16">
      <div className="w-full max-w-prose">
        {/* Header */}
        <div className="mb-[26px] flex items-center gap-3">
          <img src="/brand/wisdomtri-logo.png" alt="" width={40} height={40} className="h-10 w-10 object-contain" />
          <div>
            <div className="text-[13px] font-semibold leading-tight text-indigo">The Wisdom Tri</div>
            <div className="text-[10.5px] font-semibold uppercase tracking-[.14em] text-muted-3">
              Leadership Assessment
            </div>
          </div>
          <Link href="/" className="ml-auto text-[12.5px] font-semibold text-muted-3 hover:text-ink">
            Exit
          </Link>
        </div>

        {!isResults ? (
          <>
            <div className="rounded-[18px] border border-hair-1 bg-white p-[clamp(24px,4vw,40px)] shadow-card">
              <div className="mb-2.5 flex items-center justify-between">
                <span className="rounded-pill bg-[#eef4fc] px-[11px] py-1.5 text-[11px] font-semibold uppercase tracking-label text-eq">
                  {current.theme}
                </span>
                <span className="text-[12.5px] font-semibold text-muted-3">
                  Question {num} of {total}
                </span>
              </div>
              <div className="mb-[26px] h-1.5 overflow-hidden rounded-pill bg-[#e7ebf4]">
                <div
                  className="h-full rounded-pill bg-gradient-to-r from-eq to-mq transition-[width] duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <h2 className="mb-2 text-[clamp(23px,3vw,30px)] leading-snug text-ink">{current.prompt}</h2>
              <p className="mb-6 text-[14px] leading-relaxed text-muted-3">
                Answer honestly — your personalized plan is built from this.
              </p>
              <div className="flex flex-col gap-[11px]">
                {SCALE.map((opt) => {
                  const selected = answers[current.id] === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => answer(opt.value)}
                      className={cn(
                        "flex w-full items-center gap-3.5 rounded-[12px] border-[1.5px] px-[18px] py-4 text-left text-[16px] font-medium text-[#2b2747] transition-[border-color,background] duration-100",
                        selected
                          ? "border-eq bg-[#eaf2fc]"
                          : "border-[#e0e4ee] bg-white hover:border-[#9bb4d6] hover:bg-[#f6f9fe]",
                      )}
                    >
                      <span
                        className={cn(
                          "h-5 w-5 shrink-0 rounded-full border-2",
                          selected ? "border-eq bg-eq" : "border-[#c3c6d4]",
                        )}
                      />
                      {opt.label}
                    </button>
                  );
                })}
              </div>
              {step > 0 && (
                <div className="mt-[22px]">
                  <button
                    type="button"
                    onClick={back}
                    className="text-[13.5px] font-semibold text-muted hover:text-ink"
                  >
                    ← Back
                  </button>
                </div>
              )}
            </div>
            <p className="mt-[18px] text-center text-[12.5px] text-[#a2a6b8]">
              Takes about 2 minutes · no account required to start
            </p>
          </>
        ) : (
          <ResultsScreen
            snapshot={snapshot}
            enrollHref={enrollHref}
            onRestart={restart}
            saving={pending}
          />
        )}
      </div>
    </div>
  );
}

function ResultsScreen({
  snapshot,
  enrollHref,
  onRestart,
  saving,
}: {
  snapshot: ReturnType<typeof computeSnapshot>;
  enrollHref: string;
  onRestart: () => void;
  saving: boolean;
}) {
  const strengths =
    snapshot.strengths.length > 0
      ? snapshot.strengths.join(" · ")
      : "a steady foundation across the board";

  return (
    <div className="rounded-[18px] border border-hair-1 bg-white p-[clamp(24px,4vw,40px)] shadow-card">
      <div className="mb-3 text-[11px] font-semibold uppercase tracking-[.14em] text-mq">
        Your leadership snapshot
      </div>
      <h2 className="mb-2.5 text-[clamp(25px,3.2vw,34px)] leading-tight text-ink">
        Here's what TLC was <em className="italic text-eq">built to do for you.</em>
      </h2>
      <p className="mb-6 text-[15.5px] leading-relaxed text-muted">
        Based on your answers, these are the areas stretching you most right now — and exactly how
        the program meets each one.
      </p>

      {snapshot.growth.length > 0 && (
        <div className="mb-[26px] flex flex-col gap-3">
          {snapshot.growth.map((g) => (
            <div
              key={g.theme}
              className="flex items-start gap-3.5 rounded-[12px] border border-hair-2 border-l-[3px] border-l-eq px-[18px] py-4"
            >
              <span
                className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[9px] text-[11px] font-bold text-white"
                style={{ background: g.color }}
              >
                {PILLAR_LABEL[g.pillar] ?? g.pillar}
              </span>
              <div>
                <div className="mb-[3px] text-[15px] font-semibold text-ink">{g.theme}</div>
                <div className="text-[14px] leading-relaxed text-muted">{g.benefit}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mb-[26px] rounded-[12px] bg-[#f6f8fc] px-[18px] py-4">
        <div className="label-caps mb-1.5">Strengths to build on</div>
        <div className="text-[15px] font-medium leading-snug text-[#2b2747]">{strengths}</div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Link
          href={enrollHref}
          className="inline-flex h-[52px] items-center rounded-[10px] bg-eq px-6 text-[15px] font-bold text-white transition-colors hover:bg-eq-hover"
        >
          Continue to enrollment →
        </Link>
        <button
          type="button"
          onClick={onRestart}
          className="inline-flex h-[52px] items-center rounded-[10px] border border-[#d6d9e6] bg-white px-5 text-[14px] font-semibold text-[#2a2a3c]"
        >
          Retake
        </button>
        {saving && <span className="text-[12px] text-muted-3">Saving your snapshot…</span>}
      </div>
      <p className="mt-4 text-[12.5px] text-[#a2a6b8]">
        Next, you'll book a fit conversation and, if it's a match, confirm your seat in an upcoming cohort.
      </p>
    </div>
  );
}
