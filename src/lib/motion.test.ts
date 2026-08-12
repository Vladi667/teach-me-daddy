import test from "node:test";
import assert from "node:assert/strict";
import {
  project,
  rubberband,
  settled,
  springStep,
  swipeOutcome,
  velocityFrom,
  type SpringState,
} from "./motion.ts";

/* --- projection ----------------------------------------------------------- */

test("a flick projects forward, and harder the faster it goes", () => {
  assert.equal(project(0), 0);
  assert.ok(project(1000) > 0);
  assert.ok(project(2000) > project(1000));
  assert.ok(project(-1000) < 0, "and backward when thrown backward");
});

test("projection uses the decay Apple ships, not the textbook formula", () => {
  // (v/1000) · d / (1 − d) — at 1000px/s and d=0.998 that is 499px.
  assert.equal(Math.round(project(1000)), 499);
  assert.ok(project(1000, 0.99) < project(1000, 0.998), "lower rate is snappier");
});

/* --- rubber-banding ------------------------------------------------------- */

test("resistance grows with the overshoot, and never fully stops", () => {
  const d = 390;
  const a = rubberband(20, d);
  const b = rubberband(200, d);
  assert.ok(a < 20, "the card always lags the finger past the edge");
  assert.ok(b > a, "but it never stops moving");
  assert.ok(b / 200 < a / 20, "the further out, the less it follows");
});

test("rubber-banding is symmetric", () => {
  assert.equal(rubberband(-50, 390), -rubberband(50, 390));
});

/* --- the spring ----------------------------------------------------------- */

/** Integrate to rest and report what happened on the way. */
function run(from: number, to: number, damping: number, v0 = 0) {
  let s: SpringState = { value: from, velocity: v0 };
  let overshoot = 0;
  let steps = 0;
  while (!settled(s, to) && steps < 2000) {
    s = springStep(s, to, 1 / 60, damping);
    if (to > from) overshoot = Math.max(overshoot, s.value - to);
    else overshoot = Math.max(overshoot, to - s.value);
    steps++;
  }
  return { steps, overshoot, final: s };
}

test("a critically damped spring arrives without overshooting", () => {
  const r = run(0, 100, 1);
  assert.ok(r.overshoot < 1, `overshot by ${r.overshoot.toFixed(2)}px`);
  assert.ok(r.steps < 120, `took ${r.steps} frames`);
});

test("an under-damped spring overshoots, which is the point of it", () => {
  // Measured: 0.7 gives ~1.7px of bounce, 0.5 gives ~13px. Critical gives none.
  assert.ok(run(0, 100, 1).overshoot < 0.5, "critical does not");
  assert.ok(run(0, 100, 0.7).overshoot > 0.5, "0.7 barely does");
  assert.ok(run(0, 100, 0.5).overshoot > 8, "0.5 clearly does");
});

test("a lower response arrives sooner", () => {
  const slow = (() => {
    let s: SpringState = { value: 0, velocity: 0 }, n = 0;
    while (!settled(s, 100) && n < 2000) { s = springStep(s, 100, 1 / 60, 1, 0.6); n++; }
    return n;
  })();
  const fast = (() => {
    let s: SpringState = { value: 0, velocity: 0 }, n = 0;
    while (!settled(s, 100) && n < 2000) { s = springStep(s, 100, 1 / 60, 1, 0.2); n++; }
    return n;
  })();
  assert.ok(fast < slow, `${fast} vs ${slow} frames`);
});

test("release velocity carries into the spring rather than being dropped", () => {
  // Frames-to-settle is the wrong probe: a critically damped spring converges
  // on the same schedule either way. The handoff shows in the early frames,
  // which is exactly where a seam between finger and animation would show.
  const step = (v0: number, frames: number) => {
    let s: SpringState = { value: 0, velocity: v0 };
    for (let i = 0; i < frames; i++) s = springStep(s, 100, 1 / 60, 1);
    return s.value;
  };
  assert.ok(step(800, 3) > step(0, 3) + 5, `${step(800, 3)} vs ${step(0, 3)}`);
});

test("a huge timestep cannot fling the card off screen", () => {
  // A backgrounded tab comes back with seconds of dt.
  const s = springStep({ value: 0, velocity: 0 }, 100, 5, 1);
  assert.ok(Number.isFinite(s.value) && Math.abs(s.value) < 200, String(s.value));
});

/**
 * What interruptibility does and does not promise.
 *
 * Position is continuous: re-targeting mid-flight carries the live value and
 * velocity in, so nothing teleports. Velocity is *not* continuous, and cannot
 * be — moving a stiff spring's anchor 200px produces a large acceleration by
 * definition. The failure the skill warns about is different: replacing the
 * animation and restarting from the target value, or from zero velocity,
 * which shows as a visible jump. This asserts the absence of that.
 */
test("a spring re-targeted mid-flight carries its position and speed in", () => {
  let s: SpringState = { value: 0, velocity: 0 };
  for (let i = 0; i < 10; i++) s = springStep(s, 100, 1 / 60, 1);
  const caught = { ...s };
  assert.ok(caught.value > 50 && caught.velocity > 0, "sanity: mid-flight");

  const next = springStep(caught, -100, 1 / 60, 1);
  assert.ok(
    Math.abs(next.value - caught.value) < 20,
    `teleported ${(next.value - caught.value).toFixed(1)}px`,
  );
  assert.ok(next.value > 0, "did not snap to the new target");

  // Starting the same re-target from a standstill would look different, which
  // is the whole point of feeding the live state back in.
  const fromRest = springStep({ value: caught.value, velocity: 0 }, -100, 1 / 60, 1);
  assert.ok(fromRest.value !== next.value, "the carried velocity changed it");
});

/* --- velocity ------------------------------------------------------------- */

test("velocity comes from a window, not from the last two points", () => {
  const steady = [
    { x: 0, t: 0 }, { x: 30, t: 50 }, { x: 60, t: 100 },
  ];
  assert.equal(Math.round(velocityFrom(steady)), 600);
});

test("two samples a millisecond apart do not invent a huge velocity", () => {
  const jittery = [
    { x: 0, t: 0 }, { x: 30, t: 50 }, { x: 60, t: 100 }, { x: 61, t: 101 },
  ];
  // The last pair alone implies 1000px/s; the window says ~600.
  assert.ok(Math.abs(velocityFrom(jittery)) < 700, String(velocityFrom(jittery)));
});

test("a stationary finger has no velocity", () => {
  assert.equal(velocityFrom([{ x: 10, t: 0 }, { x: 10, t: 80 }]), 0);
  assert.equal(velocityFrom([{ x: 10, t: 5 }]), 0, "one sample is not a gesture");
  assert.equal(velocityFrom([]), 0);
});

/* --- the decision --------------------------------------------------------- */

const T = 90;

test("a slow drag past the threshold commits", () => {
  assert.equal(swipeOutcome(120, 0, T), 1);
  assert.equal(swipeOutcome(-120, 0, T), -1);
});

test("a short fast flick commits on its projection alone", () => {
  assert.equal(swipeOutcome(30, 900, T), 1, "30px but thrown");
});

test("a long drag being pulled back cancels rather than flipping", () => {
  // Past the threshold in position, but travelling hard the other way. The
  // projection lands far to the left; committing to it would grade the card
  // the opposite way from the one it was dragged.
  assert.equal(swipeOutcome(100, -900, T), 0);
  assert.equal(swipeOutcome(-100, 900, T), 0);
});

test("a nudge goes nowhere", () => {
  assert.equal(swipeOutcome(10, 0, T), 0);
  assert.equal(swipeOutcome(0, 0, T), 0);
});
