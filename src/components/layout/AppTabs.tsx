import { NativeTabs } from 'expo-router/native-tabs';

import { colors } from '@/design-system';
import { useCartCount } from '@/stores/cart';

/** Native bottom tabs (iOS UITabBarController / Android Material bottom navigation). */
export function AppTabs() {
  const cartCount = useCartCount();

  return (
    <NativeTabs
      backgroundColor={colors.surface}
      tintColor={colors.text}
      iconColor={{ default: colors.muted, selected: colors.text }}
      labelStyle={{ default: { color: colors.muted }, selected: { color: colors.text } }}
      indicatorColor={colors.brand}
      badgeBackgroundColor={colors.brand}
      badgeTextColor={colors.text}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} md="home" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="explore">
        <NativeTabs.Trigger.Label>Shop</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="square.grid.2x2" md="grid_view" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="saved">
        <NativeTabs.Trigger.Label>Saved</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'heart', selected: 'heart.fill' }}
          md={{ default: 'favorite_border', selected: 'favorite' }}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="cart">
        <NativeTabs.Trigger.Label>Bag</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'bag', selected: 'bag.fill' }} md="shopping_bag" />
        <NativeTabs.Trigger.Badge hidden={cartCount === 0}>{String(cartCount)}</NativeTabs.Trigger.Badge>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
