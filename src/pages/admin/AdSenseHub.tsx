import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Save,
  CheckCircle2,
  Sliders,
  AlertCircle,
  Plus,
  Edit2,
  Trash2,
  Layout,
  Code,
  Upload,
  FileText,
  Eye,
  EyeOff,
  Sparkles,
  Loader2,
  RefreshCw,
  Info,
  ShieldCheck,
  Smartphone,
  Monitor,
  Radio,
} from 'lucide-react';
import {
  AdSenseSettings,
  AdSenseUnit,
  AdPlacement,
  AdCodeSettings,
  AdFormat,
  AdPlacementKey,
} from '../../types';
import { adService } from '../../services/adService';
import { settingsService } from '../../services/settingsService';
import { useToast } from '../../components/common/Toast';
import { AdPlacementSlot } from '../../components/ads/AdPlacementSlot';

type AdSenseTab = 'settings' | 'units' | 'placements' | 'custom_code' | 'preview';

export const AdSenseHub: React.FC = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<AdSenseTab>('settings');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 1. Settings State
  const [settings, setSettings] = useState<AdSenseSettings>({
    publisher_id: '',
    ad_slot_id: '',
    enabled: false,
    placement_before_list: false,
    placement_between_cards: false,
    placement_details_page: false,
    placement_below_player: false,
  });

  // 2. Units State
  const [units, setUnits] = useState<AdSenseUnit[]>([]);
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null);
  const [unitName, setUnitName] = useState('');
  const [unitSlotId, setUnitSlotId] = useState('');
  const [unitFormat, setUnitFormat] = useState<AdFormat>('auto');
  const [unitResponsive, setUnitResponsive] = useState(true);
  const [unitEnabled, setUnitEnabled] = useState(true);

  // 3. Placements State
  const [placements, setPlacements] = useState<AdPlacement[]>([]);

  // 4. Custom Code & File Upload State
  const [customCode, setCustomCode] = useState<AdCodeSettings>({
    name: 'Global Custom Ad Code',
    code_type: 'html',
    code_content: '',
    enabled: false,
  });
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  // Fetch full configuration
  const loadData = async () => {
    setLoading(true);
    try {
      const config = await adService.getAdSenseFullConfig();
      setSettings(config.settings);
      setUnits(config.units);
      setPlacements(config.placements);
      setCustomCode(config.custom_code);
    } catch (err: any) {
      showToast(err.message || 'Failed to load AdSense configuration', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // -------------------------------------------------------------
  // 1. Save Settings Tab
  // -------------------------------------------------------------
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();

    if (settings.enabled && settings.publisher_id && !settings.publisher_id.startsWith('ca-pub-')) {
      showToast("Publisher ID must begin with 'ca-pub-' (e.g. ca-pub-1234567890123456)", 'error');
      return;
    }

    if (settings.enabled && !settings.publisher_id.trim()) {
      showToast('Please configure a valid Publisher ID before enabling AdSense.', 'error');
      return;
    }

    setSaving(true);
    try {
      await adService.updateAdSenseSettings(settings);
      showToast('AdSense settings saved successfully', 'success');
      await settingsService.logAdminAction(
        'Updated Google AdSense Settings',
        'adsense',
        'adsense_config',
        `Enabled: ${settings.enabled}`
      );
    } catch (err: any) {
      showToast(err.message || 'Failed to save AdSense settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  // -------------------------------------------------------------
  // 2. Units Management
  // -------------------------------------------------------------
  const openCreateUnit = () => {
    setEditingUnitId(null);
    setUnitName('');
    setUnitSlotId('');
    setUnitFormat('auto');
    setUnitResponsive(true);
    setUnitEnabled(true);
    setIsUnitModalOpen(true);
  };

  const openEditUnit = (u: AdSenseUnit) => {
    setEditingUnitId(u.id);
    setUnitName(u.name);
    setUnitSlotId(u.ad_slot_id);
    setUnitFormat(u.format);
    setUnitResponsive(u.responsive);
    setUnitEnabled(u.enabled);
    setIsUnitModalOpen(true);
  };

  const handleSaveUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitName.trim()) {
      showToast('Ad Unit Name is required', 'error');
      return;
    }
    if (!unitSlotId.trim()) {
      showToast('Ad Slot ID is required', 'error');
      return;
    }

    setSaving(true);
    try {
      if (editingUnitId) {
        await adService.updateAdUnit(editingUnitId, {
          name: unitName.trim(),
          ad_slot_id: unitSlotId.trim(),
          format: unitFormat,
          responsive: unitResponsive,
          enabled: unitEnabled,
        });
        showToast('Ad unit updated successfully', 'success');
      } else {
        await adService.createAdUnit({
          name: unitName.trim(),
          ad_slot_id: unitSlotId.trim(),
          format: unitFormat,
          responsive: unitResponsive,
          enabled: unitEnabled,
          sort_order: units.length + 1,
        });
        showToast('Ad unit created successfully', 'success');
      }
      setIsUnitModalOpen(false);
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to save Ad Unit', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUnit = async (id: string, name: string) => {
    if (!window.confirm(`Delete Ad Unit "${name}"?`)) return;

    try {
      await adService.deleteAdUnit(id);
      showToast(`Ad Unit "${name}" deleted`, 'success');
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete unit', 'error');
    }
  };

  const handleToggleUnitEnabled = async (unit: AdSenseUnit) => {
    const nextState = !unit.enabled;
    try {
      await adService.updateAdUnit(unit.id, { enabled: nextState });
      showToast(`Ad Unit ${nextState ? 'enabled' : 'disabled'}`, 'info');
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to update unit state', 'error');
    }
  };

  // -------------------------------------------------------------
  // 3. Placements Management
  // -------------------------------------------------------------
  const handlePlacementChange = (
    key: AdPlacementKey,
    field: 'enabled' | 'ad_unit_id' | 'frequency',
    value: any
  ) => {
    setPlacements((prev) =>
      prev.map((p) => (p.placement_key === key ? { ...p, [field]: value } : p))
    );
  };

  const handleSavePlacements = async () => {
    setSaving(true);
    try {
      await adService.saveAllPlacements(placements);
      showToast('Advertisement placements saved successfully.', 'success');
      await settingsService.logAdminAction(
        'Updated Advertisement Placements',
        'adsense',
        'placements',
        `Active placements: ${placements.filter((p) => p.enabled).length}`
      );
    } catch (err: any) {
      showToast(err.message || 'Failed to save placements', 'error');
    } finally {
      setSaving(false);
    }
  };

  // -------------------------------------------------------------
  // 4. Custom Code & File Upload
  // -------------------------------------------------------------
  const handleSaveCustomCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adService.updateCustomAdCode(customCode);
      showToast('Custom ad code saved successfully', 'success');
      await settingsService.logAdminAction(
        'Updated Custom Ad Code & Scripts',
        'adsense',
        'custom_code',
        `Enabled: ${customCode.enabled}`
      );
    } catch (err: any) {
      showToast(err.message || 'Failed to save custom ad code', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingFile(true);
    try {
      const res = await adService.uploadAdFile(file);
      setCustomCode((prev) => ({
        ...prev,
        ad_file_url: res.url,
        ad_file_name: res.fileName,
        ad_file_size: res.fileSize,
      }));
      showToast(`Uploaded ad asset "${res.fileName}" successfully`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to upload file', 'error');
    } finally {
      setIsUploadingFile(false);
      e.target.value = '';
    }
  };

  const handleDeleteUploadedFile = async () => {
    if (!window.confirm('Remove uploaded ad file?')) return;
    try {
      await adService.deleteAdFile();
      setCustomCode((prev) => ({
        ...prev,
        ad_file_url: null,
        ad_file_name: null,
        ad_file_size: null,
      }));
      showToast('Ad file removed', 'info');
    } catch (err: any) {
      showToast(err.message || 'Failed to remove file', 'error');
    }
  };

  const activePlacementCount = placements.filter((p) => p.enabled).length;
  const activeUnitCount = units.filter((u) => u.enabled).length;
  const isPublisherConfigured = Boolean(settings.publisher_id && settings.publisher_id.startsWith('ca-pub-'));

  return (
    <div id="admin-adsense-hub-page" className="space-y-8 pb-16 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <DollarSign className="w-7 h-7 text-emerald-400" />
            <span>Google AdSense</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure AdSense and control where advertisements appear across the website.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Reload Config"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Status */}
        <div className="p-4 rounded-2xl bg-[#11131e] border border-slate-800 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Status</span>
          <div className="flex items-center gap-2">
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                settings.enabled && isPublisherConfigured
                  ? 'bg-emerald-400 shadow-md shadow-emerald-950 animate-pulse'
                  : 'bg-slate-600'
              }`}
            />
            <p className="text-sm font-bold text-white">
              {settings.enabled && isPublisherConfigured
                ? 'Monetization Active'
                : settings.enabled
                ? 'Configuration Required'
                : 'Disabled'}
            </p>
          </div>
        </div>

        {/* Publisher ID */}
        <div className="p-4 rounded-2xl bg-[#11131e] border border-slate-800 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Publisher ID</span>
          <p className="text-xs font-mono font-bold text-slate-200 truncate">
            {settings.publisher_id ? settings.publisher_id : 'Not Configured'}
          </p>
        </div>

        {/* Active Ad Units */}
        <div className="p-4 rounded-2xl bg-[#11131e] border border-slate-800 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Active Ad Units</span>
          <p className="text-lg font-black text-emerald-400">
            {activeUnitCount} <span className="text-xs text-slate-400 font-normal">/ {units.length}</span>
          </p>
        </div>

        {/* Active Placements */}
        <div className="p-4 rounded-2xl bg-[#11131e] border border-slate-800 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Active Placements</span>
          <p className="text-lg font-black text-rose-400">
            {activePlacementCount} <span className="text-xs text-slate-400 font-normal">/ 12</span>
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 overflow-x-auto scrollbar-none pb-px">
        {[
          { id: 'settings', label: 'AdSense Settings', icon: Sliders },
          { id: 'units', label: `Ad Units (${units.length})`, icon: Layout },
          { id: 'placements', label: `Ad Placements (${activePlacementCount}/12)`, icon: Radio },
          { id: 'custom_code', label: 'Custom Ad Code & File', icon: Code },
          { id: 'preview', label: 'Live Ad Preview', icon: Eye },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AdSenseTab)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-semibold text-xs whitespace-nowrap transition-all ${
                isActive
                  ? 'border-emerald-500 text-emerald-400 bg-emerald-950/10'
                  : 'border-transparent text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ============================================================= */}
      {/* TAB 1: AdSense Core Settings */}
      {/* ============================================================= */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="p-6 rounded-3xl bg-[#11131d] border border-slate-800 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-emerald-400" />
                  <span>Publisher Account Configuration</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Master switch and account identification for Google AdSense monetization
                </p>
              </div>

              {/* Master Toggle */}
              <label className="flex items-center gap-3 cursor-pointer bg-[#181a26] px-4 py-2 rounded-2xl border border-slate-700/80">
                <span className="text-xs font-bold text-white">Enable Google AdSense</span>
                <input
                  type="checkbox"
                  id="toggle-adsense-active"
                  checked={settings.enabled}
                  onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                  className="w-4 h-4 accent-emerald-500 rounded"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5 uppercase tracking-wider text-[11px]">
                  Publisher ID (Client ID) *
                </label>
                <input
                  id="input-publisher-id"
                  type="text"
                  placeholder="ca-pub-XXXXXXXXXXXXXXXX"
                  value={settings.publisher_id}
                  onChange={(e) => setSettings({ ...settings, publisher_id: e.target.value.trim() })}
                  className="w-full bg-[#181a26] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-emerald-500"
                />
                <span className="text-[10px] text-slate-500 mt-1.5 block">
                  Found in your Google AdSense account &bull; Format: <b>ca-pub-1234567890123456</b>
                </span>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5 uppercase tracking-wider text-[11px]">
                  Default Ad Slot ID
                </label>
                <input
                  id="input-default-slot-id"
                  type="text"
                  placeholder="1234567890"
                  value={settings.ad_slot_id}
                  onChange={(e) => setSettings({ ...settings, ad_slot_id: e.target.value.trim() })}
                  className="w-full bg-[#181a26] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-emerald-500"
                />
                <span className="text-[10px] text-slate-500 mt-1.5 block">
                  Fallback ad unit ID for responsive slots
                </span>
              </div>
            </div>

            {/* Policy & Safety Assurance */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-start gap-3 text-xs text-slate-400">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-white">Google AdSense Policy Compliance</p>
                <p className="leading-relaxed">
                  Ads will never overlap navigation controls, play buttons, or video player controls. When AdSense is toggled OFF, no external script tags are loaded.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-950/50 transition-all disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Save AdSense Settings</span>
            </button>
          </div>
        </form>
      )}

      {/* ============================================================= */}
      {/* TAB 2: Multiple Ad Units Management */}
      {/* ============================================================= */}
      {activeTab === 'units' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Layout className="w-4 h-4 text-emerald-400" />
                <span>Configured Ad Units ({units.length})</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Create multiple ad unit sizes (Leaderboard, In-Feed, Rectangle, Skyscraper) to map to placements
              </p>
            </div>

            <button
              onClick={openCreateUnit}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create Ad Unit</span>
            </button>
          </div>

          {units.length === 0 ? (
            <div className="text-center py-16 bg-[#11131c] border border-slate-800 rounded-3xl p-8 space-y-3">
              <Layout className="w-12 h-12 text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-white">No Ad Units Configured</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Create an ad unit corresponding to your Google AdSense slot IDs.
              </p>
              <button
                onClick={openCreateUnit}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add First Ad Unit
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {units.map((unit, index) => (
                <div
                  key={unit.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    unit.enabled
                      ? 'bg-[#11131d] border-slate-800'
                      : 'bg-slate-950/60 border-slate-800/50 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-slate-800 text-slate-300 font-mono text-[10px] flex items-center justify-center font-bold">
                          {index + 1}
                        </span>
                        <h4 className="text-sm font-bold text-white">{unit.name}</h4>
                      </div>
                      <p className="text-xs font-mono text-emerald-400 pl-7">
                        Slot ID: <b>{unit.ad_slot_id}</b>
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleToggleUnitEnabled(unit)}
                        className={`p-1.5 rounded-lg border transition-colors ${
                          unit.enabled
                            ? 'bg-emerald-950/30 text-emerald-300 border-emerald-800/40'
                            : 'bg-slate-800 text-slate-500 border-slate-700'
                        }`}
                        title={unit.enabled ? 'Disable Unit' : 'Enable Unit'}
                      >
                        {unit.enabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        onClick={() => openEditUnit(unit)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                        title="Edit Unit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeleteUnit(unit.id, unit.name)}
                        className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-800/30 transition-colors"
                        title="Delete Unit"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="capitalize">
                      Format: <b className="text-slate-200">{unit.format}</b>
                    </span>
                    <span>
                      Responsive: <b className="text-slate-200">{unit.responsive ? 'Yes' : 'No'}</b>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB 3: Manual Ad Placement Management (All 12 Slots) */}
      {/* ============================================================= */}
      {activeTab === 'placements' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-400" />
                <span>Ad Placement Control (12 Locations)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Toggle specific ad placement slots and assign corresponding Ad Units independently
              </p>
            </div>

            <button
              onClick={handleSavePlacements}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-950/50 transition-all disabled:opacity-50 shrink-0"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Save Placements</span>
            </button>
          </div>

          <div className="space-y-3">
            {placements.map((placement, idx) => (
              <div
                key={placement.placement_key}
                id={`placement-row-${placement.placement_key}`}
                className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                  placement.enabled
                    ? 'bg-[#11131d] border-emerald-800/40'
                    : 'bg-slate-900/40 border-slate-800 opacity-70'
                }`}
              >
                {/* Placement Label & Key */}
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-slate-800 text-slate-400 font-mono text-xs flex items-center justify-center font-bold shrink-0">
                    {idx + 1}
                  </span>
                  <div>
                    <p className="text-xs font-bold text-white">{placement.name}</p>
                    <p className="text-[10px] font-mono text-slate-500">
                      key: {placement.placement_key}
                    </p>
                  </div>
                </div>

                {/* Controls (Unit selection, frequency if in-feed, toggle) */}
                <div className="flex flex-wrap items-center gap-3 pl-9 md:pl-0">
                  {/* In-feed frequency if placement is in-feed */}
                  {placement.placement_key === 'video_list_in_feed' && (
                    <div className="flex items-center gap-2 bg-[#171926] px-3 py-1.5 rounded-xl border border-slate-700/80">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Frequency:</span>
                      <select
                        value={placement.frequency || 5}
                        onChange={(e) =>
                          handlePlacementChange(
                            placement.placement_key,
                            'frequency',
                            parseInt(e.target.value, 10)
                          )
                        }
                        className="bg-transparent text-xs text-emerald-400 font-bold focus:outline-none"
                      >
                        <option value={3} className="bg-slate-900 text-white">Every 3 videos</option>
                        <option value={5} className="bg-slate-900 text-white">Every 5 videos (Default)</option>
                        <option value={8} className="bg-slate-900 text-white">Every 8 videos</option>
                        <option value={10} className="bg-slate-900 text-white">Every 10 videos</option>
                      </select>
                    </div>
                  )}

                  {/* Ad Unit Assignment Dropdown */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400">Unit:</span>
                    <select
                      value={placement.ad_unit_id || ''}
                      onChange={(e) =>
                        handlePlacementChange(
                          placement.placement_key,
                          'ad_unit_id',
                          e.target.value || null
                        )
                      }
                      className="bg-[#181a26] border border-slate-700/80 text-xs text-white rounded-xl px-3 py-1.5 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="">-- No Unit Selected --</option>
                      {units.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.format})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Enable / Disable Switch */}
                  <button
                    type="button"
                    onClick={() =>
                      handlePlacementChange(
                        placement.placement_key,
                        'enabled',
                        !placement.enabled
                      )
                    }
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                      placement.enabled
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-950/40'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    {placement.enabled ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB 4: Custom Ad Code & Ad File Upload */}
      {/* ============================================================= */}
      {activeTab === 'custom_code' && (
        <div className="space-y-8">
          {/* 1. Custom Code Editor */}
          <form onSubmit={handleSaveCustomCode} className="p-6 rounded-3xl bg-[#11131d] border border-slate-800 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Code className="w-4 h-4 text-emerald-400" />
                  <span>Custom HTML &amp; AdSense Code Snippet</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Paste custom HTML, AdSense auto-ad tags, or verified sponsor banners. (Admin Only Privileged Execution)
                </p>
              </div>

              <label className="flex items-center gap-3 cursor-pointer bg-[#181a26] px-4 py-2 rounded-2xl border border-slate-700/80">
                <span className="text-xs font-bold text-white">Enable Custom Code</span>
                <input
                  type="checkbox"
                  checked={customCode.enabled}
                  onChange={(e) => setCustomCode({ ...customCode, enabled: e.target.checked })}
                  className="w-4 h-4 accent-emerald-500 rounded"
                />
              </label>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1.5 uppercase tracking-wider text-[11px]">
                Ad / Tag Code Snippet
              </label>
              <textarea
                rows={7}
                placeholder="<!-- Paste your Google AdSense tag or verified custom HTML snippet here... -->"
                value={customCode.code_content}
                onChange={(e) => setCustomCode({ ...customCode, code_content: e.target.value })}
                className="w-full bg-[#181a26] border border-slate-700/80 rounded-2xl p-4 text-xs text-emerald-300 font-mono focus:outline-none focus:border-emerald-500 leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-end">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-950/50 transition-all disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Save Custom Ad Code</span>
              </button>
            </div>
          </form>

          {/* 2. Upload Ad File / ads.txt */}
          <div className="p-6 rounded-3xl bg-[#11131d] border border-slate-800 space-y-6">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Upload className="w-4 h-4 text-emerald-400" />
                <span>Upload Ad Verification File (ads.txt / .html)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Upload verified publisher records (.txt, .html, .json) to Supabase Storage. Executables (.php, .exe, .sh) are rejected.
              </p>
            </div>

            {customCode.ad_file_url ? (
              <div className="p-4 bg-[#181a26] border border-slate-700/80 rounded-2xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">{customCode.ad_file_name || 'ad_config.txt'}</p>
                    <p className="text-[10px] text-slate-400">
                      {customCode.ad_file_size ? `${(customCode.ad_file_size / 1024).toFixed(1)} KB` : 'Active File'} &bull; Stored in Supabase ad-assets
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={customCode.ad_file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
                  >
                    View File
                  </a>
                  <button
                    onClick={handleDeleteUploadedFile}
                    className="p-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-800/30 transition-colors"
                    title="Remove File"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-8 border-2 border-dashed border-slate-700 rounded-3xl text-center space-y-3 bg-[#0e1018]">
                <Upload className="w-8 h-8 text-slate-500 mx-auto" />
                <div className="text-xs text-slate-300">
                  <label className="cursor-pointer text-emerald-400 font-bold hover:underline">
                    Click to select a file
                    <input
                      type="file"
                      accept=".txt,.html,.json,text/plain,text/html,application/json"
                      onChange={handleFileUpload}
                      disabled={isUploadingFile}
                      className="hidden"
                    />
                  </label>{' '}
                  or drag and drop
                </div>
                <p className="text-[10px] text-slate-500">
                  Supported formats: .txt (ads.txt), .html, .json &bull; Max size: 5MB
                </p>
                {isUploadingFile && (
                  <div className="flex items-center justify-center gap-2 text-xs text-emerald-400 font-semibold">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Uploading and securing ad asset...</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB 5: Live Interactive Ad Placement Preview */}
      {/* ============================================================= */}
      {activeTab === 'preview' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-400" />
                <span>Live Ad Placement Blueprint</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Visual mockup of how enabled ad units render across header, catalog list, video player, and footer
              </p>
            </div>
            <span className="px-3 py-1 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold">
              Ad Preview Mode
            </span>
          </div>

          <div className="p-6 rounded-3xl bg-[#0a0b12] border border-slate-800 space-y-6">
            {/* 1. Header Top */}
            <div className="p-3 bg-slate-900/60 rounded-2xl border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase">1. Header Top Placement</span>
              <AdPlacementSlot placementKey="header_top" previewMode />
            </div>

            {/* Simulated Navigation Bar */}
            <div className="p-4 bg-[#12141e] rounded-2xl border border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span className="font-black text-white">STREAMVAULT NAVIGATION BAR</span>
              <div className="flex gap-4">
                <span>Browse</span>
                <span>Categories</span>
                <span>Search</span>
              </div>
            </div>

            {/* 2. Header Bottom */}
            <div className="p-3 bg-slate-900/60 rounded-2xl border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase">2. Below Header Placement</span>
              <AdPlacementSlot placementKey="header_bottom" previewMode />
            </div>

            {/* 3. Above Video List */}
            <div className="p-3 bg-slate-900/60 rounded-2xl border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase">3. Above Video Catalog List</span>
              <AdPlacementSlot placementKey="video_list_top" previewMode />
            </div>

            {/* Simulated Video Grid with In-Feed Slot */}
            <div className="p-4 bg-slate-950/40 rounded-2xl border border-slate-800/80 space-y-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase">4. Video Cards Grid &amp; In-Feed Slot</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="aspect-video bg-slate-900 rounded-xl flex items-center justify-center text-[10px] text-slate-500 font-bold">Video 1</div>
                <div className="aspect-video bg-slate-900 rounded-xl flex items-center justify-center text-[10px] text-slate-500 font-bold">Video 2</div>
                <div className="aspect-video bg-slate-900 rounded-xl flex items-center justify-center text-[10px] text-slate-500 font-bold">Video 3</div>
                <div className="aspect-video bg-slate-900 rounded-xl flex items-center justify-center text-[10px] text-slate-500 font-bold">Video 4</div>
              </div>
              <AdPlacementSlot placementKey="video_list_in_feed" previewMode />
            </div>

            {/* 5. Below Video List */}
            <div className="p-3 bg-slate-900/60 rounded-2xl border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase">5. Below Video List</span>
              <AdPlacementSlot placementKey="video_list_bottom" previewMode />
            </div>

            {/* 6. Video Details & Player */}
            <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase">6. Video Details &amp; Player Placements</span>
              <AdPlacementSlot placementKey="video_details_above_player" previewMode />
              <div className="aspect-video bg-slate-900 rounded-2xl flex items-center justify-center text-xs text-slate-500 font-bold">
                Main Video Stream Player
              </div>
              <AdPlacementSlot placementKey="video_details_below_player" previewMode />
              <AdPlacementSlot placementKey="video_details_below_description" previewMode />
            </div>

            {/* 7. Footer Placements */}
            <div className="p-3 bg-slate-900/60 rounded-2xl border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase">7. Footer Placements</span>
              <AdPlacementSlot placementKey="footer_top" previewMode />
              <div className="p-4 bg-[#090a0f] rounded-xl border border-slate-800 text-center text-xs text-slate-500">
                StreamVault Footer &bull; Copyright &copy; 2026
              </div>
              <AdPlacementSlot placementKey="footer_bottom" previewMode />
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* Create / Edit Ad Unit Modal */}
      {/* ============================================================= */}
      {isUnitModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#11131e] border border-slate-800 rounded-3xl p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">
                {editingUnitId ? 'Edit Ad Unit' : 'Create New Ad Unit'}
              </h3>
              <button
                onClick={() => setIsUnitModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                <AlertCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUnit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Ad Unit Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Header Billboard, Video Bottom Leaderboard"
                  value={unitName}
                  onChange={(e) => setUnitName(e.target.value)}
                  className="w-full bg-[#181a26] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Ad Slot ID *
                </label>
                <input
                  type="text"
                  placeholder="e.g. 1234567890"
                  value={unitSlotId}
                  onChange={(e) => setUnitSlotId(e.target.value.trim())}
                  className="w-full bg-[#181a26] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                  required
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Numeric Google AdSense slot ID generated in your AdSense console
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Format
                  </label>
                  <select
                    value={unitFormat}
                    onChange={(e) => setUnitFormat(e.target.value as AdFormat)}
                    className="w-full bg-[#181a26] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="auto">Auto (Responsive)</option>
                    <option value="horizontal">Horizontal Banner</option>
                    <option value="rectangle">Medium Rectangle</option>
                    <option value="vertical">Vertical Skyscraper</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="unit-responsive-chk"
                    checked={unitResponsive}
                    onChange={(e) => setUnitResponsive(e.target.checked)}
                    className="w-4 h-4 accent-emerald-500 rounded"
                  />
                  <label htmlFor="unit-responsive-chk" className="text-xs text-slate-300 font-semibold cursor-pointer">
                    Responsive
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="unit-enabled-chk"
                  checked={unitEnabled}
                  onChange={(e) => setUnitEnabled(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500 rounded"
                />
                <label htmlFor="unit-enabled-chk" className="text-xs text-slate-300 font-semibold cursor-pointer">
                  Enable this Ad Unit for placements
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsUnitModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{editingUnitId ? 'Update Unit' : 'Create Unit'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
