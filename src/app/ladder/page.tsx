"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  LAST_RUNG,
  RUNGS,
  clearedIn,
  nextPassage,
  openRung,
  rungAt,
  tokens,
  type LadderPassage,
} from "@/lib/ladder";
import { breakdown } from "@/lib/blend";
import { translit } from "@/lib/translit";
import { isBanked } from "@/lib/progress";
import { update, useStore } from "@/lib/store";
import { wpm } from "@/lib/reading";
import { nowMs, useToday } from "@/lib/clock";
import { LINK_PREFETCH } from "@/lib/base-path";
import LineAudio from "@/components/LineAudio";
import { success, tap } from "@/lib/feedback";

type Phase = "brief" | "reading" | "review";

/** A word the reader stopped on, addressed by position so repeats stay apart. */
interface Stop {
  key: string;
  word: string;
}

/**
 * §8e — the decoding ladder.
 *
 * Not the timed reading library: that measures how fast you read text you can
 * already decode. This is where decoding itself is built, on text restricted
 * to the letters you have actually banked.
 *
 * Help costs something on purpose. A free reveal turns reading into looking —
 * you tap every word, understand the line, and learn nothing, because nothing
 * was retrieved. So there are two tiers and both are counted: a tap splits the
 * word into syllables, which is help with *chunking* and still leaves the
 * sounding-out to you; a second, deliberate press spells it out. Either one
 * costs the clean mark, and only a clean read retires a passage.
 *
 * The passage that beat you comes back rather than being skipped, and the
 * review names the words that did it. That is the whole progression rule.
 */
export default function LadderPage() {
  const { data, ready } = useStore();
  const today = useToday();
  const [phase, setPhase] = useState<Phase>("brief");
  const [current, setCurrent] = useState<LadderPassage | null>(null);
  const [hinted, setHinted] = useState<Stop[]>([]);
  const [revealed, setRevealed] = useState<Stop[]>([]);
  const [open, setOpen] = useState<Stop | null>(null);
  const [spelled, setSpelled] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const startedAt = useRef(0);

  const done = data.ladder ?? {};
  const alphabet = data.alphabet ?? {};
  // A rung opens only when every one of its glyphs is banked in the drill.
  // Memoised on `data.alphabet` itself: the `?? {}` above builds a fresh
  // object every render, which would defeat the memo entirely.
  const openTo = useMemo(
    () => openRung((g) => isBanked(data.alphabet ?? {}, g)),
    [data.alphabet],
  );
  const upNext = current ?? nextPassage(done, openTo);
  const cleared = Object.values(done).filter((d) => d.clean).length;
  const total = RUNGS.reduce((n, r) => n + r.passages.length, 0);

  function begin(p: LadderPassage) {
    tap();
    setCurrent(p);
    setHinted([]);
    setRevealed([]);
    setOpen(null);
    setPhase("reading");
    startedAt.current = nowMs();
  }

  /** A tap is the cheap tier: it buys the syllable split, nothing more. */
  function stopOn(key: string, word: string) {
    tap();
    setOpen({ key, word });
    setSpelled(false);
    setHinted((h) => (h.some((x) => x.key === key) ? h : [...h, { key, word }]));
  }

  /** The expensive tier, and it has to be asked for. */
  function spellOut() {
    if (!open) return;
    tap();
    setSpelled(true);
    setRevealed((r) =>
      r.some((x) => x.key === open.key) ? r : [...r, { key: open.key, word: open.word }],
    );
  }

  function finish() {
    if (!current || !today) return;
    const took = nowMs() - startedAt.current;
    const clean = hinted.length === 0 && revealed.length === 0;
    if (clean) success();
    else tap();
    const speed = wpm(current.words, took);
    setElapsed(took);
    update((d) => {
      const prev = (d.ladder ?? {})[current.id];
      return {
        ...d,
        ladder: {
          ...(d.ladder ?? {}),
          [current.id]: {
            // Only a clean sitting sets the speed; a helped one is not a time.
            wpm: clean ? Math.max(speed, prev?.clean ? prev.wpm : 0) : (prev?.wpm ?? 0),
            clean: clean || !!prev?.clean,
            hints: hinted.length,
            reveals: revealed.length,
            missed: revealed.map((r) => r.word),
            on: today,
          },
        },
      };
    });
    setOpen(null);
    setPhase("review");
  }

  if (!ready) {
    return <p className="py-10 text-center text-sm text-ink-3">Loading…</p>;
  }

  /* --- nothing open yet --------------------------------------------------- */

  if (openTo === 0) {
    const r1 = RUNGS[0];
    const need = [...r1.letters, ...r1.finals];
    const have = need.filter((g) => isBanked(alphabet, g)).length;
    return (
      <div className="py-6">
        <p className="eyebrow">Decoding ladder</p>
        <h1 className="mt-1 text-lg leading-tight font-semibold">
          Bank six letters first
        </h1>
        <p className="mt-3 text-base leading-snug text-ink-2">
          There is nothing to read until you can read something. Rung 1 opens
          when all {need.length} of these are locked in — {have} so far.
        </p>
        <p
          dir="rtl"
          className="heb panel mt-5 rounded-2xl px-4 py-6 text-center text-[34px] leading-none"
          style={{ fontFamily: "var(--font-hebrew)" }}
        >
          {need.map((g) => (
            <span
              key={g}
              style={{ opacity: isBanked(alphabet, g) ? 1 : 0.3, marginInline: 6 }}
            >
              {g}
            </span>
          ))}
        </p>
        <Link
          href="/practice"
          prefetch={LINK_PREFETCH}
          onClick={tap}
          className="btn btn-primary mt-6 w-full"
        >
          Go to the drill
        </Link>
        <Back quiet />
      </div>
    );
  }

  /* --- the brief ---------------------------------------------------------- */

  if (phase === "brief") {
    if (!upNext) {
      const nextRung = rungAt(openTo + 1);
      return (
        <div className="py-6">
          <p className="eyebrow">Decoding ladder</p>
          <h1 className="mt-1 text-lg leading-tight font-semibold">
            {nextRung ? "Rung clear" : "Ladder finished"}
          </h1>
          <p className="mt-3 text-base leading-snug text-ink-2">
            {nextRung
              ? `Everything open has been read clean. Rung ${nextRung.n} needs ${nextRung.added.join(" ")} banked in the drill.`
              : `All ${total} passages read clean, on the whole alphabet.`}
          </p>
          {nextRung && (
            <Link
              href="/practice"
              prefetch={LINK_PREFETCH}
              onClick={tap}
              className="btn btn-primary mt-6 w-full"
            >
              Go to the drill
            </Link>
          )}
          <Back quiet={!!nextRung} />
        </div>
      );
    }

    const r = rungAt(upNext.rung)!;
    const { cleared: cl, total: tt } = clearedIn(r.n, done);
    const log = done[upNext.id];
    return (
      <div className="py-2">
        <p className="eyebrow">
          Decoding ladder · rung {r.n} of {LAST_RUNG}
        </p>
        <h1 className="mt-1 text-lg leading-tight font-semibold">{r.title}</h1>
        <p className="mt-4 text-base leading-snug text-ink-2">
          {upNext.kind === "phrases"
            ? "Real phrases, cut so every letter in them is one you have banked. Read each aloud."
            : "Whole sentences now, still only in letters you have banked."}
        </p>

        <p
          dir="rtl"
          className="heb panel mt-5 rounded-2xl px-4 py-4 text-center text-[26px] leading-none"
          style={{ fontFamily: "var(--font-hebrew)" }}
        >
          {r.letters.map((g) => (
            <span key={g} style={{ marginInline: 4 }}>
              {g}
            </span>
          ))}
        </p>

        <dl className="mt-6 mb-7 flex flex-col">
          <Fact k="Words" v={String(upNext.words)} />
          <Fact k="Letters" v={`${r.letters.length} of 22`} />
          <Fact k="This rung" v={`${cl} of ${tt} clean`} />
          <Fact
            k="Last time"
            v={log ? `${log.hints} hints · ${log.reveals} revealed` : "—"}
            last
          />
        </dl>

        <button onClick={() => begin(upNext)} className="btn btn-primary w-full">
          Start
        </button>
        <p className="mt-3 text-center text-xs leading-relaxed text-ink-3">
          Tap a word you cannot read and it splits into syllables. That counts.
          Only a passage read with no help at all is retired.
        </p>
        <Back quiet />
      </div>
    );
  }

  /* --- the read ----------------------------------------------------------- */

  if (phase === "reading" && current) {
    return (
      <div className="flex flex-col">
        <header className="mb-4 flex items-baseline justify-between">
          <p className="eyebrow">Rung {current.rung}</p>
          <span className="text-sm text-ink-3 tnum">
            {revealed.length + hinted.length > 0
              ? `${hinted.length} hints · ${revealed.length} revealed`
              : `${current.words} words`}
          </span>
        </header>

        <div className="panel rounded-2xl px-4 py-5">
          {current.lines.map((line, li) => (
            <p
              key={li}
              dir="rtl"
              className="heb mb-3 text-right text-[26px] leading-[1.9]"
              style={{ fontFamily: "var(--font-hebrew)" }}
            >
              {tokens(line.he).map((tk, ti) => {
                const key = `${li}:${ti}`;
                if (!tk.word) return <span key={key}>{tk.t}</span>;
                const wasHinted = hinted.some((x) => x.key === key);
                const wasRevealed = revealed.some((x) => x.key === key);
                return (
                  <span
                    key={key}
                    role="button"
                    tabIndex={0}
                    onClick={() => stopOn(key, tk.t)}
                    onKeyDown={(e) => e.key === "Enter" && stopOn(key, tk.t)}
                    className="tap"
                    style={{
                      cursor: "pointer",
                      borderBottom: wasRevealed
                        ? "2px solid var(--color-bad)"
                        : wasHinted
                          ? "2px solid var(--color-line-strong)"
                          : "2px solid transparent",
                    }}
                  >
                    {tk.t}
                  </span>
                );
              })}
            </p>
          ))}
        </div>

        {/* Hidden while the sheet is up: you are mid-word, not finished. */}
        {!open && (
          <div
            className="sticky mt-4 pt-4 pb-3"
            style={{
              bottom: "calc(var(--safe-b) + var(--tabbar-h) + 8px)",
              marginInline: "calc(var(--gutter) * -1)",
              paddingInline: "var(--gutter)",
              background:
                "linear-gradient(to top, var(--color-canvas) 70%, transparent)",
            }}
          >
            <button onClick={finish} className="btn btn-primary w-full">
              Done
            </button>
          </div>
        )}

        {/* The help sheet. Syllables on opening; spelling only if asked. */}
        {open && (
          <>
            {/* Above the tab bar, not level with it. At the same z-index the
                bar swallows the taps meant for the button below. */}
            <button
              aria-label="Dismiss help"
              onClick={() => {
                tap();
                setOpen(null);
              }}
              className="fixed inset-0 z-[59]"
              style={{ background: "color-mix(in oklch, var(--color-ink) 28%, transparent)" }}
            />
            {/* `chrome` rather than a panel colour: the panel token is
                translucent, so the passage read straight through the sheet.
                This is the app's own answer to a floating surface, and it
                turns opaque under reduced-transparency. */}
            <div
              className="chrome fixed inset-x-0 bottom-0 z-[60]"
              style={{
                padding: "var(--gutter)",
                paddingBottom: "calc(var(--safe-b) + 16px)",
                borderTop: "1px solid var(--color-line)",
                borderRadius: "20px 20px 0 0",
              }}
            >
            <div className="flex items-baseline justify-between">
              <p className="eyebrow">Stopped on</p>
              <button
                onClick={() => {
                  tap();
                  setOpen(null);
                }}
                className="text-sm text-ink-3"
              >
                Close
              </button>
            </div>

            <div className="mt-3 flex items-baseline justify-center gap-2">
              {breakdown(open.word).map((b, i, arr) => (
                <span key={i} className="flex items-baseline gap-2">
                  <span
                    className="heb text-[34px] leading-none"
                    style={{ fontFamily: "var(--font-hebrew)" }}
                  >
                    {b.part}
                  </span>
                  {i < arr.length - 1 && (
                    <span className="text-lg text-ink-3">·</span>
                  )}
                </span>
              ))}
            </div>

            {spelled ? (
              <p className="mt-4 text-center text-lg font-semibold italic">
                {translit(open.word).toLowerCase()}
              </p>
            ) : (
              <>
                <p className="mt-4 text-center text-sm leading-relaxed text-ink-3">
                  Sound it out from the split before you take the answer.
                </p>
                <button
                  onClick={spellOut}
                  className="btn btn-secondary mt-3 w-full text-sm"
                >
                  Spell it out for me
                </button>
              </>
            )}
            </div>
          </>
        )}
      </div>
    );
  }

  /* --- the review --------------------------------------------------------- */

  const log = current ? done[current.id] : undefined;
  const wasClean = hinted.length === 0 && revealed.length === 0;
  const speed = current ? wpm(current.words, elapsed) : 0;
  return (
    <div className="py-4">
      <p className="eyebrow">Rung {current?.rung}</p>
      <h1 className="mt-1 text-lg leading-tight font-semibold">
        {wasClean ? `Clean · ${speed} words a minute` : "Not clean yet"}
      </h1>
      <p className="mt-3 text-base leading-snug text-ink-2">
        {wasClean
          ? `Retired. ${cleared} of ${total} passages read clean.`
          : `${hinted.length} hinted, ${revealed.length} spelled out. It comes back until you read it without help.`}
      </p>

      {/* What actually stopped you, which is the only useful part of a score. */}
      {revealed.length > 0 && (
        <div className="panel mt-5 rounded-2xl px-4 py-4">
          <p className="eyebrow mb-3">The words that stopped you</p>
          {revealed.map((r) => (
            <div
              key={r.key}
              className="flex items-baseline justify-between gap-3 py-2"
              style={{ borderBottom: "1px solid var(--color-line)" }}
            >
              <span
                className="heb text-[22px] leading-none"
                style={{ fontFamily: "var(--font-hebrew)" }}
              >
                {breakdown(r.word).map((b) => b.part).join(" · ")}
              </span>
              <span className="text-sm text-ink-3 italic">
                {translit(r.word).toLowerCase()}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* The gloss and the recording come after the read, never during it. */}
      {current && current.kind === "text" && (
        <div className="panel mt-4 rounded-2xl px-4 py-4">
          {current.lines.map((l, i) => (
            <div key={i} className="mb-3 last:mb-0">
              <p className="text-sm leading-snug text-ink-2">{l.fr}</p>
              {l.src && <LineAudio lineId={l.src} showNatural />}
            </div>
          ))}
        </div>
      )}

      <button
        onClick={() => {
          tap();
          if (wasClean) setCurrent(null);
          setPhase("brief");
        }}
        className="btn btn-primary mt-6 w-full"
      >
        {wasClean ? "Next passage" : "Read it again"}
      </button>
      <Back quiet />
      <p className="mt-4 text-center text-xs text-ink-3">
        Rung {openTo} of {LAST_RUNG} open · {log?.clean ? "retired" : "in the queue"}
      </p>
    </div>
  );
}

function Back({ quiet }: { quiet?: boolean }) {
  return (
    <Link
      href="/me"
      prefetch={LINK_PREFETCH}
      onClick={tap}
      className={`btn ${quiet ? "btn-quiet" : "btn-primary"} mt-2 w-full text-sm`}
    >
      Done for now
    </Link>
  );
}

function Fact({ k, v, last }: { k: string; v: string; last?: boolean }) {
  return (
    <div
      className="flex items-baseline justify-between gap-4 py-2.5"
      style={{ borderBottom: last ? "none" : "1px solid var(--color-line)" }}
    >
      <dt className="text-base text-ink-2">{k}</dt>
      <dd className="text-base font-semibold tnum">{v}</dd>
    </div>
  );
}
