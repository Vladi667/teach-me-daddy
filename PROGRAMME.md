# The Programme

140 days of Hebrew, then you deploy. This document is the syllabus and the
rules. `plan-hebreu-5-mois.md` is the source it derives from; section marks
below (§) refer to it.

The trainee does not choose. The app issues one assignment per day and the
trainee executes it. Everything below exists to make that sentence true.

---

## 1. The unit is the line

A **line** is one vocalised Hebrew sentence with its translation,
transliteration, and audio. Lines are what get issued, drilled, shadowed and
produced. Words are not issued; they are *carried* by lines and counted
afterwards.

This follows §2 lever 3 and §9.4: a sentence for anything said under pressure,
a bare word only for concrete nouns that carry no grammar. The exceptions the
plan allows — numbers, politeness formulas — are issued as bare items.

Every line declares the new words it teaches. Coverage against the §1 curve is
computed from the union of those words, so the existing curve keeps working
without change.

**Selection rule.** A line earns its place by carrying 3–4 previously unseen
words while reusing known grammar, or by introducing exactly one new pattern
with known vocabulary. Never both at once. A set that ignores this recycles the
same 400 function words and coverage flatlines near 60%.

---

## 2. Volume

§5 caps intake at ~40 new words a day. At 3–4 new words per line that is
**12 new lines a day**, which is the planned rate.

| | |
| --- | --- |
| Programme length | 140 days |
| New lines per day (planned) | 12 |
| Adaptive range | 4 to 16 |
| Total lines | ~1,700 |
| Distinct words carried | 3,000–5,000 |
| Coverage at completion | 93–95% (§1) |

---

## 3. The day

Five blocks, four hours, from §3. The app owns four of them.

| # | Block | Min | Owned | What the app issues |
| --- | --- | --- | --- | --- |
| 1 | New lines | 45 | Yes | Today's 12 lines, introduced one at a time |
| 2 | Shadowing | 45 | Yes | Audio set: today's lines plus a sample of mature ones |
| 3 | Production | 45 | Partly | Meaning → produce the line, self-graded; tutor days excepted |
| 4 | Immersion | 45 | No | Logged only. External media, no subtitles |
| 5 | Consolidation | 40 | Yes | The review queue: everything due |

Blocks run in order. Block 2 cannot start before Block 1 is finished. The
trainee is never asked which block to do.

**Weekday focus** overlays this, from §5: Monday and Wednesday inject new
themes, Thursday is production-heavy, Saturday is a full scenario, Sunday is
wide review and partial rest. On Sunday the app issues no new lines.

---

## 4. Card types per line

Staged. A line does not become a production card until it is already understood,
because demanding full production on day one collapses intervals and feels like
drowning.

| Stage | Prompt | Answer | Unlocks when |
| --- | --- | --- | --- |
| **Listen** | Audio, slow | Meaning | Line is issued |
| **Read** | Vocalised Hebrew | Meaning | Listen graduates |
| **Produce** | Meaning | The Hebrew line | Read reaches 21 days |
| **Shadow** | Audio, natural | Not graded, repetitions only | Line is issued |

Only Listen, Read and Produce are scheduled by SM-2. Shadow is a count, not a
card: it feeds Block 2 and is never "due".

---

## 5. Adaptation

The schedule bends. The standard does not.

**Intake formula.** Reviews come first; new lines take whatever capacity is
left.

```
capacity   = 45 minutes of block 1
backlog    = cards due today
newToday   = clamp( 12 − floor(backlog / 12), 4, 16 )
```

**Retention guard.** §9.2: review before adding. If first-try accuracy over the
trailing 7 days falls below 85%, intake halves until it recovers. The trainee is
told why.

**Missed days.** Nothing is punished and nothing is hidden. The projected
deployment date moves and is displayed:

> PROJECTED DEPLOYMENT 14 JANUARY · 11 DAYS BEHIND SCHEDULE

That is the whole consequence mechanism. §9.1 says zero missed days; the
programme states the cost as a fact rather than scolding.

**Ahead of schedule.** Intake rises to 16, never past it. §5's ceiling is a
retention limit, not a motivation limit, and exceeding it destroys the work.

---

## 6. Assessment and clearance

Monthly, per §8. An unseen passage at the month's target level. The trainee
marks every word they don't know; the app computes comprehension and compares
it to the §1 curve.

| Month | Target coverage | Words |
| --- | --- | --- |
| 1 | 55–60% | 1,200 |
| 2 | 85% | 2,500 |
| 3 | 91–92% | 3,800 |
| 4 | 94–95% | 4,800 |
| 5 | 95–96% | 6,000 |

**Clearance is not a lock.** Failing does not stop the next month; the
programme is adaptive, and blocking a trainee who is mid-flow is instructor
malpractice. What failing does:

- The month is marked NOT CLEARED in the record, with the date and the score.
- Readiness is capped until it is re-taken and passed.
- Intake drops for one week and review weight rises.

Words missed in an assessment are injected into the queue as new lines.

**Built.** `src/lib/assessment.ts` holds the rules, `/assess` runs them. The
readiness cap is 75 — clearly under the 90 deploy line, where a cap of 89 would
block deployment while still reading as a pass. Intake halves for seven days
after a failure, the same cut the retention guard makes, because both say the
same thing: the existing material isn't holding. A missed word is repaid by
promoting a *line* that carries it, never as a bare word, and never a line
already issued.

The passages are in `src/lib/passages.gen.ts`, built by
`scripts/build-passages.mjs` from Tatoeba sentences that appear nowhere in the
corpus — the exclusion is the whole point, and a unit test enforces it against
the current `LINES` rather than trusting the generator. Each is ~85 words, so
one tapped word moves the score about 1%; at 28 words it moved 3.6 and could
not resolve a pass line. Difficulty is graded by sentence length, which is the
only level signal the source carries.

Two honest limits. A passage is a set of sentences on a shared subject, not
continuous prose, because Tatoeba is a sentence corpus. And matching the
corpus by consonantal skeleton was not enough to guarantee "unseen": Nakdan
normalises ktiv male to ktiv haser as it vocalises, so שתחזור returns as
שֶׁתַּחֲזֹר and the skeletons differ for the same sentence. The French gloss
identifies the source pair whatever the spelling does, and caught 1,083
candidates the skeleton check had missed.

---

## 7. Readiness

One number, always visible. Not points, not a streak.

```
readiness = 0.55 × (mastered lines / programme lines)
          + 0.30 × (coverage achieved / 95)
          + 0.15 × (assessments cleared / assessments due)
```

A line is **mastered** at a 21-day interval on its Read stage, which is the same
maturity threshold §8 tracks. Deployment is readiness ≥ 90% with all
assessments cleared.

---

## 8. Audio

Non-negotiable. A line without audio is half a line, and Block 2 is a fifth of
every day.

Every line ships with two recordings:

- **Slow** — roughly 0.75×, deliberate, for Block 1 and the Listen card.
- **Natural** — full speed with real elision, for Block 2 shadowing.

Audio is served as files. It is not generated on the device: browser speech
synthesis has no Hebrew voice on a stock iPhone, which is why the current
speaker button silently does nothing for most users.

---

## 8a. Reading the vowels

The alphabet drill taught 22 letters and stopped. A trainee could reach 22 of
22 and still not read אֲנִי, because nothing had said what the marks under the
letters do — while every line in the corpus is pointed and the Read card
assumes they can be decoded. `/vowels` closes that.

Nineteen items: eleven vowel signs, sheva, and the dagesh pairs. The drill
asks for the *sound*, never the name — a name you can recite is not a word you
can read. Distractors keep the carrier letter, so the mark is the only thing
that answers the question; offering "ba" against "ma" would let the letter
give it away.

The lesson underneath it is that **Modern Hebrew has five vowel sounds and
eleven signs for them.** Patah and qamats are both *a*; segol and tsere are
both *e*. The distinctions the signs preserve are historical and an Israeli
does not pronounce them, so the drill deliberately teaches the merge rather
than hiding it.

Progress lives in the same `alphabet` map as the letters, keyed by the sign,
which costs no schema change and syncs for free. `masteredCount` iterates
`LETTERS`, so the "n of 22" figure is unaffected.

**Timing.** The script is a gate, not a subject. FSI rates Hebrew Category III
at 1,100 hours, and DLI 64 weeks, but neither spends more than the first week
on the script. Recognition of the letters is two to four hours; the points are
another two or three; decoding a pointed word reliably is about a week. Fluent
reading is months and does not come from letter drills at all — it comes from
volume, which is what the five daily blocks are for.

---

## 8b. Reading without vowels

§9.5 of the plan: move to unvocalised text early, it is uncomfortable, that
is the point. Real Hebrew — signs, menus, news, messages — carries no points
at all, and a corpus that is 100% pointed graduates someone who reads a
textbook and stalls at a bus stop.

The points come off as a line is mastered, on the Read prompt only, because
that is the card that asks you to read. Three rungs, chosen by the line's own
Read interval, so there is no new state and no setting:

| Rung | Interval | What is shown |
| --- | --- | --- |
| Full | under 7 days, or in learning | Every point |
| Partial | 7-20 days | Shin dot, plus points on ambiguous words |
| Bare | 21 days and over | Consonants only, like a street sign |

The answer always reveals the fully pointed line, so a failed decoding can be
checked rather than merely felt. A lapse brings the points back: a card
knocked into learning has a stale interval, and the trainee is decoding
again rather than recognising.

**Measured, not assumed.** Of 3,834 distinct forms in the corpus, only 121 —
3% — are pointed more than one way, so stripping is unambiguous for the other
97% and needs no new content. Those 121 keep their points a rung longer.

The shin dot is dropped at *bare* and kept at *partial*. Street signs do not
carry it either, so keeping it forever would train reading on a text that does
not exist — the same mistake as never removing the vowels, only smaller. It
is also what makes partial a real middle rung rather than bare with a 3%
exception list.

---

## 9. What the trainee cannot do

The interface offers no choices that a syllabus should be making.

- No adding, importing or editing lines.
- No browsing the deck ahead.
- No choosing a study mode.
- No skipping a block.
- No changing the daily intake.

Words met outside the programme — from a tutor, per §7 three times a week —
go to **field notes**: a separate list that schedules for review but never
enters the programme, never counts toward readiness, and never delays an
assignment.

---

## 10. Surface

Two screens.

**TODAY.** The assignment and the run. Day counter, the five blocks in order,
current block highlighted, everything else inert. Starting a block enters a
full-screen run that exits when the block is done.

**RECORD.** The file. Day X of 140, readiness, coverage curve, days logged and
missed, assessment results with dates, projected deployment. Read-only.

Settings holds language of glosses, audio speed default, and the account. That
is all.

---

## 11. Tone

Factual, terse, present tense. The instructor states what is true and what is
next. No congratulation, no encouragement, no exclamation marks.

```
DAY 47 OF 140
BLOCK 2 OF 5 · SHADOWING · 45 MIN
12 NEW LINES · 64 REVIEWS
NOT CLEARED FOR MONTH 3 · ASSESSMENT DUE IN 6 DAYS
```

**No theming.** No monospace, no terminal green, no redaction bars, no
CLASSIFIED stamps. Authority comes from structure and restraint; props read as
a game about being a spy and wear off in a week. The visual language stays as
DESIGN.md defines it.

Humour stays on the account gate, where a newcomer meets it, and nowhere past it.

---

## 12. Build order

1. **Line model and the day index.** Days 1–140, each with its issued lines.
   Everything attaches to this.
2. **TODAY, with blocks running in order.** The app can then issue orders even
   before the full corpus exists.
3. **Audio pipeline.** Two speeds per line, generated once and served as files.
4. **The corpus.** Months 1–2 first, roughly 700 lines.
5. ~~**Assessment and readiness.**~~ Done — §6 above.
6. ~~**Retire what contradicts the model**~~ Done.

   The deepest contradiction was not a screen: TODAY issued *lines* and then
   block 1 drilled a different corpus entirely, the 1,617-line curated deck
   from before the programme existed. Blocks 1 and 5 now run `/learn` and
   `/review` over the programme's own lines, staged by §4 — Listen the day a
   line is issued, Read once Listen graduates, Produce after 21 days. Those
   gates were spread across three screens and applied inconsistently; they
   live in `src/lib/queue.ts` now, so the scheduler and every runner agree.

   Gone: `/study` and its mode picker, `/words` and its deck browser, the
   "new cards per day" setting (§9 — intake is not the trainee's to set), the
   block toggles on the record (§10 — read-only; TODAY owns logging), and
   `deck.ts` itself, whose hand-checked days 1-5 had already been promoted
   into `lines.seed.ts` (§13b). Its `customId` helper survives in `notes.ts`.

   Demoted, not deleted: field notes at `/notes`, and the alphabet drill.
   Neither is issued by the programme, so neither is a peer of TODAY — both
   are filed under Tools in settings. The tab bar is TODAY, RECORD, You.

   One quiet bug fell out of it. Coverage and the mature-card counts read
   every key in `srs`, which after the retirement still held the old deck's
   cards and field notes. Both now count the programme's own lines only.

## 13. Corpus pipeline — settled

Measured, not assumed. Tatoeba's Hebrew export holds **212,657 sentences, of
which 189 are vocalised — 0.09%**. As a direct source it is unusable, and
hand-authoring 1,700 vocalised lines is not reliable at quality.

The route that works, verified end to end:

1. **Source** — Tatoeba per-language export, CC-BY. 197,089 sentences of eight
   words or fewer, with French and English pairs available through the
   per-language link files.
2. **Filter** — length, vocabulary against the day's theme, and the
   3–4-new-words selection rule from §1.
3. **Vocalise** — Dicta Nakdan (`nakdan-2-0.loadbalancer.dicta.org.il/api`,
   `task: "nakdan"`, `genre: "modern"`). Output tokens carry the vocalised form
   in `options[0]`; strip the `|` morpheme separators it inserts on prefixes.
4. **Review** — the API returns `fconfident: false` on uncertain words, roughly
   a third of them. A native speaker reviews only those, not all 1,700 lines.

Sample output, unedited: `אֲנִי צָרִיךְ עֶזְרָה.` · `יֵשׁ לִי שְׁנֵי יְלָדִים.` ·
`אֵיפֹה הַתַּחֲנָה?`

Attribution for Tatoeba (CC-BY) ships with the corpus.

## 13b. Corpus status

Days 1-5 are the hand-checked seed from deck.ts, in `lines.seed.ts`. Days
6-132 are generated into `lines.gen.ts`; `lines.ts` merges the two. **1,356
lines, 3,906 distinct words**, every one vocalised and paired with
French, no duplicates. Line ids are a hash of the consonantal skeleton, so
regenerating keeps ids stable and the audio named after them stays valid.

**Audio covers every line**, both speeds, served from `public/audio` on the
same origin as the app. `src/lib/audio.test.ts` is the guard: it fails if any
line lacks a rendering, if a file is a truncated stub, or if the slow and
natural takes are byte-identical, which would mean one render written twice.

**Theme ordering works, via embeddings.** Keyword matching failed twice —
substring matching fired "vent" on "souvent" and "été", the participle of
*être*, on nearly everything; whole-word matching then let the ubiquitous
verbs "aime", "pense" and "crois" swallow 1,075 lines into one theme. General
sentences do not sort on keywords.

`scripts/classify-themes.mjs` embeds each French pair and each theme's
description with a multilingual sentence model running locally, no key, and
takes the nearest theme by cosine. Below a similarity floor the sentence stays
*general* rather than being forced into a bucket, which is what ruined the
keyword version. Labels are cached in `scripts/themes.json` keyed by the
Hebrew skeleton, so reselection never re-embeds.

Across 4,928 candidates that gives a real spread over all 18 themes with 45%
honestly general. The ordering is measurable: **58% of days 6-30 carry month-1
themes, against 0% of days 60-90.**

**The "flagged low-confidence" number was a misreading.** This document said
5,860 words were flagged and needed a native speaker, as though that were a
queue. Measured properly: 4,965 of the corpus's 6,313 tokens carry
`fconfident: false` — 79% of every word, and 89% of distinct forms. A flag
that fires on four words in five is not a filter.

Nakdan's own output says why. On `אני מדבר קצת עברית`, it is confident about
אֲנִי and מְדַבֵּר and unsure about קְצָת and עִבְרִית — and both of the
"unsure" readings are right. `fconfident: false` means the lexicon holds more
than one pointing for that form and it picked the likeliest, not that the
pointing is doubtful. The corpus is in much better shape than the number
implied.

## 14. Open

- **Audio — solved for now, with a caveat.** Every line ships two renderings
  from Microsoft's `he-IL-AvriNeural` voice, reached through the Edge
  read-aloud endpoint: free, no key, and genuinely neural rather than the
  formant synthesis the earlier objection was about. `scripts/gen-audio.mjs`
  regenerates them; files live in `public/audio` as `<line>-slow.mp3` and
  `<line>-natural.mp3`.

  Two things to keep honest about it. The endpoint is undocumented and meant
  for Edge's own read-aloud, so it could change or rate-limit without notice —
  the generator runs on a small pool, is idempotent and resumes. And a
  synthetic voice is still second best for Block 2: good enough to shadow
  rhythm and stress, not good enough to learn a native accent from. A real
  speaker should replace it before Month 3 pushes into connected speech.

  **Where it lives.** In the repository, served from the app's own origin.
  2,718 files, 70 MB, 48 kbit/s mono — which is the number this document once
  called "past what belongs in a git repository". The estimate was right and
  the conclusion was wrong.

  Blob storage would put the audio on a third-party origin, and this project
  has already been burned by exactly that: `*.vercel.app` failed TLS
  interception on the network the app is used from, which is why a GitHub
  Pages copy existed for a while. Every CDN is a fresh chance to hit it again,
  traded for disk that is not scarce. Same-origin means the audio cannot break
  separately from the app. Dropping to 32 kbit/s would save 23 MB at a real
  cost to the block that runs 45 minutes a day; not a trade worth making.

  **Hosting, settled.** Vercel, at `teach-me-daddy.vercel.app`, which the
  network no longer blocks. The Pages copy is retired: two live copies of a
  programme that tracks your progress means two divergent sets of progress,
  and only the Vercel build has the API route that syncs accounts across
  devices. The Pages URL still answers — bookmarks and installed PWAs point at
  it — with a notice that hands back whatever that origin's localStorage holds
  before sending you across. `PAGES_BUILD` and `build:pages` are kept: they
  are the escape hatch if the domain is ever blocked again.

- **Nikud review pass — tooling built, review outstanding.** Being a native
  Hebrew speaker is the one job here no script does. Everything around it is
  now in place.

  `scripts/flag-nikud.mjs` re-vocalises the shipped corpus and keeps what the
  vocaliser says about each token. `scripts/build-nikud-review.mjs` emits
  `review/nikud.html` — one self-contained file, no server and no repository,
  which a Hebrew speaker opens, works down, and exports as JSON.
  `scripts/apply-nikud.mjs` folds that back in and deletes the audio for every
  line it touched, because the voice reads the vowels and a corrected line is
  now spoken wrong. Line ids hash consonants, so they survive untouched.

  **The queue is keyed by reading, not by word.** את is pointed אֶת in 164
  lines and אַתְּ in 8, and both are right where they stand. One card per word
  would have invited a reviewer to fix all 172 and break the eight — which is
  exactly what happened the first time the apply script was tested. 3,475
  readings, ordered by how many lines each appears in; 152 belong to a form
  the corpus points more than one way and are marked as such.

  Two things worth knowing before reviewing. The tail is long: 84% of forms
  occur exactly once, and the top 200 cover only 29% of occurrences, so
  working top-down and stopping is reasonable but will not clear it. And the
  corpus is not Unicode-normalised — it stores dagesh before sheva where NFC
  puts sheva first. The two are visually identical, and before this was
  handled a correction matched 2 of 8 occurrences and silently skipped the
  rest. Every comparison in these scripts normalises now.

- **The 73 items authored before this pipeline existed** were written by hand
  and still want the same review.
