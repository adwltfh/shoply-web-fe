import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { colors, spacing } from '@/design-system';
import { formatPrice } from '@/lib/format';
import { FREE_SHIPPING_FROM } from '@/stores/cart';

const ITEMS = [
  `Free shipping over ${formatPrice(FREE_SHIPPING_FROM).replace('.00', '')}`,
  'Drop 004 is live',
  'Printed in small batches',
];

/** Ink announcement bar. Static (no marquee) so it stays readable and calm. */
export function TickerStrip() {
  return (
    <View style={styles.strip}>
      <Text variant="eyebrow" color="onInk" style={styles.text}>
        {ITEMS.join('  ★  ')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    backgroundColor: colors.text,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 2,
    overflow: 'hidden',
    transform: [{ rotate: '-1deg' }],
  },
  text: {
    textAlign: 'center',
  },
});
