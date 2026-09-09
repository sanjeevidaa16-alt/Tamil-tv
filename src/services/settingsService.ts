import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { SiteSettings, AnalyticsSettings, AdSenseSettings, AdminActivityLog } from '../types';
import { DEFAULT_SITE_SETTINGS_CONFIG, EXTENDED_THEME_PRESETS } from '../data/themes';
import { analyticsService, DEFAULT_ANALYTICS_SETTINGS } from './analyticsService';
import { mediaStorage } from '../utils/mediaStorage';
import { optimizeImageFile, compressBase64Image } from '../utils/imageOptimizer';
import { applyThemeToDOM as applyTokensToRoot, deriveCompleteTokens } from '../utils/themeEngine';
import { ThemeTokens, UIStyleId } from '../types/theme';

// Local storage backup keys (strictly read-only fallback when completely offline)
const BACKUP_SITE_SETTINGS_KEY = 'STREAMVAULT_SITE_SETTINGS_BACKUP';
const BACKUP_ANALYTICS_SETTINGS_KEY = 'STREAMVAULT_ANALYTICS_SETTINGS_BACKUP';
const BACKUP_ADSENSE_SETTINGS_KEY = 'STREAMVAULT_ADSENSE_SETTINGS_BACKUP';
const BACKUP_ACTIVITY_LOGS_KEY = 'STREAMVAULT_ACTIVITY_LOGS_BACKUP';

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  ...DEFAULT_SITE_SETTINGS_CONFIG,
  version: 1,
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
    id: 'log-init',
    admin_name: 'Super Admin',
    action: 'System Initialized',
    target_type: 'settings',
    details: 'StreamVault Supabase Database Single Source of Truth architecture active.',
    created_at: new Date().toISOString(),
  },
];

const BRAND_IMAGE_FIELDS: (keyof SiteSettings)[] = [
  'main_logo_url',
  'header_logo_url',
  'footer_logo_url',
  'mobile_logo_url',
  'favicon_url',
];

/**
 * Ensures any large data:image URLs are compressed so database payloads remain fast & lightweight
 */
async function compressSettingsImages(settings: SiteSettings): Promise<SiteSettings> {
  const result: Record<string, any> = { ...settings };
  for (const field of BRAND_IMAGE_FIELDS) {
    const val = result[field];
    if (typeof val === 'string' && val.startsWith('data:image/') && val.length > 50000) {
      const isFavicon = field === 'favicon_url';
      try {
        result[field] = await compressBase64Image(
          val,
          isFavicon ? 128 : 600,
          isFavicon ? 128 : 200,
          0.85
        );
      } catch {
        // Keep original if compression fails
      }
    }
  }
  return result as SiteSettings;
}

const sanitizeSettings = (raw: any): SiteSettings => {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_SITE_SETTINGS };
  }

  // If payload contains nested settings JSONB, unwrap it
  const src = raw.settings && typeof raw.settings === 'object' && Object.keys(raw.settings).length > 0
    ? { ...raw.settings, ...raw }
    : raw;

  return {
    ...DEFAULT_SITE_SETTINGS,
    ...src,
    id: 'primary_site_settings',
    version: typeof src.version === 'number' ? src.version : (typeof raw.version === 'number' ? raw.version : 1),
    updated_at: src.updated_at || raw.updated_at || new Date().toISOString(),
    site_name: src.site_name || DEFAULT_SITE_SETTINGS.site_name,
    theme_name: src.theme_name || DEFAULT_SITE_SETTINGS.theme_name,
    user_panel_design: src.user_panel_design || DEFAULT_SITE_SETTINGS.user_panel_design,
    primary_color: src.primary_color || DEFAULT_SITE_SETTINGS.primary_color,
    secondary_color: src.secondary_color || DEFAULT_SITE_SETTINGS.secondary_color,
    accent_color: src.accent_color || DEFAULT_SITE_SETTINGS.accent_color,
    background_color: src.background_color || DEFAULT_SITE_SETTINGS.background_color,
    surface_color: src.surface_color || DEFAULT_SITE_SETTINGS.surface_color,
    border_color: src.border_color || DEFAULT_SITE_SETTINGS.border_color,
    button_color: src.button_color || DEFAULT_SITE_SETTINGS.button_color,
    button_hover_color: src.button_hover_color || DEFAULT_SITE_SETTINGS.button_hover_color,
    footer_sections: Array.isArray(src.footer_sections) ? src.footer_sections : DEFAULT_SITE_SETTINGS.footer_sections,
    footer_social_links: Array.isArray(src.footer_social_links) ? src.footer_social_links : DEFAULT_SITE_SETTINGS.footer_social_links,
  };
};

// Central in-memory state tracking latest confirmed database values
let activeConfirmedSettings: SiteSettings | null = null;
let activeAnalyticsSettings: AnalyticsSettings | null = null;
let inFlightFetchPromise: Promise<SiteSettings> | null = null;

// Listeners registered across React contexts and components
type SettingsListener = (settings: SiteSettings) => void;
const settingsListeners = new Set<SettingsListener>();

type AnalyticsListener = (settings: AnalyticsSettings) => void;
const analyticsListeners = new Set<AnalyticsListener>();

// Cross-tab broadcast channel for immediate synchronization within the same browser
let crossTabChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    crossTabChannel = new BroadcastChannel('streamvault_global_settings');
    crossTabChannel.onmessage = (event) => {
      if (event.data?.type === 'SETTINGS_UPDATED' && event.data?.payload) {
        console.log('[Cross-Tab Sync] Received updated global settings:', event.data.payload.version);
        handleIncomingSettings(event.data.payload);
      }
    };
  }
} catch (e) {
  console.warn('[Cross-Tab Sync] BroadcastChannel not supported:', e);
}

// Active Supabase Realtime channel subscription
let realtimeChannel: any = null;
let isRealtimeSubscribed = false;

function notifySettingsListeners(updated: SiteSettings) {
  activeConfirmedSettings = updated;
  // Apply DOM theme and tokens immediately
  try {
    settingsService.applyGlobalSettings(updated);
  } catch (e) {
    console.warn('[GlobalSettings] Error applying tokens:', e);
  }

  // Notify all subscribed React contexts
  settingsListeners.forEach((fn) => {
    try {
      fn(updated);
    } catch (err) {
      console.error('[GlobalSettings] Error in listener callback:', err);
    }
  });

  // Save passive offline backup only
  try {
    localStorage.setItem(BACKUP_SITE_SETTINGS_KEY, JSON.stringify(updated));
  } catch {
    // Ignore quota issues on passive backup
  }
}

function handleIncomingSettings(incomingRaw: any) {
  const incoming = sanitizeSettings(incomingRaw);
  if (!activeConfirmedSettings) {
    notifySettingsListeners(incoming);
    return;
  }

  // Determine if incoming is newer by version or timestamp
  const currentVer = activeConfirmedSettings.version || 0;
  const incomingVer = incoming.version || 0;
  const currentTime = new Date(activeConfirmedSettings.updated_at || 0).getTime();
  const incomingTime = new Date(incoming.updated_at || 0).getTime();

  if (incomingVer > currentVer || incomingTime > currentTime) {
    console.info(`[Realtime Sync] Applying newer database settings (v${incomingVer} vs v${currentVer})`);
    notifySettingsListeners(incoming);
  }
}

/**
 * Initializes the Supabase Realtime Channel for Postgres Replication & Realtime Broadcast
 */
function ensureRealtimeSubscription() {
  if (!isSupabaseConfigured || isRealtimeSubscribed) return;

  try {
    realtimeChannel = supabase.channel('streamvault_site_settings_realtime', {
      config: {
        broadcast: { ack: true },
      },
    });

    realtimeChannel
      // 1. Listen for PostgreSQL Table Changes on public.site_settings
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'site_settings' },
        (payload: any) => {
          console.log('[Realtime Postgres Change] site_settings table event:', payload.eventType);
          if (payload.new) {
            handleIncomingSettings(payload.new);
          } else {
            // Re-fetch in case of unexpected payload format
            settingsService.refreshGlobalSettings().catch(console.warn);
          }
        }
      )
      // 2. Listen for Realtime Broadcast events for instant push across all connected browsers
      .on('broadcast', { event: 'SETTINGS_UPDATED' }, (msg: any) => {
        console.log('[Realtime Broadcast] SETTINGS_UPDATED event received');
        if (msg.payload) {
          handleIncomingSettings(msg.payload);
        }
      })
      .subscribe((status: string) => {
        console.log('[Realtime Subscription Status]:', status);
        if (status === 'SUBSCRIBED') {
          isRealtimeSubscribed = true;
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          isRealtimeSubscribed = false;
        }
      });
  } catch (err) {
    console.warn('[Realtime] Failed to initialize Realtime subscription:', err);
  }
}

export const settingsService = {
  /**
   * Primary fetch for Global Site Settings from Supabase Database.
   * Supabase Database is the SINGLE SOURCE OF TRUTH.
   * If a database row exists, that value ALWAYS wins.
   */
  async getGlobalSettings(): Promise<SiteSettings> {
    // If we already have a confirmed in-memory database value, return it
    if (activeConfirmedSettings) {
      return activeConfirmedSettings;
    }

    // Deduplicate concurrent calls during initial app startup
    if (inFlightFetchPromise) {
      return inFlightFetchPromise;
    }

    inFlightFetchPromise = (async () => {
      ensureRealtimeSubscription();

      if (!isSupabaseConfigured) {
        console.warn('[GlobalSettings] Supabase not configured. Using default system settings.');
        const fallback = this.getPassiveOfflineBackup();
        activeConfirmedSettings = fallback;
        return fallback;
      }

      try {
        const { data, error } = await supabase
          .from('site_settings')
          .select('*')
          .eq('id', 'primary_site_settings')
          .maybeSingle();

        if (error) {
          console.warn('[GlobalSettings] Could not query public.site_settings from database:', error.message);
          // Return passive offline backup or default without crashing
          const fallback = this.getPassiveOfflineBackup();
          activeConfirmedSettings = fallback;
          return fallback;
        }

        if (data) {
          // DATABASE VALUE ALWAYS WINS
          const sanitized = sanitizeSettings(data);
          activeConfirmedSettings = sanitized;
          // Apply tokens globally
          this.applyGlobalSettings(sanitized);
          // Update passive offline backup
          try {
            localStorage.setItem(BACKUP_SITE_SETTINGS_KEY, JSON.stringify(sanitized));
          } catch {
            // Ignore storage errors
          }
          return sanitized;
        }

        // Table exists but no row yet - return default settings
        console.info('[GlobalSettings] No row in site_settings. Default settings active.');
        const defaultSettings = { ...DEFAULT_SITE_SETTINGS };
        activeConfirmedSettings = defaultSettings;
        return defaultSettings;
      } catch (err: any) {
        console.warn('[GlobalSettings] Network or database exception fetching site settings:', err.message);
        const fallback = this.getPassiveOfflineBackup();
        activeConfirmedSettings = fallback;
        return fallback;
      } finally {
        inFlightFetchPromise = null;
      }
    })();

    return inFlightFetchPromise;
  },

  // Alias for backward compatibility
  async getSiteSettings(): Promise<SiteSettings> {
    return this.getGlobalSettings();
  },

  /**
   * Passive offline backup retrieval (strictly for fallback when Supabase is unreachable)
   */
  getPassiveOfflineBackup(): SiteSettings {
    try {
      const cached = localStorage.getItem(BACKUP_SITE_SETTINGS_KEY);
      if (cached) {
        return sanitizeSettings(JSON.parse(cached));
      }
    } catch {
      // Local storage unavailable
    }
    return { ...DEFAULT_SITE_SETTINGS };
  },

  /**
   * Save Global Settings directly to Supabase Database (Single Source of Truth).
   * This method throws if the database write fails, preventing false-positive UI alerts.
   * Upon successful database commit, propagates changes via Realtime & Broadcast to all clients.
   */
  async updateGlobalSettings(newSettings: Partial<SiteSettings>): Promise<SiteSettings> {
    // 1. Merge with currently active settings
    const current = activeConfirmedSettings || (await this.getGlobalSettings());
    const nextVersion = (current.version || 1) + 1;
    const nowIso = new Date().toISOString();

    // 2. Compress any large brand images before payload creation
    const merged: SiteSettings = {
      ...current,
      ...newSettings,
      id: 'primary_site_settings',
      version: nextVersion,
      updated_at: nowIso,
    };

    const optimized = await compressSettingsImages(merged);
    const sanitized = sanitizeSettings(optimized);

    // 3. Check Supabase connection
    if (!isSupabaseConfigured) {
      console.warn('[GlobalSettings] Saving in local-only fallback mode (Supabase credentials not configured).');
      notifySettingsListeners(sanitized);
      return sanitized;
    }

    // 4. Save to Supabase Database
    // We update both top-level columns and the comprehensive JSONB payload
    const payload = {
      id: 'primary_site_settings',
      settings: sanitized,
      version: nextVersion,
      site_name: sanitized.site_name || 'StreamVault',
      theme_name: sanitized.theme_name || 'Tamil OTT',
      user_panel_design: sanitized.user_panel_design || 'tamil-ott',
      primary_color: sanitized.primary_color || '#e11d48',
      updated_at: nowIso,
    };

    const { data, error } = await supabase
      .from('site_settings')
      .upsert(payload)
      .select('*')
      .single();

    if (error) {
      console.error('[GlobalSettings] Supabase site_settings upsert error:', error);
      throw new Error(
        `Failed to save to Supabase Database (table public.site_settings): ${error.message}. ` +
        `Ensure database migration has been run in Admin > Database Setup.`
      );
    }

    const savedSettings = sanitizeSettings(data);
    activeConfirmedSettings = savedSettings;

    // 5. Notify all local listeners and apply theme tokens to DOM immediately
    notifySettingsListeners(savedSettings);

    // 6. Broadcast across tabs in the current browser
    if (crossTabChannel) {
      try {
        crossTabChannel.postMessage({
          type: 'SETTINGS_UPDATED',
          payload: savedSettings,
        });
      } catch (err) {
        console.warn('[Cross-Tab Sync] Broadcast warning:', err);
      }
    }

    // 7. Broadcast via Supabase Realtime to all connected devices & browsers
    if (realtimeChannel && isRealtimeSubscribed) {
      try {
        realtimeChannel.send({
          type: 'broadcast',
          event: 'SETTINGS_UPDATED',
          payload: savedSettings,
        });
      } catch (err) {
        console.warn('[Realtime Broadcast] Broadcast send warning:', err);
      }
    }

    // 8. Log Admin Action
    await this.logAdminAction(
      'Updated Website Global Settings',
      'settings',
      'site_settings',
      `Version: ${savedSettings.version} | Theme: ${savedSettings.theme_name} | Design: ${savedSettings.user_panel_design}`
    );

    return savedSettings;
  },

  // Alias for backward compatibility
  async updateSiteSettings(settings: Partial<SiteSettings>): Promise<SiteSettings> {
    return this.updateGlobalSettings(settings);
  },

  /**
   * Reset Global Settings to factory defaults in Supabase Database
   */
  async resetSiteSettings(): Promise<SiteSettings> {
    const resetData: Partial<SiteSettings> = {
      ...DEFAULT_SITE_SETTINGS_CONFIG,
      id: 'primary_site_settings',
      theme_name: 'Tamil OTT',
      user_panel_design: 'tamil-ott',
    };

    const saved = await this.updateGlobalSettings(resetData);

    await this.logAdminAction(
      'Reset Website Settings to Default',
      'settings',
      'site_settings',
      'Restored factory default configuration in database.'
    );

    return saved;
  },

  /**
   * Force refresh global settings from Supabase Database
   */
  async refreshGlobalSettings(): Promise<SiteSettings> {
    activeConfirmedSettings = null;
    return this.getGlobalSettings();
  },

  /**
   * Clear in-memory and temporary cache
   */
  clearSettingsCache(): void {
    activeConfirmedSettings = null;
    try {
      localStorage.removeItem(BACKUP_SITE_SETTINGS_KEY);
    } catch {
      // Ignore
    }
  },

  /**
   * Register a listener for Realtime Global Settings updates
   */
  subscribeToGlobalSettings(listener: SettingsListener): () => void {
    settingsListeners.add(listener);
    ensureRealtimeSubscription();

    // Immediately invoke listener with current active settings if already loaded
    if (activeConfirmedSettings) {
      try {
        listener(activeConfirmedSettings);
      } catch (e) {
        console.warn('[GlobalSettings] Immediate listener invocation error:', e);
      }
    } else {
      this.getGlobalSettings().then((s) => {
        try {
          listener(s);
        } catch {
          // Ignore
        }
      });
    }

    return () => {
      settingsListeners.delete(listener);
    };
  },

  /**
   * Applies the Global Settings to the DOM, HTML head metadata, and CSS tokens
   */
  applyGlobalSettings(cfg: SiteSettings): void {
    if (typeof document === 'undefined') return;

    // 1. Derive or match theme tokens
    const matchedPreset = EXTENDED_THEME_PRESETS.find(
      (p) => p.name.toLowerCase() === (cfg.theme_name || '').toLowerCase()
    );

    const tokens: ThemeTokens = matchedPreset
      ? {
          ...matchedPreset.tokens,
          primary: cfg.primary_color || matchedPreset.tokens.primary,
          secondary: cfg.secondary_color || matchedPreset.tokens.secondary,
          accent: cfg.accent_color || matchedPreset.tokens.accent,
          background: cfg.background_color || matchedPreset.tokens.background,
          surface: cfg.surface_color || matchedPreset.tokens.surface,
          text: cfg.text_color || cfg.foreground_color || matchedPreset.tokens.text,
          border: cfg.border_color || matchedPreset.tokens.border,
          buttonBg: cfg.button_color || matchedPreset.tokens.buttonBg,
          buttonHover: cfg.button_hover_color || matchedPreset.tokens.buttonHover,
          cardBg: cfg.card_bg_color || cfg.surface_color || matchedPreset.tokens.cardBg,
          cardBorder: cfg.card_border_color || cfg.border_color || matchedPreset.tokens.cardBorder,
          inputBg: cfg.input_bg_color || matchedPreset.tokens.inputBg,
          inputBorder: cfg.input_border_color || matchedPreset.tokens.inputBorder,
          playerBg: cfg.player_bg_color || matchedPreset.tokens.playerBg,
          playerProgress: cfg.player_progress_color || cfg.primary_color || matchedPreset.tokens.playerProgress,
        }
      : deriveCompleteTokens({
          primary: cfg.primary_color,
          secondary: cfg.secondary_color,
          accent: cfg.accent_color,
          background: cfg.background_color,
          surface: cfg.surface_color,
          text: cfg.text_color || cfg.foreground_color,
          border: cfg.border_color,
          buttonBg: cfg.button_color,
          buttonHover: cfg.button_hover_color,
          cardBg: cfg.card_bg_color,
          cardBorder: cfg.card_border_color,
          inputBg: cfg.input_bg_color,
          inputBorder: cfg.input_border_color,
          playerBg: cfg.player_bg_color,
          playerProgress: cfg.player_progress_color,
        });

    const activeUIStyle: UIStyleId = (cfg.ui_style as UIStyleId) || 'modern-minimal';

    // 2. Set CSS custom properties on document.documentElement
    applyTokensToRoot(tokens, cfg.theme_name || 'custom', activeUIStyle, {
      borderRadiusScale: cfg.border_radius_scale,
      shadowStrength: cfg.card_shadow_strength,
      spacingDensity: cfg.spacing_density,
      fontScale: cfg.font_scale,
      animationLevel: cfg.animation_level,
      glassEffect: cfg.glass_effect,
    });

    // 3. Set HTML data-user-panel-design attribute for the 13 UI/UX designs
    if (cfg.user_panel_design) {
      document.documentElement.setAttribute('data-user-panel-design', cfg.user_panel_design);
      document.body.className = document.body.className
        .replace(/design-[a-z0-9-]+/g, '')
        .trim();
      document.body.classList.add(`design-${cfg.user_panel_design}`);
    }

    // 4. Update document title & metadata
    if (cfg.meta_title || cfg.site_name) {
      document.title = cfg.meta_title || `${cfg.site_name} — Video Streaming Platform`;
    }

    // 5. Update document favicon
    if (cfg.favicon_url) {
      let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
      if (!link) {
        link = document.createElement('link');
        link.type = 'image/x-icon';
        link.rel = 'shortcut icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = cfg.favicon_url;
    }
  },

  /**
   * Upload Brand Asset (Logo, Favicon) to Supabase Storage
   */
  async uploadBrandAsset(
    file: File,
    assetType: 'main_logo' | 'header_logo' | 'footer_logo' | 'mobile_logo' | 'favicon'
  ): Promise<string> {
    if (!file) throw new Error('No file provided');

    if (isSupabaseConfigured) {
      try {
        const fileExt = file.name.split('.').pop() || 'png';
        const fileName = `brand/${assetType}_${Date.now()}.${fileExt}`;

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
        console.warn('Supabase storage upload failed, falling back to optimized image string:', err);
      }
    }

    // Client-side optimize image into a compact data URL
    const isFavicon = assetType === 'favicon';
    return optimizeImageFile(file, {
      maxWidth: isFavicon ? 128 : 600,
      maxHeight: isFavicon ? 128 : 200,
      quality: 0.85,
    });
  },

  // ==============================================================================
  // GOOGLE ANALYTICS 4 SETTINGS (SUPABASE DATABASE SINGLE SOURCE OF TRUTH)
  // ==============================================================================
  async getAnalyticsSettings(): Promise<AnalyticsSettings> {
    if (activeAnalyticsSettings) return activeAnalyticsSettings;

    if (!isSupabaseConfigured) {
      try {
        const cached = localStorage.getItem(BACKUP_ANALYTICS_SETTINGS_KEY);
        return cached ? JSON.parse(cached) : DEFAULT_ANALYTICS_SETTINGS;
      } catch {
        return DEFAULT_ANALYTICS_SETTINGS;
      }
    }

    try {
      const { data, error } = await supabase
        .from('analytics_settings')
        .select('*')
        .eq('id', 'primary_analytics_settings')
        .maybeSingle();

      if (error || !data) {
        try {
          const cached = localStorage.getItem(BACKUP_ANALYTICS_SETTINGS_KEY);
          return cached ? JSON.parse(cached) : DEFAULT_ANALYTICS_SETTINGS;
        } catch {
          return DEFAULT_ANALYTICS_SETTINGS;
        }
      }

      activeAnalyticsSettings = data as AnalyticsSettings;
      return activeAnalyticsSettings;
    } catch {
      return DEFAULT_ANALYTICS_SETTINGS;
    }
  },

  async updateAnalyticsSettings(settings: Partial<AnalyticsSettings>): Promise<AnalyticsSettings> {
    const current = await this.getAnalyticsSettings();
    const updated: AnalyticsSettings = {
      ...current,
      ...settings,
      id: 'primary_analytics_settings',
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured) {
      const { error } = await supabase.from('analytics_settings').upsert(updated);
      if (error) {
        throw new Error(`Failed to update analytics settings in database: ${error.message}`);
      }
    }

    activeAnalyticsSettings = updated;
    try {
      localStorage.setItem(BACKUP_ANALYTICS_SETTINGS_KEY, JSON.stringify(updated));
    } catch {
      // Ignore
    }

    analyticsService.initialize(updated);
    analyticsListeners.forEach((fn) => fn(updated));

    await this.logAdminAction(
      'Updated Google Analytics 4 Configuration',
      'settings',
      'analytics_settings',
      `Measurement ID: ${updated.ga_measurement_id || 'Disabled'} | Enabled: ${updated.enabled}`
    );

    return updated;
  },

  subscribeToAnalyticsSettings(listener: AnalyticsListener): () => void {
    analyticsListeners.add(listener);
    return () => analyticsListeners.delete(listener);
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

  // ==============================================================================
  // GOOGLE ADSENSE SETTINGS (DATABASE SOURCE OF TRUTH)
  // ==============================================================================
  async getAdSenseSettings(): Promise<AdSenseSettings> {
    if (!isSupabaseConfigured) {
      try {
        const cached = localStorage.getItem(BACKUP_ADSENSE_SETTINGS_KEY);
        return cached ? JSON.parse(cached) : DEFAULT_ADSENSE_SETTINGS;
      } catch {
        return DEFAULT_ADSENSE_SETTINGS;
      }
    }

    try {
      const { data, error } = await supabase
        .from('adsense_settings')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data) {
        try {
          const cached = localStorage.getItem(BACKUP_ADSENSE_SETTINGS_KEY);
          return cached ? JSON.parse(cached) : DEFAULT_ADSENSE_SETTINGS;
        } catch {
          return DEFAULT_ADSENSE_SETTINGS;
        }
      }
      return data as AdSenseSettings;
    } catch {
      return DEFAULT_ADSENSE_SETTINGS;
    }
  },

  async updateAdSenseSettings(settings: Partial<AdSenseSettings>): Promise<AdSenseSettings> {
    const current = await this.getAdSenseSettings();
    const updated: AdSenseSettings = {
      ...current,
      ...settings,
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured) {
      const { error } = await supabase.from('adsense_settings').upsert({
        id: current.id || 'primary_adsense_settings',
        ...updated,
      });

      if (error) {
        throw new Error(`Failed to update AdSense settings in database: ${error.message}`);
      }
    }

    try {
      localStorage.setItem(BACKUP_ADSENSE_SETTINGS_KEY, JSON.stringify(updated));
    } catch {
      // Ignore
    }

    await this.logAdminAction(
      'Updated Google AdSense Configuration',
      'settings',
      'adsense_config',
      `Publisher ID: ${updated.publisher_id || 'None'}, Enabled: ${updated.enabled}`
    );

    return updated;
  },

  // ==============================================================================
  // ADMIN ACTIVITY LOGS (SUPABASE DATABASE)
  // ==============================================================================
  async getActivityLogs(limit = 50): Promise<AdminActivityLog[]> {
    if (!isSupabaseConfigured) {
      try {
        const raw = localStorage.getItem(BACKUP_ACTIVITY_LOGS_KEY);
        return raw ? JSON.parse(raw).slice(0, limit) : DEFAULT_LOGS;
      } catch {
        return DEFAULT_LOGS;
      }
    }

    try {
      const { data, error } = await supabase
        .from('admin_activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error || !data || data.length === 0) {
        try {
          const raw = localStorage.getItem(BACKUP_ACTIVITY_LOGS_KEY);
          return raw ? JSON.parse(raw).slice(0, limit) : DEFAULT_LOGS;
        } catch {
          return DEFAULT_LOGS;
        }
      }
      return data as AdminActivityLog[];
    } catch {
      return DEFAULT_LOGS;
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

    // Keep lightweight in-memory / local backup
    try {
      const raw = localStorage.getItem(BACKUP_ACTIVITY_LOGS_KEY);
      const list: AdminActivityLog[] = raw ? JSON.parse(raw) : DEFAULT_LOGS;
      const updated = [newLog, ...list].slice(0, 30);
      localStorage.setItem(BACKUP_ACTIVITY_LOGS_KEY, JSON.stringify(updated));
    } catch {
      // Ignore
    }
  },
};

export const globalSettingsService = settingsService;
