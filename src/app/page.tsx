"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck, Zap } from "lucide-react";
import { BRAND_ASSETS } from "@/lib/constants";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useAuth } from "@/components/auth/AuthProvider";

export default function LandingPage() {
  const router = useRouter();
  const { user, role, isLoading, isConfigured } = useAuth();

  useEffect(() => {
    if (!isLoading && user) {
      if (role === "admin") router.replace("/admin");
      else if (role === "customer") router.replace("/shop");
    }
  }, [isLoading, user, role, router]);

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-background text-foreground overflow-hidden px-4">
      {/* Ambient glow blobs */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-[#00FF66]/10 blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-emerald-500/8 blur-[100px]" />
      </div>

      {/* Theme Toggle – top right */}
      <div className="fixed top-5 right-5 z-50">
        <ThemeToggle />
      </div>

      {/* Logo & Brand */}
      <div className="flex items-center gap-4 mb-5">
        <div className="relative w-16 h-16 rounded-2xl overflow-hidden border border-[#00FF66]/30 shadow-[0_0_20px_rgba(0,255,102,0.15)]">
          <Image
            src={BRAND_ASSETS.logo}
            alt="Vyra Pulse Logo"
            fill
            sizes="64px"
            className="object-cover"
            priority
          />
        </div>
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight leading-none">
            VYRA{" "}
            <span className="text-[#00FF66] drop-shadow-[0_0_12px_rgba(0,255,102,0.5)]">
              PULSE
            </span>
          </h1>
          <p className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground font-mono mt-0.5">
            Energy · Neuro · Focus
          </p>
        </div>
      </div>

      {/* Welcome heading */}
      <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3 text-center">
        Welcome to Vyra Pulse
      </h2>

      {/* Highlighted Tagline */}
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#00FF66]/40 bg-[#00FF66]/10 mb-2">
        <Zap className="w-4 h-4 text-[#00FF66]" />
        <span className="text-base sm:text-lg font-extrabold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-[#00FF66] via-emerald-300 to-[#CCFF00]">
          Feel the Beat. Own the Heat.
        </span>
        <Zap className="w-4 h-4 text-[#00FF66]" />
      </div>

      <p className="text-sm text-muted-foreground mb-10 text-center">
        Choose your portal to continue.
      </p>

      {/* Role Selection Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl">
        {/* Admin Portal */}
        <Link
          href="/admin/login"
          className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 hover:border-[#00FF66]/50 bg-surface/60 backdrop-blur-md shadow-sm hover:shadow-[0_0_30px_-8px_rgba(0,255,102,0.3)] transition-all duration-300"
        >
          {/* Image */}
          <div className="relative w-full h-40 overflow-hidden">
            <Image
              src="/assets/branding/admin-login-bg.jpg"
              alt="Admin portal"
              fill
              sizes="(max-width: 640px) 100vw, 50vw"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          </div>
          {/* Text */}
          <div className="p-6 flex flex-col gap-1">
            <h3 className="text-xl font-extrabold text-[#00FF66] group-hover:drop-shadow-[0_0_8px_rgba(0,255,102,0.5)] transition-all">
              Admin Portal
            </h3>
            <p className="text-sm text-muted-foreground">
              Manage sales, inventory, analytics and more.
            </p>
          </div>
        </Link>

        {/* Customer Portal */}
        <Link
          href="/customer/login"
          className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 hover:border-[#00FF66]/50 bg-surface/60 backdrop-blur-md shadow-sm hover:shadow-[0_0_30px_-8px_rgba(0,255,102,0.3)] transition-all duration-300"
        >
          {/* Image */}
          <div className="relative w-full h-40 overflow-hidden">
            <Image
              src="/assets/branding/customer-login-bg.jpg"
              alt="Customer portal"
              fill
              sizes="(max-width: 640px) 100vw, 50vw"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          </div>
          {/* Text */}
          <div className="p-6 flex flex-col gap-1">
            <h3 className="text-xl font-extrabold text-[#00FF66] group-hover:drop-shadow-[0_0_8px_rgba(0,255,102,0.5)] transition-all">
              Customer Portal
            </h3>
            <p className="text-sm text-muted-foreground">
              Shop, track orders, earn rewards.
            </p>
          </div>
        </Link>
      </div>

      {/* Dev mode notice */}
      {!isConfigured && (
        <div className="mt-8 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-600 dark:text-amber-300 max-w-sm">
          <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Local Preview Mode</p>
            <p className="text-[11px]">
              No backend configured. Use admin/customer login pages directly.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
