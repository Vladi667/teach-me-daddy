/**
 * Build the decoding ladder — the seven rungs from PROGRAMME.md §8e.
 *
 *   node scripts/build-ladder.mjs [--out src/lib/ladder.gen.ts]
 *
 * The ladder answers a question the reading library cannot: what do you read
 * on day one, when you know six letters? Measured against this corpus, you
 * cannot answer it by filtering. Gate 1,359 sentences by a six-letter set and
 * *nothing* survives — nor at seven, nor eight. Whole sentences only appear in
 * useful numbers at fourteen letters. The commonest hundred words are no help
 * either: they cover a quarter of running text but yield fourteen whole
 * sentences, and between them they already need twenty of the twenty-two
 * letters.
 *
 * Gate on words and spans instead and it opens at once — 80 real words and 26
 * attested phrases at six letters, 604 words and 475 phrases at ten. So the
 * early rungs are built from *fragments* of real sentences rather than whole
 * ones, and the ladder crosses over to whole sentences at rung 5, which is
 * where the corpus actually supplies them.
 *
 * Nothing here is invented. Every word and every phrase is attested in the
 * corpus, pointing included; the generator only chooses and cuts.
 *
 * Unlike the reading library (§8c) this deliberately draws on the programme
 * corpus. That library measures reading speed, so re-reading a drilled line
 * would measure recall instead. The ladder measures decoding — turning marks
 * into sounds — and known vocabulary helps rather than cheats. In practice the
 * overlap is small anyway: the ladder is week-one work and the corpus runs to
 * day 132.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const arg = (k, d) => {
  const i = process.argv.indexOf(`--${k}`);
  return i > -1 ? process.argv[i + 1] : d;
};
const OUT = resolve(root, arg("out", "src/lib/ladder.gen.ts"));

/* --- the corpus ----------------------------------------------------------- */

const src =
  readFileSync(resolve(root, "src/lib/lines.seed.ts"), "utf8") +
  readFileSync(resolve(root, "src/lib/lines.gen.ts"), "utf8");

/** Every { id, he, fr } in the corpus, in file order. */
const CORPUS = [
  ...src.matchAll(
    /id:\s*"([^"]+)",[\s\S]{0,80}?he:\s*"((?:[^"\\]|\\.)*)"[\s\S]{0,120}?fr:\s*"((?:[^"\\]|\\.)*)"/g,
  ),
]
  .map((m) => ({ id: m[1], he: m[2].normalize("NFC"), fr: m[3] }))
  // Pattern lines carry a ___ blank: not readable text.
  .filter((l) => !l.he.includes("_") && !/[A-Za-z]/.test(l.he));

const NIKUD = /[֑-ׇ]/g;
const FINAL = { "ך": "כ", "ם": "מ", "ן": "נ", "ף": "פ", "ץ": "צ" };
const bare = (w) => w.normalize("NFC").replace(NIKUD, "");
const base = (w) => [...bare(w)].map((c) => FINAL[c] ?? c).join("");
const isWord = (w) => /^[א-ת]+$/.test(bare(w));
const split = (s) => s.split(/[\s.,!?;:"'()־׳״-]+/).filter(isWord);

/** Word frequency and the commonest pointing of each. */
const freq = {};
const forms = {};
for (const l of CORPUS) {
  for (const w of split(l.he)) {
    const k = bare(w);
    freq[k] = (freq[k] ?? 0) + 1;
    (forms[k] ??= {})[w] = (forms[k][w] ?? 0) + 1;
  }
}
const pointed = (k) =>
  Object.entries(forms[k]).sort((a, b) => b[1] - a[1])[0][0];

/* --- the rungs ------------------------------------------------------------ */

/**
 * Aleph first, then whichever letter unlocks the most running text next.
 * Computed greedily against this corpus, with aleph pinned because the
 * alphabet is learned in its own order and starting anywhere else is a
 * needless argument to have with a beginner.
 */
const ORDER = [
  ..."אתלכיהומשנברחעדקפצזסגט",
];

/**
 * Where each rung stops. Rungs 1-4 read phrases because whole sentences do not
 * exist below fourteen letters; 5-7 read sentences because by then they do.
 */
const PLAN = [
  { n: 1, upto: 6, kind: "phrases", per: 10, max: 4, title: "Six letters" },
  { n: 2, upto: 8, kind: "phrases", per: 10, max: 4, title: "Eight letters" },
  { n: 3, upto: 10, kind: "phrases", per: 10, max: 4, title: "Ten letters" },
  { n: 4, upto: 12, kind: "phrases", per: 10, max: 5, title: "Twelve letters" },
  { n: 5, upto: 14, kind: "text", per: 6, max: 5, title: "First sentences" },
  { n: 6, upto: 18, kind: "text", per: 6, max: 6, title: "Eighteen letters" },
  { n: 7, upto: 22, kind: "text", per: 7, max: 6, title: "The whole alphabet" },
];

const finalsFor = (set) =>
  Object.entries(FINAL)
    .filter(([, b]) => set.has(b))
    .map(([f]) => f);

/** Every maximal run of gated words in a sentence, cut into 2-4 word windows. */
function spansIn(seq, fits) {
  const out = [];
  for (let i = 0; i < seq.length; ) {
    if (!fits(seq[i])) {
      i++;
      continue;
    }
    let j = i;
    while (j < seq.length && fits(seq[j])) j++;
    for (let a = i; a < j; a++) {
      for (let len = 2; len <= 4 && a + len <= j; len++) {
        out.push(seq.slice(a, a + len));
      }
    }
    i = j;
  }
  return out;
}

const rungs = [];
const usedSentence = new Set();
const usedSpan = new Set();
let prevWords = new Set();

for (const p of PLAN) {
  const set = new Set(ORDER.slice(0, p.upto));
  const added = ORDER.slice(p.n === 1 ? 0 : PLAN[p.n - 2].upto, p.upto);
  const fits = (w) => [...base(w)].every((c) => set.has(c));
  const hasNew = (w) => [...base(w)].some((c) => added.includes(c));

  // The words this rung unlocks, commonest first.
  const all = Object.keys(freq).filter(fits);
  const fresh = all
    .filter((k) => !prevWords.has(k))
    .sort((a, b) => freq[b] - freq[a]);
  prevWords = new Set(all);

  /* --- what this rung reads ---------------------------------------------- */

  const lines = [];
  if (p.kind === "phrases") {
    // Attested fragments, scored by the commonness of their rarest word so
    // that "yesh li" outranks "lehaakhil et".
    const seen = new Set();
    const cand = [];
    for (const l of CORPUS) {
      for (const s of spansIn(split(l.he), fits)) {
        if (!s.some(hasNew)) continue;
        const key = s.map(bare).join(" ");
        if (seen.has(key) || usedSpan.has(key)) continue;
        seen.add(key);
        cand.push({ he: s.join(" "), key, words: s.length, score: Math.min(...s.map((w) => freq[bare(w)])) });
      }
    }
    cand.sort((a, b) => b.score - a.score || b.words - a.words);
    // Drop a fragment already contained in one that was taken.
    const taken = [];
    for (const c of cand) {
      if (taken.some((t) => (" " + t.key + " ").includes(" " + c.key + " "))) continue;
      taken.push(c);
      if (taken.length >= p.per * p.max) break;
    }
    for (const t of taken) {
      usedSpan.add(t.key);
      lines.push({ he: t.he });
    }
  } else {
    const cand = CORPUS.filter((l) => {
      const w = split(l.he);
      if (!w.length || w.length > 8) return false;
      if (usedSentence.has(l.he)) return false;
      return w.every(fits) && w.some(hasNew);
    })
      // Shortest first, so a rung opens gently and lengthens across its
      // passages; then commonest, so among sentences of equal length "we are
      // going" beats "the municipality is left-wing".
      .map((l) => {
        const w = split(l.he);
        return { ...l, n: w.length, score: Math.min(...w.map((x) => freq[bare(x)])) };
      })
      .sort((a, b) => a.n - b.n || b.score - a.score);
    for (const l of cand.slice(0, p.per * p.max)) {
      usedSentence.add(l.he);
      // The source id carries the audio. A whole sentence has a recording;
      // a fragment cut out of one does not, and must not claim it.
      lines.push({ he: l.he, fr: l.fr, src: l.id });
    }
  }

  const passages = [];
  for (let i = 0; i * p.per < lines.length && passages.length < p.max; i++) {
    const slice = lines.slice(i * p.per, (i + 1) * p.per);
    // A passage of one line is a card, not a passage.
    if (slice.length < 2) break;
    passages.push({
      id: `lad${p.n}-${i + 1}`,
      rung: p.n,
      kind: p.kind,
      lines: slice,
      words: slice.reduce((n, l) => n + split(l.he).length, 0),
    });
  }

  rungs.push({
    n: p.n,
    title: p.title,
    letters: ORDER.slice(0, p.upto),
    added,
    finals: finalsFor(set),
    words: fresh.slice(0, 120).map(pointed),
    wordsTotal: all.length,
    passages,
  });
}

/* --- write ---------------------------------------------------------------- */

const j = (v) => JSON.stringify(v);
const body = rungs
  .map(
    (r) => `  {
    n: ${r.n},
    title: ${j(r.title)},
    letters: ${j(r.letters)},
    added: ${j(r.added)},
    finals: ${j(r.finals)},
    wordsTotal: ${r.wordsTotal},
    words: ${j(r.words)},
    passages: [
${r.passages
  .map(
    (p) => `      {
        id: ${j(p.id)},
        rung: ${p.rung},
        kind: ${j(p.kind)},
        words: ${p.words},
        lines: [
${p.lines
  .map(
    (l) =>
      `          { he: ${j(l.he)}${l.fr ? `, fr: ${j(l.fr)}` : ""}${l.src ? `, src: ${j(l.src)}` : ""} },`,
  )
  .join("\n")}
        ],
      },`,
  )
  .join("\n")}
    ],
  },`,
  )
  .join("\n");

writeFileSync(
  OUT,
  `/**
 * Generated decoding ladder. Do not hand-edit.
 * Regenerate with scripts/build-ladder.mjs.
 *
 * Every word and phrase here is attested in the programme corpus, pointing
 * included. Rungs 1-4 are cut from real sentences because whole sentences do
 * not exist under a twelve-letter gate; rungs 5-7 are whole sentences.
 */

import type { LadderRung } from "./ladder.ts";

export const RUNGS: LadderRung[] = [
${body}
];
`,
  "utf8",
);

console.log(`wrote ${OUT}`);
for (const r of rungs) {
  console.log(
    `  rung ${r.n} ${String(r.letters.length).padStart(2)} letters (+${r.added.join("")})  ` +
      `${String(r.wordsTotal).padStart(4)} words  ${r.passages.length} passages  ` +
      `${r.passages.reduce((n, p) => n + p.lines.length, 0)} lines`,
  );
}
