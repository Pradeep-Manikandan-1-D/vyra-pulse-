// ─── Vyra Pulse — Shared Database Types ────────────────────────────────────
// These mirror the PostgreSQL schema defined in supabase/migrations.
// Never trust client-submitted prices or totals; use server-validated values.

export type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type Role = "admin" | "customer";
export type OfferType = "percentage" | "fixed" | "free_shipping";

// ─── Products ────────────────────────────────────────────────────────────────

export interface Product {
  id: string;                   // e.g. "VP-CIT-001"
  name: string;
  flavor: string;
  key_ingredients: string;
  caffeine_mg: number;
  volume_ml: number;
  price: number;                // NUMERIC(10,2) stored as string from PG, cast to number
  active: boolean;
  image_path: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Customers ───────────────────────────────────────────────────────────────

export interface Customer {
  id: string;                   // matches auth.users.id when linked
  customer_code: string;        // e.g. "CUST-0001"
  full_name: string;
  email: string;
  phone: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  loyalty_tier: string | null;
  total_orders: number;
  total_spent: number;
  created_at: string;
}

// ─── Profiles ────────────────────────────────────────────────────────────────

export interface Profile {
  id: string;
  role: Role;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

// ─── Orders ──────────────────────────────────────────────────────────────────

export interface Order {
  id: string;
  customer_id: string;
  order_code: string;           // e.g. "ORD-001"
  order_status: OrderStatus;
  payment_status: PaymentStatus;
  subtotal: number;
  discount_amount: number;
  delivery_fee: number;
  total_amount: number;
  delivery_city: string | null;
  delivery_state: string | null;
  offer_code: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Optional joined fields
  customers?: Pick<Customer, "full_name" | "email" | "city">;
  order_items?: OrderItem[];
}

// ─── Order Items ─────────────────────────────────────────────────────────────

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;           // historical price snapshot
  line_total: number;
  product_name_snapshot: string;
  flavor_snapshot: string;
  // Optional joined
  products?: Pick<Product, "name" | "flavor" | "image_path">;
}

// ─── Inventory ───────────────────────────────────────────────────────────────

export interface Inventory {
  id: string;
  product_id: string;
  stock_quantity: number;
  reorder_level: number;
  location: string | null;
  updated_at: string;
  // Optional joined
  products?: Pick<Product, "name" | "flavor" | "price">;
}

// ─── Offers ──────────────────────────────────────────────────────────────────

export interface Offer {
  id: string;
  offer_code: string;
  offer_name: string;
  offer_type: OfferType;
  discount_value: number;
  minimum_order_value: number;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
  max_redemptions: number | null;
  redemption_count: number;
  created_at: string;
}

// ─── Loyalty ─────────────────────────────────────────────────────────────────

export interface LoyaltyWallet {
  id: string;
  customer_id: string;
  balance: number;
  lifetime_earned: number;
  updated_at: string;
}

export interface LoyaltyTransaction {
  id: string;
  wallet_id: string;
  order_id: string | null;
  transaction_type: "earned" | "redeemed" | "adjusted" | "reversed";
  points: number;
  description: string | null;
  created_at: string;
}

// ─── Cart (client-side only) ──────────────────────────────────────────────────

export interface CartItem {
  product_id: string;
  name: string;
  flavor: string;
  price: number;               // current price at time of add
  quantity: number;
  image_path: string | null;
  accentColor: string;
}

// ─── Checkout / RPC ──────────────────────────────────────────────────────────

export interface CheckoutLineItem {
  product_id: string;
  quantity: number;
}

export interface CheckoutPayload {
  items: CheckoutLineItem[];
  delivery_address: {
    full_name: string;
    phone: string;
    address_line1: string;
    address_line2?: string;
    city: string;
    state: string;
    pincode: string;
  };
  offer_code?: string;
}

export interface CheckoutResult {
  order_id: string;
  order_code: string;
  total_amount: number;
  points_earned: number;
}

// ─── Analytics / BI ──────────────────────────────────────────────────────────

export interface AdminKPIs {
  total_revenue: number;
  total_orders: number;
  completed_orders: number;
  total_customers: number;
  avg_order_value: number;
  units_sold: number;
  low_stock_count: number;
}

export interface RevenueByDay {
  day: string;
  revenue: number;
  orders: number;
}

export interface TopProduct {
  product_id: string;
  product_name: string;
  flavor: string;
  units_sold: number;
  revenue: number;
}
