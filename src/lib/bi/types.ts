// ─── VYRA PULSE — BUSINESS INTELLIGENCE TYPE DEFINITIONS ─────────────────────

export type BICategoryId =
  | "all"
  | "sales_revenue"
  | "profitability"
  | "customer_analytics"
  | "product_performance"
  | "regional_analytics"
  | "operational_analytics"
  | "inventory_analytics"
  | "marketing_loyalty"
  | "customer_experience";

export interface BIFilterState {
  dateRange: "7d" | "30d" | "90d" | "all";
  flavorId: string; // "all" or specific product_id (e.g., "VP-CIT-001")
  orderStatus: string; // "all" or "delivered" | "shipped" | "processing" | "cancelled"
  stateRegion: string; // "all" or specific state (e.g., "Tamil Nadu", "Karnataka")
  searchQuery?: string;
}

export interface BIDrilldownRecord {
  id: string;
  primaryText: string;
  secondaryText: string;
  metricLabel: string;
  metricValue: string | number;
  statusBadge?: string;
  timestamp?: string;
  raw?: any;
}

export interface BIDrilldownData {
  isOpen: boolean;
  title: string;
  category: string;
  filterContext: string;
  records: BIDrilldownRecord[];
}

// ─── Category A: Sales & Revenue Types ───────────────────────────────────────
export interface RevenueTrendPoint {
  date: string;
  grossSales: number;
  discounts: number;
  netSales: number;
  completedOrders: number;
  cancelledOrders: number;
  aov: number;
}

export interface RevenueByMonthPoint {
  month: string;
  grossRevenue: number;
  netRevenue: number;
  growthPct: number;
}

export interface RevenueContributionPoint {
  name: string;
  flavor: string;
  color: string;
  revenue: number;
  units: number;
  sharePct: number;
}

export interface RegionRevenuePoint {
  region: string;
  revenue: number;
  orderCount: number;
  aov: number;
  sharePct: number;
}

// ─── Category B: Profitability Types ─────────────────────────────────────────
export interface ProfitabilityMetricStatus {
  isAvailable: boolean;
  metricName: string;
  reason: string;
  requiredFields: string[];
}

export interface DiscountImpactPoint {
  month: string;
  grossSales: number;
  discountGiven: number;
  discountPct: number;
  netRevenue: number;
}

// ─── Category C: Customer Analytics Types ─────────────────────────────────────
export interface TopCustomerPoint {
  customerId: string;
  fullName: string;
  email: string;
  city: string;
  state: string;
  orderCount: number;
  netSpend: number;
  aov: number;
  lastOrderDate: string;
  loyaltyPoints: number;
  customerSegment: "VIP" | "Frequent" | "First-Time" | "Inactive";
}

export interface CustomerCohortPoint {
  cohortMonth: string;
  cohortSize: number;
  m0: number; // % retained month 0
  m1: number; // % retained month 1
  m2: number; // % retained month 2
}

export interface PurchaseFrequencyBucket {
  orderBucket: string;
  customerCount: number;
  percentage: number;
}

export interface CustomerSegmentPoint {
  segment: string;
  count: number;
  revenueContribution: number;
  color: string;
}

// ─── Category D: Product & Flavor Types ──────────────────────────────────────
export interface ProductPerformancePoint {
  productId: string;
  productName: string;
  flavor: string;
  color: string;
  unitsSold: number;
  revenue: number;
  avgUnitPrice: number;
  cancellationRatePct: number;
  salesSharePct: number;
}

export interface ProductCombinationPoint {
  comboPair: string;
  frequency: number;
  flavorA: string;
  flavorB: string;
}

export interface FlavorPopularityPoint {
  flavor: string;
  units: number;
  revenue: number;
  color: string;
}

// ─── Category E: Regional Analytics Types ─────────────────────────────────────
export interface RegionalDataPoint {
  state: string;
  city: string;
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  revenue: number;
  aov: number;
  customerCount: number;
  topFlavor: string;
}

export interface RegionalPreferencePoint {
  region: string;
  citrus: number;
  blueberry: number;
  mango: number;
  watermelon: number;
  grape: number;
  guava: number;
  mint: number;
  peach: number;
}

// ─── Category F: Operational Analytics Types ──────────────────────────────────
export interface OrderStatusPoint {
  status: string;
  count: number;
  percentage: number;
  color: string;
}

export interface FunnelStagePoint {
  stage: string;
  count: number;
  conversionRate: number;
  color: string;
}

export interface DayOfWeekPoint {
  day: string;
  orderCount: number;
  revenue: number;
}

export interface HourOfDayPoint {
  hour: string;
  orders: number;
}

export interface OrderSizePoint {
  size: string; // e.g. "1 Can", "2 Cans", "3 Cans", "4+ Cans"
  orders: number;
}

// ─── Category G: Inventory Analytics Types ────────────────────────────────────
export interface InventoryStockPoint {
  productId: string;
  productName: string;
  flavor: string;
  stockOnHand: number;
  reorderLevel: number;
  stockStatus: "in_stock" | "low_stock" | "out_of_stock";
  retailValueInr: number;
  daysOfInventory: number;
  turnoverRatio: number;
}

export interface StockMovementPoint {
  date: string;
  stockIn: number;
  stockOut: number;
  netMovement: number;
}

// ─── Category H: Marketing & Loyalty Types ───────────────────────────────────
export interface OfferRedemptionPoint {
  offerId: string;
  couponCode: string;
  offerName: string;
  discountPct: number;
  redemptionCount: number;
  totalDiscountInr: number;
  attributedRevenueInr: number;
}

export interface LoyaltyMetrics {
  totalPointsIssued: number;
  totalPointsRedeemed: number;
  outstandingBalance: number;
  activeLoyaltyWallets: number;
  avgPointsPerMember: number;
}

export interface LoyaltyTierPoint {
  tier: string;
  memberCount: number;
  pointsRange: string;
  color: string;
}

// ─── Category I: Customer Experience Types ────────────────────────────────────
export interface ExperienceMetricStatus {
  isAvailable: boolean;
  metric: string;
  reason: string;
  recommendedSchema: string;
}

// ─── Full Aggregated BI Dataset ───────────────────────────────────────────────
export interface FullBIDataset {
  metadata: {
    generatedAt: string;
    totalOrdersCount: number;
    dataSource: "postgresql_live" | "postgresql_seed_replica";
    appliedFilterSummary: string;
  };
  summaryKpis: {
    grossSales: number;
    discountsGiven: number;
    netRevenue: number;
    completedOrders: number;
    totalOrders: number;
    cancelledOrders: number;
    totalCustomers: number;
    avgOrderValue: number;
    totalUnitsSold: number;
    repeatCustomerRate: number;
    activeOffersCount: number;
    lowStockItemCount: number;
  };
  salesRevenue: {
    revenueTrends: RevenueTrendPoint[];
    revenueByMonth: RevenueByMonthPoint[];
    productContributions: RevenueContributionPoint[];
    flavorRankings: RevenueContributionPoint[];
    regionalRevenue: RegionRevenuePoint[];
  };
  profitability: {
    cogsStatus: ProfitabilityMetricStatus;
    discountImpact: DiscountImpactPoint[];
  };
  customerAnalytics: {
    topSpenders: TopCustomerPoint[];
    customerSegments: CustomerSegmentPoint[];
    frequencyBuckets: PurchaseFrequencyBucket[];
    acquisitionTrends: { date: string; newCustomers: number }[];
    cohorts: CustomerCohortPoint[];
    customersByRegion: { region: string; count: number }[];
  };
  productPerformance: {
    products: ProductPerformancePoint[];
    flavorPopularity: FlavorPopularityPoint[];
    productCombinations: ProductCombinationPoint[];
    scatterData: { name: string; units: number; revenue: number; aov: number }[];
  };
  regionalAnalytics: {
    states: RegionalDataPoint[];
    cities: RegionalDataPoint[];
    preferences: RegionalPreferencePoint[];
  };
  operationalAnalytics: {
    statusBreakdown: OrderStatusPoint[];
    fulfillmentFunnel: FunnelStagePoint[];
    dayOfWeek: DayOfWeekPoint[];
    hourOfDay: HourOfDayPoint[];
    orderSizeDistribution: OrderSizePoint[];
  };
  inventoryAnalytics: {
    stockList: InventoryStockPoint[];
    movements: StockMovementPoint[];
    totalRetailStockValue: number;
  };
  marketingLoyalty: {
    offerRedemptions: OfferRedemptionPoint[];
    loyaltyMetrics: LoyaltyMetrics;
    loyaltyTiers: LoyaltyTierPoint[];
  };
  customerExperience: {
    status: ExperienceMetricStatus[];
  };
}
