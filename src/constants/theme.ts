import { Platform } from 'react-native';
import {
  moderateScale,
  fontScale,
  spacingScale,
  responsive,
  isTablet,
} from '../utils/responsive';

export const colors = {
  // Backgrounds - deeper, richer darks
  background: '#09090b',
  surface: '#18181b',
  surfaceElevated: '#27272a',
  surfaceHighlight: '#3f3f46',
  surfaceLight: '#3f3f46', // Alias for surfaceHighlight for compatibility

  // Primary (Emerald/Green)
  primary: '#10b981',
  primaryLight: '#34d399',
  primaryDark: '#059669',
  primaryMuted: 'rgba(16, 185, 129, 0.15)',

  // Accent (Cyan/Teal)
  accent: '#06b6d4',
  accentLight: '#22d3ee',
  accentMuted: 'rgba(6, 182, 212, 0.15)',

  // Secondary (for secondary actions)
  secondary: '#52525b',
  secondaryLight: '#71717a',

  // Text - better contrast
  text: '#fafafa',
  textSecondary: '#a1a1aa',
  textMuted: '#71717a',
  textInverse: '#09090b',

  // Borders - subtle
  border: '#27272a',
  borderLight: '#3f3f46',
  borderFocus: '#10b981',

  // Status
  success: '#10b981',
  successMuted: 'rgba(16, 185, 129, 0.15)',
  error: '#ef4444',
  errorMuted: 'rgba(239, 68, 68, 0.15)',
  warning: '#f59e0b',
  warningMuted: 'rgba(245, 158, 11, 0.15)',
  info: '#3b82f6',

  // Chat - gradient-ready
  userBubble: '#10b981',
  userBubbleEnd: '#059669',
  aiBubble: '#27272a',
  aiBubbleBorder: '#3f3f46',

  // Gradients
  gradientStart: '#10b981',
  gradientEnd: '#06b6d4',

  // Overlays
  overlay: 'rgba(0, 0, 0, 0.6)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
};

// Responsive spacing - scales with screen size
export const spacing = {
  xxs: spacingScale(2),
  xs: spacingScale(4),
  sm: spacingScale(8),
  md: spacingScale(12),
  lg: spacingScale(16),
  xl: spacingScale(20),
  xxl: spacingScale(24),
  xxxl: spacingScale(32),
  huge: spacingScale(48),
};

// Raw spacing values (for cases where you need unscaled values)
export const rawSpacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
};

export const borderRadius = {
  xs: moderateScale(4, 0.2),
  sm: moderateScale(8, 0.2),
  md: moderateScale(12, 0.2),
  lg: moderateScale(16, 0.2),
  xl: moderateScale(20, 0.2),
  xxl: moderateScale(24, 0.2),
  pill: 100,
  full: 9999,
};

// Responsive font sizes
export const fontSize = {
  xxs: fontScale(10),
  xs: fontScale(11),
  sm: fontScale(13),
  md: fontScale(15),
  lg: fontScale(17),
  xl: fontScale(20),
  xxl: fontScale(24),
  xxxl: fontScale(28),
  title: fontScale(32),
  hero: fontScale(40),
};

// Raw font sizes (for cases where you need unscaled values)
export const rawFontSize = {
  xxs: 10,
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 28,
  title: 32,
  hero: 40,
};

export const fontWeight = {
  light: '300' as const,
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  black: '800' as const,
};

export const lineHeight = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
};

// Responsive icon sizes
export const iconSize = {
  xs: moderateScale(14, 0.3),
  sm: moderateScale(18, 0.3),
  md: moderateScale(22, 0.3),
  lg: moderateScale(28, 0.3),
  xl: moderateScale(36, 0.3),
  xxl: moderateScale(48, 0.3),
};

// Component sizes - responsive
export const componentSize = {
  buttonHeight: moderateScale(48, 0.3),
  inputHeight: moderateScale(48, 0.3),
  headerHeight: moderateScale(56, 0.3),
  tabBarHeight: moderateScale(60, 0.3),
  avatarSm: moderateScale(32, 0.3),
  avatarMd: moderateScale(40, 0.3),
  avatarLg: moderateScale(56, 0.3),
  touchTarget: moderateScale(44, 0.3), // Minimum touch target size
};

// Tablet-specific adjustments
export const layout = {
  maxContentWidth: isTablet ? 600 : undefined,
  chatBubbleMaxWidth: isTablet ? '60%' : '80%',
  sidebarWidth: isTablet ? 300 : undefined,
  gridColumns: responsive({
    small: 1,
    default: 2,
    tablet: 3,
  }),
};

// Shadows for depth
export const shadows = {
  sm: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
    },
    android: {
      elevation: 2,
    },
  }),
  md: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
    },
    android: {
      elevation: 4,
    },
  }),
  lg: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },
    android: {
      elevation: 8,
    },
  }),
  xl: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.35,
      shadowRadius: 16,
    },
    android: {
      elevation: 16,
    },
  }),
  glow: Platform.select({
    ios: {
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 12,
    },
    android: {
      elevation: 8,
    },
  }),
};

// Animation durations
export const animation = {
  fast: 150,
  normal: 250,
  slow: 400,
};

// Common component styles
export const componentStyles = {
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.md,
  },
  cardElevated: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.lg,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    color: colors.text,
    fontSize: fontSize.md,
    minHeight: componentSize.inputHeight,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    minHeight: componentSize.buttonHeight,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    ...shadows.md,
  },
  buttonText: {
    color: colors.textInverse,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  // Center content on tablets
  contentContainer: isTablet ? {
    maxWidth: 600,
    alignSelf: 'center' as const,
    width: '100%' as const,
  } : {},
};
