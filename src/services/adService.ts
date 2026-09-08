import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  AdSenseSettings,
  AdSenseUnit,
  AdPlacement,
  AdCodeSettings,
  AdSenseFullConfig,
  AdPlacementKey,
} from '../types';

const LOCAL_ADSENSE_SETTINGS_KEY = 'STREAMVAULT_ADSENSE_SETTINGS';
const LOCAL_ADSENSE_UNITS_KEY = 'STREAMVAULT_ADSENSE_UNITS';
const LOCAL_AD_PLACEMENTS_KEY = 'STREAMVAULT_AD_PLACEMENTS';
const LOCAL_AD_CODE_KEY = 'STREAMVAULT_AD_CODE_SETTINGS';

// 1. DEFAULT SETTINGS
const DEFAULT_ADSENSE_SETTINGS: AdSenseSettings = {
  publisher_id: '',
  ad_slot_id: '',
  enabled: false,
  placement_before_list: false,
  placement_between_cards: false,
  placement_details_page: false,
  placement_below_player: false,
};

// 2. DEFAULT UNITS
const DEFAULT_AD_UNITS: AdSenseUnit[] = [
  {
    id: 'b0000001-0000-0000-0000-000000000001',
    name: 'Header Billboard Leaderboard',
    ad_slot_id: '1001001001',
    format: 'horizontal',
    responsive: true,
    enabled: true,
    sort_order: 1,
  },
  {
    id: 'b0000001-0000-0000-0000-000000000002',
    name: 'Video In-Feed Native Card',
    ad_slot_id: '2002002002',
    format: 'auto',
    responsive: true,
    enabled: true,
    sort_order: 2,
  },
  {
    id: 'b0000001-0000-0000-0000-000000000003',
    name: 'Player Bottom Banner',
    ad_slot_id: '3003003003',
    format: 'horizontal',
    responsive: true,
    enabled: true,
    sort_order: 3,
  },
  {
    id: 'b0000001-0000-0000-0000-000000000004',
    name: 'Footer Responsive Banner',
    ad_slot_id: '4004004004',
    format: 'auto',
    responsive: true,
    enabled: true,
    sort_order: 4,
  },
];

// 3. DEFAULT 12 PLACEMENTS
const DEFAULT_AD_PLACEMENTS: AdPlacement[] = [
  {
    id: 'p-1',
    placement_key: 'header_top',
    name: 'Header — Top Banner',
    ad_unit_id: 'b0000001-0000-0000-0000-000000000001',
    enabled: false,
    sort_order: 1,
    frequency: 1,
  },
  {
    id: 'p-2',
    placement_key: 'header_bottom',
    name: 'Header — Below Navigation Bar',
    ad_unit_id: 'b0000001-0000-0000-0000-000000000001',
    enabled: false,
    sort_order: 2,
    frequency: 1,
  },
  {
    id: 'p-3',
    placement_key: 'video_list_top',
    name: 'Videos Page — Above Video List',
    ad_unit_id: 'b0000001-0000-0000-0000-000000000001',
    enabled: false,
    sort_order: 3,
    frequency: 1,
  },
  {
    id: 'p-4',
    placement_key: 'video_list_in_feed',
    name: 'Videos Page — Between Video Cards',
    ad_unit_id: 'b0000001-0000-0000-0000-000000000002',
    enabled: false,
    sort_order: 4,
    frequency: 5,
  },
  {
    id: 'p-5',
    placement_key: 'video_list_bottom',
    name: 'Videos Page — Below Video List',
    ad_unit_id: 'b0000001-0000-0000-0000-000000000004',
    enabled: false,
    sort_order: 5,
    frequency: 1,
  },
  {
    id: 'p-6',
    placement_key: 'video_details_above_player',
    name: 'Video Details — Above Player',
    ad_unit_id: 'b0000001-0000-0000-0000-000000000001',
    enabled: false,
    sort_order: 6,
    frequency: 1,
  },
  {
    id: 'p-7',
    placement_key: 'video_details_below_player',
    name: 'Video Details — Below Player',
    ad_unit_id: 'b0000001-0000-0000-0000-000000000003',
    enabled: false,
    sort_order: 7,
    frequency: 1,
  },
  {
    id: 'p-8',
    placement_key: 'video_details_below_description',
    name: 'Video Details — Below Description',
    ad_unit_id: 'b0000001-0000-0000-0000-000000000003',
    enabled: false,
    sort_order: 8,
    frequency: 1,
  },
  {
    id: 'p-9',
    placement_key: 'video_details_below_controls',
    name: 'Video Details — Below Player Controls',
    ad_unit_id: 'b0000001-0000-0000-0000-000000000003',
    enabled: false,
    sort_order: 9,
    frequency: 1,
  },
  {
    id: 'p-10',
    placement_key: 'sidebar',
    name: 'Sidebar / Drawer Placement',
    ad_unit_id: 'b0000001-0000-0000-0000-000000000002',
    enabled: false,
    sort_order: 10,
    frequency: 1,
  },
  {
    id: 'p-11',
    placement_key: 'footer_top',
    name: 'Footer — Before Footer Area',
    ad_unit_id: 'b0000001-0000-0000-0000-000000000004',
    enabled: false,
    sort_order: 11,
    frequency: 1,
  },
  {
    id: 'p-12',
    placement_key: 'footer_bottom',
    name: 'Footer — Bottom Section',
    ad_unit_id: 'b0000001-0000-0000-0000-000000000004',
    enabled: false,
    sort_order: 12,
    frequency: 1,
  },
];

// 4. DEFAULT CODE SETTINGS
const DEFAULT_AD_CODE: AdCodeSettings = {
  name: 'Global Header / Custom Ad Snippet',
  code_type: 'html',
  code_content: '',
  ad_file_url: null,
  ad_file_name: null,
  ad_file_size: null,
  enabled: false,
};

function getLocalUnits(): AdSenseUnit[] {
  const cached = localStorage.getItem(LOCAL_ADSENSE_UNITS_KEY);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      return DEFAULT_AD_UNITS;
    }
  }
  localStorage.setItem(LOCAL_ADSENSE_UNITS_KEY, JSON.stringify(DEFAULT_AD_UNITS));
  return DEFAULT_AD_UNITS;
}

function getLocalPlacements(): AdPlacement[] {
  const cached = localStorage.getItem(LOCAL_AD_PLACEMENTS_KEY);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      return DEFAULT_AD_PLACEMENTS;
    }
  }
  localStorage.setItem(LOCAL_AD_PLACEMENTS_KEY, JSON.stringify(DEFAULT_AD_PLACEMENTS));
  return DEFAULT_AD_PLACEMENTS;
}

function getLocalCode(): AdCodeSettings {
  const cached = localStorage.getItem(LOCAL_AD_CODE_KEY);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      return DEFAULT_AD_CODE;
    }
  }
  return DEFAULT_AD_CODE;
}

export const adService = {
  /**
   * Get full ad configuration (Settings + Units + Placements + Custom Code)
   */
  async getAdSenseFullConfig(): Promise<AdSenseFullConfig> {
    const [settings, units, placements, custom_code] = await Promise.all([
      this.getAdSenseSettings(),
      this.getAdUnits(true),
      this.getPlacements(),
      this.getCustomAdCode(),
    ]);

    // Attach ad_unit objects to placements
    const unitsMap = new Map(units.map((u) => [u.id, u]));
    const hydratedPlacements = placements.map((p) => ({
      ...p,
      ad_unit: p.ad_unit_id ? unitsMap.get(p.ad_unit_id) || null : null,
    }));

    return {
      settings,
      units,
      placements: hydratedPlacements,
      custom_code,
    };
  },

  /**
   * Get AdSense core settings
   */
  async getAdSenseSettings(): Promise<AdSenseSettings> {
    const fallback = (): AdSenseSettings => {
      const cached = localStorage.getItem(LOCAL_ADSENSE_SETTINGS_KEY);
      if (cached) {
        try {
          return { ...DEFAULT_ADSENSE_SETTINGS, ...JSON.parse(cached) };
        } catch {
          return DEFAULT_ADSENSE_SETTINGS;
        }
      }
      return DEFAULT_ADSENSE_SETTINGS;
    };

    if (!isSupabaseConfigured) {
      return fallback();
    }

    try {
      const { data, error } = await supabase
        .from('adsense_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error || !data) {
        return fallback();
      }
      return { ...DEFAULT_ADSENSE_SETTINGS, ...data };
    } catch {
      return fallback();
    }
  },

  /**
   * Update AdSense settings
   */
  async updateAdSenseSettings(settings: Partial<AdSenseSettings>): Promise<AdSenseSettings> {
    const current = await this.getAdSenseSettings();
    const updated: AdSenseSettings = {
      ...current,
      ...settings,
      updated_at: new Date().toISOString(),
    };
    localStorage.setItem(LOCAL_ADSENSE_SETTINGS_KEY, JSON.stringify(updated));

    if (isSupabaseConfigured) {
      try {
        await supabase.from('adsense_settings').upsert({
          id: current.id || 'd0000001-0000-0000-0000-000000000001',
          publisher_id: updated.publisher_id,
          ad_slot_id: updated.ad_slot_id,
          enabled: updated.enabled,
          updated_at: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Supabase updateAdSenseSettings fallback:', err);
      }
    }

    return updated;
  },

  /**
   * Get all Ad Units
   */
  async getAdUnits(includeDisabled = true): Promise<AdSenseUnit[]> {
    if (!isSupabaseConfigured) {
      const all = getLocalUnits();
      return includeDisabled ? all : all.filter((u) => u.enabled);
    }

    try {
      let query = supabase.from('adsense_units').select('*').order('sort_order', { ascending: true });
      if (!includeDisabled) {
        query = query.eq('enabled', true);
      }
      const { data, error } = await query;
      if (error || !data || data.length === 0) {
        const local = getLocalUnits();
        return includeDisabled ? local : local.filter((u) => u.enabled);
      }
      localStorage.setItem(LOCAL_ADSENSE_UNITS_KEY, JSON.stringify(data));
      return data;
    } catch {
      const local = getLocalUnits();
      return includeDisabled ? local : local.filter((u) => u.enabled);
    }
  },

  /**
   * Create Ad Unit
   */
  async createAdUnit(payload: Partial<AdSenseUnit>): Promise<AdSenseUnit> {
    const newUnit: AdSenseUnit = {
      id: crypto.randomUUID ? crypto.randomUUID() : `unit-${Date.now()}`,
      name: payload.name?.trim() || 'New Ad Unit',
      ad_slot_id: payload.ad_slot_id?.trim() || '',
      format: payload.format || 'auto',
      responsive: payload.responsive !== undefined ? payload.responsive : true,
      enabled: payload.enabled !== undefined ? payload.enabled : true,
      sort_order: payload.sort_order || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('adsense_units')
          .insert({
            name: newUnit.name,
            ad_slot_id: newUnit.ad_slot_id,
            format: newUnit.format,
            responsive: newUnit.responsive,
            enabled: newUnit.enabled,
            sort_order: newUnit.sort_order,
          })
          .select()
          .single();

        if (error) throw error;
        if (data) newUnit.id = data.id;
      } catch (err) {
        console.warn('Supabase createAdUnit error:', err);
      }
    }

    const current = getLocalUnits();
    const updated = [...current, newUnit];
    localStorage.setItem(LOCAL_ADSENSE_UNITS_KEY, JSON.stringify(updated));
    return newUnit;
  },

  /**
   * Update Ad Unit
   */
  async updateAdUnit(id: string, payload: Partial<AdSenseUnit>): Promise<AdSenseUnit> {
    const current = getLocalUnits();
    const index = current.findIndex((u) => u.id === id);
    let updatedUnit = index !== -1
      ? { ...current[index], ...payload, updated_at: new Date().toISOString() }
      : ({ id, ...payload } as AdSenseUnit);

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('adsense_units')
          .update({
            ...payload,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        if (data) updatedUnit = data;
      } catch (err) {
        console.warn('Supabase updateAdUnit error:', err);
      }
    }

    if (index !== -1) {
      current[index] = updatedUnit;
      localStorage.setItem(LOCAL_ADSENSE_UNITS_KEY, JSON.stringify(current));
    }

    return updatedUnit;
  },

  /**
   * Delete Ad Unit
   */
  async deleteAdUnit(id: string): Promise<boolean> {
    if (isSupabaseConfigured) {
      try {
        await supabase.from('adsense_units').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase deleteAdUnit error:', err);
      }
    }

    const current = getLocalUnits();
    const filtered = current.filter((u) => u.id !== id);
    localStorage.setItem(LOCAL_ADSENSE_UNITS_KEY, JSON.stringify(filtered));

    // Clear referenced unit from placements
    const placements = getLocalPlacements();
    const updatedPlacements = placements.map((p) => (p.ad_unit_id === id ? { ...p, ad_unit_id: null } : p));
    localStorage.setItem(LOCAL_AD_PLACEMENTS_KEY, JSON.stringify(updatedPlacements));

    return true;
  },

  /**
   * Get all 12 Ad Placements
   */
  async getPlacements(): Promise<AdPlacement[]> {
    if (!isSupabaseConfigured) {
      return getLocalPlacements();
    }

    try {
      const { data, error } = await supabase
        .from('ad_placements')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error || !data || data.length === 0) {
        return getLocalPlacements();
      }

      localStorage.setItem(LOCAL_AD_PLACEMENTS_KEY, JSON.stringify(data));
      return data;
    } catch {
      return getLocalPlacements();
    }
  },

  /**
   * Update a specific placement by placement_key
   */
  async updatePlacement(placementKey: AdPlacementKey, payload: Partial<AdPlacement>): Promise<AdPlacement> {
    const current = getLocalPlacements();
    const index = current.findIndex((p) => p.placement_key === placementKey);

    let updated = index !== -1
      ? { ...current[index], ...payload, updated_at: new Date().toISOString() }
      : ({ placement_key: placementKey, ...payload } as AdPlacement);

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('ad_placements')
          .update({
            ...payload,
            updated_at: new Date().toISOString(),
          })
          .eq('placement_key', placementKey)
          .select()
          .single();

        if (error) throw error;
        if (data) updated = data;
      } catch (err) {
        console.warn('Supabase updatePlacement error:', err);
      }
    }

    if (index !== -1) {
      current[index] = updated;
      localStorage.setItem(LOCAL_AD_PLACEMENTS_KEY, JSON.stringify(current));
    }

    return updated;
  },

  /**
   * Batch update all placements
   */
  async saveAllPlacements(placements: AdPlacement[]): Promise<boolean> {
    localStorage.setItem(LOCAL_AD_PLACEMENTS_KEY, JSON.stringify(placements));

    if (isSupabaseConfigured) {
      try {
        for (const p of placements) {
          await supabase
            .from('ad_placements')
            .upsert({
              id: p.id,
              placement_key: p.placement_key,
              name: p.name,
              ad_unit_id: p.ad_unit_id,
              enabled: p.enabled,
              sort_order: p.sort_order,
              frequency: p.frequency || 5,
              updated_at: new Date().toISOString(),
            });
        }
      } catch (err) {
        console.warn('Supabase saveAllPlacements error:', err);
      }
    }

    return true;
  },

  /**
   * Get Custom Ad Code Settings
   */
  async getCustomAdCode(): Promise<AdCodeSettings> {
    const fallback = (): AdCodeSettings => {
      const cached = localStorage.getItem(LOCAL_AD_CODE_KEY);
      if (cached) {
        try {
          return { ...DEFAULT_AD_CODE, ...JSON.parse(cached) };
        } catch {
          return DEFAULT_AD_CODE;
        }
      }
      return DEFAULT_AD_CODE;
    };

    if (!isSupabaseConfigured) {
      return fallback();
    }

    try {
      const { data, error } = await supabase
        .from('ad_code_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error || !data) {
        return fallback();
      }
      return { ...DEFAULT_AD_CODE, ...data };
    } catch {
      return fallback();
    }
  },

  /**
   * Update Custom Ad Code
   */
  async updateCustomAdCode(payload: Partial<AdCodeSettings>): Promise<AdCodeSettings> {
    const current = await this.getCustomAdCode();
    const updated: AdCodeSettings = {
      ...current,
      ...payload,
      updated_at: new Date().toISOString(),
    };
    localStorage.setItem(LOCAL_AD_CODE_KEY, JSON.stringify(updated));

    if (isSupabaseConfigured) {
      try {
        await supabase.from('ad_code_settings').upsert({
          id: current.id || 'c0000001-0000-0000-0000-000000000001',
          name: updated.name || 'Global Custom Ad Code',
          code_type: updated.code_type || 'html',
          code_content: updated.code_content || '',
          ad_file_url: updated.ad_file_url,
          ad_file_name: updated.ad_file_name,
          ad_file_size: updated.ad_file_size,
          enabled: updated.enabled,
          updated_at: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Supabase updateCustomAdCode fallback:', err);
      }
    }

    return updated;
  },

  /**
   * Upload an ad configuration text/html file to Supabase Storage (or local storage fallback)
   */
  async uploadAdFile(file: File): Promise<{ url: string; fileName: string; fileSize: number }> {
    const allowedExtensions = ['.txt', '.html', '.json'];
    const lowerName = file.name.toLowerCase();
    const isValidExt = allowedExtensions.some((ext) => lowerName.endsWith(ext));

    if (!isValidExt) {
      throw new Error('Only text and code verification files (.txt, .html, .json) are supported. Executable files are strictly prohibited.');
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new Error('File size exceeds the 5MB maximum limit.');
    }

    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `ad_configs/${timestamp}_${sanitizedName}`;

    let publicUrl = '';

    if (isSupabaseConfigured) {
      try {
        const { error: uploadError } = await supabase.storage
          .from('ad-assets')
          .upload(storagePath, file, {
            upsert: true,
            contentType: file.type || 'text/plain',
          });

        if (uploadError) {
          console.warn('Supabase ad file upload failed, fallback to local URL:', uploadError);
          publicUrl = URL.createObjectURL(file);
        } else {
          const { data: urlData } = supabase.storage
            .from('ad-assets')
            .getPublicUrl(storagePath);
          publicUrl = urlData.publicUrl;
        }
      } catch (err) {
        console.warn('Supabase storage error:', err);
        publicUrl = URL.createObjectURL(file);
      }
    } else {
      publicUrl = URL.createObjectURL(file);
    }

    // Update AdCodeSettings
    await this.updateCustomAdCode({
      ad_file_url: publicUrl,
      ad_file_name: file.name,
      ad_file_size: file.size,
    });

    return {
      url: publicUrl,
      fileName: file.name,
      fileSize: file.size,
    };
  },

  /**
   * Delete uploaded ad file
   */
  async deleteAdFile(): Promise<boolean> {
    const current = await this.getCustomAdCode();
    await this.updateCustomAdCode({
      ad_file_url: null,
      ad_file_name: null,
      ad_file_size: null,
    });
    return true;
  },
};
