#!/usr/bin/env node
// Entwicklungsauftrag 9, Abschnitt 3 — ersetzt die 15 Platzhalter-Theoriedokumente der Units
// 16-20 durch vollständige, auf die jeweiligen 10 Wörter jeder Session zugeschnittene Theorie.
// Idempotent (ersetzt anhand der theory_id, egal ob Platzhalter oder bereits echt).

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
  // ============================== UNIT 16 (Tagesablauf und Gewohnheiten) ==============================
  {
    theory_id: 'theory_vocab_unit_16_a',
    title: 'Tagesablauf und Gewohnheiten (1)',
    content_status: 'needs_language_review',
    learning_objectives: [
      'Die Morgenroutine (aufwachen, aufstehen, waschen, duschen, anziehen) in der richtigen Reihenfolge benennen.',
      'اِسْتَيْقَظَ (aufwachen) von نَامَ (schlafen) als Gegensatzpaar unterscheiden.',
      'سَكَنَ (wohnen, aus dem Bestand) von den neuen Tagesablauf-Verben abgrenzen.'
    ],
    blocks: [
      { type: 'paragraph', text: 'Diese Unit beschreibt einen typischen Tag von morgens bis abends. Du kennst aus dem Bestand bereits سَكَنَ (wohnen) — dieses Wort beschreibt, WO du lebst, nicht WAS du tagsüber tust. Die neuen Wörter dieser Session bilden die klassische Morgenroutine: اِسْتَيْقَظَ (aufwachen) → نَهَضَ (aufstehen) → غَسَلَ (waschen) → اِسْتَحَمَّ (duschen/baden) → اِرْتَدَى (sich anziehen) → فَرَّشَ أَسْنَانَهُ (sich die Zähne putzen).' },
      { type: 'paragraph', text: 'اِسْتَيْقَظَ (aufwachen) und نَامَ (schlafen) bilden ein klares Gegensatzpaar — der Moment, in dem du wach wirst, gegenüber dem Zustand des Schlafens. Danach folgen zwei Verben, mit denen du das Haus für den Tag verlässt bzw. am Abend zurückkehrst: خَرَجَ (hinausgehen) und عَادَ (zurückkehren) — diese lernst du bereits am Ende dieser Session, den vollständigen Tagesabschluss in Session B/C.' },
      { type: 'heading', level: 'full', text: 'Mehr erfahren: فَرَّشَ أَسْنَانَهُ als feste Wendung' },
      { type: 'paragraph', level: 'full', text: 'فَرَّشَ أَسْنَانَهُ ist anders als die übrigen Wörter dieser Session kein einzelnes Verb, sondern eine feste Verb-Objekt-Wendung ("putzte seine Zähne", wörtlich mit einem angehängten Possessivsuffix -هُ "seine"). Solche festen Wendungen (Ausdruck statt einzelnes Verb) begegnen dir im Kurs immer wieder, wenn es für einen Alltagsbegriff kein einzelnes arabisches Verb gibt.' },
      { type: 'callout', variant: 'tip', title: 'Merke', text: 'Die Morgenroutine in der richtigen Reihenfolge: اِسْتَيْقَظَ (aufwachen) → نَهَضَ (aufstehen) → غَسَلَ/اِسْتَحَمَّ (waschen/duschen) → اِرْتَدَى (anziehen).' },
      { type: 'callout', variant: 'info', title: 'Typischer Fehler', text: 'غَسَلَ (waschen, allgemein — z. B. Hände) und اِسْتَحَمَّ (duschen/baden, den ganzen Körper) werden oft gleichgesetzt — غَسَلَ ist der Oberbegriff, اِسْتَحَمَّ die spezifischere Handlung.' },
      { type: 'example', arabic: 'اِسْتَيْقَظْتُ مُبَكِّراً الْيَوْم.', translation: 'Ich bin heute früh aufgewacht.', note: 'اَلْيَوْم (heute) kennst du bereits aus Unit 6.' },
      { type: 'example', arabic: 'غَسَلْتُ يَدَيَّ ثُمَّ اِرْتَدَيْتُ مَلَابِسِي.', translation: 'Ich habe mir die Hände gewaschen und mich dann angezogen.', note: 'ثُمَّ (dann) hier nur zur Veranschaulichung markiert.' },
      { type: 'example', arabic: 'هُوَ يَسْكُنُ فِي شَقَّةٍ صَغِيرَة.', translation: 'Er wohnt in einer kleinen Wohnung.', note: 'سَكَنَ (wohnen) aus dem Bestand, Vorschau auf صَغِير aus Unit 19.' },
      { type: 'word_preview', word_ids: ['verb_live', 'c1_u16_01', 'c1_u16_02', 'c1_u16_03', 'c1_u16_04', 'c1_u16_05', 'c1_u16_06', 'c1_u16_07', 'c1_u16_08', 'c1_u16_09'] },
      { type: 'mini_check', questions: [
        mc('Was kommt zuerst: اِسْتَيْقَظَ oder نَهَضَ؟', [opt('اِسْتَيْقَظَ (aufwachen)', true), opt('نَهَضَ (aufstehen)', false)], 'Zuerst wachst du auf (استيقظ), erst danach stehst du auf (نهض).'),
        mc('Das Gegenteil von اِسْتَيْقَظَ ist…', [opt('نَامَ', true), opt('خَرَجَ', false)]),
        mc('فَرَّشَ أَسْنَانَهُ bedeutet…', [opt('sich die Zähne putzen', true), opt('sich waschen', false)])
      ] }
    ]
  },
  {
    theory_id: 'theory_vocab_unit_16_b',
    title: 'Tagesablauf und Gewohnheiten (2)',
    content_status: 'needs_language_review',
    learning_objectives: [
      'بَدَأَ/اِنْتَهَى und فَتَحَ/أَغْلَقَ als zwei neue Gegensatzpaare anwenden.',
      'جَلَسَ/وَقَفَ als körperliche Zustände unterscheiden.',
      'Drei Fortbewegungsverben (مَشَى/رَكَضَ/قَادَ) nach Geschwindigkeit/Art einordnen.'
    ],
    blocks: [
      { type: 'paragraph', text: 'Diese Session bringt gleich zwei neue Gegensatzpaare: بَدَأَ (beginnen) ↔ اِنْتَهَى (enden) beschreibt Anfang und Ende einer Handlung, فَتَحَ (öffnen) ↔ أَغْلَقَ (schließen) den Zustand einer Tür oder eines Fensters. Danach folgt ein drittes Paar: جَلَسَ (sitzen/sich setzen) ↔ وَقَفَ (stehen/anhalten) — zwei grundlegende Körperhaltungen.' },
      { type: 'paragraph', text: 'Zum Abschluss lernst du drei Fortbewegungsarten mit steigendem Tempo: مَشَى (gehen, zu Fuß) ist langsamer als رَكَضَ (laufen/rennen), während قَادَ (fahren/lenken) das Führen eines Fahrzeugs beschreibt — anders als مَشَى/رَكَضَ bewegst du dich hier nicht mit den eigenen Beinen fort.' },
      { type: 'heading', level: 'full', text: 'Mehr erfahren: اِنْتَظَرَ zwischen zwei Zuständen' },
      { type: 'paragraph', level: 'full', text: 'اِنْتَظَرَ (warten) beschreibt einen Zustand DAZWISCHEN — du hast noch nicht begonnen (بَدَأَ) und bist auch noch nicht am Ziel angekommen. Es passt inhaltlich gut zwischen die beiden neuen Gegensatzpaare dieser Session und wird im Alltag sehr häufig gebraucht (z. B. Warten auf den Bus).' },
      { type: 'callout', variant: 'tip', title: 'Merke', text: 'Zwei neue Gegensatzpaare in dieser Session: بَدَأَ↔اِنْتَهَى (beginnen/enden) und فَتَحَ↔أَغْلَقَ (öffnen/schließen).' },
      { type: 'callout', variant: 'info', title: 'Typischer Fehler', text: 'وَقَفَ (stehen/anhalten) wird manchmal mit جَلَسَ (sitzen) verwechselt — وَقَفَ bedeutet aufrecht stehen ODER ein Fahrzeug anhalten, جَلَسَ bedeutet sich hinsetzen.' },
      { type: 'example', arabic: 'بَدَأَ الدَّرْسُ وَانْتَهَى بَعْدَ سَاعَة.', translation: 'Die Stunde begann und endete nach einer Stunde.', note: 'سَاعَة (Stunde) kennst du bereits aus Unit 6.' },
      { type: 'example', arabic: 'اِنْتَظَرْتُ الْحَافِلَةَ وَاقِفاً.', translation: 'Ich wartete stehend auf den Bus.', note: 'اَلْحَافِلَة (Bus) hier nur zur Veranschaulichung markiert.' },
      { type: 'example', arabic: 'قَادَ السَّيَّارَةَ بِسُرْعَة.', translation: 'Er fuhr das Auto schnell.', note: 'اَلسَّيَّارَة (Auto) kennst du bereits aus dem Bestand.' },
      { type: 'word_preview', word_ids: ['c1_u16_10', 'c1_u16_11', 'c1_u16_12', 'c1_u16_13', 'c1_u16_14', 'c1_u16_15', 'c1_u16_16', 'c1_u16_17', 'c1_u16_18', 'c1_u16_19'] },
      { type: 'mini_check', questions: [
        mc('Das Gegenteil von فَتَحَ ist…', [opt('أَغْلَقَ', true), opt('جَلَسَ', false)]),
        mc('Welches Verb beschreibt die schnellste Fortbewegung?', [opt('رَكَضَ (rennen)', true), opt('مَشَى (gehen)', false)]),
        mc('اِنْتَظَرَ bedeutet…', [opt('warten', true), opt('beginnen', false)])
      ] }
    ]
  },
  {
    theory_id: 'theory_vocab_unit_16_c',
    title: 'Tagesablauf und Gewohnheiten (3)',
    content_status: 'needs_language_review',
    learning_objectives: [
      'وَصَلَ/غَادَرَ als Gegensatzpaar für Ankunft/Abfahrt anwenden.',
      'Freizeit- und Haushaltsverben (besuchen, putzen, lesen, schreiben, ansehen, zuhören) benennen.',
      'اِسْتَرَاحَ als Abschluss des Tagesablaufs einordnen.'
    ],
    blocks: [
      { type: 'paragraph', text: 'Diese letzte Session der Unit schließt den Tagesablauf ab: وَصَلَ (ankommen) ↔ غَادَرَ (abfahren/verlassen) ist das letzte Gegensatzpaar dieser Unit — du kommst irgendwo an oder verlässt einen Ort. Danach lernst du قَابَلَ (treffen) und زَارَ (besuchen), zwei Verben für soziale Kontakte, sowie نَظَّفَ (reinigen/putzen) für Hausarbeit.' },
      { type: 'paragraph', text: 'Zum Abschluss folgen vier Freizeit-/Medienverben: قَرَأَ (lesen), كَتَبَ (schreiben), شَاهَدَ (ansehen/beobachten) und اِسْتَمَعَ (zuhören) — vier verschiedene Arten, wie du am Abend deine Zeit verbringen kannst. Den ganzen Tag rundet اِسْتَرَاحَ (sich ausruhen) ab — nach allen Handlungen des Tages kommt die Erholung.' },
      { type: 'heading', level: 'full', text: 'Mehr erfahren: قَابَلَ vs. زَارَ' },
      { type: 'paragraph', level: 'full', text: 'قَابَلَ (treffen) und زَارَ (besuchen) klingen im Deutschen ähnlich, unterscheiden sich aber im Ort: قَابَلَ beschreibt ein Zusammentreffen an einem neutralen Ort (z. B. im Café), زَارَ meint konkret, dass DU zu jemandem (oder an einen Ort) hingehst — etwa Familie زَارَ (besuchen).' },
      { type: 'callout', variant: 'tip', title: 'Merke', text: 'وَصَلَ (ankommen) ↔ غَادَرَ (abfahren) ist das dritte und letzte Gegensatzpaar dieser Unit.' },
      { type: 'callout', variant: 'info', title: 'Typischer Fehler', text: 'شَاهَدَ (ansehen, z. B. einen Film) und نَظَرَ (schauen, aus Unit 18) werden oft verwechselt — شَاهَدَ bezieht sich meist auf längeres, aufmerksames Ansehen (Film, Fernsehen).' },
      { type: 'example', arabic: 'وَصَلْتُ إِلَى الْمَحَطَّةِ ثُمَّ غَادَرْتُهَا بَعْدَ قَلِيل.', translation: 'Ich kam am Bahnhof an und verließ ihn kurz darauf.', note: 'اَلْمَحَطَّة (Bahnhof) kennst du bereits aus dem Bestand.' },
      { type: 'example', arabic: 'شَاهَدْتُ فِيلْماً ثُمَّ اِسْتَرَحْتُ.', translation: 'Ich habe einen Film angesehen und mich dann ausgeruht.', note: 'فِيلْم (Film) hier nur zur Veranschaulichung markiert.' },
      { type: 'example', arabic: 'زُرْتُ عَائِلَتِي فِي عُطْلَةِ نِهَايَةِ الْأُسْبُوع.', translation: 'Ich habe meine Familie am Wochenende besucht.', note: 'عَائِلَة (Familie) kennst du bereits aus dem Bestand.' },
      { type: 'word_preview', word_ids: ['c1_u16_20', 'c1_u16_21', 'c1_u16_22', 'c1_u16_23', 'c1_u16_24', 'c1_u16_25', 'c1_u16_26', 'c1_u16_27', 'c1_u16_28', 'c1_u16_29'] },
      { type: 'mini_check', questions: [
        mc('Das Gegenteil von وَصَلَ ist…', [opt('غَادَرَ', true), opt('زَارَ', false)]),
        mc('Welches Verb passt zu "einen Film ansehen"?', [opt('شَاهَدَ', true), opt('اِسْتَمَعَ', false)]),
        mc('اِسْتَرَاحَ bedeutet…', [opt('sich ausruhen', true), opt('putzen', false)])
      ] }
    ]
  },
  // ============================== UNIT 17 (Häufige Verben I: Bewegung/Handlungen) ==============================
  {
    theory_id: 'theory_vocab_unit_17_a',
    title: 'Häufige Verben I: Bewegung und praktische Handlungen (1)',
    content_status: 'needs_language_review',
    learning_objectives: [
      'Die fünf Grundverben aus dem Bestand (gehen/spielen/arbeiten/essen/trinken) um fünf weitere häufige Handlungsverben ergänzen.',
      'أَخَذَ/أَعْطَى als Gegensatzpaar für Nehmen/Geben anwenden.',
      'جَاءَ von ذَهَبَ (aus dem Bestand) als Gegensatzpaar für Kommen/Gehen erkennen.'
    ],
    blocks: [
      { type: 'paragraph', text: 'Diese Unit sammelt besonders häufig gebrauchte Alltagsverben. Du kennst aus dem Bestand bereits ذَهَبَ (gehen, sich begeben), لَعِبَ (spielen), عَمِلَ (arbeiten), أَكَلَ (essen) und شَرِبَ (trinken) — diese Session ergänzt جَاءَ (kommen), das direkte Gegenteil von ذَهَبَ: du gehst irgendwohin (ذَهَبَ) oder kommst von dort zurück bzw. zu dir (جَاءَ).' },
      { type: 'paragraph', text: 'Danach lernst du das Gegensatzpaar أَخَذَ (nehmen) ↔ أَعْطَى (geben) — wer nimmt, dem wird etwas gegeben, und umgekehrt. أَحْضَرَ (bringen) und حَمَلَ (tragen) runden die Session ab: أَحْضَرَ beschreibt, dass du etwas an einen Ort bringst, حَمَلَ beschreibt das reine Tragen, unabhängig vom Ziel.' },
      { type: 'heading', level: 'full', text: 'Mehr erfahren: warum ذَهَبَ zwei Bedeutungen hat' },
      { type: 'paragraph', level: 'full', text: 'Du kennst ذَهَبَ bereits aus dem Bestand als "gehen" — dasselbe unvokalisierte Wort ذهب bedeutet ohne Vokalzeichen auch "Gold" (ذَهَب, ein Substantiv mit anderer Vokalisierung, siehe homonym_group in den Vokabeldaten). Das ist ein bewusstes Homonym, kein Fehler — der Kontext (Verb vs. Substantiv) macht die Bedeutung eindeutig.' },
      { type: 'callout', variant: 'tip', title: 'Merke', text: 'جَاءَ (kommen) ist das Gegenteil von ذَهَبَ (gehen) — beide beschreiben Bewegung, aber in entgegengesetzte Richtung.' },
      { type: 'callout', variant: 'info', title: 'Typischer Fehler', text: 'أَحْضَرَ (bringen, ein Ziel) und حَمَلَ (tragen, unabhängig vom Ziel) werden oft gleichgesetzt — أَحْضَرَ betont, DASS etwas ankommt, حَمَلَ beschreibt nur den Vorgang des Tragens selbst.' },
      { type: 'example', arabic: 'جَاءَ صَدِيقِي وَأَعْطَانِي هَدِيَّة.', translation: 'Mein Freund kam und gab mir ein Geschenk.', note: 'هَدِيَّة (Geschenk) hier nur zur Veranschaulichung markiert.' },
      { type: 'example', arabic: 'أَخَذْتُ الْكِتَابَ مِنَ الطَّاوِلَة.', translation: 'Ich nahm das Buch vom Tisch.', note: 'اَلطَّاوِلَة (Tisch) kennst du bereits aus dem Bestand.' },
      { type: 'example', arabic: 'أَحْضَرَ الْمَاءَ إِلَى الْغُرْفَة.', translation: 'Er brachte das Wasser ins Zimmer.', note: 'اَلْمَاء/اَلْغُرْفَة kennst du bereits aus dem Bestand.' },
      { type: 'word_preview', word_ids: ['verb_go', 'verb_play', 'verb_work', 'verb_eat', 'verb_drink', 'c1_u17_01', 'c1_u17_02', 'c1_u17_03', 'c1_u17_04', 'c1_u17_05'] },
      { type: 'mini_check', questions: [
        mc('Das Gegenteil von ذَهَبَ ist…', [opt('جَاءَ', true), opt('أَخَذَ', false)]),
        mc('Das Gegenteil von أَخَذَ ist…', [opt('أَعْطَى', true), opt('حَمَلَ', false)]),
        mc('حَمَلَ bedeutet…', [opt('tragen', true), opt('bringen', false)])
      ] }
    ]
  },
  {
    theory_id: 'theory_vocab_unit_17_b',
    title: 'Häufige Verben I: Bewegung und praktische Handlungen (2)',
    content_status: 'needs_language_review',
    learning_objectives: [
      'وَجَدَ/فَقَدَ als Gegensatzpaar für Finden/Verlieren anwenden.',
      'أَرْسَلَ/اِسْتَلَمَ als Gegensatzpaar für Senden/Erhalten anwenden.',
      'فَعَلَ und صَنَعَ als zwei unterschiedliche Bedeutungen von "machen" unterscheiden.'
    ],
    blocks: [
      { type: 'paragraph', text: 'وَضَعَ (legen/stellen/setzen) und اِسْتَخْدَمَ (benutzen) beschreiben zwei sehr alltägliche Handlungen. Danach folgen zwei Verben, die beide oft mit "machen" übersetzt werden, aber unterschiedliche Nuancen haben: فَعَلَ (tun/machen) ist der allgemeine Oberbegriff für jede Handlung ("Was tust du?"), während صَنَعَ (herstellen/machen) konkret meint, etwas mit den eigenen Händen herzustellen (z. B. ein Handwerksstück).' },
      { type: 'paragraph', text: 'Danach folgt das Gegensatzpaar وَجَدَ (finden) ↔ فَقَدَ (verlieren) — du verlierst etwas und findest es (hoffentlich) wieder. Zum Abschluss lernst du ein zweites Gegensatzpaar: أَرْسَلَ (senden/schicken) ↔ اِسْتَلَمَ (erhalten/entgegennehmen), sowie سَاعَدَ (helfen) und اِتَّصَلَ (anrufen/Kontakt aufnehmen).' },
      { type: 'heading', level: 'full', text: 'Mehr erfahren: das اِسْتَ-Verbmuster' },
      { type: 'paragraph', level: 'full', text: 'اِسْتَخْدَمَ und اِسْتَلَمَ beginnen beide mit demselben Präfix اِسْتَ-, das im Arabischen häufig eine Bedeutung wie "etwas für sich in Anspruch nehmen/anwenden" trägt (Verbstamm X). Dieses Muster begegnet dir im Kurs immer wieder (z. B. auch اِسْتَيْقَظَ aus Unit 16 oder اِسْتَمَعَ) — wenn du es wiedererkennst, hilft es dir, neue Verben leichter einzuordnen.' },
      { type: 'callout', variant: 'tip', title: 'Merke', text: 'وَجَدَ (finden) ↔ فَقَدَ (verlieren) und أَرْسَلَ (senden) ↔ اِسْتَلَمَ (erhalten) sind die zwei Gegensatzpaare dieser Session.' },
      { type: 'callout', variant: 'info', title: 'Typischer Fehler', text: 'فَعَلَ (allgemein "tun") und صَنَعَ (konkret "herstellen") werden oft gleichgesetzt — bei der Frage "Was hast du getan?" wird immer فَعَلَ verwendet, nicht صَنَعَ.' },
      { type: 'example', arabic: 'فَقَدْتُ مِفْتَاحِي ثُمَّ وَجَدْتُهُ.', translation: 'Ich habe meinen Schlüssel verloren und dann gefunden.', note: 'مِفْتَاح (Schlüssel) hier nur zur Veranschaulichung markiert.' },
      { type: 'example', arabic: 'أَرْسَلْتُ رِسَالَةً وَاسْتَلَمْتُ رَدّاً.', translation: 'Ich habe eine Nachricht geschickt und eine Antwort erhalten.', note: 'رِسَالَة (Nachricht) hier nur zur Veranschaulichung markiert.' },
      { type: 'example', arabic: 'مَاذَا فَعَلْتَ الْيَوْم؟', translation: 'Was hast du heute gemacht?', note: 'مَاذَا (was) kennst du bereits aus dem Bestand.' },
      { type: 'word_preview', word_ids: ['c1_u17_06', 'c1_u17_07', 'c1_u17_08', 'c1_u17_09', 'c1_u17_10', 'c1_u17_11', 'c1_u17_12', 'c1_u17_13', 'c1_u17_14', 'c1_u17_15'] },
      { type: 'mini_check', questions: [
        mc('Das Gegenteil von وَجَدَ ist…', [opt('فَقَدَ', true), opt('أَرْسَلَ', false)]),
        mc('Welches Verb passt zu "Was hast du heute gemacht?"', [opt('فَعَلَ', true), opt('صَنَعَ', false)]),
        mc('اِسْتَلَمَ bedeutet…', [opt('erhalten/entgegennehmen', true), opt('senden', false)])
      ] }
    ]
  },
  {
    theory_id: 'theory_vocab_unit_17_c',
    title: 'Häufige Verben I: Bewegung und praktische Handlungen (3)',
    content_status: 'needs_language_review',
    learning_objectives: [
      'صَعِدَ/نَزَلَ und تَحَرَّكَ/تَوَقَّفَ als zwei neue Gegensatzpaare anwenden.',
      'دَخَلَ als Ergänzung zu خَرَجَ (aus Unit 16) erkennen.',
      'رَمَى/أَمْسَكَ als zusammengehöriges Verbpaar (werfen/fangen) einordnen.'
    ],
    blocks: [
      { type: 'paragraph', text: 'Diese Session vertieft Bewegungsverben: دَخَلَ (eintreten/hineingehen) ergänzt das bereits bekannte خَرَجَ (hinausgehen, aus Unit 16) — beide beschreiben das Betreten bzw. Verlassen eines Ortes. Danach folgt ein klares Gegensatzpaar: صَعِدَ (hinaufgehen/steigen) ↔ نَزَلَ (hinuntergehen/aussteigen), z. B. beim Ein-/Aussteigen aus einem Bus oder beim Treppensteigen.' },
      { type: 'paragraph', text: 'سَافَرَ (reisen) beschreibt eine längere Reise, während تَحَرَّكَ (sich bewegen) ↔ تَوَقَّفَ (anhalten/stoppen) ein weiteres Gegensatzpaar bildet — z. B. für ein Auto, das losfährt oder anhält. Zum Abschluss lernst du دَارَ (sich drehen/abbiegen), عَبَرَ (überqueren) sowie das zusammengehörige Paar رَمَى (werfen) und أَمْسَكَ (fangen/festhalten) — die typische Handlung beim Ballspielen.' },
      { type: 'heading', level: 'full', text: 'Mehr erfahren: die Reihe der Ein-/Ausstiegs-Verben' },
      { type: 'paragraph', level: 'full', text: 'Über den ganzen Kurs verteilt lernst du mehrere verwandte Verben für das Betreten/Verlassen eines Ortes: دَخَلَ/خَرَجَ (eintreten/hinausgehen, Unit 16/17), صَعِدَ/نَزَلَ (hinaufgehen/hinuntergehen, diese Session) und وَصَلَ/غَادَرَ (ankommen/abfahren, Unit 16). Zusammen decken sie fast jede Bewegungssituation im Alltag ab — es lohnt sich, sie als zusammengehörige Gruppe zu wiederholen.' },
      { type: 'callout', variant: 'tip', title: 'Merke', text: 'صَعِدَ (hinaufgehen) ↔ نَزَلَ (hinuntergehen) und تَحَرَّكَ (sich bewegen) ↔ تَوَقَّفَ (anhalten) sind die zwei Gegensatzpaare dieser Session.' },
      { type: 'callout', variant: 'info', title: 'Typischer Fehler', text: 'نَزَلَ (hinuntergehen/aussteigen) und غَادَرَ (abfahren/verlassen, aus Unit 16) werden manchmal verwechselt — نَزَلَ meint das Verlassen eines Fahrzeugs oder das Hinabsteigen, غَادَرَ das Verlassen eines Ortes allgemein.' },
      { type: 'example', arabic: 'صَعِدَ إِلَى الْحَافِلَةِ ثُمَّ نَزَلَ عِنْدَ الْمَحَطَّة.', translation: 'Er stieg in den Bus und stieg an der Haltestelle aus.', note: 'اَلْمَحَطَّة (Bahnhof/Haltestelle) kennst du bereits aus dem Bestand.' },
      { type: 'example', arabic: 'تَوَقَّفَتِ السَّيَّارَةُ عِنْدَ الْإِشَارَة.', translation: 'Das Auto hielt an der Ampel an.', note: 'Vorschau auf إِشَارَة مُرُور aus Unit 20.' },
      { type: 'example', arabic: 'رَمَى الْكُرَةَ وَأَمْسَكَهَا صَدِيقُهُ.', translation: 'Er warf den Ball, und sein Freund fing ihn.', note: 'اَلْكُرَة (Ball) hier nur zur Veranschaulichung markiert.' },
      { type: 'word_preview', word_ids: ['c1_u17_16', 'c1_u17_17', 'c1_u17_18', 'c1_u17_19', 'c1_u17_20', 'c1_u17_21', 'c1_u17_22', 'c1_u17_23', 'c1_u17_24', 'c1_u17_25'] },
      { type: 'mini_check', questions: [
        mc('Das Gegenteil von صَعِدَ ist…', [opt('نَزَلَ', true), opt('دَخَلَ', false)]),
        mc('Welches Verb passt zu einem anhaltenden Auto?', [opt('تَوَقَّفَ', true), opt('تَحَرَّكَ', false)]),
        mc('أَمْسَكَ bedeutet…', [opt('fangen/festhalten', true), opt('werfen', false)])
      ] }
    ]
  },
  // ============================== UNIT 18 (Häufige Verben II: Denken/Sprechen/Wahrnehmung) ==============================
  {
    theory_id: 'theory_vocab_unit_18_a',
    title: 'Häufige Verben II: Denken, Sprechen und Wahrnehmung (1)',
    content_status: 'needs_language_review',
    learning_objectives: [
      'دَرَسَ/فَهِمَ (aus dem Bestand) um weitere Denkverben ergänzen.',
      'تَعَلَّمَ von عَلَّمَ als Lernen-vs-Lehren-Paar unterscheiden.',
      'قَالَ/تَكَلَّمَ als zwei unterschiedliche Sprechverben einordnen.'
    ],
    blocks: [
      { type: 'paragraph', text: 'Diese Unit sammelt Verben für Denken, Sprechen und Wahrnehmen. Du kennst aus dem Bestand bereits دَرَسَ (lernen/studieren) und فَهِمَ (verstehen) — diese Session ergänzt عَرَفَ (wissen/kennen), فَكَّرَ (denken) sowie das Gegensatzpaar تَذَكَّرَ (sich erinnern) ↔ نَسِيَ (vergessen).' },
      { type: 'paragraph', text: 'تَعَلَّمَ (lernen, etwas Neues erwerben) und عَلَّمَ (lehren/unterrichten) sehen sich sehr ähnlich, haben aber unterschiedliche Rollen: تَعَلَّمَ macht der Schüler, عَلَّمَ macht die Lehrerin. Zum Abschluss lernst du zwei Sprechverben: قَالَ (sagen, konkret ETWAS sagen) und تَكَلَّمَ (sprechen, allgemein die Fähigkeit/Handlung des Sprechens — z. B. eine Sprache).' },
      { type: 'heading', level: 'full', text: 'Mehr erfahren: تَعَلَّمَ und عَلَّمَ als Verbstamm-Paar' },
      { type: 'paragraph', level: 'full', text: 'تَعَلَّمَ und عَلَّمَ teilen dieselbe Wurzel ع-ل-م ("Wissen"), unterscheiden sich aber im Verbstamm (Vorsilbe تَ- bei تَعَلَّمَ). Dieses Muster — ein Grundverb bekommt mit einer anderen Form eine kausative oder reflexive Bedeutung — ist im Arabischen sehr verbreitet und begegnet dir noch öfter (vgl. تَحَرَّكَ/حَرَّكَ, wobei nur die reflexive Form تَحَرَّكَ in diesem Kurs vorkommt).' },
      { type: 'callout', variant: 'tip', title: 'Merke', text: 'تَذَكَّرَ (sich erinnern) ↔ نَسِيَ (vergessen) ist das Gegensatzpaar dieser Session.' },
      { type: 'callout', variant: 'info', title: 'Typischer Fehler', text: 'قَالَ (sagen, mit konkretem Inhalt) und تَكَلَّمَ (sprechen, allgemein) werden oft verwechselt — "Er sagte: ..." braucht قَالَ, "Er spricht Arabisch" braucht تَكَلَّمَ.' },
      { type: 'example', arabic: 'تَذَكَّرْتُ اسْمَهُ وَلَمْ أَنْسَهُ.', translation: 'Ich erinnerte mich an seinen Namen und vergaß ihn nicht.', note: 'اِسْم (Name) hier nur zur Veranschaulichung markiert.' },
      { type: 'example', arabic: 'اَلْمُعَلِّمَةُ تُعَلِّمُ وَالطَّالِبُ يَتَعَلَّم.', translation: 'Die Lehrerin lehrt, und der Schüler lernt.', note: 'اَلْمُعَلِّمَة/اَلطَّالِب hier nur zur Veranschaulichung markiert.' },
      { type: 'example', arabic: 'هَلْ تَتَكَلَّمُ الْعَرَبِيَّة؟', translation: 'Sprichst du Arabisch?', note: 'اَلْعَرَبِيَّة (Arabisch) kennst du bereits aus dem Bestand.' },
      { type: 'word_preview', word_ids: ['verb_study', 'verb_understand', 'c1_u18_01', 'c1_u18_02', 'c1_u18_03', 'c1_u18_04', 'c1_u18_05', 'c1_u18_06', 'c1_u18_07', 'c1_u18_08'] },
      { type: 'mini_check', questions: [
        mc('Das Gegenteil von تَذَكَّرَ ist…', [opt('نَسِيَ', true), opt('فَهِمَ', false)]),
        mc('Wer macht تَعَلَّمَ — Lehrerin oder Schüler?', [opt('der Schüler', true), opt('die Lehrerin', false)]),
        mc('"Sprichst du Arabisch?" verwendet…', [opt('تَكَلَّمَ', true), opt('قَالَ', false)])
      ] }
    ]
  },
  {
    theory_id: 'theory_vocab_unit_18_b',
    title: 'Häufige Verben II: Denken, Sprechen und Wahrnehmung (2)',
    content_status: 'needs_language_review',
    learning_objectives: [
      'سَأَلَ/أَجَابَ als Gegensatzpaar für Fragen/Antworten anwenden.',
      'أَحَبَّ/كَرِهَ als Gegensatzpaar für Mögen/Hassen anwenden.',
      'أَرَادَ von اِحْتَاجَ als Wollen-vs-Brauchen-Paar unterscheiden.'
    ],
    blocks: [
      { type: 'paragraph', text: 'أَخْبَرَ (erzählen/informieren) und سَأَلَ (fragen) ↔ أَجَابَ (antworten) bilden den Kern eines Gesprächs: du informierst jemanden, stellst eine Frage oder beantwortest eine. نَظَرَ (schauen/ansehen) ergänzt die bereits bekannten Wahrnehmungsverben aus Unit 13 (رَأَى/سَمِعَ/شَمَّ/لَمَسَ) um eine weitere Nuance des Sehens: gezieltes Hinschauen statt reines Sehen.' },
      { type: 'paragraph', text: 'أَرَادَ (wollen) und اِحْتَاجَ (brauchen) klingen ähnlich, meinen aber Unterschiedliches: أَرَادَ beschreibt einen Wunsch (du möchtest etwas, musst es aber nicht unbedingt haben), اِحْتَاجَ eine Notwendigkeit. Zum Abschluss lernst du das Gegensatzpaar أَحَبَّ (mögen/lieben) ↔ كَرِهَ (nicht mögen/hassen) sowie فَضَّلَ (bevorzugen, eine Sache lieber mögen als eine andere) und اِعْتَقَدَ (glauben/meinen).' },
      { type: 'heading', level: 'full', text: 'Mehr erfahren: أَرَادَ vs. اِحْتَاجَ im Alltag' },
      { type: 'paragraph', level: 'full', text: 'Im Deutschen sagen wir oft "ich brauche" auch dann, wenn wir eigentlich nur "ich möchte" meinen ("Ich brauche jetzt einen Kaffee!"). Im Arabischen bleibt der Unterschied zwischen أَرَادَ (Wunsch) und اِحْتَاجَ (echte Notwendigkeit) klarer getrennt — achte beim Formulieren darauf, welches der beiden wirklich gemeint ist.' },
      { type: 'callout', variant: 'tip', title: 'Merke', text: 'سَأَلَ (fragen) ↔ أَجَابَ (antworten) und أَحَبَّ (mögen) ↔ كَرِهَ (hassen) sind die zwei Gegensatzpaare dieser Session.' },
      { type: 'callout', variant: 'info', title: 'Typischer Fehler', text: 'أَرَادَ (wollen, ein Wunsch) und اِحْتَاجَ (brauchen, eine Notwendigkeit) werden im Deutschen oft gleichgesetzt ("ich brauche" statt "ich möchte") — im Arabischen bleiben sie klar getrennt.' },
      { type: 'example', arabic: 'سَأَلْتُهُ سُؤَالاً فَأَجَابَ بِسُرْعَة.', translation: 'Ich stellte ihm eine Frage, und er antwortete schnell.', note: 'سُؤَال (Frage) kennst du bereits aus dem Bestand (Fragewörter).' },
      { type: 'example', arabic: 'أُحِبُّ الشَّايَ وَأَكْرَهُ الْقَهْوَةَ الْمُرَّة.', translation: 'Ich mag Tee und hasse bitteren Kaffee.', note: 'اَلشَّاي/اَلْقَهْوَة kennst du bereits aus dem Bestand.' },
      { type: 'example', arabic: 'أَحْتَاجُ إِلَى وَقْتٍ، لَا أُرِيدُ أَنْ أَتَعَجَّل.', translation: 'Ich brauche Zeit, ich möchte mich nicht beeilen.', note: 'وَقْت (Zeit) hier nur zur Veranschaulichung markiert.' },
      { type: 'word_preview', word_ids: ['c1_u18_09', 'c1_u18_10', 'c1_u18_11', 'c1_u18_12', 'c1_u18_13', 'c1_u18_14', 'c1_u18_15', 'c1_u18_16', 'c1_u18_17', 'c1_u18_18'] },
      { type: 'mini_check', questions: [
        mc('Das Gegenteil von سَأَلَ ist…', [opt('أَجَابَ', true), opt('أَخْبَرَ', false)]),
        mc('Welches Wort beschreibt eine echte Notwendigkeit statt eines Wunsches?', [opt('اِحْتَاجَ', true), opt('أَرَادَ', false)]),
        mc('كَرِهَ bedeutet…', [opt('nicht mögen/hassen', true), opt('bevorzugen', false)])
      ] }
    ]
  },
  {
    theory_id: 'theory_vocab_unit_18_c',
    title: 'Häufige Verben II: Denken, Sprechen und Wahrnehmung (3)',
    content_status: 'needs_language_review',
    learning_objectives: [
      'وَافَقَ/اِخْتَلَفَ als Gegensatzpaar für Zustimmen/Widersprechen anwenden.',
      'شَرَحَ als weiteres Kommunikationsverb neben قَالَ/أَخْبَرَ einordnen.',
      'اِسْتَطَاعَ als Können-Verb von أَرَادَ (Wollen, Session B) abgrenzen.'
    ],
    blocks: [
      { type: 'paragraph', text: 'Diese letzte Session der Unit beginnt mit أَمِلَ (hoffen) und قَرَّرَ (entscheiden) — zwei Verben für Zukunftspläne. شَرَحَ (erklären) ergänzt die Kommunikationsverben aus Session B (قَالَ/أَخْبَرَ/سَأَلَ) um eine weitere Nuance: ausführlich und verständlich machen. عَنَى (bedeuten) hilft dir, nach der Bedeutung eines Wortes zu fragen — praktisch für den Sprachunterricht selbst!' },
      { type: 'paragraph', text: 'Das Gegensatzpaar وَافَقَ (zustimmen) ↔ اِخْتَلَفَ (nicht übereinstimmen/sich unterscheiden) beschreibt zwei Reaktionen auf eine Meinung. سَمَحَ (erlauben) beschreibt Erlaubnis, während اِسْتَطَاعَ (können/imstande sein) eine FÄHIGKEIT beschreibt — anders als أَرَادَ (wollen, Session B), das nur einen Wunsch ausdrückt. حَاوَلَ (versuchen) und أَحَسَّ (fühlen/empfinden) schließen die Unit ab.' },
      { type: 'heading', level: 'full', text: 'Mehr erfahren: اِسْتَطَاعَ vs. أَرَادَ vs. اِحْتَاجَ' },
      { type: 'paragraph', level: 'full', text: 'Diese Unit enthält drei ähnliche, aber klar unterschiedene Verben, die alle mit einer Handlung verbunden werden können: أَرَادَ (Wollen — ein Wunsch), اِحْتَاجَ (Brauchen — eine Notwendigkeit, aus Session B) und اِسْتَطَاعَ (Können — eine Fähigkeit). "Ich möchte gehen" (أَرَادَ), "ich muss gehen" (اِحْتَاجَ) und "ich kann gehen" (اِسْتَطَاعَ) sind drei ganz unterschiedliche Aussagen — im Deutschen leicht zu verwechseln, im Arabischen klar getrennt.' },
      { type: 'callout', variant: 'tip', title: 'Merke', text: 'وَافَقَ (zustimmen) ↔ اِخْتَلَفَ (nicht übereinstimmen) ist das letzte Gegensatzpaar dieser Unit.' },
      { type: 'callout', variant: 'info', title: 'Typischer Fehler', text: 'اِسْتَطَاعَ (können, eine Fähigkeit) und أَرَادَ (wollen, ein Wunsch) werden oft verwechselt — "ich kann Arabisch sprechen" braucht اِسْتَطَاعَ, "ich möchte Arabisch lernen" braucht أَرَادَ.' },
      { type: 'example', arabic: 'وَافَقْتُ عَلَى رَأْيِهِ وَلَمْ أَخْتَلِفْ مَعَهُ.', translation: 'Ich stimmte seiner Meinung zu und widersprach ihm nicht.', note: 'رَأْي (Meinung) hier nur zur Veranschaulichung markiert.' },
      { type: 'example', arabic: 'مَاذَا يَعْنِي هَذَا الْكَلِمَة؟', translation: 'Was bedeutet dieses Wort?', note: 'اَلْكَلِمَة (das Wort) hier nur zur Veranschaulichung markiert.' },
      { type: 'example', arabic: 'حَاوَلْتُ وَاسْتَطَعْتُ أَخِيراً.', translation: 'Ich habe es versucht und es schließlich geschafft.', note: 'أَخِيراً (schließlich) hier nur zur Veranschaulichung markiert.' },
      { type: 'word_preview', word_ids: ['c1_u18_19', 'c1_u18_20', 'c1_u18_21', 'c1_u18_22', 'c1_u18_23', 'c1_u18_24', 'c1_u18_25', 'c1_u18_26', 'c1_u18_27', 'c1_u18_28'] },
      { type: 'mini_check', questions: [
        mc('Das Gegenteil von وَافَقَ ist…', [opt('اِخْتَلَفَ', true), opt('سَمَحَ', false)]),
        mc('Welches Verb beschreibt eine FÄHIGKEIT statt eines Wunsches?', [opt('اِسْتَطَاعَ', true), opt('أَرَادَ', false)]),
        mc('عَنَى bedeutet…', [opt('bedeuten', true), opt('erklären', false)])
      ] }
    ]
  },
  // ============================== UNIT 19 (Häufige Adjektive und Gegensätze) ==============================
  {
    theory_id: 'theory_vocab_unit_19_a',
    title: 'Häufige Adjektive und Gegensätze (1)',
    content_status: 'needs_language_review',
    learning_objectives: [
      'Fünf grundlegende Gegensatzpaare (groß/klein, breit/eng, schwer/leicht, schnell/langsam) sicher anwenden.',
      'طَوِيل und مُنْخَفِض als eigenständige Größenangaben ohne festes Gegenstück in dieser Unit einordnen.',
      'Erkennen, dass diese Unit besonders viele Gegensatzpaare enthält.'
    ],
    blocks: [
      { type: 'paragraph', text: 'Diese Unit trägt "Gegensätze" bereits im Titel — fast jedes Adjektiv hat hier ein passendes Gegenstück. Diese Session beginnt mit dem klassischen Paar كَبِير (groß) ↔ صَغِير (klein), gefolgt von طَوِيل (lang/großgewachsen) und مُنْخَفِض (niedrig) — diese beiden haben in dieser Unit kein direktes Gegenstück (das Gegenteil von طَوِيل wäre قَصِير, das nicht Teil dieser Unit ist).' },
      { type: 'paragraph', text: 'Danach folgen drei weitere Gegensatzpaare: وَاسِع (breit/geräumig) ↔ ضَيِّق (eng/schmal), ثَقِيل (schwer) ↔ خَفِيف (leicht) und سَرِيع (schnell) ↔ بَطِيء (langsam). Übe diese Paare am besten immer gemeinsam — das Gehirn merkt sich Gegensätze oft leichter zusammen als isoliert.' },
      { type: 'heading', level: 'full', text: 'Mehr erfahren: warum so viele Gegensatzpaare?' },
      { type: 'paragraph', level: 'full', text: 'Adjektive beschreiben fast immer eine Position auf einer Skala (groß ↔ klein, schnell ↔ langsam) — deshalb eignen sie sich besonders gut dafür, paarweise gelernt zu werden. Diese Unit nutzt das bewusst aus: fast jedes neue Wort bekommt sein Gegenstück direkt mitgeliefert, statt isoliert präsentiert zu werden.' },
      { type: 'callout', variant: 'tip', title: 'Merke', text: 'Drei Gegensatzpaare in dieser Session: وَاسِع↔ضَيِّق, ثَقِيل↔خَفِيف, سَرِيع↔بَطِيء — zusätzlich كَبِير↔صَغِير.' },
      { type: 'callout', variant: 'info', title: 'Typischer Fehler', text: 'وَاسِع (breit/geräumig, für Räume/Straßen) und طَوِيل (lang, für Strecken/Personen) werden manchmal verwechselt — وَاسِع beschreibt die Breite/Größe eines Raums, طَوِيل eine Länge oder Körpergröße.' },
      { type: 'example', arabic: 'هَذَا الْبَيْتُ كَبِيرٌ وَوَاسِع.', translation: 'Dieses Haus ist groß und geräumig.', note: 'اَلْبَيْت (Haus) kennst du bereits aus dem Bestand.' },
      { type: 'example', arabic: 'اَلْحَقِيبَةُ ثَقِيلَةٌ جِدّاً.', translation: 'Die Tasche ist sehr schwer.', note: 'اَلْحَقِيبَة (Tasche) kennst du bereits aus Unit 12.' },
      { type: 'example', arabic: 'اَلْقِطَارُ سَرِيعٌ وَالْحَافِلَةُ بَطِيئَة.', translation: 'Der Zug ist schnell, und der Bus ist langsam.', note: 'اَلْقِطَار (Zug) hier nur zur Veranschaulichung markiert.' },
      { type: 'word_preview', word_ids: ['c1_u19_01', 'c1_u19_02', 'c1_u19_03', 'c1_u19_04', 'c1_u19_05', 'c1_u19_06', 'c1_u19_07', 'c1_u19_08', 'c1_u19_09', 'c1_u19_10'] },
      { type: 'mini_check', questions: [
        mc('Das Gegenteil von وَاسِع ist…', [opt('ضَيِّق', true), opt('مُنْخَفِض', false)]),
        mc('Welches Wort beschreibt eine schwere Tasche?', [opt('ثَقِيل', true), opt('خَفِيف', false)]),
        mc('بَطِيء bedeutet…', [opt('langsam', true), opt('schnell', false)])
      ] }
    ]
  },
  {
    theory_id: 'theory_vocab_unit_19_b',
    title: 'Häufige Adjektive und Gegensätze (2)',
    content_status: 'needs_language_review',
    learning_objectives: [
      'Vier weitere Gegensatzpaare (neu/alt, sauber/schmutzig, voll/leer, richtig/falsch) anwenden.',
      'صَحِيح/خَطَأ als Adjektiv-Substantiv-Paar für richtig/falsch einordnen.',
      'جَمِيل/قَبِيح als ästhetisches Gegensatzpaar anwenden.'
    ],
    blocks: [
      { type: 'paragraph', text: 'Diese Session setzt die Gegensatzpaare fort: جَدِيد (neu) ↔ قَدِيم (alt), نَظِيف (sauber) ↔ مُتَّسِخ (schmutzig) und مُمْتَلِئ (voll) ↔ فَارِغ (leer) beschreiben den Zustand von Gegenständen. صَحِيح (richtig/korrekt) ↔ خَطَأ (falsch/Fehler) ist besonders für den Sprachunterricht selbst nützlich — z. B. beim Bewerten einer Antwort.' },
      { type: 'paragraph', text: 'Beachte: خَطَأ ist streng genommen ein Substantiv ("ein Fehler"), wird aber im Alltag auch adjektivisch für "falsch" verwendet — deshalb trägt es die Wortart "Substantiv/Adjektiv", genauso wie du es bereits von مَرِيض (krank/Patient, Unit 14) kennst. Zum Abschluss lernst du جَمِيل (schön) ↔ قَبِيح (hässlich), ein rein ästhetisches Gegensatzpaar.' },
      { type: 'heading', level: 'full', text: 'Mehr erfahren: صَحِيح/خَطَأ in Übungen' },
      { type: 'paragraph', level: 'full', text: 'صَحِيح/خَطَأ ("richtig"/"falsch") sind Wörter, die du wahrscheinlich schon aus dem Feedback dieses Kurses selbst kennst — viele Sprachlern-Apps (auch diese) nutzen genau dieses Konzept, um Antworten zu bewerten. Sich diese zwei Wörter gut zu merken lohnt sich also doppelt.' },
      { type: 'callout', variant: 'tip', title: 'Merke', text: 'Vier Gegensatzpaare in dieser Session: جَدِيد↔قَدِيم, نَظِيف↔مُتَّسِخ, مُمْتَلِئ↔فَارِغ, صَحِيح↔خَطَأ.' },
      { type: 'callout', variant: 'info', title: 'Typischer Fehler', text: 'خَطَأ (Substantiv/Adjektiv "falsch/Fehler") wird manchmal wie ein reines Adjektiv behandelt — es kann aber auch alleine als Substantiv stehen ("ein Fehler").' },
      { type: 'example', arabic: 'اَلْغُرْفَةُ نَظِيفَةٌ الْآن، لَمْ تَعُدْ مُتَّسِخَة.', translation: 'Das Zimmer ist jetzt sauber, es ist nicht mehr schmutzig.', note: 'اَلْغُرْفَة (Zimmer) kennst du bereits aus dem Bestand.' },
      { type: 'example', arabic: 'إِجَابَتُكَ صَحِيحَةٌ، لَا يُوجَدُ خَطَأ.', translation: 'Deine Antwort ist richtig, es gibt keinen Fehler.', note: 'إِجَابَة (Antwort) verwandt mit أَجَابَ aus Unit 18.' },
      { type: 'example', arabic: 'هَذِهِ اللَّوْحَةُ جَمِيلَةٌ جِدّاً.', translation: 'Dieses Gemälde ist sehr schön.', note: 'لَوْحَة (Gemälde) hier nur zur Veranschaulichung markiert.' },
      { type: 'word_preview', word_ids: ['c1_u19_11', 'c1_u19_12', 'c1_u19_13', 'c1_u19_14', 'c1_u19_15', 'c1_u19_16', 'c1_u19_17', 'c1_u19_18', 'c1_u19_19', 'c1_u19_20'] },
      { type: 'mini_check', questions: [
        mc('Das Gegenteil von نَظِيف ist…', [opt('مُتَّسِخ', true), opt('فَارِغ', false)]),
        mc('خَطَأ ist von der Wortart her…', [opt('Substantiv/Adjektiv', true), opt('nur Substantiv', false)]),
        mc('قَبِيح bedeutet…', [opt('hässlich', true), opt('leer', false)])
      ] }
    ]
  },
  {
    theory_id: 'theory_vocab_unit_19_c',
    title: 'Häufige Adjektive und Gegensätze (3)',
    content_status: 'needs_language_review',
    learning_objectives: [
      'Vier weitere Gegensatzpaare (gut/schlecht, reich/arm, früh/spät, einfach/kompliziert) anwenden.',
      'بَعِيد und مُخْتَلِف als eigenständige Adjektive ohne festes Gegenstück in dieser Unit einordnen.',
      'Die ganze Unit als zusammenhängendes Gegensatzpaar-System zusammenfassen.'
    ],
    blocks: [
      { type: 'paragraph', text: 'Diese letzte Session der Unit setzt die Gegensatzpaare fort: جَيِّد (gut) ↔ سَيِّئ (schlecht) ist eine der grundlegendsten Bewertungen überhaupt. غَنِيّ (reich) ↔ فَقِير (arm) beschreibt eine wirtschaftliche Situation. بَعِيد (weit/entfernt) hat in dieser Unit kein festes Gegenstück (das Gegenteil قَرِيب "nah" ist nicht Teil dieser Unit).' },
      { type: 'paragraph', text: 'مُبَكِّر (früh) ↔ مُتَأَخِّر (spät) beschreibt Zeitangaben, während مُخْتَلِف (verschieden/anders) — wie بَعِيد — kein eigenes Gegenstück in dieser Unit hat. Zum Abschluss lernst du das letzte Gegensatzpaar dieser Unit: بَسِيط (einfach/schlicht) ↔ مُعَقَّد (kompliziert).' },
      { type: 'heading', level: 'full', text: 'Mehr erfahren: die ganze Unit als Gegensatzpaar-Netzwerk' },
      { type: 'paragraph', level: 'full', text: 'Über alle drei Sessions dieser Unit verteilt hast du insgesamt 13 vollständige Gegensatzpaare gelernt — mehr als in jeder anderen Unit dieses Kurses. Zusammen bilden sie ein dichtes Netzwerk grundlegender Eigenschaftswörter, mit denen du fast jeden Gegenstand, jede Person und jede Situation grob einordnen kannst.' },
      { type: 'callout', variant: 'tip', title: 'Merke', text: 'Drei Gegensatzpaare in dieser Session: جَيِّد↔سَيِّئ, غَنِيّ↔فَقِير, مُبَكِّر↔مُتَأَخِّر, بَسِيط↔مُعَقَّد.' },
      { type: 'callout', variant: 'info', title: 'Typischer Fehler', text: 'مُبَكِّر (früh, für Uhrzeiten) und سَرِيع (schnell, aus Session A, für Geschwindigkeit) werden manchmal verwechselt — مُبَكِّر bezieht sich auf den Zeitpunkt, سَرِيع auf das Tempo.' },
      { type: 'example', arabic: 'وَصَلْتُ مُبَكِّراً، وَهُوَ وَصَلَ مُتَأَخِّراً.', translation: 'Ich kam früh an, und er kam spät an.', note: 'وَصَلَ (ankommen) kennst du bereits aus Unit 16.' },
      { type: 'example', arabic: 'هَذَا التَّمْرِينُ بَسِيطٌ، وَذَاكَ مُعَقَّد.', translation: 'Diese Übung ist einfach, und jene ist kompliziert.', note: 'تَمْرِين (Übung) hier nur zur Veranschaulichung markiert.' },
      { type: 'example', arabic: 'اَلطَّعَامُ جَيِّدٌ فِي هَذَا الْمَطْعَم.', translation: 'Das Essen ist gut in diesem Restaurant.', note: 'اَلْمَطْعَم (Restaurant) kennst du bereits aus dem Bestand.' },
      { type: 'word_preview', word_ids: ['c1_u19_21', 'c1_u19_22', 'c1_u19_23', 'c1_u19_24', 'c1_u19_25', 'c1_u19_26', 'c1_u19_27', 'c1_u19_28', 'c1_u19_29', 'c1_u19_30'] },
      { type: 'mini_check', questions: [
        mc('Das Gegenteil von غَنِيّ ist…', [opt('فَقِير', true), opt('بَعِيد', false)]),
        mc('Welches Wort hat in dieser Unit KEIN direktes Gegenstück?', [opt('مُخْتَلِف', true), opt('جَيِّد', false)]),
        mc('مُعَقَّد bedeutet…', [opt('kompliziert', true), opt('einfach', false)])
      ] }
    ]
  },
  // ============================== UNIT 20 (Stadt, Gebäude und öffentliche Orte) ==============================
  {
    theory_id: 'theory_vocab_unit_20_a',
    title: 'Stadt, Gebäude und öffentliche Orte (1)',
    content_status: 'needs_language_review',
    learning_objectives: [
      'Die acht Orte aus dem Bestand um Flughafen und Hotel ergänzen.',
      'مَدِينَة (Stadt) von قَرْيَة (Dorf) als Größenunterschied unterscheiden.',
      'مَطَار und فُنْدُق als typische Reise-Orte einordnen.'
    ],
    blocks: [
      { type: 'paragraph', text: 'Du kennst aus dem Bestand bereits acht wichtige Orte einer Stadt: مَدِينَة (Stadt), قَرْيَة (Dorf), شَارِع (Straße), مَطْعَم (Restaurant), مُسْتَشْفَى (Krankenhaus), مَحَطَّة (Bahnhof), مَكْتَب (Büro) und مَسْجِد (Moschee). Diese Unit ergänzt weitere Gebäude und öffentliche Orte, beginnend mit zwei Reise-Orten: مَطَار (Flughafen) und فُنْدُق (Hotel).' },
      { type: 'paragraph', text: 'مَدِينَة (Stadt) und قَرْيَة (Dorf) beschreiben denselben Grundbegriff "besiedelter Ort", unterscheiden sich aber in der Größe — eine مَدِينَة ist groß mit vielen Einwohnern, eine قَرْيَة klein und ländlich. Diese Session dient als Einstieg in die ganze Unit — die weiteren zwei Sessions führen viele weitere Gebäudetypen ein.' },
      { type: 'heading', level: 'full', text: 'Mehr erfahren: مَحَطَّة als wiederkehrendes Wortelement' },
      { type: 'paragraph', level: 'full', text: 'مَحَطَّة (Bahnhof/Station) taucht in diesem Kurs mehrfach als Teil zusammengesetzter Begriffe auf — z. B. später مَحَطَّة وَقُود ("Tankstelle", wörtlich "Treibstoff-Station"). Wenn du مَحَطَّة als "Station/Halt" verinnerlichst, erkennst du solche zusammengesetzten Begriffe leichter wieder.' },
      { type: 'callout', variant: 'tip', title: 'Merke', text: 'مَدِينَة (Stadt) ist groß, قَرْيَة (Dorf) ist klein — beide beschreiben einen besiedelten Ort.' },
      { type: 'callout', variant: 'info', title: 'Typischer Fehler', text: 'مَطَار (Flughafen) und مَحَطَّة (Bahnhof, aus dem Bestand) werden gelegentlich verwechselt — مَطَار ist ausschließlich für Flugzeuge, مَحَطَّة meist für Züge/Busse.' },
      { type: 'example', arabic: 'وَصَلْنَا إِلَى الْمَطَارِ مُبَكِّراً.', translation: 'Wir kamen früh am Flughafen an.', note: 'وَصَلَ (ankommen) aus Unit 16, مُبَكِّراً (früh) aus Unit 19.' },
      { type: 'example', arabic: 'اَلْفُنْدُقُ قَرِيبٌ مِنَ الْمَدِينَة.', translation: 'Das Hotel ist nahe an der Stadt.', note: 'قَرِيب (nah) hier nur zur Veranschaulichung markiert.' },
      { type: 'example', arabic: 'أَسْكُنُ فِي قَرْيَةٍ صَغِيرَة.', translation: 'Ich wohne in einem kleinen Dorf.', note: 'سَكَنَ (wohnen) aus Unit 16, صَغِير (klein) aus Unit 19.' },
      { type: 'word_preview', word_ids: ['place_city', 'place_village', 'place_street', 'place_restaurant', 'place_hospital', 'place_station', 'place_office', 'place_mosque', 'c1_u20_01', 'c1_u20_02'] },
      { type: 'mini_check', questions: [
        mc('Was ist größer: مَدِينَة oder قَرْيَة؟', [opt('مَدِينَة (Stadt)', true), opt('قَرْيَة (Dorf)', false)]),
        mc('مَطَار bedeutet…', [opt('Flughafen', true), opt('Hotel', false)]),
        mc('فُنْدُق bedeutet…', [opt('Hotel', true), opt('Krankenhaus', false)])
      ] }
    ]
  },
  {
    theory_id: 'theory_vocab_unit_20_b',
    title: 'Stadt, Gebäude und öffentliche Orte (2)',
    content_status: 'needs_language_review',
    learning_objectives: [
      'Behörden und Bildungsorte (Postamt, Polizeistation, Schule) benennen.',
      'Freizeitorte (Park, Museum, Kino, Theater, Café) als zusammengehörige Gruppe erkennen.',
      'Zusammengesetzte Ortsnamen (مَكْتَب بَرِيد, مَرْكَز الشُّرْطَة) als Genitivverbindungen einordnen.'
    ],
    blocks: [
      { type: 'paragraph', text: 'Diese Session beginnt mit drei praktischen Orten: مَكْتَب بَرِيد (Postamt, wörtlich "Büro der Post"), مَرْكَز الشُّرْطَة (Polizeistation, wörtlich "Zentrum der Polizei") und مَدْرَسَة (Schule). Beide zusammengesetzten Begriffe folgen der bereits bekannten Iḍāfa-Konstruktion (zwei Substantive hintereinander, vgl. سَاعَة يَد aus Unit 12) — das zweite Wort bestimmt das erste näher.' },
      { type: 'paragraph', text: 'Danach folgt eine Gruppe von fünf Freizeitorten: حَدِيقَة عَامَّة (öffentlicher Park), مَتْحَف (Museum), سِينِمَا (Kino, ein Lehnwort), مَسْرَح (Theater) und مَخْبَز (Bäckerei). Zum Abschluss lernst du مَقْهَى (Café) und مَرْكَز تِجَارِيّ (Einkaufszentrum) — zwei weitere Orte, an denen du deine Freizeit verbringst oder einkaufst.' },
      { type: 'heading', level: 'full', text: 'Mehr erfahren: مَتْحَف/مَسْرَح/مَقْهَى — dasselbe Wortmuster' },
      { type: 'paragraph', level: 'full', text: 'مَتْحَف, مَسْرَح und مَقْهَى folgen alle demselben arabischen Wortbildungsmuster für "Ort, an dem etwas geschieht" (مَفْعَل-Muster): مَتْحَف leitet sich vom Verb für "sammeln/ausstellen" ab, مَسْرَح von "eine Bühne betreten", مَقْهَى ist mit dem Wort für "Kaffee" (قَهْوَة) verwandt. Dieses Muster begegnet dir bei vielen arabischen Ortsbezeichnungen.' },
      { type: 'callout', variant: 'tip', title: 'Merke', text: 'مَكْتَب بَرِيد und مَرْكَز الشُّرْطَة sind Genitivverbindungen (Iḍāfa) — genau wie سَاعَة يَد aus Unit 12.' },
      { type: 'callout', variant: 'info', title: 'Typischer Fehler', text: 'مَتْحَف (Museum) und مَسْرَح (Theater) werden gelegentlich verwechselt — im Museum siehst du Ausstellungsstücke an, im Theater ein Live-Stück.' },
      { type: 'example', arabic: 'أَرْسَلْتُ الطَّرْدَ مِنْ مَكْتَبِ الْبَرِيد.', translation: 'Ich habe das Paket vom Postamt aus geschickt.', note: 'أَرْسَلَ (senden) kennst du bereits aus Unit 17.' },
      { type: 'example', arabic: 'زُرْنَا الْمَتْحَفَ ثُمَّ شَرِبْنَا قَهْوَةً فِي الْمَقْهَى.', translation: 'Wir besuchten das Museum und tranken dann Kaffee im Café.', note: 'زَارَ (besuchen) kennst du bereits aus Unit 16.' },
      { type: 'example', arabic: 'اَلْأَطْفَالُ يَلْعَبُونَ فِي الْحَدِيقَةِ الْعَامَّة.', translation: 'Die Kinder spielen im öffentlichen Park.', note: 'لَعِبَ (spielen) kennst du bereits aus dem Bestand.' },
      { type: 'word_preview', word_ids: ['c1_u20_03', 'c1_u20_04', 'c1_u20_05', 'c1_u20_06', 'c1_u20_07', 'c1_u20_08', 'c1_u20_09', 'c1_u20_10', 'c1_u20_11', 'c1_u20_12'] },
      { type: 'mini_check', questions: [
        mc('مَكْتَب بَرِيد bedeutet wörtlich…', [opt('Büro der Post', true), opt('Zentrum der Polizei', false)]),
        mc('Welches Wort ist ein Lehnwort aus dem Internationalen?', [opt('سِينِمَا', true), opt('مَسْرَح', false)]),
        mc('مَقْهَى bedeutet…', [opt('Café', true), opt('Museum', false)])
      ] }
    ]
  },
  {
    theory_id: 'theory_vocab_unit_20_c',
    title: 'Stadt, Gebäude und öffentliche Orte (3)',
    content_status: 'needs_language_review',
    learning_objectives: [
      'Verkehrsbezogene Begriffe (Brücke, Platz, Ampel, Gehweg, Verkehr) benennen.',
      'مِنْطَقَة سَكَنِيَّة von مَرْكَز als Stadtteil-vs-Zentrum-Paar unterscheiden.',
      'Die Unit mit Kirche, Fabrik und Tankstelle abschließen.'
    ],
    blocks: [
      { type: 'paragraph', text: 'Diese letzte Session der Unit sammelt Begriffe rund um Verkehr und Stadtstruktur: جِسْر (Brücke) überquert einen Fluss, مَيْدَان (Platz) ist der Treffpunkt mehrerer Straßen, إِشَارَة مُرُور (Ampel) regelt den حَرَكَة الْمُرُور (Verkehr) — beide Wörter teilen sich das Wort مُرُور ("Durchgang/Verkehr"). رَصِيف (Gehweg/Bürgersteig) ist für Fußgänger reserviert, nicht für Autos.' },
      { type: 'paragraph', text: 'مِنْطَقَة سَكَنِيَّة (Wohngebiet/Wohnviertel) steht im Gegensatz zu مَرْكَز (Zentrum, aus dem bereits bekannten مَرْكَز تِجَارِيّ/مَرْكَز الشُّرْطَة abgeleitet) — ein Wohnviertel hat vor allem Häuser, das Zentrum vor allem Geschäfte und Ämter. Zum Abschluss lernst du drei letzte Gebäudetypen: كَنِيسَة (Kirche), مَصْنَع (Fabrik) und مَحَطَّة وَقُود (Tankstelle, wörtlich "Treibstoff-Station" — vgl. مَحَطَّة aus Session A).' },
      { type: 'heading', level: 'full', text: 'Mehr erfahren: مَسْجِد und كَنِيسَة nebeneinander' },
      { type: 'paragraph', level: 'full', text: 'Du kennst مَسْجِد (Moschee) bereits aus dem Bestand — diese Session ergänzt كَنِيسَة (Kirche) als zweites religiöses Gebäude. In vielen arabischsprachigen Städten stehen beide Gebäudetypen nebeneinander, da die Bevölkerung religiös gemischt ist — ein guter Anlass, beide Wörter gemeinsam zu lernen.' },
      { type: 'callout', variant: 'tip', title: 'Merke', text: 'إِشَارَة مُرُور (Ampel) und حَرَكَة الْمُرُور (Verkehr) teilen sich das Wort مُرُور ("Durchgang").' },
      { type: 'callout', variant: 'info', title: 'Typischer Fehler', text: 'رَصِيف (Gehweg, für Fußgänger) und شَارِع (Straße, für Autos, aus dem Bestand) werden manchmal verwechselt — auf dem رَصِيف gehst du zu Fuß, auf der شَارِع fahren Autos.' },
      { type: 'example', arabic: 'عَبَرْتُ الْجِسْرَ ثُمَّ وَصَلْتُ إِلَى الْمَيْدَان.', translation: 'Ich überquerte die Brücke und kam dann am Platz an.', note: 'عَبَرَ (überqueren) kennst du bereits aus Unit 17.' },
      { type: 'example', arabic: 'اَلْحَرَكَةُ كَثِيفَةٌ عِنْدَ إِشَارَةِ الْمُرُور.', translation: 'Der Verkehr ist dicht an der Ampel.', note: 'كَثِيف (dicht) hier nur zur Veranschaulichung markiert.' },
      { type: 'example', arabic: 'أَسْكُنُ فِي مِنْطَقَةٍ سَكَنِيَّةٍ بَعِيدَةٍ عَنِ الْمَرْكَز.', translation: 'Ich wohne in einem Wohnviertel weit vom Zentrum entfernt.', note: 'بَعِيد (weit/entfernt) kennst du bereits aus Unit 19.' },
      { type: 'word_preview', word_ids: ['c1_u20_13', 'c1_u20_14', 'c1_u20_15', 'c1_u20_16', 'c1_u20_17', 'c1_u20_18', 'c1_u20_19', 'c1_u20_20', 'c1_u20_21', 'c1_u20_22'] },
      { type: 'mini_check', questions: [
        mc('إِشَارَة مُرُور und حَرَكَة الْمُرُور teilen sich welches Wort?', [opt('مُرُور', true), opt('مَرْكَز', false)]),
        mc('Wo gehst du zu Fuß: رَصِيف oder شَارِع؟', [opt('رَصِيف (Gehweg)', true), opt('شَارِع (Straße)', false)]),
        mc('مِنْطَقَة سَكَنِيَّة bedeutet…', [opt('Wohngebiet', true), opt('Stadtzentrum', false)])
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
