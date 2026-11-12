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
  Edit2,
  Trash2,
  X,
  AlertCircle,
  Check,
} from "lucide-react";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { Offer, OfferType } from "@/lib/types";

const INITIAL_DEMO_OFFERS: Offer[] = [
  { id: "off-1", offer_code: "WELCOME10", offer_name: "First Order Welcome Discount", offer_type: "percentage", discount_value: 10, minimum_order_value: 500, valid_from: "2026-10-01T00:00:00Z", valid_until: "2027-03-31T23:59:00Z", is_active: true, max_redemptions: null, redemption_count: 52, created_at: "2026-10-01T00:00:00Z" },
  { id: "off-2", offer_code: "VPULSE10", offer_name: "Athlete 10% Welcome Offer", offer_type: "percentage", discount_value: 10, minimum_order_value: 0, valid_from: "2026-01-01T00:00:00Z", valid_until: null, is_active: true, max_redemptions: null, redemption_count: 42, created_at: "2026-01-01T00:00:00Z" },
  { id: "off-3", offer_code: "VPULSE20", offer_name: "Flash Sale 20% OFF", offer_type: "percentage", discount_value: 20, minimum_order_value: 300, valid_from: "2026-10-01T00:00:00Z", valid_until: "2027-03-31T23:59:00Z", is_active: true, max_redemptions: 100, redemption_count: 17, created_at: "2026-10-01T00:00:00Z" },
  { id: "off-4", offer_code: "FREESHIP", offer_name: "Free Shipping Boost", offer_type: "free_shipping", discount_value: 0, minimum_order_value: 200, valid_from: "2026-01-01T00:00:00Z", valid_until: null, is_active: true, max_redemptions: null, redemption_count: 88, created_at: "2026-01-01T00:00:00Z" },
  { id: "off-5", offer_code: "FLAT50", offer_name: "₹50 Flat Energy Discount", offer_type: "fixed", discount_value: 50, minimum_order_value: 250, valid_from: "2026-09-01T00:00:00Z", valid_until: null, is_active: true, max_redemptions: null, redemption_count: 31, created_at: "2026-09-01T00:00:00Z" },
  { id: "off-6", offer_code: "FLAT100", offer_name: "₹100 Big Energy Bundle Discount", offer_type: "fixed", discount_value: 100, minimum_order_value: 500, valid_from: "2026-10-10T00:00:00Z", valid_until: "2027-03-31T23:59:00Z", is_active: true, max_redemptions: 50, redemption_count: 24, created_at: "2026-10-10T00:00:00Z" },
  { id: "off-7", offer_code: "OLDPULSE", offer_name: "Expired Demo Offer", offer_type: "percentage", discount_value: 8, minimum_order_value: 399, valid_from: "2026-01-01T00:00:00Z", valid_until: "2026-06-30T23:59:00Z", is_active: false, max_redemptions: 50, redemption_count: 50, created_at: "2026-01-01T00:00:00Z" },
];

const TYPE_ICON: Record<OfferType, React.ReactNode> = {
  percentage: <Percent className="w-3.5 h-3.5" />,
  fixed: <DollarSign className="w-3.5 h-3.5" />,
  free_shipping: <Truck className="w-3.5 h-3.5" />,
};

interface OfferModalForm {
  offer_code: string;
  offer_name: string;
  offer_type: OfferType;
  discount_value: number;
  minimum_order_value: number;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
  max_redemptions: string;
}

const DEFAULT_FORM: OfferModalForm = {
  offer_code: "",
  offer_name: "",
  offer_type: "percentage",
  discount_value: 10,
  minimum_order_value: 299,
  valid_from: new Date().toISOString().split("T")[0],
  valid_until: "",
  is_active: true,
  max_redemptions: "",
};

export default function AdminOffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [toggleLoading, setToggleLoading] = useState<string | null>(null);

  // Create / Edit modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOfferId, setEditingOfferId] = useState<string | null>(null);
  const [form, setForm] = useState<OfferModalForm>(DEFAULT_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Delete modal state
  const [deletingOffer, setDeletingOffer] = useState<Offer | null>(null);

  const saveOffersToStorage = (updated: Offer[]) => {
    try {
      localStorage.setItem("vyra_admin_offers", JSON.stringify(updated));
    } catch {
      // Ignore
    }
  };

  const loadOffers = useCallback(async () => {
    setIsLoading(true);
    const supabase = createClient();

    if (supabase && isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from("offers")
          .select("*")
          .order("created_at", { ascending: false });

        if (!error && data && data.length > 0) {
          const mapped = data.map((o: any) => ({
            id: o.offer_id || o.id,
            offer_code: o.coupon_code || o.offer_code,
            offer_name: o.offer_name,
            offer_type: o.discount_percent > 0 ? "percentage" : o.discount_amount_inr > 0 ? "fixed" : "free_shipping",
            discount_value: Number(o.discount_percent || o.discount_amount_inr || 0),
            minimum_order_value: Number(o.minimum_order_value_inr || o.minimum_order_value || 0),
            valid_from: o.valid_from,
            valid_until: o.valid_until,
            is_active: o.is_active,
            max_redemptions: o.max_redemptions || null,
            redemption_count: o.redemption_count || 0,
            created_at: o.created_at,
          }));
          setOffers(mapped as Offer[]);
          setIsDemo(false);
          setIsLoading(false);
          return;
        }
      } catch (err) {
        console.warn("Could not query offers from Supabase:", err);
      }
    }

    // Dev/offline fallback with localStorage persistence
    try {
      const stored = localStorage.getItem("vyra_admin_offers");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setOffers(parsed);
          setIsDemo(true);
          setIsLoading(false);
          return;
        }
      }
    } catch {
      // Ignore
    }

    setOffers(INITIAL_DEMO_OFFERS);
    saveOffersToStorage(INITIAL_DEMO_OFFERS);
    setIsDemo(true);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadOffers();
  }, [loadOffers]);

  const toggleActive = async (offer: Offer) => {
    setToggleLoading(offer.id);
    const updatedStatus = !offer.is_active;

    const supabase = createClient();
    if (supabase && isSupabaseConfigured()) {
      try {
        await supabase
          .from("offers")
          .update({ is_active: updatedStatus })
          .or(`offer_id.eq.${offer.id},id.eq.${offer.id}`);
      } catch (err) {
        console.warn("Supabase offer toggle failed:", err);
      }
    }

    setOffers((prev) => {
      const next = prev.map((o) => (o.id === offer.id ? { ...o, is_active: updatedStatus } : o));
      saveOffersToStorage(next);
      return next;
    });

    setToggleLoading(null);
  };

  const handleOpenCreate = () => {
    setEditingOfferId(null);
    setForm(DEFAULT_FORM);
    setFormError(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (offer: Offer) => {
    setEditingOfferId(offer.id);
    setForm({
      offer_code: offer.offer_code,
      offer_name: offer.offer_name,
      offer_type: offer.offer_type,
      discount_value: offer.discount_value,
      minimum_order_value: offer.minimum_order_value,
      valid_from: offer.valid_from ? offer.valid_from.split("T")[0] : "",
      valid_until: offer.valid_until ? offer.valid_until.split("T")[0] : "",
      is_active: offer.is_active,
      max_redemptions: offer.max_redemptions ? String(offer.max_redemptions) : "",
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleSaveOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const code = form.offer_code.trim().toUpperCase();
    if (!code) {
      setFormError("Coupon code is required.");
      return;
    }

    if (!form.offer_name.trim()) {
      setFormError("Offer title is required.");
      return;
    }

    if (form.offer_type !== "free_shipping" && Number(form.discount_value) <= 0) {
      setFormError("Discount value must be greater than zero.");
      return;
    }

    // Check duplicate code
    const duplicate = offers.find(
      (o) => o.offer_code.toUpperCase() === code && o.id !== editingOfferId
    );
    if (duplicate) {
      setFormError(`Coupon code "${code}" is already in use.`);
      return;
    }

    setIsSaving(true);

    const offerData: Offer = {
      id: editingOfferId || `off-${Date.now()}`,
      offer_code: code,
      offer_name: form.offer_name.trim(),
      offer_type: form.offer_type,
      discount_value: form.offer_type === "free_shipping" ? 0 : Number(form.discount_value),
      minimum_order_value: Number(form.minimum_order_value) || 0,
      valid_from: form.valid_from ? `${form.valid_from}T00:00:00Z` : new Date().toISOString(),
      valid_until: form.valid_until ? `${form.valid_until}T23:59:59Z` : null,
      is_active: form.is_active,
      max_redemptions: form.max_redemptions ? Number(form.max_redemptions) : null,
      redemption_count: editingOfferId
        ? offers.find((o) => o.id === editingOfferId)?.redemption_count || 0
        : 0,
      created_at: editingOfferId
        ? offers.find((o) => o.id === editingOfferId)?.created_at || new Date().toISOString()
        : new Date().toISOString(),
    };

    const supabase = createClient();
    if (supabase && isSupabaseConfigured()) {
      try {
        await supabase.from("offers").upsert({
          offer_id: offerData.id,
          coupon_code: offerData.offer_code,
          offer_name: offerData.offer_name,
          discount_percent: offerData.offer_type === "percentage" ? offerData.discount_value : 0,
          discount_amount_inr: offerData.offer_type === "fixed" ? offerData.discount_value : 0,
          minimum_order_value_inr: offerData.minimum_order_value,
          valid_from: offerData.valid_from.split("T")[0],
          valid_until: offerData.valid_until ? offerData.valid_until.split("T")[0] : "2099-12-31",
          is_active: offerData.is_active,
        });
      } catch (err) {
        console.warn("Supabase offer upsert error:", err);
      }
    }

    setOffers((prev) => {
      let next: Offer[];
      if (editingOfferId) {
        next = prev.map((o) => (o.id === editingOfferId ? offerData : o));
      } else {
        next = [offerData, ...prev];
      }
      saveOffersToStorage(next);
      return next;
    });

    setIsSaving(false);
    setModalOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (!deletingOffer) return;

    const targetId = deletingOffer.id;
    const supabase = createClient();

    if (supabase && isSupabaseConfigured()) {
      try {
        await supabase.from("offers").delete().or(`offer_id.eq.${targetId},id.eq.${targetId}`);
      } catch (err) {
        console.warn("Supabase offer deletion failed:", err);
      }
    }

    setOffers((prev) => {
      const next = prev.filter((o) => o.id !== targetId);
      saveOffersToStorage(next);
      return next;
    });

    setDeletingOffer(null);
  };

  const formatDiscount = (offer: Offer) => {
    if (offer.offer_type === "percentage") return `${offer.discount_value}% OFF`;
    if (offer.offer_type === "fixed") return `₹${offer.discount_value} OFF`;
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
                  ACTIVE REGISTRY ({offers.length})
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Create, configure, activate, deactivate, or archive promotional coupons and discounts.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="neu-btn-primary text-black font-bold text-xs gap-1.5"
              onClick={handleOpenCreate}
            >
              <Plus className="w-3.5 h-3.5" />
              Create Offer
            </Button>
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
            { label: "Active Coupons", value: active.length, color: "text-primary" },
            { label: "Inactive / Expired", value: expired.length, color: "text-rose-400" },
            {
              label: "Total Redemptions",
              value: offers.reduce((s, o) => s + o.redemption_count, 0),
              color: "text-sky-400",
            },
          ].map((kpi) => (
            <Card key={kpi.label} className="neu-card p-4 border-border/40 space-y-1">
              <p className="text-[11px] text-muted-foreground">{kpi.label}</p>
              <p className={`text-xl font-extrabold ${kpi.color}`}>{kpi.value}</p>
            </Card>
          ))}
        </div>

        {/* Offers Grid */}
        {isLoading ? (
          <div className="p-12 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {offers.map((offer) => {
              const isExpired = offer.valid_until && new Date(offer.valid_until) < now;

              return (
                <Card
                  key={offer.id}
                  className={`neu-card p-5 space-y-4 border-border/40 transition-all ${
                    !offer.is_active || isExpired ? "opacity-75" : "hover:border-primary/30"
                  }`}
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-muted-foreground">{TYPE_ICON[offer.offer_type]}</span>
                        <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-lg border border-primary/20">
                          {offer.offer_code}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-foreground line-clamp-1">
                        {offer.offer_name}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      {offer.is_active && !isExpired ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" />
                          Active
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-rose-500 dark:text-rose-400 bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 rounded-full">
                          <XCircle className="w-3 h-3" />
                          {isExpired ? "Expired" : "Inactive"}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-1.5 text-xs text-muted-foreground pt-1">
                    <div className="flex justify-between">
                      <span>Discount</span>
                      <span className="text-foreground font-bold">{formatDiscount(offer)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Min. Order Value</span>
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
                          Valid Until
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

                  {/* Actions Bar */}
                  <div className="pt-2 border-t border-border/20 flex items-center gap-2">
                    <button
                      onClick={() => toggleActive(offer)}
                      disabled={toggleLoading === offer.id}
                      className={`flex-1 text-xs py-2 rounded-xl border font-semibold transition-all ${
                        offer.is_active
                          ? "border-rose-500/30 text-rose-500 hover:bg-rose-500/10"
                          : "border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10"
                      }`}
                    >
                      {toggleLoading === offer.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" />
                      ) : offer.is_active ? (
                        "Deactivate"
                      ) : (
                        "Activate"
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEdit(offer)}
                      title="Edit Offer"
                      className="neu-raised-sm p-2 rounded-xl border border-border/40 text-muted-foreground hover:text-foreground transition-all"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeletingOffer(offer)}
                      title="Archive / Delete Offer"
                      className="neu-raised-sm p-2 rounded-xl border border-border/40 text-rose-500 hover:bg-rose-500/10 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* ─── CREATE / EDIT OFFER MODAL ─── */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
            <Card className="neu-card w-full max-w-lg border-border/60 p-6 md:p-8 space-y-5">
              <div className="flex items-center justify-between border-b border-border/40 pb-3">
                <h2 className="text-xl font-extrabold text-foreground">
                  {editingOfferId ? "Edit Promotion Offer" : "Create New Promotion Offer"}
                </h2>
                <button
                  onClick={() => setModalOpen(false)}
                  className="neu-raised-sm p-1.5 rounded-xl text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {formError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSaveOffer} className="space-y-4 text-xs">
                <div>
                  <label className="block text-muted-foreground mb-1 font-medium">
                    Coupon Code (Unique identifier)
                  </label>
                  <input
                    value={form.offer_code}
                    onChange={(e) => setForm({ ...form, offer_code: e.target.value.toUpperCase() })}
                    placeholder="e.g. FLASH25"
                    className="neu-inset w-full px-3.5 py-2.5 rounded-xl border border-border/40 bg-surface font-mono font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    required
                  />
                </div>

                <div>
                  <label className="block text-muted-foreground mb-1 font-medium">Offer Title / Description</label>
                  <input
                    value={form.offer_name}
                    onChange={(e) => setForm({ ...form, offer_name: e.target.value })}
                    placeholder="e.g. Special Weekend 25% Off"
                    className="neu-inset w-full px-3.5 py-2.5 rounded-xl border border-border/40 bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-muted-foreground mb-1 font-medium">Offer Type</label>
                    <select
                      value={form.offer_type}
                      onChange={(e) => setForm({ ...form, offer_type: e.target.value as OfferType })}
                      className="neu-inset w-full px-3 py-2.5 rounded-xl border border-border/40 bg-surface text-foreground focus:outline-none"
                    >
                      <option value="percentage">Percentage Discount (%)</option>
                      <option value="fixed">Fixed Amount (₹)</option>
                      <option value="free_shipping">Free Shipping</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-muted-foreground mb-1 font-medium">
                      Discount Value {form.offer_type === "percentage" ? "(%)" : "(₹)"}
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={form.discount_value}
                      disabled={form.offer_type === "free_shipping"}
                      onChange={(e) => setForm({ ...form, discount_value: Number(e.target.value) })}
                      className="neu-inset w-full px-3.5 py-2.5 rounded-xl border border-border/40 bg-surface text-foreground focus:outline-none disabled:opacity-40"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-muted-foreground mb-1 font-medium">Min. Order Value (₹)</label>
                    <input
                      type="number"
                      min={0}
                      value={form.minimum_order_value}
                      onChange={(e) => setForm({ ...form, minimum_order_value: Number(e.target.value) })}
                      className="neu-inset w-full px-3.5 py-2.5 rounded-xl border border-border/40 bg-surface text-foreground focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-muted-foreground mb-1 font-medium">Expiry Date (Optional)</label>
                    <input
                      type="date"
                      value={form.valid_until}
                      onChange={(e) => setForm({ ...form, valid_until: e.target.value })}
                      className="neu-inset w-full px-3.5 py-2 rounded-xl border border-border/40 bg-surface text-foreground focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="isActiveCheck"
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                  <label htmlFor="isActiveCheck" className="text-foreground font-medium cursor-pointer">
                    Enable offer immediately upon saving
                  </label>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/40">
                  <Button type="button" variant="secondary" size="sm" onClick={() => setModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" disabled={isSaving} className="neu-btn-primary text-black font-bold">
                    {isSaving ? "Saving..." : editingOfferId ? "Save Changes" : "Create Offer"}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}

        {/* ─── CONFIRM DELETE / ARCHIVE MODAL ─── */}
        {deletingOffer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
            <Card className="neu-card w-full max-w-md border-border/60 p-6 space-y-4">
              <div className="flex items-center gap-3 text-rose-500">
                <AlertCircle className="w-6 h-6" />
                <h3 className="text-base font-bold text-foreground">Archive or Delete Offer</h3>
              </div>
              <p className="text-xs text-muted-foreground">
                Are you sure you want to remove offer{" "}
                <strong className="text-foreground font-mono">{deletingOffer.offer_code}</strong> (
                {deletingOffer.offer_name})? This coupon will immediately no longer be eligible in checkout.
              </p>
              <div className="flex justify-end gap-3 pt-3">
                <Button size="sm" variant="secondary" onClick={() => setDeletingOffer(null)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleConfirmDelete}
                  className="bg-rose-500 hover:bg-rose-600 text-white font-bold"
                >
                  Confirm Delete
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
