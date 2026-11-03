import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { colors, spacing } from '@/design-system';
import { formatPrice } from '@/lib/format';
import { FREE_SHIPPING_FROM, shippingFor, useCartSubtotal } from '@/stores/cart';

/** Subtotal / shipping / total, with a nudge toward free shipping. */
export function OrderSummary({ children }: { children?: ReactNode }) {
  const subtotal = useCartSubtotal();
  const shipping = shippingFor(subtotal);
  const toFree = FREE_SHIPPING_FROM - subtotal;

  return (
    <Card style={styles.card}>
      <Text variant="heading">Order summary</Text>
      <Row label="Subtotal" value={formatPrice(subtotal)} />
      <Row label="Shipping" value={shipping === 0 ? 'Free' : formatPrice(shipping)} />
      {toFree > 0 && (
        <Text variant="caption" color="brandInk">
          Add {formatPrice(toFree)} more for free shipping.
        </Text>
      )}
      <View style={styles.divider} />
      <Row label="Total" value={formatPrice(subtotal + shipping)} strong />
      {children ? <View style={styles.footer}>{children}</View> : null}
    </Card>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.row}>
      <Text variant={strong ? 'bodyStrong' : 'body'}>{label}</Text>
      <Text variant={strong ? 'bodyStrong' : 'body'}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  divider: {
    height: 2,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  footer: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
});
