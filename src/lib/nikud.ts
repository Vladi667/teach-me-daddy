/**
 * The nikud ladder — §9.5, "move to unvocalised text early".
 *
 * Real Hebrew has no vowel points. Signs, menus, news and messages are all
 * bare consonants, and a trainee who has only ever read pointed text can read
 * a textbook and not a bus stop. So the points come off as a line is
 * mastered: the text the trainee already knows is where it is safe to remove
 * the crutch, because they can fall back on memory when decoding fails.
 *
 * Three rungs, chosen by the line's own Read interval — no new state, and no
 * setting. A line you met yesterday keeps its vowels; one you have held for
 * three weeks loses them.
 */

import { LINES } from "./lines.ts";
import { MASTERY_DAYS } from "./programme.ts";
import type { SrsCard } from "./srs.ts";

const NIKUD = /[֑-ׇ]/g;
/** Non-global twin. `.test()` on a /g regex is stateful and alternates. */
const IS_NIKUD = /[֑-ׇ]/;
/**
 * The dot that distinguishes שׁ from שׂ. Kept at `partial` and dropped at
 * `bare`, because bare is meant to look like the Hebrew on a street sign and
 * street signs do not carry it either. Keeping it forever would train reading
 * on a text that does not exist — the same mistake as never removing the
 * vowels, only smaller. It is also what makes `partial` a real middle rung
 * rather than `bare` with three per cent of exceptions.
 */
const SHIN_DOT = "ׁ";
const SIN_DOT = "ׂ";

export type Rung = "full" | "partial" | "bare";

/** Consonantal skeleton, the key everything here is grouped by. */
export const skeleton = (s: string): string =>
  s.normalize("NFC").replace(NIKUD, "").replace(/[^א-ת]/g, "");

/**
 * Forms the corpus itself points more than one way.
 *
 * Measured rather than assumed: 121 of 3,834 distinct forms, about 3%. Those
 * are the words where losing the points genuinely loses information — כָּל
 * against כֹּל, אַתְּ against אֶת — so they keep them one rung longer than the
 * rest. The other 97% are safe to strip, which is what makes this ladder
 * possible with no new content.
 */
let ambiguousCache: Set<string> | null = null;
export function ambiguousForms(): Set<string> {
  if (ambiguousCache) return ambiguousCache;
  const seen = new Map<string, Set<string>>();
  for (const l of LINES) {
    for (const w of l.he.split(/\s+/)) {
      const k = skeleton(w);
      if (!k) continue;
      const pointed = w.normalize("NFC").replace(/[^א-ת֑-ׇ]/g, "");
      const set = seen.get(k) ?? new Set<string>();
      set.add(pointed);
      seen.set(k, set);
    }
  }
  ambiguousCache = new Set(
    [...seen.entries()].filter(([, v]) => v.size > 1).map(([k]) => k),
  );
  return ambiguousCache;
}

/** Strip a single word to the given rung. */
function stripWord(word: string, rung: Rung): string {
  if (rung === "full") return word;
  const keepDot = rung === "partial";
  if (keepDot && ambiguousForms().has(skeleton(word))) return word;
  return [...word.normalize("NFC")]
    .filter(
      (ch) =>
        !IS_NIKUD.test(ch) || (keepDot && (ch === SHIN_DOT || ch === SIN_DOT)),
    )
    .join("");
}

/**
 * The line as it should be read at this rung.
 *
 * Punctuation and spacing are untouched — this removes vowels, it does not
 * reformat the sentence.
 */
export function atRung(he: string, rung: Rung): string {
  if (rung === "full") return he;
  return he
    .split(/(\s+)/)
    .map((chunk) => (/\s/.test(chunk) ? chunk : stripWord(chunk, rung)))
    .join("");
}

/** Interval at which a line drops from full points to partial. */
export const PARTIAL_DAYS = 7;

/**
 * Which rung a line has earned.
 *
 * Keyed on the Read card, because that is the card that asks you to read. A
 * lapse pulls the points back: a card knocked back into learning has an
 * interval of 0, so the vowels return with it, which is the right answer —
 * you are decoding again, not recognising.
 */
export function rungFor(read: SrsCard | undefined): Rung {
  if (!read || read.step !== null) return "full";
  if (read.interval >= MASTERY_DAYS) return "bare";
  if (read.interval >= PARTIAL_DAYS) return "partial";
  return "full";
}

/** How far up the ladder the trainee is, for the record. */
export function ladderCounts(
  srs: Record<string, SrsCard | undefined>,
  cardIdOf: (lineId: string) => string,
): Record<Rung, number> {
  const out: Record<Rung, number> = { full: 0, partial: 0, bare: 0 };
  for (const l of LINES) {
    const c = srs[cardIdOf(l.id)];
    if (!c) continue;
    out[rungFor(c)] += 1;
  }
  return out;
}
