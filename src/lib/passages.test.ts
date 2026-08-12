import test from "node:test";
import assert from "node:assert/strict";
import { PASSAGES, passageFor, tokenise, tokens, wordKey } from "./passages.ts";
import { LINES } from "./lines.ts";

/* --- the instrument ------------------------------------------------------- */

test("there is a passage for every month", () => {
  assert.equal(PASSAGES.length, 5);
  for (let m = 1; m <= 5; m++) assert.ok(passageFor(m), `month ${m}`);
});

test("every passage is long enough to resolve a pass line", () => {
  // Under ~60 words a single tap moves the score more than 1.5 points, which
  // can't distinguish 84% from 85%.
  for (const p of PASSAGES) {
    assert.ok(
      tokens(p).length >= 60,
      `month ${p.month} has ${tokens(p).length} words`,
    );
  }
});

test("passages get harder", () => {
  const avg = PASSAGES.map(
    (p) => tokens(p).length / p.sentences.length,
  );
  for (let i = 1; i < avg.length; i++) {
    assert.ok(
      avg[i] > avg[i - 1],
      `month ${i + 1} averages ${avg[i].toFixed(1)} words, month ${i} ${avg[i - 1].toFixed(1)}`,
    );
  }
});

test("every sentence is vocalised and glossed", () => {
  for (const p of PASSAGES) {
    for (const s of p.sentences) {
      assert.match(s.he, /[֑-ׇ]/, `no nikud: ${s.he}`);
      assert.ok(s.fr.length > 0, `no gloss: ${s.he}`);
    }
  }
});

/**
 * The one rule that makes the measurement mean anything. A sentence the
 * trainee has drilled tests recall, not comprehension, and inflates coverage.
 */
test("no passage sentence appears anywhere in the corpus", () => {
  const skeleton = (s: string) =>
    s.replace(/[֑-ׇ]/g, "").replace(/[^א-ת]/g, "");
  const corpus = new Set(LINES.map((l) => skeleton(l.he)));
  for (const p of PASSAGES) {
    for (const s of p.sentences) {
      assert.ok(!corpus.has(skeleton(s.he)), `seen already: ${s.he}`);
    }
  }
});

test("no sentence is used in two passages", () => {
  const all = PASSAGES.flatMap((p) => p.sentences.map((s) => s.he));
  assert.equal(new Set(all).size, all.length);
});

/* --- marking -------------------------------------------------------------- */

test("marking ignores vowels and punctuation", () => {
  assert.equal(wordKey("בַּיִת."), wordKey("בית"));
  assert.equal(wordKey("שָׁלוֹם!"), "שלום");
});

test("a prefixed form is its own word", () => {
  // Not recognising בבית is not knowing it, whatever you make of בית.
  assert.notEqual(wordKey("בְּבַיִת"), wordKey("בַּיִת"));
});

test("tokenising keeps the vocalised text and the marking key apart", () => {
  const t = tokenise("שָׁלוֹם, מָה שְׁלוֹמְךָ?");
  assert.equal(t.length, 3);
  assert.equal(t[0].text, "שָׁלוֹם,", "display keeps its comma");
  assert.equal(t[0].key, "שלום");
});

test("repeats are counted, not deduplicated", () => {
  const p = { month: 1, sentences: [{ he: "בית בית", fr: "x" }] };
  assert.equal(tokens(p).length, 2);
});
