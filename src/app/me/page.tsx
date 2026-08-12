"use client";

import { useState } from "react";
import Link from "next/link";
import { LETTERS } from "@/lib/letters";
import { LINES } from "@/lib/lines";
import { isMature, isReview } from "@/lib/srs";
import { MASTERY_TARGET, masteredCount } from "@/lib/progress";
import { shiftDay, streak, totalMinutes } from "@/lib/plan";
import { cardId } from "@/lib/programme";
import { LINK_PREFETCH } from "@/lib/base-path";
import { LIBRARY } from "@/lib/reading";
import { useToday } from "@/lib/clock";
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
  const [note, setNote] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const today = useToday();
  const loggedDays = Object.keys(data.plan.days).length;

  const mastered = ready ? masteredCount(data.alphabet) : 0;
  // Counted over the programme's own cards. The legacy deck left its keys in
  // srs and they used to be counted here, which quietly inflated every figure.
  const lineCards = LINES.flatMap((l) =>
    (["listen", "read", "produce"] as const).map((st) => data.srs[cardId(l.id, st)]),
  ).filter(Boolean);
  const seen = lineCards.length;
  const mature = lineCards.filter((c) => isMature(c!)).length;
  const inReview = lineCards.filter((c) => isReview(c!)).length;
  const hours = Math.round(totalMinutes(data.plan) / 60);
  const run = ready ? streak(data.plan) : 0;

  return (
    <>
      <header className="mb-4">
        <h1 className="text-lg leading-tight font-semibold">
          {username}
        </h1>
        <p className="mt-1 flex items-center gap-2 text-sm text-ink-2">
          <SyncDot state={sync} />
          {label(sync)}
        </p>
      </header>

      {/* identity --------------------------------------------------------- */}
      {
        <section className="mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => {
                tap();
                void push();
              }}
              disabled={!SYNC_ENABLED}
              className="btn btn-secondary flex-1 text-sm"
            >
              Sync now
            </button>
            <button
              onClick={() => {
                tap();
                // Back to the gate; the local copy is kept for offline safety.
                logOut();
              }}
              className="btn btn-secondary flex-1 text-sm"
            >
              Log out
            </button>
          </div>
        </section>
      }

      {err && (
        <p
          className="anim-fade mb-4 rounded-lg px-3.5 py-2.5 text-sm"
          style={{
            background:
              "color-mix(in oklch, var(--color-bad) 12%, transparent)",
            color: "var(--color-bad)",
          }}
        >
          {err}
        </p>
      )}

      {note && (
        <p
          className="anim-fade mb-4 rounded-lg px-3.5 py-2.5 text-sm"
          style={{
            background:
              "color-mix(in oklch, var(--color-good) 12%, transparent)",
            color: "var(--color-good)",
          }}
        >
          {note}
        </p>
      )}

      {/* Facts, so a list rather than four boxes. */}
      <section className="mb-5">
        <h2 className="eyebrow mb-1">Progress</h2>
        <dl className="flex flex-col">
          <Fact k="Letters mastered" v={`${mastered} of ${LETTERS.length}`} />
          <Fact k="Mature cards" v={String(mature)} />
          <Fact k="Cards in review" v={String(inReview)} />
          <Fact k="Logged study time" v={`${hours}h`} last />
        </dl>
      </section>

      <p className="mb-4 px-1 text-xs leading-relaxed text-ink-3">
        A letter counts as mastered after {MASTERY_TARGET} correct in a row. A
        card is mature once its interval passes 21 days — that&apos;s the §8
        metric. {seen} line cards have been started; {run}-day streak.
      </p>

      {/* settings ---------------------------------------------------------- */}
      <section className="mb-4">
        <h2 className="eyebrow mb-2">Settings</h2>

        <div className="panel mb-2 flex items-center justify-between rounded-xl px-4 py-3">
          <span className="text-sm text-ink-2">Show meanings in</span>
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
                className="tap rounded-full px-3.5 py-1.5 text-sm font-semibold"
                style={{
                  background:
                    data.settings.gloss === g
                      ? "var(--color-surface-2)"
                      : "var(--color-surface)",
                  color:
                    data.settings.gloss === g
                      ? "var(--color-ink)"
                      : "var(--color-ink-3)",
                }}
              >
                {g === "fr" ? "Français" : "English"}
              </button>
            ))}
          </div>
        </div>

        {/* §5 — the start date fixes the deployment date and every interval
            after it, so it is settable until a day has actually been worked.
            After that, moving it would rewrite history rather than plan it. */}
        <div className="panel mb-2 flex items-center justify-between gap-3 rounded-xl px-4 py-3">
          <span className="min-w-0">
            <span className="block text-sm text-ink-2">Day 1</span>
            <span className="block text-xs text-ink-3">
              {loggedDays === 0
                ? data.plan.startedOn
                  ? `Starts ${data.plan.startedOn}`
                  : "Not set yet"
                : `${data.plan.startedOn} · fixed, ${loggedDays} ${loggedDays === 1 ? "day" : "days"} logged`}
            </span>
          </span>
          {loggedDays === 0 && today && (
            <div className="flex shrink-0 gap-1.5">
              {([["Today", today], ["Tomorrow", shiftDay(today, 1)]] as const).map(
                ([label, date]) => (
                  <button
                    key={label}
                    onClick={() => {
                      tap();
                      update((d) => ({
                        ...d,
                        plan: { ...d.plan, startedOn: date },
                      }));
                      setNote(`Day 1 is ${date}.`);
                    }}
                    aria-pressed={data.plan.startedOn === date}
                    className="tap rounded-full px-3 py-1.5 text-sm font-semibold"
                    style={{
                      background:
                        data.plan.startedOn === date
                          ? "var(--color-surface-2)"
                          : "var(--color-surface)",
                      color:
                        data.plan.startedOn === date
                          ? "var(--color-ink)"
                          : "var(--color-ink-3)",
                    }}
                  >
                    {label}
                  </button>
                ),
              )}
            </div>
          )}
        </div>

        <div className="panel mb-2 flex items-center justify-between gap-3 rounded-xl px-4 py-3">
          <span className="min-w-0">
            <span className="block text-sm text-ink-2">Phonetics under lines</span>
            <span className="block text-xs text-ink-3">
              A crutch worth dropping — §9.5 wants you on unpointed text early
            </span>
          </span>
          <div className="flex shrink-0 gap-1.5">
            {([true, false] as const).map((on) => (
              <button
                key={String(on)}
                onClick={() => {
                  tap();
                  update((d) => ({
                    ...d,
                    settings: { ...d.settings, phonetics: on },
                  }));
                }}
                aria-pressed={data.settings.phonetics === on}
                className="tap rounded-full px-3.5 py-1.5 text-sm font-semibold"
                style={{
                  background:
                    data.settings.phonetics === on
                      ? "var(--color-surface-2)"
                      : "var(--color-surface)",
                  color:
                    data.settings.phonetics === on
                      ? "var(--color-ink)"
                      : "var(--color-ink-3)",
                }}
              >
                {on ? "Show" : "Hide"}
              </button>
            ))}
          </div>
        </div>

        {/* §9 — the daily intake is not the trainee's to set. It comes from
            the backlog, the retention guard and the assessment penalty, and
            TODAY says which of those is in force. */}
      </section>

      {/* §9/§12 — neither of these is issued by the programme, so neither is
          a peer of TODAY. They are tools you may reach for, filed as such. */}
      <section className="mb-4">
        <h2 className="eyebrow mb-2">Tools</h2>
        <div className="flex flex-col">
          <ToolLink
            href="/notes"
            label="Field notes"
            note={`${(data.custom ?? []).length} noted`}
            hint="Words from your tutor. Never enters the assignment."
          />
          <ToolLink
            href="/read"
            label="Reading"
            note={`${Object.values(data.reading ?? {}).filter((r) => r.understood).length} of ${LIBRARY.length}`}
            hint="Passages on a clock. Separate from the daily lines."
          />
          <ToolLink
            href="/alphabet"
            label="Letters"
            note={`${mastered} of ${LETTERS.length}`}
            hint="The alphabet drill. A prerequisite, not part of the 140 days."
            last
          />
        </div>
      </section>

      {/* data ------------------------------------------------------------- */}
      <section className="mb-4">
        <h2 className="eyebrow mb-2">Your data</h2>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => {
              tap();
              const blob = new Blob([exportData()], {
                type: "application/json",
              });
              const a = document.createElement("a");
              a.href = URL.createObjectURL(blob);
              a.download = `teach-me-daddy-${username === GUEST ? "device" : username}.json`;
              a.click();
              URL.revokeObjectURL(a.href);
            }}
            className="btn btn-secondary w-full justify-start text-sm"
          >
            Export a backup
          </button>

          <label className="btn btn-secondary w-full cursor-pointer justify-start text-sm">
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
            <div className="panel rounded-xl p-4 text-center">
              <p className="text-sm text-ink-2">
                Erase all progress for <strong>{username}</strong>?
              </p>
              <div className="mt-3 flex gap-2.5">
                <button
                  onClick={() => {
                    tap();
                    setConfirmReset(false);
                  }}
                  className="tap flex-1 rounded-full bg-surface-2 py-2.5 text-sm font-semibold"
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
                  className="tap flex-1 rounded-full py-2.5 text-sm font-semibold"
                  style={{
                    background:
                      "color-mix(in oklch, var(--color-bad) 18%, transparent)",
                    color: "var(--color-bad)",
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
              className="tap rounded-xl px-4 py-3 text-left text-sm font-medium text-ink-3"
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
      ? "var(--color-good)"
      : state === "syncing"
        ? "var(--color-accent)"
        : state === "error"
          ? "var(--color-bad)"
          : "var(--color-ink-3)";
  return (
    <span
      className="inline-block size-2 shrink-0 rounded-full"
      style={{ background: tint, boxShadow: `0 0 8px ${tint}` }}
    />
  );
}

function Fact({ k, v, last }: { k: string; v: string; last?: boolean }) {
  return (
    <div
      className="flex items-baseline justify-between py-2.5"
      style={{ borderBottom: last ? "none" : "1px solid var(--color-line)" }}
    >
      <dt className="text-base text-ink-2">{k}</dt>
      <dd className="text-base font-semibold tnum">{v}</dd>
    </div>
  );
}

function ToolLink({
  href,
  label,
  note,
  hint,
  last,
}: {
  href: string;
  label: string;
  note: string;
  hint: string;
  last?: boolean;
}) {
  return (
    <Link
      href={href}
      prefetch={LINK_PREFETCH}
      onClick={tap}
      className="tap flex items-center gap-3 py-3"
      style={{ borderBottom: last ? "none" : "1px solid var(--color-line)" }}
    >
      <span className="min-w-0 flex-1">
        <span className="block text-base">{label}</span>
        <span className="block truncate text-sm text-ink-3">{hint}</span>
      </span>
      <span className="shrink-0 text-sm text-ink-3 tnum">{note}</span>
    </Link>
  );
}
