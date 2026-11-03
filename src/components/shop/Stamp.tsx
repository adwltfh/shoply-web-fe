import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Text } from '@/components/ui/Text';
import { borderWidth, colors, radii, spacing, type ColorToken } from '@/design-system';
import type { ProductBadge } from '@/types/product';

const badgeStyles: Record<ProductBadge, { label: string; tone: ColorToken; text: ColorToken }> = {
  new: { label: 'New', tone: 'highlight', text: 'text' },
  'last-few': { label: 'Last few', tone: 'brand', text: 'text' },
  'sold-out': { label: 'Sold out', tone: 'text', text: 'onInk' },
};

type StampProps = {
  badge?: ProductBadge;
  /** Free-form stamp text, used instead of a product badge. */
  label?: string;
  tone?: ColorToken;
  tilt?: number;
  style?: StyleProp<ViewStyle>;
};

/** Slightly crooked rubber-stamp label. */
export function Stamp({ badge, label, tone, tilt = -5, style }: StampProps) {
  const preset = badge ? badgeStyles[badge] : undefined;
  const fill = tone ?? preset?.tone ?? 'highlight';
  const textColor = preset?.text ?? (fill === 'text' ? 'onInk' : 'text');

  return (
    <View
      style={[
        styles.stamp,
        { backgroundColor: colors[fill], transform: [{ rotate: `${tilt}deg` }] },
        style,
      ]}>
      <Text variant="eyebrow" color={textColor}>
        {label ?? preset?.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stamp: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.sm,
    borderWidth,
    borderColor: colors.border,
  },
});
