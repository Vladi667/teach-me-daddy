"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Segmented from "@/components/Segmented";
import { LINK_PREFETCH } from "@/lib/base-path";
import LetterSheet from "@/components/LetterSheet";
import { LETTERS, type Letter } from "@/lib/letters";
import { isMastered, useProgress } from "@/lib/progress";
import { tap } from "@/lib/feedback";

const SCRIPTS = [
  { id: "print", label: "Print" },
  { id: "cursive", label: "Cursive" },
] as const;

export type Script = (typeof SCRIPTS)[number]["id"];

export default function AlphabetPage() {
  const [script, setScript] = useState<Script>("print");
  const [open, setOpen] = useState<Letter | null>(null);
  const { progress, ready } = useProgress();

  const mastered = ready
    ? LETTERS.filter((l) => isMastered(progress, l.char)).length
    : 0;

  // Lock the page behind the sheet so only the sheet scrolls.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    // The whole board has to sit in one viewport: no scrolling to find a letter.
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="mb-3 flex items-baseline justify-between gap-4">
        <h1 className="text-lg leading-tight font-semibold">
          Alphabet
        </h1>
        <span className="text-sm text-ink-3 tnum">
          {mastered}/{LETTERS.length} mastered
        </span>
      </header>

      <Segmented options={SCRIPTS} value={script} onChange={setScript} />

      {/* 4 across, 6 down. Rows share the leftover height rather than being
          sized by aspect ratio, so a short screen compresses the tiles
          instead of pushing the drill button off the bottom. */}
      <div className="mt-3 grid min-h-0 flex-1 grid-cols-4 grid-rows-6 gap-2">
        {LETTERS.map((l) => {
          const done = ready && isMastered(progress, l.char);
          return (
            <button
              key={l.char}
              onClick={() => {
                tap();
                setOpen(l);
              }}
              aria-label={`${l.name}${done ? ", mastered" : ""}`}
              className="panel tap relative flex min-h-0 flex-col items-center justify-center gap-0.5 rounded-xl"
              style={
                done
                  ? {
                      borderColor:
                        "color-mix(in oklch, var(--color-good) 42%, transparent)",
                    }
                  : undefined
              }
            >
              <span
                className={`leading-none ${
                  script === "cursive" ? "heb-cursive" : "heb"
                }`}
                style={{ fontSize: "clamp(20px, 4.4vh, 32px)" }}
              >
                {l.char}
              </span>
              <span
                className="text-[9.5px] font-semibold tracking-[0.05em]"
                style={{
                  color: done ? "var(--color-good)" : "var(--color-ink-3)",
                }}
              >
                {l.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* The point of the screen, so it reads as the point of the screen. */}
      <div className="mt-3 flex gap-2">
        <Link
          href="/practice"
          prefetch={LINK_PREFETCH}
          onClick={tap}
          className="btn btn-primary flex-[3]"
        >
          Drill the letters
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m9 6 6 6-6 6" />
          </svg>
        </Link>
        <Link
          href="/vowels"
          prefetch={LINK_PREFETCH}
          onClick={tap}
          className="btn btn-secondary flex-1 text-sm"
        >
          Points
        </Link>
        <Link
          href="/progress"
          prefetch={LINK_PREFETCH}
          onClick={tap}
          className="btn btn-secondary flex-1 text-sm"
        >
          Stats
        </Link>
      </div>

      {open && (
        <LetterSheet
          letter={open}
          script={script}
          onClose={() => setOpen(null)}
        />
      )}
    </div>
  );
}
