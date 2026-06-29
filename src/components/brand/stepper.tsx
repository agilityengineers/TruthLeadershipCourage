import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type Step = { label: string; state: "done" | "current" | "todo" };

/** Horizontal progress stepper — used by the workbook shipment tracker. */
export function Stepper({ steps }: { steps: Step[] }) {
  return (
    <div className="flex items-center">
      {steps.map((s, i) => (
        <div key={s.label} className="flex flex-1 items-center">
          <div className="flex flex-1 flex-col items-center text-center">
            <span
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold",
                s.state === "done" && "bg-success text-white",
                s.state === "current" && "bg-eq text-white",
                s.state === "todo" && "border border-[#d3d7e4] bg-page text-transparent",
              )}
            >
              {s.state === "done" ? <Check className="h-3.5 w-3.5" /> : s.state === "current" ? "●" : ""}
            </span>
            <span
              className={cn(
                "mt-1.5 text-[10px] leading-tight",
                s.state === "done" && "font-medium text-success",
                s.state === "current" && "font-semibold text-eq",
                s.state === "todo" && "font-medium text-muted-3",
              )}
            >
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <span
              className="mx-[-6px] h-0.5 flex-1"
              style={{ background: steps[i + 1].state === "todo" ? "#e0e3ee" : "#1c7d4d" }}
            />
          )}
        </div>
      ))}
    </div>
  );
}
