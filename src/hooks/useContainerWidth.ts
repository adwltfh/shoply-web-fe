import { useCallback, useState } from 'react';
import type { LayoutChangeEvent } from 'react-native';

/**
 * Measures a view's own width (attach `onLayout`). `null` until the first layout,
 * so static HTML and the first client render use the narrow (mobile) layout,
 * then the view adapts — and keeps adapting as the window resizes.
 */
export function useContainerWidth() {
  const [width, setWidth] = useState<number | null>(null);
  const onLayout = useCallback((e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width), []);
  return { width, onLayout };
}
