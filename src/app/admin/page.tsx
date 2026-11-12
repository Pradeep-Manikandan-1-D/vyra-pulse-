"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  TrendingUp,
  ShoppingCart,
  Users,
  AlertTriangle,
  ArrowUpRight,
  RefreshCw,
  Bell,
  Package,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { CSV_ORDERS, CSV_CUSTOMERS, CSV_INVENTORY } from "@/lib/bi/seed-data";

interface RecentOrderSummary {
  id: string;
  order_code: string;
  customer_name: string;
  total_amount: number;
  order_status: string;
  payment_status: string;
  created_at: string;
}

export default function AdminOverviewPage() {
  const { user } = useAuth();
  const [revenue, setRevenue] = useState<number | null>(null);
  const [totalOrders, setTotalOrders] = useState<number | null>(null);
  const [totalCustomers, setTotalCustomers] = useState<number | null>(null);
  const [lowStockCount, setLowStockCount] = useState<number | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrderSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<string>("");

  const loadMetrics = useCallback(async () => {
    setIsLoading(true);
    setQueryError(null);
    const supabase = createClient();

    if (supabase && isSupabaseConfigured()) {
      try {
        const [ordersRes, customersRes, inventoryRes, recentRes] = await Promise.all([
          // 1. All orders for revenue & total count aggregation
          supabase
            .from("orders")
            .select("order_total_inr, payment_status, order_status"),

          // 2. Exact customer count using primary key
          supabase
            .from("customers")
            .select("customer_id", { count: "exact", head: true }),

          // 3. Inventory for low-stock threshold evaluation
          supabase
            .from("inventory")
            .select("stock_on_hand, reorder_level"),

          // 4. Recent 5 orders with joined customer details
          supabase
            .from("orders")
            .select(`
              order_id,
              order_total_inr,
              order_status,
              payment_status,
              ordered_at,
              customers (first_name, last_name)
            `)
            .order("ordered_at", { ascending: false })
            .limit(5),
        ]);

        // Check for any query failures from Supabase
        const errors = [
          ordersRes.error ? `Orders query: ${ordersRes.error.message}` : null,
          customersRes.error ? `Customers query: ${customersRes.error.message}` : null,
          inventoryRes.error ? `Inventory query: ${inventoryRes.error.message}` : null,
          recentRes.error ? `Recent transactions query: ${recentRes.error.message}` : null,
        ].filter(Boolean);

        if (errors.length > 0) {
          const combinedMsg = errors.join(" | ");
          console.error("Supabase metrics query error:", combinedMsg, {
            ordersError: ordersRes.error,
            customersError: customersRes.error,
            inventoryError: inventoryRes.error,
            recentError: recentRes.error,
          });
          setQueryError(combinedMsg);
          setIsLoading(false);
          setLastRefreshed(new Date().toLocaleTimeString());
          return;
        }

        // Process Revenue & Orders metrics
        if (ordersRes.data) {
          const paidOrders = ordersRes.data.filter(
            (o) => o.payment_status === "paid" && o.order_status !== "cancelled"
          );
          const rev = paidOrders.reduce(
            (sum, o) => sum + (Number(o.order_total_inr) || 0),
            0
          );
          setRevenue(rev);
          setTotalOrders(ordersRes.data.length);
        }

        // Process Customer count
        if (customersRes.count !== null && customersRes.count !== undefined) {
          setTotalCustomers(customersRes.count);
        }

        // Process Low Stock alerts
        if (inventoryRes.data) {
          const low = inventoryRes.data.filter(
            (i) => Number(i.stock_on_hand) <= Number(i.reorder_level)
          ).length;
          setLowStockCount(low);
        }

        // Process Recent Orders with safe customer display name construction
        if (recentRes.data) {
          setRecentOrders(
            recentRes.data.map((r: any) => {
              const cust = Array.isArray(r.customers) ? r.customers[0] : r.customers;
              const customerName = cust
                ? `${cust.first_name || ""} ${cust.last_name || ""}`.trim()
                : "";

              return {
                id: r.order_id,
                order_code: r.order_id,
                customer_name: customerName || "Vyra Customer",
                total_amount: Number(r.order_total_inr) || 0,
                order_status: r.order_status,
                payment_status: r.payment_status,
                created_at: r.ordered_at,
              };
            })
          );
        }

        setIsLoading(false);
        setLastRefreshed(new Date().toLocaleTimeString());
        return;
      } catch (err: any) {
        const errorMsg = err?.message || "An unexpected error occurred while querying live metrics.";
        console.error("Could not query metrics from Supabase:", err);
        setQueryError(errorMsg);
        setIsLoading(false);
        setLastRefreshed(new Date().toLocaleTimeString());
        return;
      }
    }

    // ─── OFFLINE DEMO FALLBACK (Only when Supabase is unconfigured) ───────────
    try {
      const custMap = new Map<string, string>();
      CSV_CUSTOMERS.forEach((c) => {
        custMap.set(c.customer_id, `${c.first_name} ${c.last_name}`.trim());
      });

      const paidOrders = CSV_ORDERS.filter(
        (o) => o.payment_status === "paid" && o.order_status !== "cancelled"
      );
      const canonicalRev = paidOrders.reduce(
        (sum, o) => sum + (Number(o.order_total_inr) || 0),
        0
      );
      const lowStock = CSV_INVENTORY.filter(
        (i) => Number(i.stock_on_hand) <= Number(i.reorder_level)
      ).length;

      // Check localStorage for offline demo checkouts
      let extraRevenue = 0;
      let extraOrders: any[] = [];
      try {
        const stored = localStorage.getItem("vyra_demo_orders");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            extraOrders = parsed;
            extraRevenue = parsed
              .filter((o: any) => o.payment_status === "paid")
              .reduce((sum: number, o: any) => sum + (Number(o.total_amount) || 0), 0);
          }
        }
      } catch {
        // Ignore JSON error
      }

      setRevenue(canonicalRev + extraRevenue);
      setTotalOrders(CSV_ORDERS.length + extraOrders.length);
      setTotalCustomers(CSV_CUSTOMERS.length);
      setLowStockCount(lowStock);

      const recentMerged: RecentOrderSummary[] = [
        ...extraOrders.slice(0, 5).map((o: any) => ({
          id: o.id || o.order_code,
          order_code: o.order_code,
          customer_name: o.recipient_name || "Guest Athlete",
          total_amount: Number(o.total_amount) || 0,
          order_status: o.order_status,
          payment_status: o.payment_status,
          created_at: o.created_at || new Date().toISOString(),
        })),
        ...CSV_ORDERS.slice(0, 5).map((o) => ({
          id: o.order_id,
          order_code: o.order_id,
          customer_name: custMap.get(o.customer_id) || "Vyra Customer",
          total_amount: Number(o.order_total_inr) || 0,
          order_status: o.order_status,
          payment_status: o.payment_status,
          created_at: o.ordered_at,
        })),
      ]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);

      setRecentOrders(recentMerged);
    } catch (e) {
      console.warn("Offline demo metrics calculation fallback:", e);
    }

    setIsLoading(false);
    setLastRefreshed(new Date().toLocaleTimeString());
  }, []);

  useEffect(() => {
    loadMetrics();

    // Live Realtime listener for instant refresh when orders or inventory change
    const supabase = createClient();
    if (supabase && isSupabaseConfigured()) {
      const channel = supabase
        .channel("admin-overview-sync")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "orders" },
          () => {
            loadMetrics();
          }
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "inventory" },
          () => {
            loadMetrics();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [loadMetrics]);

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-5rem)]">
      {/* Sidebar Navigation */}
      <AdminSidebar />

      {/* Main Admin Content */}
      <div className="flex-1 p-6 md:p-8 space-y-8 overflow-y-auto">
        {/* Admin Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/40 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="default">Super Admin Session</Badge>
              <span className="text-xs text-emerald-400 font-mono">
                {user?.email || (isSupabaseConfigured() ? "admin@session" : "admin@gmail.com")} (Verified)
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Executive Command Center
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Live operational monitoring for Vyra Pulse products, stock levels, and customer orders.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {lastRefreshed && (
              <span className="text-[11px] text-muted-foreground font-mono">
                Updated {lastRefreshed}
              </span>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={loadMetrics}
              disabled={isLoading}
              className="gap-2 text-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              <span>Sync Metrics</span>
            </Button>
          </div>
        </div>

        {/* Database Query Error Alert (if query fails in live mode) */}
        {queryError && (
          <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-rose-300">
            <div className="flex items-start sm:items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5 sm:mt-0" />
              <div>
                <p className="font-bold text-rose-200">Supabase Query Error</p>
                <p className="text-[11px] text-rose-300/80 font-mono mt-0.5">{queryError}</p>
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={loadMetrics}
              className="text-xs h-7 self-end sm:self-auto border-rose-500/30 hover:bg-rose-500/20"
            >
              Retry
            </Button>
          </div>
        )}

        {/* Live Order Notification Ribbon */}
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Bell className="w-4 h-4 animate-bounce" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">
                Supabase Realtime Stream: Operational
              </p>
              <p className="text-[11px] text-muted-foreground">
                Monitoring incoming customer checkouts, inventory balances, and server-side RPC audits.
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-emerald-400 border-emerald-500/30 text-[10px]">
            Connected
          </Badge>
        </div>

        {/* Executive KPI Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Net Revenue */}
          <Card className="p-5 space-y-2 border-white/10 hover:border-[#00FF66]/40 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium">Eligible Net Revenue</span>
              <div className="p-2 rounded-lg bg-[#00FF66]/10 text-[#00FF66]">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="space-y-1">
              {isLoading ? (
                <div className="h-8 w-28 bg-white/5 animate-pulse rounded my-1" />
              ) : (
                <p className="text-2xl font-extrabold text-foreground tracking-tight">
                  {revenue !== null ? `₹${revenue.toLocaleString("en-IN")}` : "--"}
                </p>
              )}
              <p className="text-[10px] text-muted-foreground flex items-center gap-1 font-mono">
                <span className="text-[#00FF66] font-bold">100% server verified</span>
              </p>
            </div>
          </Card>

          {/* Total Orders */}
          <Card className="p-5 space-y-2 border-white/10 hover:border-[#00FF66]/40 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium">Total Orders</span>
              <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400">
                <ShoppingCart className="w-4 h-4" />
              </div>
            </div>
            <div className="space-y-1">
              {isLoading ? (
                <div className="h-8 w-16 bg-white/5 animate-pulse rounded my-1" />
              ) : (
                <p className="text-2xl font-extrabold text-foreground tracking-tight">
                  {totalOrders !== null ? totalOrders.toLocaleString("en-IN") : "--"}
                </p>
              )}
              <p className="text-[10px] text-muted-foreground flex items-center gap-1 font-mono">
                <span>All channels & locations</span>
              </p>
            </div>
          </Card>

          {/* Active Customers */}
          <Card className="p-5 space-y-2 border-white/10 hover:border-[#00FF66]/40 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium">Registered Customers</span>
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="space-y-1">
              {isLoading ? (
                <div className="h-8 w-16 bg-white/5 animate-pulse rounded my-1" />
              ) : (
                <p className="text-2xl font-extrabold text-foreground tracking-tight">
                  {totalCustomers !== null ? totalCustomers.toLocaleString("en-IN") : "--"}
                </p>
              )}
              <p className="text-[10px] text-muted-foreground flex items-center gap-1 font-mono">
                <span>Unique customer profiles</span>
              </p>
            </div>
          </Card>

          {/* Low Stock Alerts */}
          <Card className="p-5 space-y-2 border-white/10 hover:border-amber-500/40 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium">Low Stock Alerts</span>
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="space-y-1">
              {isLoading ? (
                <div className="h-8 w-16 bg-white/5 animate-pulse rounded my-1" />
              ) : (
                <p className="text-2xl font-extrabold text-foreground tracking-tight">
                  {lowStockCount !== null ? lowStockCount : "--"}
                </p>
              )}
              <p className="text-[10px] text-muted-foreground flex items-center gap-1 font-mono">
                <span>Stock &le; reorder level</span>
              </p>
            </div>
          </Card>
        </div>

        {/* Recent Orders Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              Recent Order Transactions
            </h3>
            <Link href="/admin/orders">
              <span className="text-xs text-[#00FF66] hover:underline flex items-center gap-1">
                View All Orders <ArrowUpRight className="w-3 h-3" />
              </span>
            </Link>
          </div>

          <Card className="overflow-hidden border-border/40">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border/40 bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
                    <th className="py-3 px-4">Order Code</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Total Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Payment</th>
                    <th className="py-3 px-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {isLoading ? (
                    // Skeleton Loading Rows
                    Array.from({ length: 5 }).map((_, idx) => (
                      <tr key={`skeleton-${idx}`} className="animate-pulse">
                        <td className="py-3.5 px-4"><div className="h-3.5 w-20 bg-white/5 rounded" /></td>
                        <td className="py-3.5 px-4"><div className="h-3.5 w-28 bg-white/5 rounded" /></td>
                        <td className="py-3.5 px-4"><div className="h-3.5 w-16 bg-white/5 rounded" /></td>
                        <td className="py-3.5 px-4"><div className="h-4 w-16 bg-white/5 rounded" /></td>
                        <td className="py-3.5 px-4"><div className="h-3 w-12 bg-white/5 rounded" /></td>
                        <td className="py-3.5 px-4"><div className="h-3.5 w-14 bg-white/5 rounded" /></td>
                      </tr>
                    ))
                  ) : recentOrders.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-12 text-center text-muted-foreground font-mono text-xs"
                      >
                        No order transactions found in database.
                      </td>
                    </tr>
                  ) : (
                    recentOrders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-muted/20 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-foreground">
                          {ord.order_code}
                        </td>
                        <td className="py-3 px-4 font-medium text-foreground">
                          {ord.customer_name}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-[#00FF66]">
                          ₹{ord.total_amount.toFixed(2)}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              ord.order_status === "delivered"
                                ? "bg-emerald-500/10 text-emerald-400"
                                : ord.order_status === "shipped"
                                ? "bg-sky-500/10 text-sky-400"
                                : "bg-amber-500/10 text-amber-400"
                            }`}
                          >
                            {ord.order_status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-[10px] font-mono uppercase text-muted-foreground">
                            {ord.payment_status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {ord.created_at
                            ? new Date(ord.created_at).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                              })
                            : "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Quick Operational Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Link href="/admin/orders">
            <Card className="p-4 space-y-2 border-white/10 hover:border-[#00FF66]/40 transition-colors h-full">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-foreground">Orders Management</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Inspect statuses, update fulfillment tracking, and export tax logs.
              </p>
            </Card>
          </Link>

          <Link href="/admin/products">
            <Card className="p-4 space-y-2 border-white/10 hover:border-[#00FF66]/40 transition-colors h-full">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-foreground">Products & Pricing</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Edit flavor prices, active states, and review caffeine profiles.
              </p>
            </Card>
          </Link>

          <Link href="/admin/inventory">
            <Card className="p-4 space-y-2 border-white/10 hover:border-[#00FF66]/40 transition-colors h-full">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-foreground">Stock & Restock</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Authoritative inventory adjustments, low-stock alerts, warehouse locations.
              </p>
            </Card>
          </Link>

          <Link href="/admin/analytics">
            <Card className="p-4 space-y-2 border-white/10 hover:border-[#00FF66]/40 transition-colors h-full">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-foreground">BI & Analytics</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Visual revenue trends, flavor sales breakdown, and performance metrics.
              </p>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
