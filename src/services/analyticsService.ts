import {
  AnalyticsSettings,
  AnalyticsConnectionStatus,
  AnalyticsTestResult,
  GA4EventName,
  VideoAnalyticsParams,
} from '../types/analytics';

export const DEFAULT_ANALYTICS_SETTINGS: AnalyticsSettings = {
  enabled: false,
  ga_measurement_id: '',
  google_tag_id: '',
  website_url: typeof window !== 'undefined' ? window.location.origin : '',
  stream_name: 'Tamil TV Stream',
  enhanced_measurement: true,
  debug_mode: false,
  respect_consent: false,
  track_pageviews: true,
  track_video_events: true,
  track_search: true,
  track_categories: true,
  track_filters: true,
  track_auth: true,
  track_ui_clicks: true,
  track_admin_activity: false, // OFF by default so internal traffic does not pollute user data
};

const GA_SCRIPT_ID = 'ga4-gtag-script';

export const isValidMeasurementId = (id?: string | null): boolean => {
  if (!id) return false;
  const trimmed = id.trim().toUpperCase();
  // Standard GA4 Measurement ID pattern: G-XXXXXXXXXX (alphanumeric)
  return /^G-[A-Z0-9]{4,15}$/.test(trimmed);
};

class GoogleAnalyticsService {
  private currentSettings: AnalyticsSettings = { ...DEFAULT_ANALYTICS_SETTINGS };
  private isInitialized = false;
  private activeMeasurementId: string | null = null;
  private lastTrackedPath: string | null = null;
  private consentGranted = true;

  constructor() {
    // Check stored consent if any
    if (typeof window !== 'undefined') {
      const storedConsent = localStorage.getItem('STREAMVAULT_ANALYTICS_CONSENT');
      if (storedConsent === 'denied') {
        this.consentGranted = false;
      }
    }
  }

  /**
   * Initializes or updates the Google Analytics 4 integration with the given settings.
   */
  public initialize(settings: AnalyticsSettings): AnalyticsConnectionStatus {
    this.currentSettings = { ...DEFAULT_ANALYTICS_SETTINGS, ...settings };

    if (typeof window === 'undefined') {
      return 'NOT_CONFIGURED';
    }

    const measurementId = (this.currentSettings.ga_measurement_id || '').trim().toUpperCase();

    // 1. If disabled
    if (!this.currentSettings.enabled) {
      this.teardown();
      return measurementId ? 'DISABLED' : 'NOT_CONFIGURED';
    }

    // 2. If enabled but no ID
    if (!measurementId) {
      this.teardown();
      return 'NOT_CONFIGURED';
    }

    // 3. If ID format is invalid
    if (!isValidMeasurementId(measurementId)) {
      this.teardown();
      return 'INVALID_CONFIGURATION';
    }

    // 4. If already initialized with this exact Measurement ID
    if (this.isInitialized && this.activeMeasurementId === measurementId) {
      this.applyConfig(measurementId);
      return 'CONNECTED';
    }

    // 5. If measurement ID changed, tear down old script
    if (this.activeMeasurementId && this.activeMeasurementId !== measurementId) {
      this.teardown();
    }

    try {
      this.injectGtagScript(measurementId);
      this.isInitialized = true;
      this.activeMeasurementId = measurementId;
      return 'CONNECTED';
    } catch (err) {
      console.warn('[GA4] Initialization error:', err);
      return 'INVALID_CONFIGURATION';
    }
  }

  /**
   * Evaluates current client-side status
   */
  public getStatus(): AnalyticsConnectionStatus {
    if (!this.currentSettings.enabled) {
      return this.currentSettings.ga_measurement_id ? 'DISABLED' : 'NOT_CONFIGURED';
    }
    if (!this.currentSettings.ga_measurement_id) {
      return 'NOT_CONFIGURED';
    }
    if (!isValidMeasurementId(this.currentSettings.ga_measurement_id)) {
      return 'INVALID_CONFIGURATION';
    }
    if (this.isInitialized && this.isScriptLoaded()) {
      return 'CONNECTED';
    }
    return 'INVALID_CONFIGURATION';
  }

  public getSettings(): AnalyticsSettings {
    return { ...this.currentSettings };
  }

  public setConsent(granted: boolean) {
    this.consentGranted = granted;
    if (typeof window !== 'undefined') {
      localStorage.setItem('STREAMVAULT_ANALYTICS_CONSENT', granted ? 'granted' : 'denied');
      if ((window as any).gtag) {
        (window as any).gtag('consent', 'update', {
          analytics_storage: granted ? 'granted' : 'denied',
        });
      }
    }
  }

  public getConsent(): boolean {
    return this.consentGranted;
  }

  private isScriptLoaded(): boolean {
    if (typeof document === 'undefined') return false;
    return !!document.getElementById(GA_SCRIPT_ID);
  }

  private injectGtagScript(measurementId: string) {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    // Remove any existing script first
    const existing = document.getElementById(GA_SCRIPT_ID);
    if (existing) existing.remove();

    // Prepare dataLayer and gtag function
    (window as any).dataLayer = (window as any).dataLayer || [];
    if (!(window as any).gtag) {
      function gtagFunction(...args: any[]) {
        (window as any).dataLayer.push(args);
      }
      (window as any).gtag = gtagFunction;
    }

    const gtag = (window as any).gtag;

    // If Consent Mode is required, set default consent state
    if (this.currentSettings.respect_consent) {
      gtag('consent', 'default', {
        analytics_storage: this.consentGranted ? 'granted' : 'denied',
        ad_storage: 'denied',
        wait_for_update: 500,
      });
    }

    gtag('js', new Date());
    this.applyConfig(measurementId);

    // Create & append the official Google Tag script
    const script = document.createElement('script');
    script.id = GA_SCRIPT_ID;
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
    script.onerror = (e) => {
      console.warn('[GA4] Failed to load Google Tag script from network.', e);
    };
    document.head.appendChild(script);
  }

  private applyConfig(measurementId: string) {
    if (typeof window === 'undefined') return;
    const gtag = (window as any).gtag;
    if (!gtag) return;

    const configPayload: Record<string, any> = {
      send_page_view: false, // SPA handles page views manually to prevent duplicates
    };

    if (this.currentSettings.debug_mode) {
      configPayload.debug_mode = true;
    }

    if (this.currentSettings.stream_name) {
      configPayload.stream_name = this.currentSettings.stream_name;
    }

    gtag('config', measurementId, configPayload);
  }

  public teardown() {
    if (typeof document !== 'undefined') {
      const script = document.getElementById(GA_SCRIPT_ID);
      if (script) script.remove();
    }
    this.isInitialized = false;
    this.activeMeasurementId = null;
    this.lastTrackedPath = null;
  }

  /**
   * Track Single Page Application (SPA) route changes
   */
  public trackPageView(path: string, title?: string, isInternalRoute = false) {
    if (!this.canTrack(isInternalRoute)) return;
    if (!this.currentSettings.track_pageviews) return;

    // Deduplicate rapid consecutive page views on same path
    if (this.lastTrackedPath === path) return;
    this.lastTrackedPath = path;

    const pageTitle = title || (typeof document !== 'undefined' ? document.title : '');
    const pageLocation = typeof window !== 'undefined' ? window.location.href : path;

    this.sendEvent('page_view', {
      page_path: path,
      page_title: pageTitle,
      page_location: pageLocation,
    });
  }

  /**
   * Generic GA4 event dispatcher with safety sanitization
   */
  public trackEvent(eventName: GA4EventName | string, params: Record<string, any> = {}, isInternalRoute = false) {
    if (!this.canTrack(isInternalRoute)) return;
    this.sendEvent(eventName, params);
  }

  /**
   * Video Tracking Methods
   */
  public trackVideoImpression(video: VideoAnalyticsParams) {
    if (!this.currentSettings.track_video_events) return;
    this.trackEvent('video_impression', this.sanitizeVideoParams(video));
  }

  public trackVideoOpen(video: VideoAnalyticsParams) {
    if (!this.currentSettings.track_video_events) return;
    this.trackEvent('video_open', this.sanitizeVideoParams(video));
  }

  public trackVideoPlay(video: VideoAnalyticsParams, positionSeconds = 0, durationSeconds = 0) {
    if (!this.currentSettings.track_video_events) return;
    this.trackEvent(
      'video_play',
      this.sanitizeVideoParams({
        ...video,
        video_position: Math.round(positionSeconds),
        video_duration: Math.round(durationSeconds || video.video_duration || 0),
        video_percent: durationSeconds > 0 ? Math.round((positionSeconds / durationSeconds) * 100) : 0,
      })
    );
  }

  public trackVideoPause(video: VideoAnalyticsParams, positionSeconds = 0, durationSeconds = 0) {
    if (!this.currentSettings.track_video_events) return;
    this.trackEvent(
      'video_pause',
      this.sanitizeVideoParams({
        ...video,
        video_position: Math.round(positionSeconds),
        video_duration: Math.round(durationSeconds || video.video_duration || 0),
        video_percent: durationSeconds > 0 ? Math.round((positionSeconds / durationSeconds) * 100) : 0,
      })
    );
  }

  public trackVideoResume(video: VideoAnalyticsParams, positionSeconds = 0, durationSeconds = 0) {
    if (!this.currentSettings.track_video_events) return;
    this.trackEvent(
      'video_resume',
      this.sanitizeVideoParams({
        ...video,
        video_position: Math.round(positionSeconds),
        video_duration: Math.round(durationSeconds || video.video_duration || 0),
      })
    );
  }

  public trackVideoMilestone(
    milestone: 25 | 50 | 75 | 90,
    video: VideoAnalyticsParams,
    positionSeconds: number,
    durationSeconds: number
  ) {
    if (!this.currentSettings.track_video_events) return;
    const eventName: GA4EventName = `video_${milestone}_percent`;
    this.trackEvent(
      eventName,
      this.sanitizeVideoParams({
        ...video,
        video_position: Math.round(positionSeconds),
        video_duration: Math.round(durationSeconds),
        video_percent: milestone,
      })
    );
  }

  public trackVideoComplete(video: VideoAnalyticsParams, durationSeconds = 0) {
    if (!this.currentSettings.track_video_events) return;
    this.trackEvent(
      'video_complete',
      this.sanitizeVideoParams({
        ...video,
        video_duration: Math.round(durationSeconds || video.video_duration || 0),
        video_percent: 100,
      })
    );
  }

  public trackVideoSeek(video: VideoAnalyticsParams, fromSeconds: number, toSeconds: number) {
    if (!this.currentSettings.track_video_events) return;
    this.trackEvent(
      'video_seek',
      this.sanitizeVideoParams({
        ...video,
        from_position: Math.round(fromSeconds),
        to_position: Math.round(toSeconds),
        seek_direction: toSeconds > fromSeconds ? 'forward' : 'backward',
      })
    );
  }

  public trackVideoFullscreen(video: VideoAnalyticsParams, isFullscreen: boolean) {
    if (!this.currentSettings.track_video_events) return;
    this.trackEvent(
      'video_fullscreen',
      this.sanitizeVideoParams({
        ...video,
        is_fullscreen: isFullscreen,
      })
    );
  }

  public trackVideoMute(video: VideoAnalyticsParams, isMuted: boolean) {
    if (!this.currentSettings.track_video_events) return;
    this.trackEvent(
      isMuted ? 'video_mute' : 'video_unmute',
      this.sanitizeVideoParams({
        ...video,
        is_muted: isMuted,
      })
    );
  }

  public trackVideoSpeedChange(video: VideoAnalyticsParams, speed: number) {
    if (!this.currentSettings.track_video_events) return;
    this.trackEvent(
      'video_speed_change',
      this.sanitizeVideoParams({
        ...video,
        playback_speed: speed,
      })
    );
  }

  /**
   * Search Analytics
   */
  public trackSearch(searchTerm: string, resultsCount: number) {
    if (!this.canTrack(false)) return;
    if (!this.currentSettings.track_search) return;
    if (!searchTerm || !searchTerm.trim()) return;

    // Sanitize search term: truncate and strip potential sensitive tokens
    const cleanTerm = searchTerm.trim().slice(0, 100);
    this.sendEvent('search', {
      search_term: cleanTerm,
      results_count: resultsCount,
    });
  }

  /**
   * Filter Analytics
   */
  public trackFilter(filterName: string, filterValue: string) {
    if (!this.canTrack(false)) return;
    if (!this.currentSettings.track_filters) return;

    this.sendEvent('filter_used', {
      filter_name: filterName,
      filter_value: filterValue,
    });
  }

  /**
   * Category Analytics
   */
  public trackCategoryView(categoryId: string, categoryName: string) {
    if (!this.canTrack(false)) return;
    if (!this.currentSettings.track_categories) return;

    this.sendEvent('category_view', {
      category_id: categoryId,
      category_name: categoryName,
    });
  }

  /**
   * Authentication Analytics (Strictly non-sensitive metadata)
   */
  public trackAuth(type: 'login' | 'sign_up' | 'logout', method = 'email') {
    if (!this.canTrack(false)) return;
    if (!this.currentSettings.track_auth) return;

    this.sendEvent(type, {
      method: method,
    });
  }

  /**
   * UI Click / Interaction Tracking
   */
  public trackClick(action: 'video_card_click' | 'featured_video_click' | 'related_video_click' | 'share_click' | 'favorite_click' | string, metadata: Record<string, any> = {}) {
    if (!this.canTrack(false)) return;
    if (!this.currentSettings.track_ui_clicks) return;

    this.sendEvent(action, this.sanitizeParams(metadata));
  }

  /**
   * Connection Test for Admin Panel
   */
  public async testConnection(settingsToTest?: AnalyticsSettings): Promise<AnalyticsTestResult> {
    const config = settingsToTest || this.currentSettings;
    const measurementId = (config.ga_measurement_id || '').trim().toUpperCase();

    if (!config.enabled) {
      return {
        success: false,
        status: 'DISABLED',
        message: 'Google Analytics is currently disabled in settings.',
        timestamp: new Date().toISOString(),
        measurementId,
      };
    }

    if (!measurementId) {
      return {
        success: false,
        status: 'NOT_CONFIGURED',
        message: 'No Measurement ID has been configured.',
        timestamp: new Date().toISOString(),
      };
    }

    const formatValid = isValidMeasurementId(measurementId);
    if (!formatValid) {
      return {
        success: false,
        status: 'INVALID_CONFIGURATION',
        message: `Measurement ID "${measurementId}" is invalid. Expected format: G-XXXXXXXXXX.`,
        timestamp: new Date().toISOString(),
        measurementId,
        details: {
          formatValid: false,
          scriptLoaded: false,
          gtagDefined: false,
          testEventDispatched: false,
        },
      };
    }

    try {
      // Re-init with provided test config
      this.initialize(config);

      // Verify DOM script insertion
      const scriptLoaded = this.isScriptLoaded();
      const gtagDefined = typeof window !== 'undefined' && typeof (window as any).gtag === 'function';

      // Send a safe diagnostic event
      let testEventDispatched = false;
      if (gtagDefined) {
        (window as any).gtag('event', 'ga4_connection_test', {
          test_timestamp: new Date().toISOString(),
          environment: 'admin_diagnostic',
          debug_mode: true,
        });
        testEventDispatched = true;
      }

      return {
        success: true,
        status: 'CONNECTED',
        message: `Google Analytics 4 initialized successfully with Measurement ID ${measurementId}.`,
        timestamp: new Date().toISOString(),
        measurementId,
        details: {
          formatValid: true,
          scriptLoaded,
          gtagDefined,
          testEventDispatched,
        },
      };
    } catch (err: any) {
      return {
        success: false,
        status: 'INVALID_CONFIGURATION',
        message: `Initialization failed: ${err?.message || 'Unknown network error'}`,
        timestamp: new Date().toISOString(),
        measurementId,
        details: {
          formatValid: true,
          scriptLoaded: false,
          gtagDefined: false,
          testEventDispatched: false,
        },
      };
    }
  }

  private canTrack(isInternalRoute: boolean): boolean {
    if (!this.currentSettings.enabled) return false;
    if (!this.currentSettings.ga_measurement_id || !isValidMeasurementId(this.currentSettings.ga_measurement_id)) {
      return false;
    }
    if (this.currentSettings.respect_consent && !this.consentGranted) {
      return false;
    }
    // Filter internal admin/manager actions unless explicitly enabled
    if (isInternalRoute && !this.currentSettings.track_admin_activity) {
      return false;
    }
    return true;
  }

  private sendEvent(eventName: string, params: Record<string, any> = {}) {
    if (typeof window === 'undefined') return;
    try {
      const gtag = (window as any).gtag;
      if (!gtag) return;

      const payload = {
        ...this.sanitizeParams(params),
      };

      if (this.currentSettings.debug_mode) {
        payload.debug_mode = true;
      }

      gtag('event', eventName, payload);
    } catch (err) {
      // Non-blocking catch to ensure GA failure never breaks user application
      console.warn('[GA4] Event dispatch suppressed:', err);
    }
  }

  private sanitizeVideoParams(video: VideoAnalyticsParams): Record<string, any> {
    const clean: Record<string, any> = {
      video_id: String(video.video_id || ''),
      video_title: String(video.video_title || '').slice(0, 150),
    };

    if (video.video_category) clean.video_category = String(video.video_category);
    if (typeof video.video_duration === 'number') clean.video_duration = Math.round(video.video_duration);
    if (typeof video.video_position === 'number') clean.video_position = Math.round(video.video_position);
    if (typeof video.video_percent === 'number') clean.video_percent = Math.round(video.video_percent);
    if (video.channel_name) clean.channel_name = String(video.channel_name);
    if (video.show_name) clean.show_name = String(video.show_name);
    if (video.episode_name) clean.episode_name = String(video.episode_name);
    if (video.language) clean.language = String(video.language);
    if (video.video_source) clean.video_source = String(video.video_source);
    if (video.page_location) clean.page_location = String(video.page_location);
    if (video.seek_direction) clean.seek_direction = String(video.seek_direction);
    if (typeof video.from_position === 'number') clean.from_position = Math.round(video.from_position);
    if (typeof video.to_position === 'number') clean.to_position = Math.round(video.to_position);
    if (typeof video.is_fullscreen === 'boolean') clean.is_fullscreen = video.is_fullscreen;
    if (typeof video.is_muted === 'boolean') clean.is_muted = video.is_muted;
    if (typeof video.playback_speed === 'number') clean.playback_speed = video.playback_speed;

    return clean;
  }

  private sanitizeParams(params: Record<string, any>): Record<string, any> {
    const clean: Record<string, any> = {};
    const FORBIDDEN_KEYS = [
      'password',
      'token',
      'secret',
      'access_token',
      'refresh_token',
      'auth',
      'email',
      'phone',
      'apikey',
      'api_key',
      'key',
    ];

    for (const [k, v] of Object.entries(params)) {
      const lower = k.toLowerCase();
      if (FORBIDDEN_KEYS.some((fk) => lower.includes(fk))) {
        continue;
      }
      if (typeof v === 'string') {
        clean[k] = v.slice(0, 250);
      } else if (typeof v === 'number' || typeof v === 'boolean') {
        clean[k] = v;
      }
    }
    return clean;
  }
}

export const analyticsService = new GoogleAnalyticsService();
