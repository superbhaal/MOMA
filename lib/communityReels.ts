import { supabase } from '@/lib/supabase';
import { colors } from '@/constants/colors';
import type { LearnReel } from '@/types';

/**
 * The community half of the Watch feed. Editorial reels come from Sanity; these
 * come from contributors posting inside the app (`community_reels`, 023).
 *
 * They surface as `LearnReel`s rather than a type of their own, so the card,
 * the search matcher and the save-heart all work on them unchanged. What marks
 * them is the `community` field — the poster and their note, which no editorial
 * reel has.
 *
 * Read through the `community_reels_feed` RPC (024), not a plain select: the
 * poster is almost never in a shared group with the reader, and `users` RLS
 * would return a null name for every card.
 */

interface FeedRow {
  id: string;
  poster_id: string;
  platform: 'instagram' | 'tiktok';
  external_url: string;
  title: string | null;
  thumbnail_url: string | null;
  duration_sec: number | null;
  creator_label: string | null;
  note: string | null;
  baby_stages: string[] | null;
  thumbnail_hex: string | null;
  created_at: string;
  poster_name: string | null;
  poster_color: string | null;
}

/** Prefixed so a community id can never collide with a Sanity _id — saved_tips
 *  keys on it, and the two id spaces are independent. */
export const COMMUNITY_ID_PREFIX = 'community:';

export async function fetchCommunityReels(babyStage?: string): Promise<LearnReel[]> {
  const { data, error } = await supabase.rpc('community_reels_feed', {
    p_stage: babyStage ?? null,
  });
  if (error) throw new Error(error.message);
  return ((data ?? []) as FeedRow[]).map(toLearnReel);
}

function toLearnReel(row: FeedRow): LearnReel {
  return {
    _id: `${COMMUNITY_ID_PREFIX}${row.id}`,
    _type: 'learnReel',
    // Three fallbacks deep, because on Instagram all three can be missing: we
    // can't read a title, and both "who's it from" and "why this one" are
    // optional. A card with only a platform name still says a mom you trust
    // saved this, which is the whole proposition on this side of the feed.
    title:
      row.title ||
      row.note ||
      row.creator_label ||
      `Shared from ${row.platform === 'tiktok' ? 'TikTok' : 'Instagram'}`,
    platform: row.platform,
    externalUrl: row.external_url,
    thumbnailHex: row.thumbnail_hex || colors.lavender,
    thumbnailUrl: row.thumbnail_url,
    durationSec: row.duration_sec ?? 0,
    // Empty rather than a placeholder name: the card hides the creator row
    // outright instead of showing an avatar for nobody.
    creatorName: row.creator_label ?? '',
    creatorHandle: '',
    credential: '',
    babyStage: row.baby_stages?.[0] ?? '',
    category: '',
    publishedAt: row.created_at,
    community: {
      id: row.id,
      posterId: row.poster_id,
      posterName: row.poster_name,
      note: row.note,
    },
  };
}
