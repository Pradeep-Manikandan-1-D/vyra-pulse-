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
} from "lucide-react";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/components/auth/AuthProvider";
import { useCart } from "@/components/cart/CartProvider";

export function Navbar() {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const { user, profile, isAdmin, isCustomer, signOut } = useAuth();
  const { totalItems } = useCart();

  const handleSignOut = async () => {
    await signOut();
    setUserDropdownOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-surface/80 backdrop-blur-xl transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Brand Logo & Name */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10 md:w-11 md:h-11 rounded-xl overflow-hidden border border-white/10 group-hover:border-[#00FF66]/60 transition-all shadow-sm">
              <Image
                src="/assets/branding/Logo.png"
                alt="Vyra Pulse Logo"
                fill
                sizes="(max-width: 768px) 40px, 44px"
                className="object-cover group-hover:scale-105 transition-transform"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg md:text-xl tracking-tight text-foreground flex items-center gap-1.5">
                VYRA <span className="text-[#00FF66] drop-shadow-[0_0_8px_rgba(0,255,102,0.4)]">PULSE</span>
              </span>
              <span className="text-[10px] tracking-widest uppercase text-muted-foreground font-mono">
                {isAdminRoute ? "Admin Operations Suite" : "Energy • Neuro-Focus"}
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          {!isAdminRoute ? (
            <nav className="hidden md:flex items-center gap-8">
              <Link
                href="/shop"
                className="text-sm font-medium text-muted hover:text-[#00FF66] transition-colors flex items-center gap-1.5"
              >
                <Zap className="w-4 h-4 text-[#00FF66]" />
                Store
              </Link>
              <Link
                href="/#flavors"
                className="text-sm font-medium text-muted hover:text-[#00FF66] transition-colors"
              >
                8 Flavors
              </Link>
              <Link
                href="/#loyalty"
                className="text-sm font-medium text-muted hover:text-[#00FF66] transition-colors"
              >
                Pulse Rewards
              </Link>
            </nav>
          ) : (
            <div className="hidden md:flex items-center gap-3">
              <span className="text-xs px-2.5 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-mono font-bold">
                Operations Gateway
              </span>
              <Link
                href="/shop"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 ml-2"
              >
                <span>Preview Storefront</span>
              </Link>
            </div>
          )}

          {/* Action Buttons & Theme Toggle */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />

            {!isAdminRoute && (
              <Link href="/cart">
                <button
                  type="button"
                  aria-label="Shopping Cart"
                  className="relative p-2.5 rounded-lg border border-border/80 hover:border-[#00FF66]/50 text-foreground transition-all duration-200 hover:bg-white/5"
                >
                  <ShoppingBag className="w-4 h-4" />
                  {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#00FF66] text-black text-[10px] font-bold flex items-center justify-center">
                      {totalItems > 9 ? "9+" : totalItems}
                    </span>
                  )}
                </button>
              </Link>
            )}

            {/* User Account / Auth State */}
            {user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/10 bg-surface hover:border-[#00FF66]/40 text-xs font-semibold text-foreground transition-all"
                >
                  <div className="w-5 h-5 rounded-full bg-[#00FF66]/20 text-[#00FF66] flex items-center justify-center text-[10px] font-bold">
                    {profile?.display_name ? profile.display_name.charAt(0).toUpperCase() : "U"}
                  </div>
                  <span className="max-w-[100px] truncate">
                    {profile?.display_name || user.email?.split("@")[0]}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-xl border border-white/10 bg-surface/95 backdrop-blur-xl p-2 shadow-2xl space-y-1 text-xs animate-in fade-in duration-150 z-50">
                    <div className="px-2.5 py-1.5 border-b border-white/5">
                      <p className="font-semibold text-foreground truncate">{profile?.display_name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                      <span className="inline-block mt-1 text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {isAdmin ? "Super Admin" : "Verified Customer"}
                      </span>
                    </div>

                    {isAdmin ? (
                      <Link
                        href="/admin"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Admin Command Center
                      </Link>
                    ) : (
                      <>
                        <Link
                          href="/account/orders"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-foreground hover:bg-white/5 transition-colors"
                        >
                          <ShoppingBag className="w-3.5 h-3.5 text-[#00FF66]" />
                          Order History
                        </Link>
                        <Link
                          href="/account/wallet"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-foreground hover:bg-white/5 transition-colors"
                        >
                          <Zap className="w-3.5 h-3.5 text-[#CCFF00]" />
                          Pulse Rewards
                        </Link>
                        <Link
                          href="/account/profile"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-foreground hover:bg-white/5 transition-colors"
                        >
                          <User className="w-3.5 h-3.5 text-sky-400" />
                          Profile & Address
                        </Link>
                      </>
                    )}

                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors text-left"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/customer/login">
                <Button variant="secondary" size="sm" className="gap-2">
                  <User className="w-4 h-4" />
                  Sign In
                </Button>
              </Link>
            )}

            <Link href="/shop">
              <Button variant="primary" size="sm" className="hidden lg:inline-flex">
                Order Now
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />
            <Link href="/cart">
              <button
                type="button"
                aria-label="Cart"
                className="relative p-2 rounded-lg border border-border text-foreground"
              >
                <ShoppingBag className="w-4 h-4" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#00FF66] text-black text-[9px] font-bold flex items-center justify-center">
                    {totalItems > 9 ? "9+" : totalItems}
                  </span>
                )}
              </button>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              type="button"
              aria-label="Toggle Menu"
              className="p-2 rounded-lg border border-border text-foreground"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-border bg-surface/95 backdrop-blur-xl px-4 pt-3 pb-5 space-y-3 animate-in slide-in-from-top-2 duration-200">
          {!isAdminRoute ? (
            <>
              <Link
                href="/shop"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-foreground hover:bg-white/5"
              >
                Explore Store
              </Link>
              <Link
                href="/#flavors"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-foreground hover:bg-white/5"
              >
                All 8 Flavors
              </Link>
              <Link
                href="/#loyalty"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-foreground hover:bg-white/5"
              >
                Pulse Rewards
              </Link>
            </>
          ) : (
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 px-3">
                Admin Operations
              </span>
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-white/5"
              >
                Executive Overview
              </Link>
              <Link
                href="/admin/orders"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-white/5"
              >
                Orders & Fulfilment
              </Link>
              <Link
                href="/admin/products"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-white/5"
              >
                Product Catalogue
              </Link>
              <Link
                href="/admin/inventory"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-white/5"
              >
                Stock & Inventory
              </Link>
              <Link
                href="/admin/analytics"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-white/5"
              >
                BI & Analytics
              </Link>
              <Link
                href="/shop"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/5"
              >
                ← Exit to Store
              </Link>
            </div>
          )}
          <div className="pt-2 border-t border-border/40 flex flex-col gap-2">
            {user ? (
              <>
                <Link
                  href="/account/orders"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-white/5"
                >
                  My Orders & Tracking
                </Link>
                <Link
                  href="/account/wallet"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-sm font-medium text-[#00FF66] hover:bg-white/5"
                >
                  Pulse Rewards Wallet
                </Link>
                <Link
                  href="/account/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-white/5"
                >
                  Profile & Address
                </Link>
                <Button
                  onClick={() => {
                    handleSignOut();
                    setMobileMenuOpen(false);
                  }}
                  variant="outline"
                  size="md"
                  className="w-full justify-center text-rose-400 border-rose-500/30"
                >
                  Sign Out ({profile?.display_name || user.email})
                </Button>
              </>
            ) : (
              <Link href="/customer/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="secondary" size="md" className="w-full justify-center">
                  Sign In / Register
                </Button>
              </Link>
            )}
            {!isAdminRoute && (
              <Link href="/shop" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="primary" size="md" className="w-full justify-center">
                  Order Vyra Pulse (₹149)
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
