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
const OUT = resolve(root, arg("out", "src/lib/lines.gen.ts"));

const NIKUD = /[֑-ׇ]/g;
const HEB = /[א-ת]/;

/**
 * Ids derive from the consonantal skeleton, so regenerating the corpus keeps
 * the id of any sentence that survives selection — and the audio files named
 * after it stay valid. Sequential ids would orphan every mp3 on each run.
 */
function lineId(he) {
  const skeleton = he.replace(NIKUD, "").replace(/[^א-ת]/g, "");
  let h = 2166136261;
  for (let i = 0; i < skeleton.length; i++) {
    h ^= skeleton.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return "l" + (h >>> 0).toString(36).padStart(7, "0");
}

/**
 * §4's roadmap, month by month. Themes are matched on the French pair, which
 * is far easier to key on than Hebrew morphology. A sentence that matches
 * nothing is "general" and fills gaps once the month's own themes run dry.
 */
const THEMES = {
  greeting: "bonjour salut merci pardon excuse plaît revoir appelle enchanté ça va",
  self: "je suis j'ai ans habite viens origine parle langue français anglais hébreu israël france nom âge",
  family: "famille père mère frère sœur soeur fils fille enfant mari femme parents grand-père grand-mère ami amie marié",
  home: "maison appartement chambre cuisine porte fenêtre table chaise lit clé eau électricité voisin loyer étage salle",
  directions: "où gauche droite tout droit près loin ici là-bas côté gare bus train taxi rue adresse carte centre coin station",
  food: "manger boire café thé pain eau restaurant plat viande poisson légume fruit lait fromage repas déjeuner dîner faim soif",
  shopping: "acheter magasin prix coûte cher argent payer carte monnaie euro shekel vendre client boutique marché",
  transport: "voiture avion vol billet partir arriver voyage route conduire vélo aéroport",
  money: "banque compte carte crédit payer facture salaire prêt",
  weather: "pluie soleil neige vent chaud froid nuage automne hiver orage météo",
  health: "médecin malade mal tête douleur hôpital pharmacie fatigue dormir corps main pied",
  work: "travail travaille bureau patron collègue réunion projet entreprise emploi salaire étudier école cours",
  admin: "papier document formulaire rendez-vous téléphone appeler bureau ministère passeport visa carte identité",
  emotion: "content triste heureux peur colère aime déteste espère pense crois sentiment inquiet fatigué",
  describing: "grand petit beau joli nouveau vieux jeune bon mauvais couleur rouge bleu vert noir blanc lourd léger",
  news: "pays gouvernement guerre paix élection journal nouvelle politique monde histoire société",
  culture: "musique film livre lire écrire art théâtre fête religion tradition",
};

/** Which themes each month is allowed to draw on, from §4. */
const MONTH_THEMES = [
  ["greeting", "self", "family", "home", "directions"],
  ["food", "shopping", "transport", "money", "weather", "health"],
  ["work", "admin", "emotion", "describing"],
  ["news", "culture", "emotion", "describing"],
  [],
];

const THEME_WORDS = Object.fromEntries(
  Object.entries(THEMES).map(([k, v]) => [k, v.split(/s+/)]),
);

function themeOf(fr) {
  const t = fr.toLowerCase();
  // Whole words only. Substring matching made "vent" fire on "souvent" and
  // buried every other theme.
  const toks = new Set(t.split(/[^a-zà-öø-ÿ'-]+/).filter(Boolean));
  let best = "general";
  let score = 0;
  for (const [name, words] of Object.entries(THEME_WORDS)) {
    let n = 0;
    for (const w of words) {
      if (w.includes(" ") ? t.includes(w) : toks.has(w)) n++;
    }
    if (n > score) {
      score = n;
      best = name;
    }
  }
  return best;
}

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

/* --- selection: month themes first, then new-word yield ------------------ */

const known = new Set();
const chosen = [];
const target = DAYS * PER_DAY;

// Shortest first inside each band: a simpler sentence teaches the same words
// with less unexplained grammar wrapped around them.
const pool = usable
  .map((p) => ({ ...p, w: wordsOf(p.he), theme: themeOf(p.fr) }))
  .sort((a, b) => a.w.length - b.w.length);

/** Lines are issued 12 a day, so a month is about 24 working days. */
const MONTH_LINES = Math.ceil(target / 5);

function take(allowed, quota, lo, hi) {
  let n = 0;
  for (const cand of pool) {
    if (n >= quota || chosen.length >= target) break;
    if (cand.used) continue;
    if (allowed && !allowed.has(cand.theme)) continue;
    const fresh = cand.w.filter((w) => !known.has(w));
    if (fresh.length < lo || fresh.length > hi) continue;
    cand.used = true;
    fresh.forEach((w) => known.add(w));
    chosen.push(cand);
    n++;
  }
  return n;
}

// §4: each month draws on its own themes first. What the themes can't fill is
// topped up from anything, because a thin theme must not stall the programme.
for (let month = 0; month < 5; month++) {
  const allowed = MONTH_THEMES[month].length
    ? new Set(MONTH_THEMES[month])
    : null;
  const before = chosen.length;
  if (allowed) {
    take(allowed, MONTH_LINES, 3, 4);
    take(allowed, MONTH_LINES - (chosen.length - before), 2, 6);
  }
  // Yield bands relax as the month fills: late in the programme most words
  // are already known, so insisting on 3-4 new ones would starve it.
  take(null, MONTH_LINES - (chosen.length - before), 3, 5);
  take(null, MONTH_LINES - (chosen.length - before), 2, 6);
  take(null, MONTH_LINES - (chosen.length - before), 1, 8);
}
// Anything still short is filled from the whole pool.
take(null, target - chosen.length, 0, 99);

const themeCount = {};
chosen.forEach((c) => (themeCount[c.theme] = (themeCount[c.theme] || 0) + 1));
console.log(
  `selected ${chosen.length} lines carrying ${known.size} distinct words`,
);
console.log("themes:", JSON.stringify(themeCount));

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

// Only the generated range is written here. The hand-checked seed lives in
// lines.seed.ts and lines.ts merges the two: parsing our own previous output
// to preserve the seed silently dropped days 1-5 once, so it isn't done.
let day = FIRST_DAY;
let inDay = 0;
const entries = vocalised.map((c) => {
  if (day % 7 === 0) day++; // §5: the rest day issues nothing new
  const entry = `  {
    id: "${lineId(c.he)}",
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

writeFileSync(
  OUT,
  `/**
 * Generated programme lines, days ${FIRST_DAY}-${day}.
 *
 * Tatoeba sentences (CC-BY) vocalised by Dicta Nakdan, selected for new-word
 * yield per PROGRAMME.md §1. Not reviewed by a native speaker; Nakdan's
 * low-confidence words are the queue for that. Transliteration and English
 * are empty here — French is the primary gloss.
 *
 * Do not hand-edit. Regenerate with scripts/build-corpus.mjs.
 */

import type { Line } from "./programme.ts";

export const GENERATED: Line[] = [
${entries.join("\n")}
];

export const LAST_GENERATED_DAY = ${day};
`,
);

console.log(`wrote ${OUT}: ${entries.length} lines, days ${FIRST_DAY}-${day}`);
