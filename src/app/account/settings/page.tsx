"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  Sun,
  Bell,
  Shield,
  Trash2,
  Lock,
  Eye,
  EyeOff,
  Save,
  Info,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useAuth } from "@/components/auth/AuthProvider";
import { getCustomerProfile } from "@/lib/customer/data";

export default function SettingsPage() {
  const { user, profile } = useAuth();
  const customerId = (user as any)?.customer_id || (profile as any)?.customer_id || user?.id || "";

  const [notifications, setNotifications] = useState({
    orderUpdates: true,
    promotions: true,
    newsletter: false,
    rewards: true,
  });
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [saved, setSaved] = useState(false);
  const isDemoMode = true; // no .env.local → always demo

  useEffect(() => {
    const prefs = localStorage.getItem(`vyra-notif-prefs-${customerId}`);
    if (prefs) setNotifications(JSON.parse(prefs));
  }, [customerId]);

  const handleSaveNotifications = () => {
    localStorage.setItem(`vyra-notif-prefs-${customerId}`, JSON.stringify(notifications));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const authProfile = profile as any;
  const customerProfile = customerId ? getCustomerProfile(customerId) : null;
  const customerIdDisplay = authProfile?.customer_id || customerId || "—";
  const displayName = customerProfile?.fullName || authProfile?.full_name || authProfile?.name || "Vyra Customer";
  const displayEmail = customerProfile?.email || user?.email || "—";

  return (
    <div className="space-y-8 p-1">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl neu-raised flex items-center justify-center">
          <Settings className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">Manage your account preferences</p>
        </div>
      </div>

      {/* Demo mode notice */}
      {isDemoMode && (
        <div className="flex items-start gap-3 p-4 rounded-2xl neu-inset border border-amber-500/20 bg-amber-500/5">
          <Info className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-500">Demo Mode Active</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              This application is running in local demo mode. Password changes and account deletion
              require a live Supabase connection, which is not configured. Theme and notification
              preferences are saved locally in your browser.
            </p>
          </div>
        </div>
      )}

      {/* Theme Preferences */}
      <Card className="neu-card rounded-3xl p-6 space-y-5">
        <div className="flex items-center gap-2 border-b border-border/30 pb-4">
          <Sun className="w-4 h-4 text-primary" />
          <h2 className="text-base font-bold text-foreground">Appearance</h2>
        </div>

        <div>
          <p className="text-sm font-medium text-foreground mb-2">Switch Visual Theme</p>
          <p className="text-xs text-muted-foreground mb-4">
            Choose between Dark Elegant (deep charcoal with neon-lime accents) and Mint Fresh (soft mint with forest green accents).
          </p>
          <ThemeToggle variant="pill" showLabel className="w-full sm:w-auto justify-start" />
        </div>
      </Card>

      {/* Notification Preferences */}
      <Card className="neu-card rounded-3xl p-6 space-y-5">
        <div className="flex items-center gap-2 border-b border-border/30 pb-4">
          <Bell className="w-4 h-4 text-primary" />
          <h2 className="text-base font-bold text-foreground">Notifications</h2>
        </div>

        <div className="space-y-4">
          {([
            { key: "orderUpdates", label: "Order Updates", desc: "Shipping, delivery and order confirmation" },
            { key: "promotions", label: "Promotions & Offers", desc: "Exclusive deals and limited-time coupon codes" },
            { key: "rewards", label: "Rewards & Loyalty", desc: "Points earned, tier upgrades, and redemptions" },
            { key: "newsletter", label: "Newsletter", desc: "Monthly Vyra Pulse brand updates and news" },
          ] as const).map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
              <button
                type="button"
                onClick={() => setNotifications((prev) => ({ ...prev, [key]: !prev[key] }))}
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                  notifications[key] ? "bg-primary" : "bg-surface-elevated border border-border/40"
                }`}
                aria-label={`Toggle ${label}`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
                    notifications[key] ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>

        <Button
          onClick={handleSaveNotifications}
          size="sm"
          className="gap-2"
        >
          <Save className="w-4 h-4" />
          {saved ? "Saved!" : "Save Preferences"}
        </Button>
      </Card>

      {/* Change Password */}
      <Card className="neu-card rounded-3xl p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-border/30 pb-4">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary" />
            <h2 className="text-base font-bold text-foreground">Change Password</h2>
          </div>
          {isDemoMode && <Badge variant="warning">Requires Supabase</Badge>}
        </div>

        <div className="space-y-4">
          {[
            { label: "Current Password", show: showCurrentPw, toggle: () => setShowCurrentPw((v) => !v) },
            { label: "New Password", show: showNewPw, toggle: () => setShowNewPw((v) => !v) },
            { label: "Confirm New Password", show: showConfirmPw, toggle: () => setShowConfirmPw((v) => !v) },
          ].map(({ label, show, toggle }) => (
            <div key={label}>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{label}</label>
              <div className="relative">
                <input
                  type={show ? "text" : "password"}
                  disabled={isDemoMode}
                  placeholder={isDemoMode ? "Not available in demo mode" : "••••••••"}
                  className="w-full neu-inset rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 bg-transparent outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50 disabled:cursor-not-allowed pr-11"
                />
                <button
                  type="button"
                  onClick={toggle}
                  disabled={isDemoMode}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground disabled:opacity-30"
                >
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))}

          <Button size="sm" disabled={isDemoMode} className="gap-2 opacity-50 cursor-not-allowed">
            <Shield className="w-4 h-4" />
            Update Password
          </Button>

          {isDemoMode && (
            <p className="text-xs text-muted-foreground">
              Password changes are only available when Supabase Auth is configured. Add a valid{" "}
              <code className="text-primary bg-primary/10 px-1 rounded">.env.local</code> file with your
              Supabase credentials to enable this feature.
            </p>
          )}
        </div>
      </Card>

      {/* Account Info */}
      <Card className="neu-card rounded-3xl p-6 space-y-5">
        <div className="flex items-center gap-2 border-b border-border/30 pb-4">
          <Shield className="w-4 h-4 text-primary" />
          <h2 className="text-base font-bold text-foreground">Account Information</h2>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center py-2 border-b border-border/20">
            <span className="text-muted-foreground">Customer ID</span>
            <span className="font-mono font-semibold text-foreground">{customerIdDisplay}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-border/20">
            <span className="text-muted-foreground">Display Name</span>
            <span className="font-semibold text-foreground">{displayName}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-border/20">
            <span className="text-muted-foreground">Email</span>
            <span className="font-semibold text-foreground">{displayEmail}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-muted-foreground">Account Status</span>
            <Badge variant="success">Active</Badge>
          </div>
        </div>
      </Card>

      {/* Danger Zone */}
      <Card className="neu-card rounded-3xl p-6 space-y-5 border border-rose-500/20">
        <div className="flex items-center gap-2 border-b border-rose-500/20 pb-4">
          <Trash2 className="w-4 h-4 text-rose-500" />
          <h2 className="text-base font-bold text-rose-500">Danger Zone</h2>
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Delete Account</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Permanently delete your Vyra Pulse account and all associated data. This action cannot be undone.
            </p>
          </div>
          <Button
            size="sm"
            disabled={isDemoMode}
            className="gap-2 bg-rose-500/10 text-rose-500 border border-rose-500/30 hover:bg-rose-500/20 opacity-50 cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4" />
            Delete My Account
          </Button>
          {isDemoMode && (
            <p className="text-xs text-muted-foreground">Account deletion is disabled in demo mode.</p>
          )}
        </div>
      </Card>
    </div>
  );
}

