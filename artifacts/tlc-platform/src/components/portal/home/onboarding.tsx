import { useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useCreateReflection } from "@workspace/api-client-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

/**
 * The portal's first act is to listen. At account creation the participant
 * answers two seed questions; those answers anchor the home screen from the
 * very first visit and return once — at graduation. Runs as a gate on the
 * home screen so it covers every path into a new account.
 */
const STEPS = [
  {
    promptKey: "seed.best_day",
    title: "Describe yourself on your best day as a leader — and what gets in the way.",
    hint: "A few honest lines. There's no wrong answer.",
    placeholder: "On my best day I…",
  },
  {
    promptKey: "seed.said_yes",
    title: "What made you say yes to this?",
    hint: "One line is enough.",
    placeholder: "I said yes because…",
  },
] as const;

export function SeedOnboarding({ cohortName }: { cohortName: string }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>(["", ""]);
  const qc = useQueryClient();
  const { mutateAsync, isPending } = useCreateReflection();

  const current = STEPS[step]!;
  const value = answers[step] ?? "";

  async function next() {
    if (!value.trim()) return;
    if (step < STEPS.length - 1) {
      setStep(step + 1);
      return;
    }
    try {
      for (let i = 0; i < STEPS.length; i++) {
        await mutateAsync({
          data: { kind: "SEED", promptKey: STEPS[i]!.promptKey, body: answers[i]!.trim() },
        });
      }
      toast.success("Welcome. Your words will meet you here.");
      qc.invalidateQueries();
    } catch {
      toast.error("Couldn't save your answers — try again.");
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-col gap-5 py-6">
      <div>
        <div className="label-caps">Welcome to {cohortName}</div>
        <h2 className="mt-1 font-display text-[20px] leading-snug text-ink">
          Before anything else, two questions.
        </h2>
        <p className="mt-1 text-[13px] text-muted-2">
          Your answers stay yours — only you will ever see them. They'll hold the top of your home
          screen until your I AM statement takes over, and they return once, at graduation.
        </p>
      </div>

      <section className="rounded-card border border-hair-1 bg-white p-5">
        <div className="text-[11.5px] font-semibold text-muted-3">
          {step + 1} of {STEPS.length}
        </div>
        <h3 className="mt-1.5 font-display text-[17px] leading-snug text-ink">{current.title}</h3>
        <Textarea
          value={value}
          onChange={(e) =>
            setAnswers((a) => a.map((v, i) => (i === step ? e.target.value : v)))
          }
          placeholder={current.placeholder}
          rows={5}
          maxLength={4000}
          className="voice-participant mt-3 text-[16px] leading-relaxed text-[#43407a]"
          autoFocus
        />
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[11.5px] text-muted-3">{current.hint}</span>
          <div className="flex items-center gap-2">
            {step > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setStep(step - 1)} disabled={isPending}>
                Back
              </Button>
            )}
            <Button size="sm" onClick={next} disabled={isPending || !value.trim()}>
              {isPending ? "Saving…" : step < STEPS.length - 1 ? "Continue" : "Begin"}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
