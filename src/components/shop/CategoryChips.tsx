import { Link, type Href } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, type PressableProps } from 'react-native';

import { Text } from '@/components/ui/Text';
import { borderWidth, colors, minTouchTarget, radii, spacing } from '@/design-system';
import { CATEGORIES } from '@/lib/catalog';
import type { Category } from '@/types/product';

type CategoryChipsProps = {
  selected?: Category;
  /** Replace history instead of pushing (use when already on Explore). */
  replace?: boolean;
};

/** Horizontally scrolling category links into Explore. */
export function CategoryChips({ selected, replace = false }: CategoryChipsProps) {
  const chips: { key: string; label: string; href: Href; active: boolean }[] = [
    { key: 'all', label: 'All', href: '/explore', active: !selected },
    ...CATEGORIES.map((c) => ({
      key: c.id,
      label: c.label,
      href: { pathname: '/explore', params: { category: c.id } } as const,
      active: selected === c.id,
    })),
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      style={styles.scroller}>
      {chips.map((chip) => (
        <Link key={chip.key} href={chip.href} replace={replace} asChild>
          <Chip label={chip.label} active={chip.active} />
        </Link>
      ))}
    </ScrollView>
  );
}

type ChipProps = Omit<PressableProps, 'children' | 'style'> & { label: string; active: boolean };

// A component (not a bare Pressable) so `<Link asChild>` can't replace the style callback.
function Chip({ label, active, ...rest }: ChipProps) {
  return (
    <Pressable
      aria-current={active ? 'page' : undefined}
      {...rest}
      style={({ pressed, hovered, focused }) => [
        styles.chip,
        active && styles.active,
        !active && (pressed || hovered) && styles.hovered,
        focused && styles.focused,
      ]}>
      <Text variant="label" color={active ? 'onInk' : 'text'}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroller: {
    flexGrow: 0,
    marginHorizontal: -spacing.lg,
  },
  row: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  chip: {
    minHeight: minTouchTarget,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
    borderWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  active: {
    backgroundColor: colors.text,
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
});
