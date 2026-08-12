"use client";

import { useCallback } from "react";
import { LETTERS } from "./letters.ts";
import { useStore, type LetterStat } from "./store.ts";

/**
 * Alphabet drill progress. Thin adapter over the profile store so the drill
 * keeps its streak-to-mastery model while its data lives under the signed-in
 * username alongside everything else.
 */

export type { LetterStat };
export type ProgressMap = Record<string, LetterStat>;

export const MASTERY_TARGET = 3;

/**
 * The bar for a "fast" answer, in milliseconds.
 *
 * Fluent reading is a latency skill, not an accuracy one: three correct at
 * four seconds each is decoding, not reading. Two seconds is the bar here and
 * it is deliberately not the sub-second a soldier would be held to, because
 * this is four-option multiple choice — most of the budget goes on reading the
 * options, not on recognising the glyph. It measures "answered without
 * hesitating", which is the honest claim.
 */
export const FAST_MS = 2000;

const EMPTY: LetterStat = { streak: 0, seen: 0, wrong: 0 };

export function statFor(progress: ProgressMap, char: string): LetterStat {
  return progress[char] ?? EMPTY;
}

/**
 * Mastery is a run of correct answers that were also quick.
 *
 * `fast` is absent on progress recorded before timing existed, and falling
 * back to `streak` grandfathers it rather than un-mastering work already
 * done — a new metric should not delete somebody's past.
 */
export function isMastered(progress: ProgressMap, char: string): boolean {
  const st = statFor(progress, char);
  return st.streak >= MASTERY_TARGET && (st.fast ?? st.streak) >= MASTERY_TARGET;
}

/**
 * A letter counts once both of its shapes do.
 *
 * ך is not a decoration on kaf, it is a glyph you have to recognise cold at
 * the end of a word. Counting the letter as known while its final form is
 * unlearned overstates what the trainee can read.
 */
export function isLetterMastered(progress: ProgressMap, l: { char: string; final?: string }): boolean {
  return isMastered(progress, l.char) && (!l.final || isMastered(progress, l.final));
}

export function masteredCount(progress: ProgressMap): number {
  return LETTERS.filter((l) => isLetterMastered(progress, l)).length;
}

export function useProgress() {
  const { data, ready, update } = useStore();

  const record = useCallback(
    (char: string, correct: boolean, ms?: number) => {
      update((d) => {
        const cur = d.alphabet[char] ?? EMPTY;
        const quick = correct && ms !== undefined && ms <= FAST_MS;
        return {
          ...d,
          alphabet: {
            ...d.alphabet,
            [char]: {
              streak: correct ? cur.streak + 1 : 0,
              seen: cur.seen + 1,
              wrong: cur.wrong + (correct ? 0 : 1),
              // An untimed correct answer holds the run rather than breaking
              // it; only a slow one resets it, and a wrong one resets both.
              fast: correct
                ? ms === undefined
                  ? (cur.fast ?? 0)
                  : quick
                    ? (cur.fast ?? 0) + 1
                    : 0
                : 0,
              ms,
            },
          },
        };
      });
    },
    [update],
  );

  const reset = useCallback(() => {
    update((d) => ({ ...d, alphabet: {} }));
  }, [update]);

  return { progress: data.alphabet, ready, record, reset };
}
