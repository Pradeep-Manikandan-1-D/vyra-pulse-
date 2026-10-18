"use client";

import React, { useState, useEffect, Suspense, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  UserCircle2,
} from "lucide-react";
import { BRAND_ASSETS } from "@/lib/constants";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

type AuthStatus = "idle" | "loading" | "success" | "error";

function CustomerLoginForm() {
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
      setErrorMessage("Please log in to continue.");
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
      setEmailError("Enter a valid email address.");
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
    if (supabase && isConfigured) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setErrorMessage(
            error.message === "Invalid login credentials"
              ? "Invalid email or password."
              : error.message
          );
          setAuthStatus("error");
          return;
        }
        if (data.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", data.user.id)
            .single();
          if (profile?.role !== "customer") {
            await supabase.auth.signOut();
            setErrorMessage("This account is not a customer account.");
            setAuthStatus("error");
            return;
          }
          setSuccessMessage("Login successful. Redirecting…");
          setAuthStatus("success");
          const redirectUrl = searchParams.get("redirect") || "/shop";
          setTimeout(() => { router.push(redirectUrl); router.refresh(); }, 800);
        }
      } catch (err: unknown) {
        setErrorMessage(err instanceof Error ? err.message : "Unexpected error.");
        setAuthStatus("error");
      }
      return;
    }

    // Local dev fallback
    setTimeout(() => {
      if (email.toLowerCase() === "demo.customer@example.com") {
        localStorage.setItem("vyra-dev-auth", JSON.stringify({
          id: "dev-cust-uuid", email: "demo.customer@example.com",
          role: "customer", display_name: "Demo Customer",
        }));
        setSuccessMessage("Login successful. Redirecting…");
        setAuthStatus("success");
        const redirectUrl = searchParams.get("redirect") || "/shop";
        setTimeout(() => { router.push(redirectUrl); router.refresh(); }, 800);
      } else {
        setErrorMessage("Invalid credentials. (Dev: use demo.customer@example.com)");
        setAuthStatus("error");
      }
    }, 600);
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setEmailError("Enter your email first to receive a reset link.");
      emailRef.current?.focus();
      return;
    }
    const supabase = createClient();
    if (supabase && isConfigured) {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/customer/login`,
        });
        if (error) { setErrorMessage(error.message); setAuthStatus("error"); }
        else { setSuccessMessage("Reset link sent if email exists."); setAuthStatus("idle"); }
      } catch { setErrorMessage("Failed to send reset link."); setAuthStatus("error"); }
    } else {
      setSuccessMessage("Password reset available when Supabase is configured.");
    }
  };

  const handleGuestContinue = () => {
    router.push("/shop");
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black flex flex-col">
      {/* Full-screen background image */}
      <Image
        src="/assets/branding/customer-login-bg.jpg"
        alt="Vyra Pulse Customer Portal"
        fill
        priority
        sizes="100vw"
        className="object-cover object-center opacity-80"
      />
      {/* Dark overlay – heavier on left, lighter on right */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/20 z-10" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/40 z-10" />

      {/* ── Top bar ── */}
      <div className="relative z-20 flex items-center justify-between px-8 pt-6">
        {/* Back to portal */}
        <Link
          href="/"
          className="text-xs text-white/50 hover:text-white transition-colors font-mono tracking-wider"
        >
          ← Back
        </Link>

        {/* Logo – centered */}
        <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center gap-1">
          <div className="flex items-center gap-2">
            <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-[#00FF66]/40 shadow-[0_0_12px_rgba(0,255,102,0.25)]">
              <Image src={BRAND_ASSETS.logo} alt="Vyra Pulse" fill sizes="40px" className="object-cover" />
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-white">
              VYRA <span className="text-[#00FF66] drop-shadow-[0_0_10px_rgba(0,255,102,0.5)]">PULSE</span>
            </span>
          </div>
          <span className="text-[9px] tracking-[0.3em] uppercase text-white/40 font-mono">
            Own The Next Hour · Energy Drink
          </span>
        </div>

        {/* Theme Toggle */}
        <ThemeToggle />
      </div>

      {/* Tagline */}
      <div className="relative z-20 text-center mt-4">
        <p className="text-base sm:text-lg font-semibold text-white">
          Feel the Beat.{" "}
          <span className="text-[#00FF66] font-extrabold drop-shadow-[0_0_8px_rgba(0,255,102,0.4)]">
            Own the Heat.
          </span>
        </p>
      </div>

      {/* ── Main Content ── */}
      <div className="relative z-20 flex flex-1 items-center px-6 sm:px-10 lg:px-20 py-10">
        {/* Login Card */}
        <div className="w-full max-w-sm">
          {/* Card */}
          <div className="rounded-2xl border border-[#00FF66]/20 bg-black/70 backdrop-blur-xl p-8 shadow-2xl space-y-5">
            {/* Heading */}
            <div className="space-y-1">
              <h1 className="text-3xl font-extrabold text-white">
                Customer{" "}
                <span className="text-[#00FF66] drop-shadow-[0_0_8px_rgba(0,255,102,0.4)]">Login</span>
              </h1>
              <p className="text-sm text-white/50">Welcome back. Your next hour starts here.</p>
            </div>

            {/* Status Messages */}
            <div aria-live="assertive" aria-atomic="true">
              {errorMessage && authStatus === "error" && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2 text-xs text-rose-300 animate-in fade-in duration-200">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  <span>{errorMessage}</span>
                </div>
              )}
              {successMessage && (authStatus === "success" || authStatus === "idle") && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2 text-xs text-emerald-300 animate-in fade-in duration-200">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                  <span>{successMessage}</span>
                </div>
              )}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {/* Email */}
              <div className="space-y-1">
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                  <input
                    ref={emailRef}
                    id="customer-email"
                    type="email"
                    required
                    placeholder="Email or Phone Number"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setEmailError(null); }}
                    aria-invalid={!!emailError}
                    className={`w-full pl-10 pr-4 py-3 text-sm rounded-xl border bg-white/5 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#00FF66]/40 focus:border-[#00FF66]/60 transition-all ${
                      emailError ? "border-rose-500/60" : "border-white/15 hover:border-white/25"
                    }`}
                  />
                </div>
                {emailError && <p className="text-[11px] text-rose-400">{emailError}</p>}
              </div>

              {/* Password */}
              <div className="space-y-1">
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                  <input
                    id="customer-password"
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setPasswordError(null); }}
                    aria-invalid={!!passwordError}
                    className={`w-full pl-10 pr-12 py-3 text-sm rounded-xl border bg-white/5 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#00FF66]/40 focus:border-[#00FF66]/60 transition-all ${
                      passwordError ? "border-rose-500/60" : "border-white/15 hover:border-white/25"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 p-1 rounded transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordError && <p className="text-[11px] text-rose-400">{passwordError}</p>}
              </div>

              {/* Remember + Forgot */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 bg-white/5 accent-[#00FF66] cursor-pointer"
                  />
                  <span className="text-xs text-white/50">Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs text-[#00FF66] underline underline-offset-2 hover:text-[#00FF66]/80 transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={authStatus === "loading" || authStatus === "success"}
                className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-xl bg-[#00FF66] text-black font-extrabold text-sm transition-all duration-200 hover:bg-[#00e65c] shadow-[0_0_25px_-5px_rgba(0,255,102,0.5)] hover:shadow-[0_0_35px_-5px_rgba(0,255,102,0.7)] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#00FF66]/60"
              >
                {authStatus === "loading" ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /><span>Signing in…</span></>
                ) : authStatus === "success" ? (
                  <><CheckCircle2 className="w-4 h-4" /><span>Redirecting…</span></>
                ) : (
                  <><span>Sign In</span><ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>

            {/* OR divider */}
            <div className="relative flex items-center gap-3">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-[11px] text-white/30 font-mono tracking-widest">OR</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Continue as Guest */}
            <button
              type="button"
              onClick={handleGuestContinue}
              className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl border border-white/15 bg-white/5 text-white/70 font-semibold text-sm hover:bg-white/10 hover:text-white hover:border-white/25 transition-all duration-200 active:scale-[0.98]"
            >
              <UserCircle2 className="w-4 h-4" />
              Continue as Guest
            </button>

            {/* Create Account */}
            <p className="text-center text-xs text-white/40">
              New to Vyra Pulse?{" "}
              <Link href="/customer/register" className="text-[#00FF66] underline underline-offset-2 hover:text-[#00FF66]/80 font-semibold">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CustomerLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-black">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-[#00FF66]" />
            <p className="text-xs text-white/40">Loading customer portal…</p>
          </div>
        </div>
      }
    >
      <CustomerLoginForm />
    </Suspense>
  );
}
