import test from "node:test";
import assert from "node:assert/strict";
import {
  ALL_ITEMS,
  STAGES,
  breakdown,
  optionsFor,
  stageFor,
  syllables,
} from "./blend.ts";
import { translit } from "./translit.ts";

const sounds = (w: string) => breakdown(w).map((b) => b.sound).join("-");

/* --- syllabification, which is the lesson --------------------------------- */

test("a consonant takes the vowel under it", () => {
  assert.deepEqual(syllables("מַ"), ["מַ"]);
  assert.equal(sounds("סֵפֶר"), "se-fer");
});

test("a vowel-less consonant closes the syllable before it", () => {
  assert.equal(syllables("מַן").length, 1, "man is one syllable");
  assert.equal(sounds("עִבְרִית"), "iv-rit");
});

/**
 * The bug that mattered most: a vav writing o or u is the vowel of the letter
 * in front, not a syllable of its own. Split wrongly, this teaches shal-om.
 */
test("a vav writing o or u belongs to the consonant before it", () => {
  assert.equal(sounds("שָׁלוֹם"), "sha-lom");
  assert.equal(sounds("תּוֹדָה"), "to-da");
  assert.equal(sounds("מוּזִיקָה"), "mu-zi-ka");
});

test("a final consonant never dangles as its own syllable", () => {
  assert.equal(sounds("יְלָדִים"), "ye-la-dim");
  for (const w of ["שָׁלוֹם", "יְלָדִים", "עִבְרִית"]) {
    for (const s of syllables(w)) {
      assert.match(s, /[ֱֲֳִֵֶַָׇֹֺֻ]|ו[ֹֺּ]|ְ/, `${w}: "${s}" has no vowel`);
    }
  }
});

test("a word-initial sheva opens a syllable", () => {
  assert.equal(sounds("בְּבַקָּשָׁה"), "be-va-ka-sha");
});

test("splitting never loses or adds a letter", () => {
  for (const w of ["שָׁלוֹם", "הַבַּיִת", "בְּבַקָּשָׁה", "מוּזִיקָה", "יְלָדִים"]) {
    assert.equal(syllables(w).join(""), w.normalize("NFC"), w);
  }
});

test("the parts said in order are the whole word", () => {
  for (const w of ["שָׁלוֹם", "סֵפֶר", "תּוֹדָה", "מוּזִיקָה"]) {
    const joined = breakdown(w).map((b) => b.sound).join("");
    assert.equal(joined, translit(w).toLowerCase(), w);
  }
});

/* --- the stages ----------------------------------------------------------- */

test("five stages, each with items", () => {
  assert.equal(STAGES.length, 5);
  for (const s of STAGES) {
    assert.ok(s.items.length >= 10, `stage ${s.n} has ${s.items.length}`);
    assert.ok(s.teach.length > 60, `stage ${s.n} teaches nothing`);
    assert.ok(s.title.trim());
  }
});

test("every item has a readable Hebrew prompt and a Latin answer", () => {
  for (const i of ALL_ITEMS) {
    assert.match(i.show, /[א-ת]/, i.id);
    assert.match(i.show, /[֑-ׇ]/, `${i.id} is unpointed`);
    assert.match(i.answer, /^[a-z' ]+$/, `${i.id}: ${i.answer}`);
  }
});

test("item ids are unique, so progress cannot collide", () => {
  const ids = ALL_ITEMS.map((i) => i.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("the ladder actually climbs", () => {
  const len = (n: number) =>
    stageFor(n)!.items.reduce((a, i) => a + i.show.replace(/[^א-ת]/g, "").length, 0) /
    stageFor(n)!.items.length;
  assert.ok(len(1) < len(2), "closed syllables are longer than open ones");
  assert.ok(len(2) < len(3), "words are longer than syllables");
  assert.ok(len(4) < len(5), "phrases are longer than words");
});

test("stage 1 is single syllables and stage 3 is not", () => {
  for (const i of stageFor(1)!.items) assert.equal(syllables(i.show).length, 1, i.show);
  const multi = stageFor(3)!.items.filter((i) => syllables(i.show).length >= 2);
  assert.ok(multi.length > stageFor(3)!.items.length * 0.7, "mostly multi-syllable");
});

test("stage 4 is prefixed words and stage 5 is more than one word", () => {
  for (const i of stageFor(4)!.items) {
    assert.match(i.show[0], /[הבולכמש]/, `${i.show} has no prefix`);
  }
  for (const i of stageFor(5)!.items) {
    assert.ok(i.show.trim().split(/\s+/).length >= 2, i.show);
  }
});

/* --- the question --------------------------------------------------------- */

test("the answer is always among the options, and they are distinct", () => {
  for (const s of STAGES) {
    for (const i of s.items) {
      const o = optionsFor(s, i);
      assert.ok(o.includes(i.answer), `${i.id} lacks its answer`);
      assert.equal(new Set(o).size, o.length, `${i.id} repeats an option`);
      assert.equal(o.length, 4, i.id);
    }
  }
});

/**
 * Distractors from another stage would be answerable by length alone — a
 * three-word phrase against a single syllable needs no reading at all.
 */
test("distractors come from the same stage", () => {
  const s1 = stageFor(1)!;
  const answers = new Set(s1.items.map((i) => i.answer));
  for (const o of optionsFor(s1, s1.items[0])) assert.ok(answers.has(o), o);
});
