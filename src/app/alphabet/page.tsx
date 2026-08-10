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

  // Lock the page behind the sheet so only the sheet scrolls.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header className="mb-4">
        <h1 className="text-lg font-bold tracking-[-0.03em]">The Alphabet</h1>
        <p className="mt-1 text-sm text-ink-2">
          22 letters, read right to left. Tap any one.
        </p>
      </header>

      <div className="mb-4">
        <Segmented options={SCRIPTS} value={script} onChange={setScript} />
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {LETTERS.map((l, i) => {
          const mastered = ready && isMastered(progress, l.char);
          return (
            <button
              key={l.char}
              onClick={() => {
                tap();
                setOpen(l);
              }}
              className="panel tap  relative flex aspect-4/5 flex-col items-center justify-center rounded-xl"
              style={{ animationDelay: `${Math.min(i, 12) * 28}ms` }}
            >
              {mastered && (
                <span
                  className="absolute top-2.5 right-2.5 size-1.5 rounded-full"
                  style={{
                    background: "var(--color-good)",
                    boxShadow: "0 0 8px var(--color-good)",
                  }}
                  aria-label="mastered"
                />
              )}

              <span
                className={`heb text-[40px] leading-none ${
                  script === "cursive" ? "heb-cursive" : ""
                }`}
                style={
                  script === "print"
                    ? { fontFamily: "var(--font-hebrew)" }
                    : undefined
                }
              >
                {l.char}
              </span>

              <span className="mt-2.5 text-xs font-semibold tracking-[0.06em] text-ink-3">
                {l.name}
              </span>
            </button>
          );
        })}
      </div>

      <p className="mt-5 px-1 text-center text-xs leading-relaxed text-ink-3">
        Five letters change shape at the end of a word:
        <span
          className="heb mx-1.5 text-base"
          style={{ fontFamily: "var(--font-hebrew)" }}
        >
          ך ם ן ף ץ
        </span>
      </p>

      <div className="mt-4 flex gap-2.5">
        <Link
          href="/practice"
          prefetch={LINK_PREFETCH}
          onClick={tap}
          className="btn btn-primary flex-1 text-sm"
        >
          Drill the letters
        </Link>
        <Link
          href="/progress"
          prefetch={LINK_PREFETCH}
          onClick={tap}
          className="tap flex min-h-[44px] flex-1 items-center justify-center rounded-full bg-surface-2 text-sm font-semibold"
        >
          Letter stats
        </Link>
      </div>

      {open && (
        <LetterSheet
          letter={open}
          script={script}
          onClose={() => setOpen(null)}
        />
      )}
    </>
  );
}
