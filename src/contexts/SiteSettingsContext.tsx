import React, { createContext, useContext, useState, useEffect } from 'react';
import { SiteSettings } from '../types';
import { settingsService } from '../services/settingsService';
import { DEFAULT_SITE_SETTINGS_CONFIG, THEME_PRESETS } from '../data/themes';

interface SiteSettingsContextType {
  settings: SiteSettings;
  loading: boolean;
  updateSettings: (newSettings: Partial<SiteSettings>) => Promise<SiteSettings>;
  resetSettings: () => Promise<void>;
  refreshSettings: () => Promise<void>;
  siteName: string;
  siteShortName: string;
  siteTagline: string;
  siteDescription: string;
  headerLogoUrl: string;
  footerLogoUrl: string;
  mainLogoUrl: string;
  faviconUrl: string;
  isMaintenanceMode: boolean;
}

const SiteSettingsContext = createContext<SiteSettingsContextType | undefined>(undefined);

export const SiteSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS_CONFIG);
  const [loading, setLoading] = useState(true);

  const applyThemeToDOM = (cfg: SiteSettings) => {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    root.style.setProperty('--primary', cfg.primary_color);
    root.style.setProperty('--secondary', cfg.secondary_color);
    root.style.setProperty('--accent', cfg.accent_color);
    root.style.setProperty('--background', cfg.background_color);
    root.style.setProperty('--surface', cfg.surface_color);
    root.style.setProperty('--foreground', cfg.foreground_color);
    root.style.setProperty('--muted', cfg.muted_color);
    root.style.setProperty('--border', cfg.border_color);
    root.style.setProperty('--button', cfg.button_color);
    root.style.setProperty('--button-hover', cfg.button_hover_color);

    // Update document title & metadata
    if (cfg.meta_title || cfg.site_name) {
      document.title = cfg.meta_title || `${cfg.site_name} — Video Streaming Platform`;
    }

    // Update document favicon if custom favicon URL is provided
    if (cfg.favicon_url) {
      let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
      if (!link) {
        link = document.createElement('link');
        link.type = 'image/x-icon';
        link.rel = 'shortcut icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = cfg.favicon_url;
    }
  };

  const loadSettings = async () => {
    try {
      const data = await settingsService.getSiteSettings();
      setSettings(data);
      applyThemeToDOM(data);
    } catch (err) {
      console.warn('Failed to load site settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const updateSettings = async (newSettings: Partial<SiteSettings>): Promise<SiteSettings> => {
    const updated = await settingsService.updateSiteSettings(newSettings);
    setSettings(updated);
    applyThemeToDOM(updated);
    return updated;
  };

  const resetSettings = async () => {
    const resetData = await settingsService.resetSiteSettings();
    setSettings(resetData);
    applyThemeToDOM(resetData);
  };

  const refreshSettings = async () => {
    await loadSettings();
  };

  const mainLogoUrl = settings.main_logo_url;
  const headerLogoUrl = settings.header_logo_url || mainLogoUrl;
  const footerLogoUrl = settings.footer_logo_url || mainLogoUrl;
  const faviconUrl = settings.favicon_url;
  const siteName = settings.site_name || 'StreamVault';
  const siteShortName = settings.site_short_name || 'SV';
  const siteTagline = settings.site_tagline || '';
  const siteDescription = settings.site_description || '';
  const isMaintenanceMode = settings.maintenance_mode || false;

  return (
    <SiteSettingsContext.Provider
      value={{
        settings,
        loading,
        updateSettings,
        resetSettings,
        refreshSettings,
        siteName,
        siteShortName,
        siteTagline,
        siteDescription,
        headerLogoUrl,
        footerLogoUrl,
        mainLogoUrl,
        faviconUrl,
        isMaintenanceMode,
      }}
    >
      {children}
    </SiteSettingsContext.Provider>
  );
};

export const useSiteSettings = () => {
  const context = useContext(SiteSettingsContext);
  if (!context) {
    throw new Error('useSiteSettings must be used within a SiteSettingsProvider');
  }
  return context;
};
