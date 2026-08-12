/**
 * The points — the half of reading Hebrew the alphabet drill never taught.
 *
 * You can master all 22 letters and still not read אֲנִי, because nothing has
 * said what the marks under them do. Every line in this corpus is pointed and
 * the Read card assumes they can be decoded, so this is a prerequisite in the
 * same way the letters are.
 *
 * The thing worth learning, and the reason this is a short drill rather than
 * a long one: **Modern Hebrew has five vowel sounds and eleven signs for
 * them.** Patah and qamats are both "a". Segol and tsere are both "e". The
 * distinctions the signs preserve are historical, and an Israeli does not
 * pronounce them. So the drill asks for the sound, never the name — a name
 * you can recite is not a word you can read.
 *
 * Dagesh is here too. It is not a vowel, but it is the difference between
 * בּ and ב, and a reader who ignores it says the wrong word.
 */

export interface Point {
  /** Progress key. The sign alone, or a label where a sign is reused. */
  id: string;
  /** What the trainee sees: the mark on a carrier letter. */
  show: string;
  /** What it sounds like — the answer. */
  sound: string;
  name: string;
  /** Why it is not simply another spelling of the same thing. */
  note: string;
  /**
   * The sound this one is confused with, forced into the options.
   *
   * For the dagesh pairs the contrast *is* the question — asking whether כַ
   * says "kha" without offering "ka" tests nothing at all.
   */
  pair?: string;
}

/** Mem carries the vowels: no dagesh alternation, no final form in the middle. */
const M = "מ";

export const POINTS: Point[] = [
  // --- a ---
  { id: "ַ", show: M + "ַ", sound: "ma", name: "Patah", note: "One of two ways to write a." },
  { id: "ָ", show: M + "ָ", sound: "ma", name: "Qamats", note: "Also a. The shape differs, the sound does not." },
  { id: "ֲ", show: M + "ֲ", sound: "ma", name: "Hataf patah", note: "A hurried a, under a throat letter." },

  // --- e ---
  { id: "ֶ", show: M + "ֶ", sound: "me", name: "Segol", note: "One of two ways to write e." },
  { id: "ֵ", show: M + "ֵ", sound: "me", name: "Tsere", note: "Also e." },
  { id: "ֱ", show: "אֱ", sound: "e", name: "Hataf segol", note: "A hurried e; almost always under alef, he, het or ayin." },

  // --- i ---
  { id: "ִ", show: M + "ִ", sound: "mi", name: "Hiriq", note: "The only i. A following yod just lengthens it." },

  // --- o ---
  { id: "ֹ", show: M + "ֹ", sound: "mo", name: "Holam", note: "o, written above and to the left." },
  { id: "holam-male", show: "מוֹ", sound: "mo", name: "Holam male", note: "The same o, spelled with a vav. Far commoner in real text." },
  { id: "ֳ", show: "חֳ", sound: "kho", name: "Hataf qamats", note: "A hurried o. Rare." },

  // --- u ---
  { id: "ֻ", show: M + "ֻ", sound: "mu", name: "Qubuts", note: "u, three dots on the slant." },
  { id: "shuruk", show: "מוּ", sound: "mu", name: "Shuruk", note: "The same u, spelled with a vav. Far commoner." },

  // --- the one that is not a vowel ---
  { id: "ְ", show: M + "ְ", sound: "me", name: "Sheva", note: "A very short e, or nothing at all. Position decides." },

  // --- dagesh: not a vowel, but you cannot read without it ---
  { id: "dagesh-b", pair: "va", show: "בַּ", sound: "ba", name: "Dagesh in bet", note: "With the dot b, without it v." },
  { id: "no-dagesh-v", pair: "ba", show: "בַ", sound: "va", name: "Bet, no dagesh", note: "The same letter, said v." },
  { id: "dagesh-k", pair: "kha", show: "כַּ", sound: "ka", name: "Dagesh in kaf", note: "With the dot k, without it kh." },
  { id: "no-dagesh-kh", pair: "ka", show: "כַ", sound: "kha", name: "Kaf, no dagesh", note: "The same letter, said kh." },
  { id: "dagesh-p", pair: "fa", show: "פַּ", sound: "pa", name: "Dagesh in pe", note: "With the dot p, without it f." },
  { id: "no-dagesh-f", pair: "pa", show: "פַ", sound: "fa", name: "Pe, no dagesh", note: "The same letter, said f." },
];

/** Every distinct answer, which is also the set the options are drawn from. */
export const SOUNDS = [...new Set(POINTS.map((p) => p.sound))];

/**
 * Options for one question.
 *
 * Distractors share the carrier where they can — asking whether מַ is "ma" or
 * "ba" tests nothing, because the letter already answers it. The choice has to
 * turn on the mark.
 */
export function optionsFor(p: Point, count = 4): string[] {
  const carrier = p.sound.replace(/[aeiou]+$/, "");
  const sameCarrier = SOUNDS.filter(
    (s) => s !== p.sound && s !== p.pair && s.replace(/[aeiou]+$/, "") === carrier,
  );
  const rest = SOUNDS.filter(
    (s) => s !== p.sound && s !== p.pair && !sameCarrier.includes(s),
  );
  // The pair comes first among the distractors, so it survives the slice.
  const distractors = [...(p.pair ? [p.pair] : []), ...sameCarrier, ...rest];
  return [p.sound, ...distractors].slice(0, count);
}

export const POINT_BY_ID = Object.fromEntries(POINTS.map((p) => [p.id, p]));
