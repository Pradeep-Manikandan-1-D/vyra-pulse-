"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Search,
  ShoppingBag,
  Zap,
  Check,
  Sparkles,
  Heart,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { VYRA_FLAVORS, ProductDefinition } from "@/lib/constants";
import { useCart } from "@/components/cart/CartProvider";
import { useAuth } from "@/components/auth/AuthProvider";
import { getCustomerFavorites, toggleCustomerFavorite } from "@/lib/customer/data";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

export default function ShopPage() {
  const { user, profile } = useAuth();
  const customerId = (profile as any)?.customer_id || (user as any)?.customer_id || user?.id || "";
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFlavor, setSelectedFlavor] = useState<string>("all");
  const [addedAnimation, setAddedAnimation] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const { items, addItem, totalItems, subtotal } = useCart();

  useEffect(() => {
    if (customerId) {
      setFavorites(getCustomerFavorites(customerId));
    }
  }, [customerId]);

  const handleToggleFavorite = (productId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!customerId) return;
    const updated = toggleCustomerFavorite(customerId, productId);
    setFavorites(updated);
  };

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
      image_path: product.imagePath ?? null,
      accentColor: product.accentColor,
    });
    setAddedAnimation(product.id);
    setTimeout(() => setAddedAnimation(null), 1500);
  };

  const getQty = (id: string) => items.find((i) => i.product_id === id)?.quantity ?? 0;

  return (
    <div className="min-h-screen py-10 md:py-16 bg-background text-foreground transition-colors mint-mesh-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Store Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-border pb-8">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-primary/30 bg-primary/10 text-xs font-semibold text-primary shadow-sm">
              <Zap className="w-3.5 h-3.5 text-primary" />
              <span>Bio-Enhanced Functional Energy • ₹149 per Can</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Vyra Pulse Beverage Catalog
            </h1>
            <p className="text-sm text-muted-foreground">
              Select your precision-formulated craft flavors. Free shipping on orders of 3 or more cans (₹447+).
            </p>
          </div>

          {/* Quick Cart Status Bar */}
          <div className="flex items-center gap-4 neu-raised rounded-2xl p-3 px-5 transition-all shadow-sm">
            <div className="text-right">
              <p className="text-xs text-muted-foreground font-medium">Active Cart</p>
              <p className="text-sm font-bold text-foreground font-mono">
                {totalItems} {totalItems === 1 ? "Can" : "Cans"} • ₹{subtotal.toFixed(2)}
              </p>
            </div>
            <Link href="/cart">
              <Button size="sm" variant="primary" className="gap-2">
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
              placeholder="Search by flavor, extract, or ingredients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl neu-inset text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-all bg-transparent"
            />
          </div>

          {/* Category Filter Chips with Distinctive Pastel Accents */}
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
                className={cn(
                  "text-xs px-4 py-2 rounded-xl font-semibold whitespace-nowrap transition-all",
                  selectedFlavor === f.id
                    ? "neu-btn-primary shadow-sm"
                    : "neu-btn text-muted-foreground hover:text-foreground"
                )}
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
            const isFavorite = favorites.includes(p.id);

            return (
              <Card
                key={p.id}
                id={p.id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-3xl neu-card flavor-card-hover border border-border"
              >
                {/* Flavor accent bar */}
                <div
                  className="h-1.5 w-full shrink-0"
                  style={{ backgroundColor: p.accentColor }}
                />

                {/* Favorite Button (top-right overlay) */}
                {customerId && (
                  <button
                    type="button"
                    onClick={(e) => handleToggleFavorite(p.id, e)}
                    aria-label={isFavorite ? `Remove ${p.name} from favorites` : `Add ${p.name} to favorites`}
                    className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full neu-raised-sm flex items-center justify-center transition-transform hover:scale-110 shadow-sm"
                  >
                    <Heart
                      className={cn(
                        "w-4 h-4 transition-colors",
                        isFavorite ? "fill-rose-500 text-rose-500" : "text-muted-foreground hover:text-foreground"
                      )}
                    />
                  </button>
                )}

                {/* Product can image in soft inset frame with flavor radial pastel glow */}
                {p.imagePath && (
                  <div
                    className="flex items-center justify-center h-44 w-full neu-inset px-4 py-3 overflow-hidden"
                    style={{
                      background: `radial-gradient(circle, ${p.accentColor}18 0%, transparent 75%)`,
                    }}
                  >
                    <Image
                      src={p.imagePath}
                      alt={p.name}
                      width={120}
                      height={150}
                      className="object-contain h-full w-auto drop-shadow-md group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}

                <div className="p-5 space-y-3.5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full neu-raised-sm"
                        style={{
                          backgroundColor: `${p.accentColor}20`,
                          color: p.accentColor === "#CCFF00" ? "#3A6808" : p.accentColor,
                          borderColor: `${p.accentColor}40`,
                        }}
                      >
                        {p.flavor}
                      </span>
                      <span className="text-[11px] font-mono text-muted-foreground font-semibold">
                        {p.volumeMl}ml • {p.caffeineMg}mg
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                      {p.name.replace("Vyra Pulse ", "")}
                    </h3>
                    <p className="text-xs font-semibold text-primary mt-0.5">
                      {p.tagline}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                      {p.description}
                    </p>
                  </div>

                  {/* Key Ingredients Pill */}
                  <div className="text-[11px] text-muted-foreground neu-inset rounded-xl p-3 space-y-1">
                    <p className="font-semibold text-foreground flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-primary" /> Key Ingredients:
                    </p>
                    <p className="text-[10px] leading-tight line-clamp-2">
                      {p.keyIngredients}
                    </p>
                  </div>

                  {/* Stock Status */}
                  <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>In Stock • Ready to dispatch</span>
                  </div>

                  {/* Card Action & Price */}
                  <div className="pt-3 border-t border-border flex items-center justify-between mt-auto">
                    <div>
                      <span className="text-xl font-extrabold text-foreground font-mono">
                        ₹{p.priceInr}
                      </span>
                      <span className="text-[10px] text-muted-foreground block">
                        Taxes included
                      </span>
                    </div>

                    <Button
                      onClick={() => handleAddToCart(p)}
                      size="sm"
                      className="gap-1.5 transition-all"
                    >
                      {isJustAdded ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Added</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>{qty > 0 ? `Add (${qty})` : "Add to Cart"}</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Free Shipping Callout */}
        <div className="rounded-3xl border border-primary/25 bg-primary/5 neu-card p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/15 flex items-center justify-center text-primary shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-foreground">Free Express Shipping</h4>
              <p className="text-xs text-muted-foreground">
                Orders with 3 or more cans (₹445+) qualify for free delivery across Bengaluru, Chennai, Mumbai, Delhi, and all service cities.
              </p>
            </div>
          </div>
          <Link href="/cart">
            <Button size="sm" variant="secondary" className="whitespace-nowrap">
              Review Cart &amp; Checkout <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
