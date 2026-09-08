import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  AnalyticsSettings,
  AnalyticsConnectionStatus,
  AnalyticsTestResult,
  VideoAnalyticsParams,
} from '../types/analytics';
import { analyticsService, DEFAULT_ANALYTICS_SETTINGS } from '../services/analyticsService';
import { settingsService } from '../services/settingsService';

interface AnalyticsContextValue {
  settings: AnalyticsSettings;
  status: AnalyticsConnectionStatus;
  loading: boolean;
  consent: boolean;
  setConsent: (granted: boolean) => void;
  updateSettings: (newSettings: Partial<AnalyticsSettings>) => Promise<AnalyticsSettings>;
  testConnection: (customSettings?: AnalyticsSettings) => Promise<AnalyticsTestResult>;
  disableAnalytics: () => Promise<void>;
  // Direct tracking helpers
  trackPageView: (path: string, title?: string, isInternal?: boolean) => void;
  trackVideoImpression: (video: VideoAnalyticsParams) => void;
  trackVideoOpen: (video: VideoAnalyticsParams) => void;
  trackVideoPlay: (video: VideoAnalyticsParams, position?: number, duration?: number) => void;
  trackVideoPause: (video: VideoAnalyticsParams, position?: number, duration?: number) => void;
  trackVideoResume: (video: VideoAnalyticsParams, position?: number, duration?: number) => void;
  trackVideoMilestone: (milestone: 25 | 50 | 75 | 90, video: VideoAnalyticsParams, position: number, duration: number) => void;
  trackVideoComplete: (video: VideoAnalyticsParams, duration?: number) => void;
  trackVideoSeek: (video: VideoAnalyticsParams, fromSec: number, toSec: number) => void;
  trackVideoFullscreen: (video: VideoAnalyticsParams, isFullscreen: boolean) => void;
  trackVideoMute: (video: VideoAnalyticsParams, isMuted: boolean) => void;
  trackVideoSpeedChange: (video: VideoAnalyticsParams, speed: number) => void;
  trackSearch: (term: string, count: number) => void;
  trackFilter: (name: string, value: string) => void;
  trackCategoryView: (id: string, name: string) => void;
  trackAuth: (type: 'login' | 'sign_up' | 'logout', method?: string) => void;
  trackClick: (action: string, metadata?: Record<string, any>) => void;
}

const AnalyticsContext = createContext<AnalyticsContextValue | undefined>(undefined);

export const AnalyticsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AnalyticsSettings>(DEFAULT_ANALYTICS_SETTINGS);
  const [status, setStatus] = useState<AnalyticsConnectionStatus>('NOT_CONFIGURED');
  const [loading, setLoading] = useState(true);
  const [consent, setConsentState] = useState<boolean>(() => analyticsService.getConsent());

  const applyAndSetStatus = useCallback((cfg: AnalyticsSettings) => {
    const computedStatus = analyticsService.initialize(cfg);
    setStatus(computedStatus);
  }, []);

  useEffect(() => {
    let mounted = true;
    async function loadSettings() {
      try {
        const loaded = await settingsService.getAnalyticsSettings();
        if (!mounted) return;
        setSettings(loaded);
        applyAndSetStatus(loaded);
      } catch (err) {
        console.warn('[GA4] Failed to load settings from storage:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadSettings();
    return () => {
      mounted = false;
    };
  }, [applyAndSetStatus]);

  const updateSettings = async (newSettings: Partial<AnalyticsSettings>): Promise<AnalyticsSettings> => {
    const updated = await settingsService.updateAnalyticsSettings(newSettings);
    setSettings(updated);
    applyAndSetStatus(updated);
    return updated;
  };

  const testConnection = async (customSettings?: AnalyticsSettings): Promise<AnalyticsTestResult> => {
    const res = await analyticsService.testConnection(customSettings || settings);
    setStatus(res.status);
    return res;
  };

  const disableAnalytics = async () => {
    await updateSettings({ enabled: false });
    analyticsService.teardown();
    setStatus(settings.ga_measurement_id ? 'DISABLED' : 'NOT_CONFIGURED');
  };

  const setConsent = (granted: boolean) => {
    analyticsService.setConsent(granted);
    setConsentState(granted);
  };

  const value: AnalyticsContextValue = {
    settings,
    status,
    loading,
    consent,
    setConsent,
    updateSettings,
    testConnection,
    disableAnalytics,
    trackPageView: (path, title, isInternal) => analyticsService.trackPageView(path, title, isInternal),
    trackVideoImpression: (video) => analyticsService.trackVideoImpression(video),
    trackVideoOpen: (video) => analyticsService.trackVideoOpen(video),
    trackVideoPlay: (video, pos, dur) => analyticsService.trackVideoPlay(video, pos, dur),
    trackVideoPause: (video, pos, dur) => analyticsService.trackVideoPause(video, pos, dur),
    trackVideoResume: (video, pos, dur) => analyticsService.trackVideoResume(video, pos, dur),
    trackVideoMilestone: (m, video, pos, dur) => analyticsService.trackVideoMilestone(m, video, pos, dur),
    trackVideoComplete: (video, dur) => analyticsService.trackVideoComplete(video, dur),
    trackVideoSeek: (video, fromSec, toSec) => analyticsService.trackVideoSeek(video, fromSec, toSec),
    trackVideoFullscreen: (video, fs) => analyticsService.trackVideoFullscreen(video, fs),
    trackVideoMute: (video, m) => analyticsService.trackVideoMute(video, m),
    trackVideoSpeedChange: (video, sp) => analyticsService.trackVideoSpeedChange(video, sp),
    trackSearch: (term, count) => analyticsService.trackSearch(term, count),
    trackFilter: (name, value) => analyticsService.trackFilter(name, value),
    trackCategoryView: (id, name) => analyticsService.trackCategoryView(id, name),
    trackAuth: (type, method) => analyticsService.trackAuth(type, method),
    trackClick: (action, meta) => analyticsService.trackClick(action, meta),
  };

  return <AnalyticsContext.Provider value={value}>{children}</AnalyticsContext.Provider>;
};

export const useAnalytics = (): AnalyticsContextValue => {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
};
