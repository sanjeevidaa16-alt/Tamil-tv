import React, { useEffect, useRef, useState } from 'react';
import { useAdsterra } from '../../contexts/AdsterraContext';
import { AdsterraAdUnit } from '../../types';
import { ExternalLink, Sparkles } from 'lucide-react';

interface AdsterraSlotProps {
  placementKey: string;
  previewMode?: boolean;
  overrideUnit?: AdsterraAdUnit | null;
  className?: string;
}

export const AdsterraSlot: React.FC<AdsterraSlotProps> = ({
  placementKey,
  previewMode = false,
  overrideUnit,
  className = '',
}) => {
  const { config, isAdsterraActive, getPlacement } = useAdsterra();
  const containerRef = useRef<HTMLDivElement>(null);
  const [renderError, setRenderError] = useState(false);

  const placement = getPlacement(placementKey);
  const activeUnit = overrideUnit || placement?.ad_unit;

  // Conditions to render:
  // 1. Preview mode: render if overrideUnit or placement has activeUnit
  // 2. Public mode: Master switch must be ON, placement must be enabled, unit must be enabled and have non-empty code
  const isPublicActive =
    isAdsterraActive &&
    Boolean(placement?.enabled) &&
    Boolean(activeUnit?.enabled) &&
    Boolean(activeUnit?.code?.trim());

  const shouldRender = previewMode ? Boolean(activeUnit) : isPublicActive;

  // Safe script runner for the ad snippet
  useEffect(() => {
    if (!shouldRender || !activeUnit || !activeUnit.code?.trim()) {
      return;
    }

    // If unit is global social_bar or popunder, it is handled globally by AdsterraProvider
    if (activeUnit.format === 'social_bar' || activeUnit.format === 'popunder') {
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    try {
      setRenderError(false);
      container.innerHTML = '';

      const rawCode = activeUnit.code.trim();

      // If code contains <script> tags or atOptions, execute them safely via an isolated iframe
      // This prevents document.write from wiping the SPA and isolates ad code from React
      const hasScriptTag = /<script\b[^>]*>([\s\S]*?)<\/script>/i.test(rawCode);
      const isSmartlink = activeUnit.format === 'smartlink' || rawCode.startsWith('http');

      if (isSmartlink) {
        // Render smartlink container
        const link = document.createElement('a');
        link.href = activeUnit.smartlink_url || rawCode;
        link.target = '_blank';
        link.rel = 'noopener noreferrer nofollow';
        link.className =
          'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 text-white font-bold text-xs shadow-md hover:opacity-90 transition-opacity';
        link.innerHTML = `<span>Sponsored Destination</span> <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>`;
        container.appendChild(link);
      } else if (hasScriptTag) {
        // Sandboxed responsive iframe
        const iframe = document.createElement('iframe');
        iframe.style.width = '100%';
        iframe.style.border = 'none';
        iframe.style.overflow = 'hidden';
        iframe.style.minHeight = '90px';
        iframe.setAttribute('scrolling', 'no');
        iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups allow-forms');

        container.appendChild(iframe);

        const doc = iframe.contentWindow?.document || iframe.contentDocument;
        if (doc) {
          doc.open();
          doc.write(`
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8" />
                <style>
                  body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; background: transparent; }
                </style>
              </head>
              <body>
                ${rawCode}
                <script>
                  // Auto-adjust iframe height to match ad content
                  window.addEventListener('load', function() {
                    try {
                      var h = document.body.scrollHeight;
                      if (h > 20) {
                        window.frameElement.style.height = h + 'px';
                      }
                    } catch(e) {}
                  });
                </script>
              </body>
            </html>
          `);
          doc.close();
        }
      } else {
        // Plain HTML / banner markup
        const wrapper = document.createElement('div');
        wrapper.className = 'w-full flex justify-center items-center';
        wrapper.innerHTML = rawCode;
        container.appendChild(wrapper);
      }
    } catch (err) {
      console.warn('Adsterra ad runner error handled safely:', err);
      setRenderError(true);
    }
  }, [shouldRender, activeUnit?.code, activeUnit?.format, previewMode]);

  // If public and not active, render nothing
  if (!shouldRender) {
    return null;
  }

  // 1. PREVIEW MODE (For Admin UI)
  if (previewMode) {
    return (
      <div
        id={`adsterra-preview-${placementKey}`}
        className={`w-full my-3 p-4 rounded-2xl border-2 border-dashed border-rose-500/40 bg-rose-950/15 text-rose-300 flex flex-col items-center justify-center text-center transition-all ${className}`}
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 font-bold text-[10px] uppercase tracking-wider">
            Adsterra Preview
          </span>
          <span className="text-xs font-bold text-white">
            {placement?.name || placementKey}
          </span>
        </div>

        <p className="text-[11px] text-slate-400">
          Unit: <b className="text-slate-200">{activeUnit?.name || 'Unassigned Unit'}</b> &bull; Format:{' '}
          <span className="uppercase text-rose-300 font-semibold">{activeUnit?.format || 'banner'}</span>
        </p>

        {activeUnit?.code?.trim() ? (
          <div className="w-full mt-3 pt-3 border-t border-rose-900/40">
            <div ref={containerRef} className="adsterra-slot w-full flex justify-center items-center overflow-hidden" />
          </div>
        ) : (
          <p className="text-[11px] text-amber-400/80 italic mt-2">
            No Adsterra code configured for this unit yet. Paste real code in the Ad Units manager.
          </p>
        )}
      </div>
    );
  }

  // 2. PUBLIC ADSTERRA RENDERER
  if (renderError) {
    return null; // Silent graceful failure: zero disruption to user experience
  }

  return (
    <div
      id={`adsterra-slot-${placementKey}`}
      className={`adsterra-slot w-full my-3 flex justify-center items-center overflow-hidden transition-all ${className}`}
      style={{ minHeight: activeUnit?.code ? '60px' : '0px' }}
    >
      <div ref={containerRef} className="w-full flex justify-center items-center" />
    </div>
  );
};
