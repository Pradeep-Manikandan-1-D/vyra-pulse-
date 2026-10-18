"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Search, Users, RefreshCw, Loader2, ShoppingBag, MapPin } from "lucide-react";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { Customer } from "@/lib/types";

const DEMO_CUSTOMERS: Customer[] = [
  { id: "c1", customer_code: "CUST-0001", full_name: "Aarav Sharma", email: "aarav@gmail.com", phone: "+91-9800000001", city: "Mumbai", state: "Maharashtra", pincode: "400001", loyalty_tier: "Gold", total_orders: 8, total_spent: 1192, created_at: "2026-03-15T10:00:00Z" },
  { id: "c2", customer_code: "CUST-0002", full_name: "Priya Nair", email: "priya@gmail.com", phone: "+91-9800000002", city: "Bengaluru", state: "Karnataka", pincode: "560001", loyalty_tier: "Silver", total_orders: 5, total_spent: 745, created_at: "2026-04-20T11:00:00Z" },
  { id: "c3", customer_code: "CUST-0003", full_name: "Kartik Mehta", email: "kartik@gmail.com", phone: "+91-9800000003", city: "Chennai", state: "Tamil Nadu", pincode: "600001", loyalty_tier: "Bronze", total_orders: 2, total_spent: 298, created_at: "2026-06-10T09:30:00Z" },
  { id: "c4", customer_code: "CUST-0004", full_name: "Ananya Singh", email: "ananya@gmail.com", phone: "+91-9800000004", city: "Delhi", state: "Delhi", pincode: "110001", loyalty_tier: null, total_orders: 1, total_spent: 149, created_at: "2026-08-05T14:00:00Z" },
  { id: "c5", customer_code: "CUST-0005", full_name: "Rahul Verma", email: "rahul@gmail.com", phone: "+91-9800000005", city: "Hyderabad", state: "Telangana", pincode: "500001", loyalty_tier: "Platinum", total_orders: 15, total_spent: 2235, created_at: "2026-01-12T08:00:00Z" },
];

const TIER_STYLES: Record<string, string> = {
  Platinum: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  Gold: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  Silver: "bg-slate-500/10 text-slate-300 border-slate-500/30",
  Bronze: "bg-orange-500/10 text-orange-400 border-orange-500/30",
};

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<"spent" | "orders" | "name">("spent");
  const [sortDesc, setSortDesc] = useState(true);

  const loadCustomers = useCallback(async () => {
    setIsLoading(true);
    const supabase = createClient();
    if (!supabase || !isSupabaseConfigured()) {
      setCustomers(DEMO_CUSTOMERS);
      setIsDemo(true);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("total_spent", { ascending: false })
        .limit(200);
      if (error) throw error;
      setCustomers((data as Customer[]) ?? []);
      setIsDemo(false);
    } catch {
      setCustomers(DEMO_CUSTOMERS);
      setIsDemo(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const filtered = customers
    .filter((c) => {
      if (tierFilter !== "all" && c.loyalty_tier?.toLowerCase() !== tierFilter.toLowerCase()) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          c.full_name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.customer_code.toLowerCase().includes(q) ||
          (c.city ?? "").toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortField === "orders") {
        const diff = Number(a.total_orders) - Number(b.total_orders);
        return sortDesc ? -diff : diff;
      }
      if (sortField === "name") {
        const cmp = a.full_name.localeCompare(b.full_name);
        return sortDesc ? cmp : -cmp;
      }
      const diff = Number(a.total_spent) - Number(b.total_spent);
      return sortDesc ? -diff : diff;
    });

  const totalSpent = customers.reduce((s, c) => s + Number(c.total_spent), 0);
  const avgSpend = customers.length ? totalSpent / customers.length : 0;

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-5rem)]">
      <AdminSidebar />

      <div className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/40 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-extrabold text-foreground">Customer Directory</h1>
              {isDemo && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400">
                  DEMO DATA
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Registered customer profiles, purchase analytics, and loyalty tiers.
            </p>
          </div>
          <Button variant="secondary" size="sm" className="gap-2 text-xs" onClick={loadCustomers}>
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </Button>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Registered", value: customers.length, color: "text-foreground" },
            { label: "Total Revenue", value: `₹${totalSpent.toLocaleString("en-IN")}`, color: "text-[#00FF66]" },
            { label: "Avg. Spend", value: `₹${avgSpend.toFixed(0)}`, color: "text-sky-400" },
            { label: "Platinum Tier", value: customers.filter((c) => c.loyalty_tier === "Platinum").length, color: "text-purple-400" },
          ].map((kpi) => (
            <Card key={kpi.label} className="p-4 border-white/10 space-y-1">
              <p className="text-[11px] text-muted-foreground">{kpi.label}</p>
              <p className={`text-xl font-extrabold ${kpi.color}`}>{kpi.value}</p>
            </Card>
          ))}
        </div>

        {/* Search & Tier Filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name, email, city, or code..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-white/10 bg-surface text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#00FF66]/40 transition-all"
            />
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <div className="flex items-center gap-1 p-1 bg-surface-elevated rounded-xl border border-border/60">
              {["all", "Platinum", "Gold", "Silver", "Bronze"].map((tier) => (
                <button
                  key={tier}
                  onClick={() => setTierFilter(tier)}
                  className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-all capitalize ${
                    tierFilter === tier
                      ? "bg-[#00FF66] text-black shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tier === "all" ? "All Tiers" : tier}
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                setSortField("spent");
                setSortDesc(!sortDesc);
              }}
              title="Toggle Spend Order"
              className="text-xs px-3 py-1.5 rounded-xl border border-white/10 bg-surface text-foreground hover:border-[#00FF66]/50 transition-all font-medium"
            >
              Spend: {sortDesc ? "Highest" : "Lowest"}
            </button>
          </div>
        </div>

        {/* Table */}
        <Card className="border-white/10 overflow-hidden">
          {isLoading ? (
            <div className="p-12 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-[#00FF66]" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <Users className="w-8 h-8 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">No customers found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    <th className="text-left px-4 py-3">Customer</th>
                    <th className="text-left px-4 py-3">Code</th>
                    <th className="text-left px-4 py-3">City</th>
                    <th className="text-left px-4 py-3">Tier</th>
                    <th className="text-right px-4 py-3">Orders</th>
                    <th className="text-right px-4 py-3">Lifetime Spend</th>
                    <th className="text-left px-4 py-3">Member Since</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filtered.map((c) => (
                    <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-[#00FF66]/10 border border-[#00FF66]/20 text-[#00FF66] text-xs font-bold flex items-center justify-center shrink-0">
                            {c.full_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-foreground text-xs">{c.full_name}</p>
                            <p className="text-[11px] text-muted-foreground">{c.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-[11px] text-muted-foreground">{c.customer_code}</td>
                      <td className="px-4 py-3.5 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 shrink-0" />
                          {c.city ?? "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        {c.loyalty_tier ? (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${TIER_STYLES[c.loyalty_tier] ?? "bg-white/5 text-muted-foreground border-white/10"}`}>
                            {c.loyalty_tier}
                          </span>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <span className="flex items-center justify-end gap-1 text-xs text-foreground font-semibold">
                          <ShoppingBag className="w-3 h-3 text-muted-foreground" />
                          {c.total_orders}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold text-foreground">
                        ₹{Number(c.total_spent).toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3.5 text-[11px] text-muted-foreground">
                        {new Date(c.created_at).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
        <p className="text-xs text-muted-foreground text-right">
          {filtered.length} of {customers.length} customers
        </p>
      </div>
    </div>
  );
}
