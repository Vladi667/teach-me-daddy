import test from "node:test";
import assert from "node:assert/strict";
import { freshLines, stageCards, unlockedStages } from "./queue.ts";
import type { Line } from "./programme.ts";
import type { SrsCard } from "./srs.ts";

const line = (id: string, day: number): Line => ({
  id,
  day,
  he: "x",
  tr: "",
  fr: "x",
  en: "",
  words: [],
});

const card = (over: Partial<SrsCard> = {}): SrsCard => ({
  step: null,
  interval: 1,
  ease: 2.5,
  reps: 1,
  lapses: 0,
  due: 0,
  last: 0,
  ...over,
});

/** Still walking the learning steps. */
const learning = card({ step: 0, interval: 0 });
const graduated = card({ step: null, interval: 3 });
const mature = card({ step: null, interval: 21 });

const L1 = line("a", 1);

/* --- §4 gates ------------------------------------------------------------- */

test("a fresh line offers listening and nothing else", () => {
  assert.deepEqual(unlockedStages(L1, {}), ["listen"]);
});

test("reading waits for listening to graduate", () => {
  assert.deepEqual(unlockedStages(L1, { "a:listen": learning }), ["listen"]);
  assert.deepEqual(unlockedStages(L1, { "a:listen": graduated }), [
    "listen",
    "read",
  ]);
});

test("producing waits for the 21-day hold on reading", () => {
  const almost = { "a:listen": graduated, "a:read": card({ interval: 20 }) };
  assert.deepEqual(unlockedStages(L1, almost), ["listen", "read"]);
  const held = { "a:listen": graduated, "a:read": mature };
  assert.deepEqual(unlockedStages(L1, held), ["listen", "read", "produce"]);
});

test("a lapsed read card loses production until it re-graduates", () => {
  // Back in learning after a lapse: the interval is stale, the card is not.
  const lapsed = card({ step: 0, interval: 21, lapses: 1 });
  const srs = { "a:listen": graduated, "a:read": lapsed };
  assert.deepEqual(unlockedStages(L1, srs), ["listen", "read"]);
});

/* --- the queue ------------------------------------------------------------ */

const LINES = [line("a", 1), line("b", 2), line("c", 9)];

test("lines the programme hasn't issued are not in the queue", () => {
  const got = stageCards(LINES, {}, 2);
  assert.deepEqual(got.map((c) => c.id), ["a:listen", "b:listen"]);
});

test("every unlocked stage becomes its own card", () => {
  const srs = { "a:listen": graduated, "a:read": mature };
  const got = stageCards(LINES, srs, 2).filter((c) => c.line.id === "a");
  assert.deepEqual(got.map((c) => c.id), ["a:listen", "a:read", "a:produce"]);
});

test("card ids match the ones the runners already write", () => {
  const [first] = stageCards(LINES, {}, 1);
  assert.equal(first.id, "a:listen");
  assert.equal(first.stage, "listen");
  assert.equal(first.line.id, "a");
});

/* --- today's intake ------------------------------------------------------- */

test("fresh lines are today's, untouched", () => {
  assert.deepEqual(freshLines(LINES, {}, 2).map((l) => l.id), ["b"]);
});

test("a line already started is no longer fresh", () => {
  const srs = { "b:listen": learning };
  assert.deepEqual(freshLines(LINES, srs, 2), []);
});

test("yesterday's untouched lines are not silently re-issued as new", () => {
  // Day 1 was missed. It belongs in the review queue as a lapse, not in
  // today's intake — the day counter already carries the cost.
  assert.deepEqual(freshLines(LINES, {}, 2).map((l) => l.id), ["b"]);
});
