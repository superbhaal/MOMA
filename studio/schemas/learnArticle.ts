import { defineType, defineField } from 'sanity';
import { BABY_STAGES, CATEGORIES } from './options';

// Read · long-form article. Rendered by app/(tabs)/discover/[docId].tsx.
// Every article must carry a citable `source` — anything not backed by
// peer-reviewed / guideline-level evidence belongs on Watch, not Learn.
export const learnArticle = defineType({
  name: 'learnArticle',
  title: 'Read · Article',
  type: 'document',
  fields: [
    defineField({ name: 'title', type: 'string', validation: (r) => r.required() }),
    defineField({
      name: 'deck',
      title: 'Deck / takeaway',
      type: 'string',
      description: 'The one honest conclusion — shown on the card and as the italic subtitle.',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'category',
      type: 'string',
      options: { list: CATEGORIES },
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'babyStage',
      title: 'Baby stage',
      type: 'string',
      options: { list: BABY_STAGES },
      validation: (r) => r.required(),
    }),
    defineField({ name: 'author', type: 'string', validation: (r) => r.required() }),
    defineField({
      name: 'authorTitle',
      title: 'Author title',
      type: 'string',
      description: 'e.g. "Developmental Paediatrics" — shown in the byline.',
    }),
    defineField({
      name: 'readMinutes',
      title: 'Read minutes',
      type: 'number',
      validation: (r) => r.required().min(1),
    }),
    defineField({
      name: 'lead',
      type: 'text',
      rows: 3,
      description: 'Opening paragraph shown under the deck.',
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'array',
      of: [
        {
          type: 'block',
          // Only these styles are rendered by the app reader.
          styles: [
            { title: 'Normal', value: 'normal' },
            { title: 'Heading', value: 'h2' },
            { title: 'Pull-quote', value: 'blockquote' },
          ],
          lists: [],
          marks: { decorators: [{ title: 'Italic', value: 'em' }], annotations: [] },
        },
      ],
    }),
    defineField({
      name: 'keyPoints',
      title: 'Key points',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'The cream key-points box. Keep to 3–4 short lines.',
    }),
    defineField({
      name: 'source',
      type: 'string',
      description: 'Citable source, e.g. "Pediatrics, 2023". Required — Learn is evidence-based.',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published at',
      type: 'datetime',
      validation: (r) => r.required(),
      initialValue: () => new Date().toISOString(),
    }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'source' },
  },
});
