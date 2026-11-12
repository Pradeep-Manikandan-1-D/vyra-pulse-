-- ==============================================================================
-- VYRA PULSE — AUXILIARY FEATURES MIGRATION
-- Migration: 20261017000005_auxiliary_features.sql
-- Description: Adds favorites, subscriptions, support tickets tables, RLS policies,
-- transactional adjust_inventory RPC, and process_checkout wrapper RPC.
-- ==============================================================================

-- 1. FAVORITES TABLE
CREATE TABLE IF NOT EXISTS public.favorites (
    favorite_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id TEXT NOT NULL REFERENCES public.customers(customer_id) ON DELETE CASCADE,
    product_id TEXT NOT NULL REFERENCES public.products(product_id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_favorite UNIQUE (customer_id, product_id)
);
CREATE INDEX IF NOT EXISTS idx_favorites_customer ON public.favorites(customer_id);

-- 2. SUBSCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS public.subscriptions (
    subscription_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id TEXT NOT NULL REFERENCES public.customers(customer_id) ON DELETE CASCADE,
    product_id TEXT NOT NULL REFERENCES public.products(product_id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL DEFAULT 4 CHECK (quantity > 0),
    frequency TEXT NOT NULL DEFAULT 'biweekly' CHECK (frequency IN ('weekly', 'biweekly', 'monthly')),
    status TEXT NOT NULL CHECK (status IN ('active', 'paused', 'cancelled')) DEFAULT 'active',
    price_per_delivery NUMERIC(10, 2) NOT NULL DEFAULT 0.0 CHECK (price_per_delivery >= 0),
    next_delivery_date DATE DEFAULT (CURRENT_DATE + INTERVAL '14 days'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE INDEX IF NOT EXISTS idx_subscriptions_customer ON public.subscriptions(customer_id);

-- 3. SUPPORT_TICKETS TABLE
CREATE TABLE IF NOT EXISTS public.support_tickets (
    ticket_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id TEXT NOT NULL REFERENCES public.customers(customer_id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('order', 'subscription', 'delivery', 'flavor', 'account', 'other')) DEFAULT 'order',
    message TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')) DEFAULT 'open',
    priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
    response TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE INDEX IF NOT EXISTS idx_tickets_customer ON public.support_tickets(customer_id);

-- 4. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- 5. RLS POLICIES FOR NEW TABLES
-- Customer isolation: Customers can access and modify only their own records.
-- Admins have administrative oversight.

-- Favorites Policies
DROP POLICY IF EXISTS "Customers can view their own favorites" ON public.favorites;
CREATE POLICY "Customers can view their own favorites"
    ON public.favorites FOR SELECT
    USING (customer_id IN (SELECT customer_id FROM public.customers WHERE user_id = auth.uid()) OR public.is_admin());

DROP POLICY IF EXISTS "Customers can insert/delete their own favorites" ON public.favorites;
CREATE POLICY "Customers can insert/delete their own favorites"
    ON public.favorites FOR ALL
    USING (customer_id IN (SELECT customer_id FROM public.customers WHERE user_id = auth.uid()) OR public.is_admin())
    WITH CHECK (customer_id IN (SELECT customer_id FROM public.customers WHERE user_id = auth.uid()) OR public.is_admin());

-- Subscriptions Policies
DROP POLICY IF EXISTS "Customers can view their own subscriptions" ON public.subscriptions;
CREATE POLICY "Customers can view their own subscriptions"
    ON public.subscriptions FOR SELECT
    USING (customer_id IN (SELECT customer_id FROM public.customers WHERE user_id = auth.uid()) OR public.is_admin());

DROP POLICY IF EXISTS "Customers can manage their own subscriptions" ON public.subscriptions;
CREATE POLICY "Customers can manage their own subscriptions"
    ON public.subscriptions FOR ALL
    USING (customer_id IN (SELECT customer_id FROM public.customers WHERE user_id = auth.uid()) OR public.is_admin())
    WITH CHECK (customer_id IN (SELECT customer_id FROM public.customers WHERE user_id = auth.uid()) OR public.is_admin());

-- Support Tickets Policies
DROP POLICY IF EXISTS "Customers can view their own support tickets" ON public.support_tickets;
CREATE POLICY "Customers can view their own support tickets"
    ON public.support_tickets FOR SELECT
    USING (customer_id IN (SELECT customer_id FROM public.customers WHERE user_id = auth.uid()) OR public.is_admin());

DROP POLICY IF EXISTS "Customers can manage their own support tickets" ON public.support_tickets;
CREATE POLICY "Customers can manage their own support tickets"
    ON public.support_tickets FOR ALL
    USING (customer_id IN (SELECT customer_id FROM public.customers WHERE user_id = auth.uid()) OR public.is_admin())
    WITH CHECK (customer_id IN (SELECT customer_id FROM public.customers WHERE user_id = auth.uid()) OR public.is_admin());

-- 6. RPC: adjust_inventory (Atomic, Transaction-Safe with Concurrency Locking & Audit Trail)
CREATE OR REPLACE FUNCTION public.adjust_inventory(
    p_product_id TEXT,
    p_delta INTEGER,
    p_note TEXT DEFAULT 'Manual admin adjustment'
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_inventory RECORD;
BEGIN
    -- Authorization check: Admin only
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Permission denied: only admins can adjust inventory';
    END IF;

    -- Concurrency lock
    SELECT * INTO v_inventory 
    FROM public.inventory 
    WHERE product_id = p_product_id 
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Inventory record for product % not found', p_product_id;
    END IF;

    -- Atomic stock adjustment
    UPDATE public.inventory
    SET stock_on_hand = GREATEST(0, stock_on_hand + p_delta),
        last_updated_at = NOW()
    WHERE product_id = p_product_id;

    -- Audit trail in inventory movements ledger
    INSERT INTO public.inventory_movements (
        product_id,
        quantity_change,
        movement_type,
        reason,
        created_at,
        actor_user_id
    ) VALUES (
        p_product_id,
        p_delta,
        'manual_adjustment',
        p_note,
        NOW(),
        auth.uid()
    );
END;
$$;

-- 7. CHECKOUT RPC WRAPPER (Compatibility Bridge for process_checkout -> process_customer_checkout)
CREATE OR REPLACE FUNCTION public.process_checkout(
    p_customer_id TEXT DEFAULT NULL,
    p_items JSONB DEFAULT '[]'::jsonb,
    p_delivery_city TEXT DEFAULT 'Default City',
    p_delivery_state TEXT DEFAULT 'Default State',
    p_delivery_postal_code TEXT DEFAULT '000000',
    p_delivery_location TEXT DEFAULT '',
    p_coupon_code TEXT DEFAULT NULL,
    p_delivery_full_name TEXT DEFAULT NULL,
    p_delivery_phone TEXT DEFAULT NULL,
    p_delivery_address_line1 TEXT DEFAULT NULL,
    p_delivery_address_line2 TEXT DEFAULT NULL,
    p_delivery_pincode TEXT DEFAULT NULL,
    p_offer_code TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_actual_customer_id TEXT := p_customer_id;
    v_actual_city TEXT := p_delivery_city;
    v_actual_state TEXT := p_delivery_state;
    v_actual_postal TEXT := COALESCE(p_delivery_pincode, p_delivery_postal_code, '000000');
    v_actual_location TEXT := p_delivery_location;
    v_actual_coupon TEXT := COALESCE(p_offer_code, p_coupon_code);
    v_result JSONB;
BEGIN
    -- Fallback: resolve customer_id from authenticated caller if omitted
    IF v_actual_customer_id IS NULL THEN
        SELECT customer_id INTO v_actual_customer_id
        FROM public.customers
        WHERE user_id = auth.uid()
        LIMIT 1;
    END IF;

    IF v_actual_customer_id IS NULL THEN
        RAISE EXCEPTION 'Customer ID could not be identified for checkout.';
    END IF;

    -- Assemble delivery location from line items if blank
    IF v_actual_location IS NULL OR TRIM(v_actual_location) = '' THEN
        v_actual_location := CONCAT_WS(', ', p_delivery_full_name, p_delivery_phone, p_delivery_address_line1, p_delivery_address_line2);
    END IF;

    -- Invoke the canonical checkout routine
    v_result := public.process_customer_checkout(
        v_actual_customer_id,
        p_items,
        v_actual_city,
        v_actual_state,
        v_actual_postal,
        v_actual_location,
        v_actual_coupon
    );

    -- Format response with standard keys for client consumption
    RETURN jsonb_build_object(
        'order_id', v_result->>'order_id',
        'order_code', v_result->>'order_id',
        'total_amount', (v_result->>'order_total_inr')::NUMERIC,
        'points_earned', (v_result->>'points_earned')::INTEGER,
        'raw', v_result
    );
END;
$$;
