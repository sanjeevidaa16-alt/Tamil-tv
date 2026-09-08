-- ==============================================================================
-- StreamVault: Adsterra Ad Management System Migration
-- Completely separate from Google AdSense
-- Tables: adsterra_settings, adsterra_ad_units, adsterra_placements
-- Storage: adsterra-assets
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. ADSTERRA SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.adsterra_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enabled BOOLEAN NOT NULL DEFAULT false,
    website_name TEXT NOT NULL DEFAULT 'StreamVault Ads',
    website_domain TEXT NOT NULL DEFAULT '',
    verification_method TEXT NOT NULL DEFAULT 'meta' CHECK (verification_method IN ('meta', 'html', 'file')),
    verification_code TEXT NOT NULL DEFAULT '',
    verification_file_url TEXT,
    verification_file_name TEXT,
    verification_file_size BIGINT,
    verification_status TEXT NOT NULL DEFAULT 'not_configured' CHECK (verification_status IN ('not_configured', 'configured', 'verified', 'verification_required')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. ADSTERRA AD UNITS TABLE
CREATE TABLE IF NOT EXISTS public.adsterra_ad_units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    format TEXT NOT NULL DEFAULT 'banner' CHECK (format IN ('banner', 'native', 'social_bar', 'popunder', 'in_page_push', 'smartlink', 'interstitial', 'custom')),
    code TEXT NOT NULL DEFAULT '',
    smartlink_url TEXT,
    enabled BOOLEAN NOT NULL DEFAULT true,
    notes TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_adsterra_units_order ON public.adsterra_ad_units(sort_order, enabled);

-- 3. ADSTERRA PLACEMENTS TABLE
CREATE TABLE IF NOT EXISTS public.adsterra_placements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    placement_key TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    page TEXT DEFAULT 'all',
    position TEXT DEFAULT 'center',
    ad_unit_id UUID REFERENCES public.adsterra_ad_units(id) ON DELETE SET NULL,
    enabled BOOLEAN NOT NULL DEFAULT false,
    frequency INTEGER NOT NULL DEFAULT 5,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_custom BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_adsterra_placements_key ON public.adsterra_placements(placement_key, enabled);

-- 4. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.adsterra_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adsterra_ad_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adsterra_placements ENABLE ROW LEVEL SECURITY;

-- Helper admin function check if exists
CREATE OR REPLACE FUNCTION public.is_admin_safe(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles ur
        JOIN public.roles r ON ur.role_id = r.id
        WHERE ur.user_id = user_id AND r.name = 'admin'
    ) OR EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = user_id AND p.role = 'admin'
    );
EXCEPTION WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Public READ for public delivery
DROP POLICY IF EXISTS "Public can view adsterra settings" ON public.adsterra_settings;
CREATE POLICY "Public can view adsterra settings" ON public.adsterra_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can view active adsterra units" ON public.adsterra_ad_units;
CREATE POLICY "Public can view active adsterra units" ON public.adsterra_ad_units FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can view adsterra placements" ON public.adsterra_placements;
CREATE POLICY "Public can view adsterra placements" ON public.adsterra_placements FOR SELECT USING (true);

-- Admin FULL ACCESS
DROP POLICY IF EXISTS "Admin full access adsterra settings" ON public.adsterra_settings;
CREATE POLICY "Admin full access adsterra settings" ON public.adsterra_settings
    FOR ALL USING (auth.uid() IS NOT NULL AND public.is_admin_safe(auth.uid()))
    WITH CHECK (auth.uid() IS NOT NULL AND public.is_admin_safe(auth.uid()));

DROP POLICY IF EXISTS "Admin full access adsterra units" ON public.adsterra_ad_units;
CREATE POLICY "Admin full access adsterra units" ON public.adsterra_ad_units
    FOR ALL USING (auth.uid() IS NOT NULL AND public.is_admin_safe(auth.uid()))
    WITH CHECK (auth.uid() IS NOT NULL AND public.is_admin_safe(auth.uid()));

DROP POLICY IF EXISTS "Admin full access adsterra placements" ON public.adsterra_placements;
CREATE POLICY "Admin full access adsterra placements" ON public.adsterra_placements
    FOR ALL USING (auth.uid() IS NOT NULL AND public.is_admin_safe(auth.uid()))
    WITH CHECK (auth.uid() IS NOT NULL AND public.is_admin_safe(auth.uid()));

-- 5. STORAGE BUCKET FOR ADSTERRA VERIFICATION FILES
INSERT INTO storage.buckets (id, name, public)
VALUES ('adsterra-assets', 'adsterra-assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public can view adsterra storage" ON storage.objects;
CREATE POLICY "Public can view adsterra storage" ON storage.objects
    FOR SELECT USING (bucket_id = 'adsterra-assets');

DROP POLICY IF EXISTS "Admin can manage adsterra storage" ON storage.objects;
CREATE POLICY "Admin can manage adsterra storage" ON storage.objects
    FOR ALL USING (bucket_id = 'adsterra-assets' AND (auth.uid() IS NOT NULL AND public.is_admin_safe(auth.uid())))
    WITH CHECK (bucket_id = 'adsterra-assets' AND (auth.uid() IS NOT NULL AND public.is_admin_safe(auth.uid())));

-- 6. DEFAULT PRESET PLACEMENTS SEEDING
INSERT INTO public.adsterra_placements (placement_key, name, page, position, enabled, frequency, sort_order, is_custom)
VALUES
    ('header', 'Header — Top Banner', 'all', 'header', false, 1, 1, false),
    ('center', 'Main Content — Center Ad', 'all', 'center', false, 1, 2, false),
    ('footer', 'Footer — Bottom Banner', 'all', 'footer', false, 1, 3, false),
    ('videos_top', 'Videos Page — Top', 'videos', 'top', false, 1, 4, false),
    ('videos_center', 'Videos Page — Center', 'videos', 'center', false, 1, 5, false),
    ('videos_bottom', 'Videos Page — Bottom', 'videos', 'bottom', false, 1, 6, false),
    ('between_video_cards', 'Between Video Cards (In-Feed)', 'videos', 'in_feed', false, 5, 7, false),
    ('video_before_player', 'Video — Before Player', 'video_details', 'before_player', false, 1, 8, false),
    ('video_after_player', 'Video — After Player', 'video_details', 'after_player', false, 1, 9, false),
    ('video_below_description', 'Video — Below Description', 'video_details', 'below_description', false, 1, 10, false),
    ('video_before_related', 'Video — Before Related Videos', 'video_details', 'before_related', false, 1, 11, false),
    ('video_after_related', 'Video — After Related Videos', 'video_details', 'after_related', false, 1, 12, false)
ON CONFLICT (placement_key) DO NOTHING;

-- Seed default settings row if empty
INSERT INTO public.adsterra_settings (enabled, website_name, website_domain, verification_method, verification_code, verification_status)
SELECT false, 'StreamVault Ads', '', 'meta', '', 'not_configured'
WHERE NOT EXISTS (SELECT 1 FROM public.adsterra_settings);
