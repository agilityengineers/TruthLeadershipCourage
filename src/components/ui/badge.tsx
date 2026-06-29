import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-pill font-sans font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "bg-[#eef4fc] text-eq",
        success: "bg-[#f5fbf7] text-success",
        warning: "bg-[#fbf3df] text-warning",
        danger: "bg-[#fbeef0] text-danger",
        neutral: "bg-page text-muted",
        solid: "bg-eq text-white",
      },
      size: {
        sm: "px-2 py-0.5 text-[10px] uppercase tracking-label",
        md: "px-2.5 py-1 text-[11px]",
      },
    },
    defaultVariants: { variant: "default", size: "md" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, size }), className)} {...props} />;
}

export { Badge, badgeVariants };
