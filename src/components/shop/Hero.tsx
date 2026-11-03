import { Link } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { borderWidth, colors, hardShadow, radii, spacing } from '@/design-system';
import { useContainerWidth } from '@/hooks/useContainerWidth';
import { getProduct } from '@/lib/catalog';
import type { Product } from '@/types/product';

import { ProductArt } from './ProductArt';
import { Stamp } from './Stamp';

const FEATURED = ['static-tee', 'canvas-tote', 'enamel-pin-set']
  .map(getProduct)
  .filter((p): p is Product => !!p);

/** Title size per hero width: phone, tablet, desktop. */
function titleSize(width: number) {
  if (width >= 820) return { fontSize: 80, lineHeight: 80 };
  if (width >= 520) return { fontSize: 60, lineHeight: 62 };
  return { fontSize: 44, lineHeight: 46 };
}

/**
 * Home hero. Measures itself: on wide screens the copy sits beside a fanned
 * stack of featured product tiles; on phones it's copy only with a sticker star.
 */
export function Hero() {
  const { width, onLayout } = useContainerWidth();
  const w = width ?? 0;
  const showCollage = w >= 680;
  // Tile width scales with the hero, within limits.
  const tile = Math.min(220, Math.max(150, w * 0.19));

  return (
    <View style={[styles.hero, showCollage && styles.heroWide]} onLayout={onLayout}>
      {!showCollage && (
        <Text
          aria-hidden
          importantForAccessibility="no"
          style={[styles.star, w >= 520 ? styles.starMedium : styles.starSmall]}>
          ★
        </Text>
      )}

      <View style={[styles.copy, showCollage && styles.copyWide]}>
        <Stamp label="Drop 004" tone="highlight" tilt={-4} />
        <Text variant="display" style={titleSize(w)}>
          Small batch.{'\n'}Loud print.
        </Text>
        <Text style={styles.body}>
          Tees, totes, pins, and riso prints, pulled by hand in runs of 50 or fewer. When
          they&apos;re gone, they&apos;re gone.
        </Text>
        <Link href="/explore" asChild>
          <Button label="Shop the drop" variant="ink" />
        </Link>
      </View>

      {showCollage && (
        <View
          aria-hidden
          importantForAccessibility="no-hide-descendants"
          style={{ width: tile * 1.9, height: tile * 1.25 * 1.45 }}>
          {FEATURED.map((product, i) => (
            <View
              key={product.slug}
              style={[
                styles.tile,
                { width: tile },
                collagePositions[i],
              ]}>
              <ProductArt product={product} />
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const collagePositions = [
  { left: 0, top: '6%', transform: [{ rotate: '-7deg' }] },
  { right: 0, top: 0, transform: [{ rotate: '6deg' }] },
  { left: '24%', bottom: 0, transform: [{ rotate: '-2deg' }] },
] as const;

const styles = StyleSheet.create({
  hero: {
    overflow: 'hidden',
    padding: spacing.xl,
    paddingTop: spacing.xxl,
    borderRadius: radii.md,
    borderWidth,
    borderColor: colors.border,
    backgroundColor: colors.brand,
    ...hardShadow(6, colors.accent),
  },
  heroWide: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxl,
    padding: spacing.xxl,
  },
  copy: {
    gap: spacing.lg,
  },
  copyWide: {
    flex: 1,
  },
  body: {
    maxWidth: 420,
  },
  star: {
    position: 'absolute',
    color: colors.highlight,
    transform: [{ rotate: '14deg' }],
  },
  starSmall: {
    right: -34,
    top: -34,
    fontSize: 130,
    lineHeight: 150,
  },
  starMedium: {
    right: -20,
    top: -36,
    fontSize: 180,
    lineHeight: 200,
  },
  tile: {
    position: 'absolute',
    borderRadius: radii.md,
    ...hardShadow(5),
  },
});
