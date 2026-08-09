#!/usr/bin/env node
// Entwicklungsauftrag 8, Abschnitt 5/6 — ersetzt die 15 Platzhalter-Theoriedokumente der Units
// 11-15 durch vollständige, auf die jeweiligen 10 Wörter jeder Session zugeschnittene Theorie.
// Idempotent (ersetzt anhand der theory_id, egal ob Platzhalter oder bereits echt).
//
// Unit 14 (Gesundheit/Apotheke) ist bewusst als reiner Sprachunterricht gehalten: es geht darum,
// WÖRTER zu lernen, um beim Arzt/in der Apotheke einen Satz zu verstehen oder zu bilden — an
// keiner Stelle werden Diagnosen gestellt, Medikamente empfohlen oder Behandlungsanweisungen
// gegeben. Das wird auch im Text selbst einmal explizit festgehalten (siehe Callout in 14_a).

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const THEORY_PATH = path.join(ROOT, 'language-packs', 'arabic', 'theory.json');

function mc(question, options) { return { question, options }; }
function opt(text, correct) { return { text, correct }; }

const DOCS = [
  // ============================== UNIT 11 (Einkaufen, Geld und Preise) ==============================
  {
    theory_id: 'theory_vocab_unit_11_a',
    title: 'Einkaufen, Geld und Preise (1)',
    content_status: 'needs_language_review',
    learning_objectives: [
      'Die vier Grundverben des Einkaufens (kaufen, verkaufen, bezahlen, kosten) auseinanderhalten.',
      'رَخِيص und غَالٍ als Gegensatzpaar für „billig“/„teuer“ sicher verwenden.',
      'Die bereits bekannten Wörter Geld/Preis/Laden/Tüte mit den neuen Verben kombinieren.'
    ],
    blocks: [
      { type: 'paragraph', text: 'Diese Unit dreht sich ums Einkaufen: Du kennst aus dem Bestand bereits نُقُود (Geld), سِعْر (Preis), مَحَلّ (Laden) und كِيس (Tüte) — in dieser Session lernst du dazu die vier zentralen Handlungsverben اِشْتَرَى (kaufen), بَاعَ (verkaufen), دَفَعَ (bezahlen) und كَلَّفَ (kosten). Wichtig ist der Unterschied zwischen اِشْتَرَى (DU kaufst etwas) und بَاعَ (jemand ANDERES verkauft dir etwas) — die beiden Verben sind ein klassisches Gegensatzpaar aus zwei unterschiedlichen Blickwinkeln auf denselben Vorgang.' },
      { type: 'paragraph', text: 'دَفَعَ (bezahlen) beschreibt den Moment, in dem du dein Geld übergibst, während كَلَّفَ (kosten) beschreibt, wie viel etwas WERT ist — du fragst زُبُون: „كَمْ يُكَلِّفُ هَذَا؟“ (Wie viel kostet das?) und antwortest dann mit einer Preisangabe. Danach lernst du das erste Adjektivpaar dieser Unit: رَخِيص (billig/günstig) und غَالٍ (teuer) — genau wie „billig“ und „teuer“ im Deutschen sind das die zwei Enden derselben Skala.' },
      { type: 'heading', level: 'full', text: 'Mehr erfahren: die Vergangenheitsform als Grundform' },
      { type: 'paragraph', level: 'full', text: 'Alle vier Verben dieser Session stehen wie gewohnt in der 3. Person männlich Vergangenheit (er hat gekauft/verkauft/bezahlt/gekostet) — das ist im Arabischunterricht die klassische Zitierform für Verben, ähnlich wie der Infinitiv im Deutschen. Wenn du später über DICH selbst sprechen möchtest, ändert sich die Endung des Verbs, aber die Grundbedeutung bleibt gleich.' },
      { type: 'callout', variant: 'tip', title: 'Merke', text: 'اِشْتَرَى (kaufen) und بَاعَ (verkaufen) sind zwei Seiten desselben Vorgangs — wer bei dir kauft, dem verkaufst du.' },
      { type: 'callout', variant: 'info', title: 'Typischer Fehler', text: 'دَفَعَ (bezahlen, der Vorgang) und كَلَّفَ (kosten, der Wert) werden oft verwechselt — „Ich bezahle“ ist دَفَعَ, „Es kostet“ ist كَلَّفَ.' },
      { type: 'example', arabic: 'اِشْتَرَيْتُ قَمِيصاً رَخِيصاً.', translation: 'Ich habe ein billiges Hemd gekauft.', note: 'قَمِيص (Hemd) kennst du bereits, Unit 12 vertieft Kleidung.' },
      { type: 'example', arabic: 'كَمْ يُكَلِّفُ هَذَا الْمَحَلّ؟', translation: 'Wie viel kostet das in diesem Laden?', note: 'مَحَلّ (Laden) aus dem Bestand.' },
      { type: 'example', arabic: 'هَذَا غَالٍ جِدّاً!', translation: 'Das ist sehr teuer!', note: 'جِدّاً (sehr) kennst du bereits aus dem Bestand.' },
      { type: 'word_preview', word_ids: ['shop_money', 'shop_price', 'shop_store', 'shop_bag', 'c1_u11_01', 'c1_u11_02', 'c1_u11_03', 'c1_u11_04', 'c1_u11_05', 'c1_u11_06'] },
      { type: 'mini_check', questions: [
        mc('Wer führt اِشْتَرَى aus?', [opt('die Person, die etwas kauft', true), opt('die Person, die etwas verkauft', false)]),
        mc('Das Gegenteil von رَخِيص ist…', [opt('غَالٍ', true), opt('كَلَّفَ', false)]),
        mc('كَلَّفَ bedeutet…', [opt('kosten', true), opt('bezahlen', false)])
      ] }
    ]
  },
  {
    theory_id: 'theory_vocab_unit_11_b',
    title: 'Einkaufen, Geld und Preise (2)',
    content_status: 'needs_language_review',
    learning_objectives: [
      'Rabatt/Sonderangebote von einem regulären Preis unterscheiden.',
      'Markt und Supermarkt begrifflich trennen.',
      'Kunde/Verkäufer sowie die drei Bezahlwege (bar/Karte/Bank/Konto) benennen.'
    ],
    blocks: [
      { type: 'paragraph', text: 'خَصْم (Rabatt) ist eine einzelne Preisreduktion, تَخْفِيضَات (Sonderangebote/Preisnachlässe, Pluralform) beschreibt dagegen eine ganze Aktion mit mehreren reduzierten Artikeln — im Deutschen sagen wir dafür oft „Sale“ oder „Rabattaktion“. Danach lernst du den Unterschied zwischen سُوق (Markt, ein Ort mit vielen einzelnen Ständen, oft im Freien) und سُوبَرْمَارْكِت (Supermarkt, ein einzelnes großes Geschäft unter einem Dach) — دieses zweite Wort ist ein direktes Lehnwort aus dem Englischen/International, wie du es an der Aussprache erkennst.' },
      { type: 'paragraph', text: 'زَبُون (Kunde) und بَائِع (Verkäufer) sind die zwei Rollen jeder Einkaufssituation — merke dir, dass بَائِع vom Verb بَاعَ (verkaufen) aus Session A abgeleitet ist, genau wie im Deutschen „Verkäufer“ von „verkaufen“ kommt. Für das Bezahlen selbst gibt es zwei Wege: نَقْداً (bar) mit Geldscheinen oder بِطَاقَة (Karte) — beide hängen mit بَنْك (Bank) und حِسَاب (Konto) zusammen, denn das Geld auf deiner Karte liegt letztlich auf deinem Bankkonto.' },
      { type: 'heading', level: 'full', text: 'Mehr erfahren: warum سُوبَرْمَارْكِت wie ein Fremdwort klingt' },
      { type: 'paragraph', level: 'full', text: 'Viele moderne Alltagswörter — vor allem für Konzepte, die es historisch im arabischsprachigen Raum noch nicht gab (Supermärkte, Kreditkarten, Technologien) — wurden im modernen Hocharabisch direkt aus europäischen Sprachen entlehnt und nur an die arabische Aussprache angepasst. سُوبَرْمَارْكِت ist ein gutes Beispiel dafür: Du erkennst „Supermarket“ fast unverändert wieder.' },
      { type: 'callout', variant: 'tip', title: 'Merke', text: 'بَائِع (Verkäufer) ist vom Verb بَاعَ (verkaufen) abgeleitet — wer die Verb-Grundform kennt, erkennt viele verwandte Substantive automatisch mit.' },
      { type: 'callout', variant: 'info', title: 'Typischer Fehler', text: 'سُوق (Markt) und سُوبَرْمَارْكِت (Supermarkt) klingen ähnlich, meinen aber sehr unterschiedliche Orte — ein سُوق hat viele einzelne Stände, ein سُوبَرْمَارْكِت ist ein einziges großes Geschäft.' },
      { type: 'example', arabic: 'هَلْ يُوجَدُ خَصْمٌ فِي هَذَا السُّوق؟', translation: 'Gibt es einen Rabatt auf diesem Markt?', note: 'يُوجَدُ (es gibt) kennst du bereits aus dem Bestand.' },
      { type: 'example', arabic: 'أَدْفَعُ نَقْداً أَوْ بِبِطَاقَة.', translation: 'Ich zahle bar oder mit Karte.', note: 'أَوْ (oder) kennst du bereits aus dem Bestand.' },
      { type: 'example', arabic: 'اَلْبَائِعُ فِي السُّوبَرْمَارْكِت.', translation: 'Der Verkäufer ist im Supermarkt.', note: 'فِي (in) kennst du bereits aus dem Bestand.' },
      { type: 'word_preview', word_ids: ['c1_u11_07', 'c1_u11_08', 'c1_u11_09', 'c1_u11_10', 'c1_u11_11', 'c1_u11_12', 'c1_u11_13', 'c1_u11_14', 'c1_u11_15', 'c1_u11_16'] },
      { type: 'mini_check', questions: [
        mc('Was ist der Unterschied zwischen سُوق und سُوبَرْمَارْكِت؟', [opt('سُوق hat viele einzelne Stände, سُوبَرْمَارْكِت ist ein Geschäft', true), opt('es gibt keinen Unterschied', false)]),
        mc('بَائِع ist abgeleitet von…', [opt('dem Verb بَاعَ (verkaufen)', true), opt('dem Wort سُوق (Markt)', false)]),
        mc('Welches Wort bezeichnet eine ganze Rabattaktion (nicht nur einen Rabatt)?', [opt('تَخْفِيضَات', true), opt('خَصْم', false)])
      ] }
    ]
  },
  {
    theory_id: 'theory_vocab_unit_11_c',
    title: 'Einkaufen, Geld und Preise (3)',
    content_status: 'needs_language_review',
    learning_objectives: [
      'Quittung und Wechselgeld nach dem Bezahlvorgang benennen.',
      'Größe, Gewicht, Stück und Menge als Maßangaben unterscheiden.',
      'Geöffnet/geschlossen/verfügbar als Statuswörter beim Einkaufen anwenden.'
    ],
    blocks: [
      { type: 'paragraph', text: 'Nach dem Bezahlen bekommst du إِيصَال (Quittung/Kassenbon) — den Beleg für deinen Einkauf — und manchmal اَلْبَاقِي (Wechselgeld/Rest), wenn du mehr Geld gegeben hast als nötig. Danach lernst du vier Maßbegriffe, die beim Einkaufen ständig vorkommen: مَقَاس (Größe, z. B. bei Kleidung), وَزْن (Gewicht, z. B. bei Obst und Gemüse), قِطْعَة (Stück, eine einzelne Einheit) und كَمِّيَّة (Menge, wie viel insgesamt).' },
      { type: 'paragraph', text: 'Zum Abschluss dieser Unit lernst du drei Statuswörter: مَفْتُوح (geöffnet) und مُغْلَق (geschlossen) beschreiben, ob ein Laden gerade Kunden empfängt, während مُتَوَفِّر (verfügbar) beschreibt, ob ein bestimmter Artikel noch vorrätig ist. Zusammen mit اِخْتَارَ (auswählen) — dem letzten Verb dieser Unit — kannst du jetzt einen kompletten Einkauf beschreiben: einen Laden finden, der geöffnet ist, prüfen, ob ein Artikel verfügbar ist, ihn auswählen, bezahlen und deine Quittung mit Wechselgeld erhalten.' },
      { type: 'heading', level: 'full', text: 'Mehr erfahren: مَفْتُوح/مُغْلَق als aktives Partizip' },
      { type: 'paragraph', level: 'full', text: 'مَفْتُوح und مُغْلَق gehören zu einer sehr häufigen arabischen Wortbildungsform, dem sogenannten Passiv-Partizip (Muster مَفْعُول) — es beschreibt das Ergebnis einer Handlung: مَفْتُوح („geöffnet worden“) kommt vom Verb „öffnen“, مُغْلَق („geschlossen worden“) vom Verb „schließen“. Diese Wortbildung begegnet dir im weiteren Kursverlauf noch öfter bei ähnlichen Zustandsbeschreibungen.' },
      { type: 'callout', variant: 'tip', title: 'Merke', text: 'مَفْتُوح (geöffnet) und مُغْلَق (geschlossen) sind ein festes Gegensatzpaar — genau wie die Ladentür entweder offen oder zu ist.' },
      { type: 'callout', variant: 'info', title: 'Typischer Fehler', text: 'قِطْعَة (Stück, eine einzelne Einheit) und كَمِّيَّة (Menge, die Gesamtzahl) werden oft verwechselt — „drei Stück“ verwendet قِطْعَة, „wie viel insgesamt“ verwendet كَمِّيَّة.' },
      { type: 'example', arabic: 'هَلِ الْمَحَلُّ مَفْتُوحٌ الْآن؟', translation: 'Ist der Laden gerade geöffnet?', note: 'اَلْآن (jetzt) kennst du bereits aus dem Bestand.' },
      { type: 'example', arabic: 'أُرِيدُ قِطْعَتَيْنِ مِنْ هَذَا الْمَقَاس.', translation: 'Ich möchte zwei Stück in dieser Größe.', note: 'أُرِيدُ (ich möchte) kennst du bereits aus dem Bestand.' },
      { type: 'example', arabic: 'خُذْ إِيصَالَكَ وَالْبَاقِي.', translation: 'Nimm deine Quittung und dein Wechselgeld.', note: 'خُذْ (nimm) hier nur zur Veranschaulichung markiert.' },
      { type: 'word_preview', word_ids: ['c1_u11_17', 'c1_u11_18', 'c1_u11_19', 'c1_u11_20', 'c1_u11_21', 'c1_u11_22', 'c1_u11_23', 'c1_u11_24', 'c1_u11_25', 'c1_u11_26'] },
      { type: 'mini_check', questions: [
        mc('Was bekommst du normalerweise NACH dem Bezahlen?', [opt('إِيصَال (Quittung)', true), opt('مَقَاس (Größe)', false)]),
        mc('Das Gegenteil von مَفْتُوح ist…', [opt('مُغْلَق', true), opt('مُتَوَفِّر', false)]),
        mc('Welches Wort beschreibt „eine einzelne Einheit“?', [opt('قِطْعَة', true), opt('كَمِّيَّة', false)])
      ] }
    ]
  },
  // ============================== UNIT 12 (Kleidung, Schuhe und Accessoires) ==============================
  {
    theory_id: 'theory_vocab_unit_12_a',
    title: 'Kleidung, Schuhe und Accessoires (1)',
    content_status: 'needs_language_review',
    learning_objectives: [
      'Die fünf Grundkleidungsstücke aus dem Bestand um fünf weitere ergänzen.',
      'فُسْتَان (Kleid) von تَنُّورَة (Rock) unterscheiden.',
      'تِي شِيرْت als erkennbares Lehnwort einordnen.'
    ],
    blocks: [
      { type: 'paragraph', text: 'Du kennst aus dem Bestand bereits قَمِيص (Hemd), بَنْطَلُون (Hose), حِذَاء (Schuh), مِعْطَف (Mantel) und قُبَّعَة (Hut) — diese Unit ergänzt das Vokabular für Oberbekleidung um فُسْتَان (Kleid, ein Kleidungsstück in einem Stück für Frauen), تَنُّورَة (Rock, bedeckt nur die untere Körperhälfte) sowie zwei warme Oberteile: سُتْرَة (Jacke) und كَنْزَة (Pullover). Der wichtigste Unterschied hier: فُسْتَان ist ein EINTEILIGES Kleidungsstück, تَنُّورَة dagegen wird immer mit einem separaten Oberteil kombiniert.' },
      { type: 'paragraph', text: 'Zum Abschluss dieser Session lernst du تِي شِيرْت (T-Shirt) — genau wie سُوبَرْمَارْكِت aus Unit 11 ein direktes Lehnwort, dessen Aussprache dem englischen Original sehr nahekommt. سُتْرَة und كَنْزَة sind sich in der Bedeutung ähnlich (beide sind warme Oberteile), unterscheiden sich aber im Material: كَنْزَة ist typischerweise aus Wolle gestrickt, سُتْرَة eher aus festerem Stoff.' },
      { type: 'heading', level: 'full', text: 'Mehr erfahren: Genus bei Kleidungsstücken' },
      { type: 'paragraph', level: 'full', text: 'Auffällig in dieser Session: فُسْتَان, سُتْرَة, كَنْزَة enden auf ة und sind entsprechend feminin — das folgt demselben Muster, das du schon von قُبَّعَة (Hut) aus dem Bestand kennst. تَنُّورَة folgt ebenfalls diesem Muster. Nur تِي شِيرْت als Lehnwort verhält sich grammatisch unregelmäßig und wird wie ein maskulines Substantiv behandelt.' },
      { type: 'callout', variant: 'tip', title: 'Merke', text: 'فُسْتَان (Kleid) ist einteilig, تَنُّورَة (Rock) braucht immer ein separates Oberteil dazu.' },
      { type: 'callout', variant: 'info', title: 'Typischer Fehler', text: 'سُتْرَة (Jacke) und كَنْزَة (Pullover) werden oft synonym verwendet — im Arabischen wie im Deutschen bezeichnet aber nur كَنْزَة ein gestricktes Kleidungsstück.' },
      { type: 'example', arabic: 'اِشْتَرَتْ فُسْتَاناً جَدِيداً.', translation: 'Sie hat ein neues Kleid gekauft.', note: 'اِشْتَرَتْ ist die weibliche Form von اِشْتَرَى aus Unit 11.' },
      { type: 'example', arabic: 'اَلطَّقْسُ بَارِدٌ، الْبَسْ كَنْزَتَكَ.', translation: 'Das Wetter ist kalt, zieh deinen Pullover an.', note: 'اَلطَّقْسُ بَارِدٌ (Wetter kalt) kennst du bereits aus dem Bestand.' },
      { type: 'example', arabic: 'تِي شِيرْت أَبْيَض', translation: 'ein weißes T-Shirt', note: 'أَبْيَض (weiß) kennst du bereits aus dem Bestand.' },
      { type: 'word_preview', word_ids: ['clothing_shirt', 'clothing_pants', 'clothing_shoe', 'clothing_coat', 'clothing_hat', 'c1_u12_01', 'c1_u12_02', 'c1_u12_03', 'c1_u12_04', 'c1_u12_05'] },
      { type: 'mini_check', questions: [
        mc('Welches Kleidungsstück ist einteilig?', [opt('فُسْتَان (Kleid)', true), opt('تَنُّورَة (Rock)', false)]),
        mc('تِي شِيرْت ist ein Beispiel für…', [opt('ein Lehnwort aus dem Englischen', true), opt('ein arabisches Grundwort', false)]),
        mc('كَنْزَة bedeutet…', [opt('Pullover', true), opt('Jacke', false)])
      ] }
    ]
  },
  {
    theory_id: 'theory_vocab_unit_12_b',
    title: 'Kleidung, Schuhe und Accessoires (2)',
    content_status: 'needs_language_review',
    learning_objectives: [
      'Unterwäsche und Socken von der sichtbaren Kleidung abgrenzen.',
      'Schal, Gürtel und Handschuhe als funktionale Accessoires benennen.',
      'Schmuck (Ring, Halskette, Ohrring) begrifflich sammeln.'
    ],
    blocks: [
      { type: 'paragraph', text: 'جَوَارِب (Socken) und مَلَابِس دَاخِلِيَّة (Unterwäsche, wörtlich „innere Kleidung“) trägst du direkt auf der Haut, unter der restlichen Kleidung — beide Wörter stehen im Arabischen im Plural, weil man sie fast nie im Singular verwendet (ganz ähnlich wie im Deutschen „die Socken“ meist im Plural steht). Danach folgen drei funktionale Accessoires: وِشَاح (Schal, um den Hals gegen Kälte), حِزَام (Gürtel, hält die Hose) und قُفَّازَات (Handschuhe, für die Hände).' },
      { type: 'paragraph', text: 'Zum Abschluss lernst du نَظَّارَة (Brille) und سَاعَة يَد (Armbanduhr, wörtlich „Uhr der Hand“ — zusammengesetzt aus سَاعَة, das du bereits als „Stunde/Uhr“ aus Unit 6 kennst, und يَد, „Hand“). Diese beiden Wörter beginnen bereits den Übergang von reiner Kleidung zu Schmuck und Accessoires, den die nächste Session mit خَاتَم (Ring), قِلَادَة (Halskette) und قُرْط (Ohrring) fortsetzt.' },
      { type: 'heading', level: 'full', text: 'Mehr erfahren: زusammengesetzte Begriffe wie سَاعَة يَد' },
      { type: 'paragraph', level: 'full', text: 'سَاعَة يَد ist ein Beispiel für eine sogenannte iḍāfa-Konstruktion (Genitivverbindung): zwei Substantive stehen direkt hintereinander, das zweite bestimmt das erste näher — wörtlich „Uhr der Hand“. Diese Bauweise begegnet dir im Kurs noch mehrfach, etwa bei سَيَّارَة إِسْعَاف (Krankenwagen) in Unit 14.' },
      { type: 'callout', variant: 'tip', title: 'Merke', text: 'جَوَارِب und مَلَابِس دَاخِلِيَّة stehen im Arabischen praktisch immer im Plural — genau wie im Deutschen „die Socken“.' },
      { type: 'callout', variant: 'info', title: 'Typischer Fehler', text: 'قُفَّازَات (Handschuhe, für die Hände) wird gelegentlich mit جَوَارِب (Socken, für die Füße) verwechselt — beide sind Plural-Kleidungsstücke für Extremitäten, aber für unterschiedliche Körperteile.' },
      { type: 'example', arabic: 'اَلْجَوّ بَارِدٌ، اِلْبَسِي الْقُفَّازَات.', translation: 'Es ist kalt, zieh die Handschuhe an.', note: 'اِلْبَسِي ist die weibliche Befehlsform von لَبِسَ aus Session C.' },
      { type: 'example', arabic: 'سَاعَةُ يَدِي جَدِيدَة.', translation: 'Meine Armbanduhr ist neu.', note: 'جَدِيدَة (neu, feminin) kennst du bereits aus dem Bestand.' },
      { type: 'example', arabic: 'أَحْتَاجُ نَظَّارَةً لِلْقِرَاءَة.', translation: 'Ich brauche eine Brille zum Lesen.', note: 'أَحْتَاجُ (ich brauche) kennst du bereits aus dem Bestand.' },
      { type: 'word_preview', word_ids: ['c1_u12_06', 'c1_u12_07', 'c1_u12_08', 'c1_u12_09', 'c1_u12_10', 'c1_u12_11', 'c1_u12_12', 'c1_u12_13', 'c1_u12_14', 'c1_u12_15'] },
      { type: 'mini_check', questions: [
        mc('جَوَارِب und مَلَابِس دَاخِلِيَّة stehen typischerweise…', [opt('im Plural', true), opt('nur im Singular', false)]),
        mc('سَاعَة يَد bedeutet wörtlich…', [opt('Uhr der Hand', true), opt('Hand der Uhr', false)]),
        mc('حِزَام bedeutet…', [opt('Gürtel', true), opt('Schal', false)])
      ] }
    ]
  },
  {
    theory_id: 'theory_vocab_unit_12_c',
    title: 'Kleidung, Schuhe und Accessoires (3)',
    content_status: 'needs_language_review',
    learning_objectives: [
      'Taschen (Handtasche, Geldbörse) und Regenschirm als tragbare Gegenstände einordnen.',
      'لَبِسَ und خَلَعَ als Gegensatzpaar für An- und Ausziehen anwenden.',
      'Farbe, Stoff und Kleidertasche als abschließende Begriffe der Unit zusammenfassen.'
    ],
    blocks: [
      { type: 'paragraph', text: 'حَقِيبَة يَد (Handtasche) und مِحْفَظَة (Geldbörse) trägst du bei dir, um Dinge zu transportieren bzw. dein Geld sicher aufzubewahren — beachte den Unterschied zu حِسَاب (Konto) aus Unit 11: مِحْفَظَة ist der physische Gegenstand, حِسَاب das Bankguthaben. مِظَلَّة (Regenschirm) schützt dich vor Regen. زِرّ (Knopf) und سَحَّاب (Reißverschluss) sind die zwei üblichen Verschlussarten für Kleidungsstücke.' },
      { type: 'paragraph', text: 'Den Höhepunkt dieser Session bilden zwei Gegensatzverben: لَبِسَ (anziehen) und خَلَعَ (ausziehen) — sie beschreiben den Anfang und das Ende des Tragens eines Kleidungsstücks. Zum Abschluss lernst du drei allgemeine Begriffe, die zur ganzen Unit passen: لَوْن (Farbe, z. B. beim Auswählen aus Unit 11), قُمَاش (Stoff, das Material) und جَيْب (Tasche AN der Kleidung, nicht zu verwechseln mit حَقِيبَة يَد, der Handtasche).' },
      { type: 'heading', level: 'full', text: 'Mehr erfahren: زwei arabische Wörter für „Tasche“' },
      { type: 'paragraph', level: 'full', text: 'Das Deutsche verwendet „Tasche“ sowohl für die Innentasche einer Hose als auch für eine Handtasche — im Arabischen sind das zwei völlig unterschiedliche Wörter: جَيْب (die eingenähte Tasche AN einem Kleidungsstück) und حَقِيبَة (ein separater, tragbarer Behälter, z. B. حَقِيبَة يَد). Achte beim Übersetzen aus dem Deutschen immer darauf, welche der beiden Bedeutungen gemeint ist.' },
      { type: 'callout', variant: 'tip', title: 'Merke', text: 'لَبِسَ (anziehen) und خَلَعَ (ausziehen) sind ein festes Gegensatzpaar, genau wie فَتَحَ/أَغْلَقَ (öffnen/schließen).' },
      { type: 'callout', variant: 'info', title: 'Typischer Fehler', text: 'جَيْب (Tasche AN der Kleidung) und حَقِيبَة يَد (Handtasche, ein separater Gegenstand) werden im Deutschen beide mit „Tasche“ übersetzt, sind im Arabischen aber klar getrennt.' },
      { type: 'example', arabic: 'اِخْلَعْ مِعْطَفَكَ، اَلْجَوُّ دَافِئٌ هُنَا.', translation: 'Zieh deinen Mantel aus, hier ist es warm.', note: 'مِعْطَف (Mantel) kennst du bereits aus dem Bestand.' },
      { type: 'example', arabic: 'مِحْفَظَتِي فِي جَيْبِي.', translation: 'Meine Geldbörse ist in meiner Tasche.', note: 'فِي (in) kennst du bereits aus dem Bestand.' },
      { type: 'example', arabic: 'أَيُّ لَوْنٍ تُفَضِّل؟', translation: 'Welche Farbe bevorzugst du?', note: 'أَيّ (welcher) kennst du bereits aus dem Bestand.' },
      { type: 'word_preview', word_ids: ['c1_u12_16', 'c1_u12_17', 'c1_u12_18', 'c1_u12_19', 'c1_u12_20', 'c1_u12_21', 'c1_u12_22', 'c1_u12_23', 'c1_u12_24', 'c1_u12_25'] },
      { type: 'mini_check', questions: [
        mc('Das Gegenteil von لَبِسَ (anziehen) ist…', [opt('خَلَعَ (ausziehen)', true), opt('اِخْتَارَ (auswählen)', false)]),
        mc('جَيْب bezeichnet…', [opt('eine Tasche AN einem Kleidungsstück', true), opt('eine separate Handtasche', false)]),
        mc('قُمَاش bedeutet…', [opt('Stoff', true), opt('Farbe', false)])
      ] }
    ]
  },
  // ============================== UNIT 13 (Körper und Sinne) ==============================
  {
    theory_id: 'theory_vocab_unit_13_a',
    title: 'Körper und Sinne (1)',
    content_status: 'needs_language_review',
    learning_objectives: [
      'Die sechs Grundkörperteile aus dem Bestand um vier weitere Kopfteile ergänzen.',
      'Haar, Gesicht, Ohr und Zahn räumlich am Kopf verorten.',
      'Erkennen, dass alle Körperteile dieser Unit ohne Artikel als Grundform gelernt werden.'
    ],
    blocks: [
      { type: 'paragraph', text: 'Du kennst aus dem Bestand bereits رَأْس (Kopf), يَد (Hand), عَيْن (Auge), أَنْف (Nase), فَم (Mund) und قَدَم (Fuß) — diese Unit füllt die Körperteil-Liste systematisch weiter auf, beginnend mit vier weiteren Teilen des Kopfes: شَعْر (Haar, wächst auf dem Kopf), وَجْه (Gesicht, enthält Augen/Nase/Mund), أُذُن (Ohr, zum Hören) und سِنّ (Zahn, zum Beißen und Kauen).' },
      { type: 'paragraph', text: 'Achte darauf, dass وَجْه (Gesicht) der Oberbegriff für den vorderen Kopfbereich ist — عَيْن, أَنْف und فَم, die du bereits kennst, sind alle TEILE des وَجْه. Diese Unit legt damit die Grundlage für Unit 14 (Gesundheit), in der du beschreiben lernst, wenn ein Körperteil wehtut.' },
      { type: 'heading', level: 'full', text: 'Mehr erfahren: Körperteile und Genus' },
      { type: 'paragraph', level: 'full', text: 'Im Arabischen sind viele Körperteile, die paarweise am Körper vorkommen (Auge, Ohr, Hand, Fuß), grammatisch feminin, auch wenn sie keine ة-Endung tragen — das ist eine alte, unregelmäßige Genus-Klasse. أُذُن (Ohr) gehört zu dieser Gruppe. شَعْر, وَجْه und سِنّ (in der Bedeutung „ein Zahn“, weiblich) folgen dagegen unterschiedlichen Mustern — Genus bei Körperteilen muss man in vielen Fällen einfach mitlernen.' },
      { type: 'callout', variant: 'tip', title: 'Merke', text: 'وَجْه (Gesicht) ist der Oberbegriff — عَيْن, أَنْف und فَم liegen alle IM Gesicht.' },
      { type: 'callout', variant: 'info', title: 'Typischer Fehler', text: 'أُذُن (Ohr) ist trotz fehlender ة-Endung grammatisch feminin — ein häufiger Stolperstein für Anfänger.' },
      { type: 'example', arabic: 'شَعْرُهَا طَوِيل.', translation: 'Ihr Haar ist lang.', note: 'طَوِيل (lang) kennst du bereits aus dem Bestand.' },
      { type: 'example', arabic: 'وَجْهُهُ مُبْتَسِم.', translation: 'Sein Gesicht lächelt.', note: 'مُبْتَسِم (lächelnd) hier nur zur Veranschaulichung markiert.' },
      { type: 'example', arabic: 'أُذُنِي تُؤْلِمُنِي.', translation: 'Mein Ohr tut mir weh.', note: 'Vorschau auf أَلَم (Schmerz) aus Unit 14.' },
      { type: 'word_preview', word_ids: ['body_head', 'body_hand', 'body_eye', 'body_nose', 'body_mouth', 'body_foot', 'c1_u13_01', 'c1_u13_02', 'c1_u13_03', 'c1_u13_04'] },
      { type: 'mini_check', questions: [
        mc('Welches Wort ist der Oberbegriff für Augen, Nase und Mund zusammen?', [opt('وَجْه (Gesicht)', true), opt('رَأْس (Kopf)', false)]),
        mc('أُذُن ist grammatisch…', [opt('feminin (trotz fehlender ة-Endung)', true), opt('maskulin', false)]),
        mc('شَعْر bedeutet…', [opt('Haar', true), opt('Zahn', false)])
      ] }
    ]
  },
  {
    theory_id: 'theory_vocab_unit_13_b',
    title: 'Körper und Sinne (2)',
    content_status: 'needs_language_review',
    learning_objectives: [
      'Die Körperteile vom Hals bis zum Knie in Reihenfolge benennen.',
      'صَدْر, ظَهْر und بَطْن als die drei Bereiche des Rumpfes unterscheiden.',
      'ظَهْر als Homonym mit dem bereits bekannten Wort für „Mittag“ erkennen.'
    ],
    blocks: [
      { type: 'paragraph', text: 'Diese Session wandert am Körper entlang von oben nach unten: رَقَبَة (Hals/Nacken) verbindet Kopf und Rumpf, كَتِف (Schulter) ist der Ansatzpunkt für ذِرَاع (Arm), und إِصْبَع (Finger) sitzt am Ende von يَد (Hand) aus dem Bestand. Danach folgen die drei Bereiche des Rumpfes: صَدْر (Brust, vorne oben), ظَهْر (Rücken, die Rückseite) und بَطْن (Bauch, vorne unten) — diese drei gehören eng zusammen und werden oft gemeinsam abgefragt.' },
      { type: 'paragraph', text: 'Wichtiger Hinweis: ظَهْر (Rücken) sieht unvokalisiert genauso aus wie ein Wort, das du schon kennst — ظُهْر (Mittag, Tageszeit) aus Unit 6. Das sind zwei völlig unterschiedliche Wörter mit unterschiedlicher Vokalisierung, die nur ohne Vokalzeichen gleich geschrieben werden — ein bewusstes Homonym, kein Fehler im Kurs. Zum Abschluss lernst du سَاق (Bein/Unterschenkel) und رُكْبَة (Knie), das Gelenk zwischen Ober- und Unterschenkel.' },
      { type: 'heading', level: 'full', text: 'Mehr erfahren: Homonyme im Arabischen erkennen' },
      { type: 'paragraph', level: 'full', text: 'Arabisch wird im Alltag meist OHNE die kurzen Vokalzeichen geschrieben — Muttersprachler erschließen die richtige Bedeutung aus dem Satzzusammenhang. ظَهْر/ظُهْر ist ein typisches Beispiel: In einem Satz über Körperteile ist eindeutig „Rücken“ gemeint, in einem Satz über die Uhrzeit eindeutig „Mittag“. Dieser Kurs zeigt dir beide Wörter bewusst MIT vollständiger Vokalisierung, damit du den Unterschied von Anfang an klar hörst.' },
      { type: 'callout', variant: 'tip', title: 'Merke', text: 'صَدْر (Brust) – ظَهْر (Rücken) – بَطْن (Bauch): die drei Bereiche des Rumpfes, vorne oben – hinten – vorne unten.' },
      { type: 'callout', variant: 'info', title: 'Typischer Fehler', text: 'ظَهْر (Rücken) und ظُهْر (Mittag) sehen unvokalisiert identisch aus — beim Hören auf die Vokalisierung achten, beim Lesen auf den Kontext.' },
      { type: 'example', arabic: 'ظَهْرِي يُؤْلِمُنِي مِنَ الْجُلُوس.', translation: 'Mein Rücken tut mir vom Sitzen weh.', note: 'يُؤْلِمُنِي (tut mir weh) hier nur zur Veranschaulichung markiert.' },
      { type: 'example', arabic: 'رَفَعَ ذِرَاعَهُ فَوْقَ كَتِفِهِ.', translation: 'Er hob seinen Arm über seine Schulter.', note: 'رَفَعَ (heben) hier nur zur Veranschaulichung markiert.' },
      { type: 'example', arabic: 'رُكْبَتِي وَسَاقِي بِخَيْر.', translation: 'Mein Knie und mein Bein sind in Ordnung.', note: 'بِخَيْر (in Ordnung) kennst du bereits aus dem Bestand.' },
      { type: 'word_preview', word_ids: ['c1_u13_05', 'c1_u13_06', 'c1_u13_07', 'c1_u13_08', 'c1_u13_09', 'c1_u13_10', 'c1_u13_11', 'c1_u13_12', 'c1_u13_13', 'c1_u13_14'] },
      { type: 'mini_check', questions: [
        mc('ظَهْر (Rücken) sieht unvokalisiert genauso aus wie welches Wort aus dem Bestand?', [opt('ظُهْر (Mittag)', true), opt('صَدْر (Brust)', false)]),
        mc('Welcher Körperteil liegt zwischen Brust und Bauch NICHT dazwischen, sondern DARUNTER?', [opt('بَطْن (Bauch) liegt unter صَدْر (Brust)', true), opt('كَتِف (Schulter)', false)]),
        mc('إِصْبَع bedeutet…', [opt('Finger', true), opt('Knie', false)])
      ] }
    ]
  },
  {
    theory_id: 'theory_vocab_unit_13_c',
    title: 'Körper und Sinne (3)',
    content_status: 'needs_language_review',
    learning_objectives: [
      'Innere Körperteile (Herz, Blut, Gehirn, Knochen, Muskel) benennen.',
      'Die vier Sinnesverben sehen/hören/riechen/berühren dem passenden Körperteil zuordnen.',
      'Diese Unit als Grundlage für die Gesundheits-Unit (Unit 14) einordnen.'
    ],
    blocks: [
      { type: 'paragraph', text: 'Diese letzte Session der Unit wechselt von äußeren zu inneren Körperteilen: قَلْب (Herz) pumpt دَم (Blut) durch den Körper, بَشَرَة (Haut) bedeckt ihn von außen, دِمَاغ (Gehirn) steuert das Denken, عَظْم (Knochen) gibt dem Körper seine Form, und عَضَلَة (Muskel) bewegt die Knochen. Diese fünf Wörter bereiten dich direkt auf Unit 14 (Gesundheit) vor, wo du beschreibst, wenn einer dieser Körperteile schmerzt oder untersucht wird.' },
      { type: 'paragraph', text: 'Den Abschluss bilden vier Sinnesverben, die jeweils zu einem Körperteil aus dieser Unit gehören: رَأَى (sehen, mit عَيْن/Auge), سَمِعَ (hören, mit أُذُن/Ohr), شَمَّ (riechen, mit أَنْف/Nase) und لَمَسَ (berühren/tasten, mit يَد/Hand). Diese vier Verben ergänzen اَلْحَوَاسّ (die Sinne) und schließen den Themenkreis „Körper“ inhaltlich rund ab.' },
      { type: 'heading', level: 'full', text: 'Mehr erfahren: die fünf klassischen Sinne' },
      { type: 'paragraph', level: 'full', text: 'Diese Unit deckt vier der fünf klassischen Sinne ab (Sehen, Hören, Riechen, Tasten) — der fünfte Sinn, Schmecken (mit لِسَان/Zunge aus Session B), wird hier bewusst nicht als eigenes Verb eingeführt, da „schmecken“ im Arabischen grammatisch anders funktioniert (meist über „den Geschmack finden“ statt über ein einfaches Verb) und deshalb einer späteren Grammatik-Einheit vorbehalten bleibt.' },
      { type: 'callout', variant: 'tip', title: 'Merke', text: 'رَأَى (sehen) – سَمِعَ (hören) – شَمَّ (riechen) – لَمَسَ (berühren): vier Sinnesverben, jeweils einem Körperteil aus dieser Unit zugeordnet.' },
      { type: 'callout', variant: 'info', title: 'Typischer Fehler', text: 'سَمِعَ (hören) und شَمَّ (riechen) klingen im Anlaut ähnlich (beide beginnen mit „s“-artigen Lauten) — auf die Wortmitte achten, um sie sicher zu unterscheiden.' },
      { type: 'example', arabic: 'رَأَيْتُ طَائِراً جَمِيلاً.', translation: 'Ich habe einen schönen Vogel gesehen.', note: 'جَمِيل (schön) kennst du bereits aus dem Bestand.' },
      { type: 'example', arabic: 'اَلْقَلْبُ يَضُخُّ الدَّم.', translation: 'Das Herz pumpt das Blut.', note: 'يَضُخُّ (pumpt) hier nur zur Veranschaulichung markiert.' },
      { type: 'example', arabic: 'لَمَسْتُ الْقُمَاشَ بِيَدِي.', translation: 'Ich habe den Stoff mit meiner Hand berührt.', note: 'قُمَاش (Stoff) kennst du bereits aus Unit 12.' },
      { type: 'word_preview', word_ids: ['c1_u13_15', 'c1_u13_16', 'c1_u13_17', 'c1_u13_18', 'c1_u13_19', 'c1_u13_20', 'c1_u13_21', 'c1_u13_22', 'c1_u13_23', 'c1_u13_24'] },
      { type: 'mini_check', questions: [
        mc('Welches Verb gehört zum Körperteil أُذُن (Ohr)?', [opt('سَمِعَ (hören)', true), opt('شَمَّ (riechen)', false)]),
        mc('دَم bedeutet…', [opt('Blut', true), opt('Knochen', false)]),
        mc('Welcher Körperteil bewegt die Knochen?', [opt('عَضَلَة (Muskel)', true), opt('دِمَاغ (Gehirn)', false)])
      ] }
    ]
  },
  // ============================== UNIT 14 (Gesundheit, Beschwerden und Apotheke) ==============================
  {
    theory_id: 'theory_vocab_unit_14_a',
    title: 'Gesundheit, Beschwerden und Apotheke (1)',
    content_status: 'needs_language_review',
    learning_objectives: [
      'Gesundheit und Krankheit als Gegensatzpaar einordnen.',
      'Fünf häufige Beschwerden (Schmerz, Kopfschmerzen, Fieber, Husten, Erkältung) benennen.',
      'Grippe und Allergie von einer einfachen Erkältung abgrenzen.'
    ],
    blocks: [
      { type: 'paragraph', text: 'Diese Unit ist reiner Sprachunterricht: Sie hilft dir, beim Arzt oder in der Apotheke einfache Sätze zu verstehen und zu bilden — sie ersetzt KEINE medizinische Beratung, Diagnose oder Behandlung. Die Wörter beschreiben lediglich, WIE man auf Arabisch über Gesundheit spricht, nicht, was im Krankheitsfall tatsächlich zu tun ist.' },
      { type: 'paragraph', text: 'Die Session beginnt mit dem Gegensatzpaar صِحَّة (Gesundheit) und مَرَض (Krankheit) sowie مَرِيض (krank, als Adjektiv ODER als Substantiv „Patient“ — der Kontext entscheidet). Danach folgen fünf konkrete Beschwerden, von allgemein zu spezifisch: أَلَم (Schmerz, der Oberbegriff), صُدَاع (Kopfschmerzen, ein spezifischer Schmerz), حُمَّى (Fieber), سُعَال (Husten) und زُكَام (Erkältung/Schnupfen).' },
      { type: 'heading', level: 'full', text: 'Mehr erfahren: Erkältung, Grippe und Allergie unterscheiden' },
      { type: 'paragraph', level: 'full', text: 'Zum Abschluss lernst du إِنْفْلُونْزَا (Grippe) und حَسَاسِيَّة (Allergie) — beide können ähnliche Symptome wie eine einfache زُكَام (Erkältung) verursachen, sind aber sprachlich klar unterschiedliche Begriffe. إِنْفْلُونْزَا ist, wie viele moderne Krankheitsbezeichnungen, ein internationales Lehnwort und klingt dem deutschen „Influenza“ sehr ähnlich.' },
      { type: 'callout', variant: 'info', title: 'Wichtiger Hinweis', text: 'Diese Unit dient ausschließlich dem Wortschatzaufbau für Alltagssituationen (Arztbesuch, Apotheke). Sie ist kein medizinischer Ratgeber — bei echten gesundheitlichen Anliegen wende dich an eine Ärztin, einen Arzt oder eine Apotheke.' },
      { type: 'callout', variant: 'tip', title: 'Merke', text: 'صِحَّة (Gesundheit) und مَرَض (Krankheit) bilden den Rahmen der ganzen Unit — alle weiteren Wörter beschreiben Abstufungen oder Auswirkungen dieses Gegensatzpaars.' },
      { type: 'example', arabic: 'أَشْعُرُ بِصُدَاعٍ وَحُمَّى.', translation: 'Ich habe Kopfschmerzen und Fieber.', note: 'أَشْعُرُ بِـ (ich fühle) hier nur zur Veranschaulichung markiert.' },
      { type: 'example', arabic: 'هَلْ عِنْدَكَ حَسَاسِيَّةٌ مِنْ شَيْءٍ؟', translation: 'Hast du eine Allergie gegen etwas?', note: 'عِنْدَكَ (bei dir/hast du) kennst du bereits aus dem Bestand.' },
      { type: 'example', arabic: 'اَلزُّكَامُ لَيْسَ إِنْفْلُونْزَا.', translation: 'Eine Erkältung ist keine Grippe.', note: 'لَيْسَ (ist nicht) kennst du bereits aus dem Bestand.' },
      { type: 'word_preview', word_ids: ['c1_u14_01', 'c1_u14_02', 'c1_u14_03', 'c1_u14_04', 'c1_u14_05', 'c1_u14_06', 'c1_u14_07', 'c1_u14_08', 'c1_u14_09', 'c1_u14_10'] },
      { type: 'mini_check', questions: [
        mc('Das Gegenteil von صِحَّة (Gesundheit) ist…', [opt('مَرَض (Krankheit)', true), opt('أَلَم (Schmerz)', false)]),
        mc('صُدَاع bedeutet…', [opt('Kopfschmerzen', true), opt('Fieber', false)]),
        mc('Was ist der Zweck dieser Unit laut Hinweis?', [opt('Wortschatzaufbau für Alltagssituationen, keine medizinische Beratung', true), opt('konkrete Behandlungsanweisungen geben', false)])
      ] }
    ]
  },
  {
    theory_id: 'theory_vocab_unit_14_b',
    title: 'Gesundheit, Beschwerden und Apotheke (2)',
    content_status: 'needs_language_review',
    learning_objectives: [
      'Wunde und Verletzung von einer Krankheit abgrenzen.',
      'Medikament, Tablette und Apotheke als zusammengehörige Begriffe erkennen.',
      'Termin, Notfall und Krankenwagen für dringende/planbare Situationen unterscheiden.'
    ],
    blocks: [
      { type: 'paragraph', text: 'Anders als die Beschwerden aus Session A entstehen جُرْح (Wunde) und إِصَابَة (Verletzung) meist durch ein äußeres Ereignis (Sturz, Unfall) statt durch eine Krankheit — جُرْح beschreibt die offene Stelle selbst, إِصَابَة den allgemeineren Vorgang „sich verletzt haben“. Danach lernst du drei zusammengehörige Begriffe rund um Medikamente: دَوَاء (Medikament, der Oberbegriff), قُرْص (Tablette, eine feste Darreichungsform) und صَيْدَلِيَّة (Apotheke, der Ort, an dem du beides bekommst).' },
      { type: 'paragraph', text: 'Zum Abschluss unterscheidest du zwischen einer geplanten und einer dringenden Situation: مَوْعِد (Termin, du vereinbarst eine feste Uhrzeit) steht im Gegensatz zu طَوَارِئ (Notfall/Notaufnahme, es kann nicht warten) — bei einem echten Notfall ruft man in vielen arabischsprachigen Ländern eine سَيَّارَة إِسْعَاف (Krankenwagen, wörtlich „Hilfe-Auto“), die einen schnell in die Notaufnahme bringt.' },
      { type: 'heading', level: 'full', text: 'Mehr erfahren: warum سَيَّارَة إِسْعَاف zwei Wörter sind' },
      { type: 'paragraph', level: 'full', text: 'Wie schon سَاعَة يَد (Armbanduhr) aus Unit 12 ist سَيَّارَة إِسْعَاف eine Genitivverbindung (iḍāfa): سَيَّارَة (Auto) + إِسْعَاف (Erste Hilfe/Rettung) ergibt wörtlich „Auto der Ersten Hilfe“. Dieses Bauprinzip — zwei Substantive kombiniert zu einem neuen Begriff — begegnet dir im Arabischen sehr häufig, wenn eine moderne Institution oder ein modernes Gerät benannt werden soll.' },
      { type: 'callout', variant: 'tip', title: 'Merke', text: 'مَوْعِد (Termin) ist planbar, طَوَارِئ (Notfall) ist dringend — der Unterschied entscheidet, ob du anrufst und wartest oder sofort Hilfe brauchst.' },
      { type: 'callout', variant: 'info', title: 'Typischer Fehler', text: 'دَوَاء (Medikament, der Oberbegriff) und قُرْص (Tablette, eine konkrete Form davon) werden oft gleichgesetzt — nicht jedes Medikament ist eine Tablette (es gibt z. B. auch حُقْنَة/Spritze aus Session C).' },
      { type: 'example', arabic: 'عِنْدِي مَوْعِدٌ فِي الصَّيْدَلِيَّة.', translation: 'Ich habe einen Termin in der Apotheke.', note: 'عِنْدِي (ich habe) kennst du bereits aus dem Bestand.' },
      { type: 'example', arabic: 'اِتَّصِلْ بِسَيَّارَةِ الْإِسْعَاف!', translation: 'Ruf den Krankenwagen!', note: 'اِتَّصِلْ (ruf an) hier nur zur Veranschaulichung markiert.' },
      { type: 'example', arabic: 'هَذَا الدَّوَاءُ عَلَى شَكْلِ قُرْص.', translation: 'Dieses Medikament ist in Tablettenform.', note: 'عَلَى شَكْلِ (in Form von) hier nur zur Veranschaulichung markiert.' },
      { type: 'word_preview', word_ids: ['c1_u14_11', 'c1_u14_12', 'c1_u14_13', 'c1_u14_14', 'c1_u14_15', 'c1_u14_16', 'c1_u14_17', 'c1_u14_18', 'c1_u14_19', 'c1_u14_20'] },
      { type: 'mini_check', questions: [
        mc('Was ist der Unterschied zwischen مَوْعِد und طَوَارِئ؟', [opt('مَوْعِد ist planbar, طَوَارِئ ist dringend', true), opt('es gibt keinen Unterschied', false)]),
        mc('سَيَّارَة إِسْعَاف bedeutet wörtlich…', [opt('Auto der Ersten Hilfe', true), opt('Haus der Gesundheit', false)]),
        mc('صَيْدَلِيَّة bedeutet…', [opt('Apotheke', true), opt('Krankenwagen', false)])
      ] }
    ]
  },
  {
    theory_id: 'theory_vocab_unit_14_c',
    title: 'Gesundheit, Beschwerden und Apotheke (3)',
    content_status: 'needs_language_review',
    learning_objectives: [
      'Symptom, Behandlung, Untersuchung und Operation im ärztlichen Ablauf einordnen.',
      'وَصْفَة طِبِّيَّة als ärztliches Rezept vom Kochrezept unterscheiden.',
      'Ruhe, Schlaf und Atmen als Wörter der Erholung von den medizinischen Fachbegriffen abgrenzen.'
    ],
    blocks: [
      { type: 'paragraph', text: 'Diese letzte Session der Unit folgt dem typischen Ablauf eines Arztbesuchs: Du beschreibst zuerst dein عَرَض (Symptom), der Arzt macht eine فَحْص (Untersuchung), verordnet eine عِلَاج (Behandlung) — im schwereren Fall auch eine عَمَلِيَّة (Operation). Wichtig: وَصْفَة طِبِّيَّة (Rezept) meint hier ausschließlich die ÄRZTLICHE Verordnung für ein Medikament — nicht zu verwechseln mit einem Kochrezept, das im Arabischen ein völlig anderes Wort verwendet.' },
      { type: 'paragraph', text: 'Nach zwei praktischen Hilfsmitteln — ضِمَادَة (Verband, für Wunden) und حُقْنَة (Spritze/Injektion, eine weitere Medikamentenform neben der Tablette aus Session B) — schließt die Unit mit drei Wörtern, die weniger medizinisch, sondern eher zur Genesung gehören: رَاحَة (Ruhe/Erholung), نَوْم (Schlaf) und تَنَفَّسَ (atmen). Diese drei Wörter erinnern daran, dass Gesunden nicht nur aus Medikamenten besteht, sondern auch aus Erholung.' },
      { type: 'heading', level: 'full', text: 'Mehr erfahren: وَصْفَة als mehrdeutiges Wort' },
      { type: 'paragraph', level: 'full', text: 'وَصْفَة bedeutet wörtlich „Beschreibung/Vorschrift“ und wird im modernen Arabisch für zwei ganz unterschiedliche Dinge verwendet: eine وَصْفَة طِبِّيَّة (ärztliches Rezept) und eine وَصْفَة طَبْخ (Kochrezept) — nur der jeweils zweite Teil (طِبِّيَّة „ärztlich“ vs. طَبْخ „Kochen“) macht den Unterschied klar. Dieser Kurs führt bewusst nur die ärztliche Variante ein und benennt sie hier vollständig, um Verwechslungen von Anfang an auszuschließen.' },
      { type: 'callout', variant: 'tip', title: 'Merke', text: 'وَصْفَة طِبِّيَّة (ärztliches Rezept) und ein Kochrezept sind im Arabischen unterschiedliche Begriffe — nur das erste Wort وَصْفَة ist gemeinsam.' },
      { type: 'callout', variant: 'info', title: 'Typischer Fehler', text: 'عَرَض (Symptom, was du wahrnimmst) und فَحْص (Untersuchung, was der Arzt macht) werden oft verwechselt — das eine beschreibst du, das andere macht die Ärztin/der Arzt.' },
      { type: 'example', arabic: 'اَلطَّبِيبُ كَتَبَ لِي وَصْفَةً طِبِّيَّة.', translation: 'Der Arzt hat mir ein Rezept ausgestellt.', note: 'كَتَبَ (schreiben) kennst du bereits aus dem Bestand.' },
      { type: 'example', arabic: 'أَحْتَاجُ إِلَى رَاحَةٍ وَنَوْمٍ كَافٍ.', translation: 'Ich brauche Ruhe und genug Schlaf.', note: 'كَافٍ (genug) hier nur zur Veranschaulichung markiert.' },
      { type: 'example', arabic: 'تَنَفَّسْ بِعُمْقٍ.', translation: 'Atme tief.', note: 'بِعُمْقٍ (tief) hier nur zur Veranschaulichung markiert.' },
      { type: 'word_preview', word_ids: ['c1_u14_21', 'c1_u14_22', 'c1_u14_23', 'c1_u14_24', 'c1_u14_25', 'c1_u14_26', 'c1_u14_27', 'c1_u14_28', 'c1_u14_29', 'c1_u14_30'] },
      { type: 'mini_check', questions: [
        mc('وَصْفَة طِبِّيَّة bezieht sich in diesem Kurs ausschließlich auf…', [opt('ein ärztliches Rezept', true), opt('ein Kochrezept', false)]),
        mc('Was macht der Arzt, um dein عَرَض (Symptom) genauer zu verstehen?', [opt('eine فَحْص (Untersuchung)', true), opt('eine حُقْنَة (Spritze)', false)]),
        mc('تَنَفَّسَ bedeutet…', [opt('atmen', true), opt('sich ausruhen', false)])
      ] }
    ]
  },
  // ============================== UNIT 15 (Gefühle, Eigenschaften und Zustände) ==============================
  {
    theory_id: 'theory_vocab_unit_15_a',
    title: 'Gefühle, Eigenschaften und Zustände (1)',
    content_status: 'needs_language_review',
    learning_objectives: [
      'Sechs Grundgefühle (glücklich, traurig, wütend, ängstlich, müde, besorgt) benennen.',
      'سَعِيد und حَزِين als erstes Gegensatzpaar dieser Unit anwenden.',
      'هَادِئ/مُتَوَتِّر als zweites Gegensatzpaar von den vorherigen sechs Gefühlen abgrenzen.'
    ],
    blocks: [
      { type: 'paragraph', text: 'Diese Unit sammelt Adjektive, mit denen du beschreibst, wie sich jemand fühlt oder in welchem Zustand sich jemand befindet. Sie beginnt mit dem klarsten Gegensatzpaar: سَعِيد (glücklich) und حَزِين (traurig). Danach folgen vier weitere, in sich unterschiedliche Gefühle: غَاضِب (wütend, ein starkes negatives Gefühl), خَائِف (ängstlich), مُتْعَب (müde/erschöpft, eher ein körperlicher Zustand) und قَلِق (besorgt, eine leisere Form von Angst).' },
      { type: 'paragraph', text: 'Zum Abschluss lernst du das zweite Gegensatzpaar dieser Session: هَادِئ (ruhig) und مُتَوَتِّر (nervös/angespannt) — sowie مُتَفَاجِئ (überrascht) und مَلَل (Langeweile, das einzige Substantiv dieser Session zwischen lauter Adjektiven). Achte auf das Muster مُتَ-: viele arabische Gefühlsadjektive beginnen mit dieser Vorsilbe, was du in Session B noch deutlicher siehst.' },
      { type: 'heading', level: 'full', text: 'Mehr erfahren: das مُتَ-Muster bei Gefühlsadjektiven' },
      { type: 'paragraph', level: 'full', text: 'مُتَوَتِّر und مُتَفَاجِئ folgen einem sehr produktiven arabischen Wortbildungsmuster (Verbstamm V/VI, aktives Partizip): مُتَ- am Wortanfang zeigt oft an, dass sich jemand SELBST in einem bestimmten Zustand befindet oder etwas an sich SELBST erlebt (reflexiv). Dieses Muster begegnet dir in Session B noch bei vier weiteren Wörtern und lohnt sich, als wiedererkennbares Baumuster zu merken statt jedes Wort einzeln auswendig zu lernen.' },
      { type: 'callout', variant: 'tip', title: 'Merke', text: 'سَعِيد (glücklich) ↔ حَزِين (traurig) und هَادِئ (ruhig) ↔ مُتَوَتِّر (nervös) sind die zwei Gegensatzpaare dieser Session.' },
      { type: 'callout', variant: 'info', title: 'Typischer Fehler', text: 'قَلِق (besorgt) und خَائِف (ängstlich) werden oft gleichgesetzt — قَلِق ist eine leisere, anhaltende Sorge, خَائِف eine akute Angst vor etwas Konkretem.' },
      { type: 'example', arabic: 'أَنَا سَعِيدٌ جِدّاً الْيَوْم.', translation: 'Ich bin heute sehr glücklich.', note: 'جِدّاً (sehr) kennst du bereits aus dem Bestand.' },
      { type: 'example', arabic: 'لَا تَكُنْ قَلِقاً، كُلُّ شَيْءٍ بِخَيْر.', translation: 'Sei nicht besorgt, alles ist in Ordnung.', note: 'بِخَيْر (in Ordnung) kennst du bereits aus dem Bestand.' },
      { type: 'example', arabic: 'اَلْبَيْتُ هَادِئٌ فِي اللَّيْل.', translation: 'Das Haus ist nachts ruhig.', note: 'اَللَّيْل (Nacht) kennst du bereits aus dem Bestand.' },
      { type: 'word_preview', word_ids: ['c1_u15_01', 'c1_u15_02', 'c1_u15_03', 'c1_u15_04', 'c1_u15_05', 'c1_u15_06', 'c1_u15_07', 'c1_u15_08', 'c1_u15_09', 'c1_u15_10'] },
      { type: 'mini_check', questions: [
        mc('Das Gegenteil von سَعِيد ist…', [opt('حَزِين', true), opt('مُتْعَب', false)]),
        mc('Welche Vorsilbe zeigt oft einen selbst erlebten Zustand an?', [opt('مُتَ-', true), opt('أَ-', false)]),
        mc('مَلَل bedeutet…', [opt('Langeweile', true), opt('Überraschung', false)])
      ] }
    ]
  },
  {
    theory_id: 'theory_vocab_unit_15_b',
    title: 'Gefühle, Eigenschaften und Zustände (2)',
    content_status: 'needs_language_review',
    learning_objectives: [
      'مَشْغُول/مُتَفَرِّغ als drittes Gegensatzpaar der Unit anwenden.',
      'Bereitschafts- und Gewissheitszustände (bereit, sicher, verwirrt) unterscheiden.',
      'Vier weitere مُتَ-Adjektive (interessiert, begeistert, überrascht-verwandt) im Muster wiedererkennen.'
    ],
    blocks: [
      { type: 'paragraph', text: 'Diese Session beginnt mit dem dritten Gegensatzpaar der Unit: مَشْغُول (beschäftigt, keine Zeit) und مُتَفَرِّغ (frei/verfügbar, Zeit vorhanden) — nützlich, um auf Deutsch-Arabisch eine Verabredung zu planen. Danach folgen drei Zustände der geistigen Klarheit: جَاهِز (bereit, vorbereitet), مُتَأَكِّد (sicher/überzeugt, keine Zweifel) und als Gegenpol dazu مُرْتَبِك (verwirrt, versteht gerade nicht, was passiert).' },
      { type: 'paragraph', text: 'Zum Abschluss lernst du drei weitere مُتَ-Adjektive aus Session A: مُهْتَمّ (interessiert), مُتَحَمِّس (begeistert) und فَخُور (stolz, hier ausnahmsweise OHNE مُتَ-Muster). خَجُول (schüchtern) und وَحِيد (allein/einsam) runden die Session ab — beide beschreiben, wie jemand sich im Umgang mit anderen Menschen fühlt oder verhält.' },
      { type: 'heading', level: 'full', text: 'Mehr erfahren: nicht jedes Gefühlsadjektiv folgt dem مُتَ-Muster' },
      { type: 'paragraph', level: 'full', text: 'Auch wenn viele Wörter dieser Unit mit مُتَ- beginnen, folgen längst nicht alle arabischen Gefühlsadjektive diesem Muster — فَخُور (stolz), خَجُول (schüchtern) und وَحِيد (allein) zeigen, dass es viele weitere, ebenso häufige Bauformen gibt. Das مُتَ-Muster ist eine nützliche Eselsbrücke, aber keine feste Regel, nach der du unbekannte Wörter automatisch ableiten könntest.' },
      { type: 'callout', variant: 'tip', title: 'Merke', text: 'مَشْغُول (beschäftigt) ↔ مُتَفَرِّغ (frei) ist das dritte Gegensatzpaar der Unit — nützlich für Verabredungen.' },
      { type: 'callout', variant: 'info', title: 'Typischer Fehler', text: 'مُتَأَكِّد (sicher/überzeugt, eine geistige Gewissheit) wird gelegentlich mit جَاهِز (bereit, eine praktische Vorbereitung) verwechselt — beide beschreiben aber unterschiedliche Dinge.' },
      { type: 'example', arabic: 'آسِف، أَنَا مَشْغُولٌ الْآن، لَكِنِّي مُتَفَرِّغٌ غَداً.', translation: 'Entschuldigung, ich bin gerade beschäftigt, aber morgen frei.', note: 'غَداً (morgen) kennst du bereits aus Unit 6.' },
      { type: 'example', arabic: 'هَلْ أَنْتَ مُتَأَكِّدٌ مِنْ ذَلِكَ؟', translation: 'Bist du dir dessen sicher?', note: 'ذَلِكَ (das/dieses) kennst du bereits aus dem Bestand.' },
      { type: 'example', arabic: 'أَنَا مُهْتَمٌّ بِتَعَلُّمِ الْعَرَبِيَّة.', translation: 'Ich bin daran interessiert, Arabisch zu lernen.', note: 'اَلْعَرَبِيَّة (Arabisch) kennst du bereits aus dem Bestand.' },
      { type: 'word_preview', word_ids: ['c1_u15_11', 'c1_u15_12', 'c1_u15_13', 'c1_u15_14', 'c1_u15_15', 'c1_u15_16', 'c1_u15_17', 'c1_u15_18', 'c1_u15_19', 'c1_u15_20'] },
      { type: 'mini_check', questions: [
        mc('Das Gegenteil von مَشْغُول ist…', [opt('مُتَفَرِّغ', true), opt('مُرْتَبِك', false)]),
        mc('Welches Adjektiv folgt NICHT dem مُتَ-Muster?', [opt('فَخُور (stolz)', true), opt('مُتَحَمِّس (begeistert)', false)]),
        mc('مُرْتَبِك bedeutet…', [opt('verwirrt', true), opt('bereit', false)])
      ] }
    ]
  },
  {
    theory_id: 'theory_vocab_unit_15_c',
    title: 'Gefühle, Eigenschaften und Zustände (3)',
    content_status: 'needs_language_review',
    learning_objectives: [
      'Die letzten vier Gegensatzpaare der Unit (stark/schwach, wach/schlafend, lebendig/tot, einfach/schwierig) anwenden.',
      'Diese körperlich-abstrakten Zustandsadjektive von den vorherigen Gefühlsadjektiven abgrenzen.',
      'مُهِمّ und مُمْكِن als abschließende, allgemein einsetzbare Bewertungsadjektive verwenden.'
    ],
    blocks: [
      { type: 'paragraph', text: 'Diese letzte Session der Unit — und der gesamten Units 11-15 — versammelt gleich vier weitere Gegensatzpaare, diesmal eher körperliche und abstrakte Zustände statt reiner Gefühle: قَوِيّ (stark) ↔ ضَعِيف (schwach), مُسْتَيْقِظ (wach) ↔ نَائِم (schlafend), حَيّ (lebendig) ↔ مَيِّت (tot) und سَهْل (einfach/leicht) ↔ صَعْب (schwierig). Diese acht Wörter beschreiben nicht mehr, wie jemand sich FÜHLT, sondern in welchem ZUSTAND etwas oder jemand ist.' },
      { type: 'paragraph', text: 'Zum Abschluss der ganzen Units-11-15-Reihe lernst du مُهِمّ (wichtig) und مُمْكِن (möglich) — zwei sehr häufig gebrauchte, allgemeine Bewertungsadjektive, die sich auf fast jedes Thema anwenden lassen und dir im weiteren Kursverlauf immer wieder begegnen werden.' },
      { type: 'heading', level: 'full', text: 'Mehr erfahren: vier Gegensatzpaare auf einen Blick' },
      { type: 'paragraph', level: 'full', text: 'Diese Session bündelt bewusst gleich vier Gegensatzpaare hintereinander, damit du sie im direkten Vergleich lernst — eine bewährte Lernstrategie, da das Gehirn Gegensätze oft leichter gemeinsam abspeichert als isoliert. Nutze die Antonym-Anzeige in den Übungen, um dir bei jedem der acht Wörter automatisch das Gegenstück mit anzuschauen.' },
      { type: 'callout', variant: 'tip', title: 'Merke', text: 'Vier Gegensatzpaare in dieser Session: قَوِيّ/ضَعِيف, مُسْتَيْقِظ/نَائِم, حَيّ/مَيِّت, سَهْل/صَعْب — am besten immer als Paar lernen.' },
      { type: 'callout', variant: 'info', title: 'Typischer Fehler', text: 'سَهْل (einfach/leicht bei einer Aufgabe) wird manchmal mit خَفِيف (leicht im Gewicht, nicht Teil dieser Unit) verwechselt — سَهْل bezieht sich hier nur auf den Schwierigkeitsgrad.' },
      { type: 'example', arabic: 'هَذَا التَّمْرِينُ سَهْلٌ، وَذَاكَ صَعْب.', translation: 'Diese Übung ist einfach, und jene ist schwierig.', note: 'تَمْرِين (Übung) hier nur zur Veranschaulichung markiert.' },
      { type: 'example', arabic: 'مِنَ الْمُهِمِّ أَنْ تَنَامَ جَيِّداً.', translation: 'Es ist wichtig, dass du gut schläfst.', note: 'أَنْ تَنَامَ (dass du schläfst) hier nur zur Veranschaulichung markiert.' },
      { type: 'example', arabic: 'هَلْ مِنَ الْمُمْكِنِ أَنْ نَلْتَقِيَ غَداً؟', translation: 'Ist es möglich, dass wir uns morgen treffen?', note: 'نَلْتَقِيَ (wir treffen uns) hier nur zur Veranschaulichung markiert.' },
      { type: 'word_preview', word_ids: ['c1_u15_21', 'c1_u15_22', 'c1_u15_23', 'c1_u15_24', 'c1_u15_25', 'c1_u15_26', 'c1_u15_27', 'c1_u15_28', 'c1_u15_29', 'c1_u15_30'] },
      { type: 'mini_check', questions: [
        mc('Das Gegenteil von حَيّ (lebendig) ist…', [opt('مَيِّت (tot)', true), opt('نَائِم (schlafend)', false)]),
        mc('Wie viele Gegensatzpaare enthält diese Session?', [opt('vier', true), opt('zwei', false)]),
        mc('مُمْكِن bedeutet…', [opt('möglich', true), opt('wichtig', false)])
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

fs.writeFileSync(THEORY_PATH, `${JSON.stringify(theoryData, null, 2)}\n`, 'utf-8');
console.log(`Theoriedokumente ersetzt/angelegt: ${replaced}`);
console.log(`Theoriedokumente insgesamt: ${theoryData.theories.length}`);
