import React from 'react';
import {
  Layers,
  Sparkles,
  Check,
  Maximize2,
  Minimize2,
  Box,
  Flame,
  Zap,
  Sliders,
  Tv,
} from 'lucide-react';
import { UI_STYLE_PRESETS } from '../../data/themes';
import { SiteSettings } from '../../types';
import { UIStyleId } from '../../types/theme';

interface UIDesignSettingsProps {
  formData: SiteSettings;
  onChange: (updated: Partial<SiteSettings>) => void;
}

export const UIDesignSettings: React.FC<UIDesignSettingsProps> = ({ formData, onChange }) => {
  const currentUIStyle = formData.ui_style || 'modern-minimal';

  const handleSelectUIStyle = (styleId: UIStyleId) => {
    const matched = UI_STYLE_PRESETS.find((s) => s.id === styleId);
    if (!matched) return;

    onChange({
      ui_style: styleId,
      glass_effect: matched.glassEffect,
    });
  };

  return (
    <div className="space-y-8">
      {/* 1. Curated UI Styles Grid */}
      <div className="space-y-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-rose-400" />
            <span>10 Curated UI Design Systems</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Switch between comprehensive design languages controlling card elevation, corner curvature, specular reflections, and border treatments.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {UI_STYLE_PRESETS.map((preset) => {
            const isSelected = currentUIStyle === preset.id;

            return (
              <div
                key={preset.id}
                id={`ui-style-card-${preset.id}`}
                onClick={() => handleSelectUIStyle(preset.id)}
                className={`p-4 border transition-all cursor-pointer flex flex-col justify-between overflow-hidden relative ${
                  isSelected
                    ? 'bg-slate-900 border-rose-500 shadow-xl shadow-rose-950/40 ring-2 ring-rose-500/50'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90'
                }`}
                style={{
                  borderRadius: preset.cardRadius,
                }}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>{preset.name}</span>
                    </h4>
                    {isSelected ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                        <Check className="w-3 h-3" /> Active
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-slate-400 px-2 py-0.5 rounded bg-slate-800/80">
                        Select
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed mb-4 min-h-[32px]">
                    {preset.tagline}
                  </p>

                  {/* Visual Style Preview Tile */}
                  <div
                    className="p-3 border mb-3 flex items-center justify-between"
                    style={{
                      borderRadius: preset.cardRadius,
                      boxShadow: preset.cardShadow,
                      background: preset.glassEffect ? 'rgba(255, 255, 255, 0.05)' : '#07080c',
                      borderColor: isSelected ? 'var(--color-primary, #e11d48)' : 'rgba(255, 255, 255, 0.1)',
                      backdropFilter: preset.backdropBlur !== '0px' ? `blur(${preset.backdropBlur})` : undefined,
                    }}
                  >
                    <div className="space-y-1">
                      <div className="w-16 h-1.5 rounded-full bg-slate-400/80" />
                      <div className="w-10 h-1 rounded-full bg-slate-600" />
                    </div>

                    <div
                      className="px-2.5 py-1 text-[9px] font-bold text-white shadow-sm flex items-center gap-1"
                      style={{
                        borderRadius: preset.buttonRadius,
                        backgroundColor: 'var(--color-primary, #e11d48)',
                      }}
                    >
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>Action</span>
                    </div>
                  </div>
                </div>

                {/* Footer specs tag */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                  <span>Radius: {preset.cardRadius}</span>
                  <span className="capitalize">{preset.playerStyle} Player</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Fine-Tuning Geometric Parameters */}
      <div className="p-6 rounded-3xl bg-[#11131c] border border-slate-800 space-y-6">
        <div className="border-b border-slate-800 pb-4">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-rose-400" />
            <span>Fine-Tune Geometry & Surface Physics</span>
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Independently calibrate border curvature, elevation depth, layout density, and motion transitions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Border Radius Scale */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Border Radius Scale
            </label>
            <div className="grid grid-cols-5 gap-2">
              {(
                [
                  { id: 'sharp', label: 'Sharp', val: '0px' },
                  { id: 'small', label: 'Small', val: '6px' },
                  { id: 'medium', label: 'Medium', val: '14px' },
                  { id: 'large', label: 'Large', val: '22px' },
                  { id: 'pill', label: 'Pill', val: 'Full' },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onChange({ border_radius_scale: item.id })}
                  className={`p-2 rounded-xl text-center border transition-all ${
                    (formData.border_radius_scale || 'medium') === item.id
                      ? 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-950/40'
                      : 'bg-slate-900 text-slate-400 hover:text-white border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <p className="text-xs font-bold">{item.label}</p>
                  <p className="text-[9px] opacity-75">{item.val}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Elevation Shadow Strength */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Elevation & Shadow Depth
            </label>
            <div className="grid grid-cols-5 gap-2">
              {(
                [
                  { id: 'none', label: 'Flat', desc: '0px' },
                  { id: 'subtle', label: 'Subtle', desc: 'Low' },
                  { id: 'medium', label: 'Medium', desc: 'Norm' },
                  { id: 'strong', label: 'Deep', desc: 'High' },
                  { id: 'glow', label: 'Glow', desc: 'Neon' },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onChange({ card_shadow_strength: item.id })}
                  className={`p-2 rounded-xl text-center border transition-all ${
                    (formData.card_shadow_strength || 'medium') === item.id
                      ? 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-950/40'
                      : 'bg-slate-900 text-slate-400 hover:text-white border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <p className="text-xs font-bold">{item.label}</p>
                  <p className="text-[9px] opacity-75">{item.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Spacing & Information Density */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Layout Density & Spacing
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: 'compact', label: 'Compact Density', sub: 'High data volume' },
                  { id: 'comfortable', label: 'Comfortable', sub: 'Optimal balance' },
                  { id: 'spacious', label: 'Spacious / Cinema', sub: 'Generous negative space' },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onChange({ spacing_density: item.id })}
                  className={`p-2.5 rounded-xl text-left border transition-all ${
                    (formData.spacing_density || 'comfortable') === item.id
                      ? 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-950/40'
                      : 'bg-slate-900 text-slate-400 hover:text-white border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <p className="text-xs font-bold">{item.label}</p>
                  <p className="text-[10px] opacity-80 mt-0.5">{item.sub}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Animation & Micro-Interactions */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Motion & Transitions
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(
                [
                  { id: 'none', label: 'Off', sub: 'Reduced' },
                  { id: 'subtle', label: 'Subtle', sub: '150ms' },
                  { id: 'normal', label: 'Normal', sub: '250ms' },
                  { id: 'enhanced', label: 'Cinema', sub: 'Spring' },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onChange({ animation_level: item.id })}
                  className={`p-2.5 rounded-xl text-center border transition-all ${
                    (formData.animation_level || 'normal') === item.id
                      ? 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-950/40'
                      : 'bg-slate-900 text-slate-400 hover:text-white border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <p className="text-xs font-bold">{item.label}</p>
                  <p className="text-[9px] opacity-80 mt-0.5">{item.sub}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Glassmorphic backdrop blur toggle */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-white block">Glassmorphism Frosted Translucency</span>
            <span className="text-[11px] text-slate-400 block">
              Enables real frosted backdrop blur (backdrop-filter: blur(16px)) on cards, header, and player overlay panels.
            </span>
          </div>

          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={formData.glass_effect || false}
              onChange={(e) => onChange({ glass_effect: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
          </label>
        </div>
      </div>
    </div>
  );
};
