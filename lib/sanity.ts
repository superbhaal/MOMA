import type { LearnArticle, LearnDoc, LearnRecommendation, LearnReel } from '@/types';

const PROJECT_ID = process.env.EXPO_PUBLIC_SANITY_PROJECT_ID!;
// Falls back to the test dataset, not the real one: a missing variable means
// a misconfigured build, and the harm of showing invented articles in a build
// that should have shown none is smaller than the reverse. It used to fall
// back to 'production', which stopped existing when that dataset was renamed.
const DATASET = process.env.EXPO_PUBLIC_SANITY_DATASET || 'dev';
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

/**
 * One Learn document, in the reader's language when it exists.
 *
 * A shared link carries an id, and each piece exists once per language — so a
 * link sent by a French mother used to open in French for a Spanish reader,
 * and every link opened in English for everyone once the app started sharing
 * the English original. The id in the URL identifies the piece; the language
 * is the reader's, not the sender's.
 *
 * One round trip: the group is `_id == $id` (the original, or a legacy link
 * that names a translation directly) plus everything that declares it as its
 * `translationOf`. Falls back to the requested document, then to whatever the
 * group holds, so a piece with no translation still opens.
 */
export async function fetchLearnDoc(id: string, lang = 'en'): Promise<LearnDoc | null> {
  const group = await sanityFetch<LearnDoc[]>(
    `*[_id == $id || translationOf == $id]`,
    { id },
  );
  if (!group?.length) return null;

  const requested = group.find((d) => d._id === id) ?? null;

  // A link that names a translation (learn-x-es) reaches only itself here:
  // its siblings hang off the base id, not off it. Resolve from the base.
  const base = requested?.translationOf;
  if (base && (requested?.language ?? 'en') !== lang) {
    return fetchLearnDoc(base, lang);
  }

  return (
    group.find((d) => (d.language ?? 'en') === lang) ?? requested ?? group[0]
  );
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

/**
 * The id a like is stored under.
 *
 * Each Learn piece exists once per language — `learn-four-month-sleep`,
 * `-fr`, `-es` — so storing `_id` would make a like language-specific: she
 * hearts an article in Spanish, switches the app to French, and her filter
 * comes back empty. The English original is the identity of the piece, and
 * every translation names it in `translationOf`.
 */
export function learnSaveId(doc: { _id: string; translationOf?: string }): string {
  return doc.translationOf || doc._id;
}
