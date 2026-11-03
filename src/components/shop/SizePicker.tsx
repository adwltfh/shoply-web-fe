import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { borderWidth, colors, minTouchTarget, radii, spacing } from '@/design-system';

type SizePickerProps = {
  sizes: string[];
  value: string | null;
  onChange: (size: string) => void;
  disabled?: boolean;
};

export function SizePicker({ sizes, value, onChange, disabled }: SizePickerProps) {
  return (
    <View role="radiogroup" aria-label="Size" style={styles.row}>
      {sizes.map((size) => {
        const selected = size === value;
        return (
          <Pressable
            key={size}
            role="radio"
            aria-checked={selected}
            aria-label={`Size ${size}`}
            disabled={disabled}
            onPress={() => onChange(size)}
            style={({ hovered, focused }) => [
              styles.size,
              selected && styles.selected,
              !selected && hovered && styles.hovered,
              focused && styles.focused,
              disabled && styles.disabled,
            ]}>
            <Text variant="label">{size}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  size: {
    minWidth: 52,
    minHeight: minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.sm,
    borderWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  selected: {
    backgroundColor: colors.brand,
    transform: [{ rotate: '-3deg' }],
  },
  hovered: {
    backgroundColor: colors.highlight,
  },
  focused: {
    outlineColor: colors.focus,
    outlineStyle: 'solid',
    outlineWidth: 2,
    outlineOffset: 2,
  },
  disabled: {
    opacity: 0.45,
  },
});
