import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import {
  Pressable,
  StyleSheet,
  type PressableProps,
  type PressableStateCallbackType,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { borderWidth, colors, minTouchTarget, radii } from '@/design-system';

export type IconButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  /** Required: icon-only controls must have a spoken label. */
  accessibilityLabel: string;
  icon: SymbolViewProps['name'];
  color?: string;
  size?: number;
  /** Round sticker with an ink outline, for use on top of product art. */
  outlined?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function IconButton({
  icon,
  color = colors.text,
  size = 24,
  outlined = false,
  disabled,
  style,
  ...rest
}: IconButtonProps) {
  const getStyle = ({ pressed, hovered, focused }: PressableStateCallbackType) => [
    styles.base,
    outlined && styles.outlined,
    (pressed || hovered) && (outlined ? styles.outlinedPressed : styles.pressed),
    focused && styles.focused,
    disabled && styles.disabled,
    style,
  ];

  return (
    <Pressable
      role="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      hitSlop={4}
      {...rest}
      style={getStyle}>
      <SymbolView name={icon} size={size} tintColor={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: minTouchTarget,
    height: minTouchTarget,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlined: {
    borderRadius: radii.pill,
    borderWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pressed: {
    backgroundColor: colors.brandSoft,
  },
  outlinedPressed: {
    backgroundColor: colors.highlight,
  },
  focused: {
    outlineColor: colors.focus,
    outlineStyle: 'solid',
    outlineWidth: 2,
    outlineOffset: 2,
  },
  disabled: {
    opacity: 0.5,
  },
});
