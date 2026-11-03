/**
 * Loose Thread Supply color tokens — riso zine palette on off-white paper.
 * Contrast wins over token fidelity: `brand` (riso pink), `accent` (riso blue) and
 * `highlight` (riso yellow) are fill colors only. Put `text` (ink) on top of them,
 * and use `brandInk` (≈7:1 on paper) for blue text/links on light surfaces.
 */
export const colors = {
  brand: '#FF48B0',
  brandPressed: '#F0309E',
  brandInk: '#0057A0',
  brandSoft: '#FFD9EE',
  accent: '#0078BF',
  highlight: '#FFE14D',
  canvas: '#F6F1E7',
  surface: '#FFFDF8',
  text: '#141414',
  muted: '#5C5650',
  border: '#141414',
  borderStrong: '#141414',
  hairline: '#D9D1C3',
  shadow: '#141414',
  onInk: '#F6F1E7',
  success: '#1F7A4D',
  error: '#B42318',
  focus: '#0057A0',
} as const;

export type ColorToken = keyof typeof colors;
