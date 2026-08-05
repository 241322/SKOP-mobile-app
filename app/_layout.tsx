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
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { SkopColors } from '@/constants/skop-theme';
import { AuthProvider, useAuth } from '@/context/auth';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { SkopSessionProvider, useSkopSession } from '@/context/skop-session';

// keeps the splash screen open while the fonts load
SplashScreen.preventAutoHideAsync();

// keeps the tabs behind screens that open on top
export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const baseTheme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;
  const navigationTheme = {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      background: SkopColors.background,
      card: SkopColors.background,
    },
  };

  // loads each font used by the skop theme
  const [fontsLoaded] = useFonts({
    BricolageGrotesque_400Regular,
    BricolageGrotesque_600SemiBold,
    BricolageGrotesque_800ExtraBold,
    BitcountGridDouble_400Regular,
    BitcountGridSingle_400Regular,
  });

  // the native root stays cream while screens mount and change
  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(SkopColors.background);
  }, []);

  if (!fontsLoaded) return null;

  return (
    <AuthProvider>
      {/* shares the streak and game score with every screen */}
      <SkopSessionProvider>
        <ThemeProvider value={navigationTheme}>
          <RootNavigator />
          <StatusBar style="dark" />
        </ThemeProvider>
      </SkopSessionProvider>
    </AuthProvider>
  );
}

function RootNavigator() {
  const { loading, user } = useAuth();
  const { profileLoading, quitPlan } = useSkopSession();
  const appLoading = loading || profileLoading;

  // keeps the splash screen up while firebase and the quit plan load
  useEffect(() => {
    if (!appLoading) SplashScreen.hideAsync();
  }, [appLoading]);

  if (appLoading) return null;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: SkopColors.background } }}>
      {/* the main app needs both a firebase user and a quit plan */}
      <Stack.Protected guard={Boolean(user && quitPlan)}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="urge" options={{ animation: 'fade' }} />
        <Stack.Screen name="settings" />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal', headerShown: true }} />
      </Stack.Protected>

      {/* new users finish these two steps before opening the app */}
      <Stack.Protected guard={Boolean(user && !quitPlan)}>
        <Stack.Screen name="onboarding" />
      </Stack.Protected>

      {/* these screens are only needed while signed out */}
      <Stack.Protected guard={!user}>
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
      </Stack.Protected>
    </Stack>
  );
}
