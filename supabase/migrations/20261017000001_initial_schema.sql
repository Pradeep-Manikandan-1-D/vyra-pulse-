-- ==============================================================================
-- VYRA PULSE — INITIAL DATABASE SCHEMA
-- Migration: 20261017000001_initial_schema.sql
-- Description: Core tables, foreign keys, constraints, indexes, views, and triggers.
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. USER PROFILES (Links Supabase auth.users to roles)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'customer')) DEFAULT 'customer',
    display_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. PRODUCTS TABLE (Seed Source: products.csv)
CREATE TABLE IF NOT EXISTS public.products (
    product_id TEXT PRIMARY KEY,
    product_name TEXT NOT NULL,
    flavor TEXT NOT NULL,
    key_ingredients TEXT NOT NULL,
    caffeine_mg_per_330ml INTEGER NOT NULL DEFAULT 80 CHECK (caffeine_mg_per_330ml >= 0),
    volume_ml INTEGER NOT NULL DEFAULT 330 CHECK (volume_ml > 0),
    price_inr NUMERIC(10, 2) NOT NULL CHECK (price_inr >= 0),
    is_active BOOLEAN NOT NULL DEFAULT true,
    image_url TEXT DEFAULT '/assets/products/Drinks.png',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. INVENTORY TABLE (Authoritative Stock Source; Seed Source: inventory.csv)
CREATE TABLE IF NOT EXISTS public.inventory (
    inventory_id TEXT PRIMARY KEY,
    product_id TEXT UNIQUE NOT NULL REFERENCES public.products(product_id) ON DELETE RESTRICT,
    stock_on_hand INTEGER NOT NULL CHECK (stock_on_hand >= 0),
    reorder_level INTEGER NOT NULL DEFAULT 20 CHECK (reorder_level >= 0),
    location_name TEXT NOT NULL DEFAULT 'warehouse',
    last_updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. INVENTORY MOVEMENTS (Stock History Ledger)
CREATE TABLE IF NOT EXISTS public.inventory_movements (
    movement_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id TEXT NOT NULL REFERENCES public.products(product_id) ON DELETE RESTRICT,
    quantity_change INTEGER NOT NULL, -- Negative for orders, positive for restocks
    movement_type TEXT NOT NULL CHECK (movement_type IN (
        'initial_seed', 
        'order_deduction', 
        'order_cancellation_restock', 
        'manual_adjustment', 
        'supplier_restock', 
        'damaged_loss'
    )),
    related_order_id TEXT,
    actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. CUSTOMERS TABLE (Seed Source: customers.csv)
CREATE TABLE IF NOT EXISTS public.customers (
    customer_id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Optional link to auth user
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    registered_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. CUSTOMER ADDRESSES
CREATE TABLE IF NOT EXISTS public.addresses (
    address_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id TEXT NOT NULL REFERENCES public.customers(customer_id) ON DELETE CASCADE,
    address_line_1 TEXT NOT NULL,
    address_line_2 TEXT,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. OFFERS & PROMOTIONS (Seed Source: offers.csv)
CREATE TABLE IF NOT EXISTS public.offers (
    offer_id TEXT PRIMARY KEY,
    coupon_code TEXT UNIQUE NOT NULL,
    offer_name TEXT NOT NULL,
    discount_percent NUMERIC(5, 2) NOT NULL DEFAULT 0.0 CHECK (discount_percent >= 0 AND discount_percent <= 100),
    discount_amount_inr NUMERIC(10, 2) DEFAULT 0.0 CHECK (discount_amount_inr >= 0),
    minimum_order_value_inr NUMERIC(10, 2) NOT NULL DEFAULT 0.0 CHECK (minimum_order_value_inr >= 0),
    valid_from DATE NOT NULL,
    valid_until DATE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 9. ORDERS TABLE (Seed Source: orders.csv)
CREATE TABLE IF NOT EXISTS public.orders (
    order_id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL REFERENCES public.customers(customer_id) ON DELETE RESTRICT,
    ordered_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    order_day TEXT NOT NULL,
    order_time_local TEXT NOT NULL,
    delivery_city TEXT NOT NULL,
    delivery_state TEXT NOT NULL,
    delivery_postal_code TEXT NOT NULL,
    delivery_location TEXT NOT NULL,
    subtotal_inr NUMERIC(10, 2) NOT NULL CHECK (subtotal_inr >= 0),
    discount_amount_inr NUMERIC(10, 2) NOT NULL DEFAULT 0.0 CHECK (discount_amount_inr >= 0),
    delivery_fee_inr NUMERIC(10, 2) NOT NULL DEFAULT 0.0 CHECK (delivery_fee_inr >= 0),
    order_total_inr NUMERIC(10, 2) NOT NULL CHECK (order_total_inr >= 0),
    currency TEXT NOT NULL DEFAULT 'INR',
    order_status TEXT NOT NULL CHECK (order_status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')) DEFAULT 'processing',
    payment_status TEXT NOT NULL CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')) DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 10. ORDER ITEMS TABLE (Seed Source: order_items.csv)
CREATE TABLE IF NOT EXISTS public.order_items (
    order_item_id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL REFERENCES public.orders(order_id) ON DELETE CASCADE,
    product_id TEXT NOT NULL REFERENCES public.products(product_id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price_inr NUMERIC(10, 2) NOT NULL CHECK (unit_price_inr >= 0),
    line_total_inr NUMERIC(10, 2) NOT NULL CHECK (line_total_inr >= 0),
    product_name_snapshot TEXT,
    flavor_snapshot TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 11. PROMOTION REDEMPTIONS
CREATE TABLE IF NOT EXISTS public.promotion_redemptions (
    redemption_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    offer_id TEXT NOT NULL REFERENCES public.offers(offer_id) ON DELETE RESTRICT,
    customer_id TEXT NOT NULL REFERENCES public.customers(customer_id) ON DELETE RESTRICT,
    order_id TEXT NOT NULL REFERENCES public.orders(order_id) ON DELETE CASCADE,
    discount_amount_inr NUMERIC(10, 2) NOT NULL CHECK (discount_amount_inr >= 0),
    redeemed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 12. LOYALTY WALLETS
CREATE TABLE IF NOT EXISTS public.loyalty_wallets (
    wallet_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id TEXT UNIQUE NOT NULL REFERENCES public.customers(customer_id) ON DELETE CASCADE,
    points_balance INTEGER NOT NULL DEFAULT 0 CHECK (points_balance >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 13. LOYALTY TRANSACTIONS LEDGER
CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
    transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES public.loyalty_wallets(wallet_id) ON DELETE CASCADE,
    customer_id TEXT NOT NULL REFERENCES public.customers(customer_id) ON DELETE CASCADE,
    points_change INTEGER NOT NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN (
        'earned_purchase', 
        'earned_bonus_triple_charge', 
        'redeemed_hoodie', 
        'redeemed_drink', 
        'reversed_refund', 
        'admin_adjustment'
    )),
    reason TEXT NOT NULL,
    order_id TEXT REFERENCES public.orders(order_id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 14. STORE SETTINGS
CREATE TABLE IF NOT EXISTS public.store_settings (
    setting_id TEXT PRIMARY KEY,
    free_shipping_threshold_inr NUMERIC(10, 2) NOT NULL DEFAULT 445.0,
    standard_shipping_fee_inr NUMERIC(10, 2) NOT NULL DEFAULT 50.0,
    loyalty_points_per_can INTEGER NOT NULL DEFAULT 10,
    triple_charge_bonus_points INTEGER NOT NULL DEFAULT 50,
    hoodie_reward_threshold_points INTEGER NOT NULL DEFAULT 400,
    free_drink_reward_threshold_points INTEGER NOT NULL DEFAULT 800,
    elite_tier_threshold_points INTEGER NOT NULL DEFAULT 1200,
    store_currency TEXT NOT NULL DEFAULT 'INR',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 15. AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
    audit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    old_values JSONB,
    new_values JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 16. INDEXES FOR PERFORMANCE & QUERY ACCELERATION
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_ordered_at ON public.orders(ordered_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_order_status ON public.orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_city ON public.orders(delivery_city);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);

CREATE INDEX IF NOT EXISTS idx_inventory_product_id ON public.inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_product ON public.inventory_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_order ON public.inventory_movements(related_order_id);

CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON public.customers(user_id);
CREATE INDEX IF NOT EXISTS idx_offers_coupon_code ON public.offers(coupon_code);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_customer ON public.loyalty_transactions(customer_id);

-- ==============================================================================
-- 17. VIEWS FOR BUSINESS INTELLIGENCE & CATALOGUE
-- ==============================================================================

-- Consolidated Product Catalogue View (joins authoritative stock)
CREATE OR REPLACE VIEW public.v_product_catalogue AS
SELECT 
    p.product_id,
    p.product_name,
    p.flavor,
    p.key_ingredients,
    p.caffeine_mg_per_330ml,
    p.volume_ml,
    p.price_inr,
    p.is_active,
    p.image_url,
    COALESCE(i.stock_on_hand, 0) AS stock_quantity,
    COALESCE(i.reorder_level, 20) AS reorder_level,
    CASE 
      WHEN COALESCE(i.stock_on_hand, 0) = 0 THEN 'out_of_stock'
      WHEN COALESCE(i.stock_on_hand, 0) <= COALESCE(i.reorder_level, 20) THEN 'low_stock'
      ELSE 'in_stock'
    END AS stock_status,
    p.created_at,
    p.updated_at
FROM public.products p
LEFT JOIN public.inventory i ON p.product_id = i.product_id;

-- Regional Sales Aggregate View
CREATE OR REPLACE VIEW public.v_regional_sales AS
SELECT 
    delivery_city AS city,
    delivery_state AS state,
    COUNT(order_id) AS total_orders,
    SUM(order_total_inr) AS total_revenue_inr,
    ROUND(AVG(order_total_inr), 2) AS average_order_value_inr,
    COUNT(CASE WHEN order_status = 'delivered' THEN 1 END) AS delivered_orders,
    COUNT(CASE WHEN order_status = 'cancelled' THEN 1 END) AS cancelled_orders
FROM public.orders
GROUP BY delivery_city, delivery_state
ORDER BY total_revenue_inr DESC;

-- Customer Spend & Lifetime Intelligence View
CREATE OR REPLACE VIEW public.v_customer_intelligence AS
SELECT 
    c.customer_id,
    c.first_name || ' ' || c.last_name AS full_name,
    c.email,
    c.city,
    c.state,
    c.registered_at,
    COALESCE(COUNT(o.order_id), 0) AS order_count,
    COALESCE(SUM(CASE WHEN o.order_status != 'cancelled' THEN o.order_total_inr ELSE 0 END), 0) AS eligible_net_spend_inr,
    COALESCE(ROUND(AVG(CASE WHEN o.order_status != 'cancelled' THEN o.order_total_inr END), 2), 0) AS average_order_value_inr,
    COALESCE(w.points_balance, 0) AS loyalty_points_balance,
    CASE 
        WHEN COUNT(o.order_id) > 1 THEN 'returning'
        WHEN COUNT(o.order_id) = 1 THEN 'first_time'
        ELSE 'prospect'
    END AS customer_segment
FROM public.customers c
LEFT JOIN public.orders o ON c.customer_id = o.customer_id
LEFT JOIN public.loyalty_wallets w ON c.customer_id = w.customer_id
GROUP BY c.customer_id, c.first_name, c.last_name, c.email, c.city, c.state, c.registered_at, w.points_balance;
