import { Anton_400Regular, useFonts } from '@expo-google-fonts/anton';
import { DefaultTheme, Stack, ThemeProvider, type Theme } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { colors, fonts } from '@/design-system';
import { AppProviders } from '@/providers/AppProviders';

export { ErrorBoundary } from 'expo-router';

// Native: keep the splash up until the display font is ready (or failed).
// Web: never block — static HTML renders with the system font, then swaps.
if (Platform.OS !== 'web') {
  void SplashScreen.preventAutoHideAsync();
}

const navigationTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.brandInk,
    background: colors.canvas,
    card: colors.canvas,
    text: colors.text,
    border: colors.border,
  },
};

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({ Anton_400Regular });

  useEffect(() => {
    if (Platform.OS !== 'web' && (fontsLoaded || fontError)) {
      void SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  return (
    <AppProviders>
      <ThemeProvider value={navigationTheme}>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerTintColor: colors.text,
            headerShadowVisible: false,
            headerBackButtonDisplayMode: 'minimal',
            headerStyle: { backgroundColor: colors.canvas },
            headerTitleStyle: { fontFamily: fonts.display, fontSize: 20 },
            contentStyle: { backgroundColor: colors.canvas },
          }}>
          <Stack.Screen
            name="(tabs)"
            options={{ headerShown: false, title: 'Loose Thread Supply' }}
          />
          <Stack.Screen name="products/[slug]" options={{ title: 'Product' }} />
          <Stack.Screen name="checkout/index" options={{ title: 'Checkout' }} />
          <Stack.Screen
            name="checkout/success"
            options={{ title: 'Demo order placed', headerBackVisible: false, gestureEnabled: false }}
          />
          <Stack.Screen name="+not-found" options={{ title: 'Not found' }} />
        </Stack>
      </ThemeProvider>
    </AppProviders>
  );
}
