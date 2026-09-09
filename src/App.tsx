import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SiteSettingsProvider, useSiteSettings } from './contexts/SiteSettingsContext';
import { UserPanelDesignProvider } from './contexts/UserPanelDesignContext';
import { AdSenseProvider } from './contexts/AdSenseContext';
import { AdsterraProvider } from './contexts/AdsterraContext';
import { AnalyticsProvider, useAnalytics } from './contexts/AnalyticsContext';
import { CookieConsentBanner } from './components/common/CookieConsentBanner';
import { ToastProvider } from './components/common/Toast';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { UserPanelBottomNav } from './components/layout/UserPanelBottomNav';
import { AdPlacementSlot } from './components/ads/AdPlacementSlot';
import { AdsterraSlot } from './components/ads/AdsterraSlot';
import { Videos } from './pages/user/Videos';
import { VideoDetails } from './pages/user/VideoDetails';
import { CategoryPage } from './pages/user/Category';
import { Profile } from './pages/user/Profile';
import { Login } from './pages/auth/Login';
import { Signup } from './pages/auth/Signup';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { ResetPassword } from './pages/auth/ResetPassword';
import { AdminPortal } from './pages/admin/AdminPortal';
import { AdminLogin } from './pages/admin/AdminLogin';
import { ManagerPortal } from './pages/manager/ManagerPortal';
import { ManagerLogin } from './pages/manager/ManagerLogin';
import { AccessDenied } from './components/common/AccessDenied';
import { Wrench, Shield, Film, ArrowRight } from 'lucide-react';

function AppContent() {
  const { user, role, isAdmin, isManager, loading: authLoading } = useAuth();
  const { settings, isMaintenanceMode, siteName, mainLogoUrl } = useSiteSettings();
  const { trackPageView } = useAnalytics();
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname || '/');
  const [searchParams, setSearchParams] = useState(() => window.location.search);

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname || '/');
      setSearchParams(window.location.search);
    };

    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  // GA4 SPA Page View Tracking
  useEffect(() => {
    const isInternal = currentPath.startsWith('/admin') || currentPath.startsWith('/manager');
    trackPageView(currentPath, document.title, isInternal);
  }, [currentPath, trackPageView]);

  const navigate = (path: string) => {
    if (path !== currentPath) {
      window.history.pushState({}, '', path);
      const [newPath, query] = path.split('?');
      setCurrentPath(newPath || '/');
      setSearchParams(query ? `?${query}` : '');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#07080e] flex items-center justify-center text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-mono">Initializing {siteName} Core...</p>
        </div>
      </div>
    );
  }

  // 1. ADMIN PORTAL (Guarded - Entry point /admin)
  if (currentPath.startsWith('/admin')) {
    if (currentPath === '/admin/login' && !isAdmin) {
      return <AdminLogin navigate={navigate} />;
    }

    if (!isAdmin) {
      if (!user) {
        return <AdminLogin navigate={navigate} />;
      }
      return (
        <div className="min-h-screen bg-[#07080e] text-slate-100 flex flex-col">
          <Navbar currentPath={currentPath} navigate={navigate} />
          <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
            <AccessDenied
              requiredRole="admin"
              currentRole={role}
              navigate={navigate}
            />
          </main>
          <Footer navigate={navigate} />
        </div>
      );
    }

    let section = currentPath.replace('/admin', '').replace(/^\//, '') || 'dashboard';
    if (section === 'settings/database') {
      section = 'database';
    } else if (section === 'settings/general' || section === 'general') {
      section = 'general_settings';
    } else if (section === 'settings/filters' || section === 'filters') {
      section = 'filters';
    } else if (section === 'settings/adsense' || section === 'adsense') {
      section = 'adsense';
    } else if (section === 'settings/adsterra' || section === 'adsterra') {
      section = 'adsterra';
    }
    return <AdminPortal navigate={navigate} initialSection={section} />;
  }

  // 2. MANAGER PORTAL (Guarded - Entry point /manager)
  if (currentPath.startsWith('/manager')) {
    if (!isManager) {
      if (!user) {
        return <ManagerLogin navigate={navigate} />;
      }
      return (
        <div className="min-h-screen bg-[#07080e] text-slate-100 flex flex-col overflow-x-hidden w-full">
          <Navbar currentPath={currentPath} navigate={navigate} />
          <main className="flex-1 responsive-frame py-6 sm:py-8 w-full">
            <AccessDenied
              requiredRole="manager"
              currentRole={role}
              navigate={navigate}
            />
          </main>
          <Footer navigate={navigate} />
        </div>
      );
    }

    const section = currentPath.replace('/manager', '').replace(/^\//, '') || 'dashboard';
    return <ManagerPortal navigate={navigate} initialSection={section} />;
  }

  // 3. MAINTENANCE MODE SCREEN (Only applies to public visitors when active)
  if (isMaintenanceMode && !isAdmin) {
    return (
      <div className="min-h-screen bg-[#07080e] text-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full p-8 rounded-3xl bg-[#11131e] border border-amber-500/30 shadow-2xl space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mx-auto flex items-center justify-center">
            <Wrench className="w-8 h-8 animate-pulse" />
          </div>

          <div>
            <h1 className="text-2xl font-black text-white">{siteName} Under Maintenance</h1>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              {settings.maintenance_notice ||
                'We are performing scheduled infrastructure upgrades. Please check back shortly.'}
            </p>
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-center">
            <button
              onClick={() => navigate('/admin')}
              className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1.5 transition-colors"
            >
              <Shield className="w-3.5 h-3.5 text-rose-500" />
              <span>Admin Gateway</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. PUBLIC & USER PAGES
  const renderRoute = () => {
    // Exact routes: / and /videos render Videos Library directly
    if (currentPath === '/' || currentPath === '/videos') {
      const urlParams = new URLSearchParams(searchParams);
      const search = urlParams.get('search') || '';
      const category = urlParams.get('category') || '';
      return (
        <Videos
          navigate={navigate}
          initialSearch={search}
          initialCategory={category}
        />
      );
    }

    // Video Detail: /videos/:id
    if (currentPath.startsWith('/videos/')) {
      const videoId = currentPath.replace('/videos/', '');
      return <VideoDetails id={videoId} navigate={navigate} />;
    }

    // Category Detail: /categories/:slug
    if (currentPath.startsWith('/categories/')) {
      const slug = currentPath.replace('/categories/', '');
      return <CategoryPage slug={slug} navigate={navigate} />;
    }

    if (currentPath === '/profile') {
      return <Profile navigate={navigate} />;
    }

    if (currentPath === '/login') {
      return <Login navigate={navigate} />;
    }

    if (currentPath === '/signup') {
      return <Signup navigate={navigate} />;
    }

    if (currentPath === '/forgot-password') {
      return <ForgotPassword navigate={navigate} />;
    }

    if (currentPath === '/reset-password') {
      return <ResetPassword navigate={navigate} />;
    }

    // Fallback: 404
    return (
      <div className="text-center py-24 space-y-4">
        <h2 className="text-3xl font-black text-white">404 - Page Not Found</h2>
        <p className="text-xs text-slate-400">
          The page or video path you requested could not be located.
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors"
        >
          Return to Videos
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#07080e] text-slate-100 flex flex-col selection:bg-rose-500 selection:text-white overflow-x-hidden w-full">
      {/* 1. Header Top Placement */}
      <AdPlacementSlot placementKey="header_top" />

      {/* Adsterra Header Placement */}
      <AdsterraSlot placementKey="header" />

      <Navbar currentPath={currentPath} navigate={navigate} />

      {/* 2. Header Bottom Placement */}
      <AdPlacementSlot placementKey="header_bottom" />

      <main className="flex-1 responsive-frame py-4 sm:py-6 lg:py-8 w-full">
        {/* Adsterra Center Placement (Dedicated Main View Placement) */}
        <AdsterraSlot placementKey="center" />

        {renderRoute()}
      </main>

      {/* 3. Footer Top Placement */}
      <AdPlacementSlot placementKey="footer_top" />

      {/* Adsterra Footer Placement */}
      <AdsterraSlot placementKey="footer" />

      <Footer navigate={navigate} />

      {/* User Panel Design-driven Bottom Navigation */}
      <UserPanelBottomNav currentPath={currentPath} navigate={navigate} />

      {/* 4. Footer Bottom Placement */}
      <AdPlacementSlot placementKey="footer_bottom" />

      {/* Google Analytics 4 User Consent Banner */}
      <CookieConsentBanner />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <SiteSettingsProvider>
        <UserPanelDesignProvider>
          <AuthProvider>
            <AdSenseProvider>
              <AdsterraProvider>
                <AnalyticsProvider>
                  <AppContent />
                </AnalyticsProvider>
              </AdsterraProvider>
            </AdSenseProvider>
          </AuthProvider>
        </UserPanelDesignProvider>
      </SiteSettingsProvider>
    </ToastProvider>
  );
}
