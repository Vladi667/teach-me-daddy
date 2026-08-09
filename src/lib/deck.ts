/**
 * Vocabulary for the 5-month plan.
 *
 * Content and ordering follow §6 of plan-hebreu-5-mois.md: sentence patterns
 * are the unit of memorisation and come first; the word groups after them are
 * the pieces that fill the slots. Function words therefore carry an `example`
 * so they're never drilled bare — that's rule §9.4. Numbers and politeness are
 * flagged `atomic`: the plan calls those out as genuine lists with no grammar
 * to carry, so they're fine in isolation.
 */

export type Group =
  | "patterns"
  | "pronouns"
  | "questions"
  | "verbs"
  | "connectors"
  | "time"
  | "numbers"
  | "politeness";

export interface GroupMeta {
  id: Group;
  label: string;
  /** §6 note on how this group should be learned. */
  note: string;
  /** Lower sorts earlier into the new-card queue. */
  order: number;
}

export const GROUPS: GroupMeta[] = [
  {
    id: "patterns",
    label: "Patterns",
    note: "The unit of memorisation. Learn these before anything else — the grammar is fixed and the slot swaps out.",
    order: 0,
  },
  {
    id: "pronouns",
    label: "Pronouns",
    note: "Learn inside the patterns above, not bare.",
    order: 1,
  },
  {
    id: "questions",
    label: "Question words",
    note: "Same — inside “Eifo ___?”, “Kama ___?”.",
    order: 2,
  },
  {
    id: "verbs",
    label: "Essential verbs",
    note: "Same — inside “Ani tsarich / rotse ___” and beyond.",
    order: 3,
  },
  {
    id: "connectors",
    label: "Connectors & answers",
    note: "Use in your own sentences from week 1.",
    order: 4,
  },
  { id: "time", label: "Time", note: "", order: 5 },
  {
    id: "numbers",
    label: "Numbers 0–10",
    note: "A pure list — fine to learn in isolation.",
    order: 6,
  },
  {
    id: "politeness",
    label: "Politeness",
    note: "A pure list — fine to learn in isolation.",
    order: 7,
  },
];

export const GROUP_BY_ID = Object.fromEntries(
  GROUPS.map((g) => [g.id, g]),
) as Record<Group, GroupMeta>;

export interface Item {
  id: string;
  group: Group;
  /** Vocalised Hebrew. */
  he: string;
  /** Transliteration as written in the plan. */
  tr: string;
  /** French gloss, verbatim from the plan. */
  fr: string;
  /** English gloss. */
  en: string;
  /** A frame this word slots into — keeps function words out of bare lists. */
  example?: { he: string; tr: string; fr: string; en: string };
  /** True where the plan says a bare list is acceptable. */
  atomic?: boolean;
}

const EX = {
  eifo: {
    he: "?אֵיפֹה הַתַּחֲנָה",
    tr: "Eifo ha-tachana?",
    fr: "Où est la gare ?",
    en: "Where is the station?",
  },
  tsarich: {
    he: "אֲנִי צָרִיךְ עֶזְרָה",
    tr: "Ani tsarich ezra",
    fr: "J'ai besoin d'aide",
    en: "I need help",
  },
  rotse: {
    he: "אֲנִי רוֹצֶה קָפֶה",
    tr: "Ani rotse kafe",
    fr: "Je veux un café",
    en: "I want a coffee",
  },
  yeshLi: {
    he: "יֵשׁ לִי זְמַן",
    tr: "Yesh li zman",
    fr: "J'ai du temps",
    en: "I have time",
  },
};

export const ITEMS: Item[] = [
  // --- §6 Patterns — learn first -----------------------------------------
  { id: "p-eifo", group: "patterns", he: "?אֵיפֹה הַ___", tr: "Eifo ha-___?", fr: "Où est le/la ___ ?", en: "Where is the ___?" },
  { id: "p-tsarich", group: "patterns", he: "___ אֲנִי צָרִיךְ", tr: "Ani tsarich ___", fr: "J'ai besoin de ___", en: "I need ___" },
  { id: "p-rotse", group: "patterns", he: "___ אֲנִי רוֹצֶה", tr: "Ani rotse ___", fr: "Je veux ___", en: "I want ___" },
  { id: "p-kama", group: "patterns", he: "?כַּמָּה זֶה עוֹלֶה", tr: "Kama ze ole?", fr: "Combien ça coûte ?", en: "How much does it cost?" },
  { id: "p-efshar", group: "patterns", he: "?אֶפְשָׁר", tr: "Efshar?", fr: "C'est possible ? / Je peux ?", en: "Is it possible? / May I?" },
  { id: "p-yesh-li", group: "patterns", he: "___ יֵשׁ לִי", tr: "Yesh li ___", fr: "J'ai ___", en: "I have ___" },
  { id: "p-lo-mevin", group: "patterns", he: "אֲנִי לֹא מֵבִין", tr: "Ani lo mevin", fr: "Je ne comprends pas", en: "I don't understand" },
  { id: "p-ma-ze", group: "patterns", he: "?מָה זֶה", tr: "Ma ze?", fr: "Qu'est-ce que c'est ?", en: "What is this?" },
  { id: "p-anglit", group: "patterns", he: "?אַתָּה מְדַבֵּר אַנְגְּלִית", tr: "Ata medaber anglit?", fr: "Tu parles anglais ?", en: "Do you speak English?" },

  // --- Pronouns ------------------------------------------------------------
  { id: "w-ani", group: "pronouns", he: "אֲנִי", tr: "ani", fr: "je", en: "I", example: EX.rotse },
  { id: "w-ata-at", group: "pronouns", he: "אַתָּה / אַתְּ", tr: "ata / at", fr: "tu (m/f)", en: "you (m/f)", example: { he: "?אַתָּה מְדַבֵּר אַנְגְּלִית", tr: "Ata medaber anglit?", fr: "Tu parles anglais ?", en: "Do you speak English?" } },
  { id: "w-hu-hi", group: "pronouns", he: "הוּא / הִיא", tr: "hu / hi", fr: "il / elle", en: "he / she", example: { he: "הוּא לוֹמֵד", tr: "Hu lomed", fr: "Il apprend", en: "He is learning" } },
  { id: "w-anachnu", group: "pronouns", he: "אֲנַחְנוּ", tr: "anachnu", fr: "nous", en: "we", example: { he: "אֲנַחְנוּ הוֹלְכִים", tr: "Anachnu holchim", fr: "Nous allons", en: "We are going" } },
  { id: "w-atem-hem", group: "pronouns", he: "אַתֶּם / הֵם", tr: "atem / hem", fr: "vous / ils", en: "you (pl) / they", example: { he: "?אַתֶּם מְדַבְּרִים עִבְרִית", tr: "Atem medabrim ivrit?", fr: "Vous parlez hébreu ?", en: "Do you speak Hebrew?" } },

  // --- Question words ------------------------------------------------------
  { id: "w-ma", group: "questions", he: "מָה", tr: "ma", fr: "quoi", en: "what", example: { he: "?מָה זֶה", tr: "Ma ze?", fr: "Qu'est-ce que c'est ?", en: "What is this?" } },
  { id: "w-mi", group: "questions", he: "מִי", tr: "mi", fr: "qui", en: "who", example: { he: "?מִי זֶה", tr: "Mi ze?", fr: "Qui est-ce ?", en: "Who is that?" } },
  { id: "w-eifo", group: "questions", he: "אֵיפֹה", tr: "eifo", fr: "où", en: "where", example: EX.eifo },
  { id: "w-matai", group: "questions", he: "מָתַי", tr: "matai", fr: "quand", en: "when", example: { he: "?מָתַי זֶה", tr: "Matai ze?", fr: "C'est quand ?", en: "When is it?" } },
  { id: "w-lama", group: "questions", he: "לָמָּה", tr: "lama", fr: "pourquoi", en: "why", example: { he: "?לָמָּה לֹא", tr: "Lama lo?", fr: "Pourquoi pas ?", en: "Why not?" } },
  { id: "w-eich", group: "questions", he: "אֵיךְ", tr: "eich", fr: "comment", en: "how", example: { he: "?אֵיךְ אוֹמְרִים", tr: "Eich omrim?", fr: "Comment dit-on ?", en: "How do you say?" } },
  { id: "w-kama", group: "questions", he: "כַּמָּה", tr: "kama", fr: "combien", en: "how much", example: { he: "?כַּמָּה זֶה עוֹלֶה", tr: "Kama ze ole?", fr: "Combien ça coûte ?", en: "How much does it cost?" } },
  { id: "w-meayin", group: "questions", he: "מֵאַיִן", tr: "me'ayin", fr: "d'où", en: "from where", example: { he: "?מֵאַיִן אַתָּה", tr: "Me'ayin ata?", fr: "D'où viens-tu ?", en: "Where are you from?" } },

  // --- Essential verbs -----------------------------------------------------
  { id: "w-yesh-ein", group: "verbs", he: "יֵשׁ / אֵין", tr: "yesh / ein", fr: "il y a / il n'y a pas", en: "there is / there isn't", example: EX.yeshLi },
  { id: "w-rotse", group: "verbs", he: "רוֹצֶה", tr: "rotse", fr: "vouloir", en: "to want", example: EX.rotse },
  { id: "w-tsarich", group: "verbs", he: "צָרִיךְ", tr: "tsarich", fr: "avoir besoin de", en: "to need", example: EX.tsarich },
  { id: "w-yachol", group: "verbs", he: "יָכוֹל", tr: "yachol", fr: "pouvoir", en: "can / to be able", example: { he: "אֲנִי יָכוֹל", tr: "Ani yachol", fr: "Je peux", en: "I can" } },
  { id: "w-holech", group: "verbs", he: "הוֹלֵךְ", tr: "holech", fr: "aller", en: "to go", example: { he: "אֲנִי הוֹלֵךְ הַבַּיְתָה", tr: "Ani holech habaita", fr: "Je rentre à la maison", en: "I'm going home" } },
  { id: "w-ba", group: "verbs", he: "בָּא", tr: "ba", fr: "venir", en: "to come", example: { he: "?אַתָּה בָּא", tr: "Ata ba?", fr: "Tu viens ?", en: "Are you coming?" } },
  { id: "w-yodea", group: "verbs", he: "יוֹדֵעַ", tr: "yode'a", fr: "savoir", en: "to know", example: { he: "אֲנִי לֹא יוֹדֵעַ", tr: "Ani lo yode'a", fr: "Je ne sais pas", en: "I don't know" } },
  { id: "w-mevin", group: "verbs", he: "מֵבִין", tr: "mevin", fr: "comprendre", en: "to understand", example: { he: "אֲנִי לֹא מֵבִין", tr: "Ani lo mevin", fr: "Je ne comprends pas", en: "I don't understand" } },
  { id: "w-gar", group: "verbs", he: "גָּר", tr: "gar", fr: "habiter", en: "to live (reside)", example: { he: "?אֵיפֹה אַתָּה גָּר", tr: "Eifo ata gar?", fr: "Où habites-tu ?", en: "Where do you live?" } },
  { id: "w-oved", group: "verbs", he: "עוֹבֵד", tr: "oved", fr: "travailler", en: "to work", example: { he: "אֲנִי עוֹבֵד", tr: "Ani oved", fr: "Je travaille", en: "I work" } },
  { id: "w-lomed", group: "verbs", he: "לוֹמֵד", tr: "lomed", fr: "apprendre", en: "to learn", example: { he: "אֲנִי לוֹמֵד עִבְרִית", tr: "Ani lomed ivrit", fr: "J'apprends l'hébreu", en: "I'm learning Hebrew" } },
  { id: "w-medaber", group: "verbs", he: "מְדַבֵּר", tr: "medaber", fr: "parler", en: "to speak", example: { he: "אֲנִי מְדַבֵּר קְצָת", tr: "Ani medaber ktsat", fr: "Je parle un peu", en: "I speak a little" } },

  // --- Connectors & answers ------------------------------------------------
  { id: "w-ve", group: "connectors", he: "וְ", tr: "ve", fr: "et", en: "and", example: { he: "קָפֶה וְעוּגָה", tr: "Kafe ve-uga", fr: "Un café et un gâteau", en: "Coffee and cake" } },
  { id: "w-aval", group: "connectors", he: "אֲבָל", tr: "aval", fr: "mais", en: "but", example: { he: "אֲנִי רוֹצֶה אֲבָל אֵין לִי זְמַן", tr: "Ani rotse aval ein li zman", fr: "Je veux mais je n'ai pas le temps", en: "I want to but I have no time" } },
  { id: "w-gam", group: "connectors", he: "גַּם", tr: "gam", fr: "aussi", en: "also", example: { he: "גַּם אֲנִי", tr: "Gam ani", fr: "Moi aussi", en: "Me too" } },
  { id: "w-ken-lo", group: "connectors", he: "כֵּן / לֹא", tr: "ken / lo", fr: "oui / non", en: "yes / no", example: { he: "כֵּן, בְּבַקָּשָׁה", tr: "Ken, bevakasha", fr: "Oui, s'il te plaît", en: "Yes, please" } },
  { id: "w-im-bli", group: "connectors", he: "עִם / בְּלִי", tr: "im / bli", fr: "avec / sans", en: "with / without", example: { he: "קָפֶה בְּלִי סֻכָּר", tr: "Kafe bli sukar", fr: "Un café sans sucre", en: "Coffee without sugar" } },
  { id: "w-ki", group: "connectors", he: "כִּי", tr: "ki", fr: "parce que", en: "because", example: { he: "כִּי אֲנִי לוֹמֵד", tr: "Ki ani lomed", fr: "Parce que j'apprends", en: "Because I'm learning" } },

  // --- Time ----------------------------------------------------------------
  { id: "w-hayom", group: "time", he: "הַיּוֹם", tr: "hayom", fr: "aujourd'hui", en: "today", example: { he: "הַיּוֹם אֲנִי עוֹבֵד", tr: "Hayom ani oved", fr: "Aujourd'hui je travaille", en: "Today I'm working" } },
  { id: "w-machar", group: "time", he: "מָחָר", tr: "machar", fr: "demain", en: "tomorrow" },
  { id: "w-etmol", group: "time", he: "אֶתְמוֹל", tr: "etmol", fr: "hier", en: "yesterday" },
  { id: "w-achshav", group: "time", he: "עַכְשָׁיו", tr: "achshav", fr: "maintenant", en: "now" },

  // --- Numbers 0–10 (pure list) -------------------------------------------
  { id: "n-0", group: "numbers", he: "אֶפֶס", tr: "efes", fr: "0 — zéro", en: "0 — zero", atomic: true },
  { id: "n-1", group: "numbers", he: "אַחַת", tr: "achat", fr: "1 — un", en: "1 — one", atomic: true },
  { id: "n-2", group: "numbers", he: "שְׁתַּיִם", tr: "shtayim", fr: "2 — deux", en: "2 — two", atomic: true },
  { id: "n-3", group: "numbers", he: "שָׁלוֹשׁ", tr: "shalosh", fr: "3 — trois", en: "3 — three", atomic: true },
  { id: "n-4", group: "numbers", he: "אַרְבַּע", tr: "arba", fr: "4 — quatre", en: "4 — four", atomic: true },
  { id: "n-5", group: "numbers", he: "חָמֵשׁ", tr: "chamesh", fr: "5 — cinq", en: "5 — five", atomic: true },
  { id: "n-6", group: "numbers", he: "שֵׁשׁ", tr: "shesh", fr: "6 — six", en: "6 — six", atomic: true },
  { id: "n-7", group: "numbers", he: "שֶׁבַע", tr: "sheva", fr: "7 — sept", en: "7 — seven", atomic: true },
  { id: "n-8", group: "numbers", he: "שְׁמוֹנֶה", tr: "shmone", fr: "8 — huit", en: "8 — eight", atomic: true },
  { id: "n-9", group: "numbers", he: "תֵּשַׁע", tr: "tesha", fr: "9 — neuf", en: "9 — nine", atomic: true },
  { id: "n-10", group: "numbers", he: "עֶשֶׂר", tr: "eser", fr: "10 — dix", en: "10 — ten", atomic: true },

  // --- Politeness (pure list) ---------------------------------------------
  { id: "c-shalom", group: "politeness", he: "שָׁלוֹם", tr: "shalom", fr: "bonjour / paix", en: "hello / peace", atomic: true },
  { id: "c-toda", group: "politeness", he: "תּוֹדָה", tr: "toda", fr: "merci", en: "thank you", atomic: true },
  { id: "c-bevakasha", group: "politeness", he: "בְּבַקָּשָׁה", tr: "bevakasha", fr: "s'il te plaît", en: "please", atomic: true },
  { id: "c-slicha", group: "politeness", he: "סְלִיחָה", tr: "slicha", fr: "pardon / excuse-moi", en: "sorry / excuse me", atomic: true },
  { id: "c-lehitraot", group: "politeness", he: "לְהִתְרָאוֹת", tr: "lehitra'ot", fr: "au revoir", en: "goodbye", atomic: true },
];

export const ITEM_BY_ID = Object.fromEntries(ITEMS.map((i) => [i.id, i]));

/** Recognition (see Hebrew → know it) and recall (know it → produce Hebrew). */
export type Direction = "he2m" | "m2he";

export interface Card {
  id: string;
  itemId: string;
  direction: Direction;
}

/**
 * Two cards per item. Recognition comes first in queue order because it's the
 * easier direction and seeds the recall card.
 */
export const CARDS: Card[] = ITEMS.flatMap((item) => [
  { id: `${item.id}:he2m`, itemId: item.id, direction: "he2m" as Direction },
  { id: `${item.id}:m2he`, itemId: item.id, direction: "m2he" as Direction },
]).sort((a, b) => {
  const ga = GROUP_BY_ID[ITEM_BY_ID[a.itemId].group].order;
  const gb = GROUP_BY_ID[ITEM_BY_ID[b.itemId].group].order;
  if (ga !== gb) return ga - gb;
  if (a.direction !== b.direction) return a.direction === "he2m" ? -1 : 1;
  return 0;
});

export const cardsForGroup = (g: Group) =>
  CARDS.filter((c) => ITEM_BY_ID[c.itemId].group === g);
