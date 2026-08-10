/**
 * Build programme lines from Tatoeba, vocalised by Dicta Nakdan.
 *
 * See PROGRAMME.md §13. Tatoeba supplies real sentences under CC-BY but almost
 * none of them carry nikud (189 of 212,657), so the vowels are added here.
 *
 * Selection follows §1's rule: a line earns its place by carrying 3-4
 * previously unseen words. Picking greedily by new-word yield is what stops
 * the set recycling the same 400 function words while coverage flatlines.
 *
 *   node scripts/build-corpus.mjs --days 20 [--from 6] [--out src/lib/lines.ts]
 *
 * Inputs are the uncompressed Tatoeba exports, downloaded separately:
 *   heb.tsv  heb-fra_links.tsv  fra.tsv
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const arg = (k, d) => {
  const i = process.argv.indexOf(`--${k}`);
  return i > -1 ? process.argv[i + 1] : d;
};

const DATA = arg("data", process.env.TEMP ? `${process.env.TEMP}` : "/tmp");
const DAYS = Number(arg("days", 20));
const FIRST_DAY = Number(arg("from", 6));
const PER_DAY = 12;
const OUT = resolve(root, arg("out", "src/lib/lines.ts"));

const NIKUD = /[֑-ׇ]/g;
const HEB = /[א-ת]/;

/** Nikud-stripped surface form. An approximation: Hebrew morphology means
 *  "בבית" and "בית" count as different words, so new-word yield runs a little
 *  high. Good enough to spread the corpus, not a lemmatiser. */
const key = (w) => w.replace(NIKUD, "").replace(/[^א-ת]/g, "");
const wordsOf = (s) => s.split(/\s+/).map(key).filter(Boolean);

function tsv(file) {
  const p = resolve(DATA, file);
  if (!existsSync(p)) {
    console.error(`missing ${p} — download the Tatoeba exports first`);
    process.exit(1);
  }
  return readFileSync(p, "utf8").split("\n");
}

/* --- join Hebrew to its French pair --------------------------------------- */

const heb = new Map();
for (const l of tsv("heb.tsv")) {
  const [id, , text] = l.split("\t");
  if (id && text) heb.set(id, text.trim());
}

const fra = new Map();
for (const l of tsv("fra.tsv")) {
  const [id, , text] = l.split("\t");
  if (id && text) fra.set(id, text.trim());
}

const pairs = [];
const seen = new Set();
for (const l of tsv("heb-fra_links.tsv")) {
  const [h, f] = l.trim().split("\t");
  const he = heb.get(h);
  const fr = fra.get(f);
  if (!he || !fr || seen.has(h)) continue;
  seen.add(h);
  pairs.push({ he, fr });
}
console.log(`paired ${pairs.length} Hebrew sentences with French`);

/* --- filter to teachable material ----------------------------------------- */

const usable = pairs.filter(({ he, fr }) => {
  const w = he.split(/\s+/).filter(Boolean);
  if (w.length < 2 || w.length > 8) return false;
  if (!HEB.test(he)) return false;
  if (/[A-Za-z0-9]/.test(he)) return false; // transliterations, codes
  if (/["“”«»]/.test(he)) return false; // quoted speech reads badly alone
  if (fr.length > 90) return false;
  return true;
});
console.log(`${usable.length} usable after length and shape filters`);

/* --- greedy selection by new-word yield ----------------------------------- */

const known = new Set();
const chosen = [];
const target = DAYS * PER_DAY;

// Shortest first inside each yield band: simpler sentences teach the same
// words with less unexplained grammar around them.
const scored = usable
  .map((p) => ({ ...p, w: wordsOf(p.he) }))
  .sort((a, b) => a.w.length - b.w.length);

for (let pass = 0; pass < 3 && chosen.length < target; pass++) {
  for (const cand of scored) {
    if (chosen.length >= target) break;
    if (cand.used) continue;
    const fresh = cand.w.filter((w) => !known.has(w));
    // Pass 0 wants the sweet spot; later passes relax so the run still fills.
    const lo = pass === 0 ? 3 : pass === 1 ? 2 : 1;
    const hi = pass === 0 ? 4 : 6;
    if (fresh.length < lo || fresh.length > hi) continue;
    cand.used = true;
    fresh.forEach((w) => known.add(w));
    chosen.push({ ...cand, fresh: fresh.length });
  }
}
console.log(
  `selected ${chosen.length} lines carrying ${known.size} distinct words`,
);

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
  // Nakdan marks prefix boundaries; they are not part of the word.
  return { lines: out.split("\n").map((l) => l.replace(/\|/g, "")), flagged };
}

const BATCH = 40;
const vocalised = [];
let flaggedTotal = 0;

for (let i = 0; i < chosen.length; i += BATCH) {
  const slice = chosen.slice(i, i + BATCH);
  try {
    const { lines, flagged } = await vocalise(slice.map((c) => c.he));
    flaggedTotal += flagged;
    slice.forEach((c, j) => {
      const he = (lines[j] ?? "").trim();
      // A batch that comes back short or unvocalised is dropped, not shipped.
      if (he && NIKUD.test(he)) vocalised.push({ ...c, he });
    });
  } catch (e) {
    console.error(`batch ${i}: ${e.message}`);
  }
  process.stdout.write(`\rvocalised ${vocalised.length}/${chosen.length}`);
}
console.log(`\n${flaggedTotal} words flagged low-confidence for review`);

/* --- emit ----------------------------------------------------------------- */

const existing = existsSync(OUT) ? readFileSync(OUT, "utf8") : "";
const keepSeed = existing.slice(
  existing.indexOf("export const LINES: Line[] = ["),
  existing.indexOf("\n];"),
);
const seedEntries = keepSeed
  .split(/\n  \{\n/)
  .slice(1)
  .filter((b) => {
    const d = Number(b.match(/day: (\d+)/)?.[1] ?? 999);
    return d < FIRST_DAY;
  })
  .map((b) => `  {\n${b}`.replace(/\n$/, ""));

let n = seedEntries.length;
let day = FIRST_DAY;
let inDay = 0;
const fresh = vocalised.map((c) => {
  if (day % 7 === 0) day++; // §5: the rest day issues nothing new
  const entry = `  {
    id: "l-${String(++n).padStart(3, "0")}",
    day: ${day},
    he: ${JSON.stringify(c.he)},
    tr: "",
    fr: ${JSON.stringify(c.fr)},
    en: "",
    words: ${JSON.stringify(wordsOf(c.he).slice(0, 8))},
  },`;
  if (++inDay >= PER_DAY) {
    inDay = 0;
    day++;
  }
  return entry;
});

const body = [...seedEntries, ...fresh].join("\n");
const lastDay = day;

writeFileSync(
  OUT,
  `/**
 * Programme corpus.
 *
 * Days 1-${FIRST_DAY - 1} are the hand-checked seed built from deck.ts.
 * Days ${FIRST_DAY}-${lastDay} are Tatoeba sentences (CC-BY) vocalised by Dicta Nakdan,
 * selected greedily for new-word yield per PROGRAMME.md §1.
 *
 * The generated range has NOT had a native speaker's review yet: Nakdan flags
 * its uncertain words, and those are what a reviewer should look at first.
 * Transliterations and English glosses are empty for generated lines.
 *
 * Do not hand-edit. Regenerate with scripts/build-corpus.mjs.
 */

import type { Line } from "./programme.ts";

export const LINES: Line[] = [
${body}
];

export const linesForDay = (day: number) => LINES.filter((l) => l.day === day);
export const LAST_SEEDED_DAY = ${lastDay};
`,
);

console.log(`wrote ${OUT}: ${seedEntries.length + fresh.length} lines, to day ${lastDay}`);
