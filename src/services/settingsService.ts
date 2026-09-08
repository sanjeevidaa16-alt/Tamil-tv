import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { SiteSettings, AnalyticsSettings, AdSenseSettings, AdminActivityLog } from '../types';
import { DEFAULT_SITE_SETTINGS_CONFIG } from '../data/themes';

const LOCAL_SITE_SETTINGS_KEY = 'STREAMVAULT_SITE_SETTINGS';
const LOCAL_ANALYTICS_SETTINGS_KEY = 'STREAMVAULT_ANALYTICS_SETTINGS';
const LOCAL_ADSENSE_SETTINGS_KEY = 'STREAMVAULT_ADSENSE_SETTINGS';
const LOCAL_ACTIVITY_LOGS_KEY = 'STREAMVAULT_ACTIVITY_LOGS';

const DEFAULT_SITE_SETTINGS: SiteSettings = {
  ...DEFAULT_SITE_SETTINGS_CONFIG,
};

const DEFAULT_ANALYTICS_SETTINGS: AnalyticsSettings = {
  ga_measurement_id: '',
  enabled: false,
  track_pageviews: true,
  track_video_events: true,
};

const DEFAULT_ADSENSE_SETTINGS: AdSenseSettings = {
  publisher_id: '',
  ad_slot_id: '',
  enabled: false,
  placement_before_list: false,
  placement_between_cards: false,
  placement_details_page: false,
  placement_below_player: false,
};

const DEFAULT_LOGS: AdminActivityLog[] = [
  {
    id: 'log-1',
    admin_name: 'Super Admin',
    action: 'System Initialized',
    target_type: 'settings',
    details: 'StreamVault core security parameters, theme engine, and CMS initialized.',
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
];

const STALE_DESC =
  'Enterprise-grade video streaming platform architected with Supabase Auth, PostgreSQL with Row-Level Security, Supabase Storage, and granular Role-Based Access Control.';

const sanitizeSettings = (settings: SiteSettings): SiteSettings => {
  const sanitized = { ...settings };
  if (sanitized.site_description === STALE_DESC) {
    sanitized.site_description = '';
  }
  if (sanitized.footer_description === STALE_DESC) {
    sanitized.footer_description = '';
  }
  return sanitized;
};

export const settingsService = {
  // Site Settings
  async getSiteSettings(): Promise<SiteSettings> {
    const fallback = (): SiteSettings => {
      const cached = localStorage.getItem(LOCAL_SITE_SETTINGS_KEY);
      if (cached) {
        try {
          return sanitizeSettings({ ...DEFAULT_SITE_SETTINGS, ...JSON.parse(cached) });
        } catch {
          return DEFAULT_SITE_SETTINGS;
        }
      }
      return DEFAULT_SITE_SETTINGS;
    };

    if (!isSupabaseConfigured) {
      return fallback();
    }

    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data) {
        return fallback();
      }
      return sanitizeSettings({ ...DEFAULT_SITE_SETTINGS, ...data } as SiteSettings);
    } catch {
      return fallback();
    }
  },

  async updateSiteSettings(settings: Partial<SiteSettings>): Promise<SiteSettings> {
    const current = await this.getSiteSettings();
    const updated: SiteSettings = { ...current, ...settings, updated_at: new Date().toISOString() };
    localStorage.setItem(LOCAL_SITE_SETTINGS_KEY, JSON.stringify(updated));

    if (isSupabaseConfigured) {
      try {
        await supabase.from('site_settings').upsert({
          id: current.id || 'primary_site_settings',
          ...updated,
        });
      } catch (err) {
        console.warn('Supabase site_settings upsert error:', err);
      }
    }

    await this.logAdminAction('Updated Website CMS & Theme Settings', 'settings', 'site_config', JSON.stringify({
      theme: updated.theme_name,
      site_name: updated.site_name,
      primary_color: updated.primary_color,
    }));
    return updated;
  },

  async resetSiteSettings(): Promise<SiteSettings> {
    const resetData: SiteSettings = {
      ...DEFAULT_SITE_SETTINGS_CONFIG,
      id: 'primary_site_settings',
      updated_at: new Date().toISOString(),
    };
    localStorage.setItem(LOCAL_SITE_SETTINGS_KEY, JSON.stringify(resetData));

    if (isSupabaseConfigured) {
      try {
        await supabase.from('site_settings').upsert(resetData);
      } catch (err) {
        console.warn('Supabase site_settings reset error:', err);
      }
    }

    await this.logAdminAction('Reset Website Settings to Default', 'settings', 'site_config', 'Restored original StreamVault defaults');
    return resetData;
  },

  // Brand Asset Upload (Logo, Favicon)
  async uploadBrandAsset(file: File, assetType: 'main_logo' | 'header_logo' | 'footer_logo' | 'mobile_logo' | 'favicon'): Promise<string> {
    if (!file) throw new Error('No file provided');

    // If Supabase is configured, upload to thumbnails or site-assets bucket
    if (isSupabaseConfigured) {
      try {
        const fileExt = file.name.split('.').pop() || 'png';
        const fileName = `brand/${assetType}_${Date.now()}.${fileExt}`;

        // Attempt 'thumbnails' bucket (pre-configured in schema)
        const { error: uploadErr } = await supabase.storage
          .from('thumbnails')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: true,
          });

        if (!uploadErr) {
          const { data: publicUrlData } = supabase.storage.from('thumbnails').getPublicUrl(fileName);
          if (publicUrlData?.publicUrl) {
            return publicUrlData.publicUrl;
          }
        }
      } catch (err) {
        console.warn('Supabase storage upload failed, falling back to data URL:', err);
      }
    }

    // Local / fallback client-side Data URL conversion
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  },

  // Analytics Settings (Google Analytics 4)
  async getAnalyticsSettings(): Promise<AnalyticsSettings> {
    if (!isSupabaseConfigured) {
      const cached = localStorage.getItem(LOCAL_ANALYTICS_SETTINGS_KEY);
      return cached ? JSON.parse(cached) : DEFAULT_ANALYTICS_SETTINGS;
    }

    try {
      const { data, error } = await supabase
        .from('analytics_settings')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data) {
        const cached = localStorage.getItem(LOCAL_ANALYTICS_SETTINGS_KEY);
        return cached ? JSON.parse(cached) : DEFAULT_ANALYTICS_SETTINGS;
      }
      return data as AnalyticsSettings;
    } catch {
      const cached = localStorage.getItem(LOCAL_ANALYTICS_SETTINGS_KEY);
      return cached ? JSON.parse(cached) : DEFAULT_ANALYTICS_SETTINGS;
    }
  },

  async updateAnalyticsSettings(settings: Partial<AnalyticsSettings>): Promise<AnalyticsSettings> {
    const current = await this.getAnalyticsSettings();
    const updated: AnalyticsSettings = { ...current, ...settings, updated_at: new Date().toISOString() };
    localStorage.setItem(LOCAL_ANALYTICS_SETTINGS_KEY, JSON.stringify(updated));

    if (isSupabaseConfigured) {
      try {
        await supabase.from('analytics_settings').upsert({
          id: current.id || 'primary_analytics_settings',
          ...updated,
        });
      } catch (err) {
        console.warn('Supabase analytics_settings upsert error:', err);
      }
    }

    // Apply GA4 tag script dynamically if configured
    if (updated.enabled && updated.ga_measurement_id.startsWith('G-')) {
      this.initGoogleAnalytics(updated.ga_measurement_id);
    }

    await this.logAdminAction(
      'Updated Google Analytics Config',
      'settings',
      'ga4_config',
      `Measurement ID: ${updated.ga_measurement_id || 'Disabled'}`
    );
    return updated;
  },

  initGoogleAnalytics(measurementId: string) {
    if (!measurementId || !measurementId.startsWith('G-')) return;
    if (typeof window === 'undefined') return;

    if (!document.getElementById('ga-gtag-script')) {
      const script = document.createElement('script');
      script.id = 'ga-gtag-script';
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
      document.head.appendChild(script);

      (window as any).dataLayer = (window as any).dataLayer || [];
      function gtag(...args: any[]) {
        (window as any).dataLayer.push(args);
      }
      (window as any).gtag = gtag;
      gtag('js', new Date());
      gtag('config', measurementId, { send_page_view: false });
    }
  },

  trackGoogleAnalyticsEvent(eventName: string, eventParams: Record<string, any> = {}) {
    if (typeof window !== 'undefined' && typeof (window as any).gtag === 'function') {
      try {
        (window as any).gtag('event', eventName, eventParams);
      } catch (e) {
        console.warn('GA4 event send error:', e);
      }
    }
  },

  // AdSense Settings
  async getAdSenseSettings(): Promise<AdSenseSettings> {
    if (!isSupabaseConfigured) {
      const cached = localStorage.getItem(LOCAL_ADSENSE_SETTINGS_KEY);
      return cached ? JSON.parse(cached) : DEFAULT_ADSENSE_SETTINGS;
    }

    try {
      const { data, error } = await supabase
        .from('adsense_settings')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data) {
        const cached = localStorage.getItem(LOCAL_ADSENSE_SETTINGS_KEY);
        return cached ? JSON.parse(cached) : DEFAULT_ADSENSE_SETTINGS;
      }
      return data as AdSenseSettings;
    } catch {
      const cached = localStorage.getItem(LOCAL_ADSENSE_SETTINGS_KEY);
      return cached ? JSON.parse(cached) : DEFAULT_ADSENSE_SETTINGS;
    }
  },

  async updateAdSenseSettings(settings: Partial<AdSenseSettings>): Promise<AdSenseSettings> {
    const current = await this.getAdSenseSettings();
    const updated: AdSenseSettings = { ...current, ...settings, updated_at: new Date().toISOString() };
    localStorage.setItem(LOCAL_ADSENSE_SETTINGS_KEY, JSON.stringify(updated));

    if (isSupabaseConfigured) {
      try {
        await supabase.from('adsense_settings').upsert({
          id: current.id || 'primary_adsense_settings',
          ...updated,
        });
      } catch (err) {
        console.warn('Supabase adsense_settings upsert error:', err);
      }
    }

    await this.logAdminAction(
      'Updated Google AdSense Config',
      'settings',
      'adsense_config',
      `Publisher ID: ${updated.publisher_id || 'None'}, Enabled: ${updated.enabled}`
    );
    return updated;
  },

  // Activity Logs
  async getActivityLogs(limit = 50): Promise<AdminActivityLog[]> {
    if (!isSupabaseConfigured) {
      const raw = localStorage.getItem(LOCAL_ACTIVITY_LOGS_KEY);
      const list: AdminActivityLog[] = raw ? JSON.parse(raw) : DEFAULT_LOGS;
      return list.slice(0, limit);
    }

    try {
      const { data, error } = await supabase
        .from('admin_activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error || !data || data.length === 0) {
        const raw = localStorage.getItem(LOCAL_ACTIVITY_LOGS_KEY);
        return raw ? JSON.parse(raw) : DEFAULT_LOGS;
      }
      return data as AdminActivityLog[];
    } catch {
      const raw = localStorage.getItem(LOCAL_ACTIVITY_LOGS_KEY);
      return raw ? JSON.parse(raw) : DEFAULT_LOGS;
    }
  },

  async logAdminAction(
    action: string,
    targetType: 'video' | 'user' | 'category' | 'settings' | 'auth' | 'filter' | 'adsense',
    targetId?: string,
    details?: string,
    adminName = 'Admin'
  ): Promise<void> {
    const newLog: AdminActivityLog = {
      id: 'log-' + Date.now(),
      admin_name: adminName,
      action,
      target_type: targetType,
      target_id: targetId,
      details,
      created_at: new Date().toISOString(),
    };

    const raw = localStorage.getItem(LOCAL_ACTIVITY_LOGS_KEY);
    const list: AdminActivityLog[] = raw ? JSON.parse(raw) : DEFAULT_LOGS;
    const updated = [newLog, ...list].slice(0, 100);
    localStorage.setItem(LOCAL_ACTIVITY_LOGS_KEY, JSON.stringify(updated));

    if (isSupabaseConfigured) {
      try {
        await supabase.from('admin_activity_logs').insert([
          {
            action,
            target_type: targetType,
            target_id: targetId,
            details,
            admin_name: adminName,
          },
        ]);
      } catch (err) {
        console.warn('Could not write to Supabase admin_activity_logs:', err);
      }
    }
  },
};
