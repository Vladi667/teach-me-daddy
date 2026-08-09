"use client";

import { useCallback } from "react";
import { LETTERS } from "./letters";
import { useStore, type LetterStat } from "./store";

/**
 * Alphabet drill progress. Thin adapter over the profile store so the drill
 * keeps its streak-to-mastery model while its data lives under the signed-in
 * username alongside everything else.
 */

export type { LetterStat };
export type ProgressMap = Record<string, LetterStat>;

export const MASTERY_TARGET = 3;

const EMPTY: LetterStat = { streak: 0, seen: 0, wrong: 0 };

export function statFor(progress: ProgressMap, char: string): LetterStat {
  return progress[char] ?? EMPTY;
}

export function isMastered(progress: ProgressMap, char: string): boolean {
  return statFor(progress, char).streak >= MASTERY_TARGET;
}

export function masteredCount(progress: ProgressMap): number {
  return LETTERS.filter((l) => isMastered(progress, l.char)).length;
}

export function useProgress() {
  const { data, ready, update } = useStore();

  const record = useCallback(
    (char: string, correct: boolean) => {
      update((d) => {
        const cur = d.alphabet[char] ?? EMPTY;
        return {
          ...d,
          alphabet: {
            ...d.alphabet,
            [char]: {
              streak: correct ? cur.streak + 1 : 0,
              seen: cur.seen + 1,
              wrong: cur.wrong + (correct ? 0 : 1),
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
