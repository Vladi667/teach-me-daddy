/**
 * "" on Vercel (served from the root), "/teach-me-daddy" on GitHub Pages.
 * Next prefixes basePath onto `<Link href>` and imported assets automatically,
 * but not onto absolute URLs written by hand — those go through here.
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const asset = (path: string) => `${BASE_PATH}${path}`;

/**
 * Origin only — no basePath. `metadataBase` resolves the already-prefixed
 * paths that `asset()` returns, so including it here would double it up.
 */
export const SITE_ORIGIN = BASE_PATH
  ? "https://vladi667.github.io"
  : "https://teach-me-daddy.vercel.app";

/** Canonical address of the app on whichever host built it. */
export const SITE_URL = `${SITE_ORIGIN}${BASE_PATH}/`;

/**
 * Pass to every `<Link prefetch={...}>`. `next export` doesn't emit the
 * per-segment prefetch payloads (`__next.<route>.__PAGE__.txt`) that Next 16's
 * client segment cache requests, so on GitHub Pages each prefetch 404s.
 * Clicking still navigates fine — this just avoids the wasted round trips.
 * Vercel serves those payloads, so prefetch stays on there.
 */
export const LINK_PREFETCH = BASE_PATH ? false : undefined;
