import React, { useState, useEffect, useMemo } from 'react';
import {
  Rocket,
  Link2,
  Radio,
  Calendar,
  Clock,
  Globe,
  Bell,
  Sparkles,
  Info,
  Timer,
  AlertCircle,
  MessageSquare,
  Eye,
} from 'lucide-react';
import { PublishMode, VideoStatus, VideoVisibility } from '../../types';
import {
  SUPPORTED_TIMEZONES,
  DEFAULT_TIMEZONE,
  combineDateTimeToUtcIso,
  formatForInputs,
  formatPremiereDateTime,
} from '../../utils/premiereUtils';

export interface PublishingConfig {
  publishMode: PublishMode;
  status: VideoStatus;
  visibility: VideoVisibility;
  premiereAt: string; // ISO UTC
  premiereTimezone: string;
  premiereTitle: string;
  premiereMessage: string;
  premiereCountdownEnabled: boolean;
  premiereCountdownDuration: number;
  premiereReminderEnabled: boolean;
  premiereChatEnabled: boolean;
  premiereShowThumbnail: boolean;
}

interface PublishingModeSelectorProps {
  initialConfig?: Partial<PublishingConfig>;
  onChange: (config: PublishingConfig) => void;
  disabled?: boolean;
}

export const PublishingModeSelector: React.FC<PublishingModeSelectorProps> = ({
  initialConfig,
  onChange,
  disabled = false,
}) => {
  const [publishMode, setPublishMode] = useState<PublishMode>(
    initialConfig?.publishMode || (initialConfig?.status === 'scheduled_premiere' ? 'premiere' : 'publish_now')
  );

  const initialTz = initialConfig?.premiereTimezone || DEFAULT_TIMEZONE;
  const [timezone, setTimezone] = useState<string>(initialTz);

  // Date and Time inputs in selected timezone
  const inputInit = useMemo(() => {
    return formatForInputs(initialConfig?.premiereAt || '', initialTz);
  }, [initialConfig?.premiereAt, initialTz]);

  const [dateStr, setDateStr] = useState<string>(() => {
    if (inputInit.dateStr) return inputInit.dateStr;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });

  const [timeStr, setTimeStr] = useState<string>(inputInit.timeStr || '20:00');
  const [premiereTitle, setPremiereTitle] = useState(initialConfig?.premiereTitle || '');
  const [premiereMessage, setPremiereMessage] = useState(initialConfig?.premiereMessage || '');
  const [countdownEnabled, setCountdownEnabled] = useState(initialConfig?.premiereCountdownEnabled ?? true);
  const [countdownDuration, setCountdownDuration] = useState<number>(initialConfig?.premiereCountdownDuration ?? 2);
  const [reminderEnabled, setReminderEnabled] = useState(initialConfig?.premiereReminderEnabled ?? true);
  const [chatEnabled, setChatEnabled] = useState(initialConfig?.premiereChatEnabled ?? true);
  const [showThumbnail, setShowThumbnail] = useState(initialConfig?.premiereShowThumbnail ?? true);

  // Calculate current UTC ISO
  const currentUtcIso = useMemo(() => {
    return combineDateTimeToUtcIso(dateStr, timeStr, timezone);
  }, [dateStr, timeStr, timezone]);

  // Is premiere in the past check
  const isPastTime = useMemo(() => {
    if (!currentUtcIso) return false;
    return new Date(currentUtcIso).getTime() <= Date.now() + 60000; // within 1 min
  }, [currentUtcIso]);

  // Notify parent component on state change
  useEffect(() => {
    let status: VideoStatus = 'published';
    let visibility: VideoVisibility = 'public';

    if (publishMode === 'publish_now') {
      status = 'published';
      visibility = 'public';
    } else if (publishMode === 'unlisted') {
      status = 'unlisted';
      visibility = 'preview';
    } else if (publishMode === 'premiere') {
      status = 'scheduled_premiere';
      visibility = 'public';
    }

    onChange({
      publishMode,
      status,
      visibility,
      premiereAt: publishMode === 'premiere' ? currentUtcIso : '',
      premiereTimezone: timezone,
      premiereTitle: premiereTitle.trim(),
      premiereMessage: premiereMessage.trim(),
      premiereCountdownEnabled: countdownEnabled,
      premiereCountdownDuration: countdownDuration,
      premiereReminderEnabled: reminderEnabled,
      premiereChatEnabled: chatEnabled,
      premiereShowThumbnail: showThumbnail,
    });
  }, [
    publishMode,
    currentUtcIso,
    timezone,
    premiereTitle,
    premiereMessage,
    countdownEnabled,
    countdownDuration,
    reminderEnabled,
    chatEnabled,
    showThumbnail,
  ]);

  // Quick Date presets
  const handleSetQuickDate = (daysFromNow: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    setDateStr(d.toISOString().split('T')[0]);
  };

  // Quick Time presets
  const handleSetQuickTime = (t: string) => {
    setTimeStr(t);
  };

  return (
    <div id="publishing-mode-section" className="space-y-6">
      {/* 1. Mode Cards Selector */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
          Publishing Strategy <span className="text-rose-500">*</span>
        </label>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* OPTION 1: PUBLISH NOW */}
          <button
            type="button"
            id="mode-publish-now-btn"
            disabled={disabled}
            onClick={() => setPublishMode('publish_now')}
            className={`p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
              publishMode === 'publish_now'
                ? 'bg-rose-950/30 border-rose-500 shadow-lg shadow-rose-950/40 ring-1 ring-rose-500/50'
                : 'bg-[#121420] border-slate-800 hover:border-slate-700 hover:bg-[#151827]'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    publishMode === 'publish_now'
                      ? 'bg-rose-500 text-white'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  <Rocket className="w-4 h-4" />
                </div>
                <span
                  className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                    publishMode === 'publish_now'
                      ? 'bg-rose-500/20 text-rose-300'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  Instant
                </span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Publish Now</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                  Publicly available immediately. Appears on catalog, search, recommendations, and RSS feeds.
                </p>
              </div>
            </div>
            {publishMode === 'publish_now' && (
              <div className="mt-3 pt-2.5 border-t border-rose-500/20 text-[10px] font-semibold text-rose-400 flex items-center gap-1">
                <span>Active Selection</span>
              </div>
            )}
          </button>

          {/* OPTION 2: UNLISTED */}
          <button
            type="button"
            id="mode-unlisted-btn"
            disabled={disabled}
            onClick={() => setPublishMode('unlisted')}
            className={`p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
              publishMode === 'unlisted'
                ? 'bg-indigo-950/30 border-indigo-500 shadow-lg shadow-indigo-950/40 ring-1 ring-indigo-500/50'
                : 'bg-[#121420] border-slate-800 hover:border-slate-700 hover:bg-[#151827]'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    publishMode === 'unlisted'
                      ? 'bg-indigo-500 text-white'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  <Link2 className="w-4 h-4" />
                </div>
                <span
                  className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                    publishMode === 'unlisted'
                      ? 'bg-indigo-500/20 text-indigo-300'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  Private Link
                </span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Unlisted</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                  Hidden from public listings, categories, and homepage. Anyone with the direct link can stream it.
                </p>
              </div>
            </div>
            {publishMode === 'unlisted' && (
              <div className="mt-3 pt-2.5 border-t border-indigo-500/20 text-[10px] font-semibold text-indigo-400 flex items-center gap-1">
                <span>Active Selection</span>
              </div>
            )}
          </button>

          {/* OPTION 3: PREMIERE */}
          <button
            type="button"
            id="mode-premiere-btn"
            disabled={disabled}
            onClick={() => setPublishMode('premiere')}
            className={`p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
              publishMode === 'premiere'
                ? 'bg-gradient-to-b from-rose-950/40 to-[#18121f] border-rose-500 shadow-lg shadow-rose-950/50 ring-1 ring-rose-500/50'
                : 'bg-[#121420] border-slate-800 hover:border-slate-700 hover:bg-[#151827]'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    publishMode === 'premiere'
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-600/50 animate-pulse'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  <Radio className="w-4 h-4" />
                </div>
                <span
                  className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                    publishMode === 'premiere'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  Live Premiere
                </span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span>Premiere</span>
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                </h4>
                <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                  Schedule release with synchronized countdown, live reminder subscriptions, and real-time community debut.
                </p>
              </div>
            </div>
            {publishMode === 'premiere' && (
              <div className="mt-3 pt-2.5 border-t border-rose-500/20 text-[10px] font-semibold text-rose-400 flex items-center gap-1">
                <span>Premiere Config Active</span>
              </div>
            )}
          </button>
        </div>
      </div>

      {/* 2. PREMIERE SCHEDULING DRAWER (When Premiere Selected) */}
      {publishMode === 'premiere' && (
        <div
          id="premiere-schedule-panel"
          className="p-6 bg-[#0f111a] border border-rose-500/40 rounded-3xl space-y-6 shadow-xl relative overflow-hidden"
        >
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-rose-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Premiere Schedule & Broadcast Settings</h3>
                <p className="text-[11px] text-slate-400">
                  Configure the exact date, time, and synchronized viewer experience
                </p>
              </div>
            </div>

            <span className="hidden sm:inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-950/60 border border-rose-500/30 text-rose-300 text-xs font-semibold">
              <Clock className="w-3.5 h-3.5 text-rose-400" /> Asia/Kolkata (IST) Default
            </span>
          </div>

          {/* Date & Time Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* DATE INPUT */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Premiere Date <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="premiere-date-input"
                  type="date"
                  value={dateStr}
                  onChange={(e) => setDateStr(e.target.value)}
                  className="w-full bg-[#161826] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
                />
              </div>

              {/* Quick Date Presets */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => handleSetQuickDate(0)}
                  className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-medium transition-colors"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => handleSetQuickDate(1)}
                  className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-medium transition-colors"
                >
                  Tomorrow
                </button>
                <button
                  type="button"
                  onClick={() => handleSetQuickDate(2)}
                  className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-medium transition-colors"
                >
                  In 2 Days
                </button>
                <button
                  type="button"
                  onClick={() => handleSetQuickDate(7)}
                  className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-medium transition-colors"
                >
                  Next Week
                </button>
              </div>
            </div>

            {/* TIME INPUT */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Broadcast Time <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="premiere-time-input"
                  type="time"
                  value={timeStr}
                  onChange={(e) => setTimeStr(e.target.value)}
                  className="w-full bg-[#161826] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
                />
              </div>

              {/* Quick Time Presets */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => handleSetQuickTime('18:00')}
                  className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-medium transition-colors"
                >
                  6:00 PM
                </button>
                <button
                  type="button"
                  onClick={() => handleSetQuickTime('19:00')}
                  className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-medium transition-colors"
                >
                  7:00 PM
                </button>
                <button
                  type="button"
                  onClick={() => handleSetQuickTime('20:00')}
                  className="px-2 py-0.5 rounded-lg bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 text-[10px] font-bold transition-colors border border-rose-500/30"
                >
                  8:00 PM Prime
                </button>
                <button
                  type="button"
                  onClick={() => handleSetQuickTime('21:00')}
                  className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-medium transition-colors"
                >
                  9:00 PM
                </button>
              </div>
            </div>

            {/* TIMEZONE SELECTOR */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Broadcasting Timezone
              </label>
              <div className="relative">
                <select
                  id="premiere-timezone-select"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full bg-[#161826] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
                >
                  {SUPPORTED_TIMEZONES.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-[10px] text-slate-400">
                Tamil TV standard is <strong className="text-slate-300">Asia/Kolkata (IST)</strong>. Viewers will also see their converted local time.
              </p>
            </div>
          </div>

          {/* Scheduled Time Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-[#151724] to-slate-900 border border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <Timer className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Target Broadcast Time
                </span>
                <p className="text-sm font-bold text-white tracking-wide">
                  {formatPremiereDateTime(currentUtcIso, timezone)}
                </p>
              </div>
            </div>

            {isPastTime ? (
              <div className="px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                <span>Notice: Scheduled in the past or immediately</span>
              </div>
            ) : (
              <div className="px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Ready to Schedule</span>
              </div>
            )}
          </div>

          {/* Premiere Title & Custom Message */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Premiere Event Title (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. World Television Premiere"
                value={premiereTitle}
                onChange={(e) => setPremiereTitle(e.target.value)}
                className="w-full bg-[#161826] border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">Displays prominently above the countdown timer.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Audience Announcement (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Don't miss this exclusive 4K cinema broadcast!"
                value={premiereMessage}
                onChange={(e) => setPremiereMessage(e.target.value)}
                className="w-full bg-[#161826] border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">Shown in the waiting room marquee.</p>
            </div>
          </div>

          {/* Premiere Options & Experience Toggles */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Interactive Features & Countdown Settings
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Toggle: Viewers Can Set Reminder */}
              <label className="p-3 bg-[#161826] border border-slate-800 rounded-xl flex items-start gap-2.5 cursor-pointer hover:border-slate-700 transition-colors">
                <input
                  type="checkbox"
                  checked={reminderEnabled}
                  onChange={(e) => setReminderEnabled(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded bg-slate-800 border-slate-700 text-rose-600 focus:ring-0 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-semibold text-white flex items-center gap-1">
                    <Bell className="w-3.5 h-3.5 text-rose-400" /> Reminders
                  </span>
                  <p className="text-[10px] text-slate-400 mt-0.5">Let users click "Set Reminder"</p>
                </div>
              </label>

              {/* Toggle: Synchronized Countdown */}
              <label className="p-3 bg-[#161826] border border-slate-800 rounded-xl flex items-start gap-2.5 cursor-pointer hover:border-slate-700 transition-colors">
                <input
                  type="checkbox"
                  checked={countdownEnabled}
                  onChange={(e) => setCountdownEnabled(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded bg-slate-800 border-slate-700 text-rose-600 focus:ring-0 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-semibold text-white flex items-center gap-1">
                    <Timer className="w-3.5 h-3.5 text-amber-400" /> Countdown
                  </span>
                  <p className="text-[10px] text-slate-400 mt-0.5">High-precision clock overlay</p>
                </div>
              </label>

              {/* Toggle: Live Reaction / Chat */}
              <label className="p-3 bg-[#161826] border border-slate-800 rounded-xl flex items-start gap-2.5 cursor-pointer hover:border-slate-700 transition-colors">
                <input
                  type="checkbox"
                  checked={chatEnabled}
                  onChange={(e) => setChatEnabled(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded bg-slate-800 border-slate-700 text-rose-600 focus:ring-0 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-semibold text-white flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5 text-indigo-400" /> Live Chat
                  </span>
                  <p className="text-[10px] text-slate-400 mt-0.5">Allow live crowd chat during debut</p>
                </div>
              </label>

              {/* Toggle: Thumbnail Backdrop */}
              <label className="p-3 bg-[#161826] border border-slate-800 rounded-xl flex items-start gap-2.5 cursor-pointer hover:border-slate-700 transition-colors">
                <input
                  type="checkbox"
                  checked={showThumbnail}
                  onChange={(e) => setShowThumbnail(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded bg-slate-800 border-slate-700 text-rose-600 focus:ring-0 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-semibold text-white flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5 text-emerald-400" /> Poster
                  </span>
                  <p className="text-[10px] text-slate-400 mt-0.5">Show banner in waiting room</p>
                </div>
              </label>
            </div>

            {/* Countdown Duration selector if countdown enabled */}
            {countdownEnabled && (
              <div className="flex items-center gap-3 pt-2 text-xs text-slate-400">
                <span className="font-semibold text-slate-300">Final Countdown Intro Duration:</span>
                {[1, 2, 3, 5].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setCountdownDuration(mins)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                      countdownDuration === mins
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {mins} min{mins > 1 ? 's' : ''}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
