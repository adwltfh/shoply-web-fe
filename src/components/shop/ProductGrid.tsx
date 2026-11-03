import { StyleSheet, View } from 'react-native';

import { spacing } from '@/design-system';
import { useContainerWidth } from '@/hooks/useContainerWidth';
import type { Product } from '@/types/product';

import { ProductCard } from './ProductCard';

const GAP = spacing.lg;

function columnsFor(width: number) {
  if (width >= 900) return 4;
  if (width >= 560) return 3;
  return 2;
}

/**
 * Responsive product grid sized from its own measured width.
 * Before the first layout (and in static HTML) it renders two columns.
 */
export function ProductGrid({ products }: { products: Product[] }) {
  const { width, onLayout } = useContainerWidth();

  const cellWidth =
    width === null
      ? '47%'
      : (width - GAP * (columnsFor(width) - 1)) / columnsFor(width);

  return (
    <View style={styles.grid} onLayout={onLayout}>
      {products.map((product) => (
        <View key={product.slug} style={{ width: cellWidth }}>
          <ProductCard product={product} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: GAP,
    rowGap: spacing.xl,
  },
});
