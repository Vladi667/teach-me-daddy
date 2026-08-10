/**
 * Spaced repetition — SM-2 with learning steps, as Anki implements it.
 *
 * A card is either *learning* (still inside the short steps, measured in
 * minutes) or *review* (graduated, interval measured in days). Ease starts at
 * 2.5 and drifts with your answers; a lapse drops the card back into learning.
 *
 * Deliberately independent of what's on the card, so letters, words and
 * sentence patterns all schedule through the same engine.
 */

export const AGAIN = 0;
export const HARD = 1;
export const GOOD = 2;
export const EASY = 3;

export type Grade = typeof AGAIN | typeof HARD | typeof GOOD | typeof EASY;

export const GRADES: { grade: Grade; label: string; tint: string }[] = [
  { grade: AGAIN, label: "Again", tint: "var(--color-bad)" },
  { grade: HARD, label: "Hard", tint: "var(--color-warn)" },
  { grade: GOOD, label: "Good", tint: "var(--color-good)" },
  { grade: EASY, label: "Easy", tint: "var(--color-accent)" },
];

const MIN = 60_000;
const DAY = 86_400_000;

/** Minutes between the learning steps a new card walks through. */
const LEARNING_STEPS = [1, 10];
/** Interval a card gets the moment it graduates out of learning. */
const GRADUATING_INTERVAL = 1;
/** Interval for a card graduated straight out with "Easy". */
const EASY_INTERVAL = 4;
/** Interval a lapsed card returns with once it re-graduates. */
const LAPSE_INTERVAL = 1;

const START_EASE = 2.5;
const MIN_EASE = 1.3;
const MAX_INTERVAL = 365;

export interface SrsCard {
  /** Steps remaining in the learning phase; null once graduated. */
  step: number | null;
  /** Days. 0 while learning. */
  interval: number;
  ease: number;
  reps: number;
  lapses: number;
  /** Epoch ms when the card next comes up. */
  due: number;
  /** Epoch ms of the last answer, or 0 if never seen. */
  last: number;
}

export function newCard(now: number): SrsCard {
  return {
    step: 0,
    interval: 0,
    ease: START_EASE,
    reps: 0,
    lapses: 0,
    due: now,
    last: 0,
  };
}

export const isNew = (c: SrsCard) => c.reps === 0;
export const isLearning = (c: SrsCard) => c.step !== null;
export const isReview = (c: SrsCard) => c.step === null;

/** "Mature" in the Anki sense — the §8 metric the plan tracks weekly. */
export const isMature = (c: SrsCard) => isReview(c) && c.interval >= 21;

export const isDue = (c: SrsCard, now: number) => c.due <= now;

const clampEase = (e: number) => Math.max(MIN_EASE, e);
const clampInterval = (d: number) => Math.min(MAX_INTERVAL, Math.max(1, d));

/**
 * Apply an answer. Pure — returns the next state rather than mutating, so the
 * caller decides when it lands in the store.
 */
export function review(card: SrsCard, grade: Grade, now: number): SrsCard {
  const next: SrsCard = { ...card, reps: card.reps + 1, last: now };

  // --- learning / relearning -------------------------------------------
  if (card.step !== null) {
    if (grade === AGAIN) {
      next.step = 0;
      next.due = now + LEARNING_STEPS[0] * MIN;
      return next;
    }

    if (grade === EASY) {
      next.step = null;
      next.interval = card.lapses > 0 ? LAPSE_INTERVAL : EASY_INTERVAL;
      next.due = now + next.interval * DAY;
      return next;
    }

    // Hard repeats the current step; Good advances.
    const step = grade === HARD ? card.step : card.step + 1;

    if (step >= LEARNING_STEPS.length) {
      next.step = null;
      next.interval = card.lapses > 0 ? LAPSE_INTERVAL : GRADUATING_INTERVAL;
      next.due = now + next.interval * DAY;
      return next;
    }

    next.step = step;
    next.due = now + LEARNING_STEPS[step] * MIN;
    return next;
  }

  // --- review ------------------------------------------------------------
  if (grade === AGAIN) {
    next.lapses = card.lapses + 1;
    next.ease = clampEase(card.ease - 0.2);
    next.step = 0;
    next.interval = 0;
    next.due = now + LEARNING_STEPS[0] * MIN;
    return next;
  }

  // How overdue the card was counts toward the next interval — answering a
  // card three days late is evidence the memory held for longer.
  const elapsed = card.last ? Math.max(0, (now - card.due) / DAY) : 0;
  const base = card.interval;

  const good = (base + elapsed / 2) * card.ease;

  let interval: number;
  if (grade === HARD) {
    next.ease = clampEase(card.ease - 0.15);
    interval = Math.min(base * 1.2, good);
  } else if (grade === GOOD) {
    interval = good;
  } else {
    next.ease = clampEase(card.ease + 0.15);
    // At short intervals the Easy multiplier rounds to the same day as Good,
    // which makes the button pointless. Keep it strictly further out.
    interval = Math.max((base + elapsed) * card.ease * 1.3, good + 1);
  }

  next.interval = clampInterval(Math.round(interval));
  next.step = null;
  next.due = now + next.interval * DAY;
  return next;
}

/** Human-readable preview of where each button sends the card. */
export function previewInterval(
  card: SrsCard,
  grade: Grade,
  now: number,
): string {
  const next = review(card, grade, now);
  const ms = next.due - now;
  if (ms < 60 * MIN) return `${Math.max(1, Math.round(ms / MIN))}m`;
  if (ms < DAY) return `${Math.round(ms / (60 * MIN))}h`;
  const days = Math.round(ms / DAY);
  if (days < 31) return `${days}d`;
  if (days < 365) return `${(days / 30.4).toFixed(1)}mo`;
  return `${(days / 365).toFixed(1)}y`;
}

export interface QueueCounts {
  fresh: number;
  learning: number;
  due: number;
  total: number;
}

/**
 * Build the review queue: cards already in flight first, then whatever new
 * cards the daily cap still allows. The plan caps new items at ~40/day —
 * beyond that retention collapses because review can't keep up.
 */
export function buildQueue<T extends { id: string }>(
  items: T[],
  cards: Record<string, SrsCard | undefined>,
  now: number,
  newAllowance: number,
): { queue: T[]; counts: QueueCounts } {
  const fresh: T[] = [];
  const learning: T[] = [];
  const due: T[] = [];

  for (const item of items) {
    const c = cards[item.id];
    if (!c) {
      fresh.push(item);
      continue;
    }
    if (!isDue(c, now)) continue;
    if (isNew(c) || isLearning(c)) learning.push(item);
    else due.push(item);
  }

  const admitted = fresh.slice(0, Math.max(0, newAllowance));

  return {
    queue: [...learning, ...due, ...admitted],
    counts: {
      fresh: admitted.length,
      learning: learning.length,
      due: due.length,
      total: learning.length + due.length + admitted.length,
    },
  };
}

/** Cards coming due over the next `days` days, for the forecast chart. */
export function forecast(
  cards: SrsCard[],
  now: number,
  days: number,
): number[] {
  const out = new Array(days).fill(0);
  const startOfToday = new Date(now).setHours(0, 0, 0, 0);
  for (const c of cards) {
    const d = Math.floor((c.due - startOfToday) / DAY);
    if (d >= 0 && d < days) out[d] += 1;
    else if (d < 0) out[0] += 1;
  }
  return out;
}
