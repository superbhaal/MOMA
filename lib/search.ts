/**
 * Fold a string down to what a search should actually compare: lower case, no
 * accents. Someone typing "cafe" or "nuria" should reach "Café" and "Núria" —
 * on a phone keyboard the accented form is the harder one to produce.
 */
export function foldForSearch(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * True when every whitespace-separated term in `query` appears somewhere in
 * `haystack`. Terms are ANDed and order-independent, so "sleep newborn" finds
 * "Why newborn sleep cycles differ" — which a single-substring match misses.
 */
export function matchesQuery(query: string, haystack: (string | null | undefined)[]): boolean {
  const terms = foldForSearch(query).split(/\s+/).filter(Boolean);
  if (!terms.length) return true;
  const hay = foldForSearch(haystack.filter(Boolean).join(' '));
  return terms.every((t) => hay.includes(t));
}
