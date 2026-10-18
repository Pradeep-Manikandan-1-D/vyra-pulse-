"use client";

import React, { useState, useEffect, Suspense, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ShieldCheck,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Lock,
  Mail,
  AlertCircle,
  CheckCircle2,
  Info,
  Loader2,
  BarChart3,
  Package,
  Users,
  Truck,
  Activity,
  ChevronRight,
} from "lucide-react";
import { BRAND_ASSETS } from "@/lib/constants";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";


type AuthStatus = "idle" | "loading" | "success" | "error";

const ADMIN_FEATURES = [
  { icon: BarChart3, label: "Sales & Revenue Insights" },
  { icon: Package, label: "Product & Inventory Management" },
  { icon: Users, label: "Customer Analytics" },
  { icon: Truck, label: "Orders & Deliveries" },
  { icon: Activity, label: "Real-time Updates" },
];

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [authStatus, setAuthStatus] = useState<AuthStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const isConfigured = isSupabaseConfigured();
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam === "unauthorized") {
      setErrorMessage(
        "Access Denied: This account does not possess administrator privileges."
      );
      setAuthStatus("error");
    }
  }, [searchParams]);

  const validateForm = (): boolean => {
    let valid = true;
    setEmailError(null);
    setPasswordError(null);

    if (!email.trim()) {
      setEmailError("Email is required.");
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Please enter a valid email address.");
      valid = false;
    }

    if (!password.trim()) {
      setPasswordError("Password is required.");
      valid = false;
    }

    return valid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authStatus === "loading") return;

    setErrorMessage(null);
    setSuccessMessage(null);

    if (!validateForm()) return;

    setAuthStatus("loading");

    const supabase = createClient();

    // 1. If Supabase is configured, execute real cloud authentication
    if (supabase && isConfigured) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setErrorMessage(
            error.message === "Invalid login credentials"
              ? "Invalid email or password. Please try again."
              : error.message
          );
          setAuthStatus("error");
          return;
        }

        if (data.user) {
          // Check role from profiles table
          const { data: profile, error: profileErr } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", data.user.id)
            .single();

          if (profileErr || profile?.role !== "admin") {
            await supabase.auth.signOut();
            setErrorMessage(
              "Access Denied: This account is not authorized for administrator access."
            );
            setAuthStatus("error");
            return;
          }

          setSuccessMessage("Login successful. Redirecting to dashboard...");
          setAuthStatus("success");

          const redirectUrl = searchParams.get("redirect") || "/admin";
          setTimeout(() => {
            router.push(redirectUrl);
            router.refresh();
          }, 800);
        }
      } catch (err: unknown) {
        setErrorMessage(
          err instanceof Error ? err.message : "An unexpected error occurred."
        );
        setAuthStatus("error");
      }
      return;
    }

    // 2. Local development fallback
    setTimeout(() => {
      if (email.toLowerCase() === "admin@gmail.com") {
        localStorage.setItem(
          "vyra-dev-auth",
          JSON.stringify({
            id: "dev-admin-uuid",
            email: "admin@gmail.com",
            role: "admin",
            display_name: "Super Admin",
          })
        );
        setSuccessMessage("Login successful. Redirecting to dashboard...");
        setAuthStatus("success");

        const redirectUrl = searchParams.get("redirect") || "/admin";
        setTimeout(() => {
          router.push(redirectUrl);
          router.refresh();
        }, 800);
      } else {
        setErrorMessage(
          "Invalid email or password. (Dev mode: use admin@gmail.com)"
        );
        setAuthStatus("error");
      }
    }, 600);
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setEmailError("Enter your admin email first to receive a reset link.");
      emailRef.current?.focus();
      return;
    }

    const supabase = createClient();
    if (supabase && isConfigured) {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/admin/login`,
        });
        if (error) {
          setErrorMessage(error.message);
          setAuthStatus("error");
        } else {
          setSuccessMessage(
            "If this email is registered, a password reset link has been sent."
          );
          setAuthStatus("idle");
        }
      } catch {
        setErrorMessage("Unable to process password reset. Please try later.");
        setAuthStatus("error");
      }
    } else {
      setSuccessMessage(
        "Password reset is available when Supabase is configured."
      );
    }
  };

  return (
    <div className="relative min-h-screen flex">

      {/* Left Panel — Login Form */}
      <div className="relative z-10 w-full lg:w-[480px] xl:w-[520px] flex flex-col justify-center px-6 sm:px-10 lg:px-12 py-10 lg:py-0 min-h-screen bg-background/95 dark:bg-[#0A0A0A]/95 backdrop-blur-sm lg:backdrop-blur-none">
        {/* Logo & Brand */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-white/10 dark:border-white/10 border-neutral-200 group-hover:border-[#00FF66]/60 transition-all shadow-sm">
              <Image
                src={BRAND_ASSETS.logo}
                alt="Vyra Pulse Logo"
                fill
                sizes="48px"
                className="object-cover"
                priority
              />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-foreground">
                VYRA{" "}
                <span className="text-[#00FF66] drop-shadow-[0_0_8px_rgba(0,255,102,0.4)]">
                  PULSE
                </span>
              </span>
              <span className="block text-[10px] tracking-widest uppercase text-muted-foreground font-mono">
                Admin Portal
              </span>
            </div>
          </Link>
        </div>

        {/* Heading */}
        <div className="space-y-2 mb-6">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            Admin{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00FF66] to-emerald-400">
              Login
            </span>
          </h1>
          <div className="w-12 h-1 rounded-full bg-gradient-to-r from-[#00FF66] to-emerald-400" />
          <p className="text-sm text-muted-foreground">
            Welcome back. Take control of your pulse.
          </p>
        </div>

        {/* Supabase Status */}
        {!isConfigured && (
          <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-600 dark:text-amber-300">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-500 dark:text-amber-400" />
            <div className="space-y-0.5">
              <p className="font-semibold text-amber-700 dark:text-amber-200">
                Local Preview Mode
              </p>
              <p className="text-[11px] leading-relaxed opacity-90">
                Use{" "}
                <code className="bg-black/10 dark:bg-black/30 px-1 py-0.5 rounded">
                  admin@gmail.com
                </code>{" "}
                with any password.
              </p>
            </div>
          </div>
        )}

        {/* Status Messages */}
        <div aria-live="assertive" aria-atomic="true" className="mb-4">
          {errorMessage && authStatus === "error" && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2 text-xs text-rose-600 dark:text-rose-300 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500 dark:text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && authStatus === "success" && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2 text-xs text-emerald-600 dark:text-emerald-300 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500 dark:text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          {successMessage && authStatus === "idle" && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2 text-xs text-emerald-600 dark:text-emerald-300 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500 dark:text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {/* Email */}
          <div className="space-y-1.5">
            <label
              htmlFor="admin-email"
              className="text-xs font-semibold text-foreground"
            >
              Admin Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                ref={emailRef}
                id="admin-email"
                type="email"
                required
                placeholder="admin@vyrapulse.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError(null);
                }}
                aria-invalid={!!emailError}
                aria-describedby={emailError ? "admin-email-error" : undefined}
                className={`w-full pl-10 pr-4 py-3 text-sm rounded-xl border bg-surface/80 dark:bg-surface text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#00FF66]/40 focus:border-[#00FF66]/60 transition-all ${
                  emailError
                    ? "border-rose-500/60"
                    : "border-neutral-300 dark:border-white/10"
                }`}
              />
            </div>
            {emailError && (
              <p
                id="admin-email-error"
                className="text-[11px] text-rose-500 mt-0.5"
              >
                {emailError}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label
              htmlFor="admin-password"
              className="text-xs font-semibold text-foreground"
            >
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                required
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError(null);
                }}
                aria-invalid={!!passwordError}
                aria-describedby={
                  passwordError ? "admin-password-error" : undefined
                }
                className={`w-full pl-10 pr-12 py-3 text-sm rounded-xl border bg-surface/80 dark:bg-surface text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#00FF66]/40 focus:border-[#00FF66]/60 transition-all ${
                  passwordError
                    ? "border-rose-500/60"
                    : "border-neutral-300 dark:border-white/10"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors"
                aria-label={
                  showPassword ? "Hide password" : "Show password"
                }
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {passwordError && (
              <p
                id="admin-password-error"
                className="text-[11px] text-rose-500 mt-0.5"
              >
                {passwordError}
              </p>
            )}
          </div>

          {/* Remember me + Forgot Password */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-neutral-400 dark:border-white/20 bg-surface text-[#00FF66] focus:ring-[#00FF66]/40 accent-[#00FF66] cursor-pointer"
              />
              <span className="text-xs text-muted-foreground">
                Remember me
              </span>
            </label>
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-xs text-[#00FF66] hover:underline transition-colors font-medium"
            >
              Forgot password?
            </button>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={authStatus === "loading" || authStatus === "success"}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-xl bg-[#00FF66] text-black font-bold text-sm transition-all duration-200 hover:bg-[#00e65c] shadow-[0_0_20px_-5px_rgba(0,255,102,0.4)] hover:shadow-[0_0_30px_-5px_rgba(0,255,102,0.6)] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#00FF66]/60"
          >
            {authStatus === "loading" ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : authStatus === "success" ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Redirecting...</span>
              </>
            ) : (
              <>
                <span>Sign In to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Security Notice */}
        <div className="mt-6 flex items-center gap-2 text-[11px] text-muted-foreground">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Secure access for authorized administrators only.</span>
        </div>

        {/* Back to Home */}
        <div className="mt-4 pt-4 border-t border-border/40">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-[#00FF66] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to home
          </Link>
        </div>
      </div>

      {/* Right Panel — Artwork & Feature List */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden items-center justify-center bg-black">
        {/* Background Image */}
        <Image
          src="/assets/branding/admin-login-bg.jpg"
          alt="Vyra Pulse Admin Portal"
          fill
          sizes="(min-width: 1024px) 60vw"
          className="object-cover opacity-60"
          priority
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-black/30 z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 z-10" />

        {/* Content Overlay */}
        <div className="relative z-20 max-w-lg px-10 space-y-8">
          {/* Brand Badge */}
          <div className="space-y-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative w-14 h-14 rounded-2xl overflow-hidden border border-[#00FF66]/40 shadow-[0_0_20px_rgba(0,255,102,0.2)]">
                <Image
                  src={BRAND_ASSETS.logo}
                  alt="Vyra Pulse"
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-white tracking-tight">
                  VYRA{" "}
                  <span className="text-[#00FF66] drop-shadow-[0_0_12px_rgba(0,255,102,0.5)]">
                    PULSE
                  </span>
                </h2>
                <span className="text-[10px] tracking-[0.2em] uppercase text-white/50 font-mono font-bold">
                  Admin Portal
                </span>
              </div>
            </div>
          </div>

          {/* Tagline */}
          <div className="space-y-3">
            <h3 className="text-4xl font-extrabold text-white tracking-tight leading-tight">
              TRACK.{" "}
              <span className="text-[#00FF66] drop-shadow-[0_0_10px_rgba(0,255,102,0.3)]">
                MANAGE.
              </span>{" "}
              GROW.
            </h3>
            <p className="text-sm text-white/60 leading-relaxed max-w-sm">
              Complete control of your business, in real time.
            </p>
          </div>

          {/* Feature List */}
          <div className="space-y-2.5">
            {ADMIN_FEATURES.map((feat) => (
              <div
                key={feat.label}
                className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[#00FF66]/20 bg-black/40 backdrop-blur-sm hover:border-[#00FF66]/40 hover:bg-[#00FF66]/5 transition-all duration-200 group"
              >
                <div className="w-8 h-8 rounded-lg bg-[#00FF66]/10 flex items-center justify-center text-[#00FF66] group-hover:bg-[#00FF66]/20 transition-colors">
                  <feat.icon className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium text-white/90 flex-1">
                  {feat.label}
                </span>
                <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-[#00FF66] transition-colors" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-[#00FF66]" />
            <p className="text-xs text-muted-foreground">
              Loading admin portal...
            </p>
          </div>
        </div>
      }
    >
      <AdminLoginForm />
    </Suspense>
  );
}
