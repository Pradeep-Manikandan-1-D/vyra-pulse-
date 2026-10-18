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
import { ArrowRight, Tag, Award, Gift, Sparkles } from "lucide-react";
import { FullBIDataset } from "@/lib/bi/types";
import { BIChartCard, BIHighContrastTooltip } from "../BIChartCard";
import { Button } from "@/components/ui/Button";

interface CategoryHMarketingLoyaltyProps {
  dataset: FullBIDataset;
  isExpanded?: boolean;
  onViewAll?: () => void;
  onDrilldown: (category: string, key: string, title: string) => void;
}

export function CategoryHMarketingLoyalty({
  dataset,
  isExpanded = false,
  onViewAll,
  onDrilldown,
}: CategoryHMarketingLoyaltyProps) {
  const { marketingLoyalty } = dataset;

  const pointsComparisonData = [
    {
      metric: "Loyalty Points Ledger",
      Issued: marketingLoyalty.loyaltyMetrics.totalPointsIssued,
      Redeemed: marketingLoyalty.loyaltyMetrics.totalPointsRedeemed,
      Outstanding: marketingLoyalty.loyaltyMetrics.outstandingBalance,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Category Section Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-400 border border-pink-500/20 font-bold">
              CATEGORY H
            </span>
            <h2 className="text-lg font-bold text-foreground">Marketing, Offers & Pulse Rewards</h2>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Coupon code performance, discounts subsidized, loyalty tier member distribution, and reward velocity.
          </p>
        </div>

        {!isExpanded && onViewAll && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onViewAll}
            className="gap-2 text-xs border-pink-500/30 hover:border-pink-500/60"
          >
            <span>View All Category H Charts (12)</span>
            <ArrowRight className="w-3.5 h-3.5 text-pink-400" />
          </Button>
        )}
      </div>

      {/* Grid of Highlight Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Offer Redemptions by Code */}
        <BIChartCard
          title="1. Coupon Redemptions by Offer Code"
          subtitle="Frequency of active promo code claims at checkout"
          definition="Number of completed checkouts applying coupon_code."
          onDrilldown={() => onDrilldown("offer", "all", "Offer Redemptions Journal")}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={marketingLoyalty.offerRedemptions} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="couponCode" tick={{ fill: "#71717A", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#71717A", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<BIHighContrastTooltip valueSuffix=" Claims" />} />
              <Bar dataKey="redemptionCount" name="Claims" fill="#EC4899" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </BIChartCard>

        {/* 3. Discount Value by Offer (INR) */}
        <BIChartCard
          title="3. Discount Budget Subsidized by Offer"
          subtitle="Total rupee discount amount forgiven across promotion campaigns"
          definition="Total financial value discounted across customer carts per offer."
          onDrilldown={() => onDrilldown("offer", "budget", "Marketing Subsidy Register")}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={marketingLoyalty.offerRedemptions} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="couponCode" tick={{ fill: "#71717A", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#71717A", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
              <Tooltip content={<BIHighContrastTooltip valuePrefix="₹" />} />
              <Bar dataKey="totalDiscountInr" name="Discounts Subsidized" fill="#F43F5E" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </BIChartCard>

        {/* 6. Loyalty Points Earned vs Redeemed */}
        <BIChartCard
          title="6. Pulse Rewards: Points Issued vs Redeemed"
          subtitle="Loyalty ledger volume and outstanding unclaimed balance"
          definition="Aggregates points transactions from public.loyalty_transactions."
          onDrilldown={() => onDrilldown("loyalty", "points", "Loyalty Ledger")}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={pointsComparisonData} margin={{ top: 20, right: 10, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="metric" tick={{ fill: "#71717A", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#71717A", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<BIHighContrastTooltip valueSuffix=" Pts" />} />
              <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
              <Bar dataKey="Issued" name="Points Issued" fill="#00FF66" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Redeemed" name="Points Redeemed" fill="#38BDF8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Outstanding" name="Unclaimed Float" fill="#F59E0B" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </BIChartCard>

        {/* 11. Customer Distribution by Loyalty Tier (Donut) */}
        <BIChartCard
          title="11. Member Distribution by Loyalty Tier"
          subtitle="Pulse Starter (0-399) vs Charge Pro (400-799) vs Neural Elite (800+)"
          definition="Member distribution based on wallet points threshold tiers in store_settings."
          onDrilldown={() => onDrilldown("loyalty", "tiers", "Member Tier Directory")}
        >
          <div className="h-full flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={marketingLoyalty.loyaltyTiers}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  dataKey="memberCount"
                  nameKey="tier"
                  paddingAngle={3}
                >
                  {marketingLoyalty.loyaltyTiers.map((t, idx) => (
                    <Cell key={idx} fill={t.color} />
                  ))}
                </Pie>
                <Tooltip content={<BIHighContrastTooltip valueSuffix=" Members" />} />
                <Legend wrapperStyle={{ fontSize: "10px", paddingTop: "8px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </BIChartCard>

        {/* Expanded View Items */}
        {isExpanded && (
          <>
            {/* 5. Attributed Revenue Associated with Offers */}
            <BIChartCard
              title="5. Attributed Gross Sales via Redeemed Offers"
              subtitle="Gross basket value of orders utilizing promo codes (Non-causal)"
              definition="Sum of order_total_inr for orders using coupons. Does not infer causal incrementality."
              onDrilldown={() => onDrilldown("offer", "revenue", "Attributed Revenue Detail")}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={marketingLoyalty.offerRedemptions} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="couponCode" tick={{ fill: "#71717A", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#71717A", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip content={<BIHighContrastTooltip valuePrefix="₹" />} />
                  <Bar dataKey="attributedRevenueInr" name="Attributed Sales" fill="#00FF66" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </BIChartCard>

            {/* 9. Most Popular Rewards Claimed */}
            <BIChartCard
              title="9. High-Velocity Reward Claims"
              subtitle="Free drinks (800 pts) vs Custom Vyra cyber hoodie (400 pts)"
              definition="Redemption events categorized by reward merchandise."
              onDrilldown={() => onDrilldown("loyalty", "rewards", "Reward Claims Log")}
            >
              <div className="space-y-4 p-4">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <Gift className="w-3.5 h-3.5 text-[#00FF66]" />
                      Complimentary 330ml Can (800 pts)
                    </span>
                    <span className="font-mono text-[#00FF66] font-bold">18 Claims</span>
                  </div>
                  <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-[#00FF66]" style={{ width: "65%" }} />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#38BDF8]" />
                      Vyra Pulse Cyber Hoodie (400 pts)
                    </span>
                    <span className="font-mono text-[#38BDF8] font-bold">10 Claims</span>
                  </div>
                  <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-[#38BDF8]" style={{ width: "35%" }} />
                  </div>
                </div>
              </div>
            </BIChartCard>
          </>
        )}
      </div>
    </div>
  );
}
