import type { ViewStyle } from 'react-native';

import { colors } from './tokens';

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

/** Near-square corners: printed matter, not app chrome. */
export const radii = {
  sm: 2,
  md: 4,
  lg: 6,
  pill: 999,
} as const;

/** Ink outline width for cards, buttons, and art tiles. */
export const borderWidth = 2;

/** Hard offset shadow, like a misregistered second print pass. */
export function hardShadow(offset = 4, color: string = colors.shadow): ViewStyle {
  return { boxShadow: `${offset}px ${offset}px 0px ${color}` };
}

/** Minimum touch target for primary actions (pt / CSS px). */
export const minTouchTarget = 44;

/** Max width of page content on wide web viewports. */
export const maxContentWidth = 1200;

/** Responsive breakpoints in dp. */
export const breakpoints = {
  tablet: 600,
  desktop: 1024,
} as const;
