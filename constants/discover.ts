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

export const PERSON_CATEGORIES: { value: PersonCategory; label: string }[] = [
  { value: 'pediatricians', label: 'Pediatricians' },
  { value: 'gynecologists', label: 'Gynecologists' },
  { value: 'midwives_doulas', label: 'Midwives & doulas' },
  { value: 'lactation', label: 'Lactation' },
  { value: 'physios', label: 'Physios' },
];

/** Chip row for a mode, with the leading "All" chip. */
export function categoryChips(kind: LovedKind): CategoryChip[] {
  const set = kind === 'place' ? PLACE_CATEGORIES : PERSON_CATEGORIES;
  return [{ value: 'all', label: 'All' }, ...set];
}

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
  physios: 'Physio',
};

/** Singular, human label for a category — used on cards and the detail pill. */
export function categoryLabel(category: LovedCategory): string {
  return LABELS[category] ?? category;
}
