/**
 * The weekly test — §8d.
 *
 * The ulpan sets a test every week, and it is the one deadline in this app the
 * programme did not invent. So it does not go through the SRS: a card that is
 * due in four days is no use on Thursday. Each week is a fixed bank of
 * questions, drilled section by section or sat end to end as a mock, and every
 * run is kept.
 *
 * Keeping every run is the whole point. A single score says nothing — it is
 * the third run against the first that tells you whether the evening worked.
 * So a run is never overwritten and never averaged away: `series` returns them
 * in order and `delta` reports the distance travelled, including when it is
 * negative.
 *
 * Adding next week is one file and one line: write `exams.w2.ts` in the shape
 * of `Week`, and add it to `WEEKS`.
 */

import { WEEK_1 } from "./exams.w1.ts";

/* --- shape ---------------------------------------------------------------- */

export interface ExamQuestion {
  /** `<section>-<n>`, positional within its section. */
  id: string;
  /** The section this belongs to. */
  part: string;
  /** The stem, shown large. Hebrew for most, English for the matching items. */
  prompt: string;
  /**
   * The English line under it — a translation for the sentences, an
   * instruction for the matching items. Never the answer.
   */
  en: string;
  /** Romanisation, where the sentence has one. Hidden with §9.5 phonetics. */
  tr?: string;
  options: string[];
  /** Index into `options` as written here, before they are shuffled. */
  answer: number;
  /** The rule, in Hebrew — what a teacher writes in the margin. */
  note: string;
  /** The same rule in English, for when the margin note is the hard part. */
  why: string;
}

export interface FormField {
  key: string;
  he: string;
  en: string;
  /** Placeholder, for the fields where an example is worth more than a label. */
  hint?: string;
  kind: "text" | "boxes" | "chips";
  /** For `chips`: the Hebrew word and its English gloss. */
  options?: [string, string][];
}

export interface ClozePassage {
  id: string;
  title: string;
  en: string;
  /** `{0}`, `{1}` … mark the blanks, in order. */
  text: string;
  /** One per blank, in order. */
  answers: string[];
  /** Plausible wrong words mixed into the bank. */
  decoys: string[];
}

export interface Section {
  id: string;
  /** The number the ulpan itself uses — "01", "02" … */
  n: string;
  he: string;
  en: string;
  kind: "quiz" | "form" | "cloze";
}

export interface Week {
  id: string;
  n: number;
  he: string;
  en: string;
  /** What the teacher said would be on it. */
  brief: string;
  sections: Section[];
  questions: ExamQuestion[];
  form?: FormField[];
  passages?: ClozePassage[];
}

/** One sitting, kept forever. */
export interface ExamRun {
  week: string;
  /** A section id, or `MOCK`. */
  part: string;
  /** Which passage, for the gap-fill section. */
  item?: string;
  right: number;
  asked: number;
  /** How long it took, in milliseconds. */
  ms: number;
  /** "YYYY-MM-DD". */
  on: string;
  /** Epoch ms — two runs on one evening still order. */
  at: number;
}

export const WEEKS: Week[] = [WEEK_1];

/** The mixed set, sat as an exam: no corrections until the end. */
export const MOCK = "mock";

/** Questions in a mock. Long enough to be a test, short enough to sit twice. */
export const MOCK_SIZE = 40;

/** What counts as ready. The ulpan's own pass mark is lower; this isn't it. */
export const PASS = 80;

export const weekById = (id: string): Week | undefined =>
  WEEKS.find((w) => w.id === id);

/** Sections that produce a score. The form is practice — there is nothing to mark. */
export const scored = (w: Week): Section[] =>
  w.sections.filter((s) => s.kind !== "form");

export const questionsIn = (w: Week, part: string): ExamQuestion[] =>
  w.questions.filter((q) => q.part === part);

/** True for a string that should set right-to-left. */
export const isHebrew = (s: string): boolean => /[֐-׿]/.test(s);

/* --- drawing -------------------------------------------------------------- */

function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** A question with its options in the order they will be shown. */
export interface Drawn {
  q: ExamQuestion;
  options: string[];
  /** Index into the shuffled `options`. */
  answer: number;
}

/**
 * Options are shuffled every time. Left as written, the fourth run stops
 * testing Hebrew and starts testing which position the answer sat in.
 */
export function present(q: ExamQuestion): Drawn {
  const right = q.options[q.answer];
  const options = shuffle(q.options);
  return { q, options, answer: options.indexOf(right) };
}

/**
 * A section drill is the whole section, shuffled — not a sample of it.
 *
 * A random 15 of 30 would make two runs incomparable, and comparing runs is
 * what this screen exists for.
 */
export const drawSection = (w: Week, part: string): Drawn[] =>
  shuffle(questionsIn(w, part)).map(present);

/**
 * The mock draws proportionally from every quiz section, by largest remainder,
 * so a 40-question paper reflects the bank rather than whatever the shuffle
 * happened to favour.
 */
export function drawMock(w: Week, size = MOCK_SIZE): Drawn[] {
  const parts = scored(w).filter((s) => s.kind === "quiz");
  const pools = parts.map((s) => questionsIn(w, s.id));
  const total = pools.reduce((n, p) => n + p.length, 0);
  if (!total) return [];

  const want = Math.min(size, total);
  const exact = pools.map((p) => (want * p.length) / total);
  const take = exact.map(Math.floor);

  // Hand out the remainder to the sections that lost the most in the floor,
  // and never ask for more of a section than it holds.
  const order = exact
    .map((e, i) => ({ i, rest: e - Math.floor(e) }))
    .sort((a, b) => b.rest - a.rest);
  let short = want - take.reduce((n, t) => n + t, 0);
  for (let pass = 0; short > 0 && pass < pools.length; pass++) {
    for (const { i } of order) {
      if (short <= 0) break;
      if (take[i] < pools[i].length) {
        take[i]++;
        short--;
      }
    }
  }

  return shuffle(pools.flatMap((p, i) => shuffle(p).slice(0, take[i]))).map(
    present,
  );
}

/** The word bank for a passage: its answers and its decoys, shuffled. */
export const clozeBank = (p: ClozePassage): string[] =>
  shuffle([...p.answers, ...p.decoys]);

/** The passage split into text and blanks, in reading order. */
export function clozeParts(
  p: ClozePassage,
): ({ text: string } | { blank: number })[] {
  const out: ({ text: string } | { blank: number })[] = [];
  const re = /\{(\d+)\}/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(p.text))) {
    if (m.index > last) out.push({ text: p.text.slice(last, m.index) });
    out.push({ blank: Number(m[1]) });
    last = m.index + m[0].length;
  }
  if (last < p.text.length) out.push({ text: p.text.slice(last) });
  return out;
}

/* --- the record ----------------------------------------------------------- */

export const pct = (r: { right: number; asked: number }): number =>
  r.asked > 0 ? Math.round((100 * r.right) / r.asked) : 0;

/** Every run against one part, oldest first. */
export function runsFor(
  runs: ExamRun[],
  week: string,
  part?: string,
  item?: string,
): ExamRun[] {
  return runs
    .filter(
      (r) =>
        r.week === week &&
        (part === undefined || r.part === part) &&
        (item === undefined || r.item === item),
    )
    .sort((a, b) => a.at - b.at);
}

export const attempts = (
  runs: ExamRun[],
  week: string,
  part?: string,
  item?: string,
): number => runsFor(runs, week, part, item).length;

/** Percentages in the order they were scored — the shape of the improvement. */
export const series = (
  runs: ExamRun[],
  week: string,
  part?: string,
  item?: string,
): number[] => runsFor(runs, week, part, item).map(pct);

export function bestPct(
  runs: ExamRun[],
  week: string,
  part?: string,
  item?: string,
): number | null {
  const all = series(runs, week, part, item);
  return all.length ? Math.max(...all) : null;
}

export function lastRun(
  runs: ExamRun[],
  week: string,
  part?: string,
  item?: string,
): ExamRun | null {
  const all = runsFor(runs, week, part, item);
  return all.length ? all[all.length - 1] : null;
}

/**
 * Latest minus first, in points. Null until there are two runs to compare,
 * because one score is not a trend — and negative is a real answer.
 */
export function delta(
  runs: ExamRun[],
  week: string,
  part?: string,
  item?: string,
): number | null {
  const all = series(runs, week, part, item);
  if (all.length < 2) return null;
  return all[all.length - 1] - all[0];
}

/**
 * Where the week stands: the average of your best in each scored section,
 * counting the sections you have never opened as zero.
 *
 * Averaging only what has been attempted would read 100% after one perfect
 * section, which is precisely the reassurance a test week cannot afford.
 */
export function readiness(runs: ExamRun[], w: Week): number {
  const parts = scored(w);
  if (!parts.length) return 0;
  const total = parts.reduce(
    (n, s) => n + (bestPct(runs, w.id, s.id) ?? 0),
    0,
  );
  return Math.round(total / parts.length);
}

/** Runs across every week, newest first — the record, as a list. */
export const recent = (runs: ExamRun[], limit = 12): ExamRun[] =>
  [...runs].sort((a, b) => b.at - a.at).slice(0, limit);
