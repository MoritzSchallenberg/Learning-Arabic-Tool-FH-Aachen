// SessionCoverageTracker (Entwicklungsauftrag 5, Abschnitt 7; Felder erweitert in
// Entwicklungsauftrag 16, Abschnitt 11) — hält pro Wort fest, wie oft und wie erfolgreich es in
// dieser Session bereits geübt wurde. Grundlage für:
// - die "Mindestabdeckung" (jedes Wort erhält mindestens eine aktive Abrufaufgabe je Stufe 6/7/
//   8-9, Abschnitt 6.2/7.1/8.3),
// - adaptive Aufgabenauswahl (Wörter mit Fehlern/Hilfe bekommen bevorzugt weitere Aufgaben,
//   sichere Wörter bekommen weniger, Abschnitt 7),
// - das erweiterte Abschlussbild und die Sessionabschluss-Bedingungen (Abschnitt 10.2/10.4).
//
// Reiner Datenzustand, kein DOM-Zugriff — direkt mit node:test prüfbar.

const SessionCoverageTracker = (() => {
  // Entwicklungsauftrag 16, Abschnitt 11: die drei neuen Stufen 6/7/8+9 haben jeweils ein
  // eigenes Attempt-Feld. guided_writing_attempts deckt BEIDE Unteraufgaben von Stufe 8 ab
  // (order_pieces "Wort zusammensetzen" UND guided_typing "Wort mit Hilfe eingeben", Abschnitt
  // 8.4) — genau wie im Auftrag selbst als EIN Feld vorgeschlagen.
  const ATTEMPT_FIELD_BY_PHASE = {
    recognition: 'recognition_attempts',
    matching: 'matching_attempts',
    guided_writing: 'guided_writing_attempts',
    independent_writing: 'independent_writing_attempts'
  };

  // Alte Feldnamen aus Entwicklungsauftrag 5-15 (vor der Stufen-6-10-Neuordnung). Bleiben Teil
  // der Grundform, damit ein bereits gespeichertes altes Coverage-Objekt beim Zusammenführen
  // (create()) nicht durch fehlende Felder auffällt -- die eigentliche Migration auf die neuen
  // Felder passiert in migrateLegacyEntry().
  const LEGACY_FIELDS = ['reconstruction_attempts', 'guided_typing_attempts', 'independent_attempts', 'application_attempts'];

  // Entwicklungsauftrag 17, Abschnitt 17: Fehlertypen je Wort -- Grundlage für gezieltere
  // Wiederholungen (Abschnitt 17.1). Additiv zum bestehenden Schema, keine sessionFlowVersion-
  // Erhöhung nötig (Abschnitt 24: "ausschließlich versioniert und migrationssicher" -- ein rein
  // additives, mit sicherem Default rückwärtskompatibles Feld erfüllt das bereits, siehe
  // recordErrorType() unten für den Migrationsfall eines alten, gespeicherten Eintrags ohne
  // dieses Feld).
  function createEmptyErrorTypes() {
    return { spelling: 0, diacritics: 0, meaning: 0, confusion: 0, matching: 0, empty: 0 };
  }

  function createEmpty() {
    return {
      preview_seen: false,
      recognition_attempts: 0,
      recognition_correct: 0,
      matching_attempts: 0,
      matching_correct: 0,
      guided_writing_attempts: 0,
      independent_writing_attempts: 0,
      errors: 0,
      help_used: false,
      known_already: false,
      errorTypes: createEmptyErrorTypes()
    };
  }

  /**
   * Entwicklungsauftrag 16, Abschnitt 17: "Bestehende historische Felder müssen migriert oder
   * kompatibel weitergelesen werden." Ein Eintrag aus einer VOR diesem Auftrag gespeicherten
   * Session enthält reconstruction_attempts/guided_typing_attempts/independent_attempts/
   * application_attempts statt der neuen Felder — hier einmalig auf die neuen Felder übertragen
   * (Tabelle Abschnitt 3: reconstruction+guided_production -> guided_writing,
   * independent_production -> independent_writing, application -> matching, weil
   * Application-Prompts jetzt eine Zuordnungsvariante sind, Abschnitt 7.5). Idempotent: wird ein
   * bereits migrierter Eintrag (neue Felder schon > 0) erneut übergeben, verändert sich nichts.
   */
  function migrateLegacyEntry(entry) {
    if (!entry) return entry;
    const hasLegacyData = LEGACY_FIELDS.some((f) => (entry[f] || 0) > 0);
    if (!hasLegacyData) return entry;
    const migrated = { ...entry };
    const legacyGuidedWriting = (entry.reconstruction_attempts || 0) + (entry.guided_typing_attempts || 0);
    if (legacyGuidedWriting > 0 && !migrated.guided_writing_attempts) {
      migrated.guided_writing_attempts = legacyGuidedWriting;
    }
    if ((entry.independent_attempts || 0) > 0 && !migrated.independent_writing_attempts) {
      migrated.independent_writing_attempts = entry.independent_attempts;
    }
    if ((entry.application_attempts || 0) > 0 && !migrated.matching_attempts) {
      migrated.matching_attempts = entry.application_attempts;
    }
    return migrated;
  }

  /** @param {string[]} wordIds @param {object} [resumed] - vorher gespeicherte Coverage-Map */
  function create(wordIds, resumed) {
    const byWord = {};
    for (const id of wordIds) {
      const resumedEntry = resumed && resumed[id] ? migrateLegacyEntry(resumed[id]) : null;
      byWord[id] = { ...createEmpty(), ...(resumedEntry || {}) };
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
    if (phaseType === 'matching' && isCorrect) entry.matching_correct += 1;
    if (!isCorrect) entry.errors += 1;
    return entry;
  }

  /**
   * Entwicklungsauftrag 17, Abschnitt 17 — verzeichnet den (aus dem Feedbackmodell bereits
   * feststehenden) Fehlertyp eines Wortes. Migrationssicher: ein VOR diesem Auftrag gespeicherter
   * Eintrag hat noch kein errorTypes-Feld -- wird hier bei Bedarf einmalig ergänzt, statt
   * abzustürzen oder den Zähler stillschweigend zu verwerfen.
   * @param {string|null} errorType - einer von spelling/diacritics/meaning/confusion/matching/empty, oder null (kein Fehler)
   */
  function recordErrorType(coverage, wordId, errorType) {
    if (!errorType) return;
    const entry = entryFor(coverage, wordId);
    if (!entry.errorTypes) entry.errorTypes = createEmptyErrorTypes();
    if (Object.prototype.hasOwnProperty.call(entry.errorTypes, errorType)) {
      entry.errorTypes[errorType] += 1;
    }
  }

  /** Höchster Fehlertyp eines Wortes (für die phasenbewusste Priorisierung), oder null. */
  function dominantErrorType(coverage, wordId) {
    const entry = entryFor(coverage, wordId);
    if (!entry.errorTypes) return null;
    let best = null;
    let bestCount = 0;
    for (const type of Object.keys(entry.errorTypes)) {
      const count = entry.errorTypes[type] || 0;
      if (count > bestCount) { best = type; bestCount = count; }
    }
    return best;
  }

  // Abschnitt 17.1: welche Fehlertypen bevorzugen welche spätere(n) Übungsphase(n).
  const ERROR_TYPE_PHASE_BOOST = {
    meaning: ['recognition', 'matching'],
    confusion: ['matching'],
    spelling: ['guided_writing', 'independent_writing'],
    diacritics: ['guided_writing', 'independent_writing']
  };
  const ERROR_TYPE_BOOST_WEIGHT = 4;

  /** priorityScore() zzgl. eines Aufschlags für phasenrelevante Fehlertypen (Abschnitt 17.1) --
   * additiv, deterministisch, ändert das bestehende Wiederholungslimit NICHT (Abschnitt 17.2). */
  function priorityScoreForPhase(coverage, wordId, phaseType) {
    const entry = entryFor(coverage, wordId);
    let score = priorityScore(coverage, wordId);
    if (entry.errorTypes) {
      for (const type of Object.keys(ERROR_TYPE_PHASE_BOOST)) {
        if (ERROR_TYPE_PHASE_BOOST[type].includes(phaseType)) {
          score += (entry.errorTypes[type] || 0) * ERROR_TYPE_BOOST_WEIGHT;
        }
      }
    }
    return score;
  }

  function totalAttempts(entry) {
    return entry.recognition_attempts + entry.matching_attempts + entry.guided_writing_attempts
      + entry.independent_writing_attempts;
  }

  function hasActiveRetrieval(entry) {
    return entry.guided_writing_attempts > 0 || entry.independent_writing_attempts > 0;
  }

  /** Höher = braucht mehr zusätzliche Übung (Fehler/Hilfe zuerst, "kenne ich schon" zuletzt). */
  function priorityScore(coverage, wordId) {
    const entry = entryFor(coverage, wordId);
    let score = entry.errors * 10 + (entry.help_used ? 5 : 0) - entry.recognition_correct;
    if (entry.known_already) score -= 8;
    return score;
  }

  /** Für das erweiterte Abschlussbild (Abschnitt 10.1): "sicher erkannt" vs. "noch üben". */
  function isSecurelyKnown(coverage, wordId) {
    const entry = entryFor(coverage, wordId);
    return entry.errors === 0 && hasActiveRetrieval(entry);
  }

  // --- Entwicklungsauftrag 16, Abschnitt 10.4: Sessionabschluss-Bedingungen -------------------
  function isRecognized(coverage, wordId) {
    return entryFor(coverage, wordId).recognition_attempts >= 1;
  }
  function isMatched(coverage, wordId) {
    return entryFor(coverage, wordId).matching_attempts >= 1;
  }
  function isWritten(coverage, wordId) {
    const entry = entryFor(coverage, wordId);
    return entry.guided_writing_attempts >= 1 || entry.independent_writing_attempts >= 1;
  }

  return {
    createEmpty, createEmptyErrorTypes, create, entryFor, markPreviewSeen, markKnownAlready, markHelpUsed, recordAttempt,
    totalAttempts, hasActiveRetrieval, priorityScore, isSecurelyKnown, ATTEMPT_FIELD_BY_PHASE,
    migrateLegacyEntry, isRecognized, isMatched, isWritten,
    recordErrorType, dominantErrorType, priorityScoreForPhase, ERROR_TYPE_PHASE_BOOST
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SessionCoverageTracker;
}
