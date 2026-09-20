import { Platform } from 'react-native';

/** Shared design tokens for the BAYA application. */
export const Colors = {
  primary: '#241F1B',
  background: '#FBF6EA',
  surface: '#FFFFFF',
  border: '#E3D8C5',
  textPrimary: '#241F1B',
  textSecondary: '#665D53',
  textMuted: '#8D8174',
  accent: '#F76D22',
  success: '#2E7D32',
  warning: '#F57C00',

  bayaGreen: '#50B946',
  bayaOrange: '#FAA61F',
  bayaBlue: '#338DDD',
  bayaRed: '#F15747',

  rolePrimary: '#F76D22',
  rolePrimaryHover: '#E95E15',
  rolePrimaryPressed: '#D94F0C',
  roleSecondaryHover: '#FFF1E8',
  focus: '#2C6BB1',
  disabled: '#C9C0B5',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

export const Radius = {
  sm: 6,
  md: 12,
  lg: 20,
  xl: 28,
  full: 9999,
} as const;

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 18,
  xl: 24,
  xxl: 32,
  hero: 48,
} as const;

export const Breakpoints = {
  tablet: 768,
  desktop: 1280,
} as const;

export const FontFamily = {
  rounded: Platform.select({
    web: '"Arial Rounded MT Bold", "Trebuchet MS", system-ui, sans-serif',
    ios: 'Arial Rounded MT Bold',
    default: 'sans-serif',
  }),
  body: Platform.select({
    web: '"Trebuchet MS", system-ui, sans-serif',
    ios: 'Trebuchet MS',
    default: 'sans-serif',
  }),
} as const;
