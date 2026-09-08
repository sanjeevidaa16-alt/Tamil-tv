export type AnalyticsConnectionStatus =
  | 'CONNECTED'
  | 'NOT_CONFIGURED'
  | 'DISABLED'
  | 'INVALID_CONFIGURATION';

export interface AnalyticsSettings {
  id?: string;
  // Core Identifiers
  enabled: boolean;
  ga_measurement_id: string; // e.g. G-XXXXXXXXXX
  google_tag_id?: string; // Optional Google Tag / Stream ID
  website_url?: string;
  stream_name?: string;

  // Feature Toggles
  enhanced_measurement: boolean;
  debug_mode: boolean;
  respect_consent: boolean;

  // Granular Event Controls
  track_pageviews: boolean;
  track_video_events: boolean;
  track_search: boolean;
  track_categories: boolean;
  track_filters: boolean;
  track_auth: boolean;
  track_ui_clicks: boolean;
  track_admin_activity: boolean; // default false to prevent internal pollution

  created_at?: string;
  updated_at?: string;
  updated_by?: string;
}

export type GA4EventName =
  | 'page_view'
  | 'video_impression'
  | 'video_open'
  | 'video_play'
  | 'video_pause'
  | 'video_resume'
  | 'video_25_percent'
  | 'video_50_percent'
  | 'video_75_percent'
  | 'video_90_percent'
  | 'video_complete'
  | 'video_seek'
  | 'video_fullscreen'
  | 'video_mute'
  | 'video_unmute'
  | 'video_quality_change'
  | 'video_speed_change'
  | 'search'
  | 'filter_used'
  | 'category_view'
  | 'login'
  | 'sign_up'
  | 'logout'
  | 'video_card_click'
  | 'featured_video_click'
  | 'related_video_click'
  | 'share_click'
  | 'favorite_click';

export interface VideoAnalyticsParams {
  video_id: string;
  video_title: string;
  video_category?: string;
  video_duration?: number;
  video_position?: number;
  video_percent?: number;
  video_source?: string;
  channel_name?: string;
  show_name?: string;
  episode_name?: string;
  language?: string;
  page_location?: string;
  [key: string]: any;
}

export interface AnalyticsTestResult {
  success: boolean;
  status: AnalyticsConnectionStatus;
  message: string;
  timestamp: string;
  measurementId?: string;
  details?: {
    formatValid: boolean;
    scriptLoaded: boolean;
    gtagDefined: boolean;
    testEventDispatched: boolean;
  };
}
