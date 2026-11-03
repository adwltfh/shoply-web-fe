import { Link, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { ProductArt } from '@/components/shop/ProductArt';
import { SaveButton } from '@/components/shop/SaveButton';
import { SizePicker } from '@/components/shop/SizePicker';
import { Stamp } from '@/components/shop/Stamp';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Text } from '@/components/ui/Text';
import { colors, hardShadow, spacing } from '@/design-system';
import { CATEGORIES, PRODUCTS, getProduct, useProduct } from '@/lib/catalog';
import { formatPrice } from '@/lib/format';
import { pageMetadata } from '@/lib/metadata';
import { useCartStore } from '@/stores/cart';

/** Pre-render one HTML page per product, so static HTML matches the hydrated page. */
export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ slug: p.slug }));
}

export function generateMetadata(_request: unknown, params: Record<string, string | string[]>) {
  const product = getProduct(typeof params.slug === 'string' ? params.slug : undefined);
  return product ? pageMetadata(product.name, product.blurb) : pageMetadata('Product');
}

export default function ProductScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { data: product } = useProduct(slug);
  const add = useCartStore((s) => s.add);
  const [size, setSize] = useState<string | null>(null);
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    if (!justAdded) return;
    const t = setTimeout(() => setJustAdded(false), 1800);
    return () => clearTimeout(t);
  }, [justAdded]);

  if (!product) {
    return (
      <ScreenContainer edges={['bottom', 'left', 'right']}>
        <Stack.Screen options={{ title: 'Not found' }} />
        <EmptyState
          title="That one's not in the shop."
          body={slug ? `We couldn't find “${slug}”. It may have sold out for good.` : undefined}
          action={
            <Link href="/explore" asChild>
              <Button label="Back to the shop" variant="secondary" />
            </Link>
          }
        />
      </ScreenContainer>
    );
  }

  const soldOut = product.badge === 'sold-out';
  const needsSize = !!product.sizes && !size;
  const category = CATEGORIES.find((c) => c.id === product.category)?.label;

  const addLabel = soldOut
    ? 'Sold out'
    : justAdded
      ? 'Added ✓'
      : needsSize
        ? 'Pick a size'
        : `Add to bag · ${formatPrice(product.price)}`;

  return (
    <ScreenContainer edges={['bottom', 'left', 'right']}>
      <Stack.Screen options={{ title: product.name }} />

      <View style={styles.layout}>
        <View style={styles.artCol}>
          <View style={styles.artFrame}>
            <ProductArt product={product} size="detail" style={soldOut && styles.soldOut} />
            {product.badge && <Stamp badge={product.badge} tilt={-7} style={styles.stamp} />}
          </View>
          <Text variant="caption" color="muted" style={styles.placeholderNote}>
            Product photo coming soon.
          </Text>
        </View>

        <View style={styles.infoCol}>
          <View style={styles.titleRow}>
            <View style={styles.titleText}>
              <Text variant="eyebrow" color="muted">
                {category}
              </Text>
              <Text variant="display">{product.name}</Text>
            </View>
            <SaveButton product={product} />
          </View>

          <Text variant="title" color="brandInk">
            {formatPrice(product.price)}
          </Text>

          <Text>{product.blurb}</Text>

          {product.sizes && (
            <View style={styles.block}>
              <Text variant="eyebrow">Size{size ? ` · ${size}` : ''}</Text>
              <SizePicker sizes={product.sizes} value={size} onChange={setSize} disabled={soldOut} />
            </View>
          )}

          <View style={styles.block}>
            <Button
              label={addLabel}
              fullWidth
              disabled={soldOut || needsSize}
              onPress={() => {
                add(product.slug, size);
                setJustAdded(true);
              }}
            />
            {justAdded && (
              <Link href="/cart" asChild>
                <Button label="View bag →" variant="ghost" fullWidth />
              </Link>
            )}
          </View>

          <View style={[styles.block, styles.details]}>
            <Text variant="heading">The details</Text>
            {product.details.map((d) => (
              <View key={d} style={styles.detailRow}>
                <Text color="brandInk" aria-hidden importantForAccessibility="no">
                  ★
                </Text>
                <Text style={styles.detailText}>{d}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  layout: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xxl,
  },
  artCol: {
    flexGrow: 1,
    flexBasis: 320,
    flexShrink: 1,
    maxWidth: 560,
    gap: spacing.sm,
  },
  artFrame: {
    borderRadius: 4,
    ...hardShadow(6, colors.accent),
  },
  soldOut: {
    opacity: 0.55,
  },
  stamp: {
    position: 'absolute',
    left: spacing.md,
    top: spacing.md,
  },
  placeholderNote: {
    textAlign: 'center',
  },
  infoCol: {
    flexGrow: 1,
    flexBasis: 300,
    flexShrink: 1,
    gap: spacing.lg,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  titleText: {
    flex: 1,
    gap: spacing.xs,
  },
  block: {
    gap: spacing.sm,
  },
  details: {
    paddingTop: spacing.lg,
    borderTopWidth: 2,
    borderTopColor: colors.border,
  },
  detailRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  detailText: {
    flex: 1,
  },
});
