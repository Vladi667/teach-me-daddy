"use client";

import { tap } from "@/lib/feedback";

interface SegmentedProps<T extends string> {
  options: readonly { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
}

/** iOS-style segmented control with a sliding panel thumb. */
export default function Segmented<T extends string>({
  options,
  value,
  onChange,
}: SegmentedProps<T>) {
  const index = Math.max(
    0,
    options.findIndex((o) => o.id === value),
  );

  return (
    <div
      className="panel relative flex rounded-xl p-1"
      role="tablist"
      aria-orientation="horizontal"
    >
      <div
        aria-hidden
        className="absolute top-1 bottom-1 rounded-lg"
        style={{
          width: `calc((100% - 8px) / ${options.length})`,
          left: 4,
          transform: `translateX(${index * 100}%)`,
          background: "var(--color-surface-2)",
          boxShadow:
            "0 1px 0 0 rgba(255,255,255,0.2) inset, 0 4px 14px -6px rgba(0,0,0,0.9)",
          transition: "transform 180ms var(--ease-out-quart)",
        }}
      />
      {options.map((o) => {
        const active = o.id === value;
        return (
          <button
            key={o.id}
            role="tab"
            aria-selected={active}
            onClick={() => {
              if (!active) {
                tap();
                onChange(o.id);
              }
            }}
            className="relative z-10 flex-1 rounded-lg py-2 text-sm font-semibold tracking-[-0.01em] transition-colors duration-200"
            style={{
              color: active ? "var(--color-ink)" : "var(--color-ink-3)",
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
