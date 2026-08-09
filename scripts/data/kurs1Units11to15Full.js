// Kurs 1, Units 11-15 — vollständiges Datenmodell für die 135 noch unvollständigen Wörter
// dieses Batches (Entwicklungsauftrag 8). Gleiche Feldkürzel wie kurs1Units6to10Full.js: ar =
// arabisch vokalisiert, tr = Transliteration, pos = Wortart (aus dem zentralen, bereits
// etablierten deutschsprachigen Wortarten-Vokabular, siehe scripts/validateCourse.js
// KNOWN_PART_OF_SPEECH — Entwicklungsauftrag 8, Abschnitt 8, hält bewusst an der über 388
// Wörter etablierten Konvention fest, statt parallel ein zweites, englisches Vokabular
// einzuführen), g = Genus, pl = Plural vokalisiert (oder null), de = Array deutscher
// Antworten, app = Kontext-Satz für application_prompts, opp = ID des Gegensatzworts
// (gegenseitig verknüpft), conf = confusion_group-Name (nur bei didaktischem Nutzen).
//
// Umschrift-Konvention (Entwicklungsauftrag 8, Abschnitt 7) — bereits über 388 Wörter etabliert,
// hier fortgeführt: Langvokale mit Makron (ā ī ū), Hamza ʾ, ʿAyn ʿ, emphatische Konsonanten mit
// Punkt (ḥ ṣ ḍ ṭ ẓ), digraphische sh/kh/gh/th/dh (NICHT š/ḫ/ġ).

const UNIT_11 = [
  { id: 'c1_u11_01', ar: 'اِشْتَرَى', tr: 'ishtarā', pos: 'Verb (3. Pers. m. Vergangenheit)', g: null, pl: null, de: ['kaufen'], app: 'Du möchtest sagen, dass du etwas kaufen möchtest.' },
  { id: 'c1_u11_02', ar: 'بَاعَ', tr: 'bāʿa', pos: 'Verb (3. Pers. m. Vergangenheit)', g: null, pl: null, de: ['verkaufen'], app: 'Der Verkäufer hat dir gerade etwas verkauft.' },
  { id: 'c1_u11_03', ar: 'دَفَعَ', tr: 'dafaʿa', pos: 'Verb (3. Pers. m. Vergangenheit)', g: null, pl: null, de: ['bezahlen'], app: 'Du gehst an die Kasse, um zu bezahlen.' },
  { id: 'c1_u11_04', ar: 'كَلَّفَ', tr: 'kallafa', pos: 'Verb (3. Pers. m. Vergangenheit)', g: null, pl: null, de: ['kosten'], app: 'Du fragst, wie viel etwas kostet.' },
  { id: 'c1_u11_05', ar: 'رَخِيص', tr: 'rakhīṣ', pos: 'Adjektiv', g: 'maskulin', pl: null, de: ['billig', 'günstig'], app: 'Du möchtest sagen, dass etwas günstig ist.', opp: 'c1_u11_06', conf: 'c1_price_terms' },
  { id: 'c1_u11_06', ar: 'غَالٍ', tr: 'ghālin', pos: 'Adjektiv', g: 'maskulin', pl: null, de: ['teuer'], app: 'Du möchtest sagen, dass etwas teuer ist.', opp: 'c1_u11_05', conf: 'c1_price_terms' },
  { id: 'c1_u11_07', ar: 'خَصْم', tr: 'khaṣm', pos: 'Substantiv', g: 'maskulin', pl: null, de: ['Rabatt'], app: 'Der Laden gibt dir heute einen Preisnachlass.', conf: 'c1_price_terms' },
  { id: 'c1_u11_08', ar: 'تَخْفِيضَات', tr: 'takhfīḍāt', pos: 'Substantiv (Plural)', g: null, pl: null, de: ['Sonderangebote', 'Preisnachlässe'], app: 'Im Schaufenster steht ein großes Schild mit reduzierten Preisen.', conf: 'c1_price_terms' },
  { id: 'c1_u11_09', ar: 'سُوق', tr: 'sūq', pos: 'Substantiv', g: 'feminin', pl: 'أَسْوَاق', de: ['Markt'], app: 'Du kaufst hier frisches Gemüse direkt von vielen Ständen.' },
  { id: 'c1_u11_10', ar: 'سُوبَرْمَارْكِت', tr: 'sūbarmārkit', pos: 'Substantiv', g: 'maskulin', pl: null, de: ['Supermarkt'], app: 'Ein großer Laden mit fast allen Lebensmitteln unter einem Dach.' },
  { id: 'c1_u11_11', ar: 'زَبُون', tr: 'zabūn', pos: 'Substantiv', g: 'maskulin', pl: 'زَبَائِن', de: ['Kunde'], app: 'Diese Person kauft gerade etwas im Laden.' },
  { id: 'c1_u11_12', ar: 'بَائِع', tr: 'bāʾiʿ', pos: 'Substantiv', g: 'maskulin', pl: 'بَاعَة', de: ['Verkäufer'], app: 'Diese Person arbeitet im Laden und verkauft dir etwas.' },
  { id: 'c1_u11_13', ar: 'نَقْداً', tr: 'naqdan', pos: 'Adverb', g: null, pl: null, de: ['bar', 'in bar'], app: 'Du bezahlst mit Geldscheinen statt mit Karte.', conf: 'c1_payment_methods' },
  { id: 'c1_u11_14', ar: 'بِطَاقَة', tr: 'biṭāqa', pos: 'Substantiv', g: 'feminin', pl: 'بِطَاقَات', de: ['Karte (Bankkarte)'], app: 'Du bezahlst damit, ohne Bargeld dabeizuhaben.', conf: 'c1_payment_methods' },
  { id: 'c1_u11_15', ar: 'بَنْك', tr: 'bank', pos: 'Substantiv', g: 'maskulin', pl: 'بُنُوك', de: ['Bank'], app: 'Hier verwaltest du dein Geld auf einem Konto.', conf: 'c1_payment_methods' },
  { id: 'c1_u11_16', ar: 'حِسَاب', tr: 'ḥisāb', pos: 'Substantiv', g: 'maskulin', pl: 'حِسَابَات', de: ['Konto'], app: 'Dein Geld liegt bei der Bank auf diesem Konto.', conf: 'c1_payment_methods' },
  { id: 'c1_u11_17', ar: 'إِيصَال', tr: 'īṣāl', pos: 'Substantiv', g: 'maskulin', pl: 'إِيصَالَات', de: ['Quittung', 'Kassenbon'], app: 'Nach dem Bezahlen bekommst du diesen kleinen Zettel.' },
  { id: 'c1_u11_18', ar: 'اَلْبَاقِي', tr: 'al-bāqī', pos: 'Substantiv', g: 'maskulin', pl: null, de: ['Wechselgeld', 'Rest'], app: 'Du zahlst mehr als nötig und bekommst diesen Betrag zurück.' },
  { id: 'c1_u11_19', ar: 'مَقَاس', tr: 'maqās', pos: 'Substantiv', g: 'maskulin', pl: 'مَقَاسَات', de: ['Größe', 'Konfektionsgröße'], app: 'Du fragst, ob das Kleidungsstück in deiner Größe vorhanden ist.' },
  { id: 'c1_u11_20', ar: 'وَزْن', tr: 'wazn', pos: 'Substantiv', g: 'maskulin', pl: 'أَوْزَان', de: ['Gewicht'], app: 'An der Kasse wird das Obst nach diesem Wert bezahlt.' },
  { id: 'c1_u11_21', ar: 'قِطْعَة', tr: 'qiṭʿa', pos: 'Substantiv', g: 'feminin', pl: 'قِطَع', de: ['Stück'], app: 'Du kaufst nicht die ganze Menge, sondern nur eines davon.' },
  { id: 'c1_u11_22', ar: 'كَمِّيَّة', tr: 'kammiyya', pos: 'Substantiv', g: 'feminin', pl: 'كَمِّيَّات', de: ['Menge'], app: 'Du sagst, wie viel du von etwas möchtest.' },
  { id: 'c1_u11_23', ar: 'مَفْتُوح', tr: 'maftūḥ', pos: 'Adjektiv', g: 'maskulin', pl: null, de: ['geöffnet'], app: 'Der Laden hat gerade Kunden — du kannst hineingehen.', opp: 'c1_u11_24' },
  { id: 'c1_u11_24', ar: 'مُغْلَق', tr: 'mughlaq', pos: 'Adjektiv', g: 'maskulin', pl: null, de: ['geschlossen'], app: 'Der Laden hat gerade keine Kunden — die Tür ist zu.', opp: 'c1_u11_23' },
  { id: 'c1_u11_25', ar: 'مُتَوَفِّر', tr: 'mutawaffir', pos: 'Adjektiv', g: 'maskulin', pl: null, de: ['verfügbar'], app: 'Du fragst, ob der Artikel noch vorrätig ist.' },
  { id: 'c1_u11_26', ar: 'اِخْتَارَ', tr: 'ikhtāra', pos: 'Verb (3. Pers. m. Vergangenheit)', g: null, pl: null, de: ['auswählen'], app: 'Du entscheidest dich zwischen mehreren Angeboten für eines.' }
];

const UNIT_12 = [
  { id: 'c1_u12_01', ar: 'فُسْتَان', tr: 'fustān', pos: 'Substantiv', g: 'maskulin', pl: 'فَسَاتِين', de: ['Kleid'], app: 'Du beschreibst ein Kleidungsstück für Frauen, das in einem Stück getragen wird.' },
  { id: 'c1_u12_02', ar: 'تَنُّورَة', tr: 'tannūra', pos: 'Substantiv', g: 'feminin', pl: 'تَنَانِير', de: ['Rock'], app: 'Du beschreibst ein Kleidungsstück, das nur die untere Körperhälfte bedeckt.' },
  { id: 'c1_u12_03', ar: 'سُتْرَة', tr: 'sutra', pos: 'Substantiv', g: 'feminin', pl: 'سُتَر', de: ['Jacke'], app: 'Du ziehst das über dein Hemd, wenn dir kalt ist.' },
  { id: 'c1_u12_04', ar: 'كَنْزَة', tr: 'kanza', pos: 'Substantiv', g: 'feminin', pl: 'كَنَزَات', de: ['Pullover'], app: 'Ein warmes Kleidungsstück aus Wolle für den Oberkörper.' },
  { id: 'c1_u12_05', ar: 'تِي شِيرْت', tr: 'tī shīrt', pos: 'Substantiv', g: 'maskulin', pl: null, de: ['T-Shirt'], app: 'Ein einfaches, kurzärmeliges Kleidungsstück für den Oberkörper.' },
  { id: 'c1_u12_06', ar: 'جَوَارِب', tr: 'jawārib', pos: 'Substantiv (Plural)', g: null, pl: null, de: ['Socken'], app: 'Du ziehst sie vor den Schuhen an.' },
  { id: 'c1_u12_07', ar: 'مَلَابِس دَاخِلِيَّة', tr: 'malābis dākhiliyya', pos: 'Substantiv (Plural)', g: null, pl: null, de: ['Unterwäsche'], app: 'Du trägst sie direkt auf der Haut, unter der restlichen Kleidung.' },
  { id: 'c1_u12_08', ar: 'وِشَاح', tr: 'wishāḥ', pos: 'Substantiv', g: 'maskulin', pl: 'وُشُح', de: ['Schal'], app: 'Du trägst ihn im Winter um den Hals.' },
  { id: 'c1_u12_09', ar: 'حِزَام', tr: 'ḥizām', pos: 'Substantiv', g: 'maskulin', pl: 'أَحْزِمَة', de: ['Gürtel'], app: 'Er hält deine Hose an der Taille.' },
  { id: 'c1_u12_10', ar: 'قُفَّازَات', tr: 'quffāzāt', pos: 'Substantiv (Plural)', g: null, pl: null, de: ['Handschuhe'], app: 'Du trägst sie im Winter an den Händen.' },
  { id: 'c1_u12_11', ar: 'نَظَّارَة', tr: 'naẓẓāra', pos: 'Substantiv', g: 'feminin', pl: 'نَظَّارَات', de: ['Brille'], app: 'Du trägst sie, um besser zu sehen.' },
  { id: 'c1_u12_12', ar: 'سَاعَة يَد', tr: 'sāʿat yad', pos: 'Substantiv', g: 'feminin', pl: null, de: ['Armbanduhr'], app: 'Du trägst sie am Handgelenk, um die Uhrzeit zu sehen.' },
  { id: 'c1_u12_13', ar: 'خَاتَم', tr: 'khātam', pos: 'Substantiv', g: 'maskulin', pl: 'خَوَاتِم', de: ['Ring'], app: 'Ein Schmuckstück für den Finger.', conf: 'c1_accessories' },
  { id: 'c1_u12_14', ar: 'قِلَادَة', tr: 'qilāda', pos: 'Substantiv', g: 'feminin', pl: 'قَلَائِد', de: ['Halskette'], app: 'Ein Schmuckstück für den Hals.', conf: 'c1_accessories' },
  { id: 'c1_u12_15', ar: 'قُرْط', tr: 'qurṭ', pos: 'Substantiv', g: 'maskulin', pl: 'أَقْرَاط', de: ['Ohrring'], app: 'Ein Schmuckstück für das Ohr.', conf: 'c1_accessories' },
  { id: 'c1_u12_16', ar: 'حَقِيبَة يَد', tr: 'ḥaqībat yad', pos: 'Substantiv', g: 'feminin', pl: null, de: ['Handtasche'], app: 'Du trägst darin deine persönlichen Sachen unterwegs.' },
  { id: 'c1_u12_17', ar: 'مِحْفَظَة', tr: 'miḥfaẓa', pos: 'Substantiv', g: 'feminin', pl: 'مَحَافِظ', de: ['Geldbörse'], app: 'Darin bewahrst du dein Geld und deine Karten auf.' },
  { id: 'c1_u12_18', ar: 'مِظَلَّة', tr: 'miẓalla', pos: 'Substantiv', g: 'feminin', pl: 'مِظَلَّات', de: ['Regenschirm'], app: 'Du öffnest sie, wenn es regnet.' },
  { id: 'c1_u12_19', ar: 'زِرّ', tr: 'zirr', pos: 'Substantiv', g: 'maskulin', pl: 'أَزْرَار', de: ['Knopf'], app: 'Du schließt damit ein Hemd.' },
  { id: 'c1_u12_20', ar: 'سَحَّاب', tr: 'saḥḥāb', pos: 'Substantiv', g: 'maskulin', pl: 'سَحَّابَات', de: ['Reißverschluss'], app: 'Du ziehst ihn zu, um eine Jacke zu schließen.' },
  { id: 'c1_u12_21', ar: 'لَبِسَ', tr: 'labisa', pos: 'Verb (3. Pers. m. Vergangenheit)', g: null, pl: null, de: ['anziehen (Kleidung, allgemein)', 'tragen'], app: 'Du ziehst morgens deine Kleidung an.', opp: 'c1_u12_22' },
  { id: 'c1_u12_22', ar: 'خَلَعَ', tr: 'khalaʿa', pos: 'Verb (3. Pers. m. Vergangenheit)', g: null, pl: null, de: ['ausziehen'], app: 'Du ziehst abends deine Kleidung wieder aus.', opp: 'c1_u12_21' },
  { id: 'c1_u12_23', ar: 'لَوْن', tr: 'lawn', pos: 'Substantiv', g: 'maskulin', pl: 'أَلْوَان', de: ['Farbe'], app: 'Du fragst, welche Farbe ein Kleidungsstück hat.' },
  { id: 'c1_u12_24', ar: 'قُمَاش', tr: 'qumāsh', pos: 'Substantiv', g: 'maskulin', pl: 'أَقْمِشَة', de: ['Stoff'], app: 'Das Material, aus dem ein Kleidungsstück genäht ist.' },
  { id: 'c1_u12_25', ar: 'جَيْب', tr: 'jayb', pos: 'Substantiv', g: 'maskulin', pl: 'جُيُوب', de: ['Tasche (an Kleidung)'], app: 'Du steckst deinen Schlüssel hier in deine Hose.' }
];

const UNIT_13 = [
  { id: 'c1_u13_01', ar: 'شَعْر', tr: 'shaʿr', pos: 'Substantiv', g: 'maskulin', pl: null, de: ['Haar'], app: 'Welches Wort bezeichnet einen Körperteil? Das hier wächst auf deinem Kopf.' },
  { id: 'c1_u13_02', ar: 'وَجْه', tr: 'wajh', pos: 'Substantiv', g: 'maskulin', pl: 'وُجُوه', de: ['Gesicht'], app: 'Augen, Nase und Mund befinden sich hier.' },
  { id: 'c1_u13_03', ar: 'أُذُن', tr: 'udhun', pos: 'Substantiv', g: 'feminin', pl: 'آذَان', de: ['Ohr'], app: 'Du möchtest sagen, womit du hörst.' },
  { id: 'c1_u13_04', ar: 'سِنّ', tr: 'sinn', pos: 'Substantiv', g: 'feminin', pl: 'أَسْنَان', de: ['Zahn'], app: 'Damit beißt du in einen Apfel.' },
  { id: 'c1_u13_05', ar: 'لِسَان', tr: 'lisān', pos: 'Substantiv', g: 'maskulin', pl: 'أَلْسِنَة', de: ['Zunge'], app: 'Damit schmeckst du dein Essen.' },
  { id: 'c1_u13_06', ar: 'رَقَبَة', tr: 'raqaba', pos: 'Substantiv', g: 'feminin', pl: 'رِقَاب', de: ['Hals', 'Nacken'], app: 'Zwischen Kopf und Schultern liegt dieser Körperteil.' },
  { id: 'c1_u13_07', ar: 'كَتِف', tr: 'katif', pos: 'Substantiv', g: 'feminin', pl: 'أَكْتَاف', de: ['Schulter'], app: 'Hier beginnt dein Arm am Rumpf.' },
  { id: 'c1_u13_08', ar: 'ذِرَاع', tr: 'dhirāʿ', pos: 'Substantiv', g: 'feminin', pl: 'أَذْرُع', de: ['Arm (Körperteil)'], app: 'Damit hebst du etwas hoch.' },
  { id: 'c1_u13_09', ar: 'إِصْبَع', tr: 'iṣbaʿ', pos: 'Substantiv', g: 'feminin', pl: 'أَصَابِع', de: ['Finger'], app: 'Du hast fünf davon an jeder Hand.' },
  { id: 'c1_u13_10', ar: 'صَدْر', tr: 'ṣadr', pos: 'Substantiv', g: 'maskulin', pl: 'صُدُور', de: ['Brust'], app: 'Vorne an deinem Oberkörper, über dem Bauch.', conf: 'c1_torso' },
  { id: 'c1_u13_11', ar: 'ظَهْر', tr: 'ẓahr', pos: 'Substantiv', g: 'maskulin', pl: 'ظُهُور', de: ['Rücken'], app: 'Die Rückseite deines Oberkörpers.', conf: 'c1_torso' },
  { id: 'c1_u13_12', ar: 'بَطْن', tr: 'baṭn', pos: 'Substantiv', g: 'maskulin', pl: 'بُطُون', de: ['Bauch'], app: 'Zwischen Brust und Beinen liegt dieser Körperteil.', conf: 'c1_torso' },
  { id: 'c1_u13_13', ar: 'سَاق', tr: 'sāq', pos: 'Substantiv', g: 'feminin', pl: 'سِيقَان', de: ['Bein', 'Unterschenkel'], app: 'Damit läufst und stehst du.' },
  { id: 'c1_u13_14', ar: 'رُكْبَة', tr: 'rukba', pos: 'Substantiv', g: 'feminin', pl: 'رُكَب', de: ['Knie'], app: 'Dieses Gelenk kannst du beim Sitzen beugen.' },
  { id: 'c1_u13_15', ar: 'قَلْب', tr: 'qalb', pos: 'Substantiv', g: 'maskulin', pl: 'قُلُوب', de: ['Herz'], app: 'Dieses Organ pumpt dein Blut durch den Körper.' },
  { id: 'c1_u13_16', ar: 'دَم', tr: 'dam', pos: 'Substantiv', g: 'maskulin', pl: 'دِمَاء', de: ['Blut'], app: 'Diese rote Flüssigkeit fließt in deinem Körper.' },
  { id: 'c1_u13_17', ar: 'بَشَرَة', tr: 'bashara', pos: 'Substantiv', g: 'feminin', pl: null, de: ['Haut'], app: 'Diese Hülle bedeckt deinen ganzen Körper.' },
  { id: 'c1_u13_18', ar: 'دِمَاغ', tr: 'dimāgh', pos: 'Substantiv', g: 'maskulin', pl: 'أَدْمِغَة', de: ['Gehirn'], app: 'Mit diesem Organ denkst du.' },
  { id: 'c1_u13_19', ar: 'عَظْم', tr: 'ʿaẓm', pos: 'Substantiv', g: 'maskulin', pl: 'عِظَام', de: ['Knochen'], app: 'Dieses harte Teil gibt deinem Körper seine Form.' },
  { id: 'c1_u13_20', ar: 'عَضَلَة', tr: 'ʿaḍala', pos: 'Substantiv', g: 'feminin', pl: 'عَضَلَات', de: ['Muskel'], app: 'Damit bewegst du deine Knochen.' },
  { id: 'c1_u13_21', ar: 'رَأَى', tr: 'raʾā', pos: 'Verb (3. Pers. m. Vergangenheit)', g: null, pl: null, de: ['sehen'], app: 'Du möchtest sagen, womit du siehst.', conf: 'c1_senses' },
  { id: 'c1_u13_22', ar: 'سَمِعَ', tr: 'samiʿa', pos: 'Verb (3. Pers. m. Vergangenheit)', g: null, pl: null, de: ['hören'], app: 'Du möchtest sagen, womit du hörst.', conf: 'c1_senses' },
  { id: 'c1_u13_23', ar: 'شَمَّ', tr: 'shamma', pos: 'Verb (3. Pers. m. Vergangenheit)', g: null, pl: null, de: ['riechen'], app: 'Du möchtest sagen, womit du riechst.', conf: 'c1_senses' },
  { id: 'c1_u13_24', ar: 'لَمَسَ', tr: 'lamasa', pos: 'Verb (3. Pers. m. Vergangenheit)', g: null, pl: null, de: ['berühren', 'tasten'], app: 'Du möchtest sagen, womit du etwas fühlst.', conf: 'c1_senses' }
];

const UNIT_14 = [
  { id: 'c1_u14_01', ar: 'صِحَّة', tr: 'ṣiḥḥa', pos: 'Substantiv', g: 'feminin', pl: null, de: ['Gesundheit'], app: 'Der allgemeine Zustand deines Körpers, wenn dir nichts fehlt.', opp: 'c1_u14_03' },
  { id: 'c1_u14_02', ar: 'مَرِيض', tr: 'marīḍ', pos: 'Substantiv/Adjektiv', g: 'maskulin', pl: null, de: ['krank', 'Patient'], app: 'Du möchtest ausdrücken, dass du krank bist.' },
  { id: 'c1_u14_03', ar: 'مَرَض', tr: 'maraḍ', pos: 'Substantiv', g: 'maskulin', pl: 'أَمْرَاض', de: ['Krankheit'], app: 'Der Oberbegriff für das, was dich krank macht.', opp: 'c1_u14_01' },
  { id: 'c1_u14_04', ar: 'أَلَم', tr: 'alam', pos: 'Substantiv', g: 'maskulin', pl: 'آلَام', de: ['Schmerz'], app: 'Du möchtest sagen, dass dir etwas wehtut.', conf: 'c1_symptoms' },
  { id: 'c1_u14_05', ar: 'صُدَاع', tr: 'ṣudāʿ', pos: 'Substantiv', g: 'maskulin', pl: null, de: ['Kopfschmerzen'], app: 'Dein Kopf tut weh.', conf: 'c1_symptoms' },
  { id: 'c1_u14_06', ar: 'حُمَّى', tr: 'ḥummā', pos: 'Substantiv', g: 'feminin', pl: null, de: ['Fieber'], app: 'Deine Körpertemperatur ist höher als normal.', conf: 'c1_symptoms' },
  { id: 'c1_u14_07', ar: 'سُعَال', tr: 'suʿāl', pos: 'Substantiv', g: 'maskulin', pl: null, de: ['Husten'], app: 'Ein typisches Symptom bei einer Erkältung.', conf: 'c1_symptoms' },
  { id: 'c1_u14_08', ar: 'زُكَام', tr: 'zukām', pos: 'Substantiv', g: 'maskulin', pl: null, de: ['Erkältung', 'Schnupfen'], app: 'Eine leichte, häufige Krankheit mit laufender Nase.', conf: 'c1_symptoms' },
  { id: 'c1_u14_09', ar: 'إِنْفْلُونْزَا', tr: 'infilwanzā', pos: 'Substantiv', g: 'feminin', pl: null, de: ['Grippe'], app: 'Eine stärkere Erkältungskrankheit mit Fieber.' },
  { id: 'c1_u14_10', ar: 'حَسَاسِيَّة', tr: 'ḥasāsiyya', pos: 'Substantiv', g: 'feminin', pl: null, de: ['Allergie'], app: 'Dein Körper reagiert empfindlich auf bestimmte Dinge.' },
  { id: 'c1_u14_11', ar: 'جُرْح', tr: 'jurḥ', pos: 'Substantiv', g: 'maskulin', pl: 'جُرُوح', de: ['Wunde'], app: 'Eine offene Stelle auf deiner Haut.' },
  { id: 'c1_u14_12', ar: 'إِصَابَة', tr: 'iṣāba', pos: 'Substantiv', g: 'feminin', pl: 'إِصَابَات', de: ['Verletzung'], app: 'Du hast dir beim Sport oder Sturz wehgetan.' },
  { id: 'c1_u14_13', ar: 'دَوَاء', tr: 'dawāʾ', pos: 'Substantiv', g: 'maskulin', pl: 'أَدْوِيَة', de: ['Medikament'], app: 'Das nimmst du gegen deine Krankheit ein.', conf: 'c1_medical_words' },
  { id: 'c1_u14_14', ar: 'قُرْص', tr: 'qurṣ', pos: 'Substantiv', g: 'maskulin', pl: 'أَقْرَاص', de: ['Tablette'], app: 'Eine feste, runde Form eines Medikaments.', conf: 'c1_medical_words' },
  { id: 'c1_u14_15', ar: 'صَيْدَلِيَّة', tr: 'ṣaydaliyya', pos: 'Substantiv', g: 'feminin', pl: 'صَيْدَلِيَّات', de: ['Apotheke'], app: 'Du suchst einen Ort, an dem du ein Medikament bekommst.' },
  { id: 'c1_u14_16', ar: 'مَوْعِد', tr: 'mawʿid', pos: 'Substantiv', g: 'maskulin', pl: 'مَوَاعِيد', de: ['Termin'], app: 'Du vereinbarst eine feste Uhrzeit beim Arzt.' },
  { id: 'c1_u14_17', ar: 'طَوَارِئ', tr: 'ṭawāriʾ', pos: 'Substantiv (Plural)', g: null, pl: null, de: ['Notfall', 'Notaufnahme'], app: 'Du brauchst sofort Hilfe, es kann nicht warten.' },
  { id: 'c1_u14_18', ar: 'سَيَّارَة إِسْعَاف', tr: 'sayyārat isʿāf', pos: 'Substantiv', g: 'feminin', pl: null, de: ['Krankenwagen'], app: 'Dieses Fahrzeug bringt dich schnell ins Krankenhaus.' },
  { id: 'c1_u14_19', ar: 'ضَغْط الدَّم', tr: 'ḍaghṭ ad-dam', pos: 'Substantiv', g: 'maskulin', pl: null, de: ['Blutdruck'], app: 'Der Arzt misst diesen Wert mit einem Gerät am Arm.' },
  { id: 'c1_u14_20', ar: 'حَرَارَة', tr: 'ḥarāra', pos: 'Substantiv', g: 'feminin', pl: null, de: ['Temperatur (Körper/Fieber)'], app: 'Der Arzt misst, wie warm dein Körper gerade ist.' },
  { id: 'c1_u14_21', ar: 'عَرَض', tr: 'ʿaraḍ', pos: 'Substantiv', g: 'maskulin', pl: 'أَعْرَاض', de: ['Symptom'], app: 'Ein Zeichen dafür, dass du krank bist.' },
  { id: 'c1_u14_22', ar: 'عِلَاج', tr: 'ʿilāj', pos: 'Substantiv', g: 'maskulin', pl: 'عِلَاجَات', de: ['Behandlung'], app: 'Das, was der Arzt macht, damit du wieder gesund wirst.' },
  { id: 'c1_u14_23', ar: 'فَحْص', tr: 'faḥṣ', pos: 'Substantiv', g: 'maskulin', pl: 'فُحُوصَات', de: ['Untersuchung'], app: 'Der Arzt schaut sich genau an, was mit dir los ist.' },
  { id: 'c1_u14_24', ar: 'عَمَلِيَّة', tr: 'ʿamaliyya', pos: 'Substantiv', g: 'feminin', pl: 'عَمَلِيَّات', de: ['Operation'], app: 'Ein größerer medizinischer Eingriff im Krankenhaus.' },
  { id: 'c1_u14_25', ar: 'وَصْفَة طِبِّيَّة', tr: 'waṣfa ṭibbiyya', pos: 'Substantiv', g: 'feminin', pl: null, de: ['Rezept (ärztliche Verordnung)'], app: 'Der Arzt schreibt dir auf, welches Medikament du brauchst.' },
  { id: 'c1_u14_26', ar: 'ضِمَادَة', tr: 'ḍimāda', pos: 'Substantiv', g: 'feminin', pl: 'ضِمَادَات', de: ['Verband'], app: 'Damit wird eine Wunde abgedeckt.' },
  { id: 'c1_u14_27', ar: 'حُقْنَة', tr: 'ḥuqna', pos: 'Substantiv', g: 'feminin', pl: 'حُقَن', de: ['Spritze', 'Injektion'], app: 'Der Arzt gibt dir ein Medikament mit einer Nadel.' },
  { id: 'c1_u14_28', ar: 'رَاحَة', tr: 'rāḥa', pos: 'Substantiv', g: 'feminin', pl: null, de: ['Ruhe', 'Erholung'], app: 'Das brauchst du, um nach einer Krankheit wieder gesund zu werden.' },
  { id: 'c1_u14_29', ar: 'نَوْم', tr: 'nawm', pos: 'Substantiv', g: 'maskulin', pl: null, de: ['Schlaf'], app: 'Das hilft deinem Körper, sich zu erholen.' },
  { id: 'c1_u14_30', ar: 'تَنَفَّسَ', tr: 'tanaffasa', pos: 'Verb (3. Pers. m. Vergangenheit)', g: null, pl: null, de: ['atmen'], app: 'Du möchtest sagen, dass du tief Luft holst.' }
];

const UNIT_15 = [
  { id: 'c1_u15_01', ar: 'سَعِيد', tr: 'saʿīd', pos: 'Adjektiv', g: 'maskulin', pl: null, de: ['glücklich'], app: 'Du beschreibst jemanden als glücklich.', opp: 'c1_u15_02' },
  { id: 'c1_u15_02', ar: 'حَزِين', tr: 'ḥazīn', pos: 'Adjektiv', g: 'maskulin', pl: null, de: ['traurig'], app: 'Du beschreibst jemanden als traurig.', opp: 'c1_u15_01' },
  { id: 'c1_u15_03', ar: 'غَاضِب', tr: 'ghāḍib', pos: 'Adjektiv', g: 'maskulin', pl: null, de: ['wütend'], app: 'Du beschreibst jemanden, der sich sehr geärgert hat.' },
  { id: 'c1_u15_04', ar: 'خَائِف', tr: 'khāʾif', pos: 'Adjektiv', g: 'maskulin', pl: null, de: ['ängstlich'], app: 'Du beschreibst jemanden, der Angst hat.' },
  { id: 'c1_u15_05', ar: 'مُتْعَب', tr: 'mutʿab', pos: 'Adjektiv', g: 'maskulin', pl: null, de: ['müde', 'erschöpft'], app: 'Du möchtest sagen, dass du müde bist.' },
  { id: 'c1_u15_06', ar: 'قَلِق', tr: 'qaliq', pos: 'Adjektiv', g: 'maskulin', pl: null, de: ['besorgt'], app: 'Du beschreibst jemanden, der sich Sorgen macht.' },
  { id: 'c1_u15_07', ar: 'هَادِئ', tr: 'hādiʾ', pos: 'Adjektiv', g: 'maskulin', pl: null, de: ['ruhig'], app: 'Du beschreibst jemanden, der ganz entspannt ist.', opp: 'c1_u15_08', conf: 'c1_muta_adjectives' },
  { id: 'c1_u15_08', ar: 'مُتَوَتِّر', tr: 'mutawattir', pos: 'Adjektiv', g: 'maskulin', pl: null, de: ['nervös', 'angespannt'], app: 'Du beschreibst jemanden kurz vor einer Prüfung.', opp: 'c1_u15_07', conf: 'c1_muta_adjectives' },
  { id: 'c1_u15_09', ar: 'مُتَفَاجِئ', tr: 'mutafājiʾ', pos: 'Adjektiv', g: 'maskulin', pl: null, de: ['überrascht'], app: 'Du beschreibst jemanden, der etwas Unerwartetes erlebt hat.', conf: 'c1_muta_adjectives' },
  { id: 'c1_u15_10', ar: 'مَلَل', tr: 'malal', pos: 'Substantiv', g: 'maskulin', pl: null, de: ['Langeweile'], app: 'So fühlst du dich, wenn nichts Interessantes passiert.' },
  { id: 'c1_u15_11', ar: 'مَشْغُول', tr: 'mashghūl', pos: 'Adjektiv', g: 'maskulin', pl: null, de: ['beschäftigt'], app: 'Du hast gerade keine Zeit, weil du viel zu tun hast.', opp: 'c1_u15_12', conf: 'c1_muta_adjectives' },
  { id: 'c1_u15_12', ar: 'مُتَفَرِّغ', tr: 'mutafarrigh', pos: 'Adjektiv', g: 'maskulin', pl: null, de: ['frei', 'verfügbar'], app: 'Du hast gerade Zeit für etwas.', opp: 'c1_u15_11', conf: 'c1_muta_adjectives' },
  { id: 'c1_u15_13', ar: 'جَاهِز', tr: 'jāhiz', pos: 'Adjektiv', g: 'maskulin', pl: null, de: ['bereit'], app: 'Du bist fertig vorbereitet und kannst loslegen.' },
  { id: 'c1_u15_14', ar: 'مُتَأَكِّد', tr: 'mutaʾakkid', pos: 'Adjektiv', g: 'maskulin', pl: null, de: ['sicher', 'überzeugt'], app: 'Du bist dir bei einer Sache ganz sicher.', conf: 'c1_muta_adjectives' },
  { id: 'c1_u15_15', ar: 'مُرْتَبِك', tr: 'murtabik', pos: 'Adjektiv', g: 'maskulin', pl: null, de: ['verwirrt'], app: 'Du verstehst gerade nicht, was passiert.' },
  { id: 'c1_u15_16', ar: 'مُهْتَمّ', tr: 'muhtamm', pos: 'Adjektiv', g: 'maskulin', pl: null, de: ['interessiert'], app: 'Du möchtest mehr über ein Thema erfahren.' },
  { id: 'c1_u15_17', ar: 'مُتَحَمِّس', tr: 'mutaḥammis', pos: 'Adjektiv', g: 'maskulin', pl: null, de: ['begeistert'], app: 'Du freust dich sehr auf etwas.', conf: 'c1_muta_adjectives' },
  { id: 'c1_u15_18', ar: 'فَخُور', tr: 'fakhūr', pos: 'Adjektiv', g: 'maskulin', pl: null, de: ['stolz'], app: 'Du hast etwas geschafft und freust dich sehr darüber.' },
  { id: 'c1_u15_19', ar: 'خَجُول', tr: 'khajūl', pos: 'Adjektiv', g: 'maskulin', pl: null, de: ['schüchtern'], app: 'Du beschreibst jemanden, der sich vor Fremden zurückhält.' },
  { id: 'c1_u15_20', ar: 'وَحِيد', tr: 'waḥīd', pos: 'Adjektiv', g: 'maskulin', pl: null, de: ['allein', 'einsam'], app: 'Du beschreibst jemanden ohne Gesellschaft.' },
  { id: 'c1_u15_21', ar: 'قَوِيّ', tr: 'qawiyy', pos: 'Adjektiv', g: 'maskulin', pl: null, de: ['stark'], app: 'Du beschreibst jemanden als stark.', opp: 'c1_u15_22' },
  { id: 'c1_u15_22', ar: 'ضَعِيف', tr: 'ḍaʿīf', pos: 'Adjektiv', g: 'maskulin', pl: null, de: ['schwach'], app: 'Du beschreibst jemanden als schwach.', opp: 'c1_u15_21' },
  { id: 'c1_u15_23', ar: 'مُسْتَيْقِظ', tr: 'mustayqiẓ', pos: 'Adjektiv', g: 'maskulin', pl: null, de: ['wach'], app: 'Du beschreibst jemanden, der nicht mehr schläft.', opp: 'c1_u15_24' },
  { id: 'c1_u15_24', ar: 'نَائِم', tr: 'nāʾim', pos: 'Adjektiv', g: 'maskulin', pl: null, de: ['schlafend'], app: 'Du beschreibst jemanden, der gerade schläft.', opp: 'c1_u15_23' },
  { id: 'c1_u15_25', ar: 'حَيّ', tr: 'ḥayy', pos: 'Adjektiv', g: 'maskulin', pl: null, de: ['lebendig'], app: 'Du beschreibst etwas, das lebt.', opp: 'c1_u15_26' },
  { id: 'c1_u15_26', ar: 'مَيِّت', tr: 'mayyit', pos: 'Adjektiv', g: 'maskulin', pl: null, de: ['tot'], app: 'Du beschreibst etwas, das nicht mehr lebt.', opp: 'c1_u15_25' },
  { id: 'c1_u15_27', ar: 'سَهْل', tr: 'sahl', pos: 'Adjektiv', g: 'maskulin', pl: null, de: ['einfach (leicht)'], app: 'Du beschreibst eine Aufgabe, die dir leichtfällt.', opp: 'c1_u15_28' },
  { id: 'c1_u15_28', ar: 'صَعْب', tr: 'ṣaʿb', pos: 'Adjektiv', g: 'maskulin', pl: null, de: ['schwierig'], app: 'Du beschreibst eine Aufgabe, die dir schwerfällt.', opp: 'c1_u15_27' },
  { id: 'c1_u15_29', ar: 'مُهِمّ', tr: 'muhimm', pos: 'Adjektiv', g: 'maskulin', pl: null, de: ['wichtig'], app: 'Du beschreibst etwas, das viel Aufmerksamkeit verdient.' },
  { id: 'c1_u15_30', ar: 'مُمْكِن', tr: 'mumkin', pos: 'Adjektiv', g: 'maskulin', pl: null, de: ['möglich'], app: 'Du sagst, dass etwas realisierbar ist.' }
];

module.exports = { UNIT_11, UNIT_12, UNIT_13, UNIT_14, UNIT_15 };
