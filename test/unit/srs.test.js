// Tests für src/js/srs.js: Antwortauswertung (P0.3), Schwierigkeitsanpassung, Spaced Repetition.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const srs = require('../../src/js/srs.js');

const {
  evaluateArabicAnswer,
  evaluateArabicWithProfile,
  evaluateGermanAnswer,
  evaluateAgainstAny,
  normalizeArabic,
  normalizeGerman,
  levenshtein,
  typoToleranceForLength,
  adjustDifficulty,
  scheduleNextReview,
  sortByDifficultyShuffled,
  DEFAULT_DIFFICULTY,
  REVIEW_INTERVALS_DAYS
} = srs;

// --- P0.3-Regressionstest: der ursprüngliche Fehler --------------------------------------
// Vorher: fester Levenshtein-Grenzwert 2 akzeptierte JEDEN anderen einzelnen Buchstaben als
// "kleinen Tippfehler" (Distanz 1 bei einem Zeichen). Jetzt: Länge-1-Antworten haben Toleranz 0.
test('P0.3-Bugfix: einzelner falscher Buchstabe wird nicht mehr als Tippfehler durchgewunken', () => {
  assert.equal(evaluateArabicAnswer('ب', 'ت'), 'wrong');
  assert.equal(evaluateArabicWithProfile('ب', 'ت', 'arabic_letter_strict'), 'wrong');
});

// --- Tabellengetriebene Arabisch-Vergleichsfälle (Akzeptanzkriterium: mindestens 30) -----
const ARABIC_CASES = [
  // Einzelne Buchstaben, arabic_letter_strict — jede Abweichung ist ein echter Fehler.
  ['ب', 'ب', 'arabic_letter_strict', 'correct_full', 'identischer Buchstabe'],
  ['ب', 'ت', 'arabic_letter_strict', 'wrong', 'ب vs ت (nur Punkte anders)'],
  ['ت', 'ث', 'arabic_letter_strict', 'wrong', 'ت vs ث (Punktanzahl)'],
  ['د', 'ذ', 'arabic_letter_strict', 'wrong', 'د vs ذ (Punkt)'],
  ['ر', 'ز', 'arabic_letter_strict', 'wrong', 'ر vs ز (Punkt)'],
  ['س', 'ش', 'arabic_letter_strict', 'wrong', 'س vs ش (Punkte)'],
  ['ص', 'ض', 'arabic_letter_strict', 'wrong', 'ص vs ض (Punkt)'],
  ['ط', 'ظ', 'arabic_letter_strict', 'wrong', 'ط vs ظ (Punkt)'],
  ['ع', 'غ', 'arabic_letter_strict', 'wrong', 'ع vs غ (Punkt)'],
  ['ف', 'ق', 'arabic_letter_strict', 'wrong', 'ف vs ق (Punktanzahl)'],
  ['ه', 'ه', 'arabic_letter_strict', 'correct_full', 'identischer Buchstabe (ه)'],
  ['ن', 'ب', 'arabic_letter_strict', 'wrong', 'ن vs ب (Grundform ähnlich, anderer Buchstabe)'],

  // Wortebene mit/ohne Vokalzeichen, arabic_word_strict (Standardprofil).
  ['بَاب', 'بَاب', 'arabic_word_strict', 'correct_full', 'باب exakt inkl. Diakritika'],
  ['بَاب', 'باب', 'arabic_word_strict', 'correct_no_diacritics', 'باب ohne Diakritika'],
  ['أَب', 'أَب', 'arabic_word_strict', 'correct_full', 'أب exakt inkl. Diakritika'],
  ['أَب', 'اب', 'arabic_word_strict', 'wrong', 'أب mit Hamza vs اب ohne Hamza (streng)'],
  ['شُكْرًا', 'شكرًا', 'arabic_word_strict', 'correct_no_diacritics', 'شكرا: Sukun fehlt, Rest korrekt'],
  ['نَعَم', 'لا', 'arabic_word_strict', 'wrong', 'völlig anderes Wort (نعم vs لا)'],
  ['أُخْت', 'اخت', 'arabic_word_strict', 'wrong', 'أخت streng: Hamza-Unterschied nicht toleriert'],

  // arabic_word_ignore_diacritics — Diakritika werden für den Vergleich ignoriert.
  ['شُكْرًا', 'شكرا', 'arabic_word_ignore_diacritics', 'correct_no_diacritics', 'شكرا ganz ohne Diakritika'],
  ['مَرْحَبًا', 'مرحبا', 'arabic_word_ignore_diacritics', 'correct_no_diacritics', 'مرحبا ohne Diakritika'],
  ['مَرْحَبًا', 'مرحبن', 'arabic_word_ignore_diacritics', 'typo', 'مرحبا mit einem falschen Endbuchstaben'],
  ['اِبْن', 'ابن', 'arabic_word_ignore_diacritics', 'correct_no_diacritics', 'ابن ohne Diakritika'],
  ['اِبْنَة', 'ابن', 'arabic_word_ignore_diacritics', 'typo', 'ابنة mit fehlendem Endbuchstaben (ة)'],

  // arabic_word_require_diacritics — fehlende/falsche Vokalzeichen zählen als Fehler.
  ['بَاب', 'باب', 'arabic_word_require_diacritics', 'wrong', 'باب ohne Pflicht-Diakritika: falsch'],
  ['بَاب', 'بَاب', 'arabic_word_require_diacritics', 'correct_full', 'باب mit korrekten Pflicht-Diakritika'],
  ['كَتَبَ', 'كتب', 'arabic_word_require_diacritics', 'wrong', 'كتب ohne Diakritika bei Pflicht-Profil'],

  // arabic_sentence_flexible — Vokalzeichen UND Alif-Varianten werden vereinheitlicht, kleine
  // Tippfehler bei längeren Sätzen als "fast richtig" (typo), nicht automatisch akzeptiert.
  ['السَّلَامُ عَلَيْكُم', 'السلام عليكم', 'arabic_sentence_flexible', 'correct_no_diacritics', 'Gruß ohne Diakritika'],
  ['السَّلَامُ عَلَيْكُم', 'السلام عليكن', 'arabic_sentence_flexible', 'typo', 'Gruß mit einem falschen Buchstaben am Ende'],
  ['أُخْت', 'اخت', 'arabic_sentence_flexible', 'correct_no_diacritics', 'أخت/اخت: Hamza-Form im flexiblen Profil toleriert'],
  ['مِنْ فَضْلِك', 'من فضلك', 'arabic_sentence_flexible', 'correct_no_diacritics', '"bitte" ohne Diakritika'],
  ['مِنْ فَضْلِك', 'من فظلك', 'arabic_sentence_flexible', 'typo', '"bitte" mit einem falschen Buchstaben (ض statt ظ)'],
  ['مِنْ فَضْلِك', 'شكرا', 'arabic_sentence_flexible', 'wrong', 'völlig falscher Satz'],

  // Satzzeichen/Tatweel/Leerzeichen werden normalisiert, ändern das Ergebnis nicht.
  ['شُكْرًا؟', 'شكرا', 'arabic_word_ignore_diacritics', 'correct_no_diacritics', 'Fragezeichen wird ignoriert'],
  ['بـاب', 'باب', 'arabic_word_strict', 'correct_full', 'Tatweel im Original wird entfernt']
];

for (const [expected, given, profile, expectedResult, description] of ARABIC_CASES) {
  test(`evaluateArabicWithProfile: ${description} (${profile}) → ${expectedResult}`, () => {
    assert.equal(evaluateArabicWithProfile(expected, given, profile), expectedResult);
  });
}

test(`mindestens 30 arabische Vergleichsfälle sind abgedeckt (Akzeptanzkriterium)`, () => {
  assert.ok(ARABIC_CASES.length >= 30, `nur ${ARABIC_CASES.length} Fälle vorhanden`);
});

test('unbekanntes Bewertungsprofil wirft einen verständlichen Fehler', () => {
  assert.throws(() => evaluateArabicWithProfile('ا', 'ا', 'does_not_exist'), /Unbekanntes Bewertungsprofil/);
});

// --- Deutsche Übersetzungsbewertung -------------------------------------------------------
test('evaluateGermanAnswer: Groß-/Kleinschreibung wird ignoriert', () => {
  assert.equal(evaluateGermanAnswer('Hallo', 'hallo'), 'correct_full');
  assert.equal(evaluateGermanAnswer('Vater', 'VATER'), 'correct_full');
});

test('evaluateGermanAnswer: kleiner Tippfehler bei längerem Wort', () => {
  assert.equal(evaluateGermanAnswer('Auf Wiedersehen', 'auf wiedersehn'), 'typo');
});

test('evaluateGermanAnswer: komplett falsche Antwort', () => {
  assert.equal(evaluateGermanAnswer('Vater', 'Baum'), 'wrong');
});

// --- evaluateAgainstAny (mehrere akzeptierte Antworten) -----------------------------------
test('evaluateAgainstAny gibt das beste Ergebnis über mehrere akzeptierte Antworten zurück', () => {
  const accepted = ['بَاب', 'الباب'];
  const evaluator = (expected, given) => evaluateArabicWithProfile(expected, given, 'arabic_word_strict');
  assert.equal(evaluateAgainstAny(accepted, 'باب', evaluator), 'correct_no_diacritics');
  assert.equal(evaluateAgainstAny(accepted, 'شباك', evaluator), 'wrong');
});

// --- Normalisierung --------------------------------------------------------------------
test('normalizeArabic entfernt standardmäßig Diakritika (Rückwärtskompatibilität)', () => {
  assert.equal(normalizeArabic('بَاب'), 'باب');
});

test('normalizeArabic kann Diakritika behalten, wenn explizit gefordert', () => {
  assert.equal(normalizeArabic('بَاب', { stripDiacritics: false }), 'بَاب');
});

test('normalizeArabic entfernt unsichtbare Steuerzeichen', () => {
  const withZwj = 'با‍ب';
  assert.equal(normalizeArabic(withZwj, { stripDiacritics: false }), 'باب');
});

test('normalizeArabic kann Alif-Varianten vereinheitlichen', () => {
  assert.equal(normalizeArabic('أخت', { stripDiacritics: false, normalizeAlifForms: true }), 'اخت');
  assert.equal(normalizeArabic('إخت', { stripDiacritics: false, normalizeAlifForms: true }), 'اخت');
  assert.equal(normalizeArabic('آخت', { stripDiacritics: false, normalizeAlifForms: true }), 'اخت');
});

test('normalizeGerman normalisiert Mehrfach-Leerzeichen', () => {
  assert.equal(normalizeGerman('Auf   Wiedersehen'), 'auf wiedersehen');
});

// --- Tippfehler-Toleranz nach Länge --------------------------------------------------------
test('typoToleranceForLength: 0 für einzelne Zeichen, steigt mit der Länge', () => {
  assert.equal(typoToleranceForLength(0), 0);
  assert.equal(typoToleranceForLength(1), 0);
  assert.equal(typoToleranceForLength(3), 1);
  assert.equal(typoToleranceForLength(8), 2);
  assert.ok(typoToleranceForLength(20) > 2);
});

// --- Levenshtein (unverändert, weiterhin exportiert und genutzt) --------------------------
test('levenshtein: Distanz 0 bei identischen Strings', () => {
  assert.equal(levenshtein('باب', 'باب'), 0);
});

test('levenshtein: Distanz 1 bei einer Substitution', () => {
  assert.equal(levenshtein('باب', 'تاب'), 1);
});

// --- Schwierigkeitsanpassung / Spaced Repetition (bestehende Logik, jetzt mit Tests) ------
test('adjustDifficulty senkt die Schwierigkeit bei richtiger Antwort', () => {
  const card = {};
  const result = adjustDifficulty(card, 'spelling', 'correct_full');
  assert.equal(result.difficulty, DEFAULT_DIFFICULTY - 2);
  assert.equal(card.consecutiveWrong.spelling, 0);
});

test('adjustDifficulty erhöht die Schwierigkeit stärker bei falscher Antwort als bei Tippfehler', () => {
  const cardWrong = {};
  const cardTypo = {};
  adjustDifficulty(cardWrong, 'spelling', 'wrong');
  adjustDifficulty(cardTypo, 'spelling', 'typo');
  assert.ok(cardWrong.difficulty.spelling > cardTypo.difficulty.spelling);
});

test('adjustDifficulty markiert Intensivwiederholung nach 3 Fehlern in Folge', () => {
  const card = {};
  adjustDifficulty(card, 'spelling', 'wrong');
  adjustDifficulty(card, 'spelling', 'wrong');
  const result = adjustDifficulty(card, 'spelling', 'wrong');
  assert.equal(result.needsIntensiveReview, true);
});

test('adjustDifficulty klammert die Schwierigkeit auf 1-10', () => {
  const card = { difficulty: { spelling: 1 } };
  const result = adjustDifficulty(card, 'spelling', 'correct_full');
  assert.equal(result.difficulty, 1);
});

test('scheduleNextReview setzt die Stufe bei falscher Antwort zurück auf 0', () => {
  const card = { reviewStage: { spelling: 3 } };
  scheduleNextReview(card, 'spelling', false);
  assert.equal(card.reviewStage.spelling, 0);
});

test('scheduleNextReview erhöht die Stufe bei richtiger Antwort (bis zum Maximum)', () => {
  const card = { reviewStage: { spelling: 0 } };
  scheduleNextReview(card, 'spelling', true);
  assert.equal(card.reviewStage.spelling, 1);
});

test('REVIEW_INTERVALS_DAYS entspricht der Spec (sofort/1/3/7/14/30 Tage)', () => {
  assert.deepEqual(REVIEW_INTERVALS_DAYS, [0, 1, 3, 7, 14, 30]);
});

test('sortByDifficultyShuffled ordnet schwierigere Karten zuerst', () => {
  const difficulties = { a: 2, b: 8, c: 5 };
  const result = sortByDifficultyShuffled(['a', 'b', 'c'], (id) => difficulties[id]);
  assert.deepEqual(result, ['b', 'c', 'a']);
});
