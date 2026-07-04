import {
  DarkTheme,
  DefaultTheme,
  Stack,
  ThemeProvider,
  useRouter,
  useSegments,
} from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { Colors, Fonts } from '@/constants/theme';
import { AuthProvider, useAuth } from '@/lib/auth';
import { useColorScheme } from '@/hooks/use-color-scheme';

/**
 * Routing gate. Live mode redirects signed-out users to /sign-in and bounces
 * signed-in users off it; demo mode (requiresAuth === false) never redirects.
 */
function RootNavigator() {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  const palette = dark ? Colors.dark : Colors.light;
  const { requiresAuth, ready, session } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!requiresAuth || !ready) return;
    const onSignIn = segments[0] === 'sign-in';
    if (!session && !onSignIn) router.replace('/sign-in');
    else if (session && onSignIn) router.replace('/');
  }, [requiresAuth, ready, session, segments, router]);

  const navTheme = {
    ...(dark ? DarkTheme : DefaultTheme),
    colors: {
      ...(dark ? DarkTheme : DefaultTheme).colors,
      primary: palette.rose,
      background: palette.background,
      card: palette.backgroundElement,
      text: palette.text,
      border: palette.line,
      notification: palette.rose,
    },
  };

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.background }}>
        <ActivityIndicator color={palette.rose} />
      </View>
    );
  }

  return (
    <ThemeProvider value={navTheme}>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="sign-in" options={{ headerShown: false }} />
        <Stack.Screen
          name="new-trip"
          options={{
            presentation: 'modal',
            title: 'Where to next?',
            headerTitleStyle: { fontFamily: Fonts?.serif },
          }}
        />
        <Stack.Screen
          name="scan"
          options={{ title: 'Scan a garment', headerTitleStyle: { fontFamily: Fonts?.serif } }}
        />
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}
