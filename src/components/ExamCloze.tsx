"use client";

import { useMemo, useRef, useState } from "react";
import { clozeBank, clozeParts, pct, type ClozePassage } from "@/lib/exams";
import { nowMs } from "@/lib/clock";
import { error as buzz, success, tap } from "@/lib/feedback";
import ScoreTrail from "@/components/ScoreTrail";

interface ExamClozeProps {
  passage: ClozePassage;
  /** Scores at this passage before this attempt. */
  history: number[];
  onRecord: (right: number, asked: number, ms: number) => void;
  onBack: () => void;
}

/**
 * §06 — the gap-fill, which is where most of the marks sit, because it asks
 * for a verb, a demonstrative and a plural inside a text rather than on their
 * own.
 *
 * The bank is a pile of words, not a menu per blank: taking one uses it up,
 * and a word that appears twice in the answers appears twice in the bank. That
 * is what the paper does, and it is what makes the last two blanks hard.
 */
export default function ExamCloze({
  passage,
  history,
  onRecord,
  onBack,
}: ExamClozeProps) {
  const [bank, setBank] = useState(() => clozeBank(passage));
  const parts = useMemo(() => clozeParts(passage), [passage]);

  /** Bank index sitting in each blank, or null. */
  const [filled, setFilled] = useState<(number | null)[]>(
    () => passage.answers.map(() => null),
  );
  const [sel, setSel] = useState<number | null>(0);
  const [checked, setChecked] = useState(false);
  /** The record before this attempt, so the result compares against it. */
  const [before, setBefore] = useState(history);
  const started = useRef(nowMs());

  const used = new Set(filled.filter((v): v is number => v !== null));
  const right = filled.filter(
    (b, i) => b !== null && bank[b] === passage.answers[i],
  ).length;
  const full = filled.every((b) => b !== null);

  function place(word: number) {
    if (checked) return;
    tap();
    const target = sel !== null && filled[sel] === null
      ? sel
      : filled.findIndex((b) => b === null);
    if (target < 0) return;
    const next = [...filled];
    next[target] = word;
    setFilled(next);
    // Move to the next empty blank, so a run of taps fills the text in order.
    const after = next.findIndex((b, i) => b === null && i > target);
    setSel(after >= 0 ? after : next.findIndex((b) => b === null));
  }

  function clear(blank: number) {
    if (checked) return;
    tap();
    const next = [...filled];
    next[blank] = null;
    setFilled(next);
    setSel(blank);
  }

  function check() {
    const got = filled.filter(
      (b, i) => b !== null && bank[b] === passage.answers[i],
    ).length;
    if (got === passage.answers.length) success();
    else buzz();
    onRecord(got, passage.answers.length, nowMs() - started.current);
    setChecked(true);
  }

  function again() {
    tap();
    started.current = nowMs();
    setBefore(history);
    setBank(clozeBank(passage));
    setFilled(passage.answers.map(() => null));
    setSel(0);
    setChecked(false);
  }

  const score = pct({ right, asked: passage.answers.length });

  return (
    <div>
      <header className="mb-4">
        <p className="eyebrow">06 · Gap-fill</p>
        <h1
          dir="rtl"
          className="heb mt-1 text-lg leading-tight font-semibold"
          style={{ fontFamily: "var(--font-hebrew)" }}
        >
          {passage.title}
        </h1>
        <p className="mt-2 text-sm text-ink-2">{passage.en}</p>
      </header>

      {/* The text, with the blanks in it. */}
      <div className="panel rounded-2xl px-4 py-5">
        <p
          dir="rtl"
          className="heb text-[21px] leading-[2.1]"
          style={{ fontFamily: "var(--font-hebrew)" }}
        >
          {parts.map((p, i) =>
            "text" in p ? (
              <span key={i}>{p.text}</span>
            ) : (
              <Blank
                key={i}
                n={p.blank}
                word={filled[p.blank] === null ? null : bank[filled[p.blank]!]}
                answer={passage.answers[p.blank]}
                selected={sel === p.blank && !checked}
                checked={checked}
                onTap={() =>
                  checked
                    ? undefined
                    : filled[p.blank] === null
                      ? (tap(), setSel(p.blank))
                      : clear(p.blank)
                }
              />
            ),
          )}
        </p>
      </div>

      {/* The bank. */}
      {!checked && (
        <div className="mt-4 flex flex-wrap gap-2" dir="rtl">
          {bank.map((w, i) => (
            <button
              key={`${w}-${i}`}
              onClick={() => place(i)}
              disabled={used.has(i)}
              className="heb tap rounded-full px-3.5 py-2 text-md"
              style={{
                fontFamily: "var(--font-hebrew)",
                background: used.has(i)
                  ? "transparent"
                  : "var(--color-surface-2)",
                border: `1px solid ${
                  used.has(i) ? "var(--color-line)" : "var(--color-line-strong)"
                }`,
                color: used.has(i) ? "var(--color-ink-3)" : "var(--color-ink)",
                opacity: used.has(i) ? 0.4 : 1,
              }}
            >
              {w}
            </button>
          ))}
        </div>
      )}

      {checked ? (
        <>
          <div className="mt-6">
            <p className="eyebrow">Marked</p>
            <h2 className="mt-1 text-xl leading-none font-semibold tnum">
              {right} of {passage.answers.length}
            </h2>
            <p className="mt-2 text-base text-ink-2 tnum">
              {score}%
              {before.length > 0 && (
                <>
                  {" · "}
                  <Delta from={before[before.length - 1]} to={score} />
                </>
              )}
            </p>
            {before.length > 0 && (
              <div className="mt-4">
                <ScoreTrail runs={[...before, score]} />
              </div>
            )}
          </div>
          <button onClick={again} className="btn btn-primary mt-6 w-full">
            Again
          </button>
        </>
      ) : (
        <button
          onClick={check}
          disabled={!full}
          className="btn btn-primary mt-6 w-full"
        >
          {full
            ? "Check"
            : `${filled.filter((b) => b === null).length} blanks left`}
        </button>
      )}

      <button
        onClick={() => {
          tap();
          onBack();
        }}
        className="btn btn-quiet mt-2 w-full text-sm"
      >
        Back to the passages
      </button>
    </div>
  );
}

function Blank({
  n,
  word,
  answer,
  selected,
  checked,
  onTap,
}: {
  n: number;
  word: string | null;
  answer: string;
  selected: boolean;
  checked: boolean;
  onTap: () => void;
}) {
  const right = word === answer;
  let tint = "var(--color-ink)";
  let edge = selected ? "var(--color-accent)" : "var(--color-line-strong)";
  if (checked) {
    tint = right ? "var(--color-good)" : "var(--color-bad)";
    edge = tint;
  }

  return (
    <span className="inline-flex flex-col items-center align-baseline">
      <button
        onClick={onTap}
        aria-label={`Blank ${n + 1}`}
        className="tap mx-1 min-w-[64px] rounded-md px-2 text-center"
        style={{
          borderBottom: `2px solid ${edge}`,
          color: word ? tint : "var(--color-ink-3)",
        }}
      >
        {word ?? " "}
      </button>
      {/* The red pen: the right word under the wrong one, and nowhere else. */}
      {checked && !right && (
        <span
          className="text-sm leading-tight"
          style={{ color: "var(--color-good)" }}
        >
          {answer}
        </span>
      )}
    </span>
  );
}

function Delta({ from, to }: { from: number; to: number }) {
  const d = to - from;
  if (d === 0) return <span className="text-ink-3">level with last time</span>;
  return (
    <span style={{ color: d > 0 ? "var(--color-good)" : "var(--color-bad)" }}>
      {d > 0 ? "+" : "−"}
      {Math.abs(d)} on last time
    </span>
  );
}
