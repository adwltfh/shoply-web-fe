import { StyleSheet, Text as RNText, View } from 'react-native';

import { colors, fonts } from '@/design-system';

/**
 * "Loose Thread ★" wordmark: ink print over a pink pass that is slightly
 * off-register. The pink copy is decorative and hidden from screen readers.
 */
export function Wordmark() {
  return (
    <View style={styles.wrap} accessible accessibilityLabel="Loose Thread Supply" role="img">
      <RNText
        style={[styles.text, styles.misprint]}
        maxFontSizeMultiplier={1.5}
        aria-hidden
        importantForAccessibility="no">
        Loose Thread ★
      </RNText>
      <RNText style={styles.text} maxFontSizeMultiplier={1.5}>
        Loose Thread <RNText style={styles.star}>★</RNText>
      </RNText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'flex-start',
  },
  text: {
    fontFamily: fonts.display,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.text,
  },
  misprint: {
    position: 'absolute',
    left: 2,
    right: -2,
    top: 2,
    color: colors.brand,
  },
  star: {
    color: colors.brandInk,
  },
});
