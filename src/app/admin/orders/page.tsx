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
import { CSV_ORDERS, CSV_CUSTOMERS } from "@/lib/bi/seed-data";

// ─── Canonical orders derived dynamically from Dataset/orders.csv & customers.csv ──
const custLookup = new Map(CSV_CUSTOMERS.map((c) => [c.customer_id, c]));

const CANONICAL_ORDERS: Order[] = CSV_ORDERS.map((o) => {
  const cust = custLookup.get(o.customer_id);
  return {
    id: o.order_id,
    customer_id: o.customer_id,
    order_code: o.order_id,
    order_status: o.order_status as OrderStatus,
    payment_status: o.payment_status as PaymentStatus,
    subtotal: o.subtotal_inr,
    discount_amount: o.discount_amount_inr,
    delivery_fee: o.delivery_fee_inr,
    total_amount: o.order_total_inr,
    delivery_city: o.delivery_city,
    delivery_state: o.delivery_state,
    offer_code: null,
    notes: null,
    created_at: o.ordered_at,
    updated_at: o.ordered_at,
    customers: cust
      ? {
          full_name: `${cust.first_name} ${cust.last_name}`,
          email: cust.email,
          city: cust.city,
        }
      : {
          full_name: "Vyra Customer",
          email: "customer@vyrapulse.com",
          city: o.delivery_city,
        },
  };
});

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
      let combined = [...CANONICAL_ORDERS];
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
            combined = [...mapped, ...CANONICAL_ORDERS];
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
          order_id,
          customer_id,
          ordered_at,
          order_status,
          payment_status,
          subtotal_inr,
          discount_amount_inr,
          delivery_fee_inr,
          order_total_inr,
          delivery_city,
          delivery_state,
          created_at,
          updated_at,
          customers (first_name, last_name, email, city)
        `)
        .order("ordered_at", { ascending: false })
        .limit(200);

      if (error) throw error;
      const mapped: Order[] = (data || []).map((row: any) => ({
        id: row.order_id,
        customer_id: row.customer_id,
        order_code: row.order_id,
        order_status: row.order_status,
        payment_status: row.payment_status,
        subtotal: Number(row.subtotal_inr ?? 0),
        discount_amount: Number(row.discount_amount_inr ?? 0),
        delivery_fee: Number(row.delivery_fee_inr ?? 0),
        total_amount: Number(row.order_total_inr ?? 0),
        delivery_city: row.delivery_city,
        delivery_state: row.delivery_state,
        offer_code: null,
        notes: null,
        created_at: row.ordered_at || row.created_at,
        updated_at: row.updated_at || row.ordered_at,
        customers: row.customers
          ? {
              full_name: `${row.customers.first_name || ""} ${row.customers.last_name || ""}`.trim() || "Customer",
              email: row.customers.email,
              city: row.customers.city,
            }
          : undefined,
      }));
      setOrders(mapped);
      setIsDemo(false);
    } catch {
      setOrders(CANONICAL_ORDERS);
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
            { label: "Delivered", value: orders.filter((o) => o.order_status === "delivered").length, color: "text-emerald-500 dark:text-emerald-400" },
            { label: "Cancelled", value: orders.filter((o) => o.order_status === "cancelled").length, color: "text-rose-500 dark:text-rose-400" },
            { label: "Paid Revenue", value: `₹${totalRevenue.toLocaleString("en-IN")}`, color: "text-primary" },
          ].map((kpi) => (
            <Card key={kpi.label} className="neu-card p-4 border-border/40 space-y-1">
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
              className="neu-inset w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-border/40 bg-surface text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto">
            {/* Status Filter Pills */}
            <div className="neu-inset flex items-center gap-1.5 p-1 rounded-xl border border-border/40">
              {["all", "pending", "processing", "shipped", "delivered", "cancelled"].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`text-xs px-3 py-1 rounded-lg font-semibold transition-all capitalize ${
                    statusFilter === s
                      ? "neu-btn-primary shadow-sm"
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
              className="neu-raised-sm flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border border-border/40 bg-surface hover:border-primary/50 text-foreground transition-all"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-primary" />
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
              {statusFilter !== "all" && <> with status <span className="text-primary font-bold uppercase">{statusFilter}</span></>}
              {searchQuery.trim() && <> containing &ldquo;<span className="text-foreground">{searchQuery}</span>&rdquo;</>}
            </span>
            <button
              onClick={() => {
                setStatusFilter("all");
                setSearchQuery("");
              }}
              className="text-[11px] text-primary hover:underline"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Orders Table */}
        <Card className="neu-card border-border/40 overflow-hidden">
          {isLoading ? (
            <div className="p-12 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
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
                        {sortField === "code" && (sortDesc ? <ArrowDown className="w-3 h-3 text-primary" /> : <ArrowUp className="w-3 h-3 text-primary" />)}
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
                        {sortField === "total" && (sortDesc ? <ArrowDown className="w-3 h-3 text-primary" /> : <ArrowUp className="w-3 h-3 text-primary" />)}
                      </div>
                    </th>
                    <th
                      onClick={() => handleToggleSort("date")}
                      className="text-left px-4 py-3 cursor-pointer hover:text-foreground transition-colors"
                    >
                      <div className="flex items-center gap-1">
                        <span>Date</span>
                        {sortField === "date" && (sortDesc ? <ArrowDown className="w-3 h-3 text-primary" /> : <ArrowUp className="w-3 h-3 text-primary" />)}
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
                        <span className="font-mono text-xs text-primary font-bold">
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
                          <span className="text-[10px] font-mono text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
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
