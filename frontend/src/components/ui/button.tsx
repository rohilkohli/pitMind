import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const variants = cva(
  "inline-flex items-center justify-center whitespace-nowrap font-bold uppercase tracking-widest transition-all duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-f1-red disabled:pointer-events-none disabled:opacity-40 border-0",
  {
    variants: {
      variant: {
        primary: "bg-f1-red text-white hover:bg-f1-red-dark active:scale-95",
        secondary: "bg-transparent border border-f1-red text-f1-red hover:bg-f1-red hover:text-white",
        ghost: "bg-transparent text-f1-white border border-f1-border hover:border-f1-red hover:text-f1-red",
        danger: "bg-f1-red-dark text-white hover:bg-f1-red",
      },
      size: {
        sm: "h-8 px-4 text-xs",
        md: "h-10 px-6 text-sm",
        lg: "h-12 px-8 text-base",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof variants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(variants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";
