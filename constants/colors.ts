export const colors = {
  // Base
  white: '#FFFFFF',
  cream: '#FAF6F1',
  cobalt: '#1A4BCC',
  text: '#111118',
  muted: '#9090A8',
  line: 'rgba(17,17,24,0.07)',

  // Accent — Blush system
  blush: '#F4D1D1',
  blushText: '#6A1A2A',
  blushMuted: '#B05A6A',

  // Bold accents
  fuchsia: '#E8389C',
  orange: '#FF7A00',
  soleil: '#FFC800',
  cherry: '#E82030',
  lavender: '#9878C8',
  pool: '#00B8C8',
  klein: '#0038FF',
  lime: '#B8D830',

  // Soft accents
  peche: '#FADCB8',
  citron: '#F9F0A0',
  menthe: '#C8E8D8',
  ciel: '#C8DCF0',
  rose: '#F0C8D8',
  sable: '#E8DCD0',
  lavSoft: '#D8C8E8',
} as const;

export type ColorName = keyof typeof colors;
