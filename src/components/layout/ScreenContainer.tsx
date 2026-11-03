import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { colors, maxContentWidth, spacing } from '@/design-system';

type ScreenContainerProps = {
  children: ReactNode;
  /**
   * Wrap content in a ScrollView. Set false for screens that render their own
   * virtualized list (never nest a FlatList in a same-direction ScrollView).
   */
  scroll?: boolean;
  /** Lift content above the software keyboard (forms). */
  keyboardAware?: boolean;
  /** Tab screens: top. Stack screens with a header: omit top. */
  edges?: Edge[];
  contentStyle?: StyleProp<ViewStyle>;
};

export function ScreenContainer({
  children,
  scroll = true,
  keyboardAware = false,
  edges = ['top', 'left', 'right'],
  contentStyle,
}: ScreenContainerProps) {
  const content = <View style={[styles.content, contentStyle]}>{children}</View>;

  const body = scroll ? (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.scrollContent}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled">
      {content}
    </ScrollView>
  ) : (
    content
  );

  return (
    <SafeAreaView edges={edges} style={styles.root}>
      {keyboardAware ? (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {body}
        </KeyboardAvoidingView>
      ) : (
        body
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flexGrow: 1,
    width: '100%',
    maxWidth: maxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    gap: spacing.xl,
  },
});
