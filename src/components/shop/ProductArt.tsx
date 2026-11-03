import { SymbolView } from 'expo-symbols';
import { StyleSheet, Text as RNText, View, type StyleProp, type ViewStyle } from 'react-native';

import { borderWidth, colors, fonts, radii } from '@/design-system';
import type { Product } from '@/types/product';

type ArtSize = 'card' | 'detail' | 'thumb';

type ProductArtProps = {
  product: Product;
  size?: ArtSize;
  style?: StyleProp<ViewStyle>;
};

const scale = {
  card: { glyph: 56, label: 36, dot: 7, gap: 10, grid: 8 },
  detail: { glyph: 120, label: 84, dot: 11, gap: 16, grid: 11 },
  thumb: { glyph: 28, label: 0, dot: 0, gap: 0, grid: 0 },
} as const;

/**
 * Code-drawn placeholder for product photography: a riso-style tile with a
 * halftone corner, the product glyph, and an off-register label.
 * Purely decorative — the product name is always rendered as real text nearby.
 */
export function ProductArt({ product, size = 'card', style }: ProductArtProps) {
  const { art } = product;
  const s = scale[size];
  const ink = colors[art.ink];

  return (
    <View
      aria-hidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.tile,
        size === 'thumb' ? styles.thumb : styles.portrait,
        { backgroundColor: colors[art.background] },
        style,
      ]}>
      {s.grid > 0 && <Halftone color={ink} grid={s.grid} dot={s.dot} gap={s.gap} />}

      <View style={styles.center}>
        <SymbolView name={art.glyph} size={s.glyph} tintColor={colors.text} />
      </View>

      {s.label > 0 && (
        <View style={styles.labelWrap}>
          <RNText
            style={[styles.label, { fontSize: s.label, lineHeight: s.label * 1.15, color: ink }, styles.misprint]}
            maxFontSizeMultiplier={1}>
            {art.label}
          </RNText>
          <RNText
            style={[styles.label, { fontSize: s.label, lineHeight: s.label * 1.15 }]}
            maxFontSizeMultiplier={1}>
            {art.label}
          </RNText>
        </View>
      )}
    </View>
  );
}

/** Triangle of dots in the top-right corner, fading toward the center. */
function Halftone({ color, grid, dot, gap }: { color: string; grid: number; dot: number; gap: number }) {
  const rows = [];
  for (let r = 0; r < grid; r++) {
    const cells = [];
    for (let c = 0; c < grid; c++) {
      // Keep only the corner triangle, and shrink dots toward its edge.
      const depth = grid - 1 - c + r;
      if (depth >= grid) continue;
      const d = Math.max(1.5, dot * (1 - depth / grid));
      cells.push(
        <View
          key={c}
          style={{
            position: 'absolute',
            left: c * gap + (gap - d) / 2,
            width: d,
            height: d,
            borderRadius: d / 2,
            backgroundColor: color,
          }}
        />,
      );
    }
    rows.push(
      <View key={r} style={{ position: 'absolute', top: r * gap, left: 0, right: 0, height: gap }}>
        {cells}
      </View>,
    );
  }

  return (
    <View
      style={[styles.halftone, { width: grid * gap, height: grid * gap }]}
      pointerEvents="none">
      {rows}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    overflow: 'hidden',
    borderRadius: radii.md,
    borderWidth,
    borderColor: colors.border,
  },
  portrait: {
    width: '100%',
    aspectRatio: 4 / 5,
  },
  thumb: {
    width: 72,
    height: 90,
  },
  center: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  halftone: {
    position: 'absolute',
    top: 8,
    right: 8,
    opacity: 0.85,
  },
  labelWrap: {
    position: 'absolute',
    left: 10,
    bottom: 4,
  },
  label: {
    fontFamily: fonts.display,
    textTransform: 'uppercase',
    color: colors.text,
  },
  misprint: {
    position: 'absolute',
    left: 3,
    top: 3,
  },
});
