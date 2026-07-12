import { Linking } from 'react-native';

/**
 * Open an Instagram profile: try the native app first, fall back to the web.
 * On iOS, `canOpenURL('instagram://')` requires `LSApplicationQueriesSchemes`
 * to include 'instagram' in app.json — already configured.
 */
export async function openInstagramProfile(handle: string | null | undefined) {
  if (!handle) return;
  const clean = handle.trim().replace(/^@/, '');
  if (!clean) return;
  const appUrl = `instagram://user?username=${clean}`;
  const webUrl = `https://instagram.com/${clean}`;
  try {
    const canOpenApp = await Linking.canOpenURL(appUrl);
    await Linking.openURL(canOpenApp ? appUrl : webUrl);
  } catch {
    await Linking.openURL(webUrl);
  }
}
