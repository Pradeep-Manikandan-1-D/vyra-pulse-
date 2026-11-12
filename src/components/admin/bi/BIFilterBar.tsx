"use client";

import React from "react";
import { Filter, Calendar, Zap, Tag, MapPin, RotateCcw } from "lucide-react";
import { BIFilterState } from "@/lib/bi/types";
import { VYRA_FLAVORS } from "@/lib/constants";

interface BIFilterBarProps {
  filters: BIFilterState;
  onChange: (updated: Partial<BIFilterState>) => void;
  onReset: () => void;
  totalOrdersCount: number;
}

export function BIFilterBar({ filters, onChange, onReset, totalOrdersCount }: BIFilterBarProps) {
  const isFiltered =
    filters.dateRange !== "all" ||
    filters.flavorId !== "all" ||
    filters.orderStatus !== "all" ||
    filters.stateRegion !== "all";

  return (
    <div className="p-4 rounded-2xl border border-border/80 bg-surface/90 backdrop-blur-xl space-y-3 shadow-md dark:border-white/10 dark:bg-surface/50 transition-colors">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Filter Title & Active Count */}
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[#00FF66]/10 text-[#00FF66] border border-[#00FF66]/20 shadow-[0_0_8px_rgba(0,255,102,0.2)]">
            <Filter className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-foreground flex items-center gap-2">
              Analytical Filter Controls
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-surface-secondary border border-border text-foreground font-mono dark:bg-white/10 dark:border-white/10 dark:text-muted-foreground">
                {totalOrdersCount} Sampled Orders
              </span>
            </h3>
          </div>
        </div>

        {/* Right: Reset Action */}
        {isFiltered && (
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1.5 text-xs text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 font-semibold transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset All Filters
          </button>
        )}
      </div>

      {/* Filter Selectors Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1 border-t border-border/40 dark:border-white/5">
        {/* 1. Date Range */}
        <div className="space-y-1">
          <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-1">
            <Calendar className="w-3 h-3 text-[#00FF66]" />
            Date Period
          </label>
          <div className="grid grid-cols-4 gap-1 p-1 bg-surface-inset rounded-xl border border-border dark:border-white/10 dark:bg-black/30">
            {(["7d", "30d", "90d", "all"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => onChange({ dateRange: r })}
                className={`py-1 text-center text-xs font-bold rounded-lg transition-all ${
                  filters.dateRange === r
                    ? "bg-[#00FF66] text-black shadow-[0_0_12px_rgba(0,255,102,0.35)]"
                    : "text-muted-foreground hover:text-foreground hover:bg-surface/50"
                }`}
              >
                {r.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Flavor / Product */}
        <div className="space-y-1">
          <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-1">
            <Zap className="w-3 h-3 text-[#38BDF8]" />
            Product & Flavor
          </label>
          <select
            value={filters.flavorId}
            onChange={(e) => onChange({ flavorId: e.target.value })}
            className="w-full h-9 px-3 text-xs bg-surface-inset border border-border rounded-xl text-foreground font-medium focus:outline-none focus:ring-1 focus:ring-[#00FF66] focus:border-[#00FF66] dark:bg-black/40 dark:border-white/15 dark:text-foreground dark:focus:border-[#00FF66]/70 transition-all cursor-pointer"
          >
            <option value="all" className="bg-surface text-foreground dark:bg-[#18181b] dark:text-neutral-100">
              All 8 Flavors
            </option>
            {VYRA_FLAVORS.map((f) => (
              <option
                key={f.id}
                value={f.id}
                className="bg-surface text-foreground dark:bg-[#18181b] dark:text-neutral-100"
              >
                {f.flavor} ({f.id})
              </option>
            ))}
          </select>
        </div>

        {/* 3. Order Status */}
        <div className="space-y-1">
          <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-1">
            <Tag className="w-3 h-3 text-[#F59E0B]" />
            Order Status
          </label>
          <select
            value={filters.orderStatus}
            onChange={(e) => onChange({ orderStatus: e.target.value })}
            className="w-full h-9 px-3 text-xs bg-surface-inset border border-border rounded-xl text-foreground font-medium focus:outline-none focus:ring-1 focus:ring-[#00FF66] focus:border-[#00FF66] dark:bg-black/40 dark:border-white/15 dark:text-foreground dark:focus:border-[#00FF66]/70 transition-all cursor-pointer"
          >
            <option value="all" className="bg-surface text-foreground dark:bg-[#18181b] dark:text-neutral-100">
              All Statuses (Delivered, Shipped, Processing, Cancelled)
            </option>
            <option value="delivered" className="bg-surface text-foreground dark:bg-[#18181b] dark:text-neutral-100">
              Delivered Only
            </option>
            <option value="shipped" className="bg-surface text-foreground dark:bg-[#18181b] dark:text-neutral-100">
              Shipped Only
            </option>
            <option value="processing" className="bg-surface text-foreground dark:bg-[#18181b] dark:text-neutral-100">
              Processing Only
            </option>
            <option value="cancelled" className="bg-surface text-foreground dark:bg-[#18181b] dark:text-neutral-100">
              Cancelled Only
            </option>
          </select>
        </div>

        {/* 4. State / Region */}
        <div className="space-y-1">
          <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-1">
            <MapPin className="w-3 h-3 text-[#A855F7]" />
            State / Region
          </label>
          <select
            value={filters.stateRegion}
            onChange={(e) => onChange({ stateRegion: e.target.value })}
            className="w-full h-9 px-3 text-xs bg-surface-inset border border-border rounded-xl text-foreground font-medium focus:outline-none focus:ring-1 focus:ring-[#00FF66] focus:border-[#00FF66] dark:bg-black/40 dark:border-white/15 dark:text-foreground dark:focus:border-[#00FF66]/70 transition-all cursor-pointer"
          >
            <option value="all" className="bg-surface text-foreground dark:bg-[#18181b] dark:text-neutral-100">
              All Delivery States
            </option>
            <option value="Tamil Nadu" className="bg-surface text-foreground dark:bg-[#18181b] dark:text-neutral-100">
              Tamil Nadu
            </option>
            <option value="Karnataka" className="bg-surface text-foreground dark:bg-[#18181b] dark:text-neutral-100">
              Karnataka
            </option>
            <option value="Kerala" className="bg-surface text-foreground dark:bg-[#18181b] dark:text-neutral-100">
              Kerala
            </option>
            <option value="Telangana" className="bg-surface text-foreground dark:bg-[#18181b] dark:text-neutral-100">
              Telangana
            </option>
          </select>
        </div>
      </div>
    </div>
  );
}
