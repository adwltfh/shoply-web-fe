import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { CategoryChips } from '@/components/shop/CategoryChips';
import { ProductGrid } from '@/components/shop/ProductGrid';
import { EmptyState } from '@/components/ui/EmptyState';
import { Text } from '@/components/ui/Text';
import { borderWidth, colors, hardShadow, minTouchTarget, radii, spacing, typography } from '@/design-system';
import { CATEGORIES, isCategory, useProducts } from '@/lib/catalog';
import { pageMetadata } from '@/lib/metadata';

export function generateMetadata() {
  return pageMetadata('Shop all', 'Browse every tee, tote, pin, and print from Loose Thread Supply.');
}

export default function ExploreScreen() {
  const params = useLocalSearchParams<{ category?: string }>();
  const category = isCategory(params.category) ? params.category : undefined;
  const [query, setQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const { data: products } = useProducts({ category, query });

  const heading = CATEGORIES.find((c) => c.id === category)?.label ?? 'Shop all';

  return (
    <ScreenContainer keyboardAware>
      <View style={styles.head}>
        <Text variant="eyebrow" color="muted">
          Drop 004 · {products.length} {products.length === 1 ? 'thing' : 'things'}
        </Text>
        <Text variant="display">{heading}</Text>
      </View>

      {/* Focus ring lives on the box, since the bare input has its outline removed. */}
      <View style={[styles.search, searchFocused && styles.searchFocused]}>
        <SymbolView
          name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
          size={20}
          tintColor={colors.muted}
        />
        <TextInput
          value={query}
          onChangeText={setQuery}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          placeholder="Search tees, pins, prints…"
          placeholderTextColor={colors.muted}
          aria-label="Search products"
          returnKeyType="search"
          autoCorrect={false}
          clearButtonMode="while-editing"
          style={styles.input}
        />
      </View>

      <CategoryChips selected={category} replace />

      {products.length > 0 ? (
        <ProductGrid products={products} />
      ) : (
        <EmptyState
          title="Nothing printed like that."
          body={
            query
              ? `No ${category ? heading.toLowerCase() : 'products'} match “${query}”. Try another word.`
              : 'Nothing in this category right now.'
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
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: minTouchTarget + 4,
    paddingHorizontal: spacing.md,
    borderRadius: radii.sm,
    borderWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    ...hardShadow(3),
  },
  searchFocused: {
    outlineColor: colors.focus,
    outlineStyle: 'solid',
    outlineWidth: 2,
    outlineOffset: 2,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    paddingVertical: spacing.sm,
    outlineWidth: 0,
  },
});
