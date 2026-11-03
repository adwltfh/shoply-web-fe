import { Link } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { CartLineRow } from '@/components/shop/CartLineRow';
import { OrderSummary } from '@/components/shop/OrderSummary';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Text } from '@/components/ui/Text';
import { spacing } from '@/design-system';
import { pageMetadata } from '@/lib/metadata';
import { useCartCount, useCartHydrated, useCartStore } from '@/stores/cart';

export function generateMetadata() {
  return pageMetadata('Bag', undefined, { index: false });
}

export default function CartScreen() {
  const hydrated = useCartHydrated();
  const lines = useCartStore((s) => s.lines);
  const count = useCartCount();

  return (
    <ScreenContainer>
      <View style={styles.head}>
        <Text variant="eyebrow" color="muted">
          {count} {count === 1 ? 'item' : 'items'}
        </Text>
        <Text variant="display">Your bag</Text>
      </View>

      {!hydrated ? null : lines.length === 0 ? (
        <EmptyState
          title="Your bag is empty."
          body="Grab a tee, a tote, or a very small cat pin."
          action={
            <Link href="/explore" asChild>
              <Button label="Browse the shop" />
            </Link>
          }
        />
      ) : (
        <View style={styles.layout}>
          <View style={styles.lines}>
            {lines.map((line) => (
              <CartLineRow key={`${line.slug}:${line.size ?? ''}`} line={line} />
            ))}
          </View>
          <View style={styles.summary}>
            <OrderSummary>
              <Link href="/checkout" asChild>
                <Button label="Checkout" variant="ink" fullWidth />
              </Link>
              <Link href="/explore" asChild>
                <Button label="Keep shopping" variant="ghost" fullWidth />
              </Link>
            </OrderSummary>
          </View>
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  head: {
    gap: spacing.xs,
  },
  layout: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    gap: spacing.xxl,
  },
  lines: {
    flexGrow: 2,
    flexShrink: 1,
    flexBasis: 340,
  },
  summary: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 280,
  },
});
