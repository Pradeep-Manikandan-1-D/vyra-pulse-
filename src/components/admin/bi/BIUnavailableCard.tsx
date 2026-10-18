"use client";

import React, { useState } from "react";
import { AlertCircle, Code2, Database, ChevronDown, ChevronUp } from "lucide-react";
import { Card } from "@/components/ui/Card";

interface BIUnavailableCardProps {
  title: string;
  category: string;
  reason: string;
  requiredSchema?: string;
  missingColumns?: string[];
}

export function BIUnavailableCard({
  title,
  category,
  reason,
  requiredSchema,
  missingColumns,
}: BIUnavailableCardProps) {
  const [showSql, setShowSql] = useState(false);

  return (
    <Card className="p-5 border-amber-500/20 bg-amber-500/5 backdrop-blur-xl relative overflow-hidden flex flex-col justify-between">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold">
                METRIC STATUS: UNAVAILABLE
              </span>
              <h4 className="text-sm font-bold text-foreground">{title}</h4>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-muted-foreground border border-white/10">
            {category}
          </span>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">{reason}</p>

        {missingColumns && missingColumns.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">
              Missing Database Telemetry:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {missingColumns.map((col) => (
                <code
                  key={col}
                  className="px-2 py-0.5 text-[11px] font-mono rounded-md bg-black/60 border border-white/15 text-amber-300"
                >
                  {col}
                </code>
              ))}
            </div>
          </div>
        )}
      </div>

      {requiredSchema && (
        <div className="pt-3 border-t border-amber-500/10 mt-3">
          <button
            type="button"
            onClick={() => setShowSql(!showSql)}
            className="flex items-center gap-1.5 text-[11px] text-amber-400 hover:text-amber-300 font-semibold transition-colors"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>{showSql ? "Hide Migration Blueprint" : "View Recommended Schema SQL"}</span>
            {showSql ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {showSql && (
            <pre className="mt-2 p-3 rounded-xl bg-black/80 border border-white/10 text-[10px] font-mono text-emerald-400 overflow-x-auto">
              <code>{requiredSchema}</code>
            </pre>
          )}
        </div>
      )}
    </Card>
  );
}
