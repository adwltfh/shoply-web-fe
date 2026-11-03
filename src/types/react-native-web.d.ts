import 'react-native';

declare module 'react-native' {
  /** React Native for Web also reports hover and keyboard focus to Pressable style callbacks. */
  interface PressableStateCallbackType {
    hovered?: boolean;
    focused?: boolean;
  }

  /** React Native for Web renders `role="heading"` with `aria-level` as <h1>–<h6>. */
  interface TextProps {
    'aria-level'?: 1 | 2 | 3 | 4 | 5 | 6;
  }
}
