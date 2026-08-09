import { uploadImage } from './uploadImage';

/**
 * Upload a locally-picked image to the `avatars` bucket and return its public
 * URL. Thin wrapper over `uploadImage` — spot photos land in a different
 * bucket by the same rules, and one of them was enough.
 */
export async function uploadAvatar(
  userId: string,
  localUri: string,
): Promise<{ url: string | null; error: string | null }> {
  return uploadImage('avatars', userId, localUri);
}
