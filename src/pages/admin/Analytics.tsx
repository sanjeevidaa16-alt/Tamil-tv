import React, { useState, useEffect } from 'react';
import {
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  Settings,
  Shield,
  ExternalLink,
  Save,
  RotateCcw,
  Zap,
  Info,
  Layers,
  Search,
  Tag,
  Lock,
  Eye,
  BarChart2,
  Sliders,
  Check,
  Film,
  Users,
} from 'lucide-react';
import { useAnalytics } from '../../contexts/AnalyticsContext';
import { useToast } from '../../components/common/Toast';
import { AnalyticsSettings, AnalyticsTestResult } from '../../types/analytics';
import { isValidMeasurementId } from '../../services/analyticsService';
import { userService } from '../../services/userService';
import { DashboardStats } from '../../types';
import { formatViews } from '../../utils/formatters';

export const Analytics: React.FC = () => {
  const {
    settings,
    status,
    loading: contextLoading,
    updateSettings,
    testConnection,
    disableAnalytics,
  } = useAnalytics();

  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'ga4' | 'db_stats'>('ga4');
  const [formData, setFormData] = useState<AnalyticsSettings>(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<AnalyticsTestResult | null>(null);

  // Real DB stats for secondary tab
  const [dbStats, setDbStats] = useState<DashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  useEffect(() => {
    if (activeTab === 'db_stats') {
      setLoadingStats(true);
      userService
        .getDashboardAnalytics()
        .then((res) => setDbStats(res))
        .catch(console.error)
        .finally(() => setLoadingStats(false));
    }
  }, [activeTab]);

  const handleInputChange = (field: keyof AnalyticsSettings, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Reset test result if measurement ID changes
    if (field === 'ga_measurement_id') {
      setTestResult(null);
    }
  };

  const handleSave = async () => {
    const rawId = (formData.ga_measurement_id || '').trim().toUpperCase();

    if (formData.enabled && !rawId) {
      showToast('Please provide a Google Analytics Measurement ID before enabling.', 'error');
      return;
    }

    if (formData.enabled && !isValidMeasurementId(rawId)) {
      showToast('Measurement ID format is invalid. Expected format: G-XXXXXXXXXX', 'error');
      return;
    }

    setIsSaving(true);
    try {
      await updateSettings({
        ...formData,
        ga_measurement_id: rawId,
      });
      showToast('Google Analytics 4 settings updated and applied successfully.', 'success');
    } catch (err: any) {
      showToast(`Failed to save settings: ${err?.message || 'Unknown error'}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRunTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const result = await testConnection(formData);
      setTestResult(result);
      if (result.success) {
        showToast('GA4 Test Ping Dispatched! Check Google Analytics Realtime report.', 'success');
      } else {
        showToast(result.message, 'error');
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        status: 'INVALID_CONFIGURATION',
        message: err?.message || 'Connection test failed',
        timestamp: new Date().toISOString(),
      });
      showToast('Test failed to run.', 'error');
    } finally {
      setIsTesting(false);
    }
  };

  const handleDisable = async () => {
    if (confirm('Are you sure you want to disable Google Analytics 4 tracking on this website?')) {
      await disableAnalytics();
      setFormData((prev) => ({ ...prev, enabled: false }));
      setTestResult(null);
      showToast('Google Analytics tracking disabled.', 'info');
    }
  };

  const idValid = isValidMeasurementId(formData.ga_measurement_id);

  return (
    <div id="admin-analytics-view" className="space-y-8 pb-16 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-600/10 border border-rose-500/20 text-rose-500 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Analytics & Telemetry
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Official Google Analytics 4 (GA4) integration and real database catalog records
              </p>
            </div>
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center p-1 rounded-2xl bg-[#0f111a] border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('ga4')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'ga4'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-950/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Google Analytics 4</span>
          </button>
          <button
            onClick={() => setActiveTab('db_stats')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'db_stats'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-950/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Database Records</span>
          </button>
        </div>
      </div>

      {activeTab === 'ga4' ? (
        <div className="space-y-8">
          {/* Connection Status Banner */}
          <div
            className={`p-5 rounded-3xl border transition-all ${
              status === 'CONNECTED'
                ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                : status === 'DISABLED'
                ? 'bg-slate-900/40 border-slate-800 text-slate-400'
                : status === 'INVALID_CONFIGURATION'
                ? 'bg-rose-950/20 border-rose-500/30 text-rose-300'
                : 'bg-amber-950/20 border-amber-500/30 text-amber-300'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="relative mt-1 sm:mt-0">
                  {status === 'CONNECTED' ? (
                    <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  ) : status === 'DISABLED' ? (
                    <div className="w-9 h-9 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400">
                      <Sliders className="w-5 h-5" />
                    </div>
                  ) : (
                    <div className="w-9 h-9 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                  )}
                  {status === 'CONNECTED' && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">
                      {status === 'CONNECTED' && 'Google Analytics 4 Connected & Active'}
                      {status === 'DISABLED' && 'Google Analytics 4 is Disabled'}
                      {status === 'NOT_CONFIGURED' && 'Google Analytics 4 Not Configured'}
                      {status === 'INVALID_CONFIGURATION' && 'Invalid Measurement ID Format'}
                    </h3>
                    <span
                      className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full font-bold ${
                        status === 'CONNECTED'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : status === 'DISABLED'
                          ? 'bg-slate-800 text-slate-400'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {status === 'CONNECTED' &&
                      `Streaming live video metrics to Measurement ID ${formData.ga_measurement_id}.`}
                    {status === 'DISABLED' &&
                      'Tracking script is detached from the website DOM. No analytics data is being transmitted.'}
                    {status === 'NOT_CONFIGURED' &&
                      'Enter your Google Analytics 4 Measurement ID below to activate tracking.'}
                    {status === 'INVALID_CONFIGURATION' &&
                      'Please verify your Measurement ID. It must match standard format G-XXXXXXXXXX.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href="https://analytics.google.com/analytics/web/"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition-colors"
                >
                  <span>Open GA4 Console</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </a>
              </div>
            </div>
          </div>

          {/* Core Configuration Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[#11131c] border border-slate-800/90 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Settings className="w-4 h-4 text-rose-500" />
                  <span>Core GA4 Stream Configuration</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Set up your Google Tag and Web Data Stream properties
                </p>
              </div>

              {/* Master Enable Switch */}
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <span className="text-xs font-bold text-slate-300">
                  {formData.enabled ? 'Google Analytics: ON' : 'Google Analytics: OFF'}
                </span>
                <div className="relative inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.enabled}
                    onChange={(e) => handleInputChange('enabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
                </div>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Measurement ID */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Measurement ID <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.ga_measurement_id}
                    onChange={(e) => handleInputChange('ga_measurement_id', e.target.value.trim().toUpperCase())}
                    placeholder="G-XXXXXXXXXX"
                    className={`w-full bg-[#0a0c13] border rounded-2xl px-4 py-3 text-xs font-mono text-white placeholder-slate-600 focus:outline-none transition-colors ${
                      formData.ga_measurement_id && !idValid
                        ? 'border-rose-500/80 focus:border-rose-500'
                        : 'border-slate-800 focus:border-rose-500'
                    }`}
                  />
                  {formData.ga_measurement_id && (
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                      {idValid ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-400" />
                      )}
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  Find this in your Google Analytics Admin &rarr; Data Streams &rarr; Web Stream &rarr; Measurement ID.
                </p>
              </div>

              {/* Stream Name */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Web Stream Name
                </label>
                <input
                  type="text"
                  value={formData.stream_name || ''}
                  onChange={(e) => handleInputChange('stream_name', e.target.value)}
                  placeholder="Tamil TV Stream Vault"
                  className="w-full bg-[#0a0c13] border border-slate-800 rounded-2xl px-4 py-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rose-500 transition-colors"
                />
                <p className="text-[11px] text-slate-500">
                  Descriptive tag name for your internal GA4 reports.
                </p>
              </div>

              {/* Tag ID (Optional) */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Google Tag ID <span className="text-[10px] text-slate-500 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={formData.google_tag_id || ''}
                  onChange={(e) => handleInputChange('google_tag_id', e.target.value.trim())}
                  placeholder="GT-XXXXXX or G-XXXXXXXXXX"
                  className="w-full bg-[#0a0c13] border border-slate-800 rounded-2xl px-4 py-3 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-rose-500 transition-colors"
                />
                <p className="text-[11px] text-slate-500">
                  Leave blank to default to your Measurement ID.
                </p>
              </div>

              {/* Website Domain */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Website Origin URL
                </label>
                <input
                  type="text"
                  value={formData.website_url || ''}
                  onChange={(e) => handleInputChange('website_url', e.target.value)}
                  placeholder="https://yourdomain.com"
                  className="w-full bg-[#0a0c13] border border-slate-800 rounded-2xl px-4 py-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rose-500 transition-colors"
                />
                <p className="text-[11px] text-slate-500">
                  Used for cross-domain filtering and event stream attribution.
                </p>
              </div>
            </div>
          </div>

          {/* Granular Tracking Features Grid */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[#11131c] border border-slate-800/90 space-y-6">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Granular Event Tracking Controls</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Enable or disable specific event telemetry streams based on your reporting requirements
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* SPA Pageviews */}
              <div className="p-4 rounded-2xl bg-[#0a0c13] border border-slate-800/80 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">Single-Page Route Changes</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                      page_view
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Automatically dispatches page views when users navigate between tabs and video paths without full page reloads.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.track_pageviews}
                  onChange={(e) => handleInputChange('track_pageviews', e.target.checked)}
                  className="w-4 h-4 rounded text-rose-600 bg-slate-900 border-slate-700 focus:ring-rose-500 mt-1"
                />
              </div>

              {/* Video Events */}
              <div className="p-4 rounded-2xl bg-[#0a0c13] border border-slate-800/80 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">Video Playback Telemetry</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400">
                      video_*
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Tracks play, pause, seek, completion, and milestone retention percentages (25%, 50%, 75%, 90%).
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.track_video_events}
                  onChange={(e) => handleInputChange('track_video_events', e.target.checked)}
                  className="w-4 h-4 rounded text-rose-600 bg-slate-900 border-slate-700 focus:ring-rose-500 mt-1"
                />
              </div>

              {/* Search Tracking */}
              <div className="p-4 rounded-2xl bg-[#0a0c13] border border-slate-800/80 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">Search Queries</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                      search
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Tracks user catalog queries and matched results count to identify trending search keywords.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.track_search}
                  onChange={(e) => handleInputChange('track_search', e.target.checked)}
                  className="w-4 h-4 rounded text-rose-600 bg-slate-900 border-slate-700 focus:ring-rose-500 mt-1"
                />
              </div>

              {/* Categories Tracking */}
              <div className="p-4 rounded-2xl bg-[#0a0c13] border border-slate-800/80 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">Category & Channel Views</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                      category_view
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Measures user engagement across Tamil TV channels, Serials, Movies, and Special Programs.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.track_categories}
                  onChange={(e) => handleInputChange('track_categories', e.target.checked)}
                  className="w-4 h-4 rounded text-rose-600 bg-slate-900 border-slate-700 focus:ring-rose-500 mt-1"
                />
              </div>

              {/* Filters Tracking */}
              <div className="p-4 rounded-2xl bg-[#0a0c13] border border-slate-800/80 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">Dynamic Filter Usage</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                      filter_used
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Tracks filter selection events (Languages, Quality, Era, Mood) to discover audience preference patterns.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.track_filters}
                  onChange={(e) => handleInputChange('track_filters', e.target.checked)}
                  className="w-4 h-4 rounded text-rose-600 bg-slate-900 border-slate-700 focus:ring-rose-500 mt-1"
                />
              </div>

              {/* Authentication Events */}
              <div className="p-4 rounded-2xl bg-[#0a0c13] border border-slate-800/80 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">Authentication Events</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                      login, sign_up
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Tracks sign-in and registration conversion rates without transmitting emails, tokens, or passwords.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.track_auth}
                  onChange={(e) => handleInputChange('track_auth', e.target.checked)}
                  className="w-4 h-4 rounded text-rose-600 bg-slate-900 border-slate-700 focus:ring-rose-500 mt-1"
                />
              </div>
            </div>

            {/* Internal Admin Activity Toggle (Special Notice) */}
            <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-amber-300">
                    Track Internal Admin & Manager Activity
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400">
                    Default: OFF
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  When turned OFF (recommended), management actions inside <code className="text-slate-300">/admin</code> and <code className="text-slate-300">/manager</code> will not inflate public audience metrics.
                </p>
              </div>
              <input
                type="checkbox"
                checked={formData.track_admin_activity}
                onChange={(e) => handleInputChange('track_admin_activity', e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 bg-slate-900 border-slate-700 focus:ring-amber-500 mt-1"
              />
            </div>
          </div>

          {/* Privacy, Consent & Developer Modes */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[#11131c] border border-slate-800/90 space-y-6">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>Privacy, Consent & Developer Modes</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Privacy-first configuration adhering to global consent frameworks and GA4 DebugView
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* User Consent Mode */}
              <div className="p-4 rounded-2xl bg-[#0a0c13] border border-slate-800/80 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">Google Consent Mode Banner</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Displays a cookie consent banner and holds GA4 storage tags until granted by the visitor.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.respect_consent}
                  onChange={(e) => handleInputChange('respect_consent', e.target.checked)}
                  className="w-4 h-4 rounded text-rose-600 bg-slate-900 border-slate-700 focus:ring-rose-500 mt-1"
                />
              </div>

              {/* Debug Mode */}
              <div className="p-4 rounded-2xl bg-[#0a0c13] border border-slate-800/80 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">GA4 Debug Mode (DebugView)</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400">
                      debug_mode: true
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Sends real-time telemetry events directly into the Google Analytics DebugView monitor.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.debug_mode}
                  onChange={(e) => handleInputChange('debug_mode', e.target.checked)}
                  className="w-4 h-4 rounded text-rose-600 bg-slate-900 border-slate-700 focus:ring-rose-500 mt-1"
                />
              </div>
            </div>

            {/* Zero PII Guarantee Notice */}
            <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 text-[11px] text-emerald-300 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="w-4 h-4" /> Zero Sensitive PII Guarantee
              </div>
              <p className="text-slate-400">
                All event parameters are strictly sanitized before passing to <code className="text-slate-300">gtag()</code>. Passwords, auth tokens, session headers, and private email strings are stripped to protect user privacy.
              </p>
            </div>
          </div>

          {/* Test Diagnostic Output */}
          {testResult && (
            <div
              className={`p-5 rounded-3xl border text-xs space-y-3 ${
                testResult.success
                  ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                  : 'bg-rose-950/20 border-rose-500/30 text-rose-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-sm">
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-400" />
                  )}
                  <span>{testResult.success ? 'Diagnostic Test Succeeded' : 'Diagnostic Test Failed'}</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">{testResult.timestamp}</span>
              </div>
              <p className="text-slate-300">{testResult.message}</p>
              {testResult.details && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80 text-[11px] font-mono">
                  <div className="p-2 rounded bg-slate-900/60">
                    Format Valid: {testResult.details.formatValid ? '✅ YES' : '❌ NO'}
                  </div>
                  <div className="p-2 rounded bg-slate-900/60">
                    Script Injected: {testResult.details.scriptLoaded ? '✅ YES' : '❌ NO'}
                  </div>
                  <div className="p-2 rounded bg-slate-900/60">
                    window.gtag: {testResult.details.gtagDefined ? '✅ READY' : '❌ NO'}
                  </div>
                  <div className="p-2 rounded bg-slate-900/60">
                    Test Event: {testResult.details.testEventDispatched ? '✅ DISPATCHED' : '❌ NO'}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-3">
              <button
                id="save-ga4-settings-btn"
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-rose-950/50 transition-all flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Applying Settings...' : 'Save & Apply Settings'}</span>
              </button>

              <button
                id="test-ga4-connection-btn"
                onClick={handleRunTest}
                disabled={isTesting || !formData.ga_measurement_id}
                className="px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-semibold border border-slate-700 transition-all flex items-center gap-2"
              >
                <Zap className="w-4 h-4 text-amber-400" />
                <span>{isTesting ? 'Sending Test Event...' : 'Test Connection'}</span>
              </button>
            </div>

            {formData.enabled && (
              <button
                onClick={handleDisable}
                className="px-4 py-2.5 rounded-xl bg-red-950/40 hover:bg-red-900/50 text-rose-300 hover:text-white text-xs font-medium border border-rose-900/40 transition-colors"
              >
                Disable Analytics
              </button>
            )}
          </div>

          {/* Realtime Verification Guide */}
          <div className="p-6 rounded-3xl bg-[#11131c] border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Info className="w-4 h-4 text-rose-500" />
              <span>How to Verify Events in Google Analytics 4 Realtime</span>
            </h3>
            <ol className="list-decimal list-inside text-xs text-slate-400 space-y-2 leading-relaxed">
              <li>
                Ensure your Measurement ID is entered above (e.g. <code className="text-slate-200">G-XXXXXXXXXX</code>) and click <strong>Save & Apply Settings</strong>.
              </li>
              <li>
                Open the{' '}
                <a
                  href="https://analytics.google.com/analytics/web/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-rose-400 underline font-medium"
                >
                  Google Analytics Web Console
                </a>{' '}
                in a separate tab.
              </li>
              <li>
                In the left sidebar, navigate to <strong>Reports &rarr; Realtime</strong>.
              </li>
              <li>
                Click <strong>Test Connection</strong> above or browse your video streaming catalog to watch events (<code className="text-slate-300">page_view</code>, <code className="text-slate-300">video_play</code>, <code className="text-slate-300">video_25_percent</code>, <code className="text-slate-300">search</code>) appear live in your Realtime dashboard within 5-15 seconds.
              </li>
            </ol>
          </div>
        </div>
      ) : (
        /* Database Content Records Tab (Genuine DB Entities Only, No Fake Telemetry) */
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-[#11131c] border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-rose-500 shrink-0" />
              <span>
                These figures reflect verified records and aggregates stored in your database catalog.
              </span>
            </div>
            <button
              onClick={() => {
                setLoadingStats(true);
                userService
                  .getDashboardAnalytics()
                  .then((res) => setDbStats(res))
                  .finally(() => setLoadingStats(false));
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Refresh Records</span>
            </button>
          </div>

          {loadingStats || !dbStats ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-[#11131c] rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-[#11131c] border border-slate-800">
                  <div className="flex items-center justify-between text-xs text-slate-400 uppercase font-semibold">
                    <span>Database Video Titles</span>
                    <Film className="w-4 h-4 text-rose-400" />
                  </div>
                  <p className="text-3xl font-black text-white mt-3">{dbStats.totalVideos}</p>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Published and cataloged master titles
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-[#11131c] border border-slate-800">
                  <div className="flex items-center justify-between text-xs text-slate-400 uppercase font-semibold">
                    <span>Registered Members</span>
                    <Users className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="text-3xl font-black text-white mt-3">{dbStats.totalUsers}</p>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Total user accounts in authentication database
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-[#11131c] border border-slate-800">
                  <div className="flex items-center justify-between text-xs text-slate-400 uppercase font-semibold">
                    <span>Authorized Managers</span>
                    <Shield className="w-4 h-4 text-amber-400" />
                  </div>
                  <p className="text-3xl font-black text-white mt-3">{dbStats.totalManagers}</p>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Content creators with upload permissions
                  </span>
                </div>
              </div>

              {/* Database Top Viewed Titles */}
              <div className="p-6 rounded-3xl bg-[#11131c] border border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Film className="w-4 h-4 text-rose-500" />
                  <span>Database Play Record Totals</span>
                </h3>

                {dbStats.topViewedVideos.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">No video play records recorded yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                          <th className="pb-3 px-3">Rank</th>
                          <th className="pb-3 px-3">Title</th>
                          <th className="pb-3 px-3">Category</th>
                          <th className="pb-3 px-3">Views Logged</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-slate-300">
                        {dbStats.topViewedVideos.map((vid, idx) => (
                          <tr key={vid.id} className="hover:bg-slate-850/50">
                            <td className="py-3 px-3 font-mono font-bold text-slate-500">#{idx + 1}</td>
                            <td className="py-3 px-3 font-semibold text-white truncate max-w-xs">{vid.title}</td>
                            <td className="py-3 px-3 text-slate-400">{vid.category?.name || 'General'}</td>
                            <td className="py-3 px-3 font-mono font-bold text-amber-400">
                              {formatViews(vid.views_count)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
