import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables or cached runtime config
const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL as string | undefined;
const envKey = (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

// Allow developer to test or configure credentials via settings or interactive banner
const storedUrl = typeof window !== 'undefined' ? localStorage.getItem('STREAMVAULT_SUPABASE_URL') : null;
const storedKey = typeof window !== 'undefined' ? localStorage.getItem('STREAMVAULT_SUPABASE_KEY') : null;

export const supabaseUrl = envUrl || storedUrl || '';
export const supabaseAnonKey = envKey || storedKey || '';
export const SUPABASE_URL = supabaseUrl;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith('http') && 
  !supabaseUrl.includes('YOUR_') &&
  !supabaseAnonKey.includes('YOUR_')
);

// Fallback dummy client if not configured yet, so app never crashes on import
export const supabase: SupabaseClient = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : createClient(
      'https://placeholder-streamvault.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder',
      {
        auth: {
          persistSession: true,
          autoRefreshToken: false,
        },
      }
    );

export function updateSupabaseConfig(url: string, key: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('STREAMVAULT_SUPABASE_URL', url.trim());
    localStorage.setItem('STREAMVAULT_SUPABASE_KEY', key.trim());
    window.location.reload();
  }
}

export function resetSupabaseConfig() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('STREAMVAULT_SUPABASE_URL');
    localStorage.removeItem('STREAMVAULT_SUPABASE_KEY');
    window.location.reload();
  }
}
