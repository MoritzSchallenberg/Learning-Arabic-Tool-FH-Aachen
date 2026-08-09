#!/usr/bin/env node
// Entwicklungsauftrag 7, Batch 2 (Units 6-10) — ersetzt die 15 Platzhalter-Theoriedokumente
// dieser Units durch vollständige, auf die jeweiligen 10 Wörter zugeschnittene Theorie.
// Idempotent (ersetzt anhand der theory_id, egal ob Platzhalter oder bereits echt).

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const THEORY_PATH = path.join(ROOT, 'language-packs', 'arabic', 'theory.json');

function mc(question, options) { return { question, options }; }
function opt(text, correct) { return { text, correct }; }

const DOCS = [
  // ============================== UNIT 6 (Uhrzeit/Kalender) ==============================
  {
    theory_id: 'theory_vocab_unit_06_a',
    title: 'Uhrzeit, Wochentage, Monate und Kalender (1)',
    content_status: 'needs_language_review',
    learning_objectives: [
      'Uhrzeit (Stunde/Minute) von Tageszeiten (Morgen/Mittag/Abend/Nacht) unterscheiden.',
      '„heute“/„gestern“ in einfachen Sätzen verwenden.',
      'Die bereits bekannten Tageszeiten mit den neuen Zeitwörtern kombinieren.'
    ],
    blocks: [
      { type: 'paragraph', text: 'In dieser Session lernst du den Unterschied zwischen zwei verwandten, aber unterschiedlichen Konzepten: der Uhrzeit (سَاعَة für Stunde, دَقِيقَة für Minute — die konkrete Zahl auf der Uhr) und der Tageszeit (صَبَاح Morgen, ظُهْر Mittag, مَسَاء Abend, لَيْل Nacht — die du bereits aus dem Bestand kennst). Im Deutschen verwenden wir für beides oft dasselbe Wort „Zeit“, im Arabischen sind es klar getrennte Begriffe.' },
      { type: 'paragraph', text: 'سَاعَة hat übrigens zwei Bedeutungen gleichzeitig: „Stunde“ als Zeiteinheit UND „Uhr“ als Gerät bzw. in der Frage كَمِ السَّاعَة؟ („Wie viel Uhr ist es?“, wörtlich „wie viel die Stunde“). Das ist kein Zufall — im Deutschen sagen wir ja auch „Ich schaue auf die Uhr“ für das Gerät und „Es ist eine Stunde vergangen“ für die Zeiteinheit, mit demselben Wortstamm. Für den zeitlichen Bezug zum aktuellen Tag lernst du اَلْيَوْم („heute“) und أَمْس („gestern“). Beachte: اَلْيَوْم trägt den bestimmten Artikel الْ, obwohl es adverbial („heute“) verwendet wird — eine feste Ausnahme, die du dir einfach merken musst.' },
      { type: 'heading', level: 'full', text: 'Mehr erfahren: Vorschau auf vollständige Uhrzeiten' },
      { type: 'paragraph', level: 'full', text: 'Um eine genaue Uhrzeit zu sagen (z. B. „Es ist drei Uhr“), kombiniert man im Arabischen die Zahl mit سَاعَة in einer bestimmten Struktur (السَّاعَةُ الثَّالِثَة, wörtlich „die Stunde die dritte“). Diese vollständige Struktur lernst du hier noch nicht — merke dir für diese Session nur, dass سَاعَة der Grundbaustein dafür ist.' },
      { type: 'callout', variant: 'tip', title: 'Merke', text: 'سَاعَة = Stunde UND Uhr (Gerät/Frage) — der Kontext entscheidet, welche Bedeutung gemeint ist.' },
      { type: 'callout', variant: 'info', title: 'Typischer Fehler', text: 'اَلْيَوْم (heute, MIT Artikel) wird oft mit يَوْم (Tag, OHNE Artikel, aus einer späteren Session) verwechselt — nur اَلْيَوْم mit Artikel bedeutet „heute“.' },
      { type: 'example', arabic: 'صَبَاحَ الْخَيْر! كَمِ السَّاعَة؟', translation: 'Guten Morgen! Wie viel Uhr ist es?', note: 'صَبَاحَ الْخَيْر kennst du bereits aus Unit 1.' },
      { type: 'example', arabic: 'اَلْيَوْمَ لَيْسَ أَمْس.', translation: 'Heute ist nicht gestern.', note: 'لَيْسَ (ist nicht) hier nur zur Veranschaulichung markiert.' },
      { type: 'example', arabic: 'دَقِيقَة وَاحِدَة', translation: 'eine Minute', note: 'وَاحِدَة ist die feminine Form von „eins“ aus Unit 5.' },
      { type: 'word_preview', word_ids: ['time_morning', 'time_noon', 'time_evening', 'time_night', 'time_day', 'time_week', 'c1_u06_01', 'c1_u06_02', 'c1_u06_03', 'c1_u06_04'] },
      { type: 'mini_check', questions: [
        mc('سَاعَة kann bedeuten…', [opt('Stunde ODER Uhr', true), opt('nur Minute', false)]),
        mc('Welches Wort trägt einen festen bestimmten Artikel, obwohl es „heute“ bedeutet?', [opt('اَلْيَوْم', true), opt('أَمْس', false)]),
        mc('أَمْس bedeutet…', [opt('gestern', true), opt('morgen', false)])
      ] }
    ]
  },
  {
    theory_id: 'theory_vocab_unit_06_b',
    title: 'Uhrzeit, Wochentage, Monate und Kalender (2)',
    content_status: 'needs_language_review',
    learning_objectives: [
      'Alle sieben Wochentage in der richtigen Reihenfolge benennen.',
      '„morgen“ (Adverb) von „Morgen“ (Tageszeit) unterscheiden.',
      'Die ersten beiden Monatsnamen erkennen.'
    ],
    blocks: [
      { type: 'paragraph', text: 'غَداً (morgen, der nächste Tag) klingt im Deutschen fast wie صَبَاح (Morgen, Tageszeit) — im Arabischen haben die beiden Konzepte aber nichts miteinander zu tun, ganz anders als im Deutschen, wo „Morgen“ historisch beide Bedeutungen trägt. Achte in Übungen genau darauf, welches der beiden Wörter gefragt ist.' },
      { type: 'paragraph', text: 'Die sieben Wochentage folgen alle demselben Bauplan: bestimmter Artikel الْ + eine vom arabischen Zahlwort abgeleitete oder eigenständige Form. Der „erste“ Wochentag im arabischsprachigen Kulturraum ist historisch اَلْأَحَد (Sonntag) — اَلِاثْنَيْن („der Zweite“) ist folgerichtig der Montag, اَلثُّلَاثَاء („der Dritte“) der Dienstag, bis اَلْخَمِيس („der Fünfte“, Donnerstag). Nur اَلْجُمُعَة (Freitag, wörtlich „die Versammlung“) und اَلسَّبْت (Samstag, verwandt mit dem hebräischen „Schabbat“) fallen aus diesem Zählmuster heraus. Bei den Monatsnamen beginnst du mit يَنَايِر (Januar) und فِبْرَايِر (Februar) — wie die meisten arabischen Monatsnamen im MSA-Alltagsgebrauch direkt aus dem Englischen/Lateinischen entlehnt und daher gut wiederzuerkennen.' },
      { type: 'heading', level: 'full', text: 'Mehr erfahren: warum klingen die Monatsnamen so vertraut?' },
      { type: 'paragraph', level: 'full', text: 'Das moderne Hocharabisch verwendet im Alltag meist die international gebräuchlichen (aus dem Westen entlehnten) Monatsnamen, wie du sie hier lernst. Daneben existieren in einigen Ländern (v. a. Levante/Irak) auch traditionelle, rein arabische Monatsnamen — diese sind aber regional unterschiedlich und werden hier bewusst nicht gelehrt, um Verwirrung zu vermeiden.' },
      { type: 'callout', variant: 'tip', title: 'Merke', text: 'Die Wochentage 2-5 sind von den Zahlen 2-5 abgeleitet (Montag = „der Zweite“ usw.) — nützlich, um sie sich zu merken.' },
      { type: 'callout', variant: 'info', title: 'Typischer Fehler', text: 'غَداً (morgen) wird gelegentlich mit dem ähnlich klingenden غَدَاء (Mittagessen, aus Unit 10) verwechselt — beide teilen dieselbe Wurzel, bedeuten aber etwas ganz anderes.' },
      { type: 'example', arabic: 'أَرَاكَ غَداً!', translation: 'Bis morgen!', note: 'Nutzt das Muster von أَرَاكَ لَاحِقاً aus Unit 1.' },
      { type: 'example', arabic: 'اَلِاثْنَيْن بَعْدَ الْأَحَد.', translation: 'Montag kommt nach Sonntag.', note: 'بَعْدَ (nach) hier nur zur Veranschaulichung markiert.' },
      { type: 'example', arabic: 'يَنَايِر أَوَّلُ الشُّهُور.', translation: 'Januar ist der erste Monat.', note: 'أَوَّلُ الشُّهُور hier nur zur Veranschaulichung markiert.' },
      { type: 'word_preview', word_ids: ['c1_u06_05', 'c1_u06_06', 'c1_u06_07', 'c1_u06_08', 'c1_u06_09', 'c1_u06_10', 'c1_u06_11', 'c1_u06_12', 'c1_u06_13', 'c1_u06_14'] },
      { type: 'mini_check', questions: [
        mc('Welcher Wochentag ist von der Zahl „fünf“ abgeleitet?', [opt('اَلْخَمِيس', true), opt('اَلْجُمُعَة', false)]),
        mc('غَداً bedeutet…', [opt('morgen, der nächste Tag', true), opt('Morgen, die Tageszeit', false)]),
        mc('Welcher Monat kommt vor فِبْرَايِر؟', [opt('يَنَايِر', true), opt('مَارِس', false)])
      ] }
    ]
  },
  {
    theory_id: 'theory_vocab_unit_06_c',
    title: 'Uhrzeit, Wochentage, Monate und Kalender (3)',
    content_status: 'needs_language_review',
    learning_objectives: [
      'Alle zwölf Monatsnamen des Jahres kennen.',
      'Ähnlich klingende Monatsnamen (Juni/Juli) sicher unterscheiden.',
      'Datumsangaben (Tag + Monat) im Ansatz verstehen.'
    ],
    blocks: [
      { type: 'paragraph', text: 'Diese Session vervollständigt den Kalender mit den restlichen zehn Monaten مَارِس (März) bis دِيسَمْبِر (Dezember). Wie schon in der letzten Session zu beobachten, folgen fast alle Monatsnamen im MSA-Alltagsgebrauch der internationalen Reihenfolge und klingen den deutschen/englischen Namen ähnlich — يُونِيُو (Juni) und يُولِيُو (Juli) etwa unterscheiden sich nur im mittleren Konsonanten (ن vs ل), genau wie im Deutschen „Juni“ und „Juli“ sich nur in einem Buchstaben unterscheiden.' },
      { type: 'paragraph', text: 'Mit allen zwölf Monaten zusammen kannst du jetzt vollständige Datumsangaben verstehen, die typischerweise als „Tag + Monatsname + Jahr“ aufgebaut sind, ähnlich wie im Deutschen.' },
      { type: 'heading', level: 'full', text: 'Mehr erfahren: Vorschau auf Datumsangaben' },
      { type: 'paragraph', level: 'full', text: 'Ein vollständiges Datum wie „der 5. Oktober“ braucht zusätzlich Ordnungszahlen („der Fünfte“) statt der Grundzahlen, die du in Unit 5 gelernt hast — das ist eine eigene Grammatikstruktur, die in einer späteren Einheit eingeführt wird. Für diese Session reicht es, die Monatsnamen selbst sicher zu erkennen.' },
      { type: 'callout', variant: 'tip', title: 'Merke', text: 'يُونِيُو (Juni) und يُولِيُو (Juli) unterscheiden sich nur in einem einzigen Buchstaben (ن vs ل) — bei Verwechslungsgefahr auf die Wortmitte achten.' },
      { type: 'callout', variant: 'info', title: 'Typischer Fehler', text: 'أَغُسْطُس (August) wird von Anfängern manchmal mit أُكْتُوبِر (Oktober) verwechselt, weil beide recht lang sind — beide beginnen aber mit unterschiedlichen Buchstaben.' },
      { type: 'example', arabic: 'دِيسَمْبِر آخِرُ الشُّهُور.', translation: 'Dezember ist der letzte Monat.', note: 'آخِرُ الشُّهُور hier nur zur Veranschaulichung markiert.' },
      { type: 'example', arabic: 'يُونِيُو، يُولِيُو، أَغُسْطُس', translation: 'Juni, Juli, August', note: 'Die drei Sommermonate in Europa.' },
      { type: 'example', arabic: 'مَارِس، أَبْرِيل، مَايُو', translation: 'März, April, Mai', note: 'Die drei Frühlingsmonate in Europa.' },
      { type: 'word_preview', word_ids: ['c1_u06_15', 'c1_u06_16', 'c1_u06_17', 'c1_u06_18', 'c1_u06_19', 'c1_u06_20', 'c1_u06_21', 'c1_u06_22', 'c1_u06_23', 'c1_u06_24'] },
      { type: 'mini_check', questions: [
        mc('Welche zwei Monate unterscheiden sich nur in einem Buchstaben?', [opt('يُونِيُو und يُولِيُو', true), opt('مَارِس und مَايُو', false)]),
        mc('نُوفَمْبِر bedeutet…', [opt('November', true), opt('September', false)]),
        mc('Welcher Monat ist der letzte im Jahr?', [opt('دِيسَمْبِر', true), opt('أُكْتُوبِر', false)])
      ] }
    ]
  },
  // ============================== UNIT 7 (Farben/Formen/Materialien) ==============================
  {
    theory_id: 'theory_vocab_unit_07_a',
    title: 'Farben, Formen und Materialien (1)',
    content_status: 'needs_language_review',
    learning_objectives: [
      'Die sechs Grundfarben aus dem Bestand um vier weitere Farbtöne ergänzen.',
      'Erkennen, dass die neuen Farben nach einem anderen Muster gebildet sind als die Grundfarben.',
      'Verstehen, dass „orange“ gleichzeitig Farbname und Fruchtname sein kann.'
    ],
    blocks: [
      { type: 'paragraph', text: 'Du kennst aus dem Bestand bereits sechs Grundfarben (أَحْمَر rot, أَزْرَق blau, أَصْفَر gelb, أَخْضَر grün, أَسْوَد schwarz, أَبْيَض weiß) — alle sechs folgen demselben Bauplan أَ + drei Konsonanten. Die vier neuen Farben dieser Session (بُرْتُقَالِيّ orange, بَنَفْسَجِيّ violett, وَرْدِيّ rosa, بُنِّيّ braun) folgen dagegen einem ANDEREN Muster: Sie enden alle auf ي und sind von einem Substantiv abgeleitet — بُرْتُقَالِيّ (orange) kommt direkt von بُرْتُقَال (die Orangenfrucht, die du in Unit 9 kennenlernst), وَرْدِيّ (rosa) von وَرْدَة (Rose). Das ist dieselbe ي-Endung (nisba), die du bereits bei Staatsangehörigkeiten (أَلْمَانِيّ) aus Unit 4 kennengelernt hast — nur diesmal nicht von einem Land, sondern von einer Pflanze/Frucht abgeleitet.' },
      { type: 'paragraph', text: 'Wie im Deutschen kann ein Farbname gleichzeitig der Name einer Frucht sein: بُرْتُقَالِيّ (die Farbe Orange) klingt fast wie بُرْتُقَال (die Frucht Orange) — kein Zufall, sondern derselbe Wortstamm.' },
      { type: 'heading', level: 'full', text: 'Mehr erfahren: Vorschau auf Farbadjektive und Genus' },
      { type: 'paragraph', level: 'full', text: 'Die sechs Grundfarben (أَحْمَر-Muster) haben eine eigene feminine Form (أَحْمَر → حَمْرَاء für „rote“ bei femininen Substantiven) — diese vollständige Anpassung lernst du erst in einer späteren Grammatik-Einheit. Die neuen ي-Farben dieser Session verhalten sich dagegen wie gewöhnliche nisba-Adjektive und bekommen nur ein einfaches ة für die feminine Form.' },
      { type: 'callout', variant: 'tip', title: 'Merke', text: 'Die vier neuen Farben dieser Session enden alle auf ي — ein anderes Bauprinzip als die sechs Grundfarben aus dem Bestand.' },
      { type: 'callout', variant: 'info', title: 'Typischer Fehler', text: 'أَخْضَر (grün) und أَزْرَق (blau) werden von Anfängern gelegentlich verwechselt, da beide mit أَ beginnen und „kühle“ Farben bezeichnen — der Rest des Wortes unterscheidet sich aber deutlich.' },
      { type: 'example', arabic: 'قَمِيصٌ بُرْتُقَالِيّ', translation: 'ein oranges Hemd', note: 'قَمِيص (Hemd) hier nur zur Veranschaulichung markiert.' },
      { type: 'example', arabic: 'أَحْمَر وَأَزْرَق', translation: 'rot und blau', note: 'Zwei Grundfarben aus dem Bestand.' },
      { type: 'example', arabic: 'لَوْنٌ بَنَفْسَجِيّ', translation: 'eine violette Farbe', note: 'لَوْن (Farbe) als Vorschau auf Unit 12.' },
      { type: 'word_preview', word_ids: ['color_red', 'color_blue', 'color_yellow', 'color_green', 'color_black', 'color_white', 'c1_u07_01', 'c1_u07_02', 'c1_u07_03', 'c1_u07_04'] },
      { type: 'mini_check', questions: [
        mc('Welche Farbe ist vom Wort für die Frucht „Orange“ abgeleitet?', [opt('بُرْتُقَالِيّ', true), opt('وَرْدِيّ', false)]),
        mc('Welches Suffix haben alle vier neuen Farben dieser Session gemeinsam?', [opt('ي', true), opt('ة', false)]),
        mc('بُنِّيّ bedeutet…', [opt('braun', true), opt('grau', false)])
      ] }
    ]
  },
  {
    theory_id: 'theory_vocab_unit_07_b',
    title: 'Farben, Formen und Materialien (2)',
    content_status: 'needs_language_review',
    learning_objectives: [
      'Die letzte Grundfarbe (grau) sowie geometrische Grundformen benennen.',
      'Erste Materialwörter (Holz, Metall, Glas) erkennen.',
      'Punkt und Linie als Bausteine geometrischer Formen verstehen.'
    ],
    blocks: [
      { type: 'paragraph', text: 'رَمَادِيّ (grau) schließt die Farbreihe ab und folgt wie die vier Farben aus der letzten Session dem ي-Muster (abgeleitet von رَمَاد, „Asche“ — grau wie Asche, ganz ähnlich wie im Deutschen „aschgrau“). Danach wechselt die Session zu geometrischen Grundformen: دَائِرَة (Kreis), مُرَبَّع (Quadrat), مُثَلَّث (Dreieck) und مُسْتَطِيل (Rechteck).' },
      { type: 'paragraph', text: 'Zwei einfachere geometrische Bausteine ergänzen die Liste: خَطّ (Linie) und نُقْطَة (Punkt) — aus vielen نُقْطَة entsteht ein خَطّ, aus mehreren خَطّ entsteht z. B. ein مُثَلَّث. Zum Schluss beginnst du mit Materialwörtern: خَشَب (Holz), مَعْدِن (Metall) und زُجَاج (Glas) — diese Wörter brauchst du, um zu beschreiben, woraus ein Gegenstand besteht.' },
      { type: 'heading', level: 'full', text: 'Mehr erfahren: „aus Material X“' },
      { type: 'paragraph', level: 'full', text: 'Um zu sagen, dass etwas aus Holz besteht, verwendet Arabisch die Präposition مِنْ („aus/von“, die du in Unit 21 lernst) direkt vor dem Materialwort, z. B. طَاوِلَة مِنْ خَشَب („ein Tisch aus Holz“). Diese Konstruktion siehst du hier nur als Vorschau — die Präposition selbst folgt später.' },
      { type: 'callout', variant: 'tip', title: 'Merke', text: 'مُرَبَّع (Quadrat) und مُثَلَّث (Dreieck) tragen beide die Vorsilbe مُ-, typisch für viele arabische Substantive, die von einem Verb abgeleitet sind.' },
      { type: 'callout', variant: 'info', title: 'Typischer Fehler', text: 'خَطّ (Linie) und خَشَب (Holz) beginnen beide mit خ und werden von Anfängern gelegentlich verwechselt, obwohl die Wörter inhaltlich nichts miteinander zu tun haben.' },
      { type: 'example', arabic: 'مُرَبَّع وَمُثَلَّث', translation: 'ein Quadrat und ein Dreieck', note: 'Zwei geometrische Grundformen.' },
      { type: 'example', arabic: 'طَاوِلَةٌ مِنْ خَشَب', translation: 'ein Tisch aus Holz', note: 'طَاوِلَة (Tisch) und مِنْ (aus, Vorschau Unit 21) hier nur markiert.' },
      { type: 'example', arabic: 'نَافِذَةٌ مِنْ زُجَاج', translation: 'ein Fenster aus Glas', note: 'نَافِذَة (Fenster) hier nur zur Veranschaulichung markiert.' },
      { type: 'word_preview', word_ids: ['c1_u07_05', 'c1_u07_06', 'c1_u07_07', 'c1_u07_08', 'c1_u07_09', 'c1_u07_10', 'c1_u07_11', 'c1_u07_12', 'c1_u07_13', 'c1_u07_14'] },
      { type: 'mini_check', questions: [
        mc('رَمَادِيّ bedeutet…', [opt('grau', true), opt('braun', false)]),
        mc('Aus mehreren نُقْطَة entsteht ein…', [opt('خَطّ', true), opt('مُرَبَّع', false)]),
        mc('Welches Material ist durchsichtig?', [opt('زُجَاج', true), opt('خَشَب', false)])
      ] }
    ]
  },
  {
    theory_id: 'theory_vocab_unit_07_c',
    title: 'Farben, Formen und Materialien (3)',
    content_status: 'needs_language_review',
    learning_objectives: [
      'Sechs weitere Materialien (Kunststoff, Papier, Stein, Baumwolle, Wolle, Leder) benennen.',
      'Vier Metalle (Eisen, Gold, Silber, Stahl) unterscheiden.',
      'Das Homonym-Wortpaar ذهب (gehen / Gold) bewusst auseinanderhalten.'
    ],
    blocks: [
      { type: 'paragraph', text: 'Diese letzte Session zum Thema Materialien ergänzt sechs Alltagsmaterialien: بْلَاسْتِيك (Kunststoff, ein Lehnwort — klingt fast wie im Deutschen), وَرَق (Papier), حَجَر (Stein), قُطْن (Baumwolle), صُوف (Wolle) und جِلْد (Leder). Anschließend folgen vier Metalle: حَدِيد (Eisen), ذَهَب (Gold), فِضَّة (Silber) und فُولَاذ (Stahl).' },
      { type: 'paragraph', text: 'Wichtiger Hinweis: ذَهَب (Gold) sieht in unvokalisierter Schrift genauso aus wie ذَهَبَ („er ging“, ein Verb aus Unit 17) — beide werden ذهب geschrieben, aber unterschiedlich vokalisiert und ausgesprochen (ذَهَب mit Sukūn auf dem ب für „Gold“, ذَهَبَ mit Fatḥa für „er ging“). Der Satzkontext macht fast immer klar, welches gemeint ist.' },
      { type: 'heading', level: 'full', text: 'Mehr erfahren: warum gibt es Homonyme wie ذهب?' },
      { type: 'paragraph', level: 'full', text: 'Homonyme wie ذهب sind im Arabischen (wie in jeder Sprache) nicht selten, weil die geschriebene Konsonantenfolge ohne Vokalzeichen mehrdeutig sein kann. Genau deshalb ist die vollständige Vokalisierung (die du in den „vollständigen“ Wörtern dieses Kurses siehst) so wichtig — sie beseitigt die Mehrdeutigkeit, die die reine Konsonantenschrift zulässt.' },
      { type: 'callout', variant: 'tip', title: 'Merke', text: 'ذهب (ohne Vokalzeichen) kann „Gold“ (Substantiv) oder „er ging“ (Verb) bedeuten — nur die Vokalisierung bzw. der Satzkontext klärt, welches gemeint ist.' },
      { type: 'callout', variant: 'info', title: 'Typischer Fehler', text: 'بْلَاسْتِيك wird manchmal falsch geschrieben, weil es ein Lehnwort ohne „typisch arabisches“ Konsonantenmuster ist — am besten wie ein bekanntes Fremdwort auswendig lernen.' },
      { type: 'example', arabic: 'خَاتَمٌ مِنْ ذَهَب', translation: 'ein Ring aus Gold', note: 'خَاتَم (Ring, Unit 12) und مِنْ (aus) hier nur markiert.' },
      { type: 'example', arabic: 'كُرْسِيٌّ مِنْ بْلَاسْتِيك', translation: 'ein Stuhl aus Kunststoff', note: 'كُرْسِيّ verweist voraus auf Unit 8.' },
      { type: 'example', arabic: 'حِذَاءٌ مِنْ جِلْد', translation: 'ein Schuh aus Leder', note: 'حِذَاء (Schuh) kennst du bereits aus dem Bestand.' },
      { type: 'word_preview', word_ids: ['c1_u07_15', 'c1_u07_16', 'c1_u07_17', 'c1_u07_18', 'c1_u07_19', 'c1_u07_20', 'c1_u07_21', 'c1_u07_22', 'c1_u07_23', 'c1_u07_24'] },
      { type: 'mini_check', questions: [
        mc('Ist ذهب OHNE Vokalzeichen eindeutig oder mehrdeutig?', [opt('mehrdeutig: Gold oder „er ging“', true), opt('eindeutig: nur Gold', false)]),
        mc('فُولَاذ bedeutet…', [opt('Stahl', true), opt('Eisen', false)]),
        mc('Welches Material kommt von Schafen?', [opt('صُوف', true), opt('قُطْن', false)])
      ] }
    ]
  },
  // ============================== UNIT 8 (Möbel/Haushalt) ==============================
  {
    theory_id: 'theory_vocab_unit_08_a',
    title: 'Möbel, Haushalt und Alltagsgegenstände (1)',
    content_status: 'needs_language_review',
    learning_objectives: [
      'Die wichtigsten Sitz- und Aufbewahrungsmöbel eines Wohnzimmers benennen.',
      '„Bettdecke“ von der bereits bekannten „Zimmerdecke“ (Unit 3) unterscheiden.',
      'Erste Einrichtungsgegenstände in einem einfachen Satz beschreiben.'
    ],
    blocks: [
      { type: 'paragraph', text: 'Diese Unit ergänzt dein Zuhause-Vokabular aus Unit 3 um konkrete Möbelstücke. كُرْسِيّ (Stuhl) ist für eine Person, أَرِيكَة (Sofa) für mehrere. خِزَانَة (Schrank) und رَفّ (Regal) dienen zum Aufbewahren, مِصْبَاح (Lampe) und مِرْآة (Spiegel) findest du in fast jedem Zimmer. سَجَّادَة (Teppich) und سِتَارَة (Vorhang) sind textile Einrichtungsgegenstände, وِسَادَة (Kissen) gehört zum Sofa oder Bett.' },
      { type: 'paragraph', text: 'Achtung bei بَطَّانِيَّة (Decke, gemeint ist die Bettdecke): Das ist ein GANZ ANDERES Wort als سَقْف (Zimmerdecke) aus Unit 3 — im Deutschen heißen beide einfach „Decke“, im Arabischen haben sie nichts miteinander zu tun. Wir markieren das im Deutschen ab jetzt konsequent als „Decke (Zimmerdecke)“ bzw. „Decke (Bettdecke)“, damit klar ist, welche gemeint ist.' },
      { type: 'heading', level: 'full', text: 'Mehr erfahren: Werkzeug-/Ort-Muster bei Möbelwörtern' },
      { type: 'paragraph', level: 'full', text: 'Viele Möbelwörter in dieser Session sind vom Verb abgeleitet, das die Funktion des Möbelstücks beschreibt, plus einem Werkzeug-/Ort-Muster: مِصْبَاح (Lampe, von der Wurzel für „leuchten“), مِرْآة (Spiegel, von der Wurzel für „sehen“, derselben wie رَأَى aus Unit 13). Wenn du dieses Muster einmal erkennst, hilft es dir, neue Wörter leichter zu erschließen.' },
      { type: 'callout', variant: 'tip', title: 'Merke', text: 'بَطَّانِيَّة (Bettdecke) ≠ سَقْف (Zimmerdecke) — zwei völlig unterschiedliche arabische Wörter für das eine deutsche Wort „Decke“.' },
      { type: 'callout', variant: 'info', title: 'Typischer Fehler', text: 'خِزَانَة (Schrank) wird gelegentlich mit حَدِيقَة (Garten, aus Unit 3) verwechselt, weil beide vier Silben haben — die Anfangsbuchstaben (خ vs ح) klingen aber deutlich unterschiedlich.' },
      { type: 'example', arabic: 'كُرْسِيّ أَمَامَ الطَّاوِلَة', translation: 'ein Stuhl vor dem Tisch', note: 'أَمَامَ (vor, Vorschau Unit 21) hier nur markiert.' },
      { type: 'example', arabic: 'مِرْآة عَلَى الْجِدَار', translation: 'ein Spiegel an der Wand', note: 'الْجِدَار (Wand) kennst du bereits aus Unit 3.' },
      { type: 'example', arabic: 'وِسَادَة عَلَى الْأَرِيكَة', translation: 'ein Kissen auf dem Sofa', note: 'Zwei neue Wörter dieser Session kombiniert.' },
      { type: 'word_preview', word_ids: ['c1_u08_01', 'c1_u08_02', 'c1_u08_03', 'c1_u08_04', 'c1_u08_05', 'c1_u08_06', 'c1_u08_07', 'c1_u08_08', 'c1_u08_09', 'c1_u08_10'] },
      { type: 'mini_check', questions: [
        mc('Welches Wort bedeutet die Bettdecke, nicht die Zimmerdecke?', [opt('بَطَّانِيَّة', true), opt('سَقْف', false)]),
        mc('أَرِيكَة ist für…', [opt('mehrere Personen', true), opt('eine einzelne Person', false)]),
        mc('مِرْآة bedeutet…', [opt('Spiegel', true), opt('Lampe', false)])
      ] }
    ]
  },
  {
    theory_id: 'theory_vocab_unit_08_b',
    title: 'Möbel, Haushalt und Alltagsgegenstände (2)',
    content_status: 'needs_language_review',
    learning_objectives: [
      'Küchengeräte (Kühlschrank, Backofen, Herd, Waschmaschine, Geschirrspüler) benennen.',
      'Reinigungsgeräte (Staubsauger, Besen, Bügeleisen) unterscheiden.',
      'Hygieneartikel (Handtuch, Seife) erkennen.'
    ],
    blocks: [
      { type: 'paragraph', text: 'Diese Session konzentriert sich auf große Haushaltsgeräte. Auffällig: sehr viele enden auf ة und sind feminin, weil sie nach einem Muster für „Gerät, das etwas intensiv tut“ gebildet sind — ثَلَّاجَة (Kühlschrank, von „kühlen“), غَسَّالَة (Waschmaschine, von „waschen“), مِكْنَسَة (Besen, von „kehren“). Das ist ein sehr produktives Muster für Geräte im Arabischen, vergleichbar mit deutschen Wörtern auf „-maschine“.' },
      { type: 'paragraph', text: 'غَسَّالَةُ الصُّحُون (Geschirrspüler, wörtlich „Waschmaschine der Teller“) und مِكْنَسَة كَهْرَبَائِيَّة (Staubsauger, wörtlich „elektrischer Besen“) sind zusammengesetzte Begriffe nach demselben Iḍāfa-/Adjektiv-Muster, das du bereits aus Unit 3 kennst — sie bauen direkt auf غَسَّالَة und مِكْنَسَة auf, die du in dieser Session ebenfalls lernst.' },
      { type: 'heading', level: 'full', text: 'Mehr erfahren: das Verdopplungsmuster bei Geräten' },
      { type: 'paragraph', level: 'full', text: 'Das Muster mit verdoppeltem mittlerem Konsonanten (ثَلَّاجَة, غَسَّالَة) drückt im Arabischen oft eine intensive oder wiederholte Tätigkeit aus — bei Geräten passt das gut, da eine Waschmaschine ja wiederholt/intensiv wäscht. Du wirst dieses Verdopplungsmuster auch bei einigen Verben in späteren Units wiedersehen (z. B. نَظَّفَ „reinigen“, mit doppeltem ظ).' },
      { type: 'callout', variant: 'tip', title: 'Merke', text: 'غَسَّالَةُ الصُّحُون baut direkt auf غَسَّالَة auf — kennst du das eine Wort, erschließt sich das andere fast von selbst.' },
      { type: 'callout', variant: 'info', title: 'Typischer Fehler', text: 'مِكْنَسَة (Besen) und مِكْنَسَة كَهْرَبَائِيَّة (Staubsauger) werden manchmal als dasselbe Wort missverstanden — das Zusatzwort كَهْرَبَائِيَّة (elektrisch, von كَهْرَبَاء „Strom“ aus Unit 3) macht den entscheidenden Unterschied.' },
      { type: 'example', arabic: 'الْحَلِيبُ فِي الثَّلَّاجَة', translation: 'Die Milch ist im Kühlschrank.', note: 'الْحَلِيبُ (Milch) kennst du bereits aus dem Bestand.' },
      { type: 'example', arabic: 'غَسَّالَةُ الصُّحُون نَظِيفَة', translation: 'Der Geschirrspüler ist sauber.', note: 'نَظِيفَة (sauber) als Vorschau auf Unit 19.' },
      { type: 'example', arabic: 'صَابُون وَمِنْشَفَة فِي الْحَمَّام', translation: 'Seife und Handtuch sind im Badezimmer.', note: 'الْحَمَّام (Badezimmer) kennst du bereits aus dem Bestand.' },
      { type: 'word_preview', word_ids: ['c1_u08_11', 'c1_u08_12', 'c1_u08_13', 'c1_u08_14', 'c1_u08_15', 'c1_u08_16', 'c1_u08_17', 'c1_u08_18', 'c1_u08_19', 'c1_u08_20'] },
      { type: 'mini_check', questions: [
        mc('Welches Muster tragen viele Haushaltsgeräte-Wörter in dieser Session?', [opt('verdoppelter Mittelkonsonant, endet auf ة', true), opt('Endung auf ي', false)]),
        mc('غَسَّالَةُ الصُّحُون bedeutet…', [opt('Geschirrspüler', true), opt('Waschmaschine', false)]),
        mc('صَابُون bedeutet…', [opt('Seife', true), opt('Handtuch', false)])
      ] }
    ]
  },
  {
    theory_id: 'theory_vocab_unit_08_c',
    title: 'Möbel, Haushalt und Alltagsgegenstände (3)',
    content_status: 'needs_language_review',
    learning_objectives: [
      'Geschirr und Besteck (Teller, Tasse, Löffel, Gabel, Messer) vollständig benennen.',
      'Badezimmer-Wörter (Wasserhahn, Dusche, Toilette, Waschbecken) ergänzen.',
      'Besteck-Wörter in einem einfachen Tischdeck-Kontext anwenden.'
    ],
    blocks: [
      { type: 'paragraph', text: 'Diese letzte Session zum Thema Haushalt vervollständigt zunächst das Geschirr: طَبَق (Teller), كُوب (Tasse/Becher), مِلْعَقَة (Löffel), شَوْكَة (Gabel) und سِكِّين (Messer) — die klassische Grundausstattung am Esstisch, die du in Unit 10 (Küche) wieder brauchen wirst. سَلَّة (Korb) ergänzt als vielseitiger Aufbewahrungsbehälter.' },
      { type: 'paragraph', text: 'Danach folgen vier Badezimmer-Wörter: صُنْبُور (Wasserhahn), دُشّ (Dusche, ein Lehnwort — daher die Ähnlichkeit zum Deutschen!), مِرْحَاض (Toilette) und مَغْسَلَة (Waschbecken, von derselben Wurzel wie غَسَّالَة „Waschmaschine“ aus der letzten Session — beide drehen sich ums Waschen).' },
      { type: 'heading', level: 'full', text: 'Mehr erfahren: Lehnwörter für neue Technik' },
      { type: 'paragraph', level: 'full', text: 'دُشّ ist ein gutes Beispiel dafür, wie Alltagswörter aus europäischen Sprachen ins moderne Hocharabisch übernommen werden, besonders bei technischen Neuerungen des 19./20. Jahrhunderts. Solche Lehnwörter erkennst du oft daran, dass sie nicht dem typischen dreikonsonantigen arabischen Wurzelmuster folgen.' },
      { type: 'callout', variant: 'tip', title: 'Merke', text: 'مَغْسَلَة (Waschbecken) und غَسَّالَة (Waschmaschine) teilen dieselbe Wurzel غ-س-ل („waschen“) — unterschiedliche Muster, verwandte Bedeutung.' },
      { type: 'callout', variant: 'info', title: 'Typischer Fehler', text: 'شَوْكَة (Gabel) wird gelegentlich mit سَاعَة (Stunde, aus Unit 6) verwechselt, weil beide mit einem Zischlaut beginnen — سَاعَة beginnt aber mit س, شَوْكَة mit ش.' },
      { type: 'example', arabic: 'طَبَق وَشَوْكَة وَسِكِّين', translation: 'ein Teller, eine Gabel und ein Messer', note: 'Ein typisches Gedeck.' },
      { type: 'example', arabic: 'كُوبٌ مِنَ الشَّاي', translation: 'eine Tasse Tee', note: 'الشَّاي (Tee) kennst du bereits aus dem Bestand.' },
      { type: 'example', arabic: 'الصُّنْبُورُ فِي الْمَغْسَلَة', translation: 'Der Wasserhahn ist am Waschbecken.', note: 'Zwei neue Wörter dieser Session.' },
      { type: 'word_preview', word_ids: ['c1_u08_21', 'c1_u08_22', 'c1_u08_23', 'c1_u08_24', 'c1_u08_25', 'c1_u08_26', 'c1_u08_27', 'c1_u08_28', 'c1_u08_29', 'c1_u08_30'] },
      { type: 'mini_check', questions: [
        mc('Womit isst du Suppe?', [opt('مِلْعَقَة', true), opt('شَوْكَة', false)]),
        mc('دُشّ ist ein Lehnwort aus…', [opt('einer europäischen Sprache', true), opt('dem klassischen Arabisch', false)]),
        mc('مَغْسَلَة und غَسَّالَة teilen sich…', [opt('dieselbe Wurzel', true), opt('keine Verbindung', false)])
      ] }
    ]
  },
  // ============================== UNIT 9 (Lebensmittel) ==============================
  {
    theory_id: 'theory_vocab_unit_09_a',
    title: 'Lebensmittel und Grundnahrungsmittel (1)',
    content_status: 'needs_language_review',
    learning_objectives: [
      'Grundnahrungsmittel zum bereits bekannten Brot/Apfel ergänzen.',
      'Salz und Zucker als Gewürz-Grundlagen unterscheiden.',
      'Erste einfache Sätze über Frühstückszutaten verstehen.'
    ],
    blocks: [
      { type: 'paragraph', text: 'Du kennst aus dem Bestand bereits خُبْز (Brot) und تُفَّاح (Apfel). Diese Session ergänzt die wichtigsten Grundnahrungsmittel: أَرُزّ (Reis), لَحْم (Fleisch), بَيْضَة (Ei), جُبْن (Käse), زُبْدَة (Butter) und زَبَادِي (Joghurt) — mit Ausnahme von Reis und Fleisch sind das klassische Frühstückszutaten in vielen arabischsprachigen Ländern, oft zusammen mit Brot serviert.' },
      { type: 'paragraph', text: 'مِلْح (Salz) und سُكَّر (Zucker) sind ein klassisches Gegensatzpaar: das eine macht ein Gericht herzhaft, das andere süß. Beide Wörter wirst du sehr häufig brauchen, sobald du über Kochen oder Essen sprichst.' },
      { type: 'heading', level: 'full', text: 'Mehr erfahren: بَيْضَة und der „Gattungsname“' },
      { type: 'paragraph', level: 'full', text: 'بَيْضَة (Ei, Singular) hat einen unregelmäßigen Plural: بَيْض (Eier, ohne die feminine ة-Endung des Singulars). Das Muster „Singular mit ة, Plural ohne ة“ nennt man im Arabischen den Gattungsnamen (اِسْم الْجِنْس): بَيْض bezeichnet „Eier“ als Substanz/Gattung, بَيْضَة ein einzelnes Ei. Du wirst dieses Muster bei einigen weiteren Lebensmittelwörtern wiedersehen.' },
      { type: 'callout', variant: 'tip', title: 'Merke', text: 'مِلْح und سُكَّر sind ein Gegensatzpaar: herzhaft würzen vs. süßen.' },
      { type: 'callout', variant: 'info', title: 'Typischer Fehler', text: 'زُبْدَة (Butter) und زَبَادِي (Joghurt) beginnen beide mit زَب- und werden von Anfängern häufig verwechselt — auf die zweite Silbe achten.' },
      { type: 'example', arabic: 'خُبْزٌ وَجُبْنٌ لِلْفُطُور', translation: 'Brot und Käse zum Frühstück.', note: 'لِلْفُطُور als Vorschau auf Unit 10.' },
      { type: 'example', arabic: 'بَيْضَةٌ وَاحِدَة', translation: 'ein Ei', note: 'وَاحِدَة aus Unit 5-Theorie bekannt.' },
      { type: 'example', arabic: 'مِلْحٌ أَمْ سُكَّر؟', translation: 'Salz oder Zucker?', note: 'أَمْ (oder, bei Fragen) als Vorschau auf Unit 30.' },
      { type: 'word_preview', word_ids: ['food_bread', 'food_apple', 'c1_u09_01', 'c1_u09_02', 'c1_u09_03', 'c1_u09_04', 'c1_u09_05', 'c1_u09_06', 'c1_u09_07', 'c1_u09_08'] },
      { type: 'mini_check', questions: [
        mc('Welches Wort bezeichnet Eier als Gattung (Plural ohne ة)?', [opt('بَيْض', true), opt('بَيْضَة', false)]),
        mc('زَبَادِي bedeutet…', [opt('Joghurt', true), opt('Butter', false)]),
        mc('Welches Wort macht ein Gericht süß?', [opt('سُكَّر', true), opt('مِلْح', false)])
      ] }
    ]
  },
  {
    theory_id: 'theory_vocab_unit_09_b',
    title: 'Lebensmittel und Grundnahrungsmittel (2)',
    content_status: 'needs_language_review',
    learning_objectives: [
      'Öl und Mehl als Grundzutaten zum Kochen/Backen benennen.',
      'Obst und Gemüse als Oberbegriffe von konkreten Früchten unterscheiden.',
      'Fünf konkrete Obstsorten benennen, darunter das mit Unit 7 verwandte Wort für Orange.'
    ],
    blocks: [
      { type: 'paragraph', text: 'دَقِيق (Mehl) und زَيْت (Öl) sind Grundzutaten für fast jedes Backen und Kochen. Danach lernst du die zwei wichtigen Oberbegriffe خُضْرَوَات (Gemüse) und فَاكِهَة (Obst) — خُضْرَوَات ist ein reines Pluralwort (es gibt keinen gebräuchlichen Singular „ein Gemüse“), فَاكِهَة dagegen ein normales Substantiv mit dem Plural فَوَاكِه.' },
      { type: 'paragraph', text: 'Danach folgen fünf konkrete Obstsorten: مَوْز (Banane), بُرْتُقَال (Orange), عِنَب (Trauben), تَمْر (Datteln) und لَيْمُون (Zitrone). Erinnerst du dich an بُرْتُقَالِيّ (die Farbe Orange) aus Unit 7? بُرْتُقَال ist genau die Frucht, von der diese Farbe ihren Namen hat. Die Session endet mit طَمَاطِم (Tomate), die zwar botanisch eine Frucht, aber im Alltag als Gemüse behandelt wird.' },
      { type: 'heading', level: 'full', text: 'Mehr erfahren: das Pluraletantum خُضْرَوَات' },
      { type: 'paragraph', level: 'full', text: 'خُضْرَوَات ist ein sogenanntes Pluraletantum — ein Wort, das nur im Plural existiert, obwohl es eine unzählbare Menge bezeichnet, ähnlich wie „Ferien“ im Deutschen nur im Plural gebräuchlich ist. Willst du EIN Gemüse benennen, verwendest du das konkrete Wort dafür (z. B. طَمَاطِم für Tomate), nicht خُضْرَوَات selbst.' },
      { type: 'callout', variant: 'tip', title: 'Merke', text: 'بُرْتُقَالِيّ (die Farbe Orange, Unit 7) kommt direkt von بُرْتُقَال (die Frucht Orange, diese Session).' },
      { type: 'callout', variant: 'info', title: 'Typischer Fehler', text: 'فَاكِهَة (Obst, Oberbegriff) und eine konkrete Frucht wie مَوْز (Banane) werden von Anfängern manchmal gleichgesetzt — فَاكِهَة bezeichnet die ganze Kategorie, nicht eine bestimmte Frucht.' },
      { type: 'example', arabic: 'مَوْزٌ وَبُرْتُقَالٌ وَعِنَب', translation: 'Bananen, Orangen und Trauben', note: 'Drei konkrete Obstsorten.' },
      { type: 'example', arabic: 'زَيْتٌ وَدَقِيقٌ لِلْخُبْز', translation: 'Öl und Mehl fürs Brot', note: 'لِلْخُبْز hier nur zur Veranschaulichung markiert.' },
      { type: 'example', arabic: 'الطَّمَاطِمُ حَمْرَاء', translation: 'Die Tomate ist rot.', note: 'حَمْرَاء (rot, feminine Form) als Vorschau auf die Unit-7-Grammatik.' },
      { type: 'word_preview', word_ids: ['c1_u09_09', 'c1_u09_10', 'c1_u09_11', 'c1_u09_12', 'c1_u09_13', 'c1_u09_14', 'c1_u09_15', 'c1_u09_16', 'c1_u09_17', 'c1_u09_18'] },
      { type: 'mini_check', questions: [
        mc('Welches Wort existiert nur im Plural?', [opt('خُضْرَوَات', true), opt('فَاكِهَة', false)]),
        mc('Von welcher Frucht ist die Farbe بُرْتُقَالِيّ abgeleitet?', [opt('بُرْتُقَال', true), opt('لَيْمُون', false)]),
        mc('تَمْر bedeutet…', [opt('Datteln', true), opt('Trauben', false)])
      ] }
    ]
  },
  {
    theory_id: 'theory_vocab_unit_09_c',
    title: 'Lebensmittel und Grundnahrungsmittel (3)',
    content_status: 'needs_language_review',
    learning_objectives: [
      'Weiteres Gemüse (Kartoffel, Zwiebel, Knoblauch, Karotte, Gurke) benennen.',
      'Hülsenfrüchte (Bohnen, Linsen, Kichererbsen) als proteinreiche Zutaten unterscheiden.',
      'Nudeln und Suppe als zubereitete Grundgerichte erkennen.'
    ],
    blocks: [
      { type: 'paragraph', text: 'Diese letzte Session zum Thema Lebensmittel ergänzt fünf weitere Gemüsesorten: بَطَاطَا (Kartoffel), بَصَل (Zwiebel), ثُوم (Knoblauch), جَزَر (Karotte) und خِيَار (Gurke). بَصَل und ثُوم werden im Arabischen wie im Deutschen oft zusammen genannt, da beide die Basis vieler herzhafter Gerichte bilden.' },
      { type: 'paragraph', text: 'Drei Hülsenfrüchte folgen: فَاصُولْيَاء (Bohnen), عَدَس (Linsen) und حِمَّص (Kichererbsen, die Basis von Hummus — das Wort „Hummus“ kommt direkt von حِمَّص!). Die Session endet mit مَعْكَرُونَة (Nudeln/Pasta, ebenfalls ein Lehnwort) und حَسَاء (Suppe) — zwei fertigen Gerichten statt einzelnen Zutaten.' },
      { type: 'heading', level: 'full', text: 'Mehr erfahren: حِمَّص und „Hummus“' },
      { type: 'paragraph', level: 'full', text: 'Wusstest du, dass das deutsche Wort „Hummus“ direkt aus dem Arabischen حِمَّص entlehnt ist? Das ist ein gutes Beispiel dafür, wie kulinarische Begriffe zwischen Sprachen wandern — genau wie بْلَاسْتِيك (Kunststoff, Unit 7) in umgekehrter Richtung aus europäischen Sprachen ins Arabische kam.' },
      { type: 'callout', variant: 'tip', title: 'Merke', text: 'حِمَّص ist sowohl die arabische Zutat (Kichererbsen) als auch der Ursprung des deutschen Wortes „Hummus“.' },
      { type: 'callout', variant: 'info', title: 'Typischer Fehler', text: 'عَدَس (Linsen) wird gelegentlich mit عِنَب (Trauben, aus der letzten Session) verwechselt, da beide mit عَ beginnen.' },
      { type: 'example', arabic: 'بَطَاطَا وَجَزَر وَبَصَل', translation: 'Kartoffeln, Karotten und Zwiebeln', note: 'Drei Gemüsesorten dieser Session.' },
      { type: 'example', arabic: 'حَسَاءُ الْعَدَس', translation: 'Linsensuppe', note: 'Iḍāfa-Konstruktion, bekannt aus Unit 3.' },
      { type: 'example', arabic: 'حِمَّصٌ وَثُوم', translation: 'Kichererbsen und Knoblauch', note: 'Zwei Zutaten dieser Session.' },
      { type: 'word_preview', word_ids: ['c1_u09_19', 'c1_u09_20', 'c1_u09_21', 'c1_u09_22', 'c1_u09_23', 'c1_u09_24', 'c1_u09_25', 'c1_u09_26', 'c1_u09_27', 'c1_u09_28'] },
      { type: 'mini_check', questions: [
        mc('Welches deutsche Lehnwort stammt direkt von حِمَّص؟', [opt('Hummus', true), opt('Falafel', false)]),
        mc('مَعْكَرُونَة bedeutet…', [opt('Nudeln/Pasta', true), opt('Suppe', false)]),
        mc('Welche zwei Wörter bilden oft gemeinsam die Basis herzhafter Gerichte?', [opt('بَصَل und ثُوم', true), opt('جَزَر und خِيَار', false)])
      ] }
    ]
  },
  // ============================== UNIT 10 (Getränke/Küche) ==============================
  {
    theory_id: 'theory_vocab_unit_10_a',
    title: 'Getränke, Mahlzeiten und Küche (1)',
    content_status: 'needs_language_review',
    learning_objectives: [
      'Getränke zu Wasser/Milch/Kaffee/Tee aus dem Bestand ergänzen.',
      'Die drei Hauptmahlzeiten des Tages benennen.',
      '„Mahlzeit“ als Oberbegriff von den einzelnen Mahlzeiten unterscheiden.'
    ],
    blocks: [
      { type: 'paragraph', text: 'Du kennst bereits مَاء (Wasser), حَلِيب (Milch), قَهْوَة (Kaffee) und شَاي (Tee) aus dem Bestand. عَصِير (Saft) ergänzt die konkreten Getränke, مَشْرُوب ist der allgemeine Oberbegriff für „Getränk“ — genauso wie فَاكِهَة der Oberbegriff für Obst war (Unit 9), ist مَشْرُوب der Oberbegriff, unter den alle konkreten Getränke fallen.' },
      { type: 'paragraph', text: 'Die drei Hauptmahlzeiten des Tages folgen: فُطُور (Frühstück), غَدَاء (Mittagessen) und عَشَاء (Abendessen). وَجْبَة (Mahlzeit) ist wieder ein Oberbegriff — Frühstück, Mittag- und Abendessen sind alle drei Beispiele für eine وَجْبَة.' },
      { type: 'heading', level: 'full', text: 'Mehr erfahren: غَدَاء vs. غَداً' },
      { type: 'paragraph', level: 'full', text: 'Achtung, Verwechslungsgefahr: غَدَاء (Mittagessen, aus dieser Session) klingt sehr ähnlich wie غَداً (morgen, aus Unit 6) — beide teilen dieselbe Wurzel, haben im heutigen Sprachgebrauch aber klar getrennte Bedeutungen. Achte auf die Endung: غَداً (mit Tanwin, Adverb) vs. غَدَاء (mit Hamza, Substantiv).' },
      { type: 'callout', variant: 'tip', title: 'Merke', text: 'مَشْرُوب (Getränk) und وَجْبَة (Mahlzeit) sind Oberbegriffe — عَصِير und غَدَاء sind jeweils konkrete Beispiele dafür.' },
      { type: 'callout', variant: 'info', title: 'Typischer Fehler', text: 'غَدَاء (Mittagessen) und غَداً (morgen, Unit 6) werden von Anfängern häufig verwechselt — im Zweifel hilft der Satzzusammenhang.' },
      { type: 'example', arabic: 'عَصِيرُ بُرْتُقَال', translation: 'Orangensaft', note: 'Iḍāfa-Konstruktion mit بُرْتُقَال aus Unit 9.' },
      { type: 'example', arabic: 'الْفُطُورُ فِي الصَّبَاح، وَالْعَشَاءُ فِي الْمَسَاء', translation: 'Das Frühstück ist am Morgen, das Abendessen am Abend.', note: 'فِي (in/an) als Vorschau auf Unit 21.' },
      { type: 'example', arabic: 'أَيُّ وَجْبَةٍ تُفَضِّل؟', translation: 'Welche Mahlzeit bevorzugst du?', note: 'أَيّ und تُفَضِّل als Vorschau auf Units 30/18.' },
      { type: 'word_preview', word_ids: ['food_water', 'food_milk', 'food_coffee', 'food_tea', 'c1_u10_01', 'c1_u10_02', 'c1_u10_03', 'c1_u10_04', 'c1_u10_05', 'c1_u10_06'] },
      { type: 'mini_check', questions: [
        mc('Welches Wort ist der Oberbegriff für Frühstück/Mittag-/Abendessen?', [opt('وَجْبَة', true), opt('غَدَاء', false)]),
        mc('غَدَاء bedeutet…', [opt('Mittagessen', true), opt('morgen', false)]),
        mc('عَصِير bedeutet…', [opt('Saft', true), opt('Getränk allgemein', false)])
      ] }
    ]
  },
  {
    theory_id: 'theory_vocab_unit_10_b',
    title: 'Getränke, Mahlzeiten und Küche (2)',
    content_status: 'needs_language_review',
    learning_objectives: [
      'Hunger/Durst sowie eine Geschmacksbeschreibung ausdrücken.',
      'Verpackungs- und Kochgeschirr-Wörter (Flasche, Dose, Topf, Pfanne) benennen.',
      'Wasserkocher, Tablett und Schüssel als weitere Küchenutensilien erkennen.'
    ],
    blocks: [
      { type: 'paragraph', text: 'جَائِع (hungrig) und عَطْشَان (durstig) beschreiben ein körperliches Bedürfnis. لَذِيذ (lecker) ist das Adjektiv, mit dem du jedes gute Essen loben kannst.' },
      { type: 'paragraph', text: 'Danach folgen Behälter und Kochgeschirr: زُجَاجَة (Flasche, verwandt mit زُجَاج „Glas“ aus Unit 7!) und عُلْبَة (Dose/Schachtel) für Verpackungen, قِدْر (Kochtopf) und مِقْلَاة (Pfanne) zum Kochen/Braten, غَلَّايَة (Wasserkocher), صِينِيَّة (Tablett) und وِعَاء (Schüssel/Gefäß, der allgemeinste Begriff für einen Behälter in der Küche).' },
      { type: 'heading', level: 'full', text: 'Mehr erfahren: زُجَاجَة und زُجَاج' },
      { type: 'paragraph', level: 'full', text: 'زُجَاجَة (Flasche) und زُجَاج (Glas, das Material) teilen dieselbe Wurzel — eine Flasche ist ursprünglich einfach „ein Glas-Ding“. Das zeigt gut, wie im Arabischen aus einem Materialwort durch eine kleine Formveränderung (hier: die feminine Endung ة) ein konkreter Gegenstand aus diesem Material wird.' },
      { type: 'callout', variant: 'tip', title: 'Merke', text: 'زُجَاجَة (Flasche) kommt von زُجَاج (Glas, Unit 7) — auch wenn heute viele Flaschen aus Plastik sind, bleibt der Wortursprung „Glas“.' },
      { type: 'callout', variant: 'info', title: 'Typischer Fehler', text: 'قِدْر (Kochtopf) und مِقْلَاة (Pfanne) werden von Anfängern manchmal synonym benutzt — قِدْر ist tief und für Suppen/Wasser gedacht, مِقْلَاة ist flach und zum Braten.' },
      { type: 'example', arabic: 'أَنَا جَائِعٌ وَعَطْشَان.', translation: 'Ich bin hungrig und durstig.', note: 'Beide neuen Adjektive kombiniert.' },
      { type: 'example', arabic: 'زُجَاجَةُ مَاء', translation: 'eine Flasche Wasser', note: 'مَاء kennst du bereits aus dem Bestand.' },
      { type: 'example', arabic: 'الطَّعَامُ لَذِيذٌ فِي هَذَا الْقِدْر', translation: 'Das Essen in diesem Topf ist lecker.', note: 'هَذَا (dieser) als Vorschau auf Unit 30.' },
      { type: 'word_preview', word_ids: ['c1_u10_07', 'c1_u10_08', 'c1_u10_09', 'c1_u10_10', 'c1_u10_11', 'c1_u10_12', 'c1_u10_13', 'c1_u10_14', 'c1_u10_15', 'c1_u10_16'] },
      { type: 'mini_check', questions: [
        mc('Welches Wort ist tief und für Suppen gedacht?', [opt('قِدْر', true), opt('مِقْلَاة', false)]),
        mc('زُجَاجَة hängt wortgeschichtlich zusammen mit…', [opt('زُجَاج, Glas', true), opt('زَيْت, Öl', false)]),
        mc('لَذِيذ bedeutet…', [opt('lecker', true), opt('hungrig', false)])
      ] }
    ]
  },
  {
    theory_id: 'theory_vocab_unit_10_c',
    title: 'Getränke, Mahlzeiten und Küche (3)',
    content_status: 'needs_language_review',
    learning_objectives: [
      'Restaurant-Vokabular (Speisekarte, Rechnung, Kellner) benennen.',
      'Fünf Kochverben (kochen, schneiden, sieden, braten, grillen) unterscheiden.',
      '„kochen“ als allgemeines Verb von den spezifischeren Zubereitungsverben abgrenzen.'
    ],
    blocks: [
      { type: 'paragraph', text: 'Diese letzte Session zum Thema Küche kombiniert Restaurant-Vokabular mit Kochverben. وَصْفَة (Rezept) erklärt, WIE man kocht, قَائِمَة الطَّعَام (Speisekarte, Iḍāfa-Konstruktion wie schon mehrfach gesehen) zeigt im Restaurant, WAS es gibt, فَاتُورَة (Rechnung) kommt am Ende, نَادِل (Kellner) bedient dich dabei.' },
      { type: 'paragraph', text: 'Die fünf Verben dieser Session sind alle in der für arabische Wörterbücher üblichen Grundform (3. Person maskulin Singular Vergangenheit) angegeben: طَبَخَ ist das allgemeine Verb für „kochen/zubereiten“, die anderen vier sind spezifischer — قَطَعَ (schneiden) mit dem Messer, غَلَى (sieden, im kochenden Wasser), قَلَى (braten/frittieren, in Öl) und شَوَى (grillen, über offener Flamme). طَعْم (Geschmack) rundet die Unit ab.' },
      { type: 'heading', level: 'full', text: 'Mehr erfahren: غَلَى und غَلَّايَة' },
      { type: 'paragraph', level: 'full', text: 'Bemerkst du die Ähnlichkeit zwischen غَلَى (sieden) und غَلَّايَة (Wasserkocher, aus der letzten Session)? Beide teilen dieselbe Wurzel — ein Wasserkocher ist wörtlich „das Gerät, mit dem man siedet“. Das ist ein weiteres Beispiel für das Wurzelsystem, das dir in diesem Kurs immer wieder begegnet: Kennst du eine Wurzel, kannst du oft mehrere verwandte Wörter erschließen.' },
      { type: 'callout', variant: 'tip', title: 'Merke', text: 'طَبَخَ ist das allgemeine „kochen“ — قَطَعَ، غَلَى، قَلَى، شَوَى beschreiben jeweils eine SPEZIFISCHE Zubereitungsart.' },
      { type: 'callout', variant: 'info', title: 'Typischer Fehler', text: 'قَلَى (braten/frittieren) und قَطَعَ (schneiden) beginnen beide mit ق und werden von Anfängern gelegentlich verwechselt — der Rest des Wortes ist aber eindeutig unterschiedlich.' },
      { type: 'example', arabic: 'طَبَخَ الْأَرُزّ.', translation: 'Er kochte den Reis.', note: 'Verb in der Wörterbuchform, mit bekanntem Wort أَرُزّ aus Unit 9.' },
      { type: 'example', arabic: 'قَطَعَ الطَّمَاطِم.', translation: 'Er schnitt die Tomate.', note: 'Mit bekanntem Wort aus Unit 9.' },
      { type: 'example', arabic: 'أَيْنَ قَائِمَةُ الطَّعَام؟', translation: 'Wo ist die Speisekarte?', note: 'أَيْنَ (wo) kennst du bereits aus dem Bestand.' },
      { type: 'word_preview', word_ids: ['c1_u10_17', 'c1_u10_18', 'c1_u10_19', 'c1_u10_20', 'c1_u10_21', 'c1_u10_22', 'c1_u10_23', 'c1_u10_24', 'c1_u10_25', 'c1_u10_26'] },
      { type: 'mini_check', questions: [
        mc('Welches Verb ist das allgemeine Wort für „kochen“?', [opt('طَبَخَ', true), opt('غَلَى', false)]),
        mc('Welche Zubereitungsart nutzt heißes Öl?', [opt('قَلَى', true), opt('شَوَى', false)]),
        mc('غَلَّايَة (Wasserkocher) und غَلَى (sieden) teilen sich…', [opt('dieselbe Wurzel', true), opt('keine Verbindung', false)])
      ] }
    ]
  }
];

// --- Anwenden -----------------------------------------------------------------------------
const theoryData = JSON.parse(fs.readFileSync(THEORY_PATH, 'utf-8'));
const byId = new Map(theoryData.theories.map((t, i) => [t.theory_id, i]));

let replaced = 0;
for (const doc of DOCS) {
  if (byId.has(doc.theory_id)) {
    theoryData.theories[byId.get(doc.theory_id)] = doc;
  } else {
    theoryData.theories.push(doc);
    byId.set(doc.theory_id, theoryData.theories.length - 1);
  }
  replaced += 1;
}

fs.writeFileSync(THEORY_PATH, `${JSON.stringify(theoryData, null, 2)}\n`, 'utf-8');
console.log(`Theoriedokumente ersetzt/angelegt: ${replaced}`);
console.log(`Theoriedokumente insgesamt: ${theoryData.theories.length}`);
