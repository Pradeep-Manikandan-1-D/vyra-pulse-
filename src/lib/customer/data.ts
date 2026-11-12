import seedCache from "./seed-cache.json";

export interface CustomerOrderItem {
  product_id: string;
  product_name_snapshot: string;
  flavor_snapshot: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface CustomerOrder {
  id: string;
  order_code: string;
  customer_id: string;
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
}

export interface LoyaltyTx {
  id: string;
  order_id?: string | null;
  transaction_type: "earned" | "redeemed" | "adjusted";
  points: number;
  description: string;
  created_at: string;
}

export interface CustomerRecord {
  customer_id: string;
  customer_code: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  password?: string;
  phone: string;
  city: string;
  state: string;
  postal_code: string;
  registered_at: string;
  loyalty_tier: "Platinum" | "Gold" | "Silver" | "Bronze";
  total_orders: number;
  total_spent: number;
  initial_points: number;
  orders: CustomerOrder[];
}

interface CacheStructure {
  byEmail: Record<string, CustomerRecord>;
  byCode: Record<string, CustomerRecord>;
}

const cache = seedCache as unknown as CacheStructure;

/**
 * Super Admin Credentials Check
 * Supports canonical administrator identity (admin@gmail.com) with documented demo passwords (admin123, admin@123!)
 * Also supports administrative employee ID aliases (admin, emp-001) for internal previewing.
 */
export function verifyAdminCredentials(
  emailOrId: string,
  password: string
): { success: boolean; error?: string } {
  if (process.env.NODE_ENV === "production") {
    return {
      success: false,
      error: "Demo administrator fallback is disabled in production. Please authenticate with Supabase Auth.",
    };
  }

  const norm = emailOrId.toLowerCase().trim();
  const validAdmins = ["admin@gmail.com", "admin", "emp-001", "superadmin@gmail.com"];
  const validPasswords = ["admin123", "admin@123!", "admin@123"];

  if (validAdmins.includes(norm) && validPasswords.includes(password.trim())) {
    return { success: true };
  }
  return { success: false, error: "Invalid administrator email or password." };
}

/**
 * Look up customer strictly by normalized email
 */
export function getCustomerByEmail(email: string): CustomerRecord | null {
  const norm = email.toLowerCase().trim();
  const found = cache.byEmail[norm];
  if (!found) return null;
  // Return shallow copy without sensitive password
  const { password: _, ...safe } = found;
  return safe as CustomerRecord;
}

/**
 * Look up customer strictly by customer ID / code
 */
export function getCustomerById(customerId: string): CustomerRecord | null {
  const norm = customerId.toUpperCase().trim();
  const found = cache.byCode[norm];
  if (!found) return null;
  const { password: _, ...safe } = found;
  return safe as CustomerRecord;
}

/**
 * Get all registered customers for administrative views
 */
export function getAllCustomers(): CustomerRecord[] {
  return Object.values(cache.byCode).map((c) => {
    const { password: _, ...safe } = c;
    return safe as CustomerRecord;
  });
}

/**
 * Verify customer credentials strictly
 * Supports lookup by Email address OR Customer ID (e.g., CUST-0001, cust-0001, 1).
 * Validates against verified dataset credentials.
 */
export function verifyCustomerCredentials(
  identifier: string,
  password: string
): { success: boolean; customer?: CustomerRecord; error?: string } {
  if (process.env.NODE_ENV === "production") {
    return {
      success: false,
      error: "Demo customer fallback is disabled in production. Please sign in with your Supabase account.",
    };
  }

  const raw = (identifier || "").trim();
  if (!raw || !password) {
    return { success: false, error: "Please enter both identifier and password." };
  }

  const normEmail = raw.toLowerCase();
  const normCode = raw.toUpperCase();

  // Find either by email or customer_id
  let found = cache.byEmail[normEmail] || cache.byCode[normCode];

  // Also check if entered numeric ID e.g. "1" -> "CUST-0001"
  if (!found && /^\d+$/.test(raw)) {
    const formatted = `CUST-${raw.padStart(4, "0")}`;
    found = cache.byCode[formatted];
  }

  if (!found) {
    return { success: false, error: "Invalid email or customer ID." };
  }

  const userPrefix = found.email.split("@")[0];
  const codeLower = found.customer_code.toLowerCase();
  const expectedPassword = found.password || userPrefix;

  // Strict check matching canonical credentials or standard demo pattern
  const isMatch =
    password.trim() === expectedPassword ||
    password.trim() === `${userPrefix}123` ||
    password.trim() === codeLower ||
    password.trim() === "password123";

  if (!isMatch) {
    return { success: false, error: "Invalid email or password." };
  }

  const { password: _, ...safe } = found;
  return { success: true, customer: safe as CustomerRecord };
}

/**
 * Retrieve customer orders isolated strictly to this customer_id
 */
export function getCustomerOrders(customerId: string): CustomerOrder[] {
  const norm = customerId.toUpperCase().trim();
  const baseCustomer = cache.byCode[norm];
  const baseOrders: CustomerOrder[] = baseCustomer?.orders || [];

  if (typeof window === "undefined") {
    return baseOrders;
  }

  try {
    const localKey = `vyra_customer_${norm}_orders`;
    const stored = localStorage.getItem(localKey);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return [...parsed, ...baseOrders];
      }
    }
  } catch (err) {
    console.warn("Could not read isolated customer orders:", err);
  }

  return baseOrders;
}

/**
 * Record a new order strictly isolated to this customer_id
 */
export function recordCustomerOrder(customerId: string, order: CustomerOrder): void {
  if (typeof window === "undefined") return;

  const norm = customerId.toUpperCase().trim();
  const localKey = `vyra_customer_${norm}_orders`;

  try {
    const existing = JSON.parse(localStorage.getItem(localKey) || "[]");
    localStorage.setItem(localKey, JSON.stringify([order, ...existing]));

    // Also credit points to isolated customer wallet
    const walletKey = `vyra_customer_${norm}_wallet`;
    const currentWallet = getCustomerWallet(norm);
    const earned = order.points_earned || Math.round(order.total_amount / 149) * 10;

    currentWallet.balance += earned;
    currentWallet.lifetime += earned;
    currentWallet.history.unshift({
      id: `tx-${Date.now()}`,
      order_id: order.order_code,
      transaction_type: "earned",
      points: earned,
      description: `Order ${order.order_code} reward points`,
      created_at: new Date().toISOString(),
    });

    localStorage.setItem(walletKey, JSON.stringify(currentWallet));
  } catch (err) {
    console.warn("Could not record isolated customer order:", err);
  }
}

/**
 * Retrieve customer wallet strictly isolated to this customer_id
 */
export function getCustomerWallet(customerId: string): {
  balance: number;
  lifetime: number;
  history: LoyaltyTx[];
} {
  const norm = customerId.toUpperCase().trim();
  const baseCustomer = cache.byCode[norm];

  // Base balance calculated deterministically from legitimate orders
  let baseBalance = baseCustomer?.initial_points || 0;
  let baseLifetime = baseCustomer?.initial_points || 0;
  const baseHistory: LoyaltyTx[] = (baseCustomer?.orders || [])
    .filter((o) => o.payment_status === "paid")
    .map((o) => ({
      id: `tx-${o.id}`,
      order_id: o.order_code,
      transaction_type: "earned" as const,
      points: o.points_earned || 10,
      description: `Order ${o.order_code} reward points`,
      created_at: o.created_at,
    }));

  if (typeof window === "undefined") {
    return { balance: baseBalance, lifetime: baseLifetime, history: baseHistory };
  }

  try {
    const walletKey = `vyra_customer_${norm}_wallet`;
    const stored = localStorage.getItem(walletKey);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        balance: parsed.balance ?? baseBalance,
        lifetime: parsed.lifetime ?? baseLifetime,
        history: parsed.history && parsed.history.length > 0 ? parsed.history : baseHistory,
      };
    }
  } catch (err) {
    console.warn("Could not read isolated customer wallet:", err);
  }

  return { balance: baseBalance, lifetime: baseLifetime, history: baseHistory };
}

/**
 * Retrieve customer profile strictly isolated to this customer_id
 */
export function getCustomerProfile(customerId: string): {
  fullName: string;
  phone: string;
  city: string;
  state: string;
  addressLine: string;
  pincode: string;
  email: string;
} {
  const norm = customerId.toUpperCase().trim();
  const baseCustomer = cache.byCode[norm];

  const defaultProfile = {
    fullName: baseCustomer?.full_name || "Vyra Customer",
    phone: baseCustomer?.phone || "+91-9000000000",
    city: baseCustomer?.city || "Bengaluru",
    state: baseCustomer?.state || "Karnataka",
    addressLine: baseCustomer?.city ? `${baseCustomer.city} Delivery Address` : "14/2 Indiranagar 100ft Road",
    pincode: baseCustomer?.postal_code || "560001",
    email: baseCustomer?.email || "",
  };

  if (typeof window === "undefined") return defaultProfile;

  try {
    const profileKey = `vyra_customer_${norm}_profile`;
    const stored = localStorage.getItem(profileKey);
    if (stored) {
      return { ...defaultProfile, ...JSON.parse(stored) };
    }
  } catch (err) {
    console.warn("Could not read isolated customer profile:", err);
  }

  return defaultProfile;
}

/**
 * Save customer profile strictly isolated to this customer_id
 */
export function saveCustomerProfile(
  customerId: string,
  profileData: Partial<{
    fullName: string;
    phone: string;
    city: string;
    state: string;
    addressLine: string;
    pincode: string;
  }>
): void {
  if (typeof window === "undefined") return;

  const norm = customerId.toUpperCase().trim();
  const profileKey = `vyra_customer_${norm}_profile`;

  try {
    const current = getCustomerProfile(norm);
    const updated = { ...current, ...profileData };
    localStorage.setItem(profileKey, JSON.stringify(updated));
  } catch (err) {
    console.warn("Could not save isolated customer profile:", err);
  }
}

/**
 * Clear customer cached data on logout
 */
export function clearCurrentCustomerSession(): void {
  if (typeof window === "undefined") return;
  try {
    // Remove legacy un-isolated keys if present to prevent any cross-leakage
    localStorage.removeItem("vyra_demo_wallet");
    localStorage.removeItem("vyra_demo_orders");
    localStorage.removeItem("vyra_customer_profile");
    localStorage.removeItem("vyra-dev-auth");
  } catch {
    // Ignore
  }
}

// ─── CUSTOMER FAVORITES (ISOLATED PER CUSTOMER) ──────────────────────────────

/**
 * Retrieve saved favorite product IDs for this customer
 */
export function getCustomerFavorites(customerId: string): string[] {
  if (typeof window === "undefined") return ["VP-CIT-001", "VP-BLU-002"];
  const norm = customerId.toUpperCase().trim();
  try {
    const key = `vyra_customer_${norm}_favorites`;
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // fallback
  }
  // Default sensible favorites for demo
  return ["VP-CIT-001", "VP-BLU-002"];
}

/**
 * Toggle favorite status of a product for this customer
 */
export function toggleCustomerFavorite(customerId: string, productId: string): string[] {
  if (typeof window === "undefined") return [];
  const norm = customerId.toUpperCase().trim();
  const current = getCustomerFavorites(norm);
  const exists = current.includes(productId);
  const updated = exists ? current.filter((id) => id !== productId) : [...current, productId];

  try {
    const key = `vyra_customer_${norm}_favorites`;
    localStorage.setItem(key, JSON.stringify(updated));
  } catch (err) {
    console.warn("Could not save customer favorites:", err);
  }

  return updated;
}

// ─── CUSTOMER SUBSCRIPTIONS (ISOLATED PER CUSTOMER) ──────────────────────────

export interface CustomerSubscription {
  id: string;
  customer_id: string;
  product_id: string;
  product_name: string;
  flavor: string;
  quantity: number;
  frequency: "weekly" | "biweekly" | "monthly";
  status: "active" | "paused" | "cancelled";
  price_per_delivery: number;
  next_delivery_date: string;
  created_at: string;
}

/**
 * Retrieve recurring order subscriptions for this customer
 */
export function getCustomerSubscriptions(customerId: string): CustomerSubscription[] {
  const norm = customerId.toUpperCase().trim();
  const defaultSub: CustomerSubscription[] = [
    {
      id: `sub-${norm}-01`,
      customer_id: norm,
      product_id: "VP-CIT-001",
      product_name: "Vyra Pulse Citrus Charge",
      flavor: "Citrus (Lemon-Lime)",
      quantity: 4,
      frequency: "biweekly",
      status: "active",
      price_per_delivery: 536.4, // 10% sub discount on ₹596
      next_delivery_date: new Date(Date.now() + 86400000 * 5).toISOString().split("T")[0],
      created_at: new Date(Date.now() - 86400000 * 20).toISOString(),
    },
  ];

  if (typeof window === "undefined") return defaultSub;

  try {
    const key = `vyra_customer_${norm}_subscriptions`;
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // fallback
  }

  return defaultSub;
}

/**
 * Update a subscription status (pause, resume, cancel)
 */
export function updateCustomerSubscription(
  customerId: string,
  subId: string,
  status: "active" | "paused" | "cancelled"
): CustomerSubscription[] {
  if (typeof window === "undefined") return [];
  const norm = customerId.toUpperCase().trim();
  const current = getCustomerSubscriptions(norm);
  const updated = current.map((s) => (s.id === subId ? { ...s, status } : s));

  try {
    const key = `vyra_customer_${norm}_subscriptions`;
    localStorage.setItem(key, JSON.stringify(updated));
  } catch (err) {
    console.warn("Could not save customer subscriptions:", err);
  }

  return updated;
}

/**
 * Add a new subscription for this customer
 */
export function addCustomerSubscription(
  customerId: string,
  sub: Omit<CustomerSubscription, "id" | "customer_id" | "created_at">
): CustomerSubscription[] {
  if (typeof window === "undefined") return [];
  const norm = customerId.toUpperCase().trim();
  const current = getCustomerSubscriptions(norm);
  const newSub: CustomerSubscription = {
    ...sub,
    id: `sub-${Date.now()}`,
    customer_id: norm,
    created_at: new Date().toISOString(),
  };

  const updated = [newSub, ...current];
  try {
    const key = `vyra_customer_${norm}_subscriptions`;
    localStorage.setItem(key, JSON.stringify(updated));
  } catch (err) {
    console.warn("Could not add customer subscription:", err);
  }

  return updated;
}

// ─── CUSTOMER SUPPORT TICKETS (ISOLATED PER CUSTOMER) ────────────────────────

export interface CustomerSupportTicket {
  id: string;
  customer_id: string;
  subject: string;
  category: "order" | "subscription" | "delivery" | "flavor" | "account" | "other";
  message: string;
  status: "open" | "in_progress" | "resolved";
  created_at: string;
  response?: string;
}

/**
 * Get customer support tickets
 */
export function getCustomerSupportTickets(customerId: string): CustomerSupportTicket[] {
  const norm = customerId.toUpperCase().trim();
  const defaultTickets: CustomerSupportTicket[] = [
    {
      id: `tick-001`,
      customer_id: norm,
      subject: "Delivery schedule confirmation",
      category: "delivery",
      message: "Can my next recurring order arrive before 2:00 PM?",
      status: "resolved",
      created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
      response: "Confirmed. Our courier partner is scheduled for early morning delivery.",
    },
  ];

  if (typeof window === "undefined") return defaultTickets;

  try {
    const key = `vyra_customer_${norm}_tickets`;
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // fallback
  }

  return defaultTickets;
}

/**
 * Create a new support ticket
 */
export function createCustomerSupportTicket(
  customerId: string,
  ticket: {
    subject: string;
    category: "order" | "subscription" | "delivery" | "flavor" | "account" | "other";
    message: string;
  }
): CustomerSupportTicket[] {
  if (typeof window === "undefined") return [];
  const norm = customerId.toUpperCase().trim();
  const current = getCustomerSupportTickets(norm);
  const newTicket: CustomerSupportTicket = {
    id: `tick-${Date.now()}`,
    customer_id: norm,
    subject: ticket.subject,
    category: ticket.category,
    message: ticket.message,
    status: "open",
    created_at: new Date().toISOString(),
  };

  const updated = [newTicket, ...current];
  try {
    const key = `vyra_customer_${norm}_tickets`;
    localStorage.setItem(key, JSON.stringify(updated));
  } catch (err) {
    console.warn("Could not save customer ticket:", err);
  }

  return updated;
}

// Re-export asynchronous Supabase CRUD helpers
export * from "./db";
