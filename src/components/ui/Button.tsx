import React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    const baseClasses =
      "inline-flex items-center justify-center font-medium transition-all duration-200 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-primary";

    const variantClasses = {
      primary:
        "neu-btn-primary font-semibold active:scale-[0.98]",
      secondary:
        "neu-btn text-foreground font-medium active:scale-[0.98]",
      outline:
        "neu-raised-sm text-foreground hover:border-primary/60 hover:text-primary active:scale-[0.98]",
      ghost:
        "text-muted-foreground hover:text-foreground hover:bg-surface-inset active:scale-[0.98]",
      danger:
        "bg-rose-600 text-white hover:bg-rose-500 shadow-sm active:scale-[0.98]",
    };

    const sizeClasses = {
      sm: "text-xs px-3 py-1.5 gap-1.5",
      md: "text-sm px-4 py-2 gap-2",
      lg: "text-base px-6 py-3 gap-2.5",
    };

    return (
      <button
        ref={ref}
        className={cn(baseClasses, variantClasses[variant], sizeClasses[size], className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
