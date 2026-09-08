import React, { useState } from 'react';
import {
  Film,
  Search,
  Shield,
  Briefcase,
  User as UserIcon,
  LogOut,
  ChevronDown,
  Database,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSiteSettings } from '../../contexts/SiteSettingsContext';
import { isSupabaseConfigured } from '../../lib/supabase';
import { SupabaseConfigModal } from '../common/SupabaseConfigModal';

interface NavbarProps {
  currentPath: string;
  navigate: (path: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPath, navigate }) => {
  const { user, profile, role, isAdmin, isManager, signOut } = useAuth();
  const { siteName, siteShortName, siteTagline, headerLogoUrl, mainLogoUrl, settings } = useSiteSettings();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  const activeLogo = headerLogoUrl || mainLogoUrl;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/videos?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setIsProfileMenuOpen(false);
    navigate('/');
  };

  return (
    <>
      <header
        id="app-header"
        className="sticky top-0 z-40 w-full bg-[#090a0f]/90 backdrop-blur-md border-b border-slate-800/80"
        style={{
          backgroundColor: settings.background_color ? `${settings.background_color}ee` : undefined,
          borderColor: settings.border_color ? `${settings.border_color}` : undefined,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <div className="flex items-center gap-8">
            <button
              id="brand-logo-btn"
              onClick={() => navigate('/')}
              className="flex items-center gap-2.5 group text-left focus:outline-none"
            >
              {activeLogo ? (
                <img
                  src={activeLogo}
                  alt={siteName}
                  className="h-9 max-w-[160px] object-contain group-hover:scale-105 transition-transform"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform text-white font-bold"
                  style={{
                    backgroundColor: settings.primary_color || '#e11d48',
                  }}
                >
                  <Film className="w-5 h-5 text-white" />
                </div>
              )}
              <div>
                <span className="text-lg font-black tracking-tight text-white flex items-center gap-1 font-['Cabinet_Grotesk',sans-serif]">
                  {siteName}
                </span>
                {siteTagline && (
                  <span className="hidden sm:block text-[9px] uppercase tracking-widest text-slate-400 font-semibold -mt-1 truncate max-w-[180px]">
                    {siteTagline}
                  </span>
                )}
              </div>
            </button>
          </div>

          {/* Right Section: Search, Role Portals, Profile */}
          <div className="flex items-center gap-3">
            {/* Quick Search */}
            <form onSubmit={handleSearchSubmit} className="relative hidden sm:block">
              <input
                id="global-search-input"
                type="text"
                placeholder="Search titles, categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48 lg:w-64 bg-[#141622] border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500/80 focus:w-72 transition-all"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </form>

            <button
              id="mobile-search-toggle"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="sm:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* ROLE PORTAL SHORTCUTS (Only when authenticated as staff) */}
            {/* 1. Super Admin: Admin Studio */}
            {isAdmin && (
              <button
                id="navbar-admin-studio-btn"
                onClick={() => navigate('/admin')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 text-xs font-semibold shadow-sm transition-all"
              >
                <Shield className="w-3.5 h-3.5 text-rose-400" />
                <span>Admin Studio</span>
              </button>
            )}

            {/* 2. Manager: Manager Studio */}
            {isManager && !isAdmin && (
              <button
                id="navbar-manager-studio-btn"
                onClick={() => navigate('/manager')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold shadow-sm transition-all"
              >
                <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
                <span>Manager Studio</span>
              </button>
            )}

            {/* User Profile / Auth State */}
            {user ? (
              <div className="relative">
                <button
                  id="user-profile-menu-btn"
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center gap-2 p-1 pl-2 rounded-xl hover:bg-slate-800/60 border border-slate-800 transition-colors"
                >
                  <img
                    src={
                      profile?.avatar_url ||
                      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                        profile?.full_name || 'User'
                      )}`
                    }
                    alt={profile?.full_name || 'Avatar'}
                    className="w-7 h-7 rounded-lg object-cover ring-1 ring-slate-700"
                  />
                  <span className="hidden md:inline text-xs font-medium text-slate-200 max-w-[100px] truncate">
                    {profile?.full_name?.split(' ')[0] || 'Account'}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {isProfileMenuOpen && (
                  <div
                    id="profile-dropdown-menu"
                    className="absolute right-0 mt-2 w-56 bg-[#131520] border border-slate-700/80 rounded-2xl shadow-2xl py-2 z-50 text-xs text-slate-200"
                  >
                    <div className="px-4 py-2 border-b border-slate-800">
                      <p className="font-bold text-white truncate">{profile?.full_name || 'StreamVault User'}</p>
                      <p className="text-slate-400 text-[11px] truncate">{profile?.email}</p>
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            role === 'admin'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : role === 'manager'
                              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {role === 'admin' ? 'Super Admin' : role === 'manager' ? 'Manager' : 'User'}
                        </span>
                      </div>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          navigate('/profile');
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-slate-800 flex items-center gap-2"
                      >
                        <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                        <span>My Profile</span>
                      </button>

                      {isAdmin && (
                        <button
                          onClick={() => {
                            setIsProfileMenuOpen(false);
                            navigate('/admin');
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-slate-800 flex items-center gap-2 text-rose-300 font-medium"
                        >
                          <Shield className="w-3.5 h-3.5 text-rose-400" />
                          <span>Admin Dashboard</span>
                        </button>
                      )}

                      {isManager && (
                        <button
                          onClick={() => {
                            setIsProfileMenuOpen(false);
                            navigate('/manager');
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-slate-800 flex items-center gap-2 text-indigo-300 font-medium"
                        >
                          <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Manager Dashboard</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          setIsConfigModalOpen(true);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-slate-800 flex items-center gap-2 text-slate-300"
                      >
                        <Database className="w-3.5 h-3.5 text-slate-400" />
                        <span>Supabase Settings</span>
                      </button>
                    </div>

                    <div className="pt-1 border-t border-slate-800">
                      <button
                        id="signout-dropdown-btn"
                        onClick={handleSignOut}
                        className="w-full text-left px-4 py-2 text-rose-400 hover:bg-rose-500/10 flex items-center gap-2"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  id="nav-signin-btn"
                  onClick={() => navigate('/login')}
                  className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold transition-colors"
                >
                  Sign In
                </button>
                <button
                  id="nav-signup-btn"
                  onClick={() => navigate('/signup')}
                  className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-900/30 transition-all"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Search Input Expanded */}
        {isSearchOpen && (
          <div className="sm:hidden px-4 pb-3 border-t border-slate-800/80 bg-[#0c0e17]">
            <form onSubmit={handleSearchSubmit} className="relative mt-2">
              <input
                type="text"
                placeholder="Search videos, categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#141622] border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </form>
          </div>
        )}
      </header>

      {/* Supabase Connection Modal */}
      <SupabaseConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
      />
    </>
  );
};
