"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  ShoppingCart,
  Filter,
  RefreshCw,
  ChevronDown,
  Eye,
  Package,
  AlertCircle,
  Loader2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { Order, OrderStatus, PaymentStatus } from "@/lib/types";

// ─── Realistic demo dataset derived from data/orders.csv ─────────────────────────
const DEMO_ORDERS: Order[] = [
  { id: "d1", customer_id: "c1", order_code: "ORD-001", order_status: "delivered", payment_status: "paid", subtotal: 447, discount_amount: 0, delivery_fee: 0, total_amount: 447, delivery_city: "Mumbai", delivery_state: "Maharashtra", offer_code: null, notes: null, created_at: "2026-09-15T10:22:00Z", updated_at: "2026-09-17T14:00:00Z", customers: { full_name: "Aarav Sharma", email: "aarav@gmail.com", city: "Mumbai" } },
  { id: "d2", customer_id: "c2", order_code: "ORD-002", order_status: "shipped", payment_status: "paid", subtotal: 596, discount_amount: 0, delivery_fee: 0, total_amount: 596, delivery_city: "Bengaluru", delivery_state: "Karnataka", offer_code: "VPULSE10", notes: null, created_at: "2026-09-20T09:10:00Z", updated_at: "2026-09-21T12:00:00Z", customers: { full_name: "Priya Nair", email: "priya@gmail.com", city: "Bengaluru" } },
  { id: "d3", customer_id: "c3", order_code: "ORD-003", order_status: "processing", payment_status: "pending", subtotal: 298, discount_amount: 0, delivery_fee: 50, total_amount: 348, delivery_city: "Chennai", delivery_state: "Tamil Nadu", offer_code: null, notes: null, created_at: "2026-10-01T16:45:00Z", updated_at: "2026-10-01T16:45:00Z", customers: { full_name: "Kartik Mehta", email: "kartik@gmail.com", city: "Chennai" } },
  { id: "d4", customer_id: "c4", order_code: "ORD-004", order_status: "cancelled", payment_status: "refunded", subtotal: 149, discount_amount: 0, delivery_fee: 50, total_amount: 199, delivery_city: "Delhi", delivery_state: "Delhi", offer_code: null, notes: null, created_at: "2026-10-05T08:30:00Z", updated_at: "2026-10-06T10:00:00Z", customers: { full_name: "Ananya Singh", email: "ananya@gmail.com", city: "Delhi" } },
  { id: "d5", customer_id: "c5", order_code: "ORD-005", order_status: "pending", payment_status: "pending", subtotal: 745, discount_amount: 50, delivery_fee: 0, total_amount: 695, delivery_city: "Hyderabad", delivery_state: "Telangana", offer_code: "FLAT50", notes: null, created_at: "2026-10-15T20:10:00Z", updated_at: "2026-10-15T20:10:00Z", customers: { full_name: "Rahul Verma", email: "rahul@gmail.com", city: "Hyderabad" } },
  { id: "d6", customer_id: "c6", order_code: "ORD-006", order_status: "delivered", payment_status: "paid", subtotal: 596, discount_amount: 0, delivery_fee: 0, total_amount: 596, delivery_city: "Mysuru", delivery_state: "Karnataka", offer_code: null, notes: null, created_at: "2026-08-24T20:27:00Z", updated_at: "2026-08-26T14:00:00Z", customers: { full_name: "Ishaan Das", email: "ishaan@example.com", city: "Mysuru" } },
  { id: "d7", customer_id: "c7", order_code: "ORD-007", order_status: "delivered", payment_status: "paid", subtotal: 894, discount_amount: 89.4, delivery_fee: 0, total_amount: 804.6, delivery_city: "Salem", delivery_state: "Tamil Nadu", offer_code: "VPULSE10", notes: null, created_at: "2026-08-24T11:57:00Z", updated_at: "2026-08-27T10:00:00Z", customers: { full_name: "Diya Sharma", email: "diya@example.com", city: "Salem" } },
  { id: "d8", customer_id: "c8", order_code: "ORD-008", order_status: "shipped", payment_status: "paid", subtotal: 447, discount_amount: 0, delivery_fee: 0, total_amount: 447, delivery_city: "Madurai", delivery_state: "Tamil Nadu", offer_code: null, notes: null, created_at: "2026-08-31T13:53:00Z", updated_at: "2026-09-02T11:00:00Z", customers: { full_name: "Divya Sharma", email: "divya@example.com", city: "Madurai" } },
  { id: "d9", customer_id: "c9", order_code: "ORD-009", order_status: "processing", payment_status: "paid", subtotal: 596, discount_amount: 0, delivery_fee: 0, total_amount: 596, delivery_city: "Coimbatore", delivery_state: "Tamil Nadu", offer_code: null, notes: null, created_at: "2026-08-25T22:29:00Z", updated_at: "2026-08-25T22:29:00Z", customers: { full_name: "Arjun Gupta", email: "arjun.g@example.com", city: "Coimbatore" } },
  { id: "d10", customer_id: "c10", order_code: "ORD-010", order_status: "cancelled", payment_status: "refunded", subtotal: 447, discount_amount: 0, delivery_fee: 0, total_amount: 447, delivery_city: "Tiruppur", delivery_state: "Tamil Nadu", offer_code: null, notes: null, created_at: "2026-09-26T13:15:00Z", updated_at: "2026-09-27T10:00:00Z", customers: { full_name: "Aadhya Nair", email: "aadhya@example.com", city: "Tiruppur" } },
  { id: "d11", customer_id: "c11", order_code: "ORD-011", order_status: "delivered", payment_status: "paid", subtotal: 298, discount_amount: 0, delivery_fee: 50, total_amount: 348, delivery_city: "Kochi", delivery_state: "Kerala", offer_code: null, notes: null, created_at: "2026-08-17T21:06:00Z", updated_at: "2026-08-20T16:00:00Z", customers: { full_name: "Kavya Menon", email: "kavya@example.com", city: "Kochi" } },
  { id: "d12", customer_id: "c12", order_code: "ORD-012", order_status: "pending", payment_status: "pending", subtotal: 447, discount_amount: 0, delivery_fee: 0, total_amount: 447, delivery_city: "Bengaluru", delivery_state: "Karnataka", offer_code: null, notes: null, created_at: "2026-10-16T18:30:00Z", updated_at: "2026-10-16T18:30:00Z", customers: { full_name: "Rohan Patel", email: "rohan@example.com", city: "Bengaluru" } },
];

const ORDER_STATUS_STYLES: Record<OrderStatus, string> = {
  pending: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  processing: "bg-sky-500/10 text-sky-400 border-sky-500/30",
  shipped: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  delivered: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  cancelled: "bg-rose-500/10 text-rose-400 border-rose-500/30",
};

const PAYMENT_STATUS_STYLES: Record<PaymentStatus, string> = {
  pending: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  paid: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  failed: "bg-rose-500/10 text-rose-400 border-rose-500/30",
  refunded: "bg-purple-500/10 text-purple-400 border-purple-500/30",
};

type SortField = "date" | "total" | "code";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDesc, setSortDesc] = useState(true);

  const loadOrders = useCallback(async () => {
    setIsLoading(true);

    const supabase = createClient();
    if (!supabase || !isSupabaseConfigured()) {
      // Include any demo orders created during user checkout
      let combined = [...DEMO_ORDERS];
      try {
        const stored = localStorage.getItem("vyra_demo_orders");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            const mapped = parsed.map((p: any) => ({
              id: p.id,
              customer_id: p.customer_id,
              order_code: p.order_code,
              order_status: p.order_status,
              payment_status: p.payment_status,
              subtotal: p.subtotal,
              discount_amount: p.discount_amount,
              delivery_fee: p.delivery_fee,
              total_amount: p.total_amount,
              delivery_city: p.delivery_city,
              delivery_state: p.delivery_state,
              offer_code: p.offer_code,
              notes: null,
              created_at: p.created_at,
              updated_at: p.created_at,
              customers: {
                full_name: p.recipient_name || "Vyra Customer",
                email: p.customer_email || "customer@vyrapulse.com",
                city: p.delivery_city,
              },
            }));
            combined = [...mapped, ...DEMO_ORDERS];
          }
        }
      } catch (e) {
        console.warn("Could not read local demo orders", e);
      }

      setOrders(combined);
      setIsDemo(true);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          customers (full_name, email, city)
        `)
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) throw error;
      setOrders((data as Order[]) ?? []);
      setIsDemo(false);
    } catch {
      setOrders(DEMO_ORDERS);
      setIsDemo(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // ─── Filter & Sort Orders ───────────────────────────────────────────
  const filtered = orders
    .filter((o) => {
      // 1. Status Filter
      if (statusFilter !== "all") {
        if (o.order_status?.toLowerCase() !== statusFilter.toLowerCase()) {
          return false;
        }
      }

      // 2. Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = o.order_code?.toLowerCase().includes(q);
        const matchName = o.customers?.full_name?.toLowerCase().includes(q) ?? false;
        const matchEmail = o.customers?.email?.toLowerCase().includes(q) ?? false;
        const matchCity = (o.delivery_city ?? "").toLowerCase().includes(q);
        const matchOffer = (o.offer_code ?? "").toLowerCase().includes(q);
        if (!matchCode && !matchName && !matchEmail && !matchCity && !matchOffer) {
          return false;
        }
      }

      return true;
    })
    .sort((a, b) => {
      if (sortField === "total") {
        const diff = Number(a.total_amount) - Number(b.total_amount);
        return sortDesc ? -diff : diff;
      }
      if (sortField === "code") {
        const cmp = a.order_code.localeCompare(b.order_code);
        return sortDesc ? -cmp : cmp;
      }
      // Default: sort by Date
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortDesc ? dateB - dateA : dateA - dateB;
    });

  const totalRevenue = orders
    .filter((o) => o.payment_status === "paid")
    .reduce((s, o) => s + Number(o.total_amount), 0);

  const handleToggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDesc(!sortDesc);
    } else {
      setSortField(field);
      setSortDesc(true);
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-5rem)]">
      <AdminSidebar />

      <div className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/40 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-extrabold text-foreground">Order Management</h1>
              {isDemo && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400">
                  DEMO DATA
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Live status tracking, address details, and financial reconciliation.
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            className="gap-2 text-xs"
            onClick={loadOrders}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </Button>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Orders", value: orders.length, color: "text-foreground" },
            { label: "Delivered", value: orders.filter((o) => o.order_status === "delivered").length, color: "text-emerald-400" },
            { label: "Cancelled", value: orders.filter((o) => o.order_status === "cancelled").length, color: "text-rose-400" },
            { label: "Paid Revenue", value: `₹${totalRevenue.toLocaleString("en-IN")}`, color: "text-[#00FF66]" },
          ].map((kpi) => (
            <Card key={kpi.label} className="p-4 border-white/10 space-y-1">
              <p className="text-[11px] text-muted-foreground">{kpi.label}</p>
              <p className={`text-xl font-extrabold ${kpi.color}`}>{kpi.value}</p>
            </Card>
          ))}
        </div>

        {/* Filters & Sorting Controls */}
        <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search order, customer, city..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-white/10 bg-surface text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#00FF66]/40 transition-all"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto">
            {/* Status Filter Pills */}
            <div className="flex items-center gap-1.5 p-1 bg-surface-elevated rounded-xl border border-border/60">
              {["all", "pending", "processing", "shipped", "delivered", "cancelled"].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`text-xs px-3 py-1 rounded-lg font-semibold transition-all capitalize ${
                    statusFilter === s
                      ? "bg-[#00FF66] text-black shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {s === "all" ? "All Status" : s}
                </button>
              ))}
            </div>

            {/* Quick Sort Toggle Button */}
            <button
              onClick={() => {
                setSortField("date");
                setSortDesc(!sortDesc);
              }}
              title="Click to toggle Newest / Oldest"
              className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border border-white/10 bg-surface hover:border-[#00FF66]/50 text-foreground transition-all"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-[#00FF66]" />
              <span className="font-medium">
                {sortField === "date" ? (sortDesc ? "Newest First" : "Oldest First") : "Reset Date Sort"}
              </span>
            </button>
          </div>
        </div>

        {/* Active Filter Summary Strip */}
        {(statusFilter !== "all" || searchQuery.trim()) && (
          <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/20 px-3 py-1.5 rounded-lg border border-border/30">
            <span>
              Showing <strong className="text-foreground">{filtered.length}</strong> matching orders
              {statusFilter !== "all" && <> with status <span className="text-[#00FF66] font-bold uppercase">{statusFilter}</span></>}
              {searchQuery.trim() && <> containing &ldquo;<span className="text-foreground">{searchQuery}</span>&rdquo;</>}
            </span>
            <button
              onClick={() => {
                setStatusFilter("all");
                setSearchQuery("");
              }}
              className="text-[11px] text-[#00FF66] hover:underline"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Orders Table */}
        <Card className="border-white/10 overflow-hidden">
          {isLoading ? (
            <div className="p-12 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-[#00FF66]" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <ShoppingCart className="w-8 h-8 text-muted-foreground mx-auto" />
              <p className="text-sm font-semibold text-foreground">No orders found</p>
              <p className="text-xs text-muted-foreground">
                No orders match status &ldquo;{statusFilter}&rdquo; {searchQuery ? `and query "${searchQuery}"` : ""}.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setStatusFilter("all");
                  setSearchQuery("");
                }}
                className="text-xs"
              >
                Clear Filter
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider bg-muted/30">
                    <th
                      onClick={() => handleToggleSort("code")}
                      className="text-left px-4 py-3 cursor-pointer hover:text-foreground transition-colors"
                    >
                      <div className="flex items-center gap-1">
                        <span>Order</span>
                        {sortField === "code" && (sortDesc ? <ArrowDown className="w-3 h-3 text-[#00FF66]" /> : <ArrowUp className="w-3 h-3 text-[#00FF66]" />)}
                      </div>
                    </th>
                    <th className="text-left px-4 py-3">Customer</th>
                    <th className="text-left px-4 py-3">City</th>
                    <th className="text-left px-4 py-3">Status</th>
                    <th className="text-left px-4 py-3">Payment</th>
                    <th
                      onClick={() => handleToggleSort("total")}
                      className="text-right px-4 py-3 cursor-pointer hover:text-foreground transition-colors"
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>Total</span>
                        {sortField === "total" && (sortDesc ? <ArrowDown className="w-3 h-3 text-[#00FF66]" /> : <ArrowUp className="w-3 h-3 text-[#00FF66]" />)}
                      </div>
                    </th>
                    <th
                      onClick={() => handleToggleSort("date")}
                      className="text-left px-4 py-3 cursor-pointer hover:text-foreground transition-colors"
                    >
                      <div className="flex items-center gap-1">
                        <span>Date</span>
                        {sortField === "date" && (sortDesc ? <ArrowDown className="w-3 h-3 text-[#00FF66]" /> : <ArrowUp className="w-3 h-3 text-[#00FF66]" />)}
                      </div>
                    </th>
                    <th className="text-left px-4 py-3">Offer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filtered.map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-white/[0.03] transition-colors group"
                    >
                      <td className="px-4 py-3.5">
                        <span className="font-mono text-xs text-[#00FF66] font-bold">
                          {order.order_code}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div>
                          <p className="font-medium text-foreground text-xs">
                            {order.customers?.full_name ?? "—"}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {order.customers?.email ?? ""}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-muted-foreground">
                        {order.delivery_city ?? "—"}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase ${
                            ORDER_STATUS_STYLES[order.order_status] || "bg-muted text-muted-foreground"
                          }`}
                        >
                          {order.order_status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase ${
                            PAYMENT_STATUS_STYLES[order.payment_status] || "bg-muted text-muted-foreground"
                          }`}
                        >
                          {order.payment_status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold text-foreground font-mono">
                        ₹{Number(order.total_amount).toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3.5 text-[11px] text-muted-foreground font-mono">
                        {new Date(order.created_at).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3.5">
                        {order.offer_code ? (
                          <span className="text-[10px] font-mono text-[#00FF66] bg-[#00FF66]/10 px-2 py-0.5 rounded-full border border-[#00FF66]/20">
                            {order.offer_code}
                          </span>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {filtered.length > 0 && (
          <p className="text-xs text-muted-foreground text-right font-mono">
            Showing {filtered.length} of {orders.length} orders
          </p>
        )}
      </div>
    </div>
  );
}
