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
}

export const EMPTY_DRAFT: ComposerDraft = {
  kind: null,
  location: null,
  category: null,
  note: '',
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
  return !!d.kind || !!d.location || !!d.category || d.note.trim().length > 0;
}
