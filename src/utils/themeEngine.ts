import { ThemeTokens, UIStyleId, CustomUIOptions } from '../types/theme';

/**
 * Converts a 6-character hex code to an RGB object
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  const num = parseInt(clean, 16);
  if (isNaN(num)) return { r: 15, g: 17, b: 26 };
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

/**
 * Converts hex to rgba string
 */
export function hexToRgba(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, alpha))})`;
}

/**
 * Calculates relative luminance according to WCAG 2.1 specs
 */
export function getRelativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const transform = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * transform(r) + 0.7152 * transform(g) + 0.0722 * transform(b);
}

/**
 * Calculates WCAG contrast ratio between two hex colors (e.g. 4.5:1)
 */
export function calculateContrastRatio(foregroundHex: string, backgroundHex: string): number {
  const l1 = getRelativeLuminance(foregroundHex);
  const l2 = getRelativeLuminance(backgroundHex);
  const brighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  const ratio = (brighter + 0.05) / (darker + 0.05);
  return Number(ratio.toFixed(2));
}

/**
 * Evaluates WCAG compliance for text on background
 */
export function evaluateContrast(
  textHex: string,
  bgHex: string
): {
  ratio: number;
  passesAA: boolean;
  passesAAA: boolean;
  warning?: string;
} {
  const ratio = calculateContrastRatio(textHex, bgHex);
  const passesAA = ratio >= 4.5;
  const passesAAA = ratio >= 7.0;

  let warning: string | undefined;
  if (ratio < 3.0) {
    warning = `Critical: Contrast ratio is ${ratio}:1, below the minimum readable standard (4.5:1).`;
  } else if (!passesAA) {
    warning = `Low Contrast: Ratio is ${ratio}:1 (Recommended minimum: 4.5:1 for standard text).`;
  }

  return { ratio, passesAA, passesAAA, warning };
}

/**
 * Lightens or darkens a hex color by a percentage (-100 to 100)
 */
export function adjustBrightness(hex: string, percent: number): string {
  const { r, g, b } = hexToRgb(hex);
  const factor = percent / 100;
  const adjust = (c: number) => {
    const res = factor > 0 ? c + (255 - c) * factor : c + c * factor;
    return Math.round(Math.max(0, Math.min(255, res)));
  };
  const nr = adjust(r).toString(16).padStart(2, '0');
  const ng = adjust(g).toString(16).padStart(2, '0');
  const nb = adjust(b).toString(16).padStart(2, '0');
  return `#${nr}${ng}${nb}`;
}

/**
 * Derives a full cohesive set of ThemeTokens from base primary colors
 */
export function deriveCompleteTokens(partial: Partial<ThemeTokens>): ThemeTokens {
  const primary = partial.primary || '#e11d48';
  const secondary = partial.secondary || '#9333ea';
  const accent = partial.accent || '#f59e0b';
  const background = partial.background || '#07080e';
  const surface = partial.surface || '#0f111a';
  const text = partial.text || '#f8fafc';
  const textMuted = partial.textMuted || '#94a3b8';
  const border = partial.border || '#1e293b';

  return {
    background,
    surface,
    surfaceSecondary: partial.surfaceSecondary || adjustBrightness(surface, 6),
    surfaceTertiary: partial.surfaceTertiary || adjustBrightness(surface, 12),

    text,
    textSecondary: partial.textSecondary || adjustBrightness(text, -15),
    textMuted,
    textInverse: partial.textInverse || (getRelativeLuminance(background) < 0.2 ? '#ffffff' : '#000000'),

    primary,
    primaryHover: partial.primaryHover || adjustBrightness(primary, -10),
    primaryActive: partial.primaryActive || adjustBrightness(primary, -18),
    primaryForeground: partial.primaryForeground || (getRelativeLuminance(primary) > 0.5 ? '#090a0f' : '#ffffff'),

    secondary,
    secondaryHover: partial.secondaryHover || adjustBrightness(secondary, -10),
    secondaryForeground: partial.secondaryForeground || (getRelativeLuminance(secondary) > 0.5 ? '#090a0f' : '#ffffff'),

    accent,
    accentHover: partial.accentHover || adjustBrightness(accent, -10),

    border,
    borderStrong: partial.borderStrong || adjustBrightness(border, 15),
    divider: partial.divider || hexToRgba(border, 0.7),

    inputBg: partial.inputBg || adjustBrightness(surface, 4),
    inputBorder: partial.inputBorder || border,
    inputFocus: partial.inputFocus || primary,

    buttonBg: partial.buttonBg || primary,
    buttonText: partial.buttonText || (getRelativeLuminance(primary) > 0.5 ? '#090a0f' : '#ffffff'),
    buttonHover: partial.buttonHover || adjustBrightness(primary, -10),

    link: partial.link || primary,
    linkHover: partial.linkHover || adjustBrightness(primary, 15),

    success: partial.success || '#10b981',
    successBg: partial.successBg || 'rgba(16, 185, 129, 0.12)',
    warning: partial.warning || '#f59e0b',
    warningBg: partial.warningBg || 'rgba(245, 158, 11, 0.12)',
    error: partial.error || '#ef4444',
    errorBg: partial.errorBg || 'rgba(239, 68, 68, 0.12)',
    info: partial.info || '#3b82f6',
    infoBg: partial.infoBg || 'rgba(59, 130, 246, 0.12)',

    overlay: partial.overlay || 'rgba(0, 0, 0, 0.75)',
    backdrop: partial.backdrop || 'rgba(3, 4, 7, 0.85)',

    playerBg: partial.playerBg || '#05060a',
    playerControls: partial.playerControls || 'rgba(10, 12, 20, 0.92)',
    playerProgress: partial.playerProgress || primary,
    playerProgressBg: partial.playerProgressBg || 'rgba(255, 255, 255, 0.2)',

    cardBg: partial.cardBg || surface,
    cardBorder: partial.cardBorder || border,
  };
}

/**
 * Applies the entire design token system and UI style to the document root element
 */
export function applyThemeToDOM(
  tokens: ThemeTokens,
  themeId: string,
  uiStyle: UIStyleId = 'modern-minimal',
  customOptions?: CustomUIOptions
) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;

  // 1. Data attributes
  root.setAttribute('data-theme', themeId.toLowerCase().replace(/\s+/g, '-'));
  root.setAttribute('data-ui-style', uiStyle);

  // 2. Core semantic color variables
  root.style.setProperty('--color-background', tokens.background);
  root.style.setProperty('--color-surface', tokens.surface);
  root.style.setProperty('--color-surface-secondary', tokens.surfaceSecondary);
  root.style.setProperty('--color-surface-tertiary', tokens.surfaceTertiary);

  root.style.setProperty('--color-text', tokens.text);
  root.style.setProperty('--color-text-secondary', tokens.textSecondary);
  root.style.setProperty('--color-text-muted', tokens.textMuted);
  root.style.setProperty('--color-text-inverse', tokens.textInverse);

  root.style.setProperty('--color-primary', tokens.primary);
  root.style.setProperty('--color-primary-hover', tokens.primaryHover);
  root.style.setProperty('--color-primary-active', tokens.primaryActive);
  root.style.setProperty('--color-primary-foreground', tokens.primaryForeground);

  root.style.setProperty('--color-secondary', tokens.secondary);
  root.style.setProperty('--color-secondary-hover', tokens.secondaryHover);
  root.style.setProperty('--color-secondary-foreground', tokens.secondaryForeground);

  root.style.setProperty('--color-accent', tokens.accent);
  root.style.setProperty('--color-accent-hover', tokens.accentHover);

  root.style.setProperty('--color-border', tokens.border);
  root.style.setProperty('--color-border-strong', tokens.borderStrong);
  root.style.setProperty('--color-divider', tokens.divider);

  root.style.setProperty('--color-input-background', tokens.inputBg);
  root.style.setProperty('--color-input-border', tokens.inputBorder);
  root.style.setProperty('--color-input-focus', tokens.inputFocus);

  root.style.setProperty('--color-button-background', tokens.buttonBg);
  root.style.setProperty('--color-button-text', tokens.buttonText);
  root.style.setProperty('--color-button-hover', tokens.buttonHover);

  root.style.setProperty('--color-link', tokens.link);
  root.style.setProperty('--color-link-hover', tokens.linkHover);

  root.style.setProperty('--color-success', tokens.success);
  root.style.setProperty('--color-success-background', tokens.successBg);
  root.style.setProperty('--color-warning', tokens.warning);
  root.style.setProperty('--color-warning-background', tokens.warningBg);
  root.style.setProperty('--color-error', tokens.error);
  root.style.setProperty('--color-error-background', tokens.errorBg);
  root.style.setProperty('--color-info', tokens.info);
  root.style.setProperty('--color-info-background', tokens.infoBg);

  root.style.setProperty('--color-overlay', tokens.overlay);
  root.style.setProperty('--color-backdrop', tokens.backdrop);

  root.style.setProperty('--color-player-background', tokens.playerBg);
  root.style.setProperty('--color-player-controls', tokens.playerControls);
  root.style.setProperty('--color-player-progress', tokens.playerProgress);
  root.style.setProperty('--color-player-progress-background', tokens.playerProgressBg);

  // Backward compatibility aliases
  root.style.setProperty('--primary', tokens.primary);
  root.style.setProperty('--secondary', tokens.secondary);
  root.style.setProperty('--accent', tokens.accent);
  root.style.setProperty('--background', tokens.background);
  root.style.setProperty('--surface', tokens.surface);
  root.style.setProperty('--foreground', tokens.text);
  root.style.setProperty('--muted', tokens.textMuted);
  root.style.setProperty('--border', tokens.border);
  root.style.setProperty('--button', tokens.buttonBg);
  root.style.setProperty('--button-hover', tokens.buttonHover);

  // 3. UI Style tokens calculation
  let cardRadius = '16px';
  let buttonRadius = '12px';
  let inputRadius = '12px';
  let cardBorder = tokens.border;
  let cardShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.4)';
  let cardBg = tokens.surface;
  let glassBlur = '0px';

  switch (uiStyle) {
    case 'modern-minimal':
      cardRadius = '12px';
      buttonRadius = '10px';
      inputRadius = '10px';
      cardShadow = '0 4px 14px 0 rgba(0, 0, 0, 0.25)';
      break;
    case 'glassmorphism':
      cardRadius = '18px';
      buttonRadius = '14px';
      inputRadius = '14px';
      cardBg = hexToRgba(tokens.surface, 0.65);
      cardBorder = 'rgba(255, 255, 255, 0.12)';
      cardShadow = '0 16px 36px 0 rgba(0, 0, 0, 0.45), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)';
      glassBlur = '16px';
      break;
    case 'dark-cinema':
      cardRadius = '8px';
      buttonRadius = '6px';
      inputRadius = '6px';
      cardBorder = 'rgba(255, 255, 255, 0.07)';
      cardShadow = '0 12px 30px rgba(0, 0, 0, 0.8)';
      break;
    case 'neon-gaming':
      cardRadius = '10px';
      buttonRadius = '8px';
      inputRadius = '8px';
      cardBorder = hexToRgba(tokens.primary, 0.4);
      cardShadow = `0 0 20px ${hexToRgba(tokens.primary, 0.2)}, 0 8px 24px rgba(0, 0, 0, 0.6)`;
      break;
    case 'premium-streaming':
      cardRadius = '22px';
      buttonRadius = '9999px'; // Pill
      inputRadius = '16px';
      cardShadow = '0 20px 40px -15px rgba(0, 0, 0, 0.6), 0 0 1px 1px rgba(255, 255, 255, 0.08)';
      break;
    case 'clean-saas':
      cardRadius = '8px';
      buttonRadius = '6px';
      inputRadius = '6px';
      cardBorder = tokens.border;
      cardShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.3)';
      break;
    case 'soft-rounded':
      cardRadius = '26px';
      buttonRadius = '18px';
      inputRadius = '18px';
      cardShadow = '0 12px 28px rgba(0, 0, 0, 0.35)';
      break;
    case 'sharp-professional':
      cardRadius = '0px';
      buttonRadius = '0px';
      inputRadius = '0px';
      cardBorder = tokens.border;
      cardShadow = 'none';
      break;
    case 'material-inspired':
      cardRadius = '14px';
      buttonRadius = '10px';
      inputRadius = '8px';
      cardShadow = '0 10px 20px rgba(0, 0, 0, 0.3), 0 6px 6px rgba(0, 0, 0, 0.23)';
      break;
    case 'modern-tv':
      cardRadius = '14px';
      buttonRadius = '12px';
      inputRadius = '12px';
      cardShadow = '0 14px 28px rgba(0, 0, 0, 0.5)';
      break;
  }

  // Handle custom options overrides
  if (customOptions?.borderRadiusScale) {
    switch (customOptions.borderRadiusScale) {
      case 'sharp':
        cardRadius = '0px';
        buttonRadius = '0px';
        inputRadius = '0px';
        break;
      case 'small':
        cardRadius = '6px';
        buttonRadius = '4px';
        inputRadius = '4px';
        break;
      case 'medium':
        cardRadius = '14px';
        buttonRadius = '10px';
        inputRadius = '10px';
        break;
      case 'large':
        cardRadius = '22px';
        buttonRadius = '16px';
        inputRadius = '16px';
        break;
      case 'pill':
        cardRadius = '24px';
        buttonRadius = '9999px';
        inputRadius = '9999px';
        break;
    }
  }

  if (customOptions?.shadowStrength) {
    switch (customOptions.shadowStrength) {
      case 'none':
        cardShadow = 'none';
        break;
      case 'subtle':
        cardShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
        break;
      case 'medium':
        cardShadow = '0 10px 25px rgba(0, 0, 0, 0.4)';
        break;
      case 'strong':
        cardShadow = '0 20px 45px rgba(0, 0, 0, 0.7)';
        break;
      case 'glow':
        cardShadow = `0 0 24px ${hexToRgba(tokens.primary, 0.3)}, 0 10px 30px rgba(0, 0, 0, 0.6)`;
        break;
    }
  }

  if (customOptions?.glassEffect) {
    cardBg = hexToRgba(tokens.surface, 0.65);
    cardBorder = 'rgba(255, 255, 255, 0.14)';
    glassBlur = '16px';
  }

  // 4. Set Component Tokens
  root.style.setProperty('--card-bg', cardBg);
  root.style.setProperty('--card-border', cardBorder);
  root.style.setProperty('--card-shadow', cardShadow);
  root.style.setProperty('--card-radius', cardRadius);
  root.style.setProperty('--card-backdrop-blur', glassBlur);

  root.style.setProperty('--button-primary-bg', tokens.buttonBg);
  root.style.setProperty('--button-primary-text', tokens.buttonText);
  root.style.setProperty('--button-primary-hover', tokens.buttonHover);
  root.style.setProperty('--button-radius', buttonRadius);

  root.style.setProperty('--input-bg', tokens.inputBg);
  root.style.setProperty('--input-border', tokens.inputBorder);
  root.style.setProperty('--input-focus', tokens.inputFocus);
  root.style.setProperty('--input-radius', inputRadius);

  root.style.setProperty('--modal-bg', tokens.surface);
  root.style.setProperty('--modal-overlay', tokens.overlay);
  root.style.setProperty('--modal-radius', cardRadius);

  root.style.setProperty('--nav-bg', tokens.background);
  root.style.setProperty('--nav-text', tokens.text);
  root.style.setProperty('--nav-active', tokens.primary);

  root.style.setProperty('--player-bg', tokens.playerBg);
  root.style.setProperty('--player-control-bg', tokens.playerControls);
  root.style.setProperty('--player-control-text', '#ffffff');
  root.style.setProperty('--player-radius', cardRadius);

  // 5. Typography Scale
  root.style.setProperty('--font-family', "'Plus Jakarta Sans', sans-serif");
  root.style.setProperty('--font-size-xs', '0.75rem');
  root.style.setProperty('--font-size-sm', '0.875rem');
  root.style.setProperty('--font-size-md', '1rem');
  root.style.setProperty('--font-size-lg', '1.125rem');
  root.style.setProperty('--font-size-xl', '1.25rem');
  root.style.setProperty('--font-size-2xl', '1.5rem');
  root.style.setProperty('--font-size-3xl', '1.875rem');
  root.style.setProperty('--font-weight-normal', '400');
  root.style.setProperty('--font-weight-medium', '500');
  root.style.setProperty('--font-weight-semibold', '600');
  root.style.setProperty('--font-weight-bold', '700');
  root.style.setProperty('--line-height', '1.6');

  // 6. Spacing Scale
  let spaceFactor = 1;
  if (customOptions?.spacingDensity === 'compact') spaceFactor = 0.85;
  if (customOptions?.spacingDensity === 'spacious') spaceFactor = 1.2;

  root.style.setProperty('--space-xs', `${0.25 * spaceFactor}rem`);
  root.style.setProperty('--space-sm', `${0.5 * spaceFactor}rem`);
  root.style.setProperty('--space-md', `${1 * spaceFactor}rem`);
  root.style.setProperty('--space-lg', `${1.5 * spaceFactor}rem`);
  root.style.setProperty('--space-xl', `${2 * spaceFactor}rem`);
  root.style.setProperty('--space-2xl', `${3 * spaceFactor}rem`);

  // 7. Radius Tokens
  root.style.setProperty('--radius-sm', buttonRadius);
  root.style.setProperty('--radius-md', inputRadius);
  root.style.setProperty('--radius-lg', cardRadius);
  root.style.setProperty('--radius-xl', `${parseInt(cardRadius) + 6}px`);
  root.style.setProperty('--radius-2xl', `${parseInt(cardRadius) + 12}px`);
  root.style.setProperty('--radius-full', '9999px');

  // 8. Shadows
  root.style.setProperty('--shadow-sm', '0 1px 2px 0 rgba(0, 0, 0, 0.25)');
  root.style.setProperty('--shadow-md', '0 4px 6px -1px rgba(0, 0, 0, 0.35)');
  root.style.setProperty('--shadow-lg', cardShadow);
  root.style.setProperty('--shadow-xl', '0 20px 30px -5px rgba(0, 0, 0, 0.6)');

  // 9. Motion Transitions (Respects prefers-reduced-motion)
  const prefersReducedMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const animationLevel = customOptions?.animationLevel || 'normal';

  if (prefersReducedMotion || animationLevel === 'none') {
    root.style.setProperty('--transition-fast', '0ms');
    root.style.setProperty('--transition-normal', '0ms');
    root.style.setProperty('--transition-slow', '0ms');
  } else if (animationLevel === 'subtle') {
    root.style.setProperty('--transition-fast', '100ms ease');
    root.style.setProperty('--transition-normal', '150ms ease');
    root.style.setProperty('--transition-slow', '250ms ease');
  } else if (animationLevel === 'enhanced') {
    root.style.setProperty('--transition-fast', '180ms cubic-bezier(0.16, 1, 0.3, 1)');
    root.style.setProperty('--transition-normal', '300ms cubic-bezier(0.16, 1, 0.3, 1)');
    root.style.setProperty('--transition-slow', '500ms cubic-bezier(0.16, 1, 0.3, 1)');
  } else {
    root.style.setProperty('--transition-fast', '150ms ease');
    root.style.setProperty('--transition-normal', '250ms ease');
    root.style.setProperty('--transition-slow', '400ms ease');
  }
}
