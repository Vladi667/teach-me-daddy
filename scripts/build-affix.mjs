/**
 * Build the affix families — PROGRAMME.md §8f.
 *
 *   node scripts/build-affix.mjs [--out src/lib/affix.gen.ts]
 *
 * A reader who cannot strip a prefix reads a six-character word instead of a
 * one-letter prefix plus a root already known. This builds the drill material
 * for that, and the hard part is not the drill — it is deciding what actually
 * carries a prefix.
 *
 * Three counts, measured on this corpus, which matter because the first is the
 * one that is easy to quote and wrong:
 *
 *   56.1%  starts with a mem/shin/he/vav/kaf/lamed/bet letter
 *   40.1%  ...and that letter carries a vowel a real prefix can take
 *    6.6%  ...and stripping it leaves a word this corpus attests
 *
 * The first counts מַיִם and שָׁלוֹם, which wear no prefix at all. The second is
 * the honest estimate of the real rate. The third is the only one safe to drill,
 * because it is the only one verified end to end — and it is a floor, not a
 * measurement, since the base of a genuinely prefixed word often never appears
 * bare in 1,359 sentences.
 *
 * Analysis is not attempted. Nothing is parsed: a family is kept only when both
 * the prefixed form and the bare base are attested, the prefix vowel is legal,
 * and the remainder matches the base's *pointing* — not merely its consonants.
 * Skeleton matching alone read מִלֵּא ("filled") as mem + לֹא and מִסְפַּר
 * ("number") as mem + סֵפֶר. Prefixing may add a dagesh (יוֹם -> הַיּוֹם) and
 * nothing else, so that is the only difference tolerated.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const arg = (k, d) => {
  const i = process.argv.indexOf(`--${k}`);
  return i > -1 ? process.argv[i + 1] : d;
};
const OUT = resolve(root, arg("out", "src/lib/affix.gen.ts"));

const src =
  readFileSync(resolve(root, "src/lib/lines.seed.ts"), "utf8") +
  readFileSync(resolve(root, "src/lib/lines.gen.ts"), "utf8");

const CORPUS = [...src.matchAll(/he:\s*"((?:[^"\\]|\\.)*)"/g)]
  .map((m) => m[1].normalize("NFC"))
  .filter((h) => !h.includes("_") && !/[A-Za-z]/.test(h));

const NIKUD = /[֑-ׇ]/;
const NIKUD_G = /[֑-ׇ]/g;
const DAGESH = /ּ/g;
const bare = (w) => w.normalize("NFC").replace(NIKUD_G, "");
const split = (s) =>
  s.split(/[\s.,!?;:"'()־׳״-]+/).filter((w) => /^[א-ת]+$/.test(bare(w)));

const tokens = [];
for (const l of CORPUS) tokens.push(...split(l));
const count = {};
const forms = {};
for (const w of tokens) {
  const k = bare(w);
  count[k] = (count[k] ?? 0) + 1;
  (forms[k] ??= {})[w] = (forms[k][w] ?? 0) + 1;
}
/** The commonest pointing of a word, which is the one to teach. */
const pointed = (k) => Object.entries(forms[k]).sort((a, b) => b[1] - a[1])[0][0];

/**
 * The vowels each prefix can carry. A mem prefix is mi- or me-, never ma-,
 * which is exactly what stops מַיִם being read as "from יִם". The articled
 * forms (ba-, la-, ka-) are admitted under their plain letter: a reader chunks
 * בַּ as one unit, and splitting it into bet + he teaches nothing useful.
 */
const PRE = [
  { p: "ה", v: /^[ֶַָ]$/ },
  { p: "ו", v: /^[ְַ]$|^$/ },
  { p: "ב", v: /^[ְִַָ]$/ },
  { p: "כ", v: /^[ְַָ]$/ },
  { p: "ל", v: /^[ְִַָ]$/ },
  { p: "מ", v: /^[ִֵ]$/ },
  { p: "ש", v: /^[ֶ]$/ },
];

/** [first letter with its points, everything after it]. */
function head(w) {
  const cs = [...w.normalize("NFC")];
  let i = 1;
  while (i < cs.length && NIKUD.test(cs[i])) i++;
  return [cs.slice(0, i).join(""), cs.slice(i).join("")];
}
/**
 * The head's vowel.
 *
 * Dagesh, shin dot and sin dot are all excluded: none of them is a vowel. The
 * dagesh belongs to the letter after it, and the shin dot is part of the shin
 * itself — leaving it in meant שֶׁ never matched the segol rule and the shin
 * prefix, one of the seven, produced no families at all.
 */
const vowelOf = (h) =>
  [...h.slice(1)].filter((c) => c !== "ּ" && c !== "ׁ" && c !== "ׂ").join("");
const noDagesh = (s) => s.normalize("NFC").replace(DAGESH, "");

/**
 * Words that look prefixed and are not.
 *
 * Each is a single lexical word whose first letter happens to be a prefix
 * letter, carrying a vowel a prefix could take, over a remainder the corpus
 * happens to attest. No rule catches these because they are lexical facts, so
 * they are listed. Found by reading all 269 candidates rather than by trusting
 * the filters.
 */
const NOT_PREFIXED = new Set([
  "מלה", // "word" — not mem + לָה
  "לכי", // the imperative "go!" (f.) — not lamed + כִּי
]);
/**
 * שֶׁל is a word of its own, "of". So שֶׁלִּי is שֶׁל plus a pronoun suffix and
 * means "mine" — it is not shin + לִי, "that to me". The whole possessive set
 * would otherwise be taught as a wrong analysis.
 */
const SHEL_SUFFIXED = new Set(["לי", "לך", "לו", "לה", "לנו", "לכם", "לכן", "להם", "להן"]);

const fam = new Map();
for (const w of tokens) {
  const [h, rest] = head(w);
  const rule = PRE.find((r) => r.p === bare(h));
  if (!rule || !rest || !rule.v.test(vowelOf(h))) continue;
  if (NOT_PREFIXED.has(bare(w))) continue;
  const rk = bare(rest);
  if (rule.p === "ש" && SHEL_SUFFIXED.has(rk)) continue;
  // Attested twice, so one typo cannot mint a family.
  if (rk.length < 2 || (count[rk] ?? 0) < 2) continue;
  if (noDagesh(rest) !== noDagesh(pointed(rk))) continue;
  if (!fam.has(rk)) fam.set(rk, new Map());
  // Keyed by the bare form, so one spelling of a form appears once.
  fam.get(rk).set(bare(w), { he: w, prefix: bare(h) });
}

const families = [...fam.entries()]
  .map(([k, m]) => ({
    base: pointed(k),
    n: count[k],
    forms: [...m.values()].sort((a, b) => (count[bare(b.he)] ?? 0) - (count[bare(a.he)] ?? 0)),
  }))
  // Families of one are kept: they are perfectly good drill items, and the
  // contrast between prefixes is taught from the largest families instead.
  // Filtering to two-plus silently dropped shin, whose forms mostly sit alone.
  .filter((f) => f.forms.length >= 1)
  .sort((a, b) => b.forms.length - a.forms.length || b.n - a.n);

const j = (v) => JSON.stringify(v);
writeFileSync(
  OUT,
  `/**
 * Generated affix families. Do not hand-edit.
 * Regenerate with scripts/build-affix.mjs.
 *
 * Every base and every prefixed form is attested in the programme corpus with
 * its own pointing. Nothing is parsed and nothing is inflected by hand: a
 * family survives only when both ends of it were found in the text.
 */

import type { AffixFamily } from "./affix.ts";

export const FAMILIES: AffixFamily[] = [
${families
  .map(
    (f) => `  {
    base: ${j(f.base)},
    seen: ${f.n},
    forms: [${f.forms.map((x) => `{ he: ${j(x.he)}, prefix: ${j(x.prefix)} }`).join(", ")}],
  },`,
  )
  .join("\n")}
];
`,
  "utf8",
);

const items = families.reduce((n, f) => n + f.forms.length, 0);
console.log(`wrote ${OUT}`);
console.log(`  ${families.length} families, ${items} prefixed forms`);
const byPre = {};
for (const f of families) for (const x of f.forms) byPre[x.prefix] = (byPre[x.prefix] ?? 0) + 1;
console.log(
  "  by prefix: " +
    Object.entries(byPre)
      .sort((a, b) => b[1] - a[1])
      .map(([p, n]) => `${p} ${n}`)
      .join("  "),
);
