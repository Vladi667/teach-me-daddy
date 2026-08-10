"use client";

import { useState } from "react";
import Ring from "@/components/Ring";
import { LETTERS } from "@/lib/letters";
import {
  MASTERY_TARGET,
  masteredCount,
  statFor,
  useProgress,
} from "@/lib/progress";
import { tap } from "@/lib/feedback";

export default function ProgressPage() {
  const { progress, ready, reset } = useProgress();
  const [confirming, setConfirming] = useState(false);

  const done = ready ? masteredCount(progress) : 0;
  const seen = LETTERS.reduce((n, l) => n + statFor(progress, l.char).seen, 0);
  const wrong = LETTERS.reduce(
    (n, l) => n + statFor(progress, l.char).wrong,
    0,
  );
  const accuracy = seen ? Math.round(((seen - wrong) / seen) * 100) : 0;

  const weakest = [...LETTERS]
    .map((l) => ({ l, s: statFor(progress, l.char) }))
    .filter(({ s }) => s.wrong > 0)
    .sort((a, b) => b.s.wrong - a.s.wrong)
    .slice(0, 5);

  return (
    <>
      <header className="mb-5">
        <h1 className="text-lg font-bold tracking-[-0.03em]">Progress</h1>
        <p className="mt-1 text-sm text-ink-2">Saved on this device.</p>
      </header>

      <section className="panel  mb-3 flex items-center gap-5 rounded-2xl p-5">
        <Ring value={done / LETTERS.length} size={88} stroke={7}>
          <div className="text-center leading-none">
            <div className="text-lg font-bold tracking-[-0.04em]">
              {Math.round((done / LETTERS.length) * 100)}
              <span className="text-sm">%</span>
            </div>
          </div>
        </Ring>
        <div>
          <div className="text-base font-semibold">
            {done} of {LETTERS.length} mastered
          </div>
          <p className="mt-1 text-sm leading-snug text-ink-2">
            A letter counts as mastered after {MASTERY_TARGET} correct answers
            in a row.
          </p>
        </div>
      </section>

      <div className="mb-5 grid grid-cols-2 gap-3">
        <Stat label="Answers given" value={seen} />
        <Stat label="Accuracy" value={seen ? `${accuracy}%` : "—"} />
      </div>

      {weakest.length > 0 && (
        <section className="mb-5">
          <h2 className="mb-2.5 px-1 text-sm font-semibold text-ink-3">
            Costing you the most
          </h2>
          <div className="flex flex-col gap-2">
            {weakest.map(({ l, s }) => (
              <div
                key={l.char}
                className="panel flex items-center gap-3.5 rounded-xl px-4 py-3"
              >
                <span
                  className="heb w-8 text-center text-lg leading-none"
                  style={{ fontFamily: "var(--font-hebrew)" }}
                >
                  {l.char}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold tracking-[0.03em]">
                    {l.name}
                  </div>
                  <div className="mt-0.5 text-xs text-ink-3">
                    {s.wrong} miss{s.wrong === 1 ? "" : "es"} in {s.seen}
                  </div>
                </div>
                <span className="text-xs tnum text-ink-3">
                  {s.streak}/{MASTERY_TARGET}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* per-letter map --------------------------------------------------- */}
      <section className="mb-6">
        <h2 className="mb-2.5 px-1 text-sm font-semibold text-ink-3">
          Every letter
        </h2>
        <div className="panel grid grid-cols-6 gap-2 rounded-2xl p-4">
          {LETTERS.map((l) => {
            const s = statFor(progress, l.char);
            const ratio = Math.min(1, s.streak / MASTERY_TARGET);
            return (
              <div
                key={l.char}
                title={`${l.name} — ${s.streak}/${MASTERY_TARGET}`}
                className="flex flex-col items-center gap-1.5"
              >
                <span
                  className="heb text-lg leading-none"
                  style={{
                    fontFamily: "var(--font-hebrew)",
                    opacity: 0.35 + ratio * 0.65,
                  }}
                >
                  {l.char}
                </span>
                <span
                  className="h-1 w-full rounded-full"
                  style={{
                    background:
                      ratio >= 1
                        ? "var(--color-good)"
                        : ratio > 0
                          ? "color-mix(in oklch, var(--color-warn) 65%, transparent)"
                          : "var(--color-surface-2)",
                    boxShadow:
                      ratio >= 1
                        ? "0 0 6px color-mix(in oklch, var(--color-good) 60%, transparent)"
                        : undefined,
                  }}
                />
              </div>
            );
          })}
        </div>
      </section>

      {confirming ? (
        <div className="panel anim-fade rounded-xl p-4 text-center">
          <p className="text-sm text-ink-2">
            Erase all progress on this device?
          </p>
          <div className="mt-3 flex gap-2.5">
            <button
              onClick={() => {
                tap();
                setConfirming(false);
              }}
              className="tap flex-1 rounded-full bg-surface-2 py-2.5 text-sm font-semibold"
            >
              Keep it
            </button>
            <button
              onClick={() => {
                tap();
                reset();
                setConfirming(false);
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
            setConfirming(true);
          }}
          className="tap w-full rounded-full py-3 text-sm font-medium text-ink-3"
        >
          Reset progress
        </button>
      )}
    </>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="panel rounded-xl px-4 py-4">
      <div className="text-lg font-bold tracking-[-0.03em] tnum">{value}</div>
      <div className="mt-0.5 text-xs text-ink-3">{label}</div>
    </div>
  );
}
