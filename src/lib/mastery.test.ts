import test from "node:test";
import assert from "node:assert/strict";
import { MASTERY_TARGET, isBanked, isMastered } from "./progress.ts";
import type { ProgressMap } from "./progress.ts";
import { GLYPHS, makeQuestion } from "./quiz.ts";
import { POINTS, SOUNDS, optionsFor } from "./vowels.ts";
import { STAGES, nextQuestion } from "./blend.ts";

const st = (o: Partial<{ streak: number; fast: number; best: number; bestFast: number }>) =>
  ({ streak: 0, seen: 9, wrong: 0, ...o });

/* --- banking -------------------------------------------------------------- */

test("mastery survives a later miss once it has been earned", () => {
  const earned: ProgressMap = { x: st({ streak: 3, fast: 3, best: 3, bestFast: 3 }) };
  assert.equal(isMastered(earned, "x"), true);
  // A miss zeroes the current runs but not the banked ones.
  const missed: ProgressMap = { x: st({ streak: 0, fast: 0, best: 3, bestFast: 3 }) };
  assert.equal(isMastered(missed, "x"), true, "banked mastery is not taken back");
});

test("a slow answer no longer un-masters a known glyph", () => {
  const slow: ProgressMap = { x: st({ streak: 5, fast: 0, best: 5, bestFast: 4 }) };
  assert.equal(isMastered(slow, "x"), true);
});

test("mastery still has to be earned, on both counts", () => {
  assert.equal(isMastered({ x: st({ streak: 2, best: 2, fast: 2, bestFast: 2 }) }, "x"), false);
  assert.equal(
    isMastered({ x: st({ streak: 9, best: 9, fast: 0, bestFast: 0 }) }, "x"),
    false,
    "correct but never once quick",
  );
  assert.equal(isMastered({}, "x"), false, "never seen");
});

test("progress written before banking existed still counts", () => {
  const legacy: ProgressMap = { x: { streak: 4, seen: 9, wrong: 1 } };
  assert.equal(isMastered(legacy, "x"), true);
});

/* --- retirement ----------------------------------------------------------- */

const bankAll = (keys: string[]): ProgressMap =>
  Object.fromEntries(keys.map((k) => [k, st({ streak: 3, fast: 3, best: 3, bestFast: 3 })]));

test("a banked glyph leaves the alphabet draw", () => {
  const all = GLYPHS.map((g) => g.char);
  const banked = bankAll(all.slice(0, all.length - 1));
  const last = all[all.length - 1];
  for (let i = 0; i < 60; i++) {
    assert.equal(makeQuestion("print", banked).target.char, last, "only the unbanked one is asked");
  }
});

test("once everything is banked the whole pool comes back", () => {
  const banked = bankAll(GLYPHS.map((g) => g.char));
  const seen = new Set<string>();
  for (let i = 0; i < 400; i++) seen.add(makeQuestion("print", banked).target.char);
  assert.ok(seen.size > 1, "a finished board still gives you something to practise");
});

test("a banked lesson item leaves its stage draw", () => {
  const stage = STAGES[0];
  const target = stage.items[stage.items.length - 1].id;
  const banked = new Set(stage.items.slice(0, -1).map((i) => i.id));
  for (let i = 0; i < 60; i++) {
    const { item } = nextQuestion(stage, () => 0, MASTERY_TARGET, (id) => banked.has(id));
    assert.equal(item.id, target);
  }
});

/**
 * The property the whole step exists for. Simulated at 90% correct and 80%
 * under the bar, the pre-banking rules cleared 0 of 60 runs and sat at 12 of
 * 27; this asserts the loop now terminates.
 */
test("the 27-glyph board can actually be finished", () => {
  const seeded = (n: number) => { let s = n; return () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648; };
  const rnd = seeded(7);
  const prog: ProgressMap = {};
  const chars = GLYPHS.map((g) => g.char);
  let answers = 0;
  while (chars.some((c) => !isBanked(prog, c)) && answers < 5000) {
    const active = chars.filter((c) => !isBanked(prog, c));
    const c = active[Math.floor(rnd() * active.length)];
    const cur = prog[c] ?? { streak: 0, seen: 0, wrong: 0, fast: 0 };
    const correct = rnd() < 0.9;
    const quick = correct && rnd() < 0.8;
    const streak = correct ? cur.streak + 1 : 0;
    const fast = correct ? (quick ? (cur.fast ?? 0) + 1 : 0) : 0;
    prog[c] = {
      streak, seen: cur.seen + 1, wrong: cur.wrong + (correct ? 0 : 1), fast,
      best: Math.max(cur.best ?? 0, streak), bestFast: Math.max(cur.bestFast ?? 0, fast),
    };
    answers++;
  }
  assert.ok(answers < 5000, `did not converge in ${answers} answers`);
  assert.equal(chars.filter((c) => isBanked(prog, c)).length, GLYPHS.length);
});

/* --- the answer leak ------------------------------------------------------ */

/**
 * "mu" and "e" were never generated as wrong options, so seeing either meant
 * it was the answer — three of nineteen points needed no Hebrew at all.
 */
test("every sound can appear as a wrong answer", () => {
  const asDistractor = new Set<string>();
  for (let i = 0; i < 3000; i++) {
    const p = POINTS[i % POINTS.length];
    for (const o of optionsFor(p)) if (o !== p.sound) asDistractor.add(o);
  }
  assert.deepEqual(SOUNDS.filter((s) => !asDistractor.has(s)), []);
});

test("the points boards vary instead of being fixed", () => {
  const boards = new Set<string>();
  for (let i = 0; i < 3000; i++) {
    const p = POINTS[i % POINTS.length];
    boards.add(p.id + ":" + optionsFor(p).slice().sort().join("|"));
  }
  assert.ok(boards.size > 100, `only ${boards.size} distinct boards`);
});

test("a points board is still well formed however it is sampled", () => {
  for (let i = 0; i < 3000; i++) {
    const p = POINTS[i % POINTS.length];
    const o = optionsFor(p);
    assert.equal(o.length, 4, p.id);
    assert.equal(new Set(o).size, 4, `${p.id} repeats an option`);
    assert.ok(o.includes(p.sound), `${p.id} lost its answer`);
    if (p.pair) assert.ok(o.includes(p.pair), `${p.id} lost its partner`);
  }
});
