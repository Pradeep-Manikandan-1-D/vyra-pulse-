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
} from "lucide-react";
import { BRAND_ASSETS } from "@/lib/constants";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useAuth } from "@/components/auth/AuthProvider";
import { verifyAdminCredentials } from "@/lib/customer/data";


type AuthStatus = "idle" | "loading" | "success" | "error";

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
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

    const trimmed = email.trim();
    if (!trimmed) {
      setEmailError("Admin email or employee ID is required.");
      valid = false;
    } else if (trimmed.includes("@") && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
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
              ? "Invalid administrator credentials. If this account is not yet provisioned in Supabase Auth, run: npx tsx scripts/provision_admin.ts"
              : error.message
          );
          setAuthStatus("error");
          return;
        }

        if (data.user) {
          // Check role from profiles table
          const { data: profile, error: profileErr } = await supabase
            .from("profiles")
            .select("role, display_name")
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

          login(data.user, {
            id: data.user.id,
            role: "admin",
            display_name: profile?.display_name || "Super Admin",
          });

          setSuccessMessage("Login successful. Redirecting to dashboard...");
          setAuthStatus("success");

          const redirectUrl = searchParams.get("redirect") || "/admin";
          router.push(redirectUrl);
        }
      } catch (err: unknown) {
        setErrorMessage(
          err instanceof Error ? err.message : "An unexpected error occurred."
        );
        setAuthStatus("error");
      }
      return;
    }

    // 2. Local development fallback with strict credential validation
    const check = verifyAdminCredentials(email, password);
    if (!check.success) {
      setErrorMessage(check.error || "Invalid administrator email or password.");
      setAuthStatus("error");
      return;
    }

    login(
      { id: "admin-master-id", email: "admin@gmail.com" } as any,
      {
        id: "admin-master-id",
        role: "admin",
        display_name: "Super Admin",
      }
    );

    setSuccessMessage("Login successful. Redirecting to dashboard...");
    setAuthStatus("success");

    const redirectUrl = searchParams.get("redirect") || "/admin";
    router.push(redirectUrl);
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground px-4 py-12 transition-colors relative">
      {/* Top navigation controls */}
      <div className="fixed top-5 left-5 z-30">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground neu-raised-sm px-3 py-1.5 rounded-xl transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Portals</span>
        </Link>
      </div>

      <div className="fixed top-5 right-5 z-30">
        <ThemeToggle showLabel />
      </div>

      {/* Centered Neumorphic Card */}
      <div className="w-full max-w-md neu-card p-8 sm:p-10 rounded-3xl space-y-6">
        {/* Logo & Brand Header */}
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
                <span className="text-primary drop-shadow-[0_0_8px_rgba(0,255,102,0.4)]">
                  PULSE
                </span>
              </span>
              <span className="text-[10px] tracking-widest uppercase text-muted-foreground font-mono">
                Admin Portal
              </span>
            </div>
          </Link>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mt-3">
            Admin{" "}
            <span className="text-primary">
              Login
            </span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Sign in to access sales, inventory, and analytics operations.
          </p>
        </div>

        {/* Supabase Status */}
        {isConfigured ? (
          <div className="p-3.5 rounded-2xl neu-inset flex items-start gap-2.5 text-xs text-muted-foreground">
            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
            <div className="space-y-0.5 text-left">
              <p className="font-semibold text-foreground">
                Supabase Live Authentication Active
              </p>
              <p className="text-[11px] leading-relaxed">
                Please enter your verified administrator credentials.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-3.5 rounded-2xl neu-inset flex items-start gap-2.5 text-xs text-muted-foreground">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
            <div className="space-y-0.5 text-left">
              <p className="font-semibold text-foreground">
                Verified Local Preview Mode Active
              </p>
              <p className="text-[11px] leading-relaxed">
                Identity:{" "}
                <code className="bg-black/10 dark:bg-black/30 px-1 py-0.5 rounded font-mono font-bold text-primary">
                  admin@gmail.com
                </code>{" "}
                • Password:{" "}
                <code className="bg-black/10 dark:bg-black/30 px-1 py-0.5 rounded font-mono font-bold text-primary">
                  admin123
                </code>{" "}
                or{" "}
                <code className="bg-black/10 dark:bg-black/30 px-1 py-0.5 rounded font-mono font-bold text-primary">
                  admin@123!
                </code>
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
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Email or ID */}
          <div className="space-y-1.5 text-left">
            <label
              htmlFor="admin-email"
              className="text-xs font-semibold text-foreground"
            >
              Admin Email or ID
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                ref={emailRef}
                id="admin-email"
                type="text"
                autoCapitalize="none"
                autoCorrect="off"
                required
                placeholder={isConfigured ? "admin@yourdomain.com" : "admin@gmail.com or EMP-001"}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError(null);
                }}
                aria-invalid={!!emailError}
                aria-describedby={emailError ? "admin-email-error" : undefined}
                className={`w-full pl-10 pr-4 py-3 text-sm rounded-xl neu-inset text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-all ${
                  emailError
                    ? "border-rose-500/80"
                    : ""
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
          <div className="space-y-1.5 text-left">
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
                className={`w-full pl-10 pr-12 py-3 text-sm rounded-xl neu-inset text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-all ${
                  passwordError
                    ? "border-rose-500/80"
                    : ""
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
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded neu-inset accent-primary cursor-pointer"
              />
              <span className="text-xs text-muted-foreground">
                Remember me
              </span>
            </label>
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-xs text-primary hover:underline transition-colors font-medium"
            >
              Forgot password?
            </button>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={authStatus === "loading" || authStatus === "success"}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-xl neu-btn-primary text-black font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
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
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to home
          </Link>
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
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
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
