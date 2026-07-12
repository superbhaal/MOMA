import { supabase } from './supabase';

/**
 * Upload a locally-picked image (URI from expo-image-picker) to the `avatars`
 * Storage bucket and return the public URL. The path is namespaced under the
 * user's auth ID so the RLS policy allows it; a timestamp suffix busts CDN
 * caches when the user re-uploads.
 */
export async function uploadAvatar(
  userId: string,
  localUri: string,
): Promise<{ url: string | null; error: string | null }> {
  try {
    const resp = await fetch(localUri);
    const blob = await resp.blob();
    const arrayBuffer = await new Response(blob).arrayBuffer();

    const ext = localUri.split('.').pop()?.toLowerCase() || 'jpg';
    const contentType =
      ext === 'png' ? 'image/png' :
      ext === 'webp' ? 'image/webp' :
      ext === 'heic' ? 'image/heic' :
      'image/jpeg';

    const path = `${userId}/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, arrayBuffer, { contentType, upsert: false });

    if (uploadError) return { url: null, error: uploadError.message };

    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    return { url: data.publicUrl, error: null };
  } catch (e: any) {
    return { url: null, error: e?.message ?? 'Upload failed' };
  }
}
