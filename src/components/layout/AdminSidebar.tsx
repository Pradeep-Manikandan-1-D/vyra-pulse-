"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Warehouse,
  Tag,
  BarChart3,
  LogOut,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth/AuthProvider";
import { isSupabaseConfigured } from "@/lib/supabase/client";

const ADMIN_NAV = [
  { href: "/admin", label: "Executive Overview", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders & Fulfilment", icon: ShoppingCart },
  { href: "/admin/products", label: "Product Catalogue", icon: Package },
  { href: "/admin/inventory", label: "Inventory & Stock", icon: Warehouse },
  { href: "/admin/customers", label: "Customer Intelligence", icon: Users },
  { href: "/admin/offers", label: "Promotions & Offers", icon: Tag },
  { href: "/admin/analytics", label: "Business Intelligence", icon: BarChart3 },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, signOut } = useAuth();

  const handleExitSession = async () => {
    await signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <aside className="w-64 border-r border-border bg-surface flex flex-col justify-between p-4 min-h-[calc(100vh-5rem)] transition-colors">
      <div className="space-y-6">
        {/* Role Badge */}
        <div className="px-3.5 py-3 rounded-2xl neu-inset flex items-center gap-2.5">
          <ShieldAlert className="w-4 h-4 text-emerald-500 shrink-0" />
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-foreground truncate">
              {profile?.display_name || "Super Admin"}
            </p>
            <p className="text-[10px] text-muted-foreground font-mono truncate">
              {user?.email || (isSupabaseConfigured() ? "admin@session" : "admin@gmail.com")}
            </p>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="space-y-1.5">
          {ADMIN_NAV.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-150",
                  isActive
                    ? "neu-inset text-primary font-bold border border-primary/30"
                    : "neu-btn text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-muted-foreground")} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Admin Sign Out */}
      <div className="pt-4 border-t border-border space-y-1">
        <button
          type="button"
          onClick={handleExitSession}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium text-rose-500 hover:bg-rose-500/10 neu-raised-sm transition-all text-left"
        >
          <LogOut className="w-4 h-4" />
          <span>Exit Admin Session</span>
        </button>
      </div>
    </aside>
  );
}
