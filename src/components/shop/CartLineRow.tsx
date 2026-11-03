import { Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { colors, spacing } from '@/design-system';
import { getProduct } from '@/lib/catalog';
import { formatPrice } from '@/lib/format';
import { MAX_QTY, useCartStore, type CartLine } from '@/stores/cart';

import { ProductArt } from './ProductArt';
import { QuantityStepper } from './QuantityStepper';

/** One bag line: thumbnail, name/size, line price, quantity, remove. */
export function CartLineRow({ line }: { line: CartLine }) {
  const product = getProduct(line.slug);
  const setQty = useCartStore((s) => s.setQty);
  const remove = useCartStore((s) => s.remove);

  if (!product) return null;

  const itemLabel = line.size ? `${product.name}, size ${line.size}` : product.name;

  return (
    <View style={styles.row}>
      <Link href={{ pathname: '/products/[slug]', params: { slug: product.slug } }} asChild>
        <Pressable aria-label={product.name}>
          <ProductArt product={product} size="thumb" />
        </Pressable>
      </Link>

      <View style={styles.body}>
        <View style={styles.top}>
          <View style={styles.name}>
            <Text variant="label">{product.name}</Text>
            <Text variant="caption" color="muted">
              {line.size ? `Size ${line.size}` : 'One size'} · {formatPrice(product.price)} each
            </Text>
          </View>
          <Text variant="label">{formatPrice(product.price * line.qty)}</Text>
        </View>

        <View style={styles.actions}>
          <QuantityStepper
            value={line.qty}
            max={MAX_QTY}
            itemLabel={itemLabel}
            onChange={(qty) => setQty(line.slug, line.size, qty)}
          />
          <Button
            label="Remove"
            variant="ghost"
            aria-label={`Remove ${itemLabel}`}
            onPress={() => remove(line.slug, line.size)}
            style={styles.remove}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  body: {
    flex: 1,
    gap: spacing.sm,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  name: {
    flex: 1,
    gap: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  remove: {
    paddingHorizontal: spacing.md,
  },
});
