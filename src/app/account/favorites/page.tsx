"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Heart,
  ShoppingBag,
  Trash2,
  Plus,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useCart } from "@/components/cart/CartProvider";
import {
  fetchCustomerFavorites,
  toggleCustomerFavoriteDb,
} from "@/lib/customer/data";
import { VYRA_FLAVORS, ProductDefinition } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function FavoritesPage() {
  const { user, profile } = useAuth();
  const { addItem } = useCart();
  const customerId = profile?.customer_id || user?.id || "CUST-0001";

  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [addedItem, setAddedItem] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchCustomerFavorites(customerId).then((favs) => {
      if (active) setFavoriteIds(favs);
    });
    return () => {
      active = false;
    };
  }, [customerId]);

  const handleToggle = async (id: string) => {
    const updated = await toggleCustomerFavoriteDb(customerId, id);
    setFavoriteIds(updated);
  };

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

  const favoriteProducts = VYRA_FLAVORS.filter((p) => favoriteIds.includes(p.id));

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/40 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-xs font-semibold text-rose-400 mb-2">
            <Heart className="w-3.5 h-3.5 fill-rose-500/30" />
            <span>Saved Cans & Blends</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            My Favorites
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Fast access to your preferred energy drinks. Easily reorder in single cans or crate packs.
          </p>
        </div>

        <Link href="/shop">
          <Button size="sm" variant="secondary" className="gap-2">
            <ShoppingBag className="w-4 h-4" />
            <span>Explore All Flavors</span>
          </Button>
        </Link>
      </div>

      {favoriteProducts.length === 0 ? (
        <Card className="neu-card p-12 text-center rounded-3xl space-y-4 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl neu-inset mx-auto flex items-center justify-center text-muted-foreground">
            <Heart className="w-8 h-8 text-rose-500/40" />
          </div>
          <h3 className="text-base font-bold text-foreground">No favorites saved yet</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Browse our 8 functional flavors and click the heart icon on any can to save it to your personalized collection.
          </p>
          <Link href="/shop" className="inline-block pt-2">
            <Button size="sm" variant="primary" className="gap-2">
              <span>Browse Catalog</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {favoriteProducts.map((p) => {
            const isAdded = addedItem === p.id;
            return (
              <Card
                key={p.id}
                className="group relative rounded-3xl neu-card p-5 flex flex-col justify-between overflow-hidden transition-all duration-300 hover:scale-[1.01] flavor-card-hover"
              >
                <div
                  className="absolute top-0 left-0 right-0 h-1"
                  style={{ backgroundColor: p.accentColor }}
                />

                <div className="space-y-4">
                  {/* Visual Image & Remove Favorite Button */}
                  <div
                    className="relative w-full h-48 rounded-2xl flex items-center justify-center neu-inset p-3 overflow-hidden group-hover:scale-105 transition-transform duration-300"
                    style={{
                      background: `radial-gradient(circle, ${p.accentColor}18 0%, transparent 75%)`,
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => handleToggle(p.id)}
                      className="absolute top-2 right-2 p-2 rounded-xl neu-btn text-rose-500 hover:text-rose-400 z-10 transition-colors"
                      title="Remove from favorites"
                      aria-label="Remove from favorites"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <Image
                      src={p.imagePath}
                      alt={p.name}
                      width={160}
                      height={200}
                      className="object-contain h-full w-auto drop-shadow-[0_12px_24px_rgba(0,0,0,0.25)] dark:drop-shadow-[0_12px_24px_rgba(0,0,0,0.5)]"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <Badge variant="success" className="text-[10px]">
                        In Stock
                      </Badge>
                      <span className="text-[11px] font-mono text-primary font-semibold">
                        {p.caffeineMg}mg
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-foreground mt-2 group-hover:text-primary transition-colors">
                      {p.name.replace("Vyra Pulse ", "")}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                      {p.description}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-border/40 flex items-center justify-between mt-4">
                  <div>
                    <span className="text-lg font-black text-foreground">₹{p.priceInr}</span>
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
                        <span>Add to Cart</span>
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

