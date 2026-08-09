// Kurs 1, Units 1–5 — vollständiges Datenmodell für die 115 neuen Wörter dieses Batches
// (Entwicklungsauftrag 6, Meilenstein 3). Arabische Formen inkl. Vokalisierung neu erstellt
// (siehe Hinweis in kurs1UnitPlan.js zur Kodierungskorruption der Nutzer-Quelldateien) —
// Standard-MSA, aber bewusst weiterhin "needs_language_review" (Auftrag Abschnitt 3/13).
//
// Feldkürzel: ar = arabisch vokalisiert, tr = Transliteration, pos = Wortart (deutsches Label,
// wie im Bestand üblich), g = Genus ('maskulin'/'feminin'/null), pl = Plural vokalisiert (oder
// null), de = Array deutscher Antworten, app = Kontext-Satz für application_prompts.

const UNIT_1 = [
  { id: 'c1_u01_01', ar: 'أَهْلاً وَسَهْلاً', tr: 'ahlan wa sahlan', pos: 'Ausdruck', g: null, pl: null, de: ['Herzlich willkommen'], app: 'Du empfängst Gäste an deiner Haustür.' },
  { id: 'c1_u01_02', ar: 'أَهْلاً بِكَ', tr: 'ahlan bik', pos: 'Ausdruck', g: null, pl: null, de: ['Willkommen'], app: 'Ein neuer Kollege betritt zum ersten Mal das Büro.' },
  { id: 'c1_u01_03', ar: 'كَيْفَ حَالُكَ؟', tr: 'kayfa ḥāluk', pos: 'Ausdruck', g: null, pl: null, de: ['Wie geht es dir?'], app: 'Du triffst eine Freundin und fragst nach ihrem Befinden.' },
  { id: 'c1_u01_04', ar: 'بِخَيْر', tr: 'bikhayr', pos: 'Ausdruck', g: null, pl: null, de: ['Gut', 'Mir geht es gut'], app: 'Jemand fragt dich, wie es dir geht, und es geht dir gut.' },
  { id: 'c1_u01_05', ar: 'الْحَمْدُ لِلَّه', tr: 'al-ḥamdu lillāh', pos: 'Ausdruck', g: null, pl: null, de: ['Gott sei Dank', 'Zum Glück'], app: 'Du bist erleichtert, dass alles gut gegangen ist.' },
  { id: 'c1_u01_06', ar: 'عَفْواً', tr: 'ʿafwan', pos: 'Ausdruck', g: null, pl: null, de: ['Gern geschehen', 'Entschuldigung'], app: 'Du bist jemandem versehentlich auf den Fuß getreten.' },
  { id: 'c1_u01_07', ar: 'مَعْذِرَة', tr: 'maʿdhira', pos: 'Ausdruck', g: null, pl: null, de: ['Entschuldigung'], app: 'Du möchtest jemanden höflich unterbrechen, um etwas zu fragen.' },
  { id: 'c1_u01_08', ar: 'آسِف', tr: 'āsif', pos: 'Ausdruck', g: null, pl: null, de: ['Es tut mir leid', 'Entschuldigung'], app: 'Du bist zu spät zu einer Verabredung gekommen.' },
  { id: 'c1_u01_09', ar: 'لَا بَأْس', tr: 'lā baʾs', pos: 'Ausdruck', g: null, pl: null, de: ['Kein Problem', 'Macht nichts'], app: 'Jemand entschuldigt sich bei dir für eine Kleinigkeit.' },
  { id: 'c1_u01_10', ar: 'حَسَناً', tr: 'ḥasanan', pos: 'Ausdruck', g: null, pl: null, de: ['Okay', 'Gut'], app: 'Du stimmst einem Vorschlag zu.' },
  { id: 'c1_u01_11', ar: 'بِالطَّبْع', tr: 'biṭ-ṭabʿ', pos: 'Ausdruck', g: null, pl: null, de: ['Natürlich', 'Selbstverständlich'], app: 'Jemand fragt, ob du helfen kannst — die Antwort ist ganz klar ja.' },
  { id: 'c1_u01_12', ar: 'رُبَّمَا', tr: 'rubbamā', pos: 'Ausdruck', g: null, pl: null, de: ['Vielleicht'], app: 'Du bist dir bei einer Aussage noch nicht sicher.' },
  { id: 'c1_u01_13', ar: 'شُكْراً جَزِيلاً', tr: 'shukran jazīlan', pos: 'Ausdruck', g: null, pl: null, de: ['Vielen Dank'], app: 'Jemand hat dir sehr geholfen, ein einfaches "Danke" reicht dir nicht.' },
  { id: 'c1_u01_14', ar: 'الْعَفْو', tr: 'al-ʿafw', pos: 'Ausdruck', g: null, pl: null, de: ['Gern geschehen'], app: 'Jemand bedankt sich bei dir für eine Hilfe.' },
  { id: 'c1_u01_15', ar: 'إِلَى اللِّقَاء', tr: 'ilā l-liqāʾ', pos: 'Ausdruck', g: null, pl: null, de: ['Bis zum Wiedersehen'], app: 'Du verabschiedest dich am Ende eines Telefonats.' },
  { id: 'c1_u01_16', ar: 'أَرَاكَ لَاحِقاً', tr: 'arāka lāḥiqan', pos: 'Ausdruck', g: null, pl: null, de: ['Bis später'], app: 'Du verlässt kurz den Raum, kommst aber am selben Tag wieder.' },
  { id: 'c1_u01_17', ar: 'تُصْبِحُ عَلَى خَيْر', tr: 'tuṣbiḥ ʿalā khayr', pos: 'Ausdruck', g: null, pl: null, de: ['Gute Nacht'], app: 'Du gehst spätabends schlafen und verabschiedest dich von der Familie.' },
  { id: 'c1_u01_18', ar: 'حَظّاً سَعِيداً', tr: 'ḥaẓẓan saʿīdan', pos: 'Ausdruck', g: null, pl: null, de: ['Viel Glück'], app: 'Ein Freund geht morgen zu einer wichtigen Prüfung.' },
  { id: 'c1_u01_19', ar: 'مَبْرُوك', tr: 'mabrūk', pos: 'Ausdruck', g: null, pl: null, de: ['Glückwunsch'], app: 'Eine Freundin hat gerade ihren Universitätsabschluss geschafft.' },
  { id: 'c1_u01_20', ar: 'سَعِيد بِلِقَائِكَ', tr: 'saʿīd bi-liqāʾik', pos: 'Ausdruck', g: null, pl: null, de: ['Freut mich, dich kennenzulernen'], app: 'Du wirst gerade jemandem zum ersten Mal vorgestellt.' },
  { id: 'c1_u01_21', ar: 'وَدَاعاً', tr: 'wadāʿan', pos: 'Ausdruck', g: null, pl: null, de: ['Leb wohl', 'Auf Wiedersehen'], app: 'Du verabschiedest dich von jemandem, den du lange nicht mehr sehen wirst.' }
];

const UNIT_2 = [
  { id: 'c1_u02_01', ar: 'عَائِلَة', tr: 'ʿāʾila', pos: 'Substantiv', g: 'feminin', pl: 'عَائِلَات', de: ['Familie'], app: 'Alle deine Verwandten zusammen — Eltern, Geschwister, Großeltern.' },
  { id: 'c1_u02_02', ar: 'زَوْج', tr: 'zawj', pos: 'Substantiv', g: 'maskulin', pl: 'أَزْوَاج', de: ['Ehemann'], app: 'Der Mann, mit dem eine Frau verheiratet ist.' },
  { id: 'c1_u02_03', ar: 'زَوْجَة', tr: 'zawja', pos: 'Substantiv', g: 'feminin', pl: 'زَوْجَات', de: ['Ehefrau'], app: 'Die Frau, mit der ein Mann verheiratet ist.' },
  { id: 'c1_u02_04', ar: 'عَمّ', tr: 'ʿamm', pos: 'Substantiv', g: 'maskulin', pl: 'أَعْمَام', de: ['Onkel väterlicherseits'], app: 'Der Bruder deines Vaters.' },
  { id: 'c1_u02_05', ar: 'عَمَّة', tr: 'ʿamma', pos: 'Substantiv', g: 'feminin', pl: 'عَمَّات', de: ['Tante väterlicherseits'], app: 'Die Schwester deines Vaters.' },
  { id: 'c1_u02_06', ar: 'خَال', tr: 'khāl', pos: 'Substantiv', g: 'maskulin', pl: 'أَخْوَال', de: ['Onkel mütterlicherseits'], app: 'Der Bruder deiner Mutter.' },
  { id: 'c1_u02_07', ar: 'خَالَة', tr: 'khāla', pos: 'Substantiv', g: 'feminin', pl: 'خَالَات', de: ['Tante mütterlicherseits'], app: 'Die Schwester deiner Mutter.' },
  { id: 'c1_u02_08', ar: 'حَفِيد', tr: 'ḥafīd', pos: 'Substantiv', g: 'maskulin', pl: 'أَحْفَاد', de: ['Enkel'], app: 'Der Sohn deines Sohnes oder deiner Tochter.' },
  { id: 'c1_u02_09', ar: 'حَفِيدَة', tr: 'ḥafīda', pos: 'Substantiv', g: 'feminin', pl: 'حَفِيدَات', de: ['Enkelin'], app: 'Die Tochter deines Sohnes oder deiner Tochter.' },
  { id: 'c1_u02_10', ar: 'طِفْل', tr: 'ṭifl', pos: 'Substantiv', g: 'maskulin', pl: 'أَطْفَال', de: ['Kind'], app: 'Ein sehr junger Mensch.' },
  { id: 'c1_u02_11', ar: 'رَجُل', tr: 'rajul', pos: 'Substantiv', g: 'maskulin', pl: 'رِجَال', de: ['Mann'], app: 'Ein erwachsener männlicher Mensch.' },
  { id: 'c1_u02_12', ar: 'اِمْرَأَة', tr: 'imraʾa', pos: 'Substantiv', g: 'feminin', pl: 'نِسَاء', de: ['Frau'], app: 'Ein erwachsener weiblicher Mensch.' },
  { id: 'c1_u02_13', ar: 'صَدِيق', tr: 'ṣadīq', pos: 'Substantiv', g: 'maskulin', pl: 'أَصْدِقَاء', de: ['Freund'], app: 'Ein enger männlicher Freund, kein Verwandter.' },
  { id: 'c1_u02_14', ar: 'صَدِيقَة', tr: 'ṣadīqa', pos: 'Substantiv', g: 'feminin', pl: 'صَدِيقَات', de: ['Freundin'], app: 'Eine enge Freundin, keine Verwandte.' },
  { id: 'c1_u02_15', ar: 'جَار', tr: 'jār', pos: 'Substantiv', g: 'maskulin', pl: 'جِيرَان', de: ['Nachbar'], app: 'Der Mann, der nebenan wohnt.' },
  { id: 'c1_u02_16', ar: 'جَارَة', tr: 'jāra', pos: 'Substantiv', g: 'feminin', pl: 'جَارَات', de: ['Nachbarin'], app: 'Die Frau, die nebenan wohnt.' },
  { id: 'c1_u02_17', ar: 'زَمِيل', tr: 'zamīl', pos: 'Substantiv', g: 'maskulin', pl: 'زُمَلَاء', de: ['Kollege', 'Kommilitone'], app: 'Ein männlicher Mensch, mit dem du arbeitest oder studierst.' },
  { id: 'c1_u02_18', ar: 'زَمِيلَة', tr: 'zamīla', pos: 'Substantiv', g: 'feminin', pl: 'زَمِيلَات', de: ['Kollegin', 'Kommilitonin'], app: 'Eine Frau, mit der du arbeitest oder studierst.' },
  { id: 'c1_u02_19', ar: 'قَرِيب', tr: 'qarīb', pos: 'Substantiv', g: 'maskulin', pl: 'أَقَارِب', de: ['Verwandter'], app: 'Jemand aus deiner Familie, aber weder Eltern noch Geschwister.' },
  { id: 'c1_u02_20', ar: 'وَالِدَيْن', tr: 'wālidayn', pos: 'Substantiv (Dual)', g: null, pl: null, de: ['Eltern'], app: 'Vater und Mutter zusammen.' },
  { id: 'c1_u02_21', ar: 'اِبْن عَمّ', tr: 'ibn ʿamm', pos: 'Substantiv', g: 'maskulin', pl: null, de: ['Cousin väterlicherseits'], app: 'Der Sohn deines Onkels väterlicherseits.' },
  { id: 'c1_u02_22', ar: 'بِنْت عَمّ', tr: 'bint ʿamm', pos: 'Substantiv', g: 'feminin', pl: null, de: ['Cousine väterlicherseits'], app: 'Die Tochter deines Onkels väterlicherseits.' }
];

const UNIT_3 = [
  { id: 'c1_u03_01', ar: 'شَقَّة', tr: 'shaqqa', pos: 'Substantiv', g: 'feminin', pl: 'شُقَق', de: ['Wohnung'], app: 'Eine Einheit zum Wohnen innerhalb eines größeren Gebäudes.' },
  { id: 'c1_u03_02', ar: 'مَبْنَى', tr: 'mabnā', pos: 'Substantiv', g: 'maskulin', pl: 'مَبَانٍ', de: ['Gebäude'], app: 'Ein ganzes Haus mit mehreren Stockwerken.' },
  { id: 'c1_u03_03', ar: 'طَابِق', tr: 'ṭābiq', pos: 'Substantiv', g: 'maskulin', pl: 'طَوَابِق', de: ['Stockwerk', 'Etage'], app: 'Deine Wohnung liegt im dritten davon.' },
  { id: 'c1_u03_04', ar: 'غُرْفَة الْجُلُوس', tr: 'ghurfat al-julūs', pos: 'Substantiv', g: 'feminin', pl: null, de: ['Wohnzimmer'], app: 'Hier sitzt die Familie abends zusammen und sieht fern.' },
  { id: 'c1_u03_05', ar: 'غُرْفَة النَّوْم', tr: 'ghurfat an-nawm', pos: 'Substantiv', g: 'feminin', pl: null, de: ['Schlafzimmer'], app: 'Hier steht das Bett, hier schläfst du.' },
  { id: 'c1_u03_06', ar: 'غُرْفَة الطَّعَام', tr: 'ghurfat aṭ-ṭaʿām', pos: 'Substantiv', g: 'feminin', pl: null, de: ['Esszimmer'], app: 'Hier steht der Tisch, an dem die Familie isst.' },
  { id: 'c1_u03_07', ar: 'شُرْفَة', tr: 'shurfa', pos: 'Substantiv', g: 'feminin', pl: 'شُرَف', de: ['Balkon'], app: 'Ein kleiner Außenbereich vor dem Fenster, oft mit Blumentöpfen.' },
  { id: 'c1_u03_08', ar: 'حَدِيقَة', tr: 'ḥadīqa', pos: 'Substantiv', g: 'feminin', pl: 'حَدَائِق', de: ['Garten'], app: 'Ein grüner Bereich am Haus mit Bäumen und Blumen.' },
  { id: 'c1_u03_09', ar: 'مِرْآب', tr: 'mirʾāb', pos: 'Substantiv', g: 'maskulin', pl: 'مَرَائِب', de: ['Garage'], app: 'Hier parkst du das Auto über Nacht.' },
  { id: 'c1_u03_10', ar: 'دَرَج', tr: 'daraj', pos: 'Substantiv', g: 'maskulin', pl: 'أَدْرَاج', de: ['Treppe'], app: 'Du gehst sie hoch, um in den dritten Stock zu kommen.' },
  { id: 'c1_u03_11', ar: 'مِصْعَد', tr: 'miṣʿad', pos: 'Substantiv', g: 'maskulin', pl: 'مَصَاعِد', de: ['Aufzug'], app: 'Damit fährst du bequem in den zehnten Stock.' },
  { id: 'c1_u03_12', ar: 'سَطْح', tr: 'saṭḥ', pos: 'Substantiv', g: 'maskulin', pl: 'أَسْطُح', de: ['Dach', 'Dachterrasse'], app: 'Ganz oben auf dem Gebäude, oft mit schöner Aussicht.' },
  { id: 'c1_u03_13', ar: 'جِدَار', tr: 'jidār', pos: 'Substantiv', g: 'maskulin', pl: 'جُدْرَان', de: ['Wand'], app: 'Daran hängst du ein Bild auf.' },
  { id: 'c1_u03_14', ar: 'سَقْف', tr: 'saqf', pos: 'Substantiv', g: 'maskulin', pl: 'سُقُوف', de: ['Decke', 'Dach'], app: 'Über dir, wenn du im Zimmer nach oben schaust.' },
  { id: 'c1_u03_15', ar: 'أَرْضِيَّة', tr: 'arḍiyya', pos: 'Substantiv', g: 'feminin', pl: 'أَرْضِيَّات', de: ['Fußboden'], app: 'Darauf steht der Tisch im Zimmer.' },
  { id: 'c1_u03_16', ar: 'مَدْخَل', tr: 'madkhal', pos: 'Substantiv', g: 'maskulin', pl: 'مَدَاخِل', de: ['Eingang'], app: 'Hier betrittst du das Gebäude.' },
  { id: 'c1_u03_17', ar: 'مَخْرَج', tr: 'makhraj', pos: 'Substantiv', g: 'maskulin', pl: 'مَخَارِج', de: ['Ausgang'], app: 'Hier verlässt du das Gebäude.' },
  { id: 'c1_u03_18', ar: 'مَمَرّ', tr: 'mamarr', pos: 'Substantiv', g: 'maskulin', pl: 'مَمَرَّات', de: ['Flur', 'Gang'], app: 'Ein schmaler Bereich zwischen mehreren Zimmern.' },
  { id: 'c1_u03_19', ar: 'مِفْتَاح', tr: 'miftāḥ', pos: 'Substantiv', g: 'maskulin', pl: 'مَفَاتِيح', de: ['Schlüssel'], app: 'Damit schließt du die Wohnungstür auf.' },
  { id: 'c1_u03_20', ar: 'قُفْل', tr: 'qufl', pos: 'Substantiv', g: 'maskulin', pl: 'أَقْفَال', de: ['Schloss'], app: 'Der Schlüssel passt genau hierhinein.' },
  { id: 'c1_u03_21', ar: 'كَهْرَبَاء', tr: 'kahrabāʾ', pos: 'Substantiv', g: 'feminin', pl: null, de: ['Elektrizität', 'Strom'], app: 'Ohne sie funktioniert weder Licht noch Kühlschrank.' },
  { id: 'c1_u03_22', ar: 'فِنَاء', tr: 'fanāʾ', pos: 'Substantiv', g: 'maskulin', pl: 'أَفْنِيَة', de: ['Innenhof', 'Hof'], app: 'Ein offener Bereich mitten im oder vor dem Gebäude.' }
];

const UNIT_4 = [
  { id: 'c1_u04_01', ar: 'اِسْم', tr: 'ism', pos: 'Substantiv', g: 'maskulin', pl: 'أَسْمَاء', de: ['Name'], app: 'Man fragt dich danach, wenn man dich noch nicht kennt.' },
  { id: 'c1_u04_02', ar: 'عُمْر', tr: 'ʿumr', pos: 'Substantiv', g: 'maskulin', pl: 'أَعْمَار', de: ['Alter'], app: 'Die Anzahl der Jahre, die du schon lebst.' },
  { id: 'c1_u04_03', ar: 'تَارِيخ الْمِيلَاد', tr: 'tārīkh al-mīlād', pos: 'Substantiv', g: 'maskulin', pl: null, de: ['Geburtsdatum'], app: 'Steht in deinem Reisepass, zusammen mit deinem Namen.' },
  { id: 'c1_u04_04', ar: 'جِنْسِيَّة', tr: 'jinsiyya', pos: 'Substantiv', g: 'feminin', pl: 'جِنْسِيَّات', de: ['Nationalität'], app: 'Steht ebenfalls in deinem Reisepass.' },
  { id: 'c1_u04_05', ar: 'لُغَة', tr: 'lugha', pos: 'Substantiv', g: 'feminin', pl: 'لُغَات', de: ['Sprache'], app: 'Arabisch und Deutsch sind Beispiele dafür.' },
  { id: 'c1_u04_06', ar: 'الْعَرَبِيَّة', tr: 'al-ʿarabiyya', pos: 'Substantiv', g: 'feminin', pl: null, de: ['Arabisch', 'arabische Sprache'], app: 'Die Sprache, die du gerade lernst.' },
  { id: 'c1_u04_07', ar: 'الْأَلْمَانِيَّة', tr: 'al-almāniyya', pos: 'Substantiv', g: 'feminin', pl: null, de: ['Deutsch', 'deutsche Sprache'], app: 'Die Sprache, in der dieser Kurs erklärt wird.' },
  { id: 'c1_u04_08', ar: 'الْإِنْجْلِيزِيَّة', tr: 'al-injlīziyya', pos: 'Substantiv', g: 'feminin', pl: null, de: ['Englisch', 'englische Sprache'], app: 'Eine weltweit sehr verbreitete Fremdsprache.' },
  { id: 'c1_u04_09', ar: 'بَلَد', tr: 'balad', pos: 'Substantiv', g: 'maskulin', pl: 'بُلْدَان', de: ['Land'], app: 'Deutschland und Ägypten sind Beispiele dafür.' },
  { id: 'c1_u04_10', ar: 'أَلْمَانِيَا', tr: 'almāniyā', pos: 'Eigenname', g: null, pl: null, de: ['Deutschland'], app: 'Das Land, in dem dieser Kurs entsteht.' },
  { id: 'c1_u04_11', ar: 'مِصْر', tr: 'miṣr', pos: 'Eigenname', g: null, pl: null, de: ['Ägypten'], app: 'Ein Land in Nordafrika mit vielen Arabisch-Sprechern.' },
  { id: 'c1_u04_12', ar: 'سُورِيَا', tr: 'sūriyā', pos: 'Eigenname', g: null, pl: null, de: ['Syrien'], app: 'Ein Land im Nahen Osten.' },
  { id: 'c1_u04_13', ar: 'لُبْنَان', tr: 'lubnān', pos: 'Eigenname', g: null, pl: null, de: ['Libanon'], app: 'Ein kleines Land am Mittelmeer, Nachbar von Syrien.' },
  { id: 'c1_u04_14', ar: 'الْأُرْدُنّ', tr: 'al-urdunn', pos: 'Eigenname', g: null, pl: null, de: ['Jordanien'], app: 'Ein Land im Nahen Osten, Nachbar von Palästina.' },
  { id: 'c1_u04_15', ar: 'الْمَغْرِب', tr: 'al-maghrib', pos: 'Eigenname', g: null, pl: null, de: ['Marokko'], app: 'Ein Land im äußersten Nordwesten Afrikas.' },
  { id: 'c1_u04_16', ar: 'فِلَسْطِين', tr: 'filasṭīn', pos: 'Eigenname', g: null, pl: null, de: ['Palästina'], app: 'Ein Gebiet im Nahen Osten.' },
  { id: 'c1_u04_17', ar: 'تُرْكِيَا', tr: 'turkiyā', pos: 'Eigenname', g: null, pl: null, de: ['Türkei'], app: 'Ein Land, das in Europa und Asien zugleich liegt.' },
  { id: 'c1_u04_18', ar: 'فَرَنْسَا', tr: 'faransā', pos: 'Eigenname', g: null, pl: null, de: ['Frankreich'], app: 'Ein westeuropäisches Nachbarland Deutschlands.' },
  { id: 'c1_u04_19', ar: 'إِسْبَانِيَا', tr: 'isbāniyā', pos: 'Eigenname', g: null, pl: null, de: ['Spanien'], app: 'Ein Land im Südwesten Europas.' },
  { id: 'c1_u04_20', ar: 'إِيطَالِيَا', tr: 'īṭāliyā', pos: 'Eigenname', g: null, pl: null, de: ['Italien'], app: 'Ein südeuropäisches Land in Stiefelform.' },
  { id: 'c1_u04_21', ar: 'أَلْمَانِيّ', tr: 'almānī', pos: 'Substantiv/Adjektiv', g: 'maskulin', pl: null, de: ['Deutscher', 'deutsch (m.)'], app: 'So nennt man einen Mann aus Deutschland.' },
  { id: 'c1_u04_22', ar: 'أَلْمَانِيَّة', tr: 'almāniyya', pos: 'Substantiv/Adjektiv', g: 'feminin', pl: null, de: ['Deutsche', 'deutsch (f.)'], app: 'So nennt man eine Frau aus Deutschland.' },
  { id: 'c1_u04_23', ar: 'مِصْرِيّ', tr: 'miṣrī', pos: 'Substantiv/Adjektiv', g: 'maskulin', pl: null, de: ['Ägypter', 'ägyptisch'], app: 'So nennt man jemanden aus Ägypten.' },
  { id: 'c1_u04_24', ar: 'سُورِيّ', tr: 'sūrī', pos: 'Substantiv/Adjektiv', g: 'maskulin', pl: null, de: ['Syrer', 'syrisch'], app: 'So nennt man jemanden aus Syrien.' },
  { id: 'c1_u04_25', ar: 'لُبْنَانِيّ', tr: 'lubnānī', pos: 'Substantiv/Adjektiv', g: 'maskulin', pl: null, de: ['Libanese', 'libanesisch'], app: 'So nennt man jemanden aus dem Libanon.' },
  { id: 'c1_u04_26', ar: 'أُرْدُنِّيّ', tr: 'urdunnī', pos: 'Substantiv/Adjektiv', g: 'maskulin', pl: null, de: ['Jordanier', 'jordanisch'], app: 'So nennt man jemanden aus Jordanien.' },
  { id: 'c1_u04_27', ar: 'مَغْرِبِيّ', tr: 'maghribī', pos: 'Substantiv/Adjektiv', g: 'maskulin', pl: null, de: ['Marokkaner', 'marokkanisch'], app: 'So nennt man jemanden aus Marokko.' },
  { id: 'c1_u04_28', ar: 'عُنْوَان', tr: 'ʿunwān', pos: 'Substantiv', g: 'maskulin', pl: 'عَنَاوِين', de: ['Adresse'], app: 'Straße, Hausnummer und Stadt zusammen.' },
  { id: 'c1_u04_29', ar: 'رَقْم الْهَاتِف', tr: 'raqm al-hātif', pos: 'Substantiv', g: 'maskulin', pl: null, de: ['Telefonnummer'], app: 'Man ruft dich darüber an.' },
  { id: 'c1_u04_30', ar: 'عُنْوَان الْبَرِيد الْإِلِكْتْرُونِيّ', tr: 'ʿunwān al-barīd al-iliktrōnī', pos: 'Substantiv', g: 'maskulin', pl: null, de: ['E-Mail-Adresse'], app: 'Man braucht sie, um dir digital zu schreiben.' }
];

const UNIT_5 = [
  { id: 'c1_u05_01', ar: 'صِفْر', tr: 'ṣifr', pos: 'Zahlwort', g: null, pl: null, de: ['null'], app: 'Die Zahl, mit der jedes Zählen beginnt.' },
  { id: 'c1_u05_02', ar: 'أَحَدَ عَشَر', tr: 'aḥada ʿashar', pos: 'Zahlwort', g: null, pl: null, de: ['elf'], app: 'Eine Zahl mehr als zehn.' },
  { id: 'c1_u05_03', ar: 'اِثْنَا عَشَر', tr: 'ithnā ʿashar', pos: 'Zahlwort', g: null, pl: null, de: ['zwölf'], app: 'So viele Monate hat ein Jahr.' },
  { id: 'c1_u05_04', ar: 'ثَلَاثَةَ عَشَر', tr: 'thalāthata ʿashar', pos: 'Zahlwort', g: null, pl: null, de: ['dreizehn'], app: 'Eine Zahl zwischen zwölf und vierzehn.' },
  { id: 'c1_u05_05', ar: 'أَرْبَعَةَ عَشَر', tr: 'arbaʿata ʿashar', pos: 'Zahlwort', g: null, pl: null, de: ['vierzehn'], app: 'Eine Zahl zwischen dreizehn und fünfzehn.' },
  { id: 'c1_u05_06', ar: 'خَمْسَةَ عَشَر', tr: 'khamsata ʿashar', pos: 'Zahlwort', g: null, pl: null, de: ['fünfzehn'], app: 'Die Hälfte von dreißig.' },
  { id: 'c1_u05_07', ar: 'سِتَّةَ عَشَر', tr: 'sittata ʿashar', pos: 'Zahlwort', g: null, pl: null, de: ['sechzehn'], app: 'Eine Zahl zwischen fünfzehn und siebzehn.' },
  { id: 'c1_u05_08', ar: 'سَبْعَةَ عَشَر', tr: 'sabʿata ʿashar', pos: 'Zahlwort', g: null, pl: null, de: ['siebzehn'], app: 'Eine Zahl zwischen sechzehn und achtzehn.' },
  { id: 'c1_u05_09', ar: 'ثَمَانِيَةَ عَشَر', tr: 'thamāniyata ʿashar', pos: 'Zahlwort', g: null, pl: null, de: ['achtzehn'], app: 'Eine Zahl zwischen siebzehn und neunzehn.' },
  { id: 'c1_u05_10', ar: 'تِسْعَةَ عَشَر', tr: 'tisʿata ʿashar', pos: 'Zahlwort', g: null, pl: null, de: ['neunzehn'], app: 'Eine Zahl mehr als achtzehn, eine weniger als zwanzig.' },
  { id: 'c1_u05_11', ar: 'عِشْرُون', tr: 'ʿishrūn', pos: 'Zahlwort', g: null, pl: null, de: ['zwanzig'], app: 'Doppelt so viel wie zehn.' },
  { id: 'c1_u05_12', ar: 'مِئَة', tr: 'miʾa', pos: 'Zahlwort', g: 'feminin', pl: null, de: ['hundert'], app: 'Zehnmal so viel wie zehn.' },
  { id: 'c1_u05_13', ar: 'أَلْف', tr: 'alf', pos: 'Substantiv', g: 'maskulin', pl: 'آلَاف', de: ['tausend'], app: 'Zehnmal so viel wie hundert.' },
  { id: 'c1_u05_14', ar: 'نِصْف', tr: 'niṣf', pos: 'Substantiv', g: 'maskulin', pl: 'أَنْصَاف', de: ['Hälfte', 'halb'], app: 'Eine Pizza wird in zwei gleiche Teile geteilt — jeder bekommt so viel.' },
  { id: 'c1_u05_15', ar: 'رُبْع', tr: 'rubʿ', pos: 'Substantiv', g: 'maskulin', pl: 'أَرْبَاع', de: ['Viertel'], app: 'Ein Kuchen wird in vier gleiche Teile geteilt — jedes Stück ist so groß.' },
  { id: 'c1_u05_16', ar: 'كَثِير', tr: 'kathīr', pos: 'Adjektiv', g: null, pl: null, de: ['viel', 'viele'], app: 'Der Korb ist bis oben gefüllt.' },
  { id: 'c1_u05_17', ar: 'قَلِيل', tr: 'qalīl', pos: 'Adjektiv', g: null, pl: null, de: ['wenig', 'wenige'], app: 'Im Kühlschrank ist fast nichts mehr übrig.' },
  { id: 'c1_u05_18', ar: 'كِيلُوغْرَام', tr: 'kīlūghrām', pos: 'Substantiv', g: 'maskulin', pl: null, de: ['Kilogramm'], app: 'Eine gängige Maßeinheit beim Wiegen von Obst.' },
  { id: 'c1_u05_19', ar: 'مِتْر', tr: 'mitr', pos: 'Substantiv', g: 'maskulin', pl: 'أَمْتَار', de: ['Meter'], app: 'Eine gängige Maßeinheit für Längen.' },
  { id: 'c1_u05_20', ar: 'لِتْر', tr: 'litr', pos: 'Substantiv', g: 'maskulin', pl: 'لِتْرَات', de: ['Liter'], app: 'Eine gängige Maßeinheit für Flüssigkeiten wie Wasser.' }
];

module.exports = { UNIT_1, UNIT_2, UNIT_3, UNIT_4, UNIT_5 };
