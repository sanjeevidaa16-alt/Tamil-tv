import React, { useState, useEffect, useRef } from 'react';
import {
  Radio,
  Bell,
  Check,
  Calendar,
  Clock,
  Sparkles,
  Share2,
  Users,
  ShieldAlert,
  Volume2,
  VolumeX,
  Play,
  Tv,
} from 'lucide-react';
import { Video } from '../../types';
import {
  calculatePremiereLifecycle,
  formatPremiereDateTime,
  DEFAULT_TIMEZONE,
} from '../../utils/premiereUtils';
import { videoService } from '../../services/videoService';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/common/Toast';
import { useUserPanelDesign } from '../../contexts/UserPanelDesignContext';
import { useAnalytics } from '../../contexts/AnalyticsContext';

interface PremiereStageProps {
  video: Video;
  onPremiereStart?: () => void;
  onPremiereComplete?: () => void;
}

export const PremiereStage: React.FC<PremiereStageProps> = ({
  video,
  onPremiereStart,
  onPremiereComplete,
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { activeDesign } = useUserPanelDesign();
  const { trackClick } = useAnalytics();

  const [lifecycle, setLifecycle] = useState(() => calculatePremiereLifecycle(video));
  const [reminderSet, setReminderSet] = useState(false);
  const [remindersCount, setRemindersCount] = useState(video.reminders_count || 12);
  const [loadingReminder, setLoadingReminder] = useState(false);

  // Check if current user has already set reminder
  useEffect(() => {
    let mounted = true;
    if (user?.id) {
      videoService.hasUserSetReminder(video.id, user.id).then((set) => {
        if (mounted) setReminderSet(set);
      });
    }
    return () => {
      mounted = false;
    };
  }, [video.id, user?.id]);

  // High precision countdown tick every 1000ms
  useEffect(() => {
    const interval = setInterval(() => {
      const updated = calculatePremiereLifecycle(video);
      setLifecycle(updated);

      if (updated.isLive && !lifecycle.isLive) {
        onPremiereStart?.();
        videoService.checkAndUpdatePremiereStatus(video);
      } else if (updated.isCompleted && !lifecycle.isCompleted) {
        onPremiereComplete?.();
        videoService.checkAndUpdatePremiereStatus(video);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [video, lifecycle.isLive, lifecycle.isCompleted, onPremiereStart, onPremiereComplete]);

  const handleToggleReminder = async () => {
    trackClick('premiere_reminder_click', {
      video_id: video.id,
      video_title: video.title,
      current_state: reminderSet ? 'remove' : 'set',
    });

    setLoadingReminder(true);
    try {
      const res = await videoService.togglePremiereReminder(video.id, user?.id, user?.email || undefined);
      setReminderSet(res.hasReminder);
      setRemindersCount(res.newCount);

      if (res.hasReminder) {
        showToast("Reminder set! You'll be notified when this premiere goes live.", 'success');
      } else {
        showToast('Premiere reminder removed.', 'info');
      }
    } catch (err: any) {
      showToast(err.message || 'Could not update reminder', 'error');
    } finally {
      setLoadingReminder(false);
    }
  };

  const handleSharePremiere = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      showToast('Premiere link copied to clipboard!', 'success');
    }
  };

  const { formattedCountdown, secondsUntilPremiere } = lifecycle;
  const isFinalHour = secondsUntilPremiere < 3600;
  const isFinalMinutes = secondsUntilPremiere < 300;

  return (
    <div
      id="premiere-stage-container"
      className="relative aspect-video w-full rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl flex flex-col items-center justify-center text-center p-6 sm:p-12 select-none"
      style={{
        borderRadius: activeDesign.player.radius,
      }}
    >
      {/* Background Poster Artwork with Cinematic Blur */}
      {video.thumbnail_url && (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-25 scale-105 filter blur-xl transition-all duration-1000"
          style={{ backgroundImage: `url(${video.thumbnail_url})` }}
        />
      )}

      {/* Atmospheric Vignette & Radial Light */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#090a12] via-[#090a12]/80 to-[#090a12]/90" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-rose-900/20 via-transparent to-transparent pointer-events-none" />

      {/* Top Banner: Broadcast Badge & Time */}
      <div className="relative z-10 flex flex-wrap items-center justify-center gap-2.5 mb-4 sm:mb-6">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-600 text-white text-[11px] font-black uppercase tracking-wider shadow-lg shadow-rose-900/50 animate-pulse">
          <Radio className="w-3.5 h-3.5" />
          <span>Premiere Waiting Room</span>
        </span>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-700/80 text-slate-300 text-[11px] font-mono font-medium">
          <Calendar className="w-3 h-3 text-slate-400" />
          <span>{formatPremiereDateTime(video.premiere_at || '', video.premiere_timezone || DEFAULT_TIMEZONE)}</span>
        </span>
      </div>

      {/* Main Content & Title */}
      <div className="relative z-10 max-w-2xl space-y-3">
        {video.premiere_title && (
          <span className="text-xs font-black uppercase tracking-widest text-amber-400 flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            {video.premiere_title}
          </span>
        )}

        <h1 className="text-xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-snug line-clamp-2">
          {video.title}
        </h1>

        {video.premiere_message && (
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-lg mx-auto line-clamp-2">
            "{video.premiere_message}"
          </p>
        )}
      </div>

      {/* High Precision Synchronized Countdown Display */}
      <div className="relative z-10 my-6 sm:my-8">
        <div className="flex items-center justify-center gap-2 sm:gap-4">
          {/* DAYS (if > 0) */}
          {formattedCountdown.days > 0 && (
            <div className="flex flex-col items-center">
              <div className="w-14 sm:w-20 h-16 sm:h-22 rounded-2xl bg-[#141624]/90 border border-slate-700/80 flex items-center justify-center shadow-xl backdrop-blur-md">
                <span className="text-2xl sm:text-4xl font-black text-white font-mono tracking-tighter">
                  {formattedCountdown.days.toString().padStart(2, '0')}
                </span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-2">Days</span>
            </div>
          )}

          {formattedCountdown.days > 0 && <span className="text-2xl sm:text-4xl font-bold text-slate-600 -mt-6">:</span>}

          {/* HOURS */}
          <div className="flex flex-col items-center">
            <div className="w-14 sm:w-20 h-16 sm:h-22 rounded-2xl bg-[#141624]/90 border border-slate-700/80 flex items-center justify-center shadow-xl backdrop-blur-md">
              <span className="text-2xl sm:text-4xl font-black text-white font-mono tracking-tighter">
                {formattedCountdown.hours.toString().padStart(2, '0')}
              </span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-2">Hours</span>
          </div>

          <span className="text-2xl sm:text-4xl font-bold text-slate-600 -mt-6">:</span>

          {/* MINUTES */}
          <div className="flex flex-col items-center">
            <div className="w-14 sm:w-20 h-16 sm:h-22 rounded-2xl bg-[#141624]/90 border border-slate-700/80 flex items-center justify-center shadow-xl backdrop-blur-md">
              <span className="text-2xl sm:text-4xl font-black text-white font-mono tracking-tighter">
                {formattedCountdown.minutes.toString().padStart(2, '0')}
              </span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-2">Mins</span>
          </div>

          <span className="text-2xl sm:text-4xl font-bold text-slate-600 -mt-6">:</span>

          {/* SECONDS */}
          <div className="flex flex-col items-center">
            <div
              className={`w-14 sm:w-20 h-16 sm:h-22 rounded-2xl flex items-center justify-center shadow-xl backdrop-blur-md transition-all ${
                isFinalMinutes
                  ? 'bg-rose-950/80 border-rose-500 shadow-rose-900/50'
                  : 'bg-[#141624]/90 border-slate-700/80'
              }`}
            >
              <span
                className={`text-2xl sm:text-4xl font-black font-mono tracking-tighter ${
                  isFinalMinutes ? 'text-rose-400 animate-pulse' : 'text-white'
                }`}
              >
                {formattedCountdown.seconds.toString().padStart(2, '0')}
              </span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-2">Secs</span>
          </div>
        </div>

        {isFinalMinutes && (
          <p className="text-xs font-bold text-rose-400 mt-3 animate-pulse">
            🚨 Final countdown! Video broadcast begins in moments...
          </p>
        )}
      </div>

      {/* Action Buttons: Remind Me & Share */}
      <div className="relative z-10 flex flex-wrap items-center justify-center gap-3">
        {video.premiere_reminder_enabled !== false && (
          <button
            type="button"
            id="premiere-remind-me-btn"
            disabled={loadingReminder}
            onClick={handleToggleReminder}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs sm:text-sm font-bold shadow-xl transition-all ${
              reminderSet
                ? 'bg-emerald-600 text-white shadow-emerald-950/50 hover:bg-emerald-500'
                : 'bg-rose-600 text-white shadow-rose-950/50 hover:bg-rose-500 active:scale-95'
            }`}
          >
            {reminderSet ? (
              <>
                <Check className="w-4 h-4" />
                <span>Reminder Set!</span>
              </>
            ) : (
              <>
                <Bell className="w-4 h-4 animate-bounce" />
                <span>Notify Me When Live</span>
              </>
            )}
          </button>
        )}

        <button
          type="button"
          id="premiere-share-btn"
          onClick={handleSharePremiere}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 text-xs sm:text-sm font-semibold border border-slate-700 transition-colors"
        >
          <Share2 className="w-4 h-4" />
          <span>Share Premiere</span>
        </button>
      </div>

      {/* Footer Info: Protected Stream & Audience Count */}
      <div className="relative z-10 mt-6 sm:mt-8 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 w-full max-w-xl text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5 text-slate-300">
          <Users className="w-3.5 h-3.5 text-rose-400" />
          <span>{remindersCount} viewers waiting for premiere</span>
        </div>

        <div className="flex items-center gap-1.5 text-slate-400">
          <Tv className="w-3.5 h-3.5 text-slate-500" />
          <span>Stream starts automatically at zero</span>
        </div>
      </div>
    </div>
  );
};
