import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { LINES } from "./lines.ts";

/**
 * PROGRAMME.md §8: a line without audio is half a line, and Block 2 is a fifth
 * of every day. LineAudio hides itself when a file is missing, which is right
 * for a network blip and wrong as a standing state — it means the gap is
 * invisible in the UI. This is where it becomes visible.
 */

const dir = resolve(import.meta.dirname, "../../public/audio");
const file = (id: string, speed: string) =>
  resolve(dir, `${id}-${speed}.mp3`);

/** Below this a render is a truncated stub, not a recording. */
const MIN_BYTES = 1000;

test("every line has both renderings", () => {
  const missing: string[] = [];
  for (const l of LINES) {
    for (const speed of ["slow", "natural"]) {
      if (!existsSync(file(l.id, speed))) missing.push(`${l.id}-${speed}`);
    }
  }
  assert.deepEqual(
    missing.slice(0, 10),
    [],
    `${missing.length} of ${LINES.length * 2} files missing`,
  );
});

test("no rendering is a truncated stub", () => {
  const stubs = LINES.flatMap((l) =>
    ["slow", "natural"]
      .filter((s) => {
        const p = file(l.id, s);
        return existsSync(p) && statSync(p).size < MIN_BYTES;
      })
      .map((s) => `${l.id}-${s}`),
  );
  assert.deepEqual(stubs, []);
});

test("slow is longer than natural, which is what slow means", () => {
  // Byte length stands in for duration at a fixed bitrate. A line where the
  // two match is the same render written twice — a pipeline fault, not audio.
  const same: string[] = [];
  for (const l of LINES) {
    const s = file(l.id, "slow");
    const n = file(l.id, "natural");
    if (!existsSync(s) || !existsSync(n)) continue;
    if (statSync(s).size <= statSync(n).size) same.push(l.id);
  }
  assert.deepEqual(same.slice(0, 5), []);
});

test("line ids are unique, so no two lines share a recording", () => {
  const seen = new Map<string, number>();
  for (const l of LINES) seen.set(l.id, (seen.get(l.id) ?? 0) + 1);
  const dupes = [...seen].filter(([, n]) => n > 1).map(([id]) => id);
  assert.deepEqual(dupes, []);
});
