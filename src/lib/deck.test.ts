import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CARDS,
  GROUPS,
  GROUP_BY_ID,
  ITEMS,
  customId,
  makeCards,
  type Item,
} from "./deck.ts";
import { parseVocabFile, toCSV } from "./csv.ts";

const HEB = /[֐-׿]/;

/* --- the curated deck ---------------------------------------------------- */

test("every item id is unique", () => {
  const ids = ITEMS.map((i) => i.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("no word appears twice", () => {
  const he = ITEMS.map((i) => i.he);
  assert.equal(new Set(he).size, he.length);
});

test("every item is complete and in a known group", () => {
  for (const i of ITEMS) {
    assert.ok(HEB.test(i.he), `${i.id} has no Hebrew`);
    assert.ok(i.tr.length > 0, `${i.id} has no transliteration`);
    assert.ok(i.fr.length > 0, `${i.id} has no French gloss`);
    assert.ok(i.en.length > 0, `${i.id} has no English gloss`);
    assert.ok(GROUP_BY_ID[i.group], `${i.id} has unknown group ${i.group}`);
  }
});

test("group ordering is unique and gapless", () => {
  const orders = GROUPS.map((g) => g.order).sort((a, b) => a - b);
  assert.deepEqual(orders, orders.map((_, i) => i));
});

test("patterns are introduced before the words that fill them", () => {
  const firstNonPattern = CARDS.findIndex(
    (c) => ITEMS.find((i) => i.id === c.itemId)!.group !== "patterns",
  );
  const lastPattern = CARDS.map((c) =>
    ITEMS.find((i) => i.id === c.itemId)!.group,
  ).lastIndexOf("patterns");
  assert.ok(lastPattern < firstNonPattern, "a pattern sorts after a word");
});

test("recognition sorts before recall within a group", () => {
  const group = CARDS.filter(
    (c) => ITEMS.find((i) => i.id === c.itemId)!.group === "patterns",
  );
  const firstRecall = group.findIndex((c) => c.direction === "m2he");
  const lastRecognise = group.map((c) => c.direction).lastIndexOf("he2m");
  assert.ok(lastRecognise < firstRecall);
});

test("function words carry an example, concrete nouns needn't", () => {
  // §9.4 — anything you say under pressure is learned in a sentence.
  const functional = ITEMS.filter(
    (i) =>
      ["pronouns", "questions", "verbs", "connectors"].includes(i.group) &&
      !i.atomic,
  );
  const bare = functional.filter((i) => !i.example);
  assert.deepEqual(bare.map((i) => i.id), []);
});

test("two cards per item", () => {
  assert.equal(CARDS.length, ITEMS.length * 2);
});

/* --- captured words ------------------------------------------------------ */

test("custom ids ignore nikud, so the same word doesn't duplicate", () => {
  assert.equal(customId("בַּיִת"), customId("בית"));
  assert.notEqual(customId("בית"), customId("דירה"));
});

test("captured words schedule alongside the curated deck", () => {
  const mine: Item = {
    id: customId("כֶּלֶב"),
    group: "captured",
    he: "כֶּלֶב",
    tr: "kelev",
    fr: "chien",
    en: "dog",
  };
  const cards = makeCards([...ITEMS, mine]);
  assert.equal(cards.length, (ITEMS.length + 1) * 2);
  // "captured" sorts last, so new words never jump the plan's ordering
  assert.equal(cards.at(-1)!.itemId, mine.id);
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
  const { items } = parseVocabFile("מַיִם\tmayim\teau\nלֶחֶם\tlechem\tpain", "fr", NOW);
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
