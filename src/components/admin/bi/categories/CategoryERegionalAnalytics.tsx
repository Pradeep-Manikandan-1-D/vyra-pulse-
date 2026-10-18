"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { ArrowRight, MapPin, Compass } from "lucide-react";
import { FullBIDataset } from "@/lib/bi/types";
import { BIChartCard, BIHighContrastTooltip } from "../BIChartCard";
import { BIUnavailableCard } from "../BIUnavailableCard";
import { Button } from "@/components/ui/Button";

interface CategoryERegionalAnalyticsProps {
  dataset: FullBIDataset;
  isExpanded?: boolean;
  onViewAll?: () => void;
  onDrilldown: (category: string, key: string, title: string) => void;
}

export function CategoryERegionalAnalytics({
  dataset,
  isExpanded = false,
  onViewAll,
  onDrilldown,
}: CategoryERegionalAnalyticsProps) {
  const { regionalAnalytics } = dataset;
  const topCities = regionalAnalytics.cities.slice(0, 8);

  return (
    <div className="space-y-6">
      {/* Category Section Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold">
              CATEGORY E
            </span>
            <h2 className="text-lg font-bold text-foreground">Regional & Geographic Analytics</h2>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Geographic order concentration, city-level transaction volume, state revenues, and flavor preferences.
          </p>
        </div>

        {!isExpanded && onViewAll && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onViewAll}
            className="gap-2 text-xs border-cyan-500/30 hover:border-cyan-500/60"
          >
            <span>View All Category E Charts (11)</span>
            <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
          </Button>
        )}
      </div>

      {/* Grid of Highlight Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Orders by State / Region */}
        <BIChartCard
          title="1. Orders by State (Volume Distribution)"
          subtitle="Total transactions fulfilled across southern hub states"
          definition="Count of orders by delivery_state."
          onDrilldown={() => onDrilldown("region", "Tamil Nadu", "State Orders Ledger")}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={regionalAnalytics.states} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="state" tick={{ fill: "#71717A", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#71717A", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<BIHighContrastTooltip valueSuffix=" Orders" />} />
              <Bar dataKey="totalOrders" name="Orders" fill="#00FF66" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </BIChartCard>

        {/* 2. Top Cities by Order Density */}
        <BIChartCard
          title="2. Metro & Tier-2 City Order Density"
          subtitle="Top urban centers driving Vyra Pulse consumption"
          definition="Orders grouped by delivery_city from customer checkout telemetry."
          onDrilldown={() => onDrilldown("region", "cities", "City Orders Breakdown")}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topCities} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis type="number" tick={{ fill: "#71717A", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="city" tick={{ fill: "#D4D4D8", fontSize: 10 }} axisLine={false} tickLine={false} width={85} />
              <Tooltip content={<BIHighContrastTooltip valueSuffix=" Orders" />} />
              <Bar dataKey="totalOrders" name="Orders" fill="#38BDF8" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </BIChartCard>

        {/* 8. Average Order Value (AOV) by Region */}
        <BIChartCard
          title="8. Average Order Value (AOV) by State"
          subtitle="Ticket size variance across geographic territories"
          definition="Total revenue in state divided by total orders placed in state."
          onDrilldown={() => onDrilldown("region", "aov", "Regional AOV Ledger")}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={regionalAnalytics.states} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="state" tick={{ fill: "#71717A", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#71717A", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
              <Tooltip content={<BIHighContrastTooltip valuePrefix="₹" />} />
              <Bar dataKey="aov" name="Avg Order Value" fill="#F59E0B" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </BIChartCard>

        {/* 10. Regional Flavor Preference Heatmap */}
        <BIChartCard
          title="10. Regional Flavor Affinity Matrix"
          subtitle="Relative preference index for signature flavors by territory"
          definition="Dispatched flavor units by customer delivery state."
          onDrilldown={() => onDrilldown("region", "flavor_pref", "Flavor Demand Map")}
        >
          <div className="overflow-x-auto h-full">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-muted-foreground font-mono text-[10px] uppercase">
                  <th className="py-2 px-2.5">Region</th>
                  <th className="py-2 px-2 text-center text-[#CCFF00]">Citrus</th>
                  <th className="py-2 px-2 text-center text-[#38BDF8]">Blueberry</th>
                  <th className="py-2 px-2 text-center text-[#F59E0B]">Mango</th>
                  <th className="py-2 px-2 text-center text-[#F43F5E]">Watermelon</th>
                  <th className="py-2 px-2 text-center text-[#A855F7]">Grape</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono text-xs">
                {regionalAnalytics.preferences.map((p) => (
                  <tr key={p.region} className="hover:bg-white/5">
                    <td className="py-2.5 px-2.5 font-bold text-foreground">{p.region}</td>
                    <td className="py-2.5 px-2 text-center text-[#CCFF00] font-bold">{p.citrus}</td>
                    <td className="py-2.5 px-2 text-center text-[#38BDF8] font-bold">{p.blueberry}</td>
                    <td className="py-2.5 px-2 text-center text-[#F59E0B] font-bold">{p.mango}</td>
                    <td className="py-2.5 px-2 text-center text-[#F43F5E] font-bold">{p.watermelon}</td>
                    <td className="py-2.5 px-2 text-center text-[#A855F7] font-bold">{p.grape}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </BIChartCard>

        {/* Expanded View Items */}
        {isExpanded && (
          <>
            {/* 5. High vs Low Order Regions Comparison */}
            <BIChartCard
              title="5. High vs Low Order Territory Comparison"
              subtitle="Concentration index comparing highest-performing state vs emerging markets"
              definition="Compares Tamil Nadu (Primary Hub) vs Telangana & Kerala expansion."
              onDrilldown={() => onDrilldown("region", "comparison", "Hub vs Expansion Ledger")}
            >
              <div className="space-y-4 p-4">
                {regionalAnalytics.states.map((s) => (
                  <div key={s.state} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-foreground">{s.state}</span>
                      <span className="font-mono text-muted-foreground">
                        {s.totalOrders} Orders • ₹{s.revenue.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#00FF66]"
                        style={{
                          width: `${Math.min(100, (s.totalOrders / (regionalAnalytics.states[0]?.totalOrders || 1)) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </BIChartCard>

            {/* 3. Profit by Region - Unavailable Card */}
            <BIUnavailableCard
              title="3. Net Profit by Region"
              category="COGS Dependent"
              reason="Calculating territory profit requires regional freight carrier shipping invoices and local depot storage costs."
              missingColumns={["orders.shipping_carrier_cost_inr", "products.cost_price_inr"]}
            />
          </>
        )}
      </div>
    </div>
  );
}
