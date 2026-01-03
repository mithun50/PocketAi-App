import { Dimensions, PixelRatio, Platform } from 'react-native';

// Base dimensions (iPhone 14 Pro as reference)
const BASE_WIDTH = 393;
const BASE_HEIGHT = 852;

// Get dimensions safely with fallbacks
function getScreenDimensions() {
  try {
    const { width, height } = Dimensions.get('window');
    return {
      width: width > 0 ? width : BASE_WIDTH,
      height: height > 0 ? height : BASE_HEIGHT,
    };
  } catch {
    return { width: BASE_WIDTH, height: BASE_HEIGHT };
  }
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = getScreenDimensions();

// Device type detection
export const isTablet = SCREEN_WIDTH >= 768;
export const isSmallDevice = SCREEN_WIDTH < 375;
export const isLargeDevice = SCREEN_WIDTH >= 414;

// Screen dimensions
export const screenWidth = SCREEN_WIDTH;
export const screenHeight = SCREEN_HEIGHT;

/**
 * Scale a value based on screen width
 * Useful for horizontal spacing, widths, and font sizes
 */
export function wp(percentage: number): number {
  return PixelRatio.roundToNearestPixel((SCREEN_WIDTH * percentage) / 100);
}

/**
 * Scale a value based on screen height
 * Useful for vertical spacing and heights
 */
export function hp(percentage: number): number {
  return PixelRatio.roundToNearestPixel((SCREEN_HEIGHT * percentage) / 100);
}

/**
 * Scale a size proportionally based on screen width
 * Use for elements that should scale with screen size
 */
export function scale(size: number): number {
  const scaleFactor = SCREEN_WIDTH / BASE_WIDTH;
  const newSize = size * scaleFactor;

  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  }
  return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 2;
}

/**
 * Scale vertically based on screen height
 */
export function verticalScale(size: number): number {
  const scaleFactor = SCREEN_HEIGHT / BASE_HEIGHT;
  return PixelRatio.roundToNearestPixel(size * scaleFactor);
}

/**
 * Moderate scaling - less aggressive than scale()
 * Good for fonts and icons that shouldn't grow too large on tablets
 * @param size - base size
 * @param factor - how much to scale (0 = no scale, 1 = full scale)
 */
export function moderateScale(size: number, factor: number = 0.5): number {
  const scaleFactor = SCREEN_WIDTH / BASE_WIDTH;
  return PixelRatio.roundToNearestPixel(size + (size * (scaleFactor - 1) * factor));
}

/**
 * Font scaling with limits to prevent too large/small fonts
 */
export function fontScale(size: number, minSize?: number, maxSize?: number): number {
  const scaled = moderateScale(size, 0.3);
  const min = minSize ?? size * 0.8;
  const max = maxSize ?? size * 1.4;
  return Math.max(min, Math.min(max, scaled));
}

/**
 * Icon scaling
 */
export function iconScale(size: number): number {
  return moderateScale(size, 0.4);
}

/**
 * Spacing scaling - less aggressive for consistent layouts
 */
export function spacingScale(size: number): number {
  return moderateScale(size, 0.25);
}

/**
 * Get responsive value based on device type
 */
export function responsive<T>(options: {
  small?: T;
  default: T;
  large?: T;
  tablet?: T;
}): T {
  if (isTablet && options.tablet !== undefined) {
    return options.tablet;
  }
  if (isLargeDevice && options.large !== undefined) {
    return options.large;
  }
  if (isSmallDevice && options.small !== undefined) {
    return options.small;
  }
  return options.default;
}

/**
 * Get number of columns for grid layouts based on screen width
 */
export function getGridColumns(minItemWidth: number = 150): number {
  const columns = Math.floor(SCREEN_WIDTH / minItemWidth);
  return Math.max(1, Math.min(columns, 4)); // 1-4 columns
}

/**
 * Calculate max width for content (useful for tablets)
 */
export function getContentMaxWidth(): number {
  if (isTablet) {
    return Math.min(SCREEN_WIDTH * 0.8, 600);
  }
  return SCREEN_WIDTH;
}

/**
 * Calculate chat bubble max width
 */
export function getChatBubbleMaxWidth(): number {
  if (isTablet) {
    return Math.min(SCREEN_WIDTH * 0.6, 500);
  }
  return SCREEN_WIDTH * 0.8;
}
