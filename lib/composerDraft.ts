import type { LovedKind, LovedCategory } from '@/types';

/**
 * In-session draft for the Add-a-place composer. Kept module-level (not in the
 * screen) so accidentally dismissing the modal — very likely in a one-handed,
 * 3am app — doesn't lose the note. Reset only after a successful publish or an
 * explicit discard. (Disk persistence across app launches is a later nicety.)
 */
export interface ComposerDraft {
  kind: LovedKind | null;
  location: {
    name: string;
    address: string | null;
    lat: number | null;
    lng: number | null;
    place_id: string | null;
  } | null;
  category: LovedCategory | null;
  note: string;
  /** Local URI from the picker. Uploaded on publish, not on pick — a composer
   *  abandoned at step 4 shouldn't have left a file in the bucket. */
  photoUri: string | null;
  /** Suggested, never required. Offered on the same step as the note. */
  phone: string;
  email: string;
  website: string;
}

export const EMPTY_DRAFT: ComposerDraft = {
  // A place, until told otherwise. The v11 composer makes this a tab at the top
  // of step 1 rather than a step of its own, so it always has a value — which
  // is also why it no longer counts towards `isDraftDirty`.
  kind: 'place',
  location: null,
  category: null,
  note: '',
  photoUri: null,
  phone: '',
  email: '',
  website: '',
};

let draft: ComposerDraft = { ...EMPTY_DRAFT };

export function loadDraft(): ComposerDraft {
  return { ...draft };
}

export function saveDraft(next: ComposerDraft): void {
  draft = { ...next };
}

export function clearDraft(): void {
  draft = { ...EMPTY_DRAFT };
}

/** True when the user has entered anything worth a discard confirmation. */
export function isDraftDirty(d: ComposerDraft): boolean {
  return (
    !!d.location || !!d.category || !!d.photoUri || d.note.trim().length > 0
  );
}
