// Schwierigkeits-Engine (Spec Kapitel 5) + Toleranzstufe "Anfänger" (Spec Kapitel 7).
// V1 implementiert nur die Anfänger-Toleranzstufe; Mittelstufe/Fortgeschritten folgen in einer späteren Version.

const HARAKAT_PATTERN = /[ً-ْ]/g;
const ARABIC_PUNCTUATION_PATTERN = /[؟،؛]/g;

function normalizeArabic(text) {
  if (!text) return '';
  return text
    .replace(HARAKAT_PATTERN, '')
    .replace(ARABIC_PUNCTUATION_PATTERN, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeGerman(text) {
  if (!text) return '';
  return text.replace(/\s+/g, ' ').trim().toLowerCase();
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

const TYPO_DISTANCE_THRESHOLD = 2;

/**
 * Bewertet eine arabische Antwort gegen die erwartete Antwort (inkl. Vokalzeichen).
 * Rückgabe: 'correct_full' | 'correct_no_diacritics' | 'typo' | 'wrong'
 */
function evaluateArabicAnswer(expected, given) {
  if (given === expected) return 'correct_full';

  const normalizedExpected = normalizeArabic(expected);
  const normalizedGiven = normalizeArabic(given);
  if (normalizedGiven === normalizedExpected) return 'correct_no_diacritics';

  const distance = levenshtein(normalizedGiven, normalizedExpected);
  if (distance <= TYPO_DISTANCE_THRESHOLD) return 'typo';

  return 'wrong';
}

/**
 * Bewertet eine deutsche Antwort (Definition) gegen mögliche erwartete Antworten.
 */
function evaluateGermanAnswer(expected, given) {
  const normalizedExpected = normalizeGerman(expected);
  const normalizedGiven = normalizeGerman(given);
  if (normalizedGiven === normalizedExpected) return 'correct_full';

  const distance = levenshtein(normalizedGiven, normalizedExpected);
  if (distance <= TYPO_DISTANCE_THRESHOLD) return 'typo';

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
    evaluateArabicAnswer,
    evaluateGermanAnswer,
    evaluateAgainstAny,
    adjustDifficulty,
    sortByDifficultyShuffled,
    REVIEW_INTERVALS_DAYS,
    DEFAULT_DIFFICULTY
  };
}
