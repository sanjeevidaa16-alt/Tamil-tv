-- ==============================================================================
-- StreamVault: Supabase PostgreSQL Schema, Storage Setup & Security Policies
-- Full schema for Video Streaming / Video Playing Web Application
-- Compatible with Supabase SQL Editor
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. PROFILES TABLE
-- References auth.users(id) managed by Supabase Auth
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'manager', 'admin')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. VIDEOS TABLE
CREATE TABLE IF NOT EXISTS public.videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    video_path TEXT NOT NULL DEFAULT '',
    video_url TEXT,
    storage_path TEXT,
    thumbnail_url TEXT,
    thumbnail_path TEXT,
    duration INTEGER DEFAULT 0,
    duration_seconds INTEGER DEFAULT 0,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    uploader_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'draft', 'unlisted', 'unpublished')),
    visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'preview')),
    is_featured BOOLEAN NOT NULL DEFAULT false,
    views_count BIGINT NOT NULL DEFAULT 0,
    views BIGINT NOT NULL DEFAULT 0,
    file_size BIGINT NULL,
    mime_type TEXT NULL,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. SAFE REPAIRS FOR EXISTING VIDEOS TABLE (Ensures all column variants exist)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'videos') THEN
        ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS video_path TEXT DEFAULT '';
        ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS video_url TEXT;
        ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS storage_path TEXT;
        ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
        ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS thumbnail_path TEXT;
        ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS duration INTEGER DEFAULT 0;
        ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS duration_seconds INTEGER DEFAULT 0;
        ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL;
        ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
        ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS uploader_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
        ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'published';
        ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'public';
        ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false;
        ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS views_count BIGINT NOT NULL DEFAULT 0;
        ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS views BIGINT NOT NULL DEFAULT 0;
        ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS file_size BIGINT NULL;
        ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS mime_type TEXT NULL;
        ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
        ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
        ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
    END IF;
END $$;

-- 6. VIDEO_VIEWS TABLE (Analytics & View Tracking)
CREATE TABLE IF NOT EXISTS public.video_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_videos_created_at ON public.videos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_videos_category_id ON public.videos(category_id);
CREATE INDEX IF NOT EXISTS idx_videos_status ON public.videos(status);
CREATE INDEX IF NOT EXISTS idx_videos_visibility ON public.videos(visibility);
CREATE INDEX IF NOT EXISTS idx_videos_uploaded_by ON public.videos(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_videos_is_featured ON public.videos(is_featured);
CREATE INDEX IF NOT EXISTS idx_video_views_video_id ON public.video_views(video_id);

-- 8. HELPER SECURITY FUNCTIONS & SECURE ROLE MANAGEMENT
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

-- Secure Database RPC: change_user_role
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

    -- 3. Validate new_role input
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

    -- 8. Return updated profile
    RETURN to_jsonb(updated_profile);
END;
$$;

-- Secure Database RPC: delete_video (Super Admins or Video Owner)
CREATE OR REPLACE FUNCTION public.delete_video(
    target_video_id UUID
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
    target_video RECORD;
BEGIN
    caller_id := auth.uid();
    IF caller_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required.' USING ERRCODE = '42501';
    END IF;

    -- Retrieve caller profile
    SELECT role, is_active INTO caller_role, caller_active
    FROM public.profiles
    WHERE id = caller_id;

    IF caller_active IS NOT TRUE THEN
        RAISE EXCEPTION 'Account is inactive.' USING ERRCODE = '42501';
    END IF;

    -- Retrieve target video record
    SELECT * INTO target_video
    FROM public.videos
    WHERE id = target_video_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Video not found.' USING ERRCODE = 'P0002';
    END IF;

    -- Check authorization: Admin can delete any video, Manager can delete own video
    IF caller_role = 'admin' THEN
        -- allowed
    ELSIF caller_role = 'manager' AND (target_video.uploaded_by = caller_id OR target_video.uploader_id = caller_id) THEN
        -- allowed
    ELSE
        RAISE EXCEPTION 'Permission denied. Only administrators or the video uploader can delete this video.' USING ERRCODE = '42501';
    END IF;

    -- Delete dependent view records
    DELETE FROM public.video_views WHERE video_id = target_video_id;

    -- Delete video record from public.videos
    DELETE FROM public.videos WHERE id = target_video_id;

    -- Audit log the action if admin_activity_logs table exists
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
            'delete_video',
            'video',
            target_video_id::TEXT,
            'Deleted video asset: ' || COALESCE(target_video.title, 'Untitled'),
            NOW()
        );
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'id', target_video_id,
        'title', target_video.title,
        'storage_path', target_video.storage_path,
        'thumbnail_path', target_video.thumbnail_path,
        'video_path', target_video.video_path,
        'video_url', target_video.video_url,
        'thumbnail_url', target_video.thumbnail_url
    );
END;
$$;

-- 9. AUTO-UPDATE TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_videos_updated_at ON public.videos;
CREATE TRIGGER set_videos_updated_at
    BEFORE UPDATE ON public.videos
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 10. ROW LEVEL SECURITY (RLS) ON public.videos
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view published and public videos" ON public.videos;
DROP POLICY IF EXISTS "Admins have full access to all videos" ON public.videos;
DROP POLICY IF EXISTS "Managers can view all videos" ON public.videos;
DROP POLICY IF EXISTS "Managers can insert videos" ON public.videos;
DROP POLICY IF EXISTS "Managers can update own videos" ON public.videos;
DROP POLICY IF EXISTS "Managers can delete own videos" ON public.videos;
DROP POLICY IF EXISTS "Allow video insert for admin and manager" ON public.videos;
DROP POLICY IF EXISTS "Allow video update for admin and owner" ON public.videos;
DROP POLICY IF EXISTS "Allow video delete for admin and owner" ON public.videos;
DROP POLICY IF EXISTS "Allow video select" ON public.videos;

-- 10.1 SELECT POLICY
CREATE POLICY "Allow video select"
    ON public.videos FOR SELECT
    USING (
        (status = 'published' AND visibility = 'public')
        OR public.is_admin()
        OR (public.is_manager() AND (status = 'published' OR uploaded_by = auth.uid() OR uploader_id = auth.uid()))
        OR (auth.uid() IS NOT NULL AND (uploaded_by = auth.uid() OR uploader_id = auth.uid()))
    );

-- 10.2 INSERT POLICY: Admin or Manager
CREATE POLICY "Allow video insert for admin and manager"
    ON public.videos FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL
        AND (public.is_admin() OR public.is_manager())
    );

-- 10.3 UPDATE POLICY: Admin or Owner Manager
CREATE POLICY "Allow video update for admin and owner"
    ON public.videos FOR UPDATE
    USING (
        public.is_admin()
        OR (public.is_manager() AND (uploaded_by = auth.uid() OR uploader_id = auth.uid()))
    );

-- 10.4 DELETE POLICY: Admin or Owner Manager
CREATE POLICY "Allow video delete for admin and owner"
    ON public.videos FOR DELETE
    USING (
        public.is_admin()
        OR (public.is_manager() AND (uploaded_by = auth.uid() OR uploader_id = auth.uid()))
    );

-- 11. RLS ON CATEGORIES & PROFILES
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Categories are readable by everyone" ON public.categories;
CREATE POLICY "Categories are readable by everyone"
    ON public.categories FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Only admin can modify categories" ON public.categories;
CREATE POLICY "Only admin can modify categories"
    ON public.categories FOR ALL
    USING (public.is_admin());

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone"
    ON public.profiles FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile details" ON public.profiles;
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

-- Grant execute on security functions
GRANT EXECUTE ON FUNCTION public.change_user_role(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_video(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_manager() TO authenticated, anon;

-- 12. RLS ON VIDEO_VIEWS
ALTER TABLE public.video_views ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can insert video views" ON public.video_views;
CREATE POLICY "Anyone can insert video views"
    ON public.video_views FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Users can read their own video views or admin can read all" ON public.video_views;
CREATE POLICY "Users can read their own video views or admin can read all"
    ON public.video_views FOR SELECT
    USING (public.is_admin() OR user_id = auth.uid());

-- 13. SUPABASE STORAGE SETUP ('videos' & 'thumbnails')
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('videos', 'videos', true, 524288000, ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska']),
    ('thumbnails', 'thumbnails', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO UPDATE SET
    public = true,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 14. STORAGE RLS POLICIES ON storage.objects
DROP POLICY IF EXISTS "Public Read Access for Videos and Thumbnails" ON storage.objects;
CREATE POLICY "Public Read Access for Videos and Thumbnails"
    ON storage.objects FOR SELECT
    TO anon, authenticated
    USING (bucket_id IN ('videos', 'thumbnails'));

DROP POLICY IF EXISTS "Only Admin and Manager can upload videos and thumbnails" ON storage.objects;
CREATE POLICY "Only Admin and Manager can upload videos and thumbnails"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id IN ('videos', 'thumbnails')
        AND (public.is_admin() OR public.is_manager())
    );

DROP POLICY IF EXISTS "Only Admin and Manager can update videos and thumbnails" ON storage.objects;
CREATE POLICY "Only Admin and Manager can update videos and thumbnails"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
        bucket_id IN ('videos', 'thumbnails')
        AND (public.is_admin() OR (public.is_manager() AND owner = auth.uid()))
    );

DROP POLICY IF EXISTS "Only Admin and Manager can delete videos and thumbnails" ON storage.objects;
CREATE POLICY "Only Admin and Manager can delete videos and thumbnails"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id IN ('videos', 'thumbnails')
        AND (public.is_admin() OR (public.is_manager() AND owner = auth.uid()))
    );

-- 15. INITIAL DEFAULT CATEGORIES
INSERT INTO public.categories (name, slug, description)
VALUES
    ('Cinema & Features', 'cinema-features', 'Full cinematic presentations, drama, thrillers, and premier festival productions.'),
    ('Documentaries', 'documentaries', 'Deep-dive investigative explorations into human achievement, nature, and technology.'),
    ('Sci-Fi & Future', 'sci-fi-future', 'Speculative worldbuilding, cybernetics, cosmos exploration, and dystopian futures.'),
    ('Tech & Engineering', 'tech-engineering', 'Architecture deep dives, software engineering masterclasses, and robotics.'),
    ('Nature & Wilderness', 'nature-wilderness', 'High-definition 4K landscapes, wildlife chronicles, and environmental vistas.'),
    ('Short Films', 'short-films', 'Award-winning narrative shorts, animated micro-films, and avant-garde visuals.')
ON CONFLICT (slug) DO NOTHING;

-- 16. SUPER ADMIN PROMOTION FOR sanjeevidaa@gmail.com
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'sanjeevidaa@gmail.com';

-- 17. VIDEO FILTERS TABLE
CREATE TABLE IF NOT EXISTS public.video_filters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    filter_type TEXT NOT NULL DEFAULT 'single' CHECK (filter_type IN ('single', 'multi')),
    enabled BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 18. VIDEO FILTER OPTIONS TABLE
CREATE TABLE IF NOT EXISTS public.video_filter_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filter_id UUID NOT NULL REFERENCES public.video_filters(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    value TEXT NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 19. GOOGLE ADSENSE SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.adsense_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    publisher_id TEXT NOT NULL DEFAULT '',
    ad_slot_id TEXT NOT NULL DEFAULT '',
    enabled BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 20. ADSENSE AD UNITS TABLE
CREATE TABLE IF NOT EXISTS public.adsense_units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    ad_slot_id TEXT NOT NULL,
    format TEXT NOT NULL DEFAULT 'auto' CHECK (format IN ('auto', 'rectangle', 'horizontal', 'vertical')),
    responsive BOOLEAN NOT NULL DEFAULT true,
    enabled BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 21. AD PLACEMENTS TABLE
CREATE TABLE IF NOT EXISTS public.ad_placements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    placement_key TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    ad_unit_id UUID REFERENCES public.adsense_units(id) ON DELETE SET NULL,
    enabled BOOLEAN NOT NULL DEFAULT false,
    sort_order INTEGER NOT NULL DEFAULT 0,
    frequency INTEGER NOT NULL DEFAULT 5,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 22. CUSTOM AD CODE & FILE SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.ad_code_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL DEFAULT 'Global Custom Ad Code',
    code_type TEXT NOT NULL DEFAULT 'html' CHECK (code_type IN ('html', 'javascript', 'adsense_tag')),
    code_content TEXT NOT NULL DEFAULT '',
    ad_file_url TEXT,
    ad_file_name TEXT,
    ad_file_size BIGINT,
    enabled BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 23. ENABLE RLS
ALTER TABLE public.video_filters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_filter_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adsense_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adsense_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_code_settings ENABLE ROW LEVEL SECURITY;

-- 24. RLS POLICIES FOR FILTERS & ADSENSE
DROP POLICY IF EXISTS "Public can view active video filters" ON public.video_filters;
CREATE POLICY "Public can view active video filters" ON public.video_filters
    FOR SELECT TO public
    USING (enabled = true OR (auth.role() = 'authenticated' AND public.is_admin()));

DROP POLICY IF EXISTS "Admins can manage video filters" ON public.video_filters;
CREATE POLICY "Admins can manage video filters" ON public.video_filters
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Public can view active filter options" ON public.video_filter_options;
CREATE POLICY "Public can view active filter options" ON public.video_filter_options
    FOR SELECT TO public
    USING (enabled = true OR (auth.role() = 'authenticated' AND public.is_admin()));

DROP POLICY IF EXISTS "Admins can manage filter options" ON public.video_filter_options;
CREATE POLICY "Admins can manage filter options" ON public.video_filter_options
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Anyone can read adsense settings" ON public.adsense_settings;
CREATE POLICY "Anyone can read adsense settings" ON public.adsense_settings
    FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Admins can manage adsense settings" ON public.adsense_settings;
CREATE POLICY "Admins can manage adsense settings" ON public.adsense_settings
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Anyone can read active adsense units" ON public.adsense_units;
CREATE POLICY "Anyone can read active adsense units" ON public.adsense_units
    FOR SELECT TO public
    USING (enabled = true OR (auth.role() = 'authenticated' AND public.is_admin()));

DROP POLICY IF EXISTS "Admins can manage adsense units" ON public.adsense_units;
CREATE POLICY "Admins can manage adsense units" ON public.adsense_units
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Anyone can read active ad placements" ON public.ad_placements;
CREATE POLICY "Anyone can read active ad placements" ON public.ad_placements
    FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Admins can manage ad placements" ON public.ad_placements;
CREATE POLICY "Admins can manage ad placements" ON public.ad_placements
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Anyone can read active custom ad code" ON public.ad_code_settings;
CREATE POLICY "Anyone can read active custom ad code" ON public.ad_code_settings
    FOR SELECT TO public
    USING (enabled = true OR (auth.role() = 'authenticated' AND public.is_admin()));

DROP POLICY IF EXISTS "Admins can manage custom ad code" ON public.ad_code_settings;
CREATE POLICY "Admins can manage custom ad code" ON public.ad_code_settings
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 25. NOTIFY POSTGREST TO RELOAD SCHEMA CACHE IMMEDIATELY
NOTIFY pgrst, 'reload schema';
