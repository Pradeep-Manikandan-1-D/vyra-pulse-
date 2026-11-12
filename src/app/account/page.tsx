"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ShoppingBag,
  Package,
  Coins,
  Repeat,
  Heart,
  Clock,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Tag,
  Plus,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useCart } from "@/components/cart/CartProvider";
import {
  getCustomerOrders,
  getCustomerWallet,
  getCustomerProfile,
  getCustomerFavorites,
  getCustomerSubscriptions,
  CustomerOrder,
} from "@/lib/customer/data";
import { VYRA_FLAVORS, ProductDefinition } from "@/lib/constants";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export default function CustomerDashboardPage() {
  const { user, profile } = useAuth();
  const { addItem } = useCart();
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [copiedCoupon, setCopiedCoupon] = useState<string | null>(null);
  const [addedItem, setAddedItem] = useState<string | null>(null);

  const customerId = profile?.customer_id || user?.id || "CUST-0001";
  const customerProfile = getCustomerProfile(customerId);
  const wallet = getCustomerWallet(customerId);
  const subscriptions = getCustomerSubscriptions(customerId);

  useEffect(() => {
    const custOrders = getCustomerOrders(customerId);
    setOrders(custOrders);
    const favs = getCustomerFavorites(customerId);
    setFavorites(favs);
  }, [customerId]);

  // Derived metrics
  const totalOrdersCount = orders.length;
  const totalSpent = orders
    .filter((o) => o.payment_status === "paid")
    .reduce((sum, o) => sum + (o.total_amount || 0), 0);
  const activeSubsCount = subscriptions.filter((s) => s.status === "active").length;
  const favoritesCount = favorites.length;
  const latestOrder = orders.length > 0 ? orders[0] : null;

  // Next reward tier threshold calculation
  const nextTierPoints = 500;
  const tierProgress = Math.min(100, Math.round((wallet.balance / nextTierPoints) * 100));

  const handleAddToCart = (product: ProductDefinition) => {
    addItem({
      product_id: product.id,
      name: product.name,
      flavor: product.flavor,
      price: product.priceInr,
      quantity: 1,
      image_path: product.imagePath,
      accentColor: product.accentColor,
    });
    setAddedItem(product.id);
    setTimeout(() => setAddedItem(null), 1500);
  };

  const copyCoupon = (code: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopiedCoupon(code);
      setTimeout(() => setCopiedCoupon(null), 2000);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* ─── Hero Welcome Banner ──────────────────────────────────────────────── */}
      <div className="rounded-3xl neu-card p-6 sm:p-8 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-l-4 border-primary bg-gradient-to-r from-emerald-500/[0.08] via-sky-500/[0.04] to-transparent dark:from-transparent dark:via-transparent shadow-sm">
        <div className="space-y-2 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-xs font-bold text-primary shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Active Performance Member • {customerProfile.city}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Welcome back,{" "}
            <span className="text-primary">
              {customerProfile.fullName || "Vyra Athlete"}
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-xl leading-relaxed">
            Your bio-enhanced hydration status is synced. Fuel your cognitive focus and physical stamina with your personalized rotation.
          </p>
        </div>

        {/* Quick Top Actions */}
        <div className="flex flex-wrap items-center gap-3 z-10 shrink-0">
          <Link href="/shop">
            <Button size="sm" variant="primary" className="gap-2 shadow-sm">
              <ShoppingBag className="w-4 h-4" />
              <span>Shop All Flavors</span>
            </Button>
          </Link>
          <Link href="/account/orders">
            <Button size="sm" variant="secondary" className="gap-2">
              <Package className="w-4 h-4" />
              <span>My Orders</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* ─── 6 Customer KPI Cards (Soft-Tinted in Mint Fresh) ───────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* KPI 1: Total Orders */}
        <Card className="neu-card kpi-tint-sky p-4 rounded-2xl flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Total Orders
            </span>
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-500 dark:text-sky-400 neu-inset">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-foreground">{totalOrdersCount}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Verified deliveries</p>
          </div>
        </Card>

        {/* KPI 2: Total Spent */}
        <Card className="neu-card kpi-tint-mint p-4 rounded-2xl flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Total Spent
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 neu-inset">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-foreground">₹{totalSpent.toFixed(0)}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Lifetime investment</p>
          </div>
        </Card>

        {/* KPI 3: Reward Points */}
        <Card className="neu-card kpi-tint-amber p-4 rounded-2xl flex flex-col justify-between space-y-2 border-b-2 border-amber-400 dark:border-primary">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Rewards
            </span>
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-600 dark:text-primary neu-inset">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-amber-600 dark:text-primary">{wallet.balance}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Active pulse points</p>
          </div>
        </Card>

        {/* KPI 4: Active Subscriptions */}
        <Card className="neu-card kpi-tint-purple p-4 rounded-2xl flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Subscriptions
            </span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500 dark:text-purple-400 neu-inset">
              <Repeat className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-foreground">{activeSubsCount}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Auto-refill schedules</p>
          </div>
        </Card>

        {/* KPI 5: Favorite Flavors */}
        <Card className="neu-card kpi-tint-rose p-4 rounded-2xl flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Favorites
            </span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500 dark:text-rose-400 neu-inset">
              <Heart className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-foreground">{favoritesCount}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Saved drink recipes</p>
          </div>
        </Card>

        {/* KPI 6: Latest Order */}
        <Card className="neu-card kpi-tint-peach p-4 rounded-2xl flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Recent Order
            </span>
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500 dark:text-amber-400 neu-inset">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-sm font-black text-foreground truncate">
              {latestOrder ? latestOrder.order_code : "None yet"}
            </p>
            <div className="mt-1">
              {latestOrder ? (
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  {latestOrder.order_status}
                </span>
              ) : (
                <span className="text-[10px] text-muted-foreground">Ready to order</span>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* ─── Middle Section: Recent Orders & Loyalty Progress ────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Order Activity */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              <span>Recent Activity & Orders</span>
            </h2>
            <Link
              href="/account/orders"
              className="text-xs text-primary hover:underline flex items-center gap-1 font-semibold"
            >
              <span>View All ({orders.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {orders.length === 0 ? (
            <div className="rounded-3xl neu-card p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl neu-inset mx-auto flex items-center justify-center text-muted-foreground">
                <Package className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-foreground">No orders placed yet</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Explore our 8 signature flavors and enjoy free delivery on your first bundle of 3+ cans.
              </p>
              <Link href="/shop" className="inline-block pt-2">
                <Button size="sm" variant="primary">Start Your First Order</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.slice(0, 3).map((o) => (
                <div
                  key={o.id}
                  className="rounded-2xl neu-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:scale-[1.005]"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black text-foreground">
                        {o.order_code}
                      </span>
                      <Badge
                        variant={
                          o.order_status === "delivered"
                            ? "success"
                            : o.order_status === "cancelled"
                            ? "danger"
                            : "warning"
                        }
                      >
                        {o.order_status}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground">
                        {new Date(o.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Destination: {o.delivery_city || customerProfile.city || "Tamil Nadu"} • Delivery fee: ₹{o.delivery_fee}
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-black text-foreground">₹{o.total_amount}</p>
                      <p className="text-[10px] text-emerald-400 font-semibold uppercase">
                        {o.payment_status}
                      </p>
                    </div>
                    <Link href="/account/orders">
                      <button
                        type="button"
                        className="px-3 py-1.5 rounded-xl neu-btn text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1"
                      >
                        Details
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right 1 Col: Loyalty Points & Next Tier Card */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Coins className="w-5 h-5 text-primary" />
            <span>Loyalty Tier Status</span>
          </h2>

          <div className="rounded-3xl neu-card p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Current Balance</p>
                <p className="text-3xl font-black text-primary font-mono">{wallet.balance} <span className="text-xs text-muted-foreground font-normal">PTS</span></p>
              </div>
              <div className="w-12 h-12 rounded-2xl neu-inset flex items-center justify-center text-primary">
                <Sparkles className="w-6 h-6" />
              </div>
            </div>

            {/* Tier Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground">Next Tier: Gold</span>
                <span className="text-muted-foreground font-mono">{wallet.balance} / {nextTierPoints} pts</span>
              </div>
              <div className="h-2 w-full rounded-full neu-inset overflow-hidden p-0.5">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${tierProgress}%` }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground">
                Earn 10 points for every can ordered. Free merchandise unlocked at 400 pts.
              </p>
            </div>

            <div className="pt-2 border-t border-border">
              <Link href="/account/wallet">
                <Button size="sm" variant="secondary" className="w-full gap-2 text-xs">
                  <Coins className="w-3.5 h-3.5 text-primary" />
                  <span>Redeem Rewards & Perks</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* Active Promo Callout */}
          <div className="rounded-2xl border border-dashed border-primary/40 p-4 bg-primary/5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-primary" />
                10% Off Next Crate
              </span>
              <button
                type="button"
                onClick={() => copyCoupon("WELCOME10")}
                className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-surface text-primary border border-primary/30 hover:bg-primary/20 transition-all"
              >
                {copiedCoupon === "WELCOME10" ? "COPIED!" : "COPY: WELCOME10"}
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Apply code at checkout on orders of ₹500 or more.
            </p>
          </div>
        </div>
      </div>

      {/* ─── Bottom Section: Recommended Flavors Carousel ───────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <span>Recommended For You</span>
            </h2>
            <p className="text-xs text-muted-foreground">
              Formulated for rapid biological hydration, clean sustained caffeine, and zero crash.
            </p>
          </div>
          <Link
            href="/shop"
            className="text-xs text-primary hover:underline font-semibold flex items-center gap-1"
          >
            <span>Browse All 8</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {VYRA_FLAVORS.slice(0, 4).map((p) => {
            const isAdded = addedItem === p.id;
            return (
              <div
                key={p.id}
                className="group relative rounded-3xl neu-card p-5 flex flex-col justify-between overflow-hidden transition-all duration-300 hover:scale-[1.01]"
              >
                {/* Accent Top Line */}
                <div
                  className="absolute top-0 left-0 right-0 h-1"
                  style={{ backgroundColor: p.accentColor }}
                />

                <div className="space-y-3">
                  {/* Can Visual Asset */}
                  <div className="relative w-full h-44 rounded-2xl flex items-center justify-center neu-inset p-3 overflow-hidden group-hover:scale-105 transition-transform duration-300">
                    <Image
                      src={p.imagePath}
                      alt={p.name}
                      width={160}
                      height={200}
                      className="object-contain h-full w-auto drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        {p.flavor}
                      </span>
                      <span className="text-[10px] font-mono text-primary font-semibold">
                        {p.caffeineMg}mg Caffeine
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-foreground mt-0.5 group-hover:text-primary transition-colors">
                      {p.name.replace("Vyra Pulse ", "")}
                    </h3>
                    <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                      {p.description}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-border/40 flex items-center justify-between mt-3">
                  <div>
                    <span className="text-base font-black text-foreground">₹{p.priceInr}</span>
                    <span className="text-[10px] text-muted-foreground block">330ml can</span>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => handleAddToCart(p)}
                    className="gap-1.5 text-xs font-bold"
                  >
                    {isAdded ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Added</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

