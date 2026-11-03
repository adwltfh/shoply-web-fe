import { StyleSheet, View } from 'react-native';

import { IconButton } from '@/components/ui/IconButton';
import { Text } from '@/components/ui/Text';
import { borderWidth, colors, radii } from '@/design-system';

type QuantityStepperProps = {
  value: number;
  max: number;
  onChange: (qty: number) => void;
  /** Spoken item name, e.g. "Static Tee, size M". */
  itemLabel: string;
};

/** − qty + control. Going below 1 is the caller's "remove". */
export function QuantityStepper({ value, max, onChange, itemLabel }: QuantityStepperProps) {
  return (
    <View style={styles.box}>
      <IconButton
        icon={{ ios: 'minus', android: 'remove', web: 'remove' }}
        size={18}
        accessibilityLabel={`Decrease quantity of ${itemLabel}`}
        onPress={() => onChange(value - 1)}
      />
      <Text variant="label" style={styles.value} aria-live="polite">
        {value}
      </Text>
      <IconButton
        icon={{ ios: 'plus', android: 'add', web: 'add' }}
        size={18}
        accessibilityLabel={`Increase quantity of ${itemLabel}`}
        disabled={value >= max}
        onPress={() => onChange(value + 1)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: radii.sm,
    borderWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  value: {
    minWidth: 24,
    textAlign: 'center',
  },
});
