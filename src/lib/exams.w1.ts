/**
 * Week 1 — the ulpan aleph test.
 *
 * Four sections of multiple choice, the personal-details form the class was
 * handed, and four gap-fill passages. The material is the classroom's, not the
 * programme's: it is whatever the teacher said would be on the test, which is
 * why it lives in its own file per week rather than being derived from the
 * corpus.
 *
 * Everything here is unpointed on purpose. The test is, and a vocalised drill
 * would train the wrong reading.
 */

import type { ClozePassage, ExamQuestion, FormField, Week } from "./exams.ts";

type Row = Omit<ExamQuestion, "id" | "part">;

/** Ids are positional: the bank is edited as a list, so the list is the key. */
const bank = (part: string, rows: Row[]): ExamQuestion[] =>
  rows.map((r, i) => ({ ...r, id: `${part}-${i + 1}`, part }));

/* --- 01 · verbs in the present tense -------------------------------------- */

const VERBS = bank("verbs", [
  { prompt: "אני ____ עברית באולפן.", en: "I study Hebrew at the ulpan.", tr: "ani ____ ivrit ba-ulpan", options: ["לומד", "לומדת", "לומדים", "לומדות"], answer: 0, note: "אני (זכר) → לומד", why: "Masculine singular." },
  { prompt: "דינה ____ בבית חולים.", en: "Dina works in a hospital.", tr: "Dina ____ be-veit cholim", options: ["עובד", "עובדת", "עובדים", "עובדות"], answer: 1, note: "דינה = היא → עובדת", why: "Feminine singular." },
  { prompt: "הסטודנטים ____ בספרייה.", en: "The students read in the library.", tr: "ha-studentim ____ ba-sifria", options: ["קורא", "קוראת", "קוראים", "קוראות"], answer: 2, note: "הסטודנטים = הם → קוראים", why: "Masculine plural." },
  { prompt: "הבנות ____ שיר יפה.", en: "The girls sing a beautiful song.", tr: "ha-banot ____ shir yafe", options: ["שר", "שרה", "שרים", "שרות"], answer: 3, note: "הבנות = הן → שרות", why: "Feminine plural." },
  { prompt: "אנחנו ____ בירושלים.", en: "We live in Jerusalem.", tr: "anachnu ____ bi-Yerushalayim", options: ["גר", "גרה", "גרים", "גרות"], answer: 2, note: "אנחנו → גרים", why: "A mixed or masculine group takes the masculine plural." },
  { prompt: "משה ואני ____ קפה בבוקר.", en: "Moshe and I drink coffee in the morning.", tr: "Moshe ve-ani ____ kafe ba-boker", options: ["שותה", "שותים", "שותות"], answer: 1, note: "משה ואני = אנחנו → שותים", why: "ל\"ה verb: שותה / שותה / שותים / שותות." },
  { prompt: "את ____ עברית טוב.", en: "You (f.) speak Hebrew well.", tr: "at ____ ivrit tov", options: ["מדבר", "מדברת", "מדברים", "מדברות"], answer: 1, note: "את → מדברת", why: "פיעל verb — starts with מ." },
  { prompt: "הם ____ לתל אביב באוטובוס.", en: "They travel to Tel Aviv by bus.", tr: "hem ____ le-Tel Aviv ba-otobus", options: ["נוסע", "נוסעת", "נוסעים", "נוסעות"], answer: 2, note: "הם → נוסעים", why: "Masculine plural." },
  { prompt: "הילדים ____ בגן.", en: "The children play in the kindergarten.", tr: "ha-yeladim ____ ba-gan", options: ["משחק", "משחקת", "משחקים", "משחקות"], answer: 2, note: "הילדים → משחקים", why: "Masculine plural." },
  { prompt: "אני ____ בשבע בבוקר.", en: "I (m.) get up at seven in the morning.", tr: "ani ____ be-sheva ba-boker", options: ["קם", "קמה", "קמים", "קמות"], answer: 0, note: "אני (זכר) → קם", why: "ע\"ו verb — no מ prefix." },
  { prompt: "אתה ____ מה השעה?", en: "Do you (m.) know what time it is?", tr: "ata ____ ma ha-sha'a", options: ["יודע", "יודעת", "יודעים", "יודעות"], answer: 0, note: "אתה → יודע", why: "Masculine singular." },
  { prompt: "המורה שרה ____ את הדלת.", en: "The teacher Sara opens the door.", tr: "ha-mora Sara ____ et ha-delet", options: ["פותח", "פותחת", "פותחים", "פותחות"], answer: 1, note: "המורה שרה = היא → פותחת", why: "Feminine singular." },
  { prompt: "הם ____ ארוחת ערב.", en: "They eat dinner.", tr: "hem ____ aruchat erev", options: ["אוכל", "אוכלת", "אוכלים", "אוכלות"], answer: 2, note: "הם → אוכלים", why: "Masculine plural." },
  { prompt: "רותי ____ מכתב לחברה.", en: "Ruti writes a letter to a friend.", tr: "Ruti ____ michtav le-chavera", options: ["כותב", "כותבת", "כותבים", "כותבות"], answer: 1, note: "רותי = היא → כותבת", why: "Feminine singular." },
  { prompt: "אנחנו ____ לאולפן כל יום.", en: "We go to the ulpan every day.", tr: "anachnu ____ la-ulpan kol yom", options: ["הולך", "הולכת", "הולכים", "הולכות"], answer: 2, note: "אנחנו → הולכים", why: "Masculine plural." },
  { prompt: "הילד ____ בלילה.", en: "The child sleeps at night.", tr: "ha-yeled ____ ba-laila", options: ["ישן", "ישנה", "ישנים", "ישנות"], answer: 0, note: "הילד → ישן", why: "Masculine singular — no מ prefix." },
  { prompt: "הנשים ____ בשוק.", en: "The women shop in the market.", tr: "ha-nashim ____ ba-shuk", options: ["קונה", "קונים", "קונות"], answer: 2, note: "הנשים = הן → קונות", why: "ל\"ה verb: קונה / קונה / קונים / קונות." },
  { prompt: "דוד ____ מוזיקה ישראלית.", en: "David loves Israeli music.", tr: "David ____ muzika yisre'elit", options: ["אוהב", "אוהבת", "אוהבים", "אוהבות"], answer: 0, note: "דוד = הוא → אוהב", why: "Masculine singular." },
  { prompt: "את ____ את השיעור?", en: "Do you (f.) understand the lesson?", tr: "at ____ et ha-shi'ur", options: ["מבין", "מבינה", "מבינים", "מבינות"], answer: 1, note: "את → מבינה", why: "הפעיל verb — מבין / מבינה / מבינים / מבינות." },
  { prompt: "הסטודנטיות ____ שאלה.", en: "The (female) students ask a question.", tr: "ha-studentiot ____ she'ela", options: ["שואל", "שואלת", "שואלים", "שואלות"], answer: 3, note: "הסטודנטיות = הן → שואלות", why: "Feminine plural." },
  { prompt: "דוד ____ הביתה בשש.", en: "David returns home at six.", tr: "David ____ ha-baita be-shesh", options: ["חוזר", "חוזרת", "חוזרים", "חוזרות"], answer: 0, note: "דוד → חוזר", why: "Masculine singular." },
  { prompt: "המלצר ____ קפה לאורחים.", en: "The waiter brings coffee to the guests.", tr: "ha-meltzar ____ kafe la-orchim", options: ["מביא", "מביאה", "מביאים", "מביאות"], answer: 0, note: "המלצר → מביא", why: "הפעיל verb, masculine singular." },
  { prompt: "אתם ____ בעברית?", en: "Do you (m. pl.) speak Hebrew?", tr: "atem ____ be-ivrit", options: ["מדבר", "מדברת", "מדברים", "מדברות"], answer: 2, note: "אתם → מדברים", why: "Masculine plural." },
  { prompt: "הילדות ____ בפארק.", en: "The girls run in the park.", tr: "ha-yeladot ____ ba-park", options: ["רץ", "רצה", "רצים", "רצות"], answer: 3, note: "הילדות = הן → רצות", why: "Feminine plural." },
  { prompt: "אמא ____ ארוחת ערב.", en: "Mum cooks dinner.", tr: "ima ____ aruchat erev", options: ["מבשל", "מבשלת", "מבשלים", "מבשלות"], answer: 1, note: "אמא = היא → מבשלת", why: "פיעל verb, feminine singular." },
  { prompt: "אנחנו ____ סרט בטלוויזיה.", en: "We watch a film on television.", tr: "anachnu ____ seret ba-televizia", options: ["רואה", "רואים", "רואות"], answer: 1, note: "אנחנו → רואים", why: "ל\"ה verb: רואה / רואה / רואים / רואות." },
  { prompt: "המורים ____ את השיעור בשתיים.", en: "The teachers finish the lesson at two.", tr: "ha-morim ____ et ha-shi'ur be-shtaim", options: ["גומר", "גומרת", "גומרים", "גומרות"], answer: 2, note: "המורים → גומרים", why: "Masculine plural." },
  { prompt: "היא ____ בבנק.", en: "She works in a bank.", tr: "hi ____ ba-bank", options: ["עובד", "עובדת", "עובדים", "עובדות"], answer: 1, note: "היא → עובדת", why: "Feminine singular." },
  { prompt: "אתה ____ לחם מהמכולת?", en: "Do you (m.) take bread from the grocery?", tr: "ata ____ lechem me-ha-makolet", options: ["לוקח", "לוקחת", "לוקחים", "לוקחות"], answer: 0, note: "אתה → לוקח", why: "Masculine singular." },
  { prompt: "הן ____ בשמונה בערב.", en: "They (f.) return at eight in the evening.", tr: "hen ____ bi-shmone ba-erev", options: ["חוזר", "חוזרת", "חוזרים", "חוזרות"], answer: 3, note: "הן → חוזרות", why: "Feminine plural." },
]);

/* --- 02 · זה · זאת · אלה ---------------------------------------------------- */

const DEMO = bank("demo", [
  { prompt: "____ ספר חדש.", en: "This is a new book.", tr: "____ sefer chadash", options: ["זה", "זאת", "אלה"], answer: 0, note: "ספר — זכר יחיד → זה", why: "Masculine singular noun." },
  { prompt: "____ מחברת.", en: "This is a notebook.", tr: "____ machberet", options: ["זה", "זאת", "אלה"], answer: 1, note: "מחברת — נקבה יחיד → זאת", why: "Feminine singular noun." },
  { prompt: "____ ילדים.", en: "These are children.", tr: "____ yeladim", options: ["זה", "זאת", "אלה"], answer: 2, note: "ילדים — רבים → אלה", why: "אלה covers both genders in the plural." },
  { prompt: "____ דלת.", en: "This is a door.", tr: "____ delet", options: ["זה", "זאת", "אלה"], answer: 1, note: "דלת — נקבה → זאת", why: "Feminine, even without a ה ending." },
  { prompt: "____ שולחן גדול.", en: "This is a big table.", tr: "____ shulchan gadol", options: ["זה", "זאת", "אלה"], answer: 0, note: "שולחן — זכר → זה", why: "Masculine singular." },
  { prompt: "____ נשים.", en: "These are women.", tr: "____ nashim", options: ["זה", "זאת", "אלה"], answer: 2, note: "נשים — רבות → אלה", why: "Plural." },
  { prompt: "____ מיטה.", en: "This is a bed.", tr: "____ mita", options: ["זה", "זאת", "אלה"], answer: 1, note: "מיטה — נקבה → זאת", why: "Feminine singular." },
  { prompt: "____ בית יפה.", en: "This is a beautiful house.", tr: "____ bait yafe", options: ["זה", "זאת", "אלה"], answer: 0, note: "בית — זכר → זה", why: "Masculine singular." },
  { prompt: "____ תמונות יפות.", en: "These are beautiful pictures.", tr: "____ tmunot yafot", options: ["זה", "זאת", "אלה"], answer: 2, note: "תמונות — רבות → אלה", why: "Plural." },
  { prompt: "____ עיר גדולה.", en: "This is a big city.", tr: "____ ir gdola", options: ["זה", "זאת", "אלה"], answer: 1, note: "עיר — נקבה → זאת", why: "עיר is feminine: עיר גדולה, not גדול." },
  { prompt: "____ כיסא.", en: "This is a chair.", tr: "____ kise", options: ["זה", "זאת", "אלה"], answer: 0, note: "כיסא — זכר → זה", why: "Masculine singular." },
  { prompt: "____ מכונית.", en: "This is a car.", tr: "____ mechonit", options: ["זה", "זאת", "אלה"], answer: 1, note: "מכונית — נקבה → זאת", why: "Nouns ending in ־ית are feminine." },
  { prompt: "____ אנשים.", en: "These are people.", tr: "____ anashim", options: ["זה", "זאת", "אלה"], answer: 2, note: "אנשים — רבים → אלה", why: "Plural." },
  { prompt: "____ עט.", en: "This is a pen.", tr: "____ et", options: ["זה", "זאת", "אלה"], answer: 0, note: "עט — זכר → זה", why: "Masculine singular." },
  { prompt: "____ כוס מים.", en: "This is a glass of water.", tr: "____ kos maim", options: ["זה", "זאת", "אלה"], answer: 1, note: "כוס — נקבה → זאת", why: "כוס is feminine." },
  { prompt: "____ חלונות.", en: "These are windows.", tr: "____ chalonot", options: ["זה", "זאת", "אלה"], answer: 2, note: "חלונות — רבים → אלה", why: "חלון is masculine but takes ־ות; still אלה." },
  { prompt: "____ משפחה גדולה.", en: "This is a big family.", tr: "____ mishpacha gdola", options: ["זה", "זאת", "אלה"], answer: 1, note: "משפחה — נקבה → זאת", why: "Feminine singular." },
  { prompt: "____ התיק שלי.", en: "This is my bag.", tr: "____ ha-tik sheli", options: ["זה", "זאת", "אלה"], answer: 0, note: "תיק — זכר → זה", why: "Masculine singular." },
  { prompt: "____ סטודנטיות מרוסיה.", en: "These are students from Russia.", tr: "____ studentiot me-Rusia", options: ["זה", "זאת", "אלה"], answer: 2, note: "סטודנטיות — רבות → אלה", why: "Plural." },
  { prompt: "מה ____? ספר.", en: "What is this? A book.", tr: "ma ____? sefer", options: ["זה", "זאת", "אלה"], answer: 0, note: "מה זה? — תמיד זה", why: "The set question is always מה זה?" },
  { prompt: "____ הכיתה שלנו.", en: "This is our classroom.", tr: "____ ha-kita shelanu", options: ["זה", "זאת", "אלה"], answer: 1, note: "כיתה — נקבה → זאת", why: "Feminine singular." },
  { prompt: "____ מורים טובים.", en: "These are good teachers.", tr: "____ morim tovim", options: ["זה", "זאת", "אלה"], answer: 2, note: "מורים — רבים → אלה", why: "Plural." },
]);

/* --- 03 · singular into plural -------------------------------------------- */

const PLURAL = bank("plural", [
  { prompt: "ספר → ____", en: "book → books", options: ["ספרים", "ספרות", "ספרם"], answer: 0, note: "ספר → ספרים", why: "Regular masculine: add ־ים." },
  { prompt: "מחברת → ____", en: "notebook → notebooks", options: ["מחברים", "מחברות", "מחברתים"], answer: 1, note: "מחברת → מחברות", why: "Feminine ־ת becomes ־ות." },
  { prompt: "ילדה → ____", en: "girl → girls", options: ["ילדים", "ילדות", "ילדאות"], answer: 1, note: "ילדה → ילדות", why: "Feminine ־ה becomes ־ות." },
  { prompt: "שולחן → ____", en: "table → tables", options: ["שולחנים", "שולחנות"], answer: 1, note: "שולחן → שולחנות", why: "Exception: masculine noun with a ־ות plural." },
  { prompt: "חלון → ____", en: "window → windows", options: ["חלונים", "חלונות"], answer: 1, note: "חלון → חלונות", why: "Same exception family as שולחן, מקום, רחוב." },
  { prompt: "איש → ____", en: "man → men", options: ["אישים", "אנשים", "אישות"], answer: 1, note: "איש → אנשים", why: "Fully irregular — memorise it." },
  { prompt: "אישה → ____", en: "woman → women", options: ["אישות", "נשים", "אישים"], answer: 1, note: "אישה → נשים", why: "Fully irregular — memorise it." },
  { prompt: "בית → ____", en: "house → houses", options: ["ביתים", "בתים", "ביתות"], answer: 1, note: "בית → בתים", why: "Irregular: batim." },
  { prompt: "עיר → ____", en: "city → cities", options: ["עירים", "ערים", "עירות"], answer: 1, note: "עיר → ערים", why: "Feminine noun with a masculine ־ים plural." },
  { prompt: "יום → ____", en: "day → days", options: ["ימים", "יומים", "ימות"], answer: 0, note: "יום → ימים", why: "Careful: יומיים means 'two days'." },
  { prompt: "שנה → ____", en: "year → years", options: ["שנות", "שנים", "שנאות"], answer: 1, note: "שנה → שנים", why: "Feminine noun with a masculine ־ים plural." },
  { prompt: "כיסא → ____", en: "chair → chairs", options: ["כיסאים", "כיסאות"], answer: 1, note: "כיסא → כיסאות", why: "Masculine noun, ־ות plural." },
  { prompt: "תלמיד → ____", en: "pupil → pupils", options: ["תלמידים", "תלמידות"], answer: 0, note: "תלמיד → תלמידים", why: "Regular masculine." },
  { prompt: "דלת → ____", en: "door → doors", options: ["דלתים", "דלתות"], answer: 1, note: "דלת → דלתות", why: "Feminine ־ות." },
  { prompt: "מקום → ____", en: "place → places", options: ["מקומים", "מקומות"], answer: 1, note: "מקום → מקומות", why: "Masculine noun, ־ות plural." },
  { prompt: "בן → ____", en: "son → sons", options: ["בנים", "בנות", "בנאים"], answer: 0, note: "בן → בנים", why: "בן → בנים, בת → בנות." },
  { prompt: "בת → ____", en: "daughter → daughters", options: ["בנים", "בנות", "בתות"], answer: 1, note: "בת → בנות", why: "Pairs with בן → בנים." },
  { prompt: "רחוב → ____", en: "street → streets", options: ["רחובים", "רחובות"], answer: 1, note: "רחוב → רחובות", why: "Masculine noun, ־ות plural." },
  { prompt: "כוס → ____", en: "glass → glasses", options: ["כוסים", "כוסות"], answer: 1, note: "כוס → כוסות", why: "Feminine ־ות." },
  { prompt: "מכונית → ____", en: "car → cars", options: ["מכוניתים", "מכוניות"], answer: 1, note: "מכונית → מכוניות", why: "־ית becomes ־יות." },
  { prompt: "חבר → ____", en: "friend → friends", options: ["חברים", "חברות"], answer: 0, note: "חבר → חברים", why: "חברה → חברות for the feminine." },
  { prompt: "נשים → ____", en: "women → woman", options: ["איש", "אישה", "בת"], answer: 1, note: "נשים → אישה", why: "Reverse direction — plural back to singular." },
  { prompt: "בתים → ____", en: "houses → house", options: ["בית", "בת", "בן"], answer: 0, note: "בתים → בית", why: "Reverse direction." },
  { prompt: "אנשים → ____", en: "people → man", options: ["אישה", "איש", "אנוש"], answer: 1, note: "אנשים → איש", why: "Reverse direction." },
]);

/* --- 04 · personal details and professions -------------------------------- */

const DETAILS = bank("details", [
  { prompt: "שם פרטי", en: "Which English matches?", options: ["first name", "last name", "nickname", "full name"], answer: 0, note: "שם פרטי = first name", why: "The first line of the form." },
  { prompt: "שם משפחה", en: "Which English matches?", options: ["first name", "last name", "address", "age"], answer: 1, note: "שם משפחה = last name", why: "Literally 'family name'." },
  { prompt: "ארץ לידה", en: "Which English matches?", options: ["date of birth", "country of birth", "current address", "citizenship"], answer: 1, note: "ארץ לידה = country of birth", why: "ארץ = country, לידה = birth." },
  { prompt: "תאריך לידה", en: "Which English matches?", options: ["country of birth", "date of birth", "today's date", "age"], answer: 1, note: "תאריך לידה = date of birth", why: "תאריך = date." },
  { prompt: "מספר ת.ז.", en: "Which English matches?", options: ["phone number", "ID number", "house number", "bank account"], answer: 1, note: "ת.ז. = תעודת זהות — ID number", why: "Nine digits, one per box on the form." },
  { prompt: "מצב משפחתי", en: "Which English matches?", options: ["family size", "marital status", "home town", "occupation"], answer: 1, note: "מצב משפחתי = marital status", why: "Answers: נשוי / רווק / גרוש / אלמן." },
  { prompt: "מספר ילדים", en: "Which English matches?", options: ["number of children", "children's names", "number of siblings", "school number"], answer: 0, note: "מספר ילדים = number of children", why: "מספר = number." },
  { prompt: "כתובת", en: "Which English matches?", options: ["address", "phone number", "signature", "profession"], answer: 0, note: "כתובת = address", why: "רחוב = street, מספר = number." },
  { prompt: "גיל", en: "Which English matches?", options: ["gender", "age", "height", "name"], answer: 1, note: "גיל = age", why: "Question: בן כמה אתה? / בת כמה את?" },
  { prompt: "single (male)", en: "Which Hebrew matches?", options: ["נשוי", "רווק", "גרוש", "אלמן"], answer: 1, note: "רווק = single", why: "רווקה for a woman." },
  { prompt: "married (female)", en: "Which Hebrew matches?", options: ["נשוי", "נשואה", "רווקה", "גרושה"], answer: 1, note: "נשואה = married (f.)", why: "נשוי for a man." },
  { prompt: "divorced (male)", en: "Which Hebrew matches?", options: ["אלמן", "גרוש", "רווק", "נשוי"], answer: 1, note: "גרוש = divorced", why: "גרושה for a woman." },
  { prompt: "אלמן", en: "Which English matches?", options: ["single", "divorced", "widower", "married"], answer: 2, note: "אלמן = widower", why: "אלמנה = widow." },
  { prompt: "?איך קוראים לך", en: "What is this question asking for?", tr: "eich kor'im lecha?", options: ["your name", "your age", "your address", "your job"], answer: 0, note: "איך קוראים לך? — קוראים לי…", why: "Literally 'what do they call you?'" },
  { prompt: "?בן כמה אתה", en: "What is this question asking for?", tr: "ben kama ata?", options: ["your name", "your age", "your family", "your street"], answer: 1, note: "בן כמה אתה? — אני בן…", why: "בת כמה את? for a woman." },
  { prompt: "?מאיפה אתה", en: "What is this question asking for?", tr: "me-eifo ata?", options: ["where you live now", "where you are from", "where you work", "where you study"], answer: 1, note: "מאיפה אתה? — אני מ…", why: "איפה אתה גר? asks where you live now." },
  { prompt: "?מה המקצוע שלך", en: "What is this question asking for?", tr: "ma ha-miktzo'a shelcha?", options: ["your hobby", "your profession", "your studies", "your address"], answer: 1, note: "מקצוע = profession", why: "Answer: אני רופא / אני סטודנט…" },
  { prompt: "עובד בבית חולים ומטפל בחולים", en: "Which profession?", tr: "oved be-veit cholim", options: ["מורה", "רופא", "נהג", "פקיד"], answer: 1, note: "רופא", why: "רופאה for a woman." },
  { prompt: "מלמד בבית ספר", en: "Which profession?", tr: "melamed be-veit sefer", options: ["מורה", "מהנדס", "מלצר", "שוטר"], answer: 0, note: "מורה", why: "מורה works for both genders in the singular." },
  { prompt: "עובד במסעדה ומביא אוכל", en: "Which profession?", tr: "oved be-mis'ada", options: ["טבח", "מלצר", "מוכר", "גנן"], answer: 1, note: "מלצר", why: "מלצרית for a woman; טבח is the cook." },
  { prompt: "נוהג באוטובוס", en: "Which profession?", tr: "noheg be-otobus", options: ["נהג", "שוטר", "פקיד", "מנהל"], answer: 0, note: "נהג", why: "נהגת for a woman." },
  { prompt: "כותב תוכנות במחשב", en: "Which profession?", tr: "kotev tochnot ba-machshev", options: ["מהנדס", "מתכנת", "כלכלן", "מנהל"], answer: 1, note: "מתכנת", why: "מתכנתת for a woman." },
  { prompt: "לומד באוניברסיטה", en: "Which profession?", tr: "lomed ba-universita", options: ["מורה", "סטודנט", "מנהל", "תלמיד"], answer: 1, note: "סטודנט", why: "תלמיד is a school pupil." },
  { prompt: "עובד במשטרה", en: "Which profession?", tr: "oved ba-mishtara", options: ["חייל", "שוטר", "נהג", "פקיד"], answer: 1, note: "שוטר", why: "חייל is a soldier." },
  { prompt: "מוכר בחנות", en: "Which profession?", tr: "mocher ba-chanut", options: ["מוכר", "פקיד", "מלצר", "טבח"], answer: 0, note: "מוכר", why: "מוכרת for a woman." },
  { prompt: "רופא → ____ (נקבה)", en: "Feminine form", options: ["רופאת", "רופאה", "רופאית"], answer: 1, note: "רופא → רופאה", why: "Add ־ה." },
  { prompt: "מלצר → ____ (נקבה)", en: "Feminine form", options: ["מלצרה", "מלצרית", "מלצרת"], answer: 1, note: "מלצר → מלצרית", why: "־ית ending." },
  { prompt: "סטודנט → ____ (נקבה)", en: "Feminine form", options: ["סטודנטה", "סטודנטית", "סטודנטת"], answer: 1, note: "סטודנט → סטודנטית", why: "־ית ending." },
  { prompt: "פקיד → ____ (נקבה)", en: "Feminine form", options: ["פקידה", "פקידית", "פקידת"], answer: 0, note: "פקיד → פקידה", why: "Add ־ה." },
  { prompt: "נהג → ____ (נקבה)", en: "Feminine form", options: ["נהגה", "נהגת", "נהגית"], answer: 1, note: "נהג → נהגת", why: "־ת ending." },
  { prompt: "מנהל → ____ (נקבה)", en: "Feminine form", options: ["מנהלה", "מנהלת", "מנהלית"], answer: 1, note: "מנהל → מנהלת", why: "־ת ending." },
  { prompt: "שוטר → ____ (נקבה)", en: "Feminine form", options: ["שוטרה", "שוטרת", "שוטרית"], answer: 1, note: "שוטר → שוטרת", why: "־ת ending." },
  { prompt: "מהנדס → ____ (נקבה)", en: "Feminine form", options: ["מהנדסה", "מהנדסת", "מהנדסית"], answer: 1, note: "מהנדס → מהנדסת", why: "־ת ending." },
]);

/* --- 05 · the form ---------------------------------------------------------
 *
 * Nothing typed here is ever stored. It is a real identity form — name, date
 * of birth, ת.ז. — and this app's profiles are a username with an optional
 * four-digit PIN, which the README is explicit is not authentication. The
 * exercise is writing the Hebrew, not keeping the record.
 */

const FORM: FormField[] = [
  { key: "first", he: "שם פרטי", en: "First name", hint: "ולאד", kind: "text" },
  { key: "last", he: "שם משפחה", en: "Last name / surname", kind: "text" },
  { key: "land", he: "ארץ לידה", en: "Country of birth", hint: "שווייץ", kind: "text" },
  { key: "born", he: "תאריך לידה", en: "Date of birth — day / month / year", hint: "12.05.2000", kind: "text" },
  { key: "tz", he: "מספר ת.ז.", en: "ID number (תעודת זהות) — 9 digits, one per box", kind: "boxes" },
  {
    key: "status",
    he: "מצב משפחתי",
    en: "Marital status — circle one",
    kind: "chips",
    options: [
      ["רווק", "single (m.)"],
      ["רווקה", "single (f.)"],
      ["נשוי", "married (m.)"],
      ["נשואה", "married (f.)"],
      ["גרוש", "divorced (m.)"],
      ["גרושה", "divorced (f.)"],
      ["אלמן", "widower"],
      ["אלמנה", "widow"],
    ],
  },
  { key: "kids", he: "מספר ילדים", en: "Number of children", hint: "0", kind: "text" },
  { key: "job", he: "מקצוע", en: "Profession", hint: "פיננסים", kind: "text" },
  { key: "addr", he: "כתובת", en: "Address — street, number, city", hint: "רחוב יפו 5, ירושלים", kind: "text" },
  { key: "tel", he: "מספר טלפון", en: "Phone number", hint: "05…", kind: "text" },
];

/* --- 06 · gap-fill ---------------------------------------------------------
 *
 * The section that carries the most marks, because it recycles the other four
 * at once: a verb agreeing with its subject, זה/זאת, and a plural, inside a
 * text rather than on their own.
 */

const PASSAGES: ClozePassage[] = [
  {
    id: "p1",
    title: "יום באולפן",
    en: "A day at the ulpan — fill the verbs into the text.",
    text: "שלום! קוראים לי דוד. אני {0} בירושלים. בבוקר אני {1} קפה ו{2} לאולפן. באולפן אני {3} עברית עם המורה. אחרי השיעור אני {4} הביתה ו{5} ארוחת צהריים. בערב אני {6} מוזיקה ו{7} ספר.",
    answers: ["גר", "שותה", "הולך", "לומד", "חוזר", "אוכל", "שומע", "קורא"],
    decoys: ["גרה", "לומדים"],
  },
  {
    id: "p2",
    title: "פרטים אישיים",
    en: "Personal details — fill in the missing words.",
    text: "נעים מאוד! ה{0} הפרטי שלי הוא מיכל, ושם ה{1} שלי הוא לוי. אני {2}, אבל עכשיו אני {3} בתל אביב. אני {4} עשרים ושש. אני {5} ואין לי {6}. אני {7} בבית חולים — אני רופאה.",
    answers: ["שם", "משפחה", "מרוסיה", "גרה", "בת", "רווקה", "ילדים", "עובדת"],
    decoys: ["בן", "נשוי"],
  },
  {
    id: "p3",
    title: "זה, זאת, אלה",
    en: "Demonstratives and plurals — fill in the text.",
    text: "{0} האולפן שלי. {1} המורה שלי, קוראים לה שרה. {2} התלמידים בכיתה — יש פה {3} מכל העולם. על השולחן יש {4} ומחברות. {5} הכיסא שלי, ו{6} הדלת.",
    answers: ["זה", "זאת", "אלה", "אנשים", "ספרים", "זה", "זאת"],
    decoys: ["אלה", "נשים"],
  },
  {
    id: "p4",
    title: "המשפחה שלי",
    en: "My family — verbs and plurals together.",
    text: "יש לי משפחה גדולה. ההורים שלי {0} בחיפה. יש לי שני {1} ושתי {2}. אח שלי {3} באוניברסיטה, והאחיות שלי {4} בבית ספר. בשבת אנחנו {5} ביחד ו{6} על החיים. אני מאוד {7} את המשפחה שלי.",
    answers: ["גרים", "אחים", "אחיות", "לומד", "לומדות", "אוכלים", "מדברים", "אוהב"],
    decoys: ["גרות", "לומדים"],
  },
];

export const WEEK_1: Week = {
  id: "w1",
  n: 1,
  he: "מבחן אולפן א׳",
  en: "Ulpan aleph — the first test",
  brief:
    "Four things the teacher said would be on it: the present tense, זה/זאת/אלה, singular into plural, and the personal-details form. The gap-fill is where the marks sit — it asks for all four at once.",
  sections: [
    { id: "verbs", n: "01", he: "הפעלים", en: "Verbs — present tense", kind: "quiz" },
    { id: "demo", n: "02", he: "זה · זאת · אלה", en: "Demonstratives", kind: "quiz" },
    { id: "plural", n: "03", he: "יחיד · רבים", en: "Singular & plural", kind: "quiz" },
    { id: "details", n: "04", he: "פרטים אישיים ומקצוע", en: "Personal details & professions", kind: "quiz" },
    { id: "form", n: "05", he: "טופס פרטים אישיים", en: "The form, filled in", kind: "form" },
    { id: "cloze", n: "06", he: "השלמת מילים בטקסט", en: "Gap-fill passages", kind: "cloze" },
  ],
  questions: [...VERBS, ...DEMO, ...PLURAL, ...DETAILS],
  form: FORM,
  passages: PASSAGES,
};
