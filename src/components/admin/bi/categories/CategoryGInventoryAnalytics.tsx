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
  LineChart,
  Line,
} from "recharts";
import { ArrowRight, Warehouse, AlertTriangle, CheckCircle2 } from "lucide-react";
import { FullBIDataset } from "@/lib/bi/types";
import { BIChartCard, BIHighContrastTooltip } from "../BIChartCard";
import { Button } from "@/components/ui/Button";

interface CategoryGInventoryAnalyticsProps {
  dataset: FullBIDataset;
  isExpanded?: boolean;
  onViewAll?: () => void;
  onDrilldown: (category: string, key: string, title: string) => void;
}

export function CategoryGInventoryAnalytics({
  dataset,
  isExpanded = false,
  onViewAll,
  onDrilldown,
}: CategoryGInventoryAnalyticsProps) {
  const { inventoryAnalytics, summaryKpis } = dataset;
  const lowStockItems = inventoryAnalytics.stockList.filter((i) => i.stockStatus === "low_stock");

  return (
    <div className="space-y-6">
      {/* Category Section Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
              CATEGORY G
            </span>
            <h2 className="text-lg font-bold text-foreground">Inventory & Stock Analytics</h2>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Physical stock-on-hand, reorder buffer triggers, days of inventory remaining, and warehouse movement.
          </p>
        </div>

        {!isExpanded && onViewAll && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onViewAll}
            className="gap-2 text-xs border-amber-500/30 hover:border-amber-500/60"
          >
            <span>View All Category G Charts (11)</span>
            <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
          </Button>
        )}
      </div>

      {/* Grid of Highlight Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Current Stock by Product */}
        <BIChartCard
          title="1. Current Stock on Hand by SKU"
          subtitle="Warehouse inventory units available for immediate dispatch"
          definition="Stock level from authoritative inventory table in PostgreSQL."
          onDrilldown={() => onDrilldown("inventory", "stock", "Stock on Hand Roster")}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={inventoryAnalytics.stockList}
              layout="vertical"
              margin={{ top: 0, right: 20, bottom: 0, left: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis type="number" tick={{ fill: "#71717A", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis
                type="category"
                dataKey="flavor"
                tick={{ fill: "#D4D4D8", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={85}
              />
              <Tooltip content={<BIHighContrastTooltip valueSuffix=" Units" />} />
              <Bar dataKey="stockOnHand" name="Stock on Hand" fill="#00FF66" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </BIChartCard>

        {/* 4. Retail Inventory Value by Product */}
        <BIChartCard
          title="4. Asset Inventory Value by SKU (INR)"
          subtitle="Wholesale market capitalization of current warehouse assets"
          definition="stock_on_hand multiplied by ₹149 retail valuation."
          onDrilldown={() => onDrilldown("inventory", "value", "Asset Valuation Register")}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={inventoryAnalytics.stockList} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="flavor" tick={{ fill: "#71717A", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#71717A", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
              <Tooltip content={<BIHighContrastTooltip valuePrefix="₹" />} />
              <Bar dataKey="retailValueInr" name="Stock Value" fill="#38BDF8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </BIChartCard>

        {/* 8. Days of Inventory Remaining */}
        <BIChartCard
          title="8. Days of Inventory Remaining (Run-Rate)"
          subtitle="Estimated runway until warehouse stock exhaustion"
          definition="stock_on_hand divided by average daily consumption run-rate."
          onDrilldown={() => onDrilldown("inventory", "days", "Runway Forecast")}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={inventoryAnalytics.stockList} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="flavor" tick={{ fill: "#71717A", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#71717A", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<BIHighContrastTooltip valueSuffix=" Days" />} />
              <Bar dataKey="daysOfInventory" name="Days Runway" fill="#F59E0B" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </BIChartCard>

        {/* 6. Stock Movement: In vs Out */}
        <BIChartCard
          title="6. Stock Movement: Inflow vs Outflow"
          subtitle="Warehouse supplier restocks vs customer order dispatches"
          definition="Inflow (supplier receipts) vs Outflow (order item deductions)."
          onDrilldown={() => onDrilldown("inventory", "movements", "Inventory Movements Ledger")}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={inventoryAnalytics.movements} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: "#71717A", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#71717A", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<BIHighContrastTooltip valueSuffix=" Units" />} />
              <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
              <Bar dataKey="stockIn" name="Stock Received (+)" fill="#00FF66" radius={[4, 4, 0, 0]} />
              <Bar dataKey="stockOut" name="Stock Dispatched (-)" fill="#F43F5E" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </BIChartCard>

        {/* Expanded View Items (3. Stock Status Table, 7. Turnover) */}
        {isExpanded && (
          <>
            {/* 3. Real-time Inventory Health Table */}
            <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-surface/50 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-foreground">3. Authoritative Stock Status & Reorder Thresholds</h3>
                  <p className="text-xs text-muted-foreground">
                    Live inventory monitoring joined from PostgreSQL public.inventory table.
                  </p>
                </div>
                <span className="text-xs font-mono text-muted-foreground">
                  Total Asset Value: <span className="text-[#00FF66] font-bold">₹{inventoryAnalytics.totalRetailStockValue.toLocaleString("en-IN")}</span>
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-muted-foreground font-mono text-[10px] uppercase">
                      <th className="py-2 px-3">SKU ID</th>
                      <th className="py-2 px-3">Product Name & Flavor</th>
                      <th className="py-2 px-3 text-right">Available Stock</th>
                      <th className="py-2 px-3 text-right">Reorder Trigger</th>
                      <th className="py-2 px-3 text-right">Runway</th>
                      <th className="py-2 px-3 text-center">Health Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono text-xs">
                    {inventoryAnalytics.stockList.map((item) => (
                      <tr key={item.productId} className="hover:bg-white/5">
                        <td className="py-2.5 px-3 text-muted-foreground">{item.productId}</td>
                        <td className="py-2.5 px-3 font-sans font-semibold text-foreground">
                          {item.productName} ({item.flavor})
                        </td>
                        <td className="py-2.5 px-3 text-right text-[#00FF66] font-bold">{item.stockOnHand} Cans</td>
                        <td className="py-2.5 px-3 text-right text-muted-foreground">{item.reorderLevel} Cans</td>
                        <td className="py-2.5 px-3 text-right text-amber-400 font-bold">{item.daysOfInventory} Days</td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.stockStatus === "in_stock"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                                : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                            }`}
                          >
                            {item.stockStatus.toUpperCase().replace("_", " ")}
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
