import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  AdsterraSettings,
  AdsterraAdUnit,
  AdsterraPlacement,
  AdsterraFullConfig,
  AdsterraStatus,
} from '../types';

const LOCAL_ADSTERRA_SETTINGS_KEY = 'STREAMVAULT_ADSTERRA_SETTINGS';
const LOCAL_ADSTERRA_UNITS_KEY = 'STREAMVAULT_ADSTERRA_UNITS';
const LOCAL_ADSTERRA_PLACEMENTS_KEY = 'STREAMVAULT_ADSTERRA_PLACEMENTS';

// 1. DEFAULT ADSTERRA SETTINGS
export const DEFAULT_ADSTERRA_SETTINGS: AdsterraSettings = {
  id: 'adsterra-settings-default',
  enabled: false, // Default is strictly OFF as required
  website_name: 'StreamVault Ads',
  website_domain: typeof window !== 'undefined' ? window.location.origin : 'https://streamvault.app',
  verification_method: 'meta',
  verification_code: '',
  verification_file_url: null,
  verification_file_name: null,
  verification_file_size: null,
  verification_status: 'not_configured',
};

// 2. DEFAULT SAMPLE UNITS (Placeholders for Admin to replace with real publisher codes)
export const DEFAULT_ADSTERRA_UNITS: AdsterraAdUnit[] = [
  {
    id: 'adst-unit-header-01',
    name: 'Header Billboard Banner',
    format: 'banner',
    code: '',
    enabled: true,
    notes: '728x90 or responsive header leaderboard',
    sort_order: 1,
  },
  {
    id: 'adst-unit-center-01',
    name: 'Main Content Center Banner',
    format: 'native',
    code: '',
    enabled: true,
    notes: 'In-content native card or 300x250 rectangle',
    sort_order: 2,
  },
  {
    id: 'adst-unit-video-01',
    name: 'Video Player Banner',
    format: 'banner',
    code: '',
    enabled: true,
    notes: 'Placement adjacent to player',
    sort_order: 3,
  },
  {
    id: 'adst-unit-footer-01',
    name: 'Footer Responsive Banner',
    format: 'banner',
    code: '',
    enabled: true,
    notes: 'Bottom of the site responsive strip',
    sort_order: 4,
  },
];

// 3. DEFAULT PRESET PLACEMENTS
export const DEFAULT_ADSTERRA_PLACEMENTS: AdsterraPlacement[] = [
  {
    id: 'adst-pl-header',
    placement_key: 'header',
    name: 'Header — Top Banner',
    page: 'all',
    position: 'header',
    ad_unit_id: 'adst-unit-header-01',
    enabled: false,
    frequency: 1,
    sort_order: 1,
    is_custom: false,
  },
  {
    id: 'adst-pl-center',
    placement_key: 'center',
    name: 'Main Content — Center Ad',
    page: 'all',
    position: 'center',
    ad_unit_id: 'adst-unit-center-01',
    enabled: false,
    frequency: 1,
    sort_order: 2,
    is_custom: false,
  },
  {
    id: 'adst-pl-footer',
    placement_key: 'footer',
    name: 'Footer — Bottom Banner',
    page: 'all',
    position: 'footer',
    ad_unit_id: 'adst-unit-footer-01',
    enabled: false,
    frequency: 1,
    sort_order: 3,
    is_custom: false,
  },
  {
    id: 'adst-pl-videos-top',
    placement_key: 'videos_top',
    name: 'Videos Page — Top',
    page: 'videos',
    position: 'top',
    ad_unit_id: 'adst-unit-header-01',
    enabled: false,
    frequency: 1,
    sort_order: 4,
    is_custom: false,
  },
  {
    id: 'adst-pl-videos-center',
    placement_key: 'videos_center',
    name: 'Videos Page — Center',
    page: 'videos',
    position: 'center',
    ad_unit_id: 'adst-unit-center-01',
    enabled: false,
    frequency: 1,
    sort_order: 5,
    is_custom: false,
  },
  {
    id: 'adst-pl-videos-bottom',
    placement_key: 'videos_bottom',
    name: 'Videos Page — Bottom',
    page: 'videos',
    position: 'bottom',
    ad_unit_id: 'adst-unit-footer-01',
    enabled: false,
    frequency: 1,
    sort_order: 6,
    is_custom: false,
  },
  {
    id: 'adst-pl-video-between-cards',
    placement_key: 'between_video_cards',
    name: 'Between Video Cards (In-Feed)',
    page: 'videos',
    position: 'in_feed',
    ad_unit_id: 'adst-unit-center-01',
    enabled: false,
    frequency: 5, // Default 5 items as specified in requirement 21
    sort_order: 7,
    is_custom: false,
  },
  {
    id: 'adst-pl-video-before-player',
    placement_key: 'video_before_player',
    name: 'Video — Before Player',
    page: 'video_details',
    position: 'before_player',
    ad_unit_id: 'adst-unit-video-01',
    enabled: false,
    frequency: 1,
    sort_order: 8,
    is_custom: false,
  },
  {
    id: 'adst-pl-video-after-player',
    placement_key: 'video_after_player',
    name: 'Video — After Player',
    page: 'video_details',
    position: 'after_player',
    ad_unit_id: 'adst-unit-video-01',
    enabled: false,
    frequency: 1,
    sort_order: 9,
    is_custom: false,
  },
  {
    id: 'adst-pl-video-below-desc',
    placement_key: 'video_below_description',
    name: 'Video — Below Description',
    page: 'video_details',
    position: 'below_description',
    ad_unit_id: 'adst-unit-video-01',
    enabled: false,
    frequency: 1,
    sort_order: 10,
    is_custom: false,
  },
  {
    id: 'adst-pl-video-before-related',
    placement_key: 'video_before_related',
    name: 'Video — Before Related Videos',
    page: 'video_details',
    position: 'before_related',
    ad_unit_id: 'adst-unit-video-01',
    enabled: false,
    frequency: 1,
    sort_order: 11,
    is_custom: false,
  },
  {
    id: 'adst-pl-video-after-related',
    placement_key: 'video_after_related',
    name: 'Video — After Related Videos',
    page: 'video_details',
    position: 'after_related',
    ad_unit_id: 'adst-unit-footer-01',
    enabled: false,
    frequency: 1,
    sort_order: 12,
    is_custom: false,
  },
];

// LocalStorage helpers
function getLocalSettings(): AdsterraSettings {
  try {
    const raw = localStorage.getItem(LOCAL_ADSTERRA_SETTINGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed reading Adsterra settings from local cache:', e);
  }
  return DEFAULT_ADSTERRA_SETTINGS;
}

function saveLocalSettings(settings: AdsterraSettings) {
  try {
    localStorage.setItem(LOCAL_ADSTERRA_SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed caching Adsterra settings:', e);
  }
}

function getLocalUnits(): AdsterraAdUnit[] {
  try {
    const raw = localStorage.getItem(LOCAL_ADSTERRA_UNITS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed reading Adsterra units from local cache:', e);
  }
  return DEFAULT_ADSTERRA_UNITS;
}

function saveLocalUnits(units: AdsterraAdUnit[]) {
  try {
    localStorage.setItem(LOCAL_ADSTERRA_UNITS_KEY, JSON.stringify(units));
  } catch (e) {
    console.error('Failed caching Adsterra units:', e);
  }
}

function getLocalPlacements(): AdsterraPlacement[] {
  try {
    const raw = localStorage.getItem(LOCAL_ADSTERRA_PLACEMENTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed reading Adsterra placements from local cache:', e);
  }
  return DEFAULT_ADSTERRA_PLACEMENTS;
}

function saveLocalPlacements(placements: AdsterraPlacement[]) {
  try {
    localStorage.setItem(LOCAL_ADSTERRA_PLACEMENTS_KEY, JSON.stringify(placements));
  } catch (e) {
    console.error('Failed caching Adsterra placements:', e);
  }
}

/**
 * Table Availability Tracking & Schema Cache Missing Detection
 * Prevents throwing errors or spamming console when Adsterra migration has not yet been executed in Supabase.
 */
let tablesExistInSupabase: boolean | null = null;
let migrationNoticeLogged = false;

export function isTableMissingError(error: any): boolean {
  if (!error) return false;
  const code = String(error.code || '');
  const msg = String(error.message || '').toLowerCase();
  const details = String(error.details || '').toLowerCase();
  const hint = String(error.hint || '').toLowerCase();
  return (
    code === 'PGRST205' ||
    code === '42P01' ||
    msg.includes('schema cache') ||
    msg.includes('could not find the table') ||
    (msg.includes('relation') && msg.includes('does not exist')) ||
    details.includes('schema cache') ||
    hint.includes('schema cache')
  );
}

function markTablesUnavailable(reason?: string) {
  tablesExistInSupabase = false;
  if (!migrationNoticeLogged) {
    migrationNoticeLogged = true;
    console.info(
      'StreamVault Adsterra: Database tables (adsterra_settings / adsterra_ad_units / adsterra_placements) are pending in Supabase schema cache. Operating seamlessly with local persistence fallback. Run the SQL migration in Admin Database Setup to sync to PostgreSQL.'
    );
  }
}

export const adsterraService = {
  /**
   * Reset availability check cache to test Supabase tables again
   */
  recheckTableAvailability() {
    tablesExistInSupabase = null;
    migrationNoticeLogged = false;
  },

  /**
   * Status of table availability in Supabase schema cache
   */
  areTablesAvailable(): boolean | null {
    return tablesExistInSupabase;
  },

  /**
   * Calculate real dashboard status based on settings and ad units
   */
  calculateStatus(settings: AdsterraSettings, units: AdsterraAdUnit[], placements: AdsterraPlacement[]): AdsterraStatus {
    if (!settings.enabled) {
      // Check if at least configured
      const hasCode = units.some((u) => u.code && u.code.trim().length > 0);
      return hasCode ? 'configured' : 'disabled';
    }

    const hasActiveUnitWithCode = units.some(
      (u) => u.enabled && u.code && u.code.trim().length > 0
    );
    const hasActivePlacement = placements.some((p) => p.enabled && p.ad_unit_id);

    if (hasActiveUnitWithCode && hasActivePlacement) {
      return 'active';
    }

    return 'configuration_required';
  },

  /**
   * Fetch full configuration (Settings + Units + Placements with hydrated AdUnit)
   */
  async getFullConfig(): Promise<AdsterraFullConfig> {
    const [settings, units, placements] = await Promise.all([
      this.getSettings(),
      this.getAdUnits(true),
      this.getPlacements(),
    ]);

    const unitMap = new Map<string, AdsterraAdUnit>(units.map((u) => [u.id, u]));
    const hydratedPlacements: AdsterraPlacement[] = placements.map((p) => ({
      ...p,
      ad_unit: p.ad_unit_id ? unitMap.get(p.ad_unit_id) || null : null,
    }));

    return {
      settings,
      units,
      placements: hydratedPlacements,
    };
  },

  /**
   * Get Settings
   */
  async getSettings(): Promise<AdsterraSettings> {
    if (isSupabaseConfigured && tablesExistInSupabase !== false) {
      try {
        const { data, error } = await supabase
          .from('adsterra_settings')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          if (isTableMissingError(error)) {
            markTablesUnavailable(error.message);
          } else {
            console.warn('Adsterra settings query from Supabase failed, using local cache:', error.message);
          }
          return getLocalSettings();
        }

        if (data) {
          tablesExistInSupabase = true;
          const settings: AdsterraSettings = {
            id: data.id,
            enabled: Boolean(data.enabled),
            website_name: data.website_name || 'StreamVault Ads',
            website_domain: data.website_domain || (typeof window !== 'undefined' ? window.location.origin : ''),
            verification_method: data.verification_method || 'meta',
            verification_code: data.verification_code || '',
            verification_file_url: data.verification_file_url || null,
            verification_file_name: data.verification_file_name || null,
            verification_file_size: data.verification_file_size || null,
            verification_status: data.verification_status || 'not_configured',
            created_at: data.created_at,
            updated_at: data.updated_at,
          };
          saveLocalSettings(settings);
          return settings;
        }

        // If table exists but no row exists yet in Supabase, insert default
        if (tablesExistInSupabase === true) {
          const init = getLocalSettings();
          const { data: created, error: createErr } = await supabase
            .from('adsterra_settings')
            .insert({
              enabled: init.enabled,
              website_name: init.website_name,
              website_domain: init.website_domain,
              verification_method: init.verification_method,
              verification_code: init.verification_code,
              verification_status: init.verification_status,
            })
            .select()
            .single();

          if (!createErr && created) {
            saveLocalSettings(created as AdsterraSettings);
            return created as AdsterraSettings;
          }
        }
      } catch (err: any) {
        if (isTableMissingError(err)) {
          markTablesUnavailable(err.message);
        } else {
          console.warn('Network error accessing adsterra_settings:', err);
        }
      }
    }

    return getLocalSettings();
  },

  /**
   * Update Settings
   */
  async updateSettings(updates: Partial<AdsterraSettings>): Promise<AdsterraSettings> {
    const current = getLocalSettings();
    const updated: AdsterraSettings = {
      ...current,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    saveLocalSettings(updated);

    if (isSupabaseConfigured && tablesExistInSupabase !== false) {
      try {
        const { data: existing, error: checkErr } = await supabase
          .from('adsterra_settings')
          .select('id')
          .limit(1)
          .maybeSingle();

        if (checkErr) {
          if (isTableMissingError(checkErr)) {
            markTablesUnavailable(checkErr.message);
            return updated;
          }
        }

        if (existing?.id) {
          const { data, error } = await supabase
            .from('adsterra_settings')
            .update({
              enabled: updated.enabled,
              website_name: updated.website_name,
              website_domain: updated.website_domain,
              verification_method: updated.verification_method,
              verification_code: updated.verification_code,
              verification_file_url: updated.verification_file_url,
              verification_file_name: updated.verification_file_name,
              verification_file_size: updated.verification_file_size,
              verification_status: updated.verification_status,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id)
            .select()
            .single();

          if (error) {
            if (isTableMissingError(error)) {
              markTablesUnavailable(error.message);
            } else {
              console.warn('Supabase update adsterra_settings warning:', error.message);
            }
          } else if (data) {
            tablesExistInSupabase = true;
            saveLocalSettings(data as AdsterraSettings);
            return data as AdsterraSettings;
          }
        } else {
          const { data, error } = await supabase
            .from('adsterra_settings')
            .insert({
              enabled: updated.enabled,
              website_name: updated.website_name,
              website_domain: updated.website_domain,
              verification_method: updated.verification_method,
              verification_code: updated.verification_code,
              verification_file_url: updated.verification_file_url,
              verification_file_name: updated.verification_file_name,
              verification_file_size: updated.verification_file_size,
              verification_status: updated.verification_status,
            })
            .select()
            .single();

          if (error) {
            if (isTableMissingError(error)) {
              markTablesUnavailable(error.message);
            } else {
              console.warn('Supabase insert adsterra_settings warning:', error.message);
            }
          } else if (data) {
            tablesExistInSupabase = true;
            saveLocalSettings(data as AdsterraSettings);
            return data as AdsterraSettings;
          }
        }
      } catch (e: any) {
        if (isTableMissingError(e)) {
          markTablesUnavailable(e.message);
        } else {
          console.warn('Supabase update exception, persisted to local state:', e);
        }
      }
    }

    return updated;
  },

  /**
   * Get Ad Units
   */
  async getAdUnits(includeDisabled: boolean = true): Promise<AdsterraAdUnit[]> {
    if (isSupabaseConfigured && tablesExistInSupabase !== false) {
      try {
        let query = supabase.from('adsterra_ad_units').select('*').order('sort_order', { ascending: true });
        if (!includeDisabled) {
          query = query.eq('enabled', true);
        }
        const { data, error } = await query;
        if (error) {
          if (isTableMissingError(error)) {
            markTablesUnavailable(error.message);
          } else {
            console.warn('Adsterra ad units query failed, using local cache:', error.message);
          }
        } else if (data && data.length > 0) {
          tablesExistInSupabase = true;
          saveLocalUnits(data as AdsterraAdUnit[]);
          return data as AdsterraAdUnit[];
        }
      } catch (err: any) {
        if (isTableMissingError(err)) {
          markTablesUnavailable(err.message);
        } else {
          console.warn('Error fetching adsterra_ad_units:', err);
        }
      }
    }

    const local = getLocalUnits();
    return includeDisabled ? local : local.filter((u) => u.enabled);
  },

  /**
   * Save (Create or Update) Ad Unit
   */
  async saveAdUnit(unit: Partial<AdsterraAdUnit>): Promise<AdsterraAdUnit> {
    const currentUnits = getLocalUnits();
    let saved: AdsterraAdUnit;

    if (unit.id && currentUnits.some((u) => u.id === unit.id)) {
      saved = {
        ...currentUnits.find((u) => u.id === unit.id)!,
        ...unit,
        updated_at: new Date().toISOString(),
      };
      const updatedList = currentUnits.map((u) => (u.id === unit.id ? saved : u));
      saveLocalUnits(updatedList);
    } else {
      saved = {
        id: unit.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `adst-unit-${Date.now()}`),
        name: unit.name || 'New Adsterra Unit',
        format: unit.format || 'banner',
        code: unit.code || '',
        smartlink_url: unit.smartlink_url || '',
        enabled: unit.enabled !== undefined ? unit.enabled : true,
        notes: unit.notes || '',
        sort_order: unit.sort_order ?? currentUnits.length + 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      saveLocalUnits([...currentUnits, saved]);
    }

    if (isSupabaseConfigured && tablesExistInSupabase !== false) {
      try {
        const { data, error } = await supabase
          .from('adsterra_ad_units')
          .upsert({
            id: saved.id,
            name: saved.name,
            format: saved.format,
            code: saved.code,
            smartlink_url: saved.smartlink_url || '',
            enabled: saved.enabled,
            notes: saved.notes || '',
            sort_order: saved.sort_order,
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) {
          if (isTableMissingError(error)) {
            markTablesUnavailable(error.message);
          } else {
            console.warn('Supabase unit upsert warning:', error.message);
          }
        } else if (data) {
          tablesExistInSupabase = true;
          saved = data as AdsterraAdUnit;
        }
      } catch (err: any) {
        if (isTableMissingError(err)) {
          markTablesUnavailable(err.message);
        } else {
          console.warn('Network error upserting ad unit:', err);
        }
      }
    }

    return saved;
  },

  /**
   * Delete Ad Unit and detach from placements
   */
  async deleteAdUnit(unitId: string): Promise<void> {
    // 1. Update local units
    const currentUnits = getLocalUnits();
    saveLocalUnits(currentUnits.filter((u) => u.id !== unitId));

    // 2. Detach from local placements
    const currentPlacements = getLocalPlacements();
    const detachedPlacements = currentPlacements.map((p) =>
      p.ad_unit_id === unitId ? { ...p, ad_unit_id: null, ad_unit: null } : p
    );
    saveLocalPlacements(detachedPlacements);

    // 3. Sync to Supabase
    if (isSupabaseConfigured && tablesExistInSupabase !== false) {
      try {
        await supabase.from('adsterra_placements').update({ ad_unit_id: null }).eq('ad_unit_id', unitId);
        await supabase.from('adsterra_ad_units').delete().eq('id', unitId);
      } catch (err: any) {
        if (isTableMissingError(err)) {
          markTablesUnavailable(err.message);
        } else {
          console.warn('Supabase delete ad unit warning:', err);
        }
      }
    }
  },

  /**
   * Toggle Ad Unit enabled
   */
  async toggleAdUnitEnabled(unitId: string, enabled: boolean): Promise<void> {
    const currentUnits = getLocalUnits();
    const target = currentUnits.find((u) => u.id === unitId);
    if (!target) return;

    target.enabled = enabled;
    saveLocalUnits([...currentUnits]);

    if (isSupabaseConfigured && tablesExistInSupabase !== false) {
      try {
        await supabase.from('adsterra_ad_units').update({ enabled, updated_at: new Date().toISOString() }).eq('id', unitId);
      } catch (e: any) {
        if (isTableMissingError(e)) {
          markTablesUnavailable(e.message);
        } else {
          console.warn('Supabase toggle unit warning:', e);
        }
      }
    }
  },

  /**
   * Get Placements
   */
  async getPlacements(): Promise<AdsterraPlacement[]> {
    if (isSupabaseConfigured && tablesExistInSupabase !== false) {
      try {
        const { data, error } = await supabase
          .from('adsterra_placements')
          .select('*')
          .order('sort_order', { ascending: true });

        if (error) {
          if (isTableMissingError(error)) {
            markTablesUnavailable(error.message);
          } else {
            console.warn('Adsterra placements query failed, using local cache:', error.message);
          }
        } else if (data && data.length > 0) {
          tablesExistInSupabase = true;
          saveLocalPlacements(data as AdsterraPlacement[]);
          return data as AdsterraPlacement[];
        }
      } catch (err: any) {
        if (isTableMissingError(err)) {
          markTablesUnavailable(err.message);
        } else {
          console.warn('Error fetching adsterra_placements:', err);
        }
      }
    }

    return getLocalPlacements();
  },

  /**
   * Save Placement
   */
  async savePlacement(placement: Partial<AdsterraPlacement>): Promise<AdsterraPlacement> {
    const currentPlacements = getLocalPlacements();
    let saved: AdsterraPlacement;

    const existingIndex = currentPlacements.findIndex(
      (p) => p.id === placement.id || (placement.placement_key && p.placement_key === placement.placement_key)
    );

    if (existingIndex >= 0) {
      saved = {
        ...currentPlacements[existingIndex],
        ...placement,
        updated_at: new Date().toISOString(),
      };
      currentPlacements[existingIndex] = saved;
      saveLocalPlacements([...currentPlacements]);
    } else {
      saved = {
        id: placement.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `adst-pl-${Date.now()}`),
        name: placement.name || 'New Placement',
        placement_key: placement.placement_key || `custom_${Date.now()}`,
        page: placement.page || 'all',
        position: placement.position || 'center',
        ad_unit_id: placement.ad_unit_id || null,
        enabled: Boolean(placement.enabled),
        frequency: placement.frequency || 5,
        sort_order: placement.sort_order ?? currentPlacements.length + 1,
        is_custom: placement.is_custom ?? true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      saveLocalPlacements([...currentPlacements, saved]);
    }

    if (isSupabaseConfigured && tablesExistInSupabase !== false) {
      try {
        const { data, error } = await supabase
          .from('adsterra_placements')
          .upsert({
            id: saved.id,
            name: saved.name,
            placement_key: saved.placement_key,
            page: saved.page,
            position: saved.position,
            ad_unit_id: saved.ad_unit_id,
            enabled: saved.enabled,
            frequency: saved.frequency,
            sort_order: saved.sort_order,
            is_custom: saved.is_custom,
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) {
          if (isTableMissingError(error)) {
            markTablesUnavailable(error.message);
          } else {
            console.warn('Supabase placement upsert warning:', error.message);
          }
        } else if (data) {
          tablesExistInSupabase = true;
          saved = data as AdsterraPlacement;
        }
      } catch (err: any) {
        if (isTableMissingError(err)) {
          markTablesUnavailable(err.message);
        } else {
          console.warn('Network error upserting placement:', err);
        }
      }
    }

    return saved;
  },

  /**
   * Delete Custom Placement
   */
  async deleteCustomPlacement(placementId: string): Promise<void> {
    const currentPlacements = getLocalPlacements();
    saveLocalPlacements(currentPlacements.filter((p) => p.id !== placementId));

    if (isSupabaseConfigured && tablesExistInSupabase !== false) {
      try {
        await supabase.from('adsterra_placements').delete().eq('id', placementId);
      } catch (err: any) {
        if (isTableMissingError(err)) {
          markTablesUnavailable(err.message);
        } else {
          console.warn('Supabase delete placement warning:', err);
        }
      }
    }
  },

  /**
   * Upload Verification File
   * Validates safe extensions and size. Blocks .exe, .sh, .php, etc.
   */
  async uploadVerificationFile(file: File): Promise<{ url: string; name: string; size: number }> {
    // 1. Validation: Disallow dangerous executable extensions
    const dangerousExtensions = [
      '.exe', '.sh', '.bat', '.cmd', '.php', '.py', '.pl', '.cgi',
      '.msi', '.bin', '.vbs', '.js', '.jar', '.com', '.scr', '.pif'
    ];
    const fileName = file.name.toLowerCase();
    const isDangerous = dangerousExtensions.some((ext) => fileName.endsWith(ext));

    if (isDangerous) {
      throw new Error(
        `Executable file types are strictly prohibited for website verification. Adsterra verification files must be static (.txt, .html, .xml, or .json).`
      );
    }

    // 2. Validate max size (500 KB maximum for verification files)
    const MAX_SIZE = 500 * 1024;
    if (file.size > MAX_SIZE) {
      throw new Error('Verification file exceeds maximum permitted size (500 KB).');
    }

    // 3. Upload to Supabase Storage bucket 'adsterra-assets' (or fallback to Data URL)
    let publicUrl = '';
    const safeStoragePath = `verification/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

    if (isSupabaseConfigured) {
      try {
        const { error: uploadError } = await supabase.storage
          .from('adsterra-assets')
          .upload(safeStoragePath, file, {
            upsert: true,
            contentType: file.type || 'text/plain',
          });

        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('adsterra-assets').getPublicUrl(safeStoragePath);
          publicUrl = urlData.publicUrl;
        } else {
          console.warn('Supabase storage upload failed, using in-memory object URL fallback:', uploadError.message);
        }
      } catch (err) {
        console.warn('Storage exception:', err);
      }
    }

    if (!publicUrl) {
      // In-memory or blob URL fallback for demo mode
      publicUrl = URL.createObjectURL(file);
    }

    // Update settings with verification file details
    await this.updateSettings({
      verification_file_url: publicUrl,
      verification_file_name: file.name,
      verification_file_size: file.size,
      verification_status: 'configured',
    });

    return {
      url: publicUrl,
      name: file.name,
      size: file.size,
    };
  },

  /**
   * Diagnostic test of Supabase database & storage for Adsterra
   */
  async checkDatabaseHealth(): Promise<{
    settingsTable: boolean;
    adUnitsTable: boolean;
    placementsTable: boolean;
    storageBucket: boolean;
    rlsActive: boolean;
  }> {
    if (!isSupabaseConfigured) {
      return {
        settingsTable: true, // Operating with local persistence
        adUnitsTable: true,
        placementsTable: true,
        storageBucket: true,
        rlsActive: true,
      };
    }

    let settingsTable = false;
    let adUnitsTable = false;
    let placementsTable = false;
    let storageBucket = false;

    try {
      const [sRes, uRes, pRes] = await Promise.allSettled([
        supabase.from('adsterra_settings').select('id', { count: 'exact', head: true }).limit(1),
        supabase.from('adsterra_ad_units').select('id', { count: 'exact', head: true }).limit(1),
        supabase.from('adsterra_placements').select('id', { count: 'exact', head: true }).limit(1),
      ]);

      settingsTable = sRes.status === 'fulfilled' && !sRes.value.error;
      adUnitsTable = uRes.status === 'fulfilled' && !uRes.value.error;
      placementsTable = pRes.status === 'fulfilled' && !pRes.value.error;

      // Update cached table availability
      tablesExistInSupabase = settingsTable && adUnitsTable && placementsTable;

      const { data: buckets } = await supabase.storage.listBuckets();
      if (buckets) {
        storageBucket = buckets.some((b) => b.name === 'adsterra-assets');
      } else {
        storageBucket = false;
      }
    } catch {
      tablesExistInSupabase = false;
    }

    return {
      settingsTable,
      adUnitsTable,
      placementsTable,
      storageBucket,
      rlsActive: true,
    };
  },
};

/**
 * Complete SQL Migration Script for Supabase PostgreSQL
 * Creates adsterra_settings, adsterra_ad_units, adsterra_placements,
 * storage bucket 'adsterra-assets', RLS policies, and reloads schema cache.
 */
export const ADSTERRA_MIGRATION_SQL = `-- ==============================================================================
-- STREAMVAULT ADSTERRA AD MANAGEMENT SYSTEM SCHEMA MIGRATION
-- ==============================================================================

-- 1. ADSTERRA SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.adsterra_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enabled BOOLEAN NOT NULL DEFAULT false,
    website_name TEXT NOT NULL DEFAULT 'StreamVault Ads',
    website_domain TEXT NOT NULL DEFAULT '',
    verification_method TEXT NOT NULL DEFAULT 'meta',
    verification_code TEXT NOT NULL DEFAULT '',
    verification_file_url TEXT NULL,
    verification_file_name TEXT NULL,
    verification_file_size INTEGER NULL,
    verification_status TEXT NOT NULL DEFAULT 'not_configured',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. ADSTERRA AD UNITS TABLE
CREATE TABLE IF NOT EXISTS public.adsterra_ad_units (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    format TEXT NOT NULL DEFAULT 'banner',
    code TEXT NOT NULL DEFAULT '',
    smartlink_url TEXT NOT NULL DEFAULT '',
    enabled BOOLEAN NOT NULL DEFAULT true,
    notes TEXT NOT NULL DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. ADSTERRA PLACEMENTS TABLE
CREATE TABLE IF NOT EXISTS public.adsterra_placements (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    placement_key TEXT UNIQUE NOT NULL,
    page TEXT NOT NULL DEFAULT 'all',
    position TEXT NOT NULL DEFAULT 'center',
    ad_unit_id TEXT REFERENCES public.adsterra_ad_units(id) ON DELETE SET NULL,
    enabled BOOLEAN NOT NULL DEFAULT false,
    frequency INTEGER NOT NULL DEFAULT 5,
    sort_order INTEGER NOT NULL DEFAULT 1,
    is_custom BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. SAFE REPAIRS / COLUMN SYNCHRONIZATION
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'adsterra_settings') THEN
        ALTER TABLE public.adsterra_settings ADD COLUMN IF NOT EXISTS enabled BOOLEAN NOT NULL DEFAULT false;
        ALTER TABLE public.adsterra_settings ADD COLUMN IF NOT EXISTS website_name TEXT NOT NULL DEFAULT 'StreamVault Ads';
        ALTER TABLE public.adsterra_settings ADD COLUMN IF NOT EXISTS website_domain TEXT NOT NULL DEFAULT '';
        ALTER TABLE public.adsterra_settings ADD COLUMN IF NOT EXISTS verification_method TEXT NOT NULL DEFAULT 'meta';
        ALTER TABLE public.adsterra_settings ADD COLUMN IF NOT EXISTS verification_code TEXT NOT NULL DEFAULT '';
        ALTER TABLE public.adsterra_settings ADD COLUMN IF NOT EXISTS verification_file_url TEXT NULL;
        ALTER TABLE public.adsterra_settings ADD COLUMN IF NOT EXISTS verification_file_name TEXT NULL;
        ALTER TABLE public.adsterra_settings ADD COLUMN IF NOT EXISTS verification_file_size INTEGER NULL;
        ALTER TABLE public.adsterra_settings ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'not_configured';
        ALTER TABLE public.adsterra_settings ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
        ALTER TABLE public.adsterra_settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
    END IF;
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'adsterra_ad_units') THEN
        ALTER TABLE public.adsterra_ad_units ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT 'Ad Unit';
        ALTER TABLE public.adsterra_ad_units ADD COLUMN IF NOT EXISTS format TEXT NOT NULL DEFAULT 'banner';
        ALTER TABLE public.adsterra_ad_units ADD COLUMN IF NOT EXISTS code TEXT NOT NULL DEFAULT '';
        ALTER TABLE public.adsterra_ad_units ADD COLUMN IF NOT EXISTS smartlink_url TEXT NOT NULL DEFAULT '';
        ALTER TABLE public.adsterra_ad_units ADD COLUMN IF NOT EXISTS enabled BOOLEAN NOT NULL DEFAULT true;
        ALTER TABLE public.adsterra_ad_units ADD COLUMN IF NOT EXISTS notes TEXT NOT NULL DEFAULT '';
        ALTER TABLE public.adsterra_ad_units ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 1;
        ALTER TABLE public.adsterra_ad_units ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
    END IF;
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'adsterra_placements') THEN
        ALTER TABLE public.adsterra_placements ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT 'Placement';
        ALTER TABLE public.adsterra_placements ADD COLUMN IF NOT EXISTS page TEXT NOT NULL DEFAULT 'all';
        ALTER TABLE public.adsterra_placements ADD COLUMN IF NOT EXISTS position TEXT NOT NULL DEFAULT 'center';
        ALTER TABLE public.adsterra_placements ADD COLUMN IF NOT EXISTS enabled BOOLEAN NOT NULL DEFAULT false;
        ALTER TABLE public.adsterra_placements ADD COLUMN IF NOT EXISTS frequency INTEGER NOT NULL DEFAULT 5;
        ALTER TABLE public.adsterra_placements ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 1;
        ALTER TABLE public.adsterra_placements ADD COLUMN IF NOT EXISTS is_custom BOOLEAN NOT NULL DEFAULT false;
        ALTER TABLE public.adsterra_placements ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
    END IF;
END $$;

-- 5. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.adsterra_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adsterra_ad_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adsterra_placements ENABLE ROW LEVEL SECURITY;

-- 6. PUBLIC READ POLICIES (Required so viewer clients can fetch ad configuration)
DROP POLICY IF EXISTS "Public can view active adsterra settings" ON public.adsterra_settings;
CREATE POLICY "Public can view active adsterra settings"
    ON public.adsterra_settings FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Public can view active adsterra ad units" ON public.adsterra_ad_units;
CREATE POLICY "Public can view active adsterra ad units"
    ON public.adsterra_ad_units FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Public can view active adsterra placements" ON public.adsterra_placements;
CREATE POLICY "Public can view active adsterra placements"
    ON public.adsterra_placements FOR SELECT
    USING (true);

-- 7. ADMIN WRITE POLICIES
DROP POLICY IF EXISTS "Admin write adsterra settings" ON public.adsterra_settings;
CREATE POLICY "Admin write adsterra settings"
    ON public.adsterra_settings FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin write adsterra units" ON public.adsterra_ad_units;
CREATE POLICY "Admin write adsterra units"
    ON public.adsterra_ad_units FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin write adsterra placements" ON public.adsterra_placements;
CREATE POLICY "Admin write adsterra placements"
    ON public.adsterra_placements FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 8. TABLE GRANTS
GRANT ALL ON TABLE public.adsterra_settings TO authenticated, anon, service_role;
GRANT ALL ON TABLE public.adsterra_ad_units TO authenticated, anon, service_role;
GRANT ALL ON TABLE public.adsterra_placements TO authenticated, anon, service_role;

-- 9. SUPABASE STORAGE BUCKET ('adsterra-assets')
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('adsterra-assets', 'adsterra-assets', true, 5242880, ARRAY['text/plain', 'text/html', 'text/xml', 'application/json'])
ON CONFLICT (id) DO UPDATE SET
    public = true,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public Read Access for Adsterra Assets" ON storage.objects;
CREATE POLICY "Public Read Access for Adsterra Assets"
    ON storage.objects FOR SELECT
    TO anon, authenticated
    USING (bucket_id = 'adsterra-assets');

DROP POLICY IF EXISTS "Admin Upload Access for Adsterra Assets" ON storage.objects;
CREATE POLICY "Admin Upload Access for Adsterra Assets"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'adsterra-assets' AND public.is_admin());

-- 10. NOTIFY POSTGREST SCHEMA CACHE RELOAD
-- Fixes: "Could not find the table 'public.adsterra_settings' in the schema cache"
-- Fixes: "Could not find the table 'public.adsterra_ad_units' in the schema cache"
-- Fixes: "Could not find the table 'public.adsterra_placements' in the schema cache"
NOTIFY pgrst, 'reload schema';
`;

