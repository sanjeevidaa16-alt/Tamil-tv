import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  VideoFilter,
  VideoFilterOption,
  CreateFilterPayload,
  UpdateFilterPayload,
  CreateFilterOptionPayload,
  UpdateFilterOptionPayload,
} from '../types';

const LOCAL_FILTERS_KEY = 'STREAMVAULT_VIDEO_FILTERS';

// Default initial filters to seed or use in fallback
const DEFAULT_INITIAL_FILTERS: VideoFilter[] = [
  {
    id: 'a0000001-0000-0000-0000-000000000001',
    name: 'Content Category',
    slug: 'category',
    description: 'Filter media by production category or genre',
    filter_type: 'single',
    enabled: true,
    sort_order: 1,
    options: [
      { id: 'opt-cat-1', filter_id: 'a0000001-0000-0000-0000-000000000001', label: 'Cinema & Features', value: 'cinema-features', enabled: true, sort_order: 1 },
      { id: 'opt-cat-2', filter_id: 'a0000001-0000-0000-0000-000000000001', label: 'Documentaries', value: 'documentaries', enabled: true, sort_order: 2 },
      { id: 'opt-cat-3', filter_id: 'a0000001-0000-0000-0000-000000000001', label: 'Sci-Fi & Future', value: 'sci-fi-future', enabled: true, sort_order: 3 },
      { id: 'opt-cat-4', filter_id: 'a0000001-0000-0000-0000-000000000001', label: 'Tech & Engineering', value: 'tech-engineering', enabled: true, sort_order: 4 },
      { id: 'opt-cat-5', filter_id: 'a0000001-0000-0000-0000-000000000001', label: 'Nature & Wilderness', value: 'nature-wilderness', enabled: true, sort_order: 5 },
      { id: 'opt-cat-6', filter_id: 'a0000001-0000-0000-0000-000000000001', label: 'Short Films', value: 'short-films', enabled: true, sort_order: 6 },
    ],
  },
  {
    id: 'a0000001-0000-0000-0000-000000000002',
    name: 'Audio Language',
    slug: 'language',
    description: 'Filter videos by audio spoken language',
    filter_type: 'single',
    enabled: true,
    sort_order: 2,
    options: [
      { id: 'opt-lang-1', filter_id: 'a0000001-0000-0000-0000-000000000002', label: 'English', value: 'english', enabled: true, sort_order: 1 },
      { id: 'opt-lang-2', filter_id: 'a0000001-0000-0000-0000-000000000002', label: 'Tamil', value: 'tamil', enabled: true, sort_order: 2 },
      { id: 'opt-lang-3', filter_id: 'a0000001-0000-0000-0000-000000000002', label: 'Hindi', value: 'hindi', enabled: true, sort_order: 3 },
      { id: 'opt-lang-4', filter_id: 'a0000001-0000-0000-0000-000000000002', label: 'Malayalam', value: 'malayalam', enabled: true, sort_order: 4 },
      { id: 'opt-lang-5', filter_id: 'a0000001-0000-0000-0000-000000000002', label: 'Spanish', value: 'spanish', enabled: true, sort_order: 5 },
    ],
  },
  {
    id: 'a0000001-0000-0000-0000-000000000003',
    name: 'Stream Quality',
    slug: 'quality',
    description: 'Filter media by resolution and stream fidelity',
    filter_type: 'single',
    enabled: true,
    sort_order: 3,
    options: [
      { id: 'opt-qual-1', filter_id: 'a0000001-0000-0000-0000-000000000003', label: '4K Ultra HD', value: '4k', enabled: true, sort_order: 1 },
      { id: 'opt-qual-2', filter_id: 'a0000001-0000-0000-0000-000000000003', label: '1080p Full HD', value: '1080p', enabled: true, sort_order: 2 },
      { id: 'opt-qual-3', filter_id: 'a0000001-0000-0000-0000-000000000003', label: '720p HD', value: '720p', enabled: true, sort_order: 3 },
    ],
  },
  {
    id: 'a0000001-0000-0000-0000-000000000004',
    name: 'Release Era',
    slug: 'era',
    description: 'Filter by chronological release timeline',
    filter_type: 'single',
    enabled: true,
    sort_order: 4,
    options: [
      { id: 'opt-era-1', filter_id: 'a0000001-0000-0000-0000-000000000004', label: '2026+', value: '2026', enabled: true, sort_order: 1 },
      { id: 'opt-era-2', filter_id: 'a0000001-0000-0000-0000-000000000004', label: '2020s', value: '2020s', enabled: true, sort_order: 2 },
      { id: 'opt-era-3', filter_id: 'a0000001-0000-0000-0000-000000000004', label: '2010s', value: '2010s', enabled: true, sort_order: 3 },
      { id: 'opt-era-4', filter_id: 'a0000001-0000-0000-0000-000000000004', label: 'Classic Era', value: 'classic', enabled: true, sort_order: 4 },
    ],
  },
];

function getLocalFilters(): VideoFilter[] {
  const cached = localStorage.getItem(LOCAL_FILTERS_KEY);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      return DEFAULT_INITIAL_FILTERS;
    }
  }
  localStorage.setItem(LOCAL_FILTERS_KEY, JSON.stringify(DEFAULT_INITIAL_FILTERS));
  return DEFAULT_INITIAL_FILTERS;
}

function saveLocalFilters(filters: VideoFilter[]): void {
  localStorage.setItem(LOCAL_FILTERS_KEY, JSON.stringify(filters));
}

export const filterService = {
  /**
   * Fetch all filters with their options.
   * If includeDisabled is false, only returns enabled filters and options.
   */
  async getFilters(includeDisabled = true): Promise<VideoFilter[]> {
    if (!isSupabaseConfigured) {
      const all = getLocalFilters();
      return this.filterByEnabled(all, includeDisabled);
    }

    try {
      let query = supabase
        .from('video_filters')
        .select(`
          id,
          name,
          slug,
          description,
          filter_type,
          enabled,
          sort_order,
          created_at,
          updated_at,
          video_filter_options (
            id,
            filter_id,
            label,
            value,
            enabled,
            sort_order,
            created_at,
            updated_at
          )
        `)
        .order('sort_order', { ascending: true });

      if (!includeDisabled) {
        query = query.eq('enabled', true);
      }

      const { data, error } = await query;

      if (error || !data || data.length === 0) {
        // Fallback to local storage if table doesn't exist yet
        const local = getLocalFilters();
        return this.filterByEnabled(local, includeDisabled);
      }

      const formatted: VideoFilter[] = data.map((item: any) => {
        let opts: VideoFilterOption[] = item.video_filter_options || [];
        if (!includeDisabled) {
          opts = opts.filter((o) => o.enabled);
        }
        opts.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

        return {
          id: item.id,
          name: item.name,
          slug: item.slug,
          description: item.description,
          filter_type: item.filter_type || 'single',
          enabled: item.enabled,
          sort_order: item.sort_order || 0,
          options: opts,
          created_at: item.created_at,
          updated_at: item.updated_at,
        };
      });

      // Save a local cache
      saveLocalFilters(formatted);
      return formatted;
    } catch (err) {
      console.warn('FilterService.getFilters falling back to local store:', err);
      const local = getLocalFilters();
      return this.filterByEnabled(local, includeDisabled);
    }
  },

  filterByEnabled(filters: VideoFilter[], includeDisabled: boolean): VideoFilter[] {
    if (includeDisabled) return filters;
    return filters
      .filter((f) => f.enabled)
      .map((f) => ({
        ...f,
        options: (f.options || []).filter((o) => o.enabled).sort((a, b) => a.sort_order - b.sort_order),
      }))
      .sort((a, b) => a.sort_order - b.sort_order);
  },

  /**
   * Create a new filter group
   */
  async createFilter(payload: CreateFilterPayload): Promise<VideoFilter> {
    const slug = (
      payload.slug?.trim() ||
      payload.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    ) || `filter-${Date.now()}`;

    const newFilterObj: VideoFilter = {
      id: crypto.randomUUID ? crypto.randomUUID() : `filter-${Date.now()}`,
      name: payload.name.trim(),
      slug,
      description: payload.description?.trim() || '',
      filter_type: payload.filter_type || 'single',
      enabled: payload.enabled !== undefined ? payload.enabled : true,
      sort_order: payload.sort_order || 0,
      options: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('video_filters')
          .insert({
            name: newFilterObj.name,
            slug: newFilterObj.slug,
            description: newFilterObj.description,
            filter_type: newFilterObj.filter_type,
            enabled: newFilterObj.enabled,
            sort_order: newFilterObj.sort_order,
          })
          .select()
          .single();

        if (error) {
          throw error;
        }

        newFilterObj.id = data.id;

        // If options provided
        if (payload.options && payload.options.length > 0) {
          const insertOpts = payload.options.map((opt, idx) => ({
            filter_id: data.id,
            label: opt.label.trim(),
            value: (opt.value || opt.label).toLowerCase().trim(),
            enabled: opt.enabled !== undefined ? opt.enabled : true,
            sort_order: opt.sort_order ?? idx + 1,
          }));

          const { data: optData } = await supabase
            .from('video_filter_options')
            .insert(insertOpts)
            .select();

          if (optData) {
            newFilterObj.options = optData;
          }
        }
      } catch (err: any) {
        console.warn('Supabase createFilter fallback to local:', err);
      }
    }

    // Update local cache
    const current = getLocalFilters();
    const updated = [...current, newFilterObj];
    saveLocalFilters(updated);

    return newFilterObj;
  },

  /**
   * Update filter group heading, description, type, order, or enabled state
   */
  async updateFilter(id: string, payload: UpdateFilterPayload): Promise<VideoFilter> {
    const current = getLocalFilters();
    const index = current.findIndex((f) => f.id === id);

    let updatedFilter: VideoFilter = index !== -1
      ? { ...current[index], ...payload, updated_at: new Date().toISOString() }
      : ({ id, ...payload } as VideoFilter);

    if (isSupabaseConfigured) {
      try {
        const updateData: any = { updated_at: new Date().toISOString() };
        if (payload.name !== undefined) updateData.name = payload.name.trim();
        if (payload.slug !== undefined) updateData.slug = payload.slug.trim();
        if (payload.description !== undefined) updateData.description = payload.description.trim();
        if (payload.filter_type !== undefined) updateData.filter_type = payload.filter_type;
        if (payload.enabled !== undefined) updateData.enabled = payload.enabled;
        if (payload.sort_order !== undefined) updateData.sort_order = payload.sort_order;

        const { data, error } = await supabase
          .from('video_filters')
          .update(updateData)
          .eq('id', id)
          .select()
          .single();

        if (error) {
          throw error;
        }

        if (data) {
          updatedFilter = {
            ...updatedFilter,
            name: data.name,
            slug: data.slug,
            description: data.description,
            filter_type: data.filter_type,
            enabled: data.enabled,
            sort_order: data.sort_order,
          };
        }
      } catch (err) {
        console.warn('Supabase updateFilter fallback to local:', err);
      }
    }

    if (index !== -1) {
      current[index] = updatedFilter;
      saveLocalFilters(current);
    }

    return updatedFilter;
  },

  /**
   * Delete a filter group (cascade deletes options, but NOT videos)
   */
  async deleteFilter(id: string): Promise<boolean> {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('video_filters').delete().eq('id', id);
        if (error) throw error;
      } catch (err) {
        console.warn('Supabase deleteFilter error:', err);
      }
    }

    const current = getLocalFilters();
    const filtered = current.filter((f) => f.id !== id);
    saveLocalFilters(filtered);
    return true;
  },

  /**
   * Reorder filter groups
   */
  async reorderFilters(orderedIds: string[]): Promise<boolean> {
    const current = getLocalFilters();
    const updated = orderedIds.map((id, index) => {
      const match = current.find((f) => f.id === id);
      if (match) {
        return { ...match, sort_order: index + 1 };
      }
      return null;
    }).filter(Boolean) as VideoFilter[];

    saveLocalFilters(updated);

    if (isSupabaseConfigured) {
      try {
        for (let i = 0; i < orderedIds.length; i++) {
          await supabase
            .from('video_filters')
            .update({ sort_order: i + 1, updated_at: new Date().toISOString() })
            .eq('id', orderedIds[i]);
        }
      } catch (err) {
        console.warn('Supabase reorderFilters error:', err);
      }
    }

    return true;
  },

  /**
   * Create an option under a filter group
   */
  async createFilterOption(payload: CreateFilterOptionPayload): Promise<VideoFilterOption> {
    const newOption: VideoFilterOption = {
      id: crypto.randomUUID ? crypto.randomUUID() : `opt-${Date.now()}`,
      filter_id: payload.filter_id,
      label: payload.label.trim(),
      value: payload.value.trim().toLowerCase(),
      enabled: payload.enabled !== undefined ? payload.enabled : true,
      sort_order: payload.sort_order || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('video_filter_options')
          .insert({
            filter_id: payload.filter_id,
            label: newOption.label,
            value: newOption.value,
            enabled: newOption.enabled,
            sort_order: newOption.sort_order,
          })
          .select()
          .single();

        if (error) throw error;
        if (data) newOption.id = data.id;
      } catch (err) {
        console.warn('Supabase createFilterOption error:', err);
      }
    }

    // Update local cache
    const current = getLocalFilters();
    const parent = current.find((f) => f.id === payload.filter_id);
    if (parent) {
      parent.options = [...(parent.options || []), newOption];
      saveLocalFilters(current);
    }

    return newOption;
  },

  /**
   * Update a filter option
   */
  async updateFilterOption(optionId: string, payload: UpdateFilterOptionPayload): Promise<VideoFilterOption> {
    let updatedOption: VideoFilterOption | null = null;
    const current = getLocalFilters();

    for (const filter of current) {
      const optIndex = (filter.options || []).findIndex((o) => o.id === optionId);
      if (optIndex !== -1) {
        filter.options![optIndex] = {
          ...filter.options![optIndex],
          ...payload,
          updated_at: new Date().toISOString(),
        };
        updatedOption = filter.options![optIndex];
        break;
      }
    }

    if (updatedOption) {
      saveLocalFilters(current);
    }

    if (isSupabaseConfigured) {
      try {
        const updateData: any = { updated_at: new Date().toISOString() };
        if (payload.label !== undefined) updateData.label = payload.label.trim();
        if (payload.value !== undefined) updateData.value = payload.value.trim().toLowerCase();
        if (payload.enabled !== undefined) updateData.enabled = payload.enabled;
        if (payload.sort_order !== undefined) updateData.sort_order = payload.sort_order;

        await supabase
          .from('video_filter_options')
          .update(updateData)
          .eq('id', optionId);
      } catch (err) {
        console.warn('Supabase updateFilterOption error:', err);
      }
    }

    return updatedOption || ({ id: optionId, ...payload } as VideoFilterOption);
  },

  /**
   * Delete a filter option
   */
  async deleteFilterOption(optionId: string): Promise<boolean> {
    if (isSupabaseConfigured) {
      try {
        await supabase.from('video_filter_options').delete().eq('id', optionId);
      } catch (err) {
        console.warn('Supabase deleteFilterOption error:', err);
      }
    }

    const current = getLocalFilters();
    for (const filter of current) {
      if (filter.options) {
        filter.options = filter.options.filter((o) => o.id !== optionId);
      }
    }
    saveLocalFilters(current);
    return true;
  },

  /**
   * Reorder options inside a filter group
   */
  async reorderFilterOptions(filterId: string, orderedOptionIds: string[]): Promise<boolean> {
    const current = getLocalFilters();
    const parent = current.find((f) => f.id === filterId);

    if (parent && parent.options) {
      parent.options = orderedOptionIds.map((optId, idx) => {
        const opt = parent.options!.find((o) => o.id === optId);
        if (opt) {
          return { ...opt, sort_order: idx + 1 };
        }
        return null;
      }).filter(Boolean) as VideoFilterOption[];

      saveLocalFilters(current);
    }

    if (isSupabaseConfigured) {
      try {
        for (let i = 0; i < orderedOptionIds.length; i++) {
          await supabase
            .from('video_filter_options')
            .update({ sort_order: i + 1, updated_at: new Date().toISOString() })
            .eq('id', orderedOptionIds[i]);
        }
      } catch (err) {
        console.warn('Supabase reorderFilterOptions error:', err);
      }
    }

    return true;
  },
};
