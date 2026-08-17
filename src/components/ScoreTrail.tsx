interface ScoreTrailProps {
  /** Percentages, oldest first. */
  runs: number[];
  /** The mark the bars are measured against. */
  pass?: number;
  height?: number;
  /** Show at most this many, keeping the most recent. */
  limit?: number;
}

/**
 * Every run you have sat, in order, as bars.
 *
 * Deliberately not a line chart with axes: the question it answers is "is this
 * going up", and a shape answers that faster than numbers do. The latest run
 * takes the accent so the eye lands on where you are now, and the pass mark is
 * a hairline across the whole thing rather than a labelled axis.
 */
export default function ScoreTrail({
  runs,
  pass = 80,
  height = 44,
  limit = 16,
}: ScoreTrailProps) {
  if (!runs.length) return null;
  const shown = runs.slice(-limit);
  const dropped = runs.length - shown.length;

  return (
    <div
      className="relative flex items-end gap-[3px]"
      style={{ height }}
      role="img"
      aria-label={`${runs.length} runs, oldest to newest: ${runs.join("%, ")}%`}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0"
        style={{
          bottom: `${pass}%`,
          borderTop: "1px dashed var(--color-line-strong)",
        }}
      />
      {dropped > 0 && (
        <span className="self-end pr-1 text-xs text-ink-3 tnum">
          +{dropped}
        </span>
      )}
      {shown.map((v, i) => {
        const last = i === shown.length - 1;
        return (
          <span
            key={i}
            className="min-w-[6px] flex-1 rounded-[2px]"
            style={{
              // A zero-scoring run still gets a stub, or it reads as untaken.
              height: `${Math.max(4, v)}%`,
              background: last
                ? "var(--color-accent)"
                : v >= pass
                  ? "color-mix(in oklch, var(--color-good) 45%, transparent)"
                  : "var(--color-line-strong)",
            }}
          />
        );
      })}
    </div>
  );
}
