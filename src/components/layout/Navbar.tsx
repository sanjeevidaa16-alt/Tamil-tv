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
  Tv,
  Radio,
  Clock,
  Flame,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSiteSettings } from '../../contexts/SiteSettingsContext';
import { useUserPanelDesign } from '../../contexts/UserPanelDesignContext';
import { isSupabaseConfigured } from '../../lib/supabase';
import { SupabaseConfigModal } from '../common/SupabaseConfigModal';

interface NavbarProps {
  currentPath: string;
  navigate: (path: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPath, navigate }) => {
  const { user, profile, role, isAdmin, isManager, signOut } = useAuth();
  const { siteName, siteShortName, siteTagline, headerLogoUrl, mainLogoUrl, settings } = useSiteSettings();
  const { activeDesign } = useUserPanelDesign();
  const headerStyle = activeDesign.header.style;
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
      {/* 1. TOP BROADCAST CHANNEL STRIP (For Tamil TV Classic & Channel Hub) */}
      {(headerStyle === 'tv-classic' || headerStyle === 'channel-hub') && (
        <div className="bg-slate-950 border-b border-slate-800 text-[11px] py-1.5 px-4 hidden sm:block">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-rose-500 font-bold uppercase tracking-wider text-[10px]">
                <Radio className="w-3 h-3 animate-pulse" />
                <span>நேரலை சேனல்கள்:</span>
              </span>
              <div className="flex items-center gap-3 font-semibold text-slate-300">
                {['சன் டிவி (Sun TV)', 'விஜய் டிவி (Vijay TV)', 'ஜீ தமிழ் (Zee Tamil)', 'கலைஞர் டிவி (Kalaignar)', 'கே டிவி (KTV)'].map((ch, idx) => (
                  <button
                    key={idx}
                    onClick={() => navigate('/videos')}
                    className="hover:text-rose-400 transition-colors text-[11px]"
                  >
                    {ch}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 text-slate-400 font-mono text-[10px]">
              <Clock className="w-3 h-3 text-amber-400" />
              <span>{new Date().toLocaleTimeString('ta-IN', { hour: '2-digit', minute: '2-digit' })} • நேரலை ஒளிபரப்பு</span>
            </div>
          </div>
        </div>
      )}

      {/* 2. TOP EDITORIAL TICKER (For Newspaper Editorial) */}
      {headerStyle === 'newspaper-editorial' && (
        <div className="bg-rose-950/40 border-b border-rose-900/40 text-[11px] py-1 px-4 hidden sm:block">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-rose-600 text-white font-bold text-[9px] uppercase tracking-wider">
                முக்கியச் செய்திகள்
              </span>
              <p className="text-slate-200 font-serif text-xs truncate max-w-xl">
                சன் மற்றும் விஜய் டிவி புதிய சீரியல்கள், பிளாக்பாஸ்டர் திரைப்பட டிரெய்லர்கள் இப்போது ஸ்ட்ரீம்வால்ட்டில்!
              </p>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              {new Date().toLocaleDateString('ta-IN', { dateStyle: 'medium' })}
            </span>
          </div>
        </div>
      )}

      <header
        id="app-header"
        className={`sticky top-0 z-40 w-full border-b transition-colors ${
          headerStyle === 'glass-floating'
            ? 'backdrop-blur-2xl bg-white/[0.04] border-white/10'
            : headerStyle === 'neon-cyber'
            ? 'shadow-[0_4px_20px_rgba(225,29,72,0.25)] border-rose-900/50'
            : ''
        }`}
        style={{
          backgroundColor:
            headerStyle === 'glass-floating'
              ? 'rgba(9, 10, 15, 0.75)'
              : 'var(--header-bg, rgba(9, 10, 15, 0.9))',
          borderColor: 'var(--header-border, var(--color-border, rgba(255, 255, 255, 0.08)))',
          backdropFilter: 'var(--header-backdrop-blur, blur(16px))',
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
                    backgroundColor: 'var(--color-primary, #e11d48)',
                  }}
                >
                  <Film className="w-5 h-5 text-white" />
                </div>
              )}
              <div>
                <span
                  className="text-lg font-black tracking-tight flex items-center gap-1 font-['Cabinet_Grotesk',sans-serif]"
                  style={{ color: 'var(--color-text, #ffffff)' }}
                >
                  {siteName}
                </span>
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
                className="w-48 lg:w-64 border rounded-xl pl-9 pr-3 py-1.5 text-xs placeholder-slate-500 focus:outline-none focus:w-72 transition-all"
                style={{
                  backgroundColor: 'var(--color-input-background, #151724)',
                  borderColor: 'var(--color-input-border, #23283c)',
                  color: 'var(--color-text, #ffffff)',
                  borderRadius: 'var(--input-radius, 12px)',
                }}
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </form>

            <button
              id="mobile-search-toggle"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="sm:hidden p-2 rounded-lg hover:bg-white/5 transition-colors"
              style={{ color: 'var(--color-text-muted, #94a3b8)' }}
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
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-sm transition-all"
                style={{
                  backgroundColor: 'rgba(225, 29, 72, 0.15)',
                  color: 'var(--color-primary, #e11d48)',
                  borderColor: 'rgba(225, 29, 72, 0.3)',
                  borderWidth: '1px',
                  borderRadius: 'var(--button-radius, 12px)',
                }}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin Studio</span>
              </button>
            )}

            {/* 2. Manager: Manager Studio */}
            {isManager && !isAdmin && (
              <button
                id="navbar-manager-studio-btn"
                onClick={() => navigate('/manager')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-sm transition-all"
                style={{
                  backgroundColor: 'rgba(99, 102, 241, 0.15)',
                  color: 'var(--color-secondary, #6366f1)',
                  borderColor: 'rgba(99, 102, 241, 0.3)',
                  borderWidth: '1px',
                  borderRadius: 'var(--button-radius, 12px)',
                }}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Manager Studio</span>
              </button>
            )}

            {/* User Profile / Auth State */}
            {user ? (
              <div className="relative">
                <button
                  id="user-profile-menu-btn"
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center gap-2 p-1 pl-2 rounded-xl border transition-colors hover:bg-white/5"
                  style={{
                    borderColor: 'var(--color-border, #1e2233)',
                    borderRadius: 'var(--button-radius, 12px)',
                  }}
                >
                  <img
                    src={
                      profile?.avatar_url ||
                      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                        profile?.full_name || 'User'
                      )}`
                    }
                    alt={profile?.full_name || 'Avatar'}
                    className="w-7 h-7 rounded-lg object-cover ring-1 ring-white/10"
                  />
                  <span
                    className="hidden md:inline text-xs font-medium max-w-[100px] truncate"
                    style={{ color: 'var(--color-text, #ffffff)' }}
                  >
                    {profile?.full_name?.split(' ')[0] || 'Account'}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {isProfileMenuOpen && (
                  <div
                    id="profile-dropdown-menu"
                    className="absolute right-0 mt-2 w-56 border shadow-2xl py-2 z-50 text-xs transition-all"
                    style={{
                      backgroundColor: 'var(--color-surface, #11131c)',
                      borderColor: 'var(--color-border, #1e2233)',
                      borderRadius: 'var(--card-radius, 14px)',
                      boxShadow: 'var(--card-shadow, 0 10px 25px -5px rgba(0,0,0,0.5))',
                      color: 'var(--color-text, #ffffff)',
                    }}
                  >
                    <div
                      className="px-4 py-2 border-b"
                      style={{ borderColor: 'var(--color-border, #1e2233)' }}
                    >
                      <p className="font-bold truncate" style={{ color: 'var(--color-text, #ffffff)' }}>
                        {profile?.full_name || 'StreamVault User'}
                      </p>
                      <p
                        className="text-[11px] truncate"
                        style={{ color: 'var(--color-text-muted, #94a3b8)' }}
                      >
                        {profile?.email}
                      </p>
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
                        className="w-full text-left px-4 py-2 hover:bg-white/5 flex items-center gap-2 transition-colors"
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
                          className="w-full text-left px-4 py-2 hover:bg-white/5 flex items-center gap-2 font-medium transition-colors"
                          style={{ color: 'var(--color-primary, #e11d48)' }}
                        >
                          <Shield className="w-3.5 h-3.5" />
                          <span>Admin Dashboard</span>
                        </button>
                      )}

                      {isManager && (
                        <button
                          onClick={() => {
                            setIsProfileMenuOpen(false);
                            navigate('/manager');
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-white/5 flex items-center gap-2 font-medium transition-colors"
                          style={{ color: 'var(--color-secondary, #6366f1)' }}
                        >
                          <Briefcase className="w-3.5 h-3.5" />
                          <span>Manager Dashboard</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          setIsConfigModalOpen(true);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-white/5 flex items-center gap-2 transition-colors"
                      >
                        <Database className="w-3.5 h-3.5 text-slate-400" />
                        <span>Supabase Settings</span>
                      </button>
                    </div>

                    <div
                      className="pt-1 border-t"
                      style={{ borderColor: 'var(--color-border, #1e2233)' }}
                    >
                      <button
                        id="signout-dropdown-btn"
                        onClick={handleSignOut}
                        className="w-full text-left px-4 py-2 text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 transition-colors"
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
                  className="px-4 py-1.5 border text-xs font-semibold transition-colors"
                  style={{
                    backgroundColor: 'var(--color-surface-secondary, #181b28)',
                    borderColor: 'var(--color-border, #1e2233)',
                    color: 'var(--color-text, #ffffff)',
                    borderRadius: 'var(--button-radius, 12px)',
                  }}
                >
                  Sign In
                </button>
                <button
                  id="nav-signup-btn"
                  onClick={() => navigate('/signup')}
                  className="px-4 py-1.5 text-xs font-semibold shadow-lg transition-all hover:opacity-90"
                  style={{
                    backgroundColor: 'var(--button-primary-bg, #e11d48)',
                    color: 'var(--button-primary-text, #ffffff)',
                    borderRadius: 'var(--button-radius, 12px)',
                  }}
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Search Input Expanded */}
        {isSearchOpen && (
          <div
            className="sm:hidden px-4 pb-3 border-t"
            style={{
              backgroundColor: 'var(--color-surface, #0c0e17)',
              borderColor: 'var(--color-border, #1e2233)',
            }}
          >
            <form onSubmit={handleSearchSubmit} className="relative mt-2">
              <input
                type="text"
                placeholder="Search videos, categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border pl-9 pr-3 py-2 text-xs focus:outline-none"
                style={{
                  backgroundColor: 'var(--color-input-background, #151724)',
                  borderColor: 'var(--color-input-border, #23283c)',
                  color: 'var(--color-text, #ffffff)',
                  borderRadius: 'var(--input-radius, 12px)',
                }}
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
