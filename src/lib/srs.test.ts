import { test } from "node:test";
import assert from "node:assert/strict";
import {
  AGAIN,
  EASY,
  GOOD,
  HARD,
  buildQueue,
  isMature,
  isReview,
  newCard,
  previewInterval,
  review,
  type SrsCard,
} from "./srs.ts";

const T0 = 1_700_000_000_000;
const MIN = 60_000;
const DAY = 86_400_000;

const graduate = (now = T0): SrsCard => {
  // Two "Good" answers walk a new card through both learning steps.
  const a = review(newCard(now), GOOD, now);
  return review(a, GOOD, now + 10 * MIN);
};

test("a new card starts in learning, due immediately", () => {
  const c = newCard(T0);
  assert.equal(c.step, 0);
  assert.equal(c.reps, 0);
  assert.equal(c.due, T0);
  assert.equal(isReview(c), false);
});

test("Good walks the learning steps then graduates to one day", () => {
  const first = review(newCard(T0), GOOD, T0);
  assert.equal(first.step, 1);
  assert.equal(first.due - T0, 10 * MIN);
  assert.equal(isReview(first), false);

  const second = review(first, GOOD, T0 + 10 * MIN);
  assert.equal(second.step, null);
  assert.equal(second.interval, 1);
  assert.equal(isReview(second), true);
});

test("Hard repeats the current learning step rather than advancing", () => {
  const c = review(newCard(T0), HARD, T0);
  assert.equal(c.step, 0);
  assert.equal(c.due - T0, 1 * MIN);
});

test("Easy graduates a new card straight out at four days", () => {
  const c = review(newCard(T0), EASY, T0);
  assert.equal(c.step, null);
  assert.equal(c.interval, 4);
});

test("Again on a new card resets to the first step", () => {
  const once = review(newCard(T0), GOOD, T0);
  const back = review(once, AGAIN, T0 + 10 * MIN);
  assert.equal(back.step, 0);
  assert.equal(back.due - (T0 + 10 * MIN), 1 * MIN);
});

test("review intervals grow by ease", () => {
  const g = graduate();
  assert.equal(g.interval, 1);
  const next = review(g, GOOD, g.due);
  // 1 day * ease 2.5, no overdue bonus when answered exactly on time
  assert.equal(next.interval, 3);
  assert.equal(next.due - g.due, 3 * DAY);
});

test("Easy raises ease, Hard lowers it, both stay in range", () => {
  const g = graduate();
  assert.equal(review(g, EASY, g.due).ease > g.ease, true);
  assert.equal(review(g, HARD, g.due).ease < g.ease, true);
});

test("failing a card already in learning leaves ease alone", () => {
  // Ease is a property of review performance; repeatedly failing a card that
  // is still inside the learning steps must not compound the penalty.
  const g = graduate();
  const lapsed = review(g, AGAIN, g.due);
  const again = review(lapsed, AGAIN, lapsed.due);
  assert.equal(again.ease, lapsed.ease);
});

test("ease never falls below the 1.3 floor", () => {
  let c = graduate();
  // Only a lapse from *review* moves ease, so re-graduate between failures.
  for (let i = 0; i < 20; i++) {
    c = review(c, AGAIN, c.due);
    c = review(c, GOOD, c.due);
    c = review(c, GOOD, c.due);
  }
  assert.equal(c.ease, 1.3);
});

test("Again on a review card lapses it back into learning", () => {
  const g = graduate();
  const mature = review(review(g, EASY, g.due), EASY, g.due + 10 * DAY);
  assert.equal(isReview(mature), true);

  const lapsed = review(mature, AGAIN, mature.due);
  assert.equal(lapsed.lapses, 1);
  assert.equal(lapsed.step, 0);
  assert.equal(lapsed.interval, 0);
  assert.equal(lapsed.ease < mature.ease, true);
});

test("a lapsed card re-graduates at one day, not its old interval", () => {
  const g = graduate();
  const long = review(review(g, EASY, g.due), EASY, g.due + 10 * DAY);
  const lapsed = review(long, AGAIN, long.due);
  const relearn = review(
    review(lapsed, GOOD, lapsed.due),
    GOOD,
    lapsed.due + 10 * MIN,
  );
  assert.equal(relearn.interval, 1);
});

test("answering late credits the extra elapsed time", () => {
  const g = graduate();
  const onTime = review(g, GOOD, g.due);
  const late = review(g, GOOD, g.due + 6 * DAY);
  assert.equal(late.interval > onTime.interval, true);
});

test("intervals are capped at a year", () => {
  let c = graduate();
  for (let i = 0; i < 30; i++) c = review(c, EASY, c.due);
  assert.equal(c.interval <= 365, true);
  assert.equal(c.interval, 365);
});

test("maturity is the 21-day threshold the plan tracks", () => {
  const g = graduate();
  assert.equal(isMature(g), false);
  assert.equal(isMature({ ...g, interval: 20 }), false);
  assert.equal(isMature({ ...g, interval: 21 }), true);
  // still learning, however long the nominal interval
  assert.equal(isMature({ ...g, step: 0, interval: 30 }), false);
});

test("the queue honours the daily new-card cap", () => {
  const items = Array.from({ length: 50 }, (_, i) => ({ id: `c${i}` }));
  const { queue, counts } = buildQueue(items, {}, T0, 40);
  assert.equal(counts.fresh, 40);
  assert.equal(queue.length, 40);

  const none = buildQueue(items, {}, T0, 0);
  assert.equal(none.counts.total, 0);
});

test("the queue puts cards in flight before new ones and skips future cards", () => {
  const items = [{ id: "due" }, { id: "later" }, { id: "fresh" }];
  const cards = {
    due: { ...graduate(), due: T0 - DAY },
    later: { ...graduate(), due: T0 + 5 * DAY },
  };
  const { queue, counts } = buildQueue(items, cards, T0, 10);
  assert.deepEqual(
    queue.map((q) => q.id),
    ["due", "fresh"],
  );
  assert.equal(counts.due, 1);
  assert.equal(counts.fresh, 1);
  assert.equal(counts.learning, 0);
});

test("interval previews are human readable and ordered", () => {
  const g = graduate();
  assert.match(previewInterval(g, AGAIN, g.due), /^\d+m$/);
  const good = review(g, GOOD, g.due).interval;
  const easy = review(g, EASY, g.due).interval;
  assert.equal(easy > good, true);
});
