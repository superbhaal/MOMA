import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface ReelMeta {
  platform: 'instagram' | 'tiktok' | null;
  /** The link with tracking params stripped — what gets stored and deduped on. */
  url: string | null;
  title: string | null;
  creatorLabel: string | null;
  thumbnailUrl: string | null;
  /** True when the platform answered. False for Instagram, always. */
  resolved: boolean;
}

export interface NewCommunityReel {
  platform: 'instagram' | 'tiktok';
  externalUrl: string;
  /** Optional — the card falls back to the poster's note, then the platform. */
  creatorLabel: string | null;
  note: string | null;
  babyStages: string[];
  title: string | null;
  thumbnailUrl: string | null;
  thumbnailHex: string | null;
}

/**
 * Resolve a pasted link, then publish it to the Watch feed.
 *
 * RLS (023) enforces the permission model server-side: the insert only succeeds
 * for a contributor/admin posting as themselves. Errors are returned as
 * sentences a poster can act on — the composer keeps them on the form with
 * their input intact rather than dropping the sheet.
 */
export function useCreateReel() {
  const [resolving, setResolving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Best-effort. A link we can't resolve is still a link worth sharing, so
   *  this never throws — the manual fields carry the card. */
  async function resolve(url: string): Promise<ReelMeta | null> {
    setResolving(true);
    try {
      const { data, error: err } = await supabase.functions.invoke('reel-oembed', {
        body: { url },
      });
      if (err) return null;
      return data as ReelMeta;
    } catch {
      return null;
    } finally {
      setResolving(false);
    }
  }

  async function create(input: NewCommunityReel): Promise<string> {
    setSubmitting(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSubmitting(false);
      const msg = 'You need to be signed in to share.';
      setError(msg);
      throw new Error(msg);
    }

    const { data, error: err } = await supabase
      .from('community_reels')
      .insert({
        poster_id: user.id,
        platform: input.platform,
        external_url: input.externalUrl,
        creator_label: input.creatorLabel,
        note: input.note,
        baby_stages: input.babyStages,
        title: input.title,
        thumbnail_url: input.thumbnailUrl,
        thumbnail_hex: input.thumbnailHex,
      })
      .select('id')
      .single();

    setSubmitting(false);

    if (err || !data) {
      // 23505 is the UNIQUE(external_url) — not a failure so much as a fact,
      // and one the poster deserves in plain words.
      const msg =
        err?.code === '23505'
          ? 'Someone already shared this one — it’s in the feed.'
          : 'Couldn’t share it — please try again.';
      setError(msg);
      throw new Error(err?.message ?? msg);
    }

    return data.id as string;
  }

  return { resolve, create, resolving, submitting, error, setError };
}
