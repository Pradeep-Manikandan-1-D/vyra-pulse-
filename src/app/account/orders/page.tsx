"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Package,
  ShoppingBag,
  Clock,
  CheckCircle2,
  Truck,
  AlertCircle,
  ChevronRight,
  ExternalLink,
  MapPin,
  Calendar,
  CreditCard,
  RotateCcw,
  Receipt,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/components/auth/AuthProvider";
import { useCart } from "@/components/cart/CartProvider";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { getCustomerOrders, getCustomerByEmail } from "@/lib/customer/data";

interface CustomerOrderItem {
  product_id?: string;
  product_name_snapshot: string;
  flavor_snapshot: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

interface CustomerOrder {
  id: string;
  order_code: string;
  order_status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  payment_status: "pending" | "paid" | "failed" | "refunded";
  subtotal: number;
  discount_amount: number;
  delivery_fee: number;
  total_amount: number;
  delivery_city?: string | null;
  delivery_state?: string | null;
  delivery_address?: string | null;
  recipient_name?: string | null;
  recipient_phone?: string | null;
  offer_code?: string | null;
  points_earned?: number;
  created_at: string;
  items?: CustomerOrderItem[];
  order_items?: CustomerOrderItem[];
}

export default function CustomerOrdersPage() {
  const { user, profile, isLoading: authLoading } = useAuth();
  const { addItem } = useCart();
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "in_transit" | "delivered">("all");
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<CustomerOrder | null>(null);

  useEffect(() => {
    async function loadOrders() {
      setIsLoading(true);
      if (!user) {
        setOrders([]);
        setIsLoading(false);
        return;
      }

      const customerCode =
        profile?.customer_id ||
        (user.email ? getCustomerByEmail(user.email)?.customer_id : null) ||
        user.id;

      const supabase = createClient();

      if (supabase && isSupabaseConfigured()) {
        try {
          const { data: custRecord } = await supabase
            .from("customers")
            .select("customer_id")
            .or(`user_id.eq.${user.id},email.eq.${user.email}`)
            .single();

          const activeId = custRecord?.customer_id || customerCode;

          const { data, error } = await supabase
            .from("orders")
            .select(`
              *,
              order_items (
                product_id,
                product_name_snapshot,
                flavor_snapshot,
                quantity,
                unit_price,
                line_total
              )
            `)
            .eq("customer_id", activeId)
            .order("created_at", { ascending: false });

          if (!error && data) {
            setOrders(
              data.map((o) => ({
                ...o,
                items: o.order_items,
              }))
            );
            setIsLoading(false);
            return;
          }
        } catch (err) {
          console.warn("Error fetching orders from Supabase:", err);
        }
      }

      // Strict isolated customer orders lookup
      const custOrders = getCustomerOrders(customerCode);
      setOrders(custOrders as any);
      setIsLoading(false);
    }

    if (!authLoading) {
      loadOrders();
    }
  }, [user, profile?.customer_id, authLoading]);

  const filteredOrders = orders.filter((o) => {
    if (filter === "in_transit") {
      return o.order_status === "processing" || o.order_status === "shipped";
    }
    if (filter === "delivered") {
      return o.order_status === "delivered";
    }
    return true;
  });

  const getStatusBadge = (status: CustomerOrder["order_status"]) => {
    switch (status) {
      case "delivered":
        return <Badge className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/30">Delivered</Badge>;
      case "shipped":
        return <Badge className="bg-sky-500/20 text-sky-700 dark:text-sky-400 border-sky-500/30">Shipped / In Transit</Badge>;
      case "processing":
        return <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30">Processing</Badge>;
      case "cancelled":
        return <Badge className="bg-rose-500/20 text-rose-700 dark:text-rose-400 border-rose-500/30">Cancelled</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const handleReorder = (order: CustomerOrder) => {
    const items = order.items || order.order_items || [];
    items.forEach((item) => {
      addItem({
        product_id: item.product_id || "VP-CIT-001",
        name: item.product_name_snapshot,
        flavor: item.flavor_snapshot,
        price: item.unit_price || 149,
        quantity: item.quantity || 1,
        image_path: "/assets/products/Drinks.png",
        accentColor: "var(--primary)",
      });
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/40 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant="default" className="text-[11px]">Customer Dashboard</Badge>
            {user ? (
              <span className="text-xs text-primary font-mono">
                {user.email}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground font-mono">Guest / Demo Mode</span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Order History & Tracking
          </h1>
          <p className="text-xs text-muted-foreground mt-1 max-w-xl">
            View past orders, track dispatch status, download tax invoices, and reorder your favourite flavors in 1-click.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/account/wallet">
            <Button variant="secondary" size="sm" className="gap-2 text-xs">
              Pulse Rewards Wallet
            </Button>
          </Link>
          <Link href="/shop">
            <Button size="sm" className="gap-2 text-xs">
              <ShoppingBag className="w-3.5 h-3.5" />
              Order Cans
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Tabs & Quick KPI */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="neu-inset flex items-center gap-1.5 p-1.5 rounded-xl border border-border/40 text-xs">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              filter === "all"
                ? "neu-btn-primary font-bold shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All Orders ({orders.length})
          </button>
          <button
            onClick={() => setFilter("in_transit")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              filter === "in_transit"
                ? "neu-btn-primary font-bold shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            In Transit ({orders.filter((o) => o.order_status === "processing" || o.order_status === "shipped").length})
          </button>
          <button
            onClick={() => setFilter("delivered")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              filter === "delivered"
                ? "neu-btn-primary font-bold shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Delivered ({orders.filter((o) => o.order_status === "delivered").length})
          </button>
        </div>

        <p className="text-xs text-muted-foreground">
          Showing {filteredOrders.length} {filteredOrders.length === 1 ? "order" : "orders"}
        </p>
      </div>

      {/* Orders List */}
      {isLoading ? (
        <Card className="neu-card p-12 text-center text-muted-foreground">
          <Clock className="w-8 h-8 mx-auto mb-3 animate-spin text-primary" />
          <p className="text-sm">Loading your orders...</p>
        </Card>
      ) : filteredOrders.length === 0 ? (
        <Card className="neu-card p-12 text-center space-y-4 border-dashed border-border/60">
          <div className="w-14 h-14 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center">
            <Package className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-foreground">No orders in this view</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              You haven’t placed any orders matching this filter yet. Explore our 8 flavors and experience clean energy.
            </p>
          </div>
          <div className="pt-2">
            <Link href="/shop">
              <Button size="sm">Browse 8 Flavors</Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {filteredOrders.map((order) => {
            const items = order.items || order.order_items || [];
            const canCount = items.reduce((acc, it) => acc + (it.quantity || 1), 0);

            return (
              <Card
                key={order.id}
                className="neu-card overflow-hidden transition-all"
              >
                {/* Order Top Ribbon */}
                <div className="bg-surface-inset px-5 py-4 flex flex-wrap items-center justify-between gap-3 border-b border-border">
                  <div className="flex flex-wrap items-center gap-4">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Order Reference</p>
                      <p className="text-sm font-bold font-mono text-foreground">{order.order_code}</p>
                    </div>

                    <div className="hidden sm:block h-6 w-px bg-border/60" />

                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Placed On</p>
                      <p className="text-xs font-medium text-foreground">
                        {new Date(order.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>

                    <div className="hidden sm:block h-6 w-px bg-border/60" />

                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Amount</p>
                      <p className="text-sm font-extrabold text-primary font-mono">₹{Number(order.total_amount).toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {getStatusBadge(order.order_status)}
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-surface border border-border text-muted-foreground">
                      {order.payment_status}
                    </span>
                  </div>
                </div>

                {/* Order Items & Info */}
                <div className="p-5 space-y-4">
                  <div className="divide-y divide-border/20">
                    {items.map((item, idx) => (
                      <div key={idx} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="neu-raised-sm w-10 h-10 rounded-lg border border-border/40 flex items-center justify-center font-bold text-xs text-primary font-mono">
                            {item.quantity}x
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">{item.product_name_snapshot}</p>
                            <p className="text-xs text-muted-foreground">{item.flavor_snapshot} &bull; 330ml Can</p>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-sm font-mono font-bold text-foreground">
                            ₹{Number(item.line_total || item.unit_price * item.quantity).toFixed(2)}
                          </p>
                          <p className="text-[10px] text-muted-foreground font-mono">
                            ₹{Number(item.unit_price).toFixed(2)} / can
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Delivery and Rewards Summary */}
                  <div className="pt-4 border-t border-border/30 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1">
                      <p className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-primary" />
                        Delivery Destination
                      </p>
                      <p className="text-muted-foreground">
                        {order.delivery_address || `${order.delivery_city || "Bengaluru"}, ${order.delivery_state || "Karnataka"}`}
                      </p>
                      {order.recipient_name && (
                        <p className="text-muted-foreground text-[11px]">
                          Recipient: {order.recipient_name} {order.recipient_phone ? `(${order.recipient_phone})` : ""}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1 sm:text-right">
                      <p className="text-[11px] font-semibold text-foreground flex items-center sm:justify-end gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-primary" />
                        Order Breakdown
                      </p>
                      <p className="text-muted-foreground">
                        Subtotal: ₹{Number(order.subtotal).toFixed(2)}
                        {Number(order.discount_amount) > 0 && ` | Discount: -₹${Number(order.discount_amount).toFixed(2)}`}
                        {Number(order.delivery_fee) > 0 ? ` | Delivery: ₹${order.delivery_fee}` : " | Free Delivery"}
                      </p>
                      <p className="text-primary font-medium text-[11px]">
                        +{order.points_earned || canCount * 10} Pulse Points Earned
                      </p>
                    </div>
                  </div>

                  {/* Order Footer Actions */}
                  <div className="pt-3 border-t border-border/30 flex flex-wrap items-center justify-between gap-3">
                    <button
                      onClick={() => setSelectedReceiptOrder(order)}
                      className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      <span>View Tax Receipt</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <Link href="/shop">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReorder(order)}
                          className="gap-1.5 text-xs h-8"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Reorder Flavors
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Tax Receipt Modal */}
      {selectedReceiptOrder && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="neu-card max-w-lg w-full p-6 space-y-6 border border-border/50 bg-surface shadow-2xl">
            <div className="flex items-center justify-between border-b border-border/40 pb-4">
              <div>
                <p className="text-xs text-primary font-mono uppercase font-bold">Tax Invoice / Receipt</p>
                <h3 className="text-xl font-extrabold text-foreground">{selectedReceiptOrder.order_code}</h3>
              </div>
              <button
                onClick={() => setSelectedReceiptOrder(null)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold p-1"
              >
                &times; Close
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Billed To:</span>
                <span className="font-semibold text-foreground text-right">
                  {selectedReceiptOrder.recipient_name || user?.email || "Valued Customer"}<br />
                  {selectedReceiptOrder.delivery_address || `${selectedReceiptOrder.delivery_city}, India`}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">Order Date:</span>
                <span className="font-mono text-foreground">
                  {new Date(selectedReceiptOrder.created_at).toLocaleString("en-IN")}
                </span>
              </div>

              <div className="border-t border-b border-border/30 py-3 space-y-2">
                {(selectedReceiptOrder.items || selectedReceiptOrder.order_items || []).map((it, i) => (
                  <div key={i} className="flex justify-between">
                    <span>
                      {it.product_name_snapshot} ({it.quantity}x)
                    </span>
                    <span className="font-mono font-medium">₹{Number(it.line_total || it.unit_price * it.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="font-mono">₹{Number(selectedReceiptOrder.subtotal).toFixed(2)}</span>
                </div>
                {Number(selectedReceiptOrder.discount_amount) > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Discount ({selectedReceiptOrder.offer_code || "Promo"})</span>
                    <span className="font-mono">-₹{Number(selectedReceiptOrder.discount_amount).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-muted-foreground">
                  <span>Delivery Fee</span>
                  <span className="font-mono">
                    {Number(selectedReceiptOrder.delivery_fee) > 0
                      ? `₹${Number(selectedReceiptOrder.delivery_fee).toFixed(2)}`
                      : "FREE (Over ₹445)"}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-foreground border-t border-border/40 pt-2">
                  <span>Grand Total (Incl. GST)</span>
                  <span className="font-mono text-primary font-bold">₹{Number(selectedReceiptOrder.total_amount).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button size="sm" onClick={() => setSelectedReceiptOrder(null)}>
                Done
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
