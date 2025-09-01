// components/Button.tsx
"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

const base =
  "inline-flex items-center gap-2 rounded-2xl bg-brand px-5 py-2.5 " +
  "font-medium text-white shadow-soft hover:bg-brand-dark transition";

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, asChild = false, ...props }, ref) => {
    const Comp: any = asChild ? Slot : "button";
    return <Comp ref={ref} className={cn(base, className)} {...props} />;
  }
);
Button.displayName = "Button";

export default Button;
