"use client";

import { useEffect, useRef, useState } from "react";
import { asset } from "@/lib/base-path";
import { tap } from "@/lib/feedback";

type Speed = "slow" | "natural";

/**
 * Plays a line. Slow by default, because the first thing you do with a new
 * line is hear it deliberately; natural is one tap away for shadowing.
 *
 * Renders nothing if the file is missing — the corpus outruns the audio, and a
 * dead button is worse than no button.
 */
export default function LineAudio({
  lineId,
  showNatural = false,
}: {
  lineId: string;
  showNatural?: boolean;
}) {
  const [playing, setPlaying] = useState<Speed | null>(null);
  const [missing, setMissing] = useState(false);
  const ref = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      ref.current?.pause();
      ref.current = null;
    };
  }, []);

  function play(speed: Speed) {
    tap();
    ref.current?.pause();
    const a = new Audio(asset(`/audio/${lineId}-${speed}.mp3`));
    ref.current = a;
    setPlaying(speed);
    a.onended = () => setPlaying(null);
    a.onerror = () => {
      setPlaying(null);
      setMissing(true);
    };
    void a.play().catch(() => {
      setPlaying(null);
      setMissing(true);
    });
  }

  if (missing) return null;

  return (
    <span className="flex shrink-0 items-center gap-1.5">
      <button
        onClick={() => play("slow")}
        aria-label="Play slowly"
        className="tap grid size-9 place-items-center rounded-full"
        style={{
          background:
            playing === "slow" ? "var(--color-accent)" : "var(--color-surface)",
          border: "1px solid var(--color-line)",
          color:
            playing === "slow"
              ? "var(--color-accent-ink)"
              : "var(--color-ink-2)",
        }}
      >
        <Speaker />
      </button>

      {showNatural && (
        <button
          onClick={() => play("natural")}
          aria-label="Play at natural speed"
          className="tap grid h-9 min-w-9 place-items-center rounded-full px-2.5 text-xs font-semibold"
          style={{
            background:
              playing === "natural"
                ? "var(--color-accent)"
                : "var(--color-surface)",
            border: "1px solid var(--color-line)",
            color:
              playing === "natural"
                ? "var(--color-accent-ink)"
                : "var(--color-ink-3)",
          }}
        >
          1×
        </button>
      )}
    </span>
  );
}

function Speaker() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11 5 6.5 9H3v6h3.5L11 19z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7" />
    </svg>
  );
}
