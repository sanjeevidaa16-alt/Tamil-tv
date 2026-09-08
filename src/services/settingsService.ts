import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { SiteSettings, AnalyticsSettings, AdSenseSettings, AdminActivityLog } from '../types';
import { DEFAULT_SITE_SETTINGS_CONFIG } from '../data/themes';
import { analyticsService, DEFAULT_ANALYTICS_SETTINGS } from './analyticsService';
import { mediaStorage } from '../utils/mediaStorage';
import { optimizeImageFile, compressBase64Image } from '../utils/imageOptimizer';

const LOCAL_SITE_SETTINGS_KEY = 'STREAMVAULT_SITE_SETTINGS';
const LOCAL_ANALYTICS_SETTINGS_KEY = 'STREAMVAULT_ANALYTICS_SETTINGS';
const LOCAL_ADSENSE_SETTINGS_KEY = 'STREAMVAULT_ADSENSE_SETTINGS';
const LOCAL_ACTIVITY_LOGS_KEY = 'STREAMVAULT_ACTIVITY_LOGS';

const DEFAULT_SITE_SETTINGS: SiteSettings = {
  ...DEFAULT_SITE_SETTINGS_CONFIG,
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

const BRAND_IMAGE_FIELDS: (keyof SiteSettings)[] = [
  'main_logo_url',
  'header_logo_url',
  'footer_logo_url',
  'mobile_logo_url',
  'favicon_url',
];

/**
 * Ensures any large data:image URLs are downscaled so settings stay compact
 */
async function compressSettingsImages(settings: SiteSettings): Promise<SiteSettings> {
  const result: Record<string, any> = { ...settings };
  for (const field of BRAND_IMAGE_FIELDS) {
    const val = result[field];
    if (typeof val === 'string' && val.startsWith('data:image/') && val.length > 60000) {
      const isFavicon = field === 'favicon_url';
      try {
        result[field] = await compressBase64Image(
          val,
          isFavicon ? 128 : 600,
          isFavicon ? 128 : 200,
          0.85
        );
      } catch {
        // Keep existing if compression fails
      }
    }
  }
  return result as SiteSettings;
}

/**
 * Dual-layer persistent storage (IndexedDB + localStorage) with quota recovery
 */
async function safeSaveSiteSettings(settings: SiteSettings): Promise<SiteSettings> {
  // 1. Optimize any oversized image URLs
  const optimized = await compressSettingsImages(settings);

  // 2. Persist full settings in IndexedDB (virtually unlimited quota)
  try {
    await mediaStorage.saveJsonRecord(LOCAL_SITE_SETTINGS_KEY, optimized);
  } catch (idbErr) {
    console.warn('Could not persist settings to IndexedDB:', idbErr);
  }

  // 3. Persist to localStorage with active quota recovery
  const serialized = JSON.stringify(optimized);
  try {
    localStorage.setItem(LOCAL_SITE_SETTINGS_KEY, serialized);
  } catch (quotaErr: any) {
    console.warn('localStorage quota exceeded on saving site settings. Running recovery...', quotaErr);

    try {
      // Step A: Evict or clear non-critical activity logs from localStorage
      localStorage.removeItem(LOCAL_ACTIVITY_LOGS_KEY);
      localStorage.setItem(LOCAL_SITE_SETTINGS_KEY, serialized);
      console.info('Successfully saved site settings after clearing temporary activity logs.');
    } catch {
      // Step B: If still failing, create an ultra-lightweight copy for localStorage
      // while IndexedDB keeps the full settings with all images intact
      try {
        const lightweightCopy: Record<string, any> = { ...optimized };
        for (const field of BRAND_IMAGE_FIELDS) {
          const val = lightweightCopy[field];
          if (typeof val === 'string' && val.startsWith('data:')) {
            // Remove heavy data URL from localStorage only; IndexedDB retains it
            lightweightCopy[field] = '';
          }
        }
        localStorage.setItem(LOCAL_SITE_SETTINGS_KEY, JSON.stringify(lightweightCopy));
        console.info('Saved lightweight settings to localStorage (full settings safe in IndexedDB).');
      } catch (finalErr) {
        console.warn('localStorage write skipped (settings safely preserved in IndexedDB):', finalErr);
      }
    }
  }

  return optimized;
}

export const settingsService = {
  // Site Settings
  async getSiteSettings(): Promise<SiteSettings> {
    // 1. Check IndexedDB first (most complete and free of localStorage 5MB quota restrictions)
    let idbSettings: SiteSettings | null = null;
    try {
      idbSettings = await mediaStorage.getJsonRecord<SiteSettings>(LOCAL_SITE_SETTINGS_KEY);
    } catch {
      idbSettings = null;
    }

    const fallback = (): SiteSettings => {
      let localSettings: SiteSettings | null = null;
      try {
        const cached = localStorage.getItem(LOCAL_SITE_SETTINGS_KEY);
        if (cached) {
          localSettings = JSON.parse(cached);
        }
      } catch {
        localSettings = null;
      }

      if (idbSettings && localSettings) {
        const idbTime = new Date(idbSettings.updated_at || 0).getTime();
        const localTime = new Date(localSettings.updated_at || 0).getTime();
        const preferred = idbTime >= localTime ? idbSettings : localSettings;
        return sanitizeSettings({ ...DEFAULT_SITE_SETTINGS, ...preferred });
      }

      if (idbSettings) {
        return sanitizeSettings({ ...DEFAULT_SITE_SETTINGS, ...idbSettings });
      }

      if (localSettings) {
        return sanitizeSettings({ ...DEFAULT_SITE_SETTINGS, ...localSettings });
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
      const sanitized = sanitizeSettings({ ...DEFAULT_SITE_SETTINGS, ...data } as SiteSettings);
      // Cache Supabase response in IndexedDB & localStorage
      safeSaveSiteSettings(sanitized).catch(() => {});
      return sanitized;
    } catch {
      return fallback();
    }
  },

  async updateSiteSettings(settings: Partial<SiteSettings>): Promise<SiteSettings> {
    const current = await this.getSiteSettings();
    const updated: SiteSettings = { ...current, ...settings, updated_at: new Date().toISOString() };
    
    // Safely persist without ever throwing QuotaExceededError
    const saved = await safeSaveSiteSettings(updated);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('site_settings').upsert({
          id: current.id || 'primary_site_settings',
          ...saved,
        });
      } catch (err) {
        console.warn('Supabase site_settings upsert error:', err);
      }
    }

    await this.logAdminAction('Updated Website CMS & Theme Settings', 'settings', 'site_config', JSON.stringify({
      theme: saved.theme_name,
      site_name: saved.site_name,
      primary_color: saved.primary_color,
    }));
    return saved;
  },

  async resetSiteSettings(): Promise<SiteSettings> {
    const resetData: SiteSettings = {
      ...DEFAULT_SITE_SETTINGS_CONFIG,
      id: 'primary_site_settings',
      updated_at: new Date().toISOString(),
    };
    const saved = await safeSaveSiteSettings(resetData);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('site_settings').upsert(resetData);
      } catch (err) {
        console.warn('Supabase site_settings reset error:', err);
      }
    }

    await this.logAdminAction('Reset Website Settings to Default', 'settings', 'site_config', 'Restored original StreamVault defaults');
    return saved;
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
        console.warn('Supabase storage upload failed, falling back to optimized local storage:', err);
      }
    }

    // Also persist raw file in IndexedDB for reliable offline retrieval
    try {
      const idbKey = `brand_${assetType}_${Date.now()}`;
      await mediaStorage.saveMediaBlob(idbKey, file);
    } catch (err) {
      console.warn('IndexedDB brand asset backup warning:', err);
    }

    // Client-side: optimize image into a compact, crisp data URL (typically 15-35KB)
    const isFavicon = assetType === 'favicon';
    return optimizeImageFile(file, {
      maxWidth: isFavicon ? 128 : 600,
      maxHeight: isFavicon ? 128 : 200,
      quality: 0.85,
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
    try {
      localStorage.setItem(LOCAL_ANALYTICS_SETTINGS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Could not save analytics settings to localStorage:', e);
    }

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

    // Apply GA4 tag script dynamically via centralized service
    analyticsService.initialize(updated);

    await this.logAdminAction(
      'Updated Google Analytics Config',
      'settings',
      'ga4_config',
      `Measurement ID: ${updated.ga_measurement_id || 'Disabled'} | Enabled: ${updated.enabled}`
    );
    return updated;
  },

  initGoogleAnalytics(measurementId: string) {
    analyticsService.initialize({
      ...DEFAULT_ANALYTICS_SETTINGS,
      enabled: true,
      ga_measurement_id: measurementId,
    });
  },

  trackGoogleAnalyticsEvent(eventName: string, eventParams: Record<string, any> = {}) {
    analyticsService.trackEvent(eventName, eventParams);
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
    try {
      localStorage.setItem(LOCAL_ADSENSE_SETTINGS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Could not save AdSense settings to localStorage:', e);
    }

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
    const updated = [newLog, ...list].slice(0, 50);
    try {
      localStorage.setItem(LOCAL_ACTIVITY_LOGS_KEY, JSON.stringify(updated));
    } catch {
      // If saving logs hits quota, keep only the latest 5 logs or clear
      try {
        localStorage.setItem(LOCAL_ACTIVITY_LOGS_KEY, JSON.stringify([newLog]));
      } catch {
        // Silently skip if quota completely exhausted
      }
    }

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
