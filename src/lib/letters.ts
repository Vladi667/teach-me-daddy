export type ConfusableGroup =
  | "bet-kaf"
  | "gimel-nun"
  | "dalet-resh"
  | "he-het-tav"
  | "vav-zayin-yod"
  | "ayin-tsadi";

export interface Letter {
  /** Print form. */
  char: string;
  /** Sofit (word-final) form, where one exists. */
  final?: string;
  /** Latin name, used as the quiz answer label. */
  name: string;
  /** Vocalised Hebrew name. */
  nameHe: string;
  /** How the name is pronounced. */
  sound: string;
  /** Phonetic value(s) of the letter itself. */
  value: string;
  /** Gematria (numeric) value. */
  gematria: number;
  /** Letters it is genuinely easy to mix up with. */
  group: ConfusableGroup | null;
  /** A hook for remembering the shape. */
  hint: string;
}

export const LETTERS: Letter[] = [
  {
    char: "א",
    name: "ALEF",
    nameHe: "אָלֶף",
    sound: "a-lef",
    value: "silent — carries the vowel",
    gematria: 1,
    group: null,
    hint: "An ox head tipped on its side: two horns, one diagonal spine.",
  },
  {
    char: "ב",
    name: "BET",
    nameHe: "בֵּית",
    sound: "bet",
    value: "b · v without the dot (vet)",
    gematria: 2,
    group: "bet-kaf",
    hint: "A house seen in cross-section — note the foot sticking out to the left.",
  },
  {
    char: "ג",
    name: "GIMEL",
    nameHe: "גִּימֶל",
    sound: "gi-mel",
    value: "g as in go",
    gematria: 3,
    group: "gimel-nun",
    hint: "A camel mid-stride: one leg forward, one back.",
  },
  {
    char: "ד",
    name: "DALET",
    nameHe: "דָּלֶת",
    sound: "da-let",
    value: "d",
    gematria: 4,
    group: "dalet-resh",
    hint: "A door frame — sharp square corner, unlike the rounded resh.",
  },
  {
    char: "ה",
    name: "HE",
    nameHe: "הֵא",
    sound: "hey",
    value: "h — silent at the end of a word",
    gematria: 5,
    group: "he-het-tav",
    hint: "Like het, but with a window: the left leg floats free.",
  },
  {
    char: "ו",
    name: "VAV",
    nameHe: "וָו",
    sound: "vav",
    value: "v — also spells o and u",
    gematria: 6,
    group: "vav-zayin-yod",
    hint: "A nail. A plain vertical stroke, full height.",
  },
  {
    char: "ז",
    name: "ZAYIN",
    nameHe: "זַיִן",
    sound: "za-yin",
    value: "z",
    gematria: 7,
    group: "vav-zayin-yod",
    hint: "A vav wearing a hat — the crossbar sits centred on top.",
  },
  {
    char: "ח",
    name: "HET",
    nameHe: "חֵית",
    sound: "khet",
    value: "kh — rasped in the throat",
    gematria: 8,
    group: "he-het-tav",
    hint: "A closed fence. Both legs are joined to the roof.",
  },
  {
    char: "ט",
    name: "TET",
    nameHe: "טֵית",
    sound: "tet",
    value: "t",
    gematria: 9,
    group: null,
    hint: "A basket with the rim curling inward.",
  },
  {
    char: "י",
    name: "YOD",
    nameHe: "יוֹד",
    sound: "yod",
    value: "y — also spells i",
    gematria: 10,
    group: "vav-zayin-yod",
    hint: "The smallest letter — a comma floating at the top line.",
  },
  {
    char: "כ",
    final: "ך",
    name: "KAF",
    nameHe: "כַּף",
    sound: "kaf",
    value: "k · kh without the dot",
    gematria: 20,
    group: "bet-kaf",
    hint: "A cupped palm. Fully rounded — no foot, unlike bet.",
  },
  {
    char: "ל",
    name: "LAMED",
    nameHe: "לָמֶד",
    sound: "la-med",
    value: "l",
    gematria: 30,
    group: null,
    hint: "The only letter that climbs above the line — a shepherd's staff.",
  },
  {
    char: "מ",
    final: "ם",
    name: "MEM",
    nameHe: "מֵם",
    sound: "mem",
    value: "m",
    gematria: 40,
    group: null,
    hint: "Water. Open at the bottom left; the final form seals shut.",
  },
  {
    char: "נ",
    final: "ן",
    name: "NUN",
    nameHe: "נוּן",
    sound: "nun",
    value: "n",
    gematria: 50,
    group: "gimel-nun",
    hint: "A narrow hook. Slimmer than gimel and with no left leg.",
  },
  {
    char: "ס",
    name: "SAMEKH",
    nameHe: "סָמֶךְ",
    sound: "sa-mekh",
    value: "s",
    gematria: 60,
    group: null,
    hint: "A closed circle — the only fully sealed loop.",
  },
  {
    char: "ע",
    name: "AYIN",
    nameHe: "עַיִן",
    sound: "a-yin",
    value: "silent for most speakers — a deep guttural",
    gematria: 70,
    group: "ayin-tsadi",
    hint: "A V on a stem — two eyes on one stalk.",
  },
  {
    char: "פ",
    final: "ף",
    name: "PE",
    nameHe: "פֵּא",
    sound: "pey",
    value: "p · f without the dot",
    gematria: 80,
    group: null,
    hint: "A mouth with a tongue curled inside it.",
  },
  {
    char: "צ",
    final: "ץ",
    name: "TSADI",
    nameHe: "צָדִי",
    sound: "tsa-di",
    value: "ts as in cats",
    gematria: 90,
    group: "ayin-tsadi",
    hint: "Like ayin, but the right arm bends up and away.",
  },
  {
    char: "ק",
    name: "KOF",
    nameHe: "קוֹף",
    sound: "kof",
    value: "k",
    gematria: 100,
    group: null,
    hint: "The leg drops below the line — nothing else does this.",
  },
  {
    char: "ר",
    name: "RESH",
    nameHe: "רֵישׁ",
    sound: "resh",
    value: "r — rolled at the back of the throat",
    gematria: 200,
    group: "dalet-resh",
    hint: "A head bowed. Soft rounded shoulder, no corner.",
  },
  {
    char: "ש",
    name: "SHIN",
    nameHe: "שִׁין",
    sound: "shin",
    value: "sh · s with the dot on the left (sin)",
    gematria: 300,
    group: null,
    hint: "Three teeth. Unmistakable.",
  },
  {
    char: "ת",
    name: "TAV",
    nameHe: "תָּו",
    sound: "tav",
    value: "t",
    gematria: 400,
    group: "he-het-tav",
    hint: "Like het, but the left leg kicks forward at the bottom.",
  },
];

export const FINALS = LETTERS.filter((l) => l.final);

export const LETTER_BY_CHAR: Record<string, Letter> = Object.fromEntries(
  LETTERS.map((l) => [l.char, l]),
);

export const TRAP_LETTERS = LETTERS.filter((l) => l.group);

export const GROUP_LABEL: Record<ConfusableGroup, string> = {
  "bet-kaf": "ב · כ",
  "gimel-nun": "ג · נ",
  "dalet-resh": "ד · ר",
  "he-het-tav": "ה · ח · ת",
  "vav-zayin-yod": "ו · ז · י",
  "ayin-tsadi": "ע · צ",
};
