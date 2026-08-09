#!/usr/bin/env node
// Entwicklungsauftrag 6, Meilenstein 3 (Batch 1: Units 1-5) — ersetzt die von
// build-kurs1-batch.js angelegten Platzhalter-Theoriedokumente für die 12 neuen Sessions dieser
// Units durch vollständige, auf die jeweiligen 10 Wörter zugeschnittene Theorie und ergänzt die
// 3 bestehenden Pilot-Theoriedokumente (Unit 1/2/3, Session A) um das jeweils zehnte (neue) Wort.
//
// Idempotent: kann mehrfach ausgeführt werden, ersetzt die Dokumente jeweils komplett anhand der
// theory_id.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const THEORY_PATH = path.join(ROOT, 'language-packs', 'arabic', 'theory.json');

function mc(question, options) {
  return { question, options };
}
function opt(text, correct) {
  return { text, correct };
}

const NEW_DOCS = [
  // ============================== UNIT 1 (Begrüßung) ==============================
  {
    theory_id: 'theory_vocab_unit_01_b',
    title: 'Begrüßung, Höflichkeit und kurze Antworten (2)',
    content_status: 'needs_language_review',
    learning_objectives: [
      'Jemanden persönlich willkommen heißen und nach dem Befinden fragen können.',
      'Auf „Wie geht es dir?“ mit einer passenden kurzen Antwort reagieren können.',
      'Zwischen den verschiedenen arabischen Formen von „Entschuldigung“ je nach Anlass unterscheiden.'
    ],
    blocks: [
      { type: 'paragraph', text: 'In der vorigen Session hast du bereits أَهْلاً وَسَهْلاً für „Herzlich willkommen“ gelernt. أَهْلاً بِكَ ist die direktere, persönlichere Variante, mit der du eine einzelne Person begrüßt — بِكَ heißt wörtlich „mit dir“. Die Standardfrage nach dem Befinden lautet كَيْفَ حَالُكَ؟ ( „Wie ist dein Zustand?“) und wird meist mit بِخَيْر („gut“) oder ausführlicher mit الْحَمْدُ لِلَّه ( „Gott sei Dank“, wörtlich „das Lob gehört Gott“) beantwortet — dieser Ausdruck wird im Alltag sehr häufig verwendet, unabhängig von der Religion des Sprechers, ähnlich wie im Deutschen „Gott sei Dank“ auch von nicht-religiösen Menschen benutzt wird.' },
      { type: 'paragraph', text: 'Das Arabische unterscheidet außerdem mehrere Stufen von „Entschuldigung“: عَفْواً passt für Kleinigkeiten (z. B. wenn du jemandem im Weg stehst) und bedeutet zusätzlich „Gern geschehen“ als Antwort auf Dank. مَعْذِرَة nutzt du, um höflich zu unterbrechen oder um Erlaubnis zu bitten. آسِف drückt echtes Bedauern aus, etwa wenn du zu spät kommst. لَا بَأْس („kein Problem“) ist die passende Antwort, wenn sich jemand bei dir entschuldigt, und بِالطَّبْع/حَسَناً bestätigen bzw. bejahen eine Aussage oder Bitte.' },
      { type: 'heading', level: 'full', text: 'Mehr erfahren: männliche und weibliche Endungen' },
      { type: 'paragraph', level: 'full', text: 'كَيْفَ حَالُكَ؟ richtet sich an einen männlichen Gesprächspartner (Endung -كَ). Bei einer Frau würde es كَيْفَ حَالُكِ؟ heißen (Endung -كِ). Auch آسِف verändert sich bei einer Sprecherin zu آسِفَة. Diese Endungen -كَ/-كِ ziehen sich durch die gesamte arabische Grammatik — du musst sie jetzt noch nicht vollständig beherrschen, wirst ihnen aber ab jetzt regelmäßig begegnen. Wir verwenden hier bewusst die männliche Grundform, um die Systematik einzuführen, ohne dich mit beiden Formen gleichzeitig zu überfordern.' },
      { type: 'callout', variant: 'tip', title: 'Merke', text: 'عَفْواً hat zwei Bedeutungen: als Reaktion auf eine kleine Störung („Entschuldigung“) UND als Antwort auf „Danke“ („Gern geschehen“). Der Kontext entscheidet, welche gemeint ist.' },
      { type: 'callout', variant: 'info', title: 'Typischer Fehler', text: 'Lerner verwechseln oft آسِف (echtes Bedauern) mit عَفْواً (beiläufige Entschuldigung). Im Deutschen sagen wir für beides oft einfach „Entschuldigung“ — im Arabischen macht die Wahl des Wortes einen spürbaren Unterschied in der Höflichkeit.' },
      { type: 'example', arabic: 'مَرْحَبًا! كَيْفَ حَالُكَ؟', translation: 'Hallo! Wie geht es dir?', note: 'Verbindet die Begrüßung aus der letzten Session mit der neuen Frage nach dem Befinden.' },
      { type: 'example', arabic: 'بِخَيْر، الْحَمْدُ لِلَّه.', translation: 'Gut, Gott sei Dank.', note: 'Typische, sehr häufige Antwort auf die Frage nach dem Befinden.' },
      { type: 'example', arabic: 'عَفْواً!', translation: 'Entschuldigung! / Gern geschehen!', note: 'Welche Bedeutung gemeint ist, ergibt sich aus der Situation.' },
      { type: 'example', arabic: 'لَا بَأْس، مَعْذِرَة.', translation: 'Kein Problem, Entschuldigung.', note: 'Zwei Höflichkeitsformeln direkt kombiniert.' },
      { type: 'word_preview', word_ids: ['c1_u01_02', 'c1_u01_03', 'c1_u01_04', 'c1_u01_05', 'c1_u01_06', 'c1_u01_07', 'c1_u01_08', 'c1_u01_09', 'c1_u01_10', 'c1_u01_11'] },
      { type: 'mini_check', questions: [
        mc('Was antwortest du typischerweise auf كَيْفَ حَالُكَ؟', [opt('بِخَيْر', true), opt('مَعْذِرَة', false)]),
        mc('Welches Wort bedeutet sowohl „Entschuldigung“ als auch „Gern geschehen“?', [opt('عَفْواً', true), opt('آسِف', false)]),
        mc('Was ist die passende Antwort, wenn sich jemand bei dir entschuldigt?', [opt('لَا بَأْس', true), opt('حَسَناً', false)])
      ] }
    ]
  },
  {
    theory_id: 'theory_vocab_unit_01_c',
    title: 'Begrüßung, Höflichkeit und kurze Antworten (3)',
    content_status: 'needs_language_review',
    learning_objectives: [
      'Ein Gespräch mit einer zur Situation passenden Abschiedsformel beenden.',
      'Glückwünsche und gute Wünsche vor bzw. nach einem Ereignis richtig einsetzen.',
      'الْعَفْو als feste Antwort auf Dank von عَفْواً aus der letzten Session unterscheiden.'
    ],
    blocks: [
      { type: 'paragraph', text: 'Diese Session schließt das Thema Höflichkeit ab und konzentriert sich auf Abschied und gute Wünsche. Du kennst bereits das allgemeine مَعَ السَّلَامَة („Auf Wiedersehen“) aus dem Bestand — إِلَى اللِّقَاء („bis zum Wiedersehen“) ist eine etwas formellere Variante, die z. B. am Ende eines Telefonats passt. أَرَاكَ لَاحِقاً („bis später“) verwendest du dagegen nur, wenn du die Person noch am selben Tag wiedersiehst. تُصْبِحُ عَلَى خَيْر ist die feste Formel für „Gute Nacht“.' },
      { type: 'paragraph', text: 'Für gute Wünsche gibt es zwei wichtige Ausdrücke: حَظّاً سَعِيداً („viel Glück“) sagst du VOR einem Ereignis, z. B. vor einer Prüfung. مَبْرُوك („Glückwunsch“) dagegen NACH einem Erfolg. Diese zeitliche Unterscheidung gibt es im Deutschen genauso, wird aber seltener bewusst gemacht. Beachte außerdem: الْعَفْو (mit bestimmtem Artikel الْ) ist eine eigenständige, sehr häufige Formel speziell als Antwort auf „Danke“ — nicht zu verwechseln mit عَفْواً aus der letzten Session.' },
      { type: 'heading', level: 'full', text: 'Mehr erfahren: der bestimmte Artikel الْ' },
      { type: 'paragraph', level: 'full', text: 'Du hast in dieser und der letzten Session mehrfach ein Wort mit vorangestelltem الْ gesehen (الْحَمْدُ, الْعَفْو). الْ entspricht ungefähr dem deutschen „der/die/das“ und macht ein Wort „bestimmt“. Die vollständigen Regeln dazu — u. a. dass sich die Aussprache vor bestimmten Buchstaben anpasst — lernst du erst in einer späteren Grammatik-Einheit. Nimm hier nur mit: الْ + Wort ist eine feste, sehr häufige Kombination.' },
      { type: 'callout', variant: 'tip', title: 'Merke', text: 'حَظّاً سَعِيداً vor dem Ereignis, مَبْرُوك danach — die Reihenfolge entscheidet über das richtige Wort.' },
      { type: 'callout', variant: 'info', title: 'Typischer Fehler', text: 'سَعِيد بِلِقَائِكَ wird oft wortwörtlich mit „glücklich“ übersetzt und dann isoliert verwendet — es ist aber ein fester Ausdruck für die erste Begegnung, kein allgemeines Wort für „glücklich“ (das lernst du erst in Unit 15).' },
      { type: 'example', arabic: 'شُكْراً جَزِيلاً! — الْعَفْو!', translation: 'Vielen Dank! — Gern geschehen!', note: 'الْعَفْو ist die feste Antwort auf Dank.' },
      { type: 'example', arabic: 'حَظّاً سَعِيداً!', translation: 'Viel Glück!', note: 'Wird VOR einem Ereignis gesagt, z. B. vor einer Prüfung.' },
      { type: 'example', arabic: 'مَبْرُوك!', translation: 'Glückwunsch!', note: 'Wird NACH einem Erfolg gesagt.' },
      { type: 'example', arabic: 'إِلَى اللِّقَاء، وَدَاعاً!', translation: 'Bis zum Wiedersehen, leb wohl!', note: 'Zwei Abschiedsformeln direkt hintereinander.' },
      { type: 'word_preview', word_ids: ['c1_u01_12', 'c1_u01_13', 'c1_u01_14', 'c1_u01_15', 'c1_u01_16', 'c1_u01_17', 'c1_u01_18', 'c1_u01_19', 'c1_u01_20', 'c1_u01_21'] },
      { type: 'mini_check', questions: [
        mc('Wann sagst du مَبْرُوك؟', [opt('Nach einem Erfolg', true), opt('Vor einem Ereignis', false)]),
        mc('Welches Wort ist die feste Antwort auf شُكْراً؟', [opt('الْعَفْو', true), opt('رُبَّمَا', false)]),
        mc('أَرَاكَ لَاحِقاً bedeutet…', [opt('Bis später, am selben Tag', true), opt('Auf Nimmerwiedersehen', false)])
      ] }
    ]
  },
  // ============================== UNIT 2 (Familie) ==============================
  {
    theory_id: 'theory_vocab_unit_02_b',
    title: 'Familie, Beziehungen und Personen (2)',
    content_status: 'needs_language_review',
    learning_objectives: [
      'Die vier Onkel-/Tanten-Typen des Arabischen unterscheiden (väterlicherseits vs. mütterlicherseits).',
      'Enkel/Enkelin sowie die allgemeinen Personenbezeichnungen „Mann“/„Frau“ benennen.',
      'Das feminine Suffix ة an weiteren Verwandtschaftswörtern wiedererkennen.'
    ],
    blocks: [
      { type: 'paragraph', text: 'Im Deutschen gibt es nur ein Wort für „Onkel“ und eines für „Tante“ — im Arabischen unterscheidet man dagegen, ob die Person väterlicherseits oder mütterlicherseits verwandt ist. عَمّ ist der Bruder deines Vaters, عَمَّة seine Schwester. خَال ist der Bruder deiner Mutter, خَالَة seine Schwester. Diese vier Wörter bilden zwei klare Paare: عَمّ/عَمَّة und خَال/خَالَة, jeweils mit der bekannten femininen Endung ة.' },
      { type: 'paragraph', text: 'Auch حَفِيد/حَفِيدَة (Enkel/Enkelin) folgt demselben Muster. Bei طِفْل („Kind“) gibt es dagegen keine im Alltag übliche eigene feminine Form — das Wort wird für Jungen und Mädchen gleichermaßen verwendet. رَجُل („Mann“) und اِمْرَأَة („Frau“) sind allgemeine Personenbezeichnungen ohne Verwandtschaftsbezug — sie ergänzen dein Vokabular für Beschreibungen von Personen im Alltag.' },
      { type: 'heading', level: 'full', text: 'Mehr erfahren: warum Onkel/Tante nach Seite unterschieden werden' },
      { type: 'paragraph', level: 'full', text: 'Historisch war die Familienstruktur in der arabischen Kultur stark nach väterlicher und mütterlicher Linie gegliedert, mit unterschiedlichen sozialen Rollen für عَمّ/عَمَّة gegenüber خَال/خَالَة. Diese sprachliche Unterscheidung findet sich in vielen, aber nicht allen Sprachen der Region. Eine Merkhilfe: عَمّ (Onkel väterlicherseits) beginnt wie عَائِلَة (Familie) — beide gehören gedanklich zur „Kernfamilie“ des Vaters.' },
      { type: 'callout', variant: 'tip', title: 'Merke', text: 'عَمّ/عَمَّة = väterlicherseits, خَال/خَالَة = mütterlicherseits.' },
      { type: 'callout', variant: 'info', title: 'Typischer Fehler', text: 'Viele Deutschlernende übersetzen „Onkel“ zunächst immer mit عَمّ, unabhängig von der Seite. Achte im Kontext darauf, welche Linie gemeint ist.' },
      { type: 'example', arabic: 'هَذَا رَجُل، وَهَذِهِ اِمْرَأَة.', translation: 'Das ist ein Mann, und das ist eine Frau.', note: 'Vorschau auf هَذَا/هَذِهِ, die in Unit 30 vertieft werden.' },
      { type: 'example', arabic: 'عَمَّتِي وَخَالَتِي', translation: 'meine Tante väterlicherseits und meine Tante mütterlicherseits', note: 'Beide Tanten-Wörter direkt im Vergleich.' },
      { type: 'example', arabic: 'حَفِيدِي وَحَفِيدَتِي', translation: 'mein Enkel und meine Enkelin', note: 'Männliche und weibliche Form nebeneinander.' },
      { type: 'word_preview', word_ids: ['c1_u02_03', 'c1_u02_04', 'c1_u02_05', 'c1_u02_06', 'c1_u02_07', 'c1_u02_08', 'c1_u02_09', 'c1_u02_10', 'c1_u02_11', 'c1_u02_12'] },
      { type: 'mini_check', questions: [
        mc('عَمَّة ist…', [opt('die Schwester des Vaters', true), opt('die Schwester der Mutter', false)]),
        mc('Welches Wort bezeichnet sowohl Jungen als auch Mädchen?', [opt('طِفْل', true), opt('رَجُل', false)]),
        mc('خَال ist…', [opt('der Bruder der Mutter', true), opt('der Bruder des Vaters', false)])
      ] }
    ]
  },
  {
    theory_id: 'theory_vocab_unit_02_c',
    title: 'Familie, Beziehungen und Personen (3)',
    content_status: 'needs_language_review',
    learning_objectives: [
      'Personen außerhalb der Kernfamilie (Freunde, Nachbarn, Kollegen) benennen.',
      'Männliche und weibliche Form bei Personenbezeichnungen konsequent mit ة bilden.',
      'Cousin/Cousine väterlicherseits als zusammengesetzten Ausdruck erkennen.'
    ],
    blocks: [
      { type: 'paragraph', text: 'Diese letzte Session zu Personen zeigt dir, wie regelmäßig das Muster „männliche Form + ة = weibliche Form“ im Arabischen wirklich ist: صَدِيق/صَدِيقَة (Freund/Freundin), جَار/جَارَة (Nachbar/Nachbarin), زَمِيل/زَمِيلَة (Kollege/Kollegin). Nachdem du das schon bei عَمّ/عَمَّة und خَال/خَالَة gesehen hast, solltest du das Muster jetzt gut wiedererkennen.' },
      { type: 'paragraph', text: 'قَرِيب („Verwandter“) ist ein Sammelbegriff für jede Person aus der Familie, die nicht durch ein spezifischeres Wort benannt wird. وَالِدَيْن („Eltern“) ist eine besondere Form, die eigentlich den arabischen Dual (die Form für genau zwei) enthält — mehr dazu unten. اِبْن عَمّ („Cousin väterlicherseits“, wörtlich „Sohn des Onkels väterlicherseits“) und بِنْت عَمّ zeigen dir, wie Arabisch zusammengesetzte Verwandtschaftswörter aus bekannten Bausteinen bildet — اِبْن (Sohn) und بِنْت (Tochter) kombiniert mit عَمّ, das du schon kennst.' },
      { type: 'heading', level: 'full', text: 'Mehr erfahren: der Dual bei وَالِدَيْن' },
      { type: 'paragraph', level: 'full', text: 'Das Arabische kennt neben Singular und Plural noch eine dritte Zahlform, den Dual, für genau zwei Dinge/Personen. وَالِدَيْن nutzt diese Form, weil ein Kind eben genau zwei Elternteile hat. Es gibt außerdem اِبْن خَال/بِنْت خَال für den Cousin/die Cousine mütterlicherseits — dieselbe Bauweise wie bei اِبْن عَمّ, nur mit خَال statt عَمّ. Die vollständige Dual-Grammatik lernst du erst später; hier reicht es, وَالِدَيْن als festes Wort für „Eltern“ zu kennen.' },
      { type: 'callout', variant: 'tip', title: 'Merke', text: 'Fast jede Personenbezeichnung mit männlicher Form endet in der weiblichen Form auf ة — eines der zuverlässigsten Muster im arabischen Grundwortschatz.' },
      { type: 'callout', variant: 'info', title: 'Typischer Fehler', text: 'اِبْن عَمّ wird manchmal als zwei unabhängige Wörter gelesen — es ist aber eine feste Einheit mit der Bedeutung „Cousin (väterlicherseits)“, ähnlich wie „Guten Morgen“ im Deutschen aus zwei Wörtern besteht, aber eine Einheit bildet.' },
      { type: 'example', arabic: 'صَدِيقِي وَجَارِي', translation: 'mein Freund und mein Nachbar', note: 'Zwei Personenbezeichnungen mit Possessivendung „mein“.' },
      { type: 'example', arabic: 'هَذَا زَمِيلِي', translation: 'Das ist mein Kollege.', note: 'زَمِيل im Satzzusammenhang.' },
      { type: 'example', arabic: 'وَالِدَيَّ وَقَرِيبِي', translation: 'meine Eltern und mein Verwandter', note: 'وَالِدَيَّ zeigt die besondere Dual-Form von „Eltern“.' },
      { type: 'word_preview', word_ids: ['c1_u02_13', 'c1_u02_14', 'c1_u02_15', 'c1_u02_16', 'c1_u02_17', 'c1_u02_18', 'c1_u02_19', 'c1_u02_20', 'c1_u02_21', 'c1_u02_22'] },
      { type: 'mini_check', questions: [
        mc('Welches Suffix macht aus صَدِيق die weibliche Form?', [opt('ة', true), opt('ين', false)]),
        mc('اِبْن عَمّ bedeutet…', [opt('Cousin väterlicherseits', true), opt('Cousin mütterlicherseits', false)]),
        mc('وَالِدَيْن bedeutet…', [opt('Eltern', true), opt('Geschwister', false)])
      ] }
    ]
  },
  // ============================== UNIT 3 (Zuhause) ==============================
  {
    theory_id: 'theory_vocab_unit_03_b',
    title: 'Zuhause und Räume (2)',
    content_status: 'needs_language_review',
    learning_objectives: [
      'Die Zimmer einer Wohnung beim Namen nennen.',
      'Erkennen, wie غُرْفَة + Genitiv zusammengesetzte Raumnamen bildet.',
      'Wege innerhalb eines Gebäudes (Treppe, Aufzug) beschreiben.'
    ],
    blocks: [
      { type: 'paragraph', text: 'In Session A hast du bereits شَقَّة (Wohnung) und مَبْنَى (Gebäude) gelernt sowie aus dem Bestand einzelne Räume wie غُرْفَة (Zimmer) und مَطْبَخ (Küche). Diese Session baut genau darauf auf: غُرْفَة الْجُلُوس (Wohnzimmer, wörtlich „Zimmer des Sitzens“), غُرْفَة النَّوْم (Schlafzimmer, „Zimmer des Schlafs“) und غُرْفَة الطَّعَام (Esszimmer, „Zimmer des Essens“) zeigen ein wiederkehrendes Baumuster: غُرْفَة + bestimmter Artikel الْ + ein Substantiv, das die Funktion des Raums beschreibt.' },
      { type: 'paragraph', text: 'طَابِق („Stockwerk“) brauchst du, um zu sagen, in welcher Etage sich deine Wohnung befindet. Um dorthin zu gelangen, nutzt du entweder دَرَج („Treppe“) oder bequemer مِصْعَد („Aufzug“). شُرْفَة (Balkon), حَدِيقَة (Garten), مِرْآب (Garage) und سَطْح (Dach/Dachterrasse) runden das Bild eines typischen Wohnhauses ab.' },
      { type: 'heading', level: 'full', text: 'Mehr erfahren: das Baumuster „Substantiv + الْ + Substantiv“' },
      { type: 'paragraph', level: 'full', text: 'Diese Konstruktion (auch Iḍāfa genannt) ist eine der wichtigsten im Arabischen, um Zusammengehörigkeit auszudrücken — ähnlich dem deutschen Genitiv oder einem Kompositum. Du wirst ihr in fast jeder weiteren Unit wieder begegnen, z. B. bei رَقْم الْهَاتِف „Telefonnummer“ in Unit 4. Die vollständigen Regeln (u. a. dass das erste Wort keinen eigenen bestimmten Artikel trägt) folgen in einer späteren Grammatik-Einheit.' },
      { type: 'callout', variant: 'tip', title: 'Merke', text: 'غُرْفَة + Funktionswort erklärt fast jeden Raumnamen — du musst nicht jedes Zimmer einzeln auswendig lernen, sondern kannst das Muster erkennen.' },
      { type: 'callout', variant: 'info', title: 'Typischer Fehler', text: 'طَابِق (Stockwerk) und سَطْح (Dach) werden manchmal verwechselt, weil beide etwas mit „oben“ zu tun haben — طَابِق bezeichnet aber eine beliebige Etage, سَطْح ausschließlich die oberste Fläche des Gebäudes.' },
      { type: 'example', arabic: 'شَقَّتِي فِي الطَّابِق الثَّالِث.', translation: 'Meine Wohnung ist im dritten Stock.', note: 'الطَّابِق الثَّالِث (das dritte Stockwerk) ist hier noch nicht aktiv abgefragtes Vokabular.' },
      { type: 'example', arabic: 'غُرْفَة الْجُلُوس كَبِيرَة.', translation: 'Das Wohnzimmer ist groß.', note: 'كَبِيرَة (groß) als Vorschau auf Unit 19.' },
      { type: 'example', arabic: 'الْمِصْعَد أَسْرَع مِنَ الدَّرَج.', translation: 'Der Aufzug ist schneller als die Treppe.', note: 'أَسْرَع مِنَ (schneller als) noch nicht aktiv abgefragt.' },
      { type: 'word_preview', word_ids: ['c1_u03_03', 'c1_u03_04', 'c1_u03_05', 'c1_u03_06', 'c1_u03_07', 'c1_u03_08', 'c1_u03_09', 'c1_u03_10', 'c1_u03_11', 'c1_u03_12'] },
      { type: 'mini_check', questions: [
        mc('غُرْفَة النَّوْم ist…', [opt('das Schlafzimmer', true), opt('das Esszimmer', false)]),
        mc('Was beschreibt طَابِق؟', [opt('ein Stockwerk', true), opt('das Dach', false)]),
        mc('Welche zwei Wörter führen in ein höheres Stockwerk?', [opt('دَرَج und مِصْعَد', true), opt('حَدِيقَة und مِرْآب', false)])
      ] }
    ]
  },
  {
    theory_id: 'theory_vocab_unit_03_c',
    title: 'Zuhause und Räume (3)',
    content_status: 'needs_language_review',
    learning_objectives: [
      'Die Grundbestandteile eines Raums (Wand, Decke, Boden) benennen.',
      'Ein- und Ausgang sowie Schlüssel und Schloss im Zusammenhang beschreiben.',
      'Das Gegensatzpaar مَدْخَل/مَخْرَج an der gemeinsamen Wurzel erkennen.'
    ],
    blocks: [
      { type: 'paragraph', text: 'Diese letzte Session zum Thema Zuhause vervollständigt dein Vokabular um die Grundbestandteile jedes Raums: جِدَار (Wand), سَقْف (Decke/Dach) und أَرْضِيَّة (Fußboden) — die drei Flächen, die jeden Raum begrenzen. مَدْخَل (Eingang) und مَخْرَج (Ausgang) bilden ein klares Gegensatzpaar; beide enthalten den Wortbaustein د-خ-ل („hineingehen“), den du in Unit 17 als eigenständiges Verb (دَخَلَ) wiedersiehst. مَمَرّ (Flur/Gang) verbindet die Räume miteinander.' },
      { type: 'paragraph', text: 'مِفْتَاح (Schlüssel) und قُفْل (Schloss) gehören zusammen: Der Schlüssel passt in das Schloss. كَهْرَبَاء (Elektrizität/Strom) ist ein Massennomen ohne Plural — genau wie im Deutschen sagt man nicht „die Elektrizitäten“. فِنَاء (Innenhof/Hof) beschreibt einen offenen Bereich, der oft von den Gebäudeteilen umschlossen wird — häufig in traditioneller arabischer Architektur zu finden.' },
      { type: 'heading', level: 'full', text: 'Mehr erfahren: Vorschau auf das Wurzelsystem' },
      { type: 'paragraph', level: 'full', text: 'Die gemeinsame Wurzel von مَدْخَل und مَخْرَج (Konsonanten د-خ-ل bzw. خ-ر-ج) ist ein gutes erstes Beispiel für das arabische Wurzelsystem: Viele arabische Wörter bauen auf einem Grundgerüst von meist drei Konsonanten auf, das die Kernbedeutung trägt, während unterschiedliche Vokalmuster und Vor-/Nachsilben die genaue Wortart bestimmen. Du wirst diesem Prinzip im Kurs immer wieder begegnen; eine systematische Einführung folgt später.' },
      { type: 'callout', variant: 'tip', title: 'Merke', text: 'مِفْتَاح öffnet قُفْل — diese Paar-Verbindung hilft dir, beide Wörter gemeinsam zu behalten.' },
      { type: 'callout', variant: 'info', title: 'Typischer Fehler', text: 'سَقْف (Decke innerhalb eines Zimmers) wird oft mit سَطْح (Dach von außen, aus Session B) verwechselt — beide beziehen sich auf „oben“, aber aus unterschiedlicher Perspektive.' },
      { type: 'example', arabic: 'الْمِفْتَاح فِي الْقُفْل.', translation: 'Der Schlüssel ist im Schloss.', note: 'Die feste Wortpaar-Verbindung im Satz.' },
      { type: 'example', arabic: 'أَيْنَ الْمَدْخَل؟', translation: 'Wo ist der Eingang?', note: 'أَيْنَ (wo?) kennst du bereits aus dem Bestand.' },
      { type: 'example', arabic: 'لَا كَهْرَبَاء الْيَوْم.', translation: 'Heute gibt es keinen Strom.', note: 'الْيَوْم (heute) als Vorschau auf Unit 6.' },
      { type: 'word_preview', word_ids: ['c1_u03_13', 'c1_u03_14', 'c1_u03_15', 'c1_u03_16', 'c1_u03_17', 'c1_u03_18', 'c1_u03_19', 'c1_u03_20', 'c1_u03_21', 'c1_u03_22'] },
      { type: 'mini_check', questions: [
        mc('مَخْرَج bedeutet…', [opt('Ausgang', true), opt('Eingang', false)]),
        mc('Welches Wort hat keinen Plural?', [opt('كَهْرَبَاء', true), opt('مِفْتَاح', false)]),
        mc('Was begrenzt einen Raum nach oben?', [opt('سَقْف', true), opt('أَرْضِيَّة', false)])
      ] }
    ]
  },
  // ============================== UNIT 4 (Persönliche Angaben) ==============================
  {
    theory_id: 'theory_vocab_unit_04_a',
    title: 'Persönliche Angaben, Länder, Sprachen und Nationalitäten (1)',
    content_status: 'needs_language_review',
    learning_objectives: [
      'Die wichtigsten Angaben zur eigenen Person (Name, Alter, Geburtsdatum) benennen.',
      'Sprachnamen mit bestimmtem Artikel bilden und von Ländernamen unterscheiden.',
      'Erste einfache Sätze zur Selbstvorstellung verstehen.'
    ],
    blocks: [
      { type: 'paragraph', text: 'Diese neue Unit dreht sich um persönliche Angaben — genau die Informationen, die du brauchst, um dich vorzustellen oder ein Formular auszufüllen. اِسْم (Name), عُمْر (Alter) und تَارِيخ الْمِيلَاد (Geburtsdatum) sind die drei Kernangaben, die z. B. in einem Reisepass stehen. جِنْسِيَّة (Nationalität) und لُغَة (Sprache) ergänzen das Bild.' },
      { type: 'paragraph', text: 'Ein wichtiges Muster: Sprachnamen im Arabischen werden fast immer mit dem bestimmten Artikel الْ gebildet und sind grammatisch feminin — الْعَرَبِيَّة (Arabisch), الْأَلْمَانِيَّة (Deutsch), الْإِنْجْلِيزِيَّة (Englisch). Wörtlich bedeutet z. B. الْعَرَبِيَّة so viel wie „die arabische (Sprache)“ — das Substantiv „Sprache“ (لُغَة) wird dabei weggelassen, ist aber gedanklich mitgemeint. بَلَد (Land) ist der allgemeine Begriff, أَلْمَانِيَا (Deutschland) der erste konkrete Ländername in diesem Kurs — in den nächsten beiden Sessions folgen neun weitere.' },
      { type: 'heading', level: 'full', text: 'Mehr erfahren: warum sind Sprachnamen feminin?' },
      { type: 'paragraph', level: 'full', text: 'Im Arabischen ist es üblich, Adjektive, die von einem Volks-/Ländernamen abgeleitet sind (die sogenannte nisba-Form, erkennbar am Suffix ي), auf ein weggelassenes feminines Substantiv wie لُغَة (Sprache) zu beziehen — daher die feminine Form mit ة am Ende. Diese nisba-Bildung (Land + ي) siehst du in Session C dieser Unit bei Wörtern für Staatsangehörigkeit wie أَلْمَانِيّ („Deutscher“) wieder.' },
      { type: 'callout', variant: 'tip', title: 'Merke', text: 'Sprachname = bestimmter Artikel الْ + Länderadjektiv + feminine Endung ة, z. B. الْ + أَلْمَانِيّ-Basis + ة → الْأَلْمَانِيَّة.' },
      { type: 'callout', variant: 'info', title: 'Typischer Fehler', text: 'اِسْم (Name) und عُمْر (Alter) werden von Anfängern manchmal vertauscht, weil beide kurze, unscheinbare Wörter sind — lerne sie am besten zusammen mit einer konkreten Beispielantwort (z. B. deinem eigenen Namen/Alter).' },
      { type: 'example', arabic: 'مَا اسْمُكَ؟', translation: 'Wie heißt du? (wörtl. Was ist dein Name?)', note: 'مَا (was) kennst du bereits aus dem Bestand.' },
      { type: 'example', arabic: 'أَتَكَلَّمُ الْعَرَبِيَّة وَالْأَلْمَانِيَّة.', translation: 'Ich spreche Arabisch und Deutsch.', note: 'أَتَكَلَّمُ (ich spreche) als Vorschau auf Unit 18.' },
      { type: 'example', arabic: 'بَلَدِي أَلْمَانِيَا.', translation: 'Mein Land ist Deutschland.', note: 'بَلَدِي = بَلَد + Possessivendung „mein“.' },
      { type: 'word_preview', word_ids: ['c1_u04_01', 'c1_u04_02', 'c1_u04_03', 'c1_u04_04', 'c1_u04_05', 'c1_u04_06', 'c1_u04_07', 'c1_u04_08', 'c1_u04_09', 'c1_u04_10'] },
      { type: 'mini_check', questions: [
        mc('Welches Wort steht für „Geburtsdatum“?', [opt('تَارِيخ الْمِيلَاد', true), opt('جِنْسِيَّة', false)]),
        mc('Sprachnamen im Arabischen sind meist…', [opt('feminin, mit bestimmtem Artikel', true), opt('maskulin, ohne Artikel', false)]),
        mc('بَلَد bedeutet…', [opt('Land', true), opt('Sprache', false)])
      ] }
    ]
  },
  {
    theory_id: 'theory_vocab_unit_04_b',
    title: 'Persönliche Angaben, Länder, Sprachen und Nationalitäten (2)',
    content_status: 'needs_language_review',
    learning_objectives: [
      'Neun weitere Ländernamen (arabischsprachige und europäische) erkennen und lesen.',
      'Zwischen Ländernamen mit und ohne bestimmten Artikel unterscheiden.',
      'Die Länder grob geografisch einordnen (Naher Osten/Nordafrika vs. Europa).'
    ],
    blocks: [
      { type: 'paragraph', text: 'Diese Session besteht bewusst nur aus Eigennamen — Ländern —, die dir in Anwendungsprompts, Reisegesprächen und späteren Texten immer wieder begegnen. Die erste Gruppe sind arabischsprachige Länder: مِصْر (Ägypten), سُورِيَا (Syrien), لُبْنَان (Libanon), الْأُرْدُنّ (Jordanien), الْمَغْرِب (Marokko) und فِلَسْطِين (Palästina). Die zweite Gruppe sind europäische Nachbarländer, deren arabische Namen meist ähnlich wie im Deutschen/Englischen klingen: تُرْكِيَا (Türkei), فَرَنْسَا (Frankreich), إِسْبَانِيَا (Spanien), إِيطَالِيَا (Italien).' },
      { type: 'paragraph', text: 'Ein Detail, das dir beim Lesen auffallen wird: Manche Ländernamen tragen den bestimmten Artikel الْ (الْأُرْدُنّ, الْمَغْرِب), andere nicht (مِصْر, سُورِيَا). Das ist keine Regel, die du logisch ableiten kannst — es ist für jedes Land einfach so festgelegt, ähnlich wie im Deutschen „die Schweiz“ einen Artikel hat, „Deutschland“ aber nicht.' },
      { type: 'heading', level: 'full', text: 'Mehr erfahren: warum heißt Marokko الْمَغْرِب؟' },
      { type: 'paragraph', level: 'full', text: 'Wörtlich bedeutet مَغْرِب „der Ort des Sonnenuntergangs/der Westen“ — aus Sicht der frühen arabischen Geografie lag Marokko ganz im Westen der arabischsprachigen Welt. Das verwandte Wort غَرْب („Westen“) wirst du in Unit 21 bei den Himmelsrichtungen wiedersehen. Solche historischen Namensbedeutungen findest du bei vielen arabischen Ländernamen.' },
      { type: 'callout', variant: 'tip', title: 'Merke', text: 'Ob ein Land den Artikel الْ trägt, musst du für jedes Land einzeln mitlernen — es gibt keine allgemeine Regel dafür.' },
      { type: 'callout', variant: 'info', title: 'Typischer Fehler', text: 'سُورِيَا (Syrien) wird wegen des ähnlichen Wortanfangs manchmal mit سُوق (Markt, Unit 11) verwechselt — achte auf die vollständige Wortlänge.' },
      { type: 'example', arabic: 'أَنَا مِنْ مِصْر.', translation: 'Ich bin aus Ägypten.', note: 'مِنْ (aus/von) als Vorschau auf Unit 21.' },
      { type: 'example', arabic: 'لُبْنَان بِجَانِبِ سُورِيَا.', translation: 'Der Libanon liegt neben Syrien.', note: 'بِجَانِبِ (neben) als Vorschau auf Unit 21.' },
      { type: 'example', arabic: 'فَرَنْسَا وَإِسْبَانِيَا فِي أُورُوبَّا.', translation: 'Frankreich und Spanien liegen in Europa.', note: 'أُورُوبَّا (Europa) ist hier nur zur Orientierung markiert, nicht aktiv abgefragt.' },
      { type: 'word_preview', word_ids: ['c1_u04_11', 'c1_u04_12', 'c1_u04_13', 'c1_u04_14', 'c1_u04_15', 'c1_u04_16', 'c1_u04_17', 'c1_u04_18', 'c1_u04_19', 'c1_u04_20'] },
      { type: 'mini_check', questions: [
        mc('Welches Land trägt den bestimmten Artikel؟', [opt('الْمَغْرِب', true), opt('مِصْر', false)]),
        mc('تُرْكِيَا bedeutet…', [opt('Türkei', true), opt('Italien', false)]),
        mc('Welche drei Länder liegen im Nahen Osten (nicht Nordafrika)?', [opt('سُورِيَا، لُبْنَان، الْأُرْدُنّ', true), opt('فَرَنْسَا، إِسْبَانِيَا، إِيطَالِيَا', false)])
      ] }
    ]
  },
  {
    theory_id: 'theory_vocab_unit_04_c',
    title: 'Persönliche Angaben, Länder, Sprachen und Nationalitäten (3)',
    content_status: 'needs_language_review',
    learning_objectives: [
      'Von einem Ländernamen die Staatsangehörigkeits-Bezeichnung (nisba-Form) ableiten.',
      'Männliche und weibliche Form von Staatsangehörigkeiten unterscheiden.',
      'Adresse, Telefonnummer und E-Mail-Adresse benennen.'
    ],
    blocks: [
      { type: 'paragraph', text: 'Diese letzte Session der Unit zeigt dir ein sehr produktives Muster: Aus fast jedem Ländernamen lässt sich durch Anhängen von ي (maskulin) bzw. ية (feminin) die passende Staatsangehörigkeits-Bezeichnung bilden — die sogenannte nisba-Form. أَلْمَانِيَا → أَلْمَانِيّ/أَلْمَانِيَّة (Deutscher/Deutsche), مِصْر → مِصْرِيّ, سُورِيَا → سُورِيّ, لُبْنَان → لُبْنَانِيّ, الْأُرْدُنّ → أُرْدُنِّيّ, الْمَغْرِب → مَغْرِبِيّ. Diese Wörter funktionieren sowohl als Substantiv („ein Deutscher“) als auch als Adjektiv („deutsches Auto“).' },
      { type: 'paragraph', text: 'Der zweite Teil dieser Session sammelt weitere Kontaktangaben: عُنْوَان (Adresse), رَقْم الْهَاتِف (Telefonnummer, wieder nach dem Iḍāfa-Muster aus Unit 3: رَقْم + الْهَاتِف) und عُنْوَان الْبَرِيد الْإِلِكْتْرُونِيّ (E-Mail-Adresse, wörtlich „Adresse der elektronischen Post“).' },
      { type: 'heading', level: 'full', text: 'Mehr erfahren: die nisba-Endung als produktives Muster' },
      { type: 'paragraph', level: 'full', text: 'Die nisba-Endung ي/ية ist eines der produktivsten Muster im Arabischen — sie funktioniert nicht nur bei Ländern, sondern bei fast jedem Substantiv, um „zugehörig zu X“ auszudrücken. Du hast sie bereits bei den Sprachnamen in Session A indirekt gesehen (الْعَرَبِيَّة ist letztlich dieselbe Bildung). Eine vollständige Übersicht der Lautveränderungen bei dieser Endung folgt in einer späteren Grammatik-Einheit.' },
      { type: 'callout', variant: 'tip', title: 'Merke', text: 'Land + ي (maskulin) / + ية (feminin) = Staatsangehörigkeit. Das Muster funktioniert bei praktisch jedem Ländernamen aus dieser Unit.' },
      { type: 'callout', variant: 'info', title: 'Typischer Fehler', text: 'أُرْدُنِّيّ (jordanisch) wird oft falsch geschrieben, weil beim Anhängen der Endung an الْأُرْدُنّ eine Verdopplung des ن auftritt — das ist eine regelmäßige lautliche Anpassung, keine Ausnahme, die du dir gesondert merken musst.' },
      { type: 'example', arabic: 'هُوَ مِصْرِيّ، وَهِيَ أَلْمَانِيَّة.', translation: 'Er ist Ägypter, und sie ist Deutsche.', note: 'هُوَ/هِيَ (er/sie) hier nur zur Veranschaulichung markiert.' },
      { type: 'example', arabic: 'مَا عُنْوَانُكَ؟', translation: 'Wie lautet deine Adresse?', note: 'Direkte Frage nach der Adresse.' },
      { type: 'example', arabic: 'أَعْطِنِي رَقْمَ الْهَاتِفِ، مِنْ فَضْلِكَ.', translation: 'Gib mir bitte die Telefonnummer.', note: 'مِنْ فَضْلِكَ (bitte) kennst du bereits aus dem Bestand.' },
      { type: 'word_preview', word_ids: ['c1_u04_21', 'c1_u04_22', 'c1_u04_23', 'c1_u04_24', 'c1_u04_25', 'c1_u04_26', 'c1_u04_27', 'c1_u04_28', 'c1_u04_29', 'c1_u04_30'] },
      { type: 'mini_check', questions: [
        mc('Wie bildet man aus مِصْر die Staatsangehörigkeit؟', [opt('ي/ية anhängen: مِصْرِيّ', true), opt('das Wort bleibt gleich', false)]),
        mc('عُنْوَان الْبَرِيد الْإِلِكْتْرُونِيّ bedeutet…', [opt('E-Mail-Adresse', true), opt('Telefonnummer', false)]),
        mc('Welche Form ist feminin؟', [opt('أَلْمَانِيَّة', true), opt('أَلْمَانِيّ', false)])
      ] }
    ]
  },
  // ============================== UNIT 5 (Zahlen) ==============================
  {
    theory_id: 'theory_vocab_unit_05_a',
    title: 'Zahlen, Mengen und Maße (1)',
    content_status: 'needs_language_review',
    learning_objectives: [
      'Die arabischen Zahlwörter 1 bis 10 erkennen und aussprechen.',
      'Arabische Zahlwörter von arabischen Ziffern unterscheiden.',
      'Einfache Mengen (z. B. beim Einkaufen) benennen können.'
    ],
    blocks: [
      { type: 'paragraph', text: 'Mit dieser Session beginnst du das Thema Zahlen — eines der praktischsten Themen überhaupt, ob beim Einkaufen, bei Uhrzeiten oder bei Preisen. Die Zahlwörter وَاحِد (eins) bis عَشَرَة (zehn) sind reine Wörter, die du wie jedes andere Substantiv lernst.' },
      { type: 'paragraph', text: 'Wichtig: Unterscheide diese ausgeschriebenen Zahlwörter von den arabisch-indischen Ziffern (١ ٢ ٣ …), die in vielen arabischsprachigen Ländern parallel zu den aus Europa bekannten Ziffern (1 2 3) verwendet werden. Diese Ziffern lernst du in einer separaten Schrift-Einheit — hier geht es nur um die gesprochenen/geschriebenen WÖRTER für Zahlen, wie „eins“, „zwei“, „drei“ im Deutschen.' },
      { type: 'heading', level: 'full', text: 'Mehr erfahren: Vorschau auf Zahlen und Genus' },
      { type: 'paragraph', level: 'full', text: 'Im Arabischen hat jede Zahl von 3 bis 10 eigentlich zwei Formen (mit und ohne ة), je nachdem, ob das gezählte Substantiv maskulin oder feminin ist — und die Regel ist ungewöhnlich: Bei männlichen gezählten Dingen verliert die Zahl ihre ة-Endung, bei weiblichen behält sie sie. Diese sogenannte „polarity rule“ wird in einer eigenen Grammatik-Einheit ausführlich erklärt. Für diese Session reicht es, die Grundform jeder Zahl sicher zu erkennen.' },
      { type: 'callout', variant: 'tip', title: 'Merke', text: 'Zahlwörter (وَاحِد, اِثْنَان, …) sind etwas anderes als arabische Ziffern (١، ٢، ٣) — beide begegnen dir im Kurs, aber in unterschiedlichen Zusammenhängen.' },
      { type: 'callout', variant: 'info', title: 'Typischer Fehler', text: 'سِتَّة (sechs) und سَبْعَة (sieben) werden wegen des gemeinsamen Anfangsbuchstabens س oft verwechselt — achte auf die unterschiedlichen Folgebuchstaben.' },
      { type: 'example', arabic: 'وَاحِد، اِثْنَان، ثَلَاثَة…', translation: 'eins, zwei, drei…', note: 'Der Beginn jeder Zählreihe.' },
      { type: 'example', arabic: 'عِنْدِي خَمْسَة كُتُب.', translation: 'Ich habe fünf Bücher.', note: 'عِنْدِي (ich habe) und كُتُب (Bücher, Vorschau Unit 23) noch nicht aktiv abgefragt.' },
      { type: 'example', arabic: 'عَشَرَة أَيَّام', translation: 'zehn Tage', note: 'أَيَّام (Tage) als Vorschau auf Unit 6.' },
      { type: 'word_preview', word_ids: ['num_1', 'num_2', 'num_3', 'num_4', 'num_5', 'num_6', 'num_7', 'num_8', 'num_9', 'num_10'] },
      { type: 'mini_check', questions: [
        mc('Welches Wort bedeutet „vier“؟', [opt('أَرْبَعَة', true), opt('سَبْعَة', false)]),
        mc('Zahlwörter und arabische Ziffern sind…', [opt('zwei unterschiedliche Dinge', true), opt('genau dasselbe', false)]),
        mc('Welche Zahl kommt nach سِتَّة؟', [opt('سَبْعَة', true), opt('تِسْعَة', false)])
      ] }
    ]
  },
  {
    theory_id: 'theory_vocab_unit_05_b',
    title: 'Zahlen, Mengen und Maße (2)',
    content_status: 'needs_language_review',
    learning_objectives: [
      'Null sowie die Zahlen 11 bis 19 bilden und erkennen.',
      'Das wiederkehrende Baumuster „Einerzahl + عَشَر“ bei 11-19 erkennen.',
      'Zusammengesetzte Zahlwörter von den Grundzahlen 1-10 ableiten.'
    ],
    blocks: [
      { type: 'paragraph', text: 'صِفْر (null) ergänzt die Zahlenreihe aus der letzten Session nach unten. Der eigentliche Fokus dieser Session liegt aber auf den Zahlen 11 bis 19 — und hier zeigt sich ein sehr regelmäßiges Bauprinzip: Jede dieser Zahlen besteht aus der jeweiligen Einerzahl (die du aus Session A kennst) plus عَشَر („-zehn“), ähnlich wie im Deutschen „drei-zehn“, „vier-zehn“.' },
      { type: 'paragraph', text: 'أَحَدَ عَشَر (elf) und اِثْنَا عَشَر (zwölf) sind dabei zwei Ausnahmen mit einer leicht abweichenden Form der Einerzahl — ab dreizehn folgt das Muster sehr regelmäßig: ثَلَاثَةَ عَشَر (13), أَرْبَعَةَ عَشَر (14), خَمْسَةَ عَشَر (15), سِتَّةَ عَشَر (16), سَبْعَةَ عَشَر (17), ثَمَانِيَةَ عَشَر (18), تِسْعَةَ عَشَر (19). Wenn du die Zahlen 1-10 aus Session A sicher kannst, erkennst du in jeder dieser zusammengesetzten Zahlen sofort die erste Hälfte wieder.' },
      { type: 'heading', level: 'full', text: 'Mehr erfahren: die Lautverschiebung von عَشَرَة zu عَشَر' },
      { type: 'paragraph', level: 'full', text: 'Genau wie im Deutschen („dreizehn“ aus „drei“ + „zehn“) ist dieses Muster kein Zufall: عَشَر ist die leicht abgewandelte Form von عَشَرَة (zehn) aus Session A. Achte auf diese kleine Lautverschiebung — sie ist typisch für zusammengesetzte Zahlen im Arabischen und kein neues, unabhängiges Wort.' },
      { type: 'callout', variant: 'tip', title: 'Merke', text: '13-19 = Einerzahl (mit -ةَ-Endung) + عَشَر. Kennst du die Zahlen 3-9, kannst du 13-19 fast automatisch ableiten.' },
      { type: 'callout', variant: 'info', title: 'Typischer Fehler', text: 'أَحَدَ عَشَر (11) und اِثْنَا عَشَر (12) folgen NICHT exakt demselben Muster wie 13-19 — sie haben eine eigene, unregelmäßige Form. Lerne diese beiden separat.' },
      { type: 'example', arabic: 'أَحَدَ عَشَر يَوْماً', translation: 'elf Tage', note: 'يَوْماً (Tage) als Vorschau auf Unit 6.' },
      { type: 'example', arabic: 'عُمْرِي خَمْسَةَ عَشَر.', translation: 'Ich bin fünfzehn (Jahre alt).', note: 'عُمْرِي (mein Alter) aus Unit 4.' },
      { type: 'example', arabic: 'صِفْر دَرَجَة', translation: 'null Grad', note: 'دَرَجَة (Grad) hier nur zur Veranschaulichung.' },
      { type: 'word_preview', word_ids: ['c1_u05_01', 'c1_u05_02', 'c1_u05_03', 'c1_u05_04', 'c1_u05_05', 'c1_u05_06', 'c1_u05_07', 'c1_u05_08', 'c1_u05_09', 'c1_u05_10'] },
      { type: 'mini_check', questions: [
        mc('Welche Zahl folgt NICHT dem regelmäßigen Muster „Einerzahl + عَشَر“؟', [opt('أَحَدَ عَشَر', true), opt('خَمْسَةَ عَشَر', false)]),
        mc('تِسْعَةَ عَشَر bedeutet…', [opt('neunzehn', true), opt('neun', false)]),
        mc('صِفْر bedeutet…', [opt('null', true), opt('zehn', false)])
      ] }
    ]
  },
  {
    theory_id: 'theory_vocab_unit_05_c',
    title: 'Zahlen, Mengen und Maße (3)',
    content_status: 'needs_language_review',
    learning_objectives: [
      'Größere Zahlen (20, 100, 1000) sowie Bruchteile (halb, Viertel) benennen.',
      'Mengenangaben „viel“ und „wenig“ verwenden.',
      'Die drei wichtigsten Maßeinheiten (Kilogramm, Meter, Liter) erkennen.'
    ],
    blocks: [
      { type: 'paragraph', text: 'Diese letzte Session zum Thema Zahlen springt zu größeren Größenordnungen: عِشْرُون (zwanzig) — doppelt so viel wie das dir bekannte عَشَرَة (zehn) —, مِئَة (hundert) und أَلْف (tausend). Für Teile eines Ganzen lernst du نِصْف (Hälfte/halb) und رُبْع (Viertel) — beide sind auch eigenständige Substantive, ähnlich wie im Deutschen „die Hälfte“.' },
      { type: 'paragraph', text: 'كَثِير (viel/viele) und قَلِيل (wenig/wenige) sind Adjektive, die du bei fast jedem Substantiv einsetzen kannst, um eine ungefähre Menge auszudrücken, ohne eine genaue Zahl zu nennen. Zum Abschluss lernst du die drei international gebräuchlichen Maßeinheiten كِيلُوغْرَام (Kilogramm), مِتْر (Meter) und لِتْر (Liter) — alle drei sind Lehnwörter aus europäischen Sprachen und daher im Arabischen relativ leicht zu erkennen.' },
      { type: 'heading', level: 'full', text: 'Mehr erfahren: نِصْف und رُبْع als Substantive' },
      { type: 'paragraph', level: 'full', text: 'نِصْف und رُبْع funktionieren wie Substantive und können mit anderen Substantiven kombiniert werden (z. B. „eine halbe Stunde“), genau wie im Deutschen. Interessant: أَلْف (tausend) hat einen unregelmäßigen Plural (آلَاف, „Tausende“) — mehr zur Pluralbildung im Arabischen folgt in einer eigenen Grammatik-Einheit.' },
      { type: 'callout', variant: 'tip', title: 'Merke', text: 'كَثِير/قَلِيل sind Gegensätze — lerne sie am besten direkt als Paar.' },
      { type: 'callout', variant: 'info', title: 'Typischer Fehler', text: 'كِيلُوغْرَام, مِتْر und لِتْر klingen ihren europäischen Entsprechungen so ähnlich, dass Lernende oft die arabische Aussprache vernachlässigen — achte trotzdem auf die arabische Betonung und Schreibweise.' },
      { type: 'example', arabic: 'عِنْدِي مِئَة كِتَاب.', translation: 'Ich habe hundert Bücher.', note: 'عِنْدِي (ich habe) und كِتَاب (Buch) hier nur zur Veranschaulichung.' },
      { type: 'example', arabic: 'نِصْف كِيلُوغْرَام مِنَ التُّفَّاح', translation: 'ein halbes Kilogramm Äpfel', note: 'مِنَ التُّفَّاح (von den Äpfeln) als Vorschau auf Unit 9.' },
      { type: 'example', arabic: 'قَلِيل مِنَ الْوَقْت', translation: 'wenig Zeit', note: 'الْوَقْت (die Zeit) hier nur zur Veranschaulichung markiert.' },
      { type: 'word_preview', word_ids: ['c1_u05_11', 'c1_u05_12', 'c1_u05_13', 'c1_u05_14', 'c1_u05_15', 'c1_u05_16', 'c1_u05_17', 'c1_u05_18', 'c1_u05_19', 'c1_u05_20'] },
      { type: 'mini_check', questions: [
        mc('أَلْف bedeutet…', [opt('tausend', true), opt('hundert', false)]),
        mc('Welches Wort bedeutet „Viertel“؟', [opt('رُبْع', true), opt('نِصْف', false)]),
        mc('Welche drei Maßeinheiten hast du in dieser Session gelernt؟', [opt('Kilogramm, Meter, Liter', true), opt('Stunde, Minute, Tag', false)])
      ] }
    ]
  }
];

// --- Bestehende Pilot-Theorie (Session A von Unit 1/2/3) um das jeweils zehnte Wort ergänzen --
const PATCHES = [
  {
    theory_id: 'theory_vocab_unit_01_a',
    newWordId: 'c1_u01_01',
    extraParagraph: 'Ergänzend zu den neun Ausdrücken oben lernst du in dieser Session noch أَهْلاً وَسَهْلاً („Herzlich willkommen“) — die etwas ausführlichere, sehr herzliche Variante von أَهْلاً, mit der man Gäste besonders warm empfängt.',
    extraExample: { type: 'example', arabic: 'أَهْلاً وَسَهْلاً بِكُم!', translation: 'Herzlich willkommen!', note: 'Wird oft beim Empfang von Gästen oder Besuchern gesagt.' }
  },
  {
    theory_id: 'theory_vocab_unit_02_a',
    newWordId: ['c1_u02_01', 'c1_u02_02'],
    extraParagraph: 'Ergänzend zur Kernfamilie lernst du in dieser Session noch عَائِلَة („Familie“) als Oberbegriff für alle Verwandten zusammen, sowie زَوْج („Ehemann“) als erstes Wort für die Ehe-Beziehung — die passende weibliche Form زَوْجَة („Ehefrau“) folgt in der nächsten Session.',
    extraExample: { type: 'example', arabic: 'عَائِلَتِي كَبِيرَة.', translation: 'Meine Familie ist groß.', note: 'كَبِيرَة (groß) als Vorschau auf Unit 19.' }
  },
  {
    theory_id: 'theory_vocab_unit_03_a',
    newWordId: ['c1_u03_01', 'c1_u03_02'],
    extraParagraph: 'Ergänzend zum Haus (بَيْت) aus dem Bestand lernst du in dieser Session noch شَقَّة („Wohnung“, eine einzelne Wohneinheit) und مَبْنَى („Gebäude“, das ganze Haus mit mehreren Wohnungen) — zwei Begriffe, die besonders für das Leben in der Stadt wichtig sind.',
    extraExample: { type: 'example', arabic: 'شَقَّتِي فِي مَبْنَى كَبِير.', translation: 'Meine Wohnung ist in einem großen Gebäude.', note: 'Verbindet beide neuen Wörter in einem Satz.' }
  }
];

// --- Anwenden ---------------------------------------------------------------------------------
const theoryData = JSON.parse(fs.readFileSync(THEORY_PATH, 'utf-8'));
const byId = new Map(theoryData.theories.map((t, i) => [t.theory_id, i]));

let replaced = 0;
for (const doc of NEW_DOCS) {
  if (byId.has(doc.theory_id)) {
    theoryData.theories[byId.get(doc.theory_id)] = doc;
  } else {
    theoryData.theories.push(doc);
    byId.set(doc.theory_id, theoryData.theories.length - 1);
  }
  replaced += 1;
}

let patched = 0;
for (const patch of PATCHES) {
  const idx = byId.get(patch.theory_id);
  if (idx === undefined) { console.error(`WARNUNG: ${patch.theory_id} nicht gefunden, überspringe Patch.`); continue; }
  const doc = theoryData.theories[idx];
  const newIds = Array.isArray(patch.newWordId) ? patch.newWordId : [patch.newWordId];

  // word_preview ergänzen (idempotent).
  const previewBlock = doc.blocks.find((b) => b.type === 'word_preview');
  if (previewBlock) {
    for (const id of newIds) if (!previewBlock.word_ids.includes(id)) previewBlock.word_ids.push(id);
  }
  // Zusatzabsatz + Zusatzbeispiel nur einfügen, wenn noch nicht vorhanden (idempotent über einen
  // Marker-String-Vergleich).
  const alreadyPatched = doc.blocks.some((b) => b.type === 'paragraph' && b.text === patch.extraParagraph);
  if (!alreadyPatched) {
    const mcIdx = doc.blocks.findIndex((b) => b.type === 'mini_check');
    const insertAt = mcIdx === -1 ? doc.blocks.length : mcIdx;
    doc.blocks.splice(insertAt, 0, { type: 'paragraph', text: patch.extraParagraph }, patch.extraExample);
  }
  patched += 1;
}

fs.writeFileSync(THEORY_PATH, `${JSON.stringify(theoryData, null, 2)}\n`, 'utf-8');
console.log(`Theoriedokumente ersetzt/angelegt: ${replaced}`);
console.log(`Bestehende Pilot-Theoriedokumente gepatcht: ${patched}`);
console.log(`Theoriedokumente insgesamt: ${theoryData.theories.length}`);
