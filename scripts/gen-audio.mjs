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
 *                              [--jobs 4]
 *
 * Renders run on a small pool of connections. Serial, the full corpus takes
 * about ninety minutes; four at a time takes twenty-five. The endpoint is
 * undocumented and could rate-limit, so the pool stays small and a failed
 * render is retried once before it is reported.
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
const jobs = Math.max(1, Math.min(8, Number(args[args.indexOf("--jobs") + 1]) || 4));
const { LINES: ALL } = await import("../src/lib/lines.ts");
const LINES = ALL.filter((l) => l.day <= maxDay);

mkdirSync(outDir, { recursive: true });

/** One connection per worker: the library holds a socket per instance. */
async function connect() {
  const tts = new MsEdgeTTS();
  await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
  return tts;
}

const work = [];
for (const line of LINES) {
  for (const [speed, rate] of Object.entries(SPEEDS)) {
    const target = resolve(outDir, `${line.id}-${speed}.mp3`);
    if (!force && existsSync(target) && statSync(target).size > 1000) continue;
    work.push({ line, speed, rate, target });
  }
}

let made = 0;
let failed = 0;
const skipped = LINES.length * 2 - work.length;
let cursor = 0;

async function render(tts, job) {
  // The library writes <dir>/audio.mp3, so render into a scratch dir and move.
  const scratch = resolve(outDir, `.tmp-${job.line.id}-${job.speed}`);
  try {
    mkdirSync(scratch, { recursive: true });
    const res = await tts.toFile(scratch, job.line.he, {
      rate: job.rate,
      pitch: "default",
      volume: "default",
    });
    const written = res?.audioFilePath ?? resolve(scratch, "audio.mp3");
    if (!existsSync(written) || statSync(written).size < 1000) {
      throw new Error("empty render");
    }
    renameSync(written, job.target);
    return true;
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
}

async function worker() {
  let tts = await connect();
  while (cursor < work.length) {
    const job = work[cursor++];
    try {
      await render(tts, job);
      made++;
    } catch {
      // One retry on a fresh connection: most failures are the socket, not
      // the sentence, and losing a line to a dropped connection is silent rot.
      try {
        tts = await connect();
        await render(tts, job);
        made++;
      } catch (e) {
        failed++;
        console.error(`FAIL ${job.line.id} ${job.speed}: ${e.message}`);
      }
    }
    if ((made + failed) % 50 === 0) {
      process.stdout.write(`\r${made + failed}/${work.length}`);
    }
  }
}

await Promise.all(Array.from({ length: jobs }, () => worker()));
process.stdout.write("\n");

console.log(
  `voice ${voice} · made ${made} · skipped ${skipped} · failed ${failed}`,
);
if (failed) process.exitCode = 1;
