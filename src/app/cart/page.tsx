"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  Tag,
  Truck,
  Zap,
} from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { VYRA_FLAVORS, STORE_POLICIES } from "@/lib/constants";

export default function CartPage() {
  const { items, totalItems, subtotal, deliveryFee, total, removeItem, updateQuantity, clearCart } =
    useCart();
  const { user } = useAuth();
  const router = useRouter();

  // Get accent color for a product from local constants
  const getAccent = (productId: string) => {
    const flavor = VYRA_FLAVORS.find((f) => f.id === productId);
    return flavor?.accentColor ?? "#00FF66";
  };

  const freeShippingRemaining = Math.max(0, STORE_POLICIES.freeShippingThreshold - subtotal);

  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center space-y-6">
        {/* Background glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#00FF66]/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative w-24 h-24 rounded-full bg-surface border border-white/10 flex items-center justify-center">
          <ShoppingBag className="w-10 h-10 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
            Your cart is empty
          </h1>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Discover our 8 premium energy drink flavors and add your favorites to the cart.
          </p>
        </div>
        <Link href="/shop">
          <Button className="gap-2">
            <Zap className="w-4 h-4" />
            Browse All Flavors
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10 md:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 border-b border-border/40 pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Your Cart
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {totalItems} {totalItems === 1 ? "item" : "items"} in your cart
            </p>
          </div>
          <button
            onClick={() => clearCart()}
            className="text-xs text-muted-foreground hover:text-rose-400 transition-colors flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear all
          </button>
        </div>

        {/* Free shipping progress */}
        {freeShippingRemaining > 0 && (
          <div className="mb-6 p-4 rounded-2xl border border-[#00FF66]/20 bg-[#00FF66]/5 flex items-center gap-3">
            <Truck className="w-4 h-4 text-[#00FF66] shrink-0" />
            <div className="flex-1 space-y-1.5">
              <p className="text-xs font-medium text-foreground">
                Add{" "}
                <span className="text-[#00FF66] font-bold">
                  ₹{freeShippingRemaining.toFixed(0)}
                </span>{" "}
                more for free delivery
              </p>
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#00FF66] rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      100,
                      (subtotal / STORE_POLICIES.freeShippingThreshold) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>
        )}
        {deliveryFee === 0 && subtotal > 0 && (
          <div className="mb-6 p-3 rounded-2xl border border-[#00FF66]/30 bg-[#00FF66]/10 flex items-center gap-2 text-xs text-[#00FF66] font-semibold">
            <Truck className="w-4 h-4" />
            🎉 Free delivery unlocked on this order!
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => {
              const accent = getAccent(item.product_id);
              return (
                <Card
                  key={item.product_id}
                  className="p-4 border-white/10 hover:border-white/20 transition-colors"
                >
                  <div className="flex gap-4 items-start">
                    {/* Product visual */}
                    <div
                      className="w-16 h-16 rounded-xl shrink-0 flex items-center justify-center text-2xl font-bold border"
                      style={{
                        background: `${accent}15`,
                        borderColor: `${accent}30`,
                        color: accent,
                      }}
                    >
                      {item.flavor.charAt(0)}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-bold text-foreground text-sm leading-tight truncate max-w-[200px]">
                            {item.name}
                          </p>
                          <p className="text-[11px] text-muted-foreground">{item.flavor} · 330ml</p>
                        </div>
                        <button
                          onClick={() => removeItem(item.product_id)}
                          className="text-muted-foreground hover:text-rose-400 transition-colors p-0.5 mt-0.5 shrink-0"
                          aria-label={`Remove ${item.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        {/* Qty controls */}
                        <div className="flex items-center gap-1.5 border border-white/10 rounded-xl overflow-hidden">
                          <button
                            onClick={() =>
                              updateQuantity(item.product_id, item.quantity - 1)
                            }
                            className="p-2 hover:bg-white/5 transition-colors"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-8 text-center text-sm font-bold text-foreground">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(item.product_id, item.quantity + 1)
                            }
                            className="p-2 hover:bg-white/5 transition-colors"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Line total */}
                        <p className="font-extrabold text-foreground">
                          ₹{(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="p-6 border-white/10 sticky top-24 space-y-5">
              <h2 className="text-base font-bold text-foreground">Order Summary</h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal ({totalItems} items)</span>
                  <span className="text-foreground font-medium">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5" />
                    Delivery Fee
                  </span>
                  {deliveryFee === 0 ? (
                    <span className="text-[#00FF66] font-bold">FREE</span>
                  ) : (
                    <span className="text-foreground font-medium">₹{deliveryFee.toFixed(2)}</span>
                  )}
                </div>
                <div className="border-t border-border/40 pt-3 flex justify-between font-extrabold text-foreground">
                  <span>Total</span>
                  <span className="text-lg">₹{total.toFixed(2)}</span>
                </div>
              </div>

              {/* Loyalty note */}
              <div className="p-3 rounded-xl bg-[#00FF66]/5 border border-[#00FF66]/20 text-[11px] text-muted-foreground flex items-start gap-1.5">
                <Tag className="w-3.5 h-3.5 text-[#00FF66] shrink-0 mt-0.5" />
                <span>
                  You&apos;ll earn{" "}
                  <span className="text-[#00FF66] font-bold">
                    {totalItems * 10} Pulse Points
                  </span>{" "}
                  on this order.
                </span>
              </div>

              {/* CTA */}
              <Button
                className="w-full justify-center gap-2 py-3"
                onClick={() => {
                  if (!user) {
                    router.push(`/customer/login?returnUrl=/checkout`);
                  } else {
                    router.push("/checkout");
                  }
                }}
              >
                {!user ? "Sign In to Checkout" : "Proceed to Checkout"}
                <ArrowRight className="w-4 h-4" />
              </Button>

              <Link href="/shop" className="block">
                <button className="w-full text-xs text-muted-foreground hover:text-[#00FF66] transition-colors text-center py-1">
                  ← Continue Shopping
                </button>
              </Link>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
