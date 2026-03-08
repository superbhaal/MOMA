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
} as const;
