"use client";

import { useState } from "react";
import Link from "next/link";
import {
  MOCK,
  MOCK_SIZE,
  PASS,
  WEEKS,
  attempts,
  bestPct,
  delta,
  questionsIn,
  readiness,
  recent,
  scored,
  series,
  weekById,
  type ClozePassage,
  type Section,
} from "@/lib/exams";
import { update, useStore } from "@/lib/store";
import { nowMs, useToday } from "@/lib/clock";
import { LINK_PREFETCH } from "@/lib/base-path";
import { tap } from "@/lib/feedback";
import Ring from "@/components/Ring";
import ScoreTrail from "@/components/ScoreTrail";
import ExamQuiz from "@/components/ExamQuiz";
import ExamCloze from "@/components/ExamCloze";
import ExamForm from "@/components/ExamForm";

type View =
  | { kind: "index" }
  /** `section: null` is the mixed mock. */
  | { kind: "quiz"; section: Section | null }
  | { kind: "form" }
  | { kind: "passages" }
  | { kind: "cloze"; passage: ClozePassage };

/**
 * §8d — the weekly test.
 *
 * The ulpan sets one every week and it is the only deadline in this app that
 * the programme did not invent, so it sits outside the scheduler: no card here
 * is due in four days' time. Drill a section, or sit the mixed paper cold.
 *
 * Every sitting is kept and nothing is averaged away, because the number that
 * answers "is this working" is the third run against the first.
 */
export default function TestsPage() {
  const { data, ready } = useStore();
  const today = useToday();
  const [weekId, setWeekId] = useState(WEEKS[WEEKS.length - 1].id);
  const [view, setView] = useState<View>({ kind: "index" });

  const week = weekById(weekId) ?? WEEKS[0];
  const runs = data.exams ?? [];

  /** Append one sitting. Runs are never rewritten, only added to. */
  function record(
    part: string,
    item: string | undefined,
    right: number,
    asked: number,
    ms: number,
  ) {
    // Null only before hydration, which is before anything can be answered.
    if (!today) return;
    update((d) => ({
      ...d,
      exams: [
        ...(d.exams ?? []),
        { week: week.id, part, item, right, asked, ms, on: today, at: nowMs() },
      ],
    }));
  }

  if (!ready) {
    return <p className="py-10 text-center text-sm text-ink-3">Loading…</p>;
  }

  /* --- a sitting ---------------------------------------------------------- */

  if (view.kind === "quiz") {
    const part = view.section ? view.section.id : MOCK;
    return (
      <ExamQuiz
        // The draw is dealt on mount, so a different section is a different
        // component rather than the same one handed new props.
        key={`${week.id}:${part}`}
        week={week}
        section={view.section}
        phonetics={data.settings.phonetics}
        history={series(runs, week.id, part)}
        onRecord={(right, asked, ms) =>
          record(part, undefined, right, asked, ms)
        }
        onBack={() => setView({ kind: "index" })}
      />
    );
  }

  if (view.kind === "form") {
    return (
      <ExamForm
        fields={week.form ?? []}
        onBack={() => setView({ kind: "index" })}
      />
    );
  }

  if (view.kind === "cloze") {
    return (
      <ExamCloze
        key={`${week.id}:${view.passage.id}`}
        passage={view.passage}
        history={series(runs, week.id, "cloze", view.passage.id)}
        onRecord={(right, asked, ms) =>
          record("cloze", view.passage.id, right, asked, ms)
        }
        onBack={() => setView({ kind: "passages" })}
      />
    );
  }

  if (view.kind === "passages") {
    return (
      <div>
        <header className="mb-5">
          <p className="eyebrow">06 · Gap-fill</p>
          <h1 className="mt-1 text-lg leading-tight font-semibold">
            Four passages
          </h1>
          <p className="mt-2 text-base leading-snug text-ink-2">
            Where most of the marks sit: a verb, a demonstrative and a plural,
            inside a text rather than on their own.
          </p>
        </header>

        <ul className="flex flex-col">
          {(week.passages ?? []).map((p, i, arr) => (
            <li
              key={p.id}
              style={{
                borderBottom:
                  i === arr.length - 1 ? "none" : "1px solid var(--color-line)",
              }}
            >
              <button
                onClick={() => {
                  tap();
                  setView({ kind: "cloze", passage: p });
                }}
                className="tap flex w-full items-center gap-3 py-3.5 text-left"
              >
                <span className="min-w-0 flex-1">
                  <span
                    dir="rtl"
                    className="heb block text-md"
                    style={{ fontFamily: "var(--font-hebrew)" }}
                  >
                    {p.title}
                  </span>
                  <span className="block truncate text-sm text-ink-3">
                    {p.answers.length} blanks · {p.en}
                  </span>
                </span>
                <Mark
                  best={bestPct(runs, week.id, "cloze", p.id)}
                  n={attempts(runs, week.id, "cloze", p.id)}
                  gain={delta(runs, week.id, "cloze", p.id)}
                />
              </button>
            </li>
          ))}
        </ul>

        <button
          onClick={() => {
            tap();
            setView({ kind: "index" });
          }}
          className="btn btn-quiet mt-6 w-full text-sm"
        >
          Back to the sections
        </button>
      </div>
    );
  }

  /* --- the week ----------------------------------------------------------- */

  const readyPct = readiness(runs, week);
  const mockRuns = series(runs, week.id, MOCK);
  const mockBest = mockRuns.length ? Math.max(...mockRuns) : null;
  const mockGain = delta(runs, week.id, MOCK);
  const log = recent(runs.filter((r) => r.week === week.id), 8);

  return (
    <>
      <header className="mb-5">
        <p className="eyebrow">Week {week.n} · the ulpan&apos;s test</p>
        <h1
          dir="rtl"
          className="heb mt-1 text-lg leading-tight font-semibold"
          style={{ fontFamily: "var(--font-hebrew)" }}
        >
          {week.he}
        </h1>
        <p className="mt-2 text-base leading-snug text-ink-2">{week.brief}</p>
      </header>

      {WEEKS.length > 1 && (
        <div className="mb-5 flex gap-1.5">
          {WEEKS.map((w) => (
            <button
              key={w.id}
              onClick={() => {
                tap();
                setWeekId(w.id);
              }}
              aria-pressed={w.id === week.id}
              className="tap rounded-full px-3.5 py-1.5 text-sm font-semibold"
              style={{
                background:
                  w.id === week.id
                    ? "var(--color-surface-2)"
                    : "var(--color-surface)",
                color:
                  w.id === week.id ? "var(--color-ink)" : "var(--color-ink-3)",
              }}
            >
              Week {w.n}
            </button>
          ))}
        </div>
      )}

      {/* Where the week stands. */}
      <section className="mb-6 flex items-center gap-4">
        <Ring value={readyPct / 100} size={76} stroke={7}>
          <span className="text-md font-semibold tnum">{readyPct}%</span>
        </Ring>
        <p className="text-sm leading-snug text-ink-2">
          Your best in each of the {scored(week).length} marked sections,
          averaged. A section you have never opened counts as zero, which is
          what makes this a readiness figure rather than a compliment.
        </p>
      </section>

      {/* The mock: the whole paper, cold. */}
      <section className="mb-7">
        <button
          onClick={() => {
            tap();
            setView({ kind: "quiz", section: null });
          }}
          className="btn btn-primary w-full"
        >
          {mockRuns.length ? "Sit the mock again" : "Sit the mock exam"}
        </button>
        <p className="mt-2 px-1 text-xs leading-relaxed text-ink-3">
          {MOCK_SIZE} questions drawn across the four marked sections, no
          corrections until the end.
          {mockBest !== null && (
            <>
              {" "}
              Best {mockBest}% over {mockRuns.length}{" "}
              {mockRuns.length === 1 ? "sitting" : "sittings"}
              {mockGain !== null && (
                <>
                  , {mockGain >= 0 ? "up" : "down"} {Math.abs(mockGain)} points
                  since the first
                </>
              )}
              .
            </>
          )}
        </p>
        {mockRuns.length > 1 && (
          <div className="mt-3">
            <ScoreTrail runs={mockRuns} pass={PASS} />
          </div>
        )}
      </section>

      {/* The sections, in the order the ulpan numbers them. */}
      <section className="mb-6">
        <h2 className="eyebrow mb-1">Sections</h2>
        <ul className="flex flex-col">
          {week.sections.map((s, i, arr) => {
            const count =
              s.kind === "quiz"
                ? questionsIn(week, s.id).length
                : s.kind === "cloze"
                  ? (week.passages ?? []).length
                  : (week.form ?? []).length;
            const unit =
              s.kind === "quiz"
                ? "questions"
                : s.kind === "cloze"
                  ? "passages"
                  : "fields";
            return (
              <li
                key={s.id}
                style={{
                  borderBottom:
                    i === arr.length - 1
                      ? "none"
                      : "1px solid var(--color-line)",
                }}
              >
                <button
                  onClick={() => {
                    tap();
                    if (s.kind === "form") setView({ kind: "form" });
                    else if (s.kind === "cloze") setView({ kind: "passages" });
                    else setView({ kind: "quiz", section: s });
                  }}
                  className="tap flex w-full items-center gap-3 py-3.5 text-left"
                >
                  <span className="text-sm text-ink-3 tnum">{s.n}</span>
                  <span className="min-w-0 flex-1">
                    <span
                      dir="rtl"
                      className="heb block text-md"
                      style={{ fontFamily: "var(--font-hebrew)" }}
                    >
                      {s.he}
                    </span>
                    <span className="block truncate text-sm text-ink-3">
                      {s.en} · {count} {unit}
                    </span>
                  </span>
                  {s.kind === "form" ? (
                    <span className="shrink-0 text-sm text-ink-3">
                      practice
                    </span>
                  ) : (
                    <Mark
                      best={bestPct(runs, week.id, s.id)}
                      n={attempts(runs, week.id, s.id)}
                      gain={delta(runs, week.id, s.id)}
                    />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {/* The record. Failures included — that is what makes it a record. */}
      {log.length > 0 && (
        <section className="mb-4">
          <h2 className="eyebrow mb-1">Every sitting</h2>
          <dl className="flex flex-col">
            {log.map((r, i) => {
              const s = week.sections.find((x) => x.id === r.part);
              const score = Math.round((100 * r.right) / Math.max(1, r.asked));
              return (
                <div
                  key={r.at}
                  className="flex items-baseline justify-between gap-3 py-2"
                  style={{
                    borderBottom:
                      i === log.length - 1
                        ? "none"
                        : "1px solid var(--color-line)",
                  }}
                >
                  <dt className="min-w-0 truncate text-base text-ink-2">
                    {r.part === MOCK ? "Mock exam" : (s?.en ?? r.part)}
                    {r.item && (
                      <span className="text-ink-3"> · {r.item}</span>
                    )}
                  </dt>
                  <dd className="flex shrink-0 items-baseline gap-3">
                    <span className="text-sm text-ink-3 tnum">{r.on}</span>
                    <span
                      className="text-base font-semibold tnum"
                      style={{
                        color:
                          score >= PASS ? "var(--color-good)" : undefined,
                      }}
                    >
                      {r.right}/{r.asked}
                    </span>
                  </dd>
                </div>
              );
            })}
          </dl>
          <p className="mt-3 px-1 text-xs leading-relaxed text-ink-3">
            {runs.filter((r) => r.week === week.id).length} sittings recorded
            for this week. Nothing here is ever overwritten — a bad run stays
            in the trail, which is the only way the good ones mean anything.
          </p>
        </section>
      )}

      <Link
        href="/me"
        prefetch={LINK_PREFETCH}
        onClick={tap}
        className="btn btn-quiet mt-2 w-full text-sm"
      >
        Done for now
      </Link>
    </>
  );
}

/** Best score for a section, with how many runs it took and the movement. */
function Mark({
  best,
  n,
  gain,
}: {
  best: number | null;
  n: number;
  gain: number | null;
}) {
  if (best === null) {
    return <span className="shrink-0 text-sm text-ink-3">not yet</span>;
  }
  return (
    <span className="shrink-0 text-right">
      <span
        className="block text-base font-semibold tnum"
        style={{ color: best >= PASS ? "var(--color-good)" : undefined }}
      >
        {best}%
      </span>
      <span className="block text-xs text-ink-3 tnum">
        {n} {n === 1 ? "run" : "runs"}
        {gain !== null && (
          <span
            style={{
              color:
                gain > 0
                  ? "var(--color-good)"
                  : gain < 0
                    ? "var(--color-bad)"
                    : undefined,
            }}
          >
            {" "}
            {gain > 0 ? "+" : gain < 0 ? "−" : "±"}
            {Math.abs(gain)}
          </span>
        )}
      </span>
    </span>
  );
}
