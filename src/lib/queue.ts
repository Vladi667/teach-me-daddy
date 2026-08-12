/**
 * The review queue, built from the programme's own lines.
 *
 * PROGRAMME.md §4 stages a line: Listen the day it is issued, Read once Listen
 * graduates, Produce once Read has held for 21 days. Those gates were spread
 * across three screens and applied inconsistently; they live here now, so the
 * queue and every runner agree on what a trainee is allowed to be asked.
 */

import { MASTERY_DAYS, cardId, type Line, type Stage } from "./programme.ts";
import { isReview, type SrsCard } from "./srs.ts";

export interface StageCard {
  /** `${lineId}:${stage}` — the SRS key. */
  id: string;
  line: Line;
  stage: Stage;
}

type Cards = Record<string, SrsCard | undefined>;

/** §4 — which stages of a line the trainee has earned the right to be asked. */
export function unlockedStages(line: Line, srs: Cards): Stage[] {
  const listen = srs[cardId(line.id, "listen")];
  const read = srs[cardId(line.id, "read")];

  const out: Stage[] = ["listen"];
  // Reading a line you can't yet recognise by ear is just decoding.
  if (listen && isReview(listen)) out.push("read");
  if (read && isReview(read) && read.interval >= MASTERY_DAYS) {
    out.push("produce");
  }
  return out;
}

/**
 * Every card the trainee could legitimately be shown today.
 *
 * Lines the programme hasn't issued yet are absent: §9 forbids browsing the
 * deck ahead, and that has to be true of the scheduler too, not just the UI.
 */
export function stageCards(lines: Line[], srs: Cards, day: number): StageCard[] {
  const out: StageCard[] = [];
  for (const line of lines) {
    if (line.day > day) continue;
    for (const stage of unlockedStages(line, srs)) {
      out.push({ id: cardId(line.id, stage), line, stage });
    }
  }
  return out;
}

/** Lines issued today that the trainee has not started yet. */
export function freshLines(lines: Line[], srs: Cards, day: number): Line[] {
  return lines.filter(
    (l) => l.day === day && !srs[cardId(l.id, "listen")],
  );
}

/** What a stage asks and what it answers, so the runners don't each decide. */
export const PROMPT: Record<Stage, { ask: string; answer: string }> = {
  listen: { ask: "Audio, slow", answer: "Meaning" },
  read: { ask: "Vocalised Hebrew", answer: "Meaning" },
  produce: { ask: "Meaning", answer: "The Hebrew line" },
};
