"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Package,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ArrowUpDown,
  TrendingDown,
} from "lucide-react";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { Inventory } from "@/lib/types";
import { VYRA_FLAVORS } from "@/lib/constants";

// ─── Demo data ────────────────────────────────────────────────────────────────
const DEMO_INVENTORY: Inventory[] = VYRA_FLAVORS.map((f, i) => ({
  id: `inv-${i + 1}`,
  product_id: f.id,
  stock_quantity: [45, 12, 80, 5, 120, 30, 8, 95][i] ?? 50,
  reorder_level: [20, 20, 20, 20, 20, 20, 20, 20][i] ?? 20,
  location: "Main Warehouse",
  updated_at: new Date(Date.now() - i * 3600000).toISOString(),
  products: { name: f.name, flavor: f.flavor, price: f.priceInr },
}));

export default function AdminInventoryPage() {
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [search, setSearch] = useState("");
  const [adjusting, setAdjusting] = useState<string | null>(null);
  const [adjustQty, setAdjustQty] = useState<Record<string, string>>({});
  const [adjustNote, setAdjustNote] = useState("");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadInventory = useCallback(async () => {
    setIsLoading(true);
    const supabase = createClient();
    if (!supabase || !isSupabaseConfigured()) {
      setInventory(DEMO_INVENTORY);
      setIsDemo(true);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("inventory")
        .select(`*, products (name, flavor, price)`)
        .order("stock_quantity", { ascending: true });
      if (error) throw error;
      setInventory((data as Inventory[]) ?? []);
      setIsDemo(false);
    } catch {
      setInventory(DEMO_INVENTORY);
      setIsDemo(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  const handleAdjust = async (invId: string, productId: string) => {
    const delta = parseInt(adjustQty[invId] ?? "0");
    if (isNaN(delta) || delta === 0) return;

    const supabase = createClient();
    if (!supabase || !isSupabaseConfigured()) {
      // Demo: update in local state
      setInventory((prev) =>
        prev.map((i) =>
          i.id === invId
            ? { ...i, stock_quantity: Math.max(0, i.stock_quantity + delta) }
            : i
        )
      );
      setSuccessMsg(`Demo: ${delta > 0 ? "Added" : "Removed"} ${Math.abs(delta)} units.`);
      setTimeout(() => setSuccessMsg(null), 3000);
      setAdjusting(null);
      setAdjustQty({});
      return;
    }

    try {
      const { error } = await supabase.rpc("adjust_inventory", {
        p_product_id: productId,
        p_delta: delta,
        p_note: adjustNote || "Manual admin adjustment",
      });
      if (error) throw error;
      setSuccessMsg(`Stock updated by ${delta > 0 ? "+" : ""}${delta}.`);
      setTimeout(() => setSuccessMsg(null), 3000);
      await loadInventory();
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setAdjusting(null);
      setAdjustQty({});
      setAdjustNote("");
    }
  };

  const filtered = inventory.filter((inv) => {
    const q = search.toLowerCase();
    return (
      (inv.products?.name ?? "").toLowerCase().includes(q) ||
      (inv.products?.flavor ?? "").toLowerCase().includes(q)
    );
  });

  const lowStockCount = inventory.filter(
    (i) => i.stock_quantity <= i.reorder_level
  ).length;

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-5rem)]">
      <AdminSidebar />

      <div className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/40 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-extrabold text-foreground">Inventory Management</h1>
              {isDemo && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400">
                  DEMO DATA
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Live stock on hand, reorder thresholds, and manual adjustment controls.
            </p>
          </div>
          <Button variant="secondary" size="sm" className="gap-2 text-xs" onClick={loadInventory}>
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </Button>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Card className="p-4 border-white/10 space-y-1">
            <p className="text-[11px] text-muted-foreground">Total Products</p>
            <p className="text-2xl font-extrabold text-foreground">{inventory.length}</p>
          </Card>
          <Card className="p-4 border-white/10 border-amber-500/20 space-y-1">
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              Low Stock Alerts
            </p>
            <p className="text-2xl font-extrabold text-amber-400">{lowStockCount}</p>
          </Card>
          <Card className="p-4 border-white/10 space-y-1">
            <p className="text-[11px] text-muted-foreground">Total Units</p>
            <p className="text-2xl font-extrabold text-[#00FF66]">
              {inventory.reduce((s, i) => s + i.stock_quantity, 0).toLocaleString("en-IN")}
            </p>
          </Card>
        </div>

        {/* Search */}
        <div className="relative max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by flavor or name..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-white/10 bg-surface text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#00FF66]/40 transition-all"
          />
        </div>

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            {successMsg}
          </div>
        )}

        {/* Inventory Table */}
        <Card className="border-white/10 overflow-hidden">
          {isLoading ? (
            <div className="p-12 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-[#00FF66]" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    <th className="text-left px-4 py-3">Product / Flavor</th>
                    <th className="text-right px-4 py-3">Stock</th>
                    <th className="text-right px-4 py-3">Reorder At</th>
                    <th className="text-left px-4 py-3">Status</th>
                    <th className="text-left px-4 py-3">Location</th>
                    <th className="text-left px-4 py-3">Adjust</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filtered.map((inv) => {
                    const isLow = inv.stock_quantity <= inv.reorder_level;
                    const flavorDef = VYRA_FLAVORS.find((f) => f.id === inv.product_id);
                    const accent = flavorDef?.accentColor ?? "#00FF66";

                    return (
                      <tr key={inv.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-2 h-8 rounded-full shrink-0"
                              style={{ backgroundColor: accent }}
                            />
                            <div>
                              <p className="font-semibold text-foreground text-xs">
                                {inv.products?.name ?? inv.product_id}
                              </p>
                              <p className="text-[11px] text-muted-foreground">
                                {inv.products?.flavor ?? ""}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <span
                            className={`font-extrabold text-base ${
                              isLow ? "text-amber-400" : "text-foreground"
                            }`}
                          >
                            {inv.stock_quantity}
                          </span>
                          <span className="text-[11px] text-muted-foreground ml-1">units</span>
                        </td>
                        <td className="px-4 py-3.5 text-right text-xs text-muted-foreground">
                          {inv.reorder_level}
                        </td>
                        <td className="px-4 py-3.5">
                          {isLow ? (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full">
                              <AlertTriangle className="w-3 h-3" />
                              Low Stock
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3" />
                              Sufficient
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-xs text-muted-foreground">
                          {inv.location ?? "—"}
                        </td>
                        <td className="px-4 py-3.5">
                          {adjusting === inv.id ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                placeholder="±qty"
                                value={adjustQty[inv.id] ?? ""}
                                onChange={(e) =>
                                  setAdjustQty((prev) => ({
                                    ...prev,
                                    [inv.id]: e.target.value,
                                  }))
                                }
                                className="w-16 px-2 py-1 text-xs rounded-lg border border-white/10 bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-[#00FF66]/40"
                              />
                              <Button
                                size="sm"
                                className="text-xs px-2 py-1 h-auto"
                                onClick={() => handleAdjust(inv.id, inv.product_id)}
                              >
                                Save
                              </Button>
                              <button
                                onClick={() => setAdjusting(null)}
                                className="text-xs text-muted-foreground hover:text-foreground"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setAdjusting(inv.id)}
                              className="text-xs text-[#00FF66] hover:underline font-medium"
                            >
                              + Adjust
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
