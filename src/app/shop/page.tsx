"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Search,
  ShoppingBag,
  Zap,
  Check,
  Sparkles,
  Info,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { VYRA_FLAVORS, ProductDefinition } from "@/lib/constants";
import { useCart } from "@/components/cart/CartProvider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function ShopPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFlavor, setSelectedFlavor] = useState<string>("all");
  const [addedAnimation, setAddedAnimation] = useState<string | null>(null);
  const { items, addItem, totalItems, subtotal } = useCart();

  const filteredProducts = VYRA_FLAVORS.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.flavor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.keyIngredients.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = selectedFlavor === "all" || p.flavor.toLowerCase().includes(selectedFlavor.toLowerCase());
    return matchesSearch && matchesFilter;
  });

  const handleAddToCart = (product: ProductDefinition) => {
    addItem({
      product_id: product.id,
      name: product.name,
      flavor: product.flavor,
      price: product.priceInr,
      quantity: 1,
      image_path: null,
      accentColor: product.accentColor,
    });
    setAddedAnimation(product.id);
    setTimeout(() => setAddedAnimation(null), 1500);
  };

  // Per-product quantity from real cart
  const getQty = (id: string) => items.find((i) => i.product_id === id)?.quantity ?? 0;

  return (
    <div className="min-h-screen py-10 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Store Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-border/40 pb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full border border-[#00FF66]/30 bg-[#00FF66]/10 text-xs font-semibold text-[#00FF66] mb-2">
              <Zap className="w-3 h-3" />
              <span>Direct From Warehouse • ₹149 per Can</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Vyra Pulse Store
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Select your bio-enhanced flavors. Free delivery on orders above ₹445 (3+ cans).
            </p>
          </div>

          {/* Quick Cart Status Bar */}
          <div className="flex items-center gap-4 bg-surface/80 border border-white/10 rounded-2xl p-3 px-5 shadow-sm">
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Active Cart</p>
              <p className="text-sm font-bold text-foreground">
                {totalItems} {totalItems === 1 ? "Can" : "Cans"} • ₹{subtotal.toFixed(2)}
              </p>
            </div>
            <Link href="/cart">
              <Button size="sm" className="gap-2">
                <ShoppingBag className="w-4 h-4" />
                Checkout
              </Button>
            </Link>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by flavor, ingredient, or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-white/10 bg-surface/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#00FF66]/40 focus:border-[#00FF66]/60 transition-all"
            />
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {[
              { id: "all", label: "All 8 Flavors" },
              { id: "citrus", label: "Citrus" },
              { id: "berry", label: "Berry" },
              { id: "mango", label: "Mango" },
              { id: "mint", label: "Mint" },
              { id: "guava", label: "Guava" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedFlavor(f.id)}
                type="button"
                className={`text-xs px-3.5 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all ${
                  selectedFlavor === f.id
                    ? "bg-[#00FF66] text-black font-semibold shadow-neon-glow-sm"
                    : "bg-surface/60 border border-white/10 text-muted-foreground hover:text-foreground"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProducts.map((p) => {
            const qty = getQty(p.id);
            const isJustAdded = addedAnimation === p.id;

            return (
              <Card
                key={p.id}
                id={p.id}
                className="group relative flex flex-col justify-between overflow-hidden border-white/10 hover:border-[#00FF66]/50 transition-all duration-300"
              >
                {/* Flavor accent bar */}
                <div
                  className="h-1.5 w-full"
                  style={{ backgroundColor: p.accentColor }}
                />

                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${p.badgeClass}`}
                    >
                      {p.flavor}
                    </span>
                    <span className="text-xs font-mono text-muted-foreground">
                      {p.volumeMl}ml • {p.caffeineMg}mg
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-foreground group-hover:text-[#00FF66] transition-colors">
                      {p.name.replace("Vyra Pulse ", "")}
                    </h3>
                    <p className="text-xs font-semibold text-[#00FF66] mt-0.5">
                      {p.tagline}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-3 leading-relaxed">
                      {p.description}
                    </p>
                  </div>

                  {/* Key Ingredients Pill */}
                  <div className="text-[11px] text-muted-foreground bg-white/5 rounded-lg p-2.5 space-y-1">
                    <p className="font-semibold text-foreground/80 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-[#00FF66]" /> Key Ingredients:
                    </p>
                    <p className="text-[10px] leading-tight">
                      {p.keyIngredients}
                    </p>
                  </div>
                </div>

                {/* Card Action & Price */}
                <div className="p-6 pt-0 border-t border-white/5 flex items-center justify-between mt-auto">
                  <div>
                    <span className="text-xl font-extrabold text-foreground">
                      ₹{p.priceInr}
                    </span>
                    <span className="text-[10px] text-muted-foreground block">
                      Incl. all taxes
                    </span>
                  </div>

                  <Button
                    onClick={() => handleAddToCart(p)}
                    size="sm"
                    className={`gap-1.5 transition-all ${
                      isJustAdded
                        ? "bg-white text-black border-transparent"
                        : ""
                    }`}
                  >
                    {isJustAdded ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-600" />
                        Added
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-3.5 h-3.5" />
                        {qty > 0 ? `Add More (${qty})` : "Add to Cart"}
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Free Shipping Callout */}
        <div className="rounded-2xl border border-[#00FF66]/30 bg-[#00FF66]/5 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#00FF66]/20 flex items-center justify-center text-[#00FF66]">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-foreground">Pulse Delivery Policy</h4>
              <p className="text-xs text-muted-foreground">
                Orders with 3 or more cans (₹447+) automatically qualify for free standard delivery across all 10 service cities.
              </p>
            </div>
          </div>
          <Link href="/cart">
            <Button size="sm" variant="secondary" className="whitespace-nowrap">
              Review Cart & Checkout <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
