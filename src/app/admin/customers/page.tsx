"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Users,
  RefreshCw,
  Loader2,
  ShoppingBag,
  MapPin,
  Eye,
  X,
  ShieldCheck,
  Award,
  Zap,
  Clock,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
  Package,
} from "lucide-react";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  getAllCustomers,
  getCustomerOrders,
  getCustomerWallet,
  CustomerRecord,
  CustomerOrder,
  LoyaltyTx,
} from "@/lib/customer/data";

const TIER_STYLES: Record<string, string> = {
  Platinum: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  Gold: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  Silver: "bg-slate-500/10 text-slate-300 border-slate-500/30",
  Bronze: "bg-orange-500/10 text-orange-400 border-orange-500/30",
};

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<"spent" | "orders" | "name">("spent");
  const [sortDesc, setSortDesc] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Selected customer for administrative inspection view
  const [inspectingCustomer, setInspectingCustomer] = useState<CustomerRecord | null>(null);
  const [customerOrders, setCustomerOrders] = useState<CustomerOrder[]>([]);
  const [customerWallet, setCustomerWallet] = useState<{
    balance: number;
    lifetime: number;
    history: LoyaltyTx[];
  } | null>(null);
  const [inspectTab, setInspectTab] = useState<"orders" | "wallet" | "profile">("orders");

  const loadCustomers = useCallback(async () => {
    setIsLoading(true);
    const supabase = createClient();

    if (supabase && isSupabaseConfigured()) {
      try {
        // Query the canonical PostgreSQL Customer Intelligence View
        const { data, error } = await supabase
          .from("v_customer_intelligence")
          .select("*")
          .order("eligible_net_spend_inr", { ascending: false })
          .limit(600);

        if (!error && data && data.length > 0) {
          setCustomers(
            data.map((c: any) => {
              const spent = Number(c.eligible_net_spend_inr || 0);
              const tier =
                spent >= 5000 ? "Platinum" : spent >= 2500 ? "Gold" : spent >= 1000 ? "Silver" : "Bronze";
              return {
                customer_id: c.customer_id,
                customer_code: c.customer_id || "CUST",
                first_name: c.full_name?.split(" ")[0] || "",
                last_name: c.full_name?.split(" ").slice(1).join(" ") || "",
                full_name: c.full_name || "Customer",
                email: c.email || "",
                phone: "",
                city: c.city || "",
                state: c.state || "",
                postal_code: "",
                registered_at: c.registered_at || new Date().toISOString(),
                loyalty_tier: tier,
                total_orders: Number(c.order_count) || 0,
                total_spent: spent,
                initial_points: Number(c.loyalty_points_balance) || 0,
                orders: [],
              };
            })
          );
          setIsDemo(false);
          setIsLoading(false);
          return;
        }
      } catch (err) {
        console.warn("Could not query customers from Supabase:", err);
      }
    }

    // Load canonical customer directory with 600 records
    const canonical = getAllCustomers();
    setCustomers(canonical);
    setIsDemo(true);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  // Open administrative inspection drawer
  const handleInspect = (customer: CustomerRecord) => {
    setInspectingCustomer(customer);
    const orders = getCustomerOrders(customer.customer_id);
    const wallet = getCustomerWallet(customer.customer_id);
    setCustomerOrders(orders);
    setCustomerWallet(wallet);
    setInspectTab("orders");
  };

  const handleCloseInspect = () => {
    setInspectingCustomer(null);
    setCustomerOrders([]);
    setCustomerWallet(null);
  };

  // Filter & sort
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

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginatedCustomers = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

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
              <h1 className="text-2xl font-extrabold text-foreground">Customer Intelligence</h1>
              {isDemo && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400">
                  CANONICAL DIRECTORY ({customers.length})
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Searchable, paginated customer directory with administrative audit inspection.
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
            { label: "Registered Accounts", value: customers.length, color: "text-foreground" },
            { label: "Total Revenue", value: `₹${totalSpent.toLocaleString("en-IN")}`, color: "text-primary" },
            { label: "Avg. Customer Spend", value: `₹${avgSpend.toFixed(0)}`, color: "text-sky-400" },
            {
              label: "Platinum Athletes",
              value: customers.filter((c) => c.loyalty_tier === "Platinum").length,
              color: "text-purple-400",
            },
          ].map((kpi) => (
            <Card key={kpi.label} className="neu-card p-4 border-border/40 space-y-1">
              <p className="text-[11px] text-muted-foreground">{kpi.label}</p>
              <p className={`text-xl font-extrabold ${kpi.color}`}>{kpi.value}</p>
            </Card>
          ))}
        </div>

        {/* Search & Tier Filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by name, email, city, or ID..."
              className="neu-inset w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-border/40 bg-surface text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="neu-inset flex items-center gap-1 p-1 rounded-xl border border-border/40">
              {["all", "Platinum", "Gold", "Silver", "Bronze"].map((tier) => (
                <button
                  key={tier}
                  onClick={() => {
                    setTierFilter(tier);
                    setCurrentPage(1);
                  }}
                  className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-all capitalize ${
                    tierFilter === tier
                      ? "neu-btn-primary shadow-sm"
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
              className="neu-raised-sm text-xs px-3 py-1.5 rounded-xl border border-border/40 bg-surface text-foreground hover:border-primary/50 transition-all font-medium"
            >
              Spend: {sortDesc ? "Highest" : "Lowest"}
            </button>
          </div>
        </div>

        {/* Customers Table */}
        <Card className="neu-card border-border/40 overflow-hidden">
          {isLoading ? (
            <div className="p-12 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
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
                  <tr className="border-b border-border/40 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    <th className="text-left px-4 py-3">Customer</th>
                    <th className="text-left px-4 py-3">ID / Code</th>
                    <th className="text-left px-4 py-3">City & State</th>
                    <th className="text-left px-4 py-3">Loyalty Tier</th>
                    <th className="text-right px-4 py-3">Total Orders</th>
                    <th className="text-right px-4 py-3">Lifetime Spend</th>
                    <th className="text-center px-4 py-3">Admin View</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {paginatedCustomers.map((c) => (
                    <tr
                      key={c.customer_id}
                      className="hover:bg-white/[0.02] dark:hover:bg-white/[0.02] transition-colors group cursor-pointer"
                      onClick={() => handleInspect(c)}
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                            {c.first_name ? c.first_name.charAt(0).toUpperCase() : "C"}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground text-xs">{c.full_name}</p>
                            <p className="text-[11px] text-muted-foreground">{c.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-[11px] text-primary">{c.customer_code}</td>
                      <td className="px-4 py-3.5 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 shrink-0" />
                          {c.city || "—"}, {c.state || ""}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            TIER_STYLES[c.loyalty_tier] ?? "bg-white/5 text-muted-foreground border-border/40"
                          }`}
                        >
                          {c.loyalty_tier}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right font-medium text-xs text-foreground">
                        {c.total_orders}
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold text-foreground">
                        ₹{Number(c.total_spent).toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleInspect(c);
                          }}
                          className="neu-raised-sm inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-primary hover:text-black hover:bg-primary rounded-lg transition-all"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {filtered.length > pageSize && (
            <div className="flex items-center justify-between p-4 border-t border-border/40 text-xs text-muted-foreground">
              <span>
                Showing {(currentPage - 1) * pageSize + 1}–
                {Math.min(currentPage * pageSize, filtered.length)} of {filtered.length} customers
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="neu-raised-sm p-1.5 rounded-lg border border-border/40 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-mono">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="neu-raised-sm p-1.5 rounded-lg border border-border/40 disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </Card>

        {/* ─── DEDICATED ADMIN CUSTOMER INSPECTION MODAL ─── */}
        {inspectingCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
            <Card className="neu-card w-full max-w-4xl max-h-[90vh] overflow-y-auto border-border/60 p-6 md:p-8 space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between gap-4 border-b border-border/40 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      Administrative Audit View (Read-Only)
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">
                      ID: {inspectingCustomer.customer_code}
                    </span>
                  </div>
                  <h2 className="text-2xl font-extrabold text-foreground">
                    {inspectingCustomer.full_name}
                  </h2>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
                    <span className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                      {inspectingCustomer.email}
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                      {inspectingCustomer.phone}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                      {inspectingCustomer.city}, {inspectingCustomer.state}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCloseInspect}
                  className="neu-raised-sm p-2 rounded-xl border border-border/40 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* KPI Strip for this customer */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="neu-inset p-3.5 rounded-xl space-y-0.5">
                  <p className="text-[10px] uppercase font-mono text-muted-foreground">Lifetime Spend</p>
                  <p className="text-lg font-extrabold text-primary">
                    ₹{Number(inspectingCustomer.total_spent).toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="neu-inset p-3.5 rounded-xl space-y-0.5">
                  <p className="text-[10px] uppercase font-mono text-muted-foreground">Total Orders</p>
                  <p className="text-lg font-extrabold text-foreground">
                    {customerOrders.length || inspectingCustomer.total_orders}
                  </p>
                </div>
                <div className="neu-inset p-3.5 rounded-xl space-y-0.5">
                  <p className="text-[10px] uppercase font-mono text-muted-foreground">Loyalty Balance</p>
                  <p className="text-lg font-extrabold text-[#CCFF00]">
                    {customerWallet?.balance ?? 0} pts
                  </p>
                </div>
                <div className="neu-inset p-3.5 rounded-xl space-y-0.5">
                  <p className="text-[10px] uppercase font-mono text-muted-foreground">Member Status</p>
                  <span
                    className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      TIER_STYLES[inspectingCustomer.loyalty_tier] ?? "bg-white/5 text-muted-foreground"
                    }`}
                  >
                    {inspectingCustomer.loyalty_tier} Athlete
                  </span>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-2 border-b border-border/40 pb-2">
                {[
                  { id: "orders", label: `Order History (${customerOrders.length})`, icon: ShoppingBag },
                  { id: "wallet", label: `Pulse Wallet Ledger (${customerWallet?.history.length ?? 0})`, icon: Zap },
                  { id: "profile", label: "Address & Profile", icon: Users },
                ].map((t) => {
                  const Icon = t.icon;
                  const isActive = inspectTab === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setInspectTab(t.id as any)}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? "neu-btn-primary shadow-sm text-black"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Tab 1: Customer Order History */}
              {inspectTab === "orders" && (
                <div className="space-y-3">
                  {customerOrders.length === 0 ? (
                    <div className="neu-inset p-8 text-center rounded-2xl text-xs text-muted-foreground space-y-1">
                      <ShoppingBag className="w-6 h-6 mx-auto text-muted-foreground/60" />
                      <p>No orders on record for this customer yet.</p>
                    </div>
                  ) : (
                    customerOrders.map((ord) => (
                      <div
                        key={ord.id}
                        className="neu-inset p-4 rounded-xl space-y-2 border border-border/40"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-mono text-xs font-bold text-primary">
                              {ord.order_code}
                            </span>
                            <span className="text-[11px] text-muted-foreground ml-3">
                              {new Date(ord.created_at).toLocaleString("en-IN", {
                                dateStyle: "medium",
                                timeStyle: "short",
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 border border-border text-foreground uppercase">
                              {ord.order_status}
                            </span>
                            <span className="text-xs font-bold text-foreground">
                              ₹{ord.total_amount.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {/* Items snapshot */}
                        {ord.items && ord.items.length > 0 && (
                          <div className="pt-2 border-t border-border/20 text-xs text-muted-foreground space-y-1">
                            {ord.items.map((it, idx) => (
                              <div key={idx} className="flex justify-between">
                                <span>
                                  {it.quantity}x {it.flavor_snapshot || it.product_name_snapshot}
                                </span>
                                <span>₹{it.line_total.toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tab 2: Wallet & Points Ledger */}
              {inspectTab === "wallet" && (
                <div className="space-y-3">
                  <div className="neu-inset p-4 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Current Pulse Points Balance</p>
                      <p className="text-2xl font-extrabold text-primary">
                        {customerWallet?.balance ?? 0} pts
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Lifetime Points Earned</p>
                      <p className="text-base font-bold text-foreground">
                        {customerWallet?.lifetime ?? 0} pts
                      </p>
                    </div>
                  </div>

                  <p className="text-[11px] font-mono uppercase text-muted-foreground tracking-wider pt-2">
                    Reward Transaction Audit History
                  </p>

                  {customerWallet?.history.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">No reward ledger entries recorded.</p>
                  ) : (
                    customerWallet?.history.map((tx) => (
                      <div
                        key={tx.id}
                        className="neu-inset p-3 rounded-xl flex items-center justify-between text-xs border border-border/30"
                      >
                        <div className="space-y-0.5">
                          <p className="font-semibold text-foreground">{tx.description}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {new Date(tx.created_at).toLocaleString("en-IN", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </p>
                        </div>
                        <span
                          className={`font-mono font-bold ${
                            tx.transaction_type === "redeemed" ? "text-rose-400" : "text-primary"
                          }`}
                        >
                          {tx.transaction_type === "redeemed" ? "-" : "+"}
                          {tx.points} pts
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tab 3: Profile & Address */}
              {inspectTab === "profile" && (
                <div className="neu-inset p-5 rounded-2xl space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-mono">Full Name</p>
                      <p className="text-sm font-semibold text-foreground">{inspectingCustomer.full_name}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-mono">Customer Code</p>
                      <p className="text-sm font-mono text-primary">{inspectingCustomer.customer_code}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-mono">Email Address</p>
                      <p className="text-sm text-foreground">{inspectingCustomer.email}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-mono">Phone Number</p>
                      <p className="text-sm text-foreground">{inspectingCustomer.phone}</p>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-[10px] text-muted-foreground uppercase font-mono">Delivery Address</p>
                      <p className="text-sm text-foreground">
                        {inspectingCustomer.city}, {inspectingCustomer.state} - {inspectingCustomer.postal_code}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-mono">Registration Timestamp</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(inspectingCustomer.registered_at).toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Close Button */}
              <div className="pt-2 flex justify-end">
                <Button variant="secondary" size="sm" onClick={handleCloseInspect}>
                  Close Inspection
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
