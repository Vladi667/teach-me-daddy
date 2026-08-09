"use client";

import Link from "next/link";
import Ring from "@/components/Ring";
import { LETTERS } from "@/lib/letters";
import { masteredCount, useProgress } from "@/lib/progress";
import { tap } from "@/lib/feedback";
import { LINK_PREFETCH } from "@/lib/base-path";

const MODULES = [
  {
    href: "/alphabet",
    title: "The Alphabet",
    detail: "22 letters · print, cursive, final forms",
    glyph: "א",
    tint: "rgba(111,139,255,0.16)",
    ready: true,
  },
  {
    href: "/practice",
    title: "Drill",
    detail: "Spaced repetition · look-alike traps",
    glyph: "ב",
    tint: "rgba(180,137,255,0.16)",
    ready: true,
  },
  {
    href: "#",
    title: "Vowels · Nikud",
    detail: "Coming next",
    glyph: "אָ",
    tint: "rgba(74,222,156,0.12)",
    ready: false,
  },
  {
    href: "#",
    title: "First Words",
    detail: "Coming next",
    glyph: "מ",
    tint: "rgba(255,183,77,0.12)",
    ready: false,
  },
];

export default function Home() {
  const { progress, ready } = useProgress();
  const done = ready ? masteredCount(progress) : 0;
  const pct = done / LETTERS.length;

  return (
    <>
      <header className="anim-rise mb-6">
        <p className="text-[13px] font-medium text-(--color-ink-faint)">
          Shalom
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

      {/* Progress hero ------------------------------------------------- */}
      <section
        className="glass anim-rise mb-5 flex items-center gap-5 rounded-[28px] p-5"
        style={{ animationDelay: "60ms" }}
      >
        <Ring value={pct}>
          <div className="text-center leading-none">
            <div className="text-[22px] font-bold tracking-[-0.04em]">
              {done}
            </div>
            <div className="mt-0.5 text-[10px] text-(--color-ink-faint)">
              / {LETTERS.length}
            </div>
          </div>
        </Ring>

        <div className="min-w-0">
          <h2 className="text-[17px] font-semibold tracking-[-0.02em]">
            {done === 0
              ? "Start here"
              : done === LETTERS.length
                ? "Alphabet complete"
                : "Letters mastered"}
          </h2>
          <p className="mt-1 text-[13px] leading-snug text-(--color-ink-dim)">
            {done === 0
              ? "Learn the shapes first, then drill them until they're automatic."
              : done === LETTERS.length
                ? "Every letter answered right three times running. Keep it warm."
                : `${LETTERS.length - done} to go. Three correct in a row locks a letter in.`}
          </p>
          <Link
            href={done === 0 ? "/alphabet" : "/practice"}
            prefetch={LINK_PREFETCH}
            onClick={tap}
            className="press mt-3 inline-flex min-h-[44px] items-center gap-1.5 rounded-full px-5 py-3 text-[13px] font-semibold"
            style={{
              background:
                "linear-gradient(100deg, var(--color-accent), var(--color-accent-2))",
              boxShadow: "0 6px 20px -8px rgba(111,139,255,0.8)",
            }}
          >
            {done === 0 ? "Learn the letters" : "Continue drilling"}
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m9 6 6 6-6 6" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Modules -------------------------------------------------------- */}
      <h3 className="anim-rise mb-3 px-1 text-[13px] font-semibold tracking-[-0.01em] text-(--color-ink-faint)">
        Modules
      </h3>

      <div className="flex flex-col gap-3">
        {MODULES.map((m, i) => {
          const inner = (
            <>
              <div
                className="grid size-[52px] shrink-0 place-items-center rounded-[17px]"
                style={{
                  background: m.tint,
                  boxShadow: "0 1px 0 0 rgba(255,255,255,0.12) inset",
                }}
              >
                <span
                  className="heb text-[26px] leading-none"
                  style={{ fontFamily: "var(--font-hebrew)" }}
                >
                  {m.glyph}
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[16px] font-semibold tracking-[-0.02em]">
                    {m.title}
                  </span>
                  {!m.ready && (
                    <span className="rounded-full bg-white/8 px-2 py-0.5 text-[9.5px] font-semibold tracking-wide text-(--color-ink-faint) uppercase">
                      Soon
                    </span>
                  )}
                </div>
                <p className="mt-0.5 truncate text-[12.5px] text-(--color-ink-dim)">
                  {m.detail}
                </p>
              </div>

              {m.ready && (
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
              )}
            </>
          );

          const cls =
            "glass anim-rise flex items-center gap-3.5 rounded-[24px] p-3.5";
          const style = { animationDelay: `${120 + i * 55}ms` };

          return m.ready ? (
            <Link
              key={m.title}
              href={m.href}
              prefetch={LINK_PREFETCH}
              onClick={tap}
              className={`press ${cls}`}
              style={style}
            >
              {inner}
            </Link>
          ) : (
            <div
              key={m.title}
              className={cls}
              style={{ ...style, opacity: 0.45 }}
              aria-disabled
            >
              {inner}
            </div>
          );
        })}
      </div>
    </>
  );
}
