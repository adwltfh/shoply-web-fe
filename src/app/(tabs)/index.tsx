import { Link } from 'expo-router';
import type { ReactNode } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Wordmark } from '@/components/layout/Wordmark';
import { CategoryChips } from '@/components/shop/CategoryChips';
import { Hero } from '@/components/shop/Hero';
import { ProductGrid } from '@/components/shop/ProductGrid';
import { TickerStrip } from '@/components/shop/TickerStrip';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { spacing } from '@/design-system';
import { useProducts } from '@/lib/catalog';
import { pageMetadata } from '@/lib/metadata';

export function generateMetadata() {
  return pageMetadata(null);
}

export default function HomeScreen() {
  const { data: products } = useProducts();
  const fresh = products.slice(0, 4);
  const picks = products.slice(4, 8);

  return (
    <ScreenContainer>
      {/* Web shows the wordmark in the site header instead. */}
      {Platform.OS !== 'web' && <Wordmark />}

      <TickerStrip />

      <Hero />

      <View style={styles.section}>
        <Text variant="eyebrow" color="muted">
          Shop by thing
        </Text>
        <CategoryChips />
      </View>

      <Section title="Fresh off the press" href="/explore">
        <ProductGrid products={fresh} />
      </Section>

      <Card tone="highlight" style={styles.about}>
        <Text variant="heading">Hi, we&apos;re a two-person print shop.</Text>
        <Text>
          Everything here is designed, printed, and packed in one small studio. Misprints happen;
          we call them one-offs.
        </Text>
        <Text variant="caption" color="muted" style={styles.disclaimer}>
          This is a demo store. Products and prices are illustrative. No payment or real order is
          ever processed.
        </Text>
      </Card>

      <Section title="Staff picks" href="/explore">
        <ProductGrid products={picks} />
      </Section>

      <Link href="/explore" asChild>
        <Button label={`See all ${products.length} things`} variant="secondary" fullWidth />
      </Link>
    </ScreenContainer>
  );
}

function Section({
  title,
  href,
  children,
}: {
  title: string;
  href: '/explore';
  children: ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Text variant="title" style={styles.sectionTitle}>
          {title}
        </Text>
        <Link href={href} asChild>
          <Button label="View all →" variant="ghost" style={styles.viewAll} />
        </Link>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.md,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  sectionTitle: {
    flexShrink: 1,
  },
  viewAll: {
    paddingHorizontal: spacing.sm,
  },
  about: {
    gap: spacing.sm,
    transform: [{ rotate: '-0.6deg' }],
  },
  disclaimer: {
    marginTop: spacing.xs,
  },
});
