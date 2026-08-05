// SessionEngine (Entwicklungsauftrag 4, Schritt 3/13.1) — reine Ablauflogik einer
// Vokabel-Session, ohne jeden DOM-Zugriff (dadurch direkt mit node:test prüfbar). Verwaltet
// Phasenreihenfolge, Aufgaben-Warteschlange je "graded" Phase (siehe phaseRegistry.js/
// sessionQueue.js), Wortexposition, Hilfestufe (helpLevel.js) und die
// Abschlussregel-Auswertung (completion_rules aus dem Session-Datenschema).

const SessionEngine = (() => {
  function buildWordList(sessionDef, allWords) {
    return sessionDef.new_word_ids
      .map((id) => allWords.find((w) => w.id === id))
      .filter(Boolean);
  }

  /**
   * @param {object} options
   * @param {object} options.sessionDef - Session-Datensatz (siehe vocabSessions.json)
   * @param {object[]} options.words - aufgelöste Wortobjekte für sessionDef.new_word_ids
   * @param {object} [options.resumedState] - vorher gespeicherter SessionState (siehe sessionState.js)
   */
  function create({ sessionDef, words, resumedState }) {
    const phases = sessionDef.phases;
    let phaseIndex = resumedState ? resumedState.phaseIndex : 0;
    const exposedWordIds = new Set(resumedState ? resumedState.exposedWordIds : []);
    let correctCount = resumedState ? resumedState.correctCount : 0;
    let wrongCount = resumedState ? resumedState.wrongCount : 0;
    let theoryDone = resumedState ? resumedState.theoryDone : false;
    const helpLevelState = HelpLevel.create(resumedState ? resumedState.helpLevel : 'C');
    let queueState = null;

    if (resumedState && resumedState.taskIndex > 0 && isGradedPhase(phases[phaseIndex])) {
      // Aufgaben-Warteschlange wird beim Wiederaufnehmen neu aufgebaut (Reihenfolge ist ohnehin
      // zufällig) — nur die Position (bereits erledigte Anzahl) wird übernommen, damit "Aufgabe
      // X von Y" nach der Wiederaufnahme weiterhin sinnvolle Werte zeigt.
      startGradedQueue();
      queueState.index = Math.min(resumedState.taskIndex, queueState.pending.length);
    }

    function isGradedPhase(phase) {
      return phase && PhaseRegistry.get(phase.type).graded;
    }

    function currentPhase() { return phases[phaseIndex] || null; }
    function currentPhaseType() { return currentPhase() ? currentPhase().type : null; }
    function isLastPhase() { return phaseIndex >= phases.length - 1; }

    function markWordExposed(wordId) { exposedWordIds.add(wordId); }
    function isWordExposed(wordId) { return exposedWordIds.has(wordId); }
    function allWordsExposed() { return words.every((w) => exposedWordIds.has(w.id)); }

    function startGradedQueue(extraItems) {
      const items = words.map((w) => ({ wordId: w.id }));
      queueState = SessionQueue.create(items.concat(extraItems || []));
    }

    function currentTask() {
      return queueState ? SessionQueue.current(queueState) : null;
    }

    // Getrennt von currentTask()/isPhaseQueueDone() nötig: currentTask() liefert in BEIDEN
    // Fällen null — wenn die Warteschlange dieser Phase noch nie gestartet wurde UND wenn sie
    // bereits fertig ist (Index am Ende). renderGradedPhase() muss diese zwei Fälle aber
    // unterscheiden können (neu starten vs. Phase abschließen), sonst beginnt die letzte Aufgabe
    // einer "graded" Phase die komplette Phase von vorn, statt weiterzuschalten.
    function hasStartedQueue() {
      return queueState !== null;
    }

    function taskProgressLabel() {
      if (!queueState) return '';
      return `Aufgabe ${Math.min(queueState.index + 1, queueState.total)} / ${queueState.total}`;
    }

    function recordTaskResult(isCorrect) {
      const task = currentTask();
      if (isCorrect) correctCount += 1; else wrongCount += 1;
      helpLevelState.registerResult(isCorrect);
      if (!isCorrect && task && !task.isRepeat && queueState) {
        SessionQueue.scheduleRepeat(queueState, task);
      }
      if (queueState) SessionQueue.advance(queueState);
    }

    function isPhaseQueueDone() {
      return !queueState || SessionQueue.isDone(queueState);
    }

    function advancePhase() {
      phaseIndex += 1;
      queueState = null;
    }

    function scorePercent() {
      const total = correctCount + wrongCount;
      return total === 0 ? 1 : correctCount / total;
    }

    function checkCompletion() {
      const rules = sessionDef.completion_rules || {};
      const scoreOk = scorePercent() >= (rules.minimum_score || 0);
      const wordsOk = !rules.all_words_exposed || allWordsExposed();
      return scoreOk && wordsOk;
    }

    function snapshot() {
      return {
        phaseIndex,
        taskIndex: queueState ? queueState.index : 0,
        exposedWordIds: Array.from(exposedWordIds),
        theoryDone,
        correctCount,
        wrongCount,
        helpLevel: helpLevelState.currentLevel()
      };
    }

    return {
      phases,
      currentPhase,
      currentPhaseType,
      isLastPhase,
      get phaseIndex() { return phaseIndex; },
      markWordExposed,
      isWordExposed,
      allWordsExposed,
      startGradedQueue,
      hasStartedQueue,
      currentTask,
      taskProgressLabel,
      recordTaskResult,
      isPhaseQueueDone,
      advancePhase,
      snapshot,
      scorePercent,
      checkCompletion,
      helpLevelState,
      get theoryDone() { return theoryDone; },
      set theoryDone(v) { theoryDone = v; },
      get correctCount() { return correctCount; },
      get wrongCount() { return wrongCount; }
    };
  }

  return { create, buildWordList };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SessionEngine;
}
