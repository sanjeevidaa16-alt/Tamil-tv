import React from 'react';
import {
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Wand2,
  ShieldCheck,
  Palette,
  Info,
} from 'lucide-react';
import { SiteSettings } from '../../types';
import { evaluateContrast, deriveCompleteTokens } from '../../utils/themeEngine';

interface CustomThemeBuilderProps {
  formData: SiteSettings;
  onChange: (updated: Partial<SiteSettings>) => void;
  onAutoDerive?: () => void;
}

export const CustomThemeBuilder: React.FC<CustomThemeBuilderProps> = ({
  formData,
  onChange,
}) => {
  // WCAG evaluations
  const bgContrast = evaluateContrast(formData.text_color || formData.foreground_color || '#ffffff', formData.background_color || '#07080c');
  const surfaceContrast = evaluateContrast(formData.text_color || formData.foreground_color || '#ffffff', formData.surface_color || '#11131c');
  const buttonContrast = evaluateContrast(formData.button_color ? '#ffffff' : '#ffffff', formData.button_color || formData.primary_color || '#e11d48');
  const primaryOnBg = evaluateContrast(formData.primary_color || '#e11d48', formData.background_color || '#07080c');

  const handleColorChange = (field: keyof SiteSettings, value: string) => {
    onChange({
      [field]: value,
      theme_name: 'Custom',
    });
  };

  const handleAutoDerivePalette = () => {
    const derived = deriveCompleteTokens({
      primary: formData.primary_color,
      background: formData.background_color,
      surface: formData.surface_color,
    });

    onChange({
      theme_name: 'Custom',
      primary_color: derived.primary,
      secondary_color: derived.secondary,
      accent_color: derived.accent,
      background_color: derived.background,
      surface_color: derived.surface,
      surface_secondary_color: derived.surfaceSecondary,
      surface_tertiary_color: derived.surfaceTertiary,
      card_bg_color: derived.cardBg,
      card_border_color: derived.cardBorder,
      text_color: derived.text,
      foreground_color: derived.text,
      muted_color: derived.textMuted,
      border_color: derived.border,
      border_strong_color: derived.borderStrong,
      input_bg_color: derived.inputBg,
      input_border_color: derived.inputBorder,
      button_color: derived.buttonBg,
      button_hover_color: derived.buttonHover,
      player_bg_color: derived.playerBg,
      player_progress_color: derived.playerProgress,
      success_color: derived.success,
      warning_color: derived.warning,
      error_color: derived.error,
      info_color: derived.info,
    });
  };

  const ColorInput = ({
    label,
    field,
    value,
    fallback,
    hint,
  }: {
    label: string;
    field: keyof SiteSettings;
    value?: string;
    fallback: string;
    hint?: string;
  }) => {
    const val = value || fallback;
    return (
      <div className="p-3 bg-slate-900/70 rounded-xl border border-slate-800 space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider truncate">
            {label}
          </label>
          {hint && <span className="text-[9px] text-slate-500">{hint}</span>}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-slate-700 shrink-0">
            <input
              type="color"
              value={val.startsWith('#') ? val : fallback}
              onChange={(e) => handleColorChange(field, e.target.value)}
              className="absolute -inset-2 w-12 h-12 cursor-pointer border-0 p-0"
            />
          </div>
          <input
            type="text"
            value={val}
            onChange={(e) => handleColorChange(field, e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white font-mono uppercase focus:outline-none focus:border-rose-500"
          />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Action bar with Auto-Derive and WCAG summary */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
              <Palette className="w-4 h-4 text-rose-400" />
              <span>Full Color Palette Architecture</span>
            </h4>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-950/60 border border-rose-500/30 text-rose-300 font-semibold">
              Live Custom Builder
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Every token is connected directly to the DOM and CSS variables with zero hardcoding.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAutoDerivePalette}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 hover:text-white border border-rose-500/30 text-xs font-semibold flex items-center gap-2 transition-all shadow-sm shrink-0"
        >
          <Wand2 className="w-3.5 h-3.5 text-rose-400" />
          <span>Auto-Harmonize from Primary</span>
        </button>
      </div>

      {/* WCAG 2.1 Contrast Checker Banner */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Accessibility & WCAG 2.1 Contrast Compliance
            </span>
          </div>
          <span className="text-[10px] text-slate-400">ISO/IEC 40500 Guidelines</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* 1. Body text on Canvas */}
          <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1">
            <span className="text-[10px] text-slate-400 block truncate">Text on Background</span>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">{bgContrast.ratio}:1</span>
              <span
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                  bgContrast.passesAA
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                }`}
              >
                {bgContrast.passesAAA ? 'AAA Pass' : bgContrast.passesAA ? 'AA Pass' : 'Low Contrast'}
              </span>
            </div>
          </div>

          {/* 2. Text on Surface / Card */}
          <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1">
            <span className="text-[10px] text-slate-400 block truncate">Text on Surface</span>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">{surfaceContrast.ratio}:1</span>
              <span
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                  surfaceContrast.passesAA
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                }`}
              >
                {surfaceContrast.passesAAA ? 'AAA Pass' : surfaceContrast.passesAA ? 'AA Pass' : 'Low'}
              </span>
            </div>
          </div>

          {/* 3. Primary Color on Canvas */}
          <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1">
            <span className="text-[10px] text-slate-400 block truncate">Primary on Canvas</span>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">{primaryOnBg.ratio}:1</span>
              <span
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                  primaryOnBg.ratio >= 3.0
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}
              >
                {primaryOnBg.ratio >= 4.5 ? 'High Visibility' : 'Adequate'}
              </span>
            </div>
          </div>

          {/* 4. Button Text on Primary */}
          <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1">
            <span className="text-[10px] text-slate-400 block truncate">Button Text Ratio</span>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">{buttonContrast.ratio}:1</span>
              <span
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                  buttonContrast.passesAA
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}
              >
                {buttonContrast.passesAA ? 'Crisp' : 'Review Text'}
              </span>
            </div>
          </div>
        </div>

        {bgContrast.warning && (
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2 text-xs text-amber-300">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>{bgContrast.warning} Consider brightening the text color or darkening the canvas.</span>
          </div>
        )}
      </div>

      {/* Structured Token Input Sections */}
      <div className="space-y-6">
        {/* Group 1: Canvas & Surfaces */}
        <div className="space-y-3">
          <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-500" />
            <span>1. Canvas & Structural Surfaces</span>
          </h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <ColorInput
              label="Canvas Background"
              field="background_color"
              value={formData.background_color}
              fallback="#07080c"
              hint="Root canvas"
            />
            <ColorInput
              label="Surface / Card"
              field="surface_color"
              value={formData.surface_color}
              fallback="#11131c"
              hint="Cards & panels"
            />
            <ColorInput
              label="Secondary Surface"
              field="surface_secondary_color"
              value={formData.surface_secondary_color}
              fallback="#181b28"
              hint="Inner cards"
            />
            <ColorInput
              label="Card Border"
              field="card_border_color"
              value={formData.card_border_color}
              fallback="#1e2233"
              hint="Card stroke"
            />
          </div>
        </div>

        {/* Group 2: Brand Identity */}
        <div className="space-y-3">
          <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>2. Brand & Core Accents</span>
          </h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <ColorInput
              label="Primary Brand"
              field="primary_color"
              value={formData.primary_color}
              fallback="#e11d48"
              hint="Key actions & focus"
            />
            <ColorInput
              label="Secondary Color"
              field="secondary_color"
              value={formData.secondary_color}
              fallback="#9333ea"
              hint="Gradients & studio"
            />
            <ColorInput
              label="Accent Glow"
              field="accent_color"
              value={formData.accent_color}
              fallback="#fb7185"
              hint="Highlights"
            />
            <ColorInput
              label="Button Hover State"
              field="button_hover_color"
              value={formData.button_hover_color}
              fallback="#be123c"
              hint="Hover tint"
            />
          </div>
        </div>

        {/* Group 3: Typography */}
        <div className="space-y-3">
          <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-sky-400" />
            <span>3. Typography & Text Hierarchy</span>
          </h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <ColorInput
              label="Primary Headings / Text"
              field="text_color"
              value={formData.text_color || formData.foreground_color}
              fallback="#f8fafc"
              hint="High contrast"
            />
            <ColorInput
              label="Muted Text / Metadata"
              field="muted_color"
              value={formData.muted_color}
              fallback="#94a3b8"
              hint="Labels & times"
            />
            <ColorInput
              label="Border & Dividers"
              field="border_color"
              value={formData.border_color}
              fallback="#1e2233"
              hint="Subtle lines"
            />
          </div>
        </div>

        {/* Group 4: Form Inputs & Video Player */}
        <div className="space-y-3">
          <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>4. Form Controls & Video Player Scrubber</span>
          </h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <ColorInput
              label="Input Background"
              field="input_bg_color"
              value={formData.input_bg_color}
              fallback="#151724"
              hint="Form fields"
            />
            <ColorInput
              label="Input Border"
              field="input_border_color"
              value={formData.input_border_color}
              fallback="#23283c"
              hint="Resting stroke"
            />
            <ColorInput
              label="Player Cinema Canvas"
              field="player_bg_color"
              value={formData.player_bg_color}
              fallback="#050609"
              hint="Video background"
            />
            <ColorInput
              label="Player Progress Fill"
              field="player_progress_color"
              value={formData.player_progress_color}
              fallback="#e11d48"
              hint="Timeline scrubber"
            />
          </div>
        </div>

        {/* Group 5: Feedback Colors */}
        <div className="space-y-3">
          <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>5. Status Feedback & Alerts</span>
          </h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <ColorInput
              label="Success State"
              field="success_color"
              value={formData.success_color}
              fallback="#10b981"
            />
            <ColorInput
              label="Warning State"
              field="warning_color"
              value={formData.warning_color}
              fallback="#f59e0b"
            />
            <ColorInput
              label="Error State"
              field="error_color"
              value={formData.error_color}
              fallback="#ef4444"
            />
            <ColorInput
              label="Info State"
              field="info_color"
              value={formData.info_color}
              fallback="#38bdf8"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
