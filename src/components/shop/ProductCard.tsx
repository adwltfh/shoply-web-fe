import { Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { colors, hardShadow, spacing } from '@/design-system';
import { formatPrice } from '@/lib/format';
import type { Product } from '@/types/product';

import { ProductArt } from './ProductArt';
import { SaveButton } from './SaveButton';
import { Stamp } from './Stamp';

/** Grid tile: art, stamp, name, price. The heart sits beside the link, not inside it. */
export function ProductCard({ product }: { product: Product }) {
  const soldOut = product.badge === 'sold-out';

  return (
    <View style={styles.card}>
      <Link href={{ pathname: '/products/[slug]', params: { slug: product.slug } }} asChild>
        <Pressable
          aria-label={`${product.name}, ${formatPrice(product.price)}${soldOut ? ', sold out' : ''}`}
          style={styles.link}>
          {({ pressed, hovered, focused }) => (
            <>
              <View
                style={[
                  styles.artWrap,
                  pressed ? styles.artPressed : hovered ? styles.artHovered : styles.artRest,
                  focused && styles.focused,
                ]}>
                <ProductArt product={product} style={soldOut && styles.soldOut} />
                {product.badge && <Stamp badge={product.badge} style={styles.stamp} />}
              </View>
              <View style={styles.meta}>
                <Text variant="label" numberOfLines={1}>
                  {product.name}
                </Text>
                <Text variant="label" color={soldOut ? 'muted' : 'brandInk'}>
                  {formatPrice(product.price)}
                </Text>
              </View>
            </>
          )}
        </Pressable>
      </Link>
      <SaveButton product={product} style={styles.heart} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
  },
  link: {
    gap: spacing.sm,
  },
  artWrap: {
    borderRadius: 4,
  },
  artRest: hardShadow(4),
  artHovered: {
    ...hardShadow(6),
    transform: [{ translateX: -2 }, { translateY: -2 }],
  },
  artPressed: {
    transform: [{ translateX: 4 }, { translateY: 4 }],
  },
  focused: {
    outlineColor: colors.focus,
    outlineStyle: 'solid',
    outlineWidth: 2,
    outlineOffset: 4,
  },
  soldOut: {
    opacity: 0.55,
  },
  stamp: {
    position: 'absolute',
    left: spacing.sm,
    top: spacing.sm,
  },
  meta: {
    gap: 2,
    paddingRight: spacing.xs,
  },
  heart: {
    position: 'absolute',
    right: spacing.sm,
    top: spacing.sm,
  },
});
