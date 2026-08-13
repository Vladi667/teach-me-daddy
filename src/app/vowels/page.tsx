"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { POINTS, optionsFor, type Point } from "@/lib/vowels";
import { MASTERY_TARGET, isBanked, statFor, useProgress } from "@/lib/progress";
import { LINK_PREFETCH } from "@/lib/base-path";
import { nowMs } from "@/lib/clock";
import { error as buzz, success, tap } from "@/lib/feedback";

const ROUND = 16;

function shuffle<T>(a: readonly T[]): T[] {
  const out = [...a];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * The points drill.
 *
 * Asks for the sound, never the name. Knowing that ָ is called qamats does
 * not help you read a bus timetable; knowing it says "a" does. The whole set
 * is nineteen items and most trainees clear it in two sittings — it is a
 * prerequisite, not a subject.
 */
export default function VowelsPage() {
  const { progress, ready, record } = useProgress();
  const [q, setQ] = useState<Point | null>(null);
  const [opts, setOpts] = useState<string[]>([]);
  const [picked, setPicked] = useState<string | null>(null);
  const [n, setN] = useState(0);
  const [right, setRight] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shownAt = useRef<number>(0);
  /**
   * The next question is drawn inside a setTimeout, which closes over the
   * progress captured *before* the answer was recorded. Without this, an item
   * just banked would still be in the draw for one more question.
   */
  const live = useRef(progress);
  useEffect(() => {
    live.current = progress;
  }, [progress]);

  const mastered = POINTS.filter((p) => isBanked(progress, p.id)).length;

  /** Weakest first; banked points leave the draw until everything is banked. */
  function next() {
    const p0 = live.current;
    const active = POINTS.filter((p) => !isBanked(p0, p.id));
    const pool = active.length ? active : POINTS;
    const weights = pool.map((p) =>
      Math.max(1, MASTERY_TARGET + 2 - statFor(p0, p.id).streak),
    );
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    let pick = pool[pool.length - 1];
    for (let i = 0; i < pool.length; i++) {
      r -= weights[i];
      if (r <= 0) {
        pick = pool[i];
        break;
      }
    }
    setQ(pick);
    setOpts(shuffle(optionsFor(pick)));
    setPicked(null);
    shownAt.current = nowMs();
  }

  useEffect(() => {
    if (!ready || q) return;
    next();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  useEffect(() => () => clearTimeout(timer.current ?? undefined), []);

  function answer(choice: string) {
    if (!q || picked) return;
    const correct = choice === q.sound;
    setPicked(choice);
    if (correct) success();
    else buzz();
    record(q.id, correct, nowMs() - shownAt.current);
    setN((v) => v + 1);
    if (correct) setRight((v) => v + 1);
    // Long enough to read the note on a miss, brief on a hit.
    timer.current = setTimeout(() => next(), correct ? 700 : 1900);
  }

  if (!ready || !q) {
    return <p className="py-10 text-center text-sm text-ink-3">Loading…</p>;
  }

  if (n >= ROUND) {
    return (
      <div className="py-6">
        <p className="eyebrow">The points</p>
        <h1 className="mt-1 text-lg leading-tight font-semibold">
          {right} of {n}
        </h1>
        <p className="mt-3 text-base leading-snug text-ink-2">
          {mastered} of {POINTS.length} points locked in. Three correct in a
          row locks one.
        </p>
        <button
          onClick={() => {
            tap();
            setN(0);
            setRight(0);
            next();
          }}
          className="btn btn-primary mt-6 w-full"
        >
          Again
        </button>
        <Link
          href="/alphabet"
          prefetch={LINK_PREFETCH}
          onClick={tap}
          className="btn btn-quiet mt-2 w-full text-sm"
        >
          Back to the letters
        </Link>
      </div>
    );
  }

  return (
    <div>
      <header className="mb-5 flex items-baseline justify-between">
        <div>
          <p className="eyebrow">The points</p>
          <h1 className="mt-1 text-lg leading-tight font-semibold">
            What does it say?
          </h1>
        </div>
        <span className="text-sm text-ink-3 tnum">
          {mastered}/{POINTS.length} locked
        </span>
      </header>

      <div className="panel grid place-items-center rounded-2xl px-5 py-10">
        <p
          className="heb leading-none"
          style={{ fontFamily: "var(--font-hebrew)", fontSize: 84 }}
        >
          {q.show}
        </p>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2.5">
        {opts.map((o) => {
          const isAnswer = o === q.sound;
          const isPicked = o === picked;
          let bg: string | undefined;
          let brd: string | undefined;
          let fg: string | undefined;
          if (picked && isAnswer) {
            bg = "color-mix(in oklch, var(--color-good) 16%, transparent)";
            brd = "color-mix(in oklch, var(--color-good) 55%, transparent)";
            fg = "var(--color-good)";
          } else if (picked && isPicked) {
            bg = "color-mix(in oklch, var(--color-bad) 16%, transparent)";
            brd = "color-mix(in oklch, var(--color-bad) 55%, transparent)";
            fg = "var(--color-bad)";
          } else if (picked) {
            fg = "var(--color-ink-3)";
          }
          return (
            <button
              key={o}
              onClick={() => answer(o)}
              className="panel tap rounded-xl py-4 text-md font-semibold"
              style={{ background: bg, borderColor: brd, color: fg }}
            >
              {o}
            </button>
          );
        })}
      </div>

      {/* The name and the reason, only once the answer is in — reading it
          beforehand would answer the question. */}
      <p className="mt-4 min-h-10 text-center text-sm leading-snug text-ink-3">
        {picked ? `${q.name} · ${q.note}` : ""}
      </p>
    </div>
  );
}
