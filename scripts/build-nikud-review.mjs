/**
 * Emit a standalone review page for the nikud queue.
 *
 * The one job in this project that no script can do is being a native Hebrew
 * speaker. This is the tooling around that job: one HTML file with the queue
 * baked in, no server, no repository, no install. Open it, work down the list,
 * press Export, send back the JSON. `scripts/apply-nikud.mjs` does the rest.
 *
 *   node scripts/build-nikud-review.mjs [--top 0] [--out review/nikud.html]
 *
 * Ordered by how often a form occurs, because that is what the reviewer's time
 * is worth: the top of this list is the function words that appear in hundreds
 * of lines, and the tail is hapaxes that appear once each.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const arg = (k, d) => {
  const i = process.argv.indexOf(`--${k}`);
  return i > -1 ? process.argv[i + 1] : d;
};
const OUT = resolve(root, arg("out", "review/nikud.html"));
const TOP = Number(arg("top", 0)) || 0;

const { list } = JSON.parse(
  readFileSync(resolve(root, "scripts/nikud-flags.json"), "utf8"),
);

const queue = (TOP ? list.slice(0, TOP) : list).map((e) => ({
  k: e.key,
  c: e.chosen,
  n: e.count,
  o: e.options.slice(0, 6),
  x: e.variants ? e.variants.length : 0,
  l: e.lines.slice(0, 3).map((l) => [l.he, l.fr]),
}));

const total = queue.reduce((n, e) => n + e.n, 0);

const html = `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Nikud review — Teach me Daddy</title>
<style>
  :root { color-scheme: dark; --ink:#e9edec; --dim:#8b9997; --line:#242b2a;
          --bg:#0b0f0f; --panel:#121817; --acc:#2fd4c4; --warn:#e0a44a; }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--bg); color:var(--ink);
         font:16px/1.5 system-ui,-apple-system,Segoe UI,sans-serif; }
  header { position:sticky; top:0; background:var(--bg);
           border-bottom:1px solid var(--line); padding:14px 18px; z-index:2; }
  h1 { margin:0 0 4px; font-size:17px; letter-spacing:-0.01em; }
  .sub { color:var(--dim); font-size:13px; }
  .bar { height:3px; background:var(--line); margin-top:10px; border-radius:2px; }
  .bar i { display:block; height:100%; background:var(--acc); border-radius:2px; }
  main { max-width:720px; margin:0 auto; padding:18px; }
  .card { background:var(--panel); border:1px solid var(--line);
          border-radius:14px; padding:16px; margin-bottom:14px; }
  .card.done { opacity:.45; }
  .head { display:flex; align-items:baseline; gap:12px; }
  .he { font-size:30px; direction:rtl; font-family:"Times New Roman",serif; }
  .n { color:var(--dim); font-size:13px; margin-inline-start:auto; }
  .ctx { margin:12px 0 0; padding-top:12px; border-top:1px solid var(--line); }
  .ctx p { margin:0 0 8px; }
  .ctx .h { direction:rtl; text-align:right; font-size:19px;
            font-family:"Times New Roman",serif; }
  .ctx .f { color:var(--dim); font-size:13px; }
  .opts { display:flex; flex-wrap:wrap; gap:7px; margin-top:12px; }
  button { font:inherit; color:inherit; background:#1b2322;
           border:1px solid var(--line); border-radius:9px;
           padding:7px 12px; cursor:pointer; }
  button:hover { border-color:var(--acc); }
  button.opt { direction:rtl; font-size:19px; font-family:"Times New Roman",serif; }
  button.ok { background:var(--acc); color:#04201d; border-color:var(--acc);
              font-weight:600; }
  .verdict { margin-top:10px; font-size:13px; color:var(--acc); }
  .verdict.bad { color:var(--warn); }
  input { font:inherit; direction:rtl; text-align:right; background:#0e1413;
          border:1px solid var(--line); border-radius:9px; padding:7px 11px;
          color:var(--ink); width:190px; font-size:19px; }
  .note { color:var(--dim); font-size:13px; line-height:1.6; }
  .tag { font-size:11px; color:var(--warn); border:1px solid var(--warn);
         border-radius:5px; padding:1px 5px; }
  .actions { position:sticky; bottom:0; background:var(--bg); padding:12px 0;
             border-top:1px solid var(--line); display:flex; gap:8px; }
</style></head><body>
<header>
  <h1>Nikud review</h1>
  <div class="sub" id="sub"></div>
  <div class="bar"><i id="prog" style="width:0"></i></div>
</header>
<main>
  <p class="note">
    Each card is one <i>reading</i> — a word as it is currently pointed — with
    up to three sentences it appears in. A word pointed two ways gets two
    cards, marked as such, because both can be right where they stand.
    <b>Right</b> keeps the vowels as they are. Otherwise tap one of the
    alternatives, or type the correct pointing. Skip anything you are not sure
    of — a confident wrong answer is worse than a gap. Your work is saved in
    this browser as you go; press <b>Export</b> at the end and send the file back.
  </p>
  <p class="note">
    The list is ordered by how many lines the word appears in, so the first
    fifty are worth more than the last five hundred. Stopping early is fine.
  </p>
  <div id="list"></div>
  <div class="actions">
    <button onclick="save()">Export corrections</button>
    <button onclick="if(confirm('Clear all your answers?')){localStorage.removeItem(KEY);location.reload()}">Reset</button>
  </div>
</main>
<script>
const Q = ${JSON.stringify(queue)};
const KEY = "nikud-review-v1";
let done = JSON.parse(localStorage.getItem(KEY) || "{}");

function esc(s){ return String(s).replace(/[&<>]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;"}[c])); }

const NIKUD = /[֑-ׇ]/g;
const bare = (s) => s.normalize("NFC").replace(NIKUD, "").replace(/[^א-ת]/g, "");

/**
 * A correction may change the vowels and nothing else. Without this the apply
 * script drops the answer on the other side of the round trip, long after the
 * reviewer could have noticed the typo.
 */
function typed(k, el) {
  const v = el.value.trim();
  if (!v) return;
  const form = k.split("|")[0];
  if (bare(v) !== form) {
    el.setCustomValidity("");
    alert("That has different consonants (" + bare(v) + ", expected " + form +
          "). A correction can change the vowels only.");
    el.value = "";
    return;
  }
  set(k, v.normalize("NFC"), "typed");
}

function set(k, value, kind) {
  if (value === null) delete done[k]; else done[k] = { value, kind };
  localStorage.setItem(KEY, JSON.stringify(done));
  render();
}

function render() {
  const n = Object.keys(done).length;
  document.getElementById("sub").textContent =
    n + " of " + Q.length + " readings answered · " + ${total} + " occurrences in the corpus";
  document.getElementById("prog").style.width = (n / Q.length * 100) + "%";

  document.getElementById("list").innerHTML = Q.map((e, i) => {
    const d = done[e.k];
    const opts = e.o.filter(o => o !== e.c);
    return '<div class="card' + (d ? ' done' : '') + '" id="c' + i + '">' +
      '<div class="head"><span class="he">' + esc(e.c) + '</span>' +
      (e.x ? '<span class="tag">' + e.x + ' readings in the corpus</span>' : '') +
      '<span class="n">' + e.n + (e.n === 1 ? ' line' : ' lines') + '</span></div>' +
      '<div class="ctx">' + e.l.map(([h, f]) =>
        '<p class="h">' + esc(h) + '</p><p class="f">' + esc(f) + '</p>').join('') +
      '</div>' +
      '<div class="opts">' +
        '<button class="ok" onclick="set(\\'' + e.k + '\\',\\'' + e.c + '\\',\\'ok\\')">Right</button>' +
        opts.map(o => '<button class="opt" onclick="set(\\'' + e.k + '\\',\\'' + o + '\\',\\'pick\\')">' + esc(o) + '</button>').join('') +
        '<input placeholder="type it" onchange="typed(\\'' + e.k + '\\',this)">' +
      '</div>' +
      (d ? '<div class="verdict' + (d.kind === 'ok' ? '' : ' bad') + '">' +
        (d.kind === 'ok' ? 'kept as is' : 'corrected to ' + esc(d.value)) +
        ' · <a href="#" onclick="set(\\'' + e.k + '\\',null);return false" style="color:inherit">undo</a></div>' : '') +
      '</div>';
  }).join("");
}

function save() {
  const out = { reviewed: new Date().toISOString().slice(0, 10), corrections: {} };
  for (const [k, v] of Object.entries(done)) {
    if (v.kind !== "ok") out.corrections[k] = v.value;
  }
  out.confirmed = Object.entries(done).filter(([, v]) => v.kind === "ok").map(([k]) => k);
  const blob = new Blob([JSON.stringify(out, null, 1)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "nikud-corrections.json";
  a.click();
}

render();
</script></body></html>
`;

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, html);
console.log(
  `wrote ${OUT}: ${queue.length} forms, ${total} occurrences, ${Math.round(html.length / 1024)} KB`,
);
