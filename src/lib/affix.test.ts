import test from "node:test";
import assert from "node:assert/strict";
import {
  ALL_ITEMS,
  FAMILIES,
  PREFIXES,
  STAGES,
  TEACH_FAMILIES,
  bare,
  clearedIn,
  cut,
  meaningOf,
  nextQuestion,
  optionsFor,
} from "./affix.ts";
import { LETTERS } from "./letters.ts";
import { ALL_ITEMS as BLEND_ITEMS } from "./blend.ts";
import { POINTS } from "./vowels.ts";

const never = () => false;
const zero = () => 0;

/* --- the analysis has to be right ----------------------------------------- */

test("every form really is its prefix followed by its base", () => {
  // The claim the whole drill rests on. Stripping the prefix must leave the
  // base, allowing only a dagesh that prefixing legitimately adds.
  const noDagesh = (s: string) => s.normalize("NFC").replace(/ּ/g, "");
  for (const f of FAMILIES) {
    for (const x of f.forms) {
      const [head, rest] = cut(x.he, x.prefix);
      assert.equal(bare(head), x.prefix, `${x.he}: head is not ${x.prefix}`);
      assert.equal(
        noDagesh(rest),
        noDagesh(f.base),
        `${x.he} minus ${x.prefix} is "${rest}", not "${f.base}"`,
      );
    }
  }
});

test("only the seven proclitics appear as prefixes", () => {
  const seven = new Set(PREFIXES.map((p) => p.letter));
  assert.equal(seven.size, 7);
  for (const f of FAMILIES) {
    for (const x of f.forms) {
      assert.ok(seven.has(x.prefix), `${x.he} claims prefix ${x.prefix}`);
    }
  }
  // All seven must actually be taught, or a reader meets one it never drilled.
  const used = new Set(FAMILIES.flatMap((f) => f.forms.map((x) => x.prefix)));
  for (const p of seven) {
    assert.ok(used.has(p), `no material for the ${p} prefix`);
  }
});

test("the words that only look prefixed are kept out", () => {
  // Each of these is a single word whose first letter merely looks like a
  // prefix. They survived the vowel and attestation filters and were removed by
  // hand; if a regenerate lets one back in, that is a wrong analysis on screen.
  const forms = new Set(FAMILIES.flatMap((f) => f.forms.map((x) => bare(x.he))));
  for (const w of ["מלה", "לכי", "שלי", "שלך", "שלו", "שלה", "שלנו", "שלכם"]) {
    assert.ok(!forms.has(w), `"${w}" is not a prefixed word`);
  }
});

test("a form is never its own base", () => {
  for (const f of FAMILIES) {
    for (const x of f.forms) {
      assert.notEqual(bare(x.he), bare(f.base), `${x.he} is its own base`);
      assert.ok(bare(x.he).length > bare(f.base).length, `${x.he} is not longer`);
    }
  }
});

test("no form is claimed by two families", () => {
  const seen = new Map<string, string>();
  for (const f of FAMILIES) {
    for (const x of f.forms) {
      const prev = seen.get(bare(x.he));
      assert.equal(prev, undefined, `${x.he} is under both ${prev} and ${f.base}`);
      seen.set(bare(x.he), f.base);
    }
  }
});

/* --- the stages ----------------------------------------------------------- */

test("two stages, and the second is the one that teaches stripping", () => {
  assert.equal(STAGES.length, 2);
  assert.equal(STAGES[0].items.length, STAGES[1].items.length);
  for (const s of STAGES) {
    assert.ok(s.items.length > 100, `stage ${s.n} has ${s.items.length} items`);
    assert.ok(s.teach.length > 40 && s.ask.length > 0);
  }
  // Stage 1 answers a meaning, stage 2 answers Hebrew.
  for (const i of STAGES[0].items) assert.equal(i.answer, meaningOf(i.prefix));
  for (const i of STAGES[1].items) assert.equal(i.answer, i.base);
});

test("item ids cannot collide with anything else in the progress map", () => {
  const others = new Set<string>([
    ...LETTERS.flatMap((l) => [l.char, l.final ?? l.char]),
    ...BLEND_ITEMS.map((i) => i.id),
    ...POINTS.map((p) => p.id),
  ]);
  for (const i of ALL_ITEMS) {
    assert.ok(!others.has(i.id), `${i.id} collides with an existing progress key`);
  }
  assert.equal(new Set(ALL_ITEMS.map((i) => i.id)).size, ALL_ITEMS.length);
  // The two stages must not share a key, or clearing one clears the other.
  for (const i of STAGES[0].items) {
    assert.ok(i.id.startsWith("ap1:"));
  }
  for (const i of STAGES[1].items) {
    assert.ok(i.id.startsWith("ap2:"));
  }
});

/* --- the questions -------------------------------------------------------- */

test("the answer is always among the options, exactly once", () => {
  for (const s of STAGES) {
    for (const i of s.items) {
      const opts = optionsFor(i);
      assert.equal(opts.length, 4, `${i.id} offered ${opts.length}`);
      assert.equal(
        opts.filter((o) => o === i.answer).length,
        1,
        `${i.id}: answer appears ${opts.filter((o) => o === i.answer).length} times`,
      );
      assert.equal(new Set(opts).size, 4, `${i.id} repeats an option`);
    }
  }
});

test("stage 2 cannot be answered without reading", () => {
  // A distractor equal to the form itself, or containing the base, would give
  // the answer away on shape alone.
  for (const i of STAGES[1].items) {
    for (const o of optionsFor(i)) {
      if (o === i.answer) continue;
      assert.notEqual(bare(o), bare(i.form), `${i.id}: option is the form itself`);
      assert.notEqual(bare(o), bare(i.base), `${i.id}: duplicate base offered`);
    }
  }
});

test("stage 1 offers real prefix meanings and nothing invented", () => {
  const real = new Set(PREFIXES.map((p) => p.means));
  for (const i of STAGES[0].items) {
    for (const o of optionsFor(i)) {
      assert.ok(real.has(o), `${i.id} offered "${o}"`);
    }
  }
});

test("the draw retires what is banked", () => {
  const s = STAGES[0];
  // Bank all but one item: that one must be what comes up.
  const odd = s.items[7];
  const seen = new Set<string>();
  for (let n = 0; n < 20; n++) {
    seen.add(nextQuestion(s, zero, 3, (id) => id !== odd.id).item.id);
  }
  assert.deepEqual([...seen], [odd.id]);

  // With everything banked the pool returns rather than the drill dying.
  const q = nextQuestion(s, zero, 3, () => true);
  assert.ok(q.item, "nothing drawn once all are banked");
});

test("the draw favours what is least known", () => {
  const s = STAGES[1];
  const cold = s.items[0];
  // Weight 5 against 2 over 261 items is a small edge per draw, so the run has
  // to be long enough to see it: at 400 draws the expected count is under four
  // and ordinary noise swamps the effect.
  const TRIALS = 4000;
  let coldHits = 0;
  for (let n = 0; n < TRIALS; n++) {
    const item = nextQuestion(s, (id) => (id === cold.id ? 0 : 3), 3, never).item;
    if (item.id === cold.id) coldHits++;
  }
  const fair = TRIALS / s.items.length;
  assert.ok(
    coldHits > fair * 1.5,
    `cold item drawn ${coldHits} times in ${TRIALS}; an unweighted draw would give ${fair.toFixed(1)}`,
  );
});

test("progress is counted per stage", () => {
  const s = STAGES[0];
  assert.deepEqual(clearedIn(s, never), { cleared: 0, total: s.items.length });
  assert.deepEqual(clearedIn(s, () => true), {
    cleared: s.items.length,
    total: s.items.length,
  });
});

/* --- display -------------------------------------------------------------- */

test("cut keeps the dagesh with the letter it belongs to", () => {
  // הַיּוֹם is he + yod-with-dagesh: the dagesh is the yod's, not the he's.
  const [head, rest] = cut("הַיּוֹם", "ה");
  assert.equal(head, "הַ");
  assert.equal(rest, "יּוֹם");
  // A word that is not prefixed at all comes back whole.
  assert.deepEqual(cut("מַיִם", "מ"), ["מַ", "יִם"]);
  assert.deepEqual(cut("שָׁלוֹם", "ב"), ["", "שָׁלוֹם"]);
});

test("cut puts the word back together", () => {
  for (const f of FAMILIES) {
    for (const x of f.forms) {
      const [head, rest] = cut(x.he, x.prefix);
      assert.equal(head + rest, x.he.normalize("NFC"), `${x.he} did not survive`);
    }
  }
});

test("the teaching families show a real contrast", () => {
  assert.ok(TEACH_FAMILIES.length >= 3, `${TEACH_FAMILIES.length} families to teach from`);
  for (const f of TEACH_FAMILIES) {
    assert.ok(f.forms.length >= 4, `${f.base} has only ${f.forms.length} forms`);
    // Four forms of the same word are only a contrast if the prefixes differ.
    assert.equal(
      new Set(f.forms.map((x) => x.prefix)).size,
      f.forms.length,
      `${f.base} repeats a prefix`,
    );
  }
});
