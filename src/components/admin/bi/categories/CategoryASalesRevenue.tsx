"use client";

import React, { useState } from "react";
import {
  LineChart,
  Line,
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
import { ArrowRight, TrendingUp, DollarSign } from "lucide-react";
import { FullBIDataset } from "@/lib/bi/types";
import { BIChartCard, BIHighContrastTooltip } from "../BIChartCard";
import { Button } from "@/components/ui/Button";

interface CategoryASalesRevenueProps {
  dataset: FullBIDataset;
  isExpanded?: boolean;
  onViewAll?: () => void;
  onDrilldown: (category: string, key: string, title: string) => void;
}

export function CategoryASalesRevenue({
  dataset,
  isExpanded = false,
  onViewAll,
  onDrilldown,
}: CategoryASalesRevenueProps) {
  const { salesRevenue, summaryKpis } = dataset;
  const [trendChartType, setTrendChartType] = useState<"line" | "bar" | "area">("line");
  const [monthChartType, setMonthChartType] = useState<"line" | "bar" | "area">("bar");

  // Telemetry channel distribution
  const salesChannelData = [
    { channel: "Vyra Direct D2C Web", share: 100, revenue: summaryKpis.grossSales, color: "#00FF66" },
  ];

  return (
    <div className="space-y-6">
      {/* Category Section Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#00FF66]/10 text-[#00FF66] border border-[#00FF66]/20 font-bold">
              CATEGORY A
            </span>
            <h2 className="text-lg font-bold text-foreground">Sales & Revenue Analytics</h2>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Gross sales, discount deductions, net revenue run-rates, and product contribution trends.
          </p>
        </div>

        {!isExpanded && onViewAll && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onViewAll}
            className="gap-2 text-xs border-emerald-500/30 hover:border-emerald-500/60"
          >
            <span>View All Category A Charts (10)</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#00FF66]" />
          </Button>
        )}
      </div>

      {/* Grid of Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Revenue Trend (Line / Bar) */}
        <BIChartCard
          title="1. Revenue & Gross Sales Trend"
          subtitle="Chronological net sales vs discount reductions over selected period"
          definition="Net Sales = Gross Subtotal minus coupon discounts. Excludes cancelled orders."
          supportedTypes={["line", "bar"]}
          currentType={trendChartType}
          onTypeChange={setTrendChartType}
          onDrilldown={() => onDrilldown("revenue", "all", "Daily Sales Order Journal")}
        >
          <ResponsiveContainer width="100%" height="100%">
            {trendChartType === "line" ? (
              <LineChart data={salesRevenue.revenueTrends} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fill: "#71717A", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fill: "#71717A", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `₹${v}`}
                />
                <Tooltip content={<BIHighContrastTooltip valuePrefix="₹" />} />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                <Line type="monotone" dataKey="netSales" name="Net Sales" stroke="#00FF66" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="discounts" name="Discounts" stroke="#F43F5E" strokeWidth={1.5} strokeDasharray="4 2" />
              </LineChart>
            ) : (
              <BarChart data={salesRevenue.revenueTrends} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fill: "#71717A", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#71717A", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                <Tooltip content={<BIHighContrastTooltip valuePrefix="₹" />} />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                <Bar dataKey="netSales" name="Net Sales" fill="#00FF66" radius={[4, 4, 0, 0]} />
                <Bar dataKey="discounts" name="Discounts" fill="#F43F5E" radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </BIChartCard>

        {/* 2. Revenue by Month */}
        <BIChartCard
          title="2. Monthly Revenue Run-Rate"
          subtitle="Monthly gross billing vs net collected cash-flow"
          definition="Aggregates completed transaction volume grouped by calendar month."
          supportedTypes={["bar", "line"]}
          currentType={monthChartType}
          onTypeChange={setMonthChartType}
          onDrilldown={() => onDrilldown("month", "all", "Monthly Billing Breakdown")}
        >
          <ResponsiveContainer width="100%" height="100%">
            {monthChartType === "bar" ? (
              <BarChart data={salesRevenue.revenueByMonth} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tick={{ fill: "#71717A", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#71717A", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                <Tooltip content={<BIHighContrastTooltip valuePrefix="₹" />} />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                <Bar dataKey="grossRevenue" name="Gross Sales" fill="#38BDF8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="netRevenue" name="Net Revenue" fill="#00FF66" radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : (
              <LineChart data={salesRevenue.revenueByMonth} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tick={{ fill: "#71717A", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#71717A", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                <Tooltip content={<BIHighContrastTooltip valuePrefix="₹" />} />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                <Line type="monotone" dataKey="netRevenue" name="Net Revenue" stroke="#00FF66" strokeWidth={3} />
              </LineChart>
            )}
          </ResponsiveContainer>
        </BIChartCard>

        {/* 3. Revenue vs Profit Status */}
        <BIChartCard
          title="3. Revenue vs Profit Comparison"
          subtitle="Net revenue captured vs estimated COGS margin status"
          definition="Profit requires subtracting Cost of Goods Sold (COGS). Marked pending ERP supply cost schema."
          onDrilldown={() => onDrilldown("profit", "all", "Revenue vs Margin Variance")}
        >
          <div className="h-full flex flex-col justify-between">
            <ResponsiveContainer width="100%" height="70%">
              <BarChart data={salesRevenue.revenueByMonth} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tick={{ fill: "#71717A", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#71717A", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                <Tooltip content={<BIHighContrastTooltip valuePrefix="₹" />} />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                <Bar dataKey="netRevenue" name="Net Revenue" fill="#00FF66" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-300 font-mono flex items-center justify-between">
              <span>PROFIT BAR: UNAVAILABLE (Missing COGS column in products table)</span>
              <span className="text-[#00FF66] font-bold">100% Topline Tracked</span>
            </div>
          </div>
        </BIChartCard>

        {/* 4. Revenue Contribution by Product */}
        <BIChartCard
          title="4. Revenue Contribution by Product"
          subtitle="Ranked share of gross revenue across all 8 bio-enhanced formulas"
          definition="Sum of line_total_inr grouped by product_id."
          onDrilldown={() => onDrilldown("product", "all", "Product Sales Breakdown")}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={salesRevenue.productContributions}
              layout="vertical"
              margin={{ top: 0, right: 20, bottom: 0, left: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis type="number" tick={{ fill: "#71717A", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
              <YAxis type="category" dataKey="name" tick={{ fill: "#D4D4D8", fontSize: 10 }} axisLine={false} tickLine={false} width={100} />
              <Tooltip content={<BIHighContrastTooltip valuePrefix="₹" />} />
              <Bar dataKey="revenue" name="Revenue" radius={[0, 4, 4, 0]}>
                {salesRevenue.productContributions.map((p, idx) => (
                  <Cell key={idx} fill={p.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </BIChartCard>

        {/* Expanded View Only Charts (5 through 10) */}
        {isExpanded && (
          <>
            {/* 5. Revenue by Flavor (Ranked) */}
            <BIChartCard
              title="5. Flavor Popularity Ranking"
              subtitle="Cans sold by distinct flavor profile"
              definition="Physical volume of units dispatched per flavor."
              onDrilldown={() => onDrilldown("flavor", "all", "Flavor Inventory & Sales")}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesRevenue.flavorRankings} margin={{ top: 10, right: 10, bottom: 25, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="flavor" tick={{ fill: "#A1A1AA", fontSize: 9 }} angle={-25} textAnchor="end" axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#71717A", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<BIHighContrastTooltip valueSuffix=" Cans" />} />
                  <Bar dataKey="units" name="Cans Sold" radius={[4, 4, 0, 0]}>
                    {salesRevenue.flavorRankings.map((f, idx) => (
                      <Cell key={idx} fill={f.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </BIChartCard>

            {/* 6. Average Order Value (AOV) Trend */}
            <BIChartCard
              title="6. Average Order Value (AOV) Trend"
              subtitle="Ticket size per completed order transaction"
              definition="Net Revenue divided by count of non-cancelled orders on each date."
              onDrilldown={() => onDrilldown("aov", "all", "Transaction Size Log")}
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesRevenue.revenueTrends} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" tick={{ fill: "#71717A", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#71717A", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip content={<BIHighContrastTooltip valuePrefix="₹" />} />
                  <Line type="monotone" dataKey="aov" name="Avg Order Value" stroke="#38BDF8" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </BIChartCard>

            {/* 7. Order Volume vs Revenue (Dual-Axis) */}
            <BIChartCard
              title="7. Order Volume vs Net Revenue (Dual-Axis)"
              subtitle="Correlation between transaction count and total cash volume"
              definition="Left axis: Net Sales (INR). Right axis: Order count."
              onDrilldown={() => onDrilldown("volume", "all", "Volume vs Topline")}
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesRevenue.revenueTrends} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" tick={{ fill: "#71717A", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" tick={{ fill: "#00FF66", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fill: "#F59E0B", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<BIHighContrastTooltip />} />
                  <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                  <Line yAxisId="left" type="monotone" dataKey="netSales" name="Net Sales (₹)" stroke="#00FF66" strokeWidth={2.5} />
                  <Line yAxisId="right" type="monotone" dataKey="completedOrders" name="Completed Orders" stroke="#F59E0B" strokeWidth={2} strokeDasharray="3 3" />
                </LineChart>
              </ResponsiveContainer>
            </BIChartCard>

            {/* 8. Month-over-Month Revenue Growth */}
            <BIChartCard
              title="8. Month-over-Month (MoM) Revenue Growth %"
              subtitle="Growth percentage trajectory comparing successive calendar months"
              definition="((Current Month Net Sales - Prior Month Net Sales) / Prior Month Net Sales) * 100"
              onDrilldown={() => onDrilldown("growth", "all", "MoM Growth Ledger")}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesRevenue.revenueByMonth} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" tick={{ fill: "#71717A", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#71717A", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                  <Tooltip content={<BIHighContrastTooltip valueSuffix="%" />} />
                  <Bar dataKey="growthPct" name="MoM Growth %" fill="#A855F7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </BIChartCard>

            {/* 9. Revenue Contribution by Region */}
            <BIChartCard
              title="9. Revenue Contribution by State"
              subtitle="Top geographic revenue drivers across South India"
              definition="Sum of order_total_inr grouped by delivery_state."
              onDrilldown={() => onDrilldown("region", "all", "State Regional Accounts")}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesRevenue.regionalRevenue} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="region" tick={{ fill: "#71717A", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#71717A", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip content={<BIHighContrastTooltip valuePrefix="₹" />} />
                  <Bar dataKey="revenue" name="State Revenue" fill="#00FF66" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </BIChartCard>

            {/* 10. Revenue by Sales Channel */}
            <BIChartCard
              title="10. Revenue by Sales Channel"
              subtitle="Distribution between Direct Web D2C vs Retail Partners"
              definition="Current architecture is 100% Direct-to-Consumer e-commerce storefront."
              onDrilldown={() => onDrilldown("channel", "all", "Sales Channel Registry")}
            >
              <div className="h-full flex flex-col items-center justify-center space-y-4">
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={salesChannelData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="revenue" nameKey="channel">
                      <Cell fill="#00FF66" />
                    </Pie>
                    <Tooltip content={<BIHighContrastTooltip valuePrefix="₹" />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="text-center space-y-1">
                  <p className="text-xs font-bold text-foreground">Vyra Pulse Direct D2C Web: 100% (₹{summaryKpis.grossSales.toLocaleString("en-IN")})</p>
                  <p className="text-[10px] text-muted-foreground">Multi-channel wholesale API telemetry is queued for future ERP integration.</p>
                </div>
              </div>
            </BIChartCard>
          </>
        )}
      </div>
    </div>
  );
}
