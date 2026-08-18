/**
 * The affix drill — §8f.
 *
 * A reader who cannot strip a prefix reads a six-character word where a fluent
 * reader sees one letter plus a root already known. On this corpus, 40.1% of
 * running words begin with a mem/shin/he/vav/kaf/lamed/bet letter carrying a
 * vowel a real prefix can take, so this is the largest single lever left after
 * the glyphs themselves.
 *
 * Note the honest figure. It is *not* the 56.1% of words that merely start with
 * one of those letters — that count includes מַיִם and שָׁלוֹם, which wear no
 * prefix at all. See scripts/build-affix.mjs for how the material is verified.
 *
 * Two stages, because stripping is two skills. Knowing what בְּ means is not
 * knowing where בְּ ends, and the second is the one that makes reading faster.
 */

import { FAMILIES } from "./affix.gen.ts";

export interface AffixForm {
  /** The prefixed word, pointed, exactly as attested. */
  he: string;
  /** The prefix letter, unpointed. */
  prefix: string;
}

export interface AffixFamily {
  /** The bare word, pointed, as attested standalone. */
  base: string;
  /** How often the bare word appears in the corpus. */
  seen: number;
  forms: AffixForm[];
}

export { FAMILIES };

/**
 * The seven proclitics, מש״ה וכל״ב.
 *
 * The meaning given is the core one. בַּ, לַ and כַּ also carry the definite
 * article — "in the" rather than "in" — but that distinction is not what the
 * options test, and offering both "in" and "in the" would make the question
 * about English rather than Hebrew.
 */
export const PREFIXES: { letter: string; sound: string; means: string }[] = [
  { letter: "ה", sound: "ha", means: "the" },
  { letter: "ו", sound: "ve", means: "and" },
  { letter: "ב", sound: "be", means: "in" },
  { letter: "כ", sound: "ke", means: "like" },
  { letter: "ל", sound: "le", means: "to" },
  { letter: "מ", sound: "mi", means: "from" },
  { letter: "ש", sound: "she", means: "that" },
];

const MEANS = new Map(PREFIXES.map((p) => [p.letter, p.means]));
export const meaningOf = (letter: string) => MEANS.get(letter) ?? "";

export type StageN = 1 | 2;

export interface AffixItem {
  /** Namespaced so it cannot collide with a letter or a blend item. */
  id: string;
  stage: StageN;
  /** The whole prefixed word. */
  form: string;
  prefix: string;
  base: string;
  /** What a correct answer is, at this stage. */
  answer: string;
}

const NIKUD = /[֑-ׇ]/g;
export const bare = (w: string) => w.normalize("NFC").replace(NIKUD, "");

/** The prefix and the rest, split for display. */
export function cut(form: string, prefix: string): [string, string] {
  const cs = [...form.normalize("NFC")];
  let i = 1;
  // Carry the prefix's own points, and the dagesh that lands on the next letter
  // stays with that letter, where it belongs.
  while (i < cs.length && /[֑-ׇ]/.test(cs[i]) && cs[i] !== "ּ") i++;
  const head = cs.slice(0, i).join("");
  return bare(head) === prefix ? [head, cs.slice(i).join("")] : ["", form];
}

function build(stage: StageN): AffixItem[] {
  const out: AffixItem[] = [];
  for (const f of FAMILIES) {
    for (const x of f.forms) {
      out.push({
        id: `ap${stage}:${x.he}`,
        stage,
        form: x.he,
        prefix: x.prefix,
        base: f.base,
        answer: stage === 1 ? meaningOf(x.prefix) : f.base,
      });
    }
  }
  return out;
}

export interface AffixStage {
  n: StageN;
  title: string;
  /** The one thing this stage adds. */
  teach: string;
  ask: string;
  items: AffixItem[];
}

export const STAGES: AffixStage[] = [
  {
    n: 1,
    title: "What the little letter says",
    teach:
      "Seven letters attach to the front of a word and change its meaning without being part of it: ה the, ו and, ב in, כ like, ל to, מ from, ש that. They are always a single letter with a single short vowel.",
    ask: "What does the front letter say?",
    items: build(1),
  },
  {
    n: 2,
    title: "Find the word underneath",
    teach:
      "Now the prefix is not marked. Cover the first letter and read what is left — that is the word you already know. This is the whole trick: a long word is usually a short word wearing one letter.",
    ask: "What is the word underneath?",
    items: build(2),
  },
];

export const ALL_ITEMS = STAGES.flatMap((s) => s.items);

/** The families worth showing as a contrast, biggest first. */
export const TEACH_FAMILIES = FAMILIES.filter((f) => f.forms.length >= 4).slice(0, 6);

function sample<T>(from: readonly T[], n: number): T[] {
  const pool = [...from];
  const out: T[] = [];
  while (out.length < n && pool.length) {
    out.push(...pool.splice(Math.floor(Math.random() * pool.length), 1));
  }
  return out;
}

/**
 * The options for one question.
 *
 * Stage 2's distractors are drawn from bases of a similar length to the answer.
 * Offering wildly different words would let the question be answered on shape
 * alone, without ever stripping anything — which is the skill being tested.
 */
export function optionsFor(item: AffixItem, count = 4): string[] {
  if (item.stage === 1) {
    const others = PREFIXES.map((p) => p.means).filter((m) => m !== item.answer);
    return [item.answer, ...sample(others, count - 1)];
  }
  const others = FAMILIES.map((f) => f.base).filter((b) => b !== item.base);
  const near = others
    .map((b) => ({ b, d: Math.abs(bare(b).length - bare(item.base).length) }))
    .sort((x, y) => x.d - y.d)
    .slice(0, 24)
    .map((x) => x.b);
  const picked = sample(near, count - 1);
  return [item.answer, ...picked, ...sample(others, count - 1 - picked.length)].slice(
    0,
    count,
  );
}

/**
 * Draw the next question, weighted toward what is least known.
 *
 * Mirrors blend.ts deliberately: banked items leave the draw so a stage
 * converges instead of circling, and the pool returns in full once everything
 * is banked so the drill stays usable as free practice.
 */
export function nextQuestion(
  stage: AffixStage,
  streakOf: (id: string) => number,
  target = 3,
  banked: (id: string) => boolean = () => false,
): { item: AffixItem; options: string[] } {
  const active = stage.items.filter((i) => !banked(i.id));
  const items = active.length ? active : stage.items;
  const weights = items.map((i) => Math.max(1, target + 2 - streakOf(i.id)));
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  let pick = items[items.length - 1];
  for (let k = 0; k < items.length; k++) {
    r -= weights[k];
    if (r <= 0) {
      pick = items[k];
      break;
    }
  }
  const opts = optionsFor(pick);
  for (let i = opts.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [opts[i], opts[j]] = [opts[j], opts[i]];
  }
  return { item: pick, options: opts };
}

/** Items banked in a stage, over the number it holds. */
export function clearedIn(
  stage: AffixStage,
  banked: (id: string) => boolean,
): { cleared: number; total: number } {
  return {
    cleared: stage.items.filter((i) => banked(i.id)).length,
    total: stage.items.length,
  };
}
