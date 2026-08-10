"use client";

import { useState } from "react";
import { LETTERS } from "@/lib/letters";
import { useDeck } from "@/lib/use-deck";
import { isMature, isReview } from "@/lib/srs";
import { MASTERY_TARGET, masteredCount } from "@/lib/progress";
import { NEW_WORDS_CAP, streak, totalMinutes } from "@/lib/plan";
import {
  GUEST,
  SYNC_ENABLED,
  createProfile,
  exportData,
  forgetProfile,
  importData,
  push,
  resetCurrent,
  signIn,
  signOut,
  update,
  useStore,
} from "@/lib/store";
import { tap } from "@/lib/feedback";

type Mode = "menu" | "create" | "signin";

export default function MePage() {
  const { username, data, profiles, sync, ready } = useStore();
  const { cards: CARDS } = useDeck();
  const [mode, setMode] = useState<Mode>("menu");
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [usePin, setUsePin] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const mastered = ready ? masteredCount(data.alphabet) : 0;
  const seen = Object.values(data.srs).length;
  const mature = Object.values(data.srs).filter(isMature).length;
  const inReview = Object.values(data.srs).filter(isReview).length;
  const hours = Math.round(totalMinutes(data.plan) / 60);
  const run = ready ? streak(data.plan) : 0;

  async function run_(fn: () => Promise<void>, done?: string) {
    setBusy(true);
    setErr(null);
    setNote(null);
    try {
      await fn();
      setMode("menu");
      setName("");
      setPin("");
      setUsePin(false);
      if (done) setNote(done);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <header className="anim-rise mb-4">
        <h1 className="text-[27px] font-bold tracking-[-0.03em]">{username}</h1>
        <p className="mt-1 flex items-center gap-2 text-[13px] text-(--color-ink-dim)">
          <SyncDot state={sync} />
          {label(sync)}
        </p>
      </header>

      {/* identity --------------------------------------------------------- */}
      {mode === "menu" && (
        <section
          className="glass anim-rise mb-4 rounded-[26px] p-4"
          style={{ animationDelay: "40ms" }}
        >
          <div className="flex gap-2.5">
            <button
              onClick={() => {
                tap();
                void push();
              }}
              disabled={!SYNC_ENABLED}
              className="press flex-1 rounded-full bg-white/8 py-3 text-[13px] font-semibold"
              style={{ opacity: SYNC_ENABLED ? 1 : 0.4 }}
            >
              Sync now
            </button>
            <button
              onClick={() => {
                tap();
                // Drops back to the gate, where another account can be chosen.
                signOut();
              }}
              className="press flex-1 rounded-full bg-white/8 py-3 text-[13px] font-semibold"
            >
              Switch account
            </button>
          </div>
        </section>
      )}

      {mode !== "menu" && (
        <section className="glass anim-rise mb-4 rounded-[26px] p-4">
          <h2 className="mb-3 text-[15px] font-semibold">
            {mode === "create" ? "Create a username" : "Load a username"}
          </h2>

          <input
            value={name}
            onChange={(e) => setName(e.target.value.toLowerCase())}
            placeholder="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            inputMode="text"
            className="w-full rounded-[16px] bg-white/6 px-4 py-3 text-[15px] outline-none placeholder:text-(--color-ink-faint)"
            style={{ border: "1px solid rgba(255,255,255,0.1)" }}
          />

          {mode === "create" && (
            <label className="mt-3 flex items-center gap-2.5 px-1 text-[12.5px] text-(--color-ink-dim)">
              <input
                type="checkbox"
                checked={usePin}
                onChange={(e) => setUsePin(e.target.checked)}
                className="size-4 accent-[var(--color-accent)]"
              />
              Lock it with a 4-digit PIN
            </label>
          )}

          {(usePin || mode === "signin") && (
            <input
              value={pin}
              onChange={(e) =>
                setPin(e.target.value.replace(/\D/g, "").slice(0, 4))
              }
              placeholder={mode === "signin" ? "PIN (if it has one)" : "4-digit PIN"}
              inputMode="numeric"
              className="mt-2.5 w-full rounded-[16px] bg-white/6 px-4 py-3 text-[15px] tracking-[0.3em] outline-none placeholder:tracking-normal placeholder:text-(--color-ink-faint)"
              style={{ border: "1px solid rgba(255,255,255,0.1)" }}
            />
          )}

          {err && (
            <p className="mt-3 rounded-[14px] px-3.5 py-2.5 text-[12px] leading-snug"
              style={{
                background: "rgba(255,107,122,0.12)",
                color: "var(--color-coral)",
              }}
            >
              {err}
            </p>
          )}

          <div className="mt-3.5 flex gap-2.5">
            <button
              onClick={() => {
                tap();
                setMode("menu");
                setErr(null);
              }}
              className="press flex-1 rounded-full bg-white/8 py-3 text-[13px] font-semibold"
            >
              Cancel
            </button>
            <button
              disabled={busy || name.trim().length < 3}
              onClick={() => {
                tap();
                const p = usePin || mode === "signin" ? pin || undefined : undefined;
                if (mode === "create") {
                  if (usePin && pin.length !== 4) {
                    setErr("A PIN must be exactly 4 digits.");
                    return;
                  }
                  void run_(() => createProfile(name, p), "Username created.");
                } else {
                  void run_(() => signIn(name, p), "Progress loaded.");
                }
              }}
              className="press flex-1 rounded-full py-3 text-[13px] font-semibold"
              style={{
                background:
                  "linear-gradient(100deg, var(--color-accent), var(--color-accent-2))",
                opacity: busy || name.trim().length < 3 ? 0.45 : 1,
              }}
            >
              {busy ? "Working…" : mode === "create" ? "Create" : "Load"}
            </button>
          </div>

          {mode === "create" && (
            <p className="mt-3 text-[11px] leading-relaxed text-(--color-ink-faint)">
              A PIN is optional and only stops someone overwriting your history
              by accident. It is not real security — don&apos;t put anything
              private in here.
            </p>
          )}
        </section>
      )}

      {note && (
        <p
          className="anim-fade mb-4 rounded-[14px] px-3.5 py-2.5 text-[12px]"
          style={{ background: "rgba(74,222,156,0.12)", color: "var(--color-mint)" }}
        >
          {note}
        </p>
      )}

      {/* known profiles on this device ------------------------------------ */}
      {profiles.length > 0 && mode === "menu" && (
        <section className="anim-rise mb-4" style={{ animationDelay: "80ms" }}>
          <h2 className="mb-2.5 px-1 text-[13px] font-semibold text-(--color-ink-faint)">
            On this device
          </h2>
          <div className="flex flex-col gap-2">
            {profiles.map((p) => (
              <div
                key={p.username}
                className="glass flex items-center gap-3 rounded-[18px] px-4 py-3"
              >
                <span className="flex-1 truncate text-[13.5px] font-semibold">
                  {p.username}
                  {p.username === username && (
                    <span className="ml-2 text-[10px] text-(--color-mint)">
                      active
                    </span>
                  )}
                </span>
                {p.hasPin && (
                  <span className="text-[10px] text-(--color-ink-faint)">
                    PIN
                  </span>
                )}
                {p.username !== username && (
                  <button
                    onClick={() => {
                      tap();
                      setMode("signin");
                      setName(p.username);
                    }}
                    className="press rounded-full bg-white/8 px-3 py-1.5 text-[11px] font-semibold"
                  >
                    Load
                  </button>
                )}
                <button
                  onClick={() => {
                    tap();
                    forgetProfile(p.username);
                  }}
                  aria-label={`Forget ${p.username} on this device`}
                  className="press text-[11px] text-(--color-ink-faint)"
                >
                  Forget
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* stats ------------------------------------------------------------ */}
      <section
        className="anim-rise mb-4 grid grid-cols-2 gap-3"
        style={{ animationDelay: "120ms" }}
      >
        <Stat value={`${mastered}/${LETTERS.length}`} label="letters mastered" />
        <Stat value={`${mature}`} label="mature cards" />
        <Stat value={`${inReview}/${CARDS.length}`} label="cards in review" />
        <Stat value={`${hours}h`} label="logged study time" />
      </section>

      <p className="mb-4 px-1 text-[11px] leading-relaxed text-(--color-ink-faint)">
        A letter counts as mastered after {MASTERY_TARGET} correct in a row. A
        card is mature once its interval passes 21 days — that&apos;s the §8
        metric. {seen} of {CARDS.length} cards have been seen; {run}-day streak.
      </p>

      {/* settings ---------------------------------------------------------- */}
      <section className="anim-rise mb-4" style={{ animationDelay: "150ms" }}>
        <h2 className="mb-2.5 px-1 text-[13px] font-semibold text-(--color-ink-faint)">
          Settings
        </h2>

        <div className="glass mb-2 flex items-center justify-between rounded-[18px] px-4 py-3">
          <span className="text-[12.5px] text-(--color-ink-dim)">
            Show meanings in
          </span>
          <div className="flex gap-1.5">
            {(["fr", "en"] as const).map((g) => (
              <button
                key={g}
                onClick={() => {
                  tap();
                  update((d) => ({
                    ...d,
                    settings: { ...d.settings, gloss: g },
                  }));
                }}
                className="press rounded-full px-3.5 py-1.5 text-[12px] font-semibold"
                style={{
                  background:
                    data.settings.gloss === g
                      ? "rgba(255,255,255,0.14)"
                      : "rgba(255,255,255,0.05)",
                  color:
                    data.settings.gloss === g
                      ? "var(--color-ink)"
                      : "var(--color-ink-faint)",
                }}
              >
                {g === "fr" ? "Français" : "English"}
              </button>
            ))}
          </div>
        </div>

        <div className="glass rounded-[18px] px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="text-[12.5px] text-(--color-ink-dim)">
              New cards per day
            </span>
            <div className="flex items-center gap-2">
              {[-10, 10].map((d) => (
                <button
                  key={d}
                  onClick={() => {
                    tap();
                    update((s) => ({
                      ...s,
                      settings: {
                        ...s.settings,
                        newPerDay: Math.max(
                          5,
                          Math.min(120, s.settings.newPerDay + d),
                        ),
                      },
                    }));
                  }}
                  className="press rounded-full bg-white/8 px-2.5 py-1 text-[11px] font-semibold tabular-nums"
                >
                  {d > 0 ? `+${d}` : d}
                </button>
              ))}
              <span className="w-8 text-right text-[13px] font-bold tabular-nums">
                {data.settings.newPerDay}
              </span>
            </div>
          </div>
          {data.settings.newPerDay > NEW_WORDS_CAP && (
            <p
              className="mt-2 text-[11px] leading-snug"
              style={{ color: "var(--color-amber)" }}
            >
              Above the {NEW_WORDS_CAP}/day the plan sets. §5: past that,
              retention collapses because review can&apos;t keep up.
            </p>
          )}
        </div>
      </section>

      {/* data ------------------------------------------------------------- */}
      <section className="anim-rise mb-4" style={{ animationDelay: "160ms" }}>
        <h2 className="mb-2.5 px-1 text-[13px] font-semibold text-(--color-ink-faint)">
          Your data
        </h2>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => {
              tap();
              const blob = new Blob([exportData()], { type: "application/json" });
              const a = document.createElement("a");
              a.href = URL.createObjectURL(blob);
              a.download = `teach-me-daddy-${username === GUEST ? "device" : username}.json`;
              a.click();
              URL.revokeObjectURL(a.href);
            }}
            className="glass press rounded-[18px] px-4 py-3 text-left text-[13px] font-semibold"
          >
            Export a backup
          </button>

          <label className="glass press cursor-pointer rounded-[18px] px-4 py-3 text-[13px] font-semibold">
            Import a backup
            <input
              type="file"
              accept="application/json"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                try {
                  importData(await f.text());
                  setNote("Backup restored.");
                  setErr(null);
                } catch {
                  setErr("That file didn't parse as a backup.");
                }
                e.target.value = "";
              }}
            />
          </label>

          {confirmReset ? (
            <div className="glass rounded-[18px] p-4 text-center">
              <p className="text-[12.5px] text-(--color-ink-dim)">
                Erase all progress for{" "}
                <strong>{username}</strong>?
              </p>
              <div className="mt-3 flex gap-2.5">
                <button
                  onClick={() => {
                    tap();
                    setConfirmReset(false);
                  }}
                  className="press flex-1 rounded-full bg-white/8 py-2.5 text-[13px] font-semibold"
                >
                  Keep it
                </button>
                <button
                  onClick={() => {
                    tap();
                    resetCurrent();
                    setConfirmReset(false);
                    setNote("Progress erased.");
                  }}
                  className="press flex-1 rounded-full py-2.5 text-[13px] font-semibold"
                  style={{
                    background: "rgba(255,107,122,0.18)",
                    color: "var(--color-coral)",
                  }}
                >
                  Erase
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => {
                tap();
                setConfirmReset(true);
              }}
              className="press rounded-[18px] px-4 py-3 text-left text-[13px] font-medium text-(--color-ink-faint)"
            >
              Reset progress
            </button>
          )}
        </div>
      </section>
    </>
  );
}

function label(s: string) {
  return s === "synced"
    ? "Synced"
    : s === "syncing"
      ? "Syncing…"
      : s === "offline"
        ? "Offline — saved here, will sync later"
        : s === "error"
          ? "Sync failed — your progress is still safe on this device"
          : "Saved on this device";
}

function SyncDot({ state }: { state: string }) {
  const tint =
    state === "synced"
      ? "var(--color-mint)"
      : state === "syncing"
        ? "var(--color-accent)"
        : state === "error"
          ? "var(--color-coral)"
          : "var(--color-ink-faint)";
  return (
    <span
      className="inline-block size-2 shrink-0 rounded-full"
      style={{ background: tint, boxShadow: `0 0 8px ${tint}` }}
    />
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="glass rounded-[20px] px-4 py-3.5">
      <div className="text-[20px] font-bold tracking-[-0.03em] tabular-nums">
        {value}
      </div>
      <div className="mt-0.5 text-[11px] text-(--color-ink-faint)">{label}</div>
    </div>
  );
}
