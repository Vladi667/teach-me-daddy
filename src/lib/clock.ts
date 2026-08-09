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
