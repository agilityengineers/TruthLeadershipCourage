import { cn } from "@/lib/utils";
import { PILLAR_COLOR, PILLAR_LABEL } from "@/lib/utils";

interface PillarBadgeProps {
  pillar: string; // EQ | IQ | MQ
  className?: string;
  size?: "sm" | "md" | "lg";
}

/** Square colored pillar chip (EQ #024794 · IQ #262161 · MQ™ #662d91). */
export function PillarBadge({ pillar, className, size = "md" }: PillarBadgeProps) {
  const color = PILLAR_COLOR[pillar] ?? "#024794";
  const dims =
    size === "lg"
      ? "h-9 w-9 text-[12px] rounded-[9px]"
      : size === "sm"
        ? "h-6 w-[34px] text-[10px] rounded-[6px]"
        : "h-7 w-9 text-[11px] rounded-md";
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center font-sans font-bold leading-none text-white",
        dims,
        className,
      )}
      style={{ background: color }}
    >
      {PILLAR_LABEL[pillar] ?? pillar}
    </span>
  );
}
