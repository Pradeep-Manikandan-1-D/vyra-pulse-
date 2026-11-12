"use client";

import React from "react";
import {
  TrendingUp,
  ShoppingCart,
  Users,
  Package,
  Warehouse,
  Tag,
  LayoutGrid,
} from "lucide-react";
import { BICategoryId } from "@/lib/bi/types";

interface BICategoryNavProps {
  activeCategory: BICategoryId;
  onSelectCategory: (cat: BICategoryId) => void;
}

const CATEGORIES = [
  { id: "all" as const, label: "Overview", icon: LayoutGrid, count: "6" },
  { id: "sales_revenue" as const, label: "1. Sales Performance", icon: TrendingUp },
  { id: "product_performance" as const, label: "2. Product Performance", icon: Package },
  { id: "customer_analytics" as const, label: "3. Customer Analytics", icon: Users },
  { id: "operational_analytics" as const, label: "4. Order Analytics", icon: ShoppingCart },
  { id: "inventory_analytics" as const, label: "5. Inventory Analytics", icon: Warehouse },
  { id: "marketing_loyalty" as const, label: "6. Discounts & Offers", icon: Tag },
];

export function BICategoryNav({ activeCategory, onSelectCategory }: BICategoryNavProps) {
  return (
    <div className="w-full overflow-x-auto no-scrollbar pb-1">
      <div className="flex items-center gap-2 min-w-max p-1.5 neu-inset rounded-2xl">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-150 ${
                isActive
                  ? "neu-btn-primary text-black font-bold"
                  : "neu-btn text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? "text-black" : "text-muted-foreground"}`} />
              <span>{cat.label}</span>
              {cat.count && (
                <span
                  className={`text-[9px] font-mono px-1.5 py-0.2 rounded-full ${
                    isActive ? "bg-black/20 text-black font-bold" : "bg-black/5 dark:bg-white/10 text-muted-foreground"
                  }`}
                >
                  {cat.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
