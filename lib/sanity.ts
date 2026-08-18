import type { LearnArticle, LearnDoc, LearnRecommendation, LearnReel } from '@/types';

const PROJECT_ID = process.env.EXPO_PUBLIC_SANITY_PROJECT_ID!;
const DATASET = process.env.EXPO_PUBLIC_SANITY_DATASET || 'production';
const API_VERSION = '2024-01-01';

const SANITY_API_URL = `https://${PROJECT_ID}.api.sanity.io/v${API_VERSION}/data/query/${DATASET}`;

export async function sanityFetch<T>(
  query: string,
  params?: Record<string, string | number | boolean | null | undefined>,
): Promise<T> {
  const searchParams = new URLSearchParams({ query });
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      // Skip undefined — JSON.stringify(undefined) is `undefined`, which
      // URLSearchParams coerces to the literal string "undefined" and Sanity
      // rejects with a 400. Pass `null` when you want a defined-but-empty param.
      if (value === undefined) return;
      searchParams.set(`$${key}`, JSON.stringify(value));
    });
  }

  const response = await fetch(`${SANITY_API_URL}?${searchParams.toString()}`);
  if (!response.ok) {
    throw new Error(`Sanity fetch failed: ${response.status} ${response.statusText}`);
  }
  const data = await response.json();
  return data.result as T;
}

// ──────────────────────────────────────────────────────────────
// Learn feed — discriminated union of three doc types
// ──────────────────────────────────────────────────────────────

// coalesce(language,"en") rather than language == $lang: documents seeded
// before the field existed carry no language at all, and they are English.
// Without the coalesce they would vanish from every feed, including English.
const LEARN_FEED_QUERY = `
  *[_type in ["learnArticle","learnReel","learnRecommendation"]
    && coalesce(language, "en") == $lang
    && (!defined($babyStage) || babyStage == $babyStage)
    && (!defined($format) || _type == $format)]
  | order(publishedAt desc)
  [0...50]
`;

export interface LearnFeedFilters {
  babyStage?: string; // T1 | T2 | ... | 3+yr
  format?: 'learnArticle' | 'learnReel' | 'learnRecommendation';
  /** Reading language. Defaults to English so a caller that forgets still works. */
  lang?: string;
}

export function fetchLearnFeed(filters: LearnFeedFilters = {}): Promise<LearnDoc[]> {
  // Always send both params (null when unfiltered): the query references
  // `$babyStage` / `$format` via defined(), so they must be provided.
  return sanityFetch<LearnDoc[]>(LEARN_FEED_QUERY, {
    babyStage: filters.babyStage ?? null,
    format: filters.format ?? null,
    lang: filters.lang ?? 'en',
  });
}

export function fetchLearnDoc(id: string): Promise<LearnDoc | null> {
  return sanityFetch<LearnDoc | null>(`*[_id == $id][0]`, { id });
}

// Convenience helpers if a screen wants a single format
export function fetchArticles(): Promise<LearnArticle[]> {
  return sanityFetch(`*[_type == "learnArticle"] | order(publishedAt desc)`);
}
export function fetchReels(): Promise<LearnReel[]> {
  return sanityFetch(`*[_type == "learnReel"] | order(publishedAt desc)`);
}
export function fetchRecommendations(): Promise<LearnRecommendation[]> {
  return sanityFetch(`*[_type == "learnRecommendation"] | order(publishedAt desc)`);
}
