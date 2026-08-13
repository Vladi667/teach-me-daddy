/**
 * Reading lessons — the rung between knowing the glyphs and reading a page.
 *
 * The alphabet drill teaches 27 shapes and the points drill teaches 19 marks,
 * and then the app used to hand over a 56-word passage. Nothing in between
 * ever said how a letter and a vowel become a syllable, or how syllables
 * become a word. That is the step every literacy programme spends its time
 * on, and it was the one step missing.
 *
 * Five stages, each adding exactly one mechanic:
 *
 *   1. open syllable      מַ        consonant carries the vowel under it
 *   2. closed syllable    מַן       a consonant with no vowel closes it
 *   3. two syllables      שָׁלוֹם     real words, read in parts
 *   4. prefixes           הַבַּיִת    the letters glued to the front
 *   5. short phrases      three or four words at once
 *
 * The answer is always the *pronunciation*, produced by `translit()` — the
 * same tested function that writes the phonetics under every line. There is
 * no hand-written answer key here to drift out of step with the corpus.
 *
 * This teaches decoding, not vocabulary. Stages 3-5 use real Hebrew words
 * pulled from the corpus, but no meaning is shown: the skill being built is
 * turning marks into sounds, and a gloss would invite recognising the word
 * instead of reading it.
 */

import { LINES } from "./lines.ts";
import { translit } from "./translit.ts";

const NIKUD = /[֑-ׇ]/;
const NIKUD_G = /[֑-ׇ]/g;

/** Vowel marks that make a syllable. Sheva and dagesh do not, on their own. */
const VOWEL_MARKS = /[ֱֲֳִֵֶַָׇֹֺֻ]/;

export interface Unit {
  letter: string;
  points: string;
}

/** Letters with the points that follow them. */
export function units(word: string): Unit[] {
  const out: Unit[] = [];
  for (const ch of word.normalize("NFC")) {
    if (NIKUD.test(ch)) {
      if (out.length) out[out.length - 1].points += ch;
      continue;
    }
    out.push({ letter: ch, points: "" });
  }
  return out;
}

/**
 * Split a pointed word into syllables.
 *
 * A syllable runs from a consonant to its vowel, and swallows a following
 * consonant that has no vowel of its own — which is exactly what "closed
 * syllable" means, and exactly the thing stage 2 exists to teach.
 */
export function syllables(word: string): string[] {
  const us = units(word);
  const out: string[] = [];
  let cur = "";

  /**
   * A vav or yod carrying no vowel of its own *is* the vowel of the letter
   * before it — שׁ + לוֹ + ם is sha-lom, not shal-om. Without this the
   * splitter closes the previous syllable on the lamed and teaches the wrong
   * break, which is worse than teaching none.
   */
  const isMater = (u: Unit | undefined) => {
    if (!u) return false;
    // A vav writing o or u is the vowel itself, even though holam sits in the
    // vowel-mark set - that mark belongs to the consonant before it.
    if (u.letter === "ו") return /[ֹֺּ]/.test(u.points);
    return u.letter === "י" && !VOWEL_MARKS.test(u.points);
  };

  /**
   * Does this piece already carry a vowel sound? A shuruk or holam-vav is a
   * nucleus without carrying a vowel *mark*, and a word-initial sheva is
   * pronounced - both open a syllable.
   */
  const hasNucleus = (piece: string, atStart = false) =>
    VOWEL_MARKS.test(piece) ||
    /ו[ֹֺּ]/.test(piece) ||
    (atStart && /ְ/.test(piece));

  for (let i = 0; i < us.length; i++) {
    const u = us[i];
    const piece = u.letter + u.points;
    if (!/[א-ת]/.test(u.letter)) {
      cur += piece;
      continue;
    }
    const hasVowel = VOWEL_MARKS.test(u.points);

    if (!hasVowel && !isMater(u)) {
      // Its vowel may be the vav or yod that follows, in which case it opens
      // a syllable rather than closing one.
      if (isMater(us[i + 1])) {
        if (cur && hasNucleus(cur, out.length === 0)) {
          out.push(cur);
          cur = "";
        }
        cur += piece;
        continue;
      }
      if (cur && hasNucleus(cur, out.length === 0)) {
        out.push(cur + piece);
        cur = "";
        continue;
      }
      // A stray closing consonant with nothing pending belongs to the
      // syllable already emitted: יְלָ-דִי-ם is not three syllables.
      if (!cur && out.length) {
        out[out.length - 1] += piece;
        continue;
      }
    }

    if (hasVowel && cur && hasNucleus(cur, out.length === 0)) {
      out.push(cur);
      cur = piece;
      continue;
    }
    cur += piece;
  }
  if (cur) {
    if (!hasNucleus(cur, out.length === 0) && out.length) {
      out[out.length - 1] += cur;
    } else out.push(cur);
  }
  return out;
}

/** How the word breaks down, for showing after a miss. */
export function breakdown(word: string): { part: string; sound: string }[] {
  return syllables(word).map((s) => ({ part: s, sound: translit(s).toLowerCase() }));
}

/* --- the stages ----------------------------------------------------------- */

export interface Item {
  /** Progress key. */
  id: string;
  /** Pointed Hebrew to read. */
  show: string;
  /** The pronunciation, which is the answer. */
  answer: string;
}

export interface Stage {
  n: number;
  title: string;
  /** What this stage adds. Shown before the first item, once. */
  teach: string;
  /**
   * The worked example, fixed rather than drawn from the items.
   *
   * The card said "מ with a patah is ma" and then showed a random שֻ, which
   * demonstrates the rule with the wrong letters. An example that does not
   * match the sentence above it is worse than none.
   */
  example: string;
  items: Item[];
}

const strip = (s: string) => s.replace(NIKUD_G, "").replace(/[^א-ת]/g, "");

/** Distinct pointed words from the corpus with exactly `n` vowels. */
function corpusWords(vowels: number, limit: number, filter?: (w: string) => boolean) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const l of LINES) {
    for (const raw of l.he.split(/\s+/)) {
      const w = raw.normalize("NFC").replace(/[^א-ת֑-ׇ]/g, "");
      if (!w) continue;
      const k = strip(w);
      if (!k || seen.has(k)) continue;
      const count = [...w].filter((c) => VOWEL_MARKS.test(c)).length;
      if (count !== vowels) continue;
      if (filter && !filter(w)) continue;
      // Only words the transliterator handles cleanly are usable as answers.
      const t = translit(w);
      if (!t || /[א-ת]/.test(t)) continue;
      seen.add(k);
      out.push(w);
      if (out.length >= limit) return out;
    }
  }
  return out;
}

/** The one-letter prefixes that trip every beginner in real text. */
const PREFIXES = ["ה", "ב", "ו", "ל", "כ", "מ", "ש"];

const CARRIERS = ["מ", "ב", "ל", "ש", "ת", "נ", "ק", "ד", "ס", "ר"];
const MARKS = ["ַ", "ֶ", "ִ", "ֹ", "ֻ"];

function generatedSyllables(closed: boolean, limit: number): string[] {
  const out: string[] = [];
  for (const c of CARRIERS) {
    for (const m of MARKS) {
      const base = c + m;
      out.push(closed ? base + "ן" : base);
      if (out.length >= limit) return out;
    }
  }
  return out;
}

/**
 * The id keeps the points. Stripping them made מַ and מֶ the same key, which
 * merged the progress of two items whose whole difference is the mark.
 */
const item = (prefix: string, show: string): Item => ({
  id: `${prefix}:${show.normalize("NFC")}`,
  show,
  answer: translit(show).toLowerCase(),
});

export const STAGES: Stage[] = [
  {
    n: 1,
    title: "One sound at a time",
    example: "מַ",
    teach:
      "A consonant carries the vowel written under it, and you say them together — the letter first, then the mark. מ with a patah under it is “ma”. That is the whole of reading Hebrew, repeated.",
    items: generatedSyllables(false, 20).map((s) => item("s1", s)),
  },
  {
    n: 2,
    title: "Closing the syllable",
    example: "מַן",
    teach:
      "A consonant with no vowel of its own does not start anything — it closes the syllable in front of it. מַ is “ma”; מַן is “man”. The final letter is said, but it carries no vowel.",
    items: generatedSyllables(true, 20).map((s) => item("s2", s)),
  },
  {
    n: 3,
    title: "Two syllables",
    example: "שָׁלוֹם",
    teach:
      "Real words now. Find the vowels first: each one starts a syllable. Read the parts in order and run them together. You are learning to say it, not to know it — the meaning comes later.",
    items: corpusWords(2, 22).map((w) => item("s3", w)),
  },
  {
    n: 4,
    title: "The glued letters",
    example: "הַבַּיִת",
    teach:
      "Hebrew glues small words onto the front: ה “the”, ב “in”, ל “to”, ו “and”, מ “from”, ש “that”, כ “like”. They are part of the word on the page but a separate piece when you read it. Peel the first letter off and the rest is a word you know.",
    items: corpusWords(
      3,
      22,
      (w) => PREFIXES.includes([...w][0]) && w.length > 4,
    ).map((w) => item("s4", w)),
  },
  {
    n: 5,
    title: "More than one word",
    example: "אֲנִי רוֹצֶה",
    teach:
      "Three words at a time, at reading speed. Do not stop between them to decode — read the whole thing, then say it. If you stall, go back to the start of the phrase rather than the middle.",
    items: [],
  },
];

/* --- phrases, built from lines that stay short ---------------------------- */

const phrases = LINES.filter((l) => {
  const w = l.he.split(/\s+/).filter(Boolean);
  return w.length === 3 && !/[־]/.test(l.he);
})
  .slice(0, 20)
  .map((l) => l.he.replace(/[^א-ת֑-ׇ\s]/g, "").trim());

STAGES[4].items = phrases
  .filter((p) => {
    const t = translit(p);
    return t && !/[א-ת]/.test(t);
  })
  .map((p) => item("s5", p));

export const ALL_ITEMS = STAGES.flatMap((s) => s.items);

/**
 * Four options: the answer plus three near misses.
 *
 * Distractors come from the same stage, so they are the same shape of thing —
 * offering a three-syllable word against a single syllable would be answered
 * by length alone, without reading anything.
 */
export function optionsFor(stage: Stage, target: Item, count = 4): string[] {
  const pool = stage.items
    .map((i) => i.answer)
    .filter((a) => a !== target.answer);
  const uniq = [...new Set(pool)];
  // Nearest first: sharing a first letter makes the choice turn on the vowel.
  uniq.sort((a, b) => {
    const near = (s: string) => (s[0] === target.answer[0] ? 0 : 1);
    return near(a) - near(b) || a.localeCompare(b);
  });
  return [target.answer, ...uniq.slice(0, count - 1)];
}

export const stageFor = (n: number) => STAGES.find((s) => s.n === n);

/**
 * The next question for a stage: weakest item first, options shuffled.
 *
 * Lives here rather than in the component because Math.random in a render
 * body is impure — the same reason makeQuestion sits in quiz.ts. Takes a
 * streak lookup rather than the store, so this file stays free of React.
 */
export function nextQuestion(
  stage: Stage,
  streakOf: (id: string) => number,
  target = 3,
  /** Banked items leave the draw, so a stage converges instead of circling. */
  banked: (id: string) => boolean = () => false,
): { item: Item; options: string[] } {
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
  const opts = optionsFor(stage, pick);
  for (let i = opts.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [opts[i], opts[j]] = [opts[j], opts[i]];
  }
  return { item: pick, options: opts };
}
