"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LINES, LAST_SEEDED_DAY } from "@/lib/lines";
import { cardId, dayNumber, intakeFor, PLANNED_INTAKE, hasStarted } from "@/lib/programme";
import { penaltyActive, repairLines } from "@/lib/assessment";
import { freshLines } from "@/lib/queue";
import { emptyDay, weekdayIndex } from "@/lib/plan";
import { isDue, newCard, review, GOOD } from "@/lib/srs";
import { update, useStore } from "@/lib/store";
import { nowMs, useToday } from "@/lib/clock";
import { LINK_PREFETCH } from "@/lib/base-path";
import { success, tap } from "@/lib/feedback";
import LineAudio from "@/components/LineAudio";
import Phonetic from "@/components/Phonetic";

/**
 * §3 block 1. Today's lines, introduced one at a time.
 *
 * Introduction is not a test: the trainee has never seen the line, so there is
 * nothing to grade. Working through a line seeds its Listen card, and the
 * review queue takes it from there — which is exactly what §4's staging says.
 */
export default function LearnPage() {
  const { data, ready } = useStore();
  const today = useToday();
  const [set, setSet] = useState<typeof LINES | null>(null);
  const [i, setI] = useState(0);
  const [shown, setShown] = useState(false);

  const startedOn = data.plan.startedOn ?? today;
  const day = today && startedOn ? dayNumber(startedOn, today) : 1;

  useEffect(() => {
    if (!ready || set || !today) return;

    const issued = LINES.filter((l) => l.day <= day);
    const backlog = issued.reduce((n, l) => {
      const c = data.srs[cardId(l.id, "read")];
      return n + (c && isDue(c, nowMs()) ? 1 : 0);
    }, 0);
    const taken = data.assessments ?? [];
    const intake = intakeFor(
      backlog,
      1,
      weekdayIndex(today) === 6,
      PLANNED_INTAKE,
      penaltyActive(taken, today),
    );

    // §6 — repair first: a word missed in an assessment outranks new ground.
    const failed = [...taken].reverse().find((a) => !a.cleared);
    const repair = failed
      ? repairLines(failed.missed, LINES, day, Math.ceil(intake.count / 3))
      : [];
    const fresh = freshLines(LINES, data.srs, Math.min(day, LAST_SEEDED_DAY));

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSet([...repair, ...fresh].slice(0, intake.count));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, today]);

  const line = set?.[i];

  /**
   * Seeds Listen with a first pass. GOOD rather than a self-grade: the trainee
   * has just been shown the answer, so any grade they gave would measure
   * nothing but their honesty about a card they cannot yet have forgotten.
   */
  function next() {
    if (!line) return;
    tap();
    const at = nowMs();
    const id = cardId(line.id, "listen");
    update((d) => ({
      ...d,
      srs: { ...d.srs, [id]: review(d.srs[id] ?? newCard(at), GOOD, at) },
    }));
    setShown(false);
    setI((n) => n + 1);
  }

  function finish() {
    if (!today) return;
    success();
    update((d) => {
      const prev = d.plan.days[today] ?? emptyDay();
      return {
        ...d,
        plan: {
          ...d.plan,
          startedOn: d.plan.startedOn ?? today,
          days: {
            ...d.plan.days,
            [today]: { ...prev, blocks: { ...prev.blocks, vocab: true } },
          },
        },
      };
    });
  }

  // A bookmark or a stale tab must not start the programme early: issuing a
  // line here would stamp today as day 1 behind the trainee's back.
  if (ready && today && !hasStarted(data.plan.startedOn, today)) {
    return (
      <div className="py-6">
        <p className="eyebrow">Not started</p>
        <h1 className="mt-1 text-lg leading-tight font-semibold">
          {data.plan.startedOn ? `Day 1 is ${data.plan.startedOn}` : "Day 1 is not set"}
        </h1>
        <p className="mt-3 text-base leading-snug text-ink-2">
          Nothing is issued until the programme begins.
        </p>
        <Link
          href="/"
          prefetch={LINK_PREFETCH}
          onClick={tap}
          className="btn btn-primary mt-6 w-full"
        >
          Back to today
        </Link>
      </div>
    );
  }

  if (!ready || !set) {
    return <p className="py-10 text-center text-sm text-ink-3">Loading…</p>;
  }

  if (!line) {
    const rest = today ? weekdayIndex(today) === 6 : false;
    return (
      <div className="py-6">
        <p className="eyebrow">Block 1 · New lines</p>
        <h1 className="mt-1 text-lg leading-tight font-semibold">
          {set.length === 0
            ? rest
              ? "No new lines today"
              : "Nothing new left today"
            : "Lines issued"}
        </h1>
        <p className="mt-3 text-base leading-snug text-ink-2">
          {set.length === 0
            ? rest
              ? "Sunday issues nothing new. Clear the review queue instead."
              : "Today's lines are already in the queue. Block 5 reviews them."
            : `${set.length} lines issued. They are in the review queue now.`}
        </p>
        <Link
          href="/"
          prefetch={LINK_PREFETCH}
          onClick={() => {
            if (set.length > 0) finish();
            else tap();
          }}
          className="btn btn-primary mt-6 w-full"
        >
          Back to today
        </Link>
      </div>
    );
  }

  return (
    <div>
      <header className="mb-6 flex items-baseline justify-between">
        <div>
          <p className="eyebrow">Block 1 · New lines</p>
          <h1 className="mt-1 text-lg leading-tight font-semibold">
            Hear it, then read it
          </h1>
        </div>
        <span className="text-sm text-ink-3 tnum">
          {i + 1}/{set.length}
        </span>
      </header>

      <div className="panel flex flex-col items-center justify-center rounded-2xl px-5 py-9 text-center">
        <p
          className="heb text-[30px] leading-snug"
          style={{ fontFamily: "var(--font-hebrew)" }}
        >
          {line.he}
        </p>
        <Phonetic line={line} className="mt-3" />
        <div className="mt-5 flex justify-center">
          <LineAudio lineId={line.id} showNatural />
        </div>

        {!shown ? (
          <button
            onClick={() => {
              tap();
              setShown(true);
            }}
            className="btn btn-secondary mt-7"
          >
            What does it mean?
          </button>
        ) : (
          <div className="anim-fade mt-7 w-full border-t border-line pt-6">
            <p className="text-base leading-snug text-ink-2">
              {data.settings.gloss === "fr" ? line.fr : line.en}
            </p>
          </div>
        )}
      </div>

      <button
        onClick={next}
        disabled={!shown}
        className="btn btn-primary mt-4 w-full"
      >
        {i + 1 === set.length ? "Finish block" : "Next line"}
      </button>

      <p className="mt-4 text-center text-xs leading-relaxed text-ink-3">
        Play it slowly before you read it. The ear goes first — that is the
        whole point of the staging.
      </p>
    </div>
  );
}

