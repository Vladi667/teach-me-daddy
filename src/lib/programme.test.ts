import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DEPLOY_AT,
  MAX_INTAKE,
  MIN_INTAKE,
  PLANNED_INTAKE,
  PROGRAMME_DAYS,
  cardId,
  dayNumber,
  intakeFor,
  isDeployable,
  project,
  readiness,
  retentionRate,
  stagesFor,
} from "./programme.ts";

/* --- where the trainee is ------------------------------------------------ */

test("the start date is day 1, not day 0", () => {
  assert.equal(dayNumber("2026-01-01", "2026-01-01"), 1);
  assert.equal(dayNumber("2026-01-01", "2026-01-02"), 2);
  assert.equal(dayNumber("2026-01-01", "2026-05-20"), 140);
});

test("day number ignores month and year boundaries", () => {
  assert.equal(dayNumber("2026-01-31", "2026-02-01"), 2);
  assert.equal(dayNumber("2025-12-31", "2026-01-01"), 2);
});

test("a clock set backwards can't produce a day before the first", () => {
  assert.equal(dayNumber("2026-03-01", "2026-02-20"), 1);
});

/* --- intake --------------------------------------------------------------- */

test("a clear queue issues the planned intake", () => {
  const i = intakeFor(0, 1, false);
  assert.equal(i.count, PLANNED_INTAKE);
  assert.equal(i.reason, "planned");
});

test("a backlog sheds new lines rather than compounding", () => {
  // §9.2: review before adding.
  assert.equal(intakeFor(12, 1, false).count, PLANNED_INTAKE - 1);
  assert.equal(intakeFor(60, 1, false).count, PLANNED_INTAKE - 5);
  assert.equal(intakeFor(12, 1, false).reason, "backlog");
});

test("intake never falls below the floor, however deep the backlog", () => {
  const i = intakeFor(10_000, 1, false);
  assert.equal(i.count, MIN_INTAKE);
});

test("intake never exceeds the ceiling", () => {
  // §5's cap is a retention limit, so being ahead must not raise it.
  assert.equal(intakeFor(0, 1, false, 40).count, MAX_INTAKE);
});

test("retention below the floor halves intake and says so", () => {
  const i = intakeFor(0, 0.7, false);
  assert.equal(i.reason, "retention");
  assert.equal(i.count, Math.floor(PLANNED_INTAKE / 2));
});

test("retention is checked before backlog: consolidating wins", () => {
  const i = intakeFor(500, 0.5, false);
  assert.equal(i.reason, "retention");
  assert.ok(i.count > MIN_INTAKE);
});

test("the rest day issues nothing new", () => {
  // §5 — Sunday is wide review and partial rest.
  const i = intakeFor(0, 1, true);
  assert.equal(i.count, 0);
  assert.equal(i.reason, "rest");
});

test("retention is 1 before there is anything to judge", () => {
  assert.equal(retentionRate([]), 1);
  assert.equal(retentionRate([{ correct: true }, { correct: false }]), 0.5);
});

/* --- stages --------------------------------------------------------------- */

test("production is withheld until the line is understood", () => {
  assert.deepEqual(stagesFor(0), ["listen", "read"]);
  assert.deepEqual(stagesFor(20), ["listen", "read"]);
  assert.deepEqual(stagesFor(21), ["listen", "read", "produce"]);
});

test("each stage schedules independently", () => {
  assert.equal(cardId("l-004", "read"), "l-004:read");
  assert.notEqual(cardId("l-004", "read"), cardId("l-004", "listen"));
});

/* --- consequence ---------------------------------------------------------- */

test("a day worked every day finishes on the 140-day line", () => {
  const p = project("2026-01-01", 10, "2026-01-10");
  assert.equal(p.missed, 0);
  assert.equal(p.slippage, 0);
  assert.equal(p.logged, 10);
});

test("missed days move the finish date instead of scolding", () => {
  // 20 days elapsed, 9 worked: 11 missed, and the date slips by 11.
  const p = project("2026-01-01", 9, "2026-01-20");
  assert.equal(p.missed, 11);
  assert.equal(p.slippage, 11);
});

test("the projected date is the remaining work from today", () => {
  const p = project("2026-01-01", PROGRAMME_DAYS - 1, "2026-06-01");
  assert.equal(p.deployOn, "2026-06-02");
});

test("finishing the programme stops projecting further work", () => {
  const p = project("2026-01-01", PROGRAMME_DAYS + 5, "2026-06-01");
  assert.equal(p.deployOn, "2026-06-01");
});

/* --- readiness ------------------------------------------------------------ */

test("readiness is zero at the start and 100 at the end", () => {
  assert.equal(
    readiness({
      masteredLines: 0, totalLines: 1700, coverage: 0,
      assessmentsCleared: 0, assessmentsDue: 1,
    }),
    0,
  );
  assert.equal(
    readiness({
      masteredLines: 1700, totalLines: 1700, coverage: 95,
      assessmentsCleared: 5, assessmentsDue: 5,
    }),
    100,
  );
});

test("mastery leads, coverage confirms, assessments keep it honest", () => {
  const base = {
    masteredLines: 850, totalLines: 1700, coverage: 0,
    assessmentsCleared: 0, assessmentsDue: 5,
  };
  assert.equal(readiness(base), 28); // 0.55 * 0.5
  assert.equal(readiness({ ...base, coverage: 95 }), 58); // + 0.30
  assert.equal(
    readiness({ ...base, coverage: 95, assessmentsCleared: 5 }),
    73, // + 0.15
  );
});

test("coverage past the 95% target doesn't inflate readiness", () => {
  // §9.6 — 95% is the finish line; chasing the last 5% earns nothing here.
  const at95 = readiness({
    masteredLines: 0, totalLines: 1700, coverage: 95,
    assessmentsCleared: 0, assessmentsDue: 1,
  });
  const at100 = readiness({
    masteredLines: 0, totalLines: 1700, coverage: 100,
    assessmentsCleared: 0, assessmentsDue: 1,
  });
  assert.equal(at95, at100);
});

test("no assessments due yet counts as clear, not as failed", () => {
  const r = readiness({
    masteredLines: 0, totalLines: 10, coverage: 0,
    assessmentsCleared: 0, assessmentsDue: 0,
  });
  assert.equal(r, 15);
});

test("deployment needs the bar and every assessment cleared", () => {
  assert.equal(isDeployable(DEPLOY_AT, true), true);
  assert.equal(isDeployable(DEPLOY_AT - 1, true), false);
  // Readiness alone is not clearance.
  assert.equal(isDeployable(100, false), false);
});
