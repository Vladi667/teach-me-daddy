import test from "node:test";
import assert from "node:assert/strict";
import {
  MOCK_SIZE,
  WEEKS,
  attempts,
  bestPct,
  clozeParts,
  delta,
  drawMock,
  drawSection,
  isHebrew,
  lastRun,
  pct,
  present,
  questionsIn,
  readiness,
  recent,
  runsFor,
  scored,
  series,
  weekById,
  type ExamRun,
} from "./exams.ts";
import { WEEK_1 } from "./exams.w1.ts";

const w = WEEK_1;

const run = (over: Partial<ExamRun> = {}): ExamRun => ({
  week: "w1",
  part: "verbs",
  right: 8,
  asked: 10,
  ms: 60_000,
  on: "2026-08-17",
  at: 1,
  ...over,
});

/* --- the bank ------------------------------------------------------------- */

test("the week is registered and reachable by id", () => {
  assert.ok(WEEKS.includes(w));
  assert.equal(weekById("w1"), w);
  assert.equal(weekById("nope"), undefined);
});

test("109 questions, in the four sections the teacher named", () => {
  assert.equal(w.questions.length, 109);
  assert.equal(questionsIn(w, "verbs").length, 30);
  assert.equal(questionsIn(w, "demo").length, 22);
  assert.equal(questionsIn(w, "plural").length, 24);
  assert.equal(questionsIn(w, "details").length, 33);
});

test("every question belongs to a declared section", () => {
  const known = new Set(w.sections.map((s) => s.id));
  for (const q of w.questions) assert.ok(known.has(q.part), q.id);
});

test("every quiz section has questions, and only quiz sections do", () => {
  for (const s of w.sections) {
    const n = questionsIn(w, s.id).length;
    if (s.kind === "quiz") assert.ok(n > 0, `${s.id} is empty`);
    else assert.equal(n, 0, `${s.id} should not hold questions`);
  }
});

test("question ids are unique", () => {
  const ids = w.questions.map((q) => q.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("the answer index points at a real option", () => {
  for (const q of w.questions) {
    // Two is the floor, and a handful of the plural items genuinely are a
    // straight ־ים / ־ות choice. Everything else offers three or four.
    assert.ok(q.options.length >= 2, `${q.id} has ${q.options.length} options`);
    assert.ok(q.answer >= 0 && q.answer < q.options.length, q.id);
  }
});

/**
 * The right answer must appear exactly once. Offering it twice makes the
 * question unanswerable and quietly marks a correct choice wrong — which is
 * the failure mode the alphabet drill's distractors already hit once.
 */
test("no option is repeated inside a question", () => {
  for (const q of w.questions) {
    assert.equal(new Set(q.options).size, q.options.length, q.id);
  }
});

test("every question carries its margin note, in both languages", () => {
  for (const q of w.questions) {
    assert.ok(q.note.trim(), `${q.id} has no note`);
    assert.ok(q.why.trim(), `${q.id} has no explanation`);
    assert.ok(q.en.trim(), `${q.id} has no English line`);
  }
});

/**
 * The ulpan's paper is unpointed and so is this. A vocalised drill would
 * train a reading the test never shows.
 */
test("nothing in the bank is vocalised", () => {
  for (const q of w.questions) {
    assert.doesNotMatch(q.prompt, /[֑-ׇ]/, q.id);
    for (const o of q.options) assert.doesNotMatch(o, /[֑-ׇ]/, q.id);
  }
});

test("the form has unique keys and every chip field has chips", () => {
  const keys = (w.form ?? []).map((f) => f.key);
  assert.equal(new Set(keys).size, keys.length);
  for (const f of w.form ?? []) {
    if (f.kind === "chips") assert.ok((f.options ?? []).length > 0, f.key);
  }
});

/* --- the passages --------------------------------------------------------- */

test("every passage has one answer per blank, numbered from zero", () => {
  for (const p of w.passages ?? []) {
    const blanks = clozeParts(p).filter((x) => "blank" in x) as {
      blank: number;
    }[];
    assert.equal(blanks.length, p.answers.length, p.id);
    assert.deepEqual(
      [...blanks.map((b) => b.blank)].sort((a, b) => a - b),
      p.answers.map((_, i) => i),
      p.id,
    );
  }
});

test("splitting a passage loses none of its text", () => {
  for (const p of w.passages ?? []) {
    const rebuilt = clozeParts(p)
      .map((x) => ("text" in x ? x.text : `{${x.blank}}`))
      .join("");
    assert.equal(rebuilt, p.text, p.id);
  }
});

test("the bank is bigger than the blanks, so a wrong word is available", () => {
  for (const p of w.passages ?? []) {
    assert.ok(p.decoys.length > 0, p.id);
  }
});

/* --- drawing -------------------------------------------------------------- */

test("presenting a question keeps the right answer right", () => {
  for (const q of w.questions) {
    for (let i = 0; i < 5; i++) {
      const d = present(q);
      assert.equal(d.options[d.answer], q.options[q.answer], q.id);
      assert.equal(d.options.length, q.options.length);
      assert.deepEqual([...d.options].sort(), [...q.options].sort());
    }
  }
});

/**
 * A section drill is the whole section. A random 15 of 30 would make two runs
 * incomparable, and comparing runs is the point of the screen.
 */
test("a section drill asks the whole section, once each", () => {
  const drawn = drawSection(w, "demo");
  assert.equal(drawn.length, 22);
  const ids = drawn.map((d) => d.q.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("the mock is the right length and never repeats a question", () => {
  for (let i = 0; i < 20; i++) {
    const paper = drawMock(w);
    assert.equal(paper.length, MOCK_SIZE);
    const ids = paper.map((d) => d.q.id);
    assert.equal(new Set(ids).size, ids.length);
  }
});

test("the mock draws from every quiz section, in proportion", () => {
  const quiz = w.sections.filter((s) => s.kind === "quiz");
  for (let i = 0; i < 20; i++) {
    const paper = drawMock(w);
    for (const s of quiz) {
      const got = paper.filter((d) => d.q.part === s.id).length;
      const want = (MOCK_SIZE * questionsIn(w, s.id).length) / 109;
      assert.ok(
        Math.abs(got - want) <= 1,
        `${s.id}: ${got} against ${want.toFixed(1)}`,
      );
    }
  }
});

test("a mock larger than the bank is capped at the bank", () => {
  const paper = drawMock(w, 500);
  assert.equal(paper.length, 109);
});

test("Hebrew is recognised, Latin is not", () => {
  assert.ok(isHebrew("שם פרטי"));
  assert.ok(isHebrew("רופא → ____ (נקבה)"));
  assert.equal(isHebrew("married (female)"), false);
});

/* --- the record ----------------------------------------------------------- */

test("a percentage is right over asked, and never divides by zero", () => {
  assert.equal(pct({ right: 8, asked: 10 }), 80);
  assert.equal(pct({ right: 0, asked: 0 }), 0);
});

test("runs come back oldest first, filtered by part and item", () => {
  const runs = [
    run({ at: 3, part: "demo" }),
    run({ at: 1, part: "verbs" }),
    run({ at: 2, part: "cloze", item: "p2" }),
  ];
  assert.deepEqual(runsFor(runs, "w1").map((r) => r.at), [1, 2, 3]);
  assert.deepEqual(runsFor(runs, "w1", "demo").map((r) => r.at), [3]);
  assert.deepEqual(runsFor(runs, "w1", "cloze", "p1"), []);
  assert.deepEqual(runsFor(runs, "w1", "cloze", "p2").map((r) => r.at), [2]);
  assert.deepEqual(runsFor(runs, "w2"), []);
});

test("the series is every run in order, not the best of them", () => {
  const runs = [
    run({ at: 2, right: 5, asked: 10 }),
    run({ at: 1, right: 9, asked: 10 }),
    run({ at: 3, right: 7, asked: 10 }),
  ];
  assert.deepEqual(series(runs, "w1", "verbs"), [90, 50, 70]);
  assert.equal(bestPct(runs, "w1", "verbs"), 90);
  assert.equal(attempts(runs, "w1", "verbs"), 3);
  assert.equal(lastRun(runs, "w1", "verbs")?.at, 3);
});

test("nothing sat means nothing to report, rather than a zero", () => {
  assert.equal(bestPct([], "w1", "verbs"), null);
  assert.equal(lastRun([], "w1", "verbs"), null);
  assert.equal(delta([], "w1", "verbs"), null);
});

/** One score is not a trend, and a fall is a real answer. */
test("the delta needs two runs, and reports a fall as one", () => {
  const first = [run({ at: 1, right: 5, asked: 10 })];
  assert.equal(delta(first, "w1", "verbs"), null);

  const better = [...first, run({ at: 2, right: 9, asked: 10 })];
  assert.equal(delta(better, "w1", "verbs"), 40);

  const worse = [...first, run({ at: 2, right: 2, asked: 10 })];
  assert.equal(delta(worse, "w1", "verbs"), -30);
});

test("the delta measures the latest against the first, not the best", () => {
  const runs = [
    run({ at: 1, right: 5, asked: 10 }),
    run({ at: 2, right: 10, asked: 10 }),
    run({ at: 3, right: 7, asked: 10 }),
  ];
  assert.equal(bestPct(runs, "w1", "verbs"), 100);
  assert.equal(delta(runs, "w1", "verbs"), 20);
});

/**
 * A section never opened counts as zero. Averaging only what has been
 * attempted would read 100% after one perfect section, which is exactly the
 * reassurance a test week cannot afford.
 */
test("readiness counts the sections you have not opened", () => {
  assert.equal(readiness([], w), 0);
  assert.equal(scored(w).length, 5);

  const one = [run({ part: "verbs", right: 10, asked: 10 })];
  assert.equal(readiness(one, w), 20);

  const all = scored(w).map((s, i) =>
    run({ part: s.id, right: 10, asked: 10, at: i + 1 }),
  );
  assert.equal(readiness(all, w), 100);
});

test("readiness takes the best of a section, not the last", () => {
  const runs = [
    run({ part: "verbs", right: 10, asked: 10, at: 1 }),
    run({ part: "verbs", right: 0, asked: 10, at: 2 }),
  ];
  assert.equal(readiness(runs, w), 20);
});

test("the form is practice and never counts toward readiness", () => {
  assert.ok(!scored(w).some((s) => s.kind === "form"));
});

test("the record reads newest first", () => {
  const runs = [run({ at: 1 }), run({ at: 3 }), run({ at: 2 })];
  assert.deepEqual(recent(runs).map((r) => r.at), [3, 2, 1]);
  assert.equal(recent(runs, 2).length, 2);
});
