import { customId, type CustomItem } from "./deck.ts";

/**
 * CSV / TSV import for vocabulary.
 *
 * Anki's own `.apkg` is a zipped SQLite database — reading it in the browser
 * would mean shipping a WASM SQLite build for a one-off task. Anki exports
 * "Notes in Plain Text" (.txt, tab-separated) natively, and that's what this
 * reads, along with ordinary CSV.
 *
 * Columns, by header name where present, otherwise by position:
 *   hebrew, transliteration, meaning [, example, source]
 */

export const CSV_TEMPLATE = [
  "hebrew,transliteration,meaning,example,source",
  "כֶּלֶב,kelev,chien,יֵשׁ לִי כֶּלֶב,ulpan",
  "חָתוּל,chatul,chat,,podcast",
].join("\n");

export interface ParseResult {
  items: CustomItem[];
  skipped: number;
  problems: string[];
}

/** Split one delimited line, honouring quoted fields. */
function splitLine(line: string, delim: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quoted = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else quoted = false;
      } else cur += ch;
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === delim) {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

const HEB = /[֐-׿]/;

const HEADERS: Record<string, keyof ColumnMap> = {
  hebrew: "he",
  he: "he",
  word: "he",
  front: "he",
  transliteration: "tr",
  translit: "tr",
  tr: "tr",
  reading: "tr",
  meaning: "gloss",
  translation: "gloss",
  gloss: "gloss",
  back: "gloss",
  french: "gloss",
  fr: "gloss",
  english: "gloss",
  en: "gloss",
  example: "example",
  sentence: "example",
  source: "source",
  tags: "source",
};

interface ColumnMap {
  he: number;
  tr: number;
  gloss: number;
  example: number;
  source: number;
}

export function parseVocabFile(
  text: string,
  gloss: "fr" | "en",
  now: number,
): ParseResult {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (!lines.length)
    return { items: [], skipped: 0, problems: ["Empty file."] };

  // Tab wins when present — that's what Anki writes.
  const delim = lines[0].includes("\t") ? "\t" : ",";

  const first = splitLine(lines[0], delim);
  const looksLikeHeader =
    !first.some((c) => HEB.test(c)) &&
    first.some((c) => HEADERS[c.toLowerCase()] !== undefined);

  const cols: ColumnMap = { he: 0, tr: 1, gloss: 2, example: 3, source: 4 };
  if (looksLikeHeader) {
    (Object.keys(cols) as (keyof ColumnMap)[]).forEach((k) => (cols[k] = -1));
    first.forEach((raw, i) => {
      const key = HEADERS[raw.toLowerCase()];
      if (key !== undefined && cols[key] === -1) cols[key] = i;
    });
    if (cols.he === -1) cols.he = 0;
  }

  const problems: string[] = [];
  const seen = new Set<string>();
  const items: CustomItem[] = [];
  let skipped = 0;

  lines.slice(looksLikeHeader ? 1 : 0).forEach((line, n) => {
    const c = splitLine(line, delim);
    const at = (i: number) => (i >= 0 && i < c.length ? c[i] : "");

    const he = at(cols.he);
    const meaning = at(cols.gloss);

    if (!he || !HEB.test(he)) {
      skipped++;
      if (problems.length < 5)
        problems.push(`Line ${n + 1}: no Hebrew in the first column.`);
      return;
    }
    if (!meaning) {
      skipped++;
      if (problems.length < 5)
        problems.push(`Line ${n + 1}: no meaning given.`);
      return;
    }

    const id = customId(he);
    if (seen.has(id)) {
      skipped++;
      return;
    }
    seen.add(id);

    const exampleHe = at(cols.example);

    items.push({
      id,
      group: "captured",
      he,
      tr: at(cols.tr),
      fr: gloss === "fr" ? meaning : "",
      en: gloss === "en" ? meaning : "",
      createdAt: now,
      source: at(cols.source) || undefined,
      ...(exampleHe && HEB.test(exampleHe)
        ? { example: { he: exampleHe, tr: "", fr: "", en: "" } }
        : {}),
    });
  });

  return { items, skipped, problems };
}

/** Round-trips through parseVocabFile. */
export function toCSV(items: CustomItem[]): string {
  const esc = (v: string | undefined) => {
    const s = v ?? "";
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [
    "hebrew,transliteration,meaning,example,source",
    ...items.map((i) =>
      [
        esc(i.he),
        esc(i.tr),
        esc(i.fr || i.en),
        esc(i.example?.he),
        esc(i.source),
      ].join(","),
    ),
  ].join("\n");
}
