"use client";

import Link from "next/link";
import Ring from "@/components/Ring";
import { LETTERS } from "@/lib/letters";
import { useDeck } from "@/lib/use-deck";
import { buildQueue } from "@/lib/srs";
import { masteredCount } from "@/lib/progress";
import {
  BLOCKS,
  DAILY_MINUTES,
  dayMinutes,
  streak,
  WEEK_FOCUS,
  weekdayIndex,
} from "@/lib/plan";
import { useStore } from "@/lib/store";
import { tap } from "@/lib/feedback";
import { LINK_PREFETCH } from "@/lib/base-path";
import { useNow, useToday } from "@/lib/clock";

export default function Home() {
  const { data, ready, username } = useStore();
  const { cards: CARDS, items } = useDeck();
  const now = useNow();
  // null until hydration — see useToday.
  const today = useToday();
  const mastered = ready ? masteredCount(data.alphabet) : 0;
  const run = ready ? streak(data.plan) : 0;

  const allowance = Math.max(
    0,
    data.settings.newPerDay - (today ? (data.newLog[today] ?? 0) : 0),
  );
  const due = ready
    ? buildQueue(CARDS, data.srs, now, allowance).counts.total
    : 0;

  const log = today ? data.plan.days[today] : undefined;
  const doneMin = dayMinutes(log);
  const blocksDone = BLOCKS.filter((b) => log?.blocks[b.id]).length;

  return (
    <>
      <header className="anim-rise mb-5">
        <p className="text-[13px] font-medium text-(--color-ink-faint)">
          Shalom, {username}
        </p>
        <h1 className="mt-0.5 text-[32px] leading-[1.1] font-bold tracking-[-0.03em]">
          Teach me
          <br />
          <span
            style={{
              background:
                "linear-gradient(100deg, var(--color-accent), var(--color-accent-2))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Daddy
          </span>
        </h1>
      </header>

      {/* today ------------------------------------------------------------ */}
      <section
        className="glass anim-rise mb-3 rounded-[28px] p-5"
        style={{ animationDelay: "50ms" }}
      >
        <div className="flex items-center gap-5">
          <Ring value={doneMin / DAILY_MINUTES}>
            <div className="text-center leading-none">
              <div className="text-[20px] font-bold tracking-[-0.04em] tabular-nums">
                {blocksDone}
              </div>
              <div className="mt-0.5 text-[10px] text-(--color-ink-faint)">
                / {BLOCKS.length}
              </div>
            </div>
          </Ring>

          <div className="min-w-0">
            <h2 className="text-[17px] font-semibold tracking-[-0.02em]">
              {blocksDone === BLOCKS.length
                ? "Day complete"
                : blocksDone === 0
                  ? "Nothing logged yet"
                  : "In progress"}
            </h2>
            <p className="mt-1 text-[12.5px] leading-snug text-(--color-ink-dim)">
              {today ? WEEK_FOCUS[weekdayIndex(today)].focus : " "}
            </p>
            <p className="mt-1.5 text-[11px] text-(--color-ink-faint)">
              {run > 0 ? `${run}-day streak · ` : ""}
              {due > 0 ? `${due} cards due` : "no cards due"}
            </p>
          </div>
        </div>

        <div className="mt-4 flex gap-2.5">
          <Link
            href="/study"
            prefetch={LINK_PREFETCH}
            onClick={tap}
            className="press flex min-h-[44px] flex-1 items-center justify-center rounded-full text-[13px] font-semibold"
            style={{
              background:
                "linear-gradient(100deg, var(--color-accent), var(--color-accent-2))",
              boxShadow: "0 6px 20px -8px rgba(111,139,255,0.8)",
            }}
          >
            {due > 0 ? `Study ${due}` : "Study"}
          </Link>
          <Link
            href="/plan"
            prefetch={LINK_PREFETCH}
            onClick={tap}
            className="press flex min-h-[44px] flex-1 items-center justify-center rounded-full bg-white/8 text-[13px] font-semibold"
          >
            Log today
          </Link>
        </div>
      </section>

      <h3 className="anim-rise mb-3 px-1 text-[13px] font-semibold text-(--color-ink-faint)">
        Modules
      </h3>

      <div className="flex flex-col gap-3">
        <Module
          href="/alphabet"
          title="The Alphabet"
          detail={`${mastered}/${LETTERS.length} mastered · print, cursive, traps`}
          glyph="א"
          tint="rgba(111,139,255,0.16)"
          delay={120}
        />
        <Module
          href="/study"
          title="Vocabulary"
          detail={`${items.length} words · patterns first, then the pieces`}
          glyph="מ"
          tint="rgba(180,137,255,0.16)"
          delay={175}
        />
        <Module
          href="/words"
          title="Your Words"
          detail={`${items.length} in the deck · add, import, export`}
          glyph="ו"
          tint="rgba(255,183,77,0.14)"
          delay={230}
        />
        <Module
          href="/plan"
          title="The 5-Month Plan"
          detail="Daily blocks, metrics, coverage curve"
          glyph="ה"
          tint="rgba(74,222,156,0.14)"
          delay={285}
        />
      </div>
    </>
  );
}

function Module({
  href,
  title,
  detail,
  glyph,
  tint,
  delay,
}: {
  href: string;
  title: string;
  detail: string;
  glyph: string;
  tint: string;
  delay: number;
}) {
  return (
    <Link
      href={href}
      prefetch={LINK_PREFETCH}
      onClick={tap}
      className="glass press anim-rise flex items-center gap-3.5 rounded-[24px] p-3.5"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div
        className="grid size-[52px] shrink-0 place-items-center rounded-[17px]"
        style={{
          background: tint,
          boxShadow: "0 1px 0 0 rgba(255,255,255,0.12) inset",
        }}
      >
        <span
          className="heb text-[26px] leading-none"
          style={{ fontFamily: "var(--font-hebrew)" }}
        >
          {glyph}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[16px] font-semibold tracking-[-0.02em]">
          {title}
        </div>
        <p className="mt-0.5 truncate text-[12.5px] text-(--color-ink-dim)">
          {detail}
        </p>
      </div>
      <Chevron />
    </Link>
  );
}

function Chevron() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0 text-(--color-ink-faint)"
    >
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}
