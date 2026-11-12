"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Zap,
  ShoppingBag,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Copy,
  Check,
  Cpu,
  Droplets,
  Activity,
  Award,
} from "lucide-react";
import { BRAND_ASSETS, VYRA_FLAVORS, ProductDefinition } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/components/auth/AuthProvider";
import { useCart } from "@/components/cart/CartProvider";

export default function LandingPage() {
  const { user, isAdmin, isCustomer } = useAuth();
  const { addItem } = useCart();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [addedItem, setAddedItem] = useState<string | null>(null);

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
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors overflow-hidden">
      {/* ─── Hero Section ────────────────────────────────────────────── */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mint-mesh-bg">
        {/* Soft Ambient Pastel Glow Accents in Light Mode */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-gradient-to-tr from-emerald-400/20 via-sky-400/15 to-amber-300/15 blur-[120px] rounded-full pointer-events-none dark:opacity-10" />
        <div className="absolute top-1/3 -left-32 w-80 h-80 bg-gradient-to-br from-teal-300/20 to-sky-400/15 blur-[100px] rounded-full pointer-events-none dark:opacity-10" />
        <div className="absolute top-1/2 -right-32 w-80 h-80 bg-gradient-to-bl from-rose-300/20 via-orange-300/15 to-amber-200/20 blur-[100px] rounded-full pointer-events-none dark:opacity-10" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center relative z-10">
          {/* Left Column: Brand Typography & Call to Action */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full neu-inset text-xs font-semibold text-primary border border-primary/25 bg-white/70 dark:bg-surface-inset backdrop-blur-sm shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
              <span>Bio-Enhanced Energy • Zero Sugar Crash</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1]">
              Pure Energy.{" "}
              <span className="text-primary block mt-1">Refined Focus.</span>
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
              Precision-crafted functional energy beverages infused with L-Theanine, Green Tea Extract, Korean Panax Ginseng, and essential cellular electrolytes.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
              <Link href="/shop">
                <Button size="lg" className="gap-2 shadow-md hover:shadow-lg transition-shadow">
                  <ShoppingBag className="w-4 h-4" />
                  <span>Shop All 8 Flavors</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>

              <a href="#flavors">
                <Button variant="secondary" size="lg" className="gap-2">
                  <span>Explore Catalog</span>
                  <span className="text-primary font-bold">↓</span>
                </Button>
              </a>

              {user && (
                <Link href={isAdmin ? "/admin" : "/account"}>
                  <Button variant="outline" size="lg" className="gap-2 border-primary/40">
                    <Zap className="w-4 h-4 text-primary" />
                    <span>Go to {isAdmin ? "Admin Portal" : "My Account"}</span>
                  </Button>
                </Link>
              )}
            </div>

            {/* Micro Feature Badges with Soft Pastel Accents */}
            <div className="pt-6 grid grid-cols-3 gap-3 sm:gap-4 max-w-lg mx-auto lg:mx-0 text-left">
              <div className="p-3 sm:p-3.5 rounded-2xl neu-inset bg-sky-500/[0.04] dark:bg-surface-inset border border-sky-500/20 dark:border-border transition-all">
                <p className="text-lg sm:text-xl font-extrabold text-foreground font-mono">80 mg</p>
                <p className="text-xs text-muted-foreground">Natural Caffeine</p>
              </div>
              <div className="p-3 sm:p-3.5 rounded-2xl neu-inset bg-amber-500/[0.04] dark:bg-surface-inset border border-amber-500/20 dark:border-border transition-all">
                <p className="text-lg sm:text-xl font-extrabold text-foreground font-mono">₹149</p>
                <p className="text-xs text-muted-foreground">Per 330ml Can</p>
              </div>
              <div className="p-3 sm:p-3.5 rounded-2xl neu-inset bg-emerald-500/[0.05] dark:bg-surface-inset border border-emerald-500/20 dark:border-border transition-all">
                <p className="text-lg sm:text-xl font-extrabold text-primary font-mono">0g Added</p>
                <p className="text-xs text-muted-foreground">Refined Sugars</p>
              </div>
            </div>
          </div>

          {/* Right Column: Beverage Product Photography */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            <div className="relative w-full max-w-lg lg:max-w-none aspect-[3/2] rounded-3xl neu-card p-2 sm:p-4 flex items-center justify-center overflow-hidden border border-border group bg-gradient-to-tr from-emerald-500/[0.08] via-sky-500/[0.04] to-amber-500/[0.06] dark:from-primary/5 dark:via-transparent dark:to-primary/10 shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-sky-400/10 pointer-events-none opacity-80" />

              <div className="relative w-full h-full flex items-center justify-center">
                <Image
                  src="/assets/branding/all-8-flavors-hero.jpg"
                  alt="All 8 Vyra Pulse Signature Functional Flavors"
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 40vw"
                  className="object-contain drop-shadow-xl group-hover:scale-105 transition-transform duration-500"
                  priority
                />
              </div>

              {/* Float pill with soft glass effect */}
              <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 px-3.5 py-2 rounded-2xl neu-raised bg-surface/90 backdrop-blur-md border border-border flex items-center gap-2.5 shadow-md">
                <div className="w-7 h-7 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
                  <Zap className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">8 Signature Flavors</p>
                  <p className="text-[10px] text-muted-foreground">Crafted for athletes &amp; creators</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Featured Flavors Catalog Section ────────────────────────── */}
      <section id="flavors" className="py-16 md:py-24 bg-surface-secondary/60 border-y border-border transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-6">
            <div className="space-y-1.5">
              <span className="text-xs font-mono uppercase tracking-widest text-primary font-bold">
                Crafted Beverage Portfolio
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                8 Signature Craft Flavors
              </h2>
              <p className="text-sm text-muted-foreground max-w-xl">
                Every flavor is formulated with specific botanical extracts, bio-active vitamins, and genuine fruit infusions.
              </p>
            </div>
            <Link href="/shop">
              <Button variant="outline" size="sm" className="gap-2">
                <span>View Full Store Catalog</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {VYRA_FLAVORS.map((product) => {
              const isJustAdded = addedItem === product.id;

              return (
                <Card
                  key={product.id}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-3xl neu-card flavor-card-hover"
                >
                  {/* Accent Top Bar */}
                  <div
                    className="h-1.5 w-full shrink-0"
                    style={{ backgroundColor: product.accentColor }}
                  />

                  {/* Can Illustration Container with flavor-matched radial pastel glow */}
                  <div
                    className="relative h-44 w-full neu-inset flex items-center justify-center p-4 overflow-hidden"
                    style={{
                      background: `radial-gradient(circle, ${product.accentColor}18 0%, transparent 75%)`,
                    }}
                  >
                    <Image
                      src={product.imagePath}
                      alt={product.name}
                      width={120}
                      height={150}
                      className="object-contain h-full w-auto drop-shadow-md group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full neu-raised-sm"
                          style={{
                            backgroundColor: `${product.accentColor}20`,
                            color: product.accentColor === "#CCFF00" ? "#3A6808" : product.accentColor,
                            borderColor: `${product.accentColor}40`,
                          }}
                        >
                          {product.flavor}
                        </span>
                        <span className="text-[11px] font-mono font-semibold text-muted-foreground">
                          {product.volumeMl}ml • {product.caffeineMg}mg
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                        {product.name.replace("Vyra Pulse ", "")}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                        {product.description}
                      </p>
                    </div>

                    {/* Ingredients summary */}
                    <div className="neu-inset rounded-xl p-2.5 text-[10px] text-muted-foreground">
                      <span className="font-semibold text-foreground">Active Extracts: </span>
                      <span className="line-clamp-1">{product.keyIngredients}</span>
                    </div>

                    {/* Price and Cart Action */}
                    <div className="pt-2 border-t border-border flex items-center justify-between">
                      <div>
                        <span className="text-lg font-extrabold text-foreground font-mono">
                          ₹{product.priceInr}
                        </span>
                        <span className="text-[10px] text-muted-foreground block">
                          Taxes included
                        </span>
                      </div>

                      <Button
                        onClick={() => handleAddToCart(product)}
                        size="sm"
                        className="gap-1.5"
                      >
                        {isJustAdded ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Added</span>
                          </>
                        ) : (
                          <>
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>Add</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Bio-Enhanced Benefits Section ──────────────────────────── */}
      <section id="benefits" className="py-16 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-mono uppercase tracking-widest text-primary font-bold">
              Functional Formulation
            </span>
            <h2 className="text-3xl font-extrabold text-foreground tracking-tight">
              Science-Backed Energy Architecture
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Engineered with clean botanicals and zero synthetic fillers to support high-performance output throughout the day.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="neu-card rounded-3xl p-6 space-y-3 border-t-2 border-t-sky-400/50 hover:translate-y-[-2px] transition-all">
              <div className="w-12 h-12 rounded-2xl neu-inset bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/25 flex items-center justify-center">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-foreground">Cognitive Flow State</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Synergistic L-Theanine and green tea extract provide calm, razor-sharp focus without anxiety or heart racing.
              </p>
            </Card>

            <Card className="neu-card rounded-3xl p-6 space-y-3 border-t-2 border-t-emerald-400/50 hover:translate-y-[-2px] transition-all">
              <div className="w-12 h-12 rounded-2xl neu-inset bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 flex items-center justify-center">
                <Droplets className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-foreground">Cellular Hydration</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Bio-available sodium, potassium, and magnesium electrolytes maintain optimal intracellular osmolarity.
              </p>
            </Card>

            <Card className="neu-card rounded-3xl p-6 space-y-3 border-t-2 border-t-rose-400/50 hover:translate-y-[-2px] transition-all">
              <div className="w-12 h-12 rounded-2xl neu-inset bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/25 flex items-center justify-center">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-foreground">Adaptogenic Stamina</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Pure Korean Panax Ginseng extract supports sustained cardiovascular endurance and reflex response.
              </p>
            </Card>

            <Card className="neu-card rounded-3xl p-6 space-y-3 border-t-2 border-t-amber-400/50 hover:translate-y-[-2px] transition-all">
              <div className="w-12 h-12 rounded-2xl neu-inset bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25 flex items-center justify-center">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-foreground">Clean ATP Metabolism</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Enriched with B-complex vitamins (B3, B6, B12) for natural mitochondrial energy conversion without sugar crashes.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* ─── Promotions & Coupon Codes ──────────────────────────────── */}
      <section className="py-12 bg-surface-secondary/70 dark:bg-surface-secondary/60 border-y border-border transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-primary font-bold">
                Limited Time Deals
              </span>
              <h3 className="text-xl font-bold text-foreground tracking-tight mt-1">
                Active Promotions &amp; Discounts
              </h3>
              <p className="text-xs text-muted-foreground">
                Apply coupon code during checkout to redeem instantly.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {[
                { code: "PULSE20", label: "20% OFF Everything", border: "border-purple-500/25 bg-purple-500/[0.04] text-purple-600 dark:text-primary hover:border-purple-500/50" },
                { code: "FIRSTPULSE", label: "15% OFF First Order", border: "border-orange-500/25 bg-orange-500/[0.04] text-orange-600 dark:text-primary hover:border-orange-500/50" },
                { code: "FREESHIP", label: "Free Shipping on ₹445+", border: "border-sky-500/25 bg-sky-500/[0.04] text-sky-600 dark:text-primary hover:border-sky-500/50" },
              ].map((promo) => (
                <button
                  key={promo.code}
                  type="button"
                  onClick={() => copyCoupon(promo.code)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl neu-card text-xs transition-all ${promo.border}`}
                  title="Click to copy coupon code"
                >
                  <span className="font-mono font-bold">{promo.code}</span>
                  <span className="text-muted-foreground font-medium">({promo.label})</span>
                  {copiedCode === promo.code ? (
                    <Check className="w-3.5 h-3.5 text-primary" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Portal Gateways (Customer & Admin Entry Points) ───────── */}
      <section className="py-16 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          <div className="text-center max-w-lg mx-auto space-y-2">
            <span className="text-xs font-mono uppercase tracking-widest text-primary font-bold">
              Access Gateways
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              Select Your Workspace
            </h2>
            <p className="text-xs text-muted-foreground">
              Sign in to manage your customer subscription or access administrator operations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Customer Storefront Portal */}
            <Link
              href="/customer/login"
              className="group flex flex-col justify-between p-8 rounded-3xl neu-card hover:translate-y-[-2px] hover:border-emerald-500/40 bg-gradient-to-br from-emerald-500/[0.04] via-transparent to-sky-500/[0.02] dark:from-transparent dark:via-transparent transition-all duration-300 text-left border border-border"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl neu-inset bg-emerald-500/10 text-emerald-600 dark:text-primary flex items-center justify-center border border-emerald-500/20 shadow-sm">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-600 dark:text-primary font-bold block mb-1">
                    Storefront &amp; Loyalty
                  </span>
                  <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                    Customer Account
                  </h3>
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                    Order history, live shipping tracking, recurring subscriptions, and Pulse Rewards wallet balance.
                  </p>
                </div>
              </div>
              <div className="pt-6 mt-6 border-t border-border flex items-center justify-between text-xs font-bold text-foreground">
                <span>Enter Customer Store</span>
                <span className="text-primary group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </Link>

            {/* Admin Management Gateway */}
            <Link
              href="/admin/login"
              className="group flex flex-col justify-between p-8 rounded-3xl neu-card hover:translate-y-[-2px] hover:border-purple-500/40 bg-gradient-to-br from-purple-500/[0.04] via-transparent to-amber-500/[0.02] dark:from-transparent dark:via-transparent transition-all duration-300 text-left border border-border"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl neu-inset bg-purple-500/10 text-purple-600 dark:text-muted-foreground group-hover:text-primary flex items-center justify-center border border-purple-500/20 shadow-sm transition-colors">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-purple-600 dark:text-muted-foreground font-bold block mb-1">
                    Operations Gateway
                  </span>
                  <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                    Admin Operations Portal
                  </h3>
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                    Business Intelligence suite, real-time inventory management, order fulfillment, and analytics.
                  </p>
                </div>
              </div>
              <div className="pt-6 mt-6 border-t border-border flex items-center justify-between text-xs font-bold text-foreground">
                <span>Access Command Center</span>
                <span className="text-primary group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
