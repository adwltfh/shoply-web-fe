import { StyleSheet, View, type ViewProps } from 'react-native';

import { borderWidth, colors, hardShadow, radii, spacing, type ColorToken } from '@/design-system';

type CardProps = ViewProps & {
  /** Fill color token. Defaults to `surface`. */
  tone?: ColorToken;
};

/** Ink-outlined panel with a hard offset shadow. */
export function Card({ style, tone = 'surface', ...rest }: CardProps) {
  return <View {...rest} style={[styles.card, { backgroundColor: colors[tone] }, style]} />;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.md,
    borderWidth,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.xs,
    ...hardShadow(4),
  },
});
