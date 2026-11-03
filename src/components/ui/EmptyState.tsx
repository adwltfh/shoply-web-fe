import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { borderWidth, colors, hardShadow, spacing } from '@/design-system';

import { Text } from './Text';

type EmptyStateProps = {
  title: string;
  body?: string;
  /** Usually a `<Link asChild><Button /></Link>` recovery action. */
  action?: ReactNode;
};

export function EmptyState({ title, body, action }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      {/* Decorative sticker star. */}
      <View style={styles.sticker} aria-hidden importantForAccessibility="no-hide-descendants">
        <Text variant="title" style={styles.star}>
          ★
        </Text>
      </View>
      <Text variant="title" style={styles.center}>
        {title}
      </Text>
      {body ? (
        <Text color="muted" style={[styles.center, styles.body]}>
          {body}
        </Text>
      ) : null}
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.lg,
  },
  sticker: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth,
    borderColor: colors.border,
    backgroundColor: colors.highlight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    transform: [{ rotate: '-8deg' }],
    ...hardShadow(3),
  },
  star: {
    lineHeight: 34,
  },
  center: {
    textAlign: 'center',
  },
  body: {
    maxWidth: 360,
  },
  action: {
    marginTop: spacing.lg,
  },
});
