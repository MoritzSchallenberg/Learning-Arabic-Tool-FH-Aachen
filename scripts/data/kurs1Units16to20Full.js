// Kurs 1, Units 16-20 — vollständiges Datenmodell für die 134 noch unvollständigen Wörter dieses
// Batches (Entwicklungsauftrag 9). Gleiche Feldkürzel/Konventionen wie
// kurs1Units11to15Full.js: ar = arabisch vokalisiert, tr = Transliteration, pos = Wortart (aus dem
// zentralen deutschsprachigen Wortarten-Vokabular, siehe scripts/validateCourse.js
// KNOWN_PART_OF_SPEECH), g = Genus, pl = Plural vokalisiert (oder null), de = Array deutscher
// Antworten, app = Kontext-Satz für application_prompts, opp = ID des Gegensatzworts (gegenseitig
// verknüpft, nur innerhalb dieses Batches), conf = confusion_group-Name (nur bei didaktischem
// Nutzen).
//
// Umschrift-Konvention (unverändert seit Entwicklungsauftrag 6/7/8): Langvokale mit Makron
// (ā ī ū), Hamza ʾ, ʿAyn ʿ, emphatische Konsonanten mit Punkt (ḥ ṣ ḍ ṭ ẓ), digraphische
// sh/kh/gh/th/dh (NICHT š/ḫ/ġ/ṯ/ḏ).
//
// Wichtig zu c1_u16_07 ("فرش أسنانه"): die unvokalisierte Grundform war bereits im
// Meilenstein-2-Minimalmodell festgelegt (inkl. Objektsuffix "-ه") und wird hier NICHT verändert,
// nur um Vokalzeichen ergänzt (فَرَّشَ أَسْنَانَهُ strippt exakt wieder zu "فرش أسنانه").

const UNIT_16 = [
  { id: 'c1_u16_01', ar: 'اِسْتَيْقَظَ', tr: 'istayqaẓa', pos: 'Verb (3. Pers. m. Vergangenheit)', g: null, pl: null, de: ['aufwachen'], app: 'Du möchtest sagen, dass du morgens wach wirst.', opp: 'c1_u16_03' },
  { id: 'c1_u16_02', ar: 'نَهَضَ', tr: 'nahaḍa', pos: 'Verb (3. Pers. m. Vergangenheit)', g: null, pl: null, de: ['aufstehen'], app: 'Du möchtest sagen, dass du aus dem Bett aufstehst.', conf: 'c1_morning_routine' },
  { id: 'c1_u16_03', ar: 'نَامَ', tr: 'nāma', pos: 'Verb (3. Pers. m. Vergangenheit)', g: null, pl: null, de: ['schlafen'], app: 'Du möchtest sagen, dass du nachts schläfst.', opp: 'c1_u16_01', conf: 'c1_morning_routine' },
  { id: 'c1_u16_04', ar: 'غَسَلَ', tr: 'ghasala', pos: 'Verb (3. Pers. m. Vergangenheit)', g: null, pl: null, de: ['waschen'], app: 'Du möchtest sagen, dass du dir die Hände wäschst.', conf: 'c1_morning_routine' },
  { id: 'c1_u16_05', ar: 'اِسْتَحَمَّ', tr: 'istaḥamma', pos: 'Verb (3. Pers. m. Vergangenheit)', g: null, pl: null, de: ['duschen', 'baden'], app: 'Du möchtest sagen, dass du morgens duschst.', conf: 'c1_morning_routine' },
  { id: 'c1_u16_06', ar: 'اِرْتَدَى', tr: 'irtadā', pos: 'Verb (3. Pers. m. Vergangenheit)', g: null, pl: null, de: ['sich anziehen (im Tagesablauf)'], app: 'Du möchtest sagen, dass du dich morgens fertig machst.', conf: 'c1_morning_routine' },
  { id: 'c1_u16_07', ar: 'فَرَّشَ أَسْنَانَهُ', tr: 'farrasha asnānahu', pos: 'Ausdruck', g: null, pl: null, de: ['sich die Zähne putzen'], app: 'Du möchtest sagen, dass du dir morgens die Zähne putzt.' },
  { id: 'c1_u16_08', ar: 'خَرَجَ', tr: 'kharaja', pos: 'Verb (3. Pers. m. Vergangenheit)', g: null, pl: null, de: ['hinausgehen', 'verlassen'], app: 'Du möchtest sagen, dass du das Haus verlässt.', opp: 'c1_u16_09' },
  { id: 'c1_u16_09', ar: 'عَادَ', tr: 'ʿāda', pos: 'Verb (3. Pers. m. Vergangenheit)', g: null, pl: null, de: ['zurückkehren'], app: 'Du möchtest sagen, dass du abends nach Hause zurückkommst.', opp: 'c1_u16_08' },
  { id: 'c1_u16_10', ar: 'بَدَأَ', tr: 'badaʾa', pos: 'Verb (3. Pers. m. Vergangenheit)', g: null, pl: null, de: ['beginnen'], app: 'Du möchtest sagen, dass etwas anfängt.', opp: 'c1_u16_11' },
  { id: 'c1_u16_11', ar: 'اِنْتَهَى', tr: 'intahā', pos: 'Verb (3. Pers. m. Vergangenheit)', g: null, pl: null, de: ['enden', 'fertig sein'], app: 'Du möchtest sagen, dass etwas zu Ende ist.', opp: 'c1_u16_10' },
  { id: 'c1_u16_12', ar: 'فَتَحَ', tr: 'fataḥa', pos: 'Verb (3. Pers. m. Vergangenheit)', g: null, pl: null, de: ['öffnen'], app: 'Du möchtest sagen, dass du die Tür öffnest.', opp: 'c1_u16_13' },
  { id: 'c1_u16_13', ar: 'أَغْلَقَ', tr: 'aghlaqa', pos: 'Verb (3. Pers. m. Vergangenheit)', g: null, pl: null, de: ['schließen'], app: 'Du möchtest sagen, dass du die Tür schließt.', opp: 'c1_u16_12' },
  { id: 'c1_u16_14', ar: 'اِنْتَظَرَ', tr: 'intaẓara', pos: 'Verb (3. Pers. m. Vergangenheit)', g: null, pl: null, de: ['warten'], app: 'Du möchtest sagen, dass du auf den Bus wartest.' },
  { id: 'c1_u16_15', ar: 'جَلَسَ', tr: 'jalasa', pos: 'Verb (3. Pers. m. Vergangenheit)', g: null, pl: null, de: ['sitzen', 'sich setzen'], app: 'Du möchtest sagen, dass du dich auf einen Stuhl setzt.', opp: 'c1_u16_16' },
  { id: 'c1_u16_16', ar: 'وَقَفَ', tr: 'waqafa', pos: 'Verb (3. Pers. m. Vergangenheit)', g: null, pl: null, de: ['stehen', 'anhalten'], app: 'Du möchtest sagen, dass du aufstehst und stehen bleibst.', opp: 'c1_u16_15' },
  { id: 'c1_u16_17', ar: 'مَشَى', tr: 'mashā', pos: 'Verb (3. Pers. m. Vergangenheit)', g: null, pl: null, de: ['gehen (zu Fuß gehen)'], app: 'Du möchtest sagen, dass du zu Fuß zur Arbeit gehst.' },
  { id: 'c1_u16_18', ar: 'رَكَضَ', tr: 'rakaḍa', pos: 'Verb (3. Pers. m. Vergangenheit)', g: null, pl: null, de: ['laufen (rennen)'], app: 'Du möchtest sagen, dass du schnell rennst, um den Bus zu erreichen.' },
  { id: 'c1_u16_19', ar: 'قَادَ', tr: 'qāda', pos: 'Verb (3. Pers. m. Vergangenheit)', g: null, pl: null, de: ['fahren', 'lenken'], app: 'Du möchtest sagen, dass du ein Auto fährst.' },
  { id: 'c1_u16_20', ar: 'وَصَلَ', tr: 'waṣala', pos: 'Verb (3. Pers. m. Vergangenheit)', g: null, pl: null, de: ['ankommen'], app: 'Du möchtest sagen, dass du am Bahnhof angekommen bist.', opp: 'c1_u16_21' },
  { id: 'c1_u16_21', ar: 'غَادَرَ', tr: 'ghādara', pos: 'Verb (3. Pers. m. Vergangenheit)', g: null, pl: null, de: ['abfahren', 'verlassen'], app: 'Du möchtest sagen, dass der Zug den Bahnhof verlässt.', opp: 'c1_u16_20' },
  { id: 'c1_u16_22', ar: 'قَابَلَ', tr: 'qābala', pos: 'Verb (3. Pers. m. Vergangenheit)', g: null, pl: null, de: ['treffen'], app: 'Du möchtest sagen, dass du eine Freundin triffst.' },
  { id: 'c1_u16_23', ar: 'زَارَ', tr: 'zāra', pos: 'Verb (3. Pers. m. Vergangenheit)', g: null, pl: null, de: ['besuchen'], app: 'Du möchtest sagen, dass du deine Familie besuchst.' },
  { id: 'c1_u16_24', ar: 'نَظَّفَ', tr: 'naẓẓafa', pos: 'Verb (3. Pers. m. Vergangenheit)', g: null, pl: null, de: ['reinigen', 'putzen'], app: 'Du möchtest sagen, dass du die Küche putzt.' },
  { id: 'c1_u16_25', ar: 'قَرَأَ', tr: 'qaraʾa', pos: 'Verb (3. Pers. m. Vergangenheit)', g: null, pl: null, de: ['lesen (Tätigkeit)'], app: 'Du möchtest sagen, dass du abends ein Buch liest.' },
  { id: 'c1_u16_26', ar: 'كَتَبَ', tr: 'kataba', pos: 'Verb (3. Pers. m. Vergangenheit)', g: null, pl: null, de: ['schreiben'], app: 'Du möchtest sagen, dass du eine Nachricht schreibst.' },
  { id: 'c1_u16_27', ar: 'شَاهَدَ', tr: 'shāhada', pos: 'Verb (3. Pers. m. Vergangenheit)', g: null, pl: null, de: ['ansehen', 'beobachten'], app: 'Du möchtest sagen, dass du abends einen Film ansiehst.' },
  { id: 'c1_u16_28', ar: 'اِسْتَمَعَ', tr: 'istamaʿa', pos: 'Verb (3. Pers. m. Vergangenheit)', g: null, pl: null, de: ['zuhören'], app: 'Du möchtest sagen, dass du Musik zuhörst.' },
  { id: 'c1_u16_29', ar: 'اِسْتَرَاحَ', tr: 'istarāḥa', pos: 'Verb (3. Pers. m. Vergangenheit)', g: null, pl: null, de: ['sich ausruhen'], app: 'Du möchtest sagen, dass du dich nach der Arbeit ausruhst.' }
];

const UNIT_17 = [
  { id: 'c1_u17_01', ar: 'جَاءَ', tr: 'jāʾa', pos: 'Verb (3. Pers. m. Vergangenheit)', g: null, pl: null, de: ['kommen'], app: 'Du möchtest sagen, dass ein Freund zu dir kommt.' },
  { id: 'c1_u17_02', ar: 'أَخَذَ', tr: 'akhadha', pos: 'Verb (3. Pers. m. Vergangenheit)', g: null, pl: null, de: ['nehmen'], app: 'Du möchtest sagen, dass du das Buch nimmst.', opp: 'c1_u17_03', conf: 'c1_exchange_verbs' },
  { id: 'c1_u17_03', ar: 'أَعْطَى', tr: 'aʿṭā', pos: 'Verb (3. Pers. m. Vergangenheit)', g: null, pl: null, de: ['geben'], app: 'Du möchtest sagen, dass du deinem Freund etwas gibst.', opp: 'c1_u17_02', conf: 'c1_exchange_verbs' },
  { id: 'c1_u17_04', ar: 'أَحْضَرَ', tr: 'aḥḍara', pos: 'Verb (3. Pers. m. Vergangenheit)', g: null, pl: null, de: ['bringen'], app: 'Du möchtest sagen, dass du Wasser bringst.' },
  { id: 'c1_u17_05', ar: 'حَمَلَ', tr: 'ḥamala', pos: 'Verb (3. Pers. m. Vergangenheit)', g: null, pl: null, de: ['tragen'], app: 'Du möchtest sagen, dass du eine schwere Tasche trägst.' },
  { id: 'c1_u17_06', ar: 'وَضَعَ', tr: 'waḍaʿa', pos: 'Verb (3. Pers. m. Vergangenheit)', g: null, pl: null, de: ['legen', 'stellen', 'setzen'], app: 'Du möchtest sagen, dass du das Buch auf den Tisch legst.' },
  { id: 'c1_u17_07', ar: 'اِسْتَخْدَمَ', tr: 'istakhdama', pos: 'Verb (3. Pers. m. Vergangenheit)', g: null, pl: null, de: ['benutzen'], app: 'Du möchtest sagen, dass du dein Telefon benutzt.' },
  { id: 'c1_u17_08', ar: 'فَعَلَ', tr: 'faʿala', pos: 'Verb (3. Pers. m. Vergangenheit)', g: null, pl: null, de: ['tun', 'machen'], app: 'Du möchtest fragen, was jemand gerade tut.' },
  { id: 'c1_u17_09', ar: 'صَنَعَ', tr: 'ṣanaʿa', pos: 'Verb (3. Pers. m. Vergangenheit)', g: null, pl: null, de: ['herstellen', 'machen'], app: 'Du möchtest sagen, dass jemand etwas mit den eigenen Händen herstellt.' },
  { id: 'c1_u17_10', ar: 'وَجَدَ', tr: 'wajada', pos: 'Verb (3. Pers. m. Vergangenheit)', g: null, pl: null, de: ['finden'], app: 'Du möchtest sagen, dass du deinen Schlüssel gefunden hast.', opp: 'c1_u17_11' },
  { id: 'c1_u17_11', ar: 'فَقَدَ', tr: 'faqada', pos: 'Verb (3. Pers. m. Vergangenheit)', g: null, pl: null, de: ['verlieren'], app: 'Du möchtest sagen, dass du deinen Schlüssel verloren hast.', opp: 'c1_u17_10' },
  { id: 'c1_u17_12', ar: 'أَرْسَلَ', tr: 'arsala', pos: 'Verb (3. Pers. m. Vergangenheit)', g: null, pl: null, de: ['senden', 'schicken'], app: 'Du möchtest sagen, dass du eine Nachricht schickst.', conf: 'c1_exchange_verbs' },
  { id: 'c1_u17_13', ar: 'اِسْتَلَمَ', tr: 'istalama', pos: 'Verb (3. Pers. m. Vergangenheit)', g: null, pl: null, de: ['erhalten', 'entgegennehmen'], app: 'Du möchtest sagen, dass du ein Paket erhalten hast.', conf: 'c1_exchange_verbs' },
  { id: 'c1_u17_14', ar: 'سَاعَدَ', tr: 'sāʿada', pos: 'Verb (3. Pers. m. Vergangenheit)', g: null, pl: null, de: ['helfen'], app: 'Du möchtest sagen, dass du deiner Mutter hilfst.' },
  { id: 'c1_u17_15', ar: 'اِتَّصَلَ', tr: 'ittaṣala', pos: 'Verb (3. Pers. m. Vergangenheit)', g: null, pl: null, de: ['anrufen', 'Kontakt aufnehmen'], app: 'Du möchtest sagen, dass du deinen Freund anrufst.' },
  { id: 'c1_u17_16', ar: 'دَخَلَ', tr: 'dakhala', pos: 'Verb (3. Pers. m. Vergangenheit)', g: null, pl: null, de: ['eintreten', 'hineingehen'], app: 'Du möchtest sagen, dass du das Haus betrittst.', conf: 'c1_direction_verbs' },
  { id: 'c1_u17_17', ar: 'صَعِدَ', tr: 'ṣaʿida', pos: 'Verb (3. Pers. m. Vergangenheit)', g: null, pl: null, de: ['hinaufgehen', 'steigen'], app: 'Du möchtest sagen, dass du die Treppe hinaufgehst.', opp: 'c1_u17_18', conf: 'c1_direction_verbs' },
  { id: 'c1_u17_18', ar: 'نَزَلَ', tr: 'nazala', pos: 'Verb (3. Pers. m. Vergangenheit)', g: null, pl: null, de: ['hinuntergehen', 'aussteigen'], app: 'Du möchtest sagen, dass du aus dem Bus aussteigst.', opp: 'c1_u17_17', conf: 'c1_direction_verbs' },
  { id: 'c1_u17_19', ar: 'سَافَرَ', tr: 'sāfara', pos: 'Verb (3. Pers. m. Vergangenheit)', g: null, pl: null, de: ['reisen'], app: 'Du möchtest sagen, dass du in den Urlaub reist.' },
  { id: 'c1_u17_20', ar: 'تَحَرَّكَ', tr: 'taḥarraka', pos: 'Verb (3. Pers. m. Vergangenheit)', g: null, pl: null, de: ['sich bewegen'], app: 'Du möchtest sagen, dass sich das Auto zu bewegen beginnt.', opp: 'c1_u17_21' },
  { id: 'c1_u17_21', ar: 'تَوَقَّفَ', tr: 'tawaqqafa', pos: 'Verb (3. Pers. m. Vergangenheit)', g: null, pl: null, de: ['anhalten', 'stoppen'], app: 'Du möchtest sagen, dass das Auto vor der Ampel anhält.', opp: 'c1_u17_20' },
  { id: 'c1_u17_22', ar: 'دَارَ', tr: 'dāra', pos: 'Verb (3. Pers. m. Vergangenheit)', g: null, pl: null, de: ['sich drehen', 'abbiegen'], app: 'Du möchtest sagen, dass das Auto nach rechts abbiegt.' },
  { id: 'c1_u17_23', ar: 'عَبَرَ', tr: 'ʿabara', pos: 'Verb (3. Pers. m. Vergangenheit)', g: null, pl: null, de: ['überqueren'], app: 'Du möchtest sagen, dass du die Straße überquerst.' },
  { id: 'c1_u17_24', ar: 'رَمَى', tr: 'ramā', pos: 'Verb (3. Pers. m. Vergangenheit)', g: null, pl: null, de: ['werfen'], app: 'Du möchtest sagen, dass ein Kind einen Ball wirft.' },
  { id: 'c1_u17_25', ar: 'أَمْسَكَ', tr: 'amsaka', pos: 'Verb (3. Pers. m. Vergangenheit)', g: null, pl: null, de: ['fangen', 'festhalten'], app: 'Du möchtest sagen, dass du den Ball fängst.' }
];

const UNIT_18 = [
  { id: 'c1_u18_01', ar: 'عَرَفَ', tr: 'ʿarafa', pos: 'Verb (3. Pers. m. Vergangenheit)', g: null, pl: null, de: ['wissen', 'kennen'], app: 'Du möchtest sagen, dass du die Antwort weißt.' },
  { id: 'c1_u18_02', ar: 'فَكَّرَ', tr: 'fakkara', pos: 'Verb (3. Pers. m. Vergangenheit)', g: null, pl: null, de: ['denken'], app: 'Du möchtest sagen, dass du über etwas nachdenkst.' },
  { id: 'c1_u18_03', ar: 'تَذَكَّرَ', tr: 'tadhakkara', pos: 'Verb (3. Pers. m. Vergangenheit)', g: null, pl: null, de: ['sich erinnern'], app: 'Du möchtest sagen, dass du dich an deinen ersten Tag erinnerst.', opp: 'c1_u18_04' },
  { id: 'c1_u18_04', ar: 'نَسِيَ', tr: 'nasiya', pos: 'Verb (3. Pers. m. Vergangenheit)', g: null, pl: null, de: ['vergessen'], app: 'Du möchtest sagen, dass du deinen Schlüssel vergessen hast.', opp: 'c1_u18_03' },
  { id: 'c1_u18_05', ar: 'تَعَلَّمَ', tr: 'taʿallama', pos: 'Verb (3. Pers. m. Vergangenheit)', g: null, pl: null, de: ['lernen (etwas Neues erwerben)'], app: 'Du möchtest sagen, dass du Arabisch lernst.', conf: 'c1_learn_teach' },
  { id: 'c1_u18_06', ar: 'عَلَّمَ', tr: 'ʿallama', pos: 'Verb (3. Pers. m. Vergangenheit)', g: null, pl: null, de: ['lehren', 'unterrichten'], app: 'Du möchtest sagen, dass ein Lehrer Arabisch unterrichtet.', conf: 'c1_learn_teach' },
  { id: 'c1_u18_07', ar: 'قَالَ', tr: 'qāla', pos: 'Verb (3. Pers. m. Vergangenheit)', g: null, pl: null, de: ['sagen'], app: 'Du möchtest sagen, dass dein Freund etwas gesagt hat.', conf: 'c1_communication_verbs' },
  { id: 'c1_u18_08', ar: 'تَكَلَّمَ', tr: 'takallama', pos: 'Verb (3. Pers. m. Vergangenheit)', g: null, pl: null, de: ['sprechen'], app: 'Du möchtest sagen, dass du Arabisch sprichst.', conf: 'c1_communication_verbs' },
  { id: 'c1_u18_09', ar: 'أَخْبَرَ', tr: 'akhbara', pos: 'Verb (3. Pers. m. Vergangenheit)', g: null, pl: null, de: ['erzählen', 'informieren'], app: 'Du möchtest sagen, dass du deinem Freund eine Neuigkeit erzählst.', conf: 'c1_communication_verbs' },
  { id: 'c1_u18_10', ar: 'سَأَلَ', tr: 'saʾala', pos: 'Verb (3. Pers. m. Vergangenheit)', g: null, pl: null, de: ['fragen'], app: 'Du möchtest sagen, dass du eine Frage stellst.', opp: 'c1_u18_11', conf: 'c1_communication_verbs' },
  { id: 'c1_u18_11', ar: 'أَجَابَ', tr: 'ajāba', pos: 'Verb (3. Pers. m. Vergangenheit)', g: null, pl: null, de: ['antworten'], app: 'Du möchtest sagen, dass du auf eine Frage antwortest.', opp: 'c1_u18_10', conf: 'c1_communication_verbs' },
  { id: 'c1_u18_12', ar: 'نَظَرَ', tr: 'naẓara', pos: 'Verb (3. Pers. m. Vergangenheit)', g: null, pl: null, de: ['schauen', 'ansehen'], app: 'Du möchtest sagen, dass du aus dem Fenster schaust.' },
  { id: 'c1_u18_13', ar: 'أَرَادَ', tr: 'arāda', pos: 'Verb (3. Pers. m. Vergangenheit)', g: null, pl: null, de: ['wollen'], app: 'Du möchtest sagen, dass du etwas möchtest.' },
  { id: 'c1_u18_14', ar: 'اِحْتَاجَ', tr: 'iḥtāja', pos: 'Verb (3. Pers. m. Vergangenheit)', g: null, pl: null, de: ['brauchen'], app: 'Du möchtest sagen, dass du mehr Zeit brauchst.' },
  { id: 'c1_u18_15', ar: 'أَحَبَّ', tr: 'aḥabba', pos: 'Verb (3. Pers. m. Vergangenheit)', g: null, pl: null, de: ['mögen', 'lieben'], app: 'Du möchtest sagen, dass du Arabisch magst.', opp: 'c1_u18_16' },
  { id: 'c1_u18_16', ar: 'كَرِهَ', tr: 'kariha', pos: 'Verb (3. Pers. m. Vergangenheit)', g: null, pl: null, de: ['nicht mögen', 'hassen'], app: 'Du möchtest sagen, dass du frühes Aufstehen nicht magst.', opp: 'c1_u18_15' },
  { id: 'c1_u18_17', ar: 'فَضَّلَ', tr: 'faḍḍala', pos: 'Verb (3. Pers. m. Vergangenheit)', g: null, pl: null, de: ['bevorzugen'], app: 'Du möchtest sagen, dass du Tee lieber magst als Kaffee.' },
  { id: 'c1_u18_18', ar: 'اِعْتَقَدَ', tr: 'iʿtaqada', pos: 'Verb (3. Pers. m. Vergangenheit)', g: null, pl: null, de: ['glauben', 'meinen'], app: 'Du möchtest sagen, dass du etwas glaubst.' },
  { id: 'c1_u18_19', ar: 'أَمِلَ', tr: 'amila', pos: 'Verb (3. Pers. m. Vergangenheit)', g: null, pl: null, de: ['hoffen'], app: 'Du möchtest sagen, dass du auf gutes Wetter hoffst.' },
  { id: 'c1_u18_20', ar: 'قَرَّرَ', tr: 'qarrara', pos: 'Verb (3. Pers. m. Vergangenheit)', g: null, pl: null, de: ['entscheiden'], app: 'Du möchtest sagen, dass du dich entschieden hast.' },
  { id: 'c1_u18_21', ar: 'شَرَحَ', tr: 'sharaḥa', pos: 'Verb (3. Pers. m. Vergangenheit)', g: null, pl: null, de: ['erklären'], app: 'Du möchtest sagen, dass der Lehrer die Regel erklärt.', conf: 'c1_communication_verbs' },
  { id: 'c1_u18_22', ar: 'عَنَى', tr: 'ʿanā', pos: 'Verb (3. Pers. m. Vergangenheit)', g: null, pl: null, de: ['bedeuten'], app: 'Du möchtest fragen, was ein Wort bedeutet.' },
  { id: 'c1_u18_23', ar: 'وَافَقَ', tr: 'wāfaqa', pos: 'Verb (3. Pers. m. Vergangenheit)', g: null, pl: null, de: ['zustimmen'], app: 'Du möchtest sagen, dass du einem Vorschlag zustimmst.', opp: 'c1_u18_24' },
  { id: 'c1_u18_24', ar: 'اِخْتَلَفَ', tr: 'ikhtalafa', pos: 'Verb (3. Pers. m. Vergangenheit)', g: null, pl: null, de: ['nicht übereinstimmen', 'sich unterscheiden'], app: 'Du möchtest sagen, dass zwei Meinungen sich unterscheiden.', opp: 'c1_u18_23' },
  { id: 'c1_u18_25', ar: 'سَمَحَ', tr: 'samaḥa', pos: 'Verb (3. Pers. m. Vergangenheit)', g: null, pl: null, de: ['erlauben'], app: 'Du möchtest sagen, dass dein Vater dir etwas erlaubt.' },
  { id: 'c1_u18_26', ar: 'اِسْتَطَاعَ', tr: 'istaṭāʿa', pos: 'Verb (3. Pers. m. Vergangenheit)', g: null, pl: null, de: ['können', 'imstande sein'], app: 'Du möchtest sagen, dass du etwas schaffen konntest.' },
  { id: 'c1_u18_27', ar: 'حَاوَلَ', tr: 'ḥāwala', pos: 'Verb (3. Pers. m. Vergangenheit)', g: null, pl: null, de: ['versuchen'], app: 'Du möchtest sagen, dass du versuchst, früh aufzustehen.' },
  { id: 'c1_u18_28', ar: 'أَحَسَّ', tr: 'aḥassa', pos: 'Verb (3. Pers. m. Vergangenheit)', g: null, pl: null, de: ['fühlen', 'empfinden'], app: 'Du möchtest sagen, dass du dich müde fühlst.' }
];

const UNIT_19 = [
  { id: 'c1_u19_01', ar: 'كَبِير', tr: 'kabīr', pos: 'Adjektiv', g: 'maskulin', pl: null, de: ['groß'], app: 'Du beschreibst ein Haus als groß.', opp: 'c1_u19_02' },
  { id: 'c1_u19_02', ar: 'صَغِير', tr: 'ṣaghīr', pos: 'Adjektiv', g: 'maskulin', pl: null, de: ['klein'], app: 'Du beschreibst ein Haus als klein.', opp: 'c1_u19_01' },
  { id: 'c1_u19_03', ar: 'طَوِيل', tr: 'ṭawīl', pos: 'Adjektiv', g: 'maskulin', pl: null, de: ['lang', 'großgewachsen'], app: 'Du beschreibst eine Straße als lang.' },
  { id: 'c1_u19_04', ar: 'مُنْخَفِض', tr: 'munkhafiḍ', pos: 'Adjektiv', g: 'maskulin', pl: null, de: ['niedrig'], app: 'Du beschreibst einen Tisch als niedrig.' },
  { id: 'c1_u19_05', ar: 'وَاسِع', tr: 'wāsiʿ', pos: 'Adjektiv', g: 'maskulin', pl: null, de: ['breit', 'geräumig'], app: 'Du beschreibst ein Zimmer als geräumig.', opp: 'c1_u19_06' },
  { id: 'c1_u19_06', ar: 'ضَيِّق', tr: 'ḍayyiq', pos: 'Adjektiv', g: 'maskulin', pl: null, de: ['eng', 'schmal'], app: 'Du beschreibst eine Straße als eng.', opp: 'c1_u19_05' },
  { id: 'c1_u19_07', ar: 'ثَقِيل', tr: 'thaqīl', pos: 'Adjektiv', g: 'maskulin', pl: null, de: ['schwer'], app: 'Du beschreibst eine Tasche als schwer.', opp: 'c1_u19_08' },
  { id: 'c1_u19_08', ar: 'خَفِيف', tr: 'khafīf', pos: 'Adjektiv', g: 'maskulin', pl: null, de: ['leicht'], app: 'Du beschreibst eine Tasche als leicht.', opp: 'c1_u19_07' },
  { id: 'c1_u19_09', ar: 'سَرِيع', tr: 'sarīʿ', pos: 'Adjektiv', g: 'maskulin', pl: null, de: ['schnell'], app: 'Du beschreibst ein Auto als schnell.', opp: 'c1_u19_10' },
  { id: 'c1_u19_10', ar: 'بَطِيء', tr: 'baṭīʾ', pos: 'Adjektiv', g: 'maskulin', pl: null, de: ['langsam'], app: 'Du beschreibst ein Auto als langsam.', opp: 'c1_u19_09' },
  { id: 'c1_u19_11', ar: 'جَدِيد', tr: 'jadīd', pos: 'Adjektiv', g: 'maskulin', pl: null, de: ['neu'], app: 'Du beschreibst ein Telefon als neu.', opp: 'c1_u19_12' },
  { id: 'c1_u19_12', ar: 'قَدِيم', tr: 'qadīm', pos: 'Adjektiv', g: 'maskulin', pl: null, de: ['alt'], app: 'Du beschreibst ein Gebäude als alt.', opp: 'c1_u19_11' },
  { id: 'c1_u19_13', ar: 'نَظِيف', tr: 'naẓīf', pos: 'Adjektiv', g: 'maskulin', pl: null, de: ['sauber'], app: 'Du beschreibst ein Zimmer als sauber.', opp: 'c1_u19_14' },
  { id: 'c1_u19_14', ar: 'مُتَّسِخ', tr: 'muttasikh', pos: 'Adjektiv', g: 'maskulin', pl: null, de: ['schmutzig'], app: 'Du beschreibst ein Zimmer als schmutzig.', opp: 'c1_u19_13' },
  { id: 'c1_u19_15', ar: 'مُمْتَلِئ', tr: 'mumtaliʾ', pos: 'Adjektiv', g: 'maskulin', pl: null, de: ['voll'], app: 'Du beschreibst ein Glas als voll.', opp: 'c1_u19_16' },
  { id: 'c1_u19_16', ar: 'فَارِغ', tr: 'fārigh', pos: 'Adjektiv', g: 'maskulin', pl: null, de: ['leer'], app: 'Du beschreibst ein Glas als leer.', opp: 'c1_u19_15' },
  { id: 'c1_u19_17', ar: 'صَحِيح', tr: 'ṣaḥīḥ', pos: 'Adjektiv', g: 'maskulin', pl: null, de: ['richtig', 'korrekt'], app: 'Du beschreibst eine Antwort als richtig.', opp: 'c1_u19_18' },
  { id: 'c1_u19_18', ar: 'خَطَأ', tr: 'khaṭaʾ', pos: 'Substantiv/Adjektiv', g: 'maskulin', pl: 'أَخْطَاء', de: ['falsch', 'Fehler'], app: 'Du beschreibst eine Antwort als falsch.', opp: 'c1_u19_17' },
  { id: 'c1_u19_19', ar: 'جَمِيل', tr: 'jamīl', pos: 'Adjektiv', g: 'maskulin', pl: null, de: ['schön'], app: 'Du beschreibst ein Bild als schön.', opp: 'c1_u19_20' },
  { id: 'c1_u19_20', ar: 'قَبِيح', tr: 'qabīḥ', pos: 'Adjektiv', g: 'maskulin', pl: null, de: ['hässlich'], app: 'Du beschreibst etwas als hässlich.', opp: 'c1_u19_19' },
  { id: 'c1_u19_21', ar: 'جَيِّد', tr: 'jayyid', pos: 'Adjektiv', g: 'maskulin', pl: null, de: ['gut'], app: 'Du beschreibst ein Essen als gut.', opp: 'c1_u19_22' },
  { id: 'c1_u19_22', ar: 'سَيِّئ', tr: 'sayyiʾ', pos: 'Adjektiv', g: 'maskulin', pl: null, de: ['schlecht'], app: 'Du beschreibst ein Essen als schlecht.', opp: 'c1_u19_21' },
  { id: 'c1_u19_23', ar: 'غَنِيّ', tr: 'ghaniyy', pos: 'Adjektiv', g: 'maskulin', pl: null, de: ['reich'], app: 'Du beschreibst eine Person als reich.', opp: 'c1_u19_24' },
  { id: 'c1_u19_24', ar: 'فَقِير', tr: 'faqīr', pos: 'Adjektiv', g: 'maskulin', pl: null, de: ['arm (nicht reich)'], app: 'Du beschreibst eine Person als arm.', opp: 'c1_u19_23' },
  { id: 'c1_u19_25', ar: 'بَعِيد', tr: 'baʿīd', pos: 'Adjektiv', g: 'maskulin', pl: null, de: ['weit', 'entfernt'], app: 'Du beschreibst die Schule als weit entfernt.' },
  { id: 'c1_u19_26', ar: 'مُبَكِّر', tr: 'mubakkir', pos: 'Adjektiv', g: 'maskulin', pl: null, de: ['früh'], app: 'Du beschreibst die Uhrzeit als früh.', opp: 'c1_u19_27' },
  { id: 'c1_u19_27', ar: 'مُتَأَخِّر', tr: 'mutaʾakhkhir', pos: 'Adjektiv', g: 'maskulin', pl: null, de: ['spät'], app: 'Du beschreibst die Uhrzeit als spät.', opp: 'c1_u19_26' },
  { id: 'c1_u19_28', ar: 'مُخْتَلِف', tr: 'mukhtalif', pos: 'Adjektiv', g: 'maskulin', pl: null, de: ['verschieden', 'anders'], app: 'Du beschreibst zwei Meinungen als verschieden.' },
  { id: 'c1_u19_29', ar: 'بَسِيط', tr: 'basīṭ', pos: 'Adjektiv', g: 'maskulin', pl: null, de: ['einfach (schlicht)', 'schlicht'], app: 'Du beschreibst eine Aufgabe als schlicht/einfach.', opp: 'c1_u19_30' },
  { id: 'c1_u19_30', ar: 'مُعَقَّد', tr: 'muʿaqqad', pos: 'Adjektiv', g: 'maskulin', pl: null, de: ['kompliziert'], app: 'Du beschreibst eine Aufgabe als kompliziert.', opp: 'c1_u19_29' }
];

const UNIT_20 = [
  { id: 'c1_u20_01', ar: 'مَطَار', tr: 'maṭār', pos: 'Substantiv', g: 'maskulin', pl: 'مَطَارَات', de: ['Flughafen'], app: 'Von hier fliegt dein Flugzeug ab.' },
  { id: 'c1_u20_02', ar: 'فُنْدُق', tr: 'funduq', pos: 'Substantiv', g: 'maskulin', pl: 'فَنَادِق', de: ['Hotel'], app: 'Hier übernachtest du im Urlaub.' },
  { id: 'c1_u20_03', ar: 'مَكْتَب بَرِيد', tr: 'maktab barīd', pos: 'Substantiv', g: 'maskulin', pl: null, de: ['Postamt'], app: 'Hier schickst du ein Paket ab.' },
  { id: 'c1_u20_04', ar: 'مَرْكَز الشُّرْطَة', tr: 'markaz ash-shurṭa', pos: 'Substantiv', g: 'maskulin', pl: null, de: ['Polizeistation'], app: 'Hier meldest du einen verlorenen Gegenstand.' },
  { id: 'c1_u20_05', ar: 'مَدْرَسَة', tr: 'madrasa', pos: 'Substantiv', g: 'feminin', pl: 'مَدَارِس', de: ['Schule'], app: 'Hier lernen Kinder jeden Tag.' },
  { id: 'c1_u20_06', ar: 'حَدِيقَة عَامَّة', tr: 'ḥadīqa ʿāmma', pos: 'Substantiv', g: 'feminin', pl: null, de: ['öffentlicher Park'], app: 'Hier spazierst du am Wochenende.' },
  { id: 'c1_u20_07', ar: 'مَتْحَف', tr: 'matḥaf', pos: 'Substantiv', g: 'maskulin', pl: 'مَتَاحِف', de: ['Museum'], app: 'Hier siehst du alte Kunstwerke an.', conf: 'c1_leisure_venues' },
  { id: 'c1_u20_08', ar: 'سِينِمَا', tr: 'sīnimā', pos: 'Substantiv', g: 'feminin', pl: null, de: ['Kino'], app: 'Hier siehst du abends einen Film.', conf: 'c1_leisure_venues' },
  { id: 'c1_u20_09', ar: 'مَسْرَح', tr: 'masraḥ', pos: 'Substantiv', g: 'maskulin', pl: 'مَسَارِح', de: ['Theater'], app: 'Hier siehst du ein Theaterstück.', conf: 'c1_leisure_venues' },
  { id: 'c1_u20_10', ar: 'مَخْبَز', tr: 'makhbaz', pos: 'Substantiv', g: 'maskulin', pl: 'مَخَابِز', de: ['Bäckerei'], app: 'Hier kaufst du frisches Brot.' },
  { id: 'c1_u20_11', ar: 'مَقْهَى', tr: 'maqhā', pos: 'Substantiv', g: 'maskulin', pl: 'مَقَاهٍ', de: ['Café'], app: 'Hier trinkst du mit Freunden Kaffee.' },
  { id: 'c1_u20_12', ar: 'مَرْكَز تِجَارِيّ', tr: 'markaz tijāriyy', pos: 'Substantiv', g: 'maskulin', pl: null, de: ['Einkaufszentrum'], app: 'Hier findest du viele Geschäfte unter einem Dach.' },
  { id: 'c1_u20_13', ar: 'جِسْر', tr: 'jisr', pos: 'Substantiv', g: 'maskulin', pl: 'جُسُور', de: ['Brücke'], app: 'Darüber überquerst du einen Fluss.' },
  { id: 'c1_u20_14', ar: 'مَيْدَان', tr: 'maydān', pos: 'Substantiv', g: 'maskulin', pl: 'مَيَادِين', de: ['Platz'], app: 'Hier treffen sich mehrere Straßen der Stadt.' },
  { id: 'c1_u20_15', ar: 'إِشَارَة مُرُور', tr: 'ishārat murūr', pos: 'Substantiv', g: 'feminin', pl: null, de: ['Ampel'], app: 'Du wartest hier, bis das Licht grün wird.' },
  { id: 'c1_u20_16', ar: 'رَصِيف', tr: 'raṣīf', pos: 'Substantiv', g: 'maskulin', pl: 'أَرْصِفَة', de: ['Gehweg', 'Bürgersteig'], app: 'Hier gehst du zu Fuß, nicht auf der Straße.' },
  { id: 'c1_u20_17', ar: 'حَرَكَة الْمُرُور', tr: 'ḥarakat al-murūr', pos: 'Substantiv', g: 'feminin', pl: null, de: ['Verkehr'], app: 'Auf dieser Straße sind heute viele Autos unterwegs.' },
  { id: 'c1_u20_18', ar: 'مِنْطَقَة سَكَنِيَّة', tr: 'minṭaqa sakaniyya', pos: 'Substantiv', g: 'feminin', pl: null, de: ['Wohngebiet', 'Wohnviertel'], app: 'Hier stehen vor allem Wohnhäuser, keine Geschäfte.' },
  { id: 'c1_u20_19', ar: 'مَرْكَز', tr: 'markaz', pos: 'Substantiv', g: 'maskulin', pl: 'مَرَاكِز', de: ['Zentrum'], app: 'Hier ist die Mitte der Stadt.' },
  { id: 'c1_u20_20', ar: 'كَنِيسَة', tr: 'kanīsa', pos: 'Substantiv', g: 'feminin', pl: 'كَنَائِس', de: ['Kirche'], app: 'Hier ist ein christliches Gotteshaus.' },
  { id: 'c1_u20_21', ar: 'مَصْنَع', tr: 'maṣnaʿ', pos: 'Substantiv', g: 'maskulin', pl: 'مَصَانِع', de: ['Fabrik'], app: 'Hier werden Produkte in großer Zahl hergestellt.' },
  { id: 'c1_u20_22', ar: 'مَحَطَّة وَقُود', tr: 'maḥaṭṭat waqūd', pos: 'Substantiv', g: 'feminin', pl: null, de: ['Tankstelle'], app: 'Hier tankst du dein Auto.' }
];

module.exports = { UNIT_16, UNIT_17, UNIT_18, UNIT_19, UNIT_20 };
