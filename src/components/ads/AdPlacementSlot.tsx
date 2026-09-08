import React, { useEffect, useRef } from 'react';
import { useAdSense } from '../../contexts/AdSenseContext';
import { AdPlacementKey, AdSenseUnit } from '../../types';
import { DollarSign, ShieldAlert, Sparkles } from 'lucide-react';

interface AdPlacementSlotProps {
  placementKey: AdPlacementKey;
  previewMode?: boolean;
  overrideUnit?: AdSenseUnit | null;
  className?: string;
}

export const AdPlacementSlot: React.FC<AdPlacementSlotProps> = ({
  placementKey,
  previewMode = false,
  overrideUnit,
  className = '',
}) => {
  const { config, isAdSenseActive, getPlacement } = useAdSense();
  const adRef = useRef<HTMLDivElement>(null);

  const placement = getPlacement(placementKey);
  const activeUnit = overrideUnit || placement?.ad_unit;
  const isEnabled = previewMode || (isAdSenseActive && placement?.enabled && activeUnit && activeUnit.enabled);

  // Trigger adsbygoogle push on mount or when unit changes
  useEffect(() => {
    if (previewMode || !isEnabled || !activeUnit) return;

    try {
      if (typeof window !== 'undefined' && (window as any).adsbygoogle) {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      }
    } catch (err) {
      // AdSense push errors caught safely (e.g. adblocker or repeat render)
      console.debug('AdSense push caught safely:', err);
    }
  }, [previewMode, isEnabled, activeUnit]);

  // If not in preview mode and placement is disabled or missing unit, return null
  if (!isEnabled && !previewMode) {
    return null;
  }

  // 1. PREVIEW MODE (For Admin Live Preview)
  if (previewMode) {
    return (
      <div
        id={`ad-preview-${placementKey}`}
        className={`w-full my-4 p-4 rounded-2xl border-2 border-dashed border-emerald-500/40 bg-emerald-950/10 text-emerald-300 flex flex-col items-center justify-center text-center transition-all ${className}`}
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 font-bold text-[10px] uppercase tracking-wider">
            Ad Preview
          </span>
          <span className="text-xs font-semibold text-white">
            {placement?.name || placementKey}
          </span>
        </div>
        <p className="text-[11px] text-slate-400">
          Unit: <b className="text-slate-200">{activeUnit?.name || 'Default Responsive'}</b> &bull; Slot:{' '}
          <span className="font-mono text-emerald-400">{activeUnit?.ad_slot_id || '1234567890'}</span> &bull; Format:{' '}
          <span className="uppercase text-slate-300">{activeUnit?.format || 'auto'}</span>
        </p>
      </div>
    );
  }

  // 2. LIVE ADSENSE / CUSTOM AD CODE RENDERING
  const publisherId = config?.settings?.publisher_id || '';
  const slotId = activeUnit?.ad_slot_id || config?.settings?.ad_slot_id || '';

  if (!publisherId || !slotId) {
    return null;
  }

  return (
    <div
      ref={adRef}
      id={`ad-slot-${placementKey}`}
      className={`streamvault-ad-container w-full my-4 flex justify-center items-center overflow-hidden transition-all ${className}`}
      style={{ minHeight: '60px' }}
    >
      <ins
        className="adsbygoogle"
        style={{ display: 'block', width: '100%', textAlign: 'center' }}
        data-ad-client={publisherId}
        data-ad-slot={slotId}
        data-ad-format={activeUnit?.format || 'auto'}
        data-full-width-responsive={activeUnit?.responsive ? 'true' : 'false'}
      />
    </div>
  );
};
