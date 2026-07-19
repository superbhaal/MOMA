/**
 * Baby-age formatting helpers, shared by Home and the Me profile header.
 * The design header reads e.g. "Baby born Feb 28 · Week 3 · Jordaan, Amsterdam".
 */

/** "Feb 28" — the baby's birth (or due) date, short month + day. */
export function babyBornLabel(dob: string | null | undefined): string | null {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** "Week 3" / "Due in 4 weeks" / "3 months" / "1 year" — concise age chip. */
export function babyAgeShort(dob: string | null | undefined): string | null {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const days = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (days < 0) {
    const w = Math.ceil(Math.abs(days) / 7);
    return `Due in ${w} week${w === 1 ? '' : 's'}`;
  }
  if (days < 7 * 12) {
    const w = Math.max(1, Math.floor(days / 7));
    return `Week ${w}`;
  }
  if (days < 365 * 2) {
    const m = Math.floor(days / 30);
    return `${m} month${m === 1 ? '' : 's'}`;
  }
  const y = Math.floor(days / 365);
  return `${y} year${y === 1 ? '' : 's'}`;
}

/**
 * Full meta line for the Me header:
 * "Baby born Feb 28 · Week 3 · Jordaan" (parts omitted gracefully when missing).
 */
export function babyMetaLine(
  dob: string | null | undefined,
  neighbourhood: string | null | undefined,
): string {
  const born = babyBornLabel(dob);
  const age = babyAgeShort(dob);
  const future = dob ? new Date(dob).getTime() > Date.now() : false;
  const parts: string[] = [];
  if (born) parts.push(future ? `Due ${born}` : `Baby born ${born}`);
  if (age && !future) parts.push(age);
  if (neighbourhood) parts.push(neighbourhood);
  return parts.join(' · ');
}
