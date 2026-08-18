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

**27 glyphs, not 22.** Each of the five final forms is its own question with
its own progress, and a letter counts as known only once both of its shapes
do. ך is not a decoration on kaf — it appears at the end of a word and nowhere
else, and counting kaf as learned while ך is not overstates what can be read.

**Mastery is timed.** Three correct in a row at four seconds each is decoding,
not reading; fluency is a latency skill. A run only counts while the answers
come in under two seconds. That bar is deliberately not the sub-second a
soldier would be held to, because this is four-option multiple choice and most
of the budget goes on reading the options — it measures "answered without
hesitating", which is the honest claim. Progress recorded before timing
existed falls back to the plain streak, so a new metric does not delete work
already done.

**The best run is banked.** A run used to be the *current* streak, so the
board asked for three-in-a-row and then took them away again on the next miss.
Simulated against the real picker, that target was not merely hard but
unreachable: none of sixty players cleared all 27 glyphs, and the best of them
peaked around 20 before sliding back, settling near 12. `record` now keeps
`best` and `bestFast` as running maxima, and `isMastered` reads the maximum
rather than the live run — a miss still breaks the streak, it just cannot
repossess ground already taken. The same sixty players all clear the board,
at a median of 425 answers.

**What is locked leaves the draw.** Banking alone still wastes most of a
session re-asking glyphs already known. The alphabet picker, the lessons
picker and the points drill each filter the pool to unbanked items, falling
back to the full pool once everything is banked so the board stays usable as
free practice. Median answers to clear all 27 drops from 425 to 156 — roughly
three sittings rather than nine. The next question is drawn inside a
`setTimeout` that would otherwise close over the progress captured *before*
the answer was recorded, so a live ref carries the post-answer state in and a
glyph banked by the last answer is gone from the very next question.

**The points boards were leaking the answer.** `optionsFor` sliced its
distractors off the front of a fixed list, which made only eight distinct
boards across all nineteen points — `mu` and `e` never appeared as a wrong
answer at all, so several items could be answered by elimination without
reading the sign. It now samples: near misses that share the carrier first,
then the rest, for 515 distinct boards.

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

## 8bb. Reading lessons — letters into words

The alphabet drill taught 27 shapes, the points drill 19 marks, and then the
app handed over a 56-word passage. Nothing in between ever said how a letter
and a vowel become a syllable, or syllables a word. That is the step every
literacy programme spends its time on, and it was the one step missing.

`/lessons`, five stages, each adding exactly one rule:

| Stage | Adds | Example |
| --- | --- | --- |
| 1 | a consonant carries the vowel under it | מַ → *ma* |
| 2 | a vowel-less consonant closes the syllable | מַן → *man* |
| 3 | real words, read in parts | שָׁלוֹם → *sha-lom* |
| 4 | the prefixes glued to the front | הַבַּיִת → *ha-ba-yit* |
| 5 | more than one word at a time | אֲנִי רוֹצֶה |

Each stage opens with its rule and a worked example, and **a miss shows the
word broken into syllables** — a drill that only says "wrong" teaches nothing
the trainee did not already know. Stages 1-2 are generated; 3-5 draw real
words and phrases from the corpus.

The answer is always the pronunciation, produced by `translit()` — the same
tested function that writes the phonetics under every line, so there is no
hand-written answer key here to drift out of step. This teaches decoding and
not vocabulary: no meaning is shown, because a gloss would invite recognising
the word instead of reading it.

The prerequisite prompt on TODAY walks the whole chain now — letters, then
points, then lessons — and only stands down when all three are done.

---

## 8c. Timed reading, on a clock

Independent of the programme, and deliberately so. The five blocks teach
lines; no number of single sentences adds up to reading a paragraph, and speed
is a skill the SRS can never measure because a card has no length. `/read` is
filed under Tools as **Timed reading**, not issued as a block. It sits after
the lessons: decoding first, then speed.

24 passages, six levels, four each — 55 words at level 1 rising to 140 at
level 6. Generated by `scripts/build-reading.mjs`, which excludes three things
and a unit test enforces all of them: the programme corpus, because re-reading
a drilled line measures recall speed rather than reading speed; the assessment
passages, which must stay unseen for §6 to mean anything; and each other.

The clock runs from Start to Done and nothing else is timed, so the number
says what it claims. No translation is on screen while reading — reading it
would be reading French. It appears afterwards, and the trainee says whether
they followed the sense of it.

**Comprehension gates the level, speed does not.** A passage read at 400 words
a minute and not followed stays in the queue and opens nothing; four followed
passages open the next level. Speed without comprehension is scrolling. The
check is self-reported because generating real comprehension questions from a
sentence corpus produces bad ones, and a bad check is worse than an honest
self-assessment.

The §8b vowel ladder applies here too, by level rather than by interval:
levels 1-2 fully pointed, 3-4 reduced, 5-6 bare.

---

## 8d. The weekly test

The ulpan sets a test every week. It is the only deadline in this app that the
programme did not invent, and it does not go through the scheduler: a card due
in four days is no use on Thursday. `/tests` is its own tab, **TEST** — see
§10 for why it is a peer of TODAY rather than a tool filed under You.

Each week is a fixed bank in its own file — `src/lib/exams.w1.ts` — because the
material is the classroom's, not the corpus's. It is whatever the teacher said
would be on it. Adding next week is one file plus one line in `WEEKS`, and
nothing else in the app changes.

Week 1 is the aleph test: 109 multiple-choice questions across the four
sections the teacher named (present tense 30, זה/זאת/אלה 22, singular into
plural 24, personal details and professions 33), the personal-details form, and
four gap-fill passages. Everything is unpointed, because the paper is, and a
vocalised drill would train a reading the test never shows.

**Two modes, and the difference is the point.** A section drill corrects you
where you stand and makes a miss wait until the margin note has been read. The
mock says nothing until the end: 40 questions drawn proportionally across the
four sections, then a breakdown of where it went and every miss with its rule.
Correcting during a mock measures a different skill from the one the ulpan
measures on Thursday.

**A section drill is the whole section, not a sample of it.** A random 15 of 30
would make two runs incomparable, and comparing runs is what the screen exists
for. Options are reshuffled every time, or the fourth run stops testing Hebrew
and starts testing which position the answer sat in.

**Every sitting is kept and nothing is averaged away.** One score says nothing;
the third run against the first is the number that answers whether the evening
worked. So `series` returns runs in order, `delta` reports latest against first
including when it is negative, and a bad run stays in the trail — which is the
only thing that makes the good ones mean anything.

Readiness is the average of your best in each marked section, counting a
section never opened as zero. Averaging only what has been attempted would read
100% after one good section, which is precisely the reassurance a test week
cannot afford.

**The form is practice and is never stored.** It is a real identity sheet —
name, date of birth, ת.ז. — and §10's accounts are a username with an optional
four-digit PIN, which is not authentication. The exercise is writing the
Hebrew, not keeping the record, so its state lives in the component and dies
with it.


---

## 8e. The decoding ladder

Between knowing the glyphs and reading a page there is a gap the alphabet
drill cannot cross. §8bb teaches blending on constructed syllables; §8c
measures speed on text you can already decode. This is the part in between:
seven rungs, from six letters to twenty-two, reading real Hebrew at every
step.

**The shape is forced by the corpus, not chosen.** The obvious design is to
filter the corpus to the letters known so far. Measured, that does not work.
Gating the 1,359 sentences by a six-letter set leaves *nothing* — nor at seven
letters, nor eight. Whole sentences appear in useful numbers only at fourteen.

| Letters known | Whole sentences readable |
| --- | --- |
| 6 | 0 of 1,359 |
| 10 | 18 |
| 14 | 133 |
| 19 | 658 |

Frequency does not rescue it either. The hundred commonest words cover 26.6%
of running text but yield fourteen whole sentences, median length two words —
and between them those hundred words already need twenty of the twenty-two
letters. There is no ordering of the alphabet that unlocks sentences early,
because Hebrew words are short and dense with distinct letters.

**Gate on words instead and it opens at once.** The same six letters spell 79
real corpus words, and 26 attested multi-word fragments; ten letters spell 602
words and 475 fragments. So rungs 1-4 read *fragments cut from real sentences*
— `הִיא לֹא`, `יֵשׁ לִי`, `אֵין לִי` — and the ladder crosses over to whole
sentences at rung 5, which is exactly where the corpus starts supplying them.

| Rung | Letters | Adds | Words | Reads |
| --- | --- | --- | --- | --- |
| 1 | 6 | א ת ל כ י ה | 79 | fragments |
| 2 | 8 | ו מ | 241 | fragments |
| 3 | 10 | ש נ | 602 | fragments |
| 4 | 12 | ב ר | 1,111 | fragments |
| 5 | 14 | ח ע | 1,672 | sentences |
| 6 | 18 | ד ק פ צ | 2,825 | sentences |
| 7 | 22 | ז ס ג ט | 3,833 | sentences |

**Nothing is invented.** Every word and every fragment is attested in the
corpus with its original pointing; the generator only selects and cuts. A
fragment is scored by the commonness of its rarest word, so `יֵשׁ לִי` outranks
`לְהַאֲכִיל אֶת`, and no fragment is kept that is contained in one already taken.

**Aleph is pinned first**, then each letter is whichever unlocks the most
running text next, computed greedily against this corpus. Pinning aleph costs
a little coverage and is worth it: the alphabet is learned in its own order
and starting elsewhere is a needless argument to have on day one. The order
that falls out separates every confusable pair by seven positions or more
except ד and ר, which land three apart and need contrastive drilling when ד
arrives.

**A final form follows its own letter rather than waiting.** ך is a rung-1
glyph because כ is, and rung-1 words use it — `לָךְ`, `אֵיךְ`, `כָּךְ`. A rung opens
only when every one of its glyphs, finals included, is banked in the alphabet
drill; there is no partial credit.

**Each rung must teach what it adds.** Every line at a rung contains at least
one of the letters that rung introduces, so a rung is never a re-read of the
one below. The test suite asserts this, along with the load-bearing promise —
that no line anywhere needs a letter it has not been taught. Both are
meaningfully constraining rather than vacuous: every rung holds forty to sixty
words that would fail at the rung below.

**Help costs something.** Every word in a passage can be tapped, and a free
reveal would be actively harmful: you would tap each word in turn, understand
the line, and learn nothing, because nothing was retrieved. So help comes in
two tiers and both are counted. A tap splits the word into its syllables —
help with *chunking*, which still leaves the sounding-out to the reader. A
second, deliberate press spells it out in Latin letters. Either one costs the
clean mark.

**Only a clean read retires a passage.** A passage read with any help at all
stays in the queue and comes back. This is the whole progression rule, and it
is not punitive: the review names the words that stopped you and shows each
one broken into syllables with its sounds, so the next attempt is a re-read
with the answers already given. The loop converges in two or three passes
rather than grinding.

**A helped sitting records no speed.** Words per minute is only written on a
clean read, because a time that includes four stops to look words up is not a
reading speed and putting a number on it would flatter the trainee.

**The gloss and the recording come after, never during.** French on screen
while reading is French being read. Rungs 5-7 are whole corpus sentences, so
their recordings exist and play on the review screen; rungs 1-4 are fragments
cut from sentences, whose recording would play the rest of the sentence too,
so they have none and claim none.

**A rung opens only when every one of its glyphs is banked** in the alphabet
drill, final forms included, with no partial credit. Until six letters are
banked there is nothing to read and the screen says so, and points at the
drill rather than pretending otherwise.

**Why this draws on the programme corpus when §8c refuses to.** The reading
library measures reading *speed*, so re-reading a drilled line would measure
recall instead. The ladder measures *decoding* — turning marks into sounds —
where known vocabulary helps rather than cheats. The overlap is small in any
case: the ladder is week-one work and the corpus runs to day 132.
---

## 8f. Stripping the prefix

Seven letters attach to the front of a Hebrew word and change its meaning
without being part of it: ה the, ו and, ב in, כ like, ל to, מ from, ש that —
מש״ה וכל״ב. A reader who cannot see past them reads six characters where a
fluent reader sees one letter plus a word already known. After the glyphs
themselves this is the largest lever there is.

**How big, honestly.** Three counts on this corpus, because the easy one is
wrong:

| Measure | Share of running words |
| --- | --- |
| Starts with one of the seven letters | 56.1% |
| ...and that letter carries a vowel a prefix can take | **40.1%** |
| ...and stripping it leaves a word this corpus attests | 6.6% |

The first figure is the one to distrust, and it was quoted here before it was
checked: it counts מַיִם and שָׁלוֹם, which wear no prefix at all. **40.1% is
the honest estimate.** The 6.6% is not a measurement of Hebrew but of what can
be *verified end to end* against this corpus, and it is a floor — the base of a
genuinely prefixed word often never appears bare in 1,359 sentences.

**Nothing is parsed.** Automatic morphological analysis of unvocalised-adjacent
Hebrew gets things wrong, and a wrong analysis on screen teaches a wrong
reading. So the material is verified from both ends instead: a family survives
only when the prefixed form and the bare base are both attested, the prefix
vowel is one that prefix can actually carry, and the remainder matches the
base's *pointing* rather than merely its consonants. That last rule is
load-bearing — matching consonants alone read מִלֵּא ("filled") as mem + לֹא
and מִסְפַּר ("number") as mem + סֵפֶר. Prefixing may add a dagesh
(יוֹם → הַיּוֹם) and nothing else, so that is the only difference tolerated.

Two rules are lexical rather than derivable, so they are simply listed. שֶׁל is
a word of its own, "of", so שֶׁלִּי is שֶׁל plus a pronoun suffix meaning
"mine" — not shin + לִי, "that to me"; the whole possessive set is excluded.
And מִלָּה ("word") and לְכִי (the imperative "go!") pass every filter while
carrying no prefix, so they are named and dropped. These were found by reading
all 269 surviving candidates, not by trusting the filters: eight were wrong, an
error rate of about 3%, and they are gone.

Result: **177 families, 261 prefixed forms**, every one of the seven prefixes
represented. A unit test asserts that stripping each form's prefix really does
leave its base, and that the eight known impostors stay out.

**Two stages, because stripping is two skills.** Knowing what בְּ means is not
knowing where בְּ ends, and the second is the half that makes reading faster.

- **Stage 1 — what the little letter says.** The prefix is tinted, and the
  question is what it means. Options are drawn from the seven meanings only.
- **Stage 2 — find the word underneath.** Nothing is marked, and the question
  is which word is left. Options are Hebrew bases of similar length to the
  answer, because offering wildly different words would let the question be
  answered on shape alone without stripping anything.

Stage 2 opens when 60% of stage 1 is banked. Both use the same criterion as
every other drill — three correct in a row, each under two seconds — with
banking and retirement from §8a, and a miss shows the word coming apart at the
prefix with the base named. The teaching screen shows one word wearing every
prefix it is attested with (זֶה → הַזֶּה, לָזֶה, מִזֶּה, בָּזֶה, כָּזֶה,
שֶׁזֶּה), because the contrast is the lesson.

**A note on the shin dot.** The prefix ש is שֶׁ, and the first attempt found no
shin families at all. The vowel test was reading the shin dot as though it were
a vowel, so segol never matched. Dagesh, shin dot and sin dot are all letter
diacritics rather than vowels; excluding all three took shin from zero forms to
forty-five. This is the third time NFC combining marks have caused a silent
wrong answer in this project.
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

Three screens.

**TODAY.** The assignment and the run. Day counter, the five blocks in order,
current block highlighted, everything else inert. Starting a block enters a
full-screen run that exits when the block is done.

**TEST.** The ulpan's paper, §8d. The one tab that is not the programme's, and
the reason it is a tab rather than a tool: it is set by someone else, it lands
on a fixed day, and it does not wait for an interval to come due. Filed under
Tools it read as something the syllabus was offering, which is exactly what it
is not. Everything else the app offers you can be done tomorrow instead.

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
