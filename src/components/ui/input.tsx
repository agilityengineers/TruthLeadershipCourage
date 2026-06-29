import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(
        "flex h-11 w-full rounded-[9px] border border-[#e0e4ee] bg-white px-3.5 py-2 text-sm text-ink placeholder:text-muted-3 focus-visible:border-eq focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eq/20 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export { Input };
