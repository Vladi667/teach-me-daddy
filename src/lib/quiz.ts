import { LETTERS, TRAP_LETTERS, type Letter } from "./letters.ts";
import { MASTERY_TARGET, isBanked, statFor, type ProgressMap } from "./progress.ts";

export const ROUND_LENGTH = 20;
export const OPTION_COUNT = 4;

export type Mode = "print" | "cursive" | "traps";

export const MODES = [
  { id: "print", label: "Print" },
  { id: "cursive", label: "Cursive" },
  { id: "traps", label: "Traps" },
] as const;

export interface Question {
  target: Letter;
  options: Letter[];
}

function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Every glyph a reader has to know cold — 27, not 22.
 *
 * A final form is not a decoration on its letter: ך appears at the end of a
 * word and nowhere else, and a trainee who has only ever drilled כ has to
 * work it out. It gets its own question and its own progress, and its parent
 * letter only counts as known once both shapes do.
 */
export const GLYPHS: Letter[] = LETTERS.flatMap((l) =>
  l.final ? [l, { ...l, char: l.final, final: undefined }] : [l],
);

export function poolFor(mode: Mode): Letter[] {
  return mode === "traps" ? TRAP_LETTERS : GLYPHS;
}

/** Weakest letters come up most often; mastered ones still resurface. */
/**
 * Weakest first — and banked glyphs leave the draw entirely.
 *
 * Without the retirement, every already-earned glyph kept coming back and one
 * slow answer knocked it out of the mastered count again, so the board never
 * converged. Retiring what is banked took the median from "never" to 156
 * answers in simulation. Once everything is banked the whole pool returns, so
 * a finished board still gives you something to practise.
 */
function pickWeighted(pool: Letter[], progress: ProgressMap): Letter {
  const active = pool.filter((l) => !isBanked(progress, l.char));
  if (active.length) pool = active;
  const weights = pool.map((l) =>
    Math.max(1, MASTERY_TARGET + 2 - statFor(progress, l.char).streak),
  );
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i];
    if (r <= 0) return pool[i];
  }
  return pool[pool.length - 1];
}

/**
 * Distractors are drawn from the target's look-alike group first, so a wrong
 * answer means the shapes genuinely aren't distinguished yet.
 */
export function makeQuestion(mode: Mode, progress: ProgressMap): Question {
  const target = pickWeighted(poolFor(mode), progress);
  // Distractors are drawn from the print letters and keyed by *name*: the
  // options are names, so offering KAF against a final kaf would put the
  // right answer on the board twice.
  const rest = LETTERS.filter((l) => l.name !== target.name);

  const ranked = target.group
    ? [
        ...shuffle(rest.filter((l) => l.group === target.group)),
        ...shuffle(rest.filter((l) => l.group !== target.group)),
      ]
    : shuffle(rest);

  return {
    target,
    options: shuffle([target, ...ranked.slice(0, OPTION_COUNT - 1)]),
  };
}
