"use client";

import React, { useState } from "react";
import { X, Search, Download, ExternalLink, Database, Layers } from "lucide-react";
import { BIDrilldownData } from "@/lib/bi/types";
import { Button } from "@/components/ui/Button";

interface BIDrilldownModalProps {
  data: BIDrilldownData;
  onClose: () => void;
}

export function BIDrilldownModal({ data, onClose }: BIDrilldownModalProps) {
  const [searchTerm, setSearchTerm] = useState("");

  if (!data.isOpen) return null;

  const filteredRecords = data.records.filter((r) => {
    const q = searchTerm.toLowerCase();
    return (
      r.primaryText.toLowerCase().includes(q) ||
      r.secondaryText.toLowerCase().includes(q) ||
      (r.statusBadge && r.statusBadge.toLowerCase().includes(q))
    );
  });

  const exportCsv = () => {
    const headers = ["ID", "Primary", "Details", "Metric_Label", "Metric_Value", "Status", "Timestamp"];
    const rows = filteredRecords.map((r) => [
      r.id,
      `"${r.primaryText.replace(/"/g, '""')}"`,
      `"${r.secondaryText.replace(/"/g, '""')}"`,
      `"${r.metricLabel}"`,
      `"${r.metricValue}"`,
      `"${r.statusBadge || ""}"`,
      `"${r.timestamp || ""}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `vyra_bi_drilldown_${data.category.toLowerCase()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl rounded-3xl border border-white/15 bg-neutral-950 p-6 shadow-2xl space-y-5 overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-[#00FF66]/30 bg-[#00FF66]/10 text-[10px] font-mono font-semibold text-[#00FF66]">
              <Database className="w-3 h-3" />
              <span>POSTGRESQL DRILL-DOWN TELEMETRY</span>
            </div>
            <h2 className="text-xl font-bold text-foreground">{data.title}</h2>
            <p className="text-xs text-muted-foreground">{data.filterContext}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl border border-white/10 text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Controls & Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search drilldown records..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white/5 border border-white/10 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#00FF66]/50 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button variant="secondary" size="sm" onClick={exportCsv} className="gap-2 text-xs">
              <Download className="w-3.5 h-3.5" />
              Export Records CSV
            </Button>
          </div>
        </div>

        {/* Records Table / List */}
        <div className="max-h-[380px] overflow-y-auto space-y-2 pr-1 divide-y divide-white/5">
          {filteredRecords.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground space-y-2">
              <Layers className="w-8 h-8 mx-auto text-muted-foreground/40" />
              <p>No matching database records found for this query.</p>
            </div>
          ) : (
            filteredRecords.map((r) => (
              <div
                key={r.id}
                className="pt-2 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/5 p-2.5 rounded-xl transition-colors"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-foreground">{r.primaryText}</span>
                    {r.statusBadge && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-muted-foreground border border-white/10">
                        {r.statusBadge}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground">{r.secondaryText}</p>
                  {r.timestamp && (
                    <p className="text-[10px] font-mono text-neutral-500">{r.timestamp}</p>
                  )}
                </div>

                <div className="text-left sm:text-right shrink-0">
                  <p className="text-xs font-mono font-bold text-[#00FF66]">{r.metricValue}</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {r.metricLabel}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-white/10 pt-4 text-xs text-muted-foreground">
          <span>
            Showing {filteredRecords.length} of {data.records.length} database entries
          </span>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Done Inspecting
          </Button>
        </div>
      </div>
    </div>
  );
}
