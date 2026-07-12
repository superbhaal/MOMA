import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { Router } from 'expo-router';
import { supabase } from './supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Persisted flag so we don't re-prompt for permission on every launch once the
// user has declined. iOS only shows the system prompt once anyway, but this
// avoids the extra permission call and lets us short-circuit registration.
const PUSH_DENIED_KEY = 'push-permission-denied';

export async function registerForPushNotifications(): Promise<string | null> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  const tokenData = await Notifications.getExpoPushTokenAsync();
  return tokenData.data;
}

/**
 * Register for push and persist the Expo token on the user's row. Safe to call
 * on every authenticated launch: it no-ops if the user previously declined, and
 * re-upserts if the token rotated. Call once the user is authenticated AND
 * onboarded.
 */
export async function registerAndSaveToken(userId: string): Promise<void> {
  try {
    const denied = await SecureStore.getItemAsync(PUSH_DENIED_KEY);
    if (denied === '1') return;

    const token = await registerForPushNotifications();
    if (!token) {
      // Permission refused — remember it so we don't ask again next launch.
      await SecureStore.setItemAsync(PUSH_DENIED_KEY, '1');
      return;
    }
    await SecureStore.deleteItemAsync(PUSH_DENIED_KEY);

    const { error } = await supabase
      .from('users')
      .update({ expo_push_token: token })
      .eq('id', userId);
    if (error) console.log('[push] saveToken error', error.message);
  } catch (e: any) {
    console.log('[push] registerAndSaveToken failed', e?.message);
  }
}

/**
 * Clear the push token in the DB. Called on sign-out (while still authenticated,
 * so RLS allows the update) so a signed-out device stops receiving pushes.
 */
export async function clearPushTokenInDb(userId: string): Promise<void> {
  try {
    await supabase.from('users').update({ expo_push_token: null }).eq('id', userId);
  } catch (e: any) {
    console.log('[push] clearPushToken failed', e?.message);
  }
}

type NotificationData = {
  route?: string;
  type?: string;
  groupId?: string;
} & Record<string, unknown>;

/**
 * Resolve a notification's data payload to an in-app route and navigate.
 * Honors an explicit `route` (used by the availability/inactive prompts) and
 * otherwise maps the `type` discriminator (CLAUDE.md § Expo Push) to a screen.
 */
export function routeFromNotificationData(data: NotificationData | undefined, router: Router): void {
  if (!data) return;

  if (typeof data.route === 'string' && data.route.length > 0) {
    router.push(data.route as never);
    return;
  }

  const groupId = typeof data.groupId === 'string' ? data.groupId : undefined;
  switch (data.type) {
    case 'group_matched_preview':
    case 'group_matched_joined':
      router.push('/group-preview' as never);
      return;
    case 'new_message':
      if (groupId) router.push(`/group/${groupId}/chat` as never);
      return;
    case 'proposal_decided':
    case 'meetup_reminder':
      if (groupId) router.push(`/group/${groupId}` as never);
      return;
    default:
      return;
  }
}
