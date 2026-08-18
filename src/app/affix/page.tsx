"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  PREFIXES,
  STAGES,
  TEACH_FAMILIES,
  clearedIn,
  cut,
  meaningOf,
  nextQuestion,
  type AffixItem,
  type AffixStage,
} from "@/lib/affix";
import { FAST_MS, MASTERY_TARGET, isBanked, statFor, useProgress } from "@/lib/progress";
import { LINK_PREFETCH } from "@/lib/base-path";
import { nowMs } from "@/lib/clock";
import { error as buzz, success, tap } from "@/lib/feedback";

const ROUND = 12;

/**
 * §8f — stripping the prefix.
 *
 * Seven letters attach to the front of a word: ה ו ב כ ל מ ש. On this corpus
 * 40.1% of running words begin with one of them carrying a vowel a real prefix
 * can take, so learning to see past them is the largest lever left once the
 * glyphs are known. A reader who cannot do it reads six characters where a
 * fluent one sees one letter plus a word already known.
 *
 * Two stages, because it is two skills. Stage 1 marks the prefix and asks what
 * it means. Stage 2 marks nothing and asks what is underneath — which is the
 * half that actually makes reading faster, and is why the prefix is not
 * highlighted there.
 */
export default function AffixPage() {
  const { progress, ready, record } = useProgress();
  const [stage, setStage] = useState<AffixStage | null>(null);
  const [taught, setTaught] = useState(false);
  const [q, setQ] = useState<AffixItem | null>(null);
  const [opts, setOpts] = useState<string[]>([]);
  const [picked, setPicked] = useState<string | null>(null);
  const [n, setN] = useState(0);
  const [right, setRight] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shownAt = useRef(0);
  /**
   * The next question is drawn inside a setTimeout, which would otherwise close
   * over the progress captured *before* the answer was recorded — leaving an
   * item just banked in the draw for one more question.
   */
  const live = useRef(progress);
  useEffect(() => {
    live.current = progress;
  }, [progress]);

  useEffect(() => () => clearTimeout(timer.current ?? undefined), []);

  const banked = (id: string) => isBanked(progress, id);
  /** Stage 2 opens once stage 1 is mostly in hand — 60%, not all of it. */
  const open = (s: AffixStage) => {
    if (s.n === 1) return true;
    const prev = clearedIn(STAGES[0], banked);
    return prev.cleared >= Math.ceil(prev.total * 0.6);
  };

  function ask(s: AffixStage) {
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
    // A miss holds long enough to see the word come apart; a hit moves on.
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
          <p className="eyebrow">Prefixes</p>
          <h1 className="mt-1 text-lg leading-tight font-semibold">
            The letter in front
          </h1>
          <p className="mt-3 text-base leading-snug text-ink-2">
            Two words in five start with one of seven letters that are not part
            of the word. See past them and a long word becomes a short one.
          </p>
        </header>

        {/* The seven, once, so the drill is never the first sight of them. */}
        <div className="panel rounded-2xl px-4 py-4">
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-3">
            {PREFIXES.map((p) => (
              <span key={p.letter} className="text-center">
                <span
                  className="heb block text-[30px] leading-none"
                  style={{ fontFamily: "var(--font-hebrew)" }}
                >
                  {p.letter}
                </span>
                <span className="mt-1.5 block text-xs text-ink-3">{p.means}</span>
              </span>
            ))}
          </div>
        </div>

        <ul className="mt-5 flex flex-col">
          {STAGES.map((s, i) => {
            const can = open(s);
            const { cleared, total } = clearedIn(s, banked);
            return (
              <li
                key={s.n}
                style={{
                  borderBottom:
                    i === STAGES.length - 1 ? "none" : "1px solid var(--color-line)",
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
                        cleared >= total ? "var(--color-accent)" : "transparent",
                      border:
                        cleared >= total ? "none" : "1.5px solid var(--color-line-strong)",
                      color:
                        cleared >= total
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
                        ? `${cleared} of ${total} locked in`
                        : "Finish most of stage 1 first"}
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

  /* --- the rule ----------------------------------------------------------- */

  if (!taught) {
    return (
      <div className="py-2">
        <p className="eyebrow">Stage {stage.n} of {STAGES.length}</p>
        <h1 className="mt-1 text-lg leading-tight font-semibold">{stage.title}</h1>
        <p className="mt-5 text-base leading-relaxed text-ink-2">{stage.teach}</p>

        {/* One word wearing every prefix in turn: the contrast is the lesson. */}
        {TEACH_FAMILIES.slice(0, 2).map((f) => (
          <div key={f.base} className="panel mt-5 rounded-2xl px-4 py-4">
            <p className="eyebrow mb-3">
              One word, {f.forms.length} prefixes
            </p>
            <p
              dir="rtl"
              className="heb text-center text-[30px] leading-none"
              style={{ fontFamily: "var(--font-hebrew)" }}
            >
              {f.base}
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-3">
              {f.forms.map((x) => {
                const [head, rest] = cut(x.he, x.prefix);
                return (
                  <span key={x.he} dir="rtl" className="text-center">
                    <span
                      className="heb block text-[24px] leading-none"
                      style={{ fontFamily: "var(--font-hebrew)" }}
                    >
                      <span style={{ color: "var(--color-accent)" }}>{head}</span>
                      {rest}
                    </span>
                  </span>
                );
              })}
            </div>
          </div>
        ))}

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
    const { cleared, total } = clearedIn(stage, banked);
    return (
      <div className="py-6">
        <p className="eyebrow">Stage {stage.n}</p>
        <h1 className="mt-1 text-lg leading-tight font-semibold">
          {right} of {n}
        </h1>
        <p className="mt-3 text-base leading-snug text-ink-2">
          {cleared} of {total} locked in. Three correct in a row, each under{" "}
          {FAST_MS / 1000} seconds, locks one.
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
  // Stage 1 marks the prefix, because it is asking what that letter means.
  // Stage 2 must not: finding the boundary is the thing being tested.
  const [head, rest] = q && stage.n === 1 ? cut(q.form, q.prefix) : ["", q?.form ?? ""];

  return (
    <div>
      <header className="mb-5 flex items-baseline justify-between">
        <div>
          <p className="eyebrow">Stage {stage.n} · Prefixes</p>
          <h1 className="mt-1 text-lg leading-tight font-semibold">{stage.ask}</h1>
        </div>
        <span className="text-sm text-ink-3 tnum">
          {n}/{ROUND}
        </span>
      </header>

      <div className="panel grid place-items-center rounded-2xl px-5 py-9">
        <p
          dir="rtl"
          className="heb text-center leading-tight"
          style={{ fontFamily: "var(--font-hebrew)", fontSize: 52 }}
        >
          {head && <span style={{ color: "var(--color-accent)" }}>{head}</span>}
          {rest}
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
          const hebrew = stage.n === 2;
          return (
            <button
              key={o}
              onClick={() => answer(o)}
              className={`panel tap rounded-xl py-4 font-semibold ${hebrew ? "heb text-[22px]" : "text-md"}`}
              style={{
                background: bg,
                borderColor: brd,
                color: fg,
                fontFamily: hebrew ? "var(--font-hebrew)" : undefined,
              }}
              dir={hebrew ? "rtl" : undefined}
            >
              {o}
            </button>
          );
        })}
      </div>

      {/* The teaching payload: a miss shows where the word comes apart. */}
      <div className="mt-4 min-h-16 text-center">
        {missed && q && (
          <>
            <p
              dir="rtl"
              className="heb text-[26px] leading-none"
              style={{ fontFamily: "var(--font-hebrew)" }}
            >
              <span style={{ color: "var(--color-accent)" }}>
                {cut(q.form, q.prefix)[0]}
              </span>
              <span className="text-ink-3"> · </span>
              {cut(q.form, q.prefix)[1]}
            </p>
            {/* Both stages want the same explanation: what the letter says,
                and what was left once it is taken off. */}
            <p className="mt-2 text-sm text-ink-3">
              “{meaningOf(q.prefix)}”, then {q.base}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
