"use client";

import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from "recharts";
import { ArrowRight, AlertTriangle, ShieldCheck } from "lucide-react";
import { FullBIDataset } from "@/lib/bi/types";
import { BIChartCard, BIHighContrastTooltip } from "../BIChartCard";
import { BIUnavailableCard } from "../BIUnavailableCard";
import { Button } from "@/components/ui/Button";

interface CategoryBProfitabilityProps {
  dataset: FullBIDataset;
  isExpanded?: boolean;
  onViewAll?: () => void;
  onDrilldown: (category: string, key: string, title: string) => void;
}

export function CategoryBProfitability({
  dataset,
  isExpanded = false,
  onViewAll,
  onDrilldown,
}: CategoryBProfitabilityProps) {
  const { profitability, summaryKpis } = dataset;

  return (
    <div className="space-y-6">
      {/* Category Section Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
              CATEGORY B
            </span>
            <h2 className="text-lg font-bold text-foreground">Profitability & Financial Analytics</h2>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Gross margins, cost of goods sold (COGS) audit status, and promotional discount deductions.
          </p>
        </div>

        {!isExpanded && onViewAll && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onViewAll}
            className="gap-2 text-xs border-amber-500/30 hover:border-amber-500/60"
          >
            <span>View All Category B Charts (10)</span>
            <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
          </Button>
        )}
      </div>

      {/* Primary Highlight Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Real Available Metric: Discount Impact on Topline */}
        <BIChartCard
          title="6. Promotional Discount Impact on Revenue"
          subtitle="Real coupon deductions given to customers by month"
          definition="Calculated directly from discount_amount_inr across valid orders."
          onDrilldown={() => onDrilldown("discounts", "all", "Customer Discount Claims")}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={profitability.discountImpact} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: "#71717A", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#71717A", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
              <Tooltip content={<BIHighContrastTooltip valuePrefix="₹" />} />
              <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
              <Bar dataKey="grossSales" name="Gross Invoiced" fill="#38BDF8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="discountGiven" name="Discounts Forgiven" fill="#F43F5E" radius={[4, 4, 0, 0]} />
              <Bar dataKey="netRevenue" name="Net Realized" fill="#00FF66" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </BIChartCard>

        {/* 2. Explicit Missing Data Notice Card */}
        <BIUnavailableCard
          title="Gross Profit & Margin Run-Rate"
          category="Financials"
          reason="The database schema currently contains retail consumer pricing (`price_inr`) and order totals, but lacks manufacturing supplier Cost of Goods Sold (COGS). Fabricating fake profit percentages violates data integrity requirements."
          missingColumns={["products.cost_price_inr", "inventory_movements.unit_cost_inr", "store_settings.cogs_markup_pct"]}
          requiredSchema={`-- Recommended Migration to enable Category B Profitability:
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS cost_price_inr NUMERIC(10, 2) DEFAULT 45.00 CHECK (cost_price_inr >= 0);

-- Automatically computes gross margin:
CREATE OR REPLACE VIEW public.v_product_profitability AS 
SELECT 
  p.product_id, 
  p.product_name, 
  p.price_inr AS selling_price,
  p.cost_price_inr AS unit_cogs,
  (p.price_inr - p.cost_price_inr) AS gross_profit_per_unit,
  ROUND(((p.price_inr - p.cost_price_inr) / p.price_inr) * 100, 2) AS gross_margin_pct
FROM public.products p;`}
        />

        {/* Expanded View Items: Explicit Unavailable Audits for items 1, 2, 3, 4, 5, 7, 8, 9, 10 */}
        {isExpanded && (
          <>
            <BIUnavailableCard
              title="1. Gross Profit Trend (Line Chart)"
              category="COGS Dependent"
              reason="Historical gross profit line requires daily total revenue minus daily total unit manufacturing costs."
              missingColumns={["products.cost_price_inr"]}
            />

            <BIUnavailableCard
              title="2. Revenue vs Cost vs Profit (Grouped Bar)"
              category="Financials"
              reason="Cannot render triple-bar comparison without an authoritative supplier cost ledger."
              missingColumns={["products.cost_price_inr", "order_items.unit_cost_inr"]}
            />

            <BIUnavailableCard
              title="3. Gross Margin % by Month"
              category="Financials"
              reason="Gross Margin % = ((Net Revenue - COGS) / Net Revenue) * 100. Pending cost data collection."
              missingColumns={["orders.total_cogs_inr"]}
            />

            <BIUnavailableCard
              title="4 & 5. Profit Contribution & Margin Ranking by Flavor"
              category="Products"
              reason="Individual flavor margins cannot be ranked without unit ingredient costing."
              missingColumns={["products.cost_price_inr"]}
            />

            <BIUnavailableCard
              title="7. Manufacturing & Logistics Cost Breakdown"
              category="Costing"
              reason="Distribution between raw ingredients, canning, freight shipping, and payment gateway fees is uncollected."
              missingColumns={["orders.gateway_fee_inr", "orders.packaging_cost_inr"]}
            />

            <BIUnavailableCard
              title="8. Average Profit per Order"
              category="Order Economics"
              reason="Net margin per order requires deducting order-level shipping subsidies and gateway processing charges."
              missingColumns={["orders.net_profit_inr"]}
            />

            <BIUnavailableCard
              title="9 & 10. Profit by Sales Channel & Profit Growth Comparison"
              category="Multi-Channel"
              reason="Vyra operates a single D2C digital store; channel margin variance requires B2B distributor contracts."
              missingColumns={["orders.sales_channel", "orders.channel_commission_pct"]}
            />
          </>
        )}
      </div>
    </div>
  );
}
