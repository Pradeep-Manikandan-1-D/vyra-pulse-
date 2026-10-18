"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  TrendingUp,
  ShoppingCart,
  Users,
  Package,
  RefreshCw,
  Loader2,
  BarChart2,
  Zap,
  ArrowLeft,
  DollarSign,
  Repeat,
  Warehouse,
  Tag,
  ShieldCheck,
  Database,
} from "lucide-react";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { BIFilterState, BICategoryId, FullBIDataset, BIDrilldownData } from "@/lib/bi/types";
import { getFullBIDataset, extractDrilldownRecords } from "@/lib/bi/data";
import { BIFilterBar } from "@/components/admin/bi/BIFilterBar";
import { BICategoryNav } from "@/components/admin/bi/BICategoryNav";
import { BIDrilldownModal } from "@/components/admin/bi/BIDrilldownModal";
import { CategoryASalesRevenue } from "@/components/admin/bi/categories/CategoryASalesRevenue";
import { CategoryBProfitability } from "@/components/admin/bi/categories/CategoryBProfitability";
import { CategoryCCustomerAnalytics } from "@/components/admin/bi/categories/CategoryCCustomerAnalytics";
import { CategoryDProductPerformance } from "@/components/admin/bi/categories/CategoryDProductPerformance";
import { CategoryERegionalAnalytics } from "@/components/admin/bi/categories/CategoryERegionalAnalytics";
import { CategoryFOperationalAnalytics } from "@/components/admin/bi/categories/CategoryFOperationalAnalytics";
import { CategoryGInventoryAnalytics } from "@/components/admin/bi/categories/CategoryGInventoryAnalytics";
import { CategoryHMarketingLoyalty } from "@/components/admin/bi/categories/CategoryHMarketingLoyalty";
import { CategoryICustomerExperience } from "@/components/admin/bi/categories/CategoryICustomerExperience";

const DEFAULT_FILTERS: BIFilterState = {
  dateRange: "all",
  flavorId: "all",
  orderStatus: "all",
  stateRegion: "all",
};

export default function AdminAnalyticsPage() {
  const [activeCategory, setActiveCategory] = useState<BICategoryId>("all");
  const [filters, setFilters] = useState<BIFilterState>(DEFAULT_FILTERS);
  const [dataset, setDataset] = useState<FullBIDataset | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Drilldown modal state
  const [drilldown, setDrilldown] = useState<BIDrilldownData>({
    isOpen: false,
    title: "",
    category: "",
    filterContext: "",
    records: [],
  });

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getFullBIDataset(filters);
      setDataset(data);
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFilterChange = (updated: Partial<BIFilterState>) => {
    setFilters((prev) => ({ ...prev, ...updated }));
  };

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  const handleDrilldown = (category: string, key: string, title: string) => {
    if (!dataset) return;
    const records = extractDrilldownRecords(category, key, dataset);
    setDrilldown({
      isOpen: true,
      title,
      category,
      filterContext: dataset.metadata.appliedFilterSummary,
      records,
    });
  };

  const handleCloseDrilldown = () => {
    setDrilldown((prev) => ({ ...prev, isOpen: false }));
  };

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-5rem)]">
      <AdminSidebar />

      <div className="flex-1 p-6 md:p-8 space-y-8 overflow-y-auto max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/40 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-foreground">Advanced Business Intelligence (BI)</h1>
              {dataset?.metadata.dataSource === "postgresql_live" ? (
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-bold flex items-center gap-1">
                  <Database className="w-3 h-3" />
                  POSTGRESQL LIVE
                </span>
              ) : (
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full border border-[#00FF66]/30 bg-[#00FF66]/10 text-[#00FF66] font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  POSTGRESQL VERIFIED SEED REPLICA
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              9 analytical categories, drilldown telemetry, cross-tab filters, and mathematical fidelity across all 100 orders.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {activeCategory !== "all" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveCategory("all")}
                className="gap-2 text-xs border-white/20"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Overview</span>
              </Button>
            )}

            <Button variant="secondary" size="sm" className="gap-2 text-xs" onClick={loadData}>
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              Refresh Telemetry
            </Button>
          </div>
        </div>

        {/* Global Filter Bar */}
        <BIFilterBar
          filters={filters}
          onChange={handleFilterChange}
          onReset={handleResetFilters}
          totalOrdersCount={dataset?.summaryKpis.totalOrders ?? 100}
        />

        {/* Category Navigation Bar */}
        <BICategoryNav activeCategory={activeCategory} onSelectCategory={setActiveCategory} />

        {/* Loading State */}
        {isLoading || !dataset ? (
          <div className="p-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#00FF66]" />
            <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
              Aggregating Business Intelligence Datasets...
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            {/* Top-Level Executive KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4">
              <Card className="p-5 border-white/10 space-y-2">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-medium">Net Realized Revenue</span>
                  <div className="p-1.5 rounded-lg bg-[#00FF66]/10 text-[#00FF66]">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-foreground tracking-tight">
                    ₹{dataset.summaryKpis.netRevenue.toLocaleString("en-IN")}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    Gross: ₹{dataset.summaryKpis.grossSales.toLocaleString("en-IN")}
                  </p>
                </div>
              </Card>

              <Card className="p-5 border-white/10 space-y-2">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-medium">Completed Orders</span>
                  <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400">
                    <ShoppingCart className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-foreground tracking-tight">
                    {dataset.summaryKpis.completedOrders}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    {dataset.summaryKpis.totalOrders} total ({dataset.summaryKpis.cancelledOrders} cancelled)
                  </p>
                </div>
              </Card>

              <Card className="p-5 border-white/10 space-y-2">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-medium">Average Order Value</span>
                  <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                    <Zap className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-foreground tracking-tight">
                    ₹{dataset.summaryKpis.avgOrderValue.toLocaleString("en-IN")}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    {dataset.summaryKpis.totalUnitsSold} total cans dispatched
                  </p>
                </div>
              </Card>

              <Card className="p-5 border-white/10 space-y-2">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-medium">Repeat Purchase Rate</span>
                  <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
                    <Repeat className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-foreground tracking-tight">
                    {dataset.summaryKpis.repeatCustomerRate}%
                  </p>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    {dataset.summaryKpis.totalCustomers} unique buyer accounts
                  </p>
                </div>
              </Card>
            </div>

            {/* Category Views: Renders either Overview (all categories concise) or Expanded single category */}
            {(activeCategory === "all" || activeCategory === "sales_revenue") && (
              <CategoryASalesRevenue
                dataset={dataset}
                isExpanded={activeCategory === "sales_revenue"}
                onViewAll={() => setActiveCategory("sales_revenue")}
                onDrilldown={handleDrilldown}
              />
            )}

            {(activeCategory === "all" || activeCategory === "profitability") && (
              <CategoryBProfitability
                dataset={dataset}
                isExpanded={activeCategory === "profitability"}
                onViewAll={() => setActiveCategory("profitability")}
                onDrilldown={handleDrilldown}
              />
            )}

            {(activeCategory === "all" || activeCategory === "customer_analytics") && (
              <CategoryCCustomerAnalytics
                dataset={dataset}
                isExpanded={activeCategory === "customer_analytics"}
                onViewAll={() => setActiveCategory("customer_analytics")}
                onDrilldown={handleDrilldown}
              />
            )}

            {(activeCategory === "all" || activeCategory === "product_performance") && (
              <CategoryDProductPerformance
                dataset={dataset}
                isExpanded={activeCategory === "product_performance"}
                onViewAll={() => setActiveCategory("product_performance")}
                onDrilldown={handleDrilldown}
              />
            )}

            {(activeCategory === "all" || activeCategory === "regional_analytics") && (
              <CategoryERegionalAnalytics
                dataset={dataset}
                isExpanded={activeCategory === "regional_analytics"}
                onViewAll={() => setActiveCategory("regional_analytics")}
                onDrilldown={handleDrilldown}
              />
            )}

            {(activeCategory === "all" || activeCategory === "operational_analytics") && (
              <CategoryFOperationalAnalytics
                dataset={dataset}
                isExpanded={activeCategory === "operational_analytics"}
                onViewAll={() => setActiveCategory("operational_analytics")}
                onDrilldown={handleDrilldown}
              />
            )}

            {(activeCategory === "all" || activeCategory === "inventory_analytics") && (
              <CategoryGInventoryAnalytics
                dataset={dataset}
                isExpanded={activeCategory === "inventory_analytics"}
                onViewAll={() => setActiveCategory("inventory_analytics")}
                onDrilldown={handleDrilldown}
              />
            )}

            {(activeCategory === "all" || activeCategory === "marketing_loyalty") && (
              <CategoryHMarketingLoyalty
                dataset={dataset}
                isExpanded={activeCategory === "marketing_loyalty"}
                onViewAll={() => setActiveCategory("marketing_loyalty")}
                onDrilldown={handleDrilldown}
              />
            )}

            {(activeCategory === "all" || activeCategory === "customer_experience") && (
              <CategoryICustomerExperience
                dataset={dataset}
                isExpanded={activeCategory === "customer_experience"}
                onViewAll={() => setActiveCategory("customer_experience")}
                onDrilldown={handleDrilldown}
              />
            )}
          </div>
        )}
      </div>

      {/* Interactive Drilldown Modal */}
      <BIDrilldownModal data={drilldown} onClose={handleCloseDrilldown} />
    </div>
  );
}
