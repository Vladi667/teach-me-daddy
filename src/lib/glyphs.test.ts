import test from "node:test";
import assert from "node:assert/strict";
import { GLYPHS, makeQuestion, poolFor } from "./quiz.ts";
import { LETTERS } from "./letters.ts";
import { FAST_MS, isLetterMastered, isMastered, masteredCount } from "./progress.ts";
import type { ProgressMap } from "./progress.ts";

const st = (streak: number, fast?: number) => ({ streak, seen: streak, wrong: 0, fast });

/* --- final forms are their own glyphs ------------------------------------- */

test("the drill covers 27 glyphs, not 22 letters", () => {
  const finals = LETTERS.filter((l) => l.final).length;
  assert.equal(finals, 5);
  assert.equal(GLYPHS.length, LETTERS.length + finals);
  assert.equal(poolFor("print").length, 27);
});

test("each final form appears once and carries its parent's name", () => {
  for (const l of LETTERS.filter((x) => x.final)) {
    const g = GLYPHS.filter((x) => x.char === l.final);
    assert.equal(g.length, 1, `${l.final} appears ${g.length} times`);
    assert.equal(g[0].name, l.name);
    assert.equal(g[0].final, undefined, "a final form has no final of its own");
  }
});

test("glyph chars are unique, so progress keys cannot collide", () => {
  const chars = GLYPHS.map((g) => g.char);
  assert.equal(new Set(chars).size, chars.length);
});

/**
 * Options are labelled by name. Offering the parent letter as a distractor to
 * its own final form would put the right answer on the board twice.
 */
test("a final-form question never offers its own name twice", () => {
  const kafFinal = GLYPHS.find((g) => g.char === "ך")!;
  for (let i = 0; i < 40; i++) {
    const q = makeQuestion("print", {});
    const names = q.options.map((o) => o.name);
    assert.equal(new Set(names).size, names.length, `repeated: ${names.join(",")}`);
  }
  assert.ok(kafFinal, "sanity");
});

/* --- a letter needs both of its shapes ------------------------------------ */

test("a letter with a final form is not known until both shapes are", () => {
  const kaf = LETTERS.find((l) => l.final === "ך")!;
  const onlyPrint: ProgressMap = { [kaf.char]: st(3, 3) };
  assert.equal(isMastered(onlyPrint, kaf.char), true, "the print form is known");
  assert.equal(isLetterMastered(onlyPrint, kaf), false, "but the letter is not");

  const both: ProgressMap = { [kaf.char]: st(3, 3), [kaf.final!]: st(3, 3) };
  assert.equal(isLetterMastered(both, kaf), true);
});

test("a letter without a final needs only its one shape", () => {
  const alef = LETTERS.find((l) => !l.final)!;
  assert.equal(isLetterMastered({ [alef.char]: st(3, 3) }, alef), true);
});

test("the board count reflects both shapes", () => {
  const kaf = LETTERS.find((l) => l.final)!;
  assert.equal(masteredCount({ [kaf.char]: st(3, 3) }), 0);
  assert.equal(masteredCount({ [kaf.char]: st(3, 3), [kaf.final!]: st(3, 3) }), 1);
});

/* --- speed ---------------------------------------------------------------- */

test("mastery needs the run to be quick as well as correct", () => {
  assert.equal(isMastered({ x: st(3, 0) }, "x"), false, "correct but slow");
  assert.equal(isMastered({ x: st(3, 2) }, "x"), false, "not quick enough yet");
  assert.equal(isMastered({ x: st(3, 3) }, "x"), true);
  assert.equal(isMastered({ x: st(2, 3) }, "x"), false, "quick but wrong once");
});

/**
 * Timing did not exist when the first profiles were written. A new metric
 * must not retroactively un-master work already done.
 */
test("progress recorded before timing existed still counts", () => {
  const legacy: ProgressMap = { x: { streak: 4, seen: 9, wrong: 1 } };
  assert.equal(isMastered(legacy, "x"), true);
});

test("the fast bar is a real threshold, not a formality", () => {
  assert.ok(FAST_MS > 0 && FAST_MS <= 3000, `${FAST_MS}ms`);
});
