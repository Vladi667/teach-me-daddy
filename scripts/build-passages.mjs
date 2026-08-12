/**
 * Build the five monthly assessment passages.
 *
 * PROGRAMME.md §6 wants an *unseen* passage at each month's target level, so
 * the only hard rule here is exclusion: every sentence used must be absent
 * from src/lib/lines.ts. Anything the trainee has already drilled measures
 * recall, not comprehension, and inflates the score.
 *
 *   node scripts/build-passages.mjs [--data DIR] [--out src/lib/passages.gen.ts]
 *
 * Difficulty is graded by sentence length, which is the only level signal the
 * source carries. Month 1 runs 2-4 words, month 5 runs 6-8. Sentences are
 * grouped by the month's own themes (scripts/themes.json) so a passage at
 * least holds one subject, but they are separate sentences and not a
 * continuous narrative — Tatoeba is a sentence corpus and pretending
 * otherwise would be a lie about what the trainee is reading.
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
const OUT = resolve(root, arg("out", "src/lib/passages.gen.ts"));

const NIKUD = /[֑-ׇ]/g;
const skeleton = (s) => s.replace(NIKUD, "").replace(/[^א-ת]/g, "");

/**
 * Sentence length band per month, sized by words rather than sentences: the
 * score is a percentage of words, so a 28-word passage moves 3.6 points per
 * tap and can't resolve a 55% pass line. 80 words puts one word near 1%.
 */
const WORD_BUDGET = 80;
const SHAPE = [
  { month: 1, lo: 2, hi: 4 },
  { month: 2, lo: 3, hi: 5 },
  { month: 3, lo: 4, hi: 6 },
  { month: 4, lo: 5, hi: 7 },
  { month: 5, lo: 6, hi: 8 },
];

/** Same month → theme mapping the corpus build uses. */
const MONTH_THEMES = [
  ["greeting", "self", "family", "home", "directions"],
  ["food", "shopping", "transport", "money", "weather", "health"],
  ["work", "admin", "emotion", "describing"],
  ["news", "culture", "emotion", "describing"],
  [],
];

const THEMES = JSON.parse(
  readFileSync(resolve(root, "scripts/themes.json"), "utf8"),
);

/* --- what the trainee has already seen ------------------------------------ */

const corpus = new Set();
const corpusFr = new Set();
for (const f of ["src/lib/lines.seed.ts", "src/lib/lines.gen.ts"]) {
  const src = readFileSync(resolve(root, f), "utf8");
  for (const m of src.matchAll(/he:\s*"((?:[^"\\]|\\.)*)"/g)) {
    corpus.add(skeleton(JSON.parse(`"${m[1]}"`)));
  }
  for (const m of src.matchAll(/fr:\s*"((?:[^"\\]|\\.)*)"/g)) {
    corpusFr.add(JSON.parse(`"${m[1]}"`));
  }
}
console.log(`${corpus.size} sentences already in the corpus`);

/**
 * Nakdan normalises spelling as it vocalises — ktiv male loses its vowel
 * letters, so שתחזור comes back as שֶׁתַּחֲזֹר and the consonantal skeleton
 * changes. A raw Tatoeba sentence therefore cannot be matched against the
 * vocalised corpus by skeleton alone; the French gloss identifies the same
 * source pair whatever the Hebrew spelling ends up as, and the skeleton is
 * re-checked after vocalisation below.
 */
const alreadySeen = (c) => corpus.has(c.k) || corpusFr.has(c.fr);

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
const seen = new Set();
for (const l of tsv("heb-fra_links.tsv")) {
  const [h, f] = l.trim().split("\t");
  const he = heb.get(h);
  const fr = fra.get(f);
  if (!he || !fr || seen.has(h)) continue;
  seen.add(h);
  const k = skeleton(he);
  if (alreadySeen({ k, fr })) continue; // the whole point: unseen
  if (/[A-Za-z0-9]/.test(he)) continue;
  if (/["“”«»]/.test(he)) continue;
  if (fr.length > 90) continue;
  pool.push({ he, fr, k, n: he.split(/\s+/).filter(Boolean).length });
}
console.log(`${pool.length} unseen candidates`);

/* --- pick ----------------------------------------------------------------- */

const used = new Set();
const picked = [];

for (const { month, lo, hi } of SHAPE) {
  const allowed = MONTH_THEMES[month - 1].length
    ? new Set(MONTH_THEMES[month - 1])
    : null;
  // A tenth over budget, because Nakdan drops the odd sentence downstream.
  const budget = Math.ceil(WORD_BUDGET * 1.1);
  let words = 0;
  const take = (wantTheme) => {
    for (const c of pool) {
      if (words >= budget) return;
      if (used.has(c.k)) continue;
      if (c.n < lo || c.n > hi) continue;
      if (wantTheme && allowed && !allowed.has(THEMES[c.k] ?? "general")) {
        continue;
      }
      used.add(c.k);
      words += c.n;
      picked.push({ ...c, month });
    }
  };
  take(true);
  take(false); // a thin theme must not leave the passage short
  const got = picked.filter((p) => p.month === month).length;
  console.log(`month ${month}: ${got} sentences, ${words} words, ${lo}-${hi} each`);
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
  let flagged = 0;
  for (const t of json) {
    if (t.sep) {
      out += t.word;
      continue;
    }
    if (t.fconfident === false) flagged++;
    out += pick(t.options?.[0]) || t.word;
  }
  return { lines: out.split("\n").map((l) => l.replace(/\|/g, "")), flagged };
}

const { lines: voc, flagged } = await vocalise(picked.map((p) => p.he));
picked.forEach((p, i) => {
  const he = (voc[i] ?? "").trim();
  // Re-check after vocalisation: normalised spelling can land on a corpus
  // sentence that the raw skeleton did not match.
  const fresh = he && /[֑-ׇ]/.test(he) && !corpus.has(skeleton(he));
  p.voc = fresh ? he : null;
});
const ok = picked.filter((p) => p.voc);
console.log(`vocalised ${ok.length}/${picked.length}, ${flagged} flagged`);

/* --- emit ----------------------------------------------------------------- */

const byMonth = SHAPE.map(({ month }) => ({
  month,
  sentences: ok.filter((p) => p.month === month),
}));

const body = byMonth
  .map(
    ({ month, sentences }) => `  {
    month: ${month},
    sentences: [
${sentences
  .map(
    (s) => `      { he: ${JSON.stringify(s.voc)}, fr: ${JSON.stringify(s.fr)} },`,
  )
  .join("\n")}
    ],
  },`,
  )
  .join("\n");

writeFileSync(
  OUT,
  `/**
 * Assessment passages, one per month. Generated — do not hand-edit.
 *
 * Tatoeba sentences (CC-BY) that appear nowhere in the corpus, vocalised by
 * Dicta Nakdan. Regenerate with scripts/build-passages.mjs, which re-checks
 * the exclusion against the current lines.
 *
 * These are separate sentences on a shared subject, not continuous prose.
 */

import type { Passage } from "./passages.ts";

export const PASSAGES: Passage[] = [
${body}
];
`,
);

console.log(`wrote ${OUT}`);
