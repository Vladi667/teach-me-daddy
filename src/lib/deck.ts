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
  // §6 — weeks 1–2, the function words, patterns first
  | "patterns"
  | "pronouns"
  | "questions"
  | "verbs"
  | "connectors"
  | "time"
  | "numbers"
  | "politeness"
  // §4 month 1, weeks 3–4 — immediate survival themes
  | "introductions"
  | "family"
  | "home"
  | "directions"
  // words you add yourself
  | "captured";

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
  {
    id: "introductions",
    label: "Introducing yourself",
    note: "Month 1, weeks 3–4 — the first thing you'll actually need.",
    order: 8,
  },
  {
    id: "family",
    label: "Family",
    note: "Concrete nouns. §9.4 says these are fine as atoms.",
    order: 9,
  },
  {
    id: "home",
    label: "Housing",
    note: "Concrete nouns. §9.4 says these are fine as atoms.",
    order: 10,
  },
  {
    id: "directions",
    label: "Getting around",
    note: "The positional words carry grammar, so they come with a frame.",
    order: 11,
  },
  {
    id: "captured",
    label: "Your words",
    note: "Words you added yourself — from a tutor, a podcast, the street.",
    order: 12,
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

  // --- §4 month 1, weeks 3–4: introducing yourself -------------------------
  { id: "i-shem", group: "introductions", he: "שֵׁם", tr: "shem", fr: "nom", en: "name", atomic: true },
  { id: "i-ma-hashem", group: "introductions", he: "?מָה הַשֵּׁם שֶׁלְּךָ", tr: "Ma ha-shem shelcha?", fr: "Comment tu t'appelles ?", en: "What's your name?" },
  { id: "i-shmi", group: "introductions", he: "___ שְׁמִי", tr: "Shmi ___", fr: "Je m'appelle ___", en: "My name is ___" },
  { id: "i-naim", group: "introductions", he: "נָעִים מְאוֹד", tr: "na'im me'od", fr: "enchanté", en: "nice to meet you", atomic: true },
  { id: "i-ma-shlomcha", group: "introductions", he: "?מָה שְׁלוֹמְךָ", tr: "Ma shlomcha?", fr: "Comment vas-tu ?", en: "How are you?" },
  { id: "i-ma-nishma", group: "introductions", he: "?מָה נִשְׁמָע", tr: "Ma nishma?", fr: "Quoi de neuf ?", en: "What's up?" },
  { id: "i-beseder", group: "introductions", he: "בְּסֵדֶר", tr: "beseder", fr: "ça va / d'accord", en: "okay / fine", atomic: true },
  { id: "i-tov", group: "introductions", he: "טוֹב", tr: "tov", fr: "bien / bon", en: "good", atomic: true },
  { id: "i-ani-mi", group: "introductions", he: "___ אֲנִי מִ", tr: "Ani mi-___", fr: "Je viens de ___", en: "I'm from ___" },
  { id: "i-tsarfat", group: "introductions", he: "צָרְפַת", tr: "Tsarfat", fr: "la France", en: "France", atomic: true },
  { id: "i-yisrael", group: "introductions", he: "יִשְׂרָאֵל", tr: "Yisra'el", fr: "Israël", en: "Israel", atomic: true },
  { id: "i-ivrit", group: "introductions", he: "עִבְרִית", tr: "ivrit", fr: "l'hébreu", en: "Hebrew", atomic: true },
  { id: "i-tsarfatit", group: "introductions", he: "צָרְפָתִית", tr: "tsarfatit", fr: "le français", en: "French", atomic: true },
  { id: "i-ktsat", group: "introductions", he: "קְצָת", tr: "ktsat", fr: "un peu", en: "a little", example: { he: "אֲנִי מְדַבֵּר קְצָת עִבְרִית", tr: "Ani medaber ktsat ivrit", fr: "Je parle un peu hébreu", en: "I speak a little Hebrew" } },
  { id: "i-ben-kama", group: "introductions", he: "?בֶּן כַּמָּה אַתָּה", tr: "Ben kama ata?", fr: "Quel âge as-tu ?", en: "How old are you?" },
  { id: "i-shana", group: "introductions", he: "שָׁנָה", tr: "shana", fr: "année", en: "year", atomic: true },
  { id: "i-tayar", group: "introductions", he: "תַּיָּר", tr: "tayar", fr: "touriste", en: "tourist", atomic: true },
  { id: "i-oleh", group: "introductions", he: "עוֹלֶה חָדָשׁ", tr: "oleh chadash", fr: "nouvel immigrant", en: "new immigrant", atomic: true },

  // --- family --------------------------------------------------------------
  { id: "f-mishpacha", group: "family", he: "מִשְׁפָּחָה", tr: "mishpacha", fr: "famille", en: "family", atomic: true },
  { id: "f-aba", group: "family", he: "אַבָּא", tr: "aba", fr: "papa", en: "dad", atomic: true },
  { id: "f-ima", group: "family", he: "אִמָּא", tr: "ima", fr: "maman", en: "mum", atomic: true },
  { id: "f-horim", group: "family", he: "הוֹרִים", tr: "horim", fr: "parents", en: "parents", atomic: true },
  { id: "f-ach", group: "family", he: "אָח", tr: "ach", fr: "frère", en: "brother", atomic: true },
  { id: "f-achot", group: "family", he: "אָחוֹת", tr: "achot", fr: "sœur", en: "sister", atomic: true },
  { id: "f-ben", group: "family", he: "בֵּן", tr: "ben", fr: "fils", en: "son", atomic: true },
  { id: "f-bat", group: "family", he: "בַּת", tr: "bat", fr: "fille (enfant)", en: "daughter", atomic: true },
  { id: "f-yeled", group: "family", he: "יֶלֶד", tr: "yeled", fr: "enfant / garçon", en: "child / boy", atomic: true },
  { id: "f-yalda", group: "family", he: "יַלְדָּה", tr: "yalda", fr: "petite fille", en: "girl", atomic: true },
  { id: "f-ish", group: "family", he: "אִישׁ", tr: "ish", fr: "homme", en: "man", atomic: true },
  { id: "f-isha", group: "family", he: "אִשָּׁה", tr: "isha", fr: "femme / épouse", en: "woman / wife", atomic: true },
  { id: "f-baal", group: "family", he: "בַּעַל", tr: "ba'al", fr: "mari", en: "husband", atomic: true },
  { id: "f-saba", group: "family", he: "סַבָּא", tr: "saba", fr: "grand-père", en: "grandfather", atomic: true },
  { id: "f-savta", group: "family", he: "סַבְתָּא", tr: "savta", fr: "grand-mère", en: "grandmother", atomic: true },
  { id: "f-chaver", group: "family", he: "חָבֵר / חֲבֵרָה", tr: "chaver / chavera", fr: "ami / amie", en: "friend (m/f)", atomic: true },
  { id: "f-nasui", group: "family", he: "נָשׂוּי / נְשׂוּאָה", tr: "nasui / nesu'a", fr: "marié / mariée", en: "married (m/f)", atomic: true },
  { id: "f-yesh-li-yeladim", group: "family", he: "יֵשׁ לִי שְׁנֵי יְלָדִים", tr: "Yesh li shnei yeladim", fr: "J'ai deux enfants", en: "I have two children" },

  // --- housing -------------------------------------------------------------
  { id: "h-bayit", group: "home", he: "בַּיִת", tr: "bayit", fr: "maison", en: "house", atomic: true },
  { id: "h-dira", group: "home", he: "דִּירָה", tr: "dira", fr: "appartement", en: "apartment", atomic: true },
  { id: "h-cheder", group: "home", he: "חֶדֶר", tr: "cheder", fr: "chambre / pièce", en: "room", atomic: true },
  { id: "h-mitbach", group: "home", he: "מִטְבָּח", tr: "mitbach", fr: "cuisine", en: "kitchen", atomic: true },
  { id: "h-sherutim", group: "home", he: "שֵׁרוּתִים", tr: "sherutim", fr: "toilettes", en: "toilet", atomic: true },
  { id: "h-miklachat", group: "home", he: "מִקְלַחַת", tr: "miklachat", fr: "douche", en: "shower", atomic: true },
  { id: "h-delet", group: "home", he: "דֶּלֶת", tr: "delet", fr: "porte", en: "door", atomic: true },
  { id: "h-chalon", group: "home", he: "חַלּוֹן", tr: "chalon", fr: "fenêtre", en: "window", atomic: true },
  { id: "h-shulchan", group: "home", he: "שֻׁלְחָן", tr: "shulchan", fr: "table", en: "table", atomic: true },
  { id: "h-kise", group: "home", he: "כִּסֵּא", tr: "kise", fr: "chaise", en: "chair", atomic: true },
  { id: "h-mita", group: "home", he: "מִטָּה", tr: "mita", fr: "lit", en: "bed", atomic: true },
  { id: "h-mafteach", group: "home", he: "מַפְתֵּחַ", tr: "mafteach", fr: "clé", en: "key", atomic: true },
  { id: "h-chashmal", group: "home", he: "חַשְׁמַל", tr: "chashmal", fr: "électricité", en: "electricity", atomic: true },
  { id: "h-mayim", group: "home", he: "מַיִם", tr: "mayim", fr: "eau", en: "water", atomic: true },
  { id: "h-shachen", group: "home", he: "שָׁכֵן", tr: "shachen", fr: "voisin", en: "neighbour", atomic: true },
  { id: "h-schirut", group: "home", he: "שְׂכִירוּת", tr: "schirut", fr: "loyer", en: "rent", atomic: true },
  { id: "h-koma", group: "home", he: "קוֹמָה", tr: "koma", fr: "étage", en: "floor / storey", atomic: true },
  { id: "h-gar-be", group: "home", he: "___ אֲנִי גָּר בְּ", tr: "Ani gar be-___", fr: "J'habite à ___", en: "I live in ___" },

  // --- getting around ------------------------------------------------------
  { id: "d-yamina", group: "directions", he: "יָמִינָה", tr: "yamina", fr: "à droite", en: "to the right", example: { he: "לִפְנוֹת יָמִינָה", tr: "Lifnot yamina", fr: "Tourner à droite", en: "Turn right" } },
  { id: "d-smola", group: "directions", he: "שְׂמֹאלָה", tr: "smola", fr: "à gauche", en: "to the left", example: { he: "לִפְנוֹת שְׂמֹאלָה", tr: "Lifnot smola", fr: "Tourner à gauche", en: "Turn left" } },
  { id: "d-yashar", group: "directions", he: "יָשָׁר", tr: "yashar", fr: "tout droit", en: "straight ahead", example: { he: "תֵּלֵךְ יָשָׁר", tr: "Telech yashar", fr: "Va tout droit", en: "Go straight" } },
  { id: "d-karov", group: "directions", he: "קָרוֹב", tr: "karov", fr: "près", en: "near", example: { he: "?זֶה קָרוֹב", tr: "Ze karov?", fr: "C'est près ?", en: "Is it near?" } },
  { id: "d-rachok", group: "directions", he: "רָחוֹק", tr: "rachok", fr: "loin", en: "far", example: { he: "זֶה רָחוֹק מִכָּאן", tr: "Ze rachok mikan", fr: "C'est loin d'ici", en: "It's far from here" } },
  { id: "d-kan", group: "directions", he: "כָּאן", tr: "kan", fr: "ici", en: "here", example: { he: "אֲנִי כָּאן", tr: "Ani kan", fr: "Je suis ici", en: "I'm here" } },
  { id: "d-sham", group: "directions", he: "שָׁם", tr: "sham", fr: "là-bas", en: "there", example: { he: "זֶה שָׁם", tr: "Ze sham", fr: "C'est là-bas", en: "It's over there" } },
  { id: "d-leyad", group: "directions", he: "לְיַד", tr: "leyad", fr: "à côté de", en: "next to", example: { he: "לְיַד הַתַּחֲנָה", tr: "Leyad ha-tachana", fr: "À côté de la gare", en: "Next to the station" } },
  { id: "d-mul", group: "directions", he: "מוּל", tr: "mul", fr: "en face de", en: "opposite", example: { he: "מוּל הַבַּיִת", tr: "Mul ha-bayit", fr: "En face de la maison", en: "Opposite the house" } },
  { id: "d-bein", group: "directions", he: "בֵּין", tr: "bein", fr: "entre", en: "between", example: { he: "בֵּין הַבַּיִת וְהַתַּחֲנָה", tr: "Bein ha-bayit ve-ha-tachana", fr: "Entre la maison et la gare", en: "Between the house and the station" } },
  { id: "d-tachana", group: "directions", he: "תַּחֲנָה", tr: "tachana", fr: "gare / arrêt", en: "station / stop", atomic: true },
  { id: "d-otobus", group: "directions", he: "אוֹטוֹבּוּס", tr: "otobus", fr: "bus", en: "bus", atomic: true },
  { id: "d-rakevet", group: "directions", he: "רַכֶּבֶת", tr: "rakevet", fr: "train", en: "train", atomic: true },
  { id: "d-monit", group: "directions", he: "מוֹנִית", tr: "monit", fr: "taxi", en: "taxi", atomic: true },
  { id: "d-rechov", group: "directions", he: "רְחוֹב", tr: "rechov", fr: "rue", en: "street", atomic: true },
  { id: "d-ktovet", group: "directions", he: "כְּתוֹבֶת", tr: "ktovet", fr: "adresse", en: "address", atomic: true },
  { id: "d-mapa", group: "directions", he: "מַפָּה", tr: "mapa", fr: "carte", en: "map", atomic: true },
  { id: "d-merkaz", group: "directions", he: "מֶרְכָּז", tr: "merkaz", fr: "centre", en: "centre", atomic: true },
  { id: "d-pina", group: "directions", he: "פִּנָּה", tr: "pina", fr: "coin", en: "corner", atomic: true },
  { id: "d-eich-magiim", group: "directions", he: "?___ אֵיךְ מַגִּיעִים לְ", tr: "Eich magi'im le-___?", fr: "Comment on va à ___ ?", en: "How do you get to ___?" },
];

/** A word you added yourself. Same shape, plus provenance. */
export interface CustomItem extends Item {
  group: "captured";
  createdAt: number;
  /** Where you met it — a tutor, a podcast, a sign. */
  source?: string;
}

/** Ids are content-derived so the same word imported twice doesn't duplicate. */
export function customId(he: string): string {
  const slug = he
    .normalize("NFC")
    // strip nikud so "בַּיִת" and "בית" are the same word
    .replace(/[֑-ׇ]/g, "")
    .replace(/\s+/g, "-");
  return `u-${slug}`;
}

/** Recognition (see Hebrew → know it) and recall (know it → produce Hebrew). */
export type Direction = "he2m" | "m2he";

export interface Card {
  id: string;
  itemId: string;
  direction: Direction;
}

/**
 * Two cards per item. Recognition first in queue order — it's the easier
 * direction and it seeds the recall card. Groups sort by the plan's own
 * ordering, so patterns are always introduced before the words filling them.
 */
export function makeCards(items: Item[]): Card[] {
  const byId = new Map(items.map((i) => [i.id, i]));
  return items
    .flatMap((item) => [
      { id: `${item.id}:he2m`, itemId: item.id, direction: "he2m" as Direction },
      { id: `${item.id}:m2he`, itemId: item.id, direction: "m2he" as Direction },
    ])
    .sort((a, b) => {
      const ga = GROUP_BY_ID[byId.get(a.itemId)!.group].order;
      const gb = GROUP_BY_ID[byId.get(b.itemId)!.group].order;
      if (ga !== gb) return ga - gb;
      if (a.direction !== b.direction) return a.direction === "he2m" ? -1 : 1;
      return 0;
    });
}

/** Curated items only. Merge with the profile's captured words via useDeck(). */
export const ITEM_BY_ID = Object.fromEntries(ITEMS.map((i) => [i.id, i]));
export const CARDS: Card[] = makeCards(ITEMS);
