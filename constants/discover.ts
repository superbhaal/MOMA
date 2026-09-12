import type { TFunction } from 'i18next';

import type {
  LovedKind,
  LovedCategory,
  PlaceCategory,
  PersonCategory,
} from '@/types';

/**
 * Explore taxonomy. Category chip sets are scoped per mode (Places / People) —
 * switching mode swaps the whole row, so the two selections stay independent.
 * Codes match `loved_spots.category`; labels are the display strings.
 */

export interface CategoryChip {
  value: LovedCategory | 'all';
  label: string;
}

// "Shops" was one word doing three jobs — a mom looking for a nursing bra and a
// mom looking for a pram were sent to the same filter. Split, plus the three
// the client named: somewhere to sleep with a baby, somewhere to be looked
// after, and the two kinds of shopping.
export function placeCategories(t: TFunction): { value: PlaceCategory; label: string }[] {
  return [
    { value: 'cafes', label: t('expl.cafes') },
    { value: 'restaurants', label: t('expl.restaurants') },
    { value: 'parks', label: t('expl.parks') },
    { value: 'playgrounds', label: t('expl.playgrounds') },
    { value: 'classes', label: t('expl.classes') },
    { value: 'baby_shops', label: t('expl.baby_shops') },
    { value: 'mom_shops', label: t('expl.mom_shops') },
    { value: 'wellness', label: t('expl.wellness') },
    { value: 'stays', label: t('expl.stays') },
  ];
}

// The v11 composer names eight kinds of practitioner where this list had five.
// "Physios" is gone, replaced by the narrower "Pelvic floor" the mockup asks
// for — no row had ever used it, so nothing was orphaned.
export function personCategories(t: TFunction): { value: PersonCategory; label: string }[] {
  return [
    { value: 'pediatricians', label: t('expl.pediatricians') },
    { value: 'gynecologists', label: t('expl.gynecologists') },
    { value: 'midwives_doulas', label: t('expl.midwives_doulas') },
    { value: 'lactation', label: t('expl.lactation') },
    { value: 'therapists', label: t('expl.therapists') },
    { value: 'pelvic_floor', label: t('expl.pelvic_floor') },
    { value: 'dentists', label: t('expl.dentists') },
    { value: 'daycare', label: t('expl.daycare') },
    { value: 'nannies', label: t('expl.nannies') },
  ];
}

/** Chip row for a mode, with the leading "All" chip. */
export function categoryChips(kind: LovedKind, t: TFunction): CategoryChip[] {
  const set = kind === 'place' ? placeCategories(t) : personCategories(t);
  return [{ value: 'all', label: t('expl.all') }, ...set];
}

/**
 * The stage taxonomy as chips — "who is this for?" when sharing, where the
 * answer is plural and has to fit on a phone. Same `value` codes as the Stage
 * filter and Sanity's `babyStage`; shorter labels, because a chip is read at a
 * glance and a filter row is read once.
 *
 * A function, not a constant: as a module-level array it captured English at
 * import and never let go, so the whole group shipped untranslated inside an
 * otherwise Spanish sheet. Every list of copy in this codebase has to take t.
 */
export function stageChipGroups(
  t: TFunction,
): { group: string; rows: { value: string; label: string }[] }[] {
  return [
    {
      group: t('dis.pregnancy'),
      rows: [
        { value: 'T1', label: t('dis.cT1') },
        { value: 'T2', label: t('dis.cT2') },
        { value: 'T3', label: t('dis.cT3') },
      ],
    },
    {
      group: t('dis.baby'),
      rows: [
        { value: '0-4wks', label: t('dis.c04wks') },
        { value: '1-3mo', label: t('dis.c13mo') },
        { value: '3-6mo', label: t('dis.c36mo') },
        { value: '6-12mo', label: t('dis.c612mo') },
      ],
    },
    {
      group: t('dis.toddler'),
      rows: [
        { value: '1-2yr', label: t('dis.c12yr') },
        { value: '2-3yr', label: t('dis.c23yr') },
        { value: '3+yr', label: t('dis.c3yr') },
      ],
    },
    // Not an age, and deliberately so — the client's call. Everything above
    // answers "how old is your baby"; this one answers "and what about you". It
    // shares the axis, which means a wellness piece won't surface under an age
    // filter and vice versa. Its own group keeps that legible.
    {
      group: t('dis.forYou'),
      rows: [{ value: 'wellness', label: t('dis.cWellness') }],
    },
  ];
}


/** Singular, human label for a category — used on cards and the detail pill. */
export function categoryLabel(category: LovedCategory, t: TFunction): string {
  const key = `expl.${category}`;
  const label = t(key);
  // t() returns the key itself when it has no entry — fall back to the raw
  // category rather than showing 'expl.something' on a map pin.
  return label === key ? category : label;
}

/**
 * Pin colour per category, so a glance at the map answers "what is that?"
 * before you tap. Drawn from the bold half of the palette — the soft accents
 * are user-identity colours and disappear against Google's map tiles.
 *
 * Places and people never share a map, so the two sets are free to reuse hues.
 * Two rules the map imposes on the choice: parks take the DEEP green, because a
 * bright one lands on the green the map already draws there; and nothing takes
 * cobalt, which is reserved for "this one is yours".
 */
/**
 * One colour per category — eighteen of them, not nine.
 *
 * Places and people used to share the same nine: a paediatrician was the same
 * fuchsia as a baby shop, so the colour told you nothing you didn't already
 * know from the tab you were on. The two families now come from the two halves
 * of the palette, which also reads at a glance: a **bold** pin is a place, a
 * **soft** pin is a person.
 *
 * Places take the eight bold user colours. Parks take a deep green that is not
 * in the palette — the bold row has no green darker than lime, and a park
 * reading as anything else fights the map underneath it.
 *
 * People take the eight soft user colours plus pistachio, the brand green.
 * Ref: design/moma-palette.pdf.
 */
const PIN_COLORS: Record<LovedCategory, string> = {
  // ── Lieux · couleurs vives ────────────────────────────────────────────
  cafes: '#00B8C8', // pool
  restaurants: '#FF7A00', // orange
  parks: '#3E6B3A', // vert profond — le neuvième, hors palette
  playgrounds: '#FFC800', // soleil
  classes: '#0038FF', // klein
  baby_shops: '#E8389C', // fuchsia
  mom_shops: '#E82030', // cherry
  wellness: '#9878C8', // lavender
  stays: '#B8D830', // lime

  // ── Personnes · couleurs pâles ────────────────────────────────────────
  pediatricians: '#F4D1D1', // blush
  gynecologists: '#D8C8E8', // lavande
  midwives_doulas: '#FADCB8', // pêche
  lactation: '#C8E8D8', // menthe
  therapists: '#C8DCF0', // ciel
  pelvic_floor: '#F0C8D8', // rose
  dentists: '#F9F0A0', // citron
  daycare: '#D8E8C8', // pistachio
  nannies: '#E8DCD0', // sable
};

export function categoryColor(category: LovedCategory): string {
  return PIN_COLORS[category] ?? '#111118';
}

/**
 * A stage code as a reader-facing label — "3–6 months", her language.
 *
 * The article reader carried its own frozen Record of these in English, so a
 * Spanish reader opening a shared link met "SLEEP · 3–6 MONTHS" above Spanish
 * prose. Derived from stageChipGroups so the taxonomy is stated once: adding a
 * stage there is enough.
 */
export function stageLabel(code: string, t: TFunction): string | null {
  for (const group of stageChipGroups(t)) {
    const row = group.rows.find((r) => r.value === code);
    if (row) return row.label;
  }
  return null;
}

/**
 * A Learn category as a reader-facing label.
 *
 * Sanity carries these in English on every document, translations included —
 * the prose is translated, the taxonomy field is not. Rather than duplicate a
 * closed vocabulary across three datasets, the app translates it on the way
 * out. An unknown category falls through unchanged, so publishing a new one
 * never blanks a card.
 */
export function learnCategoryLabel(category: string | undefined, t: TFunction): string {
  if (!category) return '';
  const key = `dis.cat${category}`;
  const label = t(key);
  return label === key ? category : label;
}
