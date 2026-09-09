-- ==============================================================================
-- StreamVault: Centralized Global Site Settings & Analytics Migration
-- Single Source of Truth for Global Settings & Realtime Synchronization
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. CENTRALIZED SITE SETTINGS TABLE (SINGLETON ARCHITECTURE)
CREATE TABLE IF NOT EXISTS public.site_settings (
    id TEXT PRIMARY KEY DEFAULT 'primary_site_settings',
    settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    version INTEGER NOT NULL DEFAULT 1,
    site_name TEXT NOT NULL DEFAULT 'StreamVault',
    theme_name TEXT NOT NULL DEFAULT 'Tamil OTT',
    user_panel_design TEXT NOT NULL DEFAULT 'tamil-ott',
    primary_color TEXT DEFAULT '#e11d48',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Seed initial row if not already present
INSERT INTO public.site_settings (id, settings, version, site_name, theme_name, user_panel_design, primary_color, updated_at)
VALUES (
    'primary_site_settings',
    '{
      "site_name": "StreamVault",
      "site_short_name": "SV",
      "site_tagline": "Premium Video On Demand & Cinema Hub",
      "site_description": "Enterprise-grade streaming platform.",
      "theme_name": "Tamil OTT",
      "ui_style": "modern-minimal",
      "user_panel_design": "tamil-ott",
      "appearance_mode": "dark",
      "primary_color": "#e11d48",
      "secondary_color": "#be123c",
      "accent_color": "#f43f5e",
      "background_color": "#0a0b10",
      "surface_color": "#11131d",
      "foreground_color": "#ffffff",
      "border_color": "#1e2233",
      "button_color": "#e11d48",
      "button_hover_color": "#f43f5e",
      "footer_name": "StreamVault",
      "footer_description": "Explore exclusive regional cinema and video productions.",
      "copyright_text": "© StreamVault. All rights reserved.",
      "auto_copyright_year": true,
      "maintenance_mode": false,
      "enable_analytics": false,
      "enable_adsense": false
    }'::jsonb,
    1,
    'StreamVault',
    'Tamil OTT',
    'tamil-ott',
    '#e11d48',
    NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. GOOGLE ANALYTICS SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.analytics_settings (
    id TEXT PRIMARY KEY DEFAULT 'primary_analytics_settings',
    enabled BOOLEAN NOT NULL DEFAULT false,
    ga_measurement_id TEXT NOT NULL DEFAULT '',
    google_tag_id TEXT DEFAULT '',
    website_url TEXT DEFAULT '',
    stream_name TEXT DEFAULT '',
    enhanced_measurement BOOLEAN NOT NULL DEFAULT true,
    debug_mode BOOLEAN NOT NULL DEFAULT false,
    respect_consent BOOLEAN NOT NULL DEFAULT true,
    track_pageviews BOOLEAN NOT NULL DEFAULT true,
    track_video_events BOOLEAN NOT NULL DEFAULT true,
    track_search BOOLEAN NOT NULL DEFAULT true,
    track_categories BOOLEAN NOT NULL DEFAULT true,
    track_filters BOOLEAN NOT NULL DEFAULT true,
    track_auth BOOLEAN NOT NULL DEFAULT true,
    track_ui_clicks BOOLEAN NOT NULL DEFAULT true,
    track_admin_activity BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

INSERT INTO public.analytics_settings (id, enabled, ga_measurement_id, updated_at)
VALUES ('primary_analytics_settings', false, '', NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_settings ENABLE ROW LEVEL SECURITY;

-- 4. RLS POLICIES FOR SITE SETTINGS
DROP POLICY IF EXISTS "Public can view global site settings" ON public.site_settings;
CREATE POLICY "Public can view global site settings" ON public.site_settings
    FOR SELECT TO public
    USING (true);

DROP POLICY IF EXISTS "Admins can insert site settings" ON public.site_settings;
CREATE POLICY "Admins can insert site settings" ON public.site_settings
    FOR INSERT TO authenticated
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update site settings" ON public.site_settings;
CREATE POLICY "Admins can update site settings" ON public.site_settings
    FOR UPDATE TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 5. RLS POLICIES FOR ANALYTICS SETTINGS
DROP POLICY IF EXISTS "Public can view analytics settings" ON public.analytics_settings;
CREATE POLICY "Public can view analytics settings" ON public.analytics_settings
    FOR SELECT TO public
    USING (true);

DROP POLICY IF EXISTS "Admins can insert analytics settings" ON public.analytics_settings;
CREATE POLICY "Admins can insert analytics settings" ON public.analytics_settings
    FOR INSERT TO authenticated
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update analytics settings" ON public.analytics_settings;
CREATE POLICY "Admins can update analytics settings" ON public.analytics_settings
    FOR UPDATE TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 6. ENABLE REPLICA IDENTITY FULL FOR REALTIME NOTIFICATIONS
ALTER TABLE public.site_settings REPLICA IDENTITY FULL;
ALTER TABLE public.analytics_settings REPLICA IDENTITY FULL;

-- 7. ADD TO SUPABASE REALTIME PUBLICATION
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.site_settings;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.analytics_settings;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
END $$;

-- 8. NOTIFY POSTGREST TO RELOAD SCHEMA CACHE IMMEDIATELY
NOTIFY pgrst, 'reload schema';
