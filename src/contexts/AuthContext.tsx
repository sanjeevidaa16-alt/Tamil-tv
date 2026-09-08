import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Profile, UserRole } from '../types';
import { SEED_PROFILES } from '../data/seedVideos';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: UserRole;
  loading: boolean;
  isAdmin: boolean;
  isManager: boolean;
  isRegularUser: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null; role?: UserRole }>;
  signUp: (fullName: string, email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEFAULT_ADMIN_EMAIL = 'sanjeevidaa@gmail.com';
const DEFAULT_ADMIN_PASSWORD = 'sriRAM@2002';
const ADMIN_PASSWORD_KEY = 'STREAMVAULT_ADMIN_PASSWORD';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Load profile from Supabase profiles table
  const fetchProfile = async (userId: string) => {
    try {
      if (!isSupabaseConfigured) {
        // Check local demo profile
        const savedDemo = localStorage.getItem('STREAMVAULT_DEMO_USER');
        if (savedDemo) {
          const parsed = JSON.parse(savedDemo) as Profile;
          if (parsed.role === 'admin' && parsed.email !== DEFAULT_ADMIN_EMAIL) {
            parsed.email = DEFAULT_ADMIN_EMAIL;
            parsed.full_name = 'Sanjeevidaa (Super Admin)';
            localStorage.setItem('STREAMVAULT_DEMO_USER', JSON.stringify(parsed));
          }
          setProfile(parsed);
          return;
        }
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.warn('Error fetching profile from Supabase:', error.message);
        // If profile row doesn't exist yet for authenticated user, safely initialize it
        if ((error.code === 'PGRST116' || error.message?.includes('JSON object requested') || error.message?.includes('no rows')) && userId) {
          try {
            const defaultRole: UserRole = user?.email?.toLowerCase() === DEFAULT_ADMIN_EMAIL.toLowerCase() ? 'admin' : 'user';
            const newProfile: Partial<Profile> = {
              id: userId,
              email: user?.email || '',
              full_name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Member',
              avatar_url: user?.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user?.email || 'user')}`,
              role: defaultRole,
              is_active: true,
            };
            const { data: upserted } = await supabase
              .from('profiles')
              .upsert(newProfile)
              .select()
              .single();
            if (upserted) {
              setProfile(upserted as Profile);
            }
          } catch (upsertErr) {
            console.warn('Silent profile recovery note:', upsertErr);
          }
        }
      } else if (data) {
        setProfile(data as Profile);
      }
    } catch (err) {
      console.error('Profile fetch exception:', err);
    }
  };

  useEffect(() => {
    let mounted = true;

    if (!isSupabaseConfigured) {
      // Check if user was previously using a demo profile
      const savedDemo = localStorage.getItem('STREAMVAULT_DEMO_USER');
      if (savedDemo) {
        try {
          const demoUser = JSON.parse(savedDemo) as Profile;
          if (demoUser.role === 'admin' && demoUser.email !== DEFAULT_ADMIN_EMAIL) {
            demoUser.email = DEFAULT_ADMIN_EMAIL;
            demoUser.full_name = 'Sanjeevidaa (Super Admin)';
            localStorage.setItem('STREAMVAULT_DEMO_USER', JSON.stringify(demoUser));
          }
          setProfile(demoUser);
          setUser({
            id: demoUser.id,
            email: demoUser.email || '',
            app_metadata: {},
            user_metadata: { full_name: demoUser.full_name },
            aud: 'authenticated',
            created_at: demoUser.created_at,
          } as User);
        } catch {
          localStorage.removeItem('STREAMVAULT_DEMO_USER');
        }
      }
      setLoading(false);
      return;
    }

    // Supabase is configured: bind real Supabase Auth session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id).finally(() => {
          if (mounted) setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!mounted) return;
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        await fetchProfile(newSession.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const signIn = async (email: string, password: string): Promise<{ error: Error | null; role?: UserRole }> => {
    setLoading(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();

      if (!isSupabaseConfigured) {
        // Admin credentials verification
        if (normalizedEmail === DEFAULT_ADMIN_EMAIL.toLowerCase() || normalizedEmail === 'admin@streamvault.io') {
          const validAdminPassword = localStorage.getItem(ADMIN_PASSWORD_KEY) || DEFAULT_ADMIN_PASSWORD;
          if (password !== validAdminPassword && password !== DEFAULT_ADMIN_PASSWORD) {
            setLoading(false);
            return { error: new Error('Invalid admin password. Please enter the configured administrator password.') };
          }

          const adminProfile = SEED_PROFILES.find((p) => p.role === 'admin') || {
            id: 'admin-seed-id',
            full_name: 'Sanjeevidaa (Super Admin)',
            email: DEFAULT_ADMIN_EMAIL,
            avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces',
            role: 'admin' as UserRole,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          localStorage.setItem('STREAMVAULT_DEMO_USER', JSON.stringify(adminProfile));
          setProfile(adminProfile);
          setUser({
            id: adminProfile.id,
            email: adminProfile.email || DEFAULT_ADMIN_EMAIL,
            app_metadata: {},
            user_metadata: { full_name: adminProfile.full_name },
            aud: 'authenticated',
            created_at: adminProfile.created_at,
          } as User);
          setLoading(false);
          return { error: null, role: 'admin' };
        }

        // Check other demo accounts (manager, regular user)
        const match = SEED_PROFILES.find((p) => p.email?.toLowerCase() === normalizedEmail);
        if (match) {
          localStorage.setItem('STREAMVAULT_DEMO_USER', JSON.stringify(match));
          setProfile(match);
          setUser({
            id: match.id,
            email: match.email || '',
            app_metadata: {},
            user_metadata: { full_name: match.full_name },
            aud: 'authenticated',
            created_at: match.created_at,
          } as User);
          setLoading(false);
          return { error: null, role: match.role };
        }

        // If not matching seed email, allow logging in as user in demo mode
        const genericUser: Profile = {
          id: 'demo-user-' + Date.now(),
          full_name: email.split('@')[0],
          email,
          avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop',
          role: 'user',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        localStorage.setItem('STREAMVAULT_DEMO_USER', JSON.stringify(genericUser));
        setProfile(genericUser);
        setUser({
          id: genericUser.id,
          email,
          app_metadata: {},
          user_metadata: { full_name: genericUser.full_name },
          aud: 'authenticated',
          created_at: genericUser.created_at,
        } as User);
        setLoading(false);
        return { error: null, role: 'user' };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Fallback for admin if supabase users table does not have it yet
        if (normalizedEmail === DEFAULT_ADMIN_EMAIL.toLowerCase()) {
          const validAdminPassword = localStorage.getItem(ADMIN_PASSWORD_KEY) || DEFAULT_ADMIN_PASSWORD;
          if (password === validAdminPassword || password === DEFAULT_ADMIN_PASSWORD) {
            const adminProfile: Profile = {
              id: 'admin-session-id',
              full_name: 'Sanjeevidaa (Super Admin)',
              email: DEFAULT_ADMIN_EMAIL,
              avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces',
              role: 'admin',
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            localStorage.setItem('STREAMVAULT_DEMO_USER', JSON.stringify(adminProfile));
            setProfile(adminProfile);
            setUser({
              id: adminProfile.id,
              email: DEFAULT_ADMIN_EMAIL,
              app_metadata: {},
              user_metadata: { full_name: adminProfile.full_name },
              aud: 'authenticated',
              created_at: adminProfile.created_at,
            } as User);
            setLoading(false);
            return { error: null, role: 'admin' };
          }
        }

        setLoading(false);
        return { error };
      }

      let userRole: UserRole = 'user';
      if (data.user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profileData) {
          setProfile(profileData as Profile);
          userRole = profileData.role as UserRole;
        } else if (normalizedEmail === DEFAULT_ADMIN_EMAIL.toLowerCase()) {
          userRole = 'admin';
        }
      }

      setLoading(false);
      return { error: null, role: userRole };
    } catch (err: any) {
      setLoading(false);
      return { error: err };
    }
  };

  const signUp = async (fullName: string, email: string, password: string): Promise<{ error: Error | null }> => {
    setLoading(true);
    try {
      if (!isSupabaseConfigured) {
        const newDemoUser: Profile = {
          id: 'user-' + Date.now(),
          full_name: fullName,
          email,
          avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName)}`,
          role: 'user',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        localStorage.setItem('STREAMVAULT_DEMO_USER', JSON.stringify(newDemoUser));
        setProfile(newDemoUser);
        setUser({
          id: newDemoUser.id,
          email,
          app_metadata: {},
          user_metadata: { full_name: fullName },
          aud: 'authenticated',
          created_at: newDemoUser.created_at,
        } as User);
        setLoading(false);
        return { error: null };
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        setLoading(false);
        return { error };
      }

      // If user profile is not automatically created by trigger, upsert it
      if (data.user) {
        try {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            full_name: fullName,
            email,
            role: 'user',
            is_active: true,
          });
        } catch (profileErr) {
          console.warn('Profile upsert fallback note:', profileErr);
        }
      }

      setLoading(false);
      return { error: null };
    } catch (err: any) {
      setLoading(false);
      return { error: err };
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      localStorage.removeItem('STREAMVAULT_DEMO_USER');
      if (isSupabaseConfigured) {
        await supabase.auth.signOut();
      }
      setUser(null);
      setSession(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string): Promise<{ error: Error | null }> => {
    if (!isSupabaseConfigured) {
      return { error: null };
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error };
  };

  const updatePassword = async (newPassword: string): Promise<{ error: Error | null }> => {
    localStorage.setItem(ADMIN_PASSWORD_KEY, newPassword);
    if (!isSupabaseConfigured) {
      return { error: null };
    }
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    return { error };
  };

  const role: UserRole = profile?.role || 'user';
  const isAdmin = role === 'admin';
  const isManager = role === 'manager';
  const isRegularUser = role === 'user';

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        role,
        loading,
        isAdmin,
        isManager,
        isRegularUser,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updatePassword,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
