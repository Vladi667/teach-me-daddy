/**
 * The decoding ladder — §8e.
 *
 * Seven rungs from six letters to twenty-two. Distinct from both the alphabet
 * drill, which teaches glyphs in isolation, and the reading library (§8c),
 * which measures speed on text you can already decode. This is the bit in
 * between: turning a known glyph into a read word.
 *
 * The shape is forced by the corpus rather than chosen. Gating whole sentences
 * by a six-letter set yields none at all, and none at seven or eight either;
 * they appear in useful numbers only at fourteen. Gating *words* yields 80 at
 * six letters and 604 at ten. So the early rungs read attested fragments and
 * the ladder crosses to whole sentences at rung 5, where the corpus starts
 * supplying them. See scripts/build-ladder.mjs for the measurements.
 */

import { RUNGS } from "./ladder.gen.ts";

export interface LadderLine {
  /** Vocalised Hebrew, exactly as attested. */
  he: string;
  /** Present only on whole sentences; fragments have no gloss of their own. */
  fr?: string;
  /** Corpus line this came from, where one recording covers the whole line. */
  src?: string;
}

/**
 * One sitting with a passage.
 *
 * Hints and reveals are counted separately because they are different
 * admissions: a hint says "I could not chunk it", a reveal says "I could not
 * read it". Both cost the clean mark, which is what makes them cost anything
 * at all — a free reveal is a button that turns reading into looking.
 */
export interface LadderLog {
  /** Words per minute, best clean sitting if there has been one. */
  wpm: number;
  /** Read start to finish with no hint and no reveal. */
  clean: boolean;
  hints: number;
  reveals: number;
  /** Words revealed last time, so the review can show them. */
  missed: string[];
  /** "YYYY-MM-DD". */
  on: string;
}

export interface LadderPassage {
  id: string;
  /** 1-7. */
  rung: number;
  /** Fragments cut from sentences, or whole sentences. */
  kind: "phrases" | "text";
  words: number;
  lines: LadderLine[];
}

export interface LadderRung {
  /** 1-7. */
  n: number;
  title: string;
  /** Every letter readable at this rung, in the order they were taught. */
  letters: string[];
  /** The letters this rung adds. */
  added: string[];
  /** Final forms unlocked, which follow their base letter rather than wait. */
  finals: string[];
  /** How many corpus words are spellable at this rung. */
  wordsTotal: number;
  /** The words this rung newly unlocks, commonest first, pointed. */
  words: string[];
  passages: LadderPassage[];
}

export { RUNGS };

export const LAST_RUNG = RUNGS.length;

const FINAL: Record<string, string> = {
  "ך": "כ",
  "ם": "מ",
  "ן": "נ",
  "ף": "פ",
  "ץ": "צ",
};

/** A word stripped of points, with final forms folded onto their base. */
export function skeleton(word: string): string {
  return [...word.normalize("NFC").replace(/[֑-ׇ]/g, "")]
    .map((c) => FINAL[c] ?? c)
    .join("");
}

export function rungAt(n: number): LadderRung | null {
  return RUNGS.find((r) => r.n === n) ?? null;
}

/** Can this word be read with nothing but the letters of `rung`? */
export function readableAt(word: string, rung: number): boolean {
  const r = rungAt(rung);
  if (!r) return false;
  const known = new Set(r.letters);
  const s = skeleton(word);
  return s.length > 0 && [...s].every((c) => known.has(c));
}

/**
 * The highest rung whose letters are all banked in the alphabet drill.
 *
 * Takes a predicate rather than the progress map so the ladder stays a pure
 * data module, the way blend.ts does. Both a letter and its final form must be
 * banked: ך is its own glyph in the drill and appears in this rung's words.
 */
export function openRung(banked: (glyph: string) => boolean): number {
  let open = 0;
  for (const r of RUNGS) {
    const glyphs = [...r.letters, ...r.finals];
    if (!glyphs.every(banked)) break;
    open = r.n;
  }
  return open;
}

/**
 * How far in you are: the first rung with an unread passage, capped by what
 * the alphabet drill has unlocked. A rung is finished when every passage in it
 * has been read cleanly at least once.
 */
export function nextPassage(
  done: Record<string, { clean: boolean }>,
  open: number,
): LadderPassage | null {
  for (const r of RUNGS) {
    if (r.n > open) break;
    for (const p of r.passages) {
      if (!done[p.id]?.clean) return p;
    }
  }
  return null;
}

/** Passages read cleanly in a rung, over the number it holds. */
export function clearedIn(
  rung: number,
  done: Record<string, { clean: boolean }>,
): { cleared: number; total: number } {
  const r = rungAt(rung);
  if (!r) return { cleared: 0, total: 0 };
  return {
    cleared: r.passages.filter((p) => done[p.id]?.clean).length,
    total: r.passages.length,
  };
}

const SEP = /([\s.,!?;:"'()־׳״-]+)/;

/**
 * A line split for rendering: every word is tappable, every separator is not.
 *
 * Punctuation has to survive the split rather than be stripped, because some
 * corpus lines store their question mark at the head of the string — an
 * artefact of how the source writes right-to-left text — and dropping it would
 * silently change the line.
 */
export function tokens(he: string): { t: string; word: boolean }[] {
  return he
    .split(SEP)
    .filter(Boolean)
    .map((t) => ({ t, word: /^[א-ת]+$/.test(skeleton(t)) }));
}

/** Every word on screen, in reading order, for the tap-to-reveal layer. */
export function wordsOf(p: LadderPassage): string[] {
  return p.lines.flatMap((l) => tokens(l.he).filter((x) => x.word).map((x) => x.t));
}
