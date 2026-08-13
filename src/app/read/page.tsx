"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  LEVELS,
  LIBRARY,
  bestWpm,
  nextPassage,
  rungForLevel,
  textFor,
  unlockedThrough,
  wordCount,
  wpm,
  type Passage,
} from "@/lib/reading";
import { update, useStore } from "@/lib/store";
import { nowMs, useToday } from "@/lib/clock";
import { LINK_PREFETCH } from "@/lib/base-path";
import { success, tap } from "@/lib/feedback";

type Phase = "brief" | "reading" | "check" | "done";

/**
 * §8c — reading, on a clock.
 *
 * Deliberately outside the programme. The five blocks teach lines; this is
 * where you read a paragraph, and no number of single sentences adds up to
 * that. It is also the only place speed is measured, because an SRS card has
 * no length and so can never tell you how fast you read.
 *
 * The clock runs from Start to Done and nothing else is timed, so the number
 * means what it says. Comprehension is self-reported against the translation:
 * generating real questions from this corpus would produce bad ones, and a
 * bad comprehension check is worse than an honest self-check.
 */
export default function ReadPage() {
  const { data, ready } = useStore();
  const today = useToday();
  const [phase, setPhase] = useState<Phase>("brief");
  const [current, setCurrent] = useState<Passage | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const startedAt = useRef(0);

  const done = data.reading ?? {};
  const open = unlockedThrough(done);
  const upNext = current ?? nextPassage(done);
  const best = bestWpm(done);
  const finished = Object.values(done).filter((d) => d.understood).length;

  function begin(p: Passage) {
    tap();
    setCurrent(p);
    setPhase("reading");
    startedAt.current = nowMs();
  }

  function stop() {
    tap();
    setElapsed(nowMs() - startedAt.current);
    setPhase("check");
  }

  function record(understood: boolean) {
    if (!current || !today) return;
    if (understood) success();
    else tap();
    const speed = wpm(wordCount(current), elapsed);
    update((d) => ({
      ...d,
      reading: {
        ...(d.reading ?? {}),
        [current.id]: { wpm: speed, understood, on: today },
      },
    }));
    setPhase("done");
  }

  if (!ready) {
    return <p className="py-10 text-center text-sm text-ink-3">Loading…</p>;
  }

  /* --- nothing left ------------------------------------------------------- */

  if (!upNext && phase === "brief") {
    return (
      <div className="py-6">
        <p className="eyebrow">Reading</p>
        <h1 className="mt-1 text-lg leading-tight font-semibold">
          Library finished
        </h1>
        <p className="mt-3 text-base leading-snug text-ink-2">
          All {LIBRARY.length} passages read and followed. Best speed{" "}
          {best} words a minute.
        </p>
        <Back />
      </div>
    );
  }

  /* --- the brief ---------------------------------------------------------- */

  if (phase === "brief" && upNext) {
    const rung = rungForLevel(upNext.level);
    return (
      <div className="py-2">
        <p className="eyebrow">Timed reading · level {upNext.level} of {LEVELS.length}</p>
        <h1 className="mt-1 text-lg leading-tight font-semibold">
          Read it once, at speed
        </h1>
        <p className="mt-4 text-base leading-snug text-ink-2">
          Read straight through without stopping to decode. The clock runs from
          Start to Done, so it measures reading and nothing else.
        </p>

        <dl className="mt-6 mb-7 flex flex-col">
          <Fact k="Words" v={String(wordCount(upNext))} />
          <Fact
            k="Vowels"
            v={rung === "full" ? "all" : rung === "partial" ? "reduced" : "none"}
          />
          <Fact k="Passages read" v={`${finished} of ${LIBRARY.length}`} />
          <Fact k="Best so far" v={best ? `${best} wpm` : "—"} last />
        </dl>

        <button onClick={() => begin(upNext)} className="btn btn-primary w-full">
          Start
        </button>
        <Back quiet />
      </div>
    );
  }

  /* --- the read ----------------------------------------------------------- */

  if (phase === "reading" && current) {
    return (
      <div className="flex flex-col">
        <header className="mb-4 flex items-baseline justify-between">
          <p className="eyebrow">Level {current.level} · {current.theme}</p>
          <span className="text-sm text-ink-3 tnum">
            {wordCount(current)} words
          </span>
        </header>

        <div className="panel rounded-2xl px-4 py-5">
          {textFor(current).map((line, i) => (
            <p
              key={i}
              dir="rtl"
              className="heb mb-3 text-right text-[24px] leading-[1.85]"
              style={{ fontFamily: "var(--font-hebrew)" }}
            >
              {line}
            </p>
          ))}
        </div>

        {/* No translation on screen: reading it would be reading French. */}
        <div
          className="sticky mt-4 pt-4 pb-3"
          style={{
            bottom: "calc(var(--safe-b) + var(--tabbar-h) + 8px)",
            marginInline: "calc(var(--gutter) * -1)",
            paddingInline: "var(--gutter)",
            background:
              "linear-gradient(to top, var(--color-canvas) 70%, transparent)",
          }}
        >
          <button onClick={stop} className="btn btn-primary w-full">
            Done
          </button>
        </div>
      </div>
    );
  }

  /* --- did you follow it? ------------------------------------------------- */

  if (phase === "check" && current) {
    const speed = wpm(wordCount(current), elapsed);
    return (
      <div className="py-2">
        <p className="eyebrow">Level {current.level}</p>
        <h1 className="mt-1 text-lg leading-tight font-semibold">
          {speed} words a minute
        </h1>
        <p className="mt-3 text-base leading-snug text-ink-2">
          Now read the translation. Did you follow the Hebrew — not word by
          word, but the sense of it?
        </p>

        <div className="panel mt-5 rounded-2xl px-4 py-4">
          {current.sentences.map((s, i) => (
            <p key={i} className="mb-2 text-sm leading-snug text-ink-2">
              {s.fr}
            </p>
          ))}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <button onClick={() => record(false)} className="btn btn-secondary">
            Not really
          </button>
          <button onClick={() => record(true)} className="btn btn-primary">
            Yes
          </button>
        </div>
        <p className="mt-4 text-center text-xs leading-relaxed text-ink-3">
          Only a passage you followed counts toward the next level. Speed
          without comprehension is scrolling.
        </p>
      </div>
    );
  }

  /* --- after ------------------------------------------------------------- */

  const log = current ? done[current.id] : undefined;
  return (
    <div className="py-6">
      <p className="eyebrow">Reading</p>
      <h1 className="mt-1 text-lg leading-tight font-semibold">
        {log?.understood ? "Logged" : "Come back to it"}
      </h1>
      <p className="mt-3 text-base leading-snug text-ink-2">
        {log?.understood
          ? `${log.wpm} words a minute. ${finished} of ${LIBRARY.length} passages read.`
          : "It stays in the queue until you follow it. Slower is fine."}
      </p>
      <button
        onClick={() => {
          tap();
          setCurrent(null);
          setPhase("brief");
        }}
        className="btn btn-primary mt-6 w-full"
      >
        Next passage
      </button>
      <Back quiet />
      <p className="mt-4 text-center text-xs text-ink-3">
        Level {open} of {LEVELS.length} open
      </p>
    </div>
  );
}

function Back({ quiet }: { quiet?: boolean }) {
  return (
    <Link
      href="/me"
      prefetch={LINK_PREFETCH}
      onClick={tap}
      className={`btn ${quiet ? "btn-quiet" : "btn-primary"} mt-2 w-full text-sm`}
    >
      Done for now
    </Link>
  );
}

function Fact({ k, v, last }: { k: string; v: string; last?: boolean }) {
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
