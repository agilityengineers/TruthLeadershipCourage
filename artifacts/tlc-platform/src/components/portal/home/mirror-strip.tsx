import type { MirrorItem } from "@workspace/api-client-react";

/**
 * The mirror strip: the participant's own earlier words, resurfaced with
 * care and timed to the program. Only structured writing is ever shown, and
 * the privacy promise sits visibly inside the box.
 */
export function MirrorStrip({ mirror }: { mirror: MirrorItem }) {
  return (
    <section className="rounded-card border-l-4 border-[#6a5fb8] bg-[#eef0fb] p-4">
      <div className="text-[12px] font-semibold text-[#4c4290]">{mirror.label}</div>
      <p className="voice-participant mt-1.5 text-[15px] leading-relaxed text-[#37345e]">“{mirror.body}”</p>
      {mirror.question && (
        <p className="mt-1.5 text-[13px] font-medium text-[#4c4290]">{mirror.question}</p>
      )}
      <div className="mt-2 text-[11px] text-muted-3">Only you see this</div>
    </section>
  );
}

/** The trainer's welcome note, holding the mirror's place in the seed state. */
export function WelcomeNote({ note, trainerName }: { note: string; trainerName?: string | null }) {
  return (
    <section className="rounded-card border-l-4 border-[#6a5fb8] bg-[#eef0fb] p-4">
      <div className="text-[12px] font-semibold text-[#4c4290]">
        A note from {trainerName?.split(" ")[0] ?? "your trainer"}
      </div>
      <p className="voice-participant mt-1.5 text-[15px] leading-relaxed text-[#37345e]">{note}</p>
      <div className="mt-2 text-[11px] text-muted-3">Only you see what you write here</div>
    </section>
  );
}
