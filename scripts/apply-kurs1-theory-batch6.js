#!/usr/bin/env node
// Entwicklungsauftrag 11, Abschnitt 6 — ersetzt die letzten 15 Platzhalter-Theoriedokumente der
// Units 26-30 durch vollständige, auf die jeweiligen 10 Wörter jeder Session zugeschnittene
// Theorie. Schließt Kurs 1 strukturell ab (90/90 echte Theoriedokumente). Idempotent.
//
// Unit 30 (Fragewörter/Konnektoren/Funktionswörter) verlangt laut Auftrag Abschnitt 4 besonders
// sorgfältige Theorie mit kurzen Beispielsätzen statt reiner Vokabelgleichungen — für jedes Wort
// wird deshalb erklärt, welche grammatische Funktion es hat, wo es im Satz steht, ob es sich
// verändert, in welchem Kontext die Übersetzung gilt, und wie es sich von ähnlichen
// Funktionswörtern abgrenzt.

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
  // ============================== UNIT 26 (Technik, Internet und Medien) ==============================
  {
    theory_id: 'theory_vocab_unit_26_a',
    title: 'Technik, Internet und Medien (1)',
    content_status: 'needs_language_review',
    learning_objectives: [
      'Die fünf Grundbegriffe aus dem Bestand um Tastatur, Maus und Drucker ergänzen.',
      'مَلَفّ (Datei) von مُجَلَّد (Ordner) unterscheiden.',
      'Moderne MSA-Lehnwörter (z. B. حَاسُوب) von rein arabischen Fachbegriffen abgrenzen.'
    ],
    blocks: [
      { type: 'paragraph', text: 'Du kennst aus dem Bestand bereits حَاسُوب (Computer), هَاتِف (Telefon), إِنْتَرْنِت (Internet), شَاشَة (Bildschirm) und بَرْنَامَج (Programm). Diese Session ergänzt die physischen Grundgeräte: لَوْحَة مَفَاتِيح (Tastatur, wörtlich "Tafel der Schlüssel/Tasten"), فَأْرَة (Computermaus — dasselbe Wort wie für das Tier "Maus", nur in der weiblichen Form; auch im Arabischen wurde das Gerät nach dem Tier benannt, genau wie im Deutschen) und طَابِعَة (Drucker).' },
      { type: 'paragraph', text: 'Danach lernst du zwei Begriffe, die du am Computer ständig brauchst: مَلَفّ (Datei, ein einzelnes gespeichertes Dokument) und مُجَلَّد (Ordner, ein Behälter für mehrere Dateien) — ein مُجَلَّد kann viele مَلَفّ enthalten, aber nicht umgekehrt.' },
      { type: 'heading', level: 'full', text: 'Mehr erfahren: MSA-Lehnwörter vs. arabische Fachbegriffe' },
      { type: 'paragraph', level: 'full', text: 'Bei Technikbegriffen gibt es im modernen Hocharabisch oft zwei parallele Wege: entweder ein neues arabisches Wort aus einer bekannten Wurzel bilden (z. B. حَاسُوب von der Wurzel "rechnen", طَابِعَة von der Wurzel "drucken/prägen") oder ein internationales Lehnwort direkt übernehmen (z. B. إِنْتَرْنِت, später in dieser Unit auch فِيدْيُو/كَامِيرَا). Dieser Kurs verwendet konsequent die im heutigen MSA-Alltag gebräuchlichere Form — bei manchen Wörtern ist das die arabische Neubildung, bei anderen das Lehnwort.' },
      { type: 'callout', variant: 'tip', title: 'Merke', text: 'مَلَفّ (Datei) ist EINE Sache, مُجَلَّد (Ordner) enthält MEHRERE Dateien — nie umgekehrt.' },
      { type: 'callout', variant: 'info', title: 'Typischer Fehler', text: 'فَأْرَة (Computermaus) wird manchmal mit dem Tier فَأْر (Maus, aus dem Bestand) verwechselt — nur die weibliche Form فَأْرَة bezeichnet das Computergerät.' },
      { type: 'example', arabic: 'حَفِظْتُ الْمَلَفَّ فِي هَذَا الْمُجَلَّد.', translation: 'Ich habe die Datei in diesem Ordner gespeichert.', note: 'فِي (in) kennst du bereits aus Unit 21.' },
      { type: 'example', arabic: 'اِسْتَخْدِمِ الْفَأْرَةَ لِفَتْحِ الْبَرْنَامَج.', translation: 'Benutze die Maus, um das Programm zu öffnen.', note: 'اِسْتَخْدَمَ (benutzen) kennst du bereits aus Unit 17.' },
      { type: 'example', arabic: 'اَلطَّابِعَةُ لَا تَعْمَلُ الْآن.', translation: 'Der Drucker funktioniert gerade nicht.', note: 'اَلْآن (jetzt) kennst du aus Unit 30.' },
      { type: 'word_preview', word_ids: ['tech_computer', 'tech_phone', 'tech_internet', 'tech_screen', 'tech_program', 'c1_u26_01', 'c1_u26_02', 'c1_u26_03', 'c1_u26_04', 'c1_u26_05'] },
      { type: 'mini_check', questions: [
        mc('Was kann mehrere Dateien enthalten?', [opt('مُجَلَّد (Ordner)', true), opt('مَلَفّ (Datei)', false)]),
        mc('فَأْرَة bedeutet am Computer…', [opt('Computermaus', true), opt('Tastatur', false)]),
        mc('طَابِعَة bedeutet…', [opt('Drucker', true), opt('Bildschirm', false)])
      ] }
    ]
  },
  {
    theory_id: 'theory_vocab_unit_26_b',
    title: 'Technik, Internet und Medien (2)',
    content_status: 'needs_language_review',
    learning_objectives: [
      'كَلِمَة مُرُور und اِسْم مُسْتَخْدِم als zusammengehöriges Login-Paar unterscheiden.',
      'تَنْزِيل/رَفْع als Gegensatzpaar für Download/Upload anwenden.',
      'Nachricht, Foto und Link als Grundbegriffe der Online-Kommunikation benennen.'
    ],
    blocks: [
      { type: 'paragraph', text: 'مُسْتَنَد (Dokument) rundet die Datei-Begriffe aus Session A ab. Für die Anmeldung bei einer Webseite brauchst du zwei zusammengehörige Angaben: اِسْم مُسْتَخْدِم (Benutzername, WER du bist) und كَلِمَة مُرُور (Passwort, wörtlich "Wort des Durchgangs" — WIE du dich ausweist). Beide gehören zusammen, sind aber nicht dasselbe: der Benutzername ist meist öffentlich sichtbar, das Passwort bleibt geheim.' },
      { type: 'paragraph', text: 'مَوْقِع إِلِكْتْرُونِيّ (Webseite) besuchst du mit einem مُتَصَفِّح (Browser, wörtlich "der Durchblätternde"). Das zentrale Gegensatzpaar dieser Session: تَنْزِيل (Download/Herunterladen, eine Datei AUS dem Internet AUF dein Gerät) ↔ رَفْع (Upload/Hochladen, eine Datei von deinem Gerät INS Internet) — die Richtung ist jeweils genau entgegengesetzt. Zum Abschluss lernst du رَابِط (Link), رِسَالَة (Nachricht) und صُورَة (Foto/Bild).' },
      { type: 'heading', level: 'full', text: 'Mehr erfahren: تَنْزِيل/رَفْع als Richtungsverben-Paar' },
      { type: 'paragraph', level: 'full', text: 'تَنْزِيل und رَفْع sind Substantive, die von den Verben für "hinuntergehen" (نَزَلَ, aus Unit 17) und "hochheben" (رَفَعَ) abgeleitet sind — dieselbe Grundidee "hinunter/hinauf" wie bei physischer Bewegung wird hier auf Daten übertragen: eine Datei "steigt herunter" auf dein Gerät oder "steigt hinauf" ins Internet. Diese bildliche Übertragung von Bewegungsverben auf digitale Vorgänge ist im Arabischen wie im Deutschen ("herunterladen"/"hochladen") sehr ähnlich.' },
      { type: 'callout', variant: 'tip', title: 'Merke', text: 'تَنْزِيل (Download, ins Gerät) ↔ رَفْع (Upload, ins Internet) — die Richtung ist jeweils entgegengesetzt.' },
      { type: 'callout', variant: 'info', title: 'Typischer Fehler', text: 'اِسْم مُسْتَخْدِم (Benutzername, öffentlich) und كَلِمَة مُرُور (Passwort, geheim) werden manchmal verwechselt — nur der Benutzername darf mit anderen geteilt werden.' },
      { type: 'example', arabic: 'أَدْخِلِ اسْمَ الْمُسْتَخْدِمِ وَكَلِمَةَ الْمُرُور.', translation: 'Gib den Benutzernamen und das Passwort ein.', note: 'دَخَلَ (eintreten) kennst du bereits aus Unit 17, hier in der Bedeutung "eingeben".' },
      { type: 'example', arabic: 'نَزَّلْتُ الْمَلَفَّ ثُمَّ رَفَعْتُهُ إِلَى الْمَوْقِع.', translation: 'Ich habe die Datei heruntergeladen und dann auf die Webseite hochgeladen.', note: 'ثُمَّ (dann) kennst du bereits aus Unit 30.' },
      { type: 'example', arabic: 'أَرْسَلَتْ لِي رَابِطاً لِصُورَةٍ جَمِيلَة.', translation: 'Sie hat mir einen Link zu einem schönen Foto geschickt.', note: 'أَرْسَلَ (senden) kennst du bereits aus Unit 17.' },
      { type: 'word_preview', word_ids: ['c1_u26_06', 'c1_u26_07', 'c1_u26_08', 'c1_u26_09', 'c1_u26_10', 'c1_u26_11', 'c1_u26_12', 'c1_u26_13', 'c1_u26_14', 'c1_u26_15'] },
      { type: 'mini_check', questions: [
        mc('Das Gegenteil von تَنْزِيل ist…', [opt('رَفْع', true), opt('مُتَصَفِّح', false)]),
        mc('Welche Angabe ist normalerweise GEHEIM?', [opt('كَلِمَة مُرُور (Passwort)', true), opt('اِسْم مُسْتَخْدِم (Benutzername)', false)]),
        mc('مُتَصَفِّح bedeutet…', [opt('Browser', true), opt('Webseite', false)])
      ] }
    ]
  },
  {
    theory_id: 'theory_vocab_unit_26_c',
    title: 'Technik, Internet und Medien (3)',
    content_status: 'needs_language_review',
    learning_objectives: [
      'Audio-/Video-Geräte (Kamera, Mikrofon, Lautsprecher, Kopfhörer) sicher benennen.',
      'Stromversorgung (Batterie, Ladegerät, Kabel) als zusammengehörige Gruppe einordnen.',
      'شَبَكَة und بَيَانَات als abschließende technische Grundbegriffe verstehen.'
    ],
    blocks: [
      { type: 'paragraph', text: 'Diese letzte Session sammelt Geräte für Bild und Ton: فِيدْيُو (Video), كَامِيرَا (Kamera, ein Lehnwort), مَيْكْرُوفُون (Mikrofon, nimmt deine Stimme auf), مُكَبِّر صَوْت (Lautsprecher, wörtlich "Verstärker der Stimme/des Tons") und سَمَّاعَات (Kopfhörer — dieses Wort steht praktisch immer im Plural, da du zwei Ohrhörer gleichzeitig trägst).' },
      { type: 'paragraph', text: 'Danach folgt die Stromversorgung eines Geräts: بَطَّارِيَّة (Batterie/Akku, speichert die Energie), شَاحِن (Ladegerät, füllt die Batterie wieder auf) und كَابِل (Kabel, verbindet beides miteinander). Zum Abschluss lernst du شَبَكَة (Netzwerk, verbindet Geräte miteinander) und بَيَانَات (Daten, das, was durch das Netzwerk übertragen wird) — die zwei letzten, sehr allgemeinen Grundbegriffe dieser Unit.' },
      { type: 'heading', level: 'full', text: 'Mehr erfahren: بَيَانَات als Pluralform' },
      { type: 'paragraph', level: 'full', text: 'بَيَانَات ist die Pluralform von بَيَان ("Erklärung/Aussage") und wird im modernen Hocharabisch als feststehender Fachbegriff für "Daten" verwendet — ähnlich wie رِيَاضِيَّات (Mathematik, Unit 23) oder أَمْتِعَة (Gepäck, Unit 22) steht dieser Begriff praktisch immer im Plural, auch wenn im Deutschen "die Daten" ebenfalls Plural ist.' },
      { type: 'callout', variant: 'tip', title: 'Merke', text: 'بَطَّارِيَّة (speichert Energie) → شَاحِن (füllt sie wieder auf) → كَابِل (verbindet beide) — die drei Teile der Stromversorgung eines Geräts.' },
      { type: 'callout', variant: 'info', title: 'Typischer Fehler', text: 'مَيْكْرُوفُون (Mikrofon, nimmt Ton AUF) und مُكَبِّر صَوْت (Lautsprecher, gibt Ton WIEDER) werden manchmal verwechselt — sie haben genau entgegengesetzte Funktionen.' },
      { type: 'example', arabic: 'اَلسَّمَّاعَاتُ مَوْصُولَةٌ بِالْهَاتِفِ عَبْرَ كَابِل.', translation: 'Die Kopfhörer sind über ein Kabel mit dem Telefon verbunden.', note: 'اَلْهَاتِف (Telefon) kennst du bereits aus dem Bestand.' },
      { type: 'example', arabic: 'بَطَّارِيَةُ هَاتِفِي فَارِغَة، أَحْتَاجُ إِلَى الشَّاحِن.', translation: 'Der Akku meines Telefons ist leer, ich brauche das Ladegerät.', note: 'فَارِغ (leer) kennst du bereits aus Unit 19.' },
      { type: 'example', arabic: 'هَذِهِ الشَّبَكَةُ تَنْقُلُ بَيَانَاتٍ كَثِيرَة.', translation: 'Dieses Netzwerk überträgt viele Daten.', note: 'هَذِهِ (diese) kennst du bereits aus Unit 30.' },
      { type: 'word_preview', word_ids: ['c1_u26_16', 'c1_u26_17', 'c1_u26_18', 'c1_u26_19', 'c1_u26_20', 'c1_u26_21', 'c1_u26_22', 'c1_u26_23', 'c1_u26_24', 'c1_u26_25'] },
      { type: 'mini_check', questions: [
        mc('Welches Gerät nimmt deine Stimme auf?', [opt('مَيْكْرُوفُون', true), opt('مُكَبِّر صَوْت', false)]),
        mc('سَمَّاعَات steht typischerweise…', [opt('im Plural', true), opt('nur im Singular', false)]),
        mc('بَيَانَات bedeutet…', [opt('Daten', true), opt('Netzwerk', false)])
      ] }
    ]
  },
  // ============================== UNIT 27 (Natur, Wetter und Umwelt) ==============================
  {
    theory_id: 'theory_vocab_unit_27_a',
    title: 'Natur, Wetter und Umwelt (1)',
    content_status: 'needs_language_review',
    learning_objectives: [
      'Die sieben Wetterwörter aus dem Bestand um Himmel, Erde und Meer ergänzen.',
      'سَمَاء (Himmel, wo das Wetter stattfindet) von أَرْض (Erde/Boden, worauf du stehst) unterscheiden.',
      'بَحْر als erstes von drei Gewässerwörtern dieser Unit einordnen.'
    ],
    blocks: [
      { type: 'paragraph', text: 'Du kennst aus dem Bestand bereits sieben Wetterwörter: شَمْس (Sonne), مَطَر (Regen), ثَلْج (Schnee), رِيح (Wind), غَيْم (Wolke), حَار (heiß) und بَارِد (kalt). Diese Unit erweitert den Blick von reinem Wetter auf die Natur insgesamt. سَمَاء (Himmel) ist der Ort, an dem Sonne, Wolken und Regen stattfinden — darunter liegt أَرْض (Erde/Boden), auf dem du stehst.' },
      { type: 'paragraph', text: 'Zum Abschluss dieser Session lernst du بَحْر (Meer), das erste von drei verwandten Gewässerwörtern dieser Unit — die beiden anderen (نَهْر Fluss, بُحَيْرَة See) folgen in Session B. Achte auf die Größenunterschiede: ein بَحْر ist salzig und riesig, während نَهْر und بُحَيْرَة meist Süßwasser sind.' },
      { type: 'heading', level: 'full', text: 'Mehr erfahren: warum diese Unit "Wetter UND Umwelt" heißt' },
      { type: 'paragraph', level: 'full', text: 'Diese Unit trennt bewusst drei verwandte, aber unterschiedliche Konzepte: Wetter (das, was HEUTE passiert — Session A/B), Natur (die Landschaft selbst — Session A/B) und Umwelt/Klima (übergeordnete, langfristige Begriffe — Session C). Diese Unterscheidung wird in Session C noch genauer erklärt, wenn دَرَجَة الْحَرَارَة (Temperatur), مُنَاخ (Klima) und بِيئَة (Umwelt) bewusst voneinander abgegrenzt werden.' },
      { type: 'callout', variant: 'tip', title: 'Merke', text: 'سَمَاء (Himmel, oben) und أَرْض (Erde/Boden, unten) sind die zwei Grundebenen der Natur, auf die sich viele weitere Wörter dieser Unit beziehen.' },
      { type: 'callout', variant: 'info', title: 'Typischer Fehler', text: 'غَيْم (Wolke, aus dem Bestand) und سَمَاء (Himmel, neu) werden manchmal gleichgesetzt — سَمَاء ist der gesamte Raum über dir, غَيْم nur ein einzelnes Objekt darin.' },
      { type: 'example', arabic: 'اَلسَّمَاءُ زَرْقَاءُ الْيَوْم بِلَا غُيُوم.', translation: 'Der Himmel ist heute blau, ohne Wolken.', note: 'بِلَا/بِدُونِ (ohne) kennst du bereits aus Unit 21.' },
      { type: 'example', arabic: 'اَلْبَحْرُ كَبِيرٌ وَمَاؤُهُ مَالِح.', translation: 'Das Meer ist groß und sein Wasser ist salzig.', note: 'كَبِير (groß) kennst du bereits aus Unit 19.' },
      { type: 'example', arabic: 'سَقَطَتِ الثَّمَرَةُ عَلَى الْأَرْض.', translation: 'Die Frucht fiel auf den Boden.', note: 'عَلَى (auf) kennst du bereits aus Unit 21.' },
      { type: 'word_preview', word_ids: ['weather_sun', 'weather_rain', 'weather_snow', 'weather_wind', 'weather_cloud', 'weather_hot', 'weather_cold', 'c1_u27_01', 'c1_u27_02', 'c1_u27_03'] },
      { type: 'mini_check', questions: [
        mc('Wo befindet sich شَمْس (Sonne) und غَيْم (Wolke)?', [opt('في السَّمَاء (im Himmel)', true), opt('في الْأَرْض (im Boden)', false)]),
        mc('بَحْر ist typischerweise…', [opt('salzig und sehr groß', true), opt('Süßwasser und klein', false)]),
        mc('أَرْض bedeutet…', [opt('Erde/Boden', true), opt('Himmel', false)])
      ] }
    ]
  },
  {
    theory_id: 'theory_vocab_unit_27_b',
    title: 'Natur, Wetter und Umwelt (2)',
    content_status: 'needs_language_review',
    learning_objectives: [
      'نَهْر/بُحَيْرَة als weitere Gewässerwörter neben بَحْر einordnen.',
      'جَبَل/غَابَة/صَحْرَاء als drei unterschiedliche Landschaftstypen unterscheiden.',
      'شَجَرَة/زَهْرَة/عُشْب als drei Pflanzenkategorien benennen.'
    ],
    blocks: [
      { type: 'paragraph', text: 'نَهْر (Fluss) und بُحَيْرَة (See) vervollständigen die drei Gewässerwörter dieser Unit — beide sind meist Süßwasser, anders als das salzige بَحْر aus Session A: ein نَهْر fließt von einem Ort zum anderen, eine بُحَيْرَة ist stehendes Wasser. Danach folgen drei unterschiedliche Landschaftstypen: جَبَل (Berg, hoch und felsig), غَابَة (Wald, voller Bäume) und — am Ende der Session — صَحْرَاء (Wüste, trocken und sandig).' },
      { type: 'paragraph', text: 'Dazwischen lernst du drei Pflanzenwörter in aufsteigender Größe: عُشْب (Gras, bedeckt den Boden), زَهْرَة (Blume, einzelne Pflanze) und شَجَرَة (Baum, das größte Gewächs mit Stamm). رَمْل (Sand) und شَاطِئ (Strand) runden die Session ab — der Sand liegt am Strand, wo Land und بَحْر (Meer, Session A) aufeinandertreffen.' },
      { type: 'heading', level: 'full', text: 'Mehr erfahren: drei Landschaften im Vergleich' },
      { type: 'paragraph', level: 'full', text: 'جَبَل, غَابَة und صَحْرَاء zeigen drei sehr unterschiedliche Landschaften der arabischsprachigen Welt: Berge (z. B. im Atlas-Gebirge oder Libanon-Gebirge), Wälder (seltener, aber vorhanden, z. B. in Marokko oder im Libanon) und Wüsten (sehr verbreitet, z. B. die Sahara oder die arabische Wüste) — alle drei Landschaftstypen kommen in verschiedenen arabischsprachigen Ländern vor.' },
      { type: 'callout', variant: 'tip', title: 'Merke', text: 'نَهْر (fließendes Wasser) und بُحَيْرَة (stehendes Wasser) sind beide Süßwasser — anders als das salzige بَحْر aus Session A.' },
      { type: 'callout', variant: 'info', title: 'Typischer Fehler', text: 'عُشْب (Gras) und شَجَرَة (Baum) werden manchmal als "gleich groß" missverstanden — عُشْب bedeckt nur den Boden, شَجَرَة hat einen hohen Stamm.' },
      { type: 'example', arabic: 'يَجْرِي النَّهْرُ مِنَ الْجَبَلِ إِلَى الْبَحْر.', translation: 'Der Fluss fließt vom Berg zum Meer.', note: 'مِنْ/إِلَى (von/zu) kennst du bereits aus Unit 21.' },
      { type: 'example', arabic: 'فِي الْغَابَةِ أَشْجَارٌ كَثِيرَةٌ وَعُشْبٌ أَخْضَر.', translation: 'Im Wald gibt es viele Bäume und grünes Gras.', note: 'أَخْضَر (grün) kennst du bereits aus dem Bestand.' },
      { type: 'example', arabic: 'اَلصَّحْرَاءُ مَلِيئَةٌ بِالرَّمْل.', translation: 'Die Wüste ist voller Sand.', note: 'مَلِيئَة (voll) hier nur zur Veranschaulichung markiert.' },
      { type: 'word_preview', word_ids: ['c1_u27_04', 'c1_u27_05', 'c1_u27_06', 'c1_u27_07', 'c1_u27_08', 'c1_u27_09', 'c1_u27_10', 'c1_u27_11', 'c1_u27_12', 'c1_u27_13'] },
      { type: 'mini_check', questions: [
        mc('Welches Gewässer fließt (bewegt sich)?', [opt('نَهْر (Fluss)', true), opt('بُحَيْرَة (See)', false)]),
        mc('Welche Landschaft ist trocken und sandig?', [opt('صَحْرَاء (Wüste)', true), opt('غَابَة (Wald)', false)]),
        mc('عُشْب bedeutet…', [opt('Gras', true), opt('Baum', false)])
      ] }
    ]
  },
  {
    theory_id: 'theory_vocab_unit_27_c',
    title: 'Natur, Wetter und Umwelt (3)',
    content_status: 'needs_language_review',
    learning_objectives: [
      'دَرَجَة الْحَرَارَة, مُنَاخ und بِيئَة klar voneinander abgrenzen.',
      'Sturm-Phänomene (عَاصِفَة/رَعْد/بَرْق/ضَبَاب) unterscheiden.',
      'تَلَوُّث und إِعَادَة تَدْوِير als Umweltbegriffe neutral einordnen.'
    ],
    blocks: [
      { type: 'paragraph', text: 'هَوَاء (Luft) atmest du ständig, ohne sie zu sehen. Diese Session klärt drei oft verwechselte Begriffe endgültig: دَرَجَة الْحَرَارَة (Temperatur, wörtlich "Grad der Wärme" — der HEUTIGE Messwert, z. B. 25 Grad), مُنَاخ (Klima — das TYPISCHE Wetter einer Region über viele Jahre, z. B. "trockenes Klima") und بِيئَة (Umwelt — die gesamte Natur um uns herum, die wir schützen sollten). Diese drei Wörter sind NICHT austauschbar, auch wenn sie im Alltag manchmal locker vermischt werden.' },
      { type: 'paragraph', text: 'Vier Sturm-Phänomene folgen: عَاصِفَة (Sturm, starker Wind), رَعْد (Donner, das laute Geräusch), بَرْق (Blitz, das helle Licht — kommt immer VOR dem Donner) und ضَبَاب (Nebel, schlechte Sicht). Zum Abschluss lernst du zwei neutral formulierte Umweltbegriffe: تَلَوُّث (Verschmutzung, ein Problem für die بِيئَة) und إِعَادَة تَدْوِير (Recycling, ein Teil der Lösung, wörtlich "Wiederholung des Drehens").' },
      { type: 'heading', level: 'full', text: 'Mehr erfahren: warum Blitz vor Donner kommt' },
      { type: 'paragraph', level: 'full', text: 'Licht (بَرْق) breitet sich viel schneller aus als Schall (رَعْد) — deshalb siehst du bei einem Gewitter immer zuerst den Blitz und hörst erst danach den Donner, auch wenn beide eigentlich gleichzeitig entstehen. Das ist keine sprachliche, sondern eine physikalische Tatsache, die sich auch in der arabischen Reihenfolge بَرْق ثُمَّ رَعْد ("Blitz dann Donner") widerspiegelt.' },
      { type: 'callout', variant: 'tip', title: 'Merke', text: 'دَرَجَة الْحَرَارَة (heute) – مُنَاخ (über Jahre) – بِيئَة (die ganze Natur): drei unterschiedliche Ebenen, nicht austauschbar.' },
      { type: 'callout', variant: 'info', title: 'Typischer Fehler', text: 'مُنَاخ (Klima, langfristig) und دَرَجَة الْحَرَارَة (Temperatur, der heutige Wert) werden im Alltag oft vermischt — "heute ist es kalt" beschreibt Wetter/Temperatur, nicht das Klima einer Region.' },
      { type: 'example', arabic: 'دَرَجَةُ الْحَرَارَةِ الْيَوْمَ عَشْرُونَ دَرَجَة.', translation: 'Die Temperatur heute ist zwanzig Grad.', note: 'اَلْيَوْم (heute) kennst du bereits aus dem Bestand.' },
      { type: 'example', arabic: 'رَأَيْتُ الْبَرْقَ ثُمَّ سَمِعْتُ الرَّعْد.', translation: 'Ich sah den Blitz und hörte dann den Donner.', note: 'رَأَى/سَمِعَ (sehen/hören) kennst du bereits aus Unit 13.' },
      { type: 'example', arabic: 'يَجِبُ أَنْ نَحْمِيَ الْبِيئَةَ مِنَ التَّلَوُّث.', translation: 'Wir müssen die Umwelt vor Verschmutzung schützen.', note: 'يَجِبُ أَنْ (man muss) hier nur zur Veranschaulichung markiert.' },
      { type: 'word_preview', word_ids: ['c1_u27_14', 'c1_u27_15', 'c1_u27_16', 'c1_u27_17', 'c1_u27_18', 'c1_u27_19', 'c1_u27_20', 'c1_u27_21', 'c1_u27_22', 'c1_u27_23'] },
      { type: 'mini_check', questions: [
        mc('Was beschreibt das TYPISCHE Wetter einer Region über viele Jahre?', [opt('مُنَاخ (Klima)', true), opt('دَرَجَة الْحَرَارَة (Temperatur)', false)]),
        mc('Was siehst du bei einem Gewitter zuerst?', [opt('بَرْق (Blitz)', true), opt('رَعْد (Donner)', false)]),
        mc('إِعَادَة تَدْوِير bedeutet…', [opt('Recycling', true), opt('Verschmutzung', false)])
      ] }
    ]
  },
  // ============================== UNIT 28 (Tiere und Pflanzen) ==============================
  {
    theory_id: 'theory_vocab_unit_28_a',
    title: 'Tiere und Pflanzen (1)',
    content_status: 'needs_language_review',
    learning_objectives: [
      'Die zehn Grundtiere aus dem Bestand wiederholen (keine neuen Wörter in dieser Session).',
      'أَرْنَب (Hase, aus dem Bestand) als Beispiel für sprachliche statt biologische Genauigkeit verstehen.',
      'Sich auf die Haustier-/Nutztierwörter aus Session B vorbereiten.'
    ],
    blocks: [
      { type: 'paragraph', text: 'Diese erste Session der letzten Vokabel-Unit von Kurs 1 wiederholt bewusst die zehn bereits vollständigen Grundtiere aus dem Bestand, ohne neue Wörter einzuführen: قِطّ (Katze), كَلْب (Hund), حِصَان (Pferd), أَسَد (Löwe), طَائِر (Vogel), سَمَك (Fisch), أَرْنَب (Hase), دَجَاجَة (Huhn), بَقَرَة (Kuh) und فَأْر (Maus). Diese zehn Wörter bilden das Fundament, auf das die folgenden zwei Sessions mit 20 weiteren Tierwörtern aufbauen.' },
      { type: 'paragraph', text: 'Ein sprachlicher Hinweis zu أَرْنَب: Im Deutschen unterscheiden wir biologisch genau zwischen "Hase" (wild, lange Ohren, lebt oberirdisch) und "Kaninchen" (oft als Haustier gehalten, gräbt Höhlen). Im arabischen Alltag wird dagegen meist nur EIN Wort, أَرْنَب, für beide Tiere verwendet — die feine biologische Unterscheidung ist im allgemeinen Sprachgebrauch nicht so wichtig wie im Deutschen.' },
      { type: 'heading', level: 'full', text: 'Mehr erfahren: warum diese Session keine neuen Wörter hat' },
      { type: 'paragraph', level: 'full', text: 'Bei der Erstellung von Kurs 1 wurden die zehn häufigsten und wichtigsten Tiere bereits ganz am Anfang des Kurses eingeführt (Themenkategorie "Tiere" aus den ursprünglichen Lektionen). Diese letzte Unit des Kurses baut bewusst darauf auf, statt sie zu wiederholen zu erfinden — die neuen 20 Tierwörter in Session B/C ergänzen gezielt das, was noch fehlte (Nutztiere, Insekten, Wildtiere, Pflanzen), ohne bereits Bekanntes zu duplizieren.' },
      { type: 'callout', variant: 'tip', title: 'Merke', text: 'أَرْنَب deckt im Arabischen sowohl "Hase" als auch "Kaninchen" ab — anders als im Deutschen gibt es dafür meist kein eigenes zweites Wort im Alltag.' },
      { type: 'callout', variant: 'info', title: 'Typischer Fehler', text: 'فَأْر (Maus, das Tier) und فَأْرَة (Computermaus, Unit 26) klingen ähnlich — nur die weibliche Form فَأْرَة bezeichnet das Computergerät.' },
      { type: 'example', arabic: 'اَلْقِطُّ وَالْكَلْبُ حَيَوَانَانِ أَلِيفَان.', translation: 'Die Katze und der Hund sind zwei Haustiere.', note: 'حَيَوَان (Tier) hier nur zur Veranschaulichung markiert.' },
      { type: 'example', arabic: 'رَأَيْتُ أَرْنَباً فِي الْحَدِيقَة.', translation: 'Ich habe einen Hasen im Garten gesehen.', note: 'رَأَى (sehen) kennst du bereits aus Unit 13.' },
      { type: 'example', arabic: 'اَلْأَسَدُ مَلِكُ الْغَابَة.', translation: 'Der Löwe ist der König des Waldes.', note: 'اَلْغَابَة (Wald) kennst du bereits aus Unit 27.' },
      { type: 'word_preview', word_ids: ['animal_cat', 'animal_dog', 'animal_horse', 'animal_lion', 'animal_bird', 'animal_fish', 'animal_rabbit', 'animal_chicken', 'animal_cow', 'animal_mouse'] },
      { type: 'mini_check', questions: [
        mc('Welche zwei deutschen Tiere deckt أَرْنَب im arabischen Alltag meist ab?', [opt('Hase UND Kaninchen', true), opt('nur Hase', false)]),
        mc('فَأْرَة (mit ة) bezeichnet am Computer…', [opt('die Computermaus', true), opt('das Tier Maus', false)]),
        mc('أَسَد bedeutet…', [opt('Löwe', true), opt('Pferd', false)])
      ] }
    ]
  },
  {
    theory_id: 'theory_vocab_unit_28_b',
    title: 'Tiere und Pflanzen (2)',
    content_status: 'needs_language_review',
    learning_objectives: [
      'Vier Nutztiere (Schaf, Ziege, Kamel, Esel) sicher benennen.',
      'Drei weitere Wildtiere (Elefant, Affe, Schlange) einordnen.',
      'Drei kleinere Tiere (Schildkröte, Frosch, Biene) unterscheiden.'
    ],
    blocks: [
      { type: 'paragraph', text: 'Diese Session beginnt mit vier klassischen Nutztieren des arabischsprachigen Raums: خَرُوف (Schaf), مَاعِز (Ziege), جَمَل (Kamel, ideal für die Wüste) und حِمَار (Esel, trägt Lasten). Diese vier Tiere leben traditionell auf dem Land oder in der Wüste und werden vom Menschen gehalten.' },
      { type: 'paragraph', text: 'Danach folgen drei größere Wildtiere: فِيل (Elefant), قِرْد (Affe) und ثُعْبَان (Schlange). Zum Abschluss lernst du drei kleinere Tiere mit sehr unterschiedlicher Lebensweise: سُلَحْفَاة (Schildkröte, langsam, mit Panzer), ضِفْدَع (Frosch, springt, lebt am Wasser) und نَحْلَة (Biene, fliegt, macht Honig).' },
      { type: 'heading', level: 'full', text: 'Mehr erfahren: Nutztiere in der arabischsprachigen Kultur' },
      { type: 'paragraph', level: 'full', text: 'جَمَل (Kamel) hat traditionell eine besondere Bedeutung in der arabischsprachigen Kultur — es ist perfekt an das Leben in der Wüste angepasst (kann lange ohne Wasser auskommen) und wird traditionell sowohl zum Transport als auch für Milch und Wolle genutzt. Viele arabische Sprichwörter und Redewendungen beziehen sich auf das Kamel.' },
      { type: 'callout', variant: 'tip', title: 'Merke', text: 'خَرُوف, مَاعِز, جَمَل, حِمَار — vier Nutztiere, die traditionell vom Menschen gehalten werden.' },
      { type: 'callout', variant: 'info', title: 'Typischer Fehler', text: 'خَرُوف (Schaf) und مَاعِز (Ziege) werden von Anfängern manchmal verwechselt — beide sind wollige Weidetiere, aber unterschiedliche Arten.' },
      { type: 'example', arabic: 'يَعِيشُ الْجَمَلُ فِي الصَّحْرَاء.', translation: 'Das Kamel lebt in der Wüste.', note: 'اَلصَّحْرَاء (Wüste) kennst du bereits aus Unit 27.' },
      { type: 'example', arabic: 'اَلنَّحْلَةُ تَصْنَعُ الْعَسَل.', translation: 'Die Biene macht Honig.', note: 'صَنَعَ (herstellen) kennst du bereits aus Unit 17.' },
      { type: 'example', arabic: 'اَلسُّلَحْفَاةُ بَطِيئَةٌ جِدّاً.', translation: 'Die Schildkröte ist sehr langsam.', note: 'بَطِيء (langsam) kennst du bereits aus Unit 19.' },
      { type: 'word_preview', word_ids: ['c1_u28_01', 'c1_u28_02', 'c1_u28_03', 'c1_u28_04', 'c1_u28_05', 'c1_u28_06', 'c1_u28_07', 'c1_u28_08', 'c1_u28_09', 'c1_u28_10'] },
      { type: 'mini_check', questions: [
        mc('Welches Tier ist besonders gut an die Wüste angepasst?', [opt('جَمَل (Kamel)', true), opt('فِيل (Elefant)', false)]),
        mc('Welches Tier macht Honig?', [opt('نَحْلَة (Biene)', true), opt('ضِفْدَع (Frosch)', false)]),
        mc('سُلَحْفَاة bedeutet…', [opt('Schildkröte', true), opt('Schlange', false)])
      ] }
    ]
  },
  {
    theory_id: 'theory_vocab_unit_28_c',
    title: 'Tiere und Pflanzen (3)',
    content_status: 'needs_language_review',
    learning_objectives: [
      'Drei kleine fliegende Insekten (Fliege, Mücke, Schmetterling) unterscheiden.',
      'Drei wilde Raubtiere (Wolf, Fuchs, Bär) einordnen.',
      'Pflanze, Wurzel und Samen durch klare Kontexte unterscheiden.'
    ],
    blocks: [
      { type: 'paragraph', text: 'Diese letzte Session der Unit — und der letzten Vokabel-Unit von Kurs 1 — beginnt mit drei kleinen fliegenden Insekten: ذُبَابَة (Fliege, summt oft ums Essen), بَعُوضَة (Mücke, sticht nachts) und فَرَاشَة (Schmetterling, bunt und harmlos). Danach folgen drei wilde Raubtiere: ذِئْب (Wolf, jagt im Rudel), ثَعْلَب (Fuchs, schlau) und دُبّ (Bär, groß und stark). غَزَال (Gazelle/Hirsch) rundet die Tierwörter der Unit ab.' },
      { type: 'paragraph', text: 'Zum Abschluss des gesamten Kurs-1-Wortschatzes lernst du drei Pflanzenbegriffe im klaren Kontext: نَبَات (Pflanze, der Oberbegriff für jedes Gewächs), جِذْر (Wurzel, der unterirdische Teil, der die Pflanze verankert und ernährt) und بَذْرَة (Samen, das kleine Korn, aus dem eine neue Pflanze wächst) — zusammen beschreiben diese drei Wörter den ganzen Lebenszyklus einer Pflanze: aus einer بَذْرَة wächst über die جِذْر ein ganzes نَبَات.' },
      { type: 'heading', level: 'full', text: 'Mehr erfahren: der Lebenszyklus einer Pflanze auf Arabisch' },
      { type: 'paragraph', level: 'full', text: 'بَذْرَة → جِذْر → نَبَات beschreibt eine natürliche Reihenfolge: Du pflanzt eine بَذْرَة (Samen) in die Erde, sie bildet zuerst eine جِذْر (Wurzel) unter der Erde, und daraus wächst schließlich das ganze نَبَات (Pflanze) mit Stamm und Blättern — dieselbe Grundidee kennst du bereits von شَجَرَة (Baum) und زَهْرَة (Blume) aus Unit 27, die beide Beispiele für ein نَبَات sind.' },
      { type: 'callout', variant: 'tip', title: 'Merke', text: 'بَذْرَة (Samen) → جِذْر (Wurzel) → نَبَات (ganze Pflanze) — der natürliche Wachstumsablauf.' },
      { type: 'callout', variant: 'info', title: 'Typischer Fehler', text: 'ذُبَابَة (Fliege) und بَعُوضَة (Mücke) werden oft verwechselt — beide sind kleine fliegende Insekten, aber nur بَعُوضَة sticht.' },
      { type: 'example', arabic: 'اَلذِّئْبُ وَالثَّعْلَبُ حَيَوَانَانِ بَرِّيَّان.', translation: 'Der Wolf und der Fuchs sind zwei Wildtiere.', note: 'بَرِّيّ (wild) hier nur zur Veranschaulichung markiert.' },
      { type: 'example', arabic: 'زَرَعْتُ بَذْرَةً وَنَمَتْ جِذُورُهَا بِسُرْعَة.', translation: 'Ich habe einen Samen gepflanzt, und seine Wurzeln wuchsen schnell.', note: 'بِسُرْعَة (schnell) verwandt mit سَرِيع aus Unit 19.' },
      { type: 'example', arabic: 'اَلْفَرَاشَةُ جَمِيلَةٌ وَلَا تُؤْذِي أَحَداً.', translation: 'Der Schmetterling ist schön und tut niemandem weh.', note: 'لَا أَحَد (niemand) kennst du bereits aus Unit 30.' },
      { type: 'word_preview', word_ids: ['c1_u28_11', 'c1_u28_12', 'c1_u28_13', 'c1_u28_14', 'c1_u28_15', 'c1_u28_16', 'c1_u28_17', 'c1_u28_18', 'c1_u28_19', 'c1_u28_20'] },
      { type: 'mini_check', questions: [
        mc('Welches Insekt sticht?', [opt('بَعُوضَة (Mücke)', true), opt('فَرَاشَة (Schmetterling)', false)]),
        mc('Was wächst zuerst, wenn du eine بَذْرَة pflanzt?', [opt('جِذْر (Wurzel)', true), opt('das fertige نَبَات', false)]),
        mc('دُبّ bedeutet…', [opt('Bär', true), opt('Wolf', false)])
      ] }
    ]
  },
  // ============================== UNIT 29 (Freizeit, Sport und Kultur) ==============================
  {
    theory_id: 'theory_vocab_unit_29_a',
    title: 'Freizeit, Sport und Kultur (1)',
    content_status: 'needs_language_review',
    learning_objectives: [
      'Die vier Grundbegriffe aus dem Bestand um fünf Freizeitaktivitäten ergänzen.',
      'Tätigkeiten (Verbalnomen wie قِرَاءَة) von Gegenständen unterscheiden.',
      'كُرَة الْقَدَم als erstes Beispiel für zusammengesetzte Sportnamen einordnen.'
    ],
    blocks: [
      { type: 'paragraph', text: 'Du kennst aus dem Bestand bereits فِيلْم (Film), مُوسِيقَى (Musik), رِيَاضَة (Sport) und لُعْبَة (Spiel, allgemein). Diese Unit füllt diesen Themenbereich mit konkreten Aktivitäten. Die ersten fünf neuen Wörter sind alle sogenannte Verbalnomen (اسم المصدر) — sie beschreiben eine TÄTIGKEIT, keinen Gegenstand: قِرَاءَة (Lesen), رَسْم (Zeichnen), رَقْص (Tanzen) und سِبَاحَة (Schwimmen) — du übst diese Tätigkeiten aus, du besitzt sie nicht wie einen Gegenstand.' },
      { type: 'paragraph', text: 'فَنّ (Kunst) ist dagegen ein Oberbegriff, kein einzelnes Verbalnomen — ein Gemälde oder ein Tanz können beide Beispiele für فَنّ sein. Zum Abschluss der Session lernst du كُرَة الْقَدَم (Fußball, wörtlich "Ball des Fußes") — das erste von mehreren zusammengesetzten Sportnamen dieser Unit, die alle mit كُرَة (Ball) beginnen.' },
      { type: 'heading', level: 'full', text: 'Mehr erfahren: Verbalnomen als eigene arabische Wortform' },
      { type: 'paragraph', level: 'full', text: 'قِرَاءَة, رَسْم, رَقْص und سِبَاحَة sind grammatisch sogenannte Verbalnomen (مصدر) — sie sind von einem Verb abgeleitet (قَرَأَ "lesen" → قِرَاءَة "das Lesen"), werden aber wie ein normales Substantiv behandelt (mit Genus, in Sätzen wie ein Ding). Das Deutsche macht das Ähnliche mit der Endung "-en" ("lesen" → "das Lesen") oder "-ung" — genau wie im Arabischen wird aus einer Handlung ein benennbares Substantiv.' },
      { type: 'callout', variant: 'tip', title: 'Merke', text: 'قِرَاءَة, رَسْم, رَقْص, سِبَاحَة sind TÄTIGKEITEN (Verbalnomen), keine Gegenstände — du "machst" sie, du "hast" sie nicht.' },
      { type: 'callout', variant: 'info', title: 'Typischer Fehler', text: 'رِيَاضَة (Sport, allgemeiner Oberbegriff, aus dem Bestand) und كُرَة الْقَدَم (Fußball, eine EINZELNE Sportart) werden manchmal gleichgesetzt — Fußball ist nur eine von vielen Sportarten.' },
      { type: 'example', arabic: 'هِوَايَتِي الْمُفَضَّلَةُ هِيَ الْقِرَاءَة.', translation: 'Mein Lieblingshobby ist das Lesen.', note: 'هِوَايَة (Hobby) kennst du aus Session B dieser Unit.' },
      { type: 'example', arabic: 'يَلْعَبُ الْأَطْفَالُ كُرَةَ الْقَدَمِ فِي الْحَدِيقَة.', translation: 'Die Kinder spielen Fußball im Park.', note: 'لَعِبَ (spielen) kennst du bereits aus dem Bestand.' },
      { type: 'example', arabic: 'اَلرَّسْمُ وَالرَّقْصُ نَوْعَانِ مِنَ الْفَنّ.', translation: 'Zeichnen und Tanzen sind zwei Arten von Kunst.', note: 'نَوْع (Art/Typ) hier nur zur Veranschaulichung markiert.' },
      { type: 'word_preview', word_ids: ['leisure_film', 'leisure_music', 'leisure_sport', 'leisure_game', 'c1_u29_01', 'c1_u29_02', 'c1_u29_03', 'c1_u29_04', 'c1_u29_05', 'c1_u29_06'] },
      { type: 'mini_check', questions: [
        mc('Welches Wort beschreibt eine Tätigkeit, keinen Gegenstand?', [opt('قِرَاءَة (Lesen)', true), opt('فَنّ (Kunst)', false)]),
        mc('كُرَة الْقَدَم bedeutet wörtlich…', [opt('Ball des Fußes', true), opt('Spiel des Körpers', false)]),
        mc('سِبَاحَة bedeutet…', [opt('Schwimmen', true), opt('Tanzen', false)])
      ] }
    ]
  },
  {
    theory_id: 'theory_vocab_unit_29_b',
    title: 'Freizeit, Sport und Kultur (2)',
    content_status: 'needs_language_review',
    learning_objectives: [
      'كُرَة السَّلَّة/تِنِس als weitere Ballsportarten neben كُرَة الْقَدَم einordnen.',
      'مُغَنِّي und مُمَثِّل als zwei unterschiedliche Kulturberufe unterscheiden.',
      'هِوَايَة als Oberbegriff für alle Aktivitäten dieser Unit erkennen.'
    ],
    blocks: [
      { type: 'paragraph', text: 'كُرَة السَّلَّة (Basketball, wörtlich "Ball des Korbes") und تِنِس (Tennis, ein Lehnwort) ergänzen كُرَة الْقَدَم aus Session A um zwei weitere Ballsportarten. جَرْي (Laufen/Joggen) und رُكُوب الدَّرَّاجَة (Fahrradfahren, wörtlich "Reiten des Fahrrads" — دَرَّاجَة kennst du bereits aus dem Bestand als "Fahrrad") sind zwei weitere körperliche Aktivitäten. تَصْوِير (Fotografie/Fotografieren) rundet die Aktivitäten ab.' },
      { type: 'paragraph', text: 'هِوَايَة (Hobby) ist der Oberbegriff für ALLE Aktivitäten dieser Unit — Lesen, Zeichnen, Schwimmen, Fußball, Fotografieren können alle als هِوَايَة bezeichnet werden. Danach wechselt die Session zur Musik/Kultur: حَفْلَة مُوسِيقِيَّة (Konzert) besuchst du, um أُغْنِيَة (Lied) live zu hören, gesungen von einem مُغَنِّي (Sänger). ممَثِّل (Schauspieler) schließt die Session ab — eine andere Kulturperson, die nicht singt, sondern eine Rolle spielt.' },
      { type: 'heading', level: 'full', text: 'Mehr erfahren: رُكُوب als wiederkehrendes Wort für "Fahren/Reiten"' },
      { type: 'paragraph', level: 'full', text: 'رُكُوب bedeutet ursprünglich "Reiten" (z. B. eines Pferdes) und wurde im modernen Arabisch auf jedes Fahren mit einem Fortbewegungsmittel ausgeweitet, bei dem du "aufsitzt" — رُكُوب الدَّرَّاجَة (Fahrradfahren) folgt demselben Muster wie رُكُوب الْحِصَان (Reiten) oder رُكُوب السَّيَّارَة (Autofahren als Mitfahrer). Das Grundbild "sich auf/in ein Fortbewegungsmittel setzen" bleibt dabei immer erhalten.' },
      { type: 'callout', variant: 'tip', title: 'Merke', text: 'هِوَايَة ist der Oberbegriff für ALLE Aktivitäten dieser Unit — jede von ihnen kann eine هِوَايَة sein.' },
      { type: 'callout', variant: 'info', title: 'Typischer Fehler', text: 'مُغَنِّي (Sänger, singt) und مُمَثِّل (Schauspieler, spielt eine Rolle) werden manchmal verwechselt — nur مُغَنِّي tritt primär musikalisch auf.' },
      { type: 'example', arabic: 'هِوَايَتِي هِيَ رُكُوبُ الدَّرَّاجَةِ فِي عُطْلَةِ نِهَايَةِ الْأُسْبُوع.', translation: 'Mein Hobby ist Fahrradfahren am Wochenende.', note: 'عُطْلَة (Ferien/freie Tage) kennst du aus Session C dieser Unit.' },
      { type: 'example', arabic: 'ذَهَبْنَا إِلَى حَفْلَةٍ مُوسِيقِيَّةٍ وَسَمِعْنَا أُغْنِيَةً جَمِيلَة.', translation: 'Wir gingen zu einem Konzert und hörten ein schönes Lied.', note: 'ذَهَبَ (gehen) kennst du bereits aus dem Bestand.' },
      { type: 'example', arabic: 'هَذَا الْمُمَثِّلُ مَشْهُورٌ جِدّاً.', translation: 'Dieser Schauspieler ist sehr berühmt.', note: 'جِدّاً (sehr) kennst du bereits aus Unit 30.' },
      { type: 'word_preview', word_ids: ['c1_u29_07', 'c1_u29_08', 'c1_u29_09', 'c1_u29_10', 'c1_u29_11', 'c1_u29_12', 'c1_u29_13', 'c1_u29_14', 'c1_u29_15', 'c1_u29_16'] },
      { type: 'mini_check', questions: [
        mc('Welches Wort ist der Oberbegriff für alle Aktivitäten dieser Unit?', [opt('هِوَايَة (Hobby)', true), opt('رُكُوب (Fahren/Reiten)', false)]),
        mc('Wer tritt primär musikalisch auf?', [opt('مُغَنِّي (Sänger)', true), opt('مُمَثِّل (Schauspieler)', false)]),
        mc('كُرَة السَّلَّة bedeutet…', [opt('Basketball', true), opt('Tennis', false)])
      ] }
    ]
  },
  {
    theory_id: 'theory_vocab_unit_29_c',
    title: 'Freizeit, Sport und Kultur (3)',
    content_status: 'needs_language_review',
    learning_objectives: [
      'مُبَارَاة (Spiel, Wettkampf) klar von لُعْبَة (Spiel, allgemein, aus dem Bestand) unterscheiden.',
      'عُطْلَة, إِجَازَة (Unit 25) und حَفْلَة nicht als Synonyme behandeln.',
      'Wettkampf-Vokabular (Mannschaft, Spieler, Gewinner) sicher benennen.'
    ],
    blocks: [
      { type: 'paragraph', text: 'مُمَثِّلَة (Schauspielerin) ist die weibliche Form von مُمَثِّل aus Session B. Danach folgt eine wichtige Unterscheidung: لُعْبَة (aus dem Bestand) bedeutet "Spiel" im ALLGEMEINEN Sinne (z. B. ein Brettspiel oder Kinderspiel), während مُبَارَاة speziell einen sportlichen WETTKAMPF zwischen zwei Mannschaften bezeichnet (z. B. ein Fußballspiel) — im Deutschen sagen wir dafür oft "Match". Rund um eine مُبَارَاة brauchst du: فَرِيق (Mannschaft/Team), لَاعِب (Spieler), فَائِز (Gewinner) und مُسَابَقَة (Wettbewerb, oft mit mehreren مُبَارَاة).' },
      { type: 'paragraph', text: 'Zum Abschluss der Unit und des gesamten Kurs-1-Wortschatzes klärt diese Session drei Freizeitbegriffe, die NICHT gleichbedeutend sind: عُطْلَة (Ferien/freie Tage — allgemein arbeits-/schulfrei, z. B. Sommerferien), إِجَازَة (Urlaub — konkret arbeits-BEZOGENE freie Tage, aus Unit 25) und حَفْلَة (Feier/Party — ein einzelnes, meist kurzes Fest). شَطْرَنْج (Schach) und سِيَاحَة (Tourismus, verwandt mit سَائِح "Tourist" aus Unit 22) schließen Kurs 1 inhaltlich ab.' },
      { type: 'heading', level: 'full', text: 'Mehr erfahren: لُعْبَة vs. مُبَارَاة — der letzte wichtige Unterschied des Kurses' },
      { type: 'paragraph', level: 'full', text: 'لُعْبَة und مُبَارَاة teilen im Deutschen die Übersetzung "Spiel", meinen aber unterschiedliche Dinge: لُعْبَة ist die allgemeine AKTIVITÄT oder auch ein Spielzeug/Brettspiel, مُبَارَاة ist ein konkretes, terminiertes sportliches EREIGNIS zwischen zwei Gegnern mit Gewinner und Verlierer. Ein Kind "spielt" (لَعِبَ) mit einer لُعْبَة, zwei Fußballmannschaften tragen dagegen eine مُبَارَاة aus.' },
      { type: 'callout', variant: 'tip', title: 'Merke', text: 'عُطْلَة (allgemein frei) – إِجَازَة (Arbeitsurlaub, Unit 25) – حَفْلَة (einzelnes Fest): drei unterschiedliche Freizeitbegriffe, keine Synonyme.' },
      { type: 'callout', variant: 'info', title: 'Typischer Fehler', text: 'لُعْبَة (Spiel allgemein) und مُبَارَاة (Wettkampf/Match) werden im Deutschen beide mit "Spiel" übersetzt — im Arabischen bezeichnet nur مُبَارَاة einen echten sportlichen Wettkampf.' },
      { type: 'example', arabic: 'شَاهَدْنَا مُبَارَاةً بَيْنَ فَرِيقَيْنِ قَوِيَّيْن.', translation: 'Wir sahen ein Spiel zwischen zwei starken Mannschaften.', note: 'شَاهَدَ (ansehen) kennst du bereits aus Unit 16.' },
      { type: 'example', arabic: 'فِي الْعُطْلَةِ سَافَرْنَا لِلسِّيَاحَة.', translation: 'In den Ferien sind wir zum Tourismus gereist.', note: 'سَافَرَ (reisen) kennst du bereits aus Unit 17.' },
      { type: 'example', arabic: 'اَلْفَائِزُ فِي الْمُسَابَقَةِ لَاعِبٌ مِنْ فَرِيقِنَا.', translation: 'Der Gewinner des Wettbewerbs ist ein Spieler aus unserer Mannschaft.', note: 'لَاعِب (Spieler) und فَرِيق (Mannschaft) wurden gerade eingeführt.' },
      { type: 'word_preview', word_ids: ['c1_u29_17', 'c1_u29_18', 'c1_u29_19', 'c1_u29_20', 'c1_u29_21', 'c1_u29_22', 'c1_u29_23', 'c1_u29_24', 'c1_u29_25', 'c1_u29_26'] },
      { type: 'mini_check', questions: [
        mc('مُبَارَاة bedeutet…', [opt('Spiel/Match als sportlicher Wettkampf', true), opt('Spiel im allgemeinen Sinne (z. B. Brettspiel)', false)], 'Das allgemeine Spiel ist لُعْبَة aus dem Bestand.'),
        mc('Welches Wort bezieht sich speziell auf ARBEITSbezogene freie Tage?', [opt('إِجَازَة (Urlaub, Unit 25)', true), opt('عُطْلَة (Ferien, allgemein)', false)]),
        mc('فَائِز bedeutet…', [opt('Gewinner', true), opt('Spieler', false)])
      ] }
    ]
  },
  // ============================== UNIT 30 (Fragewörter, Konnektoren und Funktionswörter) ==============================
  {
    theory_id: 'theory_vocab_unit_30_a',
    title: 'Fragewörter, Konnektoren und Funktionswörter (1)',
    content_status: 'needs_language_review',
    learning_objectives: [
      'أَيّ (welcher) als letztes Fragewort neben den sieben bereits bekannten einordnen.',
      'هَلْ als unveränderliche Ja/Nein-Fragepartikel am Satzanfang erkennen und anwenden.',
      'لِأَنَّ (weil) zur Angabe von Gründen in einem eigenen Nebensatz verwenden.'
    ],
    blocks: [
      { type: 'paragraph', text: 'Diese letzte Unit des Kurses ist anders als alle vorherigen: Funktionswörter wie Fragewörter, Konnektoren ("und", "aber", "weil") und Pronomen tragen keine eigenständige, bildhafte Bedeutung wie ein Substantiv — sie halten stattdessen einen Satz zusammen oder verknüpfen Sätze miteinander. Deshalb lernst du hier zu jedem Wort NICHT nur eine deutsche Übersetzung, sondern auch: seine grammatische Funktion, seine typische Position im Satz, ob es sich verändert (Genus/Zahl) oder unveränderlich (invariabel) ist, und wie es sich von ähnlichen Wörtern unterscheidet.' },
      { type: 'paragraph', text: 'Du kennst aus dem Bestand bereits sieben Fragewörter: مَنْ (wer), مَاذَا (was), أَيْنَ (wo), مَتَى (wann), كَيْفَ (wie), لِمَاذَا (warum) und كَمْ (wie viel/wie viele). أَيّ (welcher/welche/welches) ergänzt sie als achtes und letztes Fragewort — anders als die anderen sieben steht أَيّ immer VOR einem Substantiv (أَيُّ كِتَابٍ؟ "welches Buch?") und verändert sich je nachdem, worauf es sich bezieht.' },
      { type: 'paragraph', text: 'هَلْ ist eine reine Ja/Nein-Fragepartikel: sie steht IMMER ganz am Anfang eines Satzes, verändert sich NIE (keine Formen für Genus/Zahl) und zeigt an, dass eine Antwort "ja" (نَعَم) oder "nein" (لَا) erwartet wird — ohne هَلْ wäre derselbe Satz eine normale Aussage. لِأَنَّ (weil) leitet einen eigenen Nebensatz ein, der einen GRUND angibt — es steht immer VOR dem Grund, nie davor allein.' },
      { type: 'heading', level: 'full', text: 'Mehr erfahren: warum diese Unit anders aufgebaut ist' },
      { type: 'paragraph', level: 'full', text: 'Isolierte Wortgleichungen ("هَلْ = Fragepartikel") helfen bei Funktionswörtern wenig, weil ihre Bedeutung erst im ganzen Satz sichtbar wird. Achte deshalb bei jedem Beispielsatz in dieser Unit bewusst auf die POSITION des Wortes im Satz (am Anfang? vor einem Substantiv? zwischen zwei Satzteilen?) — diese Position ist oft wichtiger als die reine Wortbedeutung.' },
      { type: 'callout', variant: 'tip', title: 'Merke', text: 'هَلْ steht IMMER am Satzanfang und verändert sich nie — es zeigt nur an, dass eine Ja/Nein-Antwort erwartet wird.' },
      { type: 'callout', variant: 'info', title: 'Typischer Fehler', text: 'أَيّ (welcher, steht VOR einem Substantiv) wird manchmal mit مَاذَا (was, steht meist allein, ohne folgendes Substantiv) verwechselt — أَيُّ كِتَابٍ (welches Buch) braucht immer ein Substantiv danach.' },
      { type: 'example', arabic: 'أَيُّ كِتَابٍ تُرِيد؟', translation: 'Welches Buch möchtest du?', note: 'أَيّ steht direkt vor dem Substantiv كِتَاب.' },
      { type: 'example', arabic: 'هَلْ أَنْتَ جَاهِزٌ لِلسَّفَر؟', translation: 'Bist du bereit für die Reise?', note: 'هَلْ steht ganz am Satzanfang, davor darf nichts stehen.' },
      { type: 'example', arabic: 'تَعِبْتُ لِأَنَّنِي عَمِلْتُ طَوَالَ الْيَوْم.', translation: 'Ich bin müde, weil ich den ganzen Tag gearbeitet habe.', note: 'لِأَنَّ leitet den Grund-Nebensatz ein.' },
      { type: 'word_preview', word_ids: ['q_who', 'q_what', 'q_where', 'q_when', 'q_how', 'q_why', 'q_howmany', 'c1_u30_01', 'c1_u30_02', 'c1_u30_03'] },
      { type: 'mini_check', questions: [
        mc('Wo im Satz steht هَلْ immer?', [opt('ganz am Anfang', true), opt('irgendwo in der Mitte', false)]),
        mc('Was muss nach أَيّ folgen?', [opt('ein Substantiv (z. B. welches Buch)', true), opt('nichts, es steht immer allein', false)]),
        mc('لِأَنَّ leitet ein…', [opt('einen Grund', true), opt('einen Gegensatz', false)])
      ] }
    ]
  },
  {
    theory_id: 'theory_vocab_unit_30_b',
    title: 'Fragewörter, Konnektoren und Funktionswörter (2)',
    content_status: 'needs_language_review',
    learning_objectives: [
      'Vier grundlegende Konjunktionen (لَكِنْ/وَ/أَوْ/ثُمَّ) mit ihrer typischen Satzposition anwenden.',
      'أَيْضاً/فَقَطْ/جِدّاً als Verstärkungs-/Einschränkungswörter unterscheiden.',
      'أَكْثَر und اَلْآن als Vergleichs- bzw. Zeitwort einordnen.'
    ],
    blocks: [
      { type: 'paragraph', text: 'Vier grundlegende Konjunktionen verbinden Wörter oder ganze Sätze: وَ (und, verbindet Gleichrangiges: أَنَا وَأَنْتَ "ich und du"), أَوْ (oder, bietet eine Auswahl: شَايٌ أَوْ قَهْوَة؟ "Tee oder Kaffee?"), لَكِنْ (aber, stellt einen Gegensatz dar: جَمِيلٌ لَكِنْ بَارِد "schön, aber kalt") und ثُمَّ (dann/danach, zeigt eine zeitliche Abfolge: اِسْتَيْقَظْتُ ثُمَّ اِغْتَسَلْتُ "ich wachte auf, dann wusch ich mich"). Alle vier sind UNVERÄNDERLICH — sie haben keine Formen für Genus oder Zahl.' },
      { type: 'paragraph', text: 'أَيْضاً (auch) fügt eine weitere zutreffende Sache hinzu und steht meist am Satzende: أَنَا جَائِعٌ، وَأَنْتَ أَيْضاً (ich habe Hunger, und du auch). فَقَطْ (nur) schränkt etwas auf eine einzige Sache ein, جِدّاً (sehr) verstärkt eine Eigenschaft — beide stehen meist NACH dem Wort, das sie beschreiben. أَكْثَر (mehr) vergleicht eine Menge mit einer anderen, اَلْآن (jetzt) bezieht sich auf den gegenwärtigen Moment.' },
      { type: 'heading', level: 'full', text: 'Mehr erfahren: unveränderliche Wörter erkennen' },
      { type: 'paragraph', level: 'full', text: 'Alle zehn Wörter dieser Session sind grammatisch unveränderlich (مبني) — anders als Substantive oder Adjektive bekommen sie NIE eine feminine Endung, keinen Plural, keine Fallendung. Das macht sie einerseits einfacher zu lernen (du musst dir keine Formen merken), andererseits wichtig, sich ihre feste Position im Satz gut einzuprägen, da diese Position oft der einzige Hinweis auf ihre Funktion ist.' },
      { type: 'callout', variant: 'tip', title: 'Merke', text: 'وَ (und) – أَوْ (oder) – لَكِنْ (aber) – ثُمَّ (dann): vier Grundkonjunktionen, alle unveränderlich.' },
      { type: 'callout', variant: 'info', title: 'Typischer Fehler', text: 'فَقَطْ (nur, schränkt ein) und أَيْضاً (auch, fügt hinzu) haben genau entgegengesetzte Funktionen — leicht zu verwechseln, wenn man nicht auf die Satzbedeutung achtet.' },
      { type: 'example', arabic: 'أُرِيدُ شَايًا أَوْ قَهْوَةً، لَكِنْ لَيْسَ كِلَيْهِمَا.', translation: 'Ich möchte Tee oder Kaffee, aber nicht beides.', note: 'أَوْ und لَكِنْ hier gemeinsam im selben Satz.' },
      { type: 'example', arabic: 'هَذَا الْكِتَابُ مُفِيدٌ جِدّاً، وَأُرِيدُ أَنْ أَقْرَأَ أَكْثَر.', translation: 'Dieses Buch ist sehr nützlich, und ich möchte mehr lesen.', note: 'جِدّاً und أَكْثَر hier gemeinsam im selben Satz.' },
      { type: 'example', arabic: 'عِنْدِي وَقْتٌ الْآنَ فَقَطْ، لَيْسَ لَاحِقاً.', translation: 'Ich habe nur jetzt Zeit, nicht später.', note: 'اَلْآن und فَقَطْ hier gemeinsam im selben Satz.' },
      { type: 'word_preview', word_ids: ['c1_u30_04', 'c1_u30_05', 'c1_u30_06', 'c1_u30_07', 'c1_u30_08', 'c1_u30_09', 'c1_u30_10', 'c1_u30_11', 'c1_u30_12', 'c1_u30_13'] },
      { type: 'mini_check', questions: [
        mc('Welches Wort zeigt eine zeitliche Abfolge ("danach") an?', [opt('ثُمَّ', true), opt('لَكِنْ', false)]),
        mc('Verändern sich diese zehn Wörter nach Genus oder Zahl?', [opt('Nein, sie sind unveränderlich', true), opt('Ja, wie Substantive', false)]),
        mc('فَقَطْ bedeutet…', [opt('nur', true), opt('auch', false)])
      ] }
    ]
  },
  {
    theory_id: 'theory_vocab_unit_30_c',
    title: 'Fragewörter, Konnektoren und Funktionswörter (3)',
    content_status: 'needs_language_review',
    learning_objectives: [
      'كُلّ/بَعْض als Gegensatzpaar für Mengenangaben anwenden.',
      'لَا أَحَد/لَا شَيْء als Verneinungs-Pronomen von شَيْء unterscheiden.',
      'هَذَا/هَذِهِ als Demonstrativpronomen nach Genus richtig einsetzen.'
    ],
    blocks: [
      { type: 'paragraph', text: 'Diese letzte Session des gesamten Kurs-1-Wortschatzes beginnt mit dem Gegensatzpaar كُلّ (alle/jeder, die GESAMTE Menge) ↔ بَعْض (einige/manche, nur ein TEIL der Menge) — beide stehen direkt VOR dem Substantiv, auf das sie sich beziehen: كُلُّ الطُّلَّاب (alle Studierenden), بَعْضُ الطُّلَّاب (einige Studierende). لَا أَحَد (niemand) und لَا شَيْء (nichts) sind Verneinungen — wörtlich "kein Jemand" und "keine Sache" — sie verneinen die EXISTENZ einer Person bzw. Sache vollständig. شَيْء (etwas/Sache) ist dagegen die positive, unbestimmte Form.' },
      { type: 'paragraph', text: 'هُنَا (hier) ↔ هُنَاكَ (dort) zeigen auf einen nahen bzw. fernen Ort. Zum Abschluss lernst du die zwei wichtigsten Demonstrativpronomen: هَذَا (dieser/dieses, für männliche oder sächliche Dinge: هَذَا كِتَابِي "dies ist mein Buch") und هَذِهِ (diese, für weibliche Dinge: هَذِهِ سَيَّارَتِي "dies ist mein Auto") — welche Form du wählst, hängt vom GENUS des Dings ab, auf das du zeigst, nicht von deinem eigenen Genus. إِذَا (wenn/falls) leitet einen Bedingungssatz ein und schließt damit den gesamten Kurs-1-Wortschatz ab.' },
      { type: 'heading', level: 'full', text: 'Mehr erfahren: هَذَا/هَذِهِ — das letzte neue Sprachmuster von Kurs 1' },
      { type: 'paragraph', level: 'full', text: 'هَذَا und هَذِهِ sind die einzigen beiden Wörter dieser Session, die sich VERÄNDERN — und zwar nach dem Genus des Substantivs, auf das sie zeigen (nicht nach dem Genus der sprechenden Person). Ein Mann sagt genauso هَذِهِ سَيَّارَتِي ("dies ist mein Auto", weil سَيَّارَة feminin ist) wie eine Frau. Das ist ein gutes Beispiel dafür, dass arabische Genus-Kongruenz sich immer auf das SUBSTANTIV bezieht, nicht auf die sprechende Person — ein Prinzip, das dir während des ganzen Kurses immer wieder begegnet ist.' },
      { type: 'callout', variant: 'tip', title: 'Merke', text: 'كُلّ (alle) ↔ بَعْض (einige) und شَيْء (etwas) ↔ لَا شَيْء (nichts) sind die letzten beiden Gegensatzpaare von Kurs 1.' },
      { type: 'callout', variant: 'info', title: 'Typischer Fehler', text: 'هَذَا/هَذِهِ richten sich nach dem Genus des GEZEIGTEN Dings, nicht nach dem Genus der sprechenden Person — ein häufiger Anfängerfehler ist, hier das eigene Geschlecht zu berücksichtigen.' },
      { type: 'example', arabic: 'كُلُّ الطُّلَّابِ حَضَرُوا، لَكِنْ بَعْضَهُمْ وَصَلَ مُتَأَخِّراً.', translation: 'Alle Studierenden sind gekommen, aber einige kamen spät an.', note: 'مُتَأَخِّر (spät) kennst du bereits aus Unit 19.' },
      { type: 'example', arabic: 'لَا يُوجَدُ أَحَدٌ هُنَا، وَلَا شَيْءَ عَلَى الطَّاوِلَة.', translation: 'Es ist niemand hier, und nichts liegt auf dem Tisch.', note: 'هُنَا (hier) hier nur zur Veranschaulichung markiert.' },
      { type: 'example', arabic: 'إِذَا كَانَ هَذَا كِتَابَكَ، فَهَذِهِ حَقِيبَتِي.', translation: 'Wenn dies dein Buch ist, dann ist dies meine Tasche.', note: 'هَذَا (m., Buch) und هَذِهِ (f., Tasche) hier im direkten Vergleich.' },
      { type: 'word_preview', word_ids: ['c1_u30_14', 'c1_u30_15', 'c1_u30_16', 'c1_u30_17', 'c1_u30_18', 'c1_u30_19', 'c1_u30_20', 'c1_u30_21', 'c1_u30_22', 'c1_u30_23'] },
      { type: 'mini_check', questions: [
        mc('Das Gegenteil von كُلّ (alle) ist…', [opt('بَعْض (einige)', true), opt('لَا أَحَد (niemand)', false)]),
        mc('Wonach richtet sich هَذَا/هَذِهِ?', [opt('nach dem Genus des gezeigten Dings', true), opt('nach dem Genus der sprechenden Person', false)]),
        mc('لَا شَيْء bedeutet…', [opt('nichts', true), opt('niemand', false)])
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
