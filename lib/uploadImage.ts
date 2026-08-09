import { supabase } from './supabase';

const CONTENT_TYPES: Record<string, string> = {
  png: 'image/png',
  webp: 'image/webp',
  heic: 'image/heic',
  heif: 'image/heic',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
};

/**
 * Upload a locally-picked image (a URI from expo-image-picker) to a public
 * Storage bucket and return its public URL.
 *
 * The path is namespaced under the user's auth id, because every bucket policy
 * in this project keys on the first folder segment being `auth.uid()`. The
 * timestamp busts the CDN when the same user re-uploads.
 *
 * Returns the error rather than throwing: an upload that fails should leave the
 * user on their form with a sentence, not unwind the screen.
 */
export async function uploadImage(
  bucket: string,
  userId: string,
  localUri: string,
): Promise<{ url: string | null; error: string | null }> {
  try {
    const resp = await fetch(localUri);
    const blob = await resp.blob();
    // Two hops rather than blob.arrayBuffer(): React Native's Blob doesn't
    // implement that method, and Response does.
    const arrayBuffer = await new Response(blob).arrayBuffer();

    const ext = localUri.split('.').pop()?.toLowerCase() || 'jpg';
    const contentType = CONTENT_TYPES[ext] ?? 'image/jpeg';

    const path = `${userId}/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, arrayBuffer, { contentType, upsert: false });

    if (uploadError) return { url: null, error: uploadError.message };

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return { url: data.publicUrl, error: null };
  } catch (e: any) {
    return { url: null, error: e?.message ?? 'Upload failed' };
  }
}
