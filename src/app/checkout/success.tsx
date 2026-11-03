import { Link, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Stamp } from '@/components/shop/Stamp';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Text } from '@/components/ui/Text';
import { colors, spacing } from '@/design-system';
import { pageMetadata } from '@/lib/metadata';

export function generateMetadata() {
  return pageMetadata('Demo order', undefined, { index: false });
}

export default function CheckoutSuccessScreen() {
  const { order } = useLocalSearchParams<{ order?: string }>();

  if (!order) {
    return (
      <ScreenContainer edges={['bottom', 'left', 'right']}>
        <EmptyState
          title="No demo order to show."
          body="Simulated order confirmations appear here after a demo checkout. Nothing is ever charged or shipped."
          action={
            <Link href="/" replace asChild>
              <Button label="Back to home" />
            </Link>
          }
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={['bottom', 'left', 'right']} contentStyle={styles.content}>
      <Card style={styles.receipt}>
        <Stamp label="Paid in good vibes" tone="brand" tilt={-6} style={styles.stamp} />
        <Text variant="eyebrow" color="muted">
          Order {order}
        </Text>
        <Text variant="display">Thanks, friend.</Text>
        <Text>
          Your demo order is in. In a real shop we&apos;d be pulling prints right now — here,
          nothing was charged and nothing will ship.
        </Text>
        <View style={styles.perforation} />
        <Link href="/" replace asChild>
          <Button label="Back to the shop" variant="ink" fullWidth />
        </Link>
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    justifyContent: 'center',
  },
  receipt: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 480,
    gap: spacing.md,
    padding: spacing.xl,
  },
  stamp: {
    marginBottom: spacing.sm,
  },
  perforation: {
    borderTopWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border,
    marginVertical: spacing.sm,
  },
});
