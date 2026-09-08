export type UserPanelDesignId =
  | 'tamil-ott'
  | 'tamil-tv-classic'
  | 'cinema-dark'
  | 'glass-tv'
  | 'neon-tv'
  | 'minimal-tv'
  | 'premium-ott'
  | 'modern-grid'
  | 'tv-channel-hub'
  | 'mobile-first-tv'
  | 'social-video'
  | 'newspaper-tv'
  | 'future-tv';

export interface UserPanelDesignConfig {
  id: UserPanelDesignId;
  name: string;
  tamilName: string;
  tagline: string;
  description: string;
  category: 'OTT Streaming' | 'Television Broadcast' | 'Cinematic' | 'Aesthetic Modern' | 'Mobile & Social';
  badge: string;

  // 1. Layout tokens
  layout: {
    mode:
      | 'ott-featured-rows'
      | 'classic-tv-portal'
      | 'cinema-theatre'
      | 'glass-translucent'
      | 'neon-matrix'
      | 'minimal-stream'
      | 'premium-carousel'
      | 'dense-grid'
      | 'channel-network'
      | 'mobile-stack'
      | 'social-feed'
      | 'newspaper-editorial'
      | 'future-holodeck';
    containerMaxWidth: string;
    spacingDensity: 'compact' | 'comfortable' | 'spacious';
    hasHeroBanner: boolean;
    heroStyle:
      | 'cinematic-billboard'
      | 'tv-broadcast'
      | 'newspaper-headline'
      | 'social-spotlight'
      | 'minimal-banner'
      | 'future-prism'
      | 'dense-quick-bar'
      | 'none';
    hasChannelStrip: boolean;
    hasTicker: boolean;
    hasBottomNav: boolean;
    sectionRowLayout: boolean; // horizontal content rows vs vertical grid
  };

  // 2. Header tokens
  header: {
    style:
      | 'tamil-ott'
      | 'tv-classic'
      | 'cinema-dark'
      | 'glass-floating'
      | 'neon-cyber'
      | 'minimal-clean'
      | 'premium-ott'
      | 'modern-grid'
      | 'channel-hub'
      | 'mobile-bar'
      | 'social-stream'
      | 'newspaper-editorial'
      | 'future-dock';
    height: string;
    isSticky: boolean;
    isFloating: boolean;
    backdropBlur: string;
    showLiveIndicator: boolean;
    showChannelTabs: boolean;
    showTamilDate: boolean;
    searchStyle: 'pill-compact' | 'wide-focus' | 'minimal-icon' | 'glass-bar' | 'editorial-box' | 'floating-overlay';
  };

  // 3. Navigation tokens
  navigation: {
    variant:
      | 'top-pills'
      | 'channel-tabs'
      | 'minimal-links'
      | 'glass-capsule'
      | 'neon-glow'
      | 'editorial-categories'
      | 'bottom-nav'
      | 'social-rail'
      | 'future-floating';
    activeIndicator: 'pill' | 'glow-line' | 'dot' | 'box' | 'underline' | 'badge';
    showCategoryIcons: boolean;
  };

  // 4. Video Card tokens
  card: {
    variant:
      | 'tamil-ott'
      | 'classic-tv'
      | 'cinema-dark'
      | 'glass-tv'
      | 'neon-tv'
      | 'minimal-tv'
      | 'premium-ott'
      | 'modern-grid'
      | 'channel-hub'
      | 'mobile-first'
      | 'social-video'
      | 'newspaper-tv'
      | 'future-tv';
    aspectRatio: '16/9' | '21/9' | '4/3' | '9/16' | '3/2';
    cardRadius: string;
    cardBorder: string;
    cardShadow: string;
    hoverEffect: 'zoom-glow' | 'lift-clean' | 'cinema-expand' | 'glass-lift' | 'neon-pulse' | 'subtle-fade' | 'card-tilt';
    showDurationBadge: boolean;
    showCategoryBadge: boolean;
    showBroadcastTime: boolean;
    showEpisodeBadge: boolean;
    showViewsBadge: boolean;
    showActionButtons: boolean;
    playButtonVariant: 'centered-glow' | 'corner-circle' | 'minimal-play' | 'neon-disc' | 'pill-button' | 'glass-lens';
  };

  // 5. Video Player tokens
  player: {
    skin:
      | 'tamil-ott'
      | 'classic-tv'
      | 'cinema-dark'
      | 'glass-tv'
      | 'neon-tv'
      | 'minimal-tv'
      | 'premium-ott'
      | 'modern-grid'
      | 'channel-hub'
      | 'mobile-first'
      | 'social-video'
      | 'newspaper-tv'
      | 'future-tv';
    controlBarPosition: 'floating-bottom' | 'bottom-bar' | 'glass-pill' | 'minimal-overlay' | 'cinema-dimmed';
    radius: string;
    showChannelWatermark: boolean;
    showLiveBadge: boolean;
    showEditorialCaption: boolean;
    touchControls: boolean;
  };

  // 6. Filter & Search tokens
  filters: {
    variant:
      | 'pill-chips'
      | 'tv-guide-bar'
      | 'minimal-dropdown'
      | 'glass-chips'
      | 'neon-tags'
      | 'editorial-rubric'
      | 'mobile-scroll'
      | 'channel-buttons'
      | 'future-matrix';
    containerRadius: string;
    badgeStyle: string;
  };

  // 7. Watch / Video Detail Page Layout
  detailPage: {
    layout: 'cinema-theatre' | 'ott-two-column' | 'editorial-article' | 'tv-guide' | 'social-rail' | 'floating-glass';
    recommendationStyle: 'horizontal-row' | 'vertical-sidebar' | 'editorial-grid' | 'compact-list';
  };

  // 8. Footer tokens
  footer: {
    variant:
      | 'ott-broad'
      | 'tv-broadcast'
      | 'cinema-minimal'
      | 'glass-frost'
      | 'neon-cyber'
      | 'minimal-subtle'
      | 'editorial-press'
      | 'channel-network'
      | 'mobile-dock'
      | 'future-sleek';
  };

  // 9. Component Styling (Buttons, Inputs, Modals, Badges)
  components: {
    buttonRadius: string;
    inputRadius: string;
    modalRadius: string;
    tagRadius: string;
    animationSpeed: 'fast' | 'normal' | 'slow' | 'cinematic';
  };
}
