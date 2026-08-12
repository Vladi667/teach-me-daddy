/**
 * The physics behind a draggable card.
 *
 * Pure functions, so the feel is testable rather than a matter of opinion.
 * Values come from Apple's *Designing Fluid Interfaces* (WWDC 2018): the
 * exponential-decay projection it actually ships, not the textbook
 * v²/(2·decel), and a spring parameterised the way a designer thinks about it
 * — how much it overshoots, and how quickly it arrives.
 */

/**
 * Where a flick would come to rest, from its release velocity.
 *
 * This is what makes a throw feel thrown: the target is chosen from where the
 * gesture was *going*, not from where the finger happened to leave the glass.
 *
 * @param velocity px/s at release
 * @param decelerationRate 0.998 is the normal scroll feel; lower is snappier
 */
export function project(velocity: number, decelerationRate = 0.998): number {
  return ((velocity / 1000) * decelerationRate) / (1 - decelerationRate);
}

/**
 * Progressive resistance past a boundary.
 *
 * A hard stop reads as frozen — as though the app died. Resistance that grows
 * with the overshoot reads as "responsive, but there is nothing more here".
 */
export function rubberband(
  overshoot: number,
  dimension: number,
  constant = 0.55,
): number {
  return (
    (overshoot * dimension * constant) /
    (dimension + constant * Math.abs(overshoot))
  );
}

export interface SpringState {
  value: number;
  velocity: number;
}

/**
 * One step of a spring, in Apple's two parameters.
 *
 * `damping` 1 is critically damped — arrives without overshoot, which is the
 * house default. Below 1 it overshoots, and that is only right when the
 * gesture itself carried momentum. `response` is how quickly it reaches the
 * target in seconds; it is not a duration, because a spring has none.
 */
export function springStep(
  s: SpringState,
  target: number,
  dt: number,
  damping = 1,
  response = 0.35,
): SpringState {
  // Clamp the timestep: a backgrounded tab returns a huge dt, and integrating
  // it in one go throws the card off the screen.
  const h = Math.min(dt, 1 / 30);
  const omega = (2 * Math.PI) / response;
  const accel =
    -omega * omega * (s.value - target) - 2 * damping * omega * s.velocity;
  const velocity = s.velocity + accel * h;
  return { value: s.value + velocity * h, velocity };
}

/** Near enough to the target, and slow enough, to stop integrating. */
export function settled(s: SpringState, target: number): boolean {
  return Math.abs(s.value - target) < 0.5 && Math.abs(s.velocity) < 20;
}

/**
 * Velocity from the last few pointer samples rather than the final pair.
 *
 * Two adjacent events can be a millisecond apart, which turns rounding into a
 * wild velocity and throws the card. Averaging over a short window is what
 * makes a slow drag release slowly.
 */
export function velocityFrom(
  samples: { x: number; t: number }[],
  window = 100,
): number {
  if (samples.length < 2) return 0;
  const last = samples[samples.length - 1];
  let first = samples[0];
  for (let i = samples.length - 1; i >= 0; i--) {
    first = samples[i];
    if (last.t - samples[i].t >= window) break;
  }
  const dt = last.t - first.t;
  if (dt <= 0) return 0;
  return ((last.x - first.x) / dt) * 1000;
}

/**
 * Does this gesture commit, and which way?
 *
 * Decided on the projected landing point, so a short fast flick counts and a
 * long slow drag that is being reconsidered does not. Velocity sign is what
 * distinguishes "still going" from "brought back".
 */
export function swipeOutcome(
  offset: number,
  velocity: number,
  threshold: number,
): -1 | 0 | 1 {
  const landing = offset + project(velocity);
  // Pulling back cancels. Dragging one way and then yanking hard the other
  // projects a landing on the far side, and committing to it would grade a
  // card the opposite way from the one the trainee moved it — the gesture
  // people use to say "no, not that" would be the most destructive one.
  if (offset !== 0 && Math.sign(landing) !== Math.sign(offset)) return 0;
  if (landing >= threshold) return 1;
  if (landing <= -threshold) return -1;
  return 0;
}
