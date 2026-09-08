import React, { useState } from 'react';
import {
  Film,
  LayoutDashboard,
  Video as VideoIcon,
  Upload,
  FolderTree,
  Users,
  UserCheck,
  BarChart3,
  Settings,
  LogOut,
  Shield,
  Briefcase,
  Menu,
  X,
  ChevronRight,
  Database,
  DollarSign,
  Activity,
  User,
  Sliders,
  Palette,
  Globe,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { isSupabaseConfigured } from '../lib/supabase';
import { SupabaseConfigModal } from '../components/common/SupabaseConfigModal';

interface StudioLayoutProps {
  currentSection: string;
  onSelectSection: (section: string) => void;
  navigate: (path: string) => void;
  children: React.ReactNode;
  isManagerPortal?: boolean;
}

export const StudioLayout: React.FC<StudioLayoutProps> = ({
  currentSection,
  onSelectSection,
  navigate,
  children,
  isManagerPortal = false,
}) => {
  const { profile, role, isAdmin, isManager, signOut } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [configModalOpen, setConfigModalOpen] = useState(false);

  // Define sidebar menu items based on whether this is the Admin portal or Manager portal
  const adminMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, category: 'Main' },
    { id: 'videos', label: 'Videos', icon: VideoIcon, category: 'Main' },
    { id: 'upload', label: 'Upload Video', icon: Upload, category: 'Main' },
    { id: 'filters', label: 'Filter Management', icon: Sliders, category: 'Main' },
    { id: 'categories', label: 'Categories', icon: FolderTree, category: 'Main' },
    { id: 'users', label: 'Users', icon: Users, category: 'Management' },
    { id: 'managers', label: 'Managers', icon: UserCheck, category: 'Management' },
    { id: 'general_settings', label: 'General Settings & CMS', icon: Palette, category: 'Management' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, category: 'Management' },
    { id: 'adsense', label: 'Google AdSense', icon: DollarSign, category: 'Monetization' },
    { id: 'adsterra', label: 'Adsterra', icon: Globe, category: 'Monetization' },
    { id: 'database', label: 'Database Setup', icon: Database, category: 'System' },
    { id: 'activity', label: 'Audit Logs', icon: Activity, category: 'System' },
    { id: 'profile', label: 'Admin Profile', icon: User, category: 'System' },
    { id: 'settings', label: 'System & Security', icon: Settings, category: 'System' },
  ];

  const managerMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, category: 'Main' },
    { id: 'videos', label: 'Videos', icon: VideoIcon, category: 'Main' },
    { id: 'upload', label: 'Upload Video', icon: Upload, category: 'Main' },
    { id: 'profile', label: 'My Profile', icon: User, category: 'Main' },
  ];

  const menuItems = isManagerPortal ? managerMenuItems : adminMenuItems;

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div id="studio-shell" className="min-h-screen bg-[#07080e] text-slate-100 flex flex-col md:flex-row">
      {/* 1. SIDEBAR (Desktop) */}
      <aside className="hidden md:flex flex-col w-64 bg-[#0d0f18] border-r border-slate-800/90 p-4 shrink-0 justify-between">
        <div className="space-y-6">
          {/* Studio Brand */}
          <div className="flex items-center justify-between px-2">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2.5 text-left group"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-rose-900/30">
                <Film className="w-4 h-4" />
              </div>
              <div>
                <span className="text-base font-black text-white tracking-tight">
                  STREAM<span className="text-rose-500">VAULT</span>
                </span>
                <span className="block text-[9px] uppercase tracking-wider text-rose-400 font-bold">
                  {isManagerPortal ? 'Manager Studio' : 'Admin Console'}
                </span>
              </div>
            </button>
          </div>

          {/* Role Status Tag */}
          <div className="px-3 py-2.5 bg-slate-900/80 border border-slate-800 rounded-2xl flex items-center gap-2.5">
            {isManagerPortal ? (
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                <Briefcase className="w-4 h-4" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                <Shield className="w-4 h-4" />
              </div>
            )}
            <div className="truncate">
              <p className="text-xs font-bold text-white truncate">{profile?.full_name || 'Studio Officer'}</p>
              <p className="text-[10px] text-slate-400 uppercase font-semibold">
                {isManagerPortal ? 'Content Manager' : 'Super Administrator'}
              </p>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1">
            {menuItems.map((item, idx) => {
              const Icon = item.icon;
              const isActive = currentSection === item.id;
              const prevCategory = idx > 0 ? menuItems[idx - 1].category : null;
              const isNewCategory = item.category && item.category !== prevCategory && !isManagerPortal;

              return (
                <React.Fragment key={item.id}>
                  {isNewCategory && (
                    <div className="pt-3 pb-1 px-3.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        {item.category}
                      </span>
                    </div>
                  )}
                  <button
                    id={`studio-tab-${item.id}`}
                    onClick={() => onSelectSection(item.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-rose-600 text-white shadow-lg shadow-rose-950/50'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {isActive && <ChevronRight className="w-3.5 h-3.5 text-white/80" />}
                  </button>
                </React.Fragment>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer Actions */}
        <div className="pt-4 border-t border-slate-800/80 space-y-2">
          {/* Supabase Status Button */}
          <button
            onClick={() => setConfigModalOpen(true)}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
          >
            <Database className="w-4 h-4 text-amber-400" />
            <span className="truncate">{isSupabaseConfigured ? 'Supabase Connected' : 'Demo DB Mode'}</span>
          </button>

          {/* Logout */}
          <button
            id="studio-logout-btn"
            onClick={handleSignOut}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-rose-400 hover:bg-rose-950/30 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* 2. MOBILE TOPBAR */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-[#0d0f18] border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center text-white">
            <Film className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm text-white">
            {isManagerPortal ? 'Manager Studio' : 'Admin Console'}
          </span>
        </div>
        <button
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          className="p-2 text-slate-400 hover:text-white rounded-lg"
          aria-label="Toggle mobile studio menu"
        >
          {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileSidebarOpen && (
        <div className="md:hidden bg-[#0e101b] border-b border-slate-800 p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectSection(item.id);
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold ${
                  isActive ? 'bg-rose-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
          <div className="pt-2 border-t border-slate-800">
            <button
              onClick={handleSignOut}
              className="w-full py-2 rounded-xl bg-rose-950/50 text-xs text-rose-400 font-semibold"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* 3. MAIN WORKSPACE */}
      <main className="flex-1 overflow-y-auto min-h-screen bg-[#090a10] p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">{children}</div>
      </main>

      {/* Supabase Config Modal */}
      <SupabaseConfigModal
        isOpen={configModalOpen}
        onClose={() => setConfigModalOpen(false)}
      />
    </div>
  );
};
