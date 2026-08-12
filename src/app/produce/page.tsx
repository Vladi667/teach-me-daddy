"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LINES } from "@/lib/lines";
import { cardId, dayNumber } from "@/lib/programme";
import { emptyDay } from "@/lib/plan";
import {
  GRADES,
  isDue,
  isMature,
  newCard,
  previewInterval,
  review,
  type Grade,
} from "@/lib/srs";
import { update, useStore } from "@/lib/store";
import { nowMs, useNow, useToday } from "@/lib/clock";
import { LINK_PREFETCH } from "@/lib/base-path";
import LineAudio from "@/components/LineAudio";
import { error as buzz, success, tap } from "@/lib/feedback";
import { AGAIN } from "@/lib/srs";

/**
 * §3 block 3. Production is the hardest direction, so a line only reaches it
 * once its Read card is mature — PROGRAMME.md §4. Early in the programme this
 * screen is legitimately empty, and says so rather than inventing work.
 */
export default function ProducePage() {
  const { data, ready } = useStore();
  const now = useNow();
  const today = useToday();
  const [queue, setQueue] = useState<typeof LINES | null>(null);
  const [i, setI] = useState(0);
  const [shown, setShown] = useState(false);
  const [done, setDone] = useState(0);

  const startedOn = data.plan.startedOn ?? today;
  const day = today && startedOn ? dayNumber(startedOn, today) : 1;

  useEffect(() => {
    if (!ready || queue) return;
    const eligible = LINES.filter((l) => {
      if (l.day > day) return false;
      const read = data.srs[cardId(l.id, "read")];
      if (!read || !isMature(read)) return false;
      const prod = data.srs[cardId(l.id, "produce")];
      return !prod || isDue(prod, nowMs());
    });
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQueue(eligible);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  function logBlock() {
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
            [today]: { ...prev, blocks: { ...prev.blocks, speak: true } },
          },
        },
      };
    });
  }

  const line = queue?.[i];

  function grade(g: Grade) {
    if (!line) return;
    const at = nowMs();
    if (g === AGAIN) buzz();
    else success();
    const id = cardId(line.id, "produce");
    update((d) => ({
      ...d,
      srs: { ...d.srs, [id]: review(d.srs[id] ?? newCard(at), g, at) },
    }));
    setDone((n) => n + 1);
    setI((n) => n + 1);
    setShown(false);
  }

  if (!ready || !queue) {
    return <p className="py-10 text-center text-sm text-ink-3">Loading…</p>;
  }

  if (!line) {
    const nothingEligible = queue.length === 0;
    return (
      <div className="py-6">
        <p className="eyebrow">Block 3 · Production</p>
        <h1 className="mt-1 text-lg leading-tight font-semibold">
          {nothingEligible ? "Nothing to produce yet" : "Production complete"}
        </h1>
        <p className="mt-3 text-base leading-snug text-ink-2">
          {nothingEligible
            ? "A line reaches production once you've held it for 21 days. Until then this block is spoken practice with your tutor — do it, then tick it on today."
            : `${done} lines produced. Block 3 logged.`}
        </p>
        <Link
          href="/"
          prefetch={LINK_PREFETCH}
          onClick={() => {
            tap();
            if (!nothingEligible) logBlock();
          }}
          className="btn btn-primary mt-6 w-full"
        >
          Back to today
        </Link>
      </div>
    );
  }

  const srs = data.srs[cardId(line.id, "produce")] ?? newCard(now);

  return (
    <div>
      <header className="mb-6 flex items-baseline justify-between">
        <div>
          <p className="eyebrow">Block 3 · Production</p>
          <h1 className="mt-1 text-lg leading-tight font-semibold">
            Say it in Hebrew
          </h1>
        </div>
        <span className="text-sm text-ink-3 tnum">
          {i + 1}/{queue.length}
        </span>
      </header>

      <div className="panel flex flex-col items-center justify-center rounded-2xl px-5 py-9 text-center">
        <p className="text-lg leading-snug font-semibold">
          {line.fr}
        </p>

        {!shown ? (
          <button
            onClick={() => {
              tap();
              setShown(true);
            }}
            className="btn btn-secondary mt-7"
          >
            Show the line
          </button>
        ) : (
          <div className="anim-fade mt-7 w-full border-t border-line pt-7">
            <p
              className="heb text-[30px] leading-snug"
              style={{ fontFamily: "var(--font-hebrew)" }}
            >
              {line.he}
            </p>
            <div className="mt-5 flex justify-center">
              <LineAudio lineId={line.id} showNatural />
            </div>
          </div>
        )}
      </div>

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

      <p className="mt-4 text-center text-xs leading-relaxed text-ink-3">
        Say it out loud before you reveal it. Grade yourself on what you said,
        not on what you recognise.
      </p>
    </div>
  );
}
