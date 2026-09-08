import React, { useState, useEffect, useRef } from 'react';
import {
  Settings as SettingsIcon,
  Palette,
  Image as ImageIcon,
  Layout,
  Globe,
  Share2,
  Phone,
  ShieldAlert,
  Save,
  RotateCcw,
  Upload,
  Trash2,
  Plus,
  Check,
  Eye,
  AlertTriangle,
  MoveUp,
  MoveDown,
  ExternalLink,
  HelpCircle,
  Sparkles,
  Info,
  Layers,
  Sliders,
  CheckCircle2,
  X,
} from 'lucide-react';
import { useSiteSettings } from '../../contexts/SiteSettingsContext';
import { settingsService } from '../../services/settingsService';
import { THEME_PRESETS, EXTENDED_THEME_PRESETS } from '../../data/themes';
import { SiteSettings, FooterSection, FooterLink, FooterSocialLink, ThemePreset } from '../../types';
import { ExtendedThemePreset } from '../../types/theme';
import { useToast } from '../../components/common/Toast';
import { Footer } from '../../components/layout/Footer';
import { ThemePresetsGrid } from '../../components/admin/ThemePresetsGrid';
import { CustomThemeBuilder } from '../../components/admin/CustomThemeBuilder';
import { UIDesignSettings } from '../../components/admin/UIDesignSettings';
import { UserPanelDesignSettings } from '../../components/admin/UserPanelDesignSettings';
import { LiveThemePreviewCanvas } from '../../components/admin/LiveThemePreviewCanvas';

export const GeneralSettings: React.FC = () => {
  const {
    settings: globalSettings,
    updateSettings,
    resetSettings,
    applyPreviewTheme,
    revertPreviewTheme,
  } = useSiteSettings();
  const { showToast } = useToast();

  // Local editable form state
  const [formData, setFormData] = useState<SiteSettings>(globalSettings);
  const [activeTab, setActiveTab] = useState<
    | 'identity'
    | 'branding'
    | 'theme'
    | 'ui-design'
    | 'footer'
    | 'social'
    | 'seo'
    | 'contact'
    | 'maintenance'
    | 'preview'
  >('identity');

  const [saving, setSaving] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [unsavedModalOpen, setUnsavedModalOpen] = useState(false);
  const [pendingTab, setPendingTab] = useState<typeof activeTab | null>(null);

  // Upload states
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  // New section / link editing modal states
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [linkForm, setLinkForm] = useState<{ label: string; url: string; open_new_tab: boolean }>({
    label: '',
    url: '',
    open_new_tab: false,
  });

  // Track if form is dirty
  const isDirty = JSON.stringify(formData) !== JSON.stringify(globalSettings);

  // Synchronize when global settings change externally
  useEffect(() => {
    setFormData(globalSettings);
  }, [globalSettings]);

  // Tab navigation with unsaved change protection
  const handleTabChange = (newTab: typeof activeTab) => {
    if (isDirty) {
      setPendingTab(newTab);
      setUnsavedModalOpen(true);
    } else {
      setActiveTab(newTab);
    }
  };

  const handleSave = async () => {
    // Validate mandatory fields
    if (!formData.site_name.trim()) {
      showToast('Website Name cannot be empty.', 'error');
      return;
    }

    setSaving(true);
    try {
      await updateSettings(formData);
      showToast('✓ Settings saved successfully to Supabase and cache.', 'success');
      setUnsavedModalOpen(false);
    } catch (err: any) {
      console.error('Save error:', err);
      showToast('✕ Unable to save settings: ' + (err.message || 'Unknown error'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmReset = async () => {
    setSaving(true);
    try {
      await resetSettings();
      setResetModalOpen(false);
      showToast('✓ All settings restored to original StreamVault defaults.', 'success');
    } catch (err: any) {
      showToast('✕ Reset failed: ' + (err.message || 'Unknown error'), 'error');
    } finally {
      setSaving(false);
    }
  };

  // Image Upload handler for logos and favicon
  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'main_logo_url' | 'header_logo_url' | 'footer_logo_url' | 'mobile_logo_url' | 'favicon_url'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image file too large. Maximum size is 5MB.', 'error');
      return;
    }

    // Validate type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon'];
    if (!validTypes.includes(file.type)) {
      showToast('Unsupported image format. Use PNG, JPG, WebP, SVG, or ICO.', 'error');
      return;
    }

    const assetTypeMap: Record<string, any> = {
      main_logo_url: 'main_logo',
      header_logo_url: 'header_logo',
      footer_logo_url: 'footer_logo',
      mobile_logo_url: 'mobile_logo',
      favicon_url: 'favicon',
    };

    setUploadingField(field);
    try {
      const uploadedUrl = await settingsService.uploadBrandAsset(file, assetTypeMap[field]);
      setFormData((prev) => ({
        ...prev,
        [field]: uploadedUrl,
      }));
      showToast(`Asset uploaded successfully!`, 'success');
    } catch (err: any) {
      console.error('Upload error:', err);
      showToast('Upload failed: ' + (err.message || 'Storage error'), 'error');
    } finally {
      setUploadingField(null);
    }
  };

  // Theme Preset Selector handler
  const handleSelectPreset = (preset: ExtendedThemePreset) => {
    const next: SiteSettings = {
      ...formData,
      theme_name: preset.name,
      primary_color: preset.tokens.primary,
      secondary_color: preset.tokens.secondary,
      accent_color: preset.tokens.accent,
      background_color: preset.tokens.background,
      surface_color: preset.tokens.surface,
      surface_secondary_color: preset.tokens.surfaceSecondary,
      surface_tertiary_color: preset.tokens.surfaceTertiary,
      card_bg_color: preset.tokens.cardBg,
      card_border_color: preset.tokens.cardBorder,
      text_color: preset.tokens.text,
      foreground_color: preset.tokens.text,
      muted_color: preset.tokens.textMuted,
      border_color: preset.tokens.border,
      border_strong_color: preset.tokens.borderStrong,
      input_bg_color: preset.tokens.inputBg,
      input_border_color: preset.tokens.inputBorder,
      button_color: preset.tokens.buttonBg,
      button_hover_color: preset.tokens.buttonHover,
      player_bg_color: preset.tokens.playerBg,
      player_progress_color: preset.tokens.playerProgress,
      success_color: preset.tokens.success,
      warning_color: preset.tokens.warning,
      error_color: preset.tokens.error,
      info_color: preset.tokens.info,
    };
    setFormData(next);
    applyPreviewTheme(next);
    showToast(`Applied "${preset.name}". Preview active live! Click "Save Changes" to persist.`, 'info');
  };

  const handleThemeOrStyleChange = (updated: Partial<SiteSettings>) => {
    const next: SiteSettings = {
      ...formData,
      ...updated,
    };
    setFormData(next);
    applyPreviewTheme(next);
  };

  // Footer Sections Management Helpers
  const handleAddSection = () => {
    if (!newSectionTitle.trim()) {
      showToast('Please enter a section title.', 'error');
      return;
    }
    const newSec: FooterSection = {
      id: 'sec-' + Date.now(),
      title: newSectionTitle.trim(),
      enabled: true,
      sort_order: (formData.footer_sections?.length || 0) + 1,
      links: [],
    };
    setFormData((prev) => ({
      ...prev,
      footer_sections: [...(prev.footer_sections || []), newSec],
    }));
    setNewSectionTitle('');
    showToast(`Section "${newSec.title}" added.`, 'success');
  };

  const handleDeleteSection = (sectionId: string) => {
    setFormData((prev) => ({
      ...prev,
      footer_sections: prev.footer_sections.filter((s) => s.id !== sectionId),
    }));
  };

  const handleToggleSection = (sectionId: string) => {
    setFormData((prev) => ({
      ...prev,
      footer_sections: prev.footer_sections.map((s) =>
        s.id === sectionId ? { ...s, enabled: !s.enabled } : s
      ),
    }));
  };

  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    const list = [...formData.footer_sections];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;

    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;

    // re-index sort_order
    const reindexed = list.map((item, idx) => ({ ...item, sort_order: idx + 1 }));
    setFormData((prev) => ({ ...prev, footer_sections: reindexed }));
  };

  // Footer Links helpers
  const handleAddLinkToSection = (sectionId: string) => {
    if (!linkForm.label.trim() || !linkForm.url.trim()) {
      showToast('Please enter both Link Label and URL.', 'error');
      return;
    }

    const newLink: FooterLink = {
      id: 'lnk-' + Date.now(),
      label: linkForm.label.trim(),
      url: linkForm.url.trim(),
      open_new_tab: linkForm.open_new_tab,
      enabled: true,
      sort_order: 99,
    };

    setFormData((prev) => ({
      ...prev,
      footer_sections: prev.footer_sections.map((s) => {
        if (s.id === sectionId) {
          const links = [...(s.links || []), newLink].map((l, idx) => ({
            ...l,
            sort_order: idx + 1,
          }));
          return { ...s, links };
        }
        return s;
      }),
    }));

    setLinkForm({ label: '', url: '', open_new_tab: false });
    setEditingSectionId(null);
    showToast('Link added to footer group.', 'success');
  };

  const handleDeleteLink = (sectionId: string, linkId: string) => {
    setFormData((prev) => ({
      ...prev,
      footer_sections: prev.footer_sections.map((s) => {
        if (s.id === sectionId) {
          return {
            ...s,
            links: s.links.filter((l) => l.id !== linkId),
          };
        }
        return s;
      }),
    }));
  };

  const handleToggleLink = (sectionId: string, linkId: string) => {
    setFormData((prev) => ({
      ...prev,
      footer_sections: prev.footer_sections.map((s) => {
        if (s.id === sectionId) {
          return {
            ...s,
            links: s.links.map((l) => (l.id === linkId ? { ...l, enabled: !l.enabled } : l)),
          };
        }
        return s;
      }),
    }));
  };

  // Social Links helper
  const handleToggleSocial = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      footer_social_links: (prev.footer_social_links || []).map((s) =>
        s.id === id ? { ...s, enabled: !s.enabled } : s
      ),
    }));
  };

  const handleUpdateSocialUrl = (id: string, url: string) => {
    setFormData((prev) => ({
      ...prev,
      footer_social_links: (prev.footer_social_links || []).map((s) =>
        s.id === id ? { ...s, url } : s
      ),
    }));
  };

  return (
    <div id="admin-general-settings-page" className="space-y-8 pb-20 max-w-6xl mx-auto">
      {/* 1. TOP HEADER & ACTION CONTROLS */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <SettingsIcon className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                <span>General Settings & Website CMS</span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Centralized branding, 15 preset color themes, customizable footer CMS, SEO & maintenance controls
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isDirty && (
            <span className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5" />
              Unsaved Changes
            </span>
          )}

          <button
            id="reset-settings-btn"
            onClick={() => setResetModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            id="save-settings-btn"
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-rose-950/50 flex items-center gap-2 transition-all hover:scale-[1.02]"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {/* 2. SUB-NAVIGATION TABS */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2 border-b border-slate-800/60 no-scrollbar">
        {[
          { id: 'identity', label: '1. Identity', icon: Globe },
          { id: 'branding', label: '2. Logos & Branding', icon: ImageIcon },
          { id: 'theme', label: '3. Theme & Colors', icon: Palette },
          { id: 'ui-design', label: '4. User Panel UI/UX', icon: Layers },
          { id: 'footer', label: '5. Footer CMS', icon: Layout },
          { id: 'social', label: '6. Social Links', icon: Share2 },
          { id: 'contact', label: '7. Contact Info', icon: Phone },
          { id: 'seo', label: '8. SEO & Meta', icon: Globe },
          { id: 'maintenance', label: '9. Maintenance', icon: ShieldAlert },
          { id: 'preview', label: '10. Live Preview', icon: Eye },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              onClick={() => handleTabChange(tab.id as typeof activeTab)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold shrink-0 flex items-center gap-2 transition-all ${
                isActive
                  ? 'bg-rose-600/20 text-rose-300 border border-rose-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. TAB 1: WEBSITE IDENTITY */}
      {activeTab === 'identity' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-[#11131c] border border-slate-800 space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Globe className="w-5 h-5 text-rose-400" />
                <span>Website Identity & Metadata</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Configure the primary website name, short acronym, tagline, and global descriptions. These values are automatically propagated across the Header, Footer, and Auth screens.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Site Name */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Website Name <span className="text-rose-500">*</span>
                </label>
                <input
                  id="input-site-name"
                  type="text"
                  value={formData.site_name}
                  onChange={(e) => setFormData({ ...formData, site_name: e.target.value })}
                  placeholder="e.g. StreamVault"
                  className="w-full bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
                />
                <p className="text-[11px] text-slate-500">
                  Displayed in navigation bar, footer logo text, emails, and page titles.
                </p>
              </div>

              {/* Short Name */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Short Name / Acronym
                </label>
                <input
                  id="input-site-short-name"
                  type="text"
                  value={formData.site_short_name}
                  onChange={(e) => setFormData({ ...formData, site_short_name: e.target.value })}
                  placeholder="e.g. SV"
                  className="w-full bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
                />
                <p className="text-[11px] text-slate-500">
                  Compact badge abbreviation for mobile badges and notification tags.
                </p>
              </div>

              {/* Tagline */}
              <div className="md:col-span-2 space-y-2">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Website Tagline
                </label>
                <input
                  id="input-site-tagline"
                  type="text"
                  value={formData.site_tagline}
                  onChange={(e) => setFormData({ ...formData, site_tagline: e.target.value })}
                  placeholder="e.g. Next-Generation Enterprise Video Streaming Platform"
                  className="w-full bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              {/* Description */}
              <div className="md:col-span-2 space-y-2">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Website Description
                </label>
                <textarea
                  id="input-site-desc"
                  rows={3}
                  value={formData.site_description}
                  onChange={(e) => setFormData({ ...formData, site_description: e.target.value })}
                  placeholder="Enter high-level website overview..."
                  className="w-full bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 text-xs text-white focus:outline-none focus:border-rose-500 leading-relaxed"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. TAB 2: LOGOS & BRANDING */}
      {activeTab === 'branding' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-[#11131c] border border-slate-800 space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-indigo-400" />
                <span>Logo & Branding Graphic Assets</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Upload or link custom brand graphics. If specialized logos (Header/Footer/Mobile) are left blank, the system automatically falls back to the Main Logo, or the dynamic SVG brand token.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 1. Main Logo */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/90 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white">Main Brand Logo</label>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Primary Fallback</span>
                </div>

                {formData.main_logo_url ? (
                  <div className="p-3 bg-black/40 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
                    <img
                      src={formData.main_logo_url}
                      alt="Main Logo Preview"
                      className="h-10 max-w-[160px] object-contain"
                    />
                    <button
                      onClick={() => setFormData({ ...formData, main_logo_url: '' })}
                      className="p-1.5 rounded-lg bg-rose-950/40 text-rose-400 hover:bg-rose-900/50 text-xs"
                      title="Remove Logo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="h-16 rounded-xl border border-dashed border-slate-800 flex items-center justify-center text-xs text-slate-500">
                    Default Icon & Typography Fallback Active
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <label className="flex-1 cursor-pointer">
                    <div className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center justify-center gap-2 transition-colors border border-slate-700">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{uploadingField === 'main_logo_url' ? 'Uploading...' : 'Upload Image'}</span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageUpload(e, 'main_logo_url')}
                      disabled={uploadingField !== null}
                    />
                  </label>
                </div>
                <input
                  type="text"
                  value={formData.main_logo_url}
                  onChange={(e) => setFormData({ ...formData, main_logo_url: e.target.value })}
                  placeholder="Or paste Direct Image URL..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-[11px] text-slate-300"
                />
              </div>

              {/* 2. Header Logo */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/90 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white">Header Logo (Navbar)</label>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Optional</span>
                </div>

                {formData.header_logo_url ? (
                  <div className="p-3 bg-black/40 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
                    <img
                      src={formData.header_logo_url}
                      alt="Header Logo Preview"
                      className="h-10 max-w-[160px] object-contain"
                    />
                    <button
                      onClick={() => setFormData({ ...formData, header_logo_url: '' })}
                      className="p-1.5 rounded-lg bg-rose-950/40 text-rose-400 hover:bg-rose-900/50 text-xs"
                      title="Remove Header Logo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="h-16 rounded-xl border border-dashed border-slate-800 flex items-center justify-center text-xs text-slate-500">
                    Inherits Main Logo
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <label className="flex-1 cursor-pointer">
                    <div className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center justify-center gap-2 transition-colors border border-slate-700">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{uploadingField === 'header_logo_url' ? 'Uploading...' : 'Upload Header Logo'}</span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageUpload(e, 'header_logo_url')}
                      disabled={uploadingField !== null}
                    />
                  </label>
                </div>
                <input
                  type="text"
                  value={formData.header_logo_url}
                  onChange={(e) => setFormData({ ...formData, header_logo_url: e.target.value })}
                  placeholder="Or paste Direct Image URL..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-[11px] text-slate-300"
                />
              </div>

              {/* 3. Footer Logo */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/90 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white">Footer Logo</label>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Optional</span>
                </div>

                {formData.footer_logo_url ? (
                  <div className="p-3 bg-black/40 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
                    <img
                      src={formData.footer_logo_url}
                      alt="Footer Logo Preview"
                      className="h-10 max-w-[160px] object-contain"
                    />
                    <button
                      onClick={() => setFormData({ ...formData, footer_logo_url: '' })}
                      className="p-1.5 rounded-lg bg-rose-950/40 text-rose-400 hover:bg-rose-900/50 text-xs"
                      title="Remove Footer Logo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="h-16 rounded-xl border border-dashed border-slate-800 flex items-center justify-center text-xs text-slate-500">
                    Inherits Main Logo
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <label className="flex-1 cursor-pointer">
                    <div className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center justify-center gap-2 transition-colors border border-slate-700">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{uploadingField === 'footer_logo_url' ? 'Uploading...' : 'Upload Footer Logo'}</span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageUpload(e, 'footer_logo_url')}
                      disabled={uploadingField !== null}
                    />
                  </label>
                </div>
                <input
                  type="text"
                  value={formData.footer_logo_url}
                  onChange={(e) => setFormData({ ...formData, footer_logo_url: e.target.value })}
                  placeholder="Or paste Direct Image URL..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-[11px] text-slate-300"
                />
              </div>

              {/* 4. Favicon */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/90 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white">Browser Favicon</label>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">ICO / PNG / SVG</span>
                </div>

                {formData.favicon_url ? (
                  <div className="p-3 bg-black/40 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
                    <img
                      src={formData.favicon_url}
                      alt="Favicon Preview"
                      className="w-8 h-8 object-contain rounded"
                    />
                    <button
                      onClick={() => setFormData({ ...formData, favicon_url: '' })}
                      className="p-1.5 rounded-lg bg-rose-950/40 text-rose-400 hover:bg-rose-900/50 text-xs"
                      title="Remove Favicon"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="h-16 rounded-xl border border-dashed border-slate-800 flex items-center justify-center text-xs text-slate-500">
                    Standard App Favicon Active
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <label className="flex-1 cursor-pointer">
                    <div className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center justify-center gap-2 transition-colors border border-slate-700">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{uploadingField === 'favicon_url' ? 'Uploading...' : 'Upload Favicon'}</span>
                    </div>
                    <input
                      type="file"
                      accept="image/x-icon,image/png,image/svg+xml,image/jpeg"
                      className="hidden"
                      onChange={(e) => handleImageUpload(e, 'favicon_url')}
                      disabled={uploadingField !== null}
                    />
                  </label>
                </div>
                <input
                  type="text"
                  value={formData.favicon_url}
                  onChange={(e) => setFormData({ ...formData, favicon_url: e.target.value })}
                  placeholder="Or paste Direct Favicon URL..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-[11px] text-slate-300"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. TAB 3: THEME & COLORS */}
      {activeTab === 'theme' && (
        <div className="space-y-8">
          {/* 15 Theme Presets Grid */}
          <div className="p-6 rounded-3xl bg-[#11131c] border border-slate-800 space-y-6">
            <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Palette className="w-5 h-5 text-rose-400" />
                  <span>15 Curated Global Theme Presets</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Professional cinema palettes categorized by mood and tone. Choosing a preset updates live CSS variables instantly.
                </p>
              </div>

              <span className="text-xs px-3 py-1 rounded-full bg-rose-950/40 border border-rose-500/30 text-rose-300 font-semibold self-start sm:self-auto">
                Current Active: <b>{formData.theme_name}</b>
              </span>
            </div>

            <ThemePresetsGrid
              selectedThemeName={formData.theme_name}
              onSelectPreset={handleSelectPreset}
            />
          </div>

          {/* Custom Color Tokens & WCAG Contrast Engine */}
          <div className="p-6 rounded-3xl bg-[#11131c] border border-slate-800 space-y-6">
            <CustomThemeBuilder
              formData={formData}
              onChange={handleThemeOrStyleChange}
            />
          </div>
        </div>
      )}

      {/* 5.1 TAB 4: USER PANEL UI/UX DESIGN SYSTEM */}
      {activeTab === 'ui-design' && (
        <div className="space-y-8">
          <UserPanelDesignSettings
            onApplyDesign={async (designId) => {
              const updated = { ...formData, user_panel_design: designId };
              setFormData(updated);
              await updateSettings(updated);
            }}
            isSaving={saving}
          />

          {/* Micro-Tuning UI Geometry & Elevation */}
          <div className="p-6 rounded-3xl bg-[#11131c] border border-slate-800 space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-rose-400" />
                <span>Micro-Tuning UI Geometry Tokens</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Fine-tune card elevation, surface blur, and corner curvature tokens on top of your selected User Panel design.
              </p>
            </div>
            <UIDesignSettings
              formData={formData}
              onChange={handleThemeOrStyleChange}
            />
          </div>
        </div>
      )}

      {/* 6. TAB 4: FOOTER CMS */}
      {activeTab === 'footer' && (
        <div className="space-y-6">
          {/* Footer Branding & Description */}
          <div className="p-6 rounded-3xl bg-[#11131c] border border-slate-800 space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Layout className="w-5 h-5 text-rose-400" />
                <span>Footer Branding & Description</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Customize the copy, brand name, and status pills shown in the public footer.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Footer Brand Name
                </label>
                <input
                  type="text"
                  value={formData.footer_name}
                  onChange={(e) => setFormData({ ...formData, footer_name: e.target.value })}
                  placeholder="e.g. StreamVault"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Copyright Text
                </label>
                <input
                  type="text"
                  value={formData.copyright_text}
                  onChange={(e) => setFormData({ ...formData, copyright_text: e.target.value })}
                  placeholder="e.g. StreamVault Inc. All rights reserved."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white"
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Footer Paragraph Description
                </label>
                <textarea
                  rows={2}
                  value={formData.footer_description}
                  onChange={(e) => setFormData({ ...formData, footer_description: e.target.value })}
                  placeholder="Enter footer summary..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white leading-relaxed"
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Bottom Disclaimer Notice
                </label>
                <input
                  type="text"
                  value={formData.footer_disclaimer}
                  onChange={(e) => setFormData({ ...formData, footer_disclaimer: e.target.value })}
                  placeholder="e.g. Strict non-social video streaming platform..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  id="auto-year-toggle"
                  type="checkbox"
                  checked={formData.auto_copyright_year}
                  onChange={(e) => setFormData({ ...formData, auto_copyright_year: e.target.checked })}
                  className="rounded bg-slate-900 border-slate-800 text-rose-600 focus:ring-rose-500 w-4 h-4"
                />
                <label htmlFor="auto-year-toggle" className="text-xs text-slate-300 font-semibold cursor-pointer">
                  Auto-inject current year ({new Date().getFullYear()}) into copyright line
                </label>
              </div>
            </div>
          </div>

          {/* Configurable Status Items */}
          <div className="p-6 rounded-3xl bg-[#11131c] border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-emerald-400" />
              <span>Footer Status & Security Badges</span>
            </h3>
            <p className="text-xs text-slate-400">
              Control the visibility and text labels for the three infrastructure badges shown below the footer brand.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              {/* RLS Enforced */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">RLS Status Badge</span>
                  <input
                    type="checkbox"
                    checked={formData.status_rls_enabled}
                    onChange={(e) => setFormData({ ...formData, status_rls_enabled: e.target.checked })}
                    className="w-4 h-4 rounded text-rose-600"
                  />
                </div>
                <input
                  type="text"
                  value={formData.status_rls_text}
                  onChange={(e) => setFormData({ ...formData, status_rls_text: e.target.value })}
                  placeholder="RLS Enforced"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                />
              </div>

              {/* RBAC */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">RBAC Status Badge</span>
                  <input
                    type="checkbox"
                    checked={formData.status_rbac_enabled}
                    onChange={(e) => setFormData({ ...formData, status_rbac_enabled: e.target.checked })}
                    className="w-4 h-4 rounded text-rose-600"
                  />
                </div>
                <input
                  type="text"
                  value={formData.status_rbac_text}
                  onChange={(e) => setFormData({ ...formData, status_rbac_text: e.target.value })}
                  placeholder="Multi-Role RBAC"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                />
              </div>

              {/* Supabase Connection */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Supabase Live Badge</span>
                  <input
                    type="checkbox"
                    checked={formData.status_supabase_enabled}
                    onChange={(e) =>
                      setFormData({ ...formData, status_supabase_enabled: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-rose-600"
                  />
                </div>
                <input
                  type="text"
                  value={formData.status_supabase_text}
                  onChange={(e) =>
                    setFormData({ ...formData, status_supabase_text: e.target.value })
                  }
                  placeholder="Supabase Connected"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                />
              </div>
            </div>
          </div>

          {/* Footer Sections & Links Manager */}
          <div className="p-6 rounded-3xl bg-[#11131c] border border-slate-800 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-400" />
                  <span>Footer Navigation Groups & Links Manager</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Create, reorder, edit, and toggle visibility of footer columns and individual link items.
                </p>
              </div>

              {/* Add New Section Inline */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newSectionTitle}
                  onChange={(e) => setNewSectionTitle(e.target.value)}
                  placeholder="New Section Title..."
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white"
                />
                <button
                  type="button"
                  onClick={handleAddSection}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shrink-0 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Group</span>
                </button>
              </div>
            </div>

            {/* List of Footer Sections */}
            <div className="space-y-4">
              {(formData.footer_sections || []).map((sec, secIdx) => (
                <div
                  key={sec.id}
                  className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800/80 pb-3">
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        value={sec.title}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            footer_sections: formData.footer_sections.map((s) =>
                              s.id === sec.id ? { ...s, title: e.target.value } : s
                            ),
                          })
                        }
                        className="font-bold text-sm text-white bg-transparent border-b border-transparent focus:border-rose-500 focus:outline-none px-1 py-0.5"
                      />
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          sec.enabled
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        {sec.enabled ? 'Visible' : 'Hidden'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleMoveSection(secIdx, 'up')}
                        disabled={secIdx === 0}
                        className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30"
                        title="Move Up"
                      >
                        <MoveUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMoveSection(secIdx, 'down')}
                        disabled={secIdx === formData.footer_sections.length - 1}
                        className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30"
                        title="Move Down"
                      >
                        <MoveDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleToggleSection(sec.id)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-200"
                      >
                        {sec.enabled ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        onClick={() => handleDeleteSection(sec.id)}
                        className="p-1.5 rounded-lg bg-rose-950/40 text-rose-400 hover:bg-rose-900/50"
                        title="Delete Section"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Section's Links */}
                  <div className="space-y-2 pl-2">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Links in this group ({sec.links?.length || 0}):
                    </p>

                    <div className="space-y-2">
                      {(sec.links || []).map((link) => (
                        <div
                          key={link.id}
                          className="flex items-center justify-between gap-3 p-2.5 bg-slate-950/80 rounded-xl border border-slate-800/80 text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-white">{link.label}</span>
                            <span className="text-slate-500 font-mono text-[11px]">{link.url}</span>
                            {link.open_new_tab && (
                              <span className="text-[10px] text-slate-500 flex items-center gap-1">
                                <ExternalLink className="w-3 h-3" /> New Tab
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleToggleLink(sec.id, link.id)}
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                link.enabled
                                  ? 'bg-emerald-500/10 text-emerald-400'
                                  : 'bg-slate-800 text-slate-500'
                              }`}
                            >
                              {link.enabled ? 'Active' : 'Disabled'}
                            </button>
                            <button
                              onClick={() => handleDeleteLink(sec.id, link.id)}
                              className="text-slate-500 hover:text-rose-400 p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Add Link Form inside Section */}
                    {editingSectionId === sec.id ? (
                      <div className="p-3 bg-slate-950 rounded-xl border border-indigo-500/30 space-y-3 mt-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <input
                            type="text"
                            placeholder="Link Label (e.g. Terms)"
                            value={linkForm.label}
                            onChange={(e) => setLinkForm({ ...linkForm, label: e.target.value })}
                            className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                          />
                          <input
                            type="text"
                            placeholder="Link URL (e.g. /terms or https://...)"
                            value={linkForm.url}
                            onChange={(e) => setLinkForm({ ...linkForm, url: e.target.value })}
                            className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2 text-xs text-slate-300">
                            <input
                              type="checkbox"
                              checked={linkForm.open_new_tab}
                              onChange={(e) =>
                                setLinkForm({ ...linkForm, open_new_tab: e.target.checked })
                              }
                              className="rounded bg-slate-900 border-slate-800 text-indigo-600"
                            />
                            <span>Open in new tab</span>
                          </label>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setEditingSectionId(null)}
                              className="px-2.5 py-1 rounded bg-slate-800 text-xs text-slate-300"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleAddLinkToSection(sec.id)}
                              className="px-3 py-1 rounded bg-indigo-600 text-xs font-semibold text-white"
                            >
                              Save Link
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingSectionId(sec.id);
                          setLinkForm({ label: '', url: '', open_new_tab: false });
                        }}
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1.5 pt-2"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add link to "{sec.title}"</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 7. TAB 5: SOCIAL LINKS */}
      {activeTab === 'social' && (
        <div className="p-6 rounded-3xl bg-[#11131c] border border-slate-800 space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Share2 className="w-5 h-5 text-pink-400" />
              <span>Social Media Accounts & Public Channels</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Enable platforms and configure direct channel URLs. Disabled or empty channels are automatically omitted from the public footer.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(formData.footer_social_links || []).map((soc) => (
              <div
                key={soc.id}
                className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">{soc.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400 font-semibold">
                      {soc.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                    <input
                      type="checkbox"
                      checked={soc.enabled}
                      onChange={() => handleToggleSocial(soc.id)}
                      className="w-4 h-4 rounded text-rose-600"
                    />
                  </div>
                </div>
                <input
                  type="text"
                  value={soc.url}
                  onChange={(e) => handleUpdateSocialUrl(soc.id, e.target.value)}
                  placeholder={`https://${soc.platform}.com/...`}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 8. TAB 6: CONTACT INFORMATION */}
      {activeTab === 'contact' && (
        <div className="p-6 rounded-3xl bg-[#11131c] border border-slate-800 space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Phone className="w-5 h-5 text-emerald-400" />
              <span>Contact Information & Corporate Details</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Optionally display your support email, contact phone, headquarters address, and helpdesk URL in the public footer.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Support Email
              </label>
              <input
                type="email"
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                placeholder="support@yourdomain.com"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Contact Phone
              </label>
              <input
                type="text"
                value={formData.contact_phone}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                placeholder="+1 (800) 555-0199"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Support Desk / Documentation URL
              </label>
              <input
                type="text"
                value={formData.support_url}
                onChange={(e) => setFormData({ ...formData, support_url: e.target.value })}
                placeholder="https://help.yourdomain.com"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Headquarters Address
              </label>
              <input
                type="text"
                value={formData.contact_address}
                onChange={(e) => setFormData({ ...formData, contact_address: e.target.value })}
                placeholder="100 Streaming Boulevard, Suite 400..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* 9. TAB 7: SEO & METADATA */}
      {activeTab === 'seo' && (
        <div className="p-6 rounded-3xl bg-[#11131c] border border-slate-800 space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Globe className="w-5 h-5 text-sky-400" />
              <span>Search Engine Optimization & OpenGraph Metadata</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Customize the browser title bar, meta description, and social share cards for search engines and social platforms.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Browser Meta Title
              </label>
              <input
                type="text"
                value={formData.meta_title}
                onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                placeholder="StreamVault — Next-Generation Video Streaming"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Meta Keywords
              </label>
              <input
                type="text"
                value={formData.meta_keywords}
                onChange={(e) => setFormData({ ...formData, meta_keywords: e.target.value })}
                placeholder="video, streaming, cinema, supabase, react"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white"
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Search Meta Description
              </label>
              <textarea
                rows={2}
                value={formData.meta_description}
                onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                placeholder="Stream high-definition cinema and original productions securely..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                OpenGraph Share Title (OG Title)
              </label>
              <input
                type="text"
                value={formData.og_title}
                onChange={(e) => setFormData({ ...formData, og_title: e.target.value })}
                placeholder="StreamVault — Watch Videos Anytime"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                OpenGraph Share Image URL
              </label>
              <input
                type="text"
                value={formData.og_image_url}
                onChange={(e) => setFormData({ ...formData, og_image_url: e.target.value })}
                placeholder="https://yourdomain.com/og-banner.jpg"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* 10. TAB 8: WEBSITE MAINTENANCE */}
      {activeTab === 'maintenance' && (
        <div className="p-6 rounded-3xl bg-[#11131c] border border-slate-800 space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              <span>Website Maintenance Mode</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              When Maintenance Mode is ON, general public visitors are shown an informative maintenance screen. Super Admins retain unrestricted access to the <code>/admin</code> portal.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white">Enable Maintenance Mode</h4>
                <p className="text-xs text-slate-400">
                  {formData.maintenance_mode
                    ? '⚠️ Maintenance mode is currently ACTIVE. Public visitors cannot browse videos.'
                    : '✓ Website is currently LIVE for all users.'}
                </p>
              </div>

              <input
                type="checkbox"
                checked={formData.maintenance_mode}
                onChange={(e) => setFormData({ ...formData, maintenance_mode: e.target.checked })}
                className="w-5 h-5 rounded text-amber-500 focus:ring-amber-400"
              />
            </div>

            {formData.maintenance_mode && (
              <div className="space-y-2 pt-2">
                <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider">
                  Public Maintenance Notice Banner
                </label>
                <textarea
                  rows={3}
                  value={formData.maintenance_notice}
                  onChange={(e) => setFormData({ ...formData, maintenance_notice: e.target.value })}
                  placeholder="Enter message to display to visitors during maintenance..."
                  className="w-full bg-slate-950 border border-amber-500/30 rounded-xl p-3 text-xs text-white"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* 11. TAB 10: REAL-TIME INTERACTIVE LIVE PREVIEW */}
      {activeTab === 'preview' && (
        <div className="space-y-8">
          {/* Full Design System Interactive Sandbox */}
          <LiveThemePreviewCanvas
            settings={formData}
            onResetToCurrent={() => {
              setFormData(globalSettings);
              revertPreviewTheme();
            }}
          />

          {/* Real-Time Live Footer Preview */}
          <div className="p-6 rounded-3xl bg-[#11131c] border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Eye className="w-5 h-5 text-rose-400" />
                  <span>Real-Time Public Footer Preview</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  This preview renders the public footer exactly as it will appear with your current modifications.
                </p>
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow flex items-center gap-1.5 transition-all"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Live Version</span>
              </button>
            </div>

            {/* Embedded Live Footer with custom preview tokens */}
            <div className="rounded-2xl border border-slate-700/80 overflow-hidden shadow-2xl">
              <Footer navigate={() => {}} previewSettings={formData} />
            </div>
          </div>
        </div>
      )}

      {/* 12. BOTTOM FLOATING SAVE BAR FOR EASY SUBMISSION */}
      <div className="p-4 rounded-2xl bg-[#131522]/95 border border-slate-800 backdrop-blur flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-2xl">
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <Info className="w-4 h-4 text-slate-400" />
          <span>
            {isDirty
              ? 'You have unsaved changes in your staging configuration.'
              : 'All settings are synchronized with database storage.'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setFormData(globalSettings);
              revertPreviewTheme();
            }}
            disabled={!isDirty || saving}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-semibold text-slate-300 transition-colors"
          >
            Discard Changes
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-rose-950/50 flex items-center gap-2 transition-transform hover:scale-[1.02]"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </div>

      {/* MODAL: Reset to Default Confirmation */}
      {resetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#131520] border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-400">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-bold text-white">Reset All Settings to Default?</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              This action will reset your Website Identity, Branding, 15-Theme selection, and Footer CMS back to the factory StreamVault configuration.
              <br />
              <span className="text-slate-400 text-[11px] block mt-1">
                Note: No video files, user accounts, or categories will be deleted.
              </span>
            </p>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                onClick={() => setResetModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReset}
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white"
              >
                {saving ? 'Resetting...' : 'Confirm Reset'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Unsaved Changes Protection */}
      {unsavedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#131520] border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-400">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-bold text-white">You have unsaved changes</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              You have modified website settings that haven't been saved yet. Would you like to save them before proceeding, or discard?
            </p>

            <div className="flex items-center justify-end gap-2 pt-3">
              <button
                onClick={() => {
                  setUnsavedModalOpen(false);
                  setPendingTab(null);
                }}
                className="px-3.5 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-700"
              >
                Stay
              </button>
              <button
                onClick={() => {
                  setFormData(globalSettings);
                  setUnsavedModalOpen(false);
                  if (pendingTab) setActiveTab(pendingTab);
                  setPendingTab(null);
                }}
                className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Leave Without Saving
              </button>
              <button
                onClick={async () => {
                  await handleSave();
                  if (pendingTab) setActiveTab(pendingTab);
                  setPendingTab(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white"
              >
                Save & Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
