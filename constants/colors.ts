// Source of truth: design/moma-enhanced.html + design/moma-palette.pdf
// Update only when the design changes.

export const colors = {
  // Base
  white: '#FFFFFF',
  cream: '#FAF6F1',
  butter: '#F5EDB8',
  pistachio: '#D8E8C8',
  cobalt: '#1A4BCC',
  cobaltDeep: '#0F3AA8',
  text: '#111118',
  muted: '#6F6F88',
  mutedStrong: '#4A4A5E',
  line: 'rgba(17,17,24,0.07)',
  lineStrong: 'rgba(17,17,24,0.12)',

  // Blush system (meetups — proposed / open / past)
  blush: '#F4D1D1',
  blushText: '#6A1A2A',
  blushMuted: '#8C2238',

  // Meadow system (meetup locked in / validated) — green counterpart to blush
  meadow: '#D3E7BF',
  meadowText: '#1E4620',
  meadowMuted: '#3E6B3A',

  // Bold accents (user colours + signal roles)
  fuchsia: '#E8389C',
  orange: '#FF7A00',
  soleil: '#FFC800',
  cherry: '#E82030',
  lavender: '#9878C8',
  pool: '#00B8C8',
  klein: '#0038FF',
  lime: '#B8D830',

  // Soft accents (user colours)
  peche: '#FADCB8',
  citron: '#F9F0A0',
  menthe: '#C8E8D8',
  ciel: '#C8DCF0',
  lavSoft: '#D8C8E8',
  rose: '#F0C8D8',
  sable: '#E8DCD0',
} as const;

export type ColorName = keyof typeof colors;

// Profile-colour palette offered at Q4 of onboarding.
// The user's chosen value is stored on users.profile_color (hex).
export const PROFILE_COLOR_OPTIONS: ColorName[] = [
  'fuchsia',
  'orange',
  'soleil',
  'cherry',
  'lavender',
  'pool',
  'lime',
  'peche',
  'citron',
  'menthe',
  'ciel',
  'lavSoft',
  'rose',
];
