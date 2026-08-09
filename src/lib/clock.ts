"use client";

import { useSyncExternalStore } from "react";

/**
 * Reading the clock during render is impure — the same render would produce a
 * different result each time. This exposes time as an external store instead:
 * the value is stable within a tick and React is told when it changes.
 */

/** Coarseness of the clock. Anything finer just causes re-renders. */
const TICK = 30_000;

const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;

function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  timer ??= setInterval(() => listeners.forEach((l) => l()), TICK);
  return () => {
    listeners.delete(fn);
    if (listeners.size === 0 && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}

/** Rounded down to the tick so repeated calls inside one render agree. */
function getSnapshot(): number {
  return Math.floor(Date.now() / TICK) * TICK;
}

function getServerSnapshot(): number {
  return 0;
}

/** Current time, safe to call during render. 0 until the client hydrates. */
export function useNow(): number {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * Exact current time, for event handlers and effects — anywhere outside
 * render, where reading the clock is legitimate.
 */
export function nowMs(): number {
  return Date.now();
}

/**
 * Today's local date key, or null before the client takes over.
 *
 * Every page here is statically prerendered, so anything derived from the date
 * at render time is frozen at *build* time — and the build runs in UTC. Render
 * that and the markup disagrees with the browser for any viewer on a different
 * calendar day, which React reports as a hydration mismatch. Callers must treat
 * null as "not known yet" rather than substituting the date themselves.
 */
export function useToday(): string | null {
  const now = useNow();
  if (!now) return null;
  const d = new Date(now);
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}
