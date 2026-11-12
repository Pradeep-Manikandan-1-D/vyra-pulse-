import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "neon" | "outline" | "secondary" | "success" | "warning" | "danger" | "neutral";
}

export function Badge({ className, variant = "default", children, ...props }: BadgeProps) {
  const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide border";

  const variants = {
    default: "bg-primary/15 text-primary border-primary/30",
    neon: "bg-primary text-black dark:text-black border-transparent shadow-sm",
    outline: "border-border text-foreground bg-transparent",
    secondary: "bg-surface-inset text-muted-foreground border-border/40",
    success: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    warning: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
    danger: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30",
    neutral: "bg-surface-inset text-muted-foreground border-border/40",
  };

  return (
    <span className={cn(baseClasses, variants[variant], className)} {...props}>
      {children}
    </span>
  );
}
