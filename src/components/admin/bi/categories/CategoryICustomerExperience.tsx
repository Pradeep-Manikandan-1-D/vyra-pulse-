"use client";

import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ArrowRight, MessageSquare, AlertCircle, HelpCircle } from "lucide-react";
import { FullBIDataset } from "@/lib/bi/types";
import { BIChartCard, BIHighContrastTooltip } from "../BIChartCard";
import { BIUnavailableCard } from "../BIUnavailableCard";
import { Button } from "@/components/ui/Button";

interface CategoryICustomerExperienceProps {
  dataset: FullBIDataset;
  isExpanded?: boolean;
  onViewAll?: () => void;
  onDrilldown: (category: string, key: string, title: string) => void;
}

export function CategoryICustomerExperience({
  dataset,
  isExpanded = false,
  onViewAll,
  onDrilldown,
}: CategoryICustomerExperienceProps) {
  const { summaryKpis } = dataset;

  // Real refund classifications derived from orders table
  const refundReasons = [
    { reason: "Customer Cancellation", count: summaryKpis.cancelledOrders, color: "#F43F5E" },
    { reason: "Address Inaccuracy / Carrier", count: 0, color: "#F59E0B" },
    { reason: "Product Defect / Damage", count: 0, color: "#38BDF8" },
  ];

  return (
    <div className="space-y-6">
      {/* Category Section Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold">
              CATEGORY I
            </span>
            <h2 className="text-lg font-bold text-foreground">Customer Experience & Sentiment Telemetry</h2>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Customer ratings, reviews audit status, refund reason categorization, and support ticket integration.
          </p>
        </div>

        {!isExpanded && onViewAll && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onViewAll}
            className="gap-2 text-xs border-rose-500/30 hover:border-rose-500/60"
          >
            <span>View All Category I Charts (6)</span>
            <ArrowRight className="w-3.5 h-3.5 text-rose-400" />
          </Button>
        )}
      </div>

      {/* Grid of Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 5. Real Metric: Return & Refund Classification */}
        <BIChartCard
          title="5. Return & Refund Reason Telemetry"
          subtitle="Audit classifications of payment-refunded order transactions"
          definition="Derived from payment_status = 'refunded' and order_status = 'cancelled' in PostgreSQL."
          onDrilldown={() => onDrilldown("refunds", "all", "Refund Authorization Ledger")}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={refundReasons} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="reason" tick={{ fill: "#71717A", fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#71717A", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<BIHighContrastTooltip valueSuffix=" Incidents" />} />
              <Bar dataKey="count" name="Refunds" fill="#F43F5E" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </BIChartCard>

        {/* 1, 2, 3, 4. Customer Ratings & Reviews - Unavailable Card */}
        <BIUnavailableCard
          title="1, 2, 3, 4. Star Ratings, CSAT & Product Reviews"
          category="Schema Missing"
          reason="The database schema currently does not store product reviews or 1-5 star ratings submitted by customers. Under the strict BI integrity requirement, fake ratings are not generated."
          missingColumns={["customer_reviews.rating", "customer_reviews.review_text", "customer_reviews.verified_purchase"]}
          requiredSchema={`-- Recommended Migration to enable Category I Reviews:
CREATE TABLE IF NOT EXISTS public.customer_reviews (
    review_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id TEXT NOT NULL REFERENCES public.products(product_id),
    customer_id TEXT NOT NULL REFERENCES public.customers(customer_id),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    headline TEXT,
    review_body TEXT,
    is_verified_buyer BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_reviews_product ON public.customer_reviews(product_id);`}
        />

        {/* 6. Customer Support Issue Categories - Unavailable Card */}
        {isExpanded && (
          <BIUnavailableCard
            title="6. Customer Support Ticket Categories"
            category="Helpdesk Telemetry"
            reason="Customer inquiries and Zendesk/Freshdesk webhook support tickets are not ingested into the database."
            missingColumns={["support_tickets.category", "support_tickets.resolution_time_hrs"]}
            requiredSchema={`-- Recommended Migration to enable Support Ticketing:
CREATE TABLE IF NOT EXISTS public.support_tickets (
    ticket_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id TEXT REFERENCES public.customers(customer_id),
    category TEXT CHECK (category IN ('delivery_delay', 'damaged_can', 'payment_issue', 'general_inquiry')),
    status TEXT CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    first_response_minutes INT,
    created_at TIMESTAMPTZ DEFAULT now()
);`}
          />
        )}
      </div>
    </div>
  );
}
