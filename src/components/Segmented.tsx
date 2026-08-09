"use client";

import { tap } from "@/lib/feedback";

interface SegmentedProps<T extends string> {
  options: readonly { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
}

/** iOS-style segmented control with a sliding glass thumb. */
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
      className="glass relative flex rounded-[18px] p-1"
      role="tablist"
      aria-orientation="horizontal"
    >
      <div
        aria-hidden
        className="absolute top-1 bottom-1 rounded-[14px]"
        style={{
          width: `calc((100% - 8px) / ${options.length})`,
          left: 4,
          transform: `translateX(${index * 100}%)`,
          background: "rgba(255,255,255,0.12)",
          boxShadow:
            "0 1px 0 0 rgba(255,255,255,0.2) inset, 0 4px 14px -6px rgba(0,0,0,0.9)",
          transition: "transform 460ms var(--ease-spring)",
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
            className="relative z-10 flex-1 rounded-[14px] py-2 text-[13px] font-semibold tracking-[-0.01em] transition-colors duration-200"
            style={{
              color: active ? "var(--color-ink)" : "var(--color-ink-faint)",
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
