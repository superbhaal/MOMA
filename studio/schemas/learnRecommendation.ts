import { defineType, defineField } from 'sanity';
import { BABY_STAGES, CATEGORIES } from './options';

// Recommendation (LEGACY). The app no longer renders this type — peer recs now
// live on the Explore map (Supabase `loved_spots`). Kept so any existing docs
// stay viewable/editable/cleanable in the Studio. Don't author new ones.
export const learnRecommendation = defineType({
  name: 'learnRecommendation',
  title: 'Recommendation (legacy)',
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
    defineField({ name: 'title', type: 'string' }),
    defineField({ name: 'category', type: 'string', options: { list: CATEGORIES } }),
    defineField({ name: 'body', type: 'text' }),
    defineField({ name: 'linkUrl', title: 'Link URL', type: 'url' }),
    defineField({ name: 'linkLabel', title: 'Link label', type: 'string' }),
    defineField({
      name: 'heroGradient',
      title: 'Hero gradient',
      type: 'object',
      fields: [
        { name: 'from', type: 'string' },
        { name: 'via', type: 'string' },
        { name: 'to', type: 'string' },
      ],
    }),
    defineField({ name: 'contributorName', title: 'Contributor name', type: 'string' }),
    defineField({ name: 'contributorHandle', title: 'Contributor handle', type: 'string' }),
    defineField({ name: 'verified', type: 'boolean' }),
    defineField({ name: 'city', type: 'string' }),
    defineField({ name: 'babyStage', title: 'Baby stage', type: 'string', options: { list: BABY_STAGES } }),
    defineField({ name: 'publishedAt', title: 'Published at', type: 'datetime' }),
  ],
});
