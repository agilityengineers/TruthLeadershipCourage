import { useState } from "react";
import type { PortalAnchor, PortalHomeState } from "@workspace/api-client-react";
import { WriteReflectionDialog } from "./write-reflection";

/**
 * The anchor: the very top of the screen always belongs to the participant,
 * in their own words. Seeds at first; the I AM statement takes over after
 * Module 1; the Leadership Why joins underneath by Module 3. Participant
 * words render in the serif italic "participant voice" — everything the
 * portal itself says stays plain.
 */
export function Anchor({ home }: { home: PortalHomeState }) {
  const anchor: PortalAnchor = home.anchor;
  const iAm = anchor.iAm ?? null;
  const why = anchor.leadershipWhy ?? null;
  const seeds = anchor.seeds;
  const bestDay = seeds.find((s) => s.promptKey === "seed.best_day") ?? seeds[0] ?? null;
  const saidYes = seeds.find((s) => s.promptKey === "seed.said_yes") ?? null;
  const graduated = home.segment === "GRADUATED";
  const [whyExpanded, setWhyExpanded] = useState(false);
  const moduleOrder = home.currentModule?.order ?? 0;

  // Before the I AM exists (or again at graduation) the seed reflections hold
  // the top of the screen.
  if (!iAm || (graduated && bestDay)) {
    if (!bestDay) return null;
    return (
      <section aria-label="Your starting reflections">
        <div className="label-caps">{graduated ? "Day one — where you started" : "Where you're starting from"}</div>
        <p className="voice-participant mt-1.5 text-[19px] leading-[1.45] text-[#43407a]">
          “{bestDay.body}”
        </p>
        {saidYes && (
          <>
            <div className="label-caps mt-4">What made you say yes</div>
            <p className="voice-participant mt-1 text-[14.5px] leading-relaxed text-[#5a5680]">
              “{saidYes.body}”
            </p>
          </>
        )}
        {graduated && iAm && (
          <>
            <div className="label-caps mt-4">Where you arrived</div>
            <p className="voice-participant mt-1 text-[17px] leading-snug text-[#43407a]">{iAm.body}</p>
          </>
        )}
      </section>
    );
  }

  return (
    <section aria-label="Your I AM statement">
      <p className="voice-participant text-[21px] leading-[1.4] text-[#43407a]">{iAm.body}</p>
      <div className="mt-1.5 flex items-center gap-3">
        <WriteReflectionDialog
          kind="I_AM"
          title="Refine your I AM"
          description="Say it the way it's true today. Every earlier version stays quietly with you."
          initialBody={iAm.body}
          trigger={
            <button type="button" className="text-[12px] font-medium text-muted-3 hover:text-indigo">
              Refine your I AM
            </button>
          }
        />
        {!why && moduleOrder >= 3 && (
          <WriteReflectionDialog
            kind="LEADERSHIP_WHY"
            title="Your Leadership Why"
            description="One line: why do you lead?"
            trigger={
              <button type="button" className="text-[12px] font-medium text-muted-3 hover:text-indigo">
                Add your Leadership Why
              </button>
            }
          />
        )}
      </div>
      {why && (
        <button
          type="button"
          onClick={() => setWhyExpanded((v) => !v)}
          className="mt-3 block text-left"
          aria-expanded={whyExpanded}
        >
          <div className="label-caps">Why I lead</div>
          <p
            className={
              "mt-0.5 text-[14px] leading-relaxed text-ink-soft " + (whyExpanded ? "" : "line-clamp-2")
            }
          >
            {why.body}
          </p>
        </button>
      )}
    </section>
  );
}
