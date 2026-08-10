"use client";

import { useState } from "react";
import Ring from "@/components/Ring";
import {
  BLOCKS,
  COVERAGE,
  DAILY_MINUTES,
  NEW_WORDS_CAP,
  ROADMAP,
  RULES,
  TARGET_HOURS_PER_MONTH,
  TARGET_LISTENING_MIN,
  TARGET_SPEAKING_MIN,
  WEEK_FOCUS,
  coverageFor,
  dayMinutes,
  emptyDay,
  fmtNum,
  minutesInMonth,
  monthFor,
  shiftDay,
  streak,
  weekdayIndex,
  type DayLog,
} from "@/lib/plan";
import { isMature } from "@/lib/srs";
import { useStore } from "@/lib/store";
import { tap } from "@/lib/feedback";
import { useNow, useToday } from "@/lib/clock";

export default function PlanPage() {
  const { data, ready, update } = useStore();
  const clock = useNow();
  const today = useToday();
  // Null until hydration, so nothing date-derived reaches the prerendered HTML.
  const [picked, setPicked] = useState<string | null>(null);
  const day = picked ?? today;
  const [showRules, setShowRules] = useState(false);

  const plan = data.plan;
  const log: DayLog = (day ? plan.days[day] : undefined) ?? emptyDay();
  const done = dayMinutes(log);
  const run = ready && today ? streak(plan, today) : 0;

  const matureInApp = Object.values(data.srs).filter(isMature).length;
  const words = matureInApp + (plan.wordsElsewhere ?? 0);
  const coverage = coverageFor(words);
  const month = monthFor(words);

  const ref = new Date(clock || 0);
  const monthMinutes = minutesInMonth(plan, ref.getFullYear(), ref.getMonth());
  const monthHours = monthMinutes / 60;

  const isToday = !!day && day === today;

  function patchDay(fn: (d: DayLog) => DayLog) {
    if (!day) return;
    update((d) => ({
      ...d,
      plan: {
        ...d.plan,
        startedOn: d.plan.startedOn ?? today ?? undefined,
        days: { ...d.plan.days, [day]: fn(d.plan.days[day] ?? emptyDay()) },
      },
    }));
  }

  const toggleBlock = (id: string) => {
    tap();
    patchDay((l) => ({ ...l, blocks: { ...l.blocks, [id]: !l.blocks[id] } }));
  };

  const bump = (field: "listening" | "speaking", delta: number) => {
    tap();
    patchDay((l) => ({ ...l, [field]: Math.max(0, l[field] + delta) }));
  };

  return (
    <>
      <header className="mb-4 flex items-baseline justify-between">
        <h1 className="text-lg font-bold tracking-[-0.03em]">Plan</h1>
        <span className="text-sm text-ink-3">
          {run} day{run === 1 ? "" : "s"} unbroken
        </span>
      </header>

      {/* today ------------------------------------------------------------ */}
      <section className="panel  mb-3 rounded-2xl p-4">
        <div className="mb-3 flex items-center justify-between">
          <button
            onClick={() => {
              tap();
              setPicked((d) => shiftDay(d ?? today!, -1));
            }}
            aria-label="Previous day"
            className="tap grid size-9 place-items-center rounded-full bg-surface"
          >
            <Chevron dir="left" />
          </button>
          <div className="text-center">
            <div className="text-base font-semibold">
              {day ? (isToday ? "Today" : day) : ""}
            </div>
            <div className="text-xs text-ink-3">
              {day ? WEEK_FOCUS[weekdayIndex(day)].day : ""} ·{""}
              {Math.round(done / 60)}h{done % 60 ? ` ${done % 60}m` : ""} of{""}
              {Math.round(DAILY_MINUTES / 60)}h
            </div>
          </div>
          <button
            onClick={() => {
              tap();
              setPicked((d) => {
                const cur = d ?? today!;
                return cur === today ? cur : shiftDay(cur, 1);
              });
            }}
            disabled={isToday}
            aria-label="Next day"
            className="tap grid size-9 place-items-center rounded-full bg-surface"
            style={{ opacity: isToday ? 0.3 : 1 }}
          >
            <Chevron dir="right" />
          </button>
        </div>

        <p className="mb-3 rounded-lg bg-surface px-3.5 py-2.5 text-sm leading-snug text-ink-2">
          {day ? WEEK_FOCUS[weekdayIndex(day)].focus : ""}
        </p>

        <div className="flex flex-col gap-2">
          {BLOCKS.map((b) => {
            const on = !!log.blocks[b.id];
            return (
              <button
                key={b.id}
                onClick={() => toggleBlock(b.id)}
                className="tap flex items-center gap-3 rounded-xl px-3 py-2.5 text-left"
                style={{
                  background: on
                    ? "color-mix(in oklch, var(--color-good) 12%, transparent)"
                    : "var(--color-surface)",
                  border: `1px solid ${on ? "color-mix(in oklch, var(--color-good) 35%, transparent)" : "var(--color-surface)"}`,
                }}
              >
                <span
                  className="grid size-5 shrink-0 place-items-center rounded-full"
                  style={{
                    background: on ? "var(--color-good)" : "transparent",
                    border: on ? "none" : "1.5px solid rgba(255,255,255,0.25)",
                  }}
                >
                  {on && (
                    <svg
                      width="11"
                      height="11"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#04140c"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m5 13 4.5 4.5L19 7" />
                    </svg>
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{b.label}</span>
                  <span className="block truncate text-xs text-ink-3">
                    {b.goal}
                  </span>
                </span>
                <span className="shrink-0 text-xs tnum text-ink-3">
                  {b.minutes}m
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2.5">
          <Counter
            label="Listening"
            value={log.listening}
            target={TARGET_LISTENING_MIN}
            onBump={(d) => bump("listening", d)}
          />
          <Counter
            label="Speaking"
            value={log.speaking}
            target={TARGET_SPEAKING_MIN}
            onBump={(d) => bump("speaking", d)}
          />
        </div>
      </section>

      {/* coverage --------------------------------------------------------- */}
      <section className="panel  mb-3 rounded-2xl p-5">
        <div className="flex items-center gap-5">
          <Ring value={coverage / 100} size={92} stroke={8}>
            <div className="text-center leading-none">
              <div className="text-lg font-bold tracking-[-0.04em]">
                {Math.round(coverage)}
                <span className="text-xs">%</span>
              </div>
              <div className="mt-0.5 text-[9px] text-ink-3">covered</div>
            </div>
          </Ring>
          <div className="min-w-0">
            <div className="text-base font-semibold">{fmtNum(words)} words</div>
            <p className="mt-1 text-sm leading-snug text-ink-2">
              Month {month.n} — {month.title}. Target{""}
              {fmtNum(month.to)} by the end.
            </p>
            <p className="mt-1.5 text-xs text-ink-3">
              {matureInApp} mature here
              {plan.wordsElsewhere > 0 &&
                ` + ${fmtNum(plan.wordsElsewhere)} elsewhere`}
            </p>
          </div>
        </div>

        {/* the §1 curve */}
        <div className="mt-4 flex h-16 items-end gap-1.5">
          {COVERAGE.map((c) => {
            const reached = words >= c.words;
            return (
              <div
                key={c.words}
                className="flex flex-1 flex-col items-center gap-1"
              >
                <div
                  className="w-full rounded-t-[4px]"
                  style={{
                    height: `${c.pct * 0.52}px`,
                    background: reached
                      ? "var(--color-accent)"
                      : "rgba(255,255,255,0.09)",
                  }}
                />
                <span className="text-[8.5px] text-ink-3">
                  {c.words >= 1000 ? `${c.words / 1000}k` : c.words}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-3 flex items-center justify-between rounded-lg bg-surface px-3.5 py-2.5">
          <span className="text-xs text-ink-3">Words learned elsewhere</span>
          <div className="flex items-center gap-2">
            {[-100, -10, 10, 100].map((d) => (
              <button
                key={d}
                onClick={() => {
                  tap();
                  update((s) => ({
                    ...s,
                    plan: {
                      ...s.plan,
                      wordsElsewhere: Math.max(
                        0,
                        (s.plan.wordsElsewhere ?? 0) + d,
                      ),
                    },
                  }));
                }}
                className="tap rounded-full bg-surface-2 px-2 py-1 text-xs font-semibold tnum"
              >
                {d > 0 ? `+${d}` : d}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* month pace ------------------------------------------------------- */}
      <section className="mb-3 grid grid-cols-2 gap-3">
        <Stat
          value={`${monthHours.toFixed(0)}h`}
          label={`this month · ${TARGET_HOURS_PER_MONTH}h target`}
          ratio={monthHours / TARGET_HOURS_PER_MONTH}
        />
        <Stat
          value={`${run}`}
          label="day streak · zero missed days"
          ratio={Math.min(1, run / 30)}
        />
      </section>

      {/* roadmap ---------------------------------------------------------- */}
      <section className="mb-3">
        <h2 className="mb-2.5 px-1 text-sm font-semibold text-ink-3">
          Five months
        </h2>
        <div className="flex flex-col gap-2">
          {ROADMAP.map((m) => {
            const current = m.n === month.n;
            const passed = words >= m.to;
            return (
              <div
                key={m.n}
                className="panel rounded-xl p-3.5"
                style={{
                  borderColor: current
                    ? "color-mix(in oklch, var(--color-accent) 45%, transparent)"
                    : undefined,
                  opacity: passed ? 0.55 : 1,
                }}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="grid size-6 shrink-0 place-items-center rounded-full text-xs font-bold"
                    style={{
                      background: passed
                        ? "var(--color-good)"
                        : current
                          ? "var(--color-accent)"
                          : "var(--color-surface)",
                      color: passed ? "#04140c" : "var(--color-ink)",
                    }}
                  >
                    {m.n}
                  </span>
                  <span className="flex-1 text-sm font-semibold">
                    {m.title}
                  </span>
                  <span className="text-xs tnum text-ink-3">
                    {fmtNum(m.from)}–{fmtNum(m.to)} ·{""}
                    {m.coverage}
                  </span>
                </div>
                {current && (
                  <ul className="mt-2.5 flex flex-col gap-1.5 pl-8.5">
                    {m.bullets.map((b) => (
                      <li key={b} className="text-xs leading-snug text-ink-2">
                        {b}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* rules ------------------------------------------------------------ */}
      <button
        onClick={() => {
          tap();
          setShowRules((s) => !s);
        }}
        className="panel tap mb-3 flex w-full items-center justify-between rounded-xl px-4 py-3.5"
      >
        <span className="text-sm font-semibold">The golden rules</span>
        <span
          className="text-ink-3 transition-transform duration-300"
          style={{ transform: showRules ? "rotate(90deg)" : "none" }}
        >
          <Chevron dir="right" />
        </span>
      </button>

      {showRules && (
        <ol className="anim-fade mb-3 flex flex-col gap-2">
          {RULES.map((r, i) => (
            <li
              key={r}
              className="panel flex gap-3 rounded-xl px-4 py-3 text-sm leading-relaxed text-ink-2"
            >
              <span className="shrink-0 font-bold text-accent">{i + 1}</span>
              {r}
            </li>
          ))}
        </ol>
      )}

      <p className="px-1 text-center text-xs leading-relaxed text-ink-3">
        New cards are capped at {NEW_WORDS_CAP}/day. Past that, retention
        collapses because review can&apos;t keep up.
      </p>
    </>
  );
}

function Counter({
  label,
  value,
  target,
  onBump,
}: {
  label: string;
  value: number;
  target: number;
  onBump: (delta: number) => void;
}) {
  const hit = value >= target;
  return (
    <div className="rounded-xl bg-surface px-3 py-2.5">
      <div className="flex items-baseline justify-between">
        <span className="text-xs text-ink-3">{label}</span>
        <span
          className="text-sm font-bold tnum"
          style={{ color: hit ? "var(--color-good)" : "var(--color-ink)" }}
        >
          {value}
          <span className="text-xs font-normal text-ink-3">/{target}m</span>
        </span>
      </div>
      <div className="mt-2 flex gap-1.5">
        {[-15, 15, 45].map((d) => (
          <button
            key={d}
            onClick={() => onBump(d)}
            className="tap flex-1 rounded-full bg-surface-2 py-1.5 text-xs font-semibold tnum"
          >
            {d > 0 ? `+${d}` : d}
          </button>
        ))}
      </div>
    </div>
  );
}

function Stat({
  value,
  label,
  ratio,
}: {
  value: string;
  label: string;
  ratio: number;
}) {
  return (
    <div className="panel rounded-xl px-4 py-3.5">
      <div className="text-lg font-bold tracking-[-0.03em] tnum">{value}</div>
      <div className="mt-0.5 text-xs leading-snug text-ink-3">{label}</div>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-surface-2">
        <div
          className="h-full rounded-full"
          style={{
            width: `${Math.min(100, Math.max(0, ratio * 100))}%`,
            background: "var(--color-accent)",
          }}
        />
      </div>
    </div>
  );
}

function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transform: dir === "left" ? "rotate(180deg)" : undefined }}
    >
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}
