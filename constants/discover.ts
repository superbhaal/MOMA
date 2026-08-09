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

export const PLACE_CATEGORIES: { value: PlaceCategory; label: string }[] = [
  { value: 'cafes', label: 'Cafés' },
  { value: 'restaurants', label: 'Restaurants' },
  { value: 'parks', label: 'Parks' },
  { value: 'playgrounds', label: 'Playgrounds' },
  { value: 'classes', label: 'Classes' },
  { value: 'shops', label: 'Shops' },
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
];

const LABELS: Record<LovedCategory, string> = {
  cafes: 'Café',
  restaurants: 'Restaurant',
  parks: 'Park',
  playgrounds: 'Playground',
  classes: 'Class',
  shops: 'Shop',
  pediatricians: 'Pediatrician',
  gynecologists: 'Gynecologist',
  midwives_doulas: 'Midwife & doula',
  lactation: 'Lactation consultant',
  therapists: 'Therapist',
  pelvic_floor: 'Pelvic floor',
  dentists: 'Dentist (kids)',
  daycare: 'Daycare',
};

/** Singular, human label for a category — used on cards and the detail pill. */
export function categoryLabel(category: LovedCategory): string {
  return LABELS[category] ?? category;
}
