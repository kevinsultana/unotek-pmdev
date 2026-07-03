import { Dimensions, TextStyle, ViewStyle } from "react-native";

// ── Responsive helpers ─────────────────────────────────────────────────────
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const BASE_WIDTH = 390; // iPhone 14 Pro — design reference
const BASE_HEIGHT = 844;

/** Width-percentage → dp, scaled to screen width */
export const wp = (percent: number): number => Math.round((SCREEN_WIDTH * percent) / 100);

/** Height-percentage → dp, scaled to screen height */
export const hp = (percent: number): number => Math.round((SCREEN_HEIGHT * percent) / 100);

/**
 * Responsive font — moderate scale: small sizes barely budge, large sizes scale
 * more. Keeps text comfortable on both phones and tablets.
 */
export function rf(size: number): number {
  const scale = SCREEN_WIDTH / BASE_WIDTH;
  const clamped = Math.min(Math.max(scale, 0.8), 1.6); // never <80% or >160%
  return Math.round(size * (1 + (clamped - 1) * 0.5));
}

/** Convert a fixed dp value to a width-percentage equivalent (for horizontal rules, icons) */
export const wpx = (px: number): number => wp((px / BASE_WIDTH) * 100);

/** Convert a fixed dp value to a height-percentage equivalent (for vertical rules) */
export const hpx = (px: number): number => hp((px / BASE_HEIGHT) * 100);

// ── Color Palette ──────────────────────────────────────────────────────────
export const colors = {
  primary: "#1E40AF",
  primaryLight: "#DBEAFE",
  secondary: "#7C3AED",
  amber: "#F59E0B",
  success: "#059669",
  error: "#DC2626",
  surface: "#F8FAFC",
  card: "#FFFFFF",
  textPrimary: "#0F172A",
  textSecondary: "#475569",
  textMuted: "#94A3B8",
  border: "#E2E8F0",
  overlay: "rgba(15, 23, 42, 0.5)",

  // Status colors (standardised across badges/chips)
  status: {
    progress: { bg: "#DBEAFE", text: "#1E40AF" },
    done: { bg: "#D1FAE5", text: "#059669" },
    pending: { bg: "#FEF3C7", text: "#F59E0B" },
    cancelled: { bg: "#FEE2E2", text: "#DC2626" },
    hold: { bg: "#EDE9FE", text: "#7C3AED" },
    default: { bg: "#F1F5F9", text: "#475569" },
  },
} as const;

// ── Spacing (responsive — horizontal wp / vertical hp) ─────────────────────
export const spacing = {
  xs: wpx(4),
  sm: wpx(8),
  md: wpx(12),
  lg: wpx(16),
  xl: wpx(20),
  "2xl": wpx(24),
  "3xl": wpx(32),
  "4xl": wpx(40),
  "5xl": wpx(48),
} as const;

/** Vertical spacing — use for marginTop/Bottom, paddingTop/Bottom, gap */
export const vSpacing = {
  xs: hpx(4),
  sm: hpx(8),
  md: hpx(12),
  lg: hpx(16),
  xl: hpx(20),
  "2xl": hpx(24),
  "3xl": hpx(32),
  "4xl": hpx(40),
  "5xl": hpx(48),
} as const;

// ── Common Sizes (responsive heights & widths for components) ──────────────
/** Pre-computed responsive sizes so screens don't need to import hpx/wpx */
export const sizes = {
  headerHeight: hpx(56),
  headerBtn: hpx(40),
  headerBtnWidth: wpx(40),
  inputHeight: hpx(50),
  selectHeight: hpx(48),
  searchHeight: hpx(46),
  buttonMd: hpx(52),
  buttonSm: hpx(40),
  fabSize: hpx(54),
  iconSm: hpx(36),
  iconMd: hpx(44),
  iconLg: hpx(48),
} as const;

// ── Typography ─────────────────────────────────────────────────────────────
export const typography = {
  size: {
    xs: rf(11),
    sm: rf(12),
    base: rf(14),
    md: rf(15),
    lg: rf(17),
    xl: rf(20),
    "2xl": rf(24),
  } as const,
  weight: {
    regular: "400" as TextStyle["fontWeight"],
    medium: "500" as TextStyle["fontWeight"],
    semibold: "600" as TextStyle["fontWeight"],
    bold: "700" as TextStyle["fontWeight"],
    extrabold: "800" as TextStyle["fontWeight"],
  } as const,
  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
  } as const,
} as const;

// ── Border Radius ──────────────────────────────────────────────────────────
export const radius = {
  xs: wpx(6),
  sm: wpx(8),
  md: wpx(12),
  lg: wpx(16),
  xl: wpx(20),
  full: 9999,
} as const;

// ── Shadows ────────────────────────────────────────────────────────────────
export const shadows: Record<string, ViewStyle> = {
  card: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: wpx(6),
    elevation: 2,
  },
  elevated: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: hpx(8) },
    shadowOpacity: 0.08,
    shadowRadius: wpx(24),
    elevation: 8,
  },
} as const;

// ── Text Presets (composable) ──────────────────────────────────────────────
export const textPresets: Record<string, TextStyle> = {
  display: {
    fontSize: typography.size["2xl"],
    fontWeight: typography.weight.extrabold,
    lineHeight: typography.size["2xl"] * typography.lineHeight.tight,
    color: colors.textPrimary,
  },
  screenTitle: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    lineHeight: typography.size.xl * typography.lineHeight.tight,
    color: colors.textPrimary,
  },
  cardTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    lineHeight: typography.size.md * typography.lineHeight.normal,
    color: colors.textPrimary,
  },
  body: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.regular,
    lineHeight: typography.size.base * typography.lineHeight.relaxed,
    color: colors.textSecondary,
  },
  caption: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    lineHeight: typography.size.sm * typography.lineHeight.normal,
    color: colors.textMuted,
  },
  sectionHeader: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    lineHeight: typography.size.sm * typography.lineHeight.normal,
    color: colors.textMuted,
    textTransform: "uppercase" as const,
    letterSpacing: 1,
  },
  label: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
    lineHeight: typography.size.xs * typography.lineHeight.normal,
    color: colors.textMuted,
  },
};

/** Shorthand helper: merge preset with overrides */
export function preset(name: keyof typeof textPresets, overrides?: TextStyle): TextStyle {
  return { ...textPresets[name], ...overrides };
}
