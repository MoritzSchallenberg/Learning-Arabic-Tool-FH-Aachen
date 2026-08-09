// SessionEngine (Entwicklungsauftrag 4, Schritt 3; grundlegend erweitert in
// Entwicklungsauftrag 5, Abschnitte 6-12+26) — reine Ablauflogik einer Vokabel-Session, ohne
// jeden DOM-Zugriff (dadurch direkt mit node:test prüfbar).
//
// Kernänderungen gegenüber Entwicklungsauftrag 4:
// - Nicht mehr jedes Wort läuft durch jede Übungsphase. Jede "graded" Phase bekommt eine anhand
//   der empfohlenen Verteilung berechnete Wortauswahl (RECOMMENDED_RATIO), adaptiv gewichtet nach
//   bisherigen Fehlern/Hilfeeinsatz (SessionCoverageTracker.priorityScore) — dadurch bleibt eine
//   Zehn-Wörter-Session bei ca. 28 Kernaufgaben statt >50 (Abschnitt 6).
// - Geführte und selbstständige Produktion garantieren gemeinsam trotzdem: JEDES neue Wort
//   bekommt mindestens eine aktive Abrufaufgabe (Mindestabdeckung, Abschnitt 6) — über eine feste,
//   nicht-zufällige Baseline-Aufteilung (gerader/ungerader Index in der Wortliste), die auch nach
//   einem Neustart exakt gleich bleibt.
// - Aufgaben-Warteschlangen werden je Phasentyp einmal gebaut und dann UNVERÄNDERT im Snapshot
//   gespeichert (`phaseQueues`) — Wiederaufnahme mischt nicht neu, sondern stellt exakt dieselbe
//   Reihenfolge/Position/geplante Wiederholung wieder her (Abschnitt 12).
// - Falsch beantwortete Wörter dürfen mehrfach (bis max_repeats_per_word_per_phase) erneut
//   eingeplant werden statt nur einmal (Abschnitt 8).
// - Bewertung ist gewichtet statt eines einfachen Richtig/Falsch-Verhältnisses (Abschnitt 26).
// - Wiederholungswörter aus früheren Sessions (ReviewScheduler, Abschnitt 10) werden in
//   Wiedererkennen/Anwendung eingemischt, zählen aber nicht zur "neue Wörter"-Abdeckung.

const SessionEngine = (() => {
  const MAX_REPEATS_PER_WORD_PER_PHASE = 3;

  // Empfohlene Verteilung bei zehn neuen Wörtern (Abschnitt 6): 6 Wiedererkennen,
  // 5 Rekonstruieren, 5 geführt, 8 selbstständig, 4 Anwendung — als Anteil an der tatsächlichen
  // Wortanzahl, damit auch die neun/acht Wörter der Pilot-Units sinnvoll skalieren.
  const RECOMMENDED_RATIO = {
    recognition: 0.6,
    reconstruction: 0.5,
    guided_production: 0.5,
    independent_production: 0.8,
    application: 0.4
  };

  function buildWordList(sessionDef, allWords) {
    return sessionDef.new_word_ids
      .map((id) => allWords.find((w) => w.id === id))
      .filter(Boolean);
  }

  function recommendedCount(phaseType, n) {
    if (n === 0) return 0;
    return Math.max(1, Math.round(n * (RECOMMENDED_RATIO[phaseType] || 0.5)));
  }

  /** Feste (nicht-zufällige) Baseline, damit sie bei jedem Neuaufbau identisch bleibt. */
  function productionBaseline(words, phaseType) {
    return words.filter((w, i) => (phaseType === 'guided_production' ? i % 2 === 0 : i % 2 === 1));
  }

  function topUp(base, target, allWords, coverage) {
    const list = [...base];
    if (list.length >= target || allWords.length === 0) return list;
    const sorted = [...allWords].sort(
      (a, b) => SessionCoverageTracker.priorityScore(coverage, b.id) - SessionCoverageTracker.priorityScore(coverage, a.id)
    );
    let i = 0;
    while (list.length < target) {
      list.push(sorted[i % sorted.length]);
      i += 1;
    }
    return list;
  }

  function selectWordsForPhase(allWords, coverage, count, random = Math.random) {
    if (allWords.length === 0 || count <= 0) return [];
    const shuffled = SessionQueue.pickRandomOrder(allWords, random);
    const sorted = shuffled.sort(
      (a, b) => SessionCoverageTracker.priorityScore(coverage, b.id) - SessionCoverageTracker.priorityScore(coverage, a.id)
    );
    const result = [];
    for (let i = 0; i < count; i += 1) result.push(sorted[i % sorted.length]);
    return result;
  }

  /**
   * @param {object} options
   * @param {object} options.sessionDef - Session-Datensatz (siehe vocabSessions.json)
   * @param {object[]} options.words - aufgelöste NEUE Wortobjekte für sessionDef.new_word_ids
   * @param {object[]} [options.reviewWords] - fällige Wörter aus früheren Sessions (Abschnitt 10),
   *   bei Wiederaufnahme MUSS dieselbe Liste wie beim ersten Start übergeben werden
   *   (resumedState.reviewWordIds, vom Aufrufer aufgelöst)
   * @param {object} [options.resumedState] - vorher gespeicherter SessionState (siehe sessionState.js)
   */
  function create({ sessionDef, words, reviewWords, resumedState, rng }) {
    const phases = sessionDef.phases;
    const allReviewWords = reviewWords || [];
    // Injizierbare Zufallsquelle (Entwicklungsauftrag 7, Abschnitt 4.1): produktiv Math.random
    // (unverändertes Verhalten), Tests können RandomProvider.create(seed).random übergeben, um
    // Aufgabenauswahl/-mischung und Wiederholungs-Verzögerung deterministisch zu machen.
    const random = rng || Math.random;
    let phaseIndex = resumedState ? resumedState.phaseIndex : 0;
    let correctCount = resumedState ? resumedState.correctCount : 0;
    let wrongCount = resumedState ? resumedState.wrongCount : 0;
    let theoryDone = resumedState ? resumedState.theoryDone : false;
    const coverage = SessionCoverageTracker.create(
      words.map((w) => w.id).concat(allReviewWords.map((w) => w.id)),
      resumedState ? resumedState.coverage : null
    );
    // Aufgaben-Warteschlangen je Phasentyp — werden NUR beim allerersten Betreten einer Phase neu
    // gebaut, danach unverändert weiterverwendet (auch über Neustarts hinweg, Abschnitt 12).
    const phaseQueues = (resumedState && resumedState.phaseQueues) ? resumedState.phaseQueues : {};
    const phaseScores = (resumedState && resumedState.phaseScores) ? resumedState.phaseScores : {};
    const helpLevelState = HelpLevel.create(resumedState ? resumedState.helpLevel : 'C');

    function isGradedPhase(phase) {
      return phase && PhaseRegistry.get(phase.type).graded;
    }

    function currentPhase() { return phases[phaseIndex] || null; }
    function currentPhaseType() { return currentPhase() ? currentPhase().type : null; }
    function isLastPhase() { return phaseIndex >= phases.length - 1; }

    // --- Wortexposition (Abschnitt 3: "exposed" darf nicht allein durchs Rendering entstehen) ---
    // Ein Wort gilt erst als "kennengelernt", wenn es sowohl in der Lernkarte gezeigt ALS AUCH
    // mindestens einmal aktiv wiedererkannt wurde (Mini-Check ODER spätere Wiedererkennen-Phase —
    // beide schreiben über recordMiniCheckResult/recordTaskResult in recognition_attempts).
    function isWordExposed(wordId) {
      const entry = SessionCoverageTracker.entryFor(coverage, wordId);
      return entry.preview_seen && entry.recognition_attempts >= 1;
    }
    function allWordsExposed() {
      return words.every((w) => isWordExposed(w.id));
    }

    /** @returns {boolean} true nur beim allerersten Mal — Grundlage für das Tageslimit. */
    function markWordPreviewSeen(wordId) {
      return SessionCoverageTracker.markPreviewSeen(coverage, wordId);
    }
    function markWordKnownAlready(wordId) {
      SessionCoverageTracker.markKnownAlready(coverage, wordId);
    }
    function markHelpUsedForWord(wordId) {
      SessionCoverageTracker.markHelpUsed(coverage, wordId);
    }
    /** Leichte Erkennungsaufgabe während der Lernphase (Mini-Check, Abschnitt 5). */
    function recordMiniCheckResult(wordId, isCorrect) {
      SessionCoverageTracker.recordAttempt(coverage, wordId, 'recognition', isCorrect);
    }

    // --- Aufgaben-Warteschlangen je Phase (Abschnitte 6/7/10) -----------------------------------
    function buildQueueItemsForCurrentPhase() {
      const phaseType = currentPhaseType();
      const n = words.length;
      let selected;
      if (phaseType === 'guided_production' || phaseType === 'independent_production') {
        const baseline = productionBaseline(words, phaseType);
        selected = topUp(baseline, recommendedCount(phaseType, n), words, coverage);
      } else {
        selected = selectWordsForPhase(words, coverage, recommendedCount(phaseType, n), random);
      }
      let items = selected.map((w) => ({ wordId: w.id }));
      // Fällige Wiederholungswörter werden nur in Wiedererkennen/Anwendung eingemischt (Abschnitt
      // 10: "Sie werden nur in passende Übungsphasen eingemischt", keine komplette Wortvorschau).
      if (allReviewWords.length > 0 && (phaseType === 'recognition' || phaseType === 'application')) {
        const reviewSlice = phaseType === 'recognition' ? allReviewWords : allReviewWords.slice(0, Math.ceil(allReviewWords.length / 2));
        items = items.concat(reviewSlice.map((w) => ({ wordId: w.id, isReview: true })));
      }
      return items;
    }

    function hasStartedQueue() {
      return Object.prototype.hasOwnProperty.call(phaseQueues, currentPhaseType());
    }

    function startGradedQueue() {
      phaseQueues[currentPhaseType()] = SessionQueue.create(buildQueueItemsForCurrentPhase(), random);
    }

    function currentQueue() {
      return phaseQueues[currentPhaseType()] || null;
    }

    function currentTask() {
      const q = currentQueue();
      return q ? SessionQueue.current(q) : null;
    }

    function taskProgressLabel() {
      const q = currentQueue();
      if (!q) return '';
      return `Aufgabe ${Math.min(q.index + 1, q.pending.length)} / ${q.pending.length}`;
    }

    function isPhaseQueueDone() {
      const q = currentQueue();
      return !q || SessionQueue.isDone(q);
    }

    /** @returns {boolean} true, wenn für dieses Wort in dieser Phase keine Wiederholung mehr möglich ist. */
    function repeatLimitReached(wordId) {
      const q = currentQueue();
      return !!q && SessionQueue.repeatCountFor(q, wordId) >= MAX_REPEATS_PER_WORD_PER_PHASE;
    }

    function recordTaskResult(isCorrect, opts = {}) {
      const phaseType = currentPhaseType();
      const q = currentQueue();
      const task = q ? SessionQueue.current(q) : null;
      if (isCorrect) correctCount += 1; else wrongCount += 1;
      helpLevelState.registerResult(isCorrect);

      if (task && !task.isReview) {
        SessionCoverageTracker.recordAttempt(coverage, task.wordId, phaseType, isCorrect);
        if (opts.helpUsed) SessionCoverageTracker.markHelpUsed(coverage, task.wordId);
      }

      const scoreEntry = phaseScores[phaseType] || (phaseScores[phaseType] = { correct: 0, attempted: 0 });
      scoreEntry.attempted += 1;
      if (isCorrect) scoreEntry.correct += 1;

      let repeatScheduled = false;
      if (!isCorrect && task && q) {
        repeatScheduled = SessionQueue.scheduleRepeat(q, task, { maxRepeats: MAX_REPEATS_PER_WORD_PER_PHASE, random });
      }
      if (q) SessionQueue.advance(q);
      return { repeatScheduled };
    }

    function advancePhase() {
      phaseIndex += 1;
    }

    // --- Gewichtete Bewertung (Abschnitt 26) ---------------------------------------------------
    function weightedScorePercent() {
      let totalWeight = 0;
      let weightedSum = 0;
      for (const phaseType of Object.keys(PhaseRegistry.PHASES)) {
        const weight = PhaseRegistry.get(phaseType).weight;
        if (!weight) continue;
        const s = phaseScores[phaseType];
        if (!s || s.attempted === 0) continue;
        totalWeight += weight;
        weightedSum += weight * (s.correct / s.attempted);
      }
      return totalWeight === 0 ? 1 : weightedSum / totalWeight;
    }

    // Rückwärtskompatibel: einfaches Verhältnis (für Anzeige "Richtig: X / Y").
    function scorePercent() {
      const total = correctCount + wrongCount;
      return total === 0 ? 1 : correctCount / total;
    }

    function checkCompletion() {
      const rules = sessionDef.completion_rules || {};
      const scoreOk = weightedScorePercent() >= (rules.minimum_score || 0);
      const wordsOk = !rules.all_words_exposed || allWordsExposed();
      return scoreOk && wordsOk;
    }

    // --- Fortschrittsbalken (Abschnitt 23): stabil, springt bei neuen Fehlerwiederholungen NICHT
    // zurück — berechnet aus abgeschlossenen Phasen + Anteil der aktuellen Phase, wobei die
    // ANFÄNGLICH geplante Aufgabenzahl je Phase als Nenner dient (nicht die durch Repeats
    // gewachsene), damit spätere Repeats den Wert nicht sinken lassen.
    function progressPercent() {
      const gradedPhases = phases.filter((p) => PhaseRegistry.get(p.type).graded);
      if (gradedPhases.length === 0) return 100;
      const currentIdx = gradedPhases.findIndex((p) => p.type === currentPhaseType());
      let donePhases = currentIdx === -1 ? (isLastPhase() ? gradedPhases.length : 0) : currentIdx;
      let partial = 0;
      const q = currentQueue();
      if (q) {
        const plannedTotal = words.length > 0 ? Math.max(1, recommendedCount(currentPhaseType(), words.length)) : 1;
        const doneTasks = Math.min(q.index, plannedTotal);
        partial = doneTasks / plannedTotal;
      } else if (currentIdx !== -1) {
        partial = 0;
      }
      const percent = ((donePhases + Math.min(1, partial)) / gradedPhases.length) * 100;
      return Math.max(0, Math.min(100, Math.round(percent)));
    }

    function snapshot() {
      return {
        phaseIndex,
        theoryDone,
        coverage,
        phaseQueues,
        phaseScores,
        helpLevel: helpLevelState.currentLevel(),
        correctCount,
        wrongCount,
        reviewWordIds: allReviewWords.map((w) => w.id)
      };
    }

    return {
      phases,
      currentPhase,
      currentPhaseType,
      isLastPhase,
      get phaseIndex() { return phaseIndex; },
      get coverage() { return coverage; },
      isWordExposed,
      allWordsExposed,
      markWordPreviewSeen,
      markWordKnownAlready,
      markHelpUsedForWord,
      recordMiniCheckResult,
      startGradedQueue,
      hasStartedQueue,
      currentTask,
      taskProgressLabel,
      recordTaskResult,
      isPhaseQueueDone,
      repeatLimitReached,
      advancePhase,
      snapshot,
      scorePercent,
      weightedScorePercent,
      checkCompletion,
      progressPercent,
      helpLevelState,
      reviewWords: allReviewWords,
      get theoryDone() { return theoryDone; },
      set theoryDone(v) { theoryDone = v; },
      get correctCount() { return correctCount; },
      get wrongCount() { return wrongCount; }
    };
  }

  return {
    create,
    buildWordList,
    recommendedCount,
    productionBaseline,
    MAX_REPEATS_PER_WORD_PER_PHASE,
    RECOMMENDED_RATIO
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SessionEngine;
}
