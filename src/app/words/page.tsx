"use client";

import { useMemo, useState } from "react";
import { GROUPS, GROUP_BY_ID, customId, type CustomItem, type Group } from "@/lib/deck";
import { useDeck } from "@/lib/use-deck";
import { isMature, isReview } from "@/lib/srs";
import { mergeCustom, removeCustom, upsertCustom, useStore } from "@/lib/store";
import { CSV_TEMPLATE, parseVocabFile, toCSV } from "@/lib/csv";
import { nowMs } from "@/lib/clock";
import { tap } from "@/lib/feedback";

export default function WordsPage() {
  const { data, ready } = useStore();
  const { items } = useDeck();
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<Group | "all">("all");
  const [adding, setAdding] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const gloss = data.settings.gloss;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((i) => {
      if (group !== "all" && i.group !== group) return false;
      if (!q) return true;
      return (
        i.he.includes(query.trim()) ||
        i.tr.toLowerCase().includes(q) ||
        i.fr.toLowerCase().includes(q) ||
        i.en.toLowerCase().includes(q)
      );
    });
  }, [items, query, group]);

  const counts = useMemo(() => {
    const seen = Object.keys(data.srs).length;
    return {
      total: items.length,
      captured: data.custom.length,
      inReview: Object.values(data.srs).filter(isReview).length,
      mature: Object.values(data.srs).filter(isMature).length,
      seen,
    };
  }, [items, data.srs, data.custom]);

  function download(name: string, text: string, type = "text/csv") {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type }));
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <>
      <header className="anim-rise mb-4 flex items-baseline justify-between">
        <h1 className="text-[27px] font-bold tracking-[-0.03em]">Words</h1>
        <span className="text-[12px] text-(--color-ink-faint) tabular-nums">
          {ready ? counts.total : 0} total
        </span>
      </header>

      {/* counts ----------------------------------------------------------- */}
      <div
        className="anim-rise mb-4 grid grid-cols-3 gap-2"
        style={{ animationDelay: "40ms" }}
      >
        <Tile n={ready ? counts.seen : 0} label="seen" />
        <Tile n={ready ? counts.mature : 0} label="mature" tint="var(--color-mint)" />
        <Tile n={ready ? counts.captured : 0} label="yours" tint="var(--color-accent)" />
      </div>

      {/* add / import ----------------------------------------------------- */}
      {!adding ? (
        <div className="anim-rise mb-4 flex gap-2.5" style={{ animationDelay: "70ms" }}>
          <button
            onClick={() => {
              tap();
              setAdding(true);
              setNote(null);
              setErr(null);
            }}
            className="btn-accent press min-h-[44px] flex-1 rounded-full text-[13px] font-semibold"
          >
            Add a word
          </button>
          <label className="press glass flex min-h-[44px] flex-1 cursor-pointer items-center justify-center rounded-full text-[13px] font-semibold">
            Import
            <input
              type="file"
              accept=".csv,.tsv,.txt,text/csv,text/plain"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (!f) return;
                setNote(null);
                setErr(null);
                try {
                  const res = parseVocabFile(await f.text(), gloss, nowMs());
                  if (!res.items.length) {
                    setErr(
                      res.problems[0] ??
                        "Nothing importable in that file. It needs Hebrew in one column and a meaning in another.",
                    );
                    return;
                  }
                  const { added, updated } = mergeCustom(res.items);
                  setNote(
                    `${added} added${updated ? `, ${updated} updated` : ""}` +
                      (res.skipped ? `, ${res.skipped} skipped` : "") +
                      ".",
                  );
                } catch {
                  setErr("Couldn't read that file.");
                }
              }}
            />
          </label>
        </div>
      ) : (
        <AddForm
          gloss={gloss}
          onCancel={() => {
            tap();
            setAdding(false);
          }}
          onSaved={(msg) => {
            setAdding(false);
            setNote(msg);
          }}
        />
      )}

      {note && (
        <p
          className="anim-fade mb-3 rounded-[14px] px-3.5 py-2.5 text-[12px]"
          style={{ background: "rgba(88,224,106,0.12)", color: "var(--color-mint)" }}
        >
          {note}
        </p>
      )}
      {err && (
        <p
          className="anim-fade mb-3 rounded-[14px] px-3.5 py-2.5 text-[12px] leading-snug"
          style={{ background: "rgba(255,107,122,0.12)", color: "var(--color-coral)" }}
        >
          {err}
        </p>
      )}

      {/* search + filter --------------------------------------------------- */}
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search Hebrew, transliteration or meaning"
        className="mb-3 w-full rounded-[16px] bg-white/6 px-4 py-3 text-[14px] outline-none placeholder:text-(--color-ink-faint)"
        style={{ border: "1px solid rgba(255,255,255,0.1)" }}
      />

      <div className="no-bar mb-4 -mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
        <Chip on={group === "all"} onClick={() => setGroup("all")}>
          All
        </Chip>
        {GROUPS.map((g) => (
          <Chip key={g.id} on={group === g.id} onClick={() => setGroup(g.id)}>
            {g.label}
          </Chip>
        ))}
      </div>

      {group !== "all" && GROUP_BY_ID[group].note && (
        <p className="mb-3 rounded-[14px] bg-white/5 px-3.5 py-2.5 text-[11.5px] leading-snug text-(--color-ink-dim)">
          {GROUP_BY_ID[group].note}
        </p>
      )}

      {/* list -------------------------------------------------------------- */}
      <div className="mb-5 flex flex-col gap-2">
        {filtered.length === 0 && (
          <p className="py-8 text-center text-[13px] text-(--color-ink-faint)">
            Nothing matches.
          </p>
        )}
        {filtered.slice(0, 200).map((item) => {
          const rec = data.srs[`${item.id}:he2m`];
          const state = !rec
            ? null
            : isMature(rec)
              ? "mature"
              : isReview(rec)
                ? "review"
                : "learning";
          return (
            <div
              key={item.id}
              className="glass flex items-center gap-3 rounded-[18px] px-4 py-3"
            >
              <span
                className="heb shrink-0 text-[20px] leading-none"
                style={{ fontFamily: "var(--font-hebrew)" }}
              >
                {item.he}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[12.5px] text-(--color-ink-dim)">
                  {gloss === "fr" ? item.fr || item.en : item.en || item.fr}
                </span>
                <span className="block truncate text-[11px] text-(--color-ink-faint) italic">
                  {item.tr || GROUP_BY_ID[item.group].label}
                </span>
              </span>
              {state && (
                <span
                  className="size-1.5 shrink-0 rounded-full"
                  title={state}
                  style={{
                    background:
                      state === "mature"
                        ? "var(--color-mint)"
                        : state === "review"
                          ? "var(--color-accent)"
                          : "var(--color-amber)",
                  }}
                />
              )}
              {item.group === "captured" && (
                <button
                  onClick={() => {
                    tap();
                    removeCustom(item.id);
                  }}
                  aria-label={`Remove ${item.he}`}
                  className="press shrink-0 text-[11px] text-(--color-ink-faint)"
                >
                  Remove
                </button>
              )}
            </div>
          );
        })}
        {filtered.length > 200 && (
          <p className="py-3 text-center text-[11.5px] text-(--color-ink-faint)">
            Showing the first 200 of {filtered.length}. Narrow the search.
          </p>
        )}
      </div>

      {/* export ------------------------------------------------------------ */}
      <div className="mb-3 flex gap-2.5">
        <button
          onClick={() => {
            tap();
            if (!data.custom.length) {
              setErr("You haven't added any words yet.");
              return;
            }
            download("my-hebrew-words.csv", toCSV(data.custom));
          }}
          className="glass press min-h-[44px] flex-1 rounded-full text-[12.5px] font-semibold"
        >
          Export your words
        </button>
        <button
          onClick={() => {
            tap();
            download("import-template.csv", CSV_TEMPLATE);
          }}
          className="glass press min-h-[44px] flex-1 rounded-full text-[12.5px] font-semibold"
        >
          Template
        </button>
      </div>

      <p className="px-1 text-center text-[11px] leading-relaxed text-(--color-ink-faint)">
        Import takes CSV or tab-separated text. From Anki, use
        <em> File → Export → Notes in Plain Text</em>; `.apkg` is a zipped
        SQLite database and isn&apos;t read here. Columns are matched by header
        name, or by position: Hebrew, transliteration, meaning, example, source.
      </p>
    </>
  );
}

function AddForm({
  gloss,
  onCancel,
  onSaved,
}: {
  gloss: "fr" | "en";
  onCancel: () => void;
  onSaved: (msg: string) => void;
}) {
  const [he, setHe] = useState("");
  const [tr, setTr] = useState("");
  const [meaning, setMeaning] = useState("");
  const [example, setExample] = useState("");
  const [source, setSource] = useState("");
  const [problem, setProblem] = useState<string | null>(null);

  const canSave = he.trim().length > 0 && meaning.trim().length > 0;

  function save(again: boolean) {
    if (!canSave) return;
    if (!/[֐-׿]/.test(he)) {
      setProblem("The Hebrew field needs Hebrew letters.");
      return;
    }
    const item: CustomItem = {
      id: customId(he.trim()),
      group: "captured",
      he: he.trim(),
      tr: tr.trim(),
      fr: gloss === "fr" ? meaning.trim() : "",
      en: gloss === "en" ? meaning.trim() : "",
      createdAt: nowMs(),
      source: source.trim() || undefined,
      ...(example.trim()
        ? { example: { he: example.trim(), tr: "", fr: "", en: "" } }
        : {}),
    };
    const isNew = upsertCustom(item);
    tap();
    if (again) {
      setHe("");
      setTr("");
      setMeaning("");
      setExample("");
      setProblem(null);
    } else {
      onSaved(isNew ? "Word added." : "Word updated.");
    }
  }

  return (
    <section className="glass anim-rise mb-4 rounded-[24px] p-4">
      <h2 className="mb-3 text-[15px] font-semibold">Add a word</h2>

      <Field value={he} onChange={setHe} placeholder="Hebrew — with nikud if you can" hebrew />
      <Field value={tr} onChange={setTr} placeholder="Transliteration (optional)" />
      <Field
        value={meaning}
        onChange={setMeaning}
        placeholder={gloss === "fr" ? "Sens en français" : "Meaning in English"}
      />
      <Field value={example} onChange={setExample} placeholder="Example sentence (optional)" hebrew />
      <Field value={source} onChange={setSource} placeholder="Where you met it (optional)" />

      {problem && (
        <p className="mt-2 text-[11.5px]" style={{ color: "var(--color-coral)" }}>
          {problem}
        </p>
      )}

      <p className="mt-2.5 text-[11px] leading-relaxed text-(--color-ink-faint)">
        A function word — a verb, a question word, a connector — should get an
        example sentence. §9.4: those are never learned bare.
      </p>

      <div className="mt-3.5 flex gap-2.5">
        <button
          onClick={onCancel}
          className="press flex-1 rounded-full bg-white/8 py-3 text-[13px] font-semibold"
        >
          Cancel
        </button>
        <button
          disabled={!canSave}
          onClick={() => save(true)}
          className="press flex-1 rounded-full bg-white/10 py-3 text-[13px] font-semibold"
          style={{ opacity: canSave ? 1 : 0.4 }}
        >
          Save &amp; next
        </button>
        <button
          disabled={!canSave}
          onClick={() => save(false)}
          className="press flex-1 rounded-full py-3 text-[13px] font-semibold"
          style={{
            background:
              "linear-gradient(100deg, var(--color-accent), var(--color-accent-2))",
            opacity: canSave ? 1 : 0.4,
          }}
        >
          Save
        </button>
      </div>
    </section>
  );
}

function Field({
  value,
  onChange,
  placeholder,
  hebrew,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  hebrew?: boolean;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      dir={hebrew ? "rtl" : "ltr"}
      className="mb-2 w-full rounded-[14px] bg-white/6 px-3.5 py-2.5 text-[14px] outline-none placeholder:text-(--color-ink-faint)"
      style={{
        border: "1px solid rgba(255,255,255,0.1)",
        fontFamily: hebrew ? "var(--font-hebrew)" : undefined,
        textAlign: hebrew ? "right" : "left",
      }}
    />
  );
}

function Tile({ n, label, tint }: { n: number; label: string; tint?: string }) {
  return (
    <div className="glass rounded-[18px] px-3 py-3 text-center">
      <div
        className="text-[19px] font-bold tabular-nums"
        style={{ color: tint }}
      >
        {n}
      </div>
      <div className="text-[10.5px] text-(--color-ink-faint)">{label}</div>
    </div>
  );
}

function Chip({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={() => {
        tap();
        onClick();
      }}
      className="press shrink-0 rounded-full px-3.5 py-2 text-[12px] font-semibold whitespace-nowrap"
      style={{
        background: on ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.05)",
        color: on ? "var(--color-ink)" : "var(--color-ink-faint)",
      }}
    >
      {children}
    </button>
  );
}
