/**
 * Static-export build for GitHub Pages.
 *
 * `output: "export"` refuses to build a POST route handler, and the profile
 * sync API is exactly that. Pages has no server anyway — profiles there are
 * device-local (NEXT_PUBLIC_SYNC_ENABLED=0) — so the api directory is moved
 * aside for the duration of the build and always restored afterwards.
 */
import { spawnSync } from "node:child_process";
import { existsSync, renameSync, mkdirSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const api = resolve(root, "src/app/api");
const stash = resolve(root, ".api-stash");

let moved = false;

function restore() {
  if (moved && existsSync(stash)) {
    rmSync(api, { recursive: true, force: true });
    renameSync(stash, api);
    moved = false;
  }
}

process.on("exit", restore);
for (const sig of ["SIGINT", "SIGTERM"]) {
  process.on(sig, () => {
    restore();
    process.exit(1);
  });
}

try {
  if (existsSync(api)) {
    rmSync(stash, { recursive: true, force: true });
    mkdirSync(dirname(stash), { recursive: true });
    renameSync(api, stash);
    moved = true;
  }

  const res = spawnSync("npx", ["next", "build"], {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32",
    env: { ...process.env, PAGES_BUILD: "1" },
  });

  restore();
  process.exit(res.status ?? 1);
} catch (err) {
  restore();
  console.error(err);
  process.exit(1);
}
