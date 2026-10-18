"use client";

import React, { useState } from "react";
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
import { ArrowRight, Users, Award, Eye } from "lucide-react";
import { FullBIDataset, TopCustomerPoint } from "@/lib/bi/types";
import { BIChartCard, BIHighContrastTooltip } from "../BIChartCard";
import { Button } from "@/components/ui/Button";

interface CategoryCCustomerAnalyticsProps {
  dataset: FullBIDataset;
  isExpanded?: boolean;
  onViewAll?: () => void;
  onDrilldown: (category: string, key: string, title: string) => void;
}

export function CategoryCCustomerAnalytics({
  dataset,
  isExpanded = false,
  onViewAll,
  onDrilldown,
}: CategoryCCustomerAnalyticsProps) {
  const { customerAnalytics, summaryKpis } = dataset;
  const top10Spenders = customerAnalytics.topSpenders.slice(0, 10);
  const topOrders = [...customerAnalytics.topSpenders].sort((a, b) => b.orderCount - a.orderCount).slice(0, 8);

  return (
    <div className="space-y-6">
      {/* Category Section Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 font-bold">
              CATEGORY C
            </span>
            <h2 className="text-lg font-bold text-foreground">Customer Intelligence & Retention</h2>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Customer lifetime value (CLV), purchase frequency distribution, repeat rate ({summaryKpis.repeatCustomerRate}%), and cohort retention.
          </p>
        </div>

        {!isExpanded && onViewAll && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onViewAll}
            className="gap-2 text-xs border-purple-500/30 hover:border-purple-500/60"
          >
            <span>View All Category C Charts (12)</span>
            <ArrowRight className="w-3.5 h-3.5 text-purple-400" />
          </Button>
        )}
      </div>

      {/* Grid of Highlight Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Highest-Spending Customers */}
        <BIChartCard
          title="1. Highest-Spending Customers (Top Spenders)"
          subtitle="Ranked by completed net spend (INR) across the customer base"
          definition="Excludes cancelled orders and accounts for discounts. Click bar to inspect customer record."
          onDrilldown={() => onDrilldown("customer", "top_spenders", "Top Spending Accounts")}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={top10Spenders}
              layout="vertical"
              margin={{ top: 0, right: 20, bottom: 0, left: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis type="number" tick={{ fill: "#71717A", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
              <YAxis
                type="category"
                dataKey="fullName"
                tick={{ fill: "#D4D4D8", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={100}
              />
              <Tooltip content={<BIHighContrastTooltip valuePrefix="₹" />} />
              <Bar dataKey="netSpend" name="Net Spend" fill="#00FF66" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </BIChartCard>

        {/* 5. Customer Segmentation (Donut) */}
        <BIChartCard
          title="5. Customer Segmentation by Value"
          subtitle="VIP tier (₹1000+) vs Frequent repeaters vs First-time buyers"
          definition="Categorized by aggregate completed transaction value and order frequency."
          onDrilldown={() => onDrilldown("customer", "segments", "Customer Segments Master List")}
        >
          <div className="h-full flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={customerAnalytics.customerSegments}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  dataKey="count"
                  nameKey="segment"
                  paddingAngle={3}
                >
                  {customerAnalytics.customerSegments.map((s, idx) => (
                    <Cell key={idx} fill={s.color} />
                  ))}
                </Pie>
                <Tooltip content={<BIHighContrastTooltip valueSuffix=" Members" />} />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </BIChartCard>

        {/* 8. Purchase Frequency Distribution (Histogram) */}
        <BIChartCard
          title="8. Purchase Frequency Distribution"
          subtitle="Orders per customer histogram showing repeat velocity"
          definition="Counts customers having placed exactly 1, 2, 3, or 4+ orders."
          onDrilldown={() => onDrilldown("customer", "frequency", "Order Frequency Groups")}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={customerAnalytics.frequencyBuckets} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="orderBucket" tick={{ fill: "#71717A", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#71717A", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<BIHighContrastTooltip valueSuffix=" Customers" />} />
              <Bar dataKey="customerCount" name="Customers" fill="#38BDF8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </BIChartCard>

        {/* 4. Customer Acquisition Trend */}
        <BIChartCard
          title="4. Customer Acquisition Pace"
          subtitle="Account registration volume grouped by month"
          definition="Date of user registration recorded in the customers table."
          onDrilldown={() => onDrilldown("customer", "acquisition", "Registration Ledger")}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={customerAnalytics.acquisitionTrends} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: "#71717A", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#71717A", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<BIHighContrastTooltip valueSuffix=" New Accounts" />} />
              <Line type="monotone" dataKey="newCustomers" name="New Signups" stroke="#A855F7" strokeWidth={2.5} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </BIChartCard>

        {/* Expanded View Charts (2, 3, 6, 7, 9, 10, 11, 12, Drilldown Table) */}
        {isExpanded && (
          <>
            {/* 2. Top Customers by Order Count */}
            <BIChartCard
              title="2. Top Customers by Order Frequency"
              subtitle="Most frequent repeat buyers across the network"
              definition="Count of orders placed by customer_id."
              onDrilldown={() => onDrilldown("customer", "top_frequency", "Repeat Customer Details")}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topOrders} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: "#71717A", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="fullName" tick={{ fill: "#D4D4D8", fontSize: 10 }} axisLine={false} tickLine={false} width={100} />
                  <Tooltip content={<BIHighContrastTooltip valueSuffix=" Orders" />} />
                  <Bar dataKey="orderCount" name="Total Orders" fill="#38BDF8" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </BIChartCard>

            {/* 3. New vs Returning Customers */}
            <BIChartCard
              title="3. New vs Returning Customer Mix"
              subtitle="Comparison of first-time vs recurring order volume"
              definition="First-Time: customer order index = 1. Returning: customer order index > 1."
              onDrilldown={() => onDrilldown("customer", "mix", "Customer Order History")}
            >
              <div className="h-full flex flex-col justify-center space-y-3 px-4">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-foreground font-semibold">Returning Customers ({summaryKpis.repeatCustomerRate}%)</span>
                    <span className="font-mono text-[#00FF66] font-bold">
                      {Math.round((summaryKpis.totalCustomers * summaryKpis.repeatCustomerRate) / 100)} Accounts
                    </span>
                  </div>
                  <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden flex">
                    <div className="h-full bg-[#00FF66]" style={{ width: `${summaryKpis.repeatCustomerRate}%` }} />
                    <div className="h-full bg-purple-500" style={{ width: `${100 - summaryKpis.repeatCustomerRate}%` }} />
                  </div>
                  <div className="flex justify-between text-[11px] text-muted-foreground pt-1">
                    <span>First-time Purchasers ({(100 - summaryKpis.repeatCustomerRate).toFixed(1)}%)</span>
                    <span className="font-mono text-purple-400">
                      {summaryKpis.totalCustomers - Math.round((summaryKpis.totalCustomers * summaryKpis.repeatCustomerRate) / 100)} Accounts
                    </span>
                  </div>
                </div>
              </div>
            </BIChartCard>

            {/* 10. Customer Cohort Retention Heatmap */}
            <BIChartCard
              title="10. Customer Cohort Retention Analysis"
              subtitle="Retention % of registration cohorts across subsequent months"
              definition="Percentage of users registered in Month 0 who placed an order in Month 1 and Month 2."
              className="lg:col-span-2"
              onDrilldown={() => onDrilldown("customer", "cohorts", "Cohort Activity Matrix")}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-muted-foreground font-mono">
                      <th className="py-2.5 px-3">Cohort Month</th>
                      <th className="py-2.5 px-3 text-right">Users</th>
                      <th className="py-2.5 px-3 text-center">Month 0 (Base)</th>
                      <th className="py-2.5 px-3 text-center">Month 1</th>
                      <th className="py-2.5 px-3 text-center">Month 2</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono text-xs">
                    {customerAnalytics.cohorts.map((c) => (
                      <tr key={c.cohortMonth} className="hover:bg-white/5">
                        <td className="py-3 px-3 font-semibold text-foreground">{c.cohortMonth}</td>
                        <td className="py-3 px-3 text-right text-muted-foreground">{c.cohortSize}</td>
                        <td className="py-3 px-3 text-center">
                          <span className="px-2.5 py-1 rounded-lg bg-[#00FF66]/20 text-[#00FF66] font-bold">
                            {c.m0}%
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="px-2.5 py-1 rounded-lg bg-sky-500/20 text-sky-300 font-bold">
                            {c.m1}%
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          {c.m2 > 0 ? (
                            <span className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 font-bold">
                              {c.m2}%
                            </span>
                          ) : (
                            <span className="text-neutral-500 text-[10px]">Maturity Pending</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </BIChartCard>

            {/* 12. Customers by Geographic State */}
            <BIChartCard
              title="12. Customers by Delivery Region"
              subtitle="Registered user account distribution across southern states"
              definition="Counts registered customers by delivery state."
              onDrilldown={() => onDrilldown("customer", "regions", "Regional Customer Directory")}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={customerAnalytics.customersByRegion} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="region" tick={{ fill: "#71717A", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#71717A", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<BIHighContrastTooltip valueSuffix=" Accounts" />} />
                  <Bar dataKey="count" name="Customers" fill="#00FF66" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </BIChartCard>

            {/* Customer Drill-Down Table Preview */}
            <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-surface/50 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Customer Intelligence Directory Drill-Down</h3>
                  <p className="text-xs text-muted-foreground">
                    Direct access to customer ID, display name, completed orders, net spend, and loyalty points.
                  </p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onDrilldown("customer", "all", "All Customer Profiles")}
                  className="gap-2 text-xs"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Inspect All {summaryKpis.totalCustomers} Accounts
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-muted-foreground font-mono text-[10px] uppercase">
                      <th className="py-2 px-3">Customer ID</th>
                      <th className="py-2 px-3">Full Name & Email</th>
                      <th className="py-2 px-3">Location</th>
                      <th className="py-2 px-3 text-right">Orders</th>
                      <th className="py-2 px-3 text-right">Net Spend</th>
                      <th className="py-2 px-3 text-right">Points</th>
                      <th className="py-2 px-3 text-center">Segment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono text-xs">
                    {top10Spenders.map((c) => (
                      <tr
                        key={c.customerId}
                        onClick={() => onDrilldown("customer", c.customerId, `Customer Profile: ${c.fullName}`)}
                        className="hover:bg-white/5 cursor-pointer transition-colors"
                      >
                        <td className="py-2.5 px-3 font-bold text-[#00FF66]">{c.customerId}</td>
                        <td className="py-2.5 px-3 font-sans">
                          <div className="font-semibold text-foreground">{c.fullName}</div>
                          <div className="text-[10px] text-muted-foreground">{c.email}</div>
                        </td>
                        <td className="py-2.5 px-3 text-muted-foreground font-sans">
                          {c.city}, {c.state}
                        </td>
                        <td className="py-2.5 px-3 text-right text-foreground font-bold">{c.orderCount}</td>
                        <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">
                          ₹{c.netSpend.toLocaleString("en-IN")}
                        </td>
                        <td className="py-2.5 px-3 text-right text-amber-400 font-bold">{c.loyaltyPoints}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              c.customerSegment === "VIP"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                                : c.customerSegment === "Frequent"
                                ? "bg-sky-500/10 text-sky-400 border border-sky-500/30"
                                : "bg-white/10 text-muted-foreground"
                            }`}
                          >
                            {c.customerSegment}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
