export type UserRole = 'user' | 'manager' | 'admin';

export type PublishMode = 'publish_now' | 'unlisted' | 'premiere';

export type VideoStatus =
  | 'published'
  | 'draft'
  | 'unlisted'
  | 'unpublished'
  | 'scheduled_premiere'
  | 'premiere_live'
  | 'premiere_completed'
  | 'cancelled';

export type VideoVisibility = 'public' | 'private' | 'preview';

export type PremiereState = 'scheduled' | 'live' | 'completed' | 'cancelled' | 'none';

export interface VideoPremiereReminder {
  id: string;
  video_id: string;
  user_id?: string | null;
  email?: string;
  created_at: string;
}

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_sign_in_at?: string | null;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
  videos_count?: number;
}

export interface Video {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  video_path: string;
  duration: number; // in seconds
  category_id: string | null;
  uploaded_by: string | null;
  uploader_id?: string | null;
  status: VideoStatus;
  visibility?: VideoVisibility;
  tags?: string[];
  is_featured: boolean;
  views_count: number;
  created_at: string;
  updated_at: string;

  // Publishing & Premiere System Fields
  publish_mode?: PublishMode;
  published_at?: string | null;
  scheduled_at?: string | null;
  premiere_enabled?: boolean;
  premiere_at?: string | null; // ISO UTC
  premiere_timezone?: string; // e.g. 'Asia/Kolkata'
  premiere_title?: string;
  premiere_message?: string;
  premiere_countdown_enabled?: boolean;
  premiere_countdown_duration?: number; // in minutes (default 2)
  premiere_reminder_enabled?: boolean;
  premiere_chat_enabled?: boolean;
  premiere_show_thumbnail?: boolean;
  premiere_started_at?: string | null;
  premiere_completed_at?: string | null;
  premiere_cancelled_at?: string | null;
  reminders_count?: number;

  // Joined relation fields:
  category?: Category | null;
  uploader?: Profile | null;
}

export interface VideoView {
  id: string;
  video_id: string;
  user_id: string | null;
  created_at: string;
}

export interface DashboardStats {
  totalUsers: number;
  totalManagers: number;
  totalVideos: number;
  publishedVideos: number;
  privateVideos: number;
  previewVideos: number;
  totalViews: number;
  todayViews: number;
  newUsersCount: number;
  videosUploadedToday: number;
  recentVideos: Video[];
  recentUsers: Profile[];
  topViewedVideos: Video[];
}

export interface UploadVideoPayload {
  title: string;
  description: string;
  category_id?: string;
  categoryId?: string;
  thumbnailFile?: File | null;
  thumbnailUrl?: string;
  videoFile: File;
  is_featured?: boolean;
  isFeatured?: boolean;
  status: VideoStatus;
  visibility?: VideoVisibility;
  tags?: string[];
  duration?: number;
  uploaderId?: string;
  onProgress?: (percent: number) => void;

  // Publishing Mode & Premiere Options
  publish_mode?: PublishMode;
  published_at?: string | null;
  scheduled_at?: string | null;
  premiere_enabled?: boolean;
  premiere_at?: string | null;
  premiere_timezone?: string;
  premiere_title?: string;
  premiere_message?: string;
  premiere_countdown_enabled?: boolean;
  premiere_countdown_duration?: number;
  premiere_reminder_enabled?: boolean;
  premiere_chat_enabled?: boolean;
  premiere_show_thumbnail?: boolean;
}

export interface EditVideoPayload {
  title?: string;
  description?: string;
  category_id?: string;
  categoryId?: string;
  thumbnailFile?: File | null;
  thumbnailUrl?: string;
  thumbnail_url?: string;
  videoFile?: File | null;
  video_path?: string;
  is_featured?: boolean;
  isFeatured?: boolean;
  status?: VideoStatus;
  visibility?: VideoVisibility;
  tags?: string[];
  duration?: number;

  // Publishing Mode & Premiere Options
  publish_mode?: PublishMode;
  published_at?: string | null;
  scheduled_at?: string | null;
  premiere_enabled?: boolean;
  premiere_at?: string | null;
  premiere_timezone?: string;
  premiere_title?: string;
  premiere_message?: string;
  premiere_countdown_enabled?: boolean;
  premiere_countdown_duration?: number;
  premiere_reminder_enabled?: boolean;
  premiere_chat_enabled?: boolean;
  premiere_show_thumbnail?: boolean;
  premiere_started_at?: string | null;
  premiere_completed_at?: string | null;
  premiere_cancelled_at?: string | null;
}

export interface FooterLink {
  id: string;
  label: string;
  url: string;
  icon?: string;
  enabled: boolean;
  open_new_tab?: boolean;
  sort_order: number;
}

export interface FooterSection {
  id: string;
  title: string;
  enabled: boolean;
  sort_order: number;
  links: FooterLink[];
}

export interface FooterSocialLink {
  id: string;
  platform: 'youtube' | 'twitter' | 'instagram' | 'facebook' | 'telegram' | 'discord' | 'whatsapp' | 'linkedin' | 'github';
  label: string;
  url: string;
  enabled: boolean;
  sort_order: number;
}

import { UserPanelDesignId } from './userPanelDesign';
export type { UserPanelDesignId };

export interface ThemePreset {
  id: string;
  name: string;
  description?: string;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  foreground: string;
  muted: string;
  border: string;
  button: string;
  buttonHover: string;
}

export interface SiteSettings {
  id?: string;
  // 1. Identity
  site_name: string;
  site_short_name: string;
  site_tagline: string;
  site_description: string;

  // 2. Logos & Branding
  main_logo_url: string;
  header_logo_url: string;
  footer_logo_url: string;
  mobile_logo_url: string;
  favicon_url: string;

  // 3. Theme & Colors
  theme_name: string;
  ui_style?: string;
  user_panel_design?: UserPanelDesignId;
  appearance_mode: 'dark' | 'light' | 'system';
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  surface_color: string;
  surface_secondary_color?: string;
  surface_tertiary_color?: string;
  card_bg_color?: string;
  card_border_color?: string;
  foreground_color: string;
  text_color?: string;
  muted_color: string;
  border_color: string;
  border_strong_color?: string;
  input_bg_color?: string;
  input_border_color?: string;
  button_color: string;
  button_hover_color: string;
  player_bg_color?: string;
  player_progress_color?: string;
  success_color?: string;
  warning_color?: string;
  error_color?: string;
  info_color?: string;

  // Custom UI Style Options
  border_radius_scale?: 'sharp' | 'small' | 'medium' | 'large' | 'pill';
  card_shadow_strength?: 'none' | 'subtle' | 'medium' | 'strong' | 'glow';
  spacing_density?: 'compact' | 'comfortable' | 'spacious';
  font_scale?: 'compact' | 'standard' | 'large';
  animation_level?: 'none' | 'subtle' | 'normal' | 'enhanced';
  glass_effect?: boolean;

  // 4. Footer Settings
  footer_name: string;
  footer_description: string;
  copyright_text: string;
  auto_copyright_year: boolean;
  footer_disclaimer: string;

  // 5. Footer Status Badges
  status_rls_enabled: boolean;
  status_rls_text: string;
  status_rbac_enabled: boolean;
  status_rbac_text: string;
  status_supabase_enabled: boolean;
  status_supabase_text: string;

  // 6. Footer Navigation & Sections
  footer_sections: FooterSection[];
  footer_social_links: FooterSocialLink[];

  // 7. Contact Information
  contact_email: string;
  contact_phone: string;
  contact_address: string;
  support_url: string;

  // 8. SEO & Metadata
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
  og_title: string;
  og_description: string;
  og_image_url: string;

  // 9. Maintenance & System
  maintenance_mode: boolean;
  maintenance_notice: string;
  allow_user_signup: boolean;
  default_video_visibility: VideoVisibility;
  enable_analytics: boolean;
  enable_adsense: boolean;
  updated_at?: string;
}

export * from './analytics';

export interface AdSenseSettings {
  id?: string;
  publisher_id: string;
  ad_slot_id: string;
  enabled: boolean;
  placement_before_list: boolean;
  placement_between_cards: boolean;
  placement_details_page: boolean;
  placement_below_player: boolean;
  updated_at?: string;
}

export interface AdminActivityLog {
  id: string;
  admin_id?: string;
  admin_name?: string;
  action: string;
  target_type: 'video' | 'user' | 'category' | 'settings' | 'auth' | 'filter' | 'adsense';
  target_id?: string;
  details?: string;
  created_at: string;
}

// ==============================================================================
// MODULE 1: FILTER MANAGEMENT TYPES
// ==============================================================================

export type FilterType = 'single' | 'multi';

export interface VideoFilterOption {
  id: string;
  filter_id: string;
  label: string;
  value: string;
  enabled: boolean;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface VideoFilter {
  id: string;
  name: string;
  slug: string;
  description?: string;
  filter_type: FilterType;
  enabled: boolean;
  sort_order: number;
  options?: VideoFilterOption[];
  created_at?: string;
  updated_at?: string;
}

export interface CreateFilterPayload {
  name: string;
  slug?: string;
  description?: string;
  filter_type?: FilterType;
  enabled?: boolean;
  sort_order?: number;
  options?: Array<{
    label: string;
    value: string;
    enabled?: boolean;
    sort_order?: number;
  }>;
}

export interface UpdateFilterPayload {
  name?: string;
  slug?: string;
  description?: string;
  filter_type?: FilterType;
  enabled?: boolean;
  sort_order?: number;
}

export interface CreateFilterOptionPayload {
  filter_id: string;
  label: string;
  value: string;
  enabled?: boolean;
  sort_order?: number;
}

export interface UpdateFilterOptionPayload {
  label?: string;
  value?: string;
  enabled?: boolean;
  sort_order?: number;
}

// ==============================================================================
// MODULE 2: GOOGLE ADSENSE & PLACEMENT MANAGEMENT TYPES
// ==============================================================================

export type AdFormat = 'auto' | 'rectangle' | 'horizontal' | 'vertical';

export type AdPlacementKey =
  | 'header_top'
  | 'header_bottom'
  | 'video_list_top'
  | 'video_list_in_feed'
  | 'video_list_bottom'
  | 'video_details_above_player'
  | 'video_details_below_player'
  | 'video_details_below_description'
  | 'video_details_below_controls'
  | 'sidebar'
  | 'footer_top'
  | 'footer_bottom';

export interface AdSenseUnit {
  id: string;
  name: string;
  ad_slot_id: string;
  format: AdFormat;
  responsive: boolean;
  enabled: boolean;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
}

export interface AdPlacement {
  id: string;
  placement_key: AdPlacementKey;
  name: string;
  ad_unit_id: string | null;
  ad_unit?: AdSenseUnit | null;
  enabled: boolean;
  sort_order: number;
  frequency: number; // For in-feed: insert ad after every N videos (e.g., 3, 5, 8, 10)
  created_at?: string;
  updated_at?: string;
}

export interface AdCodeSettings {
  id?: string;
  name: string;
  code_type: 'html' | 'javascript' | 'adsense_tag';
  code_content: string;
  ad_file_url?: string | null;
  ad_file_name?: string | null;
  ad_file_size?: number | null;
  enabled: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AdSenseFullConfig {
  settings: AdSenseSettings;
  units: AdSenseUnit[];
  placements: AdPlacement[];
  custom_code: AdCodeSettings;
}

// ==============================================================================
// MODULE 3: ADSTERRA AD MANAGEMENT TYPES
// ==============================================================================

export type AdsterraStatus = 'disabled' | 'configured' | 'active' | 'configuration_required';

export type AdsterraVerificationMethod = 'meta' | 'html' | 'file';

export type AdsterraVerificationStatus =
  | 'not_configured'
  | 'configured'
  | 'verified'
  | 'verification_required';

export type AdsterraFormat =
  | 'banner'
  | 'native'
  | 'social_bar'
  | 'popunder'
  | 'in_page_push'
  | 'smartlink'
  | 'interstitial'
  | 'custom';

export type AdsterraStandardPlacementKey =
  | 'header'
  | 'center'
  | 'footer'
  | 'videos_top'
  | 'videos_center'
  | 'videos_bottom'
  | 'video_before_player'
  | 'video_after_player'
  | 'video_below_description'
  | 'video_before_related'
  | 'video_after_related'
  | 'between_video_cards';

export type AdsterraPlacementKey = AdsterraStandardPlacementKey | string;

export interface AdsterraSettings {
  id: string;
  enabled: boolean;
  website_name: string;
  website_domain: string;
  verification_method: AdsterraVerificationMethod;
  verification_code: string;
  verification_file_url?: string | null;
  verification_file_name?: string | null;
  verification_file_size?: number | null;
  verification_status: AdsterraVerificationStatus;
  created_at?: string;
  updated_at?: string;
}

export interface AdsterraAdUnit {
  id: string;
  name: string;
  format: AdsterraFormat;
  code: string;
  smartlink_url?: string;
  enabled: boolean;
  notes?: string;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface AdsterraPlacement {
  id: string;
  name: string;
  placement_key: string;
  page?: string;
  position?: string;
  ad_unit_id: string | null;
  ad_unit?: AdsterraAdUnit | null;
  enabled: boolean;
  frequency: number; // e.g. 3, 5, 8, 10 for in-feed
  sort_order: number;
  is_custom?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AdsterraFullConfig {
  settings: AdsterraSettings;
  units: AdsterraAdUnit[];
  placements: AdsterraPlacement[];
}


