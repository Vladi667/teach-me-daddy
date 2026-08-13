"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  STAGES,
  breakdown,
  nextQuestion,
  type Item,
  type Stage,
} from "@/lib/blend";
import { FAST_MS, MASTERY_TARGET, isBanked, statFor, useProgress } from "@/lib/progress";
import { LINK_PREFETCH } from "@/lib/base-path";
import { nowMs } from "@/lib/clock";
import { error as buzz, success, tap } from "@/lib/feedback";

const ROUND = 12;

/**
 * The reading lessons.
 *
 * The teaching is the point, so each stage opens with the one rule it adds and
 * a miss shows the word broken into its syllables. A drill that only says
 * "wrong" teaches nothing you did not already know.
 */
export default function LessonsPage() {
  const { progress, ready, record } = useProgress();
  const [stage, setStage] = useState<Stage | null>(null);
  const [taught, setTaught] = useState(false);
  const [q, setQ] = useState<Item | null>(null);
  const [opts, setOpts] = useState<string[]>([]);
  const [picked, setPicked] = useState<string | null>(null);
  const [n, setN] = useState(0);
  const [right, setRight] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shownAt = useRef(0);
  /**
   * The next question is drawn inside a setTimeout, which closes over the
   * progress captured *before* the answer was recorded. Without this, an item
   * just banked would still be in the draw for one more question.
   */
  const live = useRef(progress);
  useEffect(() => {
    live.current = progress;
  }, [progress]);

  useEffect(() => () => clearTimeout(timer.current ?? undefined), []);

  const cleared = (s: Stage) =>
    s.items.filter((i) => isBanked(progress, i.id)).length;
  /** A stage opens when the one below is mostly in hand — 80%, not all of it. */
  const open = (s: Stage) => {
    const prev = STAGES.find((x) => x.n === s.n - 1);
    if (!prev) return true;
    return cleared(prev) >= Math.ceil(prev.items.length * 0.8);
  };

  function ask(s: Stage) {
    const p0 = live.current;
    const { item, options } = nextQuestion(
      s,
      (id) => statFor(p0, id).streak,
      MASTERY_TARGET,
      (id) => isBanked(p0, id),
    );
    setQ(item);
    setOpts(options);
    setPicked(null);
    shownAt.current = nowMs();
  }

  function answer(choice: string) {
    if (!q || !stage || picked) return;
    const correct = choice === q.answer;
    setPicked(choice);
    if (correct) success();
    else buzz();
    record(q.id, correct, nowMs() - shownAt.current);
    setN((v) => v + 1);
    if (correct) setRight((v) => v + 1);
    // A miss holds long enough to read the breakdown; a hit moves on.
    timer.current = setTimeout(() => ask(stage), correct ? 750 : 2600);
  }

  if (!ready) {
    return <p className="py-10 text-center text-sm text-ink-3">Loading…</p>;
  }

  /* --- pick a stage ------------------------------------------------------- */

  if (!stage) {
    return (
      <>
        <header className="mb-5">
          <p className="eyebrow">Reading lessons</p>
          <h1 className="mt-1 text-lg leading-tight font-semibold">
            Letters into words
          </h1>
          <p className="mt-3 text-base leading-snug text-ink-2">
            Knowing the glyphs is not reading. Five stages, each adding one
            rule, from a single syllable to a phrase.
          </p>
        </header>

        <ul className="flex flex-col">
          {STAGES.map((s, i) => {
            const can = open(s);
            const doneN = cleared(s);
            return (
              <li
                key={s.n}
                style={{
                  borderBottom:
                    i === STAGES.length - 1
                      ? "none"
                      : "1px solid var(--color-line)",
                }}
              >
                <button
                  disabled={!can}
                  onClick={() => {
                    tap();
                    setStage(s);
                    setTaught(false);
                    setN(0);
                    setRight(0);
                    ask(s);
                  }}
                  className="tap flex w-full items-center gap-3 py-3.5 text-left"
                  style={{ opacity: can ? 1 : 0.45 }}
                >
                  <span
                    className="grid size-[26px] shrink-0 place-items-center rounded-md text-xs font-semibold tnum"
                    style={{
                      background:
                        doneN >= s.items.length
                          ? "var(--color-accent)"
                          : "transparent",
                      border:
                        doneN >= s.items.length
                          ? "none"
                          : "1.5px solid var(--color-line-strong)",
                      color:
                        doneN >= s.items.length
                          ? "var(--color-accent-ink)"
                          : "var(--color-ink-3)",
                    }}
                  >
                    {s.n}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-base">{s.title}</span>
                    <span className="block truncate text-sm text-ink-3">
                      {can
                        ? `${doneN} of ${s.items.length} locked in`
                        : "Finish the stage above first"}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <Link
          href="/me"
          prefetch={LINK_PREFETCH}
          onClick={tap}
          className="btn btn-quiet mt-6 w-full text-sm"
        >
          Done for now
        </Link>
      </>
    );
  }

  /* --- the rule this stage adds ------------------------------------------- */

  if (!taught) {
    return (
      <div className="py-2">
        <p className="eyebrow">Stage {stage.n} of {STAGES.length}</p>
        <h1 className="mt-1 text-lg leading-tight font-semibold">
          {stage.title}
        </h1>
        <p className="mt-5 text-base leading-relaxed text-ink-2">
          {stage.teach}
        </p>

        {/* Worked example, broken into the parts the rule is about. */}
        <div className="panel mt-6 rounded-2xl px-5 py-6 text-center">
            <div className="flex items-baseline justify-center gap-2">
              {breakdown(stage.example).map((b, i, arr) => (
                <span key={i} className="flex items-baseline gap-2">
                  <span
                    className="heb text-[34px] leading-none"
                    style={{ fontFamily: "var(--font-hebrew)" }}
                  >
                    {b.part}
                  </span>
                  {i < arr.length - 1 && (
                    <span className="text-lg text-ink-3">·</span>
                  )}
                </span>
              ))}
            </div>
          <p className="mt-3 text-sm text-ink-3 italic">
            {breakdown(stage.example).map((b) => b.sound).join(" · ")}
          </p>
        </div>

        <button
          onClick={() => {
            tap();
            setTaught(true);
          }}
          className="btn btn-primary mt-7 w-full"
        >
          Start
        </button>
        <button
          onClick={() => {
            tap();
            setStage(null);
          }}
          className="btn btn-quiet mt-2 w-full text-sm"
        >
          Back
        </button>
      </div>
    );
  }

  /* --- the round ---------------------------------------------------------- */

  if (n >= ROUND) {
    return (
      <div className="py-6">
        <p className="eyebrow">Stage {stage.n}</p>
        <h1 className="mt-1 text-lg leading-tight font-semibold">
          {right} of {n}
        </h1>
        <p className="mt-3 text-base leading-snug text-ink-2">
          {cleared(stage)} of {stage.items.length} locked in. Three correct in
          a row, each under {FAST_MS / 1000} seconds, locks one.
        </p>
        <button
          onClick={() => {
            tap();
            setN(0);
            setRight(0);
            ask(stage);
          }}
          className="btn btn-primary mt-6 w-full"
        >
          Again
        </button>
        <button
          onClick={() => {
            tap();
            setStage(null);
          }}
          className="btn btn-quiet mt-2 w-full text-sm"
        >
          Choose a stage
        </button>
      </div>
    );
  }

  const missed = picked !== null && picked !== q?.answer;

  return (
    <div>
      <header className="mb-5 flex items-baseline justify-between">
        <div>
          <p className="eyebrow">Stage {stage.n} · {stage.title}</p>
          <h1 className="mt-1 text-lg leading-tight font-semibold">
            How does it read?
          </h1>
        </div>
        <span className="text-sm text-ink-3 tnum">
          {n}/{ROUND}
        </span>
      </header>

      <div className="panel grid place-items-center rounded-2xl px-5 py-9">
        <p
          className="heb text-center leading-tight"
          style={{
            fontFamily: "var(--font-hebrew)",
            fontSize: q && q.show.length > 12 ? 34 : 56,
          }}
        >
          {q?.show}
        </p>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2.5">
        {opts.map((o) => {
          const isAnswer = o === q?.answer;
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

      {/* The teaching payload: a miss shows where the word comes apart. */}
      <div className="mt-4 min-h-14 text-center">
        {missed && q && (
          <>
            <div className="flex items-baseline justify-center gap-2">
              {breakdown(q.show).map((b, i) => (
                <span
                  key={i}
                  className="heb text-[26px] leading-none"
                  style={{ fontFamily: "var(--font-hebrew)" }}
                >
                  {b.part}
                </span>
              ))}
            </div>
            <p className="mt-1.5 text-sm text-ink-3 italic">
              {breakdown(q.show).map((b) => b.sound).join(" · ")}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
