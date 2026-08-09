/**
 * The 5-month plan, encoded from plan-hebreu-5-mois.md.
 * Section numbers below refer to that document.
 */

/** §1 — coverage of everyday Hebrew by cumulative words known. */
export const COVERAGE: { words: number; pct: number }[] = [
  { words: 100, pct: 50 },
  { words: 500, pct: 75 },
  { words: 1000, pct: 82 },
  { words: 2000, pct: 89 },
  { words: 3500, pct: 93 },
  { words: 5000, pct: 95 },
  { words: 8000, pct: 97.5 },
];

/** Interpolate the curve so the dial moves between the published points. */
export function coverageFor(words: number): number {
  if (words <= 0) return 0;
  if (words <= COVERAGE[0].words) {
    return (words / COVERAGE[0].words) * COVERAGE[0].pct;
  }
  for (let i = 1; i < COVERAGE.length; i++) {
    const a = COVERAGE[i - 1];
    const b = COVERAGE[i];
    if (words <= b.words) {
      const t =
        (Math.log(words) - Math.log(a.words)) /
        (Math.log(b.words) - Math.log(a.words));
      return a.pct + t * (b.pct - a.pct);
    }
  }
  return COVERAGE[COVERAGE.length - 1].pct;
}

/** §3 — the daily 4-hour structure. */
export interface Block {
  id: string;
  minutes: number;
  label: string;
  goal: string;
}

export const BLOCKS: Block[] = [
  { id: "vocab", minutes: 45, label: "New words + patterns", goal: "The vocabulary engine — in sentences, plus spaced repetition" },
  { id: "shadow", minutes: 45, label: "Shadowing", goal: "Rhythm, ear, pronunciation over native audio" },
  { id: "speak", minutes: 45, label: "Forced speaking", goal: "Turns passive into active" },
  { id: "immerse", minutes: 45, label: "Active immersion", goal: "Podcast or series, no French subtitles" },
  { id: "consolidate", minutes: 40, label: "Consolidation", goal: "Today's and yesterday's cards, pronunciation fixes" },
];

export const DAILY_MINUTES = BLOCKS.reduce((n, b) => n + b.minutes, 0);

/** §5 — dominant focus per weekday. Index 0 = Monday. */
export const WEEK_FOCUS = [
  { day: "Mon", focus: "New theme — inject 40–50 words + their patterns" },
  { day: "Tue", focus: "Consolidate the theme + related grammar" },
  { day: "Wed", focus: "New theme, second wave + heavier shadowing" },
  { day: "Thu", focus: "Intensive production on both of the week's themes" },
  { day: "Fri", focus: "Immersion + cumulative review" },
  { day: "Sat", focus: "Real simulation — play a full scenario end to end" },
  { day: "Sun", focus: "Wide spaced review (everything overdue) + partial rest" },
];

/** §5 — retention ceiling. Past this, review can't keep up. */
export const NEW_WORDS_CAP = 40;

/** §4 — the five months. */
export interface Month {
  n: number;
  title: string;
  from: number;
  to: number;
  coverage: string;
  bullets: string[];
}

export const ROADMAP: Month[] = [
  {
    n: 1,
    title: "Foundations",
    from: 0,
    to: 1200,
    coverage: "55–60%",
    bullets: [
      "Weeks 1–2: the ~300 function words, acquired inside sentence frames from day one — never as an isolated list.",
      "Weeks 3–4: immediate survival themes — introductions, greetings, family, housing, directions.",
    ],
  },
  {
    n: 2,
    title: "Daily life",
    from: 1200,
    to: 2500,
    coverage: "85%",
    bullets: [
      "Food and restaurants, shopping, transport, money, weather, basic health.",
      "Introduce the binyanim — without them the vocabulary stays inert.",
    ],
  },
  {
    n: 3,
    title: "Social function",
    from: 2500,
    to: 3800,
    coverage: "91–92%",
    bullets: [
      "Work and ulpan, admin, phone calls and appointments, emotions and opinions, describing people and objects.",
      "Start shadowing real media — simple news, podcasts.",
    ],
  },
  {
    n: 4,
    title: "Abstraction & nuance",
    from: 3800,
    to: 4800,
    coverage: "94–95%",
    bullets: [
      "Current affairs, culture, common idioms, negotiation, complex past and future.",
      "Production dominates: monologues, simulated debates, free writing.",
    ],
  },
  {
    n: 5,
    title: "Consolidation & speed",
    from: 4800,
    to: 6000,
    coverage: "95–96%",
    bullets: [
      "No major new theme. Consolidation, unvocalised reading speed, fast listening, slang and register.",
      "Intensive simulation of real situations.",
    ],
  },
];

/** §8 — weekly metrics. */
export const TARGET_LISTENING_MIN = 45;
export const TARGET_SPEAKING_MIN = 45;
/** §8 — hours per month to stay on the FSI trajectory. */
export const TARGET_HOURS_PER_MONTH = 120;

/** §9 — the golden rules. */
export const RULES = [
  "Zero missed days. Intensity doesn't forgive gaps — the forgetting curve restarts fast.",
  "Review before adding. An unreviewed word is a lost word.",
  "Speak badly, every day. A spoken mistake beats silent perfection.",
  "Context over lists — except for the concrete. Function words live in a sentence.",
  "Move to unvocalised text early. It's uncomfortable; that's the point.",
  "95% is the operational finish line — don't burn out chasing the last 5%.",
  "The tutor outweighs Anki. Hour for hour, guided speaking converts better.",
];

/* --- state ------------------------------------------------------------- */

export interface DayLog {
  /** Block id → done. */
  blocks: Record<string, boolean>;
  /** Minutes of native listening. */
  listening: number;
  /** Minutes of active speaking. */
  speaking: number;
}

export interface PlanState {
  /** "YYYY-MM-DD" → log. */
  days: Record<string, DayLog>;
  /** Words learned outside this app, added to the coverage estimate. */
  wordsElsewhere: number;
  /** "YYYY-MM-DD" the programme began. */
  startedOn?: string;
}

export const emptyPlan = (): PlanState => ({ days: {}, wordsElsewhere: 0 });

export const emptyDay = (): DayLog => ({
  blocks: {},
  listening: 0,
  speaking: 0,
});

export function dayKey(d: Date | number = new Date()): string {
  const dt = typeof d === "number" ? new Date(d) : d;
  const m = `${dt.getMonth() + 1}`.padStart(2, "0");
  const day = `${dt.getDate()}`.padStart(2, "0");
  return `${dt.getFullYear()}-${m}-${day}`;
}

export function shiftDay(key: string, delta: number): string {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + delta);
  return dayKey(dt);
}

/** Monday-first weekday index for WEEK_FOCUS. */
export function weekdayIndex(key: string): number {
  const [y, m, d] = key.split("-").map(Number);
  return (new Date(y, m - 1, d).getDay() + 6) % 7;
}

export const dayMinutes = (log: DayLog | undefined): number =>
  log ? BLOCKS.reduce((n, b) => n + (log.blocks[b.id] ? b.minutes : 0), 0) : 0;

export const dayComplete = (log: DayLog | undefined): boolean =>
  !!log && BLOCKS.every((b) => log.blocks[b.id]);

export const dayTouched = (log: DayLog | undefined): boolean =>
  !!log &&
  (Object.values(log.blocks).some(Boolean) ||
    log.listening > 0 ||
    log.speaking > 0);

/** §9.1 — consecutive days with at least something logged, counting back. */
export function streak(plan: PlanState, today = dayKey()): number {
  let n = 0;
  let key = today;
  // Today not yet started shouldn't break a run built yesterday.
  if (!dayTouched(plan.days[key])) key = shiftDay(key, -1);
  while (dayTouched(plan.days[key])) {
    n += 1;
    key = shiftDay(key, -1);
  }
  return n;
}

export function totalMinutes(plan: PlanState): number {
  return Object.values(plan.days).reduce((n, d) => n + dayMinutes(d), 0);
}

export function minutesInMonth(plan: PlanState, year: number, month: number) {
  return Object.entries(plan.days).reduce((n, [key, log]) => {
    const [y, m] = key.split("-").map(Number);
    return y === year && m === month + 1 ? n + dayMinutes(log) : n;
  }, 0);
}

export function monthFor(words: number): Month {
  return ROADMAP.find((m) => words < m.to) ?? ROADMAP[ROADMAP.length - 1];
}
