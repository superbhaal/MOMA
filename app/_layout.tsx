import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, LogBox, Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Asset } from 'expo-asset';
import { useFonts } from 'expo-font';
import { Stack, useRootNavigationState, useRouter, useSegments } from 'expo-router';
import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';
import { applyProfileLanguage, initI18n } from '@/lib/i18n';
import { EnvBadge } from '@/components/ui/EnvBadge';
import { Typography } from '@/components/ui/Typography';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { registerAndSaveToken, routeFromNotificationData } from '@/lib/notifications';
import { colors } from '@/constants/colors';
import { ILLUSTRATION_SOURCES } from '@/components/ui/Illustration';
import { debugLog } from '@/lib/log';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

// A stored session whose account was deleted server-side (e.g. a dev DB purge)
// makes supabase-js throw "Invalid Refresh Token" on boot while it auto-refreshes.
// useAuth already handles this correctly (signs out → routes to /welcome); this
// only silences the dev-only LogBox overlay so it doesn't fire on every purge.
LogBox.ignoreLogs([/Invalid Refresh Token/, /Refresh Token Not Found/]);

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

  // Warm the drawings alongside the fonts, so a screen never renders its text
  // first and its illustration a beat later.
  // Translations are part of the boot gate, not an afterthought: a screen that
  // renders before i18n is ready shows raw keys for a frame.
  const [i18nReady, setI18nReady] = useState(false);
  useEffect(() => {
    initI18n().finally(() => setI18nReady(true));
  }, []);

  const [illosLoaded, setIllosLoaded] = useState(false);
  useEffect(() => {
    // Capped: a drawing still renders on demand, so a slow dev server must
    // never be able to hold the splash screen hostage.
    const done = () => setIllosLoaded(true);
    const timer = setTimeout(done, 2500);
    Asset.loadAsync(Object.values(ILLUSTRATION_SOURCES))
      .catch(() => {})
      .finally(() => {
        clearTimeout(timer);
        done();
      });
    return () => clearTimeout(timer);
  }, []);

  const { t } = useTranslation();
  const {
    user,
    isAuthenticated,
    isOnboarded,
    authLoading,
    passwordRecovery,
    profileUnreachable,
    retryProfile,
  } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // Register the Expo push token once the user is authenticated AND onboarded.
  // Guarded so it runs a single time per session per user id.
  const registeredFor = useRef<string | null>(null);
  useEffect(() => {
    if (isAuthenticated && isOnboarded && user?.id && registeredFor.current !== user.id) {
      registeredFor.current = user.id;
      registerAndSaveToken(user.id);
    }
    if (!isAuthenticated) registeredFor.current = null;
  }, [isAuthenticated, isOnboarded, user?.id]);

  // Notification taps are only CAPTURED here — never navigated on the spot.
  // On a cold start this effect runs while bootDone is still false, so the
  // <Stack> below has not mounted and a router.push would be thrown away,
  // stranding the user on the boot spinner. That was the bug: tapping a DM
  // notification with møma closed opened a frozen screen, while the same tap
  // from the background worked because the navigator was already up.
  const [pendingTap, setPendingTap] = useState<Notifications.NotificationResponse | null>(null);
  useEffect(() => {
    let cancelled = false;
    // Cold start: the tap that launched the app.
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!cancelled && response) setPendingTap(response);
    });
    // Warm: taps while the app is alive.
    const sub = Notifications.addNotificationResponseReceivedListener(setPendingTap);
    return () => {
      cancelled = true;
      sub.remove();
    };
  }, []);

  // Latch: once the initial auth check completes, never unmount the Stack again.
  // Subsequent authLoading toggles (during sign-in/sign-up actions) must not
  // remount the navigator — that would wipe the user's current screen and reset
  // them to the (auth) stack's initial route (welcome.tsx).
  const [bootDone, setBootDone] = useState(false);
  useEffect(() => {
    if (!authLoading && fontsLoaded) setBootDone(true);
  }, [authLoading, fontsLoaded]);

  // ...and dispatched here, once there is somewhere to navigate to. Three
  // conditions have to hold: the navigator is mounted (rootNavState.key), boot
  // is finished, and the auth gate has settled — otherwise the gate's own
  // router.replace would immediately overwrite the deep link.
  const rootNavState = useRootNavigationState();
  const handledTaps = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!pendingTap || !rootNavState?.key || !bootDone || authLoading) return;
    // A signed-out or half-onboarded user has no business being deep-linked
    // into a chat. Hold the tap: the gate takes her where she needs to go, and
    // this fires the moment she is through.
    if (!isAuthenticated || !isOnboarded) return;

    // The cold-start response and the listener can both deliver the same tap.
    const id = pendingTap.notification.request.identifier;
    if (handledTaps.current.has(id)) {
      setPendingTap(null);
      return;
    }
    handledTaps.current.add(id);
    routeFromNotificationData(
      pendingTap.notification.request.content.data as Record<string, unknown>,
      router,
    );
    setPendingTap(null);
  }, [pendingTap, rootNavState?.key, bootDone, authLoading, isAuthenticated, isOnboarded, router]);

  // Step 2 of the language chain, once the profile lands. It backs off if she
  // has already chosen on this device, so this can fire freely on every load.
  useEffect(() => {
    if (!i18nReady || !user) return;
    applyProfileLanguage(user);
  }, [i18nReady, user?.locale, user?.primary_language]);

  useEffect(() => {
    if (fontError) throw fontError;
  }, [fontError]);

  useEffect(() => {
    if (fontsLoaded && illosLoaded && i18nReady && !authLoading) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, illosLoaded, i18nReady, authLoading]);

  useEffect(() => {
    if (!fontsLoaded || authLoading) return;

    const inAuth = segments[0] === '(auth)';
    const inOnboarding = inAuth && segments[1] === 'onboarding';

    debugLog('[AuthGate] eval', {
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
      debugLog('[AuthGate] skip (empty segments)');
      return;
    }

    // A recovery link signs her in BEFORE she has chosen a new password, so
    // every branch below would happily wave her through to Home with the
    // password she has forgotten still in force. This wins over all of them,
    // and only updatePassword() releases it.
    // The session is valid, the profile just would not load. Routing on that
    // would either strand her in onboarding or sign her out — both wrong, both
    // shipped at some point. Hold, and offer a retry instead.
    if (profileUnreachable) return;

    if (passwordRecovery) {
      if (segments[1] !== 'reset-password') {
        debugLog('[AuthGate] → /reset-password');
        router.replace('/(auth)/reset-password');
      }
      return;
    }

    if (!isAuthenticated) {
      if (!inAuth || inOnboarding) {
        debugLog('[AuthGate] → /welcome');
        router.replace('/(auth)/welcome');
      }
    } else if (!isOnboarded) {
      if (!inOnboarding) {
        debugLog('[AuthGate] → /onboarding/resume');
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
        debugLog('[AuthGate] → /(tabs)');
        router.replace('/(tabs)');
      }
    }
  }, [isAuthenticated, isOnboarded, authLoading, fontsLoaded, segments, router, passwordRecovery, profileUnreachable]);

  const centred = {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.white,
    paddingHorizontal: 32,
  };

  // Session intact, profile unreachable. Say so and offer the retry, rather
  // than spinning forever or guessing a route.
  if (profileUnreachable) {
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <View style={centred}>
          <Typography variant="displayMItal" color={colors.cobalt} style={{ textAlign: 'center', marginBottom: 12 }}>
            {t('auth.offlineTitle')}
          </Typography>
          <Typography variant="bodyL" color={colors.mutedStrong} style={{ textAlign: 'center', marginBottom: 28 }}>
            {t('auth.offlineBody')}
          </Typography>
          <Pressable onPress={retryProfile} hitSlop={12}>
            <Typography variant="bodyL" color={colors.cobalt}>
              {t('auth.offlineRetry')}
            </Typography>
          </Pressable>
        </View>
      </SafeAreaProvider>
    );
  }

  if (!bootDone) {
    return (
      <View style={centred}>
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
        <Stack.Screen name="brought/new" options={{ presentation: 'modal' }} />
        <Stack.Screen name="brought/[userId]" />
        <Stack.Screen name="settings/language" />
        <Stack.Screen name="settings/notifications" />
        <Stack.Screen name="settings/privacy" />
        <Stack.Screen name="settings/help" />
      </Stack>
      {/* After the Stack, so it floats above every screen. Renders nothing at
          all unless the app is pointed at the dev backend. */}
      <EnvBadge />
    </SafeAreaProvider>
  );
}
