/**
 * Assessment passages and the tokenising the marking depends on.
 *
 * The passage is the measuring instrument for §6, so what counts as "a word"
 * has to be decided in one place: the score is words-not-known over words, and
 * both sides must count the same things.
 */

import { PASSAGES } from "./passages.gen.ts";

export interface Passage {
  /** 1-5. */
  month: number;
  sentences: { he: string; fr: string }[];
}

export { PASSAGES };

export const passageFor = (month: number): Passage | undefined =>
  PASSAGES.find((p) => p.month === month);

const NIKUD = /[֑-ׇ]/g;

/**
 * Marking key for a word. Vowels are stripped so that tapping a word marks it
 * wherever it appears in the passage, and punctuation is dropped so that
 * "בית." and "בית" are the same word rather than two.
 *
 * Hebrew morphology means "בבית" and "בית" stay distinct. That is deliberate:
 * a trainee who doesn't recognise the prefixed form doesn't know it yet.
 */
export const wordKey = (raw: string): string =>
  raw.replace(NIKUD, "").replace(/[^א-ת]/g, "");

/** Every markable word in a passage, in order, including repeats. */
export function tokens(p: Passage): string[] {
  return p.sentences.flatMap((s) =>
    s.he
      .split(/\s+/)
      .map(wordKey)
      .filter(Boolean),
  );
}

/** Sentence split into display tokens, each with its marking key. */
export function tokenise(he: string): { text: string; key: string }[] {
  return he
    .split(/\s+/)
    .filter(Boolean)
    .map((text) => ({ text, key: wordKey(text) }));
}
