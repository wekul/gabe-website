export type ThemeBackgroundStyle =
  | "studio_gradient"
  | "canvas"
  | "gallery_paper"
  | "nocturne_grid";

export type SiteThemeValues = {
  backgroundStyle: ThemeBackgroundStyle;
  gradientStart: string;
  gradientEnd: string;
  gradientDirection: number;
  gradientIntensity: number;
  accent: string;
  surface: string;
  surfaceStrong: string;
  text: string;
  mutedText: string;
  pageEditorBetaEnabled: boolean;
  announcementEnabled: boolean;
  announcementText: string;
};

export type ThemePreset = {
  id: string;
  label: string;
  description: string;
  values: SiteThemeValues;
};

export const DEFAULT_SITE_THEME: SiteThemeValues = {
  backgroundStyle: "studio_gradient",
  gradientStart: "#0F172A",
  gradientEnd: "#020617",
  gradientDirection: 155,
  gradientIntensity: 60,
  accent: "#38BDF8",
  surface: "#111827",
  surfaceStrong: "#030712",
  text: "#F8FAFC",
  mutedText: "#CBD5E1",
  pageEditorBetaEnabled: false,
  announcementEnabled: false,
  announcementText: "",
};

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "studio_gradient",
    label: "Studio Gradient",
    description: "Dark studio atmosphere with a restrained glow and gallery-style contrast.",
    values: DEFAULT_SITE_THEME,
  },
  {
    id: "canvas_atelier",
    label: "Canvas Atelier",
    description: "Warm primed-canvas background with subtle weave and softer studio contrast.",
    values: {
      backgroundStyle: "canvas",
      gradientStart: "#DDD2BE",
      gradientEnd: "#B7A78F",
      gradientDirection: 135,
      gradientIntensity: 38,
      accent: "#8A5A3C",
      surface: "#E7DDCC",
      surfaceStrong: "#CFC0AA",
      text: "#211A15",
      mutedText: "#54483C",
      pageEditorBetaEnabled: false,
      announcementEnabled: false,
      announcementText: "",
    },
  },
  {
    id: "gallery_paper",
    label: "Gallery Paper",
    description: "Quiet paper-like surface with soft shadows for a lighter exhibition feel.",
    values: {
      backgroundStyle: "gallery_paper",
      gradientStart: "#F4F0E8",
      gradientEnd: "#DDD5C7",
      gradientDirection: 180,
      gradientIntensity: 22,
      accent: "#5A6B7D",
      surface: "#FBF8F2",
      surfaceStrong: "#ECE4D7",
      text: "#1F1A17",
      mutedText: "#6C6359",
      pageEditorBetaEnabled: false,
      announcementEnabled: false,
      announcementText: "",
    },
  },
  {
    id: "nocturne_grid",
    label: "Nocturne Grid",
    description: "Dark exhibition floor with a faint editorial grid and brighter electric accents.",
    values: {
      backgroundStyle: "nocturne_grid",
      gradientStart: "#090C13",
      gradientEnd: "#02040A",
      gradientDirection: 145,
      gradientIntensity: 72,
      accent: "#7DD3FC",
      surface: "#121826",
      surfaceStrong: "#050811",
      text: "#F8FAFC",
      mutedText: "#A8B3C7",
      pageEditorBetaEnabled: false,
      announcementEnabled: false,
      announcementText: "",
    },
  },
];

function expandShortHex(value: string) {
  return value
    .split("")
    .map((character) => `${character}${character}`)
    .join("");
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function toPercent(value: number) {
  return `${Math.round(value)}%`;
}

function getGradientAnchors(direction: number) {
  const radians = ((direction - 90) * Math.PI) / 180;
  const primaryRadius = 34;
  const secondaryRadius = 28;

  const primaryX = 50 + Math.cos(radians) * primaryRadius;
  const primaryY = 50 + Math.sin(radians) * primaryRadius;
  const secondaryX = 50 - Math.cos(radians) * secondaryRadius;
  const secondaryY = 50 - Math.sin(radians) * secondaryRadius;

  return {
    primaryX: toPercent(primaryX),
    primaryY: toPercent(primaryY),
    secondaryX: toPercent(secondaryX),
    secondaryY: toPercent(secondaryY),
  };
}

export function normalizeHexColor(value: string, fallback?: string) {
  const candidate = value.trim();

  if (!candidate) {
    if (fallback) {
      return fallback;
    }

    throw new Error("Color value is required.");
  }

  const withHash = candidate.startsWith("#") ? candidate : `#${candidate}`;
  const hex = withHash.slice(1);

  if (/^[0-9a-fA-F]{3}$/.test(hex)) {
    return `#${expandShortHex(hex).toUpperCase()}`;
  }

  if (/^[0-9a-fA-F]{6}$/.test(hex)) {
    return `#${hex.toUpperCase()}`;
  }

  throw new Error("Colors must be valid 3- or 6-digit hex values.");
}

export function normalizeThemeBackgroundStyle(
  value: ThemeBackgroundStyle | string | undefined,
  fallback: ThemeBackgroundStyle = DEFAULT_SITE_THEME.backgroundStyle,
): ThemeBackgroundStyle {
  const candidate = typeof value === "string" ? value.trim().toLowerCase() : "";

  if (
    candidate === "studio_gradient" ||
    candidate === "canvas" ||
    candidate === "gallery_paper" ||
    candidate === "nocturne_grid"
  ) {
    return candidate;
  }

  return fallback;
}

export function normalizeGradientDirection(value: number | string, fallback = 155) {
  const numericValue = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(numericValue)) {
    return fallback;
  }

  const normalized = ((Math.trunc(numericValue) % 360) + 360) % 360;
  return normalized;
}

export function normalizeGradientIntensity(value: number | string, fallback = 60) {
  const numericValue = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(numericValue)) {
    return fallback;
  }

  return clamp(Math.trunc(numericValue), 0, 100);
}

function hexToRgb(hex: string) {
  const normalized = normalizeHexColor(hex).slice(1);
  const value = Number.parseInt(normalized, 16);

  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function rgba(hex: string, alpha: number) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function buildBodyBackground(theme: SiteThemeValues) {
  const linear = `linear-gradient(${theme.gradientDirection}deg, ${theme.gradientStart}, ${theme.gradientEnd})`;

  if (theme.backgroundStyle === "canvas") {
    return [
      `radial-gradient(circle at 18% 16%, ${rgba(theme.accent, 0.08)}, transparent 24%)`,
      `radial-gradient(circle at 78% 12%, ${rgba(theme.text, 0.08)}, transparent 18%)`,
      `repeating-linear-gradient(0deg, ${rgba(theme.text, 0.025)} 0 2px, transparent 2px 10px)`,
      `repeating-linear-gradient(90deg, ${rgba(theme.surfaceStrong, 0.04)} 0 1px, transparent 1px 12px)`,
      linear,
    ].join(",");
  }

  if (theme.backgroundStyle === "gallery_paper") {
    return [
      `radial-gradient(circle at 15% 18%, ${rgba(theme.accent, 0.04)}, transparent 20%)`,
      `radial-gradient(circle at 84% 20%, ${rgba(theme.text, 0.05)}, transparent 16%)`,
      `repeating-linear-gradient(0deg, ${rgba(theme.surfaceStrong, 0.02)} 0 1px, transparent 1px 8px)`,
      linear,
    ].join(",");
  }

  if (theme.backgroundStyle === "nocturne_grid") {
    return [
      `radial-gradient(circle at 14% 18%, ${rgba(theme.accent, 0.13)}, transparent 26%)`,
      `radial-gradient(circle at 72% 74%, ${rgba(theme.text, 0.04)}, transparent 20%)`,
      `repeating-linear-gradient(0deg, ${rgba(theme.text, 0.035)} 0 1px, transparent 1px 42px)`,
      `repeating-linear-gradient(90deg, ${rgba(theme.text, 0.03)} 0 1px, transparent 1px 42px)`,
      linear,
    ].join(",");
  }

  return [
    `radial-gradient(circle at 14% 18%, ${rgba(theme.accent, 0.16)}, transparent 26%)`,
    `radial-gradient(circle at 82% 22%, rgba(255, 255, 255, 0.035), transparent 18%)`,
    `radial-gradient(circle at 68% 78%, ${rgba(theme.text, 0.05)}, transparent 22%)`,
    linear,
  ].join(",");
}

export function buildThemeCssVariables(theme: SiteThemeValues) {
  const normalizedTheme = {
    backgroundStyle: normalizeThemeBackgroundStyle(
      theme.backgroundStyle,
      DEFAULT_SITE_THEME.backgroundStyle,
    ),
    gradientStart: normalizeHexColor(theme.gradientStart, DEFAULT_SITE_THEME.gradientStart),
    gradientEnd: normalizeHexColor(theme.gradientEnd, DEFAULT_SITE_THEME.gradientEnd),
    gradientDirection: normalizeGradientDirection(
      theme.gradientDirection,
      DEFAULT_SITE_THEME.gradientDirection,
    ),
    gradientIntensity: normalizeGradientIntensity(
      theme.gradientIntensity,
      DEFAULT_SITE_THEME.gradientIntensity,
    ),
    accent: normalizeHexColor(theme.accent, DEFAULT_SITE_THEME.accent),
    surface: normalizeHexColor(theme.surface, DEFAULT_SITE_THEME.surface),
    surfaceStrong: normalizeHexColor(
      theme.surfaceStrong,
      DEFAULT_SITE_THEME.surfaceStrong,
    ),
    text: normalizeHexColor(theme.text, DEFAULT_SITE_THEME.text),
    mutedText: normalizeHexColor(theme.mutedText, DEFAULT_SITE_THEME.mutedText),
    pageEditorBetaEnabled: Boolean(theme.pageEditorBetaEnabled),
    announcementEnabled: Boolean(theme.announcementEnabled),
    announcementText: theme.announcementText?.trim() ?? "",
  };

  const intensityFactor = normalizedTheme.gradientIntensity / 100;
  const accentSoftAlpha = 0.06 + intensityFactor * 0.18;
  const accentStrongAlpha = 0.12 + intensityFactor * 0.24;
  const ambientGlowAlpha = 0.02 + intensityFactor * 0.08;
  const anchors = getGradientAnchors(normalizedTheme.gradientDirection);

  return {
    "--theme-background-style": normalizedTheme.backgroundStyle,
    "--theme-gradient-start": normalizedTheme.gradientStart,
    "--theme-gradient-end": normalizedTheme.gradientEnd,
    "--theme-gradient-direction": `${normalizedTheme.gradientDirection}deg`,
    "--theme-gradient-intensity": String(normalizedTheme.gradientIntensity),
    "--theme-glow-anchor-x": anchors.primaryX,
    "--theme-glow-anchor-y": anchors.primaryY,
    "--theme-ambient-anchor-x": anchors.secondaryX,
    "--theme-ambient-anchor-y": anchors.secondaryY,
    "--theme-accent": normalizedTheme.accent,
    "--theme-surface": normalizedTheme.surface,
    "--theme-surface-strong": normalizedTheme.surfaceStrong,
    "--theme-text": normalizedTheme.text,
    "--theme-text-muted": normalizedTheme.mutedText,
    "--theme-accent-soft": rgba(normalizedTheme.accent, accentSoftAlpha),
    "--theme-accent-strong": rgba(normalizedTheme.accent, accentStrongAlpha),
    "--theme-ambient-glow": rgba(normalizedTheme.text, ambientGlowAlpha),
    "--theme-surface-soft": rgba(normalizedTheme.surface, 0.78),
    "--theme-surface-strong-soft": rgba(normalizedTheme.surfaceStrong, 0.92),
    "--theme-border": rgba(normalizedTheme.text, 0.12),
    "--theme-border-strong": rgba(normalizedTheme.text, 0.2),
    "--theme-text-soft": rgba(normalizedTheme.text, 0.82),
    "--theme-body-background": buildBodyBackground(normalizedTheme),
    "--background": normalizedTheme.gradientEnd,
    "--foreground": normalizedTheme.text,
  } as Record<string, string>;
}

