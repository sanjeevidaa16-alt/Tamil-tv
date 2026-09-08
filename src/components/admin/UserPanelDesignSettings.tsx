import React, { useState } from 'react';
import {
  Palette,
  Check,
  Eye,
  RotateCcw,
  Sparkles,
  Tv,
  Film,
  Monitor,
  Smartphone,
  Layers,
  Save,
  Info,
  Play,
  Volume2,
  Maximize,
  ShieldCheck,
  Sliders,
  ExternalLink,
} from 'lucide-react';
import { USER_PANEL_DESIGNS, DEFAULT_USER_PANEL_DESIGN_ID } from '../../data/userPanelDesigns';
import { UserPanelDesignConfig } from '../../types/userPanelDesign';
import { UserPanelDesignId } from '../../types';
import { useUserPanelDesign } from '../../contexts/UserPanelDesignContext';
import { useToast } from '../common/Toast';

interface UserPanelDesignSettingsProps {
  onApplyDesign?: (designId: UserPanelDesignId) => Promise<void>;
  isSaving?: boolean;
}

export const UserPanelDesignSettings: React.FC<UserPanelDesignSettingsProps> = ({
  onApplyDesign,
  isSaving = false,
}) => {
  const { designId: currentDesignId, previewDesignId, setPreviewDesignId, applyDesign, resetToDefault } =
    useUserPanelDesign();
  const { showToast } = useToast();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [interactiveModalDesign, setInteractiveModalDesign] = useState<UserPanelDesignConfig | null>(null);
  const [internalSaving, setInternalSaving] = useState(false);

  const categories = [
    { id: 'all', label: 'All Designs (13)', icon: Layers },
    { id: 'ott', label: 'OTT Streaming (3)', icon: Film },
    { id: 'broadcast', label: 'TV & Broadcast (4)', icon: Tv },
    { id: 'cinema', label: 'Kollywood Cinema (1)', icon: Monitor },
    { id: 'modern', label: 'Aesthetic & Modern (3)', icon: Sparkles },
    { id: 'mobile', label: 'Mobile & Social (2)', icon: Smartphone },
  ];

  const filteredDesigns = USER_PANEL_DESIGNS.filter((design) => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'ott') return ['tamil-ott', 'premium-ott', 'modern-grid'].includes(design.id);
    if (selectedCategory === 'broadcast') return ['tamil-tv-classic', 'tv-channel-hub', 'newspaper-tv', 'dense-quick-bar'].includes(design.id);
    if (selectedCategory === 'cinema') return ['cinema-dark'].includes(design.id);
    if (selectedCategory === 'modern') return ['glass-tv', 'neon-tv', 'minimal-tv', 'future-tv'].includes(design.id);
    if (selectedCategory === 'mobile') return ['mobile-first-tv', 'social-video'].includes(design.id);
    return true;
  });

  const activeDesignConfig =
    USER_PANEL_DESIGNS.find((d) => d.id === (previewDesignId || currentDesignId)) ||
    USER_PANEL_DESIGNS[0];

  const handleApply = async (designId: UserPanelDesignId) => {
    setInternalSaving(true);
    try {
      if (onApplyDesign) {
        await onApplyDesign(designId);
      } else {
        await applyDesign(designId);
      }
      showToast('User Panel UI/UX design applied successfully!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to apply design. Please try again.', 'error');
    } finally {
      setInternalSaving(false);
    }
  };

  const handleReset = async () => {
    if (
      window.confirm(
        'Are you sure you want to reset the User Panel UI/UX to the default "Tamil OTT" design?'
      )
    ) {
      setInternalSaving(true);
      try {
        await resetToDefault();
        if (onApplyDesign) {
          await onApplyDesign(DEFAULT_USER_PANEL_DESIGN_ID);
        }
        showToast('Reset to default "Tamil OTT" design.', 'info');
      } catch (err) {
        console.error(err);
      } finally {
        setInternalSaving(false);
      }
    }
  };

  return (
    <div id="user-panel-design-manager" className="space-y-8">
      {/* Top Header & Status Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <Palette className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  User Panel UI/UX Design System
                </h2>
                <p className="text-xs text-slate-400">
                  Switch the entire public website layout, navigation, video cards, hero showcase, and player controls across 13 bespoke designs.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2 text-xs">
              <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                Active: <strong className="text-white">{activeDesignConfig.name}</strong> ({activeDesignConfig.tamilName})
              </span>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Live in Production
              </span>
              {previewDesignId && previewDesignId !== currentDesignId && (
                <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 font-semibold flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" />
                  Previewing: {previewDesignId}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {previewDesignId && (
              <button
                id="clear-preview-btn"
                onClick={() => setPreviewDesignId(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-colors"
              >
                Clear Preview
              </button>
            )}

            <button
              id="reset-default-design-btn"
              onClick={handleReset}
              disabled={isSaving || internalSaving}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Default</span>
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pt-6 border-t border-slate-800/80 mt-6 scrollbar-none">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                id={`design-cat-${cat.id}`}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 shrink-0 transition-all ${
                  isSelected
                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-950/40'
                    : 'bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 13 Selectable Design Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredDesigns.map((design) => {
          const isActive = currentDesignId === design.id;
          const isPreviewing = previewDesignId === design.id;

          return (
            <div
              key={design.id}
              id={`design-card-${design.id}`}
              className={`rounded-3xl border transition-all duration-300 flex flex-col justify-between overflow-hidden relative group ${
                isActive
                  ? 'border-emerald-500 bg-slate-900/95 ring-2 ring-emerald-500/20 shadow-2xl shadow-emerald-950/20'
                  : isPreviewing
                  ? 'border-amber-500 bg-slate-900/90 ring-2 ring-amber-500/20'
                  : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900/80 shadow-lg'
              }`}
            >
              {/* Card Top / Header */}
              <div className="p-5 pb-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-rose-400 font-bold">
                        {design.category}
                      </span>
                      <span className="text-slate-600">•</span>
                      <span className="text-[10px] font-mono text-slate-400">{design.layout.mode}</span>
                    </div>
                    <h3 className="text-base font-black text-white mt-0.5 flex items-center gap-1.5">
                      <span>{design.name}</span>
                    </h3>
                    <p className="text-xs text-rose-400 font-semibold">{design.tamilName}</p>
                  </div>

                  {isActive ? (
                    <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black tracking-wider uppercase flex items-center gap-1.5 shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      ACTIVE
                    </span>
                  ) : isPreviewing ? (
                    <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black tracking-wider uppercase flex items-center gap-1.5">
                      <Eye className="w-3 h-3" />
                      PREVIEW
                    </span>
                  ) : null}
                </div>

                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {design.description}
                </p>

                {/* Micro Component Previews Container */}
                <div className="space-y-2.5 pt-3 border-t border-slate-800/80">
                  {/* 1. Mini Header Preview */}
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-mono font-bold">
                      Mini Header: {design.header.style}
                    </span>
                    <div
                      className="h-7 w-full rounded-md px-2 flex items-center justify-between border text-[9px] font-semibold"
                      style={{
                        backgroundColor: design.id === 'glass-tv' ? 'rgba(255,255,255,0.08)' : '#07080f',
                        borderColor: design.id === 'neon-tv' ? 'rgba(225,29,72,0.6)' : 'rgba(255,255,255,0.1)',
                      }}
                    >
                      <div className="flex items-center gap-1 text-white">
                        <span className="w-2 h-2 rounded-full bg-rose-500" />
                        <span className="truncate max-w-[70px]">StreamVault</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-400">
                        <span>Movies</span>
                        <span>Serials</span>
                      </div>
                    </div>
                  </div>

                  {/* 2. Mini Video Card Preview */}
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-mono font-bold">
                      Mini Video Card: {design.card.variant}
                    </span>
                    <div
                      className="p-2 border flex items-center gap-2.5"
                      style={{
                        borderRadius: design.card.cardRadius,
                        backgroundColor: design.id === 'glass-tv' ? 'rgba(255,255,255,0.06)' : '#0d0f1a',
                        borderColor: design.id === 'neon-tv' ? 'rgba(225,29,72,0.5)' : 'rgba(255,255,255,0.1)',
                      }}
                    >
                      <div
                        className="w-14 h-9 bg-slate-800 relative rounded shrink-0 overflow-hidden flex items-center justify-center"
                        style={{ borderRadius: design.card.cardRadius }}
                      >
                        <Play className="w-3 h-3 text-rose-500 fill-rose-500" />
                        <span className="absolute bottom-0.5 right-0.5 text-[7px] bg-black/80 px-1 rounded text-white font-mono">
                          2:45
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold text-white truncate">பொன்னியின் செல்வன் 2</p>
                        <p className="text-[8px] text-slate-400 truncate">420K views • 2 days ago</p>
                      </div>
                    </div>
                  </div>

                  {/* 3. Mini Player Preview */}
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-mono font-bold">
                      Mini Player: {design.player.skin}
                    </span>
                    <div
                      className="h-8 w-full bg-black/90 border border-white/10 px-2 flex items-center justify-between text-white text-[9px]"
                      style={{ borderRadius: design.player.radius }}
                    >
                      <div className="flex items-center gap-1.5">
                        <Play className="w-2.5 h-2.5 fill-white" />
                        <div className="w-16 h-1 bg-slate-700 rounded-full overflow-hidden">
                          <div className="w-2/3 h-full bg-rose-500" />
                        </div>
                      </div>
                      <span className="font-mono text-[8px] text-slate-400">1080p HD</span>
                    </div>
                  </div>

                  {/* 4. Mini Button & Tag Preview */}
                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      tabIndex={-1}
                      className="px-2.5 py-1 text-[9px] font-bold text-white bg-rose-600 shadow"
                      style={{ borderRadius: design.components.buttonRadius }}
                    >
                      Sample Button
                    </button>
                    <span
                      className="px-2 py-0.5 text-[8px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20"
                      style={{ borderRadius: design.components.tagRadius }}
                    >
                      Tamil OTT Badge
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="p-4 bg-slate-950/60 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <button
                  id={`preview-btn-${design.id}`}
                  onClick={() => setPreviewDesignId(design.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    isPreviewing
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    id={`open-spec-${design.id}`}
                    onClick={() => setInteractiveModalDesign(design)}
                    className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700/50 text-xs"
                    title="Inspect Full Design Specification"
                  >
                    <Info className="w-3.5 h-3.5" />
                  </button>

                  <button
                    id={`apply-design-btn-${design.id}`}
                    onClick={() => handleApply(design.id)}
                    disabled={isActive || isSaving || internalSaving}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg transition-all ${
                      isActive
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 cursor-default'
                        : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/50 hover:scale-105 active:scale-95'
                    }`}
                  >
                    {isActive ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Active</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        <span>Apply Design</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Design Modal Specification */}
      {interactiveModalDesign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl relative">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-rose-400 font-bold">
                  {interactiveModalDesign.category} Specification
                </span>
                <h3 className="text-xl font-black text-white">
                  {interactiveModalDesign.name} ({interactiveModalDesign.tamilName})
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {interactiveModalDesign.description}
                </p>
              </div>
              <button
                onClick={() => setInteractiveModalDesign(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-sm"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 text-[10px] font-mono block">Layout Mode</span>
                <strong className="text-white font-mono">{interactiveModalDesign.layout.mode}</strong>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 text-[10px] font-mono block">Card Variant</span>
                <strong className="text-white font-mono">{interactiveModalDesign.card.variant}</strong>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 text-[10px] font-mono block">Player Skin</span>
                <strong className="text-white font-mono">{interactiveModalDesign.player.skin}</strong>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 text-[10px] font-mono block">Card Radius</span>
                <strong className="text-white font-mono">{interactiveModalDesign.card.cardRadius}</strong>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 text-[10px] font-mono block">Header Style</span>
                <strong className="text-white font-mono">{interactiveModalDesign.header.style}</strong>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 text-[10px] font-mono block">Filter Variant</span>
                <strong className="text-white font-mono">{interactiveModalDesign.filters.variant}</strong>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => {
                  setPreviewDesignId(interactiveModalDesign.id);
                  setInteractiveModalDesign(null);
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold"
              >
                Preview on Public Pages
              </button>
              <button
                onClick={() => {
                  handleApply(interactiveModalDesign.id);
                  setInteractiveModalDesign(null);
                }}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-950/50"
              >
                Apply This Design
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
