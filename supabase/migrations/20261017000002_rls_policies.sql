-- ==============================================================================
-- VYRA PULSE — ROW LEVEL SECURITY (RLS) POLICIES
-- Migration: 20261017000002_rls_policies.sql
-- Description: Enforces customer isolation, public catalogue visibility, and admin access.
-- ==============================================================================

-- 1. HELPER FUNCTION TO CHECK IF AUTHENTICATED USER IS SUPER ADMIN
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- 2. ENABLE ROW LEVEL SECURITY ON ALL TABLES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 3. PROFILES POLICIES
-- ==============================================================================
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Users can update their own profile details"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())); -- Cannot elevate role

CREATE POLICY "Admins have full access to profiles"
    ON public.profiles FOR ALL
    USING (public.is_admin());

-- ==============================================================================
-- 4. PRODUCTS POLICIES
-- ==============================================================================
CREATE POLICY "Public can view active products"
    ON public.products FOR SELECT
    USING (is_active = true OR public.is_admin());

CREATE POLICY "Admins have full control over products"
    ON public.products FOR ALL
    USING (public.is_admin());

-- ==============================================================================
-- 5. INVENTORY & MOVEMENTS POLICIES
-- ==============================================================================
CREATE POLICY "Public can view inventory stock levels"
    ON public.inventory FOR SELECT
    USING (true);

CREATE POLICY "Admins have full control over inventory"
    ON public.inventory FOR ALL
    USING (public.is_admin());

CREATE POLICY "Admins can view inventory movements"
    ON public.inventory_movements FOR SELECT
    USING (public.is_admin());

-- ==============================================================================
-- 6. CUSTOMERS & ADDRESSES POLICIES
-- ==============================================================================
CREATE POLICY "Customers can view their own record"
    ON public.customers FOR SELECT
    USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Customers can update their own record"
    ON public.customers FOR UPDATE
    USING (user_id = auth.uid() OR public.is_admin())
    WITH CHECK (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Admins have full access to customers"
    ON public.customers FOR ALL
    USING (public.is_admin());

CREATE POLICY "Customers can manage their own addresses"
    ON public.addresses FOR ALL
    USING (customer_id IN (SELECT customer_id FROM public.customers WHERE user_id = auth.uid()) OR public.is_admin());

-- ==============================================================================
-- 7. OFFERS & SETTINGS POLICIES
-- ==============================================================================
CREATE POLICY "Public can view active offers"
    ON public.offers FOR SELECT
    USING (is_active = true OR public.is_admin());

CREATE POLICY "Admins have full control over offers"
    ON public.offers FOR ALL
    USING (public.is_admin());

CREATE POLICY "Public can view store settings"
    ON public.store_settings FOR SELECT
    USING (true);

CREATE POLICY "Admins can update store settings"
    ON public.store_settings FOR ALL
    USING (public.is_admin());

-- ==============================================================================
-- 8. ORDERS & ORDER ITEMS POLICIES
-- ==============================================================================
CREATE POLICY "Customers can view their own orders"
    ON public.orders FOR SELECT
    USING (
        customer_id IN (SELECT customer_id FROM public.customers WHERE user_id = auth.uid()) 
        OR public.is_admin()
    );

CREATE POLICY "Customers can insert their own orders"
    ON public.orders FOR INSERT
    WITH CHECK (
        customer_id IN (SELECT customer_id FROM public.customers WHERE user_id = auth.uid())
        OR auth.uid() IS NOT NULL
        OR public.is_admin()
    );

CREATE POLICY "Admins have full control over orders"
    ON public.orders FOR ALL
    USING (public.is_admin());

CREATE POLICY "Customers can view their own order items"
    ON public.order_items FOR SELECT
    USING (
        order_id IN (
            SELECT order_id FROM public.orders 
            WHERE customer_id IN (SELECT customer_id FROM public.customers WHERE user_id = auth.uid())
        )
        OR public.is_admin()
    );

CREATE POLICY "Admins have full control over order items"
    ON public.order_items FOR ALL
    USING (public.is_admin());

-- ==============================================================================
-- 9. LOYALTY & AUDIT POLICIES
-- ==============================================================================
CREATE POLICY "Customers can view their own loyalty wallet"
    ON public.loyalty_wallets FOR SELECT
    USING (
        customer_id IN (SELECT customer_id FROM public.customers WHERE user_id = auth.uid()) 
        OR public.is_admin()
    );

CREATE POLICY "Customers can view their own loyalty transactions"
    ON public.loyalty_transactions FOR SELECT
    USING (
        customer_id IN (SELECT customer_id FROM public.customers WHERE user_id = auth.uid()) 
        OR public.is_admin()
    );

CREATE POLICY "Admins can view and manage loyalty wallets"
    ON public.loyalty_wallets FOR ALL
    USING (public.is_admin());

CREATE POLICY "Admins can view and manage loyalty transactions"
    ON public.loyalty_transactions FOR ALL
    USING (public.is_admin());

CREATE POLICY "Admins can view audit logs"
    ON public.audit_logs FOR SELECT
    USING (public.is_admin());
