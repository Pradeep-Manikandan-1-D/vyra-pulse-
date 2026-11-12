"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Repeat,
  Calendar,
  Package,
  Plus,
  Play,
  Pause,
  XCircle,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Truck,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  fetchCustomerSubscriptions,
  updateCustomerSubscriptionDb,
  addCustomerSubscriptionDb,
  CustomerSubscription,
} from "@/lib/customer/data";
import { VYRA_FLAVORS } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function SubscriptionsPage() {
  const { user, profile } = useAuth();
  const customerId = profile?.customer_id || user?.id || "CUST-0001";

  const [subscriptions, setSubscriptions] = useState<CustomerSubscription[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(VYRA_FLAVORS[0].id);
  const [quantity, setQuantity] = useState(4);
  const [frequency, setFrequency] = useState<"weekly" | "biweekly" | "monthly">("biweekly");
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchCustomerSubscriptions(customerId).then((subs) => {
      if (active) setSubscriptions(subs);
    });
    return () => {
      active = false;
    };
  }, [customerId]);

  const handleStatusChange = async (subId: string, status: "active" | "paused" | "cancelled") => {
    const updated = await updateCustomerSubscriptionDb(customerId, subId, status);
    setSubscriptions(updated);
    setActionNotice(`Subscription ${status === "paused" ? "paused" : status === "cancelled" ? "cancelled" : "resumed"} successfully.`);
    setTimeout(() => setActionNotice(null), 3000);
  };

  const handleCreateSub = async (e: React.FormEvent) => {
    e.preventDefault();
    const product = VYRA_FLAVORS.find((f) => f.id === selectedProduct) || VYRA_FLAVORS[0];
    const basePrice = product.priceInr * quantity;
    const discountedPrice = Number((basePrice * 0.9).toFixed(1)); // 10% sub discount

    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + (frequency === "weekly" ? 7 : frequency === "biweekly" ? 14 : 30));

    const updated = await addCustomerSubscriptionDb(customerId, {
      product_id: product.id,
      product_name: product.name,
      flavor: product.flavor,
      quantity,
      frequency,
      status: "active",
      price_per_delivery: discountedPrice,
      next_delivery_date: nextDate.toISOString().split("T")[0],
    });

    setSubscriptions(updated);
    setShowAddModal(false);
    setActionNotice("New recurring delivery scheduled with 10% subscriber discount.");
    setTimeout(() => setActionNotice(null), 3500);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/40 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-xs font-semibold text-purple-700 dark:text-purple-400 mb-2">
            <Repeat className="w-3.5 h-3.5" />
            <span>Auto-Replenish Service • 10% Off Every Crate</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Subscriptions & Recurring Orders
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Keep your fridge stocked automatically. Pause, modify frequency, or cancel anytime with zero lock-in.
          </p>
        </div>

        <Button size="sm" variant="primary" onClick={() => setShowAddModal(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          <span>New Subscription</span>
        </Button>
      </div>

      {actionNotice && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {subscriptions.length === 0 ? (
        <Card className="neu-card p-12 text-center rounded-3xl space-y-4 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl neu-inset mx-auto flex items-center justify-center text-muted-foreground">
            <Repeat className="w-8 h-8 text-purple-400/50" />
          </div>
          <h3 className="text-base font-bold text-foreground">No recurring orders active</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Subscribe to your favorite daily rotation and save 10% on every replenishment delivery with automated free doorstep shipping.
          </p>
          <Button size="sm" variant="primary" onClick={() => setShowAddModal(true)}>
            Schedule First Delivery
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {subscriptions.map((sub) => {
            const fDef = VYRA_FLAVORS.find((f) => f.id === sub.product_id || f.name === sub.product_name);
            const borderCol = fDef?.accentColor || "var(--primary)";
            return (
              <Card
                key={sub.id}
                className="neu-card p-6 rounded-3xl space-y-4 border-l-4"
                style={{ borderLeftColor: borderCol }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <h3 className="text-base font-bold text-foreground">
                        {sub.product_name}
                      </h3>
                      <Badge
                        variant={
                          sub.status === "active"
                            ? "success"
                            : sub.status === "paused"
                            ? "warning"
                            : "danger"
                        }
                      >
                        {sub.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {sub.flavor} • Pack of {sub.quantity} cans • Frequency:{" "}
                      <span className="font-semibold text-foreground capitalize">{sub.frequency}</span>
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-lg font-black text-foreground">
                      ₹{sub.price_per_delivery}
                    </span>
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400 block font-semibold">
                      10% Subscription Savings Applied
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl neu-inset flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span>
                      Next Scheduled Dispatch:{" "}
                      <strong className="text-foreground font-mono">
                        {new Date(sub.next_delivery_date).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Truck className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                    <span>Free Express Delivery Included</span>
                  </div>
                </div>

                {/* Action Controls */}
                <div className="pt-2 flex flex-wrap items-center justify-end gap-2">
                  {sub.status === "active" && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleStatusChange(sub.id, "paused")}
                      className="gap-1.5 text-xs text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300"
                    >
                      <Pause className="w-3.5 h-3.5" />
                      <span>Pause</span>
                    </Button>
                  )}
                  {sub.status === "paused" && (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleStatusChange(sub.id, "active")}
                      className="gap-1.5 text-xs"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Resume</span>
                    </Button>
                  )}
                  {sub.status !== "cancelled" && (
                    <button
                      type="button"
                      onClick={() => handleStatusChange(sub.id, "cancelled")}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-500 hover:bg-rose-500/10 neu-raised-sm transition-all flex items-center gap-1.5"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Cancel</span>
                    </button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ─── Add Subscription Modal ────────────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl neu-card p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-border/40 pb-4">
              <h3 className="text-lg font-bold text-foreground">Schedule Recurring Order</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSub} className="space-y-4">
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-foreground">Select Flavor</label>
                <select
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl neu-inset bg-surface text-foreground text-xs focus:outline-none"
                >
                  {VYRA_FLAVORS.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.flavor}) - ₹{f.priceInr}/can
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-foreground">Quantity (Cans per Crate)</label>
                <div className="grid grid-cols-3 gap-2">
                  {[4, 8, 12].map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setQuantity(q)}
                      className={`py-2 rounded-xl text-xs font-bold transition-all ${
                        quantity === q
                          ? "neu-btn-primary text-black"
                          : "neu-btn text-muted-foreground"
                      }`}
                    >
                      {q} Cans
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-foreground">Frequency</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["weekly", "biweekly", "monthly"] as const).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFrequency(f)}
                      className={`py-2 rounded-xl text-xs font-bold capitalize transition-all ${
                        frequency === f
                          ? "neu-btn-primary text-black"
                          : "neu-btn text-muted-foreground"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3.5 rounded-xl neu-inset text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Standard Crate:</span>
                  <span className="line-through text-muted-foreground">₹{149 * quantity}</span>
                </div>
                <div className="flex justify-between font-bold text-primary">
                  <span>Subscriber Price (10% OFF):</span>
                  <span>₹{((149 * quantity) * 0.9).toFixed(1)}</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <Button size="sm" variant="secondary" type="button" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button size="sm" variant="primary" type="submit">
                  Confirm Subscription
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

