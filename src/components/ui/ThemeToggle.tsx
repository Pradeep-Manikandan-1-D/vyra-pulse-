"use client";

import React, { useEffect, useState } from "react";
import { Moon, Sparkles, Sun } from "lucide-react";
import { useTheme } from "@/components/theme/ThemeProvider";
import { cn } from "@/lib/utils";

export function ThemeToggle({
  className = "",
  showLabel = false,
  variant = "pill",
}: {
  className?: string;
  showLabel?: boolean;
  variant?: "pill" | "button";
}) {
  const { resolvedTheme, toggleTheme, setTheme, themeName } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? resolvedTheme === "dark" : true;

  if (variant === "pill" && showLabel) {
    return (
      <div
        role="group"
        aria-label="Theme selector: Dark Elegant or Mint Fresh"
        className={cn(
          "inline-flex items-center p-1 rounded-2xl neu-inset border border-border text-xs font-medium transition-colors",
          className
        )}
      >
        <button
          type="button"
          onClick={() => setTheme("dark")}
          aria-pressed={isDark}
          aria-label="Switch to Dark Elegant Theme"
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all duration-200 font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            isDark
              ? "bg-surface-elevated text-foreground shadow-sm border border-border/80"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Moon className={cn("w-3.5 h-3.5", isDark ? "text-primary" : "text-muted-foreground")} />
          <span>Dark Elegant</span>
        </button>

        <button
          type="button"
          onClick={() => setTheme("light")}
          aria-pressed={!isDark}
          aria-label="Switch to Mint Fresh Theme"
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all duration-200 font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            !isDark
              ? "bg-surface text-foreground shadow-sm border border-border/80"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Sun className={cn("w-3.5 h-3.5", !isDark ? "text-primary" : "text-muted-foreground")} />
          <span>Mint Fresh</span>
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      type="button"
      title={`Current: ${themeName}. Click to switch theme`}
      aria-label={`Current theme is ${themeName}. Click to toggle theme.`}
      className={cn(
        "group relative inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl neu-raised-sm hover:border-primary/50 text-xs font-semibold text-foreground transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        className
      )}
    >
      <div className="relative w-4 h-4 flex items-center justify-center">
        {isDark ? (
          <Moon className="w-4 h-4 text-primary group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-300" />
        ) : (
          <Sun className="w-4 h-4 text-primary group-hover:scale-110 group-hover:rotate-90 transition-transform duration-300" />
        )}
      </div>
      {showLabel && (
        <span className="text-xs font-semibold tracking-tight text-foreground">
          {isDark ? "Dark Elegant" : "Mint Fresh"}
        </span>
      )}
    </button>
  );
}
