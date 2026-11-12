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
  LabelList,
} from "recharts";
import { ArrowRight, Package, Sparkles } from "lucide-react";
import { FullBIDataset } from "@/lib/bi/types";
import { BIChartCard, BIHighContrastTooltip } from "../BIChartCard";
import { BIUnavailableCard } from "../BIUnavailableCard";
import { Button } from "@/components/ui/Button";

interface CategoryDProductPerformanceProps {
  dataset: FullBIDataset;
  isExpanded?: boolean;
  onViewAll?: () => void;
  onDrilldown: (category: string, key: string, title: string) => void;
}

export function CategoryDProductPerformance({
  dataset,
  isExpanded = false,
  onViewAll,
  onDrilldown,
}: CategoryDProductPerformanceProps) {
  const { productPerformance, summaryKpis } = dataset;

  const activeProducts = productPerformance.products.filter((p) => p.unitsSold > 0);
  const activeCancellations = productPerformance.products.filter((p) => p.cancellationRatePct >= 0);

  return (
    <div className="space-y-6">
      {/* Category Section Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
              CATEGORY D
            </span>
            <h2 className="text-lg font-bold text-foreground">Product & Flavor Performance</h2>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Unit sales velocity, flavor popularity distribution, cross-purchase combinations, and SKU economics.
          </p>
        </div>

        {!isExpanded && onViewAll && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onViewAll}
            className="gap-2 text-xs border-emerald-500/30 hover:border-emerald-500/60"
          >
            <span>View All Category D Charts (12)</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#00FF66]" />
          </Button>
        )}
      </div>

      {/* Grid of Highlight Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Best-Selling Products by Units */}
        <BIChartCard
          title="1. Best-Selling Products by Units"
          subtitle="Ranked volume across active signature formulas (excluding cancellations)"
          definition="Sum of non-cancelled order_items.quantity grouped by product_id."
          onDrilldown={() => onDrilldown("product", "units", "Product Unit Sales")}
        >
          {activeProducts.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-muted-foreground">
                <Package className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-semibold text-foreground">No Units Dispatched</p>
              <p className="text-xs text-muted-foreground max-w-xs">
                No fulfilled product volume found for the active filter criteria.
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(220, activeProducts.length * 58)}>
              <BarChart
                data={activeProducts}
                layout="vertical"
                margin={{ top: 12, right: 85, bottom: 5, left: 15 }}
                barSize={32}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fill: "#71717A", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v.toLocaleString("en-IN")}`}
                />
                <YAxis
                  type="category"
                  dataKey="productName"
                  tick={{ fill: "#D4D4D8", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={130}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const item = payload[0].payload;
                    return (
                      <div className="bg-[#18181b] border border-white/20 rounded-xl p-3 text-xs shadow-2xl space-y-1.5 text-white backdrop-blur-xl">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                            style={{ backgroundColor: item.color }}
                          />
                          <p className="font-bold text-[#00FF66] font-mono">{item.productName} ({item.flavor})</p>
                        </div>
                        <p className="text-neutral-300">
                          Dispatched Units: <span className="font-bold text-white font-mono">{item.unitsSold} cans</span>
                        </p>
                        <p className="text-neutral-300">
                          Recognized Revenue:{" "}
                          <span className="font-bold text-white font-mono">
                            ₹{item.revenue.toLocaleString("en-IN")}
                          </span>
                        </p>
                        <p className="text-neutral-300">
                          Portfolio Volume Share:{" "}
                          <span className="font-bold text-[#00E5FF] font-mono">{item.salesSharePct}%</span>
                        </p>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="unitsSold" name="Cans Sold" radius={[0, 4, 4, 0]}>
                  {activeProducts.map((p, idx) => (
                    <Cell key={idx} fill={p.color} />
                  ))}
                  <LabelList
                    dataKey="unitsSold"
                    position="right"
                    fill="#F5F7F4"
                    fontSize={11}
                    formatter={(v: number) => `${v.toLocaleString("en-IN")} cans`}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </BIChartCard>

        {/* 8. Product Sales Mix (Donut) */}
        <BIChartCard
          title="8. Product Sales Mix Share"
          subtitle="Percentage contribution to total transaction volume"
          definition="Individual product units divided by total portfolio units sold."
          onDrilldown={() => onDrilldown("product", "mix", "Portfolio Sales Mix")}
        >
          <div className="h-full flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={productPerformance.products}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  dataKey="unitsSold"
                  nameKey="flavor"
                  paddingAngle={2}
                >
                  {productPerformance.products.map((p, idx) => (
                    <Cell key={idx} fill={p.color} />
                  ))}
                </Pie>
                <Tooltip content={<BIHighContrastTooltip valueSuffix=" Cans" />} />
                <Legend wrapperStyle={{ fontSize: "10px", paddingTop: "8px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </BIChartCard>

        {/* 10. Frequently Purchased Combinations */}
        <BIChartCard
          title="10. Frequently Purchased Flavor Pairings"
          subtitle="Multi-can cart affinity combinations across orders"
          definition="Co-occurrence frequency of distinct flavors in the same order."
          className="lg:col-span-2"
          onDrilldown={() => onDrilldown("product", "combos", "Basket Affinity Rules")}
        >
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={productPerformance.productCombinations} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="comboPair" tick={{ fill: "#A1A1AA", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#71717A", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<BIHighContrastTooltip valueSuffix=" Carts" />} />
              <Bar dataKey="frequency" name="Joint Orders" fill="#A855F7" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </BIChartCard>

        {/* Expanded View Items (3, 7, 11, 12) */}
        {isExpanded && (
          <>
            {/* 11. Average Selling Price (ASP) */}
            <BIChartCard
              title="11. Average Selling Price (ASP) by SKU"
              subtitle="Realized unit price snapshot per can"
              definition="line_total_inr divided by quantity for each product."
              onDrilldown={() => onDrilldown("product", "asp", "Pricing Ledger")}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={productPerformance.products} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="flavor" tick={{ fill: "#71717A", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#71717A", fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 200]} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip content={<BIHighContrastTooltip valuePrefix="₹" />} />
                  <Bar dataKey="avgUnitPrice" name="Unit Price" fill="#38BDF8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </BIChartCard>

            {/* 12. Cancellation / Return Rate by Product */}
            <BIChartCard
              title="12. Order Cancellation Rate by SKU"
              subtitle="Proportion of ordered volume cancelled per active flavor"
              definition="Cancelled cans divided by total ordered cans (fulfilled + cancelled) for each active SKU."
              onDrilldown={() => onDrilldown("product", "cancellations", "Cancellation Logs")}
            >
              {activeCancellations.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center p-6 space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-muted-foreground">
                    <Package className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">No Cancellation Data</p>
                  <p className="text-xs text-muted-foreground max-w-xs">
                    No orders recorded for SKUs in the active filter criteria.
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={activeCancellations} margin={{ top: 20, right: 25, bottom: 15, left: 15 }} barSize={44}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                      dataKey="flavor"
                      tick={{ fill: "#A1A1AA", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: "#71717A", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      domain={[0, "auto"]}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const item = payload[0].payload;
                        return (
                          <div className="bg-[#18181b] border border-white/20 rounded-xl p-3 text-xs shadow-2xl space-y-1.5 text-white backdrop-blur-xl">
                            <div className="flex items-center gap-1.5">
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                                style={{ backgroundColor: item.color }}
                              />
                              <p className="font-bold text-[#00FF66] font-mono">{item.productName} ({item.flavor})</p>
                            </div>
                            <p className="text-neutral-300">
                              Cancellation Rate:{" "}
                              <span className="font-bold text-rose-400 font-mono">{item.cancellationRatePct}%</span>
                            </p>
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="cancellationRatePct" name="Cancellation %" radius={[4, 4, 0, 0]}>
                      {activeCancellations.map((p, idx) => (
                        <Cell key={idx} fill={p.color} />
                      ))}
                      <LabelList
                        dataKey="cancellationRatePct"
                        position="top"
                        fill="#F5F7F4"
                        fontSize={11}
                        formatter={(val: number) => `${val}%`}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </BIChartCard>

            {/* 7. Product Profitability - Unavailable Card */}
            <BIUnavailableCard
              title="7. Product Profitability Ranking"
              category="COGS Dependent"
              reason="Net profit margin per SKU requires deducting recipe syrup costs and packaging expenses."
              missingColumns={["products.cost_price_inr"]}
            />
          </>
        )}
      </div>
    </div>
  );
}
