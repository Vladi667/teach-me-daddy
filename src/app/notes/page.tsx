"use client";

import { useState } from "react";
import { customId, type CustomItem } from "@/lib/notes";
import { removeCustom, upsertCustom, useStore } from "@/lib/store";
import { nowMs } from "@/lib/clock";
import { tap } from "@/lib/feedback";

/**
 * Field notes — PROGRAMME.md §9.
 *
 * Words met outside the programme, from a tutor or a sign or a podcast. They
 * are kept because forgetting them is a waste, and kept *here* because the
 * syllabus decides what the trainee studies. A note never enters the daily
 * assignment, never counts toward readiness, and never delays a block.
 *
 * This is what is left of the old Words screen. The deck browser it used to
 * wrap is gone: §9 forbids reading ahead, and a searchable list of every line
 * in the programme is exactly that.
 */
export default function NotesPage() {
  const { data, ready } = useStore();
  const [adding, setAdding] = useState(false);
  const [he, setHe] = useState("");
  const [meaning, setMeaning] = useState("");
  const [source, setSource] = useState("");
  const [problem, setProblem] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const notes = [...(data.custom ?? [])].sort(
    (a, b) => b.createdAt - a.createdAt,
  );
  const gloss = data.settings.gloss;

  function save() {
    if (!he.trim() || !meaning.trim()) return;
    if (!/[֐-׿]/.test(he)) {
      setProblem("The Hebrew field needs Hebrew letters.");
      return;
    }
    const item: CustomItem = {
      id: customId(he.trim()),
      group: "captured",
      he: he.trim(),
      tr: "",
      fr: gloss === "fr" ? meaning.trim() : "",
      en: gloss === "en" ? meaning.trim() : "",
      createdAt: nowMs(),
      source: source.trim() || undefined,
    };
    const fresh = upsertCustom(item);
    tap();
    setNote(fresh ? "Noted." : "Updated — you had that one already.");
    setHe("");
    setMeaning("");
    setSource("");
    setProblem(null);
    setAdding(false);
  }

  if (!ready) {
    return <p className="py-10 text-center text-sm text-ink-3">Loading…</p>;
  }

  return (
    <>
      <header className="mb-5">
        <p className="eyebrow">Field notes</p>
        <h1 className="mt-1 text-lg leading-tight font-semibold">
          Words from outside
        </h1>
        <p className="mt-3 text-base leading-snug text-ink-2">
          Anything you meet with your tutor or in the wild. Kept, not taught —
          notes never enter the assignment or count toward readiness.
        </p>
      </header>

      {note && (
        <p className="mb-4 text-sm" style={{ color: "var(--color-good)" }}>
          {note}
        </p>
      )}

      {!adding ? (
        <button
          onClick={() => {
            tap();
            setNote(null);
            setAdding(true);
          }}
          className="btn btn-primary mb-6 w-full"
        >
          Note a word
        </button>
      ) : (
        <div className="panel mb-6 flex flex-col gap-2 rounded-2xl px-4 py-4">
          <input
            value={he}
            onChange={(e) => setHe(e.target.value)}
            dir="rtl"
            placeholder="עברית"
            className="heb rounded-lg bg-surface px-3 py-2.5 text-right text-md"
          />
          <input
            value={meaning}
            onChange={(e) => setMeaning(e.target.value)}
            placeholder={gloss === "fr" ? "Sens en français" : "Meaning"}
            className="rounded-lg bg-surface px-3 py-2.5 text-base"
          />
          <input
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="Where you met it (optional)"
            className="rounded-lg bg-surface px-3 py-2.5 text-sm"
          />
          {problem && (
            <p className="text-xs" style={{ color: "var(--color-bad)" }}>
              {problem}
            </p>
          )}
          <div className="mt-1 grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                tap();
                setAdding(false);
                setProblem(null);
              }}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={!he.trim() || !meaning.trim()}
              className="btn btn-primary"
            >
              Save
            </button>
          </div>
        </div>
      )}

      {notes.length === 0 ? (
        <p className="text-sm text-ink-3">
          Nothing noted yet. §7 puts you with a tutor three times a week — this
          is where what they teach you goes.
        </p>
      ) : (
        <>
          <h2 className="eyebrow mb-1">{notes.length} noted</h2>
          <ul className="flex flex-col">
            {notes.map((n, i) => (
              <li
                key={n.id}
                className="flex items-start gap-3 py-3"
                style={{
                  borderBottom:
                    i === notes.length - 1
                      ? "none"
                      : "1px solid var(--color-line)",
                }}
              >
                <span className="min-w-0 flex-1">
                  <span className="heb block text-md leading-snug">{n.he}</span>
                  <span className="mt-1 block text-sm text-ink-3">
                    {gloss === "fr" ? n.fr || n.en : n.en || n.fr}
                    {n.source ? ` · ${n.source}` : ""}
                  </span>
                </span>
                <button
                  onClick={() => {
                    tap();
                    removeCustom(n.id);
                  }}
                  aria-label={`Delete ${n.he}`}
                  className="tap shrink-0 rounded-lg px-2.5 py-1.5 text-xs"
                  style={{ color: "var(--color-ink-3)" }}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
