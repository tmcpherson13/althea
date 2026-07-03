/**
 * Althea design tokens — "Travel Beautifully".
 * Warm ivory ground · deep navy ink · dusty-rose accent.
 * Single source of truth for color, type, and spacing.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#22304A',
    textSecondary: '#8A8578',
    background: '#F6F2EB',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#F0EAE0',
    line: '#E9E2D5',
    brand: '#22304A',
    brandSoft: '#EAEDF2',
    accent: '#C98F8F',
    accentSoft: '#F7E7E3',
    rose: '#B96F6F',
    good: '#4E7D62',
    warn: '#A9683F',
    onBrand: '#F6F2EB',
  },
  dark: {
    text: '#EEE9DF',
    textSecondary: '#9BA0AC',
    background: '#141A26',
    backgroundElement: '#1D2534',
    backgroundSelected: '#273043',
    line: '#2C3547',
    brand: '#D8CDBB',
    brandSoft: '#273043',
    accent: '#D9A2A2',
    accentSoft: '#3A2C31',
    rose: '#D9A2A2',
    good: '#84B79A',
    warn: '#D0956A',
    onBrand: '#141A26',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;
export type Theme = (typeof Colors)['light'];

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
});

export const Type = {
  display: 26,
  title: 20,
  body: 14,
  small: 12.5,
  caption: 11,
  eyebrow: 10.5,
} as const;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
  pill: 999,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 560;
