import type { TFunction } from 'i18next';

import { colors } from '@/constants/colors';
import type { BroughtItem, BroughtKind } from '@/types';

/**
 * "Bring something to the table" — the taxonomy, the copy, and the one place
 * that knows how to reduce any of the five kinds to a card.
 *
 * The framing lines are the client's, kept word for word. They're doing most of
 * the work: "the dish you'd actually make this week, not the one you'd like to
 * be the kind of person who makes" is what keeps this from turning into
 * Pinterest.
 *
 * The copy maps are FUNCTIONS of `t`, not constants. A constant is evaluated at
 * import and would hold whichever language was active then, so changing the
 * language in Settings would leave these five screens in the old one until the
 * app restarted. Same reason DECLINE_OPTIONS, TIME_BLOCKS and PAUSE_OPTIONS
 * were converted.
 */

export const BROUGHT_KINDS: BroughtKind[] = ['recipe', 'book', 'find', 'listen', 'tip'];

export function kindLabel(t: TFunction): Record<BroughtKind, string> {
  return {
    recipe: t('brought.kRecipe'),
    book: t('brought.kBook'),
    find: t('brought.kFind'),
    listen: t('brought.kListen'),
    tip: t('brought.kTip'),
  };
}

/** The course header and its invitation, per kind. */
export function kindCourse(t: TFunction): Record<BroughtKind, { title: string; note: string }> {
  return {
    recipe: { title: t('brought.cRecipeTitle'), note: t('brought.cRecipeNote') },
    book: { title: t('brought.cBookTitle'), note: t('brought.cBookNote') },
    find: { title: t('brought.cFindTitle'), note: t('brought.cFindNote') },
    listen: { title: t('brought.cListenTitle'), note: t('brought.cListenNote') },
    tip: { title: t('brought.cTipTitle'), note: t('brought.cTipNote') },
  };
}

/**
 * How someone else's profile introduces it. The client wrote these; "Her
 * recipe" from the mockup only ever worked for one of the five.
 */
export function kindPossessive(t: TFunction): Record<BroughtKind, string> {
  return {
    recipe: t('brought.pRecipe'),
    book: t('brought.pBook'),
    find: t('brought.pFind'),
    listen: t('brought.pListen'),
    tip: t('brought.pTip'),
  };
}

/**
 * Each course has its own ink — the accent marks the selected tab, the text
 * variant sets the tab's label and the course title.
 *
 * Deliberately only those two places. Everything else on the screen stays
 * cobalt: the field labels, the CTA, the hints. Five colours running through a
 * whole form would make the form the subject; here they only say which course
 * you're at.
 */
export const KIND_INK: Record<BroughtKind, { accent: string; text: string }> = {
  recipe: { accent: colors.orange, text: colors.inkOrangeText },
  book: { accent: colors.lavender, text: colors.inkLavenderText },
  find: { accent: colors.pool, text: colors.inkPoolText },
  listen: { accent: colors.fuchsia, text: colors.inkFuchsiaText },
  tip: { accent: colors.inkLime, text: colors.inkLimeText },
};

/**
 * What to photograph, per course — the mockup's own placeholders. A book wants
 * its cover, a find wants the object, a listen wants cover art; "add a photo"
 * for all four would have been the app asking without knowing what for.
 */
export function kindPhotoHint(t: TFunction): Record<BroughtKind, string> {
  return {
    recipe: t('brought.phRecipe'),
    book: t('brought.phBook'),
    find: t('brought.phFind'),
    listen: t('brought.phListen'),
    tip: t('brought.phTip'),
  };
}

/** Tip is the one kind with nothing to photograph. */
export const KIND_HAS_PHOTO: Record<BroughtKind, boolean> = {
  recipe: true,
  book: true,
  find: true,
  listen: true,
  tip: false,
};

/**
 * Every card — Me, a member's profile, the group preview — shows the same three
 * lines. Each kind decides what fills them, in one place, so the surfaces can't
 * drift apart later.
 */
export interface BroughtCard {
  title: string;
  line: string;
  note: string;
}

export function broughtCard(item: BroughtItem): BroughtCard {
  const p = item.payload as Record<string, unknown>;
  const str = (k: string) => (typeof p[k] === 'string' ? (p[k] as string).trim() : '');

  switch (item.kind) {
    case 'recipe': {
      const ings = Array.isArray(p.ingredients) ? (p.ingredients as { name?: string }[]) : [];
      return {
        title: str('title'),
        // Names only, no quantities: the card is what it's made of, not how
        // much. The amounts live on the page you open.
        line: ings.map((i) => i?.name).filter(Boolean).join(', '),
        note: str('why'),
      };
    }
    case 'book':
      return { title: str('title'), line: str('author'), note: str('why') };
    case 'find':
      return { title: str('title'), line: str('where'), note: str('why') };
    case 'listen':
      return { title: str('title'), line: str('maker'), note: str('when') };
    case 'tip':
      // The tip IS the headline. Nothing else on the card would read as the
      // point if it sat underneath.
      return { title: str('tip'), line: str('how'), note: str('who') };
  }
}

/** True once there's enough to put on the table. */
export function broughtIsComplete(kind: BroughtKind, payload: Record<string, unknown>): boolean {
  const has = (k: string) =>
    typeof payload[k] === 'string' && (payload[k] as string).trim().length > 1;
  switch (kind) {
    case 'recipe':
      return has('title') && has('why');
    case 'book':
      return has('title') && has('author') && has('why');
    case 'find':
      return has('title') && has('why');
    case 'listen':
      return has('title') && has('maker') && has('when');
    case 'tip':
      return has('tip') && has('how');
  }
}
