import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Category } from '../types';
import { SEED_CATEGORIES } from '../data/seedVideos';

const LOCAL_STORAGE_CATEGORIES_KEY = 'STREAMVAULT_LOCAL_CATEGORIES';

function getLocalCategories(): Category[] {
  const data = localStorage.getItem(LOCAL_STORAGE_CATEGORIES_KEY);
  if (!data) {
    localStorage.setItem(LOCAL_STORAGE_CATEGORIES_KEY, JSON.stringify(SEED_CATEGORIES));
    return SEED_CATEGORIES;
  }
  try {
    return JSON.parse(data);
  } catch {
    return SEED_CATEGORIES;
  }
}

function saveLocalCategories(cats: Category[]) {
  localStorage.setItem(LOCAL_STORAGE_CATEGORIES_KEY, JSON.stringify(cats));
}

export const categoryService = {
  async getCategories(): Promise<Category[]> {
    if (!isSupabaseConfigured) {
      return getLocalCategories();
    }

    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*, videos:videos(count)')
        .order('name');

      if (error) throw error;
      return (data || []).map((c: any) => ({
        ...c,
        videos_count: c.videos?.[0]?.count ?? 0,
      }));
    } catch (err) {
      console.warn('Falling back to cached/seed categories:', err);
      return getLocalCategories();
    }
  },

  async getCategoryBySlug(slug: string): Promise<Category | null> {
    if (!isSupabaseConfigured) {
      const cats = getLocalCategories();
      return cats.find((c) => c.slug === slug) || null;
    }

    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) throw error;
      return data as Category;
    } catch {
      const cats = getLocalCategories();
      return cats.find((c) => c.slug === slug) || null;
    }
  },

  async createCategory(payload: { name: string; slug: string; description?: string }): Promise<Category> {
    if (!isSupabaseConfigured) {
      const cats = getLocalCategories();
      const newCat: Category = {
        id: 'cat-' + Date.now(),
        name: payload.name.trim(),
        slug: payload.slug.trim().toLowerCase().replace(/\s+/g, '-'),
        description: payload.description || '',
        created_at: new Date().toISOString(),
        videos_count: 0,
      };
      const updated = [...cats, newCat];
      saveLocalCategories(updated);
      return newCat;
    }

    const { data, error } = await supabase
      .from('categories')
      .insert([
        {
          name: payload.name.trim(),
          slug: payload.slug.trim().toLowerCase().replace(/\s+/g, '-'),
          description: payload.description,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data as Category;
  },

  async updateCategory(id: string, payload: { name: string; slug: string; description?: string }): Promise<Category> {
    if (!isSupabaseConfigured) {
      const cats = getLocalCategories();
      const index = cats.findIndex((c) => c.id === id);
      if (index === -1) throw new Error('Category not found');
      const updatedCat: Category = {
        ...cats[index],
        name: payload.name.trim(),
        slug: payload.slug.trim().toLowerCase().replace(/\s+/g, '-'),
        description: payload.description || '',
      };
      cats[index] = updatedCat;
      saveLocalCategories(cats);
      return updatedCat;
    }

    const { data, error } = await supabase
      .from('categories')
      .update({
        name: payload.name.trim(),
        slug: payload.slug.trim().toLowerCase().replace(/\s+/g, '-'),
        description: payload.description,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Category;
  },

  async deleteCategory(id: string): Promise<void> {
    if (!isSupabaseConfigured) {
      const cats = getLocalCategories();
      saveLocalCategories(cats.filter((c) => c.id !== id));
      return;
    }

    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) throw error;
  },
};
