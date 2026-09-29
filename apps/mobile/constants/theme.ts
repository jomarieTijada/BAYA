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
  inputBorder: '#DED0B9',
  placeholder: '#AA9D8E',
  optionalBackground: '#F3ECE1',
  error: '#B42318',

  heroBackground: '#EAF6E6',
  heroLandscape: '#DDEFD8',
  progressTrack: '#FFE2A3',
  progressInactive: '#D7E0EA',

  goal: '#20C765',
  goalHover: '#17B458',
  goalPressed: '#109B4A',
  goalSurface: '#E3F8E9',
  goalText: '#3B704E',

  adventure: '#5BA6F8',
  adventureSurface: '#DFEEFF',
  adventureText: '#4C6D94',
  adventureControl: '#EFF6FE',

  achievement: '#FFA20A',
  achievementHover: '#EB9100',
  achievementPressed: '#D98300',
  achievementSurface: '#FFF5DA',
  achievementText: '#8B6A2E',

  level: '#6B3FB4',
  levelSurface: '#E8DBFF',
  levelBorder: '#C9ADFF',
  avatarSurface: '#FFF1B8',
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

export const IconSize = {
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
} as const;

export const Breakpoints = {
  tablet: 768,
  desktop: 1280,
} as const;

export const ResponsiveLayout = {
  pagePadding: {
    phone: 16,
    landscapePhone: 12,
    tablet: 24,
    desktop: 32,
  },
  controlHeight: {
    landscapePhone: 44,
    compact: 48,
    mobile: 52,
    desktop: 64,
  },
  heroToCardsGap: {
    compact: 19, // 9px compact badge overhang + 10px intentional breathing room
    regular: Spacing.lg, // 24px (16px standard badge overhang + 8px breathing room)
  },
} as const;

/** Shared size tokens for the learner header across Home and learning screens. */
export const LearnerHeaderMetrics = {
  regular: {
    height: 88,
    minHeight: 76,
    maxHeight: 96,
    paddingHorizontal: Spacing.xl,
    paddingVertical: 12,
    avatar: 64,
    avatarIcon: 34,
    backButton: 64,
    settingsButton: 52,
    settingsIcon: 28,
    title: FontSize.xl,
    subtitle: FontSize.md,
    learnerTitle: FontSize.md,
  },
  compact: {
    height: 68,
    minHeight: 58,
    maxHeight: 76,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    avatar: 48,
    avatarIcon: 24,
    backButton: 48,
    settingsButton: 40,
    settingsIcon: 24,
    title: FontSize.lg,
    subtitle: FontSize.sm,
    learnerTitle: FontSize.sm,
  },
  landscapeCompact: {
    height: 52,
    minHeight: 46,
    maxHeight: 56,
    paddingHorizontal: 10,
    paddingVertical: 4,
    avatar: 32,
    avatarIcon: 18,
    backButton: 32,
    settingsButton: 30,
    settingsIcon: 16,
    title: 15,
    subtitle: 11,
    learnerTitle: 11,
  },
  phonePortrait: {
    minHeight: 110,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
  },
} as const;

/** Common shell tokens for learner headers, content gutters, buttons, and type. */
export const LayoutTokens = {
  headerHeight: {
    regular: LearnerHeaderMetrics.regular.height,
    compact: LearnerHeaderMetrics.compact.height,
    landscapeCompact: LearnerHeaderMetrics.landscapeCompact.height,
  },
  horizontalPadding: {
    regular: LearnerHeaderMetrics.regular.paddingHorizontal,
    compact: LearnerHeaderMetrics.compact.paddingHorizontal,
    landscapeCompact: LearnerHeaderMetrics.landscapeCompact.paddingHorizontal,
  },
  spacing: Spacing,
  buttonSizes: {
    back: {
      regular: LearnerHeaderMetrics.regular.backButton,
      compact: LearnerHeaderMetrics.compact.backButton,
      landscapeCompact: LearnerHeaderMetrics.landscapeCompact.backButton,
    },
    settings: {
      regular: LearnerHeaderMetrics.regular.settingsButton,
      compact: LearnerHeaderMetrics.compact.settingsButton,
      landscapeCompact: LearnerHeaderMetrics.landscapeCompact.settingsButton,
    },
  },
  typographyScale: {
    title: {
      regular: LearnerHeaderMetrics.regular.title,
      compact: LearnerHeaderMetrics.compact.title,
      landscapeCompact: LearnerHeaderMetrics.landscapeCompact.title,
    },
    subtitle: {
      regular: LearnerHeaderMetrics.regular.subtitle,
      compact: LearnerHeaderMetrics.compact.subtitle,
      landscapeCompact: LearnerHeaderMetrics.landscapeCompact.subtitle,
    },
  },
  headerMetrics: LearnerHeaderMetrics,
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

export const Shadows = {
  card: Platform.select({
    web: {
      boxShadow: '0 18px 44px rgba(85, 66, 42, 0.12)',
    },
    default: {
      elevation: 7,
      shadowColor: '#55422A',
      shadowOffset: { height: 12, width: 0 },
      shadowOpacity: 0.12,
      shadowRadius: 22,
    },
  }),
} as const;
