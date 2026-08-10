"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Segmented from "@/components/Segmented";
import { type Letter } from "@/lib/letters";
import {
  MASTERY_TARGET,
  isMastered,
  useProgress,
  type ProgressMap,
} from "@/lib/progress";
import {
  MODES,
  ROUND_LENGTH,
  makeQuestion,
  poolFor,
  type Mode,
  type Question,
} from "@/lib/quiz";
import { error, success, tap } from "@/lib/feedback";
import { LINK_PREFETCH } from "@/lib/base-path";

interface Round {
  question: Question;
  index: number;
  score: number;
  missed: Letter[];
  over: boolean;
}

type Verdict = "correct" | "wrong" | null;

function build(mode: Mode, progress: ProgressMap): Round {
  return {
    question: makeQuestion(mode, progress),
    index: 1,
    score: 0,
    missed: [],
    over: false,
  };
}

export default function PracticePage() {
  const { progress, ready, record } = useProgress();
  const [mode, setMode] = useState<Mode>("print");
  const [round, setRound] = useState<Round | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [verdict, setVerdict] = useState<Verdict>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const begin = useCallback((m: Mode, p: ProgressMap) => {
    if (timer.current) clearTimeout(timer.current);
    setPicked(null);
    setVerdict(null);
    setRound(build(m, p));
  }, []);

  // The first round can only be seeded once the client has taken over from
  // the prerendered markup — makeQuestion uses Math.random.
  useEffect(() => {
    if (!ready) return;
    // One-shot seed on hydration — the extra render it costs happens once.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRound((prev) => prev ?? build(mode, progress));
    // `mode`/`progress` are starting values only; re-running on either would
    // rebuild the round underneath the player mid-answer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  // Switching mode is a user action, so it restarts the round directly.
  const changeMode = (m: Mode) => {
    setMode(m);
    begin(m, progress);
  };

  const answer = (opt: Letter) => {
    if (!round || verdict || round.over) return;

    const target = round.question.target;
    const right = opt.char === target.char;

    setPicked(opt.char);
    setVerdict(right ? "correct" : "wrong");
    record(target.char, right);
    if (right) success();
    else error();

    timer.current = setTimeout(
      () => {
        setRound((prev) => {
          if (!prev) return prev;
          const score = prev.score + (right ? 1 : 0);
          const missed = right ? prev.missed : [...prev.missed, target];
          if (prev.index >= ROUND_LENGTH) {
            return { ...prev, score, missed, over: true };
          }
          return {
            question: makeQuestion(mode, progress),
            index: prev.index + 1,
            score,
            missed,
            over: false,
          };
        });
        setPicked(null);
        setVerdict(null);
      },
      right ? 480 : 1250,
    );
  };

  const pool = poolFor(mode);
  const mastered = ready
    ? pool.filter((l) => isMastered(progress, l.char)).length
    : 0;

  return (
    <>
      <header className="mb-4 flex items-baseline justify-between">
        <h1 className="text-lg font-bold tracking-[-0.03em]">Drill</h1>
        <span className="text-sm text-ink-3">
          {mastered}/{pool.length} locked in
        </span>
      </header>

      <div className="mb-3">
        <Segmented options={MODES} value={mode} onChange={changeMode} />
      </div>

      <p className="mb-4 px-1 text-xs text-ink-3">
        {mode === "print" && "Name the printed letter."}
        {mode === "cursive" && "Name the handwritten letter."}
        {mode === "traps" && "Only the letters people actually mix up."}
      </p>

      {/* mastery bar ----------------------------------------------------- */}
      <div className="mb-4 h-1 overflow-hidden rounded-full bg-surface-2">
        <div
          className="h-full rounded-full"
          style={{
            width: `${(mastered / pool.length) * 100}%`,
            background: "var(--color-accent)",
            transition: "width 200ms var(--ease-out-quart)",
          }}
        />
      </div>

      {!round ? (
        <div className="panel grid h-[320px] place-items-center rounded-2xl text-sm text-ink-3">
          Loading…
        </div>
      ) : round.over ? (
        <Results
          round={round}
          onRestart={() => {
            tap();
            begin(mode, progress);
          }}
        />
      ) : (
        <div className="flex flex-1 flex-col justify-center pb-4">
          <div className="mb-3 flex items-center justify-between px-1 text-sm">
            <span className="text-ink-3">
              {round.index} / {ROUND_LENGTH}
            </span>
            <span className="rounded-full bg-surface-2 px-2.5 py-1 text-xs font-semibold tnum">
              {round.score} correct
            </span>
          </div>

          <div
            className={`panel mb-3 grid min-h-[190px] flex-1 place-items-center rounded-2xl ${
              verdict === "wrong" ? "anim-nudge" : ""
            }`}
            style={{
              maxHeight: 300,
              borderColor:
                verdict === "correct"
                  ? "color-mix(in oklch, var(--color-good) 45%, transparent)"
                  : verdict === "wrong"
                    ? "color-mix(in oklch, var(--color-bad) 45%, transparent)"
                    : undefined,
              transition: "border-color 260ms ease",
            }}
          >
            <span
              key={round.question.target.char + round.index}
              className={`heb anim-card text-[96px] leading-none ${
                mode === "cursive" ? "heb-cursive" : ""
              }`}
              style={
                mode === "cursive"
                  ? undefined
                  : { fontFamily: "var(--font-hebrew)" }
              }
            >
              {round.question.target.char}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {round.question.options.map((opt) => {
              const isTarget = opt.char === round.question.target.char;
              const isPicked = picked === opt.char;

              let bg: string | undefined;
              let brd: string | undefined;
              let fg: string | undefined;

              if (verdict && isTarget) {
                bg = "color-mix(in oklch, var(--color-good) 16%, transparent)";
                brd = "color-mix(in oklch, var(--color-good) 55%, transparent)";
                fg = "var(--color-good)";
              } else if (verdict && isPicked) {
                bg = "color-mix(in oklch, var(--color-bad) 16%, transparent)";
                brd = "color-mix(in oklch, var(--color-bad) 55%, transparent)";
                fg = "var(--color-bad)";
              } else if (verdict) {
                fg = "var(--color-ink-3)";
              }

              return (
                <button
                  key={opt.char}
                  onClick={() => answer(opt)}
                  disabled={!!verdict}
                  className="panel tap flex items-center justify-center gap-1.5 rounded-xl py-4 text-base font-semibold tracking-[0.03em]"
                  style={{
                    background: bg,
                    borderColor: brd,
                    color: fg,
                    opacity: verdict && !isTarget && !isPicked ? 0.4 : 1,
                  }}
                >
                  {opt.name}
                  {verdict && isTarget && <Tick />}
                  {verdict && isPicked && !isTarget && <Cross />}
                </button>
              );
            })}
          </div>

          {verdict === "wrong" && (
            <p className="anim-fade mt-3.5 px-1 text-center text-sm leading-relaxed text-ink-2">
              {round.question.target.hint}
            </p>
          )}
        </div>
      )}
    </>
  );
}

function Results({
  round,
  onRestart,
}: {
  round: Round;
  onRestart: () => void;
}) {
  const pct = Math.round((round.score / ROUND_LENGTH) * 100);
  const unique = [...new Map(round.missed.map((l) => [l.char, l])).values()];
  const clean = unique.length === 0;

  return (
    <div className="panel  rounded-2xl p-6 text-center">
      <div
        className="mx-auto grid size-14 place-items-center rounded-full"
        style={{
          background: clean
            ? "color-mix(in oklch, var(--color-good) 15%, transparent)"
            : "color-mix(in oklch, var(--color-accent) 18%, transparent)",
        }}
      >
        <span className="text-lg">{clean ? "🏆" : "✦"}</span>
      </div>

      <div className="mt-4 text-2xl leading-none font-bold tracking-[-0.04em] tnum">
        {round.score}
        <span className="text-lg text-ink-3">/{ROUND_LENGTH}</span>
      </div>
      <p className="mt-1.5 text-sm text-ink-2">
        {pct}% correct
        {clean && " · flawless round"}
      </p>

      {!clean && (
        <div className="mt-5 rounded-xl bg-surface p-4 text-left">
          <div className="text-xs font-semibold tracking-[0.08em] text-ink-3 uppercase">
            Revisit these
          </div>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {unique.map((l) => (
              <span
                key={l.char}
                className="flex items-center gap-1.5 rounded-full bg-surface-2 py-1 pr-3 pl-2"
              >
                <span
                  className="heb text-md leading-none"
                  style={{ fontFamily: "var(--font-hebrew)" }}
                >
                  {l.char}
                </span>
                <span className="text-xs font-semibold tracking-[0.04em] text-ink-2">
                  {l.name}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      <button onClick={onRestart} className="btn btn-primary mt-5 w-full">
        Another round
      </button>

      <Link
        href="/alphabet"
        prefetch={LINK_PREFETCH}
        onClick={tap}
        className="tap mt-2.5 block w-full rounded-full py-3 text-sm font-medium text-ink-2"
      >
        Back to the letters
      </Link>

      <p className="mt-4 text-xs text-ink-3">
        {MASTERY_TARGET} correct in a row locks a letter in.
      </p>
    </div>
  );
}

function Tick() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m5 13 4.5 4.5L19 7" />
    </svg>
  );
}

function Cross() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}
