import type { JourneySegmentItem } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";

/**
 * The journey line: a quiet position on the EQ → IQ → Intersession → MQ arc,
 * always naming where the participant stands. A place on a path — never a
 * bar filling up. The Intersession has its own labeled stretch so those
 * weeks read as part of the journey rather than a gap.
 */
export function JourneyLine({
  journey,
  label,
  preStart,
}: {
  journey: JourneySegmentItem[];
  label: string;
  preStart?: boolean;
}) {
  return (
    <section aria-label={`Journey position: ${label}`}>
      <div className="flex items-center gap-1.5">
        {preStart && <span className="h-[7px] w-[7px] shrink-0 rounded-full bg-indigo" aria-hidden />}
        {journey.map((seg) => (
          <div
            key={seg.key}
            className={cn(
              "relative h-[5px] rounded-full",
              seg.key === "INTERSESSION" ? "flex-[1.3]" : "flex-1",
              seg.state === "past" ? "bg-indigo" : "bg-hair-1",
            )}
          >
            {seg.state === "current" && (
              <>
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-indigo"
                  style={{ width: `${Math.round((seg.progress ?? 0.5) * 100)}%` }}
                />
                <span
                  className="absolute top-1/2 h-[11px] w-[11px] -translate-y-1/2 rounded-full border-2 border-white bg-indigo shadow-sm"
                  style={{ left: `calc(${Math.round((seg.progress ?? 0.5) * 100)}% - 5px)` }}
                  aria-hidden
                />
              </>
            )}
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex items-baseline gap-1.5">
        {preStart && <span className="text-[11.5px] font-bold text-indigo">Begin</span>}
        {journey.map((seg) => (
          <span
            key={seg.key}
            className={cn(
              "text-center text-[11px]",
              seg.key === "INTERSESSION" ? "flex-[1.3]" : "flex-1",
              seg.state === "current" ? "font-bold text-indigo" : "text-muted-3",
            )}
          >
            {seg.state === "current" ? label : seg.label}
          </span>
        ))}
      </div>
    </section>
  );
}
