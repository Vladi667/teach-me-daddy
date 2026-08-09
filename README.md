# Teach me Daddy

Hebrew, one letter at a time. A phone-first PWA built around a dark, frosted-glass
interface — currently covering the alphabet, with vowels and vocabulary to follow.

## What's in it

**Letters** — all 22 letters as browsable cards. Tap one for a detail sheet with
the print form beside the handwritten (cursive) form, the letter's vocalised
Hebrew name, its sound, its gematria value, a memory hook for the shape, and a
flag for the letters it's genuinely easy to confuse it with. Five letters carry
their word-final form too. Swipe down to dismiss; arrows or ←/→ to move between
letters. Where the device has a Hebrew voice, a speaker button reads the name.

**Drill** — 20-question rounds in three modes:

| Mode | Prompt |
| --- | --- |
| Print | Name the printed letter |
| Cursive | Name the handwritten letter |
| Traps | Only the six look-alike groups (ב·כ, ג·נ, ד·ר, ה·ח·ת, ו·ז·י, ע·צ) |

Questions are weighted toward the letters you get wrong, and distractors are
drawn from the target's look-alike group first — so a wrong answer means the
shapes genuinely aren't distinguished yet, not that you got unlucky. Three
correct answers in a row locks a letter in.

**Progress** — mastery ring, running accuracy, the letters costing you the most,
and a per-letter map. Stored in `localStorage` on the device, synced across tabs.

## Running it

```bash
npm install
```

```bash
npm run dev
```

Then open <http://localhost:3000>. `npm run build` produces the production
build; `npm run lint` runs ESLint.

## Deploying

The app is live at two addresses, both built from `main`:

| | |
| --- | --- |
| **[teach-me-daddy.vercel.app](https://teach-me-daddy.vercel.app)** | Vercel, served from the root |
| **[vladi667.github.io/teach-me-daddy](https://vladi667.github.io/teach-me-daddy/)** | GitHub Pages, static export under a subpath |

The GitHub Pages copy exists because some networks block `*.vercel.app` as a
category and answer with their own certificate, which shows up on a phone as
`ERR_CERT_AUTHORITY_INVALID`. The `github.io` address usually isn't filtered.

The app is a static Next.js build with no server-side data, environment
variables, or external services, so it deploys to Vercel as-is.

The Vercel project is connected to this GitHub repository, so pushing to `main`
publishes to production and any other branch gets a preview deployment. To
deploy from the command line instead:

```bash
npx vercel --prod
```

**Commit author matters.** Vercel refuses a Git-triggered build when the commit
author isn't a contributor on the Vercel project — it reports
`TEAM_ACCESS_REQUIRED` and the deployment sits in `BLOCKED` without ever
building. The Hobby plan has no way to add contributors, so commits must be
authored by the address that owns the Vercel account:

```bash
git config user.email "tero.contact@gmail.com"
```

A blocked deployment can't be released after the fact; push a new commit with
the right author. CLI deploys are attributed to whoever `vercel whoami` reports
and are never blocked this way.

## Notes on the build

- **Next.js 16** (App Router) with **React 19** and **Tailwind CSS v4**. Every
  route prerenders as static content.
- **Two Hebrew typefaces.** Print is Noto Sans Hebrew. The cursive is Gveret
  Levin, extracted out of the base64 blob that was inlined in the original
  `HebrewAlphabetDrill.jsx` prototype and now served as a real font file from
  `public/fonts/`. It's loaded via `next/font/local` under the family name
  `ktav` — naming it `cursive` collides with the CSS generic keyword.
- **Glass surfaces use `@apply backdrop-blur-*`,** not a raw `backdrop-filter`
  declaration. Lightning CSS silently strips the raw property from the compiled
  stylesheet; Tailwind's variable-based output survives.
- **The ambient colour mesh sits behind the content,** so `<body>` must not
  paint a background of its own — only `<html>` does. Otherwise the body's
  background covers the mesh and the glass has nothing to refract.
- **Progress is read through `useSyncExternalStore`,** which keeps the
  localStorage read out of an effect and gives cross-tab sync for free.
- **One codebase, two hosts.** `PAGES_BUILD=1` (set only by
  `.github/workflows/pages.yml`) switches `next.config.ts` to
  `output: "export"` with a `/teach-me-daddy` basePath. Next prefixes `<Link>`
  hrefs and imported assets on its own; hand-written absolute URLs go through
  `src/lib/base-path.ts`. The web manifest is a generated route rather than a
  static file so `start_url` and `scope` follow the basePath.
- **Link prefetch is disabled on the Pages build.** `next export` doesn't emit
  the per-segment prefetch payloads (`__next.<route>.__PAGE__.txt`) that
  Next 16's client segment cache asks for, so every page load 404'd three
  times. Clicking navigates identically either way; Vercel keeps prefetch.

Progress is stored per-origin, so the two URLs keep separate mastery records.

`HebrewAlphabetDrill.jsx` and `plan-hebreu-5-mois.md` are the earlier prototype
and study plan. They're kept for reference and excluded from the build and lint.
