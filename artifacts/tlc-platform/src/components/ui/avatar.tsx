import * as React from "react";
import { cn } from "@/lib/utils";

interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  label: string; // initials
  size?: number;
}

/** Simple initials avatar matching the prototype's colored circles. */
export function Avatar({ label, size = 34, className, style, ...props }: AvatarProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-sky font-sans font-semibold text-indigo",
        className,
      )}
      style={{ width: size, height: size, fontSize: size * 0.38, ...style }}
      {...props}
    >
      {label}
    </span>
  );
}
