import { Platform } from 'react-native';

export const colors = {
  // Backgrounds - deeper, richer darks
  background: '#09090b',
  surface: '#18181b',
  surfaceElevated: '#27272a',
  surfaceHighlight: '#3f3f46',

  // Primary (Emerald/Green)
  primary: '#10b981',
  primaryLight: '#34d399',
  primaryDark: '#059669',
  primaryMuted: 'rgba(16, 185, 129, 0.15)',

  // Accent (Cyan/Teal)
  accent: '#06b6d4',
  accentLight: '#22d3ee',
  accentMuted: 'rgba(6, 182, 212, 0.15)',

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

export const spacing = {
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
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  pill: 100,
  full: 9999,
};

export const fontSize = {
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
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    ...shadows.md,
  },
  buttonText: {
    color: colors.textInverse,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
};
