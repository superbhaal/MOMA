import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { colors } from '@/constants/colors';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'CormorantGaramond-Light': require('../assets/fonts/CormorantGaramond-Light.ttf'),
    'CormorantGaramond-Regular': require('../assets/fonts/CormorantGaramond-Regular.ttf'),
    'CormorantGaramond-SemiBold': require('../assets/fonts/CormorantGaramond-SemiBold.ttf'),
    'CormorantGaramond-LightItalic': require('../assets/fonts/CormorantGaramond-LightItalic.ttf'),
    'DMSans-Regular': require('../assets/fonts/DMSans-Regular.ttf'),
    'DMSans-Medium': require('../assets/fonts/DMSans-Medium.ttf'),
    'DMSans-SemiBold': require('../assets/fonts/DMSans-SemiBold.ttf'),
    'Lora-Regular': require('../assets/fonts/Lora-Regular.ttf'),
    'Lora-Italic': require('../assets/fonts/Lora-Italic.ttf'),
  });

  const { isAuthenticated, isOnboarded, authLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // Latch: once the initial auth check completes, never unmount the Stack again.
  // Subsequent authLoading toggles (during sign-in/sign-up actions) must not
  // remount the navigator — that would wipe the user's current screen and reset
  // them to the (auth) stack's initial route (welcome.tsx).
  const [bootDone, setBootDone] = useState(false);
  useEffect(() => {
    if (!authLoading && fontsLoaded) setBootDone(true);
  }, [authLoading, fontsLoaded]);

  useEffect(() => {
    if (fontError) throw fontError;
  }, [fontError]);

  useEffect(() => {
    if (fontsLoaded && !authLoading) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, authLoading]);

  useEffect(() => {
    if (!fontsLoaded || authLoading) return;

    const inAuth = segments[0] === '(auth)';
    const inOnboarding = inAuth && segments[1] === 'onboarding';

    console.log('[AuthGate] eval', {
      segments,
      isAuthenticated,
      isOnboarded,
      authLoading,
      inAuth,
      inOnboarding,
    });

    // Skip transient empty-segments state. Expo Router emits segments=[] briefly
    // during native modal flows.
    if (!segments[0]) {
      console.log('[AuthGate] skip (empty segments)');
      return;
    }

    if (!isAuthenticated) {
      if (!inAuth || inOnboarding) {
        console.log('[AuthGate] → /welcome');
        router.replace('/(auth)/welcome');
      }
    } else if (!isOnboarded) {
      if (!inOnboarding) {
        console.log('[AuthGate] → /onboarding/resume');
        router.replace('/(auth)/onboarding/resume');
      }
    } else if (inAuth) {
      // Authenticated AND onboarded but still somewhere in the (auth) stack.
      // Pull them into the app — this includes the onboarding sub-stack, so an
      // onboarded user who momentarily got routed to resume/profile (e.g. a
      // transient empty profile read on cold boot) is recovered instead of
      // being stranded on the onboarding screens. The `final` celebration
      // screen is the one onboarding route an onboarded user may legitimately
      // sit on (it routes itself to /(tabs)), so leave that alone.
      const onFinal = segments[1] === 'onboarding' && segments[2] === 'final';
      if (!onFinal) {
        console.log('[AuthGate] → /(tabs)');
        router.replace('/(tabs)');
      }
    }
  }, [isAuthenticated, isOnboarded, authLoading, fontsLoaded, segments, router]);

  if (!bootDone) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.white,
        }}
      >
        <ActivityIndicator size="large" color={colors.cobalt} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="group" />
        <Stack.Screen name="member/[userId]" />
        <Stack.Screen name="preferences" options={{ presentation: 'modal' }} />
        <Stack.Screen name="availability" options={{ presentation: 'modal' }} />
        <Stack.Screen name="group-preview" options={{ presentation: 'modal' }} />
        <Stack.Screen name="profile/edit" options={{ presentation: 'modal' }} />
        <Stack.Screen name="settings/notifications" />
        <Stack.Screen name="settings/privacy" />
        <Stack.Screen name="settings/help" />
      </Stack>
    </SafeAreaProvider>
  );
}
