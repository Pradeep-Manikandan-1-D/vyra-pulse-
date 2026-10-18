import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "neon" | "outline" | "secondary";
}

export function Badge({ className, variant = "default", children, ...props }: BadgeProps) {
  const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide border";

  const variants = {
    default: "bg-[#00FF66]/10 text-[#00FF66] border-[#00FF66]/30",
    neon: "bg-[#00FF66] text-black border-transparent shadow-neon-glow-sm",
    outline: "border-border text-foreground",
    secondary: "bg-surface-elevated text-muted border-transparent",
  };

  return (
    <span className={cn(baseClasses, variants[variant], className)} {...props}>
      {children}
    </span>
  );
}
