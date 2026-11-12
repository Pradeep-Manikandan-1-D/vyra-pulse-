"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Save,
  CheckCircle2,
  Shield,
  Clock,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { getCustomerProfile, saveCustomerProfile, getCustomerByEmail } from "@/lib/customer/data";

export default function CustomerProfilePage() {
  const { user, profile, isLoading: authLoading } = useAuth();

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    city: "Bengaluru",
    state: "Karnataka",
    addressLine: "14/2 Indiranagar 100ft Road",
    pincode: "560038",
  });

  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    const customerCode =
      profile?.customer_id ||
      (user.email ? getCustomerByEmail(user.email)?.customer_id : null) ||
      user.id;

    const prof = getCustomerProfile(customerCode);
    setForm({
      fullName: prof.fullName,
      phone: prof.phone,
      city: prof.city,
      state: prof.state,
      addressLine: prof.addressLine,
      pincode: prof.pincode,
    });
  }, [user, profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    if (!user) {
      setIsSaving(false);
      return;
    }

    const customerCode =
      profile?.customer_id ||
      (user.email ? getCustomerByEmail(user.email)?.customer_id : null) ||
      user.id;

    const supabase = createClient();
    if (supabase && isSupabaseConfigured()) {
      try {
        await supabase
          .from("profiles")
          .update({ display_name: form.fullName })
          .eq("id", user.id);

        await supabase
          .from("customers")
          .update({
            first_name: form.fullName.split(" ")[0] || form.fullName,
            last_name: form.fullName.split(" ").slice(1).join(" ") || "",
            phone: form.phone,
            city: form.city,
            state: form.state,
            postal_code: form.pincode,
          })
          .or(`user_id.eq.${user.id},email.eq.${user.email}`);
      } catch (err) {
        console.warn("Error updating profile in Supabase:", err);
      }
    }

    // Save to isolated customer profile storage
    saveCustomerProfile(customerCode, form);

    setTimeout(() => {
      setIsSaving(false);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    }, 600);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/40 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant="default" className="text-[11px]">Customer Account</Badge>
            <span className="text-xs text-muted-foreground font-mono">
              {user?.email || "demo.customer@vyrapulse.com"}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Account & Shipping Settings
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Manage your personal contact details, verified delivery address, and account preferences.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/account/orders">
            <Button variant="secondary" size="sm" className="text-xs">
              My Orders
            </Button>
          </Link>
          <Link href="/account/wallet">
            <Button size="sm" className="text-xs">
              Pulse Wallet
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Profile Card */}
        <Card className="neu-card p-6 space-y-4 h-fit">
          <div className="neu-raised-sm w-16 h-16 rounded-full border border-primary/30 text-primary flex items-center justify-center text-xl font-bold mx-auto">
            {form.fullName.slice(0, 2).toUpperCase() || "VP"}
          </div>

          <div className="text-center space-y-1">
            <h3 className="font-bold text-foreground text-base">{form.fullName || "Vyra Athlete"}</h3>
            <p className="text-xs text-muted-foreground font-mono">{user?.email || "demo.customer@vyrapulse.com"}</p>
          </div>

          <div className="pt-2 border-t border-border/30 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Account Status</span>
              <span className="text-primary font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Active
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pulse Tier</span>
              <span className="font-bold text-foreground">Athlete Core</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Member Since</span>
              <span className="text-muted-foreground font-mono">Oct 2026</span>
            </div>
          </div>
        </Card>

        {/* Right Column: Edit Form */}
        <div className="md:col-span-2 space-y-6">
          <Card className="neu-card p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-border/30 pb-4">
              <h3 className="font-bold text-foreground flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                Personal Information
              </h3>
              {isSaved && (
                <span className="text-xs text-primary font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Details Saved!
                </span>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Full Name</label>
                  <input
                    type="text"
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    className="neu-inset w-full px-3 py-2 text-xs rounded-xl bg-surface border border-border/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all text-foreground"
                    placeholder="E.g. Rahul Sharma"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Phone Number</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="neu-inset w-full px-3 py-2 text-xs rounded-xl bg-surface border border-border/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all text-foreground"
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Account Email</label>
                <input
                  type="email"
                  value={user?.email || "demo.customer@vyrapulse.com"}
                  disabled
                  className="neu-inset w-full px-3 py-2 text-xs rounded-xl bg-surface-inset border border-border/40 text-muted-foreground cursor-not-allowed font-mono opacity-80"
                />
                <p className="text-[10px] text-muted-foreground">
                  Email is locked to your authenticated credentials.
                </p>
              </div>

              <div className="pt-4 border-t border-border/30">
                <h4 className="font-bold text-foreground text-xs flex items-center gap-2 mb-3">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  Default Delivery Address
                </h4>

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Street Address</label>
                    <input
                      type="text"
                      value={form.addressLine}
                      onChange={(e) => setForm({ ...form, addressLine: e.target.value })}
                      className="neu-inset w-full px-3 py-2 text-xs rounded-xl bg-surface border border-border/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all text-foreground"
                      placeholder="Flat / House / Building / Street"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">City</label>
                      <input
                        type="text"
                        value={form.city}
                        onChange={(e) => setForm({ ...form, city: e.target.value })}
                        className="neu-inset w-full px-3 py-2 text-xs rounded-xl bg-surface border border-border/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all text-foreground"
                        placeholder="Bengaluru"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">State</label>
                      <input
                        type="text"
                        value={form.state}
                        onChange={(e) => setForm({ ...form, state: e.target.value })}
                        className="neu-inset w-full px-3 py-2 text-xs rounded-xl bg-surface border border-border/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all text-foreground"
                        placeholder="Karnataka"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">Pincode</label>
                      <input
                        type="text"
                        value={form.pincode}
                        onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                        className="neu-inset w-full px-3 py-2 text-xs rounded-xl bg-surface border border-border/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all text-foreground font-mono"
                        placeholder="560038"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <Button type="submit" size="sm" variant="primary" disabled={isSaving} className="gap-2 text-xs">
                  <Save className="w-3.5 h-3.5" />
                  {isSaving ? "Saving..." : "Save Preferences"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
