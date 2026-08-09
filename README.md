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

Live at **[teach-me-daddy.vercel.app](https://teach-me-daddy.vercel.app)**.

The app is a static Next.js build with no server-side data, environment
variables, or external services, so it deploys to Vercel as-is.

The Vercel project is connected to this GitHub repository, so pushing to `main`
publishes to production and any other branch gets a preview deployment. To
deploy from the command line instead:

```bash
npx vercel --prod
```

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

`HebrewAlphabetDrill.jsx` and `plan-hebreu-5-mois.md` are the earlier prototype
and study plan. They're kept for reference and excluded from the build and lint.
