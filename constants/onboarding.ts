import type { RecurringAvailability } from '@/types';
import type { ColorName } from './colors';
import { colors } from './colors';

// ──────────────────────────────────────────────────────────────
// Post-match availability matrix (used by /availability screen).
// Each cell renders the visible time range; the boolean key is what gets stored.
// ──────────────────────────────────────────────────────────────

export const AVAILABILITY_TIME_BLOCKS = [
  { key: 'morning' as const, label: 'Morning', weekdayRange: '7–12', weekendRange: '8–12' },
  { key: 'afternoon' as const, label: 'Afternoon', weekdayRange: '12–5', weekendRange: '12–5' },
  { key: 'evening' as const, label: 'Evening', weekdayRange: '5–9', weekendRange: '5–9' },
];

export const EMPTY_AVAILABILITY: RecurringAvailability = {
  weekday_morning: false,
  weekday_afternoon: false,
  weekday_evening: false,
  weekend_morning: false,
  weekend_afternoon: false,
  weekend_evening: false,
};

// ──────────────────────────────────────────────────────────────
// Q3 — Languages (primary + up to 2 "also speak")
// Standalone keeps it flag-less; we follow.
// ──────────────────────────────────────────────────────────────

export interface LanguageOption {
  label: string;
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { label: 'English' },
  { label: 'French' },
  { label: 'Dutch' },
  { label: 'Spanish' },
  { label: 'German' },
  { label: 'Italian' },
  { label: 'Arabic' },
  { label: 'Portuguese' },
];

// Kept as a flat array for backwards compat (preferences screen uses it).
export const LANGUAGES = LANGUAGE_OPTIONS.map((l) => l.label);

// ──────────────────────────────────────────────────────────────
// Q4 — Identity colour
// Two curated palettes per design spec: macaron Softs (8) + saturated Bolds (8).
// Soft rendered FIRST per standalone.
// ──────────────────────────────────────────────────────────────

export type ColourGroup = 'bold' | 'soft';

export interface ProfileColourSwatch {
  name: ColorName;
  /** Human label used by the live "Picked — …" caption. */
  label: string;
  hex: string;
  group: ColourGroup;
}

export const PROFILE_COLOUR_SWATCHES: ProfileColourSwatch[] = [
  // Soft palette — macaron pastels, calm self-expression.
  { name: 'rose',     label: 'rose',     hex: colors.rose,     group: 'soft' },
  { name: 'peche',    label: 'pêche',    hex: colors.peche,    group: 'soft' },
  { name: 'citron',   label: 'citron',   hex: colors.citron,   group: 'soft' },
  { name: 'menthe',   label: 'menthe',   hex: colors.menthe,   group: 'soft' },
  { name: 'ciel',     label: 'ciel',     hex: colors.ciel,     group: 'soft' },
  { name: 'lavSoft',  label: 'lavender soft', hex: colors.lavSoft, group: 'soft' },
  { name: 'blush',    label: 'blush',    hex: colors.blush,    group: 'soft' },
  { name: 'sable',    label: 'sable',    hex: colors.sable,    group: 'soft' },
  // Bold palette — saturated identity colours.
  { name: 'fuchsia',  label: 'fuchsia',  hex: colors.fuchsia,  group: 'bold' },
  { name: 'orange',   label: 'orange',   hex: colors.orange,   group: 'bold' },
  { name: 'soleil',   label: 'soleil',   hex: colors.soleil,   group: 'bold' },
  { name: 'cherry',   label: 'cherry',   hex: colors.cherry,   group: 'bold' },
  { name: 'lavender', label: 'lavender', hex: colors.lavender, group: 'bold' },
  { name: 'pool',     label: 'pool',     hex: colors.pool,     group: 'bold' },
  { name: 'klein',    label: 'klein',    hex: colors.klein,    group: 'bold' },
  { name: 'lime',     label: 'lime',     hex: colors.lime,     group: 'bold' },
];
