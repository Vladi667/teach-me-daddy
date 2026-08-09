"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CARDS,
  GROUP_BY_ID,
  ITEM_BY_ID,
  type Card as DeckCard,
} from "@/lib/deck";
import {
  AGAIN,
  GRADES,
  buildQueue,
  isMature,
  newCard,
  previewInterval,
  review,
  type Grade,
  type SrsCard,
} from "@/lib/srs";
import { nowMs, useNow, useToday } from "@/lib/clock";
import { useStore } from "@/lib/store";
import { LINK_PREFETCH } from "@/lib/base-path";
import { canSpeak, error as buzz, speak, success, tap } from "@/lib/feedback";

interface Session {
  queue: DeckCard[];
  pos: number;
  answered: number;
  correct: number;
}

export default function StudyPage() {
  const { data, ready, update } = useStore();
  const now = useNow();
  const [session, setSession] = useState<Session | null>(null);
  const [shown, setShown] = useState(false);
  const [voice, setVoice] = useState(false);

  const today = useToday();
  const allowance = Math.max(
    0,
    data.settings.newPerDay - (today ? (data.newLog[today] ?? 0) : 0),
  );

  useEffect(() => {
    const check = () => setVoice(canSpeak());
    check();
    window.speechSynthesis?.addEventListener("voiceschanged", check);
    return () =>
      window.speechSynthesis?.removeEventListener("voiceschanged", check);
  }, []);

  // The queue depends on Date.now(), so it can only be built on the client.
  useEffect(() => {
    if (!ready) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSession((prev) =>
      prev
        ? prev
        : {
            queue: buildQueue(CARDS, data.srs, nowMs(), allowance).queue,
            pos: 0,
            answered: 0,
            correct: 0,
          },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const counts = ready
    ? buildQueue(CARDS, data.srs, now, allowance).counts
    : { fresh: 0, learning: 0, due: 0, total: 0 };

  const card = session?.queue[session.pos];
  const item = card ? ITEM_BY_ID[card.itemId] : null;
  const srs: SrsCard = (card && data.srs[card.id]) || newCard(now);
  const gloss = data.settings.gloss;

  function grade(g: Grade) {
    if (!session || !card) return;
    const at = nowMs();
    const wasNew = !data.srs[card.id];

    if (g === AGAIN) buzz();
    else success();

    update((d) => ({
      ...d,
      srs: { ...d.srs, [card.id]: review(d.srs[card.id] ?? newCard(at), g, at) },
      newLog:
        wasNew && today
          ? { ...d.newLog, [today]: (d.newLog[today] ?? 0) + 1 }
          : d.newLog,
    }));

    setSession((s) => {
      if (!s) return s;
      // "Again" sends the card back to the end of this session, so you finish
      // having actually got it right at least once.
      const queue = g === AGAIN ? [...s.queue, card] : s.queue;
      return {
        queue,
        pos: s.pos + 1,
        answered: s.answered + 1,
        correct: s.correct + (g === AGAIN ? 0 : 1),
      };
    });
    setShown(false);
  }

  function restart() {
    tap();
    setSession({
      queue: buildQueue(CARDS, data.srs, nowMs(), allowance).queue,
      pos: 0,
      answered: 0,
      correct: 0,
    });
    setShown(false);
  }

  const matureCount = Object.values(data.srs).filter(isMature).length;

  /* --- states ------------------------------------------------------------ */

  if (!ready || !session) {
    return (
      <>
        <Header counts={counts} mature={matureCount} />
        <div className="glass grid h-[320px] place-items-center rounded-[28px] text-[13px] text-(--color-ink-faint)">
          Loading…
        </div>
      </>
    );
  }

  if (!card) {
    const nothingLeft = counts.total === 0;
    return (
      <>
        <Header counts={counts} mature={matureCount} />
        <div className="glass anim-rise rounded-[28px] p-6 text-center">
          <div
            className="mx-auto grid size-14 place-items-center rounded-full"
            style={{ background: "rgba(74,222,156,0.15)" }}
          >
            <span className="text-[26px]">✓</span>
          </div>
          <h2 className="mt-4 text-[20px] font-bold tracking-[-0.02em]">
            {session.answered > 0 ? "Session done" : "Nothing due"}
          </h2>
          {session.answered > 0 && (
            <p className="mt-1.5 text-[13px] text-(--color-ink-dim)">
              {session.answered} answered ·{" "}
              {Math.round((session.correct / session.answered) * 100)}% first try
            </p>
          )}
          <p className="mt-3 text-[12.5px] leading-relaxed text-(--color-ink-dim)">
            {nothingLeft
              ? allowance === 0
                ? `You've introduced today's ${data.settings.newPerDay} new cards. The plan caps it there — past that, review can't keep up.`
                : "Everything is scheduled ahead. Come back when cards fall due."
              : "More cards are waiting."}
          </p>

          {!nothingLeft && (
            <button
              onClick={restart}
              className="press mt-5 w-full rounded-full py-3.5 text-[14px] font-semibold"
              style={{
                background:
                  "linear-gradient(100deg, var(--color-accent), var(--color-accent-2))",
              }}
            >
              Keep going
            </button>
          )}
          <Link
            href="/plan"
            prefetch={LINK_PREFETCH}
            onClick={tap}
            className="press mt-2.5 block w-full rounded-full py-3 text-[13px] font-medium text-(--color-ink-dim)"
          >
            Log today&apos;s blocks
          </Link>
        </div>
      </>
    );
  }

  /* --- review ------------------------------------------------------------ */

  const askHebrew = card.direction === "m2he";
  const group = GROUP_BY_ID[item!.group];
  const remaining = session.queue.length - session.pos;

  return (
    <>
      <Header counts={counts} mature={matureCount} />

      <div className="mb-3 flex items-center justify-between px-1 text-[11.5px]">
        <span className="text-(--color-ink-faint)">
          {group.label} · {askHebrew ? "produce" : "recognise"}
        </span>
        <span className="text-(--color-ink-faint) tabular-nums">
          {remaining} left
        </span>
      </div>

      <div className="glass anim-rise flex min-h-[260px] flex-1 flex-col items-center justify-center rounded-[28px] px-5 py-7 text-center">
        {/* prompt */}
        {askHebrew ? (
          <p className="text-[22px] leading-snug font-semibold tracking-[-0.02em]">
            {gloss === "fr" ? item!.fr : item!.en}
          </p>
        ) : (
          <p
            className="heb text-[34px] leading-snug"
            style={{ fontFamily: "var(--font-hebrew)" }}
          >
            {item!.he}
          </p>
        )}

        {!shown ? (
          <button
            onClick={() => {
              tap();
              setShown(true);
            }}
            className="press mt-7 rounded-full bg-white/8 px-6 py-3 text-[13px] font-semibold"
          >
            Show answer
          </button>
        ) : (
          <div className="anim-fade mt-6 w-full border-t border-white/10 pt-6">
            {askHebrew ? (
              <p
                className="heb text-[32px] leading-snug"
                style={{ fontFamily: "var(--font-hebrew)" }}
              >
                {item!.he}
              </p>
            ) : (
              <p className="text-[20px] leading-snug font-semibold tracking-[-0.02em]">
                {gloss === "fr" ? item!.fr : item!.en}
              </p>
            )}

            <div className="mt-2 flex items-center justify-center gap-2">
              <span className="text-[13.5px] text-(--color-ink-dim) italic">
                {item!.tr}
              </span>
              {voice && (
                <button
                  onClick={() => {
                    tap();
                    speak(item!.he);
                  }}
                  aria-label="Hear it"
                  className="press grid size-7 place-items-center rounded-full bg-white/8"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 5 6.5 9H3v6h3.5L11 19z" />
                    <path d="M15.5 8.5a5 5 0 0 1 0 7" />
                  </svg>
                </button>
              )}
            </div>

            {/* Function words are never shown bare — §9.4 */}
            {item!.example && (
              <div className="mt-4 rounded-[16px] bg-white/5 px-4 py-3">
                <div className="text-[9.5px] font-semibold tracking-[0.08em] text-(--color-ink-faint) uppercase">
                  In a sentence
                </div>
                <p
                  className="heb mt-1.5 text-[18px]"
                  style={{ fontFamily: "var(--font-hebrew)" }}
                >
                  {item!.example.he}
                </p>
                <p className="mt-1 text-[12px] text-(--color-ink-dim) italic">
                  {item!.example.tr}
                </p>
                <p className="mt-0.5 text-[12px] text-(--color-ink-faint)">
                  {gloss === "fr" ? item!.example.fr : item!.example.en}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {shown && (
        <div className="anim-fade mt-3 grid grid-cols-4 gap-2">
          {GRADES.map((g) => (
            <button
              key={g.grade}
              onClick={() => grade(g.grade)}
              className="glass press flex flex-col items-center gap-0.5 rounded-[18px] py-3"
              style={{ color: g.tint }}
            >
              <span className="text-[12.5px] font-semibold">{g.label}</span>
              <span className="text-[10px] tabular-nums opacity-70">
                {previewInterval(srs, g.grade, now)}
              </span>
            </button>
          ))}
        </div>
      )}
    </>
  );
}

function Header({
  counts,
  mature,
}: {
  counts: { fresh: number; learning: number; due: number };
  mature: number;
}) {
  return (
    <header className="anim-rise mb-4">
      <div className="flex items-baseline justify-between">
        <h1 className="text-[27px] font-bold tracking-[-0.03em]">Study</h1>
        <span className="text-[12px] text-(--color-ink-faint)">
          {mature} mature
        </span>
      </div>
      <div className="mt-3 flex gap-2">
        <Pill n={counts.learning} label="learning" tint="var(--color-amber)" />
        <Pill n={counts.due} label="due" tint="var(--color-mint)" />
        <Pill n={counts.fresh} label="new" tint="var(--color-accent)" />
      </div>
    </header>
  );
}

function Pill({ n, label, tint }: { n: number; label: string; tint: string }) {
  return (
    <span
      className="flex-1 rounded-[14px] bg-white/6 px-3 py-2 text-center"
      style={{ color: n ? tint : "var(--color-ink-faint)" }}
    >
      <span className="block text-[17px] font-bold tabular-nums">{n}</span>
      <span className="block text-[10px] text-(--color-ink-faint)">{label}</span>
    </span>
  );
}
