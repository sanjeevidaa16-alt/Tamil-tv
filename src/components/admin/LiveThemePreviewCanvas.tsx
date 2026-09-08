import React, { useState } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  Search,
  Film,
  Sparkles,
  Sliders,
  Shield,
  Eye,
  RotateCcw,
} from 'lucide-react';
import { SiteSettings } from '../../types';

interface LiveThemePreviewCanvasProps {
  settings: SiteSettings;
  onResetToCurrent?: () => void;
}

export const LiveThemePreviewCanvas: React.FC<LiveThemePreviewCanvasProps> = ({
  settings,
  onResetToCurrent,
}) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(42);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [activeTab, setActiveTab] = useState<'stream' | 'details' | 'episodes'>('stream');
  const [inputValue, setInputValue] = useState('');

  return (
    <div
      id="live-theme-preview-canvas"
      className="p-6 rounded-3xl border transition-all space-y-8"
      style={{
        backgroundColor: 'var(--color-background, #07080c)',
        borderColor: 'var(--color-border, #1e2233)',
        color: 'var(--color-text, #f8fafc)',
      }}
    >
      {/* 1. Header & Live Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>Interactive Live Theme Sandbox</span>
            </h3>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
              Live CSS Engine
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Every button, input, card, and player scrubber updates dynamically with zero page reloads.
          </p>
        </div>

        {onResetToCurrent && (
          <button
            type="button"
            onClick={onResetToCurrent}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-300 border border-slate-800 flex items-center gap-1.5 self-start sm:self-auto transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Active</span>
          </button>
        )}
      </div>

      {/* 2. Mock Navigation Bar */}
      <div
        className="p-3.5 rounded-2xl border flex items-center justify-between gap-4 shadow-md"
        style={{
          backgroundColor: 'var(--color-surface, #11131c)',
          borderColor: 'var(--color-border, #1e2233)',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shadow text-white font-bold"
            style={{ backgroundColor: 'var(--color-primary, #e11d48)' }}
          >
            <Film className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-black tracking-tight text-white font-['Cabinet_Grotesk',sans-serif]">
            {settings.site_name || 'StreamVault'}
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-2 flex-1 max-w-xs">
          <div
            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs"
            style={{
              backgroundColor: 'var(--color-input-background, #151724)',
              borderColor: 'var(--color-input-border, #23283c)',
              color: 'var(--color-text, #ffffff)',
            }}
          >
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">Search streams...</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div
            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white shadow-sm flex items-center gap-1.5"
            style={{ backgroundColor: 'var(--button-primary-bg, #e11d48)' }}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Admin Studio</span>
          </div>
        </div>
      </div>

      {/* 3. Interactive Video Player Showcase */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Video Player Cinema Shell & Dynamic Scrubber
        </h4>

        <div
          className="relative aspect-video rounded-2xl overflow-hidden border flex flex-col justify-between p-4 shadow-2xl"
          style={{
            backgroundColor: 'var(--color-player-background, #050609)',
            borderColor: 'var(--color-border, #1e2233)',
            borderRadius: 'var(--card-radius, 14px)',
          }}
        >
          {/* Mock Video Canvas / Poster */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-slate-950/60 to-transparent flex items-center justify-center">
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-14 h-14 rounded-full flex items-center justify-center text-white shadow-2xl transition-transform hover:scale-110"
              style={{
                backgroundColor: 'var(--color-primary, #e11d48)',
              }}
            >
              {isPlaying ? <Pause className="w-6 h-6 fill-white" /> : <Play className="w-6 h-6 fill-white ml-0.5" />}
            </button>
          </div>

          {/* Top Player Badges */}
          <div className="relative z-10 flex items-center justify-between">
            <span
              className="px-2.5 py-1 rounded-md text-[10px] font-bold text-white backdrop-blur-md"
              style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
            >
              4K ULTRA HD • HDR10
            </span>
            <span
              className="px-2.5 py-1 rounded-md text-[10px] font-bold text-white"
              style={{ backgroundColor: 'var(--color-primary, #e11d48)' }}
            >
              LIVE PREVIEW
            </span>
          </div>

          {/* Bottom Player Controls Bar */}
          <div
            className="relative z-10 p-3 rounded-xl border space-y-2 backdrop-blur-md"
            style={{
              backgroundColor: 'var(--color-player-controls, rgba(17, 19, 28, 0.95))',
              borderColor: 'var(--color-border, rgba(255, 255, 255, 0.1))',
            }}
          >
            {/* Scrubber Bar */}
            <div
              className="relative w-full h-1.5 rounded-full cursor-pointer overflow-hidden"
              style={{ backgroundColor: 'var(--color-player-progress-background, rgba(255, 255, 255, 0.2))' }}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const pos = Math.max(0, Math.min(100, Math.round(((e.clientX - rect.left) / rect.width) * 100)));
                setProgress(pos);
              }}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${progress}%`,
                  backgroundColor: 'var(--color-player-progress, #e11d48)',
                }}
              />
            </div>

            {/* Controls Row */}
            <div className="flex items-center justify-between text-xs text-white">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="hover:text-slate-300"
                >
                  {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsMuted(!isMuted)}
                    className="hover:text-slate-300"
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => {
                      setVolume(Number(e.target.value));
                      setIsMuted(false);
                    }}
                    className="w-16 h-1 rounded-full cursor-pointer accent-rose-500"
                    style={{ accentColor: 'var(--color-primary, #e11d48)' }}
                  />
                </div>

                <span className="text-[11px] text-slate-300 font-mono">
                  {Math.floor((progress * 180) / 100 / 60)}:{String(Math.floor(((progress * 180) / 100) % 60)).padStart(2, '0')} / 3:00
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[10px] text-slate-300 font-semibold px-2 py-0.5 rounded bg-white/10">
                  1080p60
                </span>
                <Maximize className="w-4 h-4 cursor-pointer hover:text-slate-300" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Interactive Components Row (Buttons, Inputs, Tabs, Video Card) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Controls & Buttons (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Interactive Button Palette */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Interactive Button Hierarchy
            </h4>
            <div className="flex flex-wrap items-center gap-3">
              {/* Primary Button */}
              <button
                type="button"
                className="px-4 py-2 text-xs font-bold text-white shadow-lg transition-transform hover:-translate-y-0.5"
                style={{
                  backgroundColor: 'var(--button-primary-bg, #e11d48)',
                  borderRadius: 'var(--button-radius, 12px)',
                }}
              >
                Primary Action
              </button>

              {/* Secondary Button */}
              <button
                type="button"
                className="px-4 py-2 text-xs font-bold border transition-colors"
                style={{
                  backgroundColor: 'var(--color-surface-secondary, #181b28)',
                  borderColor: 'var(--color-border, #1e2233)',
                  color: 'var(--color-text, #ffffff)',
                  borderRadius: 'var(--button-radius, 12px)',
                }}
              >
                Secondary Surface
              </button>

              {/* Outline Button */}
              <button
                type="button"
                className="px-4 py-2 text-xs font-bold border transition-colors"
                style={{
                  borderColor: 'var(--color-primary, #e11d48)',
                  color: 'var(--color-primary, #e11d48)',
                  borderRadius: 'var(--button-radius, 12px)',
                }}
              >
                Outline Brand
              </button>

              {/* Disabled Button */}
              <button
                type="button"
                disabled
                className="px-4 py-2 text-xs font-bold opacity-40 cursor-not-allowed border border-white/10"
                style={{
                  backgroundColor: 'var(--color-surface, #11131c)',
                  borderRadius: 'var(--button-radius, 12px)',
                }}
              >
                Disabled
              </button>
            </div>
          </div>

          {/* Form Inputs with Focus States */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Themed Form Inputs & Focus Ring
            </h4>
            <div className="space-y-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type here to test focus ring color..."
                className="w-full px-3.5 py-2.5 text-xs transition-all border"
                style={{
                  backgroundColor: 'var(--color-input-background, #151724)',
                  borderColor: 'var(--color-input-border, #23283c)',
                  borderRadius: 'var(--input-radius, 12px)',
                  color: 'var(--color-text, #ffffff)',
                }}
              />
            </div>
          </div>

          {/* Tab Navigation Component */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Themed Segmented Tabs
            </h4>
            <div
              className="p-1 rounded-xl border flex items-center gap-1"
              style={{
                backgroundColor: 'var(--color-surface, #11131c)',
                borderColor: 'var(--color-border, #1e2233)',
              }}
            >
              {(
                [
                  { id: 'stream', label: 'Streaming' },
                  { id: 'details', label: 'Technical Specs' },
                  { id: 'episodes', label: 'Episodes & Vault' },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id)}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    activeTab === t.id
                      ? 'text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  style={{
                    backgroundColor: activeTab === t.id ? 'var(--color-primary, #e11d48)' : 'transparent',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Feedback Status Badges */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Status Badges & Feedback Colors
            </h4>
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
              <span
                className="px-2.5 py-1 rounded-lg flex items-center gap-1"
                style={{
                  backgroundColor: 'var(--color-success-background, rgba(16, 185, 129, 0.15))',
                  color: 'var(--color-success, #10b981)',
                }}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Success Verified</span>
              </span>

              <span
                className="px-2.5 py-1 rounded-lg flex items-center gap-1"
                style={{
                  backgroundColor: 'var(--color-warning-background, rgba(245, 158, 11, 0.15))',
                  color: 'var(--color-warning, #f59e0b)',
                }}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Warning Notice</span>
              </span>

              <span
                className="px-2.5 py-1 rounded-lg flex items-center gap-1"
                style={{
                  backgroundColor: 'var(--color-error-background, rgba(239, 68, 68, 0.15))',
                  color: 'var(--color-error, #ef4444)',
                }}
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Error Blocked</span>
              </span>

              <span
                className="px-2.5 py-1 rounded-lg flex items-center gap-1"
                style={{
                  backgroundColor: 'var(--color-info-background, rgba(56, 189, 248, 0.15))',
                  color: 'var(--color-info, #38bdf8)',
                }}
              >
                <Info className="w-3.5 h-3.5" />
                <span>Info Broadcast</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Mini Video Card & Toast Mockup (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Themed Video Catalog Card
          </h4>

          {/* Video Card Sample */}
          <div
            className="group relative border overflow-hidden transition-all duration-200"
            style={{
              backgroundColor: 'var(--card-bg, #11131c)',
              borderColor: 'var(--card-border, #1e2233)',
              borderRadius: 'var(--card-radius, 14px)',
              boxShadow: 'var(--card-shadow, 0 10px 25px -5px rgba(0,0,0,0.4))',
            }}
          >
            {/* Thumbnail */}
            <div className="relative aspect-video w-full bg-slate-950 overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80"
                alt="Stream Preview"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

              {/* Play Button Overlay */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-xl"
                  style={{ backgroundColor: 'var(--color-primary, #e11d48)' }}
                >
                  <Play className="w-4 h-4 fill-white ml-0.5" />
                </div>
              </div>

              {/* Duration Badge */}
              <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-black/80 text-white">
                24:18
              </span>
            </div>

            {/* Card Content */}
            <div className="p-3.5 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span
                  className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: 'rgba(225, 29, 72, 0.15)',
                    color: 'var(--color-primary, #e11d48)',
                  }}
                >
                  Original Series
                </span>
                <span className="text-[10px] text-slate-400">12.4k Views</span>
              </div>

              <h5 className="text-xs font-bold text-white line-clamp-1">
                Beyond the Event Horizon: Deep Space
              </h5>

              <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                An astrophysics masterclass exploring black hole accretion discs and interstellar travel.
              </p>

              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-400">
                <span>By StreamVault Studio</span>
                <span className="font-semibold text-white">4K HDR</span>
              </div>
            </div>
          </div>

          {/* Toast Notification Mockup */}
          <div
            className="p-3 rounded-xl border flex items-center gap-3 shadow-lg"
            style={{
              backgroundColor: 'var(--color-surface-secondary, #181b28)',
              borderColor: 'var(--color-border, #1e2233)',
              borderRadius: 'var(--card-radius, 14px)',
            }}
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: 'var(--color-success-background, rgba(16, 185, 129, 0.2))' }}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xs">
              <p className="font-bold text-white">Stream Added to Watchlist</p>
              <p className="text-[10px] text-slate-400">Available offline in high-definition</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
