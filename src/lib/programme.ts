/**
 * The programme: 140 days, one assignment a day.
 *
 * Pure logic only — no storage, no React. See PROGRAMME.md for the rules this
 * implements and plan-hebreu-5-mois.md (§) for where they come from.
 */

import { dayKey, shiftDay } from "./plan.ts";

export const PROGRAMME_DAYS = 140;

/** §5's ~40 new words a day, at 3–4 new words per line. */
export const PLANNED_INTAKE = 12;
export const MIN_INTAKE = 4;
export const MAX_INTAKE = 16;

/** §9.2, made mechanical: below this, stop adding and consolidate. */
export const RETENTION_FLOOR = 0.85;

/** A line is mastered at the same 21-day interval §8 calls mature. */
export const MASTERY_DAYS = 21;

/* --- content ------------------------------------------------------------ */

export type Stage = "listen" | "read" | "produce";

/** The unit of instruction: one vocalised sentence. */
export interface Line {
  id: string;
  /** 1-140. The day this line is issued. */
  day: number;
  /** Vocalised Hebrew. */
  he: string;
  tr: string;
  fr: string;
  en: string;
  /** Ids of the words this line teaches, for the §1 coverage count. */
  words: string[];
  /** Set when the line is a rechargeable pattern (§6). */
  pattern?: string;
  /** Absent until a real voice exists; see PROGRAMME.md §14. */
  audio?: { slow: string; natural: string };
}

/** Scheduling is per line *and* stage: they graduate independently. */
export const cardId = (lineId: string, stage: Stage) => `${lineId}:${stage}`;

/**
 * Production is only asked once the line is already understood. Demanding it
 * on day one collapses intervals and reads as drowning.
 */
export function stagesFor(readInterval: number): Stage[] {
  return readInterval >= MASTERY_DAYS
    ? ["listen", "read", "produce"]
    : ["listen", "read"];
}

/* --- where the trainee is ------------------------------------------------ */

/** Day 1 is the start date itself. Never returns less than 1. */
export function dayNumber(startedOn: string, today = dayKey()): number {
  const [ys, ms, ds] = startedOn.split("-").map(Number);
  const [yt, mt, dt] = today.split("-").map(Number);
  const a = Date.UTC(ys, ms - 1, ds);
  const b = Date.UTC(yt, mt - 1, dt);
  return Math.max(1, Math.floor((b - a) / 86_400_000) + 1);
}

/* --- the daily assignment ------------------------------------------------ */

export interface Intake {
  /** New lines to issue today. */
  count: number;
  /** Set when intake was cut, so the trainee is told why. */
  reason: "planned" | "backlog" | "retention" | "rest";
}

/**
 * Reviews come first; new lines take what capacity is left.
 *
 * §9.2 — review before adding. A backlog means yesterday's work is unfinished,
 * so today's intake shrinks rather than compounding it. Sunday issues nothing
 * new (§5).
 */
export function intakeFor(
  backlog: number,
  retention: number,
  isRestDay: boolean,
  planned = PLANNED_INTAKE,
): Intake {
  if (isRestDay) return { count: 0, reason: "rest" };

  if (retention < RETENTION_FLOOR) {
    return {
      count: Math.max(MIN_INTAKE, Math.floor(planned / 2)),
      reason: "retention",
    };
  }

  const shed = Math.floor(backlog / planned);
  const count = Math.min(MAX_INTAKE, Math.max(MIN_INTAKE, planned - shed));
  return { count, reason: shed > 0 ? "backlog" : "planned" };
}

/** Trailing first-try accuracy. Returns 1 when there's nothing to judge yet. */
export function retentionRate(answers: { correct: boolean }[]): number {
  if (!answers.length) return 1;
  return answers.filter((a) => a.correct).length / answers.length;
}

/* --- consequence --------------------------------------------------------- */

export interface Projection {
  /** Days actually worked. */
  logged: number;
  /** Days elapsed that were not worked. */
  missed: number;
  /** "YYYY-MM-DD" the programme now finishes. */
  deployOn: string;
  /** Positive means behind the original 140-day line. */
  slippage: number;
}

/**
 * Missed days are never punished and never hidden. They move the finish date,
 * and the date is displayed. That is the whole consequence mechanism (§9.1).
 */
export function project(
  startedOn: string,
  loggedDays: number,
  today = dayKey(),
): Projection {
  const elapsed = dayNumber(startedOn, today);
  const missed = Math.max(0, elapsed - loggedDays);
  const remaining = Math.max(0, PROGRAMME_DAYS - loggedDays);
  return {
    logged: loggedDays,
    missed,
    deployOn: shiftDay(today, remaining),
    slippage: missed,
  };
}

/* --- readiness ----------------------------------------------------------- */

export interface ReadinessInput {
  masteredLines: number;
  totalLines: number;
  /** Percentage from the §1 curve. */
  coverage: number;
  assessmentsCleared: number;
  assessmentsDue: number;
}

/**
 * One number, always visible. Weighted so that mastery of the material leads,
 * coverage confirms it, and the assessments keep both honest.
 */
export function readiness(i: ReadinessInput): number {
  const lines = i.totalLines ? i.masteredLines / i.totalLines : 0;
  const cover = Math.min(1, i.coverage / 95);
  const cleared = i.assessmentsDue
    ? i.assessmentsCleared / i.assessmentsDue
    : 1;
  // Integer weights: 0.55 * 0.5 lands on 27.499999 in floating point and
  // rounds a percentage point low. 55 * 0.5 is exact.
  return Math.round(55 * lines + 30 * cover + 15 * cleared);
}

export const DEPLOY_AT = 90;

export function isDeployable(r: number, allCleared: boolean): boolean {
  return r >= DEPLOY_AT && allCleared;
}
