import { defineType, defineField } from 'sanity';
import { BABY_STAGES, CATEGORIES } from './options';

// Watch · curated external reel (IG/TikTok). A credential is MANDATORY — a video
// with no verifiable credential does not appear. Tapping opens the platform.
export const learnReel = defineType({
  name: 'learnReel',
  title: 'Watch · Reel',
  type: 'document',
  fields: [
    defineField({
      name: 'language',
      title: 'Language',
      type: 'string',
      description: 'Which language this document is written in. English is the source; fr/es are translations of it.',
      options: { list: [{ title: 'English', value: 'en' }, { title: 'Français', value: 'fr' }, { title: 'Español', value: 'es' }] },
      initialValue: 'en',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'translationOf',
      title: 'Translation of',
      type: 'string',
      description: 'The _id of the English original. Empty on the English document itself.',
      hidden: ({ document }) => document?.language === 'en',
    }),
    defineField({ name: 'title', type: 'string', validation: (r) => r.required() }),
    defineField({
      name: 'platform',
      type: 'string',
      options: { list: [{ title: 'Instagram', value: 'instagram' }, { title: 'TikTok', value: 'tiktok' }] },
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'externalUrl',
      title: 'External URL',
      type: 'url',
      description: 'Deep link to the reel on its platform.',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'thumbnailHex',
      title: 'Thumbnail hex',
      type: 'string',
      description: 'Gradient anchor colour for the card, e.g. "#F4D1D1".',
    }),
    defineField({
      name: 'durationSec',
      title: 'Duration (seconds)',
      type: 'number',
      validation: (r) => r.min(1),
    }),
    defineField({ name: 'creatorName', title: 'Creator name', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'creatorHandle', title: 'Creator handle', type: 'string' }),
    defineField({
      name: 'credential',
      type: 'string',
      description: 'MANDATORY, e.g. "MD · Perinatal" or "IBCLC · Sleep".',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'babyStage',
      title: 'Baby stage',
      type: 'string',
      options: { list: BABY_STAGES },
      validation: (r) => r.required(),
    }),
    defineField({ name: 'category', type: 'string', options: { list: CATEGORIES } }),
    defineField({
      name: 'publishedAt',
      title: 'Published at',
      type: 'datetime',
      validation: (r) => r.required(),
      initialValue: () => new Date().toISOString(),
    }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'creatorName' },
  },
});
