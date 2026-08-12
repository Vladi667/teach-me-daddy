import test from "node:test";
import assert from "node:assert/strict";
import {
  MONTH_TARGET,
  PENALTY_DAYS,
  assessmentsDue,
  clearedCount,
  dueAssessment,
  hasUncleared,
  monthOfDay,
  penaltyActive,
  repairLines,
  score,
  type Assessment,
} from "./assessment.ts";

const took = (
  month: number,
  coverage: number,
  takenOn = "2026-01-28",
): Assessment => ({
  month,
  takenOn,
  known: coverage,
  total: 100,
  coverage,
  cleared: coverage >= MONTH_TARGET[month],
  missed: [],
});

/* --- the calendar --------------------------------------------------------- */

test("months run in 28-day blocks and stop at five", () => {
  assert.equal(monthOfDay(1), 1);
  assert.equal(monthOfDay(28), 1);
  assert.equal(monthOfDay(29), 2);
  assert.equal(monthOfDay(140), 5);
  assert.equal(monthOfDay(200), 5);
});

test("an assessment comes due at the end of each month", () => {
  assert.equal(assessmentsDue(27), 0);
  assert.equal(assessmentsDue(28), 1);
  assert.equal(assessmentsDue(83), 2);
  assert.equal(assessmentsDue(140), 5);
});

test("nothing is due before the first month is out", () => {
  assert.equal(dueAssessment(27, []), null);
  assert.equal(dueAssessment(28, []), 1);
});

test("a failed month stays due; a cleared one doesn't", () => {
  assert.equal(dueAssessment(28, [took(1, 40)]), 1, "40% is under the 55 target");
  assert.equal(dueAssessment(28, [took(1, 60)]), null);
  // Month 2 arrives with month 1 still outstanding: the older debt is first.
  assert.equal(dueAssessment(56, [took(1, 40), took(2, 90)]), 1);
});

test("clearing on a retake settles the month", () => {
  assert.equal(dueAssessment(28, [took(1, 40), took(1, 58)]), null);
  assert.equal(clearedCount([took(1, 40), took(1, 58)]), 1, "counted once");
});

/* --- marking -------------------------------------------------------------- */

test("coverage is the share of words understood", () => {
  const words = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"];
  assert.equal(score(1, words, [], "2026-01-28").coverage, 100);
  assert.equal(score(1, words, ["a", "b"], "2026-01-28").coverage, 80);
  assert.equal(score(1, words, words, "2026-01-28").coverage, 0);
});

test("a repeated word counts every time it appears", () => {
  // Marking "של" unknown means not knowing it in all four places it occurs.
  const words = ["של", "בית", "של", "גדול", "של", "כאן", "של", "מאוד"];
  assert.equal(score(1, words, ["של"], "2026-01-28").known, 4);
});

test("clearance is measured against the month's own target", () => {
  const w = Array.from({ length: 100 }, (_, i) => `w${i}`);
  const missed60 = w.slice(0, 40); // 60% understood
  assert.equal(score(1, w, missed60, "2026-01-28").cleared, true, "month 1 wants 55");
  assert.equal(score(2, w, missed60, "2026-02-25").cleared, false, "month 2 wants 85");
});

test("coverage keeps a decimal, so a near miss reads as a miss", () => {
  const w = Array.from({ length: 60 }, (_, i) => `w${i}`);
  const a = score(2, w, w.slice(0, 9), "2026-02-25"); // 51/60 = 85.0
  assert.equal(a.coverage, 85);
  assert.equal(a.cleared, true);
  const b = score(2, w, w.slice(0, 10), "2026-02-25"); // 50/60 = 83.3
  assert.equal(b.coverage, 83.3);
  assert.equal(b.cleared, false);
});

test("an empty passage scores nothing rather than dividing by zero", () => {
  const a = score(1, [], [], "2026-01-28");
  assert.equal(a.coverage, 0);
  assert.equal(a.total, 0);
});

/* --- consequence ---------------------------------------------------------- */

test("readiness is held down while a month is outstanding", () => {
  assert.equal(hasUncleared(28, []), true);
  assert.equal(hasUncleared(28, [took(1, 60)]), false);
  assert.equal(hasUncleared(27, []), false, "not due yet is not outstanding");
});

test("a failure halves intake for a week, then stops", () => {
  const failed = [took(1, 40, "2026-01-28")];
  assert.equal(penaltyActive(failed, "2026-01-28"), true);
  assert.equal(penaltyActive(failed, "2026-02-03"), true, "day 6");
  assert.equal(penaltyActive(failed, "2026-02-04"), false, `day ${PENALTY_DAYS}`);
});

test("passing carries no penalty", () => {
  assert.equal(penaltyActive([took(1, 60, "2026-01-28")], "2026-01-29"), false);
});

/* --- repair --------------------------------------------------------------- */

const LINES = [
  { id: "a", day: 10, words: ["של", "בית"] },
  { id: "b", day: 40, words: ["של", "גדול"] },
  { id: "c", day: 41, words: ["גדול", "מאוד"] },
  { id: "d", day: 42, words: ["חלון"] },
];

test("missed words come back as lines that carry them", () => {
  const got = repairLines(["חלון"], LINES, 30, 5);
  assert.deepEqual(got.map((l) => l.id), ["d"]);
});

test("lines already issued are not re-issued", () => {
  // "בית" only appears on day 10, which the trainee has already been taught.
  assert.deepEqual(repairLines(["בית"], LINES, 30, 5), []);
});

test("one line per missed word, not three drilling the same one", () => {
  const got = repairLines(["גדול"], LINES, 30, 5);
  assert.equal(got.length, 1);
});

test("every missed word gets a line, and no word gets two", () => {
  // b repays גדול, c repays מאוד. c also carries גדול, but that debt is paid.
  const got = repairLines(["גדול", "מאוד"], LINES, 30, 5);
  assert.deepEqual(got.map((l) => l.id), ["b", "c"]);
});

test("repair respects the intake it is allowed", () => {
  assert.equal(repairLines(["גדול", "מאוד", "חלון"], LINES, 30, 1).length, 1);
  assert.equal(repairLines(["חלון"], LINES, 30, 0).length, 0);
  assert.equal(repairLines([], LINES, 30, 5).length, 0);
});
