-- ==============================================================================
-- StreamVault: Safe & Idempotent Migration for Filters & Google AdSense Modules
-- Module 1: Dynamic Video Filter Engine (video_filters & video_filter_options)
-- Module 2: Google AdSense, Ad Units, Custom Code & Manual Placements
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. VIDEO FILTERS TABLE
-- ==============================================================================
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

-- Index for quick sorting & lookup
CREATE INDEX IF NOT EXISTS idx_video_filters_order ON public.video_filters(sort_order, enabled);

-- ==============================================================================
-- 2. VIDEO FILTER OPTIONS TABLE
-- ==============================================================================
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

-- Index for options by filter and order
CREATE INDEX IF NOT EXISTS idx_video_filter_options_filter ON public.video_filter_options(filter_id, sort_order, enabled);

-- ==============================================================================
-- 3. GOOGLE ADSENSE SETTINGS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.adsense_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    publisher_id TEXT NOT NULL DEFAULT '',
    ad_slot_id TEXT NOT NULL DEFAULT '',
    enabled BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 4. ADSENSE AD UNITS TABLE
-- ==============================================================================
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

-- ==============================================================================
-- 5. AD PLACEMENTS TABLE
-- ==============================================================================
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

-- ==============================================================================
-- 6. CUSTOM AD CODE & FILE SETTINGS TABLE
-- ==============================================================================
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

-- ==============================================================================
-- 7. DEFAULT SEED DATA (Idempotent ON CONFLICT DO NOTHING)
-- ==============================================================================

-- Seed Default Filter Groups
INSERT INTO public.video_filters (id, name, slug, description, filter_type, enabled, sort_order)
VALUES
  ('a0000001-0000-0000-0000-000000000001', 'Content Category', 'category', 'Filter media by production category or genre', 'single', true, 1),
  ('a0000001-0000-0000-0000-000000000002', 'Audio Language', 'language', 'Filter videos by audio language', 'single', true, 2),
  ('a0000001-0000-0000-0000-000000000003', 'Stream Quality', 'quality', 'Filter media by resolution and stream fidelity', 'single', true, 3),
  ('a0000001-0000-0000-0000-000000000004', 'Release Era', 'era', 'Filter by chronological release era', 'single', true, 4)
ON CONFLICT (slug) DO NOTHING;

-- Seed Options for Audio Language
INSERT INTO public.video_filter_options (filter_id, label, value, enabled, sort_order)
SELECT id, 'English', 'english', true, 1 FROM public.video_filters WHERE slug = 'language'
ON CONFLICT DO NOTHING;

INSERT INTO public.video_filter_options (filter_id, label, value, enabled, sort_order)
SELECT id, 'Tamil', 'tamil', true, 2 FROM public.video_filters WHERE slug = 'language'
ON CONFLICT DO NOTHING;

INSERT INTO public.video_filter_options (filter_id, label, value, enabled, sort_order)
SELECT id, 'Hindi', 'hindi', true, 3 FROM public.video_filters WHERE slug = 'language'
ON CONFLICT DO NOTHING;

INSERT INTO public.video_filter_options (filter_id, label, value, enabled, sort_order)
SELECT id, 'Malayalam', 'malayalam', true, 4 FROM public.video_filters WHERE slug = 'language'
ON CONFLICT DO NOTHING;

INSERT INTO public.video_filter_options (filter_id, label, value, enabled, sort_order)
SELECT id, 'Spanish', 'spanish', true, 5 FROM public.video_filters WHERE slug = 'language'
ON CONFLICT DO NOTHING;

-- Seed Options for Stream Quality
INSERT INTO public.video_filter_options (filter_id, label, value, enabled, sort_order)
SELECT id, '4K Ultra HD', '4k', true, 1 FROM public.video_filters WHERE slug = 'quality'
ON CONFLICT DO NOTHING;

INSERT INTO public.video_filter_options (filter_id, label, value, enabled, sort_order)
SELECT id, '1080p Full HD', '1080p', true, 2 FROM public.video_filters WHERE slug = 'quality'
ON CONFLICT DO NOTHING;

INSERT INTO public.video_filter_options (filter_id, label, value, enabled, sort_order)
SELECT id, '720p HD', '720p', true, 3 FROM public.video_filters WHERE slug = 'quality'
ON CONFLICT DO NOTHING;

-- Seed Options for Release Era
INSERT INTO public.video_filter_options (filter_id, label, value, enabled, sort_order)
SELECT id, '2026+', '2026', true, 1 FROM public.video_filters WHERE slug = 'era'
ON CONFLICT DO NOTHING;

INSERT INTO public.video_filter_options (filter_id, label, value, enabled, sort_order)
SELECT id, '2020s', '2020s', true, 2 FROM public.video_filters WHERE slug = 'era'
ON CONFLICT DO NOTHING;

INSERT INTO public.video_filter_options (filter_id, label, value, enabled, sort_order)
SELECT id, '2010s', '2010s', true, 3 FROM public.video_filters WHERE slug = 'era'
ON CONFLICT DO NOTHING;

INSERT INTO public.video_filter_options (filter_id, label, value, enabled, sort_order)
SELECT id, 'Classic Era', 'classic', true, 4 FROM public.video_filters WHERE slug = 'era'
ON CONFLICT DO NOTHING;

-- Seed Default Ad Units
INSERT INTO public.adsense_units (id, name, ad_slot_id, format, responsive, enabled, sort_order)
VALUES
  ('b0000001-0000-0000-0000-000000000001', 'Header Billboard Leaderboard', '1001001001', 'horizontal', true, true, 1),
  ('b0000001-0000-0000-0000-000000000002', 'Video In-Feed Native Card', '2002002002', 'auto', true, true, 2),
  ('b0000001-0000-0000-0000-000000000003', 'Player Bottom Banner', '3003003003', 'horizontal', true, true, 3),
  ('b0000001-0000-0000-0000-000000000004', 'Footer Responsive Banner', '4004004004', 'auto', true, true, 4)
ON CONFLICT DO NOTHING;

-- Seed Default Ad Placements (All 12 placement points)
INSERT INTO public.ad_placements (placement_key, name, ad_unit_id, enabled, sort_order, frequency)
VALUES
  ('header_top', 'Header — Top Banner', 'b0000001-0000-0000-0000-000000000001', false, 1, 1),
  ('header_bottom', 'Header — Below Navigation Bar', 'b0000001-0000-0000-0000-000000000001', false, 2, 1),
  ('video_list_top', 'Videos Page — Above Video List', 'b0000001-0000-0000-0000-000000000001', false, 3, 1),
  ('video_list_in_feed', 'Videos Page — Between Video Cards', 'b0000001-0000-0000-0000-000000000002', false, 4, 5),
  ('video_list_bottom', 'Videos Page — Below Video List', 'b0000001-0000-0000-0000-000000000004', false, 5, 1),
  ('video_details_above_player', 'Video Details — Above Player', 'b0000001-0000-0000-0000-000000000001', false, 6, 1),
  ('video_details_below_player', 'Video Details — Below Player', 'b0000001-0000-0000-0000-000000000003', false, 7, 1),
  ('video_details_below_description', 'Video Details — Below Description', 'b0000001-0000-0000-0000-000000000003', false, 8, 1),
  ('video_details_below_controls', 'Video Details — Below Player Controls', 'b0000001-0000-0000-0000-000000000003', false, 9, 1),
  ('sidebar', 'Sidebar / Drawer Placement', 'b0000001-0000-0000-0000-000000000002', false, 10, 1),
  ('footer_top', 'Footer — Before Footer Area', 'b0000001-0000-0000-0000-000000000004', false, 11, 1),
  ('footer_bottom', 'Footer — Bottom Section', 'b0000001-0000-0000-0000-000000000004', false, 12, 1)
ON CONFLICT (placement_key) DO NOTHING;

-- Seed Default Custom Ad Code record
INSERT INTO public.ad_code_settings (id, name, code_type, code_content, enabled)
VALUES (
  'c0000001-0000-0000-0000-000000000001',
  'Global Header / Placement Code Snippet',
  'html',
  '',
  false
)
ON CONFLICT DO NOTHING;

-- Seed Default AdSense Settings record
INSERT INTO public.adsense_settings (id, publisher_id, ad_slot_id, enabled)
VALUES (
  'd0000001-0000-0000-0000-000000000001',
  '',
  '',
  false
)
ON CONFLICT DO NOTHING;

-- ==============================================================================
-- 8. STORAGE BUCKET FOR AD ASSETS (ads.txt, html snippets)
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'ad-assets',
    'ad-assets',
    true,
    5242880, -- 5 MB
    ARRAY['text/plain', 'text/html', 'application/json']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['text/plain', 'text/html', 'application/json'];

-- Storage bucket policies
DO $$
BEGIN
    DROP POLICY IF EXISTS "Public can view ad-assets" ON storage.objects;
    CREATE POLICY "Public can view ad-assets" ON storage.objects
        FOR SELECT TO public
        USING (bucket_id = 'ad-assets');

    DROP POLICY IF EXISTS "Admins can upload ad-assets" ON storage.objects;
    CREATE POLICY "Admins can upload ad-assets" ON storage.objects
        FOR ALL TO authenticated
        USING (
            bucket_id = 'ad-assets' AND
            EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
        )
        WITH CHECK (
            bucket_id = 'ad-assets' AND
            EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
        );
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- ==============================================================================
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.video_filters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_filter_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adsense_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adsense_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_code_settings ENABLE ROW LEVEL SECURITY;

-- VIDEO FILTERS POLICIES
DROP POLICY IF EXISTS "Anyone can read active video filters" ON public.video_filters;
CREATE POLICY "Anyone can read active video filters" ON public.video_filters
    FOR SELECT TO public
    USING (
        enabled = true OR
        EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
    );

DROP POLICY IF EXISTS "Admins can manage video filters" ON public.video_filters;
CREATE POLICY "Admins can manage video filters" ON public.video_filters
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- VIDEO FILTER OPTIONS POLICIES
DROP POLICY IF EXISTS "Anyone can read active video filter options" ON public.video_filter_options;
CREATE POLICY "Anyone can read active video filter options" ON public.video_filter_options
    FOR SELECT TO public
    USING (
        enabled = true OR
        EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
    );

DROP POLICY IF EXISTS "Admins can manage video filter options" ON public.video_filter_options;
CREATE POLICY "Admins can manage video filter options" ON public.video_filter_options
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- ADSENSE SETTINGS POLICIES
DROP POLICY IF EXISTS "Anyone can read adsense settings" ON public.adsense_settings;
CREATE POLICY "Anyone can read adsense settings" ON public.adsense_settings
    FOR SELECT TO public
    USING (true);

DROP POLICY IF EXISTS "Admins can manage adsense settings" ON public.adsense_settings;
CREATE POLICY "Admins can manage adsense settings" ON public.adsense_settings
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- ADSENSE UNITS POLICIES
DROP POLICY IF EXISTS "Anyone can read active adsense units" ON public.adsense_units;
CREATE POLICY "Anyone can read active adsense units" ON public.adsense_units
    FOR SELECT TO public
    USING (
        enabled = true OR
        EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
    );

DROP POLICY IF EXISTS "Admins can manage adsense units" ON public.adsense_units;
CREATE POLICY "Admins can manage adsense units" ON public.adsense_units
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- AD PLACEMENTS POLICIES
DROP POLICY IF EXISTS "Anyone can read active ad placements" ON public.ad_placements;
CREATE POLICY "Anyone can read active ad placements" ON public.ad_placements
    FOR SELECT TO public
    USING (true);

DROP POLICY IF EXISTS "Admins can manage ad placements" ON public.ad_placements;
CREATE POLICY "Admins can manage ad placements" ON public.ad_placements
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- CUSTOM AD CODE SETTINGS POLICIES
DROP POLICY IF EXISTS "Anyone can read active custom ad code" ON public.ad_code_settings;
CREATE POLICY "Anyone can read active custom ad code" ON public.ad_code_settings
    FOR SELECT TO public
    USING (
        enabled = true OR
        EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
    );

DROP POLICY IF EXISTS "Admins can manage custom ad code" ON public.ad_code_settings;
CREATE POLICY "Admins can manage custom ad code" ON public.ad_code_settings
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- ==============================================================================
-- 10. REFRESH SCHEMA CACHE
-- ==============================================================================
NOTIFY pgrst, 'reload schema';
