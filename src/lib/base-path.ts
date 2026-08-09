/**
 * "" on Vercel (served from the root), "/teach-me-daddy" on GitHub Pages.
 * Next prefixes basePath onto `<Link href>` and imported assets automatically,
 * but not onto absolute URLs written by hand — those go through here.
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const asset = (path: string) => `${BASE_PATH}${path}`;

/**
 * Pass to every `<Link prefetch={...}>`. `next export` doesn't emit the
 * per-segment prefetch payloads (`__next.<route>.__PAGE__.txt`) that Next 16's
 * client segment cache requests, so on GitHub Pages each prefetch 404s.
 * Clicking still navigates fine — this just avoids the wasted round trips.
 * Vercel serves those payloads, so prefetch stays on there.
 */
export const LINK_PREFETCH = BASE_PATH ? false : undefined;
