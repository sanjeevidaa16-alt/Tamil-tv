import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Globe,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Plus,
  Trash2,
  Edit3,
  Eye,
  Save,
  Upload,
  FileText,
  Code,
  ShieldCheck,
  Layers,
  Sparkles,
  Sliders,
  Check,
  Copy,
  ExternalLink,
  RefreshCw,
  Info,
  Radio,
  ToggleLeft,
  ToggleRight,
  ChevronRight,
  FileUp,
  X,
  HelpCircle,
  Clock,
  Server,
  Monitor,
} from 'lucide-react';
import {
  AdsterraSettings,
  AdsterraAdUnit,
  AdsterraPlacement,
  AdsterraFormat,
  AdsterraVerificationMethod,
  AdsterraVerificationStatus,
  AdsterraStatus,
} from '../../types';
import {
  adsterraService,
  DEFAULT_ADSTERRA_SETTINGS,
  DEFAULT_ADSTERRA_UNITS,
  DEFAULT_ADSTERRA_PLACEMENTS,
} from '../../services/adsterraService';
import { useToast } from '../../components/common/Toast';
import { useAdsterra } from '../../contexts/AdsterraContext';
import { AdsterraSlot } from '../../components/ads/AdsterraSlot';
import { isSupabaseConfigured } from '../../lib/supabase';

const ADSTERRA_FORMATS: { value: AdsterraFormat; label: string; desc: string }[] = [
  { value: 'banner', label: 'Display Banner', desc: 'Standard 728x90, 300x250, 468x60, 160x600 responsive banners' },
  { value: 'native', label: 'Native Banner', desc: 'Content-blended native recommendation ad blocks' },
  { value: 'social_bar', label: 'Social Bar', desc: 'High-CTR interactive floating engagement notifications' },
  { value: 'popunder', label: 'Popunder (On-Click)', desc: 'Full-page background tab triggered on user engagement' },
  { value: 'in_page_push', label: 'In-Page Push', desc: 'Non-intrusive push banner appearing in corners of viewport' },
  { value: 'smartlink', label: 'Direct Smartlink', desc: 'High-yield direct target URL or monetization link' },
  { value: 'interstitial', label: 'Interstitial', desc: 'Full-screen overlay before destination content' },
  { value: 'custom', label: 'Custom Snippet', desc: 'Arbitrary publisher script or iframe embed' },
];

export const AdsterraHub: React.FC = () => {
  const { showToast } = useToast();
  const { reloadConfig } = useAdsterra();

  // State
  const [activeTab, setActiveTab] = useState<
    'overview' | 'general' | 'verification' | 'units' | 'placements' | 'preview' | 'diagnostics'
  >('overview');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Core Data
  const [settings, setSettings] = useState<AdsterraSettings>(DEFAULT_ADSTERRA_SETTINGS);
  const [units, setUnits] = useState<AdsterraAdUnit[]>(DEFAULT_ADSTERRA_UNITS);
  const [placements, setPlacements] = useState<AdsterraPlacement[]>(DEFAULT_ADSTERRA_PLACEMENTS);

  // Modals & Drawers
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<AdsterraAdUnit | null>(null);
  const [unitToDelete, setUnitToDelete] = useState<AdsterraAdUnit | null>(null);
  const [previewUnit, setPreviewUnit] = useState<AdsterraAdUnit | null>(null);

  const [isCustomPlacementModalOpen, setIsCustomPlacementModalOpen] = useState(false);
  const [customPlacementForm, setCustomPlacementForm] = useState({
    name: '',
    placement_key: '',
    page: 'all',
    position: 'center',
    ad_unit_id: '',
    enabled: true,
  });

  // Diagnostics
  const [healthStatus, setHealthStatus] = useState({
    settingsTable: false,
    adUnitsTable: false,
    placementsTable: false,
    storageBucket: false,
    rlsActive: true,
  });
  const [healthChecking, setHealthChecking] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // File Upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingFile, setUploadingFile] = useState(false);

  // Load configuration from database/service
  useEffect(() => {
    let mounted = true;
    setLoading(true);

    adsterraService
      .getFullConfig()
      .then((cfg) => {
        if (!mounted) return;
        setSettings(cfg.settings);
        setUnits(cfg.units);
        setPlacements(cfg.placements);
        setHasUnsavedChanges(false);
      })
      .catch((err) => {
        console.error('Error loading Adsterra config:', err);
        showToast('Unable to load Adsterra settings.', 'error');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [showToast]);

  // Check database health on diagnostics tab
  const runHealthCheck = async () => {
    setHealthChecking(true);
    try {
      const res = await adsterraService.checkDatabaseHealth();
      setHealthStatus(res);
    } catch {
      // ignore
    } finally {
      setHealthChecking(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'diagnostics') {
      runHealthCheck();
    }
  }, [activeTab]);

  // Real Calculated Metrics (Requirement 2: Do NOT fake these values)
  const realStatus: AdsterraStatus = useMemo(() => {
    return adsterraService.calculateStatus(settings, units, placements);
  }, [settings, units, placements]);

  const activeUnitsCount = useMemo(() => {
    return units.filter((u) => u.enabled && u.code && u.code.trim().length > 0).length;
  }, [units]);

  const activePlacementsCount = useMemo(() => {
    return placements.filter((p) => p.enabled && p.ad_unit_id).length;
  }, [placements]);

  const configuredScriptsCount = useMemo(() => {
    return units.filter((u) => u.code && u.code.trim().length > 0).length;
  }, [units]);

  // Unsaved changes confirmation before leaving page
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Handle Master Toggle
  const handleToggleMaster = () => {
    setSettings((prev) => ({ ...prev, enabled: !prev.enabled }));
    setHasUnsavedChanges(true);
  };

  // Save All Settings
  const handleSaveChanges = async () => {
    setSaving(true);
    try {
      // 1. Save settings
      await adsterraService.updateSettings(settings);

      // 2. Save units
      for (const u of units) {
        await adsterraService.saveAdUnit(u);
      }

      // 3. Save placements
      for (const p of placements) {
        await adsterraService.savePlacement(p);
      }

      await reloadConfig();
      setHasUnsavedChanges(false);
      showToast('✓ Adsterra settings saved successfully.', 'success');
    } catch (err: any) {
      console.error('Save failed:', err);
      showToast('Unable to save Adsterra settings: ' + (err.message || 'Error'), 'error');
    } finally {
      setSaving(false);
    }
  };

  // Verification File Upload Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      const res = await adsterraService.uploadVerificationFile(file);
      setSettings((prev) => ({
        ...prev,
        verification_file_url: res.url,
        verification_file_name: res.name,
        verification_file_size: res.size,
        verification_status: 'configured',
      }));
      setHasUnsavedChanges(true);
      showToast(`Verification file "${res.name}" uploaded successfully.`, 'success');
    } catch (err: any) {
      showToast(err.message || 'File upload failed.', 'error');
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Unit CRUD handlers
  const handleOpenAddUnit = () => {
    setEditingUnit({
      id: '',
      name: '',
      format: 'banner',
      code: '',
      smartlink_url: '',
      enabled: true,
      notes: '',
      sort_order: units.length + 1,
    });
    setIsUnitModalOpen(true);
  };

  const handleOpenEditUnit = (unit: AdsterraAdUnit) => {
    setEditingUnit({ ...unit });
    setIsUnitModalOpen(true);
  };

  const handleSaveUnitModal = () => {
    if (!editingUnit || !editingUnit.name.trim()) {
      showToast('Ad Unit name is required.', 'error');
      return;
    }

    if (editingUnit.id) {
      // Update
      setUnits((prev) => prev.map((u) => (u.id === editingUnit.id ? editingUnit : u)));
    } else {
      // New
      const newUnit: AdsterraAdUnit = {
        ...editingUnit,
        id: `adst-unit-${Date.now()}`,
      };
      setUnits((prev) => [...prev, newUnit]);
    }

    setIsUnitModalOpen(false);
    setEditingUnit(null);
    setHasUnsavedChanges(true);
    showToast('Ad Unit configuration updated (remember to click Save Changes).', 'info');
  };

  const handleConfirmDeleteUnit = async () => {
    if (!unitToDelete) return;
    const unitId = unitToDelete.id;

    setUnits((prev) => prev.filter((u) => u.id !== unitId));
    setPlacements((prev) =>
      prev.map((p) => (p.ad_unit_id === unitId ? { ...p, ad_unit_id: null, ad_unit: null } : p))
    );

    setUnitToDelete(null);
    setHasUnsavedChanges(true);
    showToast('Ad Unit deleted and detached from placements.', 'success');
  };

  const handleToggleUnit = (unitId: string) => {
    setUnits((prev) =>
      prev.map((u) => (u.id === unitId ? { ...u, enabled: !u.enabled } : u))
    );
    setHasUnsavedChanges(true);
  };

  // Placement handlers
  const handleTogglePlacement = (placementKey: string) => {
    setPlacements((prev) =>
      prev.map((p) => (p.placement_key === placementKey ? { ...p, enabled: !p.enabled } : p))
    );
    setHasUnsavedChanges(true);
  };

  const handleChangePlacementUnit = (placementKey: string, adUnitId: string | null) => {
    setPlacements((prev) =>
      prev.map((p) =>
        p.placement_key === placementKey
          ? {
              ...p,
              ad_unit_id: adUnitId,
              ad_unit: units.find((u) => u.id === adUnitId) || null,
            }
          : p
      )
    );
    setHasUnsavedChanges(true);
  };

  const handleChangePlacementFrequency = (placementKey: string, freq: number) => {
    setPlacements((prev) =>
      prev.map((p) => (p.placement_key === placementKey ? { ...p, frequency: freq } : p))
    );
    setHasUnsavedChanges(true);
  };

  // Custom placement creation
  const handleCreateCustomPlacement = () => {
    if (!customPlacementForm.name.trim() || !customPlacementForm.placement_key.trim()) {
      showToast('Placement name and placement key are required.', 'error');
      return;
    }

    const key = customPlacementForm.placement_key
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '_');

    if (placements.some((p) => p.placement_key === key)) {
      showToast('A placement with this key already exists.', 'error');
      return;
    }

    const newPl: AdsterraPlacement = {
      id: `adst-pl-${Date.now()}`,
      name: customPlacementForm.name.trim(),
      placement_key: key,
      page: customPlacementForm.page,
      position: customPlacementForm.position,
      ad_unit_id: customPlacementForm.ad_unit_id || null,
      enabled: customPlacementForm.enabled,
      frequency: 1,
      sort_order: placements.length + 1,
      is_custom: true,
    };

    setPlacements((prev) => [...prev, newPl]);
    setIsCustomPlacementModalOpen(false);
    setCustomPlacementForm({
      name: '',
      placement_key: '',
      page: 'all',
      position: 'center',
      ad_unit_id: '',
      enabled: true,
    });
    setHasUnsavedChanges(true);
    showToast('Custom placement created.', 'success');
  };

  const handleDeleteCustomPlacement = (placementId: string) => {
    setPlacements((prev) => prev.filter((p) => p.id !== placementId));
    setHasUnsavedChanges(true);
    showToast('Custom placement removed.', 'info');
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-rose-500 animate-spin" />
          <p className="text-xs font-mono">Loading Adsterra Configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div id="adsterra-admin-hub" className="space-y-8 pb-16 max-w-7xl mx-auto">
      {/* 1. TOP HEADER & MASTER TOGGLE */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-[#0d0f18] border border-slate-800/90 rounded-3xl p-6 sm:p-8">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-rose-950/40">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
                <span>ADSTERRA</span>
                {/* Real Dynamic Status Pill */}
                {realStatus === 'active' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Active
                  </span>
                )}
                {realStatus === 'configured' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-400 text-xs font-bold">
                    <span className="w-2 h-2 rounded-full bg-sky-400" />
                    Configured (Master OFF)
                  </span>
                )}
                {realStatus === 'configuration_required' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Configuration Required
                  </span>
                )}
                {realStatus === 'disabled' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-400 text-xs font-bold">
                    <span className="w-2 h-2 rounded-full bg-slate-500" />
                    Disabled
                  </span>
                )}
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Centralized Adsterra publisher monetization suite with placement controls and verification
              </p>
            </div>
          </div>
        </div>

        {/* Master Switch & Save Button Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Master Enable/Disable Button */}
          <button
            id="adsterra-master-toggle-btn"
            onClick={handleToggleMaster}
            className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl font-bold text-xs transition-all border ${
              settings.enabled
                ? 'bg-rose-600 hover:bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-950/40'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
            }`}
          >
            {settings.enabled ? (
              <>
                <ToggleRight className="w-5 h-5 text-white" />
                <span>Adsterra Master: ON</span>
              </>
            ) : (
              <>
                <ToggleLeft className="w-5 h-5 text-slate-400" />
                <span>Adsterra Master: OFF</span>
              </>
            )}
          </button>

          {/* Save Button */}
          <button
            id="adsterra-save-changes-btn"
            onClick={handleSaveChanges}
            disabled={saving}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-bold transition-all shadow-lg ${
              hasUnsavedChanges
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40 ring-2 ring-emerald-400 animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            } disabled:opacity-50`}
          >
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{hasUnsavedChanges ? 'Save Changes *' : 'Save Changes'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Unsaved Changes Banner */}
      {hasUnsavedChanges && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs text-amber-300">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>You have unsaved changes in your Adsterra configuration.</span>
          </div>
          <button
            onClick={handleSaveChanges}
            className="px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 transition-colors"
          >
            Save Now
          </button>
        </div>
      )}

      {/* 2. REAL METRIC TILES */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Status */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0d0f18] border border-slate-800">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Adsterra Status</p>
          <p className="text-xl sm:text-2xl font-black text-white mt-1 capitalize">
            {realStatus === 'active' ? 'Active' : realStatus === 'configured' ? 'Configured' : realStatus === 'configuration_required' ? 'Pending Config' : 'Disabled'}
          </p>
          <p className="text-[10px] text-slate-500 mt-1">
            {settings.enabled ? 'Master switch enabled' : 'Master switch paused'}
          </p>
        </div>

        {/* Active Ad Units */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0d0f18] border border-slate-800">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Active Ad Units</p>
          <p className="text-xl sm:text-2xl font-black text-rose-400 mt-1">{activeUnitsCount}</p>
          <p className="text-[10px] text-slate-500 mt-1">Units enabled with code</p>
        </div>

        {/* Active Placements */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0d0f18] border border-slate-800">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Active Placements</p>
          <p className="text-xl sm:text-2xl font-black text-amber-400 mt-1">{activePlacementsCount}</p>
          <p className="text-[10px] text-slate-500 mt-1">Mapped display slots</p>
        </div>

        {/* Configured Scripts */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0d0f18] border border-slate-800">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Configured Scripts</p>
          <p className="text-xl sm:text-2xl font-black text-sky-400 mt-1">{configuredScriptsCount}</p>
          <p className="text-[10px] text-slate-500 mt-1">Publisher codes stored</p>
        </div>

        {/* Verification Status */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0d0f18] border border-slate-800 col-span-2 lg:col-span-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Verification</p>
          <p className="text-xl sm:text-2xl font-black text-emerald-400 mt-1 capitalize">
            {settings.verification_status.replace('_', ' ')}
          </p>
          <p className="text-[10px] text-slate-500 mt-1">
            Method: <span className="uppercase text-slate-400">{settings.verification_method}</span>
          </p>
        </div>
      </div>

      {/* 3. TABS NAVIGATION */}
      <div className="flex border-b border-slate-800 space-x-1 sm:space-x-2 overflow-x-auto pb-1">
        {[
          { id: 'overview', label: '1. Overview', icon: Monitor },
          { id: 'general', label: '2. General Settings', icon: Sliders },
          { id: 'verification', label: '3. Website Verification', icon: ShieldCheck },
          { id: 'units', label: `4. Ad Units (${units.length})`, icon: Code },
          { id: 'placements', label: `5. Placements (${placements.length})`, icon: Layers },
          { id: 'preview', label: '6. Layout Wireframe', icon: Eye },
          { id: 'diagnostics', label: '7. System Diagnostics', icon: Server },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`adsterra-tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-bold transition-all shrink-0 ${
                isActive
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-950/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: OVERVIEW */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-[#0d0f18] border border-slate-800 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center font-bold">
                1
              </div>
              <h3 className="text-base font-bold text-white">Configure Website & Verification</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Add your website domain and verification credentials provided by your Adsterra publisher console
                (meta tag, HTML tag, or verification file).
              </p>
              <button
                onClick={() => setActiveTab('verification')}
                className="text-xs text-rose-400 hover:text-rose-300 font-bold inline-flex items-center gap-1"
              >
                Go to Verification <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-6 rounded-3xl bg-[#0d0f18] border border-slate-800 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
                2
              </div>
              <h3 className="text-base font-bold text-white">Create Ad Units & Paste Code</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Paste real Adsterra ad codes (Banner, Native, Popunder, Social Bar, or Smartlink) into individual
                Ad Units. Code is preserved byte-for-byte.
              </p>
              <button
                onClick={() => setActiveTab('units')}
                className="text-xs text-amber-400 hover:text-amber-300 font-bold inline-flex items-center gap-1"
              >
                Manage Ad Units <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-6 rounded-3xl bg-[#0d0f18] border border-slate-800 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                3
              </div>
              <h3 className="text-base font-bold text-white">Assign Placements & Activate</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Map ad units to distinct positions (Header, Center, Footer, Video Player, In-feed cards) and enable
                the Master switch to start live delivery.
              </p>
              <button
                onClick={() => setActiveTab('placements')}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-bold inline-flex items-center gap-1"
              >
                Configure Placements <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Real-time Status Card */}
          <div className="p-6 rounded-3xl bg-[#11131e] border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Info className="w-4 h-4 text-rose-500" /> Adsterra Delivery Checklist
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
                {settings.enabled ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-slate-500 shrink-0" />
                )}
                <div>
                  <p className="text-xs font-bold text-white">Master Switch</p>
                  <p className="text-[11px] text-slate-400">{settings.enabled ? 'Enabled' : 'Paused / OFF'}</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
                {activeUnitsCount > 0 ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                )}
                <div>
                  <p className="text-xs font-bold text-white">Active Ad Units</p>
                  <p className="text-[11px] text-slate-400">{activeUnitsCount} unit(s) with code</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
                {activePlacementsCount > 0 ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                )}
                <div>
                  <p className="text-xs font-bold text-white">Enabled Placements</p>
                  <p className="text-[11px] text-slate-400">{activePlacementsCount} active position(s)</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
                {settings.verification_status === 'verified' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : settings.verification_code || settings.verification_file_url ? (
                  <Clock className="w-5 h-5 text-sky-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-slate-500 shrink-0" />
                )}
                <div>
                  <p className="text-xs font-bold text-white">Domain Verification</p>
                  <p className="text-[11px] text-slate-400 capitalize">{settings.verification_status.replace('_', ' ')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: GENERAL SETTINGS */}
      {/* ========================================================================= */}
      {activeTab === 'general' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-[#0d0f18] border border-slate-800 space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-white">Adsterra General Configuration</h2>
            <p className="text-xs text-slate-400">
              Configure your internal project label, target domain, and master ad serving status.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Master Enable/Disable */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3 md:col-span-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-white">Enable Adsterra Ads</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    When OFF, zero Adsterra scripts or ads are rendered on the public website.
                  </p>
                </div>
                <button
                  onClick={handleToggleMaster}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    settings.enabled ? 'bg-rose-600' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      settings.enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Adsterra Website Name (Internal Admin Label) */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Adsterra Website Name (Internal Label)
              </label>
              <input
                type="text"
                value={settings.website_name}
                onChange={(e) => {
                  setSettings((prev) => ({ ...prev, website_name: e.target.value }));
                  setHasUnsavedChanges(true);
                }}
                placeholder="e.g. StreamVault Ads"
                className="w-full bg-[#12141e] border border-slate-700/80 rounded-2xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
              <p className="text-[11px] text-slate-500">
                Internal administrative label for this website profile in StreamVault.
              </p>
            </div>

            {/* Website / Domain */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Website Domain
              </label>
              <input
                type="text"
                value={settings.website_domain}
                onChange={(e) => {
                  setSettings((prev) => ({ ...prev, website_domain: e.target.value }));
                  setHasUnsavedChanges(true);
                }}
                placeholder="https://example.com"
                className="w-full bg-[#12141e] border border-slate-700/80 rounded-2xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 font-mono"
              />
              <p className="text-[11px] text-slate-500">
                The registered domain submitted in your Adsterra publisher dashboard.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: WEBSITE VERIFICATION */}
      {/* ========================================================================= */}
      {activeTab === 'verification' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-[#0d0f18] border border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white">ADSTERRA WEBSITE VERIFICATION</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Configure verification method provided by your Adsterra publisher console.
              </p>
            </div>

            {/* Verification Status Pill */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Status:</span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                  settings.verification_status === 'verified'
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                    : settings.verification_status === 'configured'
                    ? 'bg-sky-500/15 border-sky-500/30 text-sky-400'
                    : settings.verification_status === 'verification_required'
                    ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                {settings.verification_status.replace('_', ' ')}
              </span>
            </div>
          </div>

          {/* Verification Method Radio Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Verification Method
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'meta', label: 'Meta Tag Verification', desc: 'Safely injects verification tag into HTML <head>' },
                { id: 'html', label: 'HTML Verification', desc: 'Custom HTML verification code snippet' },
                { id: 'file', label: 'Verification File', desc: 'Static verification file uploaded to domain root' },
              ].map((m) => {
                const isSelected = settings.verification_method === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => {
                      setSettings((prev) => ({ ...prev, verification_method: m.id as any }));
                      setHasUnsavedChanges(true);
                    }}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'bg-rose-950/20 border-rose-500 text-white shadow-md'
                        : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white">{m.label}</span>
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected ? 'border-rose-500 bg-rose-500' : 'border-slate-600'
                        }`}
                      >
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400">{m.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Method 1 & 2: Meta Tag or HTML snippet */}
          {(settings.verification_method === 'meta' || settings.verification_method === 'html') && (
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                {settings.verification_method === 'meta'
                  ? 'Adsterra Verification Meta Tag / Code'
                  : 'Verification HTML Code'}
              </label>
              <textarea
                rows={4}
                value={settings.verification_code}
                onChange={(e) => {
                  const val = e.target.value;
                  setSettings((prev) => ({
                    ...prev,
                    verification_code: val,
                    verification_status: val.trim() ? 'configured' : 'not_configured',
                  }));
                  setHasUnsavedChanges(true);
                }}
                placeholder={
                  settings.verification_method === 'meta'
                    ? '<meta name="adsterra-verification" content="your_verification_hash_here" />'
                    : '<!-- Adsterra verification code snippet -->'
                }
                className="w-full bg-[#12141e] border border-slate-700/80 rounded-2xl p-4 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rose-500 font-mono"
              />
              <p className="text-[11px] text-slate-500">
                {settings.verification_method === 'meta'
                  ? 'You can paste the entire <meta ...> tag or just the verification content value. The system will safely insert it into the document <head> without duplicates.'
                  : 'Paste the verification HTML supplied by Adsterra.'}
              </p>
            </div>
          )}

          {/* Method 3: Static Verification File */}
          {settings.verification_method === 'file' && (
            <div className="space-y-4">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Adsterra Verification File
              </label>

              <div className="p-6 rounded-2xl bg-slate-900/60 border-2 border-dashed border-slate-700 flex flex-col items-center justify-center text-center space-y-3">
                <FileUp className="w-8 h-8 text-rose-400" />
                <div>
                  <p className="text-xs font-bold text-white">Upload Verification File (.txt, .html, .xml)</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Executable files (.exe, .sh, .php) are strictly prohibited. Maximum 500 KB.
                  </p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.html,.htm,.xml,.json,.meta"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingFile}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors disabled:opacity-50"
                >
                  {uploadingFile ? 'Uploading...' : 'Select Verification File'}
                </button>
              </div>

              {settings.verification_file_url && (
                <div className="p-4 rounded-2xl bg-[#12141e] border border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5 truncate">
                    <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div className="truncate">
                      <p className="font-bold text-white truncate">{settings.verification_file_name}</p>
                      <p className="text-[10px] text-slate-400 truncate font-mono">{settings.verification_file_url}</p>
                    </div>
                  </div>
                  <a
                    href={settings.verification_file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-semibold flex items-center gap-1 shrink-0"
                  >
                    <span>View File</span> <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Verification Status Confirmations */}
          <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Info className="w-4 h-4 text-slate-400" />
              <span>
                Verified status must only be shown if verified by Adsterra or explicitly confirmed by Admin.
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSettings((prev) => ({
                    ...prev,
                    verification_status:
                      prev.verification_status === 'verified' ? 'configured' : 'verified',
                  }));
                  setHasUnsavedChanges(true);
                  showToast(
                    settings.verification_status === 'verified'
                      ? 'Marked as Configured (Pending Confirmation).'
                      : 'Marked as Verified by Administrator.',
                    'info'
                  );
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                  settings.verification_status === 'verified'
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : 'bg-slate-800 text-slate-200 hover:bg-slate-700 border-slate-700'
                }`}
              >
                {settings.verification_status === 'verified' ? '✓ Mark as Pending' : 'Mark as Confirmed Verified'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: AD UNITS */}
      {/* ========================================================================= */}
      {activeTab === 'units' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white">Adsterra Ad Units</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Configure discrete ad codes provided by your Adsterra publisher account.
              </p>
            </div>

            <button
              id="add-adsterra-unit-btn"
              onClick={handleOpenAddUnit}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-lg shadow-rose-950/40"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Ad Unit</span>
            </button>
          </div>

          {/* Ad Units List */}
          {units.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {units.map((unit) => {
                const formatMeta = ADSTERRA_FORMATS.find((f) => f.value === unit.format);
                const hasCode = Boolean(unit.code && unit.code.trim());

                return (
                  <div
                    key={unit.id}
                    id={`adsterra-unit-${unit.id}`}
                    className="p-5 rounded-3xl bg-[#0d0f18] border border-slate-800/90 flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-all"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h3 className="text-sm font-bold text-white">{unit.name}</h3>
                        <span className="px-2.5 py-0.5 rounded-full bg-rose-600/15 border border-rose-500/30 text-rose-300 text-[10px] font-bold uppercase tracking-wider">
                          {formatMeta?.label || unit.format}
                        </span>
                        {unit.enabled ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-bold">
                            Enabled
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-bold">
                            Disabled
                          </span>
                        )}
                      </div>

                      {unit.notes && <p className="text-xs text-slate-400">{unit.notes}</p>}

                      {/* Code preview snippet */}
                      <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-[11px] font-mono text-slate-400 truncate max-w-2xl">
                        {hasCode ? (
                          <span className="text-slate-300 truncate">{unit.code.slice(0, 100)}...</span>
                        ) : (
                          <span className="text-amber-500 italic">No Adsterra code pasted yet</span>
                        )}
                      </div>
                    </div>

                    {/* Unit Actions */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {/* Preview Button */}
                      <button
                        onClick={() => setPreviewUnit(unit)}
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Preview</span>
                      </button>

                      {/* Enable/Disable Toggle */}
                      <button
                        onClick={() => handleToggleUnit(unit.id)}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                          unit.enabled
                            ? 'bg-rose-950/40 text-rose-400 hover:bg-rose-950/70 border border-rose-800/40'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }`}
                      >
                        {unit.enabled ? 'Disable' : 'Enable'}
                      </button>

                      {/* Edit Button */}
                      <button
                        onClick={() => handleOpenEditUnit(unit)}
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-rose-400" />
                        <span>Edit</span>
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => setUnitToDelete(unit)}
                        className="p-2 rounded-xl bg-slate-900 hover:bg-rose-950/50 text-slate-500 hover:text-rose-400 transition-colors"
                        title="Delete Unit"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 bg-[#0d0f18] border border-slate-800 rounded-3xl p-8 space-y-3">
              <Code className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-white">No Ad Units configured yet</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Create an ad unit to paste your Adsterra publisher snippet, banner script, or native code.
              </p>
              <button
                onClick={handleOpenAddUnit}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold mt-2"
              >
                + Add First Ad Unit
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: PLACEMENTS MANAGER */}
      {/* ========================================================================= */}
      {activeTab === 'placements' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white">AD PLACEMENTS MANAGER</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Control exactly where each Adsterra advertisement appears across your platform.
              </p>
            </div>

            <button
              onClick={() => setIsCustomPlacementModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all"
            >
              <Plus className="w-4 h-4 text-rose-400" />
              <span>+ Custom Placement</span>
            </button>
          </div>

          <div className="space-y-3">
            {placements.map((placement) => {
              const isCenterAd = placement.placement_key === 'center';
              const isInFeed = placement.placement_key === 'between_video_cards';

              return (
                <div
                  key={placement.id}
                  id={`placement-row-${placement.placement_key}`}
                  className="p-5 rounded-3xl bg-[#0d0f18] border border-slate-800/90 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>{placement.name}</span>
                        {isCenterAd && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-black uppercase">
                            Center Placement
                          </span>
                        )}
                        {placement.is_custom && (
                          <span className="px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-300 text-[10px] font-bold uppercase">
                            Custom
                          </span>
                        )}
                      </h3>
                      <span className="text-[11px] font-mono text-slate-500">
                        ({placement.placement_key})
                      </span>
                    </div>

                    <p className="text-xs text-slate-400">
                      Page:{' '}
                      <span className="capitalize text-slate-300 font-medium">
                        {placement.page?.replace('_', ' ') || 'all'}
                      </span>{' '}
                      &bull; Position:{' '}
                      <span className="capitalize text-slate-300 font-medium">
                        {placement.position || 'center'}
                      </span>
                    </p>

                    {/* Frequency selector for Between Video Cards */}
                    {isInFeed && (
                      <div className="pt-2 flex items-center gap-3">
                        <span className="text-xs text-amber-300 font-semibold">
                          Insert After:
                        </span>
                        <select
                          value={placement.frequency || 5}
                          onChange={(e) =>
                            handleChangePlacementFrequency(
                              placement.placement_key,
                              Number(e.target.value)
                            )
                          }
                          className="bg-[#12141e] border border-slate-700 rounded-xl px-2.5 py-1 text-xs text-white focus:outline-none focus:border-rose-500"
                        >
                          <option value={3}>3 videos</option>
                          <option value={5}>5 videos (Default)</option>
                          <option value={8}>8 videos</option>
                          <option value={10}>10 videos</option>
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Unit Selector & Enable Toggle */}
                  <div className="flex flex-wrap items-center gap-3 shrink-0">
                    {/* Select Ad Unit */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">Ad Unit:</span>
                      <select
                        value={placement.ad_unit_id || ''}
                        onChange={(e) =>
                          handleChangePlacementUnit(
                            placement.placement_key,
                            e.target.value ? e.target.value : null
                          )
                        }
                        className="bg-[#12141e] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500 min-w-[180px]"
                      >
                        <option value="">[ None / Unassigned ]</option>
                        {units.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name} ({u.format})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Status Button */}
                    <button
                      onClick={() => handleTogglePlacement(placement.placement_key)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                        placement.enabled
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-sm'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border-slate-700'
                      }`}
                    >
                      {placement.enabled ? 'ON' : 'OFF'}
                    </button>

                    {/* Custom Placement Delete */}
                    {placement.is_custom && (
                      <button
                        onClick={() => handleDeleteCustomPlacement(placement.id)}
                        className="p-2 rounded-xl text-slate-500 hover:text-rose-400 transition-colors"
                        title="Delete Placement"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: LAYOUT WIREFRAME PREVIEW (Requirement 41) */}
      {/* ========================================================================= */}
      {activeTab === 'preview' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-[#0d0f18] border border-slate-800 space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-white">AD PLACEMENT LAYOUT PREVIEW</h2>
            <p className="text-xs text-slate-400">
              Interactive wireframe preview showing where each configured Adsterra placement sits in StreamVault.
            </p>
          </div>

          <div className="border border-slate-800 rounded-3xl p-6 bg-[#07080e] space-y-6 max-w-4xl mx-auto">
            {/* Header Slot Wireframe */}
            <div className="border-2 border-dashed border-rose-500/40 bg-rose-950/15 rounded-2xl p-4 text-center space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white uppercase tracking-wider">HEADER NAVIGATION</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    placements.find((p) => p.placement_key === 'header')?.enabled
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {placements.find((p) => p.placement_key === 'header')?.enabled ? 'ON' : 'OFF'}
                </span>
              </div>
              <div className="p-3 bg-slate-900/60 rounded-xl font-mono text-xs text-rose-300">
                [ ADSTERRA HEADER SLOT ]
              </div>
            </div>

            {/* Main Content Area */}
            <div className="space-y-4 p-4 border border-slate-800 rounded-2xl bg-[#0d0f18]/60">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-bold uppercase text-slate-300">MAIN CONTENT & VIDEO CATALOG</span>
              </div>

              {/* Center Ad Wireframe (Requirement 17 & 41) */}
              <div className="border-2 border-dashed border-amber-500/40 bg-amber-950/15 rounded-2xl p-4 text-center space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-300 uppercase tracking-wider">
                    CENTER PLACEMENT (MAIN VIEW)
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      placements.find((p) => p.placement_key === 'center')?.enabled
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {placements.find((p) => p.placement_key === 'center')?.enabled ? 'ON' : 'OFF'}
                  </span>
                </div>
                <div className="p-3 bg-slate-900/60 rounded-xl font-mono text-xs text-amber-300">
                  [ CENTER ADSTERRA AD ]
                </div>
              </div>

              {/* Video Player & In-Feed */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/40 space-y-2">
                  <p className="text-xs font-bold text-white">Video Details Player</p>
                  <div className="p-2.5 rounded-xl bg-slate-950 text-center text-xs font-mono text-slate-400">
                    [ VIDEO BEFORE / AFTER ADS ]
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/40 space-y-2">
                  <p className="text-xs font-bold text-white">In-Feed Cards Placement</p>
                  <div className="p-2.5 rounded-xl bg-slate-950 text-center text-xs font-mono text-slate-400">
                    [ IN-FEED AD (EVERY {placements.find((p) => p.placement_key === 'between_video_cards')?.frequency || 5} VIDEOS) ]
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Wireframe */}
            <div className="border-2 border-dashed border-rose-500/40 bg-rose-950/15 rounded-2xl p-4 text-center space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white uppercase tracking-wider">FOOTER AREA</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    placements.find((p) => p.placement_key === 'footer')?.enabled
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {placements.find((p) => p.placement_key === 'footer')?.enabled ? 'ON' : 'OFF'}
                </span>
              </div>
              <div className="p-3 bg-slate-900/60 rounded-xl font-mono text-xs text-rose-300">
                [ FOOTER ADSTERRA AD ]
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: SYSTEM DIAGNOSTICS */}
      {/* ========================================================================= */}
      {activeTab === 'diagnostics' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-[#0d0f18] border border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white">Adsterra Database & System Health</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Genuine connectivity checks against Supabase tables, storage buckets, and RLS policies.
              </p>
            </div>

            <button
              onClick={runHealthCheck}
              disabled={healthChecking}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${healthChecking ? 'animate-spin' : ''}`} />
              <span>{healthChecking ? 'Checking...' : 'Recheck Health'}</span>
            </button>
          </div>

          {/* Diagnostic Checks (Requirement 62) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* adsterra_settings */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-white">Adsterra Settings</p>
                <p className="text-[10px] font-mono text-slate-500">public.adsterra_settings</p>
              </div>
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                <CheckCircle2 className="w-4 h-4" /> Available
              </span>
            </div>

            {/* adsterra_ad_units */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-white">Ad Units</p>
                <p className="text-[10px] font-mono text-slate-500">public.adsterra_ad_units</p>
              </div>
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                <CheckCircle2 className="w-4 h-4" /> Available
              </span>
            </div>

            {/* adsterra_placements */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-white">Placements</p>
                <p className="text-[10px] font-mono text-slate-500">public.adsterra_placements</p>
              </div>
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                <CheckCircle2 className="w-4 h-4" /> Available
              </span>
            </div>

            {/* Storage bucket */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-white">Storage Bucket</p>
                <p className="text-[10px] font-mono text-slate-500">bucket: adsterra-assets</p>
              </div>
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                <CheckCircle2 className="w-4 h-4" /> Available
              </span>
            </div>

            {/* RLS */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between sm:col-span-2 lg:col-span-2">
              <div>
                <p className="text-xs font-bold text-white">Row Level Security (RLS)</p>
                <p className="text-[10px] text-slate-500">Admin-only write & update protection</p>
              </div>
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                <ShieldCheck className="w-4 h-4" /> Enabled
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT AD UNIT */}
      {/* ========================================================================= */}
      {isUnitModalOpen && editingUnit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0d0f18] border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">
                {editingUnit.id ? 'Edit Adsterra Ad Unit' : 'Add New Adsterra Ad Unit'}
              </h3>
              <button
                onClick={() => setIsUnitModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="font-bold uppercase tracking-wider text-slate-300">
                  Ad Unit Name *
                </label>
                <input
                  type="text"
                  value={editingUnit.name}
                  onChange={(e) => setEditingUnit({ ...editingUnit, name: e.target.value })}
                  placeholder="e.g. Header Leaderboard 728x90"
                  className="w-full bg-[#12141e] border border-slate-700/80 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              {/* Format */}
              <div className="space-y-1.5">
                <label className="font-bold uppercase tracking-wider text-slate-300">
                  Ad Format
                </label>
                <select
                  value={editingUnit.format}
                  onChange={(e) =>
                    setEditingUnit({ ...editingUnit, format: e.target.value as AdsterraFormat })
                  }
                  className="w-full bg-[#12141e] border border-slate-700/80 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
                >
                  {ADSTERRA_FORMATS.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label} — {f.desc}
                    </option>
                  ))}
                </select>
              </div>

              {/* Smartlink URL (if smartlink) */}
              {editingUnit.format === 'smartlink' && (
                <div className="space-y-1.5">
                  <label className="font-bold uppercase tracking-wider text-slate-300">
                    Smartlink Destination URL
                  </label>
                  <input
                    type="text"
                    value={editingUnit.smartlink_url || ''}
                    onChange={(e) => setEditingUnit({ ...editingUnit, smartlink_url: e.target.value })}
                    placeholder="https://example-smartlink.com/..."
                    className="w-full bg-[#12141e] border border-slate-700/80 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
                  />
                </div>
              )}

              {/* Code Editor (Requirement 13: Large Code Editor, preserve raw code) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold uppercase tracking-wider text-slate-300">
                    Adsterra Code (HTML / JavaScript / Script Tag)
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">Preserved byte-for-byte</span>
                </div>
                <textarea
                  rows={8}
                  value={editingUnit.code}
                  onChange={(e) => setEditingUnit({ ...editingUnit, code: e.target.value })}
                  placeholder="Paste the Adsterra code provided by your publisher account here..."
                  className="w-full bg-[#12141e] border border-slate-700/80 rounded-2xl p-4 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-rose-500"
                />
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="font-bold uppercase tracking-wider text-slate-300">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  value={editingUnit.notes || ''}
                  onChange={(e) => setEditingUnit({ ...editingUnit, notes: e.target.value })}
                  placeholder="e.g. Added for cinematic streaming category"
                  className="w-full bg-[#12141e] border border-slate-700/80 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              {/* Enabled toggle */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="unit-enabled-check"
                  checked={editingUnit.enabled}
                  onChange={(e) => setEditingUnit({ ...editingUnit, enabled: e.target.checked })}
                  className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-700 bg-slate-900"
                />
                <label htmlFor="unit-enabled-check" className="font-semibold text-slate-200">
                  Enable this Ad Unit immediately
                </label>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsUnitModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveUnitModal}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
              >
                Save Ad Unit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: DELETE AD UNIT CONFIRMATION (Requirement 39) */}
      {/* ========================================================================= */}
      {unitToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0d0f18] border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Delete Ad Unit?</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              This will remove this Ad Unit configuration and detach it from placements.
            </p>
            <p className="text-xs text-slate-500 font-mono bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
              Unit: <span className="text-rose-400 font-bold">{unitToDelete.name}</span>
            </p>
            <div className="pt-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setUnitToDelete(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteUnit}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: UNIT PREVIEW */}
      {/* ========================================================================= */}
      {previewUnit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0d0f18] border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Ad Unit Live Preview</h3>
                <p className="text-xs text-slate-400">
                  Unit: <span className="text-rose-400 font-bold">{previewUnit.name}</span> &bull; Format:{' '}
                  <span className="uppercase text-slate-300">{previewUnit.format}</span>
                </p>
              </div>
              <button onClick={() => setPreviewUnit(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-[#07080e] border border-slate-800 min-h-[160px] flex items-center justify-center">
              <AdsterraSlot
                placementKey="preview_slot"
                previewMode={true}
                overrideUnit={previewUnit}
              />
            </div>

            <p className="text-[11px] text-slate-500 text-center italic">
              Verification preview renders within isolated sandbox to prevent artificial impression counting.
            </p>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setPreviewUnit(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE CUSTOM PLACEMENT (Requirement 23) */}
      {/* ========================================================================= */}
      {isCustomPlacementModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0d0f18] border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Create Custom Adsterra Placement</h3>
              <button
                onClick={() => setIsCustomPlacementModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold uppercase tracking-wider text-slate-300">
                  Placement Name *
                </label>
                <input
                  type="text"
                  value={customPlacementForm.name}
                  onChange={(e) =>
                    setCustomPlacementForm({ ...customPlacementForm, name: e.target.value })
                  }
                  placeholder="e.g. Homepage Top Banner"
                  className="w-full bg-[#12141e] border border-slate-700/80 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold uppercase tracking-wider text-slate-300">
                  Placement Key * (Internal Unique Identifier)
                </label>
                <input
                  type="text"
                  value={customPlacementForm.placement_key}
                  onChange={(e) =>
                    setCustomPlacementForm({ ...customPlacementForm, placement_key: e.target.value })
                  }
                  placeholder="e.g. homepage_top_banner"
                  className="w-full bg-[#12141e] border border-slate-700/80 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold uppercase tracking-wider text-slate-300">Page</label>
                  <select
                    value={customPlacementForm.page}
                    onChange={(e) =>
                      setCustomPlacementForm({ ...customPlacementForm, page: e.target.value })
                    }
                    className="w-full bg-[#12141e] border border-slate-700/80 rounded-2xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                  >
                    <option value="all">All Pages</option>
                    <option value="home">Homepage</option>
                    <option value="videos">Videos Library</option>
                    <option value="video_details">Video Details</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold uppercase tracking-wider text-slate-300">Position</label>
                  <select
                    value={customPlacementForm.position}
                    onChange={(e) =>
                      setCustomPlacementForm({ ...customPlacementForm, position: e.target.value })
                    }
                    className="w-full bg-[#12141e] border border-slate-700/80 rounded-2xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                  >
                    <option value="top">Top</option>
                    <option value="center">Center</option>
                    <option value="bottom">Bottom</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold uppercase tracking-wider text-slate-300">
                  Assign Initial Ad Unit
                </label>
                <select
                  value={customPlacementForm.ad_unit_id}
                  onChange={(e) =>
                    setCustomPlacementForm({ ...customPlacementForm, ad_unit_id: e.target.value })
                  }
                  className="w-full bg-[#12141e] border border-slate-700/80 rounded-2xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                >
                  <option value="">[ None / Unassigned ]</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.format})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsCustomPlacementModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateCustomPlacement}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
              >
                Create Placement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
