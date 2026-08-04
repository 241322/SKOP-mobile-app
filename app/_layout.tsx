import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import {
  BricolageGrotesque_400Regular,
  BricolageGrotesque_600SemiBold,
  BricolageGrotesque_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/bricolage-grotesque';
import { BitcountGridDouble_400Regular } from '@expo-google-fonts/bitcount-grid-double';
import { BitcountGridSingle_400Regular } from '@expo-google-fonts/bitcount-grid-single';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { SkopSessionProvider } from '@/context/skop-session';

// keeps the splash screen open while the fonts load
SplashScreen.preventAutoHideAsync();

// keeps the tabs behind screens that open on top
export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  // loads each font used by the skop theme
  const [fontsLoaded] = useFonts({
    BricolageGrotesque_400Regular,
    BricolageGrotesque_600SemiBold,
    BricolageGrotesque_800ExtraBold,
    BitcountGridDouble_400Regular,
    BitcountGridSingle_400Regular,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    // shares the streak and game score with every screen
    <SkopSessionProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        {/* lists the screens outside the tab navigator */}
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="urge" options={{ animation: 'fade' }} />
          <Stack.Screen name="settings" />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal', headerShown: true }} />
        </Stack>
        <StatusBar style="dark" />
      </ThemeProvider>
    </SkopSessionProvider>
  );
}
