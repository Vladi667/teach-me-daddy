"use client";

import { useEffect, useRef, useState } from "react";
import {
  rubberband,
  settled,
  springStep,
  swipeOutcome,
  velocityFrom,
  type SpringState,
} from "@/lib/motion";

/** Past this much travel the card is committed, unless it is thrown sooner. */
const THRESHOLD = 96;
/** Below this the gesture is still deciding whether it is a tap or a drag. */
const HYSTERESIS = 10;

export interface SwipeCardProps {
  children: React.ReactNode;
  /** Enabled only once there is something to grade. */
  active: boolean;
  onLeft: () => void;
  onRight: () => void;
  leftLabel: string;
  rightLabel: string;
  className?: string;
}

/**
 * A card you can throw.
 *
 * The whole of *Designing Fluid Interfaces* in one component: the card tracks
 * the finger 1:1 from where it was grabbed, resists past the edges rather than
 * stopping dead, projects where a flick was going rather than snapping from
 * where it was released, and can be caught and reversed mid-flight because the
 * spring animates from the live on-screen value.
 *
 * Give it a `key` that changes per card: a new card should arrive centred,
 * and remounting says that far more plainly than resetting state in an effect.
 *
 * The grade buttons underneath are unchanged. This is a faster path for the
 * common answer, not a replacement — a gesture nobody discovers is not a
 * feature, and a gesture that is the only way in is an accessibility failure.
 */
export default function SwipeCard({
  children,
  active,
  onLeft,
  onRight,
  leftLabel,
  rightLabel,
  className = "",
}: SwipeCardProps) {
  const el = useRef<HTMLDivElement | null>(null);
  const [x, setX] = useState(0);
  const [dragging, setDragging] = useState(false);

  // Everything the gesture needs lives in a ref: writing it to state would
  // re-render on every pointermove and put React between finger and pixel.
  const g = useRef({
    down: false,
    committed: false,
    startX: 0,
    samples: [] as { x: number; t: number }[],
    raf: 0,
    spring: { value: 0, velocity: 0 } as SpringState,
  });

  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  /** Animate to a target from wherever the card is now, at whatever speed. */
  function springTo(target: number, velocity: number, done?: () => void) {
    cancelAnimationFrame(g.current.raf);
    if (reduced) {
      setX(target);
      done?.();
      return;
    }
    g.current.spring = { value: x, velocity };
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      g.current.spring = springStep(g.current.spring, target, dt, 1, 0.35);
      setX(g.current.spring.value);
      if (settled(g.current.spring, target)) {
        setX(target);
        done?.();
        return;
      }
      g.current.raf = requestAnimationFrame(tick);
    };
    g.current.raf = requestAnimationFrame(tick);
  }

  useEffect(() => () => cancelAnimationFrame(g.current.raf), []);

  function onPointerDown(e: React.PointerEvent) {
    if (!active || e.pointerType === "mouse" && e.button !== 0) return;
    // Catch a card that is still moving, rather than waiting for it to land.
    cancelAnimationFrame(g.current.raf);
    el.current?.setPointerCapture(e.pointerId);
    g.current.down = true;
    g.current.startX = e.clientX - x;
    g.current.samples = [{ x: e.clientX, t: e.timeStamp }];
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!g.current.down) return;
    const raw = e.clientX - g.current.startX;
    g.current.samples.push({ x: e.clientX, t: e.timeStamp });
    if (g.current.samples.length > 12) g.current.samples.shift();

    if (!dragging && Math.abs(raw) < HYSTERESIS) return;
    if (!dragging) setDragging(true);

    // 1:1 to the threshold, then progressively heavier: the card keeps
    // answering the finger, but tells you there is nothing further out.
    const width = el.current?.offsetWidth ?? 320;
    const over = Math.abs(raw) - THRESHOLD;
    const next =
      over <= 0
        ? raw
        : Math.sign(raw) * (THRESHOLD + rubberband(over, width));
    setX(next);
  }

  function end() {
    if (!g.current.down) return;
    g.current.down = false;
    setDragging(false);
    const v = velocityFrom(g.current.samples);
    const outcome = swipeOutcome(x, v, THRESHOLD);

    if (outcome === 0) {
      springTo(0, v);
      return;
    }
    // Off the edge in the direction it was thrown, then hand over.
    const width = el.current?.offsetWidth ?? 320;
    if (g.current.committed) return;
    g.current.committed = true;
    springTo(outcome * (width + 80), v, () => {
      (outcome === 1 ? onRight : onLeft)();
    });
  }

  // §8 — the card hints at the outcome while the gesture is still happening.
  const progress = Math.min(1, Math.abs(x) / THRESHOLD);
  const side = x > 0 ? "right" : "left";

  return (
    <div className="relative">
      {/* The verdict shows through from underneath as the card moves off it. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 flex items-center px-6"
        style={{
          justifyContent: side === "right" ? "flex-start" : "flex-end",
          opacity: progress,
        }}
      >
        <span
          className="text-md font-semibold"
          style={{
            color: side === "right" ? "var(--color-good)" : "var(--color-bad)",
          }}
        >
          {side === "right" ? rightLabel : leftLabel}
        </span>
      </div>

      <div
        ref={el}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={end}
        onPointerCancel={end}
        className={className}
        style={{
          transform: `translate3d(${x}px, 0, 0) rotate(${x * 0.02}deg)`,
          touchAction: "pan-y",
          // Dragging across a sentence would otherwise select it, and a
          // half-highlighted line under your thumb reads as a glitch.
          userSelect: "none",
          WebkitUserSelect: "none",
          cursor: active ? "grab" : undefined,
          willChange: dragging ? "transform" : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
}
