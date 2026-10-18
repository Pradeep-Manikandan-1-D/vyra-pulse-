"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Package,
  Search,
  Edit2,
  Check,
  X,
  ExternalLink,
  Zap,
  TrendingUp,
  DollarSign,
  AlertCircle,
  Eye,
  RefreshCw,
} from "lucide-react";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { VYRA_FLAVORS } from "@/lib/constants";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

interface AdminProductRow {
  id: string;
  name: string;
  flavor: string;
  key_ingredients: string;
  caffeine_mg: number;
  volume_ml: number;
  price: number;
  active: boolean;
  stock_quantity?: number;
  accentColor?: string;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProductRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingPrice, setEditingPrice] = useState<string>("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    setIsLoading(true);
    const supabase = createClient();

    if (supabase && isSupabaseConfigured()) {
      try {
        const { data: dbProducts, error } = await supabase
          .from("products")
          .select(`
            *,
            inventory (stock_quantity)
          `)
          .order("id", { ascending: true });

        if (!error && dbProducts && dbProducts.length > 0) {
          setProducts(
            dbProducts.map((p) => {
              const matchedFlavor = VYRA_FLAVORS.find((f) => f.id === p.id);
              return {
                id: p.id,
                name: p.name,
                flavor: p.flavor,
                key_ingredients: p.key_ingredients,
                caffeine_mg: p.caffeine_mg,
                volume_ml: p.volume_ml,
                price: Number(p.price),
                active: p.active,
                stock_quantity: p.inventory?.[0]?.stock_quantity ?? 500,
                accentColor: matchedFlavor?.accentColor || "#00FF66",
              };
            })
          );
          setIsLoading(false);
          return;
        }
      } catch (err) {
        console.warn("Could not fetch products from Supabase:", err);
      }
    }

    // Demo fallback with constant flavors & mock inventory
    const demoStockMap: Record<string, number> = {
      "VP-CIT-001": 850,
      "VP-BLU-002": 420,
      "VP-MAN-003": 610,
      "VP-WAT-004": 290,
      "VP-GRE-005": 540,
      "VP-TRO-006": 120, // Low stock
      "VP-STR-007": 490,
      "VP-ORI-008": 780,
    };

    setProducts(
      VYRA_FLAVORS.map((f) => ({
        id: f.id,
        name: f.name,
        flavor: f.flavor,
        key_ingredients: f.keyIngredients,
        caffeine_mg: f.caffeineMg,
        volume_ml: f.volumeMl,
        price: f.priceInr,
        active: true,
        stock_quantity: demoStockMap[f.id] || 450,
        accentColor: f.accentColor,
      }))
    );
    setIsLoading(false);
  }

  const handleToggleActive = async (productId: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    const supabase = createClient();

    if (supabase && isSupabaseConfigured()) {
      try {
        const { error } = await supabase
          .from("products")
          .update({ active: nextStatus, updated_at: new Date().toISOString() })
          .eq("id", productId);

        if (error) {
          setStatusMessage(`Failed to update product: ${error.message}`);
          return;
        }
      } catch (err) {
        console.warn("Supabase update error:", err);
      }
    }

    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, active: nextStatus } : p))
    );
    setStatusMessage(`Product ${productId} is now ${nextStatus ? "ACTIVE" : "INACTIVE"}.`);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleStartEditPrice = (product: AdminProductRow) => {
    setEditingId(product.id);
    setEditingPrice(product.price.toString());
  };

  const handleSavePrice = async (productId: string) => {
    const numPrice = parseFloat(editingPrice);
    if (isNaN(numPrice) || numPrice <= 0) {
      setStatusMessage("Price must be a valid positive number.");
      return;
    }

    const supabase = createClient();
    if (supabase && isSupabaseConfigured()) {
      try {
        const { error } = await supabase
          .from("products")
          .update({ price: numPrice, updated_at: new Date().toISOString() })
          .eq("id", productId);

        if (error) {
          setStatusMessage(`Failed to update price: ${error.message}`);
          return;
        }
      } catch (err) {
        console.warn("Supabase update error:", err);
      }
    }

    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, price: numPrice } : p))
    );
    setEditingId(null);
    setStatusMessage(`Price for ${productId} updated to ₹${numPrice.toFixed(2)}.`);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.flavor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-5rem)]">
      <AdminSidebar />
      <div className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/40 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="default">Store Catalogue</Badge>
              <span className="text-xs text-muted-foreground font-mono">
                {products.filter((p) => p.active).length} of {products.length} Active
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              Product & Flavor Catalogue
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Control pricing, active state in customer storefront, and inspect inventory stocks across all 8 flavors.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={loadProducts}
              className="gap-2 text-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </Button>
            <Link href="/shop" target="_blank">
              <Button size="sm" className="gap-2 text-xs">
                <Eye className="w-3.5 h-3.5" />
                Live Storefront
              </Button>
            </Link>
          </div>
        </div>

        {/* Status notification */}
        {statusMessage && (
          <div className="rounded-xl border border-[#00FF66]/30 bg-[#00FF66]/10 p-3 text-xs text-[#00FF66] font-medium flex items-center justify-between">
            <span>{statusMessage}</span>
            <button onClick={() => setStatusMessage(null)} className="text-foreground">
              &times;
            </button>
          </div>
        )}

        {/* Search bar & filter */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by flavor, code, or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-background border border-border focus:border-[#00FF66] focus:outline-none transition-colors"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Showing {filteredProducts.length} of {products.length} products
          </p>
        </div>

        {/* Products Table */}
        <Card className="overflow-hidden border-border/40">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border/40 bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="py-3 px-4">Flavor / Product</th>
                  <th className="py-3 px-4">SKU / ID</th>
                  <th className="py-3 px-4">Specs</th>
                  <th className="py-3 px-4">Selling Price</th>
                  <th className="py-3 px-4">Stock on Hand</th>
                  <th className="py-3 px-4">Storefront Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground">
                      Loading product catalogue...
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground">
                      No products found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => {
                    const isLowStock = (p.stock_quantity ?? 0) <= 200;

                    return (
                      <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                        {/* Flavor / Product */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-3.5 h-3.5 rounded-full shadow-sm flex-shrink-0"
                              style={{ backgroundColor: p.accentColor || "#00FF66" }}
                            />
                            <div>
                              <p className="font-bold text-foreground">{p.name}</p>
                              <p className="text-[11px] text-muted-foreground">{p.flavor}</p>
                            </div>
                          </div>
                        </td>

                        {/* SKU */}
                        <td className="py-3 px-4 font-mono font-medium text-foreground">
                          {p.id}
                        </td>

                        {/* Specs */}
                        <td className="py-3 px-4 text-muted-foreground">
                          {p.volume_ml}ml &bull; {p.caffeine_mg}mg Caffeine
                        </td>

                        {/* Selling Price (Editable) */}
                        <td className="py-3 px-4">
                          {editingId === p.id ? (
                            <div className="flex items-center gap-1.5">
                              <span className="text-muted-foreground">₹</span>
                              <input
                                type="number"
                                step="1"
                                value={editingPrice}
                                onChange={(e) => setEditingPrice(e.target.value)}
                                className="w-20 px-2 py-1 text-xs rounded border border-[#00FF66] bg-background font-mono focus:outline-none"
                                autoFocus
                              />
                              <button
                                onClick={() => handleSavePrice(p.id)}
                                className="p-1 rounded bg-[#00FF66] text-black hover:opacity-90"
                                title="Save"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="p-1 rounded bg-muted text-muted-foreground hover:text-foreground"
                                title="Cancel"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 group">
                              <span className="font-mono font-bold text-foreground text-sm">
                                ₹{p.price.toFixed(2)}
                              </span>
                              <button
                                onClick={() => handleStartEditPrice(p)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-muted-foreground hover:text-[#00FF66]"
                                title="Edit Price"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </td>

                        {/* Stock Quantity */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-foreground">
                              {p.stock_quantity ?? 500}
                            </span>
                            <span className="text-[10px] text-muted-foreground">cans</span>
                            {isLowStock && (
                              <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[9px] py-0 px-1.5">
                                Low
                              </Badge>
                            )}
                          </div>
                        </td>

                        {/* Active Switch */}
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleToggleActive(p.id, p.active)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors ${
                              p.active
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                                : "bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20"
                            }`}
                          >
                            {p.active ? "ACTIVE" : "INACTIVE"}
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <Link href={`/shop#${p.id}`}>
                            <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1">
                              <span>Preview</span>
                              <ExternalLink className="w-3 h-3" />
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
