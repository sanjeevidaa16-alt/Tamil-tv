-- ==============================================================================
-- StreamVault: Safe & Idempotent Migration for public.videos, Storage & RLS
-- Fixes: "Could not find the table 'public.videos' in the schema cache"
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. PROFILES TABLE (Ensures user role hierarchy)
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

-- 4. VIDEOS TABLE (Primary Media Catalog)
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

-- 8. HELPER SECURITY FUNCTIONS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin' AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_manager()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'manager' AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

GRANT EXECUTE ON FUNCTION public.delete_video(UUID) TO authenticated, anon;

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

-- Drop old policies to prevent naming collisions
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

-- 10.1 SELECT POLICY:
-- Normal users & anon can read published + public videos.
-- Admins can read all videos.
-- Managers can read all published videos + their own drafts/unlisted videos.
CREATE POLICY "Allow video select"
    ON public.videos FOR SELECT
    USING (
        (status = 'published' AND visibility = 'public')
        OR public.is_admin()
        OR (public.is_manager() AND (status = 'published' OR uploaded_by = auth.uid() OR uploader_id = auth.uid()))
        OR (auth.uid() IS NOT NULL AND (uploaded_by = auth.uid() OR uploader_id = auth.uid()))
    );

-- 10.2 INSERT POLICY:
-- ONLY Admin or Manager can insert new videos.
-- Normal users CANNOT insert videos.
CREATE POLICY "Allow video insert for admin and manager"
    ON public.videos FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL
        AND (public.is_admin() OR public.is_manager())
    );

-- 10.3 UPDATE POLICY:
-- Admin can update any video.
-- Manager can update videos they uploaded.
CREATE POLICY "Allow video update for admin and owner"
    ON public.videos FOR UPDATE
    USING (
        public.is_admin()
        OR (public.is_manager() AND (uploaded_by = auth.uid() OR uploader_id = auth.uid()))
    );

-- 10.4 DELETE POLICY:
-- Admin can delete any video.
-- Manager can delete videos they uploaded.
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
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id OR public.is_admin());

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

-- 13. STORAGE BUCKETS SETUP ('videos' & 'thumbnails')
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

-- 17. NOTIFY POSTGREST TO RELOAD SCHEMA CACHE IMMEDIATELY
-- This resolves: "Could not find the table 'public.videos' in the schema cache"
NOTIFY pgrst, 'reload schema';
