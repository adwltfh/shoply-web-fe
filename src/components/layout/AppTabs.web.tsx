import { Link } from 'expo-router';
import {
  TabList,
  TabSlot,
  TabTrigger,
  Tabs,
  type TabListProps,
  type TabTriggerSlotProps,
} from 'expo-router/ui';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import type { ComponentRef, Ref } from 'react';
import { Pressable, StyleSheet, View, type PressableStateCallbackType } from 'react-native';

import { Text } from '@/components/ui/Text';
import { borderWidth, colors, maxContentWidth, minTouchTarget, radii, spacing } from '@/design-system';
import { useCartCount } from '@/stores/cart';

import { Wordmark } from './Wordmark';

/**
 * Web navigation: one site header with wordmark + tab links.
 * The nav wraps under the wordmark on narrow viewports via flexWrap, so the
 * layout needs no window-size JS and static HTML matches the hydrated page.
 */
export function AppTabs() {
  const cartCount = useCartCount();

  return (
    <Tabs style={styles.tabs}>
      <TabList asChild>
        <SiteHeader>
          <TabTrigger name="home" href="/" asChild>
            <TabButton icon={{ web: 'home' }}>Home</TabButton>
          </TabTrigger>
          <TabTrigger name="explore" href="/explore" asChild>
            <TabButton icon={{ web: 'grid_view' }}>Shop</TabButton>
          </TabTrigger>
          <TabTrigger name="saved" href="/saved" asChild>
            <TabButton icon={{ web: 'favorite_border' }}>Saved</TabButton>
          </TabTrigger>
          <TabTrigger name="cart" href="/cart" asChild>
            <TabButton icon={{ web: 'shopping_bag' }} badge={cartCount}>
              Bag
            </TabButton>
          </TabTrigger>
        </SiteHeader>
      </TabList>
      <TabSlot style={styles.slot} />
    </Tabs>
  );
}

function SiteHeader({ children, style, ...props }: TabListProps) {
  return (
    // `styles.header` goes last: TabList passes a row layout, which would stop
    // the inner container from centering at maxContentWidth.
    <View {...props} role="banner" style={[style, styles.header]}>
      <View style={styles.headerInner}>
        <Link href="/" asChild>
          <Pressable aria-label="Loose Thread Supply home" style={focusRing}>
            <Wordmark />
          </Pressable>
        </Link>
        <View role="navigation" aria-label="Main" style={styles.nav}>
          {children}
        </View>
      </View>
    </View>
  );
}

type TabButtonProps = TabTriggerSlotProps & {
  icon: SymbolViewProps['name'];
  /** Count bubble (hidden at 0). */
  badge?: number;
};

function TabButton({ children, isFocused, icon, badge = 0, ref, ...props }: TabButtonProps) {
  return (
    <Pressable
      {...props}
      // expo-router types this ref as Ref<typeof View> (a function component in RN 0.88);
      // at runtime it is the Pressable host instance.
      ref={ref as unknown as Ref<ComponentRef<typeof Pressable>>}
      aria-current={isFocused ? 'page' : undefined}
      aria-label={badge > 0 ? `${String(children)}, ${badge} items` : undefined}
      style={({ hovered, focused }) => [
        styles.tabButton,
        hovered && !isFocused && styles.hovered,
        isFocused && styles.tabButtonActive,
        focused && styles.focused,
      ]}>
      <SymbolView name={icon} size={20} tintColor={colors.text} />
      <Text variant="label">{children}</Text>
      {badge > 0 && (
        <View style={styles.badge}>
          <Text variant="caption" style={styles.badgeText}>
            {badge}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

function focusRing({ hovered, focused }: PressableStateCallbackType) {
  return [styles.wordmark, hovered && styles.wordmarkHovered, focused && styles.focused];
}

const styles = StyleSheet.create({
  tabs: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  slot: {
    flex: 1,
  },
  header: {
    flexDirection: 'column',
    alignItems: 'stretch',
    backgroundColor: colors.canvas,
    borderBottomWidth: borderWidth,
    borderBottomColor: colors.border,
  },
  headerInner: {
    width: '100%',
    maxWidth: maxContentWidth,
    alignSelf: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    columnGap: spacing.lg,
    rowGap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  wordmark: {
    borderRadius: radii.sm,
    paddingHorizontal: spacing.xs,
  },
  wordmarkHovered: {
    transform: [{ rotate: '-2deg' }],
  },
  nav: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tabButton: {
    flexDirection: 'row',
    minHeight: minTouchTarget,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    borderWidth,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  tabButtonActive: {
    backgroundColor: colors.brand,
    borderColor: colors.border,
  },
  hovered: {
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  focused: {
    outlineColor: colors.focus,
    outlineStyle: 'solid',
    outlineWidth: 2,
    outlineOffset: 2,
  },
  badge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: colors.onInk,
    fontWeight: '800',
  },
});
