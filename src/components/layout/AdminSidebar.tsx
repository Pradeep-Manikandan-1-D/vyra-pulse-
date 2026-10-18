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
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <aside className="w-64 border-r border-border/40 bg-surface/80 backdrop-blur-md flex flex-col justify-between p-4 min-h-[calc(100vh-5rem)]">
      <div className="space-y-6">
        {/* Role Badge */}
        <div className="px-3 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2.5">
          <ShieldAlert className="w-4 h-4 text-emerald-400 shrink-0" />
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-foreground truncate">
              {profile?.display_name || "Super Admin"}
            </p>
            <p className="text-[10px] text-muted-foreground font-mono truncate">
              {user?.email || "admin@gmail.com"}
            </p>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="space-y-1">
          {ADMIN_NAV.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-200",
                  isActive
                    ? "bg-[#00FF66]/15 text-[#00FF66] font-semibold border border-[#00FF66]/30 shadow-neon-glow-sm"
                    : "text-muted hover:text-foreground hover:bg-white/5"
                )}
              >
                <Icon className={cn("w-4 h-4", isActive ? "text-[#00FF66]" : "text-muted")} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Admin Sign Out */}
      <div className="pt-4 border-t border-border/40 space-y-1">
        <button
          type="button"
          onClick={handleExitSession}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition-colors text-left"
        >
          <LogOut className="w-4 h-4" />
          <span>Exit Admin Session</span>
        </button>
      </div>
    </aside>
  );
}
