/**
 * Build the reading library — passages for §8c, independent of the programme.
 *
 * Not the corpus and not the assessment. This is text to *read*, at length, on
 * a clock; the sentence drills teach lines, and no amount of single sentences
 * adds up to reading a paragraph. Six levels, graded by sentence length, four
 * passages each.
 *
 *   node scripts/build-reading.mjs [--data DIR] [--out src/lib/reading.gen.ts]
 *
 * Three exclusions, all of them load-bearing:
 *   - the corpus, or the trainee is re-reading drilled lines and the speed is
 *     recall speed;
 *   - the assessment passages, which must stay unseen to measure anything;
 *   - each other, so no passage repeats a sentence.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const arg = (k, d) => {
  const i = process.argv.indexOf(`--${k}`);
  return i > -1 ? process.argv[i + 1] : d;
};
const DATA = arg("data", process.env.TEMP || "/tmp");
const OUT = resolve(root, arg("out", "src/lib/reading.gen.ts"));

const NIKUD = /[֑-ׇ]/g;
const skeleton = (s) => s.normalize("NFC").replace(NIKUD, "").replace(/[^א-ת]/g, "");

/** Sentence length band and word budget per level. Longer as you climb. */
const LEVELS = [
  { level: 1, lo: 2, hi: 4, words: 55, passages: 4 },
  { level: 2, lo: 3, hi: 5, words: 70, passages: 4 },
  { level: 3, lo: 4, hi: 6, words: 85, passages: 4 },
  { level: 4, lo: 5, hi: 7, words: 100, passages: 4 },
  { level: 5, lo: 6, hi: 8, words: 115, passages: 4 },
  { level: 6, lo: 6, hi: 8, words: 140, passages: 4 },
];

const THEMES = JSON.parse(
  readFileSync(resolve(root, "scripts/themes.json"), "utf8"),
);

/* --- what must not appear ------------------------------------------------- */

const seenSkel = new Set();
const seenFr = new Set();
for (const f of [
  "src/lib/lines.seed.ts",
  "src/lib/lines.gen.ts",
  "src/lib/passages.gen.ts",
]) {
  const src = readFileSync(resolve(root, f), "utf8");
  for (const m of src.matchAll(/he:\s*"((?:[^"\\]|\\.)*)"/g)) {
    seenSkel.add(skeleton(JSON.parse(`"${m[1]}"`)));
  }
  for (const m of src.matchAll(/fr:\s*"((?:[^"\\]|\\.)*)"/g)) {
    seenFr.add(JSON.parse(`"${m[1]}"`));
  }
}
console.log(`${seenSkel.size} sentences already used elsewhere`);

/* --- candidates ----------------------------------------------------------- */

function tsv(file) {
  const p = resolve(DATA, file);
  if (!existsSync(p)) {
    console.error(`missing ${p} — download the Tatoeba exports first`);
    process.exit(1);
  }
  return readFileSync(p, "utf8").split("\n");
}

const heb = new Map();
for (const l of tsv("heb.tsv")) {
  const [id, , t] = l.split("\t");
  if (id && t) heb.set(id, t.trim());
}
const fra = new Map();
for (const l of tsv("fra.tsv")) {
  const [id, , t] = l.split("\t");
  if (id && t) fra.set(id, t.trim());
}

const pool = [];
const dedupe = new Set();
for (const l of tsv("heb-fra_links.tsv")) {
  const [h, f] = l.trim().split("\t");
  const he = heb.get(h);
  const fr = fra.get(f);
  if (!he || !fr || dedupe.has(h)) continue;
  dedupe.add(h);
  const k = skeleton(he);
  if (seenSkel.has(k) || seenFr.has(fr)) continue;
  if (/[A-Za-z0-9]/.test(he)) continue;
  if (/["“”«»]/.test(he)) continue;
  if (fr.length > 90) continue;
  pool.push({ he, fr, k, n: he.split(/\s+/).filter(Boolean).length });
}
console.log(`${pool.length} unused candidates`);

/* --- assemble ------------------------------------------------------------- */

const used = new Set();
const passages = [];

for (const spec of LEVELS) {
  for (let i = 0; i < spec.passages; i++) {
    // One theme per passage where possible, so it reads as being about
    // something rather than as a list.
    const picked = [];
    let words = 0;
    let theme = null;
    for (const c of pool) {
      if (words >= spec.words) break;
      if (used.has(c.k)) continue;
      if (c.n < spec.lo || c.n > spec.hi) continue;
      const t = THEMES[c.k] ?? "general";
      if (theme === null) theme = t;
      else if (t !== theme) continue;
      used.add(c.k);
      picked.push(c);
      words += c.n;
    }
    // A thin theme must not leave a passage short.
    for (const c of pool) {
      if (words >= spec.words) break;
      if (used.has(c.k)) continue;
      if (c.n < spec.lo || c.n > spec.hi) continue;
      used.add(c.k);
      picked.push(c);
      words += c.n;
    }
    passages.push({ level: spec.level, theme, sentences: picked, words });
  }
  const got = passages.filter((p) => p.level === spec.level);
  console.log(
    `level ${spec.level}: ${got.length} passages, ${got.map((g) => g.words).join("/")} words`,
  );
}

/* --- vocalise ------------------------------------------------------------- */

const NAKDAN = "https://nakdan-2-0.loadbalancer.dicta.org.il/api";
const pick = (o) => (typeof o === "string" ? o : Array.isArray(o) ? o[0] : "");

async function vocalise(batch) {
  const res = await fetch(NAKDAN, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      task: "nakdan",
      data: batch.join("\n"),
      genre: "modern",
      addmorph: false,
      keepqq: false,
      nodageshdefmem: false,
      patachma: false,
      keepmetagim: false,
    }),
  });
  if (!res.ok) throw new Error(`nakdan ${res.status}`);
  const json = await res.json();
  let out = "";
  for (const t of json) {
    if (t.sep) {
      out += t.word;
      continue;
    }
    out += pick(t.options?.[0]) || t.word;
  }
  return out.split("\n").map((l) => l.replace(/\|/g, ""));
}

const flat = passages.flatMap((p) => p.sentences);
/**
 * Deduplication has to happen *after* vocalising as well as before. Nakdan
 * normalises spelling, so two sentences that differ in ktiv male can come back
 * with the same consonantal skeleton — one slipped through on the first run.
 */
const vocSeen = new Set();
const BATCH = 60;
for (let i = 0; i < flat.length; i += BATCH) {
  const slice = flat.slice(i, i + BATCH);
  try {
    const voc = await vocalise(slice.map((c) => c.he));
    slice.forEach((c, j) => {
      const he = (voc[j] ?? "").trim();
      // Re-check the exclusion after vocalising: Nakdan normalises spelling,
      // so a sentence can land on a corpus skeleton it did not match before.
      const k = skeleton(he);
      if (he && /[֑-ׇ]/.test(he) && !seenSkel.has(k) && !vocSeen.has(k)) {
        vocSeen.add(k);
        c.voc = he;
      }
    });
  } catch (e) {
    console.error(`batch ${i}: ${e.message}`);
  }
  process.stdout.write(`\rvocalised ${Math.min(i + BATCH, flat.length)}/${flat.length}`);
}
console.log();

/* --- emit ----------------------------------------------------------------- */

let id = 0;
const body = passages
  .map((p) => {
    const ok = p.sentences.filter((s) => s.voc);
    const words = ok.reduce((n, s) => n + s.voc.split(/\s+/).length, 0);
    return `  {
    id: "r${String(++id).padStart(2, "0")}",
    level: ${p.level},
    theme: ${JSON.stringify(p.theme ?? "general")},
    words: ${words},
    sentences: [
${ok.map((s) => `      { he: ${JSON.stringify(s.voc)}, fr: ${JSON.stringify(s.fr)} },`).join("\n")}
    ],
  },`;
  })
  .join("\n");

writeFileSync(
  OUT,
  `/**
 * The reading library. Generated — do not hand-edit.
 *
 * Tatoeba sentences (CC-BY) vocalised by Dicta Nakdan, chosen so that none
 * appears in the programme corpus or in an assessment passage. Regenerate with
 * scripts/build-reading.mjs, which re-checks those exclusions.
 */

import type { Passage } from "./reading.ts";

export const LIBRARY: Passage[] = [
${body}
];
`,
);

const total = passages.reduce(
  (n, p) => n + p.sentences.filter((s) => s.voc).length,
  0,
);
console.log(`wrote ${OUT}: ${passages.length} passages, ${total} sentences`);
