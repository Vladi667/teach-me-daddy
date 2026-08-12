"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LINES } from "@/lib/lines";
import { cardId, dayNumber, hasStarted } from "@/lib/programme";
import { stageCards, type StageCard } from "@/lib/queue";
import { atRung, rungFor } from "@/lib/nikud";
import { emptyDay } from "@/lib/plan";
import {
  AGAIN,
  GOOD,
  GRADES,
  buildQueue,
  newCard,
  previewInterval,
  review,
  type Grade,
} from "@/lib/srs";
import { update, useStore } from "@/lib/store";
import { nowMs, useNow, useToday } from "@/lib/clock";
import { LINK_PREFETCH } from "@/lib/base-path";
import { error as buzz, success, tap } from "@/lib/feedback";
import LineAudio from "@/components/LineAudio";
import Phonetic from "@/components/Phonetic";
import SwipeCard from "@/components/SwipeCard";

/**
 * §3 block 5. Everything due, across all three stages of §4.
 *
 * There is no mode picker and no deck to choose from: the queue is whatever
 * the schedule says, in the order the schedule says. That is the difference
 * between a programme and a flashcard app.
 */
export default function ReviewPage() {
  const { data, ready } = useStore();
  const now = useNow();
  const today = useToday();
  const [queue, setQueue] = useState<StageCard[] | null>(null);
  const [i, setI] = useState(0);
  const [shown, setShown] = useState(false);
  const [done, setDone] = useState(0);

  const startedOn = data.plan.startedOn ?? today;
  const day = today && startedOn ? dayNumber(startedOn, today) : 1;

  useEffect(() => {
    if (!ready || queue) return;
    const cards = stageCards(LINES, data.srs, day);
    // Nothing new is admitted here: block 1 issues, block 5 consolidates.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQueue(buildQueue(cards, data.srs, nowMs(), 0).queue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const card = queue?.[i];

  function grade(g: Grade) {
    if (!card) return;
    const at = nowMs();
    if (g === AGAIN) buzz();
    else success();
    update((d) => ({
      ...d,
      srs: {
        ...d.srs,
        [card.id]: review(d.srs[card.id] ?? newCard(at), g, at),
      },
    }));
    setDone((n) => n + 1);
    setShown(false);
    setI((n) => n + 1);
  }

  function finish() {
    if (!today) return;
    update((d) => {
      const prev = d.plan.days[today] ?? emptyDay();
      return {
        ...d,
        plan: {
          ...d.plan,
          startedOn: d.plan.startedOn ?? today,
          days: {
            ...d.plan.days,
            [today]: { ...prev, blocks: { ...prev.blocks, consolidate: true } },
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

  if (!ready || !queue) {
    return <p className="py-10 text-center text-sm text-ink-3">Loading…</p>;
  }

  if (!card) {
    return (
      <div className="py-6">
        <p className="eyebrow">Block 5 · Consolidation</p>
        <h1 className="mt-1 text-lg leading-tight font-semibold">
          {queue.length === 0 ? "Nothing due" : "Queue clear"}
        </h1>
        <p className="mt-3 text-base leading-snug text-ink-2">
          {queue.length === 0
            ? "No card is due yet. Nothing is gained by reviewing early — that is what the intervals are for."
            : `${done} cards reviewed. Block 5 logged.`}
        </p>
        <Link
          href="/"
          prefetch={LINK_PREFETCH}
          onClick={() => {
            tap();
            if (queue.length > 0) finish();
          }}
          className="btn btn-primary mt-6 w-full"
        >
          Back to today
        </Link>
      </div>
    );
  }

  const { line, stage } = card;
  const srs = data.srs[card.id] ?? newCard(now);
  // §9.5 — the points come off a line once it is known. The prompt is what
  // the trainee has earned; the answer below always shows it fully pointed,
  // so a failed decoding can be checked rather than just felt.
  const rung = rungFor(data.srs[cardId(line.id, "read")]);
  const prompt = atRung(line.he, rung);
  const gloss = data.settings.gloss === "fr" ? line.fr : line.en;
  // §4 — Produce asks for the Hebrew; the other two ask for the meaning.
  const askMeaning = stage !== "produce";

  return (
    <div>
      <header className="mb-4 flex items-baseline justify-between">
        <div>
          <p className="eyebrow">Block 5 · {stage}</p>
          <h1 className="mt-1 text-lg leading-tight font-semibold">
            {stage === "listen"
              ? "What did you hear?"
              : stage === "read"
                ? "What does it say?"
                : "Say it in Hebrew"}
          </h1>
        </div>
        <span className="text-sm text-ink-3 tnum">
          {queue.length - i} left
        </span>
      </header>

      {/* Once the answer is up, the two answers that account for most cards
          are a throw away; Hard and Easy stay on the buttons below. */}
      <SwipeCard
        key={card.id}
        active={shown}
        onLeft={() => grade(AGAIN)}
        onRight={() => grade(GOOD)}
        leftLabel="Again"
        rightLabel="Good"
        className="panel flex flex-col items-center justify-center rounded-2xl px-5 py-9 text-center"
      >
        {/* The prompt. Listening never shows the text until the answer. */}
        {stage === "listen" ? (
          <LineAudio lineId={line.id} />
        ) : stage === "read" ? (
          <>
            <p
              className="heb text-[30px] leading-snug"
              style={{ fontFamily: "var(--font-hebrew)" }}
            >
              {prompt}
            </p>
            {rung !== "full" && (
              <p className="mt-3 text-xs text-ink-3">
                {rung === "bare" ? "No vowels" : "Fewer vowels"}
              </p>
            )}
          </>
        ) : (
          <p className="text-lg leading-snug font-semibold">
            {gloss}
          </p>
        )}

        {!shown ? (
          <button
            onClick={() => {
              tap();
              setShown(true);
            }}
            className="btn btn-secondary mt-7"
          >
            Show answer
          </button>
        ) : (
          <div className="anim-fade mt-7 w-full border-t border-line pt-6">
            {askMeaning ? (
              <>
                <p className="text-base leading-snug text-ink-2">{gloss}</p>
                {stage === "read" && rung !== "full" && (
                  <>
                    <p
                      className="heb mt-3 text-[26px] leading-snug"
                      style={{ fontFamily: "var(--font-hebrew)" }}
                    >
                      {line.he}
                    </p>
                    <Phonetic line={line} className="mt-2" />
                  </>
                )}
                {stage === "listen" && (
                  <>
                    <p
                      className="heb mt-3 text-[26px] leading-snug"
                      style={{ fontFamily: "var(--font-hebrew)" }}
                    >
                      {line.he}
                    </p>
                    <Phonetic line={line} className="mt-2" />
                  </>
                )}
              </>
            ) : (
              <>
                <p
                  className="heb text-[30px] leading-snug"
                  style={{ fontFamily: "var(--font-hebrew)" }}
                >
                  {line.he}
                </p>
                <Phonetic line={line} className="mt-2" />
              </>
            )}
            {stage !== "listen" && (
              <div className="mt-5 flex justify-center">
                <LineAudio lineId={line.id} showNatural />
              </div>
            )}
          </div>
        )}
      </SwipeCard>

      {shown && (
        <p className="mt-3 text-center text-xs text-ink-3">
          Swipe the card: left again, right good.
        </p>
      )}

      {shown && (
        <div className="anim-fade mt-3 grid grid-cols-4 gap-2">
          {GRADES.map((g) => (
            <button
              key={g.grade}
              onClick={() => grade(g.grade)}
              className="panel tap flex flex-col items-center gap-0.5 rounded-xl py-3"
              style={{ color: g.tint }}
            >
              <span className="text-sm font-semibold">{g.label}</span>
              <span className="text-xs opacity-70 tnum">
                {previewInterval(srs, g.grade, now)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
