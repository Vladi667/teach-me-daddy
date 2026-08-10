/**
 * Generate audio for every line in the seed corpus.
 *
 * Two renderings per line, per PROGRAMME.md §8:
 *   slow    — for the Listen card and Block 1, deliberate
 *   natural — for Block 2 shadowing, full speed
 *
 * Voice is Microsoft's he-IL neural pair, reached through the Edge read-aloud
 * endpoint: free, no key, genuinely neural rather than formant synthesis.
 * See PROGRAMME.md §14 for the honest limits of this and when to replace it.
 *
 * Idempotent: existing files are skipped, so a partial run resumes.
 *
 *   node scripts/gen-audio.mjs [--force] [--maxDay 30] [--voice he-IL-HilaNeural]
 */
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import { existsSync, mkdirSync, renameSync, rmSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = resolve(root, "public/audio");

const args = process.argv.slice(2);
const force = args.includes("--force");
const voice =
  args[args.indexOf("--voice") + 1]?.startsWith("he-")
    ? args[args.indexOf("--voice") + 1]
    : "he-IL-AvriNeural";

/** Rates chosen by ear: slow stays intelligible, natural keeps real elision. */
const SPEEDS = { slow: "-35%", natural: "default" };

const maxDay = Number(args[args.indexOf("--maxDay") + 1]) || Infinity;
const { LINES: ALL } = await import("../src/lib/lines.ts");
// The full corpus is ~57 MB of audio, past what belongs in git. Bound it and
// let LineAudio render nothing for the days that have none yet.
const LINES = ALL.filter((l) => l.day <= maxDay);

mkdirSync(outDir, { recursive: true });

const tts = new MsEdgeTTS();
await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

let made = 0;
let skipped = 0;
let failed = 0;

for (const line of LINES) {
  for (const [speed, rate] of Object.entries(SPEEDS)) {
    const target = resolve(outDir, `${line.id}-${speed}.mp3`);
    if (!force && existsSync(target) && statSync(target).size > 1000) {
      skipped++;
      continue;
    }

    // The library writes <dir>/audio.mp3, so render into a scratch dir and move.
    const scratch = resolve(outDir, `.tmp-${line.id}-${speed}`);
    try {
      mkdirSync(scratch, { recursive: true });
      const res = await tts.toFile(scratch, line.he, {
        rate,
        pitch: "default",
        volume: "default",
      });
      const written = res?.audioFilePath ?? resolve(scratch, "audio.mp3");
      if (!existsSync(written) || statSync(written).size < 1000) {
        throw new Error("empty render");
      }
      renameSync(written, target);
      made++;
    } catch (e) {
      failed++;
      console.error(`FAIL ${line.id} ${speed}: ${e.message}`);
    } finally {
      rmSync(scratch, { recursive: true, force: true });
    }
  }
}

console.log(
  `voice ${voice} · made ${made} · skipped ${skipped} · failed ${failed}`,
);
if (failed) process.exitCode = 1;
