import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { AdsterraFullConfig, AdsterraPlacement, AdsterraStatus } from '../types';
import { adsterraService } from '../services/adsterraService';

interface AdsterraContextValue {
  config: AdsterraFullConfig | null;
  loading: boolean;
  isAdsterraActive: boolean;
  status: AdsterraStatus;
  getPlacement: (key: string) => AdsterraPlacement | undefined;
  reloadConfig: () => Promise<void>;
}

const AdsterraContext = createContext<AdsterraContextValue>({
  config: null,
  loading: true,
  isAdsterraActive: false,
  status: 'disabled',
  getPlacement: () => undefined,
  reloadConfig: async () => {},
});

export const AdsterraProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<AdsterraFullConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchConfig = useCallback(async () => {
    try {
      const data = await adsterraService.getFullConfig();
      setConfig(data);
    } catch (err) {
      console.warn('Failed loading Adsterra ad configuration:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  // Real computed status
  const status: AdsterraStatus = useMemo(() => {
    if (!config) return 'disabled';
    return adsterraService.calculateStatus(config.settings, config.units, config.placements);
  }, [config]);

  // Master switch ON/OFF
  const isAdsterraActive = Boolean(config?.settings?.enabled);

  // 1. DYNAMIC VERIFICATION META TAG INJECTION
  useEffect(() => {
    const metaTagId = 'streamvault-adsterra-verification-meta';
    const existingMeta = document.getElementById(metaTagId);

    // If verification method is meta and we have code
    if (
      config?.settings?.verification_method === 'meta' &&
      config?.settings?.verification_code?.trim()
    ) {
      let contentVal = config.settings.verification_code.trim();

      // If Admin pasted a full <meta ...> tag, extract the content attribute safely
      const match = contentVal.match(/content=["']([^"']+)["']/i);
      if (match && match[1]) {
        contentVal = match[1];
      } else {
        // Strip any residual brackets
        contentVal = contentVal.replace(/<[^>]*>/g, '').trim();
      }

      if (existingMeta) {
        existingMeta.setAttribute('content', contentVal);
      } else {
        const meta = document.createElement('meta');
        meta.id = metaTagId;
        meta.name = 'adsterra-verification';
        meta.content = contentVal;
        document.head.appendChild(meta);
      }
    } else {
      if (existingMeta) {
        existingMeta.remove();
      }
    }
  }, [config?.settings?.verification_method, config?.settings?.verification_code]);

  // 2. SOCIAL BAR / POPUNDER SCRIPT INJECTION (If configured, enabled & master switch ON)
  useEffect(() => {
    if (!isAdsterraActive || !config) {
      // Clean up any global scripts if Adsterra was turned OFF
      document.querySelectorAll('[data-adsterra-global="true"]').forEach((el) => el.remove());
      return;
    }

    // Find any active social bar or popunder units attached to enabled placements
    const globalPlacements = config.placements.filter(
      (p) =>
        p.enabled &&
        p.ad_unit &&
        p.ad_unit.enabled &&
        (p.ad_unit.format === 'social_bar' || p.ad_unit.format === 'popunder') &&
        p.ad_unit.code.trim().length > 0
    );

    globalPlacements.forEach((placement) => {
      const unit = placement.ad_unit!;
      const scriptKey = `adst-global-${unit.id}`;
      if (document.getElementById(scriptKey)) return;

      try {
        // Extract script src if present, or evaluate inline script
        const srcMatch = unit.code.match(/src=["']([^"']+)["']/i);
        if (srcMatch && srcMatch[1]) {
          const s = document.createElement('script');
          s.id = scriptKey;
          s.dataset.adsterraGlobal = 'true';
          s.src = srcMatch[1];
          s.async = true;
          s.onerror = (e) => console.warn('Adsterra global ad script encountered load issue:', e);
          document.body.appendChild(s);
        }
      } catch (err) {
        console.warn('Adsterra global ad runner caught error safely:', err);
      }
    });
  }, [isAdsterraActive, config]);

  const getPlacement = useCallback(
    (key: string): AdsterraPlacement | undefined => {
      if (!config) return undefined;
      return config.placements.find((p) => p.placement_key === key);
    },
    [config]
  );

  return (
    <AdsterraContext.Provider
      value={{
        config,
        loading,
        isAdsterraActive,
        status,
        getPlacement,
        reloadConfig: fetchConfig,
      }}
    >
      {children}
    </AdsterraContext.Provider>
  );
};

export const useAdsterra = () => useContext(AdsterraContext);
