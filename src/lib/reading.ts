/**
 * The reading library — §8c.
 *
 * Independent of the programme on purpose. The five daily blocks teach lines;
 * this is where you read at length, on a clock. No amount of single sentences
 * adds up to reading a paragraph, and speed is a skill of its own that the
 * SRS never measures because a card has no length.
 *
 * Six levels, unlocked in order. Not a mode picker: you cannot choose to skip
 * ahead, only to continue.
 */

import { LIBRARY } from "./reading.gen.ts";
import { atRung, type Rung } from "./nikud.ts";

export interface Passage {
  id: string;
  /** 1-6. */
  level: number;
  theme: string;
  words: number;
  sentences: { he: string; fr: string }[];
}

export { LIBRARY };

export const LEVELS = [...new Set(LIBRARY.map((p) => p.level))].sort(
  (a, b) => a - b,
);

/** A record of one timed read. */
export interface ReadLog {
  /** Words per minute. */
  wpm: number;
  /** Did the trainee say they followed it? */
  understood: boolean;
  /** "YYYY-MM-DD". */
  on: string;
}

/**
 * The points come off as the levels climb, on the same principle as §8b: the
 * early levels are for decoding, the late ones for reading Hebrew as it is
 * actually written.
 */
export function rungForLevel(level: number): Rung {
  if (level <= 2) return "full";
  if (level <= 4) return "partial";
  return "bare";
}

/** The passage as it should be shown at its level. */
export function textFor(p: Passage): string[] {
  const rung = rungForLevel(p.level);
  return p.sentences.map((s) => atRung(s.he, rung));
}

/** Words actually on screen, which is what the speed is measured against. */
export function wordCount(p: Passage): number {
  return p.sentences.reduce(
    (n, s) => n + s.he.split(/\s+/).filter(Boolean).length,
    0,
  );
}

export function wpm(words: number, ms: number): number {
  if (ms <= 0) return 0;
  return Math.round(words / (ms / 60000));
}

/**
 * A level opens once every passage in the one below has been read *and
 * understood*. Speed without comprehension is just scrolling, so a passage
 * the trainee did not follow does not count toward unlocking.
 */
export function unlockedThrough(done: Record<string, ReadLog>): number {
  let open = LEVELS[0];
  for (const level of LEVELS) {
    const inLevel = LIBRARY.filter((p) => p.level === level);
    const cleared = inLevel.every((p) => done[p.id]?.understood);
    if (cleared) open = Math.min(LEVELS[LEVELS.length - 1], level + 1);
    else break;
  }
  return open;
}

/** The next passage to read: first unread in the lowest open level. */
export function nextPassage(done: Record<string, ReadLog>): Passage | null {
  const open = unlockedThrough(done);
  for (const level of LEVELS.filter((l) => l <= open)) {
    const p = LIBRARY.filter((x) => x.level === level).find(
      (x) => !done[x.id]?.understood,
    );
    if (p) return p;
  }
  return null;
}

/** Best speed so far, which is the number worth watching. */
export function bestWpm(done: Record<string, ReadLog>): number {
  const all = Object.values(done).filter((d) => d.understood);
  return all.length ? Math.max(...all.map((d) => d.wpm)) : 0;
}
