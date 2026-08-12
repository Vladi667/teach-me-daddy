import test from "node:test";
import assert from "node:assert/strict";
import {
  LEVELS,
  LIBRARY,
  bestWpm,
  nextPassage,
  rungForLevel,
  textFor,
  unlockedThrough,
  wordCount,
  wpm,
  type ReadLog,
} from "./reading.ts";
import { LINES } from "./lines.ts";
import { PASSAGES } from "./passages.ts";

const skeleton = (s: string) =>
  s.normalize("NFC").replace(/[֑-ׇ]/g, "").replace(/[^א-ת]/g, "");
const log = (wpm: number, understood = true): ReadLog => ({
  wpm, understood, on: "2026-08-12",
});

/* --- the library ---------------------------------------------------------- */

test("six levels, four passages each", () => {
  assert.deepEqual(LEVELS, [1, 2, 3, 4, 5, 6]);
  for (const l of LEVELS) {
    assert.equal(LIBRARY.filter((p) => p.level === l).length, 4, `level ${l}`);
  }
});

test("passage ids are unique", () => {
  const ids = LIBRARY.map((p) => p.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("every passage is long enough to time honestly", () => {
  // Under ~50 words the clock measures reaction time, not reading speed.
  for (const p of LIBRARY) {
    assert.ok(wordCount(p) >= 45, `${p.id} has ${wordCount(p)} words`);
  }
});

test("passages get longer as the levels climb", () => {
  const avg = LEVELS.map((l) => {
    const inLevel = LIBRARY.filter((p) => p.level === l);
    return inLevel.reduce((n, p) => n + wordCount(p), 0) / inLevel.length;
  });
  for (let i = 1; i < avg.length; i++) {
    assert.ok(avg[i] > avg[i - 1], `level ${i + 1}: ${avg[i]} vs ${avg[i - 1]}`);
  }
});

test("every sentence is vocalised and glossed", () => {
  for (const p of LIBRARY) {
    assert.ok(p.sentences.length > 0, `${p.id} is empty`);
    for (const s of p.sentences) {
      assert.match(s.he, /[֑-ׇ]/, `${p.id}: ${s.he}`);
      assert.ok(s.fr.trim(), `${p.id}: no gloss for ${s.he}`);
    }
  }
});

/* --- the exclusions, which are the whole point ---------------------------- */

test("nothing here appears in the programme corpus", () => {
  const corpus = new Set(LINES.map((l) => skeleton(l.he)));
  const clash: string[] = [];
  for (const p of LIBRARY) {
    for (const s of p.sentences) {
      if (corpus.has(skeleton(s.he))) clash.push(`${p.id}: ${s.he}`);
    }
  }
  assert.deepEqual(clash.slice(0, 3), [], `${clash.length} drilled sentences`);
});

test("nothing here appears in an assessment passage", () => {
  const assessed = new Set(
    PASSAGES.flatMap((p) => p.sentences.map((s) => skeleton(s.he))),
  );
  const clash: string[] = [];
  for (const p of LIBRARY) {
    for (const s of p.sentences) {
      if (assessed.has(skeleton(s.he))) clash.push(`${p.id}: ${s.he}`);
    }
  }
  assert.deepEqual(clash.slice(0, 3), [], `${clash.length} would break §6`);
});

test("no sentence appears in two passages", () => {
  const all = LIBRARY.flatMap((p) => p.sentences.map((s) => skeleton(s.he)));
  assert.equal(new Set(all).size, all.length);
});

/* --- the vowel ladder ----------------------------------------------------- */

test("the points come off as the levels climb", () => {
  assert.equal(rungForLevel(1), "full");
  assert.equal(rungForLevel(3), "partial");
  assert.equal(rungForLevel(6), "bare");
});

test("a level 6 passage is shown without vowels", () => {
  const p = LIBRARY.find((x) => x.level === 6)!;
  for (const line of textFor(p)) assert.doesNotMatch(line, /[֑-ׇ]/);
});

test("a level 1 passage keeps them", () => {
  const p = LIBRARY.find((x) => x.level === 1)!;
  assert.ok(textFor(p).some((l) => /[֑-ׇ]/.test(l)));
});

test("stripping never loses a word", () => {
  for (const p of LIBRARY) {
    const shown = textFor(p).join(" ").split(/\s+/).filter(Boolean).length;
    assert.equal(shown, wordCount(p), p.id);
  }
});

/* --- speed ---------------------------------------------------------------- */

test("words per minute is words over minutes", () => {
  assert.equal(wpm(100, 60000), 100);
  assert.equal(wpm(50, 30000), 100);
  assert.equal(wpm(0, 60000), 0);
});

test("a zero or negative clock cannot invent a speed", () => {
  assert.equal(wpm(100, 0), 0);
  assert.equal(wpm(100, -5), 0);
});

/* --- progression ---------------------------------------------------------- */

test("only level 1 is open to begin with", () => {
  assert.equal(unlockedThrough({}), 1);
  assert.equal(nextPassage({})!.level, 1);
});

test("a level opens once the one below is finished", () => {
  const done: Record<string, ReadLog> = {};
  for (const p of LIBRARY.filter((x) => x.level === 1)) done[p.id] = log(90);
  assert.equal(unlockedThrough(done), 2);
  assert.equal(nextPassage(done)!.level, 2);
});

/**
 * Speed without comprehension is scrolling. A passage the trainee did not
 * follow must not count toward opening the next level.
 */
test("a passage you did not follow does not unlock anything", () => {
  const done: Record<string, ReadLog> = {};
  const lvl1 = LIBRARY.filter((x) => x.level === 1);
  lvl1.forEach((p, i) => (done[p.id] = log(200, i !== 0)));
  assert.equal(unlockedThrough(done), 1, "one unfollowed passage holds it");
  assert.equal(nextPassage(done)!.id, lvl1[0].id, "and it comes back");
});

test("the best speed counts only what was understood", () => {
  assert.equal(bestWpm({}), 0);
  assert.equal(bestWpm({ a: log(80), b: log(120) }), 120);
  assert.equal(bestWpm({ a: log(80), b: log(400, false) }), 80);
});

test("the library can be finished", () => {
  const done: Record<string, ReadLog> = {};
  for (const p of LIBRARY) done[p.id] = log(100);
  assert.equal(nextPassage(done), null);
  assert.equal(unlockedThrough(done), 6);
});
