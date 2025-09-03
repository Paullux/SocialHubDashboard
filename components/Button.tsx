// components/Button.tsx
"use client";

import { cn } from "@/lib/utils";

export default function Button({
  className,
  children,
  ...props
}: {
  className?: string;
  children: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "inline-flex items-center gap-2 rounded-2xl bg-brand px-5 py-2.5 font-medium text-white shadow-md",
        "transition-transform duration-150 hover:scale-105 hover:bg-brand-dark",
        "focus:outline-none focus:ring-2 focus:ring-brand/70 focus:ring-offset-2 focus:ring-offset-black",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
