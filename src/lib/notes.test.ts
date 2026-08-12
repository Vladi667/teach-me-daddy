import { test } from "node:test";
import assert from "node:assert/strict";
import { customId } from "./notes.ts";
import { parseVocabFile, toCSV } from "./csv.ts";

/* --- field notes ---------------------------------------------------------- */

test("custom ids ignore nikud, so the same word doesn't duplicate", () => {
  assert.equal(customId("בַּיִת"), customId("בית"));
  assert.notEqual(customId("בית"), customId("דירה"));
});


/* --- import -------------------------------------------------------------- */

const NOW = 1_700_000_000_000;

test("reads a CSV with headers", () => {
  const { items, skipped } = parseVocabFile(
    "hebrew,transliteration,meaning\nכֶּלֶב,kelev,chien\nחָתוּל,chatul,chat",
    "fr",
    NOW,
  );
  assert.equal(items.length, 2);
  assert.equal(skipped, 0);
  assert.equal(items[0].fr, "chien");
  assert.equal(items[0].en, "");
});

test("reads Anki's tab-separated export with no header", () => {
  const { items } = parseVocabFile(
    "מַיִם\tmayim\teau\nלֶחֶם\tlechem\tpain",
    "fr",
    NOW,
  );
  assert.equal(items.length, 2);
  assert.equal(items[1].tr, "lechem");
});

test("maps columns by header name, whatever the order", () => {
  const { items } = parseVocabFile(
    "meaning,hebrew,translit\nchien,כֶּלֶב,kelev",
    "fr",
    NOW,
  );
  assert.equal(items[0].he, "כֶּלֶב");
  assert.equal(items[0].fr, "chien");
  assert.equal(items[0].tr, "kelev");
});

test("skips rows with no Hebrew or no meaning, and dedupes", () => {
  const { items, skipped } = parseVocabFile(
    "hebrew,transliteration,meaning\nכֶּלֶב,kelev,chien\nnothebrew,x,y\nחָתוּל,chatul,\nכֶּלֶב,kelev,doublon",
    "fr",
    NOW,
  );
  assert.equal(items.length, 1);
  assert.equal(skipped, 3);
});

test("honours quoted fields containing commas", () => {
  const { items } = parseVocabFile(
    'hebrew,transliteration,meaning\nכֶּלֶב,kelev,"chien, canidé"',
    "fr",
    NOW,
  );
  assert.equal(items[0].fr, "chien, canidé");
});

test("an example sentence is kept only when it's Hebrew", () => {
  const { items } = parseVocabFile(
    "hebrew,transliteration,meaning,example\nכֶּלֶב,kelev,chien,יֵשׁ לִי כֶּלֶב\nחָתוּל,chatul,chat,not hebrew",
    "fr",
    NOW,
  );
  assert.ok(items[0].example?.he.includes("כֶּלֶב"));
  assert.equal(items[1].example, undefined);
});

test("export round-trips back through the parser", () => {
  const { items } = parseVocabFile(
    'hebrew,transliteration,meaning,example,source\nכֶּלֶב,kelev,"chien, canidé",יֵשׁ לִי כֶּלֶב,ulpan',
    "fr",
    NOW,
  );
  const again = parseVocabFile(toCSV(items), "fr", NOW).items;
  assert.equal(again.length, 1);
  assert.equal(again[0].he, items[0].he);
  assert.equal(again[0].fr, items[0].fr);
  assert.equal(again[0].source, "ulpan");
});

test("an empty file is reported, not crashed on", () => {
  const res = parseVocabFile("", "fr", NOW);
  assert.equal(res.items.length, 0);
  assert.ok(res.problems.length > 0);
});
