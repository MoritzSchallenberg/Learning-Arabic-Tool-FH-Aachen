// Kurs 1, Units 21-25 — vollständiges Datenmodell für die 126 noch unvollständigen Wörter dieses
// Batches (Entwicklungsauftrag 10). Gleiche Feldkürzel/Konventionen wie
// kurs1Units16to20Full.js: ar = arabisch vokalisiert, tr = Transliteration, pos = Wortart (aus dem
// zentralen deutschsprachigen Wortarten-Vokabular, siehe scripts/validateCourse.js
// KNOWN_PART_OF_SPEECH — inkl. des in dieser Runde neu ergänzten Wertes "Präposition"), g = Genus,
// pl = Plural vokalisiert (oder null), de = Array deutscher Antworten, app = Kontext-Satz für
// application_prompts, opp = ID des Gegensatzworts (gegenseitig verknüpft, auch unitübergreifend
// zulässig), conf = confusion_group-Name (nur bei didaktischem Nutzen), homonymGroup = optionales
// homonym_group-Tag.
//
// Umschrift-Konvention (unverändert seit Entwicklungsauftrag 6-9): Langvokale mit Makron
// (ā ī ū), Hamza ʾ, ʿAyn ʿ, emphatische Konsonanten mit Punkt (ḥ ṣ ḍ ṭ ẓ), digraphische
// sh/kh/gh/th/dh (NICHT š/ḫ/ġ/ṯ/ḏ).
//
// Unit 21 (Position/Richtung/Präpositionen) verlangt laut Auftrag besondere Sorgfalt bei
// Mehrdeutigkeit — siehe die ausführlichen Kommentare direkt bei den betroffenen Einträgen.

const UNIT_21 = [
  { id: 'c1_u21_01', ar: 'فِي', tr: 'fī', pos: 'Präposition', g: null, pl: null, de: ['in'], app: 'Du möchtest sagen, dass sich etwas innerhalb eines Ortes befindet.' },
  { id: 'c1_u21_02', ar: 'عَلَى', tr: 'ʿalā', pos: 'Präposition', g: null, pl: null, de: ['auf'], app: 'Du möchtest sagen, dass etwas auf einer Oberfläche liegt.' },
  { id: 'c1_u21_03', ar: 'تَحْتَ', tr: 'taḥta', pos: 'Präposition', g: null, pl: null, de: ['unter'], app: 'Du möchtest sagen, dass sich etwas unterhalb von etwas anderem befindet.', opp: 'c1_u21_04' },
  // فَوْقَ (räumlich "über/oberhalb") vs. عَنْ (nicht-räumlich "über [ein Thema]") — siehe
  // Auftrag Abschnitt 4: dieselbe deutsche Übersetzung "über" für zwei völlig unterschiedliche
  // arabische Präpositionen ist eine LEGITIME, bewusst erhaltene Mehrdeutigkeit (nicht künstlich
  // entfernt), aber in der Theorie zu Session A/C explizit erklärt.
  { id: 'c1_u21_04', ar: 'فَوْقَ', tr: 'fawqa', pos: 'Präposition', g: null, pl: null, de: ['über', 'oberhalb'], app: 'Du möchtest sagen, dass ein Bild über dem Tisch hängt (räumlich).', opp: 'c1_u21_03', conf: 'c1_prep_ueber' },
  // أَمَامَ (räumlich "vor") vs. قَبْلَ (zeitlich "vor/vorher") — dieselbe deutsche Übersetzung
  // "vor" für zwei unterschiedliche arabische Präpositionen, ebenfalls bewusst erhalten.
  { id: 'c1_u21_05', ar: 'أَمَامَ', tr: 'amāma', pos: 'Präposition', g: null, pl: null, de: ['vor'], app: 'Du möchtest sagen, dass jemand vor dem Haus steht (räumlich).', opp: 'c1_u21_06', conf: 'c1_prep_vor' },
  { id: 'c1_u21_06', ar: 'خَلْفَ', tr: 'khalfa', pos: 'Präposition', g: null, pl: null, de: ['hinter'], app: 'Du möchtest sagen, dass sich etwas hinter dem Haus befindet.', opp: 'c1_u21_05' },
  { id: 'c1_u21_07', ar: 'بَيْنَ', tr: 'bayna', pos: 'Präposition', g: null, pl: null, de: ['zwischen'], app: 'Du möchtest sagen, dass etwas zwischen zwei Dingen liegt.' },
  { id: 'c1_u21_08', ar: 'بِجَانِبِ', tr: 'bijānibi', pos: 'Präposition', g: null, pl: null, de: ['neben'], app: 'Du möchtest sagen, dass etwas direkt neben etwas anderem steht.' },
  { id: 'c1_u21_09', ar: 'قُرْبَ', tr: 'qurba', pos: 'Präposition', g: null, pl: null, de: ['in der Nähe von'], app: 'Du möchtest sagen, dass etwas in der Nähe eines Ortes liegt.' },
  // Zitierform ohne Akkusativ-Tanwin (بَعِيد statt بَعِيداً), damit die vokalisierte Form exakt zur
  // bereits bestehenden arabic_unvocalized-Grundform "بعيد عن" strippt (keine unnötige Änderung
  // der Grundform, siehe Kommentarkopf des Upgrade-Skripts).
  { id: 'c1_u21_10', ar: 'بَعِيد عَنْ', tr: 'baʿīd ʿan', pos: 'Ausdruck', g: null, pl: null, de: ['weit entfernt von'], app: 'Du möchtest sagen, dass ein Ort weit von hier entfernt ist.' },
  { id: 'c1_u21_11', ar: 'دَاخِلَ', tr: 'dākhila', pos: 'Präposition', g: null, pl: null, de: ['innen', 'innerhalb'], app: 'Du möchtest sagen, dass sich etwas innerhalb eines Raumes befindet.', opp: 'c1_u21_12' },
  { id: 'c1_u21_12', ar: 'خَارِجَ', tr: 'khārija', pos: 'Präposition', g: null, pl: null, de: ['außen', 'außerhalb'], app: 'Du möchtest sagen, dass sich etwas außerhalb eines Raumes befindet.', opp: 'c1_u21_11' },
  { id: 'c1_u21_13', ar: 'يَمِين', tr: 'yamīn', pos: 'Substantiv', g: 'feminin', pl: null, de: ['rechts'], app: 'Du möchtest sagen, dass sich etwas auf der rechten Seite befindet.', opp: 'c1_u21_14' },
  { id: 'c1_u21_14', ar: 'يَسَار', tr: 'yasār', pos: 'Substantiv', g: 'maskulin', pl: null, de: ['links'], app: 'Du möchtest sagen, dass sich etwas auf der linken Seite befindet.', opp: 'c1_u21_13' },
  { id: 'c1_u21_15', ar: 'إِلَى الْأَمَام', tr: 'ilā l-amām', pos: 'Ausdruck', g: null, pl: null, de: ['geradeaus', 'nach vorne'], app: 'Du möchtest jemandem sagen, dass er geradeaus weitergehen soll.' },
  { id: 'c1_u21_16', ar: 'شَمَال', tr: 'shamāl', pos: 'Substantiv', g: 'maskulin', pl: null, de: ['Norden'], app: 'Du möchtest die Himmelsrichtung Norden auf einer Karte benennen.', opp: 'c1_u21_17', conf: 'c1_compass_directions' },
  { id: 'c1_u21_17', ar: 'جَنُوب', tr: 'janūb', pos: 'Substantiv', g: 'maskulin', pl: null, de: ['Süden'], app: 'Du möchtest die Himmelsrichtung Süden auf einer Karte benennen.', opp: 'c1_u21_16', conf: 'c1_compass_directions' },
  { id: 'c1_u21_18', ar: 'شَرْق', tr: 'sharq', pos: 'Substantiv', g: 'maskulin', pl: null, de: ['Osten'], app: 'Du möchtest die Himmelsrichtung Osten auf einer Karte benennen.', opp: 'c1_u21_19', conf: 'c1_compass_directions' },
  { id: 'c1_u21_19', ar: 'غَرْب', tr: 'gharb', pos: 'Substantiv', g: 'maskulin', pl: null, de: ['Westen'], app: 'Du möchtest die Himmelsrichtung Westen auf einer Karte benennen.', opp: 'c1_u21_18', conf: 'c1_compass_directions' },
  { id: 'c1_u21_20', ar: 'إِلَى', tr: 'ilā', pos: 'Präposition', g: null, pl: null, de: ['zu', 'nach'], app: 'Du möchtest sagen, dass du zu einem Ort gehst.' },
  // مِنْ ("von/aus") ist unvokalisiert identisch mit مَنْ ("wer", q_who) — bewusstes Homonym,
  // bereits im Minimalmodell-Stub markiert, hier bestätigt (nicht neu erfunden).
  { id: 'c1_u21_21', ar: 'مِنْ', tr: 'min', pos: 'Präposition', g: null, pl: null, de: ['von', 'aus'], app: 'Du möchtest sagen, woher etwas kommt.', homonymGroup: 'من' },
  { id: 'c1_u21_22', ar: 'مَعَ', tr: 'maʿa', pos: 'Präposition', g: null, pl: null, de: ['mit'], app: 'Du möchtest sagen, dass du mit jemandem zusammen bist.', opp: 'c1_u21_23' },
  { id: 'c1_u21_23', ar: 'بِدُونِ', tr: 'bidūni', pos: 'Präposition', g: null, pl: null, de: ['ohne'], app: 'Du möchtest sagen, dass du etwas ohne Hilfe machst.', opp: 'c1_u21_22' },
  { id: 'c1_u21_24', ar: 'مِنْ أَجْلِ', tr: 'min ajli', pos: 'Präposition', g: null, pl: null, de: ['für', 'um ... zu'], app: 'Du möchtest sagen, dass du etwas für einen bestimmten Zweck tust.' },
  { id: 'c1_u21_25', ar: 'عَنْ', tr: 'ʿan', pos: 'Präposition', g: null, pl: null, de: ['über', 'von'], app: 'Du möchtest sagen, dass ihr über ein Thema sprecht (nicht räumlich).', conf: 'c1_prep_ueber' },
  { id: 'c1_u21_26', ar: 'قَبْلَ', tr: 'qabla', pos: 'Präposition', g: null, pl: null, de: ['vor', 'vorher'], app: 'Du möchtest sagen, dass etwas zeitlich vor einem Ereignis passiert (nicht räumlich).', opp: 'c1_u21_27', conf: 'c1_prep_vor' },
  { id: 'c1_u21_27', ar: 'بَعْدَ', tr: 'baʿda', pos: 'Präposition', g: null, pl: null, de: ['nach', 'danach'], app: 'Du möchtest sagen, dass etwas zeitlich nach einem Ereignis passiert.', opp: 'c1_u21_26' },
  { id: 'c1_u21_28', ar: 'خِلَالَ', tr: 'khilāla', pos: 'Präposition', g: null, pl: null, de: ['während', 'innerhalb'], app: 'Du möchtest sagen, dass etwas während eines Zeitraums passiert.' },
  { id: 'c1_u21_29', ar: 'مُقَابِلَ', tr: 'muqābila', pos: 'Präposition', g: null, pl: null, de: ['gegenüber'], app: 'Du möchtest sagen, dass sich etwas gegenüber von etwas anderem befindet.' },
  { id: 'c1_u21_30', ar: 'اِتِّجَاه', tr: 'ittijāh', pos: 'Substantiv', g: 'maskulin', pl: 'اِتِّجَاهَات', de: ['Richtung'], app: 'Du möchtest nach der richtigen Richtung fragen.' }
];

const UNIT_22 = [
  { id: 'c1_u22_01', ar: 'تَذْكِرَة', tr: 'tadhkira', pos: 'Substantiv', g: 'feminin', pl: 'تَذَاكِر', de: ['Fahrkarte', 'Ticket'], app: 'Du möchtest eine Fahrkarte für den Zug kaufen.', conf: 'c1_travel_documents' },
  { id: 'c1_u22_02', ar: 'جَوَاز سَفَر', tr: 'jawāz safar', pos: 'Substantiv', g: 'maskulin', pl: null, de: ['Reisepass'], app: 'Du zeigst dieses Dokument am Flughafen vor.', conf: 'c1_travel_documents' },
  { id: 'c1_u22_03', ar: 'تَأْشِيرَة', tr: 'taʾshīra', pos: 'Substantiv', g: 'feminin', pl: 'تَأْشِيرَات', de: ['Visum'], app: 'Du brauchst dieses Dokument für die Einreise in manche Länder.', conf: 'c1_travel_documents' },
  { id: 'c1_u22_04', ar: 'أَمْتِعَة', tr: 'amtiʿa', pos: 'Substantiv (Pluraletantum)', g: null, pl: null, de: ['Gepäck'], app: 'Du gibst dieses am Flughafen-Schalter ab.' },
  { id: 'c1_u22_05', ar: 'حَقِيبَة سَفَر', tr: 'ḥaqībat safar', pos: 'Substantiv', g: 'feminin', pl: null, de: ['Koffer', 'Reisetasche'], app: 'Du packst deine Kleidung für die Reise hinein.' },
  { id: 'c1_u22_06', ar: 'رِحْلَة', tr: 'riḥla', pos: 'Substantiv', g: 'feminin', pl: 'رِحْلَات', de: ['Reise', 'Fahrt'], app: 'Du planst eine Reise in ein anderes Land.' },
  { id: 'c1_u22_07', ar: 'سَائِح', tr: 'sāʾiḥ', pos: 'Substantiv', g: 'maskulin', pl: 'سُيَّاح', de: ['Tourist'], app: 'Diese Person besucht ein Land zum Vergnügen.' },
  { id: 'c1_u22_08', ar: 'حَجْز', tr: 'ḥajz', pos: 'Substantiv', g: 'maskulin', pl: 'حُجُوزَات', de: ['Reservierung'], app: 'Du möchtest ein Hotelzimmer im Voraus buchen.', conf: 'c1_travel_documents' },
  { id: 'c1_u22_09', ar: 'اِسْتِقْبَال', tr: 'istiqbāl', pos: 'Substantiv', g: 'maskulin', pl: null, de: ['Rezeption', 'Empfang'], app: 'Du meldest dich hier bei der Ankunft im Hotel.', conf: 'c1_hotel_vocab' },
  { id: 'c1_u22_10', ar: 'مِفْتَاح الْغُرْفَة', tr: 'miftāḥ al-ghurfa', pos: 'Substantiv', g: 'maskulin', pl: null, de: ['Zimmerschlüssel'], app: 'Damit schließt du dein Hotelzimmer auf.', conf: 'c1_hotel_vocab' },
  { id: 'c1_u22_11', ar: 'غُرْفَة مُفْرَدَة', tr: 'ghurfa mufrada', pos: 'Substantiv', g: 'feminin', pl: null, de: ['Einzelzimmer'], app: 'Du buchst ein Hotelzimmer nur für dich allein.', conf: 'c1_hotel_vocab' },
  { id: 'c1_u22_12', ar: 'غُرْفَة مُزْدَوِجَة', tr: 'ghurfa muzdawija', pos: 'Substantiv', g: 'feminin', pl: null, de: ['Doppelzimmer'], app: 'Du buchst ein Hotelzimmer für zwei Personen.', conf: 'c1_hotel_vocab' },
  { id: 'c1_u22_13', ar: 'مُغَادَرَة', tr: 'mughādara', pos: 'Substantiv', g: 'feminin', pl: null, de: ['Abfahrt', 'Abreise'], app: 'Du fragst nach der Uhrzeit der Abfahrt.', opp: 'c1_u22_14' },
  { id: 'c1_u22_14', ar: 'وُصُول', tr: 'wuṣūl', pos: 'Substantiv', g: 'maskulin', pl: null, de: ['Ankunft'], app: 'Du fragst nach der Uhrzeit der Ankunft.', opp: 'c1_u22_13' },
  { id: 'c1_u22_15', ar: 'رَصِيف الْقِطَار', tr: 'raṣīf al-qiṭār', pos: 'Substantiv', g: 'maskulin', pl: null, de: ['Bahnsteig'], app: 'Hier wartest du auf den einfahrenden Zug.' },
  { id: 'c1_u22_16', ar: 'بَوَّابَة', tr: 'bawwāba', pos: 'Substantiv', g: 'feminin', pl: 'بَوَّابَات', de: ['Gate', 'Tor'], app: 'Du gehst am Flughafen zu diesem Ausgang, um zu deinem Flugzeug zu gelangen.' },
  { id: 'c1_u22_17', ar: 'مَقْعَد', tr: 'maqʿad', pos: 'Substantiv', g: 'maskulin', pl: 'مَقَاعِد', de: ['Sitzplatz'], app: 'Du suchst deinen reservierten Platz im Zug.' },
  { id: 'c1_u22_18', ar: 'طَرِيق', tr: 'ṭarīq', pos: 'Substantiv', g: 'maskulin', pl: 'طُرُق', de: ['Straße/Weg (Route)', 'Weg'], app: 'Du fragst nach dem schnellsten Weg zum Bahnhof.' },
  { id: 'c1_u22_19', ar: 'خَرِيطَة', tr: 'kharīṭa', pos: 'Substantiv', g: 'feminin', pl: 'خَرَائِط', de: ['Landkarte', 'Karte'], app: 'Du schaust auf dieses Papier, um den Weg zu finden.' },
  { id: 'c1_u22_20', ar: 'مَوْقِف الْحَافِلَة', tr: 'mawqif al-ḥāfila', pos: 'Substantiv', g: 'maskulin', pl: null, de: ['Bushaltestelle'], app: 'Hier wartest du auf den Bus.' },
  { id: 'c1_u22_21', ar: 'سَيَّارَة أُجْرَة', tr: 'sayyārat ujra', pos: 'Substantiv', g: 'feminin', pl: null, de: ['Taxi'], app: 'Du rufst dieses Fahrzeug, um schnell irgendwohin zu kommen.' },
  { id: 'c1_u22_22', ar: 'مِتْرُو', tr: 'mitrū', pos: 'Substantiv', g: 'maskulin', pl: null, de: ['U-Bahn', 'Metro'], app: 'Du fährst mit diesem Verkehrsmittel unter der Stadt entlang.' },
  { id: 'c1_u22_23', ar: 'قَارِب', tr: 'qārib', pos: 'Substantiv', g: 'maskulin', pl: 'قَوَارِب', de: ['Boot'], app: 'Mit diesem kleinen Wasserfahrzeug überquerst du den Fluss.' },
  { id: 'c1_u22_24', ar: 'رِحْلَة جَوِّيَّة', tr: 'riḥla jawwiyya', pos: 'Substantiv', g: 'feminin', pl: null, de: ['Flug'], app: 'Du buchst einen Platz auf diesem Flugzeug-Flug.' }
];

const UNIT_23 = [
  { id: 'c1_u23_01', ar: 'صَفّ', tr: 'ṣaff', pos: 'Substantiv', g: 'maskulin', pl: 'صُفُوف', de: ['Klasse', 'Unterrichtsraum'], app: 'Du betrittst diesen Raum, um am Unterricht teilzunehmen.' },
  { id: 'c1_u23_02', ar: 'تِلْمِيذ', tr: 'tilmīdh', pos: 'Substantiv', g: 'maskulin', pl: 'تَلَامِيذ', de: ['Schüler'], app: 'Diese Person besucht die Schule, um zu lernen.' },
  { id: 'c1_u23_03', ar: 'كِتَاب', tr: 'kitāb', pos: 'Substantiv', g: 'maskulin', pl: 'كُتُب', de: ['Buch'], app: 'Du liest darin, um etwas Neues zu lernen.', conf: 'c1_writing_tools' },
  { id: 'c1_u23_04', ar: 'دَفْتَر', tr: 'daftar', pos: 'Substantiv', g: 'maskulin', pl: 'دَفَاتِر', de: ['Heft', 'Notizbuch'], app: 'Du schreibst deine Notizen während des Unterrichts hinein.', conf: 'c1_writing_tools' },
  { id: 'c1_u23_05', ar: 'قَلَم', tr: 'qalam', pos: 'Substantiv', g: 'maskulin', pl: 'أَقْلَام', de: ['Stift', 'Kugelschreiber'], app: 'Damit schreibst du in dein Heft.', conf: 'c1_writing_tools' },
  { id: 'c1_u23_06', ar: 'قَلَم رَصَاص', tr: 'qalam raṣāṣ', pos: 'Substantiv', g: 'maskulin', pl: null, de: ['Bleistift'], app: 'Damit kannst du schreiben und wieder ausradieren.', conf: 'c1_writing_tools' },
  { id: 'c1_u23_07', ar: 'وَرَقَة', tr: 'waraqa', pos: 'Substantiv', g: 'feminin', pl: 'أَوْرَاق', de: ['Blatt Papier'], app: 'Du schreibst deine Antwort auf ein leeres Blatt.', conf: 'c1_writing_tools' },
  { id: 'c1_u23_08', ar: 'تَمْرِين', tr: 'tamrīn', pos: 'Substantiv', g: 'maskulin', pl: 'تَمَارِين', de: ['Übung'], app: 'Der Lehrer gibt euch eine neue Übung zum Üben.' },
  { id: 'c1_u23_09', ar: 'وَاجِب مَنْزِلِيّ', tr: 'wājib manzilī', pos: 'Substantiv', g: 'maskulin', pl: null, de: ['Hausaufgabe'], app: 'Du machst diese Aufgabe zu Hause, nicht in der Schule.' },
  { id: 'c1_u23_10', ar: 'حِصَّة', tr: 'ḥiṣṣa', pos: 'Substantiv', g: 'feminin', pl: 'حِصَص', de: ['Unterrichtsstunde'], app: 'Der Stundenplan zeigt dir, wann diese Stunde beginnt.' },
  { id: 'c1_u23_11', ar: 'مَادَّة', tr: 'mādda', pos: 'Substantiv', g: 'feminin', pl: 'مَوَادّ', de: ['Schulfach', 'Stoff'], app: 'Mathematik ist ein Beispiel für dieses Schulfach.' },
  { id: 'c1_u23_12', ar: 'رِيَاضِيَّات', tr: 'riyāḍiyyāt', pos: 'Substantiv (Pluraletantum)', g: 'feminin', pl: null, de: ['Mathematik'], app: 'In diesem Fach lernst du rechnen.', conf: 'c1_school_subjects' },
  { id: 'c1_u23_13', ar: 'عُلُوم', tr: 'ʿulūm', pos: 'Substantiv (Pluraletantum)', g: 'maskulin', pl: null, de: ['Naturwissenschaften'], app: 'In diesem Fach lernst du über die Natur.', conf: 'c1_school_subjects' },
  { id: 'c1_u23_14', ar: 'تَارِيخ', tr: 'tārīkh', pos: 'Substantiv', g: 'maskulin', pl: 'تَوَارِيخ', de: ['Geschichte'], app: 'In diesem Fach lernst du über vergangene Ereignisse.', conf: 'c1_school_subjects' },
  { id: 'c1_u23_15', ar: 'جُغْرَافْيَا', tr: 'jughrāfiyā', pos: 'Substantiv', g: 'feminin', pl: null, de: ['Geografie'], app: 'In diesem Fach lernst du über Länder und Karten.', conf: 'c1_school_subjects' },
  { id: 'c1_u23_16', ar: 'سُؤَال', tr: 'suʾāl', pos: 'Substantiv', g: 'maskulin', pl: 'أَسْئِلَة', de: ['Frage'], app: 'Der Lehrer stellt dir diese, und du sollst sie beantworten.', opp: 'c1_u23_17' },
  { id: 'c1_u23_17', ar: 'جَوَاب', tr: 'jawāb', pos: 'Substantiv', g: 'maskulin', pl: 'أَجْوِبَة', de: ['Antwort'], app: 'Du gibst diese auf eine Frage.', opp: 'c1_u23_16' },
  { id: 'c1_u23_18', ar: 'دَرَجَة', tr: 'daraja', pos: 'Substantiv', g: 'feminin', pl: 'دَرَجَات', de: ['Note (Schule)', 'Punktzahl'], app: 'Du bekommst diese nach einer Prüfung als Bewertung.' },
  { id: 'c1_u23_19', ar: 'اِسْتِرَاحَة', tr: 'istirāḥa', pos: 'Substantiv', g: 'feminin', pl: 'اِسْتِرَاحَات', de: ['Pause'], app: 'Zwischen zwei Unterrichtsstunden hast du diese kurze Zeit zum Ausruhen.' },
  { id: 'c1_u23_20', ar: 'سَنَة دِرَاسِيَّة', tr: 'sana dirāsiyya', pos: 'Substantiv', g: 'feminin', pl: null, de: ['Schuljahr'], app: 'Dieser Zeitraum beginnt im Herbst und endet im Sommer.' },
  { id: 'c1_u23_21', ar: 'صَفْحَة', tr: 'ṣafḥa', pos: 'Substantiv', g: 'feminin', pl: 'صَفَحَات', de: ['Seite'], app: 'Der Lehrer sagt euch, welche Seite im Buch ihr aufschlagen sollt.' },
  { id: 'c1_u23_22', ar: 'مِقَصّ', tr: 'miqaṣṣ', pos: 'Substantiv', g: 'maskulin', pl: 'مَقَاصّ', de: ['Schere'], app: 'Damit schneidest du Papier.' },
  { id: 'c1_u23_23', ar: 'صَمْغ', tr: 'ṣamgh', pos: 'Substantiv', g: 'maskulin', pl: null, de: ['Klebstoff'], app: 'Damit klebst du zwei Blätter Papier zusammen.' },
  { id: 'c1_u23_24', ar: 'قَامُوس', tr: 'qāmūs', pos: 'Substantiv', g: 'maskulin', pl: 'قَوَامِيس', de: ['Wörterbuch'], app: 'Darin schlägst du die Bedeutung eines unbekannten Wortes nach.' },
  { id: 'c1_u23_25', ar: 'مُخْتَبَر مَدْرَسِيّ', tr: 'mukhtabar madrasī', pos: 'Substantiv', g: 'maskulin', pl: null, de: ['Schullabor'], app: 'Hier macht ihr in der Schule naturwissenschaftliche Experimente.' },
  { id: 'c1_u23_26', ar: 'اِمْتِحَان شَفَوِيّ', tr: 'imtiḥān shafawī', pos: 'Substantiv', g: 'maskulin', pl: null, de: ['mündliche Prüfung'], app: 'Bei dieser Prüfung sprichst du, statt etwas aufzuschreiben.' }
];

const UNIT_24 = [
  { id: 'c1_u24_01', ar: 'كُلِّيَّة', tr: 'kulliyya', pos: 'Substantiv', g: 'feminin', pl: 'كُلِّيَّات', de: ['Fakultät'], app: 'Deine Universität ist in mehrere solcher Bereiche eingeteilt.' },
  { id: 'c1_u24_02', ar: 'قِسْم', tr: 'qism', pos: 'Substantiv', g: 'maskulin', pl: 'أَقْسَام', de: ['Fachbereich', 'Abteilung'], app: 'Innerhalb einer Fakultät gibt es mehrere solcher Bereiche.' },
  { id: 'c1_u24_03', ar: 'حَرَم جَامِعِيّ', tr: 'ḥaram jāmiʿī', pos: 'Substantiv', g: 'maskulin', pl: null, de: ['Campus'], app: 'Das gesamte Gelände der Universität wird so genannt.' },
  { id: 'c1_u24_04', ar: 'فَصْل دِرَاسِيّ', tr: 'faṣl dirāsī', pos: 'Substantiv', g: 'maskulin', pl: null, de: ['Semester'], app: 'Ein Studienjahr besteht meist aus zwei solcher Abschnitte.' },
  { id: 'c1_u24_05', ar: 'مُقَرَّر', tr: 'muqarrar', pos: 'Substantiv', g: 'maskulin', pl: 'مُقَرَّرَات', de: ['Kurs', 'Lehrveranstaltung'], app: 'Du meldest dich für diese einzelne Lehrveranstaltung an.', conf: 'c1_uni_grading' },
  { id: 'c1_u24_06', ar: 'وَحْدَة دِرَاسِيَّة', tr: 'waḥda dirāsiyya', pos: 'Substantiv', g: 'feminin', pl: null, de: ['Modul'], app: 'Mehrere Kurse zusammen ergeben diese größere Studieneinheit.' },
  { id: 'c1_u24_07', ar: 'دَرَجَة عِلْمِيَّة', tr: 'daraja ʿilmiyya', pos: 'Substantiv', g: 'feminin', pl: null, de: ['akademischer Abschluss'], app: 'Nach erfolgreichem Studium bekommst du diesen Titel.', conf: 'c1_academic_degrees' },
  { id: 'c1_u24_08', ar: 'بَكَالُورْيُوس', tr: 'bakālūriyūs', pos: 'Substantiv', g: 'maskulin', pl: null, de: ['Bachelor'], app: 'Dies ist normalerweise dein erster akademischer Abschluss.', conf: 'c1_academic_degrees' },
  { id: 'c1_u24_09', ar: 'مَاجِسْتِير', tr: 'mājistīr', pos: 'Substantiv', g: 'maskulin', pl: null, de: ['Master'], app: 'Diesen Abschluss machst du meist nach dem Bachelor.', conf: 'c1_academic_degrees' },
  { id: 'c1_u24_10', ar: 'دُكْتُورَاه', tr: 'duktūrāh', pos: 'Substantiv', g: 'feminin', pl: null, de: ['Doktorgrad', 'Promotion'], app: 'Diesen Titel bekommst du nach einer eigenen Forschungsarbeit.', conf: 'c1_academic_degrees' },
  { id: 'c1_u24_11', ar: 'أُطْرُوحَة', tr: 'uṭrūḥa', pos: 'Substantiv', g: 'feminin', pl: 'أُطْرُوحَات', de: ['Abschlussarbeit', 'Dissertation'], app: 'Am Ende deines Studiums schreibst du diese lange Arbeit.' },
  { id: 'c1_u24_12', ar: 'بَحْث', tr: 'baḥth', pos: 'Substantiv', g: 'maskulin', pl: 'أَبْحَاث', de: ['Forschung', 'wissenschaftliche Arbeit'], app: 'Professoren betreiben dies, um neues Wissen zu schaffen.' },
  { id: 'c1_u24_13', ar: 'مَشْرُوع', tr: 'mashrūʿ', pos: 'Substantiv', g: 'maskulin', pl: 'مَشَارِيع', de: ['Projekt'], app: 'Du arbeitest mit anderen Studierenden gemeinsam daran.' },
  { id: 'c1_u24_14', ar: 'مُخْتَبَر', tr: 'mukhtabar', pos: 'Substantiv', g: 'maskulin', pl: 'مَخَابِر', de: ['Labor'], app: 'Hier führst du wissenschaftliche Experimente durch.' },
  { id: 'c1_u24_15', ar: 'تَكْلِيف', tr: 'taklīf', pos: 'Substantiv', g: 'maskulin', pl: 'تَكَالِيف', de: ['Aufgabe (Studium)', 'Studienleistung'], app: 'Der Professor gibt dir diese Aufgabe bis zur nächsten Woche.', conf: 'c1_uni_grading' },
  { id: 'c1_u24_16', ar: 'عَلَامَة', tr: 'ʿalāma', pos: 'Substantiv', g: 'feminin', pl: 'عَلَامَات', de: ['Note (Universität)', 'Bewertung'], app: 'Du bekommst diese nach einer Prüfung an der Universität.', conf: 'c1_uni_grading' },
  { id: 'c1_u24_17', ar: 'نَتِيجَة', tr: 'natīja', pos: 'Substantiv', g: 'feminin', pl: 'نَتَائِج', de: ['Ergebnis'], app: 'Du wartest gespannt auf dieses nach der Prüfung.', conf: 'c1_uni_grading' },
  { id: 'c1_u24_18', ar: 'جَدْوَل', tr: 'jadwal', pos: 'Substantiv', g: 'maskulin', pl: 'جَدَاوِل', de: ['Stundenplan', 'Zeitplan'], app: 'Du schaust hier nach, wann deine nächste Vorlesung beginnt.' },
  { id: 'c1_u24_19', ar: 'تَسْجِيل', tr: 'tasjīl', pos: 'Substantiv', g: 'maskulin', pl: 'تَسْجِيلَات', de: ['Anmeldung', 'Registrierung'], app: 'Du musst dies vor Beginn des Semesters erledigen.' },
  { id: 'c1_u24_20', ar: 'قَبُول', tr: 'qubūl', pos: 'Substantiv', g: 'maskulin', pl: null, de: ['Zulassung'], app: 'Du brauchst dies, um an dieser Universität studieren zu dürfen.' },
  { id: 'c1_u24_21', ar: 'مِنْحَة', tr: 'minḥa', pos: 'Substantiv', g: 'feminin', pl: 'مِنَح', de: ['Stipendium'], app: 'Du bekommst dieses Geld, um dein Studium zu finanzieren.' },
  { id: 'c1_u24_22', ar: 'شَهَادَة', tr: 'shahāda', pos: 'Substantiv', g: 'feminin', pl: 'شَهَادَات', de: ['Zeugnis', 'Zertifikat'], app: 'Nach dem Studium bekommst du dieses offizielle Dokument.' },
  { id: 'c1_u24_23', ar: 'خِرِّيج', tr: 'khirrīj', pos: 'Substantiv', g: 'maskulin', pl: 'خِرِّيجُون', de: ['Absolvent'], app: 'Diese Person hat ihr Studium bereits erfolgreich abgeschlossen.' }
];

const UNIT_25 = [
  { id: 'c1_u25_01', ar: 'وَظِيفَة', tr: 'waẓīfa', pos: 'Substantiv', g: 'feminin', pl: 'وَظَائِف', de: ['Arbeitsstelle', 'Job'], app: 'Du suchst diese, um Geld zu verdienen.' },
  { id: 'c1_u25_02', ar: 'شَرِكَة', tr: 'sharika', pos: 'Substantiv', g: 'feminin', pl: 'شَرِكَات', de: ['Firma', 'Unternehmen'], app: 'Du arbeitest für diese Organisation.' },
  { id: 'c1_u25_03', ar: 'مُوَظَّف', tr: 'muwaẓẓaf', pos: 'Substantiv', g: 'maskulin', pl: 'مُوَظَّفُون', de: ['Angestellter', 'Mitarbeiter'], app: 'Diese Person arbeitet für eine Firma.', opp: 'c1_u25_04', conf: 'c1_workplace_people' },
  { id: 'c1_u25_04', ar: 'صَاحِب عَمَل', tr: 'ṣāḥib ʿamal', pos: 'Substantiv', g: 'maskulin', pl: null, de: ['Arbeitgeber'], app: 'Diese Person stellt andere Menschen ein.', opp: 'c1_u25_03', conf: 'c1_workplace_people' },
  { id: 'c1_u25_05', ar: 'مُدِير', tr: 'mudīr', pos: 'Substantiv', g: 'maskulin', pl: 'مُدَرَاء', de: ['Manager', 'Leiter'], app: 'Diese Person leitet eine Abteilung.', conf: 'c1_workplace_people' },
  { id: 'c1_u25_06', ar: 'رَئِيس', tr: 'raʾīs', pos: 'Substantiv', g: 'maskulin', pl: 'رُؤَسَاء', de: ['Chef', 'Vorgesetzter'], app: 'Diese Person entscheidet in deinem Team.', conf: 'c1_workplace_people' },
  { id: 'c1_u25_07', ar: 'زَمِيل عَمَل', tr: 'zamīl ʿamal', pos: 'Substantiv', g: 'maskulin', pl: null, de: ['Arbeitskollege'], app: 'Diese Person arbeitet mit dir in derselben Firma.', conf: 'c1_workplace_people' },
  { id: 'c1_u25_08', ar: 'اِجْتِمَاع', tr: 'ijtimāʿ', pos: 'Substantiv', g: 'maskulin', pl: 'اِجْتِمَاعَات', de: ['Besprechung', 'Meeting'], app: 'Du triffst dich mit deinen Kollegen, um über die Arbeit zu sprechen.' },
  { id: 'c1_u25_09', ar: 'رَاتِب', tr: 'rātib', pos: 'Substantiv', g: 'maskulin', pl: 'رَوَاتِب', de: ['Gehalt'], app: 'Du bekommst dieses Geld für deine Arbeit.' },
  { id: 'c1_u25_10', ar: 'عَقْد', tr: 'ʿaqd', pos: 'Substantiv', g: 'maskulin', pl: 'عُقُود', de: ['Vertrag'], app: 'Du unterschreibst dieses Dokument, bevor du eine neue Stelle antrittst.' },
  { id: 'c1_u25_11', ar: 'سَاعَات الْعَمَل', tr: 'sāʿāt al-ʿamal', pos: 'Substantiv', g: 'feminin', pl: null, de: ['Arbeitszeit'], app: 'Du fragst, wie viele Stunden am Tag du arbeiten musst.' },
  { id: 'c1_u25_12', ar: 'إِجَازَة', tr: 'ijāza', pos: 'Substantiv', g: 'feminin', pl: 'إِجَازَات', de: ['Urlaub'], app: 'Du nimmst dir diese freie Zeit von der Arbeit.' },
  { id: 'c1_u25_13', ar: 'بَرِيد إِلِكْتْرُونِيّ', tr: 'barīd iliktrūnī', pos: 'Substantiv', g: 'maskulin', pl: null, de: ['E-Mail'], app: 'Du schickst deinem Kollegen eine Nachricht auf diesem Weg.' },
  { id: 'c1_u25_14', ar: 'مُكَالَمَة', tr: 'mukālama', pos: 'Substantiv', g: 'feminin', pl: 'مُكَالَمَات', de: ['Anruf', 'Telefonat'], app: 'Du sprichst mit einem Kunden am Telefon.' },
  { id: 'c1_u25_15', ar: 'مُهِمَّة', tr: 'muhimma', pos: 'Substantiv', g: 'feminin', pl: 'مَهَامّ', de: ['Aufgabe (Arbeit)'], app: 'Dein Chef gibt dir diese Aufgabe für heute.' },
  { id: 'c1_u25_16', ar: 'مَوْعِد نِهَائِيّ', tr: 'mawʿid nihāʾī', pos: 'Substantiv', g: 'maskulin', pl: null, de: ['Frist', 'Deadline'], app: 'Bis zu diesem Zeitpunkt muss die Aufgabe fertig sein.' },
  { id: 'c1_u25_17', ar: 'خِبْرَة', tr: 'khibra', pos: 'Substantiv', g: 'feminin', pl: 'خِبْرَات', de: ['Erfahrung'], app: 'Du sammelst dies über viele Jahre Arbeit.' },
  { id: 'c1_u25_18', ar: 'مَهَارَة', tr: 'mahāra', pos: 'Substantiv', g: 'feminin', pl: 'مَهَارَات', de: ['Fähigkeit'], app: 'Du beschreibst, was du besonders gut kannst.' },
  { id: 'c1_u25_19', ar: 'طَلَب تَوْظِيف', tr: 'ṭalab tawẓīf', pos: 'Substantiv', g: 'maskulin', pl: null, de: ['Bewerbung'], app: 'Du schickst dieses Dokument, um dich für eine Stelle zu bewerben.', conf: 'c1_job_application' },
  { id: 'c1_u25_20', ar: 'مُقَابَلَة عَمَل', tr: 'muqābalat ʿamal', pos: 'Substantiv', g: 'feminin', pl: null, de: ['Vorstellungsgespräch'], app: 'Bei diesem Gespräch lernt dich der Arbeitgeber persönlich kennen.', conf: 'c1_job_application' },
  { id: 'c1_u25_21', ar: 'سِيرَة ذَاتِيَّة', tr: 'sīra dhātiyya', pos: 'Substantiv', g: 'feminin', pl: null, de: ['Lebenslauf'], app: 'Du schickst dieses Dokument zusammen mit deiner Bewerbung.', conf: 'c1_job_application' },
  { id: 'c1_u25_22', ar: 'مِهْنَة', tr: 'mihna', pos: 'Substantiv', g: 'feminin', pl: 'مِهَن', de: ['Beruf', 'Karriere'], app: 'Du beschreibst, was du beruflich machst.' },
  { id: 'c1_u25_23', ar: 'مُسْتَوْدَع', tr: 'mustawdaʿ', pos: 'Substantiv', g: 'maskulin', pl: 'مُسْتَوْدَعَات', de: ['Lager', 'Lagerhaus'], app: 'Hier werden Waren einer Firma aufbewahrt.' }
];

module.exports = { UNIT_21, UNIT_22, UNIT_23, UNIT_24, UNIT_25 };
