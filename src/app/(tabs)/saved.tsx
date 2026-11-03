import { Link } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { ProductGrid } from '@/components/shop/ProductGrid';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Text } from '@/components/ui/Text';
import { spacing } from '@/design-system';
import { getProduct } from '@/lib/catalog';
import { pageMetadata } from '@/lib/metadata';
import { useSavedHydrated, useSavedStore } from '@/stores/saved';
import type { Product } from '@/types/product';

export function generateMetadata() {
  return pageMetadata('Saved', undefined, { index: false });
}

export default function SavedScreen() {
  const hydrated = useSavedHydrated();
  const slugs = useSavedStore((s) => s.slugs);
  const products = slugs.map(getProduct).filter((p): p is Product => !!p);

  return (
    <ScreenContainer>
      <View style={styles.head}>
        <Text variant="eyebrow" color="muted">
          Your wishlist
        </Text>
        <Text variant="display">Saved</Text>
      </View>

      {!hydrated ? null : products.length > 0 ? (
        <ProductGrid products={products} />
      ) : (
        <EmptyState
          title="Nothing saved yet."
          body="Tap the heart on anything you like and it'll wait for you here."
          action={
            <Link href="/explore" asChild>
              <Button label="Browse the shop" />
            </Link>
          }
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  head: {
    gap: spacing.xs,
  },
});
