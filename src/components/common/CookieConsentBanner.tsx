import React, { useState, useEffect } from 'react';
import { ShieldCheck, Check, X, Info } from 'lucide-react';
import { useAnalytics } from '../../contexts/AnalyticsContext';

export const CookieConsentBanner: React.FC = () => {
  const { settings, consent, setConsent } = useAnalytics();
  const [visible, setVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (settings.enabled && settings.respect_consent) {
      const stored = localStorage.getItem('STREAMVAULT_ANALYTICS_CONSENT');
      if (stored === null) {
        // Delay showing banner slightly for smooth entering experience
        const t = setTimeout(() => setVisible(true), 1200);
        return () => clearTimeout(t);
      }
    } else {
      setVisible(false);
    }
  }, [settings.enabled, settings.respect_consent]);

  if (!visible) return null;

  const handleAcceptAll = () => {
    setConsent(true);
    setVisible(false);
  };

  const handleRejectAll = () => {
    setConsent(false);
    setVisible(false);
  };

  return (
    <div
      id="ga4-consent-banner"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 p-4 sm:p-5 rounded-2xl bg-[#0f111a]/95 backdrop-blur-xl border border-slate-800 shadow-2xl shadow-black/80 text-slate-200 animate-in fade-in slide-in-from-bottom-4 duration-300"
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div className="space-y-1.5 flex-1">
          <h4 className="text-xs font-bold text-white tracking-wide flex items-center gap-1.5">
            Privacy & Analytics Preferences
          </h4>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            We use Google Analytics 4 to understand audience viewing trends and optimize playback performance without collecting passwords, emails, or sensitive personal data.
          </p>

          {showPreferences && (
            <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-2 text-[11px]">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="font-medium text-slate-300">Essential Video Playback</span>
                <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                  Required
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="font-medium text-slate-300">Google Analytics 4 Measurement</span>
                <span className="text-[10px] uppercase font-semibold text-rose-400">
                  Optional
                </span>
              </div>
            </div>
          )}

          <div className="pt-3 flex flex-wrap items-center gap-2">
            <button
              onClick={handleAcceptAll}
              className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md shadow-rose-900/30 transition-all flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Accept Analytics</span>
            </button>

            <button
              onClick={handleRejectAll}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-all"
            >
              Reject / Essential Only
            </button>

            <button
              onClick={() => setShowPreferences(!showPreferences)}
              className="text-[11px] text-slate-400 hover:text-slate-200 underline ml-auto"
            >
              {showPreferences ? 'Hide Info' : 'Preferences'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
