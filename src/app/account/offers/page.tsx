"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Tag,
  Percent,
  Truck,
  Sparkles,
  Copy,
  Check,
  Calendar,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

const TAG_BORDER_MAP: Record<string, string> = {
  "Welcome Deal": "border-t-2 border-t-emerald-500/70",
  "Seasonal": "border-t-2 border-t-amber-500/70",
  "Shipping Perk": "border-t-2 border-t-sky-500/70",
  "Flavor Focus": "border-t-2 border-t-orange-500/70",
  "Bulk VIP": "border-t-2 border-t-purple-500/70",
  "Flash Deal": "border-t-2 border-t-rose-500/70",
};

const CANONICAL_OFFERS = [
  {
    id: "OFF-001",
    code: "WELCOME10",
    name: "First Order Welcome Discount",
    discount: "10% OFF",
    minOrder: 500,
    validUntil: "2027-03-31",
    active: true,
    tag: "Welcome Deal",
    description: "Enjoy a 10% discount on your initial crate purchase of ₹500 or more.",
  },
  {
    id: "OFF-002",
    code: "PULSE15",
    name: "Seasonal Volume Acceleration",
    discount: "15% OFF",
    minOrder: 750,
    validUntil: "2026-12-31",
    active: true,
    tag: "Seasonal",
    description: "Bundle multiple 4-packs and save 15% on orders starting from ₹750.",
  },
  {
    id: "OFF-003",
    code: "FREESHIP",
    name: "Complimentary Express Delivery",
    discount: "Free Shipping",
    minOrder: 445,
    validUntil: "2027-03-31",
    active: true,
    tag: "Shipping Perk",
    description: "Free express cold-pack shipping across all service zones on orders of 3+ cans.",
  },
  {
    id: "OFF-004",
    code: "MANGO5",
    name: "Alphonso Mango Fusion Launch",
    discount: "5% OFF",
    minOrder: 149,
    validUntil: "2026-11-30",
    active: true,
    tag: "Flavor Focus",
    description: "Special release discount on our Korean Ginseng & Alphonso Mango flavor.",
  },
  {
    id: "OFF-005",
    code: "BERRY10",
    name: "Blueberry Blast Antioxidant Special",
    discount: "10% OFF",
    minOrder: 298,
    validUntil: "2026-12-15",
    active: true,
    tag: "Flavor Focus",
    description: "Get 10% off any pair of Wild Blueberry & Acai cans.",
  },
  {
    id: "OFF-006",
    code: "PULSE20",
    name: "Team & Crate Caddy Power Pack",
    discount: "20% OFF",
    minOrder: 999,
    validUntil: "2027-03-31",
    active: true,
    tag: "Bulk VIP",
    description: "Stock up with full 8-can varieties and receive 20% off high-volume orders.",
  },
  {
    id: "OFF-007",
    code: "WEEKEND5",
    name: "Weekend Recharge Energy Boost",
    discount: "5% OFF",
    minOrder: 299,
    validUntil: "2027-03-31",
    active: true,
    tag: "Flash Deal",
    description: "Quick 5% recharge boost valid on all weekend orders.",
  },
];

export default function OffersPage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopy = (code: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2500);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/40 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-primary/10 border border-primary/30 text-xs font-semibold text-primary mb-2">
            <Tag className="w-3.5 h-3.5" />
            <span>Verified Coupons & Savings</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Offers & Deals
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Current promotional codes applicable at checkout. Only eligible promotions from our canonical catalog are listed.
          </p>
        </div>

        <Link href="/shop">
          <Button size="sm" variant="primary" className="gap-2">
            <ShoppingBag className="w-4 h-4" />
            <span>Shop Drinks Now</span>
          </Button>
        </Link>
      </div>

      {/* Grid of Offers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {CANONICAL_OFFERS.map((offer) => {
          const isCopied = copiedCode === offer.code;
          return (
            <Card
              key={offer.id}
              className={cn(
                "neu-card p-6 rounded-3xl flex flex-col justify-between space-y-5 relative overflow-hidden transition-all hover:scale-[1.01]",
                TAG_BORDER_MAP[offer.tag] || ""
              )}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="success" className="text-[10px]">
                    {offer.tag}
                  </Badge>
                  <span className="text-xs font-mono text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Valid till {new Date(offer.validUntil).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-foreground">
                    {offer.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {offer.description}
                  </p>
                </div>

                {/* Offer Metric Box */}
                <div className="p-3.5 rounded-2xl neu-inset flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-muted-foreground block uppercase font-mono">
                      Discount Value
                    </span>
                    <span className="text-lg font-black text-primary">
                      {offer.discount}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-muted-foreground block uppercase font-mono">
                      Minimum Cart
                    </span>
                    <span className="text-sm font-bold text-foreground">
                      ₹{offer.minOrder}
                    </span>
                  </div>
                </div>
              </div>

              {/* Coupon Box & Action */}
              <div className="pt-2 border-t border-border/40 flex items-center justify-between gap-3">
                <div className="px-3 py-1.5 rounded-xl border border-dashed border-primary/50 bg-black/10 dark:bg-black/30 font-mono font-black text-sm text-primary tracking-wider select-all">
                  {offer.code}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopy(offer.code)}
                    className="p-2 rounded-xl neu-btn text-muted-foreground hover:text-foreground transition-all"
                    title="Copy coupon code"
                    aria-label="Copy coupon code"
                  >
                    {isCopied ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>

                  <Link href={`/cart?code=${offer.code}`}>
                    <Button size="sm" variant="secondary" className="text-xs gap-1.5">
                      <span>Apply</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

