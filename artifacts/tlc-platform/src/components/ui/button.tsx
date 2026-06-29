import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[9px] font-sans font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-eq text-white hover:bg-eq-hover",
        secondary: "bg-indigo text-white hover:bg-indigo-950",
        outline: "border border-[#d6d9e6] bg-white text-[#2a2a3c] hover:border-eq hover:text-eq",
        ghost: "bg-transparent text-muted hover:bg-[#eef1fa]",
        danger: "border border-[#ecd6db] bg-white text-danger hover:bg-[#fff5f7]",
        light: "bg-white text-indigo hover:bg-[#f2f3fa]",
      },
      size: {
        sm: "h-9 px-4 text-[12.5px]",
        md: "h-11 px-[18px] text-[13.5px]",
        lg: "h-[52px] px-6 text-[15px]",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
