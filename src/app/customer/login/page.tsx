"use client";

import React, { useState, useEffect, Suspense, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  UserCircle2,
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
  UserPlus,
  LogIn,
} from "lucide-react";
import { BRAND_ASSETS } from "@/lib/constants";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useAuth } from "@/components/auth/AuthProvider";
import { verifyCustomerCredentials } from "@/lib/customer/data";

type AuthStatus = "idle" | "loading" | "success" | "error";
type AuthMode = "login" | "register";

function CustomerLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [authStatus, setAuthStatus] = useState<AuthStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [fullNameError, setFullNameError] = useState<string | null>(null);
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
    setFullNameError(null);
    setEmailError(null);
    setPasswordError(null);

    if (authMode === "register" && !fullName.trim()) {
      setFullNameError("Full name is required.");
      valid = false;
    }

    const trimmed = email.trim();
    if (!trimmed) {
      setEmailError(isConfigured ? "Registered email address is required." : "Email address or Customer ID is required.");
      valid = false;
    } else if (isConfigured && !trimmed.includes("@")) {
      setEmailError("Please enter your registered email address to sign in.");
      valid = false;
    } else if (trimmed.includes("@") && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailError("Please enter a valid email address.");
      valid = false;
    }

    if (!password.trim()) {
      setPasswordError("Password is required.");
      valid = false;
    } else if (authMode === "register" && password.trim().length < 6) {
      setPasswordError("Password must be at least 6 characters in length.");
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

    // ─── REGISTER FLOW ────────────────────────────────────────────────────────
    if (authMode === "register") {
      if (!supabase || !isConfigured) {
        if (process.env.NODE_ENV === "production") {
          setErrorMessage("Registration is unavailable: Supabase authentication service is not configured.");
          setAuthStatus("error");
          return;
        }
        // Local demo registration
        const demoCustId = `CUST-${Math.floor(Math.random() * 9000 + 1000)}`;
        login(
          { id: demoCustId, email: email.trim() } as any,
          {
            id: demoCustId,
            role: "customer",
            display_name: fullName.trim(),
            customer_id: demoCustId,
          }
        );
        setSuccessMessage("Account created in demo mode! Redirecting…");
        setAuthStatus("success");
        setTimeout(() => router.push(searchParams.get("redirect") || "/account"), 1000);
        return;
      }

      try {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password: password.trim(),
          options: {
            data: {
              full_name: fullName.trim(),
              role: "customer", // Server trigger also strictly enforces 'customer'
            },
          },
        });

        if (signUpError) {
          setErrorMessage(signUpError.message);
          setAuthStatus("error");
          return;
        }

        if (signUpData.session && signUpData.user) {
          // Immediately signed in (if auto-confirm enabled)
          const { data: custRecord } = await supabase
            .from("customers")
            .select("customer_id, first_name, last_name")
            .eq("user_id", signUpData.user.id)
            .maybeSingle();

          const canonicalCustomerId = custRecord?.customer_id || signUpData.user.id;

          login(signUpData.user, {
            id: signUpData.user.id,
            role: "customer",
            display_name: fullName.trim(),
            customer_id: canonicalCustomerId,
          });

          setSuccessMessage("Account created successfully! Redirecting to your dashboard…");
          setAuthStatus("success");
          router.push(searchParams.get("redirect") || "/account");
        } else {
          setSuccessMessage("Account created! Please check your email inbox to confirm your account, then sign in.");
          setAuthStatus("idle");
          setAuthMode("login");
        }
      } catch (err: unknown) {
        setErrorMessage(err instanceof Error ? err.message : "Unexpected registration error.");
        setAuthStatus("error");
      }
      return;
    }

    // ─── LOGIN FLOW ───────────────────────────────────────────────────────────
    if (!supabase || !isConfigured) {
      const res = verifyCustomerCredentials(email, password);
      if (!res.success || !res.customer) {
        setErrorMessage(res.error || "Invalid email or password.");
        setAuthStatus("error");
        return;
      }

      const cust = res.customer;
      login(
        { id: cust.customer_id, email: cust.email } as any,
        {
          id: cust.customer_id,
          role: "customer",
          display_name: cust.full_name,
          customer_id: cust.customer_id,
        }
      );

      setSuccessMessage("Login successful. Redirecting to your dashboard…");
      setAuthStatus("success");
      const redirectUrl = searchParams.get("redirect") || "/account";
      router.push(redirectUrl);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) {
        setErrorMessage(
          error.message === "Invalid login credentials"
            ? "Invalid email or password. Please verify your credentials or create an account."
            : error.message
        );
        setAuthStatus("error");
        return;
      }

      if (data.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, display_name")
          .eq("id", data.user.id)
          .single();

        if (profile?.role !== "customer") {
          await supabase.auth.signOut();
          setErrorMessage("Access Denied: This account is an administrative account. Please sign in via the Admin Portal.");
          setAuthStatus("error");
          return;
        }

        // Retrieve linked customer record using user_id
        const { data: custRecord } = await supabase
          .from("customers")
          .select("customer_id, first_name, last_name")
          .eq("user_id", data.user.id)
          .maybeSingle();

        let canonicalCustomerId = custRecord?.customer_id;
        let displayName = custRecord
          ? `${custRecord.first_name} ${custRecord.last_name}`.trim()
          : profile?.display_name || data.user.email?.split("@")[0] || "Customer";

        // If customer record was unlinked, check matching email and link
        if (!canonicalCustomerId && data.user.email) {
          const { data: emailCust } = await supabase
            .from("customers")
            .select("customer_id, first_name, last_name")
            .eq("email", data.user.email)
            .maybeSingle();

          if (emailCust) {
            canonicalCustomerId = emailCust.customer_id;
            displayName = `${emailCust.first_name} ${emailCust.last_name}`.trim();
            await supabase
              .from("customers")
              .update({ user_id: data.user.id, updated_at: new Date().toISOString() })
              .eq("customer_id", emailCust.customer_id);
          }
        }

        login(data.user, {
          id: data.user.id,
          role: "customer",
          display_name: displayName,
          customer_id: canonicalCustomerId || data.user.id,
        });

        setSuccessMessage("Login successful. Redirecting to your dashboard…");
        setAuthStatus("success");
        const redirectUrl = searchParams.get("redirect") || "/account";
        router.push(redirectUrl);
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Unexpected error occurred during login.");
      setAuthStatus("error");
    }
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
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/customer/login`,
        });
        if (error) {
          setErrorMessage(error.message);
          setAuthStatus("error");
        } else {
          setSuccessMessage("Reset link sent if the email exists in Supabase Auth.");
          setAuthStatus("idle");
        }
      } catch {
        setErrorMessage("Failed to send reset link.");
        setAuthStatus("error");
      }
    } else {
      setSuccessMessage("Password reset available when Supabase Auth is active.");
    }
  };

  const handleGuestContinue = () => {
    router.push("/shop");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground px-4 py-12 transition-colors relative">
      {/* Top Navigation Controls */}
      <div className="fixed top-5 left-5 z-30">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground neu-raised-sm px-3 py-1.5 rounded-xl transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>
      </div>

      <div className="fixed top-5 right-5 z-30">
        <ThemeToggle showLabel />
      </div>

      {/* Centered Neumorphic Card */}
      <div className="w-full max-w-md neu-card p-8 sm:p-10 rounded-3xl space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center">
          <Link href="/" className="inline-flex items-center gap-3 group mb-2">
            <div className="relative w-12 h-12 rounded-2xl neu-raised overflow-hidden p-1 flex items-center justify-center">
              <Image
                src={BRAND_ASSETS.logo}
                alt="Vyra Pulse Logo"
                width={44}
                height={44}
                className="object-contain rounded-xl"
                priority
              />
            </div>
            <div className="text-left">
              <span className="font-extrabold text-xl tracking-tight text-foreground block leading-none">
                VYRA{" "}
                <span className="text-[#00FF66] drop-shadow-[0_0_8px_rgba(0,255,102,0.4)]">
                  PULSE
                </span>
              </span>
              <span className="text-[10px] tracking-widest uppercase text-muted-foreground font-mono">
                Customer Portal
              </span>
            </div>
          </Link>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mt-3">
            Customer{" "}
            <span className="text-[#00FF66]">
              {authMode === "login" ? "Login" : "Registration"}
            </span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            {authMode === "login"
              ? "Welcome back. Access your orders, rewards, and performance subscriptions."
              : "Create your athlete performance account for exclusive perks and rewards."}
          </p>
        </div>

        {/* Tab Toggle: Sign In vs Create Account */}
        <div className="grid grid-cols-2 p-1 rounded-2xl neu-inset gap-1">
          <button
            type="button"
            onClick={() => {
              setAuthMode("login");
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-xl transition-all ${
              authMode === "login"
                ? "neu-btn text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode("register");
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-xl transition-all ${
              authMode === "register"
                ? "neu-btn text-[#00FF66] shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Create Account</span>
          </button>
        </div>

        {/* Local Preview Mode Notice */}
        {!isConfigured && (
          <div className="p-3.5 rounded-2xl neu-inset flex items-start gap-2.5 text-xs text-muted-foreground">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#00FF66]" />
            <div className="space-y-0.5 text-left">
              <p className="font-semibold text-foreground">
                Verified Local Demo Mode Active
              </p>
              <p className="text-[11px] leading-relaxed">
                Sign in with verified demo customer:
                <br />
                <code className="font-mono text-[#00FF66] font-bold">ananya0001@gmail.com</code> (or <code className="font-mono text-[#00FF66] font-bold">CUST-0001</code>) • Password: <code className="font-mono text-[#00FF66] font-bold">ananya0001</code>
              </p>
            </div>
          </div>
        )}

        {/* Status Messages */}
        <div aria-live="assertive" aria-atomic="true">
          {errorMessage && authStatus === "error" && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2 text-xs text-rose-600 dark:text-rose-300 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500 dark:text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}
          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2 text-xs text-emerald-600 dark:text-emerald-300 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500 dark:text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Full Name (Registration only) */}
          {authMode === "register" && (
            <div className="space-y-1.5 text-left">
              <label htmlFor="customer-name" className="text-xs font-semibold text-foreground">
                Full Name
              </label>
              <div className="relative">
                <UserCircle2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  id="customer-name"
                  type="text"
                  required
                  placeholder="Ananya Sharma"
                  value={fullName}
                  onChange={(e) => { setFullName(e.target.value); setFullNameError(null); }}
                  aria-invalid={!!fullNameError}
                  className={`w-full pl-10 pr-4 py-3 text-sm rounded-xl neu-inset text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00FF66] transition-all ${
                    fullNameError ? "border-rose-500/80" : ""
                  }`}
                />
              </div>
              {fullNameError && <p className="text-[11px] text-rose-500 mt-0.5">{fullNameError}</p>}
            </div>
          )}

          {/* Email or Customer ID */}
          <div className="space-y-1.5 text-left">
            <label htmlFor="customer-email" className="text-xs font-semibold text-foreground">
              {authMode === "register"
                ? "Email Address"
                : isConfigured
                ? "Registered Email Address"
                : "Email Address or Customer ID"}
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                ref={emailRef}
                id="customer-email"
                type="text"
                autoCapitalize="none"
                autoCorrect="off"
                required
                placeholder={
                  authMode === "register"
                    ? "you@example.com"
                    : isConfigured
                    ? "ananya0001@gmail.com"
                    : "ananya0001@gmail.com or CUST-0001"
                }
                value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailError(null); }}
                aria-invalid={!!emailError}
                className={`w-full pl-10 pr-4 py-3 text-sm rounded-xl neu-inset text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00FF66] transition-all ${
                  emailError ? "border-rose-500/80" : ""
                }`}
              />
            </div>
            {emailError && <p className="text-[11px] text-rose-500 mt-0.5">{emailError}</p>}
          </div>

          {/* Password */}
          <div className="space-y-1.5 text-left">
            <label htmlFor="customer-password" className="text-xs font-semibold text-foreground">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                id="customer-password"
                type={showPassword ? "text" : "password"}
                required
                placeholder={authMode === "register" ? "Minimum 6 characters" : "Enter your password"}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setPasswordError(null); }}
                aria-invalid={!!passwordError}
                className={`w-full pl-10 pr-12 py-3 text-sm rounded-xl neu-inset text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00FF66] transition-all ${
                  passwordError ? "border-rose-500/80" : ""
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {passwordError && <p className="text-[11px] text-rose-500 mt-0.5">{passwordError}</p>}
          </div>

          {/* Remember + Forgot */}
          {authMode === "login" && (
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded neu-inset accent-[#00FF66] cursor-pointer"
                />
                <span className="text-xs text-muted-foreground">Remember me</span>
              </label>
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-xs text-[#00FF66] hover:underline transition-colors font-medium"
              >
                Forgot password?
              </button>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={authStatus === "loading" || authStatus === "success"}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-xl neu-btn-primary text-black font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {authStatus === "loading" ? (
              <><Loader2 className="w-4 h-4 animate-spin" /><span>{authMode === "login" ? "Signing in…" : "Creating account…"}</span></>
            ) : authStatus === "success" ? (
              <><CheckCircle2 className="w-4 h-4" /><span>Redirecting…</span></>
            ) : authMode === "register" ? (
              <><span>Register Account</span><UserPlus className="w-4 h-4" /></>
            ) : (
              <><span>Sign In</span><ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </form>

        {/* OR Divider */}
        <div className="relative flex items-center gap-3">
          <div className="flex-1 h-px bg-border/60" />
          <span className="text-[10px] text-muted-foreground font-mono tracking-widest uppercase">Or</span>
          <div className="flex-1 h-px bg-border/60" />
        </div>

        {/* Continue as Guest */}
        <button
          type="button"
          onClick={handleGuestContinue}
          className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl neu-btn text-foreground font-semibold text-xs active:scale-[0.98] transition-all"
        >
          <UserCircle2 className="w-4 h-4 text-muted-foreground" />
          <span>Continue as Guest</span>
        </button>

        {/* Explore Storefront Direct */}
        <p className="text-center text-xs text-muted-foreground">
          Ready to order?{" "}
          <Link href="/shop" className="text-[#00FF66] hover:underline font-semibold">
            Browse Store & Flavors
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function CustomerLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-[#00FF66]" />
            <p className="text-xs text-muted-foreground">Loading customer portal…</p>
          </div>
        </div>
      }
    >
      <CustomerLoginForm />
    </Suspense>
  );
}
