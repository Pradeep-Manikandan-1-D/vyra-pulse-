-- ==============================================================================
-- VYRA PULSE — TRANSACTIONAL CHECKOUT RPC FUNCTION
-- Migration: 20261017000003_checkout_rpc.sql
-- Description: Transaction-safe, atomic checkout and stock reservation with concurrency locking.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.process_customer_checkout(
    p_customer_id TEXT,
    p_items JSONB, -- Array of objects: [{"product_id": "VP-CIT-001", "quantity": 3}]
    p_delivery_city TEXT,
    p_delivery_state TEXT,
    p_delivery_postal_code TEXT,
    p_delivery_location TEXT,
    p_coupon_code TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_order_id TEXT;
    v_item JSONB;
    v_product RECORD;
    v_inventory RECORD;
    v_subtotal NUMERIC(10, 2) := 0.0;
    v_discount NUMERIC(10, 2) := 0.0;
    v_delivery_fee NUMERIC(10, 2) := 0.0;
    v_order_total NUMERIC(10, 2) := 0.0;
    v_total_cans INTEGER := 0;
    v_points_earned INTEGER := 0;
    v_wallet RECORD;
    v_offer RECORD;
    v_setting RECORD;
    v_free_ship_threshold NUMERIC(10, 2) := 445.0;
    v_standard_shipping NUMERIC(10, 2) := 50.0;
    v_points_per_can INTEGER := 10;
    v_triple_bonus INTEGER := 50;
    v_day_name TEXT;
    v_time_local TEXT;
BEGIN
    -- 1. Load active store settings
    SELECT * INTO v_setting FROM public.store_settings LIMIT 1;
    IF FOUND THEN
        v_free_ship_threshold := v_setting.free_shipping_threshold_inr;
        v_standard_shipping := v_setting.standard_shipping_fee_inr;
        v_points_per_can := v_setting.loyalty_points_per_can;
        v_triple_bonus := v_setting.triple_charge_bonus_points;
    END IF;

    -- 2. Generate unique order ID
    v_order_id := 'ORD-' || LPAD(FLOOR(RANDOM() * 900000 + 100000)::TEXT, 6, '0');
    v_day_name := TO_CHAR(NOW(), 'Day');
    v_time_local := TO_CHAR(NOW(), 'HH24:MI:SS');

    -- 3. Validate customer exists
    IF NOT EXISTS (SELECT 1 FROM public.customers WHERE customer_id = p_customer_id) THEN
        RAISE EXCEPTION 'Customer % does not exist', p_customer_id;
    END IF;

    -- 4. First pass: Lock inventory rows FOR UPDATE and calculate subtotal
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        -- Lock product and inventory row
        SELECT * INTO v_product FROM public.products 
        WHERE product_id = (v_item->>'product_id') AND is_active = true;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Product % is unavailable or inactive', (v_item->>'product_id');
        END IF;

        SELECT * INTO v_inventory FROM public.inventory 
        WHERE product_id = (v_item->>'product_id') 
        FOR UPDATE; -- Row-level lock prevents concurrent race conditions

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Inventory record for product % not found', (v_item->>'product_id');
        END IF;

        IF v_inventory.stock_on_hand < (v_item->>'quantity')::INTEGER THEN
            RAISE EXCEPTION 'Insufficient stock for % (Available: %, Requested: %)', 
                v_product.product_name, v_inventory.stock_on_hand, (v_item->>'quantity')::INTEGER;
        END IF;

        v_subtotal := v_subtotal + (v_product.price_inr * (v_item->>'quantity')::INTEGER);
        v_total_cans := v_total_cans + (v_item->>'quantity')::INTEGER;
    END LOOP;

    -- 5. Validate and apply coupon discount if provided
    IF p_coupon_code IS NOT NULL AND TRIM(p_coupon_code) <> '' THEN
        SELECT * INTO v_offer FROM public.offers 
        WHERE UPPER(coupon_code) = UPPER(TRIM(p_coupon_code))
          AND is_active = true
          AND valid_from <= CURRENT_DATE 
          AND valid_until >= CURRENT_DATE;

        IF FOUND THEN
            IF v_subtotal >= v_offer.minimum_order_value_inr THEN
                IF v_offer.discount_percent > 0 THEN
                    v_discount := ROUND((v_subtotal * (v_offer.discount_percent / 100.0)), 2);
                ELSIF v_offer.discount_amount_inr > 0 THEN
                    v_discount := v_offer.discount_amount_inr;
                END IF;
            END IF;
        END IF;
    END IF;

    -- 6. Apply Delivery Fee rule (Free delivery threshold >= 445 INR)
    IF (v_subtotal - v_discount) >= v_free_ship_threshold OR v_total_cans >= 3 THEN
        v_delivery_fee := 0.0;
    ELSE
        v_delivery_fee := v_standard_shipping;
    END IF;

    v_order_total := (v_subtotal - v_discount) + v_delivery_fee;

    -- 7. Insert into orders table
    INSERT INTO public.orders (
        order_id,
        customer_id,
        ordered_at,
        order_day,
        order_time_local,
        delivery_city,
        delivery_state,
        delivery_postal_code,
        delivery_location,
        subtotal_inr,
        discount_amount_inr,
        delivery_fee_inr,
        order_total_inr,
        currency,
        order_status,
        payment_status
    ) VALUES (
        v_order_id,
        p_customer_id,
        NOW(),
        TRIM(v_day_name),
        v_time_local,
        p_delivery_city,
        p_delivery_state,
        p_delivery_postal_code,
        p_delivery_location,
        v_subtotal,
        v_discount,
        v_delivery_fee,
        v_order_total,
        'INR',
        'processing',
        'paid'
    );

    -- 8. Insert order items & deduct stock
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        SELECT * INTO v_product FROM public.products WHERE product_id = (v_item->>'product_id');

        INSERT INTO public.order_items (
            order_item_id,
            order_id,
            product_id,
            quantity,
            unit_price_inr,
            line_total_inr,
            product_name_snapshot,
            flavor_snapshot
        ) VALUES (
            'ITEM-' || LPAD(FLOOR(RANDOM() * 900000 + 100000)::TEXT, 6, '0'),
            v_order_id,
            v_product.product_id,
            (v_item->>'quantity')::INTEGER,
            v_product.price_inr,
            v_product.price_inr * (v_item->>'quantity')::INTEGER,
            v_product.product_name,
            v_product.flavor
        );

        -- Decrement authoritative stock
        UPDATE public.inventory
        SET stock_on_hand = stock_on_hand - (v_item->>'quantity')::INTEGER,
            last_updated_at = NOW()
        WHERE product_id = v_product.product_id;

        -- Record inventory movement
        INSERT INTO public.inventory_movements (
            product_id,
            quantity_change,
            movement_type,
            related_order_id,
            reason
        ) VALUES (
            v_product.product_id,
            -((v_item->>'quantity')::INTEGER),
            'order_deduction',
            v_order_id,
            'Customer order ' || v_order_id
        );
    END LOOP;

    -- 9. Record promotion redemption if discount applied
    IF v_discount > 0 AND v_offer.offer_id IS NOT NULL THEN
        INSERT INTO public.promotion_redemptions (
            offer_id,
            customer_id,
            order_id,
            discount_amount_inr
        ) VALUES (
            v_offer.offer_id,
            p_customer_id,
            v_order_id,
            v_discount
        );
    END IF;

    -- 10. Award Loyalty Points (Pulse Starter: 10 pts/can + Triple Charge bonus)
    v_points_earned := v_total_cans * v_points_per_can;
    IF v_total_cans >= 3 THEN
        v_points_earned := v_points_earned + v_triple_bonus;
    END IF;

    -- Ensure customer wallet exists
    INSERT INTO public.loyalty_wallets (customer_id, points_balance)
    VALUES (p_customer_id, 0)
    ON CONFLICT (customer_id) DO NOTHING;

    -- Credit points to wallet
    UPDATE public.loyalty_wallets
    SET points_balance = points_balance + v_points_earned,
        updated_at = NOW()
    WHERE customer_id = p_customer_id
    RETURNING * INTO v_wallet;

    -- Record loyalty ledger entry
    INSERT INTO public.loyalty_transactions (
        wallet_id,
        customer_id,
        points_change,
        transaction_type,
        reason,
        order_id
    ) VALUES (
        v_wallet.wallet_id,
        p_customer_id,
        v_points_earned,
        CASE WHEN v_total_cans >= 3 THEN 'earned_bonus_triple_charge' ELSE 'earned_purchase' END,
        'Points earned for order ' || v_order_id || ' (' || v_total_cans || ' cans)',
        v_order_id
    );

    -- 11. Return JSON response
    RETURN jsonb_build_object(
        'success', true,
        'order_id', v_order_id,
        'subtotal_inr', v_subtotal,
        'discount_amount_inr', v_discount,
        'delivery_fee_inr', v_delivery_fee,
        'order_total_inr', v_order_total,
        'cans_ordered', v_total_cans,
        'points_earned', v_points_earned,
        'wallet_balance', v_wallet.points_balance
    );
END;
$$;
