/**
 * Romanise a vocalised Hebrew line, for reading aloud.
 *
 * The corpus is fully pointed, and nikud encodes the vowels — so this is a
 * transcription of what is already written, not a guess. Hand-written `tr` on
 * a line always wins; this fills the 1,301 generated lines that have none.
 *
 * Modern Israeli values, not academic ones: ח and כ are both `kh`, ט and ת are
 * both `t`, ק and כּ are both `k`, א and ע are silent. A learner needs to know
 * what to say, not which letter it came from — the Hebrew is on the line above
 * for that.
 *
 * What it does not do, and cannot from nikud alone:
 *   - **Stress.** Hebrew is mostly final-stressed but the exceptions are
 *     lexical, so no accents are marked. The recording is the authority.
 *   - **Qamats qatan.** קָ is `a` here; in a closed unstressed syllable it is
 *     really `o` (כָּל is `kol`, not `kal`). Marking it needs morphology.
 *   - **Shva na versus nah.** See SHVA below.
 */

const NIKUD_RANGE = /[֑-ׇ]/;

/* --- points --------------------------------------------------------------- */

const SHEVA = "ְ";
const HATAF_SEGOL = "ֱ";
const HATAF_PATAH = "ֲ";
const HATAF_QAMATS = "ֳ";
const HIRIQ = "ִ";
const TSERE = "ֵ";
const SEGOL = "ֶ";
const PATAH = "ַ";
const QAMATS = "ָ";
const HOLAM = "ֹ";
const HOLAM_VAV = "ֺ";
const QUBUTS = "ֻ";
const DAGESH = "ּ";
const SIN_DOT = "ׂ";
const QAMATS_QATAN = "ׇ";

const VOWEL: Record<string, string> = {
  [HATAF_SEGOL]: "e",
  [HATAF_PATAH]: "a",
  [HATAF_QAMATS]: "o",
  [HIRIQ]: "i",
  [TSERE]: "e",
  [SEGOL]: "e",
  [PATAH]: "a",
  [QAMATS]: "a",
  [HOLAM]: "o",
  [HOLAM_VAV]: "o",
  [QUBUTS]: "u",
  [QAMATS_QATAN]: "o",
};

/** Letters whose sound changes with a dagesh qal. */
const BEGADKEFAT: Record<string, [hard: string, soft: string]> = {
  "ב": ["b", "v"], // ב
  "כ": ["k", "kh"], // כ
  "ך": ["k", "kh"], // ך
  "פ": ["p", "f"], // פ
  "ף": ["p", "f"], // ף
};

const CONSONANT: Record<string, string> = {
  "א": "", // א — silent
  "ג": "g",
  "ד": "d",
  "ה": "h",
  "ו": "v",
  "ז": "z",
  "ח": "kh",
  "ט": "t",
  "י": "y",
  "ל": "l",
  "מ": "m",
  "ם": "m",
  "נ": "n",
  "ן": "n",
  "ס": "s",
  "ע": "", // ע — silent
  "צ": "ts",
  "ץ": "ts",
  "ק": "k",
  "ר": "r",
  "ת": "t",
};

interface Unit {
  letter: string;
  points: string;
}

/** Split a word into letters, each carrying the points that follow it. */
function units(word: string): Unit[] {
  const out: Unit[] = [];
  for (const ch of word) {
    if (NIKUD_RANGE.test(ch)) {
      if (out.length) out[out.length - 1].points += ch;
      continue;
    }
    out.push({ letter: ch, points: "" });
  }
  return out;
}

const vowelOf = (points: string): string => {
  for (const p of points) if (VOWEL[p] !== undefined) return VOWEL[p];
  return "";
};

function consonantOf(u: Unit): string {
  const bg = BEGADKEFAT[u.letter];
  if (bg) return u.points.includes(DAGESH) ? bg[0] : bg[1];
  if (u.letter === "ש") {
    // ש — the dot decides. Unpointed שׁ is far commoner than שׂ.
    return u.points.includes(SIN_DOT) ? "s" : "sh";
  }
  return CONSONANT[u.letter] ?? "";
}

/**
 * SHVA. A shva is either pronounced (na, a short `e`) or silent (nah), and
 * telling them apart properly needs morphology. The classical rules that can
 * be applied from the text alone are used here: word-initial, and the second
 * of two in a row.
 *
 * Modern speech often drops even the word-initial one — קְצָת is written
 * `ketsat` here and most Israelis say `ktsat`. The recording is the authority;
 * this is a reading aid, not a pronunciation guide.
 */
function shvaSounds(i: number, us: Unit[]): boolean {
  const u = us[i];
  if (i === 0) return true;
  if (i === us.length - 1) return false;
  // A dagesh in a letter that is not begadkefat is hazaq — the letter is
  // doubled, and a shva under a doubled letter is always pronounced. This is
  // what makes שֶׁלְּךָ "shelekha" rather than "shelkha".
  if (u.points.includes(DAGESH) && !(u.letter in BEGADKEFAT)) return true;
  const prev = us[i - 1];
  if (prev.points.includes(SHEVA) && !vowelOf(prev.points)) return true;
  return false;
}

/**
 * Qamats qatan says "o", not "a", and telling it from an ordinary qamats needs
 * morphology this does not have. One word makes it worth an exception: כָּל is
 * "kol", it appears 19 times in the corpus, and "kal" is simply wrong.
 */
const QAMATS_QATAN_WORDS: Record<string, string> = { "כל": "kol" };

function word(raw: string): string {
  const bare = raw.replace(/[֑-ׇ]/g, "").replace(/[^א-ת]/g, "");
  const fixed = QAMATS_QATAN_WORDS[bare];
  if (fixed) return fixed + raw.replace(/[א-ת֑-ׇ]/g, "");

  const us = units(raw);
  let out = "";
  // The last *letter*, not the last unit: a full stop or question mark rides
  // along in the same chunk, and it used to hide the final he behind it — 284
  // lines in the corpus end that way and every one gained a spurious "h".
  let lastLetter = -1;
  for (let k = us.length - 1; k >= 0; k--) {
    if (/[א-ת]/.test(us[k].letter)) { lastLetter = k; break; }
  }

  for (let i = 0; i < us.length; i++) {
    const u = us[i];
    const next = us[i + 1];

    // Vav and yod double as vowel letters; the points say which.
    if (u.letter === "ו") {
      if (u.points.includes(HOLAM) || u.points.includes(HOLAM_VAV)) {
        out += "o";
        continue;
      }
      // A dagesh in vav with no vowel of its own is shuruk, not doubling.
      if (u.points.includes(DAGESH) && !vowelOf(u.points)) {
        out += "u";
        continue;
      }
    }

    // `in`, not truthiness: alef and ayin map to the empty string, and
    // testing them as falsy dropped the letter *and its vowel* on the floor.
    const known =
      u.letter in CONSONANT || u.letter in BEGADKEFAT || u.letter === "ש";
    if (!known) {
      // Punctuation and anything else passes through untouched.
      if (!/[א-ת]/.test(u.letter)) out += u.letter;
      continue;
    }

    // A final he carrying no point of its own is a vowel letter, not an /h/:
    // מָה is "ma", not "mah".
    if (
      u.letter === "ה" &&
      i === lastLetter &&
      !u.points.includes(DAGESH) &&
      !vowelOf(u.points) &&
      out &&
      /[aeiou]$/.test(out)
    ) {
      continue;
    }

    // א and ע are silent, but they still separate two vowels. Without a mark
    // כְּאֶל collapses to "keel", which reads as one long vowel rather than
    // the two syllables it is.
    if (
      (u.letter === "א" || u.letter === "ע") &&
      /[aeiou]$/.test(out) &&
      vowelOf(u.points)
    ) {
      out += "'";
    }

    out += consonantOf(u);

    const v = vowelOf(u.points);
    if (v) {
      out += v;
      // A yod after hiriq/tsere/patah is part of the vowel, not a consonant.
      if (next?.letter === "י" && !vowelOf(next.points)) {
        if (v === "i") {
          i++; // hiriq male — already `i`
        } else if (v === "e" || v === "a") {
          out += "i";
          i++;
        }
      }
      continue;
    }

    if (u.points.includes(SHEVA) && shvaSounds(i, us)) out += "e";
  }

  return out;
}

/**
 * Romanise a whole line. Capitalised like a sentence, because it is read as
 * one; punctuation is kept so the phrasing survives.
 */
export function translit(he: string): string {
  const out = he
    .split(/(\s+)/)
    .map((chunk) => (/\s/.test(chunk) ? chunk : word(chunk)))
    .join("")
    .replace(/\s+/g, " ")
    .trim();
  return out ? out[0].toUpperCase() + out.slice(1) : out;
}

/** Hand-written transliteration wins; otherwise derive it from the nikud. */
export function phonetic(line: { he: string; tr?: string }): string {
  return line.tr?.trim() ? line.tr : translit(line.he);
}
