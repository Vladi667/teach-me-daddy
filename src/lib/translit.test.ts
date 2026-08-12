import test from "node:test";
import assert from "node:assert/strict";
import { phonetic, translit } from "./translit.ts";
import { LINES } from "./lines.ts";

/* --- the vowels the nikud spells out -------------------------------------- */

test("the five vowels come off the points", () => {
  assert.equal(translit("בַּ"), "Ba");
  assert.equal(translit("בֶּ"), "Be");
  assert.equal(translit("בִּ"), "Bi");
  assert.equal(translit("בֹּ"), "Bo");
  assert.equal(translit("בֻּ"), "Bu");
});

test("qamats and patah are both a; tsere and segol are both e", () => {
  assert.equal(translit("בָּ"), "Ba");
  assert.equal(translit("בֵּ"), "Be");
});

/* --- consonants ----------------------------------------------------------- */

test("dagesh decides b/v, k/kh, p/f", () => {
  assert.equal(translit("בַּ"), "Ba");
  assert.equal(translit("בַ"), "Va");
  assert.equal(translit("כַּ"), "Ka");
  assert.equal(translit("כַ"), "Kha");
  assert.equal(translit("פַּ"), "Pa");
  assert.equal(translit("פַ"), "Fa");
});

test("the dot decides shin from sin", () => {
  assert.equal(translit("שָׁ"), "Sha");
  assert.equal(translit("שָׂ"), "Sa");
});

test("alef and ayin are silent, as they are in speech", () => {
  assert.equal(translit("אָ"), "A");
  assert.equal(translit("עָ"), "A");
});

test("final forms sound like the letters they are", () => {
  assert.equal(translit("סוֹף"), "Sof");
  assert.equal(translit("מַיִם"), "Mayim");
});

/* --- vav and yod doing vowel duty ----------------------------------------- */

test("vav is o with holam and u with shuruk, v otherwise", () => {
  assert.equal(translit("שָׁלוֹם"), "Shalom");
  assert.equal(translit("הוּא"), "Hu");
  assert.equal(translit("וָ"), "Va");
});

test("yod after a vowel joins it rather than sounding twice", () => {
  assert.equal(translit("עִבְרִית"), "Ivrit", "hiriq male is one i");
  assert.equal(translit("אֵיפֹה"), "Eifo", "tsere + yod is ei");
});

/* --- shva ----------------------------------------------------------------- */

test("a word-initial shva is pronounced", () => {
  assert.equal(translit("מְדַבֵּר"), "Medaber");
});

test("a shva at the end of a word is silent", () => {
  // No trailing "e" — the word ends on the consonant.
  assert.ok(!translit("אַתְּ").endsWith("e"), translit("אַתְּ"));
});

test("a mid-word shva after a vowel stays silent", () => {
  // No "e" after "yis" — the apostrophe is the silent alef between vowels.
  assert.equal(translit("יִשְׂרָאֵל"), "Yisra'el");
});

test("a silent alef or ayin between two vowels is marked, not swallowed", () => {
  // Otherwise כְּאֶל reads as one long vowel instead of two syllables.
  assert.equal(translit("כְּאֶל"), "Ke'el");
  assert.equal(translit("הָאֵם"), "Ha'em");
  assert.equal(translit("דָּאֲגָה"), "Da'aga");
});

test("a final he is silent even with punctuation after it", () => {
  // 284 lines end this way; the stop used to hide the he and leave an "h".
  assert.equal(translit("אָרִיזוֹנָה."), "Arizona.");
  assert.equal(translit("מָה?"), "Ma?");
});

test("kol is kol", () => {
  assert.equal(translit("כָּל"), "Kol");
  assert.equal(translit("כָּל."), "Kol.");
});

/* --- whole lines ---------------------------------------------------------- */

test("real corpus lines read the way they sound", () => {
  assert.equal(translit("אֲנִי מְדַבֵּר קְצָת עִבְרִית"), "Ani medaber ketsat ivrit");
  assert.equal(translit("מָה הַשֵּׁם שֶׁלְּךָ?"), "Ma hashem shelekha?");
});

/**
 * The one place this deliberately disagrees with the street. A word-initial
 * shva is classically pronounced, and that is what is written here; Modern
 * Israeli elides it wherever the cluster is easy to say, so שְׁנֵי is heard as
 * "shnei" and קְצָת as "ktsat". Guessing which clusters survive needs a
 * sonority model that would be wrong often enough to mislead, and erring
 * toward over-articulation is the safe direction: a learner saying "shenei"
 * is understood, one saying an invented consonant is not. The recording is
 * the authority, and it is one tap away on every line.
 */
test("word-initial shva is written even where speech drops it", () => {
  assert.equal(translit("יֵשׁ לִי שְׁנֵי יְלָדִים."), "Yesh li shenei yeladim.");
  assert.equal(translit("קְצָת"), "Ketsat");
});

test("punctuation and spacing survive", () => {
  assert.match(translit("מָה קָרָה?"), /\?$/);
  assert.equal(translit("אֲנִי  רוֹצֶה").includes("  "), false, "spaces collapse");
});

/* --- the seam with the corpus --------------------------------------------- */

test("a hand-written transliteration is never overwritten", () => {
  assert.equal(phonetic({ he: "שָׁלוֹם", tr: "Shalom!" }), "Shalom!");
  assert.equal(phonetic({ he: "שָׁלוֹם", tr: "  " }), "Shalom", "blank falls through");
  assert.equal(phonetic({ he: "שָׁלוֹם" }), "Shalom");
});

test("every line in the corpus romanises to something readable", () => {
  const bad: string[] = [];
  for (const l of LINES) {
    const t = phonetic(l);
    // Latin letters only — a stray Hebrew character means a gap in the table.
    if (/[א-ת]/.test(t)) bad.push(`${l.id}: ${t}`);
    if (!t.trim()) bad.push(`${l.id}: empty`);
  }
  assert.deepEqual(bad.slice(0, 5), [], `${bad.length} of ${LINES.length} bad`);
});

test("no line romanises to a run of consonants with no vowel at all", () => {
  const voiceless = LINES.filter((l) => !/[aeiou]/i.test(phonetic(l)));
  assert.deepEqual(voiceless.slice(0, 3).map((l) => l.id), []);
});
