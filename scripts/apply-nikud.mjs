/**
 * Fold a reviewer's corrections back into the corpus.
 *
 *   node scripts/apply-nikud.mjs nikud-corrections.json [--dry]
 *
 * Corrections are keyed "consonants|current reading", so an answer replaces
 * only the occurrences pointed that way. את is אֶת in 164 lines and אַתְּ in 8;
 * keying by consonants alone would let one answer break the other eight.
 * Line ids hash the consonants and nikud carries none of them,
 * so ids survive — but the audio does not: the voice reads the vowels, and a
 * corrected line is now spoken wrong. Every touched line has its two renderings
 * deleted, and `gen-audio.mjs` re-makes exactly those on the next run.
 */
import { readFileSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const input = process.argv[2];
const dry = process.argv.includes("--dry");

if (!input) {
  console.error("usage: node scripts/apply-nikud.mjs <corrections.json> [--dry]");
  process.exit(1);
}

const { corrections = {} } = JSON.parse(readFileSync(resolve(input), "utf8"));
console.log(`${Object.keys(corrections).length} corrections submitted`);

const NIKUD = /[֑-ׇ]/g;
/** See flag-nikud.mjs: the corpus is not NFC, typed corrections are. */
const nfc = (s) => s.normalize("NFC");
const bare = (s) => nfc(s).replace(NIKUD, "").replace(/[^א-ת]/g, "");

/** "consonants|reading" -> replacement, after the sanity checks. */
const fixes = new Map();
for (const [k, v] of Object.entries(corrections)) {
  const [form, from] = k.split("|");
  // A correction may only change vowels. Anything that moves a consonant is a
  // different word, and silently rewriting the corpus with it would be worse
  // than dropping it.
  if (!from) {
    console.error(`skip ${k}: not a "form|reading" key`);
    continue;
  }
  // Hebrew letters and points only: bare() strips anything else, so a stray
  // Latin character would pass the consonant check and land in the corpus.
  if (!/^[א-ת֑-ׇ]+$/.test(nfc(v))) {
    console.error(`skip ${k}: "${v}" is not Hebrew letters and points`);
    continue;
  }
  if (bare(v) !== form) {
    console.error(`skip ${k}: "${v}" has different consonants (${bare(v)})`);
    continue;
  }
  if (nfc(v) === nfc(from)) continue; // reviewer kept it
  fixes.set(`${form}|${nfc(from)}`, nfc(v));
}
console.log(`${fixes.size} usable after checks`);

if (!fixes.size) process.exit(0);

const touched = new Set();
let replaced = 0;

for (const file of ["src/lib/lines.seed.ts", "src/lib/lines.gen.ts"]) {
  const p = resolve(root, file);
  const src = readFileSync(p, "utf8");

  const next = src.replace(
    /(\{\s*\n\s*id: "([^"]+)",[\s\S]*?he: ")((?:[^"\\]|\\.)*)(")/g,
    (whole, head, id, he, tail) => {
      const words = he.split(" ");
      let changed = false;
      const fixed = words.map((w) => {
        const reading = nfc(w).replace(/[^א-ת֑-ׇ]/g, "");
        const fix = fixes.get(`${bare(w)}|${reading}`);
        if (!fix) return w;
        // Keep whatever punctuation the word carried in this sentence.
        const punct = w.replace(/[א-ת֑-ׇ]/g, "");
        const rebuilt = fix + punct;
        if (rebuilt === w) return w;
        changed = true;
        replaced++;
        return rebuilt;
      });
      if (!changed) return whole;
      touched.add(id);
      return head + fixed.join(" ") + tail;
    },
  );

  if (!dry && next !== src) writeFileSync(p, next);
  console.log(`${file}: ${next === src ? "unchanged" : "rewritten"}`);
}

console.log(`${replaced} words replaced across ${touched.size} lines`);

// The voice reads the vowels, so a corrected line's audio is now wrong.
let dropped = 0;
for (const id of touched) {
  for (const speed of ["slow", "natural"]) {
    const f = resolve(root, `public/audio/${id}-${speed}.mp3`);
    if (!existsSync(f)) continue;
    if (!dry) rmSync(f);
    dropped++;
  }
}
console.log(
  dry
    ? `dry run — would drop ${dropped} audio files`
    : `dropped ${dropped} audio files; run: node scripts/gen-audio.mjs`,
);
