"use client";

import { phonetic } from "@/lib/translit";
import type { Line } from "@/lib/programme";

/**
 * The romanised line, under the Hebrew.
 *
 * Deliberately quieter than both the Hebrew and the gloss: it is a crutch for
 * reading aloud, and the plan (§9.5) wants the trainee off it and onto
 * unpointed text early. Loud phonetics train you to read the phonetics.
 *
 * Never rendered on the assessment passage — being able to sound out a word
 * you do not know would inflate the coverage score §6 measures.
 */
export default function Phonetic({
  line,
  className = "",
}: {
  line: Pick<Line, "he" | "tr">;
  className?: string;
}) {
  const t = phonetic(line);
  if (!t) return null;
  return (
    <span
      dir="ltr"
      className={`block text-sm text-ink-3 italic ${className}`}
      style={{ letterSpacing: "0.01em" }}
    >
      {t}
    </span>
  );
}
