#!/usr/bin/env node
// Entwicklungsauftrag 10, Abschnitt 5 — ersetzt die 15 Platzhalter-Theoriedokumente der Units
// 21-25 durch vollständige, auf die jeweiligen 10 Wörter jeder Session zugeschnittene Theorie.
// Idempotent (ersetzt anhand der theory_id, egal ob Platzhalter oder bereits echt).
//
// Unit 21 (Position/Richtung/Präpositionen) verlangt laut Auftrag Abschnitt 4 besondere Sorgfalt:
// legitime deutsche Mehrdeutigkeiten (فَوْقَ/عَنْ beide "über", أَمَامَ/قَبْلَ beide "vor") werden hier
// bewusst NICHT künstlich aufgelöst, sondern explizit erklärt (räumlich vs. nicht-räumlich bzw.
// räumlich vs. zeitlich).

const fs = require('fs');
const path = require('path');
const { writeJsonFileAtomic } = require('./writeJsonAtomic.js');

const ROOT = path.join(__dirname, '..');
const THEORY_PATH = path.join(ROOT, 'language-packs', 'arabic', 'theory.json');

function mc(question, options, explanation) {
  const q = { question, options };
  if (explanation) q.explanation = explanation;
  return q;
}
function opt(text, correct) { return { text, correct }; }

const DOCS = [
  // ============================== UNIT 21 (Position, Richtung, Präpositionen) ==============================
  {
    theory_id: 'theory_vocab_unit_21_a',
    title: 'Position, Richtung und wichtige Präpositionen (1)',
    content_status: 'needs_language_review',
    learning_objectives: [
      'Die räumlichen Grundpräpositionen في/على/تحت sicher unterscheiden.',
      'فَوْقَ (räumlich "über") von عَنْ (nicht-räumlich "über", Session C) bewusst getrennt halten.',
      'أَمَامَ (räumlich "vor") von قَبْلَ (zeitlich "vor", Session C) bewusst getrennt halten.'
    ],
    blocks: [
      { type: 'paragraph', text: 'Diese Unit führt die wichtigsten arabischen Präpositionen ein — kleine, unveränderliche Wörter, die die Position oder Richtung eines Dinges beschreiben. Anders als bei Substantiven oder Verben lohnt es sich bei Präpositionen besonders, sie in kurzen Beispielsätzen statt isoliert zu lernen. Diese Session beginnt mit den drei Grundpräpositionen فِي (in, etwas befindet sich INNERHALB eines Ortes), عَلَى (auf, etwas liegt AUF einer Oberfläche) und تَحْتَ (unter, etwas liegt UNTERHALB von etwas).' },
      { type: 'paragraph', text: 'Wichtiger Hinweis zu Mehrdeutigkeiten: فَوْقَ (über/oberhalb) beschreibt hier eine RÄUMLICHE Position — z. B. ein Bild hängt فَوْقَ dem Tisch. Später in Session C lernst du عَنْ, das im Deutschen ebenfalls oft mit "über" übersetzt wird, aber ein GANZ ANDERES arabisches Wort ist und ein Gesprächsthema meint ("über etwas sprechen"), nicht eine Position. Diese doppelte deutsche Übersetzung ist keine Unschärfe des Kurses, sondern eine echte Eigenschaft der deutschen Sprache — zwei unterschiedliche arabische Wörter werden zufällig gleich übersetzt. Genauso verhält es sich mit أَمَامَ (räumlich "vor", z. B. vor dem Haus stehen) gegenüber قَبْلَ (zeitlich "vor", Session C, z. B. vor dem Essen).' },
      { type: 'heading', level: 'full', text: 'Mehr erfahren: warum Präpositionen keine Vokabelkarten wie Substantive sind' },
      { type: 'paragraph', level: 'full', text: 'Arabische Präpositionen haben (anders als Substantive) kein Genus und keinen Plural — deshalb bleiben diese Felder bei allen Präpositionen dieser Unit leer, aber bewusst vorhanden (das Feld existiert, der Wert ist "nicht zutreffend", nicht "vergessen"). Am besten lernst du jede Präposition zusammen mit einem kurzen Beispielsatz statt als isoliertes Wort — die reine deutsche Übersetzung reicht bei Präpositionen oft nicht aus, um sie später richtig anzuwenden.' },
      { type: 'callout', variant: 'tip', title: 'Merke', text: 'فِي (in) – عَلَى (auf) – تَحْتَ (unter) – فَوْقَ (räumlich über): vier grundlegende Positions-Präpositionen, am besten mit Beispielsätzen gelernt.' },
      { type: 'callout', variant: 'info', title: 'Typischer Fehler', text: 'فَوْقَ und عَنْ werden oft verwechselt, weil beide "über" bedeuten können — فَوْقَ ist immer räumlich (Position), عَنْ ist ein Gesprächsthema oder eine Herkunft, nie eine Position.' },
      { type: 'example', arabic: 'اَلْقِطُّ فَوْقَ الطَّاوِلَة.', translation: 'Die Katze ist über/auf dem Tisch.', note: 'اَلطَّاوِلَة (Tisch) kennst du bereits aus dem Bestand.' },
      { type: 'example', arabic: 'اَلْكِتَابُ فِي الْحَقِيبَة.', translation: 'Das Buch ist in der Tasche.', note: 'اَلْحَقِيبَة (Tasche) kennst du bereits aus Unit 12.' },
      { type: 'example', arabic: 'اَلصُّورَةُ عَلَى الْجِدَار.', translation: 'Das Bild ist an der Wand.', note: 'عَلَى wird hier für "an" verwendet — ein weiteres Beispiel für kontextabhängige Übersetzung.' },
      { type: 'word_preview', word_ids: ['c1_u21_01', 'c1_u21_02', 'c1_u21_03', 'c1_u21_04', 'c1_u21_05', 'c1_u21_06', 'c1_u21_07', 'c1_u21_08', 'c1_u21_09', 'c1_u21_10'] },
      { type: 'mini_check', questions: [
        mc('فَوْقَ beschreibt…', [opt('eine räumliche Position (über/oberhalb)', true), opt('ein Gesprächsthema', false)], 'عَنْ (Session C) ist für Gesprächsthemen zuständig, nicht فَوْقَ.'),
        mc('Das Gegenteil von تَحْتَ (unter) ist…', [opt('فَوْقَ', true), opt('بَيْنَ', false)]),
        mc('بِجَانِبِ bedeutet…', [opt('neben', true), opt('zwischen', false)])
      ] }
    ]
  },
  {
    theory_id: 'theory_vocab_unit_21_b',
    title: 'Position, Richtung und wichtige Präpositionen (2)',
    content_status: 'needs_language_review',
    learning_objectives: [
      'دَاخِلَ/خَارِجَ als Gegensatzpaar für innen/außen anwenden.',
      'يَمِين/يَسَار (rechts/links) von den vier Himmelsrichtungen unterscheiden.',
      'Die vier Himmelsrichtungen شَمَال/جَنُوب/شَرْق/غَرْب sicher benennen.'
    ],
    blocks: [
      { type: 'paragraph', text: 'دَاخِلَ (innen/innerhalb) und خَارِجَ (außen/außerhalb) bilden ein klares Gegensatzpaar — du befindest dich entweder innerhalb oder außerhalb eines Raumes. يَمِين (rechts) und يَسَار (links) beschreiben dagegen eine relative Richtung bezogen auf DICH selbst — anders als die vier Himmelsrichtungen, die unabhängig davon, wohin du gerade schaust, immer gleich bleiben.' },
      { type: 'paragraph', text: 'Diese Session führt die vier Himmelsrichtungen ein: شَمَال (Norden) ↔ جَنُوب (Süden) und شَرْق (Osten) ↔ غَرْب (Westen). Diese vier Wörter sind Substantive (nicht Präpositionen) — du benutzt sie z. B. beim Lesen einer Landkarte oder um eine grobe Richtung anzugeben. إِلَى الْأَمَام (geradeaus/nach vorne) rundet die Session als praktische Wegbeschreibung ab.' },
      { type: 'heading', level: 'full', text: 'Mehr erfahren: rechts/links vs. Himmelsrichtungen' },
      { type: 'paragraph', level: 'full', text: 'يَمِين/يَسَار (rechts/links) ändern sich, je nachdem, in welche Richtung du gerade schaust — drehst du dich um 180°, tauschen rechts und links die Seite. شَمَال/جَنُوب/شَرْق/غَرْب (Himmelsrichtungen) bleiben dagegen immer an derselben Stelle, unabhängig von deiner eigenen Blickrichtung — deshalb werden sie auf Landkarten und bei genauen Ortsangaben bevorzugt, während رechts/links im Alltag praktischer sind, um jemandem den direkten Weg zu beschreiben.' },
      { type: 'callout', variant: 'tip', title: 'Merke', text: 'دَاخِلَ↔خَارِجَ, يَمِين↔يَسَار, شَمَال↔جَنُوب, شَرْق↔غَرْب — vier neue Gegensatzpaare in dieser Session.' },
      { type: 'callout', variant: 'info', title: 'Typischer Fehler', text: 'يَسَار (links) klingt nicht wie شَمَال (Norden), sollte aber inhaltlich nicht verwechselt werden — beide können umgangssprachlich mit "links" assoziiert werden, in diesem Kurs bezeichnet شَمَال aber ausschließlich die Himmelsrichtung Norden.' },
      { type: 'example', arabic: 'اِتَّجِهْ إِلَى الْأَمَامِ ثُمَّ اَلْيَمِين.', translation: 'Geh geradeaus und dann nach rechts.', note: 'اِتَّجِهْ (geh/wende dich) hier nur zur Veranschaulichung markiert.' },
      { type: 'example', arabic: 'اَلشَّمْسُ تُشْرِقُ مِنَ الشَّرْق.', translation: 'Die Sonne geht im Osten auf.', note: 'اَلشَّمْس (Sonne) kennst du bereits aus dem Bestand.' },
      { type: 'example', arabic: 'اَلْحَدِيقَةُ دَاخِلَ الْمَبْنَى، لَيْسَ خَارِجَهُ.', translation: 'Der Garten ist innerhalb des Gebäudes, nicht außerhalb.', note: 'لَيْسَ (ist nicht) kennst du bereits aus dem Bestand.' },
      { type: 'word_preview', word_ids: ['c1_u21_11', 'c1_u21_12', 'c1_u21_13', 'c1_u21_14', 'c1_u21_15', 'c1_u21_16', 'c1_u21_17', 'c1_u21_18', 'c1_u21_19', 'c1_u21_20'] },
      { type: 'mini_check', questions: [
        mc('Was bleibt gleich, egal in welche Richtung du schaust?', [opt('شَمَال/جَنُوب/شَرْق/غَرْب (Himmelsrichtungen)', true), opt('يَمِين/يَسَار (rechts/links)', false)]),
        mc('Das Gegenteil von دَاخِلَ ist…', [opt('خَارِجَ', true), opt('إِلَى', false)]),
        mc('غَرْب bedeutet…', [opt('Westen', true), opt('Süden', false)])
      ] }
    ]
  },
  {
    theory_id: 'theory_vocab_unit_21_c',
    title: 'Position, Richtung und wichtige Präpositionen (3)',
    content_status: 'needs_language_review',
    learning_objectives: [
      'قَبْلَ (zeitlich "vor") von أَمَامَ (räumlich "vor", Session A) bewusst getrennt anwenden.',
      'عَنْ (nicht-räumlich "über") von فَوْقَ (räumlich "über", Session A) bewusst getrennt anwenden.',
      'مِنْ als bewusstes Homonym mit مَنْ (wer) erkennen.'
    ],
    blocks: [
      { type: 'paragraph', text: 'Diese letzte Session der Unit sammelt Präpositionen für Herkunft, Begleitung und Zeit. مِنْ (von/aus) beschreibt eine Herkunft — unvokalisiert sieht es genauso aus wie مَنْ (wer, aus dem Bestand) — ein bewusstes Homonym: مِنْ (von, mit Sukun auf dem ن) und مَنْ (wer, mit Fatha) unterscheiden sich nur durch die Vokalisierung, im unvokalisierten Alltagstext ist nur der Satzzusammenhang entscheidend. مَعَ (mit) ↔ بِدُونِ (ohne) ist ein klares Gegensatzpaar, مِنْ أَجْلِ (für/um … zu) drückt einen Zweck aus.' },
      { type: 'paragraph', text: 'Jetzt löst sich die in Session A angekündigte Mehrdeutigkeit auf: عَنْ bedeutet ebenfalls oft "über", aber NICHT räumlich — عَنْ beschreibt ein Gesprächsthema ("über etwas sprechen") oder eine Trennung/Herkunft, nie eine physische Position (dafür ist فَوْقَ zuständig, Session A). Genauso ist قَبْلَ (vor/vorher) rein ZEITLICH gemeint ("vor dem Essen") — anders als أَمَامَ (räumlich "vor", Session A, "vor dem Haus stehen"). بَعْدَ (nach/danach) ist das Gegenteil von قَبْلَ. خِلَالَ (während/innerhalb) beschreibt einen Zeitraum, مُقَابِلَ (gegenüber) wieder eine räumliche Position. اِتِّجَاه (Richtung) schließt die ganze Unit thematisch passend ab.' },
      { type: 'heading', level: 'full', text: 'Mehr erfahren: räumlich vs. zeitlich — ein wiederkehrendes Muster' },
      { type: 'paragraph', level: 'full', text: 'Die Unterscheidung räumlich/zeitlich begegnet dir im Deutschen auch (z. B. "vor dem Haus" vs. "vor dem Essen") — im Deutschen wird dafür dasselbe Wort "vor" verwendet, im Arabischen ZWEI unterschiedliche Wörter (أَمَامَ vs. قَبْلَ). Das ist ein guter Grund, warum reines Auswendiglernen einzelner deutscher Übersetzungen bei Präpositionen an Grenzen stößt — der Kontext (räumlich oder zeitlich?) entscheidet, welches arabische Wort richtig ist.' },
      { type: 'callout', variant: 'tip', title: 'Merke', text: 'عَنْ = "über" als GESPRÄCHSTHEMA, قَبْلَ = "vor" ZEITLICH — beide unterscheiden sich klar von ihren räumlichen "Zwillingen" فَوْقَ/أَمَامَ aus Session A.' },
      { type: 'callout', variant: 'info', title: 'Typischer Fehler', text: 'مِنْ (von, Präposition) und مَنْ (wer, Fragewort) sehen unvokalisiert identisch aus — beim Lesen ohne Vokalzeichen hilft nur der Satzzusammenhang, beim Hören die Vokalisierung.' },
      { type: 'example', arabic: 'تَحَدَّثْنَا عَنِ الْكِتَابِ قَبْلَ الِاجْتِمَاع.', translation: 'Wir haben vor dem Treffen über das Buch gesprochen.', note: 'عَنِ (über, Thema) und قَبْلَ (vor, zeitlich) hier gemeinsam im selben Satz.' },
      { type: 'example', arabic: 'مِنْ أَيْنَ أَنْتَ؟ — أَنَا مِنْ أَلْمَانْيَا.', translation: 'Woher kommst du? — Ich bin aus Deutschland.', note: 'مِنْ أَيْنَ (woher) kennst du in ähnlicher Form aus dem Bestand.' },
      { type: 'example', arabic: 'اَلْبَنْكُ مُقَابِلَ الْمَحَطَّة.', translation: 'Die Bank ist gegenüber vom Bahnhof.', note: 'اَلْبَنْك/اَلْمَحَطَّة kennst du bereits aus dem Bestand.' },
      { type: 'word_preview', word_ids: ['c1_u21_21', 'c1_u21_22', 'c1_u21_23', 'c1_u21_24', 'c1_u21_25', 'c1_u21_26', 'c1_u21_27', 'c1_u21_28', 'c1_u21_29', 'c1_u21_30'] },
      { type: 'mini_check', questions: [
        mc('عَنْ bedeutet in diesem Kurs…', [opt('über ein Gesprächsthema, NICHT räumlich', true), opt('räumlich über/oberhalb', false)], 'Räumlich "über" ist فَوْقَ aus Session A.'),
        mc('قَبْلَ bezieht sich auf…', [opt('Zeit (vorher)', true), opt('einen Ort (davor stehen)', false)]),
        mc('مِنْ sieht unvokalisiert genauso aus wie welches Wort?', [opt('مَنْ (wer)', true), opt('مَعَ (mit)', false)])
      ] }
    ]
  },
  // ============================== UNIT 22 (Verkehr, Reisen, Hotel) ==============================
  {
    theory_id: 'theory_vocab_unit_22_a',
    title: 'Verkehr, Reisen und Hotel (1)',
    content_status: 'needs_language_review',
    learning_objectives: [
      'Die sechs Verkehrsmittel aus dem Bestand um Reisedokumente ergänzen.',
      'تَذْكِرَة, جَوَاز سَفَر und تَأْشِيرَة als drei unterschiedliche Reisedokumente unterscheiden.',
      'أَمْتِعَة als Pluraletantum (nur im Plural gebräuchlich) einordnen.'
    ],
    blocks: [
      { type: 'paragraph', text: 'Diese Unit dreht sich ums Reisen. Du kennst aus dem Bestand bereits sechs Verkehrsmittel: سَيَّارَة (Auto), حَافِلَة (Bus), قِطَار (Zug), طَائِرَة (Flugzeug), دَرَّاجَة (Fahrrad) und سَفِينَة (Schiff). Diese Session ergänzt drei wichtige Reisedokumente: تَذْكِرَة (Fahrkarte/Ticket, dein Beleg für eine einzelne Fahrt), جَوَاز سَفَر (Reisepass, dein amtliches Ausweisdokument für Auslandsreisen) und تَأْشِيرَة (Visum, eine zusätzliche Einreiseerlaubnis für manche Länder).' },
      { type: 'paragraph', text: 'أَمْتِعَة (Gepäck) rundet die Session ab — dieses Wort steht im Arabischen praktisch immer im Plural (ein Pluraletantum, ähnlich wie نُقُود "Geld" aus Unit 11), auch wenn du im Deutschen von "dem Gepäck" (Singular) sprichst.' },
      { type: 'heading', level: 'full', text: 'Mehr erfahren: welches Dokument brauchst du wann?' },
      { type: 'paragraph', level: 'full', text: 'Die drei Reisedokumente dieser Session haben unterschiedliche Funktionen: جَوَاز سَفَر identifiziert DICH als Person (wie ein Personalausweis fürs Ausland), تَأْشِيرَة erlaubt dir die Einreise in ein bestimmtes Land für einen bestimmten Zeitraum, تَذْكِرَة berechtigt dich zu einer einzelnen Fahrt/einem einzelnen Flug. Nicht jede Reise braucht alle drei — innerhalb der EU reicht oft der Personalausweis statt eines Reisepasses, und viele Länder verlangen kein Visum von deutschen Staatsangehörigen.' },
      { type: 'callout', variant: 'tip', title: 'Merke', text: 'جَوَاز سَفَر identifiziert dich, تَأْشِيرَة erlaubt die Einreise, تَذْكِرَة berechtigt zu einer einzelnen Fahrt — drei unterschiedliche Zwecke.' },
      { type: 'callout', variant: 'info', title: 'Typischer Fehler', text: 'أَمْتِعَة (Gepäck) wird manchmal fälschlich im Singular verwendet — im Arabischen ist es wie نُقُود (Geld) praktisch immer Plural.' },
      { type: 'example', arabic: 'أَحْتَاجُ إِلَى تَأْشِيرَةٍ لِهَذِهِ الرِّحْلَة.', translation: 'Ich brauche ein Visum für diese Reise.', note: 'أَحْتَاجُ إِلَى (ich brauche) kennst du bereits aus dem Bestand.' },
      { type: 'example', arabic: 'أَيْنَ جَوَازُ سَفَرِي؟', translation: 'Wo ist mein Reisepass?', note: 'أَيْنَ (wo) kennst du bereits aus dem Bestand.' },
      { type: 'example', arabic: 'اَلطَّائِرَةُ سَرِيعَةٌ مِنَ السَّفِينَة.', translation: 'Das Flugzeug ist schneller als das Schiff.', note: 'سَرِيع (schnell) kennst du bereits aus Unit 19.' },
      { type: 'word_preview', word_ids: ['transport_car', 'transport_bus', 'transport_train', 'transport_plane', 'transport_bike', 'transport_ship', 'c1_u22_01', 'c1_u22_02', 'c1_u22_03', 'c1_u22_04'] },
      { type: 'mini_check', questions: [
        mc('Welches Dokument identifiziert dich als Person?', [opt('جَوَاز سَفَر', true), opt('تَذْكِرَة', false)]),
        mc('أَمْتِعَة steht typischerweise…', [opt('im Plural', true), opt('nur im Singular', false)]),
        mc('تَأْشِيرَة bedeutet…', [opt('Visum', true), opt('Ticket', false)])
      ] }
    ]
  },
  {
    theory_id: 'theory_vocab_unit_22_b',
    title: 'Verkehr, Reisen und Hotel (2)',
    content_status: 'needs_language_review',
    learning_objectives: [
      'مُغَادَرَة/وُصُول als Gegensatzpaar für Abfahrt/Ankunft anwenden.',
      'غُرْفَة مُفْرَدَة von غُرْفَة مُزْدَوِجَة (Einzel-/Doppelzimmer) unterscheiden.',
      'Den typischen Hotel-Wortschatz (Rezeption, Schlüssel, Reservierung) sicher benennen.'
    ],
    blocks: [
      { type: 'paragraph', text: 'حَقِيبَة سَفَر (Koffer/Reisetasche) und رِحْلَة (Reise/Fahrt) sind zentrale Reisewörter — رِحْلَة begegnet dir später noch in زusammengesetzten Formen wie رِحْلَة جَوِّيَّة (Flug, Session C). سَائِح (Tourist) beschreibt eine Person, die zum Vergnügen reist, nicht zur Arbeit.' },
      { type: 'paragraph', text: 'Diese Session sammelt außerdem den typischen Hotel-Wortschatz: حَجْز (Reservierung) machst du VOR der Ankunft, اِسْتِقْبَال (Rezeption/Empfang) ist der Ort, an dem du dich BEI der Ankunft meldest, مِفْتَاح الْغُرْفَة (Zimmerschlüssel) bekommst du dort. غُرْفَة مُفْرَدَة (Einzelzimmer) und غُرْفَة مُزْدَوِجَة (Doppelzimmer) unterscheiden sich in der Anzahl der Personen. Zum Abschluss lernst du das Gegensatzpaar مُغَادَرَة (Abfahrt/Abreise) ↔ وُصُول (Ankunft).' },
      { type: 'heading', level: 'full', text: 'Mehr erfahren: مُفْرَدَة/مُزْدَوِجَة als wiederkehrende Adjektive' },
      { type: 'paragraph', level: 'full', text: 'مُفْرَدَة (einzeln/Einzel-) und مُزْدَوِجَة (doppelt/Doppel-) sind Adjektive, die sich nicht nur auf Hotelzimmer beziehen — مُفْرَدَة begegnet dir z. B. auch in der Grammatik ("Singular"), مُزْدَوِجَة in anderen Zusammenhängen für "doppelt/gepaart". Hier lernst du sie zunächst im konkreten, alltäglichen Kontext des Hotelzimmers.' },
      { type: 'callout', variant: 'tip', title: 'Merke', text: 'حَجْز (VOR der Ankunft) → اِسْتِقْبَال (BEI der Ankunft) → مِفْتَاح الْغُرْفَة (NACH dem Einchecken) — die typische Reihenfolge im Hotel.' },
      { type: 'callout', variant: 'info', title: 'Typischer Fehler', text: 'مُغَادَرَة (Abfahrt/Abreise) und وُصُول (Ankunft) werden auf Anzeigetafeln oft nebeneinander angezeigt und leicht verwechselt — مُغَادَرَة ist immer der Startpunkt, وُصُول das Ziel.' },
      { type: 'example', arabic: 'لَدَيَّ حَجْزٌ لِغُرْفَةٍ مُزْدَوِجَة.', translation: 'Ich habe eine Reservierung für ein Doppelzimmer.', note: 'لَدَيَّ (ich habe) kennst du bereits aus dem Bestand.' },
      { type: 'example', arabic: 'مَتَى وَقْتُ الْمُغَادَرَة؟', translation: 'Wann ist die Abfahrtszeit?', note: 'مَتَى (wann) kennst du bereits aus dem Bestand.' },
      { type: 'example', arabic: 'اَلِاسْتِقْبَالُ مَفْتُوحٌ طَوَالَ الْيَوْم.', translation: 'Die Rezeption ist den ganzen Tag geöffnet.', note: 'مَفْتُوح (geöffnet) kennst du bereits aus Unit 11.' },
      { type: 'word_preview', word_ids: ['c1_u22_05', 'c1_u22_06', 'c1_u22_07', 'c1_u22_08', 'c1_u22_09', 'c1_u22_10', 'c1_u22_11', 'c1_u22_12', 'c1_u22_13', 'c1_u22_14'] },
      { type: 'mini_check', questions: [
        mc('Was machst du VOR der Ankunft im Hotel?', [opt('حَجْز (Reservierung)', true), opt('مُغَادَرَة (Abreise)', false)]),
        mc('Das Gegenteil von وُصُول ist…', [opt('مُغَادَرَة', true), opt('حَجْز', false)]),
        mc('غُرْفَة مُفْرَدَة bedeutet…', [opt('Einzelzimmer', true), opt('Doppelzimmer', false)])
      ] }
    ]
  },
  {
    theory_id: 'theory_vocab_unit_22_c',
    title: 'Verkehr, Reisen und Hotel (3)',
    content_status: 'needs_language_review',
    learning_objectives: [
      'Bahnhof/Flughafen-Vokabular (Bahnsteig, Gate, Sitzplatz) sicher benennen.',
      'خَرِيطَة klar von بِطَاقَة (Karte/Bankkarte, Unit 11) abgrenzen.',
      'Weitere Verkehrsmittel (Taxi, U-Bahn, Boot) und den Flug ergänzen.'
    ],
    blocks: [
      { type: 'paragraph', text: 'Diese letzte Session der Unit sammelt Wörter, die dir am Bahnhof oder Flughafen begegnen: رَصِيف الْقِطَار (Bahnsteig, wo du auf den Zug wartest), بَوَّابَة (Gate/Tor, wo du am Flughafen zum Flugzeug gehst) und مَقْعَد (Sitzplatz, dein reservierter Platz). طَرِيق (Straße/Weg) ist der allgemeine Begriff für eine Route.' },
      { type: 'paragraph', text: 'خَرِيطَة bedeutet "Landkarte" — beachte den Unterschied zu بِطَاقَة (Karte im Sinne von Bankkarte, aus Unit 11): im Deutschen heißen beide "Karte", im Arabischen sind es zwei völlig unterschiedliche Wörter. Zum Abschluss lernst du drei weitere Verkehrsmittel: مَوْقِف الْحَافِلَة (Bushaltestelle), سَيَّارَة أُجْرَة (Taxi, wörtlich "Mietauto"), مِتْرُو (U-Bahn, ein Lehnwort) und قَارِب (Boot, kleiner als سَفِينَة/Schiff aus dem Bestand) sowie رِحْلَة جَوِّيَّة (Flug, zusammengesetzt aus رِحْلَة "Reise" + جَوِّيَّة "luftig/Flug-").' },
      { type: 'heading', level: 'full', text: 'Mehr erfahren: zwei deutsche Wörter, zwei arabische Wörter für "Karte"' },
      { type: 'paragraph', level: 'full', text: 'Diese Session schließt die Unterscheidung von "Karte" endgültig: خَرِيطَة (Landkarte, zum Orientieren) und بِطَاقَة (Bankkarte, zum Bezahlen, aus Unit 11) — beide werden im Deutschen "Karte" genannt, sind im Arabischen aber unterschiedliche Wörter mit unterschiedlicher Wurzel. Diese Art von Mehrdeutigkeit in der deutschen Übersetzung (nicht in der arabischen Sprache selbst) begegnet dir im Kurs immer wieder — die Lösung ist immer, sich am arabischen Wort statt an der deutschen Übersetzung zu orientieren.' },
      { type: 'callout', variant: 'tip', title: 'Merke', text: 'خَرِيطَة (Landkarte) und بِطَاقَة (Bankkarte, Unit 11) sind im Deutschen beide "Karte", im Arabischen aber zwei unterschiedliche Wörter.' },
      { type: 'callout', variant: 'info', title: 'Typischer Fehler', text: 'قَارِب (Boot) und سَفِينَة (Schiff, aus dem Bestand) werden manchmal gleichgesetzt — قَارِب ist deutlich kleiner (z. B. ein Ruderboot), سَفِينَة ist ein großes Schiff.' },
      { type: 'example', arabic: 'مَقْعَدِي بِجَانِبِ النَّافِذَة.', translation: 'Mein Sitzplatz ist neben dem Fenster.', note: 'بِجَانِبِ (neben) kennst du bereits aus Session A dieser Unit.' },
      { type: 'example', arabic: 'أَيْنَ مَوْقِفُ الْحَافِلَةِ الْقَرِيب؟', translation: 'Wo ist die nächste Bushaltestelle?', note: 'قَرِيب (nah) hier nur zur Veranschaulichung markiert.' },
      { type: 'example', arabic: 'اِسْتَخْدَمْتُ الْخَرِيطَةَ لِإِيجَادِ الطَّرِيق.', translation: 'Ich habe die Karte benutzt, um den Weg zu finden.', note: 'اِسْتَخْدَمَ (benutzen) kennst du bereits aus Unit 17.' },
      { type: 'word_preview', word_ids: ['c1_u22_15', 'c1_u22_16', 'c1_u22_17', 'c1_u22_18', 'c1_u22_19', 'c1_u22_20', 'c1_u22_21', 'c1_u22_22', 'c1_u22_23', 'c1_u22_24'] },
      { type: 'mini_check', questions: [
        mc('خَرِيطَة bedeutet…', [opt('Landkarte', true), opt('Bankkarte', false)]),
        mc('Welches Verkehrsmittel ist am kleinsten?', [opt('قَارِب (Boot)', true), opt('سَفِينَة (Schiff)', false)]),
        mc('بَوَّابَة bedeutet…', [opt('Gate/Tor', true), opt('Bahnsteig', false)])
      ] }
    ]
  },
  // ============================== UNIT 23 (Schule, Unterricht, Schulsachen) ==============================
  {
    theory_id: 'theory_vocab_unit_23_a',
    title: 'Schule, Unterricht und Schulsachen (1)',
    content_status: 'needs_language_review',
    learning_objectives: [
      'Die vier Schulsachen aus dem Bestand um Grundbegriffe der Schule ergänzen.',
      'تِلْمِيذ (Schüler) von den bereits bekannten Studierenden-Wörtern (Unit 24) abgrenzen.',
      'قَلَم von قَلَم رَصَاص (Stift/Bleistift) unterscheiden.'
    ],
    blocks: [
      { type: 'paragraph', text: 'Du kennst aus dem Bestand bereits vier Schulsachen: حَقِيبَة (Tasche/Rucksack), سَبُّورَة (Tafel), مِمْحَاة (Radiergummi) und مِسْطَرَة (Lineal). Diese Session ergänzt den Grundwortschatz rund um die Schule: صَفّ (Klasse/Unterrichtsraum, der Ort, an dem Unterricht stattfindet) und تِلْمِيذ (Schüler, eine Person, die noch die Schule besucht — anders als طَالِب/طَالِبَة aus Unit 24, die für Studierende an der Universität stehen).' },
      { type: 'paragraph', text: 'Danach folgen die klassischen Schreibwerkzeuge: كِتَاب (Buch), دَفْتَر (Heft/Notizbuch), قَلَم (Stift/Kugelschreiber) und قَلَم رَصَاص (Bleistift, wörtlich "Stift aus Blei"). قَلَم ist der Oberbegriff für Schreibgeräte allgemein, قَلَم رَصَاص bezeichnet speziell den Bleistift, mit dem du wieder ausradieren kannst.' },
      { type: 'heading', level: 'full', text: 'Mehr erfahren: تِلْمِيذ vs. طَالِب' },
      { type: 'paragraph', level: 'full', text: 'Im Arabischen gibt es (ähnlich wie im Deutschen "Schüler" vs. "Student") zwei unterschiedliche Wörter je nach Bildungsstufe: تِلْمِيذ bezeichnet eine Person an der Schule (Unit 23), طَالِب/طَالِبَة (aus dem Bestand, vertieft in Unit 24) eine Person an der Universität. Diese Unterscheidung ist im Arabischen genauso wichtig wie im Deutschen — die beiden Wörter sind nicht austauschbar.' },
      { type: 'callout', variant: 'tip', title: 'Merke', text: 'تِلْمِيذ = Schüler (Schule), طَالِب/طَالِبَة (aus dem Bestand) = Student/Studentin (Universität, siehe Unit 24) — nicht austauschbar.' },
      { type: 'callout', variant: 'info', title: 'Typischer Fehler', text: 'قَلَم (Stift, Oberbegriff) und قَلَم رَصَاص (Bleistift, spezifisch) werden oft gleichgesetzt — نicht jeder قَلَم ist ein قَلَم رَصَاص.' },
      { type: 'example', arabic: 'اَلتِّلْمِيذُ يَكْتُبُ فِي دَفْتَرِهِ.', translation: 'Der Schüler schreibt in sein Heft.', note: 'كَتَبَ (schreiben) kennst du bereits aus Unit 16.' },
      { type: 'example', arabic: 'أَحْتَاجُ قَلَمَ رَصَاصٍ لِهَذَا الِامْتِحَان.', translation: 'Ich brauche einen Bleistift für diese Prüfung.', note: 'اِمْتِحَان (Prüfung) kennst du bereits aus dem Bestand.' },
      { type: 'example', arabic: 'اَلْكِتَابُ عَلَى الطَّاوِلَةِ فِي الصَّفّ.', translation: 'Das Buch ist auf dem Tisch im Klassenraum.', note: 'عَلَى/فِي (auf/in) kennst du bereits aus Unit 21.' },
      { type: 'word_preview', word_ids: ['school_bag', 'school_board', 'school_eraser', 'school_ruler', 'c1_u23_01', 'c1_u23_02', 'c1_u23_03', 'c1_u23_04', 'c1_u23_05', 'c1_u23_06'] },
      { type: 'mini_check', questions: [
        mc('تِلْمِيذ bezeichnet eine Person…', [opt('an der Schule', true), opt('an der Universität', false)]),
        mc('قَلَم رَصَاص bedeutet…', [opt('Bleistift', true), opt('Kugelschreiber', false)]),
        mc('دَفْتَر bedeutet…', [opt('Heft/Notizbuch', true), opt('Buch', false)])
      ] }
    ]
  },
  {
    theory_id: 'theory_vocab_unit_23_b',
    title: 'Schule, Unterricht und Schulsachen (2)',
    content_status: 'needs_language_review',
    learning_objectives: [
      'رِيَاضِيَّات/عُلُوم/تَارِيخ/جُغْرَافْيَا als vier Schulfächer benennen.',
      'حِصَّة (Unterrichtsstunde) von مَادَّة (Schulfach) unterscheiden.',
      'سُؤَال als erstes Wort des Fragen/Antworten-Gegensatzpaars einordnen.'
    ],
    blocks: [
      { type: 'paragraph', text: 'وَرَقَة (Blatt Papier) und تَمْرِين (Übung) begegnen dir im Unterricht ständig. وَاجِب مَنْزِلِيّ (Hausaufgabe, wörtlich "häusliche Pflicht") machst du zu Hause, حِصَّة (Unterrichtsstunde) ist der Zeitabschnitt IN der Schule — nicht zu verwechseln mit مَادَّة (Schulfach), dem INHALT, der in einer حِصَّة unterrichtet wird (z. B. ist رِيَاضِيَّات eine مَادَّة, aber "die dritte حِصَّة am Montag" ein Zeitabschnitt).' },
      { type: 'paragraph', text: 'Vier konkrete Schulfächer runden die Session ab: رِيَاضِيَّات (Mathematik, ein Pluraletantum wie أَمْتِعَة aus Unit 22), عُلُوم (Naturwissenschaften, ebenfalls Pluraletantum — die Mehrzahl von عِلْم "Wissenschaft"), تَارِيخ (Geschichte — dasselbe Wort bedeutet in anderen Zusammenhängen auch "Datum") und جُغْرَافْيَا (Geografie, ein Lehnwort). Zum Abschluss beginnt mit سُؤَال (Frage) das Gegensatzpaar, das in Session C mit جَوَاب (Antwort) komplettiert wird.' },
      { type: 'heading', level: 'full', text: 'Mehr erfahren: warum رِيَاضِيَّات/عُلُوم im Plural stehen' },
      { type: 'paragraph', level: 'full', text: 'Beide Fächernamen sind ursprünglich Pluralformen: رِيَاضِيَّات ist der Plural von رِيَاضِيَّة (mathematische Disziplin), عُلُوم ist der Plural von عِلْم (eine einzelne Wissenschaft). Im Deutschen sagen wir "Mathematik" im Singular, im Arabischen wird dagegen die GESAMTHEIT der mathematischen Teilgebiete als Fachname verwendet — ähnlich wie im Deutschen "Naturwissenschaften" ebenfalls im Plural steht.' },
      { type: 'callout', variant: 'tip', title: 'Merke', text: 'حِصَّة = Zeitabschnitt (die dritte Stunde), مَادَّة = Fach-INHALT (Mathematik) — nicht dasselbe.' },
      { type: 'callout', variant: 'info', title: 'Typischer Fehler', text: 'تَارِيخ bedeutet sowohl "Geschichte" (Schulfach) als auch "Datum" — hier lernst du nur die Bedeutung "Geschichte", die andere Bedeutung begegnet dir in anderen Zusammenhängen (z. B. تَارِيخ الْمِيلَاد "Geburtsdatum", bereits aus Unit 4 bekannt).' },
      { type: 'example', arabic: 'مَادَّتِي الْمُفَضَّلَةُ هِيَ التَّارِيخ.', translation: 'Mein Lieblingsfach ist Geschichte.', note: 'مُفَضَّلَة (bevorzugt) verwandt mit فَضَّلَ aus Unit 18.' },
      { type: 'example', arabic: 'عِنْدَنَا حِصَّتَانِ رِيَاضِيَّاتٍ الْيَوْم.', translation: 'Wir haben heute zwei Mathematikstunden.', note: 'اَلْيَوْم (heute) kennst du bereits aus dem Bestand.' },
      { type: 'example', arabic: 'سَأَلَ الْمُعَلِّمُ سُؤَالاً صَعْباً.', translation: 'Der Lehrer stellte eine schwierige Frage.', note: 'سَأَلَ (fragen) aus Unit 18, صَعْب (schwierig) aus Unit 11.' },
      { type: 'word_preview', word_ids: ['c1_u23_07', 'c1_u23_08', 'c1_u23_09', 'c1_u23_10', 'c1_u23_11', 'c1_u23_12', 'c1_u23_13', 'c1_u23_14', 'c1_u23_15', 'c1_u23_16'] },
      { type: 'mini_check', questions: [
        mc('حِصَّة bezeichnet…', [opt('einen Zeitabschnitt (Unterrichtsstunde)', true), opt('den Fach-Inhalt', false)]),
        mc('Welches Fach ist ein Pluraletantum wie رِيَاضِيَّات؟', [opt('عُلُوم', true), opt('تَارِيخ', false)]),
        mc('وَاجِب مَنْزِلِيّ bedeutet…', [opt('Hausaufgabe', true), opt('Übung', false)])
      ] }
    ]
  },
  {
    theory_id: 'theory_vocab_unit_23_c',
    title: 'Schule, Unterricht und Schulsachen (3)',
    content_status: 'needs_language_review',
    learning_objectives: [
      'سُؤَال/جَوَاب als vollständiges Gegensatzpaar anwenden.',
      'دَرَجَة (Note, Schule) als Vorbereitung auf عَلَامَة (Note, Universität, Unit 24) einordnen.',
      'Weitere Schulmaterialien (Schere, Klebstoff, Wörterbuch) sicher benennen.'
    ],
    blocks: [
      { type: 'paragraph', text: 'Diese letzte Session der Unit vervollständigt das Gegensatzpaar aus Session B: جَوَاب (Antwort) ist das Gegenstück zu سُؤَال (Frage). دَرَجَة (Note/Punktzahl) bekommst du nach einer Prüfung — merke dir diesen Begriff, denn in Unit 24 lernst du mit عَلَامَة ein ähnliches, aber eigenständiges Wort für "Note", das dort speziell für die Universität verwendet wird.' },
      { type: 'paragraph', text: 'اِسْتِرَاحَة (Pause) und سَنَة دِرَاسِيَّة (Schuljahr) strukturieren den Schulalltag zeitlich. صَفْحَة (Seite) begegnet dir in jedem Buch. Zum Abschluss lernst du weiteres Schulmaterial: مِقَصّ (Schere), صَمْغ (Klebstoff), قَامُوس (Wörterbuch — praktisch für dein eigenes Arabischlernen!), مُخْتَبَر مَدْرَسِيّ (Schullabor) und اِمْتِحَان شَفَوِيّ (mündliche Prüfung, im Gegensatz zu einer schriftlichen Prüfung).' },
      { type: 'heading', level: 'full', text: 'Mehr erfahren: دَرَجَة vs. عَلَامَة — zwei Wörter für "Note"' },
      { type: 'paragraph', level: 'full', text: 'Genau wie bei "Aufgabe" (تَكْلِيف an der Uni vs. مُهِمَّة bei der Arbeit, siehe Unit 24/25) gibt es auch für "Note/Bewertung" zwei unterschiedliche arabische Wörter, je nach Bildungsstufe: دَرَجَة (Schule, diese Unit) und عَلَامَة (Universität, Unit 24). Dieses Muster — unterschiedliche arabische Wörter für denselben deutschen Begriff, abhängig vom Kontext — ist in diesem Kurs bewusst so gestaltet, damit du den richtigen Begriff für die richtige Situation lernst, statt ein einziges, zu allgemeines Wort zu verwenden.' },
      { type: 'callout', variant: 'tip', title: 'Merke', text: 'سُؤَال (Frage) ↔ جَوَاب (Antwort) — vollständiges Gegensatzpaar. دَرَجَة = Note in der SCHULE (نicht Universität).' },
      { type: 'callout', variant: 'info', title: 'Typischer Fehler', text: 'اِمْتِحَان شَفَوِيّ (mündliche Prüfung) wird manchmal mit اِمْتِحَان (Prüfung allgemein, aus dem Bestand) gleichgesetzt — اِمْتِحَان شَفَوِيّ ist speziell eine PRÜFUNG, bei der du sprichst statt schreibst.' },
      { type: 'example', arabic: 'أَجَابَ التِّلْمِيذُ عَنِ السُّؤَالِ بِشَكْلٍ صَحِيح.', translation: 'Der Schüler beantwortete die Frage richtig.', note: 'أَجَابَ (antworten) aus Unit 18, صَحِيح (richtig) aus Unit 19.' },
      { type: 'example', arabic: 'حَصَلْتُ عَلَى دَرَجَةٍ جَيِّدَةٍ فِي الِامْتِحَان.', translation: 'Ich habe eine gute Note in der Prüfung bekommen.', note: 'جَيِّد (gut) kennst du bereits aus Unit 19.' },
      { type: 'example', arabic: 'اِسْتَخْدَمْتُ الْقَامُوسَ لِفَهْمِ الْكَلِمَة.', translation: 'Ich habe das Wörterbuch benutzt, um das Wort zu verstehen.', note: 'فَهِمَ (verstehen) kennst du bereits aus dem Bestand.' },
      { type: 'word_preview', word_ids: ['c1_u23_17', 'c1_u23_18', 'c1_u23_19', 'c1_u23_20', 'c1_u23_21', 'c1_u23_22', 'c1_u23_23', 'c1_u23_24', 'c1_u23_25', 'c1_u23_26'] },
      { type: 'mini_check', questions: [
        mc('Das Gegenteil von سُؤَال ist…', [opt('جَوَاب', true), opt('دَرَجَة', false)]),
        mc('دَرَجَة (Note) verwendest du für…', [opt('die Schule', true), opt('nur die Universität', false)], 'An der Universität heißt "Note" عَلَامَة, siehe Unit 24.'),
        mc('اِمْتِحَان شَفَوِيّ bedeutet…', [opt('mündliche Prüfung', true), opt('schriftliche Prüfung', false)])
      ] }
    ]
  },
  // ============================== UNIT 24 (Universität, Studium, Prüfungen) ==============================
  {
    theory_id: 'theory_vocab_unit_24_a',
    title: 'Universität, Studium und Prüfungen (1)',
    content_status: 'needs_language_review',
    learning_objectives: [
      'Die sieben Universitäts-Grundwörter aus dem Bestand um die Struktur einer Universität ergänzen.',
      'كُلِّيَّة (Fakultät) von قِسْم (Fachbereich) unterscheiden.',
      'تِلْمِيذ (Schule, Unit 23) klar von طَالِب/طَالِبَة (Universität) abgrenzen.'
    ],
    blocks: [
      { type: 'paragraph', text: 'Du kennst aus dem Bestand bereits sieben Grundwörter rund um die Universität: جَامِعَة (Universität), طَالِب/طَالِبَة (Student/Studentin), أُسْتَاذ (Professor/Lehrer), مُحَاضَرَة (Vorlesung), اِمْتِحَان (Prüfung) und مَكْتَبَة (Bibliothek). Diese Unit vertieft das akademische Leben. Zuerst die Struktur: eine جَامِعَة besteht aus mehreren كُلِّيَّة (Fakultäten, z. B. die Fakultät für Naturwissenschaften), und jede كُلِّيَّة besteht wiederum aus mehreren قِسْم (Fachbereichen/Abteilungen).' },
      { type: 'paragraph', text: 'حَرَم جَامِعِيّ (Campus) bezeichnet das gesamte Gelände der Universität — alle Gebäude, Wege und Grünflächen zusammen. Erinnere dich an تِلْمِيذ aus Unit 23: das war für Schüler AN DER SCHULE — طَالِب/طَالِبَة (aus dem Bestand) bezeichnet dagegen Studierende AN DER UNIVERSITÄT. Diese beiden Wörter sind nicht austauschbar.' },
      { type: 'heading', level: 'full', text: 'Mehr erfahren: die Struktur einer arabischen Universität' },
      { type: 'paragraph', level: 'full', text: 'Die Gliederung جَامِعَة → كُلِّيَّة → قِسْم entspricht ungefähr der deutschen Struktur Universität → Fakultät → Institut/Fachbereich. Diese Hierarchie ist an arabischsprachigen Universitäten sehr ähnlich zu deutschen Hochschulen aufgebaut, auch wenn sich einzelne Bezeichnungen zwischen Ländern leicht unterscheiden können.' },
      { type: 'callout', variant: 'tip', title: 'Merke', text: 'جَامِعَة (Universität) → كُلِّيَّة (Fakultät) → قِسْم (Fachbereich) — von groß nach klein.' },
      { type: 'callout', variant: 'info', title: 'Typischer Fehler', text: 'تِلْمِيذ (Schüler, Unit 23) und طَالِب/طَالِبَة (Student/in, aus dem Bestand) werden manchmal verwechselt — تِلْمِيذ ist ausschließlich für die Schule, طَالِب/طَالِبَة für die Universität.' },
      { type: 'example', arabic: 'أَدْرُسُ فِي كُلِّيَّةِ الْعُلُوم.', translation: 'Ich studiere in der naturwissenschaftlichen Fakultät.', note: 'دَرَسَ (lernen/studieren) kennst du bereits aus dem Bestand.' },
      { type: 'example', arabic: 'اَلْحَرَمُ الْجَامِعِيُّ كَبِيرٌ جِدّاً.', translation: 'Der Campus ist sehr groß.', note: 'كَبِير (groß) kennst du bereits aus Unit 19.' },
      { type: 'example', arabic: 'هَذَا الْقِسْمُ لَهُ أُسْتَاذٌ مَشْهُور.', translation: 'Dieser Fachbereich hat einen berühmten Professor.', note: 'مَشْهُور (berühmt) hier nur zur Veranschaulichung markiert.' },
      { type: 'word_preview', word_ids: ['uni_university', 'uni_student_m', 'uni_student_f', 'uni_professor', 'uni_lecture', 'uni_exam', 'uni_library', 'c1_u24_01', 'c1_u24_02', 'c1_u24_03'] },
      { type: 'mini_check', questions: [
        mc('Was ist größer: كُلِّيَّة oder قِسْم؟', [opt('كُلِّيَّة (Fakultät)', true), opt('قِسْم (Fachbereich)', false)]),
        mc('طَالِب/طَالِبَة bezeichnet eine Person…', [opt('an der Universität', true), opt('an der Schule', false)]),
        mc('حَرَم جَامِعِيّ bedeutet…', [opt('Campus', true), opt('Fakultät', false)])
      ] }
    ]
  },
  {
    theory_id: 'theory_vocab_unit_24_b',
    title: 'Universität, Studium und Prüfungen (2)',
    content_status: 'needs_language_review',
    learning_objectives: [
      'فَصْل دِرَاسِيّ (Semester) und مُقَرَّر (Kurs) als organisatorische Einheiten einordnen.',
      'Die drei akademischen Abschlüsse بَكَالُورْيُوس/مَاجِسْتِير/دُكْتُورَاه in der richtigen Reihenfolge benennen.',
      'أُطْرُوحَة von بَحْث (Abschlussarbeit vs. Forschung allgemein) unterscheiden.'
    ],
    blocks: [
      { type: 'paragraph', text: 'فَصْل دِرَاسِيّ (Semester) ist die zeitliche Grundeinheit deines Studiums — innerhalb eines فَصْل دِرَاسِيّ belegst du mehrere مُقَرَّر (Kurse/Lehrveranstaltungen), und mehrere مُقَرَّر zusammen können eine وَحْدَة دِرَاسِيَّة (Modul) bilden. Am Ende deines Studiums bekommst du eine دَرَجَة عِلْمِيَّة (akademischer Abschluss).' },
      { type: 'paragraph', text: 'Diese Session stellt die drei häufigsten akademischen Abschlüsse in aufsteigender Reihenfolge vor: بَكَالُورْيُوس (Bachelor, der erste Abschluss), مَاجِسْتِير (Master, meist danach) und دُكْتُورَاه (Doktorgrad/Promotion, der höchste der drei). Für die دُكْتُورَاه schreibst du eine أُطْرُوحَة (Abschlussarbeit/Dissertation) — das Ergebnis von بَحْث (Forschung, dem allgemeinen wissenschaftlichen Arbeitsprozess). مَشْرُوع (Projekt) rundet die Session ab.' },
      { type: 'heading', level: 'full', text: 'Mehr erfahren: بَحْث als Prozess, أُطْرُوحَة als Ergebnis' },
      { type: 'paragraph', level: 'full', text: 'بَحْث (Forschung) beschreibt die TÄTIGKEIT des wissenschaftlichen Arbeitens — du betreibst بَحْث über einen längeren Zeitraum. أُطْرُوحَة (Abschlussarbeit/Dissertation) ist dagegen das konkrete, geschriebene ERGEBNIS dieser Forschung — ein einzelnes Dokument. Diese Unterscheidung zwischen Prozess und Ergebnis begegnet dir im Akademischen häufig.' },
      { type: 'callout', variant: 'tip', title: 'Merke', text: 'بَكَالُورْيُوس → مَاجِسْتِير → دُكْتُورَاه: die drei akademischen Abschlüsse in aufsteigender Reihenfolge.' },
      { type: 'callout', variant: 'info', title: 'Typischer Fehler', text: 'بَحْث (Forschung, der Prozess) und أُطْرُوحَة (Abschlussarbeit, das Ergebnis) werden oft gleichgesetzt — بَحْث ist die Tätigkeit, أُطْرُوحَة das fertige Dokument.' },
      { type: 'example', arabic: 'أَدْرُسُ لِلْحُصُولِ عَلَى الْمَاجِسْتِير بَعْدَ الْبَكَالُورْيُوس.', translation: 'Ich studiere für den Master nach dem Bachelor.', note: 'بَعْدَ (nach) kennst du bereits aus Unit 21.' },
      { type: 'example', arabic: 'كَتَبَتْ أُطْرُوحَتَهَا عَنْ تَارِيخِ الْمَدِينَة.', translation: 'Sie schrieb ihre Abschlussarbeit über die Geschichte der Stadt.', note: 'عَنْ (über, Thema) aus Unit 21, تَارِيخ (Geschichte) aus Unit 23.' },
      { type: 'example', arabic: 'هَذَا الْمُقَرَّرُ جُزْءٌ مِنْ وَحْدَةٍ دِرَاسِيَّةٍ كَبِيرَة.', translation: 'Dieser Kurs ist Teil eines großen Studienmoduls.', note: 'جُزْء (Teil) hier nur zur Veranschaulichung markiert.' },
      { type: 'word_preview', word_ids: ['c1_u24_04', 'c1_u24_05', 'c1_u24_06', 'c1_u24_07', 'c1_u24_08', 'c1_u24_09', 'c1_u24_10', 'c1_u24_11', 'c1_u24_12', 'c1_u24_13'] },
      { type: 'mini_check', questions: [
        mc('Welcher Abschluss kommt normalerweise zuerst?', [opt('بَكَالُورْيُوس', true), opt('مَاجِسْتِير', false)]),
        mc('أُطْرُوحَة ist…', [opt('das geschriebene Ergebnis der Forschung', true), opt('der Forschungsprozess selbst', false)]),
        mc('فَصْل دِرَاسِيّ bedeutet…', [opt('Semester', true), opt('Modul', false)])
      ] }
    ]
  },
  {
    theory_id: 'theory_vocab_unit_24_c',
    title: 'Universität, Studium und Prüfungen (3)',
    content_status: 'needs_language_review',
    learning_objectives: [
      'عَلَامَة (Note, Universität) klar von دَرَجَة (Note, Schule, Unit 23) abgrenzen.',
      'تَسْجِيل/قَبُول als zwei Schritte am Studienbeginn in der richtigen Reihenfolge einordnen.',
      'شَهَادَة und خِرِّيج als Abschluss des Studiums einordnen.'
    ],
    blocks: [
      { type: 'paragraph', text: 'مُخْتَبَر (Labor) ist der Ort für Experimente — anders geschrieben als مُخْتَبَر مَدْرَسِيّ (Schullabor, Unit 23), aber vom selben Wortstamm. تَكْلِيف (Aufgabe/Studienleistung) bekommst du von deinem Professor, dafür bekommst du dann eine عَلَامَة (Note/Bewertung) — erinnere dich: an der SCHULE heißt "Note" دَرَجَة (Unit 23), an der UNIVERSITÄT heißt es عَلَامَة. Das Ergebnis insgesamt ist die نَتِيجَة.' },
      { type: 'paragraph', text: 'جَدْوَل (Stundenplan/Zeitplan) hilft dir, den Überblick zu behalten. Bevor du überhaupt studieren kannst, brauchst du zwei Schritte: تَسْجِيل (Anmeldung/Registrierung) und قَبُول (Zulassung) — du meldest dich zuerst an (تَسْجِيل) und bekommst dann (hoffentlich) eine Zulassung (قَبُول). مِنْحَة (Stipendium) hilft manchen Studierenden, ihr Studium zu finanzieren. Am Ende deines Studiums bekommst du eine شَهَادَة (Zeugnis/Zertifikat) und wirst zum خِرِّيج (Absolvent).' },
      { type: 'heading', level: 'full', text: 'Mehr erfahren: عَلَامَة/دَرَجَة — dasselbe Prinzip wie تَكْلِيف/مُهِمَّة' },
      { type: 'paragraph', level: 'full', text: 'Genau wie bei "Note" (عَلَامَة Uni vs. دَرَجَة Schule, Unit 23) gibt es auch für "Aufgabe" zwei unterschiedliche arabische Wörter je nach Kontext: تَكْلِيف (Aufgabe/Studienleistung, diese Unit) an der Universität und مُهِمَّة (Aufgabe bei der Arbeit, Unit 25). Dieses wiederkehrende Muster — unterschiedliche Wörter für denselben deutschen Begriff je nach Lebensbereich — hilft dir, arabische Texte kontextgenau statt nur wörtlich zu verstehen.' },
      { type: 'callout', variant: 'tip', title: 'Merke', text: 'تَسْجِيل (anmelden) kommt VOR قَبُول (Zulassung bekommen) — die richtige Reihenfolge am Studienbeginn.' },
      { type: 'callout', variant: 'info', title: 'Typischer Fehler', text: 'عَلَامَة (Note, Universität) und دَرَجَة (Note, Schule, Unit 23) werden oft gleichgesetzt — beide bedeuten "Note", werden aber je nach Bildungsstufe unterschiedlich verwendet.' },
      { type: 'example', arabic: 'حَصَلْتُ عَلَى عَلَامَةٍ مُمْتَازَةٍ فِي هَذَا الْمُقَرَّر.', translation: 'Ich habe eine ausgezeichnete Note in diesem Kurs bekommen.', note: 'مُمْتَازَة (ausgezeichnet) hier nur zur Veranschaulichung markiert.' },
      { type: 'example', arabic: 'بَعْدَ التَّسْجِيلِ، اِنْتَظَرْتُ الْقَبُول.', translation: 'Nach der Anmeldung wartete ich auf die Zulassung.', note: 'اِنْتَظَرَ (warten) kennst du bereits aus Unit 16.' },
      { type: 'example', arabic: 'كُلُّ خِرِّيجٍ يَحْصُلُ عَلَى شَهَادَة.', translation: 'Jeder Absolvent bekommt ein Zeugnis.', note: 'كُلّ (jeder/alle) kennst du bereits aus dem Bestand.' },
      { type: 'word_preview', word_ids: ['c1_u24_14', 'c1_u24_15', 'c1_u24_16', 'c1_u24_17', 'c1_u24_18', 'c1_u24_19', 'c1_u24_20', 'c1_u24_21', 'c1_u24_22', 'c1_u24_23'] },
      { type: 'mini_check', questions: [
        mc('Was kommt zuerst: تَسْجِيل oder قَبُول؟', [opt('تَسْجِيل (Anmeldung)', true), opt('قَبُول (Zulassung)', false)]),
        mc('عَلَامَة verwendest du für…', [opt('eine Note an der Universität', true), opt('eine Note an der Schule', false)]),
        mc('خِرِّيج bedeutet…', [opt('Absolvent', true), opt('Student', false)])
      ] }
    ]
  },
  // ============================== UNIT 25 (Arbeit, Berufe, Büro) ==============================
  {
    theory_id: 'theory_vocab_unit_25_a',
    title: 'Arbeit, Berufe und Büro (1)',
    content_status: 'needs_language_review',
    learning_objectives: [
      'Die sieben Berufe aus dem Bestand um Grundbegriffe der Arbeitswelt ergänzen.',
      'مُوَظَّف/صَاحِب عَمَل als Gegensatzpaar für Angestellter/Arbeitgeber anwenden.',
      'وَظِيفَة von شَرِكَة (Stelle vs. Firma) unterscheiden.'
    ],
    blocks: [
      { type: 'paragraph', text: 'Du kennst aus dem Bestand bereits sieben Berufe: طَبِيب (Arzt), مُهَنْدِس (Ingenieur), مُعَلِّم (Lehrer), مُمَرِّضَة (Krankenschwester), شُرْطِي (Polizist), طَبَّاخ (Koch) und سَائِق (Fahrer). Diese Unit ergänzt allgemeine Grundbegriffe der Arbeitswelt, die für JEDEN Beruf gelten: وَظِيفَة (Arbeitsstelle/Job, die konkrete Position, die du hast) und شَرِكَة (Firma/Unternehmen, der Ort, für den du arbeitest) — nicht dasselbe: du hast eine وَظِيفَة BEI einer شَرِكَة.' },
      { type: 'paragraph', text: 'مُوَظَّف (Angestellter/Mitarbeiter) ist das Gegenstück zu صَاحِب عَمَل (Arbeitgeber, wörtlich "Inhaber der Arbeit") — ein klares Gegensatzpaar aus zwei unterschiedlichen Perspektiven auf dasselbe Arbeitsverhältnis.' },
      { type: 'heading', level: 'full', text: 'Mehr erfahren: وَظِيفَة vs. مِهْنَة' },
      { type: 'paragraph', level: 'full', text: 'Später in Session C lernst du مِهْنَة (Beruf/Karriere) — ein verwandtes, aber nicht identisches Wort zu وَظِيفَة: وَظِيفَة meint eine KONKRETE Stelle bei einem bestimmten Arbeitgeber (die du wechseln kannst), مِهْنَة meint deinen BERUF im allgemeinen Sinne (z. B. "Arzt" als Berufsfeld, unabhängig davon, in welchem Krankenhaus du gerade arbeitest).' },
      { type: 'callout', variant: 'tip', title: 'Merke', text: 'مُوَظَّف (Angestellter) ↔ صَاحِب عَمَل (Arbeitgeber) — ein klares Gegensatzpaar zu Beginn dieser Unit.' },
      { type: 'callout', variant: 'info', title: 'Typischer Fehler', text: 'وَظِيفَة (deine konkrete Stelle) und شَرِكَة (die Firma, für die du arbeitest) werden manchmal gleichgesetzt — du hast eine وَظِيفَة BEI einer شَرِكَة, sie sind nicht dasselbe.' },
      { type: 'example', arabic: 'حَصَلْتُ عَلَى وَظِيفَةٍ جَدِيدَةٍ فِي شَرِكَةٍ كَبِيرَة.', translation: 'Ich habe eine neue Stelle bei einer großen Firma bekommen.', note: 'جَدِيد (neu)/كَبِير (groß) kennst du bereits aus Unit 19.' },
      { type: 'example', arabic: 'صَاحِبُ الْعَمَلِ يَحْتَرِمُ مُوَظَّفِيه.', translation: 'Der Arbeitgeber respektiert seine Angestellten.', note: 'يَحْتَرِمُ (respektiert) hier nur zur Veranschaulichung markiert.' },
      { type: 'example', arabic: 'اَلطَّبِيبُ يَعْمَلُ فِي الْمُسْتَشْفَى.', translation: 'Der Arzt arbeitet im Krankenhaus.', note: 'عَمِلَ (arbeiten) und اَلْمُسْتَشْفَى kennst du bereits aus dem Bestand.' },
      { type: 'word_preview', word_ids: ['job_doctor', 'job_engineer', 'job_teacher', 'job_nurse', 'job_police', 'job_cook', 'job_driver', 'c1_u25_01', 'c1_u25_02', 'c1_u25_03'] },
      { type: 'mini_check', questions: [
        mc('Das Gegenteil von مُوَظَّف ist…', [opt('صَاحِب عَمَل', true), opt('شَرِكَة', false)]),
        mc('Was hast du BEI einer شَرِكَة?', [opt('eine وَظِيفَة', true), opt('eine مِهْنَة', false)]),
        mc('صَاحِب عَمَل bedeutet wörtlich…', [opt('Inhaber der Arbeit', true), opt('Angestellter der Arbeit', false)])
      ] }
    ]
  },
  {
    theory_id: 'theory_vocab_unit_25_b',
    title: 'Arbeit, Berufe und Büro (2)',
    content_status: 'needs_language_review',
    learning_objectives: [
      'مُدِير/رَئِيس/زَمِيل عَمَل als drei Rollen im Arbeitsumfeld unterscheiden.',
      'عَقْد und رَاتِب als zentrale Begriffe eines Arbeitsverhältnisses einordnen.',
      'بَرِيد إِلِكْتْرُونِيّ als modernes Lehnwort erkennen.'
    ],
    blocks: [
      { type: 'paragraph', text: 'Diese Session sammelt drei weitere Rollen im Arbeitsumfeld: مُدِير (Manager/Leiter, verantwortlich für eine Abteilung), رَئِيس (Chef/Vorgesetzter, deine direkte Führungsperson) und زَمِيل عَمَل (Arbeitskollege, jemand auf derselben Ebene wie du). اِجْتِمَاع (Besprechung/Meeting) ist eine typische Arbeitssituation, in der du mit mehreren dieser Personen zusammenkommst.' },
      { type: 'paragraph', text: 'عَقْد (Vertrag) regelt dein Arbeitsverhältnis rechtlich, رَاتِب (Gehalt) ist das Geld, das du dafür bekommst, und سَاعَات الْعَمَل (Arbeitszeit) legt fest, wie viele Stunden du arbeitest. إِجَازَة (Urlaub) ist deine freie Zeit von der Arbeit. Zum Abschluss lernst du بَرِيد إِلِكْتْرُونِيّ (E-Mail, wörtlich "elektronische Post") — ein modernes, aus zwei Teilen zusammengesetztes Wort, dessen zweiter Teil إِلِكْتْرُونِيّ ("elektronisch") ein Lehnwort ist.' },
      { type: 'heading', level: 'full', text: 'Mehr erfahren: warum بَرِيد إِلِكْتْرُونِيّ zusammengesetzt ist' },
      { type: 'paragraph', level: 'full', text: 'Für viele moderne Konzepte, die es historisch nicht gab, bildet das Arabische neue Begriffe aus bereits bekannten Wörtern — بَرِيد (Post, ein altes Wort) + إِلِكْتْرُونِيّ (elektronisch, ein neueres Lehnwort aus dem Englischen/Französischen) ergibt zusammen "E-Mail". Dieses Muster — altes Wort + neues Adjektiv — begegnet dir im modernen Hocharabisch häufig.' },
      { type: 'callout', variant: 'tip', title: 'Merke', text: 'رَئِيس (dein direkter Chef) und مُدِير (Manager einer Abteilung) sind beide Vorgesetzte, aber auf unterschiedlichen Ebenen — زَمِيل عَمَل ist dagegen auf deiner eigenen Ebene.' },
      { type: 'callout', variant: 'info', title: 'Typischer Fehler', text: 'عَقْد (Vertrag, das Dokument) und رَاتِب (Gehalt, das Geld) werden manchmal verwechselt — der عَقْد regelt unter anderem, wie hoch dein رَاتِب ist, ist aber nicht dasselbe.' },
      { type: 'example', arabic: 'لَدَيَّ اجْتِمَاعٌ مَعَ مُدِيرِي غَداً.', translation: 'Ich habe morgen ein Meeting mit meinem Manager.', note: 'غَداً (morgen) kennst du bereits aus Unit 6, مَعَ (mit) aus Unit 21.' },
      { type: 'example', arabic: 'وَقَّعْتُ عَلَى الْعَقْدِ قَبْلَ بَدْءِ الْعَمَل.', translation: 'Ich habe den Vertrag vor Arbeitsbeginn unterschrieben.', note: 'قَبْلَ (vor, zeitlich) kennst du bereits aus Unit 21.' },
      { type: 'example', arabic: 'أَرْسَلْتُ لَهُ بَرِيداً إِلِكْتْرُونِيّاً.', translation: 'Ich habe ihm eine E-Mail geschickt.', note: 'أَرْسَلَ (senden) kennst du bereits aus Unit 17.' },
      { type: 'word_preview', word_ids: ['c1_u25_04', 'c1_u25_05', 'c1_u25_06', 'c1_u25_07', 'c1_u25_08', 'c1_u25_09', 'c1_u25_10', 'c1_u25_11', 'c1_u25_12', 'c1_u25_13'] },
      { type: 'mini_check', questions: [
        mc('Wer ist auf derselben Ebene wie du?', [opt('زَمِيل عَمَل', true), opt('رَئِيس', false)]),
        mc('بَرِيد إِلِكْتْرُونِيّ bedeutet wörtlich…', [opt('elektronische Post', true), opt('schnelle Nachricht', false)]),
        mc('عَقْد bedeutet…', [opt('Vertrag', true), opt('Gehalt', false)])
      ] }
    ]
  },
  {
    theory_id: 'theory_vocab_unit_25_c',
    title: 'Arbeit, Berufe und Büro (3)',
    content_status: 'needs_language_review',
    learning_objectives: [
      'طَلَب تَوْظِيف/مُقَابَلَة عَمَل/سِيرَة ذَاتِيَّة als Bewerbungsablauf in Reihenfolge einordnen.',
      'مُهِمَّة (Arbeit) von تَكْلِيف (Studium, Unit 24) unterscheiden.',
      'مِهْنَة von وَظِيفَة (Session A) als Beruf vs. konkrete Stelle abgrenzen.'
    ],
    blocks: [
      { type: 'paragraph', text: 'Diese letzte Session der Unit beginnt mit dem Bewerbungsprozess in der richtigen Reihenfolge: Du schickst einen طَلَب تَوْظِيف (Bewerbung) zusammen mit deiner سِيرَة ذَاتِيَّة (Lebenslauf, wörtlich "eigene Biografie") — wenn es gut läuft, folgt eine مُقَابَلَة عَمَل (Vorstellungsgespräch, verwandt mit قَابَلَ "treffen" aus Unit 16). Dabei erwähnst du deine خِبْرَة (Erfahrung) und مَهَارَة (Fähigkeit).' },
      { type: 'paragraph', text: 'مُكَالَمَة (Anruf/Telefonat) und مُهِمَّة (Aufgabe bei der Arbeit) gehören zum Arbeitsalltag — erinnere dich an تَكْلِيف aus Unit 24: DORT war das Wort für "Aufgabe" an der Universität, HIER bei der Arbeit ist es مُهِمَّة, ein weiteres Beispiel für kontextabhängige Wortwahl. مَوْعِد نِهَائِيّ (Frist/Deadline) setzt dir eine zeitliche Grenze. مِهْنَة (Beruf/Karriere) rundet die Unit ab — anders als وَظِيفَة (Session A, deine konkrete Stelle) meint مِهْنَة deinen Beruf im allgemeinen Sinn. مُسْتَوْدَع (Lager/Lagerhaus) schließt die Unit mit einem letzten Arbeitsort ab.' },
      { type: 'heading', level: 'full', text: 'Mehr erfahren: der vollständige Bewerbungsablauf' },
      { type: 'paragraph', level: 'full', text: 'Der typische Ablauf einer Bewerbung ist in vielen arabischsprachigen Ländern ähnlich wie im deutschsprachigen Raum: Du bewirbst dich mit طَلَب تَوْظِيف und سِيرَة ذَاتِيَّة, wirst (im besten Fall) zu einer مُقَابَلَة عَمَل eingeladen, und erst danach unterschreibst du einen عَقْد (Vertrag, aus Session B). Diese vier Begriffe zusammen decken den gesamten Weg von der Bewerbung bis zum neuen Job ab.' },
      { type: 'callout', variant: 'tip', title: 'Merke', text: 'طَلَب تَوْظِيف + سِيرَة ذَاتِيَّة → مُقَابَلَة عَمَل → عَقْد (Session B): der typische Ablauf einer Bewerbung.' },
      { type: 'callout', variant: 'info', title: 'Typischer Fehler', text: 'مُهِمَّة (Aufgabe bei der ARBEIT) und تَكْلِيف (Aufgabe im STUDIUM, aus Unit 24) werden oft gleichgesetzt — beide bedeuten "Aufgabe", werden aber je nach Lebensbereich unterschiedlich verwendet.' },
      { type: 'example', arabic: 'أَرْسَلْتُ طَلَبَ تَوْظِيفٍ وَسِيرَتِي الذَّاتِيَّة.', translation: 'Ich habe eine Bewerbung und meinen Lebenslauf geschickt.', note: 'أَرْسَلَ (senden) kennst du bereits aus Unit 17.' },
      { type: 'example', arabic: 'لَدَيَّ مُقَابَلَةُ عَمَلٍ غَداً، أَنَا مُتَوَتِّرٌ قَلِيلاً.', translation: 'Ich habe morgen ein Vorstellungsgespräch, ich bin etwas nervös.', note: 'مُتَوَتِّر (nervös) kennst du bereits aus Unit 15.' },
      { type: 'example', arabic: 'مَا هِيَ مِهْنَتُكَ؟ — أَنَا مُهَنْدِس.', translation: 'Was ist dein Beruf? — Ich bin Ingenieur.', note: 'مُهَنْدِس (Ingenieur) kennst du bereits aus dem Bestand.' },
      { type: 'word_preview', word_ids: ['c1_u25_14', 'c1_u25_15', 'c1_u25_16', 'c1_u25_17', 'c1_u25_18', 'c1_u25_19', 'c1_u25_20', 'c1_u25_21', 'c1_u25_22', 'c1_u25_23'] },
      { type: 'mini_check', questions: [
        mc('Was schickst du meistens ZUSAMMEN mit طَلَب تَوْظِيف؟', [opt('سِيرَة ذَاتِيَّة', true), opt('عَقْد', false)]),
        mc('مِهْنَة bezeichnet…', [opt('deinen Beruf im allgemeinen Sinn', true), opt('deine konkrete Stelle bei einer Firma', false)], 'Die konkrete Stelle ist وَظِيفَة aus Session A.'),
        mc('مَوْعِد نِهَائِيّ bedeutet…', [opt('Frist/Deadline', true), opt('Vorstellungsgespräch', false)])
      ] }
    ]
  }
];

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

writeJsonFileAtomic(THEORY_PATH, `${JSON.stringify(theoryData, null, 2)}\n`);
console.log(`Theoriedokumente ersetzt/angelegt: ${replaced}`);
console.log(`Theoriedokumente insgesamt: ${theoryData.theories.length}`);
