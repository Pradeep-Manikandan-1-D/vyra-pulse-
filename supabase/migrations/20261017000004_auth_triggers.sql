-- ==============================================================================
-- VYRA PULSE — AUTH TRIGGERS & AUTOMATIC PROFILE PROVISIONING
-- Migration: 20261017000004_auth_triggers.sql
-- Description: Automatically provisions profiles and customer records on Supabase auth.users insert.
-- ==============================================================================

-- 1. FUNCTION: Handle new user registration from Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_role TEXT := 'customer';
    v_first_name TEXT := '';
    v_last_name TEXT := '';
    v_cust_id TEXT;
    v_full_name TEXT;
BEGIN
    -- Security rule: Default to customer. Admin role can only be assigned via server-side process or if email matches admin@gmail.com
    IF NEW.email = 'admin@gmail.com' THEN
        v_role := 'admin';
        v_full_name := 'Super Admin';
    ELSE
        v_role := 'customer';
        v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1));
    END IF;

    -- Extract first and last names
    IF POSITION(' ' in v_full_name) > 0 THEN
        v_first_name := split_part(v_full_name, ' ', 1);
        v_last_name := substr(v_full_name, length(v_first_name) + 2);
    ELSE
        v_first_name := v_full_name;
        v_last_name := '';
    END IF;

    -- 1. Create Profile in public.profiles
    INSERT INTO public.profiles (
        id,
        role,
        display_name,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        v_role,
        v_full_name,
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        role = EXCLUDED.role,
        display_name = EXCLUDED.display_name,
        updated_at = NOW();

    -- 2. If Customer, link or create customer directory record & wallet
    IF v_role = 'customer' THEN
        -- Check if an existing seed customer with this email already exists
        SELECT customer_id INTO v_cust_id FROM public.customers WHERE email = NEW.email;

        IF v_cust_id IS NOT NULL THEN
            -- Link existing seed customer record to this auth user
            UPDATE public.customers
            SET user_id = NEW.id,
                updated_at = NOW()
            WHERE customer_id = v_cust_id;
        ELSE
            -- Generate new unique customer ID
            v_cust_id := 'CUST-' || LPAD(FLOOR(RANDOM() * 9000 + 1000)::TEXT, 4, '0');
            
            INSERT INTO public.customers (
                customer_id,
                user_id,
                first_name,
                last_name,
                email,
                phone,
                city,
                state,
                postal_code,
                registered_at,
                created_at,
                updated_at
            ) VALUES (
                v_cust_id,
                NEW.id,
                v_first_name,
                COALESCE(NULLIF(v_last_name, ''), 'Customer'),
                NEW.email,
                COALESCE(NEW.raw_user_meta_data->>'phone', '+91-9000000000'),
                COALESCE(NEW.raw_user_meta_data->>'city', 'Bengaluru'),
                COALESCE(NEW.raw_user_meta_data->>'state', 'Karnataka'),
                COALESCE(NEW.raw_user_meta_data->>'postal_code', '560001'),
                NOW(),
                NOW(),
                NOW()
            ) ON CONFLICT (email) DO UPDATE SET
                user_id = NEW.id;
        END IF;

        -- Ensure customer loyalty wallet exists
        INSERT INTO public.loyalty_wallets (customer_id, points_balance)
        VALUES (v_cust_id, 0)
        ON CONFLICT (customer_id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$;

-- 2. TRIGGER: Execute on new user registration in auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_auth_user();

-- 3. FUNCTION: Prevent non-admin users from altering their role
CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.role <> OLD.role THEN
        -- Only a super admin can alter roles
        IF NOT public.is_admin() THEN
            RAISE EXCEPTION 'Unauthorized: Only an administrator can modify user roles';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_role ON public.profiles;
CREATE TRIGGER trg_protect_profile_role
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.protect_profile_role();
