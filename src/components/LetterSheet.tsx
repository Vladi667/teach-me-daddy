"use client";

import { useEffect, useRef, useState } from "react";
import { GROUP_LABEL, LETTERS, type Letter } from "@/lib/letters";
import { canSpeak, speak, tap } from "@/lib/feedback";

interface Props {
  letter: Letter;
  script: "print" | "cursive";
  onClose: () => void;
}

export default function LetterSheet({ letter, script, onClose }: Props) {
  const [current, setCurrent] = useState(letter);
  const [drag, setDrag] = useState(0);
  const [voice, setVoice] = useState(false);
  const startY = useRef<number | null>(null);

  const index = LETTERS.findIndex((l) => l.char === current.char);

  useEffect(() => {
    // Voices load asynchronously on most browsers.
    const check = () => setVoice(canSpeak());
    check();
    window.speechSynthesis?.addEventListener("voiceschanged", check);
    return () =>
      window.speechSynthesis?.removeEventListener("voiceschanged", check);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") go(1);
      if (e.key === "ArrowRight") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function go(delta: number) {
    const next = LETTERS[(index + delta + LETTERS.length) % LETTERS.length];
    tap();
    setCurrent(next);
  }

  function onTouchStart(e: React.TouchEvent) {
    startY.current = e.touches[0].clientY;
  }

  function onTouchMove(e: React.TouchEvent) {
    if (startY.current === null) return;
    const dy = e.touches[0].clientY - startY.current;
    setDrag(dy > 0 ? dy : dy * 0.25);
  }

  function onTouchEnd() {
    if (drag > 110) {
      onClose();
      return;
    }
    startY.current = null;
    setDrag(0);
  }

  return (
    <div className="fixed inset-0 z-100 flex items-end justify-center">
      <button
        aria-label="Close"
        onClick={onClose}
        className="anim-scrim absolute inset-0 bg-black/60"
        style={{ backdropFilter: "blur(6px)" }}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={current.name}
        className="panel-2 anim-sheet no-bar relative w-full max-w-[480px] overflow-y-auto rounded-t-[20px] px-6 pt-3"
        style={{
          maxHeight: "88dvh",
          paddingBottom: "calc(var(--safe-b) + 26px)",
          transform: drag ? `translateY(${drag}px)` : undefined,
          transition:
            startY.current === null
              ? "transform 200ms var(--ease-out-quart)"
              : "none",
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* grabber */}
        <div className="mx-auto mb-4 h-1 w-9 rounded-full bg-white/25" />

        {/* letter stage --------------------------------------------------- */}
        <div className="relative flex items-center justify-center gap-3 pb-1">
          <Arrow dir="prev" onClick={() => go(1)} />

          <div key={current.char} className="anim-card flex-1 text-center">
            <div className="flex items-end justify-center gap-6">
              <Glyph
                char={current.char}
                caption="Print"
                cursive={false}
                emphasis={script === "print"}
              />
              <Glyph
                char={current.char}
                caption="Cursive"
                cursive
                emphasis={script === "cursive"}
              />
            </div>
          </div>

          <Arrow dir="next" onClick={() => go(-1)} />
        </div>

        {/* identity ------------------------------------------------------- */}
        <div className="mt-5 text-center">
          <div className="flex items-center justify-center gap-2">
            <h2 className="text-lg font-bold">
              {current.name}
            </h2>
            {voice && (
              <button
                onClick={() => {
                  tap();
                  speak(current.nameHe);
                }}
                aria-label={`Hear ${current.name}`}
                className="tap grid size-8 place-items-center rounded-full bg-surface-2"
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M11 5 6.5 9H3v6h3.5L11 19z" />
                  <path d="M15.5 8.5a5 5 0 0 1 0 7" />
                  <path d="M18.5 5.5a9 9 0 0 1 0 13" />
                </svg>
              </button>
            )}
          </div>
          <p
            className="heb mt-1 text-md text-ink-2"
            style={{ fontFamily: "var(--font-hebrew)" }}
          >
            {current.nameHe}
          </p>
        </div>

        {/* facts ---------------------------------------------------------- */}
        <div className="mt-5 flex flex-col gap-2.5">
          <Row label="Sounds like" value={current.value} />
          <Row label="Name said" value={current.sound} />
          <Row label="Number" value={String(current.gematria)} mono />
          {current.final && (
            <div className="panel flex items-center justify-between rounded-xl px-4 py-3">
              <span className="text-sm text-ink-3">Final form</span>
              <div className="flex items-baseline gap-3">
                <span
                  className="heb text-lg leading-none"
                  style={{ fontFamily: "var(--font-hebrew)" }}
                >
                  {current.final}
                </span>
                <span className="heb heb-cursive text-lg leading-none">
                  {current.final}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* memory hook ----------------------------------------------------- */}
        <div
          className="mt-3 rounded-xl px-4 py-3.5"
          style={{
            background:
              "color-mix(in oklch, var(--color-accent) 12%, transparent)",
            border:
              "1px solid color-mix(in oklch, var(--color-accent) 28%, transparent)",
          }}
        >
          <div className="text-xs font-semibold tracking-[0.08em] text-accent uppercase">
            Remember it
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-(--color-ink)">
            {current.hint}
          </p>
        </div>

        {current.group && (
          <div
            className="mt-2.5 flex items-center gap-3 rounded-xl px-4 py-3"
            style={{
              background:
                "color-mix(in oklch, var(--color-warn) 9%, transparent)",
              border:
                "1px solid color-mix(in oklch, var(--color-warn) 18%, transparent)",
            }}
          >
            <span className="text-xs font-semibold tracking-[0.08em] text-warn uppercase">
              Easily confused
            </span>
            <span
              className="heb ml-auto text-lg"
              style={{ fontFamily: "var(--font-hebrew)" }}
            >
              {GROUP_LABEL[current.group]}
            </span>
          </div>
        )}

        <div className="mt-4 text-center text-xs text-ink-3">
          {index + 1} of {LETTERS.length}
        </div>
      </div>
    </div>
  );
}

function Glyph({
  char,
  caption,
  cursive,
  emphasis,
}: {
  char: string;
  caption: string;
  cursive: boolean;
  emphasis: boolean;
}) {
  return (
    <div
      className="flex flex-col items-center"
      style={{ opacity: emphasis ? 1 : 0.5 }}
    >
      <span
        className={`heb leading-none ${cursive ? "heb-cursive" : ""}`}
        style={{
          fontSize: emphasis ? 84 : 58,
          fontFamily: cursive ? undefined : "var(--font-hebrew)",
          transition: "font-size 180ms var(--ease-out-quart)",
        }}
      >
        {char}
      </span>
      <span className="mt-3 text-xs font-semibold tracking-[0.1em] text-ink-3 uppercase">
        {caption}
      </span>
    </div>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="panel flex items-center justify-between gap-4 rounded-xl px-4 py-3">
      <span className="shrink-0 text-sm text-ink-3">{label}</span>
      <span className={`text-right text-sm font-medium ${mono ? "tnum" : ""}`}>
        {value}
      </span>
    </div>
  );
}

function Arrow({
  dir,
  onClick,
}: {
  dir: "prev" | "next";
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={dir === "prev" ? "Previous letter" : "Next letter"}
      className="tap grid size-9 shrink-0 place-items-center rounded-full bg-surface text-ink-3"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ transform: dir === "prev" ? "rotate(180deg)" : undefined }}
      >
        <path d="m9 6 6 6-6 6" />
      </svg>
    </button>
  );
}
