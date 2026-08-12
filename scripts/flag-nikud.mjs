/**
 * Collect every word Dicta Nakdan was unsure about, so the review has a queue.
 *
 * The corpus build counted `fconfident: false` and threw the detail away, which
 * left "5,860 words flagged" as a number nobody could act on. This re-runs the
 * vocaliser over the shipped corpus and keeps what it says about each token:
 * the form it chose, the alternatives it offered, and where the word occurs.
 *
 *   node scripts/flag-nikud.mjs [--out scripts/nikud-flags.json]
 *
 * Reading the corpus rather than Tatoeba is deliberate — the queue has to
 * describe the lines that actually shipped, not the candidates they came from.
 *
 * The queue is keyed by *reading*, not by word. את is pointed אֶת in 164 lines
 * and אַתְּ in 8, and both are right where they stand; one card per word would
 * invite a reviewer to "fix" all 172 at once and break the eight.
 * The nikud is stripped before sending: Nakdan vocalises unpointed Hebrew, and
 * feeding its own output back makes it doubt almost everything.
 */
import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const arg = (k, d) => {
  const i = process.argv.indexOf(`--${k}`);
  return i > -1 ? process.argv[i + 1] : d;
};
const OUT = resolve(root, arg("out", "scripts/nikud-flags.json"));

const NIKUD = /[֑-ׇ]/g;
/**
 * Combining marks are compared, so they must be ordered. The corpus stores
 * dagesh before sheva; anything typed by a reviewer arrives NFC, which is
 * sheva before dagesh. The two look identical and are different bytes, so
 * every comparison in this pipeline normalises first.
 */
const nfc = (s) => s.normalize("NFC");
const bare = (s) => nfc(s).replace(NIKUD, "").replace(/[^א-ת]/g, "");

const { LINES } = await import("../src/lib/lines.ts");
console.log(`${LINES.length} lines to check`);

const NAKDAN = "https://nakdan-2-0.loadbalancer.dicta.org.il/api";
const pick = (o) => (typeof o === "string" ? o : Array.isArray(o) ? o[0] : "");

/**
 * One request per batch, tokens streamed back in order with `sep` marking the
 * gaps. Newlines are separators too, which is how a token is attributed to its
 * line: count them as they go past.
 */
async function check(batch) {
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

  const out = [];
  let row = 0;
  for (const t of json) {
    if (t.sep) {
      // A separator can carry several newlines; every one moves a line on.
      row += (t.word.match(/\n/g) || []).length;
      continue;
    }
    out.push({
      row,
      word: t.word,
      chosen: (pick(t.options?.[0]) || t.word).replace(/\|/g, ""),
      confident: t.fconfident !== false,
      // What else it considered. The reviewer usually only needs to pick.
      options: (t.options ?? [])
        .map((o) => nfc(pick(o)).replace(/\|/g, ""))
        .filter((v, i, a) => v && a.indexOf(v) === i)
        .slice(0, 4),
    });
  }
  return out;
}

const BATCH = 40;
const flags = new Map();
/** bare form -> the distinct readings Nakdan was sure about. */
const confident = new Map();
let tokens = 0;
let unsure = 0;
let drift = 0;

for (let i = 0; i < LINES.length; i += BATCH) {
  const slice = LINES.slice(i, i + BATCH);
  let toks;
  try {
    toks = await check(slice.map((l) => l.he.replace(NIKUD, "")));
  } catch (e) {
    console.error(`\nbatch ${i}: ${e.message}`);
    continue;
  }
  for (const t of toks) {
    const line = slice[t.row];
    if (!line) continue;
    tokens++;
    const bareKey = bare(t.word);
    if (t.confident) {
      if (bareKey) {
        const set = confident.get(bareKey) ?? new Set();
        set.add(nfc(t.chosen).replace(/[^א-ת֑-ׇ]/g, ""));
        confident.set(bareKey, set);
      }
      continue;
    }
    unsure++;

    // The shipped text is what the trainee reads and what the voice speaks;
    // if a rerun disagrees with it, that alone is worth the reviewer's eye.
    const shipped = line.he
      .split(/\s+/)
      .find((w) => bare(w) === bare(t.word));
    if (shipped && nfc(shipped).replace(/[^א-ת֑-ׇ]/g, "") !==
        nfc(t.chosen).replace(/[^א-ת֑-ׇ]/g, "")) {
      drift++;
    }

    if (!bareKey || !shipped) continue;
    // Key on the pointed form as it stands in the corpus, so a word read two
    // ways in two sentences arrives as two cards.
    const reading = nfc(shipped).replace(/[^א-ת֑-ׇ]/g, "");
    const key = `${bareKey}|${reading}`;
    const entry = flags.get(key) ?? {
      key,
      form: bareKey,
      chosen: reading,
      options: [],
      lines: [],
    };
    for (const o of t.options) {
      if (!entry.options.includes(o)) entry.options.push(o);
    }
    if (entry.lines.length < 6 && !entry.lines.some((l) => l.id === line.id)) {
      entry.lines.push({ id: line.id, he: line.he, fr: line.fr });
    }
    entry.count = (entry.count ?? 0) + 1;
    flags.set(key, entry);
  }
  process.stdout.write(`\r${Math.min(i + BATCH, LINES.length)}/${LINES.length}`);
}
console.log();

/**
 * The corpus is its own second opinion. Where a form is read confidently in
 * one sentence and doubtfully in another, the confident reading is evidence —
 * but only if the confident readings agree with each other. Hebrew homographs
 * are real (סֵפֶר and סַפָּר share a skeleton), so a split vote settles nothing
 * and goes to the reviewer intact.
 */
/** Forms the corpus itself points more than one way. */
const readings = new Map();
for (const e of flags.values()) {
  const set = readings.get(e.form) ?? new Set();
  set.add(e.chosen);
  readings.set(e.form, set);
}

let corroborated = 0;
let contested = 0;
let multi = 0;
for (const entry of flags.values()) {
  if ((readings.get(entry.form)?.size ?? 1) > 1) {
    entry.variants = [...readings.get(entry.form)];
    multi++;
  }
  const agreed = confident.get(entry.form);
  if (!agreed) continue;
  if (agreed.size === 1) {
    entry.corroborated = [...agreed][0];
    corroborated++;
  } else {
    entry.contested = [...agreed].slice(0, 4);
    contested++;
  }
}

const list = [...flags.values()].sort((a, b) => b.count - a.count);
writeFileSync(OUT, JSON.stringify({ generated: LINES.length, list }, null, 1));

console.log(`${tokens} tokens · ${unsure} uncertain readings`);
console.log(`${list.length} distinct readings to review`);
console.log(`${multi} of them are a form the corpus points more than one way`);
console.log(`${corroborated} corroborated by a confident reading elsewhere`);
console.log(`${contested} read two different ways, both confidently`);
console.log(`${drift} rerun disagreements with the shipped text`);
const top = list.slice(0, 20).reduce((n, e) => n + e.count, 0);
console.log(`top 20 forms cover ${top} of ${unsure} occurrences`);
console.log(`wrote ${OUT}`);
