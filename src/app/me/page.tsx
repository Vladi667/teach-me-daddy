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
  exportData,
  importData,
  push,
  resetCurrent,
  logOut,
  update,
  useStore,
} from "@/lib/store";
import { tap } from "@/lib/feedback";

export default function MePage() {
  const { username, data, sync, ready } = useStore();
  const { cards: CARDS } = useDeck();
  const [note, setNote] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const mastered = ready ? masteredCount(data.alphabet) : 0;
  const seen = Object.values(data.srs).length;
  const mature = Object.values(data.srs).filter(isMature).length;
  const inReview = Object.values(data.srs).filter(isReview).length;
  const hours = Math.round(totalMinutes(data.plan) / 60);
  const run = ready ? streak(data.plan) : 0;

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
      {(
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
                // Back to the gate; the local copy is kept for offline safety.
                logOut();
              }}
              className="press flex-1 rounded-full bg-white/8 py-3 text-[13px] font-semibold"
            >
              Log out
            </button>
          </div>
        </section>
      )}

      {err && (
        <p
          className="anim-fade mb-4 rounded-[14px] px-3.5 py-2.5 text-[12px]"
          style={{ background: "rgba(255,107,122,0.12)", color: "var(--color-coral)" }}
        >
          {err}
        </p>
      )}

      {note && (
        <p
          className="anim-fade mb-4 rounded-[14px] px-3.5 py-2.5 text-[12px]"
          style={{ background: "rgba(74,222,156,0.12)", color: "var(--color-mint)" }}
        >
          {note}
        </p>
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
  switch (s) {
    case "synced":
      return "Synced";
    case "syncing":
      return "Syncing…";
    case "offline":
      return "Offline — saved here, will sync later";
    case "error":
      return "Sync failed — your progress is still safe on this device";
    case "idle":
      // Loaded from this device's copy; nothing has been sent yet this session.
      return "Changes sync automatically";
    default:
      // No server on this deployment — the GitHub Pages copy.
      return "Saved on this device";
  }
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
