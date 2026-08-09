// Kurs 1, Units 26-30 — vollständiges Datenmodell für die 117 letzten unvollständigen Wörter
// dieses Batches (Entwicklungsauftrag 11, Batch 6 — schließt Kurs 1 strukturell ab). Gleiche
// Feldkürzel/Konventionen wie kurs1Units21to25Full.js: ar = arabisch vokalisiert, tr =
// Transliteration, pos = Wortart (aus dem zentralen deutschsprachigen Wortarten-Vokabular, siehe
// scripts/validateCourse.js KNOWN_PART_OF_SPEECH — inkl. der in dieser Runde neu ergänzten Werte
// "Konjunktion", "Partikel", "Pronomen (Demonstrativ)", "Pronomen (Indefinit)"), g = Genus,
// pl = Plural vokalisiert (oder null), de = Array deutscher Antworten, app = Kontext-Satz für
// application_prompts, opp = ID des Gegensatzworts (gegenseitig verknüpft), conf =
// confusion_group-Name (nur bei didaktischem Nutzen), homonymGroup = optionales
// homonym_group-Tag.
//
// Umschrift-Konvention (unverändert seit Entwicklungsauftrag 6-10): Langvokale mit Makron
// (ā ī ū), Hamza ʾ, ʿAyn ʿ, emphatische Konsonanten mit Punkt (ḥ ṣ ḍ ṭ ẓ), digraphische
// sh/kh/gh/th/dh (NICHT š/ḫ/ġ/ṯ/ḏ).
//
// Unit 30 (Fragewörter/Konnektoren/Funktionswörter) verlangt laut Auftrag besonders sorgfältige
// Theorie mit kurzen Beispielsätzen statt reiner Vokabelgleichungen — die application_prompts
// dieser Unit sind deshalb bewusst als vollständige, situative Mini-Sätze formuliert.

const UNIT_26 = [
  { id: 'c1_u26_01', ar: 'لَوْحَة مَفَاتِيح', tr: 'lawḥat mafātīḥ', pos: 'Substantiv', g: 'feminin', pl: null, de: ['Tastatur'], app: 'Du tippst deinen Text mit diesem Gerät ein.', conf: 'c1_computer_parts' },
  { id: 'c1_u26_02', ar: 'فَأْرَة', tr: 'faʾra', pos: 'Substantiv', g: 'feminin', pl: 'فَأْرَات', de: ['Computermaus'], app: 'Damit bewegst du den Zeiger auf dem Bildschirm.', conf: 'c1_computer_parts' },
  { id: 'c1_u26_03', ar: 'طَابِعَة', tr: 'ṭābiʿa', pos: 'Substantiv', g: 'feminin', pl: 'طَابِعَات', de: ['Drucker'], app: 'Damit druckst du ein Dokument auf Papier aus.', conf: 'c1_computer_parts' },
  { id: 'c1_u26_04', ar: 'مَلَفّ', tr: 'malaff', pos: 'Substantiv', g: 'maskulin', pl: 'مِلَفَّات', de: ['Datei'], app: 'Du speicherst dein Dokument als einzelne Datei.', conf: 'c1_files_docs' },
  { id: 'c1_u26_05', ar: 'مُجَلَّد', tr: 'mujallad', pos: 'Substantiv', g: 'maskulin', pl: 'مُجَلَّدَات', de: ['Ordner'], app: 'Du sortierst mehrere Dateien in diesen Ordner.', conf: 'c1_files_docs' },
  { id: 'c1_u26_06', ar: 'مُسْتَنَد', tr: 'mustanad', pos: 'Substantiv', g: 'maskulin', pl: 'مُسْتَنَدَات', de: ['Dokument'], app: 'Du öffnest dieses wichtige Dokument am Computer.', conf: 'c1_files_docs' },
  { id: 'c1_u26_07', ar: 'كَلِمَة مُرُور', tr: 'kalimat murūr', pos: 'Substantiv', g: 'feminin', pl: null, de: ['Passwort'], app: 'Du gibst dieses geheime Wort ein, um dich anzumelden.', conf: 'c1_account_security' },
  { id: 'c1_u26_08', ar: 'اِسْم مُسْتَخْدِم', tr: 'ism mustakhdim', pos: 'Substantiv', g: 'maskulin', pl: null, de: ['Benutzername'], app: 'Du gibst diesen Namen zusammen mit deinem Passwort ein.', conf: 'c1_account_security' },
  { id: 'c1_u26_09', ar: 'مَوْقِع إِلِكْتْرُونِيّ', tr: 'mawqiʿ iliktrūnī', pos: 'Substantiv', g: 'maskulin', pl: null, de: ['Webseite'], app: 'Du besuchst diese Adresse im Internet.' },
  { id: 'c1_u26_10', ar: 'مُتَصَفِّح', tr: 'mutaṣaffiḥ', pos: 'Substantiv', g: 'maskulin', pl: 'مُتَصَفِّحَات', de: ['Browser'], app: 'Mit diesem Programm öffnest du Webseiten.' },
  { id: 'c1_u26_11', ar: 'تَنْزِيل', tr: 'tanzīl', pos: 'Substantiv', g: 'maskulin', pl: null, de: ['Download', 'Herunterladen'], app: 'Du speicherst eine Datei aus dem Internet auf deinem Gerät.', opp: 'c1_u26_12' },
  { id: 'c1_u26_12', ar: 'رَفْع', tr: 'rafʿ', pos: 'Substantiv', g: 'maskulin', pl: null, de: ['Upload', 'Hochladen'], app: 'Du sendest eine Datei von deinem Gerät ins Internet.', opp: 'c1_u26_11' },
  { id: 'c1_u26_13', ar: 'رَابِط', tr: 'rābiṭ', pos: 'Substantiv', g: 'maskulin', pl: 'رَوَابِط', de: ['Link'], app: 'Du klickst darauf, um zu einer anderen Webseite zu gelangen.' },
  { id: 'c1_u26_14', ar: 'رِسَالَة', tr: 'risāla', pos: 'Substantiv', g: 'feminin', pl: 'رَسَائِل', de: ['Nachricht'], app: 'Du schickst deinem Freund diese kurze Textnachricht.' },
  { id: 'c1_u26_15', ar: 'صُورَة', tr: 'ṣūra', pos: 'Substantiv', g: 'feminin', pl: 'صُوَر', de: ['Foto', 'Bild'], app: 'Du machst dieses mit deiner Handykamera.' },
  { id: 'c1_u26_16', ar: 'فِيدْيُو', tr: 'vidyū', pos: 'Substantiv', g: 'maskulin', pl: null, de: ['Video'], app: 'Du siehst dir diese bewegten Bilder mit Ton an.', conf: 'c1_audio_video_devices' },
  { id: 'c1_u26_17', ar: 'كَامِيرَا', tr: 'kāmirā', pos: 'Substantiv', g: 'feminin', pl: null, de: ['Kamera'], app: 'Mit diesem Gerät nimmst du Fotos oder Videos auf.', conf: 'c1_audio_video_devices' },
  { id: 'c1_u26_18', ar: 'مَيْكْرُوفُون', tr: 'mīkrūfūn', pos: 'Substantiv', g: 'maskulin', pl: null, de: ['Mikrofon'], app: 'Damit nimmst du deine Stimme auf.', conf: 'c1_audio_video_devices' },
  { id: 'c1_u26_19', ar: 'مُكَبِّر صَوْت', tr: 'mukabbir ṣawt', pos: 'Substantiv', g: 'maskulin', pl: null, de: ['Lautsprecher'], app: 'Damit hörst du Musik laut im Raum.', conf: 'c1_audio_video_devices' },
  { id: 'c1_u26_20', ar: 'سَمَّاعَات', tr: 'sammāʿāt', pos: 'Substantiv (Plural)', g: 'feminin', pl: null, de: ['Kopfhörer'], app: 'Damit hörst du Musik, ohne andere zu stören.', conf: 'c1_audio_video_devices' },
  { id: 'c1_u26_21', ar: 'بَطَّارِيَّة', tr: 'baṭṭāriyya', pos: 'Substantiv', g: 'feminin', pl: 'بَطَّارِيَّات', de: ['Batterie', 'Akku'], app: 'Dein Telefon braucht Energie aus diesem Teil.' },
  { id: 'c1_u26_22', ar: 'شَاحِن', tr: 'shāḥin', pos: 'Substantiv', g: 'maskulin', pl: 'شَوَاحِن', de: ['Ladegerät'], app: 'Damit füllst du die Batterie deines Telefons wieder auf.' },
  { id: 'c1_u26_23', ar: 'كَابِل', tr: 'kābil', pos: 'Substantiv', g: 'maskulin', pl: 'كَابِلَات', de: ['Kabel'], app: 'Du verbindest dein Telefon mit dem Ladegerät über dieses Teil.' },
  { id: 'c1_u26_24', ar: 'شَبَكَة', tr: 'shabaka', pos: 'Substantiv', g: 'feminin', pl: 'شَبَكَات', de: ['Netzwerk'], app: 'Dein Computer verbindet sich mit dem Internet über dieses.' },
  { id: 'c1_u26_25', ar: 'بَيَانَات', tr: 'bayānāt', pos: 'Substantiv (Pluraletantum)', g: 'feminin', pl: null, de: ['Daten'], app: 'Dein Programm speichert diese Informationen.' }
];

const UNIT_27 = [
  { id: 'c1_u27_01', ar: 'سَمَاء', tr: 'samāʾ', pos: 'Substantiv', g: 'feminin', pl: null, de: ['Himmel'], app: 'Du schaust nach oben und siehst Wolken und die Sonne.' },
  { id: 'c1_u27_02', ar: 'أَرْض', tr: 'arḍ', pos: 'Substantiv', g: 'feminin', pl: 'أَرَاضٍ', de: ['Erde', 'Boden'], app: 'Du stehst mit deinen Füßen darauf.' },
  { id: 'c1_u27_03', ar: 'بَحْر', tr: 'baḥr', pos: 'Substantiv', g: 'maskulin', pl: 'بِحَار', de: ['Meer'], app: 'Dieses große Gewässer ist salzig.', conf: 'c1_water_bodies' },
  { id: 'c1_u27_04', ar: 'نَهْر', tr: 'nahr', pos: 'Substantiv', g: 'maskulin', pl: 'أَنْهَار', de: ['Fluss'], app: 'Dieses Wasser fließt vom Berg bis zum Meer.', conf: 'c1_water_bodies' },
  { id: 'c1_u27_05', ar: 'بُحَيْرَة', tr: 'buḥayra', pos: 'Substantiv', g: 'feminin', pl: 'بُحَيْرَات', de: ['See'], app: 'Dieses Gewässer ist von Land umgeben, aber kleiner als ein Meer.', conf: 'c1_water_bodies' },
  { id: 'c1_u27_06', ar: 'جَبَل', tr: 'jabal', pos: 'Substantiv', g: 'maskulin', pl: 'جِبَال', de: ['Berg'], app: 'Du steigst diese hohe Erhebung hinauf.' },
  { id: 'c1_u27_07', ar: 'غَابَة', tr: 'ghāba', pos: 'Substantiv', g: 'feminin', pl: 'غَابَات', de: ['Wald'], app: 'Hier stehen sehr viele Bäume dicht beieinander.' },
  { id: 'c1_u27_08', ar: 'شَجَرَة', tr: 'shajara', pos: 'Substantiv', g: 'feminin', pl: 'أَشْجَار', de: ['Baum'], app: 'Dieses große Gewächs hat einen Stamm und Blätter.' },
  { id: 'c1_u27_09', ar: 'زَهْرَة', tr: 'zahra', pos: 'Substantiv', g: 'feminin', pl: 'زُهُور', de: ['Blume'], app: 'Diese Pflanze schenkst du jemandem, den du magst.' },
  { id: 'c1_u27_10', ar: 'عُشْب', tr: 'ʿushb', pos: 'Substantiv', g: 'maskulin', pl: null, de: ['Gras'], app: 'Dieses grüne Gewächs bedeckt den Boden im Park.' },
  { id: 'c1_u27_11', ar: 'رَمْل', tr: 'raml', pos: 'Substantiv', g: 'maskulin', pl: null, de: ['Sand'], app: 'Dieser feine Stoff bedeckt den Strand.' },
  { id: 'c1_u27_12', ar: 'صَحْرَاء', tr: 'ṣaḥrāʾ', pos: 'Substantiv', g: 'feminin', pl: 'صَحَارَى', de: ['Wüste'], app: 'Diese sehr trockene Landschaft besteht oft aus viel Sand.' },
  { id: 'c1_u27_13', ar: 'شَاطِئ', tr: 'shāṭiʾ', pos: 'Substantiv', g: 'maskulin', pl: 'شَوَاطِئ', de: ['Strand'], app: 'Hier liegst du im Sommer am Meer.' },
  { id: 'c1_u27_14', ar: 'هَوَاء', tr: 'hawāʾ', pos: 'Substantiv', g: 'maskulin', pl: null, de: ['Luft'], app: 'Du atmest dieses unsichtbare Gas ständig ein und aus.' },
  { id: 'c1_u27_15', ar: 'دَرَجَة الْحَرَارَة', tr: 'darajat al-ḥarāra', pos: 'Substantiv', g: 'feminin', pl: null, de: ['Temperatur (Wetter)'], app: 'Der Wetterbericht sagt dir, wie warm oder kalt es heute wird.', conf: 'c1_weather_vs_climate' },
  { id: 'c1_u27_16', ar: 'عَاصِفَة', tr: 'ʿāṣifa', pos: 'Substantiv', g: 'feminin', pl: 'عَوَاصِف', de: ['Sturm'], app: 'Bei diesem Wetter weht der Wind sehr stark.', conf: 'c1_storm_phenomena' },
  { id: 'c1_u27_17', ar: 'رَعْد', tr: 'raʿd', pos: 'Substantiv', g: 'maskulin', pl: null, de: ['Donner'], app: 'Dieses laute Geräusch hörst du kurz nach einem Blitz.', conf: 'c1_storm_phenomena' },
  { id: 'c1_u27_18', ar: 'بَرْق', tr: 'barq', pos: 'Substantiv', g: 'maskulin', pl: 'بُرُوق', de: ['Blitz'], app: 'Dieses helle Licht siehst du kurz vor dem Donner.', conf: 'c1_storm_phenomena' },
  { id: 'c1_u27_19', ar: 'ضَبَاب', tr: 'ḍabāb', pos: 'Substantiv', g: 'maskulin', pl: null, de: ['Nebel'], app: 'Bei diesem Wetter siehst du nur sehr wenig weit.', conf: 'c1_storm_phenomena' },
  { id: 'c1_u27_20', ar: 'مُنَاخ', tr: 'munākh', pos: 'Substantiv', g: 'maskulin', pl: null, de: ['Klima'], app: 'Dieses Wort beschreibt das typische Wetter einer Region über viele Jahre.', conf: 'c1_weather_vs_climate' },
  { id: 'c1_u27_21', ar: 'بِيئَة', tr: 'bīʾa', pos: 'Substantiv', g: 'feminin', pl: null, de: ['Umwelt'], app: 'Wir sollten diese gemeinsame Natur um uns herum schützen.', conf: 'c1_weather_vs_climate' },
  { id: 'c1_u27_22', ar: 'تَلَوُّث', tr: 'talawwuth', pos: 'Substantiv', g: 'maskulin', pl: null, de: ['Verschmutzung'], app: 'Abgase und Müll verursachen dies in der Umwelt.' },
  { id: 'c1_u27_23', ar: 'إِعَادَة تَدْوِير', tr: 'iʿādat tadwīr', pos: 'Substantiv', g: 'feminin', pl: null, de: ['Recycling'], app: 'Du trennst deinen Müll, damit er wiederverwendet werden kann.' }
];

const UNIT_28 = [
  { id: 'c1_u28_01', ar: 'خَرُوف', tr: 'kharūf', pos: 'Substantiv', g: 'maskulin', pl: 'خِرْفَان', de: ['Schaf'], app: 'Dieses wollige Tier lebt auf einer Weide.', conf: 'c1_farm_animals' },
  { id: 'c1_u28_02', ar: 'مَاعِز', tr: 'māʿiz', pos: 'Substantiv', g: 'feminin', pl: null, de: ['Ziege'], app: 'Dieses Tier klettert gerne auf Felsen und frisst fast alles.', conf: 'c1_farm_animals' },
  { id: 'c1_u28_03', ar: 'جَمَل', tr: 'jamal', pos: 'Substantiv', g: 'maskulin', pl: 'جِمَال', de: ['Kamel'], app: 'Dieses Tier trägt schwere Lasten durch die Wüste.', conf: 'c1_farm_animals' },
  { id: 'c1_u28_04', ar: 'حِمَار', tr: 'ḥimār', pos: 'Substantiv', g: 'maskulin', pl: 'حَمِير', de: ['Esel'], app: 'Dieses Tier ähnelt einem kleinen Pferd und trägt Lasten.', conf: 'c1_farm_animals' },
  { id: 'c1_u28_05', ar: 'فِيل', tr: 'fīl', pos: 'Substantiv', g: 'maskulin', pl: 'أَفْيَال', de: ['Elefant'], app: 'Dieses riesige Tier hat einen langen Rüssel.' },
  { id: 'c1_u28_06', ar: 'قِرْد', tr: 'qird', pos: 'Substantiv', g: 'maskulin', pl: 'قُرُود', de: ['Affe'], app: 'Dieses Tier klettert geschickt zwischen Bäumen.' },
  { id: 'c1_u28_07', ar: 'ثُعْبَان', tr: 'thuʿbān', pos: 'Substantiv', g: 'maskulin', pl: 'ثَعَابِين', de: ['Schlange'], app: 'Dieses lange Tier hat keine Beine und kriecht am Boden.' },
  { id: 'c1_u28_08', ar: 'سُلَحْفَاة', tr: 'sulaḥfāh', pos: 'Substantiv', g: 'feminin', pl: 'سَلَاحِف', de: ['Schildkröte'], app: 'Dieses Tier trägt sein Haus auf dem Rücken und bewegt sich langsam.' },
  { id: 'c1_u28_09', ar: 'ضِفْدَع', tr: 'ḍifdaʿ', pos: 'Substantiv', g: 'maskulin', pl: 'ضَفَادِع', de: ['Frosch'], app: 'Dieses Tier lebt im und am Wasser und springt gut.' },
  { id: 'c1_u28_10', ar: 'نَحْلَة', tr: 'naḥla', pos: 'Substantiv', g: 'feminin', pl: 'نَحْل', de: ['Biene'], app: 'Dieses kleine fliegende Insekt macht Honig.', conf: 'c1_small_creatures' },
  { id: 'c1_u28_11', ar: 'ذُبَابَة', tr: 'dhubāba', pos: 'Substantiv', g: 'feminin', pl: 'ذُبَاب', de: ['Fliege'], app: 'Dieses kleine Insekt summt oft ums Essen herum.', conf: 'c1_small_creatures' },
  { id: 'c1_u28_12', ar: 'بَعُوضَة', tr: 'baʿūḍa', pos: 'Substantiv', g: 'feminin', pl: 'بَعُوض', de: ['Mücke'], app: 'Dieses kleine Insekt sticht dich nachts und juckt danach.', conf: 'c1_small_creatures' },
  { id: 'c1_u28_13', ar: 'فَرَاشَة', tr: 'farāsha', pos: 'Substantiv', g: 'feminin', pl: 'فَرَاشَات', de: ['Schmetterling'], app: 'Dieses bunte Insekt fliegt von Blume zu Blume.', conf: 'c1_small_creatures' },
  { id: 'c1_u28_14', ar: 'ذِئْب', tr: 'dhiʾb', pos: 'Substantiv', g: 'maskulin', pl: 'ذِئَاب', de: ['Wolf'], app: 'Dieses wilde Tier lebt und jagt im Rudel.', conf: 'c1_wild_predators' },
  { id: 'c1_u28_15', ar: 'ثَعْلَب', tr: 'thaʿlab', pos: 'Substantiv', g: 'maskulin', pl: 'ثَعَالِب', de: ['Fuchs'], app: 'Dieses schlaue Tier hat einen buschigen Schwanz.', conf: 'c1_wild_predators' },
  { id: 'c1_u28_16', ar: 'دُبّ', tr: 'dubb', pos: 'Substantiv', g: 'maskulin', pl: 'دِبَبَة', de: ['Bär'], app: 'Dieses große, starke Tier lebt im Wald.', conf: 'c1_wild_predators' },
  { id: 'c1_u28_17', ar: 'غَزَال', tr: 'ghazāl', pos: 'Substantiv', g: 'maskulin', pl: 'غِزْلَان', de: ['Gazelle', 'Hirsch'], app: 'Dieses schlanke Tier läuft sehr schnell und schön.' },
  { id: 'c1_u28_18', ar: 'نَبَات', tr: 'nabāt', pos: 'Substantiv', g: 'maskulin', pl: 'نَبَاتَات', de: ['Pflanze'], app: 'Dieses Lebewesen wächst im Boden und braucht Licht.' },
  { id: 'c1_u28_19', ar: 'جِذْر', tr: 'jidhr', pos: 'Substantiv', g: 'maskulin', pl: 'جُذُور', de: ['Wurzel'], app: 'Dieser Teil der Pflanze steckt unter der Erde.' },
  { id: 'c1_u28_20', ar: 'بَذْرَة', tr: 'badhra', pos: 'Substantiv', g: 'feminin', pl: 'بُذُور', de: ['Samen'], app: 'Du pflanzt dieses kleine Korn in die Erde, damit eine neue Pflanze wächst.' }
];

const UNIT_29 = [
  { id: 'c1_u29_01', ar: 'قِرَاءَة', tr: 'qirāʾa', pos: 'Substantiv', g: 'feminin', pl: null, de: ['Lesen (als Hobby)'], app: 'Du machst dies abends gern mit einem guten Buch.' },
  { id: 'c1_u29_02', ar: 'رَسْم', tr: 'rasm', pos: 'Substantiv', g: 'maskulin', pl: null, de: ['Zeichnen'], app: 'Du machst dies mit einem Stift auf Papier.' },
  { id: 'c1_u29_03', ar: 'فَنّ', tr: 'fann', pos: 'Substantiv', g: 'maskulin', pl: 'فُنُون', de: ['Kunst'], app: 'Ein Gemälde im Museum ist ein Beispiel dafür.' },
  { id: 'c1_u29_04', ar: 'رَقْص', tr: 'raqṣ', pos: 'Substantiv', g: 'maskulin', pl: null, de: ['Tanzen'], app: 'Du bewegst dich dabei zur Musik.' },
  { id: 'c1_u29_05', ar: 'سِبَاحَة', tr: 'sibāḥa', pos: 'Substantiv', g: 'feminin', pl: null, de: ['Schwimmen'], app: 'Du machst dies im Schwimmbad oder im Meer.' },
  { id: 'c1_u29_06', ar: 'كُرَة الْقَدَم', tr: 'kurat al-qadam', pos: 'Substantiv', g: 'feminin', pl: null, de: ['Fußball'], app: 'Bei diesem Sport schießt du einen Ball mit dem Fuß ins Tor.' },
  { id: 'c1_u29_07', ar: 'كُرَة السَّلَّة', tr: 'kurat as-salla', pos: 'Substantiv', g: 'feminin', pl: null, de: ['Basketball'], app: 'Bei diesem Sport wirfst du den Ball in einen hohen Korb.' },
  { id: 'c1_u29_08', ar: 'تِنِس', tr: 'tanis', pos: 'Substantiv', g: 'maskulin', pl: null, de: ['Tennis'], app: 'Bei diesem Sport schlägst du einen kleinen Ball über ein Netz.' },
  { id: 'c1_u29_09', ar: 'جَرْي', tr: 'jary', pos: 'Substantiv', g: 'maskulin', pl: null, de: ['Laufen (Joggen, als Hobby)', 'Joggen'], app: 'Du machst dies morgens im Park, um fit zu bleiben.' },
  { id: 'c1_u29_10', ar: 'رُكُوب الدَّرَّاجَة', tr: 'rukūb ad-darrāja', pos: 'Substantiv', g: 'maskulin', pl: null, de: ['Fahrradfahren'], app: 'Du machst dies auf zwei Rädern ohne Motor.' },
  { id: 'c1_u29_11', ar: 'تَصْوِير', tr: 'taṣwīr', pos: 'Substantiv', g: 'maskulin', pl: null, de: ['Fotografie', 'Fotografieren'], app: 'Du machst dies gerne mit deiner Kamera in der Natur.' },
  { id: 'c1_u29_12', ar: 'هِوَايَة', tr: 'hiwāya', pos: 'Substantiv', g: 'feminin', pl: 'هِوَايَات', de: ['Hobby'], app: 'Du fragst jemanden, was er in seiner Freizeit gerne macht.' },
  { id: 'c1_u29_13', ar: 'حَفْلَة مُوسِيقِيَّة', tr: 'ḥafla mūsīqiyya', pos: 'Substantiv', g: 'feminin', pl: null, de: ['Konzert'], app: 'Du gehst hin, um deine Lieblingsband live singen zu hören.', conf: 'c1_leisure_terms' },
  { id: 'c1_u29_14', ar: 'أُغْنِيَة', tr: 'ughniya', pos: 'Substantiv', g: 'feminin', pl: 'أَغَانٍ', de: ['Lied'], app: 'Du hörst dieses gesungene Musikstück im Radio.' },
  { id: 'c1_u29_15', ar: 'مُغَنِّي', tr: 'mughannī', pos: 'Substantiv', g: 'maskulin', pl: 'مُغَنُّون', de: ['Sänger'], app: 'Diese Person steht auf der Bühne und singt.' },
  { id: 'c1_u29_16', ar: 'مُمَثِّل', tr: 'mumaththil', pos: 'Substantiv', g: 'maskulin', pl: 'مُمَثِّلُون', de: ['Schauspieler'], app: 'Dieser Mann spielt eine Rolle in einem Film.', opp: 'c1_u29_17' },
  { id: 'c1_u29_17', ar: 'مُمَثِّلَة', tr: 'mumaththila', pos: 'Substantiv', g: 'feminin', pl: 'مُمَثِّلَات', de: ['Schauspielerin'], app: 'Diese Frau spielt eine Rolle in einem Film.', opp: 'c1_u29_16' },
  { id: 'c1_u29_18', ar: 'مُبَارَاة', tr: 'mubārāh', pos: 'Substantiv', g: 'feminin', pl: 'مُبَارَيَات', de: ['Spiel (Wettkampf, Match)'], app: 'Zwei Mannschaften treten heute Abend gegeneinander an.', conf: 'c1_game_words' },
  { id: 'c1_u29_19', ar: 'فَرِيق', tr: 'farīq', pos: 'Substantiv', g: 'maskulin', pl: 'فِرَق', de: ['Mannschaft', 'Team'], app: 'Mehrere Spieler zusammen bilden diese Gruppe.' },
  { id: 'c1_u29_20', ar: 'لَاعِب', tr: 'lāʿib', pos: 'Substantiv', g: 'maskulin', pl: 'لَاعِبُون', de: ['Spieler'], app: 'Diese Person nimmt aktiv an einem Sportspiel teil.' },
  { id: 'c1_u29_21', ar: 'فَائِز', tr: 'fāʾiz', pos: 'Substantiv', g: 'maskulin', pl: 'فَائِزُون', de: ['Gewinner'], app: 'Diese Person oder Mannschaft hat den Wettbewerb gewonnen.' },
  { id: 'c1_u29_22', ar: 'مُسَابَقَة', tr: 'musābaqa', pos: 'Substantiv', g: 'feminin', pl: 'مُسَابَقَات', de: ['Wettbewerb'], app: 'Mehrere Teilnehmer treten hier gegeneinander an, um zu gewinnen.' },
  { id: 'c1_u29_23', ar: 'عُطْلَة', tr: 'ʿuṭla', pos: 'Substantiv', g: 'feminin', pl: 'عُطَل', de: ['Ferien', 'freie Tage'], app: 'Die Schule ist für einige Wochen geschlossen.', conf: 'c1_leisure_terms' },
  { id: 'c1_u29_24', ar: 'حَفْلَة', tr: 'ḥafla', pos: 'Substantiv', g: 'feminin', pl: 'حَفَلَات', de: ['Feier', 'Party'], app: 'Du lädst Freunde zu deinem Geburtstag ein.', conf: 'c1_leisure_terms' },
  { id: 'c1_u29_25', ar: 'شَطْرَنْج', tr: 'shaṭranj', pos: 'Substantiv', g: 'maskulin', pl: null, de: ['Schach'], app: 'Bei diesem Brettspiel bewegst du König, Dame und Bauern.' },
  { id: 'c1_u29_26', ar: 'سِيَاحَة', tr: 'siyāḥa', pos: 'Substantiv', g: 'feminin', pl: null, de: ['Tourismus'], app: 'Menschen reisen aus der ganzen Welt hierher, um die Stadt zu besichtigen.', conf: 'c1_leisure_terms' }
];

const UNIT_30 = [
  { id: 'c1_u30_01', ar: 'أَيّ', tr: 'ayy', pos: 'Fragewort', g: null, pl: null, de: ['welcher', 'welche', 'welches'], app: 'Du fragst nach EINEM bestimmten Ding aus mehreren möglichen: أَيُّ كِتَابٍ تُرِيد؟ (Welches Buch möchtest du?)' },
  { id: 'c1_u30_02', ar: 'هَلْ', tr: 'hal', pos: 'Partikel', g: null, pl: null, de: ['Fragepartikel für Ja/Nein-Fragen'], app: 'Du stellst eine Frage, die nur mit "ja" oder "nein" beantwortet wird — هَلْ steht dafür immer ganz am Satzanfang: هَلْ أَنْتَ جَاهِز؟ (Bist du bereit?)' },
  { id: 'c1_u30_03', ar: 'لِأَنَّ', tr: 'liʾanna', pos: 'Konjunktion', g: null, pl: null, de: ['weil'], app: 'Du erklärst einen Grund für etwas: تَعَبْتُ لِأَنَّنِي عَمِلْتُ كَثِيراً (Ich bin müde, weil ich viel gearbeitet habe).' },
  { id: 'c1_u30_04', ar: 'لَكِنْ', tr: 'lākin', pos: 'Konjunktion', g: null, pl: null, de: ['aber'], app: 'Du stellst einen Gegensatz zwischen zwei Aussagen dar: الْجَوُّ جَمِيلٌ لَكِنْ بَارِد (Das Wetter ist schön, aber kalt).' },
  { id: 'c1_u30_05', ar: 'وَ', tr: 'wa', pos: 'Konjunktion', g: null, pl: null, de: ['und'], app: 'Du verbindest zwei Wörter oder Sätze miteinander: أَنَا وَأَنْتَ (ich und du).' },
  { id: 'c1_u30_06', ar: 'أَوْ', tr: 'aw', pos: 'Konjunktion', g: null, pl: null, de: ['oder'], app: 'Du bietest eine Auswahl zwischen zwei Möglichkeiten an: شَايٌ أَوْ قَهْوَة؟ (Tee oder Kaffee?).' },
  { id: 'c1_u30_07', ar: 'ثُمَّ', tr: 'thumma', pos: 'Konjunktion', g: null, pl: null, de: ['dann', 'danach'], app: 'Du beschreibst, was zeitlich als Nächstes passiert: اِسْتَيْقَظْتُ ثُمَّ اِغْتَسَلْتُ (Ich bin aufgewacht, dann habe ich mich gewaschen).' },
  { id: 'c1_u30_08', ar: 'لِذَلِكَ', tr: 'lidhālika', pos: 'Adverb', g: null, pl: null, de: ['deshalb', 'daher'], app: 'Du nennst die Folge einer bereits genannten Ursache: كُنْتُ مَرِيضاً، لِذَلِكَ لَمْ أَذْهَبْ (Ich war krank, deshalb bin ich nicht gegangen).' },
  { id: 'c1_u30_09', ar: 'أَيْضاً', tr: 'ayḍan', pos: 'Adverb', g: null, pl: null, de: ['auch'], app: 'Du fügst eine weitere zutreffende Sache hinzu: أَنَا جَائِعٌ، وَأَنْتَ أَيْضاً (Ich habe Hunger, und du auch).' },
  { id: 'c1_u30_10', ar: 'فَقَطْ', tr: 'faqaṭ', pos: 'Adverb', g: null, pl: null, de: ['nur'], app: 'Du beschränkst etwas auf eine einzige Sache: عِنْدِي دِينَارٌ وَاحِدٌ فَقَطْ (Ich habe nur einen einzigen Dinar).' },
  { id: 'c1_u30_11', ar: 'جِدّاً', tr: 'jiddan', pos: 'Adverb', g: null, pl: null, de: ['sehr'], app: 'Du verstärkst eine Eigenschaft: هَذَا الْكِتَابُ مُفِيدٌ جِدّاً (Dieses Buch ist sehr nützlich).' },
  { id: 'c1_u30_12', ar: 'أَكْثَر', tr: 'akthar', pos: 'Adverb', g: null, pl: null, de: ['mehr'], app: 'Du vergleichst eine Menge mit einer anderen: أُرِيدُ أَكْثَرَ مِنْ ذَلِكَ (Ich möchte mehr davon).' },
  { id: 'c1_u30_13', ar: 'اَلْآن', tr: 'al-ān', pos: 'Adverb', g: null, pl: null, de: ['jetzt'], app: 'Du sprichst über den gegenwärtigen Moment: أَنَا مَشْغُولٌ الْآن (Ich bin jetzt beschäftigt).' },
  { id: 'c1_u30_14', ar: 'كُلّ', tr: 'kull', pos: 'Pronomen (Indefinit)', g: null, pl: null, de: ['alle', 'jeder'], app: 'Du sprichst über die gesamte Menge ohne Ausnahme: كُلُّ الطُّلَّابِ حَضَرُوا (Alle Studierenden sind gekommen).', opp: 'c1_u30_15' },
  { id: 'c1_u30_15', ar: 'بَعْض', tr: 'baʿḍ', pos: 'Pronomen (Indefinit)', g: null, pl: null, de: ['einige', 'manche'], app: 'Du sprichst über einen Teil einer Menge, nicht über alles: بَعْضُ الطُّلَّابِ غَائِبُون (Einige Studierende fehlen).', opp: 'c1_u30_14' },
  { id: 'c1_u30_16', ar: 'لَا أَحَد', tr: 'lā aḥad', pos: 'Pronomen (Indefinit)', g: null, pl: null, de: ['niemand'], app: 'Du sagst, dass keine einzige Person etwas getan hat: لَا أَحَدَ فِي الْغُرْفَة (Niemand ist im Zimmer).' },
  { id: 'c1_u30_17', ar: 'شَيْء', tr: 'shayʾ', pos: 'Pronomen (Indefinit)', g: null, pl: null, de: ['etwas', 'Sache'], app: 'Du sprichst über eine unbestimmte Sache: أُرِيدُ أَنْ أَقُولَ شَيْئاً (Ich möchte etwas sagen).', opp: 'c1_u30_18' },
  { id: 'c1_u30_18', ar: 'لَا شَيْء', tr: 'lā shayʾ', pos: 'Pronomen (Indefinit)', g: null, pl: null, de: ['nichts'], app: 'Du sagst, dass es keine einzige Sache gibt: لَا شَيْءَ فِي الصُّنْدُوق (Es gibt nichts in der Kiste).', opp: 'c1_u30_17' },
  { id: 'c1_u30_19', ar: 'هُنَا', tr: 'hunā', pos: 'Adverb', g: null, pl: null, de: ['hier'], app: 'Du zeigst auf den Ort, an dem du dich gerade befindest: أَنَا هُنَا (Ich bin hier).', opp: 'c1_u30_20' },
  { id: 'c1_u30_20', ar: 'هُنَاكَ', tr: 'hunāka', pos: 'Adverb', g: null, pl: null, de: ['dort'], app: 'Du zeigst auf einen Ort, der von dir entfernt ist: هُوَ هُنَاكَ (Er ist dort).', opp: 'c1_u30_19' },
  { id: 'c1_u30_21', ar: 'هَذَا', tr: 'hādhā', pos: 'Pronomen (Demonstrativ)', g: 'maskulin', pl: null, de: ['dieser', 'dieses (m.)'], app: 'Du zeigst auf ein nahes männliches oder sächliches Ding: هَذَا كِتَابِي (Dies ist mein Buch).' },
  { id: 'c1_u30_22', ar: 'هَذِهِ', tr: 'hādhihi', pos: 'Pronomen (Demonstrativ)', g: 'feminin', pl: null, de: ['diese', 'dieses (f.)'], app: 'Du zeigst auf ein nahes weibliches Ding: هَذِهِ سَيَّارَتِي (Dies ist mein Auto).' },
  { id: 'c1_u30_23', ar: 'إِذَا', tr: 'idhā', pos: 'Konjunktion', g: null, pl: null, de: ['wenn', 'falls'], app: 'Du beschreibst eine Bedingung: إِذَا كَانَ الْجَوُّ جَمِيلاً، سَنَخْرُج (Wenn das Wetter schön ist, gehen wir raus).' }
];

module.exports = { UNIT_26, UNIT_27, UNIT_28, UNIT_29, UNIT_30 };
