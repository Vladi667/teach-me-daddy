/**
 * Monthly assessment — PROGRAMME.md §6, from §8 of the plan.
 *
 * Once a month the trainee reads an unseen passage and marks every word they
 * don't know. That measurement, not the SRS, is what says whether the month's
 * coverage target on the §1 curve was actually met.
 *
 * Clearance is deliberately not a lock. Failing does not stop the next month —
 * blocking a trainee who is mid-flow is instructor malpractice. It costs a
 * NOT CLEARED mark, a capped readiness, and a week of reduced intake.
 */

/** Days between assessments. Five of them across the 140. */
export const ASSESSMENT_EVERY = 28;

/** §6 — the coverage each month must reach, as the lower bound of its band. */
export const MONTH_TARGET: Record<number, number> = {
  1: 55,
  2: 85,
  3: 91,
  4: 94,
  5: 95,
};

/** §6 — intake drops for one week after a failure, then recovers by itself. */
export const PENALTY_DAYS = 7;

/**
 * Readiness ceiling while a month stands NOT CLEARED. Well under DEPLOY_AT, so
 * the number reads as "not ready" rather than "nearly there" — a cap of 89
 * would block deployment while still looking like a pass.
 */
export const UNCLEARED_CAP = 75;

export interface Assessment {
  /** 1-5. */
  month: number;
  /** "YYYY-MM-DD". */
  takenOn: string;
  /** Words the trainee understood. */
  known: number;
  /** Words in the passage. */
  total: number;
  /** known/total as a percentage, one decimal. */
  coverage: number;
  cleared: boolean;
  /** The words marked unknown, for the §6 re-injection. */
  missed: string[];
}

/** Which month a given programme day belongs to. */
export function monthOfDay(day: number): number {
  return Math.min(5, Math.max(1, Math.ceil(day / ASSESSMENT_EVERY)));
}

/** How many assessments should have been taken by now. */
export function assessmentsDue(day: number): number {
  return Math.min(5, Math.floor(day / ASSESSMENT_EVERY));
}

/**
 * The month whose assessment is owed, or null. A month is owed once its last
 * day passes and stays owed until it is *cleared* — a failed attempt is on the
 * record, but the retake is still outstanding.
 */
export function dueAssessment(
  day: number,
  taken: Assessment[],
): number | null {
  for (let m = 1; m <= assessmentsDue(day); m++) {
    if (!taken.some((a) => a.month === m && a.cleared)) return m;
  }
  return null;
}

/** Marks a passage against its month's target. */
export function score(
  month: number,
  words: string[],
  missed: string[],
  takenOn: string,
): Assessment {
  const total = words.length;
  const unknown = new Set(missed);
  const known = total - words.filter((w) => unknown.has(w)).length;
  // One decimal: a 60-word passage moves 1.7 points per word, and rounding
  // that to a whole number would put a pass and a fail on the same figure.
  const coverage = total ? Math.round((known / total) * 1000) / 10 : 0;
  return {
    month,
    takenOn,
    known,
    total,
    coverage,
    cleared: coverage >= (MONTH_TARGET[month] ?? 95),
    missed: [...unknown],
  };
}

/** Months that have been passed. Counts a month once, however many attempts. */
export function clearedCount(taken: Assessment[]): number {
  return new Set(taken.filter((a) => a.cleared).map((a) => a.month)).size;
}

/** True while any month that has come due is still not cleared. */
export function hasUncleared(day: number, taken: Assessment[]): boolean {
  return dueAssessment(day, taken) !== null;
}

/**
 * §6 — a failure costs a week of halved intake. Measured from the attempt, so
 * an immediate retake that passes still leaves the week to run: the material
 * was thin, and adding to it faster is the wrong answer either way.
 */
export function penaltyActive(
  taken: Assessment[],
  today: string,
  days = PENALTY_DAYS,
): boolean {
  return taken.some((a) => {
    if (a.cleared) return false;
    return daysBetween(a.takenOn, today) < days;
  });
}

function daysBetween(from: string, to: string): number {
  const [y1, m1, d1] = from.split("-").map(Number);
  const [y2, m2, d2] = to.split("-").map(Number);
  return Math.round(
    (Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86_400_000,
  );
}

/**
 * §6 — words missed in an assessment come back as lines.
 *
 * Not as bare words: the unit of instruction is the line (§1), so a missed
 * word is repaid by promoting a line that carries it. Lines already issued are
 * skipped — the trainee has met them and missed the word anyway, so repeating
 * them teaches nothing new.
 */
export function repairLines<T extends { id: string; day: number; words: string[] }>(
  missed: string[],
  lines: T[],
  issuedThrough: number,
  limit: number,
): T[] {
  if (!missed.length || limit <= 0) return [];
  const want = new Set(missed);
  const out: T[] = [];
  for (const l of lines) {
    if (out.length >= limit) break;
    if (l.day <= issuedThrough) continue;
    if (!l.words.some((w) => want.has(w))) continue;
    out.push(l);
    // One line per word: three lines drilling the same missed word crowds out
    // the other two words that were also missed.
    l.words.forEach((w) => want.delete(w));
  }
  return out;
}
