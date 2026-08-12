/**
 * Field notes — words met outside the programme (PROGRAMME.md §9).
 *
 * These two helpers are all that survives of the old curated deck. The deck
 * itself is gone: its hand-checked days 1-5 were promoted into lines.seed.ts
 * when the corpus was built (§13b), and browsing the rest contradicted §9.
 */

export interface NoteItem {
  id: string;
  group: "captured";
  he: string;
  tr: string;
  fr: string;
  en: string;
  createdAt: number;
  /** Where you met it — a tutor, a podcast, a sign. */
  source?: string;
  example?: { he: string; tr: string; fr: string; en: string };
}

/** Kept for the data already on disk, which used this name. */
export type CustomItem = NoteItem;

/** Ids are content-derived so the same word noted twice doesn't duplicate. */
export function customId(he: string): string {
  const slug = he
    .normalize("NFC")
    // strip nikud so "בַּיִת" and "בית" are the same word
    .replace(/[֑-ׇ]/g, "")
    .replace(/\s+/g, "-");
  return `u-${slug}`;
}
