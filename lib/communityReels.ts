import type { TFunction } from 'i18next';
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

export async function fetchCommunityReels(
  babyStage: string | undefined,
  t: TFunction,
): Promise<LearnReel[]> {
  const { data, error } = await supabase.rpc('community_reels_feed', {
    p_stage: babyStage ?? null,
  });
  if (error) throw new Error(error.message);
  return ((data ?? []) as FeedRow[]).map((row) => toLearnReel(row, t));
}

// The last-resort title when a shared reel has no title, note or creator —
// visible on the card, so it follows the reading language.
function toLearnReel(row: FeedRow, t: TFunction): LearnReel {
  return {
    _id: `${COMMUNITY_ID_PREFIX}${row.id}`,
    _type: 'learnReel',
    // Her words lead, on both platforms. "Why this one" is required now, so
    // this is filled for anything shared from here on; the fallbacks are for
    // the rows posted before that rule, which can have nothing but a link.
    title:
      row.note ||
      row.title ||
      row.creator_label ||
      t('dis.sharedFrom', { platform: row.platform === 'tiktok' ? 'TikTok' : 'Instagram' }),
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
      // Only TikTok hands us a caption. On Instagram this stays null and the
      // card's quote disappears rather than echoing the line just above it —
      // which is exactly what it used to do.
      caption: row.platform === 'tiktok' ? row.title : null,
    },
  };
}
