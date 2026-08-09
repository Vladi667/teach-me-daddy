"use client";

import { useEffect, useState } from "react";
import Segmented from "@/components/Segmented";
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
      <header className="anim-rise mb-4">
        <h1 className="text-[27px] font-bold tracking-[-0.03em]">
          The Alphabet
        </h1>
        <p className="mt-1 text-[13px] text-(--color-ink-dim)">
          22 letters, read right to left. Tap any one.
        </p>
      </header>

      <div className="anim-rise mb-4" style={{ animationDelay: "60ms" }}>
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
              className="glass press anim-rise relative flex aspect-4/5 flex-col items-center justify-center rounded-[22px]"
              style={{ animationDelay: `${Math.min(i, 12) * 28}ms` }}
            >
              {mastered && (
                <span
                  className="absolute top-2.5 right-2.5 size-1.5 rounded-full"
                  style={{
                    background: "var(--color-mint)",
                    boxShadow: "0 0 8px var(--color-mint)",
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

              <span className="mt-2.5 text-[10px] font-semibold tracking-[0.06em] text-(--color-ink-faint)">
                {l.name}
              </span>
            </button>
          );
        })}
      </div>

      <p className="mt-5 px-1 text-center text-[11.5px] leading-relaxed text-(--color-ink-faint)">
        Five letters change shape at the end of a word:
        <span
          className="heb mx-1.5 text-[15px]"
          style={{ fontFamily: "var(--font-hebrew)" }}
        >
          ך ם ן ף ץ
        </span>
      </p>

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
