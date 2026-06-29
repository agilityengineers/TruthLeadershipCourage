import * as React from "react";
import { cn } from "@/lib/utils";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0..100
  gradient?: boolean;
  trackClassName?: string;
  barClassName?: string;
  height?: number;
}

/** Brand progress bar. Gradient EQ→MQ matches the assessment + portal bars. */
export function Progress({
  value,
  gradient = true,
  trackClassName,
  barClassName,
  height = 8,
  className,
  ...props
}: ProgressProps) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("overflow-hidden rounded-pill bg-[#e3e7f1]", trackClassName, className)}
      style={{ height }}
      {...props}
    >
      <div
        className={cn(
          "h-full rounded-pill transition-[width] duration-300",
          gradient ? "bg-gradient-to-r from-eq to-mq" : "bg-eq",
          barClassName,
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
