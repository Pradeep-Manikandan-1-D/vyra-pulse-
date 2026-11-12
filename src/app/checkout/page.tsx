"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Lock,
  ShieldCheck,
  Truck,
  Tag,
  ChevronDown,
  ChevronUp,
  Package,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { VYRA_FLAVORS, STORE_POLICIES } from "@/lib/constants";
import { CheckoutResult } from "@/lib/types";
import { recordCustomerOrder, getCustomerByEmail } from "@/lib/customer/data";

interface DeliveryForm {
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  pincode: string;
}

const INITIAL_FORM: DeliveryForm = {
  full_name: "",
  phone: "",
  address_line1: "",
  address_line2: "",
  city: "",
  state: "",
  pincode: "",
};

export default function CheckoutPage() {
  const { items, subtotal, deliveryFee, total, clearCart } = useCart();
  const { user, profile, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState<DeliveryForm>(INITIAL_FORM);
  const [offerCode, setOfferCode] = useState("");
  const [offerError, setOfferError] = useState<string | null>(null);
  const [offerDiscount, setOfferDiscount] = useState(0);
  const [offerApplied, setOfferApplied] = useState<string | null>(null);
  const [showOfferInput, setShowOfferInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderResult, setOrderResult] = useState<CheckoutResult | null>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/customer/login?returnUrl=/checkout");
    }
  }, [user, authLoading, router]);

  // Prefill name from profile
  useEffect(() => {
    if (profile?.display_name) {
      setForm((f) => ({ ...f, full_name: f.full_name || profile.display_name || "" }));
    }
  }, [profile]);

  // Redirect to cart if empty
  useEffect(() => {
    if (!authLoading && items.length === 0 && !orderResult) {
      router.replace("/cart");
    }
  }, [items, authLoading, orderResult, router]);

  const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleApplyOffer = async () => {
    setOfferError(null);
    if (!offerCode.trim()) return;

    const supabase = createClient();
    if (!supabase || !isSupabaseConfigured()) {
      // Check both seeded demo codes and any admin-created/edited offers
      let activeOffers: Record<string, { type: string; value: number; name: string; min: number; active: boolean; expiry?: string | null }> = {
        "WELCOME10": { type: "percentage", value: 10, name: "10% Welcome Offer", min: 500, active: true },
        "VPULSE10":  { type: "percentage", value: 10, name: "10% Welcome Offer", min: 0, active: true },
        "VPULSE20":  { type: "percentage", value: 20, name: "Flash Sale 20% OFF", min: 300, active: true },
        "FLAT50":    { type: "fixed", value: 50, name: "₹50 Flat Discount", min: 250, active: true },
        "FLAT100":   { type: "fixed", value: 100, name: "₹100 Big Discount", min: 500, active: true },
        "FREESHIP":  { type: "free_shipping", value: 0, name: "Free Shipping", min: 200, active: true },
      };

      try {
        const storedOffers = localStorage.getItem("vyra_admin_offers");
        if (storedOffers) {
          const parsed = JSON.parse(storedOffers);
          if (Array.isArray(parsed)) {
            parsed.forEach((po: any) => {
              activeOffers[po.offer_code.toUpperCase()] = {
                type: po.offer_type,
                value: Number(po.discount_value),
                name: po.offer_name,
                min: Number(po.minimum_order_value) || 0,
                active: po.is_active,
                expiry: po.valid_until,
              };
            });
          }
        }
      } catch {
        // Ignore
      }

      const demo = activeOffers[offerCode.toUpperCase()];
      if (demo && demo.active) {
        if (demo.expiry && new Date(demo.expiry) < new Date()) {
          setOfferError("This offer code has expired.");
          setOfferDiscount(0);
          setOfferApplied(null);
          return;
        }

        if (subtotal < demo.min) {
          setOfferError(`Minimum order value of ₹${demo.min} required for this offer.`);
          setOfferDiscount(0);
          setOfferApplied(null);
          return;
        }

        const disc = demo.type === "percentage"
          ? (subtotal * demo.value) / 100
          : demo.type === "fixed"
          ? Math.min(demo.value, subtotal)
          : deliveryFee;
        setOfferDiscount(disc);
        setOfferApplied(offerCode.toUpperCase());
        setOfferError(null);
      } else {
        setOfferError("Invalid or expired offer code.");
        setOfferDiscount(0);
        setOfferApplied(null);
      }
      return;
    }

    // Live Supabase offer validation
    const { data, error } = await supabase
      .from("offers")
      .select("*")
      .eq("offer_code", offerCode.toUpperCase())
      .eq("is_active", true)
      .single();

    if (error || !data) {
      setOfferError("Invalid or expired offer code.");
      setOfferDiscount(0);
      setOfferApplied(null);
      return;
    }

    if (subtotal < Number(data.minimum_order_value)) {
      setOfferError(
        `Minimum order value of ₹${data.minimum_order_value} required for this offer.`
      );
      return;
    }

    const disc =
      data.offer_type === "percentage"
        ? (subtotal * Number(data.discount_value)) / 100
        : data.offer_type === "fixed"
        ? Math.min(Number(data.discount_value), subtotal)
        : deliveryFee;

    setOfferDiscount(disc);
    setOfferApplied(data.offer_code);
    setOfferError(null);
  };

  const finalTotal = Math.max(0, total - offerDiscount);

  const handlePlaceOrder = async () => {
    setError(null);
    setIsSubmitting(true);

    // Basic form validation
    const required: (keyof DeliveryForm)[] = [
      "full_name", "phone", "address_line1", "city", "state", "pincode",
    ];
    for (const field of required) {
      if (!form[field].trim()) {
        setError(`Please fill in: ${field.replace(/_/g, " ")}.`);
        setIsSubmitting(false);
        return;
      }
    }

    const supabase = createClient();

    if (!supabase || !isSupabaseConfigured()) {
      // ─── Demo / local-dev fallback ─────────────────────────────
      await new Promise((r) => setTimeout(r, 1200));
      const orderCode = `ORD-DEMO-${Math.floor(Math.random() * 900 + 100)}`;
      const pointsEarned = items.reduce((s, i) => s + i.quantity * 10, 0);
      const mockOrder: CheckoutResult = {
        order_id: `demo-${Date.now()}`,
        order_code: orderCode,
        total_amount: finalTotal,
        points_earned: pointsEarned,
      };

      try {
        const customerCode =
          profile?.customer_id ||
          (user?.email ? getCustomerByEmail(user.email)?.customer_id : null) ||
          user?.id ||
          "GUEST-CUST";

        const fullOrder = {
          id: mockOrder.order_id,
          order_code: mockOrder.order_code,
          customer_id: customerCode,
          order_status: "processing" as const,
          payment_status: "paid" as const,
          subtotal: subtotal,
          discount_amount: offerDiscount,
          delivery_fee: deliveryFee,
          total_amount: finalTotal,
          delivery_city: form.city,
          delivery_state: form.state,
          delivery_address: `${form.address_line1}, ${form.city}, ${form.state} - ${form.pincode}`,
          recipient_name: form.full_name,
          recipient_phone: form.phone,
          offer_code: offerApplied,
          points_earned: pointsEarned,
          created_at: new Date().toISOString(),
          items: items.map((i) => ({
            product_id: i.product_id,
            product_name_snapshot: i.name,
            flavor_snapshot: i.flavor,
            quantity: i.quantity,
            unit_price: i.price,
            line_total: i.price * i.quantity,
          })),
        };

        // Record strictly into this customer's isolated account ledger
        recordCustomerOrder(customerCode, fullOrder as any);
      } catch (e) {
        console.warn("Could not save isolated order", e);
      }

      setOrderResult(mockOrder);
      clearCart();
      setIsSubmitting(false);
      return;
    }

    try {
      // ─── Live Supabase secure checkout via canonical PostgreSQL RPC ──────
      const customerId =
        profile?.customer_id ||
        (user?.email ? getCustomerByEmail(user.email)?.customer_id : null) ||
        user?.id ||
        "CUST-0001";

      const deliveryLocation = [
        form.full_name,
        form.phone,
        form.address_line1,
        form.address_line2,
      ].filter(Boolean).join(", ");

      const payload = {
        p_customer_id: customerId,
        p_items: items.map((i) => ({
          product_id: i.product_id,
          quantity: i.quantity,
        })),
        p_delivery_city: form.city,
        p_delivery_state: form.state,
        p_delivery_postal_code: form.pincode,
        p_delivery_location: deliveryLocation,
        p_coupon_code: offerApplied || null,
      };

      const { data, error: rpcError } = await supabase.rpc(
        "process_customer_checkout",
        payload
      );

      if (rpcError) {
        setError(rpcError.message || "Checkout failed. Please try again.");
        setIsSubmitting(false);
        return;
      }

      const res = data as any;
      setOrderResult({
        order_id: res?.order_id || `ORD-${Date.now()}`,
        order_code: res?.order_id || `ORD-${Date.now()}`,
        total_amount: Number(res?.order_total_inr ?? res?.total_amount ?? finalTotal),
        points_earned: Number(res?.points_earned ?? 0),
      });
      clearCart();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Checkout failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Order Confirmation Screen ─────────────────────────────────────────────
  if (orderResult) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 text-primary" />
          </div>
          <div className="space-y-2">
            <div className="inline-block px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold font-mono">
              {orderResult.order_code}
            </div>
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
              Order Confirmed!
            </h1>
            <p className="text-sm text-muted-foreground">
              Your Vyra Pulse order has been placed and payment is pending. You&apos;ll receive
              a confirmation shortly.
            </p>
          </div>

          <Card className="neu-card p-4 text-sm space-y-2 border-border/40 text-left">
            <div className="flex justify-between text-muted-foreground">
              <span>Total Paid</span>
              <span className="text-foreground font-bold">₹{orderResult.total_amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Pulse Points Earned</span>
              <span className="text-primary font-bold">+{orderResult.points_earned} pts</span>
            </div>
          </Card>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/account/orders">
              <Button variant="secondary" className="w-full sm:w-auto gap-2 text-sm">
                <Package className="w-4 h-4" />
                View My Orders
              </Button>
            </Link>
            <Link href="/shop">
              <Button className="w-full sm:w-auto gap-2 text-sm">
                Continue Shopping
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10 md:py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 border-b border-border/40 pb-6">
          <div className="flex items-center gap-2 mb-1">
            <Lock className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-mono uppercase tracking-wider text-primary">
              Secure Checkout
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Complete Your Order
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Delivery Details — left */}
          <div className="lg:col-span-3 space-y-6">
            {/* Delivery Address */}
            <Card className="neu-card p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-primary" />
                <h2 className="font-bold text-foreground">Delivery Address</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: "Full Name", name: "full_name", placeholder: "Your full name", cols: 2 },
                  { label: "Phone Number", name: "phone", placeholder: "10-digit mobile", cols: 2 },
                  { label: "Address Line 1", name: "address_line1", placeholder: "Street, Building", cols: 2 },
                  { label: "Address Line 2 (Optional)", name: "address_line2", placeholder: "Landmark, Floor", cols: 2 },
                  { label: "City", name: "city", placeholder: "City" },
                  { label: "State", name: "state", placeholder: "State" },
                  { label: "Pincode", name: "pincode", placeholder: "6-digit pincode" },
                ].map((f) => (
                  <div
                    key={f.name}
                    className={f.cols === 2 ? "sm:col-span-2" : ""}
                  >
                    <label className="block text-xs font-semibold text-foreground mb-1.5">
                      {f.label}
                    </label>
                    <input
                      name={f.name}
                      value={form[f.name as keyof DeliveryForm]}
                      onChange={handleFieldChange}
                      placeholder={f.placeholder}
                      className="neu-inset w-full px-3.5 py-2.5 text-sm rounded-xl border border-border/40 bg-surface text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                    />
                  </div>
                ))}
              </div>
            </Card>

            {/* Offer Code */}
            <Card className="neu-card p-5">
              <button
                onClick={() => setShowOfferInput((v) => !v)}
                className="w-full flex items-center justify-between text-sm font-semibold text-foreground"
              >
                <span className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-primary" />
                  Have an offer code?
                </span>
                {showOfferInput ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </button>

              {showOfferInput && (
                <div className="mt-4 flex gap-2">
                  <input
                    value={offerCode}
                    onChange={(e) => setOfferCode(e.target.value.toUpperCase())}
                    placeholder="ENTER CODE"
                    className="neu-inset flex-1 px-3.5 py-2.5 text-sm rounded-xl border border-border/40 bg-surface text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-mono tracking-wider"
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleApplyOffer}
                    disabled={!offerCode}
                  >
                    Apply
                  </Button>
                </div>
              )}

              {offerApplied && (
                <p className="mt-2 text-xs text-primary flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Code <strong>{offerApplied}</strong> applied — saving ₹{offerDiscount.toFixed(2)}
                </p>
              )}
              {offerError && (
                <p className="mt-2 text-xs text-rose-500 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {offerError}
                </p>
              )}
            </Card>

            {/* Error */}
            {error && (
              <div className="neu-card p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-500 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                {error}
              </div>
            )}
          </div>

          {/* Order Summary — right */}
          <div className="lg:col-span-2">
            <Card className="neu-card p-6 sticky top-24 space-y-5">
              <h2 className="font-bold text-foreground">Order Summary</h2>

              {/* Items list */}
              <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                {items.map((item) => {
                  return (
                    <div key={item.product_id} className="flex justify-between text-xs gap-2">
                      <span className="text-muted-foreground truncate">
                        {item.name} × {item.quantity}
                      </span>
                      <span className="text-foreground font-medium shrink-0">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-border/40 pt-4 space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5" />
                    Delivery
                  </span>
                  {deliveryFee === 0 ? (
                    <span className="text-primary font-bold">FREE</span>
                  ) : (
                    <span>₹{deliveryFee.toFixed(2)}</span>
                  )}
                </div>
                {offerDiscount > 0 && (
                  <div className="flex justify-between text-primary font-medium">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5" />
                      Offer ({offerApplied})
                    </span>
                    <span>−₹{offerDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t border-border/40 pt-3 flex justify-between font-extrabold text-foreground">
                  <span>Total</span>
                  <span className="text-lg">₹{finalTotal.toFixed(2)}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/10 text-[11px] text-amber-600 dark:text-amber-300">
                <strong>Demo Checkout:</strong> No real payment is processed. Orders are
                stored for BI and fulfilment tracking.
              </div>

              <Button
                variant="primary"
                className="w-full justify-center gap-2 py-3 shadow-lg"
                onClick={handlePlaceOrder}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Placing Order...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    Place Order · ₹{finalTotal.toFixed(2)}
                  </>
                )}
              </Button>

              <Link href="/cart" className="block text-center">
                <span className="text-xs text-muted-foreground hover:text-primary transition-colors">
                  ← Return to Cart
                </span>
              </Link>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
