/**
 * Label Tatoeba candidates with a §4 theme, once, and cache the result.
 *
 * A keyword lexicon failed twice: substring matching fired "vent" on
 * "souvent", and once that was fixed the ubiquitous verbs ("aime", "pense",
 * "crois") swallowed everything into one theme. General-domain sentences do
 * not sort on keywords.
 *
 * This embeds the French pair and each theme's description with a
 * multilingual sentence model, then takes the nearest theme by cosine
 * similarity. Runs locally, no API key. The model downloads once (~120 MB)
 * into node_modules/.cache.
 *
 *   node scripts/classify-themes.mjs [--data DIR] [--out scripts/themes.json]
 *
 * The cache is keyed by the Hebrew consonantal skeleton, so it survives
 * reruns of the corpus build and only new sentences cost anything.
 */
import { pipeline } from "@xenova/transformers";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const arg = (k, d) => {
  const i = process.argv.indexOf(`--${k}`);
  return i > -1 ? process.argv[i + 1] : d;
};
const DATA = arg("data", process.env.TEMP || "/tmp");
const OUT = resolve(root, arg("out", "scripts/themes.json"));

/**
 * One sentence per theme, phrased the way the material actually reads, so the
 * embedding sits near real examples rather than near a dictionary entry.
 */
const THEMES = {
  greeting:
    "Bonjour, merci, s'il vous plaît, au revoir, excusez-moi, comment allez-vous.",
  self: "Je m'appelle, j'ai trente ans, je viens de France, je parle un peu hébreu.",
  family:
    "Ma famille, mon père, ma mère, mon frère, ma sœur, mes enfants, ma femme.",
  home: "La maison, l'appartement, la chambre, la cuisine, la porte, la clé, le voisin.",
  directions:
    "Où est la gare, tournez à droite, tout droit, c'est loin d'ici, l'arrêt de bus.",
  food: "Manger au restaurant, le pain, l'eau, le café, la viande, j'ai faim.",
  shopping:
    "Acheter au magasin, combien ça coûte, c'est trop cher, payer par carte.",
  transport:
    "Prendre le train, l'avion, le billet, la voiture, partir en voyage.",
  money: "La banque, le compte, le salaire, la facture, retirer de l'argent.",
  weather: "Il fait chaud, il pleut, la neige, le soleil, le vent, en hiver.",
  health:
    "Je suis malade, j'ai mal à la tête, le médecin, l'hôpital, la pharmacie.",
  work: "Le travail, le bureau, mon patron, une réunion, mon collègue, l'entreprise.",
  admin:
    "Un rendez-vous, un formulaire, le passeport, téléphoner à l'administration.",
  emotion: "Je suis content, triste, en colère, j'ai peur, je suis fatigué.",
  describing:
    "C'est grand, petit, nouveau, vieux, rouge, très beau, de bonne qualité.",
  news: "Le gouvernement, les élections, la guerre, le journal, la politique.",
  culture: "La musique, un film, un livre, le théâtre, une fête, la tradition.",
  general: "Une phrase ordinaire de la vie de tous les jours.",
};

const NIKUD = /[֑-ׇ]/g;
const skeleton = (he) => he.replace(NIKUD, "").replace(/[^א-ת]/g, "");

/* --- candidates: same join and filter the corpus build uses --------------- */

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

const items = [];
const seen = new Set();
for (const l of tsv("heb-fra_links.tsv")) {
  const [h, f] = l.trim().split("\t");
  const he = heb.get(h);
  const fr = fra.get(f);
  if (!he || !fr || seen.has(h)) continue;
  seen.add(h);
  const w = he.split(/\s+/).filter(Boolean);
  if (w.length < 2 || w.length > 8) continue;
  if (/[A-Za-z0-9]/.test(he)) continue;
  if (/["“”«»]/.test(he)) continue;
  if (fr.length > 90) continue;
  items.push({ k: skeleton(he), fr });
}
console.log(`${items.length} candidates to label`);

const cache = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : {};
const todo = items.filter((i) => !cache[i.k]);
console.log(`${todo.length} not yet cached`);

if (todo.length === 0) {
  console.log("nothing to do");
  process.exit(0);
}

/* --- embed ---------------------------------------------------------------- */

const embed = await pipeline(
  "feature-extraction",
  "Xenova/paraphrase-multilingual-MiniLM-L12-v2",
);

const vec = async (text) => {
  const out = await embed(text, { pooling: "mean", normalize: true });
  return Array.from(out.data);
};

const names = Object.keys(THEMES);
const anchors = [];
for (const n of names) anchors.push(await vec(THEMES[n]));
console.log(`embedded ${names.length} theme anchors`);

const dot = (a, b) => {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
};

/**
 * Below this, the nearest theme is not meaningfully nearer than the rest, so
 * the sentence is left general rather than forced into a bucket. Forcing is
 * exactly what made the keyword version useless.
 */
const FLOOR = 0.28;

const BATCH = 64;
let done = 0;
for (let i = 0; i < todo.length; i += BATCH) {
  const slice = todo.slice(i, i + BATCH);
  await Promise.all(
    slice.map(async (it) => {
      const v = await vec(it.fr);
      let best = "general";
      let score = -1;
      for (let t = 0; t < names.length; t++) {
        const s = dot(v, anchors[t]);
        if (s > score) {
          score = s;
          best = names[t];
        }
      }
      cache[it.k] = score >= FLOOR ? best : "general";
    }),
  );
  done += slice.length;
  process.stdout.write(`\rlabelled ${done}/${todo.length}`);
  if (done % 1024 === 0) writeFileSync(OUT, JSON.stringify(cache));
}

writeFileSync(OUT, JSON.stringify(cache));

const counts = {};
for (const it of items) counts[cache[it.k]] = (counts[cache[it.k]] || 0) + 1;
console.log(`\nwrote ${OUT}`);
console.log(
  Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${k}:${v}`)
    .join("  "),
);
