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
      <header className="anim-rise mb-5">
        <h1 className="text-[27px] font-bold tracking-[-0.03em]">Progress</h1>
        <p className="mt-1 text-[13px] text-(--color-ink-dim)">
          Saved on this device.
        </p>
      </header>

      <section
        className="glass anim-rise mb-3 flex items-center gap-5 rounded-[28px] p-5"
        style={{ animationDelay: "50ms" }}
      >
        <Ring value={done / LETTERS.length} size={88} stroke={7}>
          <div className="text-center leading-none">
            <div className="text-[20px] font-bold tracking-[-0.04em]">
              {Math.round((done / LETTERS.length) * 100)}
              <span className="text-[12px]">%</span>
            </div>
          </div>
        </Ring>
        <div>
          <div className="text-[15px] font-semibold">
            {done} of {LETTERS.length} mastered
          </div>
          <p className="mt-1 text-[12.5px] leading-snug text-(--color-ink-dim)">
            A letter counts as mastered after {MASTERY_TARGET} correct answers
            in a row.
          </p>
        </div>
      </section>

      <div
        className="anim-rise mb-5 grid grid-cols-2 gap-3"
        style={{ animationDelay: "100ms" }}
      >
        <Stat label="Answers given" value={seen} />
        <Stat label="Accuracy" value={seen ? `${accuracy}%` : "—"} />
      </div>

      {weakest.length > 0 && (
        <section className="anim-rise mb-5" style={{ animationDelay: "140ms" }}>
          <h2 className="mb-2.5 px-1 text-[13px] font-semibold text-(--color-ink-faint)">
            Costing you the most
          </h2>
          <div className="flex flex-col gap-2">
            {weakest.map(({ l, s }) => (
              <div
                key={l.char}
                className="glass flex items-center gap-3.5 rounded-[20px] px-4 py-3"
              >
                <span
                  className="heb w-8 text-center text-[26px] leading-none"
                  style={{ fontFamily: "var(--font-hebrew)" }}
                >
                  {l.char}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[13.5px] font-semibold tracking-[0.03em]">
                    {l.name}
                  </div>
                  <div className="mt-0.5 text-[11.5px] text-(--color-ink-faint)">
                    {s.wrong} miss{s.wrong === 1 ? "" : "es"} in {s.seen}
                  </div>
                </div>
                <span className="text-[11px] tabular-nums text-(--color-ink-faint)">
                  {s.streak}/{MASTERY_TARGET}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* per-letter map --------------------------------------------------- */}
      <section className="anim-rise mb-6" style={{ animationDelay: "180ms" }}>
        <h2 className="mb-2.5 px-1 text-[13px] font-semibold text-(--color-ink-faint)">
          Every letter
        </h2>
        <div className="glass grid grid-cols-6 gap-2 rounded-[24px] p-4">
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
                  className="heb text-[19px] leading-none"
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
                        ? "var(--color-mint)"
                        : ratio > 0
                          ? "rgba(255,183,77,0.65)"
                          : "rgba(255,255,255,0.10)",
                    boxShadow:
                      ratio >= 1 ? "0 0 6px rgba(74,222,156,0.6)" : undefined,
                  }}
                />
              </div>
            );
          })}
        </div>
      </section>

      {confirming ? (
        <div className="glass anim-fade rounded-[22px] p-4 text-center">
          <p className="text-[13px] text-(--color-ink-dim)">
            Erase all progress on this device?
          </p>
          <div className="mt-3 flex gap-2.5">
            <button
              onClick={() => {
                tap();
                setConfirming(false);
              }}
              className="press flex-1 rounded-full bg-white/8 py-2.5 text-[13px] font-semibold"
            >
              Keep it
            </button>
            <button
              onClick={() => {
                tap();
                reset();
                setConfirming(false);
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
            setConfirming(true);
          }}
          className="press w-full rounded-full py-3 text-[12.5px] font-medium text-(--color-ink-faint)"
        >
          Reset progress
        </button>
      )}
    </>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="glass rounded-[22px] px-4 py-4">
      <div className="text-[24px] font-bold tracking-[-0.03em] tabular-nums">
        {value}
      </div>
      <div className="mt-0.5 text-[11.5px] text-(--color-ink-faint)">
        {label}
      </div>
    </div>
  );
}
