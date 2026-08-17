"use client";

import { useState } from "react";
import type { FormField } from "@/lib/exams";
import { tap } from "@/lib/feedback";

interface ExamFormProps {
  fields: FormField[];
  onBack: () => void;
}

/**
 * §05 — the personal-details form, fillable.
 *
 * Nothing typed here is stored, synced or exported. It is a real identity
 * form — name, date of birth, ת.ז. — and this app's accounts are a username
 * with an optional four-digit PIN, which the README is explicit is not
 * authentication. The exercise is writing the Hebrew, not keeping the record,
 * so the state lives in this component and dies with it.
 */
export default function ExamForm({ fields, onBack }: ExamFormProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const set = (k: string, v: string) =>
    setValues((prev) => ({ ...prev, [k]: v }));

  return (
    <div>
      <header className="mb-4">
        <p className="eyebrow">05 · The form</p>
        <h1
          dir="rtl"
          className="heb mt-1 text-lg leading-tight font-semibold"
          style={{ fontFamily: "var(--font-hebrew)" }}
        >
          טופס פרטים אישיים
        </h1>
        <p className="mt-2 text-sm text-ink-2">
          The sheet handed out in class, line by line. Fill it in Hebrew;
          nothing here is saved, synced or scored.
        </p>
      </header>

      <div className="flex flex-col gap-3">
        {fields.map((f) => (
          <div key={f.key} className="panel rounded-xl px-4 py-3">
            <div className="flex items-baseline justify-between gap-3">
              <span
                dir="rtl"
                className="heb text-md"
                style={{ fontFamily: "var(--font-hebrew)" }}
              >
                {f.he}
              </span>
              <span className="text-right text-xs text-ink-3">{f.en}</span>
            </div>

            {f.kind === "text" && (
              <input
                dir="rtl"
                value={values[f.key] ?? ""}
                onChange={(e) => set(f.key, e.target.value)}
                placeholder={f.hint}
                className="heb field mt-2"
                style={{ fontFamily: "var(--font-hebrew)" }}
              />
            )}

            {/* Nine boxes, one digit each, the way the paper prints it. */}
            {f.kind === "boxes" && (
              <div className="mt-2 flex gap-1.5" dir="ltr">
                {Array.from({ length: 9 }, (_, i) => (
                  <input
                    key={i}
                    inputMode="numeric"
                    maxLength={1}
                    aria-label={`Digit ${i + 1}`}
                    value={(values[f.key] ?? "")[i] ?? ""}
                    onChange={(e) => {
                      const digits = (values[f.key] ?? "").padEnd(9, " ").split("");
                      digits[i] = e.target.value.replace(/\D/g, "").slice(-1) || " ";
                      set(f.key, digits.join("").trimEnd());
                      if (e.target.value) {
                        const next = e.target.parentElement?.children[i + 1];
                        if (next instanceof HTMLInputElement) next.focus();
                      }
                    }}
                    className="field min-h-[44px] flex-1 px-0 text-center tnum"
                  />
                ))}
              </div>
            )}

            {f.kind === "chips" && (
              <div className="mt-2 flex flex-wrap gap-2">
                {(f.options ?? []).map(([he, en]) => {
                  const on = values[f.key] === he;
                  return (
                    <button
                      key={he}
                      onClick={() => {
                        tap();
                        set(f.key, on ? "" : he);
                      }}
                      aria-pressed={on}
                      className="tap rounded-full px-3 py-1.5"
                      style={{
                        background: on
                          ? "var(--color-accent)"
                          : "var(--color-surface-2)",
                        color: on
                          ? "var(--color-accent-ink)"
                          : "var(--color-ink-2)",
                      }}
                    >
                      <span
                        dir="rtl"
                        className="heb text-sm"
                        style={{ fontFamily: "var(--font-hebrew)" }}
                      >
                        {he}
                      </span>
                      <span className="ml-1.5 text-xs opacity-70">{en}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={() => {
          tap();
          onBack();
        }}
        className="btn btn-quiet mt-5 w-full text-sm"
      >
        Back to the sections
      </button>
    </div>
  );
}
