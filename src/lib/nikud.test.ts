import test from "node:test";
import assert from "node:assert/strict";
import {
  ambiguousForms,
  atRung,
  ladderCounts,
  rungFor,
  skeleton,
  PARTIAL_DAYS,
} from "./nikud.ts";
import { LINES } from "./lines.ts";
import { cardId, MASTERY_DAYS } from "./programme.ts";
import type { SrsCard } from "./srs.ts";

const card = (over: Partial<SrsCard> = {}): SrsCard => ({
  step: null, interval: 1, ease: 2.5, reps: 3, lapses: 0, due: 0, last: 0,
  ...over,
});

/* --- the rungs ------------------------------------------------------------ */

test("a line keeps its vowels until it is actually known", () => {
  assert.equal(rungFor(undefined), "full", "never seen");
  assert.equal(rungFor(card({ step: 0, interval: 0 })), "full", "still learning");
  assert.equal(rungFor(card({ interval: PARTIAL_DAYS - 1 })), "full");
});

test("the points come off in two stages", () => {
  assert.equal(rungFor(card({ interval: PARTIAL_DAYS })), "partial");
  assert.equal(rungFor(card({ interval: MASTERY_DAYS - 1 })), "partial");
  assert.equal(rungFor(card({ interval: MASTERY_DAYS })), "bare");
});

test("a lapse brings the vowels back", () => {
  // Knocked into learning: the interval is stale, the trainee is decoding again.
  assert.equal(rungFor(card({ step: 0, interval: 30, lapses: 1 })), "full");
});

/* --- stripping ------------------------------------------------------------ */

test("full leaves the line exactly as written", () => {
  const he = "מָה שְׁלוֹמְךָ?";
  assert.equal(atRung(he, "full"), he);
});

test("bare removes every vowel and keeps the letters", () => {
  assert.equal(atRung("מָה שְׁלוֹמְךָ?", "bare"), "מה שלומך?");
  assert.equal(atRung("אֲנִי מְדַבֵּר קְצָת עִבְרִית", "bare"), "אני מדבר קצת עברית");
});

test("partial keeps the shin dot; bare drops it, like a street sign", () => {
  // Test for the mark, not for a two-character literal: the corpus stores
  // letter-then-vowel-then-dot, so adjacency is not guaranteed.
  const DOT = /[ׁׂ]/;
  assert.match(atRung("שָׁלוֹם", "partial"), DOT);
  assert.match(atRung("שָׂדֶה", "partial"), DOT);
  assert.doesNotMatch(atRung("שָׁלוֹם", "bare"), DOT);
  assert.equal(atRung("שָׁלוֹם", "bare"), "שלום");
  assert.equal(atRung("שָׂדֶה", "bare"), "שדה");
});

test("punctuation and spacing survive stripping", () => {
  assert.equal(atRung("מָה קָרָה?", "bare"), "מה קרה?");
  assert.equal(atRung("יֵשׁ לִי שְׁנֵי יְלָדִים.", "bare").endsWith("."), true);
  assert.equal(atRung("אֲנִי  רוֹצֶה", "bare"), "אני  רוצה", "spacing untouched");
});

test("partial keeps the points only where losing them loses information", () => {
  const amb = ambiguousForms();
  assert.ok(amb.size > 0 && amb.size < 400, `${amb.size} ambiguous forms`);
  // An unambiguous word strips at partial...
  assert.equal(atRung("עִבְרִית", "partial"), "עברית");
  // ...and one the corpus points two ways keeps them.
  const sample = [...amb][0];
  const line = LINES.find((l) =>
    l.he.split(/\s+/).some((w) => skeleton(w) === sample),
  )!;
  const word = line.he.split(/\s+/).find((w) => skeleton(w) === sample)!;
  assert.equal(atRung(word, "partial"), word, `${word} should keep its points`);
});

/* --- the whole corpus ----------------------------------------------------- */

test("stripping never changes a line's letters", () => {
  const bad: string[] = [];
  for (const l of LINES) {
    for (const rung of ["partial", "bare"] as const) {
      if (skeleton(atRung(l.he, rung)) !== skeleton(l.he)) bad.push(l.id);
    }
  }
  assert.deepEqual(bad.slice(0, 5), [], `${bad.length} lines changed`);
});

test("bare really is bare, across the corpus", () => {
  const left = LINES.filter((l) => /[֑-ׇ]/.test(atRung(l.he, "bare")));
  assert.deepEqual(left.slice(0, 3).map((l) => l.id), []);
});

test("partial is a real middle rung, not bare with exceptions", () => {
  // Every word with a shin keeps something at partial that bare removes.
  const withShin = LINES.filter((l) => /[שׁשׂ]/.test(l.he)).slice(0, 40);
  const differ = withShin.filter(
    (l) => atRung(l.he, "partial") !== atRung(l.he, "bare"),
  );
  assert.equal(differ.length, withShin.length, "the dot should distinguish them");
});

test("the ladder is a minority of the corpus at the start", () => {
  const counts = ladderCounts({}, (id) => cardId(id, "read"));
  assert.deepEqual(counts, { full: 0, partial: 0, bare: 0 }, "nothing seen yet");
});

test("the record counts each line once, at its own rung", () => {
  const srs: Record<string, SrsCard> = {};
  srs[cardId(LINES[0].id, "read")] = card({ interval: 2 });
  srs[cardId(LINES[1].id, "read")] = card({ interval: 10 });
  srs[cardId(LINES[2].id, "read")] = card({ interval: 40 });
  const counts = ladderCounts(srs, (id) => cardId(id, "read"));
  assert.deepEqual(counts, { full: 1, partial: 1, bare: 1 });
});
