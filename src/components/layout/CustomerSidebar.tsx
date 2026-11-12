"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutGrid,
  ShoppingBag,
  Heart,
  Package,
  Repeat,
  Tag,
  Coins,
  BarChart3,
  User,
  Headphones,
  Settings,
  LogOut,
  Sparkles,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth/AuthProvider";
import { getCustomerWallet, getCustomerProfile } from "@/lib/customer/data";

export const CUSTOMER_NAV = [
  { href: "/account", label: "Dashboard", icon: LayoutGrid, exact: true },
  { href: "/shop", label: "Shop Flavors", icon: ShoppingBag },
  { href: "/account/favorites", label: "My Favorites", icon: Heart },
  { href: "/account/orders", label: "My Orders", icon: Package },
  { href: "/account/subscriptions", label: "Subscriptions", icon: Repeat },
  { href: "/account/offers", label: "Offers & Deals", icon: Tag },
  { href: "/account/wallet", label: "Rewards & Loyalty", icon: Coins },
  { href: "/account/consumption", label: "My Consumption", icon: BarChart3 },
  { href: "/account/profile", label: "My Profile", icon: User },
  { href: "/account/support", label: "Help & Support", icon: Headphones },
  { href: "/account/settings", label: "Settings", icon: Settings },
];

export function CustomerSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const customerId = (profile as any)?.customer_id || (user as any)?.customer_id || user?.id || "CUST-0001";
  const customerProfile = getCustomerProfile(customerId);
  const wallet = getCustomerWallet(customerId);

  const handleLogout = async () => {
    await signOut();
    router.push("/");
    router.refresh();
  };

  const navContent = (
    <div className="flex flex-col justify-between h-full p-4 space-y-6">
      <div className="space-y-5">
        {/* Customer Badge & Tier */}
        <div className="p-4 rounded-2xl neu-inset space-y-2 border border-border">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground font-semibold">
              {(profile as any)?.customer_id || customerId}
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30">
              <Sparkles className="w-2.5 h-2.5" />
              Member
            </span>
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-foreground truncate">
              {customerProfile?.fullName || (profile as any)?.display_name || user?.email?.split("@")[0] || "Vyra Customer"}
            </p>
            <p className="text-[11px] text-muted-foreground truncate font-mono">
              {customerProfile?.email || user?.email || "customer@vyrapulse.com"}
            </p>
          </div>
          <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Reward Points</span>
            <span className="font-extrabold text-primary font-mono">
              {wallet.balance} PTS
            </span>
          </div>
        </div>

        {/* 11 Main Navigation Links */}
        <nav className="space-y-1">
          {CUSTOMER_NAV.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact
              ? pathname === item.href
              : pathname === item.href || (item.href !== "/account" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150",
                  isActive
                    ? "neu-inset text-primary font-bold border border-primary/30 shadow-inner bg-primary/5"
                    : "neu-btn text-muted-foreground hover:text-foreground"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      "w-4 h-4 shrink-0 transition-colors",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )}
                  />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-primary" />}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* 12th Navigation Item: Logout */}
      <div className="pt-4 border-t border-border">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 neu-raised-sm transition-all text-left"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Toggle Button */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-border bg-surface sticky top-16 z-30">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-foreground uppercase tracking-wider">
            Customer Dashboard
          </span>
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-xl neu-btn text-foreground"
          aria-label="Toggle Navigation"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Backdrop & Drawer */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 top-[7.5rem] bg-black/60 backdrop-blur-sm z-40 animate-in fade-in"
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="w-72 h-full bg-surface border-r border-border overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {navContent}
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 border-r border-border bg-surface flex-col min-h-[calc(100vh-5rem)] sticky top-20 self-start transition-colors">
        {navContent}
      </aside>
    </>
  );
}
