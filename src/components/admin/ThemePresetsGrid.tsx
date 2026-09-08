import React, { useState } from 'react';
import { Check, Sparkles, Eye } from 'lucide-react';
import { EXTENDED_THEME_PRESETS } from '../../data/themes';
import { ExtendedThemePreset } from '../../types/theme';

interface ThemePresetsGridProps {
  selectedThemeName: string;
  onSelectPreset: (preset: ExtendedThemePreset) => void;
  onPreviewPreset?: (preset: ExtendedThemePreset) => void;
}

export const ThemePresetsGrid: React.FC<ThemePresetsGridProps> = ({
  selectedThemeName,
  onSelectPreset,
  onPreviewPreset,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('All');

  const categories = ['All', 'Cinematic', 'Cyber', 'Vibrant', 'Minimal', 'Opulent'];

  const filteredPresets =
    activeCategory === 'All'
      ? EXTENDED_THEME_PRESETS
      : EXTENDED_THEME_PRESETS.filter((p) => p.category === activeCategory);

  return (
    <div className="space-y-6">
      {/* Category Filter Pills */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-slate-400 mr-1">Filter Style:</span>
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
              activeCategory === cat
                ? 'bg-rose-600 text-white shadow-md shadow-rose-900/40 ring-1 ring-rose-400/40'
                : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid of 15 Themes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPresets.map((preset) => {
          const isSelected = selectedThemeName.toLowerCase() === preset.name.toLowerCase();
          const { tokens } = preset;

          return (
            <div
              key={preset.id}
              id={`preset-card-${preset.id}`}
              onClick={() => onSelectPreset(preset)}
              className={`group relative p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between overflow-hidden ${
                isSelected
                  ? 'border-rose-500 shadow-xl shadow-rose-950/40 ring-2 ring-rose-500/50'
                  : 'border-slate-800/90 hover:border-slate-700 hover:scale-[1.01]'
              }`}
              style={{
                backgroundColor: tokens.surface,
              }}
            >
              <div>
                {/* Header: Name + Badge */}
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: tokens.primary }}
                    />
                    <h4 className="text-xs font-bold truncate" style={{ color: tokens.text }}>
                      {preset.name}
                    </h4>
                  </div>

                  <span
                    className="text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full border"
                    style={{
                      backgroundColor: tokens.surfaceSecondary,
                      color: tokens.textSecondary,
                      borderColor: tokens.border,
                    }}
                  >
                    {preset.category}
                  </span>
                </div>

                <p
                  className="text-[11px] line-clamp-2 min-h-[32px] leading-relaxed mb-3"
                  style={{ color: tokens.textMuted }}
                >
                  {preset.description}
                </p>

                {/* Mini Visual UI Mockup */}
                <div
                  className="p-2.5 rounded-xl border mb-3 space-y-2"
                  style={{
                    backgroundColor: tokens.background,
                    borderColor: tokens.border,
                  }}
                >
                  {/* Mini Header */}
                  <div
                    className="flex items-center justify-between px-2 py-1 rounded-lg"
                    style={{ backgroundColor: tokens.surface }}
                  >
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded" style={{ backgroundColor: tokens.primary }} />
                      <div
                        className="w-12 h-1.5 rounded-full"
                        style={{ backgroundColor: tokens.textSecondary }}
                      />
                    </div>
                    <div
                      className="px-2 py-0.5 rounded text-[8px] font-bold"
                      style={{
                        backgroundColor: tokens.buttonBg,
                        color: tokens.buttonText,
                      }}
                    >
                      Stream
                    </div>
                  </div>

                  {/* Mini Scrubber / Card representation */}
                  <div
                    className="p-2 rounded-lg border flex items-center justify-between gap-2"
                    style={{
                      backgroundColor: tokens.surfaceSecondary,
                      borderColor: tokens.border,
                    }}
                  >
                    <div className="flex-1 space-y-1">
                      <div
                        className="w-20 h-1.5 rounded-full"
                        style={{ backgroundColor: tokens.text }}
                      />
                      <div
                        className="w-12 h-1 rounded-full"
                        style={{ backgroundColor: tokens.textMuted }}
                      />
                    </div>

                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 shadow-sm"
                      style={{
                        backgroundColor: tokens.primary,
                        color: tokens.primaryForeground,
                      }}
                    >
                      <Sparkles className="w-2.5 h-2.5" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Row: Swatches & Selection Status */}
              <div
                className="pt-2.5 border-t flex items-center justify-between"
                style={{ borderColor: tokens.border }}
              >
                {/* 5 Color Dot Swatches */}
                <div className="flex items-center gap-1">
                  <div
                    className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
                    style={{ backgroundColor: tokens.primary }}
                    title={`Primary: ${tokens.primary}`}
                  />
                  <div
                    className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
                    style={{ backgroundColor: tokens.secondary }}
                    title={`Secondary: ${tokens.secondary}`}
                  />
                  <div
                    className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
                    style={{ backgroundColor: tokens.accent }}
                    title={`Accent: ${tokens.accent}`}
                  />
                  <div
                    className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
                    style={{ backgroundColor: tokens.background }}
                    title={`Background: ${tokens.background}`}
                  />
                  <div
                    className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
                    style={{ backgroundColor: tokens.border }}
                    title={`Border: ${tokens.border}`}
                  />
                </div>

                {isSelected ? (
                  <span
                    className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border"
                    style={{
                      backgroundColor: tokens.primary,
                      color: tokens.primaryForeground,
                      borderColor: tokens.primary,
                    }}
                  >
                    <Check className="w-3 h-3" /> Active
                  </span>
                ) : (
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded transition-colors group-hover:underline"
                    style={{ color: tokens.primary }}
                  >
                    Apply Theme
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
