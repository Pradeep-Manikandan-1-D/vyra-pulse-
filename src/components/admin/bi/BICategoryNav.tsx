"use client";

import React from "react";
import {
  TrendingUp,
  DollarSign,
  Users,
  Package,
  MapPin,
  Activity,
  Warehouse,
  Tag,
  MessageSquare,
  LayoutGrid,
} from "lucide-react";
import { BICategoryId } from "@/lib/bi/types";

interface BICategoryNavProps {
  activeCategory: BICategoryId;
  onSelectCategory: (cat: BICategoryId) => void;
}

const CATEGORIES = [
  { id: "all" as const, label: "Overview", icon: LayoutGrid, count: "All" },
  { id: "sales_revenue" as const, label: "A. Sales & Revenue", icon: TrendingUp, count: "10" },
  { id: "profitability" as const, label: "B. Profitability", icon: DollarSign, count: "10" },
  { id: "customer_analytics" as const, label: "C. Customers", icon: Users, count: "12" },
  { id: "product_performance" as const, label: "D. Products", icon: Package, count: "12" },
  { id: "regional_analytics" as const, label: "E. Regional", icon: MapPin, count: "11" },
  { id: "operational_analytics" as const, label: "F. Operations", icon: Activity, count: "12" },
  { id: "inventory_analytics" as const, label: "G. Inventory", icon: Warehouse, count: "11" },
  { id: "marketing_loyalty" as const, label: "H. Offers & Loyalty", icon: Tag, count: "12" },
  { id: "customer_experience" as const, label: "I. Experience", icon: MessageSquare, count: "6" },
];

export function BICategoryNav({ activeCategory, onSelectCategory }: BICategoryNavProps) {
  return (
    <div className="w-full overflow-x-auto no-scrollbar pb-1">
      <div className="flex items-center gap-1.5 min-w-max p-1 bg-surface/80 border border-white/10 rounded-2xl backdrop-blur-md">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 border ${
                isActive
                  ? "bg-[#00FF66] text-black border-[#00FF66] shadow-[0_0_15px_rgba(0,255,102,0.3)] font-bold"
                  : "bg-transparent border-transparent text-muted-foreground hover:text-foreground hover:bg-white/5"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? "text-black" : "text-muted-foreground"}`} />
              <span>{cat.label}</span>
              <span
                className={`text-[9px] font-mono px-1.5 py-0.2 rounded-full ${
                  isActive ? "bg-black/20 text-black font-bold" : "bg-white/10 text-muted-foreground"
                }`}
              >
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
