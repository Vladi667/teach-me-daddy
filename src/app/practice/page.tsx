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
      <header className="anim-rise mb-4 flex items-baseline justify-between">
        <h1 className="text-[27px] font-bold tracking-[-0.03em]">Drill</h1>
        <span className="text-[12px] text-(--color-ink-faint)">
          {mastered}/{pool.length} locked in
        </span>
      </header>

      <div className="anim-rise mb-3" style={{ animationDelay: "50ms" }}>
        <Segmented options={MODES} value={mode} onChange={changeMode} />
      </div>

      <p className="mb-4 px-1 text-[11.5px] text-(--color-ink-faint)">
        {mode === "print" && "Name the printed letter."}
        {mode === "cursive" && "Name the handwritten letter."}
        {mode === "traps" && "Only the letters people actually mix up."}
      </p>

      {/* mastery bar ----------------------------------------------------- */}
      <div className="mb-4 h-1 overflow-hidden rounded-full bg-white/8">
        <div
          className="h-full rounded-full"
          style={{
            width: `${(mastered / pool.length) * 100}%`,
            background:
              "linear-gradient(90deg, var(--color-accent), var(--color-accent-2))",
            transition: "width 700ms var(--ease-out-soft)",
          }}
        />
      </div>

      {!round ? (
        <div className="glass grid h-[320px] place-items-center rounded-[28px] text-[13px] text-(--color-ink-faint)">
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
          <div className="mb-3 flex items-center justify-between px-1 text-[12px]">
            <span className="text-(--color-ink-faint)">
              {round.index} / {ROUND_LENGTH}
            </span>
            <span className="rounded-full bg-white/8 px-2.5 py-1 text-[11px] font-semibold tabular-nums">
              {round.score} correct
            </span>
          </div>

          <div
            className={`glass mb-3 grid min-h-[190px] flex-1 place-items-center rounded-[28px] ${
              verdict === "wrong" ? "anim-shake" : ""
            }`}
            style={{
              maxHeight: 300,
              borderColor:
                verdict === "correct"
                  ? "rgba(74,222,156,0.45)"
                  : verdict === "wrong"
                    ? "rgba(255,107,122,0.45)"
                    : undefined,
              transition: "border-color 260ms ease",
            }}
          >
            <span
              key={round.question.target.char + round.index}
              className={`heb anim-pop text-[96px] leading-none ${
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
                bg = "rgba(74,222,156,0.16)";
                brd = "rgba(74,222,156,0.55)";
                fg = "var(--color-mint)";
              } else if (verdict && isPicked) {
                bg = "rgba(255,107,122,0.16)";
                brd = "rgba(255,107,122,0.55)";
                fg = "var(--color-coral)";
              } else if (verdict) {
                fg = "var(--color-ink-faint)";
              }

              return (
                <button
                  key={opt.char}
                  onClick={() => answer(opt)}
                  disabled={!!verdict}
                  className="glass press flex items-center justify-center gap-1.5 rounded-[20px] py-4 text-[14px] font-semibold tracking-[0.03em]"
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
            <p className="anim-fade mt-3.5 px-1 text-center text-[12.5px] leading-relaxed text-(--color-ink-dim)">
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
    <div className="glass anim-rise rounded-[28px] p-6 text-center">
      <div
        className="mx-auto grid size-14 place-items-center rounded-full"
        style={{
          background: clean
            ? "rgba(74,222,156,0.15)"
            : "rgba(111,139,255,0.15)",
        }}
      >
        <span className="text-[26px]">{clean ? "🏆" : "✦"}</span>
      </div>

      <div className="mt-4 text-[42px] leading-none font-bold tracking-[-0.04em] tabular-nums">
        {round.score}
        <span className="text-[22px] text-(--color-ink-faint)">
          /{ROUND_LENGTH}
        </span>
      </div>
      <p className="mt-1.5 text-[13px] text-(--color-ink-dim)">
        {pct}% correct
        {clean && " · flawless round"}
      </p>

      {!clean && (
        <div className="mt-5 rounded-[20px] bg-white/5 p-4 text-left">
          <div className="text-[10px] font-semibold tracking-[0.08em] text-(--color-ink-faint) uppercase">
            Revisit these
          </div>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {unique.map((l) => (
              <span
                key={l.char}
                className="flex items-center gap-1.5 rounded-full bg-white/8 py-1 pr-3 pl-2"
              >
                <span
                  className="heb text-[17px] leading-none"
                  style={{ fontFamily: "var(--font-hebrew)" }}
                >
                  {l.char}
                </span>
                <span className="text-[11px] font-semibold tracking-[0.04em] text-(--color-ink-dim)">
                  {l.name}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={onRestart}
        className="press mt-5 w-full rounded-full py-3.5 text-[14px] font-semibold"
        style={{
          background:
            "linear-gradient(100deg, var(--color-accent), var(--color-accent-2))",
          boxShadow: "0 8px 26px -10px rgba(111,139,255,0.9)",
        }}
      >
        Another round
      </button>

      <Link
        href="/alphabet"
        prefetch={LINK_PREFETCH}
        onClick={tap}
        className="press mt-2.5 block w-full rounded-full py-3 text-[13px] font-medium text-(--color-ink-dim)"
      >
        Back to the letters
      </Link>

      <p className="mt-4 text-[11px] text-(--color-ink-faint)">
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
