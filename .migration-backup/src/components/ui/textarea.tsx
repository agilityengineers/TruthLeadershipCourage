import * as React from "react";
import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "flex min-h-[88px] w-full rounded-[9px] border border-[#e0e4ee] bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-muted-3 focus-visible:border-eq focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eq/20 disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export { Textarea };
