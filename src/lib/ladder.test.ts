import test from "node:test";
import assert from "node:assert/strict";
import {
  LAST_RUNG,
  RUNGS,
  clearedIn,
  nextPassage,
  openRung,
  readableAt,
  rungAt,
  skeleton,
  wordsOf,
} from "./ladder.ts";

const ALL_LINES = RUNGS.flatMap((r) =>
  r.passages.flatMap((p) => p.lines.map((l) => ({ rung: r.n, id: p.id, ...l }))),
);
const clean = (ids: string[]) =>
  Object.fromEntries(ids.map((id) => [id, { clean: true }]));
const allBanked = () => true;

/* --- the promise the ladder makes ----------------------------------------- */

test("every line is readable with only the letters of its rung", () => {
  for (const r of RUNGS) {
    const known = new Set([...r.letters, ...r.finals]);
    for (const p of r.passages) {
      for (const w of wordsOf(p)) {
        const unknown = [...skeleton(w)].filter((c) => !known.has(c));
        assert.deepEqual(
          unknown,
          [],
          `rung ${r.n} ${p.id}: "${w}" needs ${unknown.join("")}, which it has not been taught`,
        );
      }
    }
  }
});

test("every word offered by a rung is readable at that rung", () => {
  for (const r of RUNGS) {
    for (const w of r.words) {
      assert.ok(readableAt(w, r.n), `rung ${r.n}: "${w}" is not readable there`);
    }
  }
});

test("a rung teaches what it adds", () => {
  // A rung that adds letters nothing in it uses is a rung that teaches nothing.
  for (const r of RUNGS) {
    const used = new Set(
      r.passages.flatMap((p) => wordsOf(p).flatMap((w) => [...skeleton(w)])),
    );
    for (const c of r.added) {
      assert.ok(used.has(c), `rung ${r.n} adds ${c} but never uses it`);
    }
  }
});

/* --- the shape of the ladder ---------------------------------------------- */

test("rungs are cumulative, and reach the whole alphabet", () => {
  for (let i = 1; i < RUNGS.length; i++) {
    const prev = new Set(RUNGS[i - 1].letters);
    for (const c of prev) {
      assert.ok(RUNGS[i].letters.includes(c), `rung ${i + 1} lost ${c}`);
    }
    assert.ok(RUNGS[i].letters.length > prev.size, `rung ${i + 1} adds nothing`);
  }
  assert.equal(RUNGS[0].letters[0], "א", "aleph is first, as asked");
  assert.equal(RUNGS.at(-1)!.letters.length, 22);
  assert.equal(RUNGS.at(-1)!.finals.length, 5);
});

test("a final form never arrives before its own letter", () => {
  const OF: Record<string, string> = { "ך": "כ", "ם": "מ", "ן": "נ", "ף": "פ", "ץ": "צ" };
  for (const r of RUNGS) {
    for (const f of r.finals) {
      assert.ok(r.letters.includes(OF[f]), `rung ${r.n} has ${f} without ${OF[f]}`);
    }
  }
});

test("the early rungs read fragments, the later ones whole sentences", () => {
  // Whole sentences do not exist under a twelve-letter gate; this is the
  // crossover that fact forces.
  for (const r of RUNGS) {
    const kinds = new Set(r.passages.map((p) => p.kind));
    assert.equal(kinds.size, 1, `rung ${r.n} mixes kinds`);
    assert.equal([...kinds][0], r.n <= 4 ? "phrases" : "text");
  }
  // Whole sentences carry their gloss; fragments have none to carry.
  for (const l of ALL_LINES) {
    if (l.rung >= 5) assert.ok(l.fr, `${l.id}: sentence without a gloss`);
    else assert.equal(l.fr, undefined, `${l.id}: fragment with a gloss`);
  }
});

test("no line is repeated anywhere in the ladder", () => {
  const seen = new Map<string, string>();
  for (const l of ALL_LINES) {
    const key = skeleton(l.he);
    assert.equal(seen.get(key), undefined, `"${l.he}" is in both ${seen.get(key)} and ${l.id}`);
    seen.set(key, l.id);
  }
});

test("every passage is worth opening", () => {
  for (const r of RUNGS) {
    assert.ok(r.passages.length >= 2, `rung ${r.n} has ${r.passages.length} passages`);
    for (const p of r.passages) {
      assert.ok(p.lines.length >= 2, `${p.id} has one line`);
      assert.equal(p.rung, r.n);
      assert.equal(p.words, wordsOf(p).length, `${p.id} miscounts its words`);
      assert.ok(p.words >= 4, `${p.id} is ${p.words} words`);
    }
  }
  const ids = RUNGS.flatMap((r) => r.passages.map((p) => p.id));
  assert.equal(new Set(ids).size, ids.length, "duplicate passage id");
});

/* --- unlocking ------------------------------------------------------------ */

test("a rung opens only once all of its glyphs are banked", () => {
  assert.equal(openRung(() => false), 0, "nothing banked opens nothing");
  assert.equal(openRung(allBanked), LAST_RUNG, "all banked opens everything");

  const r1 = new Set([...RUNGS[0].letters, ...RUNGS[0].finals]);
  assert.equal(openRung((g) => r1.has(g)), 1);

  // One glyph short of rung 1 is still rung 0 — no partial credit.
  const short = new Set([...r1].slice(0, -1));
  assert.equal(openRung((g) => short.has(g)), 0);
});

test("the final form counts, not just the letter", () => {
  // kaf is a rung-1 letter, so its sofit is a rung-1 glyph and lad1 words use it.
  const noFinals = new Set(RUNGS[0].letters);
  assert.equal(openRung((g) => noFinals.has(g)), 0, "ך was not required");
});

test("the next passage is the first unread one the drill has unlocked", () => {
  const first = RUNGS[0].passages[0];
  assert.equal(nextPassage({}, 7)?.id, first.id);

  // Reading it moves you on, but only within what is unlocked.
  assert.equal(nextPassage(clean([first.id]), 7)?.id, RUNGS[0].passages[1].id);
  assert.equal(nextPassage({}, 0), null, "nothing unlocked, nothing to read");

  // A rung finished while the next is locked leaves nothing to do.
  assert.equal(nextPassage(clean(RUNGS[0].passages.map((p) => p.id)), 1), null);
  assert.equal(
    nextPassage(clean(RUNGS[0].passages.map((p) => p.id)), 2)?.id,
    RUNGS[1].passages[0].id,
  );
});

test("a read that was not clean does not count as done", () => {
  const first = RUNGS[0].passages[0];
  assert.equal(nextPassage({ [first.id]: { clean: false } }, 7)?.id, first.id);
});

test("the whole ladder can be finished", () => {
  const every = RUNGS.flatMap((r) => r.passages.map((p) => p.id));
  assert.equal(nextPassage(clean(every), LAST_RUNG), null);
});

test("progress is counted per rung", () => {
  const r1 = RUNGS[0];
  assert.deepEqual(clearedIn(1, {}), { cleared: 0, total: r1.passages.length });
  assert.deepEqual(clearedIn(1, clean([r1.passages[0].id])), {
    cleared: 1,
    total: r1.passages.length,
  });
  assert.deepEqual(clearedIn(99, {}), { cleared: 0, total: 0 });
});

/* --- helpers -------------------------------------------------------------- */

test("readableAt is honest about what has not been taught", () => {
  assert.ok(readableAt("לֹא", 1), "lo is three rung-1 letters");
  assert.ok(!readableAt("שָׁלוֹם", 1), "shin and mem are not rung-1 letters");
  assert.ok(readableAt("שָׁלוֹם", 3), "by rung 3 they are");
  assert.ok(!readableAt("", 1), "an empty string is not a word");
  assert.ok(!readableAt("לֹא", 99), "there is no rung 99");
  assert.equal(rungAt(99), null);
});

test("skeleton strips points and folds the final forms", () => {
  assert.equal(skeleton("שָׁלוֹם"), "שלומ");
  assert.equal(skeleton("לָךְ"), "לכ");
  assert.equal(skeleton("אֶרֶץ"), "ארצ");
});

test("wordsOf reads the passage in order, punctuation aside", () => {
  const p = {
    id: "x", rung: 1, kind: "text" as const, words: 3,
    lines: [{ he: "?מָה נִשְׁמָע" }, { he: "שֵׁב, תִּתְרַוֵּחַ." }],
  };
  assert.deepEqual(wordsOf(p).map(skeleton), ["מה", "נשמע", "שב", "תתרוח"]);
});
