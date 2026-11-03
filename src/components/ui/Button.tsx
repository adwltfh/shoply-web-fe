import {
  Pressable,
  StyleSheet,
  type PressableProps,
  type PressableStateCallbackType,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { borderWidth, colors, hardShadow, minTouchTarget, radii, spacing } from '@/design-system';

import { Text } from './Text';

type ButtonVariant = 'primary' | 'secondary' | 'ink' | 'ghost';

export type ButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  label: string;
  variant?: ButtonVariant;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * Accessible text button. Spreads remaining props onto `Pressable`,
 * so it works as a child of `<Link asChild>`.
 * Pressing moves the button onto its hard shadow, like stamping it down.
 */
export function Button({
  label,
  variant = 'primary',
  fullWidth = false,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const raised = variant !== 'ghost';

  const getStyle = ({ pressed, hovered, focused }: PressableStateCallbackType) => [
    styles.base,
    variantStyles[variant],
    raised && !disabled && (pressed ? styles.pressedDown : styles.raised),
    hovered && !pressed && hoveredStyles[variant],
    focused && styles.focused,
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
    style,
  ];

  return (
    <Pressable
      role="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      {...rest}
      style={getStyle}>
      <Text
        variant="label"
        color={variant === 'ink' ? 'onInk' : variant === 'ghost' ? 'brandInk' : 'text'}
        numberOfLines={2}
        style={styles.label}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: minTouchTarget,
    minWidth: minTouchTarget,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radii.sm,
    borderWidth,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  label: {
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'center',
  },
  raised: hardShadow(3),
  pressedDown: {
    transform: [{ translateX: 3 }, { translateY: 3 }],
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  focused: {
    outlineColor: colors.focus,
    outlineStyle: 'solid',
    outlineWidth: 2,
    outlineOffset: 4,
  },
  disabled: {
    opacity: 0.45,
  },
});

const variantStyles = StyleSheet.create({
  primary: { backgroundColor: colors.brand },
  secondary: { backgroundColor: colors.surface },
  ink: { backgroundColor: colors.text },
  ghost: { backgroundColor: 'transparent', borderColor: 'transparent' },
});

const hoveredStyles = StyleSheet.create({
  primary: { backgroundColor: colors.brandPressed },
  secondary: { backgroundColor: colors.highlight },
  ink: { backgroundColor: '#2A2A2A' },
  ghost: { backgroundColor: colors.brandSoft },
});
