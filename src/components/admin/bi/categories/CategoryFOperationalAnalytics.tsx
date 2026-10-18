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
  LineChart,
  Line,
} from "recharts";
import { ArrowRight, Activity, Clock, CheckCircle2 } from "lucide-react";
import { FullBIDataset } from "@/lib/bi/types";
import { BIChartCard, BIHighContrastTooltip } from "../BIChartCard";
import { Button } from "@/components/ui/Button";

interface CategoryFOperationalAnalyticsProps {
  dataset: FullBIDataset;
  isExpanded?: boolean;
  onViewAll?: () => void;
  onDrilldown: (category: string, key: string, title: string) => void;
}

export function CategoryFOperationalAnalytics({
  dataset,
  isExpanded = false,
  onViewAll,
  onDrilldown,
}: CategoryFOperationalAnalyticsProps) {
  const { operationalAnalytics, summaryKpis } = dataset;

  return (
    <div className="space-y-6">
      {/* Category Section Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold">
              CATEGORY F
            </span>
            <h2 className="text-lg font-bold text-foreground">Order & Operational Telemetry</h2>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Fulfillment funnel stages, order status breakdown, day-of-week purchasing cycles, and cancellation rates.
          </p>
        </div>

        {!isExpanded && onViewAll && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onViewAll}
            className="gap-2 text-xs border-blue-500/30 hover:border-blue-500/60"
          >
            <span>View All Category F Charts (12)</span>
            <ArrowRight className="w-3.5 h-3.5 text-blue-400" />
          </Button>
        )}
      </div>

      {/* Grid of Highlight Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Orders by Status (Donut) */}
        <BIChartCard
          title="1. Order Status Distribution"
          subtitle="Delivered, Shipped, Processing, and Cancelled ratio"
          definition="Strict partition of orders by order_status from PostgreSQL."
          onDrilldown={() => onDrilldown("status", "all", "Order Status Registry")}
        >
          <div className="h-full flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={operationalAnalytics.statusBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  dataKey="count"
                  nameKey="status"
                  paddingAngle={3}
                >
                  {operationalAnalytics.statusBreakdown.map((s, idx) => (
                    <Cell key={idx} fill={s.color} />
                  ))}
                </Pie>
                <Tooltip content={<BIHighContrastTooltip valueSuffix=" Orders" />} />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </BIChartCard>

        {/* 3. Order Fulfilment Funnel */}
        <BIChartCard
          title="3. Order Fulfilment Pipeline Funnel"
          subtitle="Conversion velocity across progressive fulfillment stages"
          definition="Sequential order progression from order submission to doorstep delivery."
          onDrilldown={() => onDrilldown("funnel", "all", "Pipeline Log")}
        >
          <div className="h-full flex flex-col justify-center space-y-3 px-2">
            {operationalAnalytics.fulfillmentFunnel.map((stage) => (
              <div key={stage.stage} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#00FF66]" />
                    {stage.stage}
                  </span>
                  <span className="font-mono text-muted-foreground">
                    {stage.count} Orders ({stage.conversionRate}%)
                  </span>
                </div>
                <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all duration-500"
                    style={{
                      width: `${stage.conversionRate}%`,
                      backgroundColor: stage.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </BIChartCard>

        {/* 7. Orders by Day of Week */}
        <BIChartCard
          title="7. Purchasing Patterns by Day of Week"
          subtitle="Order volume clustering across weekdays vs weekend"
          definition="Aggregates orders by order_day field recorded at checkout."
          onDrilldown={() => onDrilldown("day_of_week", "all", "Weekly Purchasing Cycle")}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={operationalAnalytics.dayOfWeek} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" tick={{ fill: "#71717A", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#71717A", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<BIHighContrastTooltip valueSuffix=" Orders" />} />
              <Bar dataKey="orderCount" name="Orders" fill="#38BDF8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </BIChartCard>

        {/* 9. Order Size Distribution (Histogram) */}
        <BIChartCard
          title="9. Basket Size Distribution (Cans per Order)"
          subtitle="Units purchased per completed transaction"
          definition="Frequency of 1 Can, 2 Cans, 3 Cans, or 4+ Cans bundled into a single checkout."
          onDrilldown={() => onDrilldown("size", "all", "Cart Depth Analysis")}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={operationalAnalytics.orderSizeDistribution} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="size" tick={{ fill: "#71717A", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#71717A", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<BIHighContrastTooltip valueSuffix=" Orders" />} />
              <Bar dataKey="orders" name="Order Count" fill="#00FF66" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </BIChartCard>

        {/* Expanded View Items */}
        {isExpanded && (
          <>
            {/* 8. Orders by Hour of Day */}
            <BIChartCard
              title="8. Diurnal Purchasing Heatmap (Hour of Day)"
              subtitle="24-hour order placement frequency distribution"
              definition="Extracted from order_time_local timestamp."
              onDrilldown={() => onDrilldown("hour", "all", "Hourly Peak Demand")}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={operationalAnalytics.hourOfDay} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="hour" tick={{ fill: "#71717A", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#71717A", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<BIHighContrastTooltip valueSuffix=" Orders" />} />
                  <Bar dataKey="orders" name="Orders" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </BIChartCard>

            {/* 5. Cancellation Rate KPI & Trend */}
            <BIChartCard
              title="5. Order Cancellation Rate Trajectory"
              subtitle="Cancelled orders vs total submitted checkouts"
              definition="Count of cancelled orders divided by total orders. Current: 17%."
              onDrilldown={() => onDrilldown("cancellations", "all", "Cancelled Orders")}
            >
              <div className="h-full flex flex-col items-center justify-center space-y-3">
                <p className="text-4xl font-extrabold text-rose-400 font-mono">
                  {summaryKpis.totalOrders ? ((summaryKpis.cancelledOrders / summaryKpis.totalOrders) * 100).toFixed(1) : 0}%
                </p>
                <p className="text-xs text-muted-foreground text-center max-w-sm">
                  {summaryKpis.cancelledOrders} of {summaryKpis.totalOrders} total orders were cancelled and refunded.
                </p>
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-[10px] text-neutral-400 font-mono">
                  All cancelled transactions are strictly excluded from net revenue totals.
                </div>
              </div>
            </BIChartCard>
          </>
        )}
      </div>
    </div>
  );
}
