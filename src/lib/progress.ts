"use client";

import { useSyncExternalStore } from "react";
import { LETTERS } from "./letters";

const STORAGE_KEY = "tmd.alphabet.v1";

export const MASTERY_TARGET = 3;

export interface LetterStat {
  streak: number;
  seen: number;
  wrong: number;
}

export type ProgressMap = Record<string, LetterStat>;

const EMPTY: LetterStat = { streak: 0, seen: 0, wrong: 0 };

/** Stable identity: also the marker for "not hydrated yet". */
const SERVER_SNAPSHOT: ProgressMap = {};

export function statFor(progress: ProgressMap, char: string): LetterStat {
  return progress[char] ?? EMPTY;
}

export function isMastered(progress: ProgressMap, char: string): boolean {
  return statFor(progress, char).streak >= MASTERY_TARGET;
}

export function masteredCount(progress: ProgressMap): number {
  return LETTERS.filter((l) => isMastered(progress, l.char)).length;
}

/* --- store ------------------------------------------------------------- */

let cache: ProgressMap | null = null;
const listeners = new Set<() => void>();

function readStorage(): ProgressMap {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ProgressMap) : {};
  } catch {
    return {};
  }
}

function getSnapshot(): ProgressMap {
  cache ??= readStorage();
  return cache;
}

function getServerSnapshot(): ProgressMap {
  return SERVER_SNAPSHOT;
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  // Keep other tabs of the app in step.
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      cache = readStorage();
      listeners.forEach((l) => l());
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

function commit(next: ProgressMap) {
  cache = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* private mode / quota — progress just won't survive the session */
  }
  listeners.forEach((l) => l());
}

export function recordAnswer(char: string, correct: boolean) {
  const cur = statFor(getSnapshot(), char);
  commit({
    ...getSnapshot(),
    [char]: {
      streak: correct ? cur.streak + 1 : 0,
      seen: cur.seen + 1,
      wrong: cur.wrong + (correct ? 0 : 1),
    },
  });
}

export function resetProgress() {
  commit({});
}

/**
 * Progress lives in localStorage, so it can't exist during prerender.
 * `ready` is false until the first client snapshot replaces the server one.
 */
export function useProgress() {
  const progress = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  return {
    progress,
    ready: progress !== SERVER_SNAPSHOT,
    record: recordAnswer,
    reset: resetProgress,
  };
}
