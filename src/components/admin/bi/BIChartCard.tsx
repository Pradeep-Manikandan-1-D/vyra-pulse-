"use client";

import React, { useState } from "react";
import { Info, BarChart2, TrendingUp, Layers, Maximize2, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/Card";

interface BIChartCardProps {
  title: string;
  subtitle?: string;
  definition?: string;
  categoryTag?: string;
  supportedTypes?: Array<"bar" | "line" | "area">;
  currentType?: "bar" | "line" | "area";
  onTypeChange?: (type: "bar" | "line" | "area") => void;
  onDrilldown?: () => void;
  children: React.ReactNode;
  heightClass?: string;
  className?: string;
}

export function BIChartCard({
  title,
  subtitle,
  definition,
  categoryTag,
  supportedTypes,
  currentType,
  onTypeChange,
  onDrilldown,
  children,
  heightClass = "h-72",
  className = "",
}: BIChartCardProps) {
  const [showDefinition, setShowDefinition] = useState(false);

  return (
    <Card
      className={`p-5 border-white/10 bg-surface/50 backdrop-blur-xl relative flex flex-col justify-between overflow-hidden group hover:border-white/20 transition-all duration-200 ${className}`}
    >
      {/* Top Header */}
      <div className="space-y-1 mb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-foreground tracking-tight">{title}</h3>
              {categoryTag && (
                <span className="text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-muted-foreground">
                  {categoryTag}
                </span>
              )}
            </div>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Chart Type Toggle */}
            {supportedTypes && supportedTypes.length > 1 && onTypeChange && currentType && (
              <div className="flex items-center p-0.5 rounded-lg bg-black/40 border border-white/10 text-[10px]">
                {supportedTypes.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => onTypeChange(t)}
                    className={`px-2 py-0.5 rounded uppercase font-mono font-bold transition-all ${
                      currentType === t
                        ? "bg-[#00FF66] text-black shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}

            {/* Definition Popover Toggle */}
            {definition && (
              <button
                type="button"
                onClick={() => setShowDefinition(!showDefinition)}
                title="Metric Definition"
                className={`p-1.5 rounded-lg border transition-colors ${
                  showDefinition
                    ? "bg-[#00FF66]/20 border-[#00FF66]/40 text-[#00FF66]"
                    : "border-white/10 text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}
              >
                <Info className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Drilldown Action */}
            {onDrilldown && (
              <button
                type="button"
                onClick={onDrilldown}
                title="Drilldown to Database Records"
                className="p-1.5 rounded-lg border border-white/10 text-muted-foreground hover:text-[#00FF66] hover:border-[#00FF66]/30 hover:bg-[#00FF66]/10 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Metric Definition Banner */}
        {showDefinition && definition && (
          <div className="p-2.5 rounded-xl bg-black/60 border border-white/15 text-xs text-neutral-300 animate-in fade-in duration-150 space-y-1">
            <span className="font-mono text-[10px] text-[#00FF66] font-bold uppercase tracking-wider block">
              Calculation Methodology:
            </span>
            <p className="leading-relaxed text-[11px]">{definition}</p>
          </div>
        )}
      </div>

      {/* Main Chart Body */}
      <div className={`w-full ${heightClass}`}>{children}</div>
    </Card>
  );
}

// ─── HIGH-CONTRAST TOOLTIP HELPER ─────────────────────────────────────────────
// Fixes any invisible letters by using explicit high-contrast white text,
// neon lime labels, and dark neutral background.
export const BIHighContrastTooltip = ({
  active,
  payload,
  label,
  valuePrefix = "",
  valueSuffix = "",
}: {
  active?: boolean;
  payload?: any[];
  label?: string;
  valuePrefix?: string;
  valueSuffix?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#18181b] border border-white/20 rounded-xl p-3 text-xs shadow-2xl space-y-1.5 text-white backdrop-blur-xl">
      {label && <p className="font-bold text-[#00FF66] text-xs mb-1 font-mono">{label}</p>}
      {payload.map((p, idx) => (
        <div key={idx} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
              style={{ backgroundColor: p.color || "#00FF66" }}
            />
            <span className="text-neutral-300 capitalize font-medium text-[11px]">
              {p.name || "Value"}:
            </span>
          </div>
          <span className="font-bold text-white font-mono text-[11px]">
            {valuePrefix}
            {typeof p.value === "number" ? p.value.toLocaleString("en-IN") : p.value}
            {valueSuffix}
          </span>
        </div>
      ))}
    </div>
  );
};
