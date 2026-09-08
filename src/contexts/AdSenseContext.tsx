import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AdSenseFullConfig, AdPlacementKey, AdPlacement } from '../types';
import { adService } from '../services/adService';

interface AdSenseContextValue {
  config: AdSenseFullConfig | null;
  loading: boolean;
  isAdSenseActive: boolean;
  getPlacement: (key: AdPlacementKey) => AdPlacement | undefined;
  reloadConfig: () => Promise<void>;
}

const AdSenseContext = createContext<AdSenseContextValue>({
  config: null,
  loading: true,
  isAdSenseActive: false,
  getPlacement: () => undefined,
  reloadConfig: async () => {},
});

export const AdSenseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<AdSenseFullConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchConfig = useCallback(async () => {
    try {
      const data = await adService.getAdSenseFullConfig();
      setConfig(data);
    } catch (err) {
      console.warn('Failed to load AdSense configuration:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  // Centralized Google AdSense Script Injector (Loads strictly once)
  useEffect(() => {
    if (!config) return;

    const { settings, placements } = config;
    const isPublisherValid = settings.publisher_id && settings.publisher_id.trim().startsWith('ca-pub-');
    const hasActivePlacement = placements.some((p) => p.enabled && p.ad_unit && p.ad_unit.enabled);

    // If disabled or missing credentials, do NOT inject script
    if (!settings.enabled || !isPublisherValid || !hasActivePlacement) {
      return;
    }

    const scriptId = 'streamvault-google-adsense-script';
    const existingScript = document.getElementById(scriptId);

    if (!existingScript) {
      try {
        const script = document.createElement('script');
        script.id = scriptId;
        script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${settings.publisher_id.trim()}`;
        script.async = true;
        script.crossOrigin = 'anonymous';
        script.onerror = (e) => {
          console.warn('AdSense script blocked or failed to load. Streaming platform remains unaffected.', e);
        };
        document.head.appendChild(script);
      } catch (e) {
        console.warn('AdSense script injection caught error:', e);
      }
    }
  }, [config]);

  const isAdSenseActive = Boolean(
    config &&
    config.settings.enabled &&
    config.settings.publisher_id &&
    config.settings.publisher_id.startsWith('ca-pub-')
  );

  const getPlacement = useCallback(
    (key: AdPlacementKey): AdPlacement | undefined => {
      if (!config) return undefined;
      return config.placements.find((p) => p.placement_key === key);
    },
    [config]
  );

  return (
    <AdSenseContext.Provider
      value={{
        config,
        loading,
        isAdSenseActive,
        getPlacement,
        reloadConfig: fetchConfig,
      }}
    >
      {children}
    </AdSenseContext.Provider>
  );
};

export const useAdSense = () => useContext(AdSenseContext);
