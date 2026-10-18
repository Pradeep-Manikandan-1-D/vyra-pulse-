"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Tag,
  RefreshCw,
  Loader2,
  CheckCircle2,
  XCircle,
  Plus,
  Clock,
  Percent,
  DollarSign,
  Truck,
} from "lucide-react";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { Offer, OfferType } from "@/lib/types";

const DEMO_OFFERS: Offer[] = [
  { id: "1", offer_code: "VPULSE10", offer_name: "Welcome — 10% OFF", offer_type: "percentage", discount_value: 10, minimum_order_value: 0, valid_from: "2026-01-01T00:00:00Z", valid_until: null, is_active: true, max_redemptions: null, redemption_count: 42, created_at: "2026-01-01T00:00:00Z" },
  { id: "2", offer_code: "VPULSE20", offer_name: "Flash Sale 20% OFF", offer_type: "percentage", discount_value: 20, minimum_order_value: 300, valid_from: "2026-10-01T00:00:00Z", valid_until: "2026-10-31T23:59:00Z", is_active: true, max_redemptions: 100, redemption_count: 17, created_at: "2026-10-01T00:00:00Z" },
  { id: "3", offer_code: "FREESHIP", offer_name: "Free Shipping Boost", offer_type: "free_shipping", discount_value: 0, minimum_order_value: 200, valid_from: "2026-01-01T00:00:00Z", valid_until: null, is_active: true, max_redemptions: null, redemption_count: 88, created_at: "2026-01-01T00:00:00Z" },
  { id: "4", offer_code: "FLAT50", offer_name: "₹50 Flat Discount", offer_type: "fixed", discount_value: 50, minimum_order_value: 250, valid_from: "2026-09-01T00:00:00Z", valid_until: null, is_active: true, max_redemptions: null, redemption_count: 31, created_at: "2026-09-01T00:00:00Z" },
  { id: "5", offer_code: "FLAT100", offer_name: "₹100 Big Discount", offer_type: "fixed", discount_value: 100, minimum_order_value: 500, valid_from: "2026-10-10T00:00:00Z", valid_until: "2026-10-20T23:59:00Z", is_active: false, max_redemptions: 50, redemption_count: 50, created_at: "2026-10-10T00:00:00Z" },
];

const TYPE_ICON: Record<OfferType, React.ReactNode> = {
  percentage: <Percent className="w-3.5 h-3.5" />,
  fixed: <DollarSign className="w-3.5 h-3.5" />,
  free_shipping: <Truck className="w-3.5 h-3.5" />,
};

export default function AdminOffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [toggleLoading, setToggleLoading] = useState<string | null>(null);

  const loadOffers = useCallback(async () => {
    setIsLoading(true);
    const supabase = createClient();
    if (!supabase || !isSupabaseConfigured()) {
      setOffers(DEMO_OFFERS);
      setIsDemo(true);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("offers")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setOffers((data as Offer[]) ?? []);
      setIsDemo(false);
    } catch {
      setOffers(DEMO_OFFERS);
      setIsDemo(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOffers();
  }, [loadOffers]);

  const toggleActive = async (offer: Offer) => {
    setToggleLoading(offer.id);
    const supabase = createClient();

    if (!supabase || !isSupabaseConfigured()) {
      // Demo: toggle locally
      setOffers((prev) =>
        prev.map((o) => (o.id === offer.id ? { ...o, is_active: !o.is_active } : o))
      );
      setToggleLoading(null);
      return;
    }

    try {
      await supabase
        .from("offers")
        .update({ is_active: !offer.is_active })
        .eq("id", offer.id);
      await loadOffers();
    } catch {
      // Ignore
    } finally {
      setToggleLoading(null);
    }
  };

  const formatDiscount = (offer: Offer) => {
    if (offer.offer_type === "percentage") return `${offer.discount_value}%`;
    if (offer.offer_type === "fixed") return `₹${offer.discount_value}`;
    return "Free Delivery";
  };

  const now = new Date();
  const active = offers.filter((o) => o.is_active);
  const expired = offers.filter(
    (o) => !o.is_active || (o.valid_until && new Date(o.valid_until) < now)
  );

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-5rem)]">
      <AdminSidebar />

      <div className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/40 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-extrabold text-foreground">Offers & Promotions</h1>
              {isDemo && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400">
                  DEMO DATA
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Manage promo codes, free delivery thresholds, and redemption limits.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" className="gap-2 text-xs" onClick={loadOffers}>
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </Button>
          </div>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Offers", value: offers.length, color: "text-foreground" },
            { label: "Active", value: active.length, color: "text-[#00FF66]" },
            { label: "Inactive / Expired", value: expired.length, color: "text-rose-400" },
            { label: "Total Redemptions", value: offers.reduce((s, o) => s + o.redemption_count, 0), color: "text-sky-400" },
          ].map((kpi) => (
            <Card key={kpi.label} className="p-4 border-white/10 space-y-1">
              <p className="text-[11px] text-muted-foreground">{kpi.label}</p>
              <p className={`text-xl font-extrabold ${kpi.color}`}>{kpi.value}</p>
            </Card>
          ))}
        </div>

        {/* Offers Grid */}
        {isLoading ? (
          <div className="p-12 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-[#00FF66]" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {offers.map((offer) => {
              const isExpired =
                offer.valid_until && new Date(offer.valid_until) < now;
              return (
                <Card
                  key={offer.id}
                  className={`p-5 space-y-4 border-white/10 transition-all ${
                    !offer.is_active || isExpired
                      ? "opacity-60"
                      : "hover:border-[#00FF66]/30"
                  }`}
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-muted-foreground">
                          {TYPE_ICON[offer.offer_type]}
                        </span>
                        <span className="font-mono text-xs font-bold text-[#00FF66] bg-[#00FF66]/10 px-2 py-0.5 rounded-lg border border-[#00FF66]/20">
                          {offer.offer_code}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-foreground">
                        {offer.offer_name}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      {offer.is_active && !isExpired ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" />
                          Active
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 rounded-full">
                          <XCircle className="w-3 h-3" />
                          {isExpired ? "Expired" : "Inactive"}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Discount</span>
                      <span className="text-foreground font-bold">
                        {formatDiscount(offer)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Min. Order</span>
                      <span className="text-foreground">
                        {Number(offer.minimum_order_value) > 0
                          ? `₹${offer.minimum_order_value}`
                          : "No minimum"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Redemptions</span>
                      <span className="text-foreground">
                        {offer.redemption_count}
                        {offer.max_redemptions ? ` / ${offer.max_redemptions}` : " (unlimited)"}
                      </span>
                    </div>
                    {offer.valid_until && (
                      <div className="flex justify-between">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Expires
                        </span>
                        <span className={isExpired ? "text-rose-400" : "text-foreground"}>
                          {new Date(offer.valid_until).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Toggle */}
                  <button
                    onClick={() => toggleActive(offer)}
                    disabled={toggleLoading === offer.id}
                    className={`w-full text-xs py-2 rounded-xl border font-semibold transition-all ${
                      offer.is_active
                        ? "border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
                        : "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                    }`}
                  >
                    {toggleLoading === offer.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" />
                    ) : offer.is_active ? (
                      "Deactivate Offer"
                    ) : (
                      "Reactivate Offer"
                    )}
                  </button>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
