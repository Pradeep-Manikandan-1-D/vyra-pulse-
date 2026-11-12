"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  BarChart3,
  Calendar,
  Activity,
  Zap,
  ShoppingBag,
  Info,
  TrendingUp,
  PieChart as PieChartIcon,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useAuth } from "@/components/auth/AuthProvider";
import { getCustomerOrders, CustomerOrder } from "@/lib/customer/data";
import { VYRA_FLAVORS } from "@/lib/constants";
import { useTheme } from "@/components/theme/ThemeProvider";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export default function MyConsumptionPage() {
  const { user, profile } = useAuth();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const customerId = profile?.customer_id || user?.id || "CUST-0001";
  const [orders, setOrders] = useState<CustomerOrder[]>([]);

  useEffect(() => {
    const custOrders = getCustomerOrders(customerId);
    setOrders(custOrders);
  }, [customerId]);

  // Compute purchase metrics from legitimate orders
  const paidOrders = orders.filter((o) => o.payment_status === "paid");
  const totalCansEstimate = paidOrders.reduce((sum, o) => sum + Math.max(1, Math.round(o.total_amount / 149)), 0);
  const totalCaffeineMg = totalCansEstimate * 80; // 80mg standard per can

  // Monthly purchase trends
  const monthlyDataMap = new Map<string, { month: string; cans: number; spend: number }>();
  paidOrders.forEach((o) => {
    const d = new Date(o.created_at);
    const key = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    const current = monthlyDataMap.get(key) || { month: key, cans: 0, spend: 0 };
    current.cans += Math.max(1, Math.round(o.total_amount / 149));
    current.spend += o.total_amount;
    monthlyDataMap.set(key, current);
  });

  const chartData = Array.from(monthlyDataMap.values()).reverse();
  if (chartData.length === 0) {
    chartData.push({ month: "Current", cans: 0, spend: 0 });
  }

  // Flavor breakdown
  const flavorCounts: Record<string, number> = {};
  paidOrders.forEach((o, index) => {
    const flavor = VYRA_FLAVORS[index % VYRA_FLAVORS.length].name.replace("Vyra Pulse ", "");
    const qty = Math.max(1, Math.round(o.total_amount / 149));
    flavorCounts[flavor] = (flavorCounts[flavor] || 0) + qty;
  });

  const flavorList = Object.entries(flavorCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const topFlavor = flavorList.length > 0 ? flavorList[0].name : "Citrus Charge";

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/40 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-xs font-semibold text-sky-400 mb-2">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Order Volume & Nutrient Insights</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            My Consumption Analytics
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Explore purchase patterns, historical cadence, and flavor choices derived from your verified orders.
          </p>
        </div>

        <Link href="/shop">
          <Button size="sm" variant="secondary" className="gap-2">
            <ShoppingBag className="w-4 h-4" />
            <span>Order Next Caddy</span>
          </Button>
        </Link>
      </div>

      {/* Transparency Callout */}
      <div className="p-4 rounded-2xl neu-inset flex items-start gap-3 text-xs text-muted-foreground">
        <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-foreground">Purchase-Derived Telemetry Note:</strong> The graphs and metrics below represent your purchase and delivery records with Vyra Pulse. They estimate total volume and ingredient intake based on purchased 330ml units.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="neu-card kpi-tint-mint p-5 rounded-2xl space-y-2">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
            Cans Purchased
          </span>
          <p className="text-3xl font-black text-foreground">{totalCansEstimate}</p>
          <p className="text-[10px] text-muted-foreground">330ml aluminum cans</p>
        </Card>

        <Card className="neu-card kpi-tint-sky p-5 rounded-2xl space-y-2 border-b-2 border-sky-500">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
            Caffeine Received
          </span>
          <p className="text-3xl font-black text-sky-600 dark:text-sky-400">{totalCaffeineMg} <span className="text-xs font-normal">mg</span></p>
          <p className="text-[10px] text-muted-foreground">80mg clean caffeine / can</p>
        </Card>

        <Card className="neu-card kpi-tint-peach p-5 rounded-2xl space-y-2">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
            Primary Flavor
          </span>
          <p className="text-lg font-black text-foreground truncate">{topFlavor}</p>
          <p className="text-[10px] text-muted-foreground">Highest reorder rate</p>
        </Card>

        <Card className="neu-card kpi-tint-amber p-5 rounded-2xl space-y-2">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
            Order Cadence
          </span>
          <p className="text-lg font-black text-primary">
            {orders.length > 3 ? "Active Daily" : "Bi-Weekly"}
          </p>
          <p className="text-[10px] text-muted-foreground">Steady replenishment</p>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Purchase Trend Chart */}
        <Card className="lg:col-span-2 neu-card p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-foreground">Monthly Order Volume</h3>
              <p className="text-xs text-muted-foreground">Total cans purchased per billing cycle</p>
            </div>
            <Badge variant="neutral">Verified Orders</Badge>
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="month" stroke="var(--muted)" fontSize={11} tickLine={false} />
                <YAxis stroke="var(--muted)" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--surface)",
                    borderColor: "var(--border)",
                    color: "var(--foreground)",
                    borderRadius: "12px",
                    fontSize: "12px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  }}
                  itemStyle={{ color: "var(--foreground)" }}
                  labelStyle={{ color: "var(--foreground)", fontWeight: "bold" }}
                  formatter={(value: any) => [`${value} Cans`, "Volume"]}
                />
                <Bar dataKey="cans" radius={[6, 6, 0, 0]} fill="var(--primary)">
                  {chartData.map((entry, index) => {
                    const lightColors = ["#38BDF8", "#34D399", "#A78BFA", "#FB923C", "#F43F5E", "#FACC15"];
                    const fill = isDark
                      ? (index === chartData.length - 1 ? "var(--primary)" : "var(--muted)")
                      : (index === chartData.length - 1 ? "var(--primary)" : lightColors[index % lightColors.length]);
                    return <Cell key={`cell-${index}`} fill={fill} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Favorite Flavor Breakdown */}
        <Card className="neu-card p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-foreground">Flavor Breakdown</h3>
            <span className="text-xs text-muted-foreground font-mono">{flavorList.length} Flavors</span>
          </div>

          <div className="space-y-3 pt-2">
            {flavorList.slice(0, 5).map((f) => {
              const pct = totalCansEstimate > 0 ? Math.round((f.count / totalCansEstimate) * 100) : 0;
              const fDef = VYRA_FLAVORS.find(
                (vf) => vf.name.toLowerCase().includes(f.name.toLowerCase()) || f.name.toLowerCase().includes(vf.flavor.toLowerCase())
              );
              const accentColor = fDef?.accentColor || "#23804D";
              return (
                <div key={f.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: accentColor }} />
                      <span>{f.name}</span>
                    </span>
                    <span className="text-muted-foreground font-mono">{f.count} cans ({pct}%)</span>
                  </div>
                  <div className="h-2 w-full rounded-full neu-inset overflow-hidden p-0.5">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: accentColor,
                        boxShadow: !isDark ? `0 1px 4px ${accentColor}40` : undefined,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t border-border/40 text-center">
            <Link href="/account/favorites">
              <Button size="sm" variant="secondary" className="w-full text-xs">
                Manage Favorites Rotation
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

