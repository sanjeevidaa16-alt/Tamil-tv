-- ==============================================================================
-- StreamVault: Supabase Database Migration — Profiles Table, Role Management & RLS
-- Fixes: "Could not find the table 'public.profiles' in the schema cache"
-- ==============================================================================

-- 1. Ensure required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Schema Usage Permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- 3. Create or Repair public.profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'user',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure valid columns and role constraint
DO $$
BEGIN
    -- Normalize any null roles to 'user'
    UPDATE public.profiles SET role = 'user' WHERE role IS NULL;

    -- Safely enforce check constraint for user, manager, admin
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('user', 'manager', 'admin'));
    
    -- Ensure columns exist
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
END $$;

-- 4. Activity Logs Table (for Audit Tracking)
CREATE TABLE IF NOT EXISTS public.admin_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL DEFAULT 'user',
    target_id TEXT NOT NULL,
    details TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Safe Trigger to Automatically Create Profile on New Auth User Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url, role, is_active, created_at, updated_at)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', 'https://api.dicebear.com/7.x/initials/svg?seed=' || encode(digest(COALESCE(NEW.email, 'user'), 'sha256'), 'hex')),
        CASE 
            WHEN LOWER(NEW.email) = 'sanjeevidaa@gmail.com' THEN 'admin'
            ELSE 'user'
        END,
        true,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
        updated_at = NOW();

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Backfill any existing auth.users that do not have a profile row
INSERT INTO public.profiles (id, email, full_name, avatar_url, role, is_active, created_at, updated_at)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', split_part(au.email, '@', 1)),
    COALESCE(au.raw_user_meta_data->>'avatar_url', 'https://api.dicebear.com/7.x/initials/svg?seed=' || encode(digest(COALESCE(au.email, 'user'), 'sha256'), 'hex')),
    CASE 
        WHEN LOWER(au.email) = 'sanjeevidaa@gmail.com' THEN 'admin'
        ELSE 'user'
    END,
    true,
    COALESCE(au.created_at, NOW()),
    NOW()
FROM auth.users au
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = au.id
)
ON CONFLICT (id) DO NOTHING;

-- 7. Secure Helper Functions with Explicit search_path (Prevents RLS Recursion)
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

-- 8. Centralized Secure RPC: change_user_role
-- Only authenticated Super Administrators can change roles between 'user' and 'manager'.
-- Protects final administrator account from accidental demotion.
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

    -- 2. Verify caller is an active administrator
    SELECT role, is_active INTO caller_role, caller_active
    FROM public.profiles
    WHERE id = caller_id;

    IF caller_role IS DISTINCT FROM 'admin' OR caller_active IS NOT TRUE THEN
        RAISE EXCEPTION 'Permission denied. Only administrators can modify roles.' USING ERRCODE = '42501';
    END IF;

    -- 3. Validate new_role input (only 'user' and 'manager' permitted via normal management)
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

    -- 5. Prevent demoting the last active administrator
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

    -- 7. Audit log the action
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

    -- 8. Return updated profile as JSON
    RETURN to_jsonb(updated_profile);
END;
$$;

-- 9. Row Level Security (RLS) on public.profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone"
    ON public.profiles FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile details" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

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

-- 10. Table & Function Grants for PostgREST
GRANT ALL ON TABLE public.profiles TO authenticated, anon, service_role;
GRANT ALL ON TABLE public.admin_activity_logs TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.change_user_role(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_manager() TO authenticated, anon;

-- 11. Promote default admin email
UPDATE public.profiles
SET role = 'admin'
WHERE LOWER(email) = 'sanjeevidaa@gmail.com';

-- 12. Notify PostgREST to reload schema cache immediately
-- Resolves: "Could not find the table 'public.profiles' in the schema cache"
NOTIFY pgrst, 'reload schema';
