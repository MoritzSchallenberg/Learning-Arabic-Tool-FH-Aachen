// Schwierigkeits-Engine (Spec Kapitel 5) + Antwortauswertung (Spec Kapitel 7/P0.3 aus dem
// Entwicklungsauftrag "Veröffentlichungsfähigkeit").
//
// P0.3-Hintergrund: ein fester Levenshtein-Grenzwert von 2 war für kurze Antworten ungeeignet —
// bei einem einzelnen Buchstaben hat praktisch jeder andere Buchstabe eine Distanz von 1 und
// wurde dadurch fälschlich als "kleiner Tippfehler" statt als echter Fehler gewertet (ب vs ت).
// Die Toleranz hängt jetzt von der normalisierten Antwortlänge ab (siehe typoToleranceForLength),
// und aufgabenspezifische Bewertungsprofile (EVALUATION_PROFILES) steuern zusätzlich, ob
// Vokalzeichen/Hamza-Formen streng oder tolerant behandelt werden.
//
// Die extern sichtbaren Ergebnis-Kategorien bleiben bewusst bei den bisherigen vier
// ('correct_full' | 'correct_no_diacritics' | 'typo' | 'wrong') — eine feinere Kategorisierung
// (P1.8: "richtig mit Formatabweichung", "verständlich aber grammatisch fehlerhaft" usw.) ist
// als spätere Ausbaustufe in der ROADMAP vorgesehen und würde alle aufrufenden Views + die
// Fortschrittsberechnung mit betreffen.

const HARAKAT_PATTERN = /[ً-ْ]/g; // U+064B–U+0652: alle 8 kurzen Vokalzeichen/Tanwin/Schadda/Sukun
const ARABIC_PUNCTUATION_PATTERN = /[؟،؛]/g;
// Unsichtbare/Steuerzeichen, die beim Abtippen leicht unbemerkt mitkopiert werden
// (Zero-Width-Joiner/Non-Joiner, BOM, Bidi-Marker/-Isolates).
const INVISIBLE_PATTERN = /[​‌‍‎‏﻿⁦-⁩]/g;
const ALIF_VARIANTS_PATTERN = /[أإآٱ]/g;

/**
 * Konfigurierbare arabische Normalisierung (P0.3). Alle Schritte sind einzeln zu- oder
 * abschaltbar, damit unterschiedliche Bewertungsprofile unterschiedliche Toleranzen ausdrücken
 * können, ohne den Normalisierungscode zu duplizieren.
 * @param {string} text
 * @param {object} options
 * @param {boolean} [options.nfc=true] - Unicode-Normalisierungsform NFC anwenden
 * @param {boolean} [options.stripInvisible=true] - unsichtbare Steuerzeichen entfernen
 * @param {boolean} [options.stripTatweel=true] - Tatweel (ـ) entfernen
 * @param {boolean} [options.stripDiacritics=true] - kurze Vokalzeichen/Tanwin/Schadda entfernen
 *   (Standard true, damit der bisherige Aufrufvertrag von normalizeArabic(text) ohne Optionen
 *   unverändert bleibt — lessonProgress.js und connectionTrainer.js rufen es genau so auf, um
 *   eine diakritikafreie Karten-ID zu bilden)
 * @param {boolean} [options.stripPunctuation=true] - arabische Satzzeichen entfernen
 * @param {boolean} [options.normalizeAlifForms=false] - أ/إ/آ/ٱ zu ا vereinheitlichen
 * @param {boolean} [options.normalizeWhitespace=true] - mehrfache Leerzeichen zusammenfassen, trimmen
 */
function normalizeArabic(text, options = {}) {
  const {
    nfc = true,
    stripInvisible = true,
    stripTatweel = true,
    stripDiacritics = true,
    stripPunctuation = true,
    normalizeAlifForms = false,
    normalizeWhitespace = true
  } = options;

  if (!text) return '';
  let result = text;
  if (nfc && typeof result.normalize === 'function') result = result.normalize('NFC');
  if (stripInvisible) result = result.replace(INVISIBLE_PATTERN, '');
  if (stripTatweel) result = result.replace(/ـ/g, '');
  if (stripDiacritics) result = result.replace(HARAKAT_PATTERN, '');
  if (stripPunctuation) result = result.replace(ARABIC_PUNCTUATION_PATTERN, '');
  if (normalizeAlifForms) result = result.replace(ALIF_VARIANTS_PATTERN, 'ا');
  if (normalizeWhitespace) result = result.replace(/\s+/g, ' ').trim();
  return result;
}

function normalizeGerman(text, options = {}) {
  const { caseInsensitive = true, normalizeWhitespace = true, nfc = true } = options;
  if (!text) return '';
  let result = text;
  if (nfc && typeof result.normalize === 'function') result = result.normalize('NFC');
  if (normalizeWhitespace) result = result.replace(/\s+/g, ' ').trim();
  if (caseInsensitive) result = result.toLowerCase();
  return result;
}

// Portiert aus dem alten script.py (levenshtein), Zeilen 25-41.
function levenshtein(a, b) {
  if (a.length < b.length) return levenshtein(b, a);
  if (b.length === 0) return a.length;

  let previousRow = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 0; i < a.length; i++) {
    const currentRow = [i + 1];
    for (let j = 0; j < b.length; j++) {
      const insertions = previousRow[j + 1] + 1;
      const deletions = currentRow[j] + 1;
      const substitutions = previousRow[j] + (a[i] !== b[j] ? 1 : 0);
      currentRow.push(Math.min(insertions, deletions, substitutions));
    }
    previousRow = currentRow;
  }
  return previousRow[previousRow.length - 1];
}

/**
 * Tippfehler-Toleranz abhängig von der normalisierten Antwortlänge (P0.3): einzelne Buchstaben
 * bekommen KEINE Toleranz (jede Abweichung ist ein echter Fehler), kurze Wörter sehr wenig,
 * längere Sätze proportional mehr — aber nie automatisch "korrekt".
 */
function typoToleranceForLength(length) {
  if (length <= 1) return 0;
  if (length <= 3) return 1;
  if (length <= 8) return 2;
  return Math.floor(length / 4);
}

function zeroTolerance() {
  return 0;
}

// Aufgabenspezifische Bewertungsprofile (P0.3). `normalize` sind die Optionen für
// normalizeArabic/normalizeGerman; `toleranceForLength` bestimmt die Tippfehler-Toleranz;
// `requireDiacritics`, wenn gesetzt, lässt eine sonst als "nur Vokalzeichen falsch/fehlend"
// erkannte Antwort NICHT als correct_no_diacritics durchgehen, sondern als "wrong" werten
// (für Übungen, in denen Vokalzeichen ausdrücklich Teil der Aufgabe sind).
const EVALUATION_PROFILES = {
  arabic_letter_strict: {
    normalize: { stripDiacritics: false, normalizeAlifForms: false },
    toleranceForLength: zeroTolerance
  },
  arabic_word_strict: {
    normalize: { stripDiacritics: false, normalizeAlifForms: false },
    toleranceForLength: typoToleranceForLength
  },
  arabic_word_ignore_diacritics: {
    normalize: { stripDiacritics: true, normalizeAlifForms: false },
    toleranceForLength: typoToleranceForLength
  },
  arabic_word_require_diacritics: {
    normalize: { stripDiacritics: false, normalizeAlifForms: false },
    toleranceForLength: typoToleranceForLength,
    requireDiacritics: true
  },
  arabic_sentence_flexible: {
    normalize: { stripDiacritics: true, normalizeAlifForms: true },
    toleranceForLength: typoToleranceForLength
  },
  german_translation_flexible: {
    normalize: { caseInsensitive: true },
    toleranceForLength: typoToleranceForLength
  }
};

/**
 * Bewertet eine arabische Antwort gegen die erwartete Antwort nach einem benannten Profil
 * (P0.3). Rückgabe weiterhin: 'correct_full' | 'correct_no_diacritics' | 'typo' | 'wrong'.
 * @param {string} expected
 * @param {string} given
 * @param {string} profileName - Schlüssel aus EVALUATION_PROFILES
 */
function evaluateArabicWithProfile(expected, given, profileName) {
  const profile = EVALUATION_PROFILES[profileName];
  if (!profile) throw new Error(`Unbekanntes Bewertungsprofil: "${profileName}"`);
  if (given === expected) return 'correct_full';

  const baseOpts = profile.normalize || {};
  const keepDiacriticsOpts = { ...baseOpts, stripDiacritics: false };
  const stripDiacriticsOpts = { ...baseOpts, stripDiacritics: true };

  const normExpectedKeep = normalizeArabic(expected, keepDiacriticsOpts);
  const normGivenKeep = normalizeArabic(given, keepDiacriticsOpts);
  if (normGivenKeep === normExpectedKeep) return 'correct_full';

  const normExpectedBare = normalizeArabic(expected, stripDiacriticsOpts);
  const normGivenBare = normalizeArabic(given, stripDiacriticsOpts);
  if (normExpectedBare !== '' && normGivenBare === normExpectedBare) {
    return profile.requireDiacritics ? 'wrong' : 'correct_no_diacritics';
  }

  // Für die Tippfehler-Einstufung wird konsistent mit dem Profil verglichen: *_ignore_diacritics
  // und *_sentence_flexible vergleichen ohne Vokalzeichen, die strikten Profile mit.
  const compareExpected = baseOpts.stripDiacritics ? normExpectedBare : normExpectedKeep;
  const compareGiven = baseOpts.stripDiacritics ? normGivenBare : normGivenKeep;
  const distance = levenshtein(compareGiven, compareExpected);
  const tolerance = profile.toleranceForLength(compareExpected.length);
  if (distance > 0 && distance <= tolerance) return 'typo';

  return 'wrong';
}

/**
 * Bewertet eine arabische Antwort gegen die erwartete Antwort (inkl. Vokalzeichen).
 * Rückgabe: 'correct_full' | 'correct_no_diacritics' | 'typo' | 'wrong'.
 * Bestehende Aufrufer (2-Parameter-Form) bekommen automatisch die längenabhängige Toleranz aus
 * "arabic_word_strict" — das behebt den P0.3-Fehler (einzelne Buchstaben: Länge 1 → Toleranz 0)
 * ohne dass jede aufrufende Stelle angepasst werden muss.
 */
function evaluateArabicAnswer(expected, given, profileName = 'arabic_word_strict') {
  return evaluateArabicWithProfile(expected, given, profileName);
}

/**
 * Bewertet eine deutsche Antwort (Definition) gegen die erwartete Antwort, ebenfalls mit
 * längenabhängiger statt fester Tippfehler-Toleranz.
 */
function evaluateGermanAnswer(expected, given, profileName = 'german_translation_flexible') {
  const profile = EVALUATION_PROFILES[profileName];
  if (!profile) throw new Error(`Unbekanntes Bewertungsprofil: "${profileName}"`);
  const normExpected = normalizeGerman(expected, profile.normalize);
  const normGiven = normalizeGerman(given, profile.normalize);
  if (normGiven === normExpected) return 'correct_full';

  const distance = levenshtein(normGiven, normExpected);
  const tolerance = profile.toleranceForLength(normExpected.length);
  if (distance > 0 && distance <= tolerance) return 'typo';

  return 'wrong';
}

const RESULT_PRIORITY = ['correct_full', 'correct_no_diacritics', 'correct', 'typo', 'wrong'];

/**
 * Bewertet eine Antwort gegen mehrere akzeptierte richtige Antworten (Spec Kapitel 11.2:
 * "mehrere richtige Antworten") und gibt das beste erreichte Ergebnis zurück.
 * @param {string[]} expectedList
 * @param {string} given
 * @param {(expected: string, given: string) => string} evaluator - z. B. evaluateArabicAnswer
 */
function evaluateAgainstAny(expectedList, given, evaluator) {
  const results = expectedList.map((expected) => evaluator(expected, given));
  for (const priority of RESULT_PRIORITY) {
    if (results.includes(priority)) return priority;
  }
  return 'wrong';
}

const DIFFICULTY_MIN = 1;
const DIFFICULTY_MAX = 10;
const DEFAULT_DIFFICULTY = 5;
const INTENSIVE_REVIEW_THRESHOLD = 3;

function clampDifficulty(value) {
  return Math.max(DIFFICULTY_MIN, Math.min(DIFFICULTY_MAX, value));
}

// Spaced-Repetition-Intervalle (Spec Kapitel 12): sofort, 1, 3, 7, 14, 30 Tage. Fehlerhafte
// Inhalte werden früher wiederholt (Stufe fällt auf 0 zurück statt nur um eine Stufe zu sinken).
const REVIEW_INTERVALS_DAYS = [0, 1, 3, 7, 14, 30];

function scheduleNextReview(card, skill, isCorrect) {
  if (!card.reviewStage) card.reviewStage = {};
  if (!card.nextReview) card.nextReview = {};

  const currentStage = card.reviewStage[skill] ?? 0;
  const nextStage = isCorrect ? Math.min(REVIEW_INTERVALS_DAYS.length - 1, currentStage + 1) : 0;
  card.reviewStage[skill] = nextStage;

  const next = new Date();
  next.setDate(next.getDate() + REVIEW_INTERVALS_DAYS[nextStage]);
  card.nextReview[skill] = next.toISOString();
  return card.nextReview[skill];
}

/**
 * Passt die Schwierigkeit einer Karte für eine bestimmte Fähigkeit
 * (z. B. "arabic_to_german", "german_to_arabic", "pronunciation") an und plant die nächste
 * Wiederholung (Spaced Repetition).
 * card.difficulty ist ein Objekt {skill: number}, card.consecutiveWrong ein Objekt {skill: number}.
 */
function adjustDifficulty(card, skill, resultCategory) {
  if (!card.difficulty) card.difficulty = {};
  if (!card.consecutiveWrong) card.consecutiveWrong = {};

  const current = card.difficulty[skill] ?? DEFAULT_DIFFICULTY;
  let next = current;
  let needsIntensiveReview = false;
  const isCorrect = resultCategory === 'correct_full' || resultCategory === 'correct_no_diacritics' || resultCategory === 'correct';

  if (isCorrect) {
    next = clampDifficulty(current - 2);
    card.consecutiveWrong[skill] = 0;
  } else if (resultCategory === 'typo') {
    next = clampDifficulty(current + 1);
    card.consecutiveWrong[skill] = 0;
  } else {
    next = clampDifficulty(current + 2);
    card.consecutiveWrong[skill] = (card.consecutiveWrong[skill] ?? 0) + 1;
    if (card.consecutiveWrong[skill] >= INTENSIVE_REVIEW_THRESHOLD) {
      needsIntensiveReview = true;
    }
  }

  card.difficulty[skill] = next;
  const nextReview = scheduleNextReview(card, skill, isCorrect || resultCategory === 'typo');
  return { difficulty: next, needsIntensiveReview, nextReview };
}

function sortByDifficultyShuffled(cardIds, getDifficulty) {
  const grouped = new Map();
  for (const id of cardIds) {
    const diff = getDifficulty(id) ?? DEFAULT_DIFFICULTY;
    if (!grouped.has(diff)) grouped.set(diff, []);
    grouped.get(diff).push(id);
  }
  const orderedDifficulties = Array.from(grouped.keys()).sort((a, b) => b - a);
  const result = [];
  for (const diff of orderedDifficulties) {
    const group = grouped.get(diff);
    for (let i = group.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [group[i], group[j]] = [group[j], group[i]];
    }
    result.push(...group);
  }
  return result;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    normalizeArabic,
    normalizeGerman,
    levenshtein,
    typoToleranceForLength,
    EVALUATION_PROFILES,
    evaluateArabicWithProfile,
    evaluateArabicAnswer,
    evaluateGermanAnswer,
    evaluateAgainstAny,
    adjustDifficulty,
    scheduleNextReview,
    sortByDifficultyShuffled,
    REVIEW_INTERVALS_DAYS,
    DEFAULT_DIFFICULTY
  };
}
