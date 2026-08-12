"use client";

import { useState } from "react";
import Link from "next/link";
import {
  MONTH_TARGET,
  PENALTY_DAYS,
  dueAssessment,
  monthOfDay,
  score,
  type Assessment,
} from "@/lib/assessment";
import { passageFor, tokenise, tokens } from "@/lib/passages";
import { dayNumber } from "@/lib/programme";
import { fmtNum } from "@/lib/plan";
import { update, useStore } from "@/lib/store";
import { useToday } from "@/lib/clock";
import { LINK_PREFETCH } from "@/lib/base-path";
import { error as buzz, success, tap } from "@/lib/feedback";

type Phase = "brief" | "reading" | "result";

/**
 * §6. The trainee reads an unseen passage and marks every word they don't
 * know. Nothing here is graded by the app's own scheduler — this is the one
 * measurement that comes from outside it, which is what makes it worth having.
 */
export default function AssessPage() {
  const { data, ready } = useStore();
  const today = useToday();
  const [phase, setPhase] = useState<Phase>("brief");
  const [unknown, setUnknown] = useState<Set<string>>(new Set());
  const [result, setResult] = useState<Assessment | null>(null);

  const startedOn = data.plan.startedOn ?? today;
  const day = today && startedOn ? dayNumber(startedOn, today) : 1;
  const taken = data.assessments ?? [];

  // The oldest month still outstanding, or — if none is — the current one, so
  // an early retake is possible without being scheduled.
  const month = dueAssessment(day, taken) ?? monthOfDay(day);
  const passage = passageFor(month);
  const target = MONTH_TARGET[month] ?? 95;
  const attempts = taken.filter((a) => a.month === month).length;

  if (!ready || !today) {
    return <p className="py-10 text-center text-sm text-ink-3">Loading…</p>;
  }

  if (!passage) {
    return (
      <div className="py-6">
        <p className="eyebrow">Assessment</p>
        <h1 className="mt-1 text-lg font-semibold">
          No passage for month {month}
        </h1>
        <Back />
      </div>
    );
  }

  const all = tokens(passage);

  function toggle(key: string) {
    tap();
    setUnknown((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function submit() {
    if (!today) return;
    const a = score(month, all, [...unknown], today);
    if (a.cleared) success();
    else buzz();
    setResult(a);
    setPhase("result");
    update((d) => ({ ...d, assessments: [...(d.assessments ?? []), a] }));
  }

  /* --- brief -------------------------------------------------------------- */

  if (phase === "brief") {
    return (
      <div className="py-2">
        <p className="eyebrow">Assessment · Month {month}</p>
        <h1 className="mt-1 text-lg leading-tight font-semibold">
          {attempts > 0 ? "Retake" : "Unseen passage"}
        </h1>

        <p className="mt-4 text-base leading-snug text-ink-2">
          {passage.sentences.length} sentences you have not been taught, at
          month {month} level. Read them once. Tap every word you don&apos;t
          know — not the ones you half-recognise.
        </p>

        <dl className="mt-6 mb-7 flex flex-col">
          <Fact k="Words in the passage" v={fmtNum(all.length)} />
          <Fact k="Target coverage" v={`${target}%`} />
          <Fact
            k="Attempts on this month"
            v={attempts === 0 ? "none" : String(attempts)}
            last
          />
        </dl>

        <button
          onClick={() => {
            tap();
            setPhase("reading");
          }}
          className="btn btn-primary w-full"
        >
          Begin
        </button>
        <p className="mt-4 text-center text-xs leading-relaxed text-ink-3">
          Marking honestly is the entire value. An inflated score moves the
          deployment date, not the ability.
        </p>
      </div>
    );
  }

  /* --- reading ------------------------------------------------------------ */

  if (phase === "reading") {
    const marked = all.filter((w) => unknown.has(w)).length;
    return (
      <div className="flex flex-col">
        <header className="mb-4 flex items-baseline justify-between">
          <div>
            <p className="eyebrow">Month {month} · unseen</p>
            <h1 className="mt-1 text-lg leading-tight font-semibold">
              Tap what you don&apos;t know
            </h1>
          </div>
          <span className="text-sm text-ink-3 tnum">
            {marked}/{all.length}
          </span>
        </header>

        <div className="panel rounded-2xl px-4 py-5">
          {passage.sentences.map((s, i) => (
            <p
              key={i}
              dir="rtl"
              className="heb mb-3 text-right text-[26px] leading-[1.9]"
              style={{ fontFamily: "var(--font-hebrew)" }}
            >
              {tokenise(s.he).map((t, j) => (
                <button
                  key={j}
                  onClick={() => toggle(t.key)}
                  aria-pressed={unknown.has(t.key)}
                  className="rounded-md px-1"
                  // Marked is "not known", not "wrong". Half a passage in
                  // solid red reads as failure; a tint plus a rule under the
                  // word is just as unambiguous and stays readable.
                  style={
                    unknown.has(t.key)
                      ? {
                          background:
                            "color-mix(in oklch, var(--color-bad) 20%, transparent)",
                          boxShadow: "inset 0 -2px 0 var(--color-bad)",
                        }
                      : undefined
                  }
                >
                  {t.text}
                </button>
              ))}
            </p>
          ))}
        </div>

        <p className="mt-4 text-xs leading-relaxed text-ink-3">
          Tapping a word marks it everywhere it appears. No translation is
          shown until you finish — guessing from the French is not comprehension.
        </p>

        {/* The passage is 85 words on a phone, so the count and the way out
            travel with it rather than sitting past the fold. */}
        <div
          className="sticky mt-4 pt-4 pb-3"
          style={{
            // The tab bar is fixed over the page, so the bar rides above it
            // rather than under it.
            bottom: "calc(var(--safe-b) + var(--tabbar-h) + 8px)",
            marginInline: "calc(var(--gutter) * -1)",
            paddingInline: "var(--gutter)",
            background:
              "linear-gradient(to top, var(--color-canvas) 70%, transparent)",
          }}
        >
          <button onClick={submit} className="btn btn-primary w-full">
            Mark it · {marked} unknown
          </button>
        </div>
      </div>
    );
  }

  /* --- result ------------------------------------------------------------- */

  const a = result!;
  // Not `target`: clearing this attempt moves `month` on to the next one, and
  // the result must report the bar it was actually marked against.
  const sat = MONTH_TARGET[a.month] ?? 95;
  return (
    <div className="py-2">
      <p className="eyebrow">Month {a.month} · {a.takenOn}</p>
      <h1
        className="mt-1 text-lg leading-tight font-semibold"
        style={{ color: a.cleared ? undefined : "var(--color-warn)" }}
      >
        {a.cleared ? `Cleared for month ${a.month}` : "Not cleared"}
      </h1>

      <div className="panel mt-5 rounded-2xl px-5 py-6 text-center">
        <p className="text-[40px] leading-none font-semibold tnum">
          {a.coverage}
          <span className="text-lg font-normal text-ink-3">%</span>
        </p>
        <p className="mt-2 text-sm text-ink-3">
          {fmtNum(a.known)} of {fmtNum(a.total)} words · target {sat}%
        </p>
      </div>

      {!a.cleared && (
        <p className="mt-5 text-base leading-snug text-ink-2">
          Month {a.month} stands NOT CLEARED. Readiness is capped until you
          retake and pass. Intake drops for {PENALTY_DAYS} days and the words
          you missed come back as lines.
        </p>
      )}

      {a.missed.length > 0 && (
        <>
          <h2 className="eyebrow mt-7 mb-2">
            Missed · {a.missed.length} words
          </h2>
          <div className="panel flex flex-wrap gap-1.5 rounded-2xl px-4 py-4">
            {a.missed.map((w) => (
              <span
                key={w}
                dir="rtl"
                className="heb rounded-md px-2 py-1 text-md"
                style={{
                  background: "var(--color-surface-2)",
                  fontFamily: "var(--font-hebrew)",
                }}
              >
                {w}
              </span>
            ))}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-ink-3">
            Lines carrying these words are promoted into the next few days of
            intake.
          </p>
        </>
      )}

      <Back />
    </div>
  );
}

function Back() {
  return (
    <Link
      href="/"
      prefetch={LINK_PREFETCH}
      onClick={tap}
      className="btn btn-primary mt-7 w-full"
    >
      Back to today
    </Link>
  );
}

function Fact({
  k,
  v,
  last,
}: {
  k: string;
  v: string;
  last?: boolean;
}) {
  return (
    <div
      className="flex items-baseline justify-between gap-4 py-2.5"
      style={{ borderBottom: last ? "none" : "1px solid var(--color-line)" }}
    >
      <dt className="text-base text-ink-2">{k}</dt>
      <dd className="text-base font-semibold tnum">{v}</dd>
    </div>
  );
}

