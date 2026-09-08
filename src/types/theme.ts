export type UIStyleId =
  | 'modern-minimal'
  | 'glassmorphism'
  | 'dark-cinema'
  | 'neon-gaming'
  | 'premium-streaming'
  | 'clean-saas'
  | 'soft-rounded'
  | 'sharp-professional'
  | 'material-inspired'
  | 'modern-tv';

export type BorderRadiusScale = 'sharp' | 'small' | 'medium' | 'large' | 'pill';
export type ShadowStrength = 'none' | 'subtle' | 'medium' | 'strong' | 'glow';
export type SpacingDensity = 'compact' | 'comfortable' | 'spacious';
export type FontScale = 'compact' | 'standard' | 'large';
export type AnimationLevel = 'none' | 'subtle' | 'normal' | 'enhanced';

export interface ThemeTokens {
  // Backgrounds
  background: string;
  surface: string;
  surfaceSecondary: string;
  surfaceTertiary: string;

  // Text
  text: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;

  // Primary
  primary: string;
  primaryHover: string;
  primaryActive: string;
  primaryForeground: string;

  // Secondary
  secondary: string;
  secondaryHover: string;
  secondaryForeground: string;

  // Accent
  accent: string;
  accentHover: string;

  // Borders & Dividers
  border: string;
  borderStrong: string;
  divider: string;

  // Inputs
  inputBg: string;
  inputBorder: string;
  inputFocus: string;

  // Buttons
  buttonBg: string;
  buttonText: string;
  buttonHover: string;

  // Links
  link: string;
  linkHover: string;

  // Status & Feedback
  success: string;
  successBg: string;
  warning: string;
  warningBg: string;
  error: string;
  errorBg: string;
  info: string;
  infoBg: string;

  // Overlays
  overlay: string;
  backdrop: string;

  // Video Player Tokens
  playerBg: string;
  playerControls: string;
  playerProgress: string;
  playerProgressBg: string;

  // Semantic Component Tokens
  cardBg?: string;
  cardBorder?: string;
}

export interface UIStylePreset {
  id: UIStyleId;
  name: string;
  description: string;
  tagline: string;
  cardRadius: string;
  buttonRadius: string;
  inputRadius: string;
  cardBorder: string;
  cardShadow: string;
  glassEffect: boolean;
  backdropBlur: string;
  badgeStyle: string;
  playerStyle: 'minimal' | 'glass' | 'neon' | 'floating' | 'standard';
  fontFamily?: string;
}

export interface CustomUIOptions {
  borderRadiusScale?: BorderRadiusScale;
  shadowStrength?: ShadowStrength;
  spacingDensity?: SpacingDensity;
  fontScale?: FontScale;
  animationLevel?: AnimationLevel;
  glassEffect?: boolean;
}

export interface ExtendedThemePreset {
  id: string;
  name: string;
  description: string;
  category: 'Cinematic' | 'Cyber' | 'Vibrant' | 'Minimal' | 'Opulent';
  tokens: ThemeTokens;
}
