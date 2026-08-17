"use client";

import { useEffect, useRef, useState } from "react";
import {
  drawMock,
  drawSection,
  isHebrew,
  pct,
  type Section,
  type Week,
} from "@/lib/exams";
import { nowMs } from "@/lib/clock";
import { error as buzz, success, tap } from "@/lib/feedback";
import ScoreTrail from "@/components/ScoreTrail";

interface ExamQuizProps {
  week: Week;
  /** The section being drilled, or null to sit the mixed mock. */
  section: Section | null;
  /** §9.5 — the romanisation is a crutch, and it is switched off in settings. */
  phonetics: boolean;
  /** Scores before this sitting, so the result can compare against them. */
  history: number[];
  onRecord: (right: number, asked: number, ms: number) => void;
  onBack: () => void;
}

/**
 * One sitting of a weekly test — a section drilled, or the mixed mock.
 *
 * The two modes differ in one thing, and it is the thing that matters: a drill
 * corrects you where you stand and makes a miss wait until you have read why,
 * while the mock says nothing until the end. Correcting during a mock would
 * measure a different skill from the one the ulpan measures on Thursday.
 */
export default function ExamQuiz({
  week,
  section,
  phonetics,
  history,
  onRecord,
  onBack,
}: ExamQuizProps) {
  const exam = section === null;
  const deal = () => (exam ? drawMock(week) : drawSection(week, section.id));

  const [drawn, setDrawn] = useState(deal);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [given, setGiven] = useState<(number | null)[]>([]);
  const [done, setDone] = useState(false);
  const [took, setTook] = useState(0);
  /**
   * The record as it stood when this sitting began. Read it after the run is
   * saved and every comparison would be against the run itself.
   */
  const [before, setBefore] = useState(history);
  const started = useRef(nowMs());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => clearTimeout(timer.current ?? undefined), []);

  const q = drawn[i];

  function finish(answers: (number | null)[]) {
    const right = answers.filter((a, n) => a === drawn[n]?.answer).length;
    const ms = nowMs() - started.current;
    onRecord(right, drawn.length, ms);
    setTook(ms);
    setDone(true);
  }

  function advance(answers: (number | null)[]) {
    if (i + 1 >= drawn.length) finish(answers);
    else {
      setI((v) => v + 1);
      setPicked(null);
    }
  }

  function pick(choice: number) {
    if (picked !== null || !q) return;
    const correct = choice === q.answer;
    const answers = [...given, choice];
    setPicked(choice);
    setGiven(answers);

    if (exam) {
      // No verdict, no colour. Just the next question.
      timer.current = setTimeout(() => advance(answers), 140);
      return;
    }
    if (correct) {
      success();
      timer.current = setTimeout(() => advance(answers), 700);
    } else {
      // A miss holds. The margin note is the teaching, and it needs reading.
      buzz();
    }
  }

  function again() {
    tap();
    if (timer.current) clearTimeout(timer.current);
    started.current = nowMs();
    setBefore(history);
    setDrawn(deal());
    setGiven([]);
    setI(0);
    setPicked(null);
    setDone(false);
  }

  if (!drawn.length) {
    return (
      <div className="py-10 text-center">
        <p className="text-sm text-ink-3">Nothing to ask here yet.</p>
        <button onClick={onBack} className="btn btn-quiet mt-4 text-sm">
          Back
        </button>
      </div>
    );
  }

  /* --- the result --------------------------------------------------------- */

  if (done) {
    const right = given.filter((a, n) => a === drawn[n]?.answer).length;
    const score = pct({ right, asked: drawn.length });
    const last = before.length ? before[before.length - 1] : null;
    const best = before.length ? Math.max(...before) : null;
    const missed = drawn
      .map((d, n) => ({ d, given: given[n] }))
      .filter((x) => x.given !== x.d.answer);

    return (
      <div className="py-2">
        <p className="eyebrow">
          {exam ? "Mock exam" : `${section.n} · ${section.en}`}
        </p>
        <h1 className="mt-1 text-xl leading-none font-semibold tnum">
          {right} of {drawn.length}
        </h1>
        <p className="mt-2 text-base text-ink-2 tnum">
          {score}% · {mmss(took)}
          {last !== null && (
            <>
              {" · "}
              <Delta from={last} to={score} />
            </>
          )}
        </p>

        {best !== null && score > best && (
          <p className="mt-1 text-sm" style={{ color: "var(--color-good)" }}>
            Best yet — your previous best was {best}%.
          </p>
        )}
        {last === null && (
          <p className="mt-1 text-sm text-ink-3">
            First run at this. It is the number everything after is measured
            against.
          </p>
        )}

        {before.length > 0 && (
          <div className="mt-5">
            <ScoreTrail runs={[...before, score]} />
          </div>
        )}

        {exam && (
          <section className="mt-6">
            <h2 className="eyebrow mb-1">Where it went</h2>
            <dl className="flex flex-col">
              {week.sections
                .filter((s) => s.kind === "quiz")
                .map((s, n, arr) => {
                  const rows = drawn
                    .map((d, k) => ({ d, given: given[k] }))
                    .filter((x) => x.d.q.part === s.id);
                  if (!rows.length) return null;
                  const got = rows.filter(
                    (x) => x.given === x.d.answer,
                  ).length;
                  return (
                    <div
                      key={s.id}
                      className="flex items-baseline justify-between py-2"
                      style={{
                        borderBottom:
                          n === arr.length - 1
                            ? "none"
                            : "1px solid var(--color-line)",
                      }}
                    >
                      <dt className="text-base text-ink-2">{s.en}</dt>
                      <dd
                        className="text-base font-semibold tnum"
                        style={{
                          color:
                            got === rows.length
                              ? "var(--color-good)"
                              : undefined,
                        }}
                      >
                        {got}/{rows.length}
                      </dd>
                    </div>
                  );
                })}
            </dl>
          </section>
        )}

        {missed.length > 0 && (
          <section className="mt-6">
            <h2 className="eyebrow mb-2">
              {missed.length} to look at again
            </h2>
            <ul className="flex flex-col gap-2">
              {missed.map(({ d, given: g }) => (
                <li key={d.q.id} className="panel rounded-xl px-4 py-3">
                  <Prompt text={d.q.prompt} size={20} />
                  <p className="mt-1.5 text-sm text-ink-3">{d.q.en}</p>
                  <p className="mt-2 text-sm">
                    <Word
                      text={g === null ? "—" : d.options[g]}
                      tint="var(--color-bad)"
                    />
                    <span className="text-ink-3"> → </span>
                    <Word
                      text={d.options[d.answer]}
                      tint="var(--color-good)"
                    />
                  </p>
                  <p className="mt-1.5 text-sm text-ink-2">
                    <Word text={d.q.note} /> — {d.q.why}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}

        <button onClick={again} className="btn btn-primary mt-7 w-full">
          {exam ? "Sit it again" : "Run it again"}
        </button>
        <button
          onClick={() => {
            tap();
            onBack();
          }}
          className="btn btn-quiet mt-2 w-full text-sm"
        >
          Back to the sections
        </button>
      </div>
    );
  }

  /* --- the question ------------------------------------------------------- */

  const wrong = !exam && picked !== null && picked !== q.answer;
  const wide = q.options.some((o) => o.length > 12);

  return (
    <div>
      <header className="mb-4 flex items-baseline justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow truncate">
            {exam ? `Mock · ${week.en}` : `${section.n} · ${section.he}`}
          </p>
          <h1 className="mt-1 text-lg leading-tight font-semibold">
            {exam ? "No corrections until the end" : section.en}
          </h1>
        </div>
        <span className="shrink-0 text-sm text-ink-3 tnum">
          {i + 1}/{drawn.length}
        </span>
      </header>

      {/* Progress is a hairline, not a bar with a label. */}
      <div
        aria-hidden
        className="mb-5 h-[2px] w-full rounded-full"
        style={{ background: "var(--color-line)" }}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${(i / drawn.length) * 100}%`,
            background: "var(--color-accent)",
            transition: "width 200ms var(--ease-out-quart)",
          }}
        />
      </div>

      <div className="panel rounded-2xl px-5 py-7 text-center">
        <Prompt text={q.q.prompt} size={q.q.prompt.length > 24 ? 24 : 30} />
        <p className="mt-3 text-sm text-ink-3">{q.q.en}</p>
        {phonetics && q.q.tr && (
          <p className="mt-1 text-sm text-ink-3 italic">{q.q.tr}</p>
        )}
      </div>

      <div
        className={`mt-3 grid gap-2.5 ${wide ? "grid-cols-1" : "grid-cols-2"}`}
      >
        {q.options.map((o, n) => {
          const isAnswer = n === q.answer;
          const isPicked = n === picked;
          let bg: string | undefined;
          let brd: string | undefined;
          let fg: string | undefined;
          // The mock shows which one you touched and nothing more.
          if (exam && isPicked) {
            bg = "var(--color-surface-2)";
            brd = "var(--color-line-strong)";
          } else if (!exam && picked !== null && isAnswer) {
            bg = "color-mix(in oklch, var(--color-good) 16%, transparent)";
            brd = "color-mix(in oklch, var(--color-good) 55%, transparent)";
            fg = "var(--color-good)";
          } else if (!exam && picked !== null && isPicked) {
            bg = "color-mix(in oklch, var(--color-bad) 16%, transparent)";
            brd = "color-mix(in oklch, var(--color-bad) 55%, transparent)";
            fg = "var(--color-bad)";
          } else if (!exam && picked !== null) {
            fg = "var(--color-ink-3)";
          }
          return (
            <button
              key={`${o}-${n}`}
              onClick={() => pick(n)}
              disabled={picked !== null}
              className="panel tap rounded-xl px-3 py-4 text-md font-semibold"
              style={{ background: bg, borderColor: brd, color: fg }}
            >
              <Word text={o} />
            </button>
          );
        })}
      </div>

      {/* The teaching payload. A drill that only says "wrong" teaches nothing. */}
      <div className="mt-4 min-h-[104px]">
        {wrong && (
          <div className="anim-fade">
            <p className="text-md">
              <Word text={q.q.note} />
            </p>
            <p className="mt-1 text-sm text-ink-2">{q.q.why}</p>
            <button
              onClick={() => {
                tap();
                advance(given);
              }}
              className="btn btn-secondary mt-3 w-full text-sm"
            >
              Next
            </button>
          </div>
        )}
      </div>

      <button
        onClick={() => {
          tap();
          onBack();
        }}
        className="btn btn-quiet mt-2 w-full text-sm"
      >
        Stop — nothing is recorded
      </button>
    </div>
  );
}

/* --- bits ----------------------------------------------------------------- */

/** Hebrew sets right-to-left and larger; English in the same slot does not. */
function Prompt({ text, size }: { text: string; size: number }) {
  const he = isHebrew(text);
  return (
    <p
      dir={he ? "rtl" : "ltr"}
      className={he ? "heb leading-snug" : "leading-snug font-semibold"}
      style={{
        fontFamily: he ? "var(--font-hebrew)" : undefined,
        fontSize: he ? size : size * 0.72,
      }}
    >
      {text}
    </p>
  );
}

/** A word or phrase that may be in either script, inline. */
function Word({ text, tint }: { text: string; tint?: string }) {
  const he = isHebrew(text);
  return (
    <span
      dir={he ? "rtl" : "ltr"}
      className={he ? "heb" : undefined}
      style={{
        fontFamily: he ? "var(--font-hebrew)" : undefined,
        color: tint,
        display: "inline-block",
      }}
    >
      {text}
    </span>
  );
}

function Delta({ from, to }: { from: number; to: number }) {
  const d = to - from;
  if (d === 0) return <span className="text-ink-3">level with last run</span>;
  return (
    <span style={{ color: d > 0 ? "var(--color-good)" : "var(--color-bad)" }}>
      {d > 0 ? "+" : "−"}
      {Math.abs(d)} on your last run
    </span>
  );
}

function mmss(ms: number): string {
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${`${s % 60}`.padStart(2, "0")}`;
}
