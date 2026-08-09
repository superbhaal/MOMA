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

  // ── Editorial serif ITALIC titles ────────────────────────────────────────
  // The v11 "Apple-clean" voice, usually rendered in cobalt via `color`. Four
  // ranks, by the job the title does — a tester noticed the same kind of
  // heading came in five different sizes across screens, because each one had
  // been styled by hand. Reach for a rank, not a number.
  //
  //   titleHero    a screen that is only a title (match found, resume)
  //   titleQuestion a quiz question, the only thing on its screen
  //   titleScreen  the name of a tab or a pushed screen (Chats, Me, Preferences)
  //   titleSection a named thing inside a screen (a group, a member, a place)
  //   titleInline  a title sharing its row with something else (chat header)
  titleHero: { fontFamily: fonts.serifItal, fontSize: scaled(48), lineHeight: scaled(54) },
  titleQuestion: { fontFamily: fonts.serifItal, fontSize: scaled(40), lineHeight: scaled(46) },
  titleScreen: { fontFamily: fonts.serifItal, fontSize: scaled(34), lineHeight: scaled(40) },
  titleSection: { fontFamily: fonts.serifItal, fontSize: scaled(29), lineHeight: scaled(34) },
  titleInline: { fontFamily: fonts.serifItal, fontSize: scaled(21), lineHeight: scaled(26) },

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
  // ── Controls ─────────────────────────────────────────────────────────────
  // The strip of chips, tabs and filter rows that sits under a masthead. One
  // size for the lot: Discover shipped its sub-tabs at 11 and the stage value
  // at 15 on the same screen, with the Explore mode tabs at 16 — three ranks
  // in three centimetres, which read as separate UIs stacked rather than one
  // control strip. 13 sits between them. Weight and colour carry the
  // hierarchy inside the strip; size does not.
  control: { fontFamily: fonts.bodyMed, fontSize: scaled(13) },
  controlStrong: { fontFamily: fonts.bodySemi, fontSize: scaled(13) },
  // The tracked-capitals cut of the same rank. It rode a point higher for a
  // while to offset how small capitals measure, but at 14 the three chips
  // crowded the row — the tracking already gives them the presence.
  controlCaps: { fontFamily: fonts.bodyMed, fontSize: scaled(13), letterSpacing: 1.7 },

  // ── Feed content ─────────────────────────────────────────────────────────
  // What a card actually says, across every Discover tab. A Read card, a Watch
  // card and a loved-spot row are the same feed, so they get the same two
  // sizes: the title steps up one notch from the control strip, everything
  // else sits level with it. Eyebrows (READ · 6 MIN, the source, the section
  // rule) use `labelS`, which already existed for exactly that job.
  cardTitle: { fontFamily: fonts.bodySemi, fontSize: scaled(15), lineHeight: scaled(20) },
  cardBody: { fontFamily: fonts.body, fontSize: scaled(13), lineHeight: scaled(19) },

  reading: { fontFamily: fonts.reading, fontSize: scaled(14), lineHeight: scaled(24) },
  // Human voice — quotes, bios, helper prose (Lora italic).
  readingItal: { fontFamily: fonts.readingItal, fontSize: scaled(15), lineHeight: scaled(24) },
} as const;
