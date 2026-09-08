import { Video } from '../types';

export const SUPPORTED_TIMEZONES = [
  { value: 'Asia/Kolkata', label: 'India Standard Time (IST - UTC+05:30)', short: 'IST', offsetMinutes: 330 },
  { value: 'UTC', label: 'Coordinated Universal Time (UTC)', short: 'UTC', offsetMinutes: 0 },
  { value: 'America/New_York', label: 'Eastern Time (US & Canada) (ET)', short: 'ET', offsetMinutes: -300 },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US & Canada) (PT)', short: 'PT', offsetMinutes: -480 },
  { value: 'Europe/London', label: 'London / GMT (UK)', short: 'GMT', offsetMinutes: 0 },
  { value: 'Asia/Dubai', label: 'Gulf Standard Time (GST - Dubai)', short: 'GST', offsetMinutes: 240 },
  { value: 'Asia/Singapore', label: 'Singapore Standard Time (SGT)', short: 'SGT', offsetMinutes: 480 },
  { value: 'Asia/Colombo', label: 'Sri Lanka Standard Time (SLST)', short: 'SLST', offsetMinutes: 330 },
  { value: 'Asia/Kuala_Lumpur', label: 'Malaysia Time (MYT)', short: 'MYT', offsetMinutes: 480 },
  { value: 'Australia/Sydney', label: 'Australian Eastern Time (AEST)', short: 'AEST', offsetMinutes: 600 },
];

export const DEFAULT_TIMEZONE = 'Asia/Kolkata';

/**
 * Combines a date string ('YYYY-MM-DD') and time string ('HH:mm') in a target timezone into an ISO 8601 UTC string.
 */
export function combineDateTimeToUtcIso(dateStr: string, timeStr: string, timezone: string = DEFAULT_TIMEZONE): string {
  if (!dateStr || !timeStr) return '';

  const [year, month, day] = dateStr.split('-').map((v) => parseInt(v, 10));
  const [hour, minute] = timeStr.split(':').map((v) => parseInt(v, 10));

  if (isNaN(year) || isNaN(month) || isNaN(day) || isNaN(hour) || isNaN(minute)) {
    return '';
  }

  // Use Intl to compute the offset of the target timezone at this approximate time
  const targetTz = timezone || DEFAULT_TIMEZONE;
  
  // Create an initial UTC Date
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  
  try {
    // Find what time utcGuess represents in target timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: targetTz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    
    const parts = formatter.formatToParts(utcGuess);
    const getVal = (type: string) => parseInt(parts.find((p) => p.type === type)?.value || '0', 10);
    
    const tzYear = getVal('year');
    const tzMonth = getVal('month');
    const tzDay = getVal('day');
    let tzHour = getVal('hour');
    if (tzHour === 24) tzHour = 0;
    const tzMin = getVal('minute');
    
    // Difference between target time and what was actually formatted
    const targetTimeMs = Date.UTC(year, month - 1, day, hour, minute, 0);
    const tzTimeMs = Date.UTC(tzYear, tzMonth - 1, tzDay, tzHour, tzMin, 0);
    const offsetMs = tzTimeMs - utcGuess.getTime();
    
    // Corrected UTC date
    const finalUtcDate = new Date(targetTimeMs - offsetMs);
    return finalUtcDate.toISOString();
  } catch (err) {
    // Fallback: match known offset
    const tzObj = SUPPORTED_TIMEZONES.find((t) => t.value === targetTz);
    const offsetMin = tzObj ? tzObj.offsetMinutes : 330;
    const utcMs = Date.UTC(year, month - 1, day, hour, minute, 0) - offsetMin * 60 * 1000;
    return new Date(utcMs).toISOString();
  }
}

/**
 * Extracts { dateStr: 'YYYY-MM-DD', timeStr: 'HH:mm' } for an ISO 8601 UTC string in the specified timezone.
 */
export function formatForInputs(utcIso: string, timezone: string = DEFAULT_TIMEZONE): { dateStr: string; timeStr: string } {
  if (!utcIso) {
    const now = new Date();
    return {
      dateStr: now.toISOString().split('T')[0],
      timeStr: '20:00',
    };
  }

  const date = new Date(utcIso);
  if (isNaN(date.getTime())) {
    const now = new Date();
    return {
      dateStr: now.toISOString().split('T')[0],
      timeStr: '20:00',
    };
  }

  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone || DEFAULT_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    const parts = formatter.formatToParts(date);
    const getVal = (type: string) => parts.find((p) => p.type === type)?.value || '';

    const year = getVal('year');
    const month = getVal('month');
    const day = getVal('day');
    let hour = getVal('hour');
    if (hour === '24') hour = '00';
    const minute = getVal('minute');

    return {
      dateStr: `${year}-${month}-${day}`,
      timeStr: `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`,
    };
  } catch {
    const dStr = date.toISOString().split('T')[0];
    const tStr = date.toISOString().split('T')[1].substring(0, 5);
    return { dateStr: dStr, timeStr: tStr };
  }
}

/**
 * Formats an ISO UTC date string into a human-readable string in the specified timezone.
 * e.g., "Friday, Oct 24, 2025 at 8:00 PM IST"
 */
export function formatPremiereDateTime(
  utcIso: string,
  timezone: string = DEFAULT_TIMEZONE,
  includeTimezoneBadge = true
): string {
  if (!utcIso) return 'Not scheduled';
  const date = new Date(utcIso);
  if (isNaN(date.getTime())) return 'Invalid date';

  const tz = timezone || DEFAULT_TIMEZONE;
  const tzObj = SUPPORTED_TIMEZONES.find((t) => t.value === tz);
  const tzAbbr = tzObj?.short || tz.split('/').pop() || 'IST';

  try {
    const formatter = new Intl.DateTimeFormat('en-IN', {
      timeZone: tz,
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    const formatted = formatter.format(date);
    return includeTimezoneBadge ? `${formatted} ${tzAbbr}` : formatted;
  } catch {
    return date.toLocaleString() + (includeTimezoneBadge ? ` ${tzAbbr}` : '');
  }
}

/**
 * Short human readable date (e.g. "Today • 8:00 PM IST" or "Tomorrow • 8:00 PM IST")
 */
export function formatPremiereRelativeTime(utcIso: string, timezone: string = DEFAULT_TIMEZONE): string {
  if (!utcIso) return '';
  const date = new Date(utcIso);
  if (isNaN(date.getTime())) return '';

  const tz = timezone || DEFAULT_TIMEZONE;
  const tzObj = SUPPORTED_TIMEZONES.find((t) => t.value === tz);
  const tzAbbr = tzObj?.short || 'IST';

  try {
    const timeFormatter = new Intl.DateTimeFormat('en-IN', {
      timeZone: tz,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    const timeFormatted = timeFormatter.format(date);

    // Get today and target day strings in target timezone
    const now = new Date();
    const dayFormatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

    const targetDayStr = dayFormatter.format(date);
    const nowDayStr = dayFormatter.format(now);

    const nowTargetDiffDays = Math.round(
      (new Date(targetDayStr).getTime() - new Date(nowDayStr).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (nowTargetDiffDays === 0) {
      return `Today • ${timeFormatted} ${tzAbbr}`;
    }
    if (nowTargetDiffDays === 1) {
      return `Tomorrow • ${timeFormatted} ${tzAbbr}`;
    }
    if (nowTargetDiffDays === -1) {
      return `Yesterday • ${timeFormatted} ${tzAbbr}`;
    }

    const fullFormatter = new Intl.DateTimeFormat('en-IN', {
      timeZone: tz,
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    return `${fullFormatter.format(date)} ${tzAbbr}`;
  } catch {
    return date.toLocaleString();
  }
}

export interface PremiereLifecycle {
  state: 'scheduled' | 'live' | 'completed' | 'cancelled' | 'none';
  isPremiere: boolean;
  isScheduled: boolean;
  isLive: boolean;
  isCompleted: boolean;
  isCancelled: boolean;
  secondsUntilPremiere: number;
  elapsedSeconds: number;
  totalDurationSeconds: number;
  progressPercent: number;
  formattedCountdown: {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    formatted: string;
  };
  premiereDate: Date | null;
  scheduledText: string;
}

/**
 * Calculates authoritative premiere lifecycle state independent of server/admin panel.
 * Automatically synchronizes late joiners to current elapsed seconds!
 */
export function calculatePremiereLifecycle(video?: Video | null, currentNowMs: number = Date.now()): PremiereLifecycle {
  const defaultRes: PremiereLifecycle = {
    state: 'none',
    isPremiere: false,
    isScheduled: false,
    isLive: false,
    isCompleted: false,
    isCancelled: false,
    secondsUntilPremiere: 0,
    elapsedSeconds: 0,
    totalDurationSeconds: 0,
    progressPercent: 0,
    formattedCountdown: { days: 0, hours: 0, minutes: 0, seconds: 0, formatted: '00:00:00' },
    premiereDate: null,
    scheduledText: '',
  };

  if (!video) return defaultRes;

  const isPremiereConfigured = !!(
    video.premiere_enabled ||
    video.status === 'scheduled_premiere' ||
    video.status === 'premiere_live' ||
    video.status === 'premiere_completed' ||
    (video.premiere_at && video.status !== 'cancelled')
  );

  if (!isPremiereConfigured || !video.premiere_at) {
    if (video.status === 'cancelled') {
      return {
        ...defaultRes,
        state: 'cancelled',
        isCancelled: true,
      };
    }
    return defaultRes;
  }

  if (video.status === 'cancelled') {
    return {
      ...defaultRes,
      state: 'cancelled',
      isPremiere: true,
      isCancelled: true,
      scheduledText: 'Premiere Cancelled',
    };
  }

  const premiereDate = new Date(video.premiere_at);
  if (isNaN(premiereDate.getTime())) return defaultRes;

  const premiereTimeMs = premiereDate.getTime();
  const diffMs = premiereTimeMs - currentNowMs;
  const secondsUntilPremiere = Math.floor(diffMs / 1000);

  const durationSeconds = video.duration || 180;
  const durationMs = durationSeconds * 1000;
  const endMs = premiereTimeMs + durationMs;

  let state: 'scheduled' | 'live' | 'completed' | 'cancelled' | 'none' = 'none';
  let elapsedSeconds = 0;
  let progressPercent = 0;

  if (diffMs > 0) {
    // Before Premiere starts
    state = 'scheduled';
  } else if (currentNowMs < endMs) {
    // During Premiere broadcast
    state = 'live';
    elapsedSeconds = Math.max(0, Math.floor((currentNowMs - premiereTimeMs) / 1000));
    progressPercent = Math.min(100, (elapsedSeconds / durationSeconds) * 100);
  } else {
    // After Premiere completed
    state = 'completed';
    elapsedSeconds = durationSeconds;
    progressPercent = 100;
  }

  // Calculate countdown days, hours, minutes, seconds
  const remainingSec = Math.max(0, secondsUntilPremiere);
  const days = Math.floor(remainingSec / 86400);
  const hours = Math.floor((remainingSec % 86400) / 3600);
  const minutes = Math.floor((remainingSec % 3600) / 60);
  const seconds = remainingSec % 60;

  let formatted = '';
  if (days > 0) {
    formatted = `${days}d ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  } else {
    formatted = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  const scheduledText = formatPremiereDateTime(video.premiere_at, video.premiere_timezone || DEFAULT_TIMEZONE);

  return {
    state,
    isPremiere: true,
    isScheduled: state === 'scheduled',
    isLive: state === 'live',
    isCompleted: state === 'completed',
    isCancelled: false,
    secondsUntilPremiere,
    elapsedSeconds,
    totalDurationSeconds: durationSeconds,
    progressPercent,
    formattedCountdown: {
      days,
      hours,
      minutes,
      seconds,
      formatted,
    },
    premiereDate,
    scheduledText,
  };
}
