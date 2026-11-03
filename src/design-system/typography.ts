import type { TextStyle } from 'react-native';

/**
 * Anton (condensed display) for headings; platform sans-serif for everything else.
 * Until Anton loads, headings fall back to the system font, so first render never waits.
 */
export const fonts = {
  display: 'Anton_400Regular',
} as const;

const display = {
  fontFamily: fonts.display,
  fontWeight: '400',
  textTransform: 'uppercase',
} as const satisfies TextStyle;

export const typography = {
  display: { ...display, fontSize: 44, lineHeight: 48, letterSpacing: 0.5 },
  title: { ...display, fontSize: 30, lineHeight: 36, letterSpacing: 0.5 },
  heading: { ...display, fontSize: 20, lineHeight: 26, letterSpacing: 0.6 },
  eyebrow: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
  bodyStrong: { fontSize: 16, lineHeight: 24, fontWeight: '700' },
  label: { fontSize: 14, lineHeight: 20, fontWeight: '700' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '400' },
} as const satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;
