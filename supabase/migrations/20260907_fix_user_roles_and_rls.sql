-- ==============================================================================
-- StreamVault: Supabase Migration — Secure User Role Management & RLS Fix
-- Fixes: Admin User Role Change Error (User ↔ Manager) & Profile RLS Recursion
-- ==============================================================================

-- 1. Ensure extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Repair role constraint on public.profiles table (Ensure valid roles: user, manager, admin)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        -- Normalize any NULL roles to 'user'
        UPDATE public.profiles SET role = 'user' WHERE role IS NULL;

        -- Safely drop old check constraint if exists
        ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
        ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('user', 'manager', 'admin'));
    END IF;
END $$;

-- 3. Robust Helper Functions with Explicit Search Path (Prevents RLS Recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    current_role TEXT;
    current_active BOOLEAN;
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN false;
    END IF;

    SELECT role, is_active INTO current_role, current_active
    FROM public.profiles
    WHERE id = auth.uid();

    RETURN (current_role = 'admin' AND current_active = true);
END;
$$;

CREATE OR REPLACE FUNCTION public.is_manager()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    current_role TEXT;
    current_active BOOLEAN;
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN false;
    END IF;

    SELECT role, is_active INTO current_role, current_active
    FROM public.profiles
    WHERE id = auth.uid();

    RETURN (current_role = 'manager' AND current_active = true);
END;
$$;

-- 4. Secure Database RPC: change_user_role
-- Allows ONLY authenticated super administrators to change user roles between 'user' and 'manager'.
-- Protects last remaining admin account and prevents self-promotion from client.
CREATE OR REPLACE FUNCTION public.change_user_role(
    target_user_id UUID,
    new_role TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    caller_id UUID;
    caller_role TEXT;
    caller_active BOOLEAN;
    target_current_role TEXT;
    admin_count INT;
    updated_profile RECORD;
BEGIN
    -- 1. Identify and authenticate caller
    caller_id := auth.uid();
    IF caller_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required.' USING ERRCODE = '42501';
    END IF;

    -- 2. Verify caller is an active admin
    SELECT role, is_active INTO caller_role, caller_active
    FROM public.profiles
    WHERE id = caller_id;

    IF caller_role IS DISTINCT FROM 'admin' OR caller_active IS NOT TRUE THEN
        RAISE EXCEPTION 'Permission denied. Only administrators can modify roles.' USING ERRCODE = '42501';
    END IF;

    -- 3. Validate new_role input (only 'user' and 'manager' permitted through standard management)
    IF new_role NOT IN ('user', 'manager') THEN
        RAISE EXCEPTION 'Invalid role. Only user or manager roles can be assigned.' USING ERRCODE = '22023';
    END IF;

    -- 4. Validate target user exists
    SELECT role INTO target_current_role
    FROM public.profiles
    WHERE id = target_user_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'User not found.' USING ERRCODE = 'P0002';
    END IF;

    -- 5. Prevent demoting the last admin in the system
    IF target_current_role = 'admin' THEN
        SELECT COUNT(*) INTO admin_count
        FROM public.profiles
        WHERE role = 'admin' AND is_active = true;

        IF admin_count <= 1 THEN
            RAISE EXCEPTION 'You cannot remove the final administrator account.' USING ERRCODE = '23514';
        END IF;
    END IF;

    -- 6. Perform the role update
    UPDATE public.profiles
    SET 
        role = new_role,
        updated_at = NOW()
    WHERE id = target_user_id
    RETURNING * INTO updated_profile;

    -- 7. Audit log the action if admin_activity_logs table exists
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'admin_activity_logs'
    ) THEN
        INSERT INTO public.admin_activity_logs (
            admin_id,
            action,
            target_type,
            target_id,
            details,
            created_at
        ) VALUES (
            caller_id,
            'change_role',
            'user',
            target_user_id::TEXT,
            'Changed role from ' || target_current_role || ' to ' || new_role,
            NOW()
        );
    END IF;

    -- 8. Return the updated profile as JSON
    RETURN to_jsonb(updated_profile);
END;
$$;

-- 5. Safe RLS Policies on public.profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone"
    ON public.profiles FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile details" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- Regular users can update their own profile details, but CANNOT alter their own role
CREATE POLICY "Users can update own profile details"
    ON public.profiles FOR UPDATE
    USING (
        auth.uid() = id
        OR public.is_admin()
    )
    WITH CHECK (
        public.is_admin()
        OR (
            auth.uid() = id
            AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
        )
    );

-- 6. Grant execute permissions on helper & RPC functions
GRANT EXECUTE ON FUNCTION public.change_user_role(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_manager() TO authenticated, anon;

-- 7. Ensure admin user promotion for primary admin email
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'sanjeevidaa@gmail.com';

-- 8. Notify PostgREST to reload schema cache immediately
NOTIFY pgrst, 'reload schema';
