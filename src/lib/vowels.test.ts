import test from "node:test";
import assert from "node:assert/strict";
import { POINTS, POINT_BY_ID, SOUNDS, optionsFor } from "./vowels.ts";
import { LETTERS } from "./letters.ts";

test("every point is complete and uniquely keyed", () => {
  const ids = POINTS.map((p) => p.id);
  assert.equal(new Set(ids).size, ids.length, "duplicate id");
  for (const p of POINTS) {
    assert.ok(p.show.trim(), `${p.id} has nothing to show`);
    assert.ok(p.sound.trim(), `${p.id} has no answer`);
    assert.ok(p.name.trim() && p.note.trim(), `${p.id} is unexplained`);
  }
});

test("every point actually shows Hebrew with a mark on it", () => {
  for (const p of POINTS) {
    assert.match(p.show, /[א-ת]/, `${p.id} has no letter`);
    assert.match(p.show, /[֑-ׇ]/, `${p.id} shows no point`);
  }
});

test("the answers are Latin, since they are what you say", () => {
  for (const p of POINTS) assert.match(p.sound, /^[a-z]+$/, p.id);
});

/**
 * The point of the whole drill. If these collapsed to one sign per sound
 * there would be nothing to teach.
 */
test("several signs share a sound, which is the lesson", () => {
  const bySound = new Map<string, number>();
  for (const p of POINTS) bySound.set(p.sound, (bySound.get(p.sound) ?? 0) + 1);
  assert.ok((bySound.get("ma") ?? 0) >= 3, "patah, qamats and hataf patah");
  assert.ok((bySound.get("me") ?? 0) >= 3, "segol, tsere and sheva");
  assert.ok((bySound.get("mo") ?? 0) >= 2, "holam and holam male");
  assert.ok((bySound.get("mu") ?? 0) >= 2, "qubuts and shuruk");
});

test("the five vowel sounds are all covered", () => {
  const vowelsOnly = POINTS.filter((p) => p.show.startsWith("מ"));
  const sounds = new Set(vowelsOnly.map((p) => p.sound.replace("m", "")));
  for (const v of ["a", "e", "i", "o", "u"]) {
    assert.ok(sounds.has(v), `no sign teaches ${v}`);
  }
});

test("dagesh is taught as a pair, both ways round", () => {
  for (const [hard, soft] of [["ba", "va"], ["ka", "kha"], ["pa", "fa"]]) {
    assert.ok(POINTS.some((p) => p.sound === hard), hard);
    assert.ok(POINTS.some((p) => p.sound === soft), soft);
  }
});

/* --- the question --------------------------------------------------------- */

test("the answer is always among the options", () => {
  for (const p of POINTS) assert.ok(optionsFor(p).includes(p.sound), p.id);
});

test("options are distinct and there are enough of them", () => {
  for (const p of POINTS) {
    const o = optionsFor(p);
    assert.equal(new Set(o).size, o.length, `${p.id} repeats an option`);
    assert.equal(o.length, 4, p.id);
  }
});

/**
 * A distractor with a different carrier gives the answer away: the letter
 * already tells you it is not "ba", so the mark is never read.
 */
test("distractors keep the carrier where one exists", () => {
  const ma = POINTS.find((p) => p.id === "\u05B7")!;
  const opts = optionsFor(ma).filter((s) => s !== ma.sound);
  assert.ok(
    opts.some((s) => s.startsWith("m")),
    `no same-carrier distractor: ${opts.join(",")}`,
  );
});

test("sounds are deduplicated, so options never repeat an answer", () => {
  assert.equal(new Set(SOUNDS).size, SOUNDS.length);
});

/* --- the seam with the letters -------------------------------------------- */

test("point ids cannot collide with letter progress keys", () => {
  const letters = new Set(LETTERS.map((l) => l.char));
  for (const p of POINTS) assert.ok(!letters.has(p.id), `${p.id} collides`);
});

test("lookup by id works for every point", () => {
  for (const p of POINTS) assert.equal(POINT_BY_ID[p.id], p);
});
