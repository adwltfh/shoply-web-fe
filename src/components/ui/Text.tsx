import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { colors, typography, type ColorToken, type TypographyVariant } from '@/design-system';

const headingLevels: Partial<Record<TypographyVariant, 1 | 2 | 3>> = {
  display: 1,
  title: 2,
  heading: 3,
};

export type TextProps = RNTextProps & {
  variant?: TypographyVariant;
  color?: ColorToken;
};

/** Typography wrapper. Heading variants get `role="heading"` (semantic <hN> on web). */
export function Text({ variant = 'body', color = 'text', style, role, ...rest }: TextProps) {
  const level = headingLevels[variant];
  const headingProps = level && !role ? ({ role: 'heading', 'aria-level': level } as const) : { role };

  return (
    <RNText
      maxFontSizeMultiplier={2}
      {...headingProps}
      {...rest}
      style={[typography[variant], { color: colors[color] }, style]}
    />
  );
}
