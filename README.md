# Teach me Daddy

Hebrew, one letter at a time. A phone-first PWA with a dark, frosted-glass
interface, built around two things: learning the alphabet, and running the
5-month acquisition plan in `plan-hebreu-5-mois.md`.

The app is live at two addresses, both built from `main`:

| | |
| --- | --- |
| **[teach-me-daddy.vercel.app](https://teach-me-daddy.vercel.app)** | Vercel — full app, including profile sync |
| **[vladi667.github.io/teach-me-daddy](https://vladi667.github.io/teach-me-daddy/)** | GitHub Pages — static export, profiles stay device-local |

The GitHub Pages copy exists because some networks block `*.vercel.app` as a
category and answer with their own certificate, which shows up on a phone as
`ERR_CERT_AUTHORITY_INVALID`.

## Usernames

There are no passwords. You pick a username, and that name is the address of
your progress — type it on any device and everything loads. A username can
optionally be locked with a 4-digit PIN, which stops someone overwriting your
history by accident.

**This is not authentication.** Anyone who guesses a username can read the
progress behind it, and a 4-digit PIN is trivially brute-forced. Nothing
sensitive should ever go in here.

Until you claim a username the app runs as a guest, saving to the device.
Claiming a name carries that guest progress with you. Everything is local-first:
the app writes to `localStorage` immediately and pushes to the server on a
debounce, so it keeps working offline and syncs when it can.

## Modules

**The Alphabet** — all 22 letters as browsable cards, print beside handwritten
cursive, with the vocalised name, sound, gematria, a memory hook for the shape,
final forms, and the look-alike groups. A separate drill runs 20-question rounds
in print / cursive / traps mode, weighting the letters you get wrong and pulling
distractors from the target's confusable group first.

**Vocabulary** — the §6 starter set as a spaced-repetition deck: 60 items,
120 cards. Ordering follows the plan: sentence patterns first, because they're
the unit of memorisation, then the pieces that fill their slots. Function words
carry an example sentence so they're never drilled bare (§9.4); numbers and
politeness are flagged as genuine lists, which the plan says is fine.

**The 5-Month Plan** — the five daily blocks from §3, the Mon–Sun focus from §5,
the §8 metrics (listening and speaking minutes against 45/day, hours against
120/month), the coverage curve from §1, the month-by-month roadmap from §4, and
the golden rules from §9. Plus a zero-missed-days streak.

## The scheduler

`src/lib/srs.ts` is SM-2 with learning steps, the same shape Anki uses — this
replaces Anki rather than complementing it.

- New cards walk two learning steps (1 min, 10 min) before graduating at 1 day.
- Review intervals scale by an ease factor that starts at 2.5, moves ±0.15 on
  Hard/Easy, drops 0.2 on a lapse, and floors at 1.3.
- Answering late credits the extra elapsed time — a card recalled three days
  overdue is evidence the memory held longer.
- A lapse drops the card back into learning and it re-graduates at 1 day, not
  at its old interval.
- New cards are capped at 40/day per §5. Past that, retention collapses because
  review can't keep up.
- A card is *mature* at a 21-day interval — the §8 metric the Plan screen tracks.

```bash
npm test
```

17 tests cover the scheduler. They earned their keep: they caught that at a
1-day interval, Easy and Good both rounded to 3 days, which made the Easy button
do nothing. Easy is now guaranteed to land strictly further out than Good.

## Running it

```bash
npm install
```

```bash
npm run dev
```

Sync needs the KV credentials locally:

```bash
npx vercel env pull .env.local
```

`npm run build` produces the Vercel build, `npm run build:pages` the static
export, `npm run lint` runs ESLint.

## Notes on the build

- **Next.js 16** (App Router), **React 19**, **Tailwind CSS v4**. Every page
  prerenders as static content; only `/api/profile` is dynamic.
- **Storage is Upstash KV**, connected to the Vercel project, keyed
  `tmd:u:<username>`.
- **One codebase, two hosts.** `PAGES_BUILD=1` (set only by
  `.github/workflows/pages.yml`) switches `next.config.ts` to `output: "export"`
  with a `/teach-me-daddy` basePath. `scripts/build-pages.mjs` moves
  `src/app/api` aside for that build, because a static export refuses to compile
  a POST route handler, and always restores it afterwards.
- **Two Hebrew typefaces.** Print is Noto Sans Hebrew. The cursive is Gveret
  Levin, extracted from the base64 blob inlined in the original
  `HebrewAlphabetDrill.jsx` prototype and now served as a real font file. It's
  loaded under the family name `ktav` — naming it `cursive` collides with the
  CSS generic keyword.
- **Glass surfaces use `@apply backdrop-blur-*`,** not a raw `backdrop-filter`
  declaration. Lightning CSS silently strips the raw property from the compiled
  stylesheet; Tailwind's variable-based output survives.
- **The ambient colour mesh sits behind the content,** so `<body>` must not
  paint a background of its own — only `<html>` does.
- **Time is read through `src/lib/clock.ts`,** not `Date.now()` in render.
  Reading the clock during render is impure and React's lint rules reject it, so
  the clock is exposed as an external store that ticks every 30s.
- **State lives in `src/lib/store.ts`** behind `useSyncExternalStore`, which
  keeps the localStorage read out of an effect and gives cross-tab sync free.
- **Link prefetch is off on the Pages build:** `next export` doesn't emit the
  per-segment payloads Next 16 requests, so each prefetch 404'd.

## Commit author

Vercel refuses a Git-triggered build when the commit author isn't a contributor
on the Vercel project — it reports `TEAM_ACCESS_REQUIRED` and the deployment
sits in `BLOCKED` without ever building. The Hobby plan has no way to add
contributors, so commits must be authored by the address that owns the account:

```bash
git config user.email "tero.contact@gmail.com"
```

A blocked deployment can't be released after the fact; push a new commit with
the right author.

---

`plan-hebreu-5-mois.md` is the source of truth for the plan module.
`HebrewAlphabetDrill.jsx` is the earlier prototype, kept for reference and
excluded from the build and lint.
