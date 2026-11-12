-- ==============================================================================
-- VYRA PULSE — AUTHENTICATION SECURITY REPAIR
-- Migration: 20261017000006_auth_security_repair.sql
-- Description: 
--   1. Removes hardcoded admin@gmail.com automatic role elevation.
--   2. Detects existing duplicate normalized emails and creates case-insensitive unique index.
--   3. Initializes customer_id_seq safely so reapplying migration cannot move sequence backwards.
--   4. Standardizes handle_new_auth_user() to default all public signups to 'customer'.
--   5. Implements promote_user_to_admin(UUID) dedicated administrative RPC.
--   6. Grants promote_user_to_admin(UUID) strictly to service_role, revoking from PUBLIC.
--   7. Updates protect_profile_role() to block direct user updates while honoring trusted RPC.
--   8. Preserves all existing customer, wallet, order, and transaction records.
-- ==============================================================================

-- 1. Validate clean customer emails before creating case-insensitive unique index
DO $$
DECLARE
    v_dup_count INT;
    v_dup_emails TEXT;
BEGIN
    SELECT COUNT(*), COALESCE(string_agg(lower_email, ', '), '')
    INTO v_dup_count, v_dup_emails
    FROM (
        SELECT LOWER(email) AS lower_email
        FROM public.customers
        GROUP BY LOWER(email)
        HAVING COUNT(*) > 1
    ) dups;

    IF v_dup_count > 0 THEN
        RAISE EXCEPTION 'Cannot create case-insensitive unique index on public.customers: % duplicate email group(s) detected: %', v_dup_count, v_dup_emails;
    END IF;
END;
$$;

-- 2. Create case-insensitive unique index on LOWER(email)
CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_unique_lower_email
ON public.customers (LOWER(email));

-- 3. Create dedicated sequence for customer ID generation if not exists
CREATE SEQUENCE IF NOT EXISTS public.customer_id_seq;

-- 4. Dynamically initialize sequence value:
--    Chooses GREATEST of existing table maximum and current sequence value.
--    This guarantees that reapplying the migration CANNOT move the sequence backwards.
DO $$
DECLARE
    v_max_table_id BIGINT;
    v_current_seq_val BIGINT;
    v_target_val BIGINT;
BEGIN
    -- Read highest numerical customer ID suffix currently in public.customers
    SELECT COALESCE(
        MAX(
            CASE 
                WHEN customer_id ~ '^CUST-[0-9]+$' 
                THEN SUBSTRING(customer_id FROM 6)::BIGINT 
                ELSE 0 
            END
        ),
        0
    ) INTO v_max_table_id
    FROM public.customers;

    -- Ensure baseline of at least 600 for the existing seed customer dataset
    IF v_max_table_id < 600 THEN
        v_max_table_id := 600;
    END IF;

    -- Read current sequence state from pg_sequences if already initialized
    SELECT last_value INTO v_current_seq_val
    FROM pg_sequences
    WHERE schemaname = 'public' AND sequencename = 'customer_id_seq';

    -- Choose the GREATEST of table maximum and current sequence value
    v_target_val := GREATEST(v_max_table_id, COALESCE(v_current_seq_val, 600));

    -- Set sequence with is_called = true so nextval() yields strictly v_target_val + 1
    PERFORM setval('public.customer_id_seq', v_target_val, true);
END;
$$;

-- 5. Redefine handle_new_auth_user() to eliminate email-based admin elevation
--    and ensure safe, concurrency-proof customer ID allocation and linking.
--    All public signups are assigned 'customer' by default.
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
    v_existing_user_id UUID;
    v_next_val BIGINT;
BEGIN
    -- Public self-registrations and auth creations default strictly to 'customer'.
    -- Administrative privileges must be provisioned through promote_user_to_admin() RPC.
    v_role := 'customer';
    v_full_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        split_part(NEW.email, '@', 1)
    );

    -- Extract first and last names
    IF POSITION(' ' in v_full_name) > 0 THEN
        v_first_name := split_part(v_full_name, ' ', 1);
        v_last_name := substr(v_full_name, length(v_first_name) + 2);
    ELSE
        v_first_name := v_full_name;
        v_last_name := '';
    END IF;

    -- 1. Create Profile in public.profiles with default 'customer' role
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
        display_name = COALESCE(EXCLUDED.display_name, public.profiles.display_name),
        updated_at = NOW();

    -- 2. Link existing seed customer record or generate new customer directory record & wallet
    SELECT customer_id, user_id 
    INTO v_cust_id, v_existing_user_id 
    FROM public.customers 
    WHERE LOWER(email) = LOWER(NEW.email);

    IF v_cust_id IS NOT NULL THEN
        -- Existing customer record exists
        IF v_existing_user_id IS NULL THEN
            -- Safe link: unassigned seed customer record linked to this newly registered auth user
            UPDATE public.customers
            SET user_id = NEW.id,
                updated_at = NOW()
            WHERE customer_id = v_cust_id;
        ELSIF v_existing_user_id = NEW.id THEN
            -- Already linked to this exact auth user (idempotent replay)
            NULL;
        ELSE
            -- CRITICAL SECURITY SAFEGUARD:
            -- The customer record is ALREADY linked to another distinct auth user.
            -- Prevent customer hijacking by raising an exception.
            RAISE EXCEPTION 'Customer account with email % is already linked to another user ID', NEW.email;
        END IF;
    ELSE
        -- No existing customer record: generate new concurrency-safe customer ID via sequence
        v_next_val := nextval('public.customer_id_seq');
        v_cust_id := 'CUST-' || LPAD(v_next_val::TEXT, 4, '0');
        
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
            LOWER(NEW.email),
            COALESCE(NEW.raw_user_meta_data->>'phone', '+91-9000000000'),
            COALESCE(NEW.raw_user_meta_data->>'city', 'Bengaluru'),
            COALESCE(NEW.raw_user_meta_data->>'state', 'Karnataka'),
            COALESCE(NEW.raw_user_meta_data->>'postal_code', '560001'),
            NOW(),
            NOW(),
            NOW()
        );
    END IF;

    -- Ensure customer loyalty wallet exists idempotently
    INSERT INTO public.loyalty_wallets (customer_id, points_balance)
    VALUES (v_cust_id, 0)
    ON CONFLICT (customer_id) DO NOTHING;

    RETURN NEW;
END;
$$;

-- 6. Ensure trigger is properly attached to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_auth_user();

-- 7. Protect profile roles trigger:
--    Blocks direct role modification via PostgREST unless executed inside the trusted promote_user_to_admin() transaction
--    or by an existing Super Admin.
CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.role <> OLD.role THEN
        -- Allow if executed inside trusted promote_user_to_admin() RPC
        IF current_setting('vyra.in_admin_promotion', true) = 'true' THEN
            RETURN NEW;
        END IF;

        -- Allow if executed by an existing Super Admin
        IF public.is_admin() THEN
            RETURN NEW;
        END IF;

        RAISE EXCEPTION 'Unauthorized: Only an administrator or trusted provisioning RPC can modify user roles';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_role ON public.profiles;
CREATE TRIGGER trg_protect_profile_role
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.protect_profile_role();

-- 8. Dedicated Administrator Promotion RPC
--    Narrowly scoped procedure to promote a user to 'admin' using the service-role credential.
--    Explicitly revokes execute from PUBLIC, anon, and authenticated.
--    STRICTLY NON-DESTRUCTIVE: Modifies only public.profiles.role.
--    Never deletes or unlinks customer records, loyalty wallets, orders, or transactions.
CREATE OR REPLACE FUNCTION public.promote_user_to_admin(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- 1. Authorization Verification:
    -- Must be called with service_role JWT claim OR by an existing Super Admin
    IF NOT (
        COALESCE(auth.jwt() ->> 'role', '') = 'service_role'
        OR current_setting('request.jwt.claim.role', true) = 'service_role'
        OR public.is_admin()
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Insufficient privileges to execute promote_user_to_admin';
    END IF;

    -- 2. Verify target user exists in auth.users
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
        RAISE EXCEPTION 'Target user ID % does not exist in auth.users', p_user_id;
    END IF;

    -- 3. Set transaction-local flag to authorize role change in protect_profile_role trigger
    PERFORM set_config('vyra.in_admin_promotion', 'true', true);

    -- 4. Update role in public.profiles to 'admin'
    -- Strictly non-destructive: updates only the user profile role.
    -- Any linked customer record, user_id link, and wallet are preserved intact.
    UPDATE public.profiles
    SET role = 'admin',
        updated_at = NOW()
    WHERE id = p_user_id;

    IF NOT FOUND THEN
        -- Profile did not exist; insert it
        INSERT INTO public.profiles (id, role, display_name, created_at, updated_at)
        VALUES (p_user_id, 'admin', 'Super Admin', NOW(), NOW());
    END IF;
END;
$$;

-- 9. Explicit Permissions for promote_user_to_admin:
--    Revoke execute from all untrusted roles; grant exclusively to service_role and postgres.
REVOKE EXECUTE ON FUNCTION public.promote_user_to_admin(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.promote_user_to_admin(UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.promote_user_to_admin(UUID) FROM authenticated;

GRANT EXECUTE ON FUNCTION public.promote_user_to_admin(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.promote_user_to_admin(UUID) TO postgres;
