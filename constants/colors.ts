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

  // Discover section (Learn / Watch / Explore)
  cobaltSoft: '#EEF2FF', // source pills, credential pills, selected rows, tints
  cobaltMuted: '#A8BCEE', // cobalt at reading distance — steps already taken
  pageBg: '#F5F5F7', // composer / full-screen flow background
  soleilInk: '#F7F6F2', // large display title on the soleil band (≥24px only)
  soleilInkSm: '#6A5500', // subtitle / small text on soleil (AA)
  soleilInkStrong: '#2A2200', // map-header title on soleil
  labelMuted: '#6E6E73', // card meta / secondary labels (handoff --label-muted)
  labelTertiary: '#86868B', // eyebrows / inactive tabs (handoff --label-tertiary)

  // Blush system (meetups — proposed / open / past)
  blush: '#F4D1D1',
  blushText: '#6A1A2A',
  blushMuted: '#8C2238',

  // Meadow system (meetup locked in / validated) — green
  meadow: '#D3E7BF',
  meadowText: '#1E4620',
  meadowMuted: '#3E6B3A',

  // Poppy system (meetup still a proposal / not yet decided) — red
  poppy: '#F6CFC9',
  poppyText: '#7A1C14',
  poppyMuted: '#A5382C',

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
