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
5. **Assessment and readiness.**
6. **Retire what contradicts the model**: the Words screen, mode pickers, deck
   browsing. Field notes survives, demoted.

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

## 14. Open

- **Audio — solved for now, with a caveat.** Every line ships two renderings
  from Microsoft's `he-IL-AvriNeural` voice, reached through the Edge
  read-aloud endpoint: free, no key, and genuinely neural rather than the
  formant synthesis the earlier objection was about. `scripts/gen-audio.mjs`
  regenerates them; files live in `public/audio` as `<line>-slow.mp3` and
  `<line>-natural.mp3`.

  Three things to keep honest about it. The endpoint is undocumented and meant
  for Edge's own read-aloud, so it could change or rate-limit without notice —
  the generator is idempotent and resumable for that reason. A synthetic voice
  is still second best for Block 2: it is good enough to shadow rhythm and
  stress, not good enough to learn a native accent from, and a real speaker
  should replace it before Month 3 pushes into connected speech. And at ~40 KB
  a line, 1,700 lines is roughly 70 MB, which is past what belongs in a git
  repository — the full corpus needs blob storage, not `public/`.
- **Nikud review pass.** The 73 items authored before this pipeline existed
  were written by hand and still want the same review.
