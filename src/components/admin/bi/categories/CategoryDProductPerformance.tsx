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
  ScatterChart,
  Scatter,
  ZAxis,
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
          subtitle="Total cans dispatched across all 8 signature formulas"
          definition="Sum of order_items.quantity grouped by product_id."
          onDrilldown={() => onDrilldown("product", "units", "Product Unit Sales")}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={productPerformance.products}
              layout="vertical"
              margin={{ top: 0, right: 20, bottom: 0, left: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis type="number" tick={{ fill: "#71717A", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis
                type="category"
                dataKey="productName"
                tick={{ fill: "#D4D4D8", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={100}
              />
              <Tooltip content={<BIHighContrastTooltip valueSuffix=" Cans" />} />
              <Bar dataKey="unitsSold" name="Cans Sold" radius={[0, 4, 4, 0]}>
                {productPerformance.products.map((p, idx) => (
                  <Cell key={idx} fill={p.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
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

        {/* 6. Product Revenue vs Units Sold (Scatter Plot) */}
        <BIChartCard
          title="6. Revenue vs Units Sold Correlation"
          subtitle="Unit volume vs total billing value per product"
          definition="Scatter coordinate mapping (X: Units Sold, Y: Revenue INR)."
          onDrilldown={() => onDrilldown("product", "scatter", "Scatter Economics")}
        >
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="units" name="Units" tick={{ fill: "#71717A", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis dataKey="revenue" name="Revenue" tick={{ fill: "#71717A", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
              <ZAxis range={[60, 200]} />
              <Tooltip content={<BIHighContrastTooltip valuePrefix="₹" />} />
              <Scatter name="Products" data={productPerformance.scatterData} fill="#00FF66" />
            </ScatterChart>
          </ResponsiveContainer>
        </BIChartCard>

        {/* 10. Frequently Purchased Combinations */}
        <BIChartCard
          title="10. Frequently Purchased Flavor Pairings"
          subtitle="Multi-can cart affinity combinations across orders"
          definition="Co-occurrence frequency of distinct flavors in the same order."
          onDrilldown={() => onDrilldown("product", "combos", "Basket Affinity Rules")}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={productPerformance.productCombinations} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="comboPair" tick={{ fill: "#71717A", fontSize: 10 }} axisLine={false} tickLine={false} />
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
              subtitle="Proportion of placed orders cancelled per flavor"
              definition="Cancelled orders containing this SKU divided by total orders for this SKU."
              onDrilldown={() => onDrilldown("product", "cancellations", "Cancellation Logs")}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={productPerformance.products} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="flavor" tick={{ fill: "#71717A", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#71717A", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                  <Tooltip content={<BIHighContrastTooltip valueSuffix="%" />} />
                  <Bar dataKey="cancellationRatePct" name="Cancellation %" fill="#F43F5E" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
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
