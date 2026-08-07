import { Alert, Linking } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

/**
 * Ask for photo-library access, and handle the dead end iOS creates.
 *
 * iOS only ever shows its permission dialog once: after a refusal,
 * `requestMediaLibraryPermissionsAsync` resolves denied without prompting, so a
 * screen that merely reports "we need permission" strands the person forever —
 * and the signup photo is required, which locked a tester out of finishing her
 * account. When the system won't ask again, we offer Settings instead.
 *
 * Returns true when the library is usable.
 */
export async function ensurePhotoPermission(): Promise<boolean> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (perm.granted) return true;

  // canAskAgain === false → the OS dialog will never appear again.
  if (!perm.canAskAgain) {
    Alert.alert(
      'Photo access is off',
      'møma needs access to your photos to set your picture. You can turn it on in Settings.',
      [
        { text: 'Not now', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings().catch(() => {}) },
      ],
    );
  }
  return false;
}
