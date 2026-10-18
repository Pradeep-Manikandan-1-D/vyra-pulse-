import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Zap, ShieldCheck } from "lucide-react";
import { VYRA_FLAVORS } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-surface/50 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-white/10">
                <Image
                  src="/assets/branding/Logo.png"
                  alt="Vyra Pulse Logo"
                  fill
                  sizes="32px"
                  className="object-cover"
                />
              </div>
              <span className="font-bold text-lg tracking-tight text-foreground">
                VYRA <span className="text-[#00FF66]">PULSE</span>
              </span>
            </Link>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Engineered for apex mental focus, sustained physical stamina, and rapid cellular hydration. 330 ml can, ₹149 per unit.
            </p>
            <div className="flex items-center gap-2 text-xs text-[#00FF66] font-mono">
              <Zap className="w-3.5 h-3.5" />
              <span>Bio-Enhanced Formula • Zero Sugar Crash</span>
            </div>
          </div>

          {/* Flavors Directory */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold tracking-wider uppercase text-foreground">
              8 Signature Flavors
            </h4>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              {VYRA_FLAVORS.slice(0, 4).map((f) => (
                <li key={f.id}>
                  <Link href={`/shop#${f.id}`} className="hover:text-[#00FF66] transition-colors">
                    {f.name.replace("Vyra Pulse ", "")}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-semibold tracking-wider uppercase text-foreground">
              More Flavors
            </h4>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              {VYRA_FLAVORS.slice(4).map((f) => (
                <li key={f.id}>
                  <Link href={`/shop#${f.id}`} className="hover:text-[#00FF66] transition-colors">
                    {f.name.replace("Vyra Pulse ", "")}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer & Rewards */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold tracking-wider uppercase text-foreground">
              Customer & Rewards
            </h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <Link href="/shop" className="hover:text-[#00FF66] transition-colors">
                  Store Catalogue
                </Link>
              </li>
              <li>
                <Link href="/account/orders" className="hover:text-[#00FF66] transition-colors">
                  Track Orders
                </Link>
              </li>
              <li>
                <Link href="/account/wallet" className="hover:text-[#00FF66] transition-colors">
                  Pulse Rewards Wallet
                </Link>
              </li>
              <li>
                <Link href="/customer/login" className="hover:text-[#00FF66] transition-colors">
                  Sign In / Register
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Vyra Pulse. All rights reserved.</p>
          <p className="font-mono text-[11px]">
            Powered by Next.js App Router • Supabase Cloud • Vercel Edge
          </p>
        </div>
      </div>
    </footer>
  );
}
