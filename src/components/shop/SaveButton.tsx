import type { StyleProp, ViewStyle } from 'react-native';

import { IconButton } from '@/components/ui/IconButton';
import { colors } from '@/design-system';
import { useIsSaved, useSavedStore } from '@/stores/saved';
import type { Product } from '@/types/product';

/** Heart toggle for the saved list. */
export function SaveButton({ product, style }: { product: Product; style?: StyleProp<ViewStyle> }) {
  const saved = useIsSaved(product.slug);
  const toggle = useSavedStore((s) => s.toggle);

  return (
    <IconButton
      outlined
      icon={
        saved
          ? { ios: 'heart.fill', android: 'favorite', web: 'favorite' }
          : { ios: 'heart', android: 'favorite_border', web: 'favorite_border' }
      }
      size={20}
      color={saved ? colors.brandPressed : colors.text}
      accessibilityLabel={`Save ${product.name}`}
      aria-pressed={saved}
      onPress={() => toggle(product.slug)}
      style={style}
    />
  );
}
