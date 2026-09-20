/**
 * constants/theme.ts
 *
 * Design tokens for the BAYA PWA.
 * All colours, spacing, and typography values live here so they can be
 * adjusted in one place as the design evolves.
 */

// ---------------------------------------------------------------------------
// Colour palette
// ---------------------------------------------------------------------------

export const Colors = {
  /** Deep indigo — primary brand colour */
  primary: '#1C1630',
  /** Light cream — default page background */
  background: '#FAF5E5',
  /** Off-white card surface */
  surface: '#FFFFFF',
  /** Muted violet border */
  border: '#DDD4C0',
  /** Primary text on light background */
  textPrimary: '#1C1630',
  /** Secondary / subdued text */
  textSecondary: '#6B6280',
  /** Muted label */
  textMuted: '#9E95B0',
  /** Accent colour for status indicators */
  accent: '#4A3F7A',
  /** Success indicator */
  success: '#2E7D32',
  /** Warning indicator */
  warning: '#F57C00',
} as const;

// ---------------------------------------------------------------------------
// Spacing scale (multiples of 4px)
// ---------------------------------------------------------------------------

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

// ---------------------------------------------------------------------------
// Border radius
// ---------------------------------------------------------------------------

export const Radius = {
  sm: 6,
  md: 12,
  lg: 20,
  full: 9999,
} as const;

// ---------------------------------------------------------------------------
// Typography sizes
// ---------------------------------------------------------------------------

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 18,
  xl: 24,
  xxl: 32,
  hero: 48,
} as const;
