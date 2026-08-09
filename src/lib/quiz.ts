import { LETTERS, TRAP_LETTERS, type Letter } from "./letters";
import { MASTERY_TARGET, statFor, type ProgressMap } from "./progress";

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

export function poolFor(mode: Mode): Letter[] {
  return mode === "traps" ? TRAP_LETTERS : LETTERS;
}

/** Weakest letters come up most often; mastered ones still resurface. */
function pickWeighted(pool: Letter[], progress: ProgressMap): Letter {
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
  const rest = LETTERS.filter((l) => l.char !== target.char);

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
