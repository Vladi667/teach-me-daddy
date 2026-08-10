"use client";

import Link from "next/link";
import { LETTERS } from "@/lib/letters";
import { useDeck } from "@/lib/use-deck";
import { buildQueue, isMature } from "@/lib/srs";
import { masteredCount } from "@/lib/progress";
import {
  BLOCKS,
  WEEK_FOCUS,
  coverageFor,
  dayMinutes,
  monthFor,
  streak,
  weekdayIndex,
} from "@/lib/plan";
import { useStore } from "@/lib/store";
import { tap } from "@/lib/feedback";
import { LINK_PREFETCH } from "@/lib/base-path";
import { useNow, useToday } from "@/lib/clock";

const LONG_DAY = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function Today() {
  const { data, ready } = useStore();
  const { cards, items } = useDeck();
  const now = useNow();
  const today = useToday();

  const run = ready ? streak(data.plan) : 0;
  const allowance = Math.max(
    0,
    data.settings.newPerDay - (today ? (data.newLog[today] ?? 0) : 0),
  );
  const due = ready
    ? buildQueue(cards, data.srs, now, allowance).counts.total
    : 0;

  const log = today ? data.plan.days[today] : undefined;
  const blocksDone = BLOCKS.filter((b) => log?.blocks[b.id]).length;
  const minutes = dayMinutes(log);

  const mastered = ready ? masteredCount(data.alphabet) : 0;
  const mature = Object.values(data.srs).filter(isMature).length;
  const words = mature + (data.plan.wordsElsewhere ?? 0);
  const month = monthFor(words);

  // Dates are client-only: these pages prerender and the build runs in UTC.
  const [y, m, d] = today ? today.split("-").map(Number) : [0, 0, 0];
  const focus = today ? WEEK_FOCUS[weekdayIndex(today)].focus : "";

  return (
    <>
      <header className="mb-6 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-lg leading-tight font-semibold tracking-[-0.02em]">
            {today ? LONG_DAY[weekdayIndex(today)] : " "}
          </h1>
          <p className="text-sm text-ink-3 tnum">
            {today ? `${d} ${MONTHS[m - 1]} ${y}` : " "}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-md leading-none font-semibold tnum">{run}</div>
          <div className="mt-1 text-xs text-ink-3">day streak</div>
        </div>
      </header>

      <p className="mb-5 text-base leading-snug text-ink-2">{focus || " "}</p>

      {/* what to do now ---------------------------------------------------- */}
      <div className="mb-8 flex flex-col gap-2.5">
        <Action
          href="/study"
          primary={due > 0}
          lead={String(due)}
          title={due === 1 ? "card due" : "cards due"}
          detail={
            due > 0
              ? `${allowance} new still allowed today`
              : "everything is scheduled ahead"
          }
          cta={due > 0 ? "Study" : "Browse"}
        />
        <Action
          href="/plan"
          primary={false}
          lead={`${blocksDone}/${BLOCKS.length}`}
          title="blocks logged"
          detail={
            minutes > 0
              ? `${Math.floor(minutes / 60)}h ${minutes % 60}m of 4h`
              : "nothing logged yet"
          }
          cta="Log"
        />
      </div>

      {/* where you are ----------------------------------------------------- */}
      <h2 className="eyebrow mb-1">Where you are</h2>

      <ul className="flex flex-col">
        <Row
          href="/alphabet"
          label="Alphabet"
          value={`${mastered}/${LETTERS.length}`}
          note="mastered"
          ratio={mastered / LETTERS.length}
        />
        <Row
          href="/words"
          label="Vocabulary"
          value={`${mature}`}
          note={`mature of ${items.length}`}
          ratio={items.length ? mature / items.length : 0}
        />
        <Row
          href="/plan"
          label={`Month ${month.n} · ${month.title}`}
          value={`${Math.round(coverageFor(words))}%`}
          note={`${words} words · ${month.to} target`}
          ratio={coverageFor(words) / 100}
          last
        />
      </ul>
    </>
  );
}

/** Something to do now: the number leads, the verb sits on the right. */
function Action({
  href,
  primary,
  lead,
  title,
  detail,
  cta,
}: {
  href: string;
  primary: boolean;
  lead: string;
  title: string;
  detail: string;
  cta: string;
}) {
  return (
    <Link
      href={href}
      prefetch={LINK_PREFETCH}
      onClick={tap}
      className="tap panel flex items-center gap-3.5 rounded-xl px-4 py-3.5"
    >
      <span className="flex min-w-0 flex-1 items-baseline gap-2.5">
        <span
          className="text-xl leading-none font-semibold tnum"
          style={{
            color: primary ? "var(--color-accent)" : "var(--color-ink)",
          }}
        >
          {lead}
        </span>
        <span className="min-w-0">
          <span className="block text-base leading-tight">{title}</span>
          <span className="block truncate text-sm text-ink-3">{detail}</span>
        </span>
      </span>
      <span
        className={`btn shrink-0 text-sm ${primary ? "btn-primary" : "btn-secondary"}`}
        style={{ minHeight: 36, paddingInline: "0.875rem" }}
      >
        {cta}
      </span>
    </Link>
  );
}

/** A row, not a card. The bar carries the progress so the number stays quiet. */
function Row({
  href,
  label,
  value,
  note,
  ratio,
  last,
}: {
  href: string;
  label: string;
  value: string;
  note: string;
  ratio: number;
  last?: boolean;
}) {
  return (
    <li>
      <Link
        href={href}
        prefetch={LINK_PREFETCH}
        onClick={tap}
        className="tap flex items-center gap-4 py-3.5"
        style={{ borderBottom: last ? "none" : "1px solid var(--color-line)" }}
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate text-base">{label}</span>
          <span className="mt-2 block h-[3px] w-full overflow-hidden rounded-full bg-line">
            <span
              className="block h-full rounded-full bg-accent"
              style={{
                width: `${Math.min(100, Math.max(0, ratio * 100))}%`,
                transition: "width 200ms var(--ease-out-quart)",
              }}
            />
          </span>
        </span>
        <span className="shrink-0 text-right">
          <span className="block text-md leading-none font-semibold tnum">
            {value}
          </span>
          <span className="mt-1 block text-xs text-ink-3">{note}</span>
        </span>
      </Link>
    </li>
  );
}
