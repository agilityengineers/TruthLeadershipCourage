import { useLocation, useSearch } from "wouter";
import { cn } from "@/lib/utils";

const PHASES = ["before", "during", "after"] as const;

/**
 * Journey-phase toggle. Phase is derived from cohort dates by default; this
 * lets a participant (or reviewer) preview each phase via ?phase=.
 */
export function PhaseToggle({ active }: { active: string }) {
  const [pathname, navigate] = useLocation();
  const search = useSearch();

  function set(phase: string) {
    const sp = new URLSearchParams(search);
    sp.set("phase", phase);
    navigate(`${pathname}?${sp.toString()}`);
  }

  return (
    <div className="ml-auto flex items-center gap-2.5">
      <span className="text-[11px] font-medium text-[#a2a6b8]">Journey phase</span>
      <div className="flex gap-0.5 rounded-[9px] border border-[#e3e7f1] bg-page p-1">
        {PHASES.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => set(p)}
            className={cn(
              "rounded-md px-3 py-1.5 text-[12px] font-semibold capitalize transition-colors",
              active === p ? "bg-eq text-white" : "text-muted hover:text-ink",
            )}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}
