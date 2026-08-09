"use client";

import { useSyncExternalStore } from "react";
import type { SrsCard } from "./srs";
import { emptyPlan, type PlanState } from "./plan";
import { NEW_WORDS_CAP } from "./plan";

/* --- shape --------------------------------------------------------------- */

export interface LetterStat {
  streak: number;
  seen: number;
  wrong: number;
}

export interface Settings {
  /** New cards admitted per day. §5 caps this at ~40. */
  newPerDay: number;
  /** Which gloss to show on vocabulary cards. */
  gloss: "fr" | "en";
}

export interface ProfileData {
  version: 1;
  /** Alphabet drill — streak-based, separate from the SRS scheduler. */
  alphabet: Record<string, LetterStat>;
  /** Vocabulary scheduling, keyed by card id. */
  srs: Record<string, SrsCard>;
  /** "YYYY-MM-DD" → new cards introduced that day, for the daily cap. */
  newLog: Record<string, number>;
  plan: PlanState;
  settings: Settings;
  /** Epoch ms of the last local change — drives last-write-wins on sync. */
  updatedAt: number;
}

export const GUEST = "__guest";

export const emptyData = (): ProfileData => ({
  version: 1,
  alphabet: {},
  srs: {},
  newLog: {},
  plan: emptyPlan(),
  settings: { newPerDay: NEW_WORDS_CAP, gloss: "fr" },
  updatedAt: 0,
});

/** Merge over defaults so data written by an older build still loads. */
function normalise(raw: Partial<ProfileData> | null): ProfileData {
  const base = emptyData();
  if (!raw) return base;
  return {
    ...base,
    ...raw,
    alphabet: raw.alphabet ?? base.alphabet,
    srs: raw.srs ?? base.srs,
    newLog: raw.newLog ?? base.newLog,
    plan: { ...base.plan, ...(raw.plan ?? {}) },
    settings: { ...base.settings, ...(raw.settings ?? {}) },
    version: 1,
  };
}

export interface ProfileRef {
  username: string;
  hasPin: boolean;
}

export type SyncState =
  | "off"
  | "idle"
  | "syncing"
  | "synced"
  | "offline"
  | "error";

/* --- keys ---------------------------------------------------------------- */

const K_CURRENT = "tmd:current";
const K_PROFILES = "tmd:profiles";
const K_DATA = (u: string) => `tmd:data:${u}`;
/** PINs are held only for the session's convenience, never sent anywhere else. */
const K_PIN = (u: string) => `tmd:pin:${u}`;
const K_LEGACY_ALPHABET = "tmd.alphabet.v1";

export const SYNC_ENABLED =
  process.env.NEXT_PUBLIC_SYNC_ENABLED === "1";

export const USERNAME_RE = /^[a-z0-9](?:[a-z0-9_-]{1,18}[a-z0-9])$/;

export function validateUsername(raw: string): string | null {
  const u = raw.trim().toLowerCase();
  if (u.length < 3) return "At least 3 characters.";
  if (u.length > 20) return "At most 20 characters.";
  if (!USERNAME_RE.test(u))
    return "Letters, numbers, hyphen and underscore only.";
  return null;
}

/* --- local persistence --------------------------------------------------- */

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode / quota */
  }
}

/* --- store --------------------------------------------------------------- */

interface Snapshot {
  username: string;
  data: ProfileData;
  profiles: ProfileRef[];
  sync: SyncState;
  /** Set when a sign-in or save was rejected. */
  error: string | null;
}

const SERVER_SNAPSHOT: Snapshot = {
  username: GUEST,
  data: emptyData(),
  profiles: [],
  sync: "off",
  error: null,
};

let snapshot: Snapshot | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function hydrate(): Snapshot {
  const username = window.localStorage.getItem(K_CURRENT) || GUEST;
  const profiles = readJSON<ProfileRef[]>(K_PROFILES, []);
  let data = normalise(readJSON<ProfileData | null>(K_DATA(username), null));

  // One-time migration of the pre-profiles alphabet progress.
  if (username === GUEST && Object.keys(data.alphabet).length === 0) {
    const legacy = readJSON<Record<string, LetterStat> | null>(
      K_LEGACY_ALPHABET,
      null,
    );
    if (legacy && Object.keys(legacy).length) {
      data = { ...data, alphabet: legacy, updatedAt: Date.now() };
      writeJSON(K_DATA(GUEST), data);
    }
  }

  return {
    username,
    data,
    profiles,
    sync: SYNC_ENABLED && username !== GUEST ? "idle" : "off",
    error: null,
  };
}

function getSnapshot(): Snapshot {
  snapshot ??= hydrate();
  return snapshot;
}

function getServerSnapshot(): Snapshot {
  return SERVER_SNAPSHOT;
}

function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

function set(patch: Partial<Snapshot>) {
  snapshot = { ...getSnapshot(), ...patch };
  emit();
}

/* --- mutations ----------------------------------------------------------- */

let pushTimer: ReturnType<typeof setTimeout> | null = null;

/** Apply a change to the current profile, persist locally, queue a push. */
export function update(fn: (d: ProfileData) => ProfileData) {
  const cur = getSnapshot();
  const next = { ...fn(cur.data), updatedAt: Date.now() };
  writeJSON(K_DATA(cur.username), next);
  set({ data: next });
  schedulePush();
}

function schedulePush() {
  if (!SYNC_ENABLED) return;
  const { username } = getSnapshot();
  if (username === GUEST) return;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => void push(), 1500);
}

function pinFor(username: string): string | undefined {
  try {
    return window.sessionStorage.getItem(K_PIN(username)) || undefined;
  } catch {
    return undefined;
  }
}

function rememberPin(username: string, pin?: string) {
  try {
    if (pin) window.sessionStorage.setItem(K_PIN(username), pin);
    else window.sessionStorage.removeItem(K_PIN(username));
  } catch {
    /* ignore */
  }
}

async function api(action: string, body: Record<string, unknown>) {
  const res = await fetch("/api/profile", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action, ...body }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
  return json;
}

export async function push(): Promise<void> {
  if (!SYNC_ENABLED) return;
  const { username, data } = getSnapshot();
  if (username === GUEST) return;
  set({ sync: "syncing" });
  try {
    await api("save", { username, pin: pinFor(username), data });
    set({ sync: "synced", error: null });
  } catch (e) {
    const offline = typeof navigator !== "undefined" && !navigator.onLine;
    set({
      sync: offline ? "offline" : "error",
      error: e instanceof Error ? e.message : "Sync failed",
    });
  }
}

function rememberProfile(username: string, hasPin: boolean) {
  const profiles = getSnapshot().profiles.filter(
    (p) => p.username !== username,
  );
  const next = [{ username, hasPin }, ...profiles].slice(0, 12);
  writeJSON(K_PROFILES, next);
  set({ profiles: next });
}

/** Adopt a profile locally and make it current. */
function adopt(username: string, data: ProfileData, hasPin: boolean) {
  writeJSON(K_DATA(username), data);
  window.localStorage.setItem(K_CURRENT, username);
  rememberProfile(username, hasPin);
  set({ username, data, sync: SYNC_ENABLED ? "synced" : "off", error: null });
}

export async function createProfile(
  rawName: string,
  pin?: string,
  /** Carry whatever is in the guest profile into the new one. */
  claimGuest = true,
): Promise<void> {
  const username = rawName.trim().toLowerCase();
  const problem = validateUsername(username);
  if (problem) throw new Error(problem);

  const cur = getSnapshot();
  const seed =
    claimGuest && cur.username === GUEST
      ? { ...cur.data, updatedAt: Date.now() }
      : emptyData();

  if (SYNC_ENABLED) {
    set({ sync: "syncing" });
    await api("create", { username, pin, data: seed });
  }
  rememberPin(username, pin);
  adopt(username, seed, !!pin);
}

export async function signIn(rawName: string, pin?: string): Promise<void> {
  const username = rawName.trim().toLowerCase();
  const problem = validateUsername(username);
  if (problem) throw new Error(problem);

  if (!SYNC_ENABLED) {
    // Local-only: just switch to whatever this device holds.
    const local = normalise(readJSON<ProfileData | null>(K_DATA(username), null));
    adopt(username, local, false);
    return;
  }

  set({ sync: "syncing" });
  const res = await api("load", { username, pin });
  const remote = normalise(res.data ?? null);
  const local = readJSON<ProfileData | null>(K_DATA(username), null);

  // Last write wins. Local only survives if it's genuinely newer, which
  // happens when this device made changes while the network was down.
  const data =
    local && (local.updatedAt ?? 0) > (remote.updatedAt ?? 0)
      ? normalise(local)
      : remote;

  rememberPin(username, pin);
  adopt(username, data, !!res.hasPin);
  if (data !== remote) void push();
}

export function signOut() {
  const { username } = getSnapshot();
  rememberPin(username, undefined);
  window.localStorage.setItem(K_CURRENT, GUEST);
  const data = normalise(readJSON<ProfileData | null>(K_DATA(GUEST), null));
  set({ username: GUEST, data, sync: "off", error: null });
}

export function forgetProfile(username: string) {
  try {
    window.localStorage.removeItem(K_DATA(username));
  } catch {
    /* ignore */
  }
  const next = getSnapshot().profiles.filter((p) => p.username !== username);
  writeJSON(K_PROFILES, next);
  set({ profiles: next });
  if (getSnapshot().username === username) signOut();
}

export function resetCurrent() {
  update(() => ({ ...emptyData(), updatedAt: Date.now() }));
}

export function exportData(): string {
  const { username, data } = getSnapshot();
  return JSON.stringify({ username, exportedAt: Date.now(), data }, null, 2);
}

export function importData(json: string) {
  const parsed = JSON.parse(json) as { data?: ProfileData };
  const incoming = normalise(parsed.data ?? (parsed as ProfileData));
  update(() => incoming);
}

/* --- hooks --------------------------------------------------------------- */

export function useStore() {
  const s = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return {
    ...s,
    ready: s !== SERVER_SNAPSHOT,
    isGuest: s.username === GUEST,
    update,
  };
}
