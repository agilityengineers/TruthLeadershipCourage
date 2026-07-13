import { useLocation, useSearch } from "wouter";
import { cn } from "@/lib/utils";

const STATES = [
  { key: "", label: "Live" },
  { key: "pre_start", label: "Seed" },
  { key: "session_day", label: "Session" },
  { key: "live_it", label: "Live It" },
  { key: "before_practice", label: "Practice" },
  { key: "intersession", label: "Intersession" },
  { key: "graduated", label: "Graduated" },
  { key: "closed", label: "Closed" },
] as const;

/**
 * Home-state preview toggle (the successor of the old ?phase= toggle): shifts
 * the derived program clock via ?preview= so every screen state is demoable
 * on real data.
 */
export function StateToggle({ active }: { active: string }) {
  const [pathname, navigate] = useLocation();
  const search = useSearch();

  function set(key: string) {
    const sp = new URLSearchParams(search);
    if (key) sp.set("preview", key);
    else sp.delete("preview");
    const qs = sp.toString();
    navigate(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="no-print flex flex-wrap items-center gap-1.5">
      <span className="mr-1 text-[10.5px] font-medium text-[#a2a6b8]">Preview</span>
      {STATES.map((s) => (
        <button
          key={s.key}
          type="button"
          onClick={() => set(s.key)}
          className={cn(
            "rounded-full border px-2.5 py-1 text-[10.5px] font-semibold transition-colors",
            active === s.key
              ? "border-indigo bg-indigo text-white"
              : "border-[#e3e7f1] bg-white text-muted-2 hover:text-ink",
          )}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}
