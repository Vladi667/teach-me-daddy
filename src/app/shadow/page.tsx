"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LINES, LAST_SEEDED_DAY } from "@/lib/lines";
import { cardId, dayNumber } from "@/lib/programme";
import { emptyDay } from "@/lib/plan";
import { isMature } from "@/lib/srs";
import { update, useStore } from "@/lib/store";
import { useToday } from "@/lib/clock";
import { asset, LINK_PREFETCH } from "@/lib/base-path";
import { tap } from "@/lib/feedback";

/** §3 block 2. Not graded — shadowing is repetitions, not recall. */
const SAMPLE_MATURE = 6;

export default function ShadowPage() {
  const { data, ready } = useStore();
  const today = useToday();
  const [set, setSet] = useState<typeof LINES | null>(null);
  const [i, setI] = useState(0);
  const [reps, setReps] = useState(0);
  const [recording, setRecording] = useState(false);
  const [mine, setMine] = useState<string | null>(null);
  const [micError, setMicError] = useState<string | null>(null);

  const nativeRef = useRef<HTMLAudioElement | null>(null);
  const mineRef = useRef<HTMLAudioElement | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);

  const startedOn = data.plan.startedOn ?? today;
  const day = today && startedOn ? dayNumber(startedOn, today) : 1;

  // Today's lines, plus a few mature ones so the ear keeps old material warm.
  useEffect(() => {
    if (!ready || set) return;
    const todays = LINES.filter(
      (l) => l.day === Math.min(day, LAST_SEEDED_DAY),
    );
    const mature = LINES.filter((l) => {
      const c = data.srs[cardId(l.id, "read")];
      return c && isMature(c);
    }).slice(-SAMPLE_MATURE);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSet([...todays, ...mature]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const line = set?.[i];

  async function toggleRecord() {
    tap();
    if (recording) {
      recorder.current?.stop();
      setRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunks.current = [];
      rec.ondataavailable = (e) => chunks.current.push(e.data);
      rec.onstop = () => {
        setMine(URL.createObjectURL(new Blob(chunks.current)));
        stream.getTracks().forEach((t) => t.stop());
      };
      recorder.current = rec;
      rec.start();
      setRecording(true);
      setMicError(null);
    } catch {
      // Shadowing still works without a mic: listen and repeat aloud.
      setMicError("No microphone. Play it and repeat out loud.");
    }
  }

  function play(el: HTMLAudioElement | null) {
    if (!el) return;
    el.currentTime = 0;
    void el.play();
    setReps((r) => r + 1);
  }

  function finish() {
    tap();
    if (!today) return;
    update((d) => {
      const prev = d.plan.days[today] ?? emptyDay();
      return {
        ...d,
        plan: {
          ...d.plan,
          startedOn: d.plan.startedOn ?? today,
          days: {
            ...d.plan.days,
            [today]: { ...prev, blocks: { ...prev.blocks, shadow: true } },
          },
        },
      };
    });
  }

  if (!ready || !set) {
    return <p className="py-10 text-center text-sm text-ink-3">Loading…</p>;
  }

  if (!line) {
    return (
      <div className="py-6">
        <h1 className="text-lg font-semibold">
          Shadowing complete
        </h1>
        <p className="mt-2 text-base text-ink-2">
          {set.length} lines. Block 2 logged.
        </p>
        <Link
          href="/"
          prefetch={LINK_PREFETCH}
          onClick={() => {
            finish();
          }}
          className="btn btn-primary mt-6 w-full"
        >
          Back to today
        </Link>
      </div>
    );
  }

  const src = asset(`/audio/${line.id}-natural.mp3`);
  const slow = asset(`/audio/${line.id}-slow.mp3`);

  return (
    <div>
      <header className="mb-6 flex items-baseline justify-between">
        <div>
          <p className="eyebrow">Block 2 · Shadowing</p>
          <h1 className="mt-1 text-lg leading-tight font-semibold">
            Say it over the voice
          </h1>
        </div>
        <span className="text-sm text-ink-3 tnum">
          {i + 1}/{set.length}
        </span>
      </header>

      <div className="panel flex flex-col items-center justify-center rounded-2xl px-5 py-9 text-center">
        <p
          className="heb text-[30px] leading-snug"
          style={{ fontFamily: "var(--font-hebrew)" }}
        >
          {line.he}
        </p>
        <p className="mt-4 text-sm text-ink-3">{line.fr}</p>
        {/* Reserved so the panel doesn't jump the first time you press Play. */}
        <p className="mt-5 h-4 text-xs text-ink-3 tnum">
          {reps > 0 ? `${reps} plays` : ""}
        </p>
      </div>

      <audio ref={nativeRef} src={src} preload="auto" />
      <audio ref={mineRef} src={mine ?? undefined} preload="auto" />

      {micError && (
        <p className="mt-3 text-center text-xs" style={{ color: "var(--color-warn)" }}>
          {micError}
        </p>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          onClick={() => {
            tap();
            play(nativeRef.current);
          }}
          className="btn btn-primary"
        >
          Play
        </button>
        <button
          onClick={() => {
            tap();
            const el = nativeRef.current;
            if (!el) return;
            el.src = slow;
            play(el);
            el.onended = () => {
              el.src = src;
            };
          }}
          className="btn btn-secondary"
        >
          Slower
        </button>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2">
        <button
          onClick={toggleRecord}
          className="btn btn-secondary"
          style={recording ? { borderColor: "var(--color-bad)", color: "var(--color-bad)" } : undefined}
        >
          {recording ? "Stop" : "Record me"}
        </button>
        <button
          onClick={() => {
            tap();
            play(mineRef.current);
          }}
          disabled={!mine}
          className="btn btn-secondary"
        >
          Hear me
        </button>
      </div>

      <button
        onClick={() => {
          tap();
          // A recording and a play count belong to one line, so they reset
          // where the line advances rather than in an effect keyed on the
          // index.
          if (mine) URL.revokeObjectURL(mine);
          setMine(null);
          setReps(0);
          setI((n) => n + 1);
        }}
        className="btn btn-quiet mt-3 w-full text-sm"
      >
        {i + 1 === set.length ? "Finish block" : "Next line"}
      </button>
    </div>
  );
}
