import { Dimensions, Platform, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base dimensions (iPhone 11 / standard device)
const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

/**
 * Width responsive scaler
 * Scales value proportionally to screen width
 */
export const wp = (widthPercent: number): number => {
  const elemWidth = typeof widthPercent === 'number' ? widthPercent : parseFloat(widthPercent);
  return PixelRatio.roundToNearestPixel((SCREEN_WIDTH * elemWidth) / 100);
};

/**
 * Height responsive scaler
 * Scales value proportionally to screen height
 */
export const hp = (heightPercent: number): number => {
  const elemHeight = typeof heightPercent === 'number' ? heightPercent : parseFloat(heightPercent);
  return PixelRatio.roundToNearestPixel((SCREEN_HEIGHT * elemHeight) / 100);
};

/**
 * Font size scaler
 * Scales font size based on screen width
 */
export const fs = (size: number): number => {
  const scale = SCREEN_WIDTH / BASE_WIDTH;
  const newSize = size * scale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

/**
 * Moderately scale - good for spacing
 * Uses average of width and height scaling
 */
export const ms = (size: number, factor: number = 0.5): number => {
  const widthScale = SCREEN_WIDTH / BASE_WIDTH;
  const heightScale = SCREEN_HEIGHT / BASE_HEIGHT;
  const avgScale = (widthScale + heightScale) / 2;
  return size + (avgScale - 1) * size * factor;
};

/**
 * Get responsive dimensions
 */
export const getResponsiveDimensions = () => ({
  screenWidth: SCREEN_WIDTH,
  screenHeight: SCREEN_HEIGHT,
  isSmallDevice: SCREEN_WIDTH < 375,
  isMediumDevice: SCREEN_WIDTH >= 375 && SCREEN_WIDTH < 414,
  isLargeDevice: SCREEN_WIDTH >= 414,
  isIOS: Platform.OS === 'ios',
  isAndroid: Platform.OS === 'android',
  isWeb: Platform.OS === 'web'
});

/**
 * Responsive spacing presets
 */
export const spacing = {
  xs: ms(4),
  sm: ms(8),
  md: ms(12),
  lg: ms(16),
  xl: ms(20),
  xxl: ms(24),
  xxxl: ms(32),
};

/**
 * Responsive font sizes
 */
export const fontSizes = {
  xs: fs(10),
  sm: fs(12),
  md: fs(14),
  base: fs(16),
  lg: fs(18),
  xl: fs(20),
  xxl: fs(24),
  xxxl: fs(32),
  huge: fs(40),
};

/**
 * Responsive border radius
 */
export const borderRadius = {
  sm: ms(4),
  md: ms(8),
  lg: ms(12),
  xl: ms(16),
  xxl: ms(24),
  full: 9999,
};

/**
 * Icon sizes
 */
export const iconSizes = {
  xs: ms(12),
  sm: ms(16),
  md: ms(20),
  lg: ms(24),
  xl: ms(32),
  xxl: ms(40),
};

export default {
  wp,
  hp,
  fs,
  ms,
  getResponsiveDimensions,
  spacing,
  fontSizes,
  borderRadius,
  iconSizes,
  SCREEN_WIDTH,
  SCREEN_HEIGHT
};
