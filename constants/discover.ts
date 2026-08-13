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
export const PLACE_CATEGORIES: { value: PlaceCategory; label: string }[] = [
  { value: 'cafes', label: 'Café' },
  { value: 'restaurants', label: 'Restaurant' },
  { value: 'parks', label: 'Park' },
  { value: 'playgrounds', label: 'Playground' },
  { value: 'classes', label: 'Class' },
  { value: 'baby_shops', label: 'Baby & kids' },
  { value: 'mom_shops', label: 'For mom' },
  { value: 'wellness', label: 'Spa & massage' },
  { value: 'stays', label: 'Family stay' },
];

// The v11 composer names eight kinds of practitioner where this list had five.
// "Physios" is gone, replaced by the narrower "Pelvic floor" the mockup asks
// for — no row had ever used it, so nothing was orphaned.
export const PERSON_CATEGORIES: { value: PersonCategory; label: string }[] = [
  { value: 'pediatricians', label: 'Pediatrician' },
  { value: 'gynecologists', label: 'Gynecologist' },
  { value: 'midwives_doulas', label: 'Midwife & doula' },
  { value: 'lactation', label: 'Lactation consultant' },
  { value: 'therapists', label: 'Therapist' },
  { value: 'pelvic_floor', label: 'Pelvic floor' },
  { value: 'dentists', label: 'Dentist (kids)' },
  { value: 'daycare', label: 'Daycare' },
  { value: 'nannies', label: 'Nanny' },
];

/** Chip row for a mode, with the leading "All" chip. */
export function categoryChips(kind: LovedKind): CategoryChip[] {
  const set = kind === 'place' ? PLACE_CATEGORIES : PERSON_CATEGORIES;
  return [{ value: 'all', label: 'All' }, ...set];
}

/**
 * The stage taxonomy as chips — "who is this for?" when sharing, where the
 * answer is plural and has to fit on a phone. Same `value` codes as the Stage
 * filter and Sanity's `babyStage`; shorter labels, because a chip is read at a
 * glance and a filter row is read once.
 */
export const STAGE_CHIP_GROUPS: { group: string; rows: { value: string; label: string }[] }[] = [
  {
    group: 'Pregnancy',
    rows: [
      { value: 'T1', label: '1st tri' },
      { value: 'T2', label: '2nd tri' },
      { value: 'T3', label: '3rd tri' },
    ],
  },
  {
    group: 'Baby',
    rows: [
      { value: '0-4wks', label: '0–4 wks' },
      { value: '1-3mo', label: '1–3 mo' },
      { value: '3-6mo', label: '3–6 mo' },
      { value: '6-12mo', label: '6–12 mo' },
    ],
  },
  {
    group: 'Toddler & up',
    rows: [
      { value: '1-2yr', label: '1–2 yr' },
      { value: '2-3yr', label: '2–3 yr' },
      { value: '3+yr', label: '3+ yr' },
    ],
  },
  // Not an age, and deliberately so — the client's call. Everything above
  // answers "how old is your baby"; this one answers "and what about you". It
  // shares the axis, which means a wellness piece won't surface under an age
  // filter and vice versa. Its own group keeps that legible.
  {
    group: 'For you',
    rows: [{ value: 'wellness', label: 'Wellness' }],
  },
];

const LABELS: Record<LovedCategory, string> = {
  cafes: 'Café',
  restaurants: 'Restaurant',
  parks: 'Park',
  playgrounds: 'Playground',
  classes: 'Class',
  baby_shops: 'Baby & kids',
  mom_shops: 'For mom',
  wellness: 'Spa & massage',
  stays: 'Family stay',
  pediatricians: 'Pediatrician',
  gynecologists: 'Gynecologist',
  midwives_doulas: 'Midwife & doula',
  lactation: 'Lactation consultant',
  therapists: 'Therapist',
  pelvic_floor: 'Pelvic floor',
  dentists: 'Dentist (kids)',
  daycare: 'Daycare',
  nannies: 'Nanny',
};

/** Singular, human label for a category — used on cards and the detail pill. */
export function categoryLabel(category: LovedCategory): string {
  return LABELS[category] ?? category;
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
const PIN_COLORS: Record<LovedCategory, string> = {
  cafes: '#00B8C8', // pool — the mint the client asked for, at pin strength
  restaurants: '#FF7A00', // orange
  parks: '#3E6B3A', // meadowMuted
  playgrounds: '#FFC800', // soleil
  classes: '#0038FF', // klein
  baby_shops: '#E8389C', // fuchsia
  mom_shops: '#E82030', // cherry
  wellness: '#9878C8', // lavender
  stays: '#8C2238', // blushMuted

  pediatricians: '#E8389C',
  gynecologists: '#9878C8',
  midwives_doulas: '#FF7A00',
  lactation: '#00B8C8',
  therapists: '#0038FF',
  pelvic_floor: '#E82030',
  dentists: '#FFC800',
  daycare: '#3E6B3A',
  nannies: '#8C2238',
};

export function categoryColor(category: LovedCategory): string {
  return PIN_COLORS[category] ?? '#111118';
}
