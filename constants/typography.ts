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

export const textStyles = {
  displayXL: { fontFamily: fonts.serif, fontSize: 32, lineHeight: 36 },
  displayL: { fontFamily: fonts.serif, fontSize: 26, lineHeight: 30 },
  displayM: { fontFamily: fonts.serif, fontSize: 20, lineHeight: 24 },
  displayS: { fontFamily: fonts.serif, fontSize: 16, lineHeight: 20 },

  // Editorial serif ITALIC titles — the v11 "Apple-clean" voice (screen titles,
  // greeting name, place/recipe names), usually rendered in cobalt via `color`.
  heroItal: { fontFamily: fonts.serifItal, fontSize: 34, lineHeight: 38 },
  displayXLItal: { fontFamily: fonts.serifItal, fontSize: 32, lineHeight: 36 },
  displayLItal: { fontFamily: fonts.serifItal, fontSize: 26, lineHeight: 30 },
  displayMItal: { fontFamily: fonts.serifItal, fontSize: 20, lineHeight: 25 },
  bodyL: { fontFamily: fonts.body, fontSize: 14, lineHeight: 22 },
  bodyM: { fontFamily: fonts.body, fontSize: 12, lineHeight: 18 },
  bodyS: { fontFamily: fonts.body, fontSize: 11, lineHeight: 16 },
  label: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase' as const,
  },
  labelS: {
    fontFamily: fonts.bodySemi,
    fontSize: 9,
    letterSpacing: 1.8,
    textTransform: 'uppercase' as const,
  },
  reading: { fontFamily: fonts.reading, fontSize: 14, lineHeight: 24 },
  // Human voice — quotes, bios, helper prose (Lora italic).
  readingItal: { fontFamily: fonts.readingItal, fontSize: 15, lineHeight: 24 },
} as const;
