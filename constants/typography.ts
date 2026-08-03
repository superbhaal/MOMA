import { scaled } from './scale';

export const fonts = {
  serif: 'CormorantGaramond-Light',
  serifReg: 'CormorantGaramond-Regular',
  serifBold: 'CormorantGaramond-SemiBold',
  serifItal: 'CormorantGaramond-LightItalic',
  body: 'DMSans-Regular',
  bodyMed: 'DMSans-Medium',
  bodySemi: 'DMSans-SemiBold',
  reading: 'Lora-Regular',
  readingItal: 'Lora-Italic',
} as const;

// Every size here is a v11 mockup size run through `scaled`, so a Pro Max
// gets the mockup's proportions rather than the mockup's pixels.
export const textStyles = {
  displayXL: { fontFamily: fonts.serif, fontSize: scaled(32), lineHeight: scaled(36) },
  displayL: { fontFamily: fonts.serif, fontSize: scaled(26), lineHeight: scaled(30) },
  displayM: { fontFamily: fonts.serif, fontSize: scaled(20), lineHeight: scaled(24) },
  displayS: { fontFamily: fonts.serif, fontSize: scaled(16), lineHeight: scaled(20) },

  // Editorial serif ITALIC titles — the v11 "Apple-clean" voice (screen titles,
  // greeting name, place/recipe names), usually rendered in cobalt via `color`.
  heroItal: { fontFamily: fonts.serifItal, fontSize: scaled(34), lineHeight: scaled(38) },
  displayXLItal: { fontFamily: fonts.serifItal, fontSize: scaled(32), lineHeight: scaled(36) },
  displayLItal: { fontFamily: fonts.serifItal, fontSize: scaled(26), lineHeight: scaled(30) },
  displayMItal: { fontFamily: fonts.serifItal, fontSize: scaled(20), lineHeight: scaled(25) },
  bodyL: { fontFamily: fonts.body, fontSize: scaled(14), lineHeight: scaled(22) },
  bodyM: { fontFamily: fonts.body, fontSize: scaled(12), lineHeight: scaled(18) },
  bodyS: { fontFamily: fonts.body, fontSize: scaled(11), lineHeight: scaled(16) },
  label: {
    fontFamily: fonts.bodySemi,
    fontSize: scaled(11),
    letterSpacing: 1.5,
    textTransform: 'uppercase' as const,
  },
  labelS: {
    fontFamily: fonts.bodySemi,
    fontSize: scaled(9),
    letterSpacing: 1.8,
    textTransform: 'uppercase' as const,
  },
  reading: { fontFamily: fonts.reading, fontSize: scaled(14), lineHeight: scaled(24) },
  // Human voice — quotes, bios, helper prose (Lora italic).
  readingItal: { fontFamily: fonts.readingItal, fontSize: scaled(15), lineHeight: scaled(24) },
} as const;
