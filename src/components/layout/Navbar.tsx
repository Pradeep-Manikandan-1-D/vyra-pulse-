"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ShoppingBag,
  ShieldCheck,
  User,
  Menu,
  X,
  Zap,
  LogOut,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/components/auth/AuthProvider";
import { useCart } from "@/components/cart/CartProvider";
import { cn } from "@/lib/utils";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const isAdminRoute = pathname?.startsWith("/admin");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const { user, profile, isAdmin, signOut } = useAuth();
  const { totalItems } = useCart();

  // Close dropdown on click outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    }
    if (userDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [userDropdownOpen]);

  const handleSignOut = async () => {
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
    await signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-surface/95 backdrop-blur-md border-b border-border transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Brand Logo & Name */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-9 h-9 md:w-10 md:h-10 rounded-xl overflow-hidden border border-border group-hover:border-primary/60 transition-all shadow-sm bg-surface-inset flex items-center justify-center p-0.5">
              <Image
                src="/assets/branding/Logo.png"
                alt="Vyra Pulse Logo"
                fill
                sizes="(max-width: 768px) 36px, 40px"
                className="object-contain group-hover:scale-105 transition-transform"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base md:text-lg tracking-tight text-foreground flex items-center gap-1.5">
                VYRA <span className="text-primary font-bold">PULSE</span>
              </span>
              <span className="text-[9px] tracking-widest uppercase text-muted-foreground font-mono">
                {isAdminRoute ? "Admin Operations Suite" : "Energy • Neuro-Focus"}
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          {!isAdminRoute ? (
            <nav className="hidden md:flex items-center gap-7">
              <Link
                href="/shop"
                className={cn(
                  "text-xs font-semibold tracking-wide transition-colors flex items-center gap-1.5",
                  pathname === "/shop"
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Zap className="w-3.5 h-3.5 text-primary" />
                Store Flavors
              </Link>
              <Link
                href="/#benefits"
                className="text-xs font-semibold tracking-wide text-muted-foreground hover:text-foreground transition-colors"
              >
                Why Vyra
              </Link>
              <Link
                href="/account/offers"
                className={cn(
                  "text-xs font-semibold tracking-wide transition-colors",
                  pathname === "/account/offers"
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Deals & Offers
              </Link>
              <Link
                href="/account/wallet"
                className={cn(
                  "text-xs font-semibold tracking-wide transition-colors flex items-center gap-1",
                  pathname === "/account/wallet"
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Sparkles className="w-3 h-3 text-primary" />
                Pulse Rewards
              </Link>
            </nav>
          ) : (
            <div className="hidden md:flex items-center gap-3">
              <span className="text-xs px-2.5 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary font-mono font-bold">
                Operations Gateway
              </span>
              <Link
                href="/shop"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 ml-2 font-medium"
              >
                <span>Preview Storefront →</span>
              </Link>
            </div>
          )}

          {/* Action Buttons & Theme Toggle */}
          <div className="hidden md:flex items-center gap-3">
            {/* Theme Toggle */}
            <ThemeToggle variant="button" showLabel={false} />

            {!isAdminRoute && (
              <Link href="/cart">
                <button
                  type="button"
                  aria-label="Shopping Cart"
                  className="relative p-2.5 rounded-xl border border-border text-foreground hover:border-primary/50 transition-all duration-200 hover:bg-surface-elevated neu-raised-sm"
                >
                  <ShoppingBag className="w-4 h-4" />
                  {totalItems > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-primary text-white dark:text-black text-[10px] font-bold flex items-center justify-center shadow-sm">
                      {totalItems > 9 ? "9+" : totalItems}
                    </span>
                  )}
                </button>
              </Link>
            )}

            {/* User Account / Auth State */}
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  aria-expanded={userDropdownOpen}
                  aria-label="User Account Menu"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl neu-raised-sm hover:border-primary/50 text-xs font-semibold text-foreground transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <div className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold">
                    {profile?.display_name ? profile.display_name.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <span className="max-w-[120px] truncate">
                    {profile?.display_name || user.email?.split("@")[0]}
                  </span>
                  <ChevronDown className={cn("w-3.5 h-3.5 text-muted-foreground transition-transform duration-200", userDropdownOpen && "rotate-180")} />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2.5 w-56 rounded-2xl neu-dropdown p-2.5 space-y-1 text-xs animate-in fade-in zoom-in-95 duration-150 z-50">
                    <div className="px-3 py-2 border-b border-border pb-2">
                      <p className="font-bold text-foreground truncate text-sm">
                        {profile?.display_name || "Vyra Customer"}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate font-mono">{user.email}</p>
                      <span className="inline-block mt-1 text-[9px] font-mono px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30 font-bold">
                        {isAdmin ? "Super Admin" : "Verified Customer"}
                      </span>
                    </div>

                    {isAdmin ? (
                      <Link
                        href="/admin"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-primary hover:bg-primary/10 transition-colors font-medium"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        Admin Command Center
                      </Link>
                    ) : (
                      <>
                        <Link
                          href="/account"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-foreground hover:bg-surface-inset transition-colors font-medium"
                        >
                          <Zap className="w-4 h-4 text-primary" />
                          Dashboard
                        </Link>
                        <Link
                          href="/account/orders"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-foreground hover:bg-surface-inset transition-colors font-medium"
                        >
                          <ShoppingBag className="w-4 h-4 text-primary" />
                          Order History
                        </Link>
                        <Link
                          href="/account/wallet"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-foreground hover:bg-surface-inset transition-colors font-medium"
                        >
                          <Sparkles className="w-4 h-4 text-primary" />
                          Pulse Rewards
                        </Link>
                        <Link
                          href="/account/profile"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-foreground hover:bg-surface-inset transition-colors font-medium"
                        >
                          <User className="w-4 h-4 text-muted-foreground" />
                          Profile & Address
                        </Link>
                      </>
                    )}

                    <div className="pt-1 border-t border-border">
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-colors text-left font-medium"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/customer/login">
                  <Button variant="secondary" size="sm" className="gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    Sign In
                  </Button>
                </Link>
                <Link href="/shop">
                  <Button variant="primary" size="sm" className="hidden lg:inline-flex">
                    Shop Now
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Actions */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle variant="button" />
            {!isAdminRoute && (
              <Link href="/cart">
                <button
                  type="button"
                  aria-label="Cart"
                  className="relative p-2 rounded-xl border border-border text-foreground neu-raised-sm"
                >
                  <ShoppingBag className="w-4 h-4" />
                  {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-primary text-white dark:text-black text-[9px] font-bold flex items-center justify-center">
                      {totalItems > 9 ? "9+" : totalItems}
                    </span>
                  )}
                </button>
              </Link>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              type="button"
              aria-label="Toggle Menu"
              className="p-2 rounded-xl border border-border text-foreground neu-raised-sm"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-border bg-surface neu-card px-4 pt-3 pb-5 space-y-3 animate-in slide-in-from-top-2 duration-200">
          {!isAdminRoute ? (
            <div className="space-y-1">
              <Link
                href="/shop"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-sm font-semibold text-foreground hover:bg-surface-inset"
              >
                Store Flavors
              </Link>
              <Link
                href="/#benefits"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-sm font-semibold text-foreground hover:bg-surface-inset"
              >
                Why Vyra
              </Link>
              <Link
                href="/account/offers"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-sm font-semibold text-foreground hover:bg-surface-inset"
              >
                Deals & Offers
              </Link>
              <Link
                href="/account/wallet"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-sm font-semibold text-primary hover:bg-surface-inset"
              >
                Pulse Rewards
              </Link>
            </div>
          ) : (
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-primary px-3 block mb-1">
                Admin Operations
              </span>
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-sm font-semibold text-foreground hover:bg-surface-inset"
              >
                Executive Overview
              </Link>
              <Link
                href="/admin/orders"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-sm font-semibold text-foreground hover:bg-surface-inset"
              >
                Orders & Fulfilment
              </Link>
              <Link
                href="/admin/products"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-sm font-semibold text-foreground hover:bg-surface-inset"
              >
                Product Catalogue
              </Link>
              <Link
                href="/admin/inventory"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-sm font-semibold text-foreground hover:bg-surface-inset"
              >
                Stock & Inventory
              </Link>
              <Link
                href="/admin/analytics"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-sm font-semibold text-foreground hover:bg-surface-inset"
              >
                BI & Analytics
              </Link>
              <Link
                href="/shop"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-surface-inset"
              >
                ← Exit to Store
              </Link>
            </div>
          )}

          <div className="pt-2 border-t border-border flex flex-col gap-2">
            {user ? (
              <>
                <Link
                  href="/account"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-xl text-sm font-semibold text-foreground hover:bg-surface-inset"
                >
                  My Account Dashboard
                </Link>
                <Link
                  href="/account/orders"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-xl text-sm font-semibold text-foreground hover:bg-surface-inset"
                >
                  My Orders & Tracking
                </Link>
                <Button
                  onClick={() => {
                    handleSignOut();
                    setMobileMenuOpen(false);
                  }}
                  variant="outline"
                  size="md"
                  className="w-full justify-center text-rose-500 border-rose-500/30"
                >
                  Sign Out ({profile?.display_name || user.email})
                </Button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link href="/customer/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="secondary" size="md" className="w-full justify-center text-xs">
                    Customer Login
                  </Button>
                </Link>
                <Link href="/admin/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" size="md" className="w-full justify-center text-xs">
                    Admin Portal
                  </Button>
                </Link>
              </div>
            )}
            {!isAdminRoute && (
              <Link href="/shop" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="primary" size="md" className="w-full justify-center">
                  Shop All Flavors (₹149)
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
