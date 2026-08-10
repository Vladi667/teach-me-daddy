"use client";

import Link from "next/link";
import { LINES, LAST_SEEDED_DAY, linesForDay } from "@/lib/lines";
import {
  DEPLOY_AT,
  MASTERY_DAYS,
  PROGRAMME_DAYS,
  cardId,
  dayNumber,
  intakeFor,
  project,
  readiness,
  retentionRate,
} from "@/lib/programme";
import {
  BLOCKS,
  coverageFor,
  dayMinutes,
  emptyDay,
  weekdayIndex,
} from "@/lib/plan";
import { isDue, isMature } from "@/lib/srs";
import { update, useStore } from "@/lib/store";
import { useNow, useToday } from "@/lib/clock";
import { LINK_PREFETCH } from "@/lib/base-path";
import { tap } from "@/lib/feedback";
import LineAudio from "@/components/LineAudio";

/** Blocks the app runs itself, in order. Immersion is logged, not run. */
const RUNNABLE: Record<string, string | null> = {
  vocab: "/study",
  shadow: null, // no voice yet — PROGRAMME.md §14
  speak: null,
  immerse: null,
  consolidate: "/study",
};

export default function TodayPage() {
  const { data, ready } = useStore();
  const now = useNow();
  const today = useToday();

  const startedOn = data.plan.startedOn ?? today;
  const day = today && startedOn ? dayNumber(startedOn, today) : 1;
  const isRest = today ? weekdayIndex(today) === 6 : false;

  // Scheduling state for the lines issued so far.
  const issued = LINES.filter((l) => l.day <= day);
  const backlog = issued.reduce((n, l) => {
    const c = data.srs[cardId(l.id, "read")];
    return n + (c && isDue(c, now) ? 1 : 0);
  }, 0);
  const mastered = issued.filter((l) => {
    const c = data.srs[cardId(l.id, "read")];
    return c && isMature(c);
  }).length;

  const recent = Object.values(data.srs)
    .filter((c) => c.reps > 0)
    .slice(-60)
    .map((c) => ({ correct: c.lapses === 0 }));
  const intake = intakeFor(backlog, retentionRate(recent), isRest);

  const log = today ? data.plan.days[today] : undefined;
  const doneBlocks = BLOCKS.filter((b) => log?.blocks[b.id]).length;
  const minutes = dayMinutes(log);

  const loggedDays = Object.keys(data.plan.days).length;
  const proj =
    today && startedOn ? project(startedOn, loggedDays, today) : null;

  const words = new Set(issued.flatMap((l) => l.words)).size;
  const score = readiness({
    masteredLines: mastered,
    totalLines: LINES.length,
    coverage: coverageFor(words + (data.plan.wordsElsewhere ?? 0)),
    assessmentsCleared: 0,
    assessmentsDue: Math.floor(day / 28),
  });

  const beyondSeed = day > LAST_SEEDED_DAY;
  const todaysLines = linesForDay(Math.min(day, LAST_SEEDED_DAY));

  // The first block that isn't finished is the one being ordered.
  const currentIdx = BLOCKS.findIndex((b) => !log?.blocks[b.id]);

  /** Blocks 3 and 4 happen away from the phone, so logging is part of the
      assignment, not an admin screen you go and find. */
  function toggleBlock(id: string) {
    if (!today) return;
    tap();
    update((d) => {
      const prev = d.plan.days[today] ?? emptyDay();
      return {
        ...d,
        plan: {
          ...d.plan,
          startedOn: d.plan.startedOn ?? today,
          days: {
            ...d.plan.days,
            [today]: {
              ...prev,
              blocks: { ...prev.blocks, [id]: !prev.blocks[id] },
            },
          },
        },
      };
    });
  }

  return (
    <>
      <header className="mb-6 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="eyebrow">
            Day {ready ? day : "—"} of {PROGRAMME_DAYS}
          </p>
          <h1 className="mt-1 text-lg leading-tight font-semibold tracking-[-0.02em]">
            {isRest ? "Review and rest" : "Today's assignment"}
          </h1>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-xl leading-none font-semibold tnum">
            {ready ? score : 0}
            <span className="text-sm font-normal text-ink-3">%</span>
          </div>
          <div className="mt-1 text-xs text-ink-3">readiness</div>
        </div>
      </header>

      {/* The order, in one line. */}
      <p className="mb-6 text-base leading-snug text-ink-2">
        {isRest
          ? "No new lines today. Clear everything overdue."
          : `${intake.count} new lines, ${backlog} to review.`}
        {intake.reason === "backlog" && (
          <span className="text-warn">
            {" "}
            Intake cut: clear the backlog first.
          </span>
        )}
        {intake.reason === "retention" && (
          <span className="text-warn">
            {" "}
            Intake halved: accuracy below 85%.
          </span>
        )}
      </p>

      <h2 className="eyebrow mb-1">Blocks</h2>
      <ol className="mb-7 flex flex-col">
        {BLOCKS.map((b, i) => {
          const done = !!log?.blocks[b.id];
          const current = i === currentIdx;
          const href = RUNNABLE[b.id];
          return (
            <li
              key={b.id}
              className="flex items-center gap-3 py-3"
              style={{
                borderBottom:
                  i === BLOCKS.length - 1
                    ? "none"
                    : "1px solid var(--color-line)",
                opacity: current || done ? 1 : 0.55,
              }}
            >
              <button
                onClick={() => toggleBlock(b.id)}
                aria-pressed={done}
                aria-label={`${b.label}: mark ${done ? "not done" : "done"}`}
                className="tap grid size-[26px] shrink-0 place-items-center rounded-md text-xs font-semibold tnum"
                style={{
                  background: done ? "var(--color-accent)" : "transparent",
                  border: done
                    ? "none"
                    : `1.5px solid ${current ? "var(--color-accent)" : "var(--color-line-strong)"}`,
                  color: done
                    ? "var(--color-accent-ink)"
                    : current
                      ? "var(--color-accent)"
                      : "var(--color-ink-3)",
                }}
              >
                {done ? (
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m5 13 4.5 4.5L19 7" />
                  </svg>
                ) : (
                  i + 1
                )}
              </button>

              <span className="min-w-0 flex-1">
                <span
                  className="block text-base"
                  style={{
                    color: done ? "var(--color-ink-3)" : "var(--color-ink)",
                  }}
                >
                  {b.label}
                </span>
                <span className="block truncate text-sm text-ink-3">
                  {href === null && !done ? "Do it, then tick it" : b.goal}
                </span>
              </span>

              {href && current && !done ? (
                <Link
                  href={href}
                  prefetch={LINK_PREFETCH}
                  onClick={tap}
                  className="btn btn-primary shrink-0 text-sm"
                  style={{ minHeight: 34, paddingInline: "0.875rem" }}
                >
                  Start
                </Link>
              ) : (
                <span className="shrink-0 text-sm text-ink-3 tnum">
                  {b.minutes}m
                </span>
              )}
            </li>
          );
        })}
      </ol>

      {/* Today's material, so the assignment is visible before it's run. */}
      {!isRest && todaysLines.length > 0 && (
        <>
          <h2 className="eyebrow mb-1">
            New today{beyondSeed ? " · repeating the last seeded day" : ""}
          </h2>
          <ul className="mb-7 flex flex-col">
            {todaysLines.slice(0, intake.count).map((l, i, arr) => (
              <li
                key={l.id}
                className="py-3"
                style={{
                  borderBottom:
                    i === arr.length - 1
                      ? "none"
                      : "1px solid var(--color-line)",
                }}
              >
                <div className="flex items-start gap-3">
                  <span className="min-w-0 flex-1">
                    <span className="heb block text-md leading-snug">
                      {l.he}
                    </span>
                    <span className="mt-1 block text-sm text-ink-3">
                      {data.settings.gloss === "fr" ? l.fr : l.en}
                    </span>
                  </span>
                  <LineAudio lineId={l.id} showNatural />
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {/* Standing, stated plainly. */}
      <h2 className="eyebrow mb-1">Standing</h2>
      <dl className="mb-6 flex flex-col">
        <Fact
          k="Lines mastered"
          v={`${mastered} of ${LINES.length}`}
          note={`${MASTERY_DAYS}-day interval`}
        />
        <Fact k="Words carried" v={String(words)} />
        <Fact
          k="Logged today"
          v={`${doneBlocks} of ${BLOCKS.length} blocks`}
          note={minutes ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : undefined}
        />
        {proj && (
          <Fact
            k="Projected deployment"
            v={proj.deployOn}
            note={
              proj.slippage > 0 ? `${proj.slippage} days behind` : "on schedule"
            }
            warn={proj.slippage > 0}
            last
          />
        )}
      </dl>

      <p className="text-xs leading-relaxed text-ink-3">
        Deployment at {DEPLOY_AT}% readiness with every assessment cleared.
        Shadowing and production are not yet issued: they need a recorded voice.
      </p>
    </>
  );
}

function Fact({
  k,
  v,
  note,
  warn,
  last,
}: {
  k: string;
  v: string;
  note?: string;
  warn?: boolean;
  last?: boolean;
}) {
  return (
    <div
      className="flex items-baseline justify-between gap-4 py-2.5"
      style={{ borderBottom: last ? "none" : "1px solid var(--color-line)" }}
    >
      <dt className="text-base text-ink-2">{k}</dt>
      <dd className="text-right">
        <span className="text-base font-semibold tnum">{v}</span>
        {note && (
          <span
            className="ml-2 text-xs"
            style={{ color: warn ? "var(--color-warn)" : "var(--color-ink-3)" }}
          >
            {note}
          </span>
        )}
      </dd>
    </div>
  );
}
