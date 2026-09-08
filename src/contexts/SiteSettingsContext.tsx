import React, { createContext, useContext, useState, useEffect } from 'react';
import { SiteSettings } from '../types';
import { settingsService } from '../services/settingsService';
import { DEFAULT_SITE_SETTINGS_CONFIG, EXTENDED_THEME_PRESETS } from '../data/themes';
import { applyThemeToDOM as applyTokensToRoot, deriveCompleteTokens } from '../utils/themeEngine';
import { ThemeTokens, UIStyleId } from '../types/theme';

interface SiteSettingsContextType {
  settings: SiteSettings;
  loading: boolean;
  updateSettings: (newSettings: Partial<SiteSettings>) => Promise<SiteSettings>;
  resetSettings: () => Promise<void>;
  refreshSettings: () => Promise<void>;
  applyPreviewTheme: (previewConfig: Partial<SiteSettings>) => void;
  revertPreviewTheme: () => void;
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

  const applyTheme = (cfg: SiteSettings) => {
    if (typeof document === 'undefined') return;

    // Try finding matching extended theme preset or derive complete tokens
    const matchedPreset = EXTENDED_THEME_PRESETS.find(
      (p) => p.name.toLowerCase() === (cfg.theme_name || '').toLowerCase()
    );

    const tokens: ThemeTokens = matchedPreset
      ? {
          ...matchedPreset.tokens,
          primary: cfg.primary_color || matchedPreset.tokens.primary,
          secondary: cfg.secondary_color || matchedPreset.tokens.secondary,
          accent: cfg.accent_color || matchedPreset.tokens.accent,
          background: cfg.background_color || matchedPreset.tokens.background,
          surface: cfg.surface_color || matchedPreset.tokens.surface,
          text: cfg.text_color || cfg.foreground_color || matchedPreset.tokens.text,
          border: cfg.border_color || matchedPreset.tokens.border,
          buttonBg: cfg.button_color || matchedPreset.tokens.buttonBg,
          buttonHover: cfg.button_hover_color || matchedPreset.tokens.buttonHover,
          cardBg: cfg.card_bg_color || cfg.surface_color || matchedPreset.tokens.cardBg,
          cardBorder: cfg.card_border_color || cfg.border_color || matchedPreset.tokens.cardBorder,
          inputBg: cfg.input_bg_color || matchedPreset.tokens.inputBg,
          inputBorder: cfg.input_border_color || matchedPreset.tokens.inputBorder,
          playerBg: cfg.player_bg_color || matchedPreset.tokens.playerBg,
          playerProgress: cfg.player_progress_color || cfg.primary_color || matchedPreset.tokens.playerProgress,
        }
      : deriveCompleteTokens({
          primary: cfg.primary_color,
          secondary: cfg.secondary_color,
          accent: cfg.accent_color,
          background: cfg.background_color,
          surface: cfg.surface_color,
          text: cfg.text_color || cfg.foreground_color,
          border: cfg.border_color,
          buttonBg: cfg.button_color,
          buttonHover: cfg.button_hover_color,
          cardBg: cfg.card_bg_color,
          cardBorder: cfg.card_border_color,
          inputBg: cfg.input_bg_color,
          inputBorder: cfg.input_border_color,
          playerBg: cfg.player_bg_color,
          playerProgress: cfg.player_progress_color,
        });

    const activeUIStyle: UIStyleId = (cfg.ui_style as UIStyleId) || 'modern-minimal';

    applyTokensToRoot(tokens, cfg.theme_name || 'custom', activeUIStyle, {
      borderRadiusScale: cfg.border_radius_scale,
      shadowStrength: cfg.card_shadow_strength,
      spacingDensity: cfg.spacing_density,
      fontScale: cfg.font_scale,
      animationLevel: cfg.animation_level,
      glassEffect: cfg.glass_effect,
    });

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
      applyTheme(data);
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
    applyTheme(updated);
    return updated;
  };

  const resetSettings = async () => {
    const resetData = await settingsService.resetSiteSettings();
    setSettings(resetData);
    applyTheme(resetData);
  };

  const refreshSettings = async () => {
    await loadSettings();
  };

  const applyPreviewTheme = (previewConfig: Partial<SiteSettings>) => {
    const merged = { ...settings, ...previewConfig };
    applyTheme(merged);
  };

  const revertPreviewTheme = () => {
    applyTheme(settings);
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
        applyPreviewTheme,
        revertPreviewTheme,
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
