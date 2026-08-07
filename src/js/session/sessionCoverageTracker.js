// SessionCoverageTracker (Entwicklungsauftrag 5, Abschnitt 7) — hält pro Wort fest, wie oft und
// wie erfolgreich es in dieser Session bereits geübt wurde. Grundlage für:
// - die "Mindestabdeckung" (jedes Wort erhält mindestens eine aktive Abrufaufgabe, Abschnitt 6),
// - adaptive Aufgabenauswahl (Wörter mit Fehlern/Hilfe bekommen bevorzugt weitere Aufgaben,
//   sichere Wörter bekommen weniger, Abschnitt 7),
// - das erweiterte Abschlussbild (Abschnitt 25: "sehr gut" / "noch üben").
//
// Reiner Datenzustand, kein DOM-Zugriff — direkt mit node:test prüfbar.

const SessionCoverageTracker = (() => {
  const ATTEMPT_FIELD_BY_PHASE = {
    recognition: 'recognition_attempts',
    reconstruction: 'reconstruction_attempts',
    guided_production: 'guided_typing_attempts',
    independent_production: 'independent_attempts',
    application: 'application_attempts'
  };

  function createEmpty() {
    return {
      preview_seen: false,
      recognition_attempts: 0,
      recognition_correct: 0,
      reconstruction_attempts: 0,
      guided_typing_attempts: 0,
      independent_attempts: 0,
      application_attempts: 0,
      errors: 0,
      help_used: false,
      known_already: false
    };
  }

  /** @param {string[]} wordIds @param {object} [resumed] - vorher gespeicherte Coverage-Map */
  function create(wordIds, resumed) {
    const byWord = {};
    for (const id of wordIds) {
      byWord[id] = { ...createEmpty(), ...(resumed && resumed[id] ? resumed[id] : {}) };
    }
    return byWord;
  }

  function entryFor(coverage, wordId) {
    if (!coverage[wordId]) coverage[wordId] = createEmpty();
    return coverage[wordId];
  }

  /** @returns {boolean} true nur beim ERSTEN Aufruf für dieses Wort (für das Tageslimit wichtig). */
  function markPreviewSeen(coverage, wordId) {
    const entry = entryFor(coverage, wordId);
    const wasAlreadySeen = entry.preview_seen;
    entry.preview_seen = true;
    return !wasAlreadySeen;
  }

  function markKnownAlready(coverage, wordId) {
    entryFor(coverage, wordId).known_already = true;
  }

  function markHelpUsed(coverage, wordId) {
    entryFor(coverage, wordId).help_used = true;
  }

  function recordAttempt(coverage, wordId, phaseType, isCorrect) {
    const entry = entryFor(coverage, wordId);
    const field = ATTEMPT_FIELD_BY_PHASE[phaseType];
    if (field) entry[field] += 1;
    if (phaseType === 'recognition' && isCorrect) entry.recognition_correct += 1;
    if (!isCorrect) entry.errors += 1;
    return entry;
  }

  function totalAttempts(entry) {
    return entry.recognition_attempts + entry.reconstruction_attempts + entry.guided_typing_attempts
      + entry.independent_attempts + entry.application_attempts;
  }

  function hasActiveRetrieval(entry) {
    return entry.guided_typing_attempts > 0 || entry.independent_attempts > 0;
  }

  /** Höher = braucht mehr zusätzliche Übung (Fehler/Hilfe zuerst, "kenne ich schon" zuletzt). */
  function priorityScore(coverage, wordId) {
    const entry = entryFor(coverage, wordId);
    let score = entry.errors * 10 + (entry.help_used ? 5 : 0) - entry.recognition_correct;
    if (entry.known_already) score -= 8;
    return score;
  }

  /** Für das erweiterte Abschlussbild (Abschnitt 25): "sicher erkannt" vs. "noch üben". */
  function isSecurelyKnown(coverage, wordId) {
    const entry = entryFor(coverage, wordId);
    return entry.errors === 0 && hasActiveRetrieval(entry);
  }

  return {
    createEmpty, create, entryFor, markPreviewSeen, markKnownAlready, markHelpUsed, recordAttempt,
    totalAttempts, hasActiveRetrieval, priorityScore, isSecurelyKnown, ATTEMPT_FIELD_BY_PHASE
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SessionCoverageTracker;
}
