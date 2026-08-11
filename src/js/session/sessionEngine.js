// SessionEngine (Entwicklungsauftrag 4, Schritt 3; grundlegend erweitert in Entwicklungsauftrag
// 5, Abschnitte 6-12+26; auf das endgültige Zehn-Stufen-Modell umgestellt in Entwicklungsauftrag
// 16) — reine Ablauflogik einer Vokabel-Session, ohne jeden DOM-Zugriff (dadurch direkt mit
// node:test prüfbar).
//
// Entwicklungsauftrag 16, Kernänderungen:
// - Vier gradierte Phasen statt vorher fünf: recognition (Stufe 6), matching (Stufe 7),
//   guided_writing (Stufe 8, zwei Unteraufgaben order_pieces+guided_typing), independent_writing
//   (Stufe 9). 'reconstruction'/'guided_production'/'independent_production'/'application'
//   existieren als sichtbare Phasentypen nicht mehr.
// - recognition UND matching decken jetzt ALLE neuen Wörter ab (Abschnitt 6.2/7.1), nicht mehr
//   nur ~60%, weil die früheren Wortlern-Mini-Checks in Entwicklungsauftrag 15 entfernt wurden.
// - matching arbeitet mit GRUPPEN-Aufgaben (mehrere Wörter pro Aufgabe, ctx.groupWordIds) statt
//   Einzelwort-Aufgaben -- eigene Bewertungsfunktion recordGroupTaskResult().
// - guided_writing baut ihre Warteschlange bewusst UNGEMISCHT aus zwei bereits intern
//   vorgemischten Blöcken (Teil 1 "Wort zusammensetzen", Teil 2 "Wort mit Hilfe eingeben",
//   Abschnitt 8.4) -- SessionQueue.create(..., {shuffle:false}).
// - jede Aufgabe trägt jetzt ihren eigenen `exerciseType` (statt eines festen 1:1
//   Phase->Übungstyp), damit recognition fünf Typen mischen und independent_writing eine
//   Diktat-Variante einstreuen kann (Abschnitt 6.1/9.3).
// - checkCompletion() prüft zusätzlich die Wortabdeckung je Stufe (Abschnitt 10.4): erkannt,
//   zugeordnet, geschrieben (Stufe 8 ODER 9 genügt).

const SessionEngine = (() => {
  const MAX_REPEATS_PER_WORD_PER_PHASE = 3;
  const MATCHING_GROUP_TARGET_SIZE = 5; // Abschnitt 7.1: "vier oder fünf Paare gleichzeitig"

  // Empfohlene Verteilung bei zehn neuen Wörtern (Abschnitt 12): 10 Wiedererkennen (ALLE, nicht
  // mehr ~60%), 10 Zuordnen (ALLE, über 2-3 Gruppen), ~5 Schreiben mit Hilfe (schwierige Wörter
  // priorisiert), ~8 Freies Schreiben — als Anteil an der tatsächlichen Wortanzahl, damit auch
  // kleinere Sessions sinnvoll skalieren. matching wird über recommendedCount NUR für die
  // Gruppengrößen-Berechnung mitgeführt, tatsächlich immer 100% (siehe buildQueueItemsForCurrentPhase).
  const RECOMMENDED_RATIO = {
    recognition: 1.0,
    matching: 1.0,
    guided_writing: 0.5,
    independent_writing: 0.8
  };

  // --- Entwicklungsauftrag 16, Abschnitt 17: Migration alter Sessionstände -------------------
  // Ein vor diesem Auftrag gespeichertes Snapshot hat kein sessionFlowVersion-Feld und ein
  // phaseIndex, das sich auf das ALTE, acht Einträge lange Phasenmodell bezieht (überall
  // identisch, siehe die frühere PHASES-Konstante in scripts/build-kurs1-batch.js). Da
  // vocabSessions.json inzwischen das NEUE, sieben Einträge lange Modell enthält, würde
  // dasselbe phaseIndex sonst eine KOMPLETT ANDERE Phase treffen (z. B. altes phaseIndex 3 =
  // "reconstruction", aber im neuen Array bereits "matching") -- deshalb hier explizit anhand
  // des ALTEN, fest bekannten Phasentyps ummappen, nicht anhand der reinen Zahl.
  const CURRENT_SESSION_FLOW_VERSION = 2;
  const LEGACY_PHASE_TYPES_BY_INDEX = [
    'theory', 'word_preview', 'recognition', 'reconstruction',
    'guided_production', 'independent_production', 'application', 'summary'
  ];
  const NEW_PHASE_INDEX_BY_TYPE = {
    theory: 0, word_preview: 1, recognition: 2, matching: 3, guided_writing: 4, independent_writing: 5, summary: 6
  };

  /**
   * @param {object|null} raw - roher, persistierter SessionState (siehe sessionState.js)
   * @returns {object|null} entweder `raw` unverändert (bereits aktuell / nicht vorhanden), oder
   *   eine migrierte Kopie mit sessionFlowVersion:2 und auf das neue Phasenmodell umgerechnetem
   *   phaseIndex/phaseQueues/phaseScores.
   */
  function migrateResumedState(raw) {
    if (!raw) return raw;
    if (raw.sessionFlowVersion === CURRENT_SESSION_FLOW_VERSION) return raw;

    const oldType = LEGACY_PHASE_TYPES_BY_INDEX[raw.phaseIndex];
    const migrated = { ...raw, sessionFlowVersion: CURRENT_SESSION_FLOW_VERSION };

    // Vor Stufe 6 (theory/word_preview) oder bereits am Ende (summary/unbekannt) -- phaseIndex
    // trifft unverändert dieselbe Bedeutung im neuen Array (Index 0/1 sind identisch geblieben).
    if (oldType === 'theory' || oldType === 'word_preview' || oldType === undefined) {
      return migrated;
    }
    if (oldType === 'summary') {
      migrated.phaseIndex = NEW_PHASE_INDEX_BY_TYPE.summary;
      return migrated;
    }
    if (oldType === 'recognition') {
      migrated.phaseIndex = NEW_PHASE_INDEX_BY_TYPE.recognition;
      return migrated;
    }
    // reconstruction/guided_production -> Stufe 8 "guided_writing" (Abschnitt 17, Tabelle) --
    // die noch offene alte Warteschlange wird unter dem neuen Phasennamen weitergeführt und ihre
    // Aufgaben bekommen nachträglich den passenden Unteraufgaben-Teil zugewiesen, damit die neue
    // "Teil 1/Teil 2"-Anzeige (Abschnitt 8.4/14) korrekt beschriftet.
    if (oldType === 'reconstruction' || oldType === 'guided_production') {
      migrated.phaseIndex = NEW_PHASE_INDEX_BY_TYPE.guided_writing;
      const part = oldType === 'reconstruction' ? 'order_pieces' : 'guided_typing';
      const exerciseType = part;
      const oldQueue = migrated.phaseQueues && migrated.phaseQueues[oldType];
      if (oldQueue && !migrated.phaseQueues.guided_writing) {
        const retaggedQueue = {
          ...oldQueue,
          pending: oldQueue.pending.map((item) => ({ ...item, part, exerciseType }))
        };
        migrated.phaseQueues = { ...migrated.phaseQueues, guided_writing: retaggedQueue };
      }
      if (migrated.phaseScores && migrated.phaseScores[oldType] && !migrated.phaseScores.guided_writing) {
        migrated.phaseScores = { ...migrated.phaseScores, guided_writing: migrated.phaseScores[oldType] };
      }
      return migrated;
    }
    if (oldType === 'independent_production') {
      migrated.phaseIndex = NEW_PHASE_INDEX_BY_TYPE.independent_writing;
      const oldQueue = migrated.phaseQueues && migrated.phaseQueues.independent_production;
      if (oldQueue && !migrated.phaseQueues.independent_writing) {
        const retaggedQueue = {
          ...oldQueue,
          pending: oldQueue.pending.map((item) => ({ ...item, exerciseType: 'independent_typing' }))
        };
        migrated.phaseQueues = { ...migrated.phaseQueues, independent_writing: retaggedQueue };
      }
      if (migrated.phaseScores && migrated.phaseScores.independent_production && !migrated.phaseScores.independent_writing) {
        migrated.phaseScores = { ...migrated.phaseScores, independent_writing: migrated.phaseScores.independent_production };
      }
      return migrated;
    }
    // application (Abschnitt 17, Sonderfall): lag im alten Ablauf NACH dem freien Schreiben --
    // der Nutzer darf dadurch nicht rückwärts auf Stufe 7 (Zuordnen) gesetzt werden. Die noch
    // offene alte Anwendungs-Teilaufgabe wird nicht als eigene Kompatibilitätsstufe
    // fortgeführt, sondern die Session gilt als bereit für die Zusammenfassung -- keine bereits
    // abgeschlossene Schreibstufe wird dadurch wiederholt, kein Rücksprung entsteht.
    migrated.phaseIndex = NEW_PHASE_INDEX_BY_TYPE.summary;
    return migrated;
  }

  function buildWordList(sessionDef, allWords) {
    return sessionDef.new_word_ids
      .map((id) => allWords.find((w) => w.id === id))
      .filter(Boolean);
  }

  function recommendedCount(phaseType, n) {
    if (n === 0) return 0;
    return Math.max(1, Math.round(n * (RECOMMENDED_RATIO[phaseType] || 0.5)));
  }

  /** Feste (nicht-zufällige) Baseline, damit sie bei jedem Neuaufbau identisch bleibt -- die
   * Vereinigung beider Zweige deckt IMMER alle Wörter ab (Abschnitt 8.3: "Stufe 8 und Stufe 9
   * müssen gemeinsam garantieren, dass jedes neue Wort mindestens einmal aktiv geschrieben wird"). */
  function productionBaseline(words, phaseType) {
    return words.filter((w, i) => (phaseType === 'guided_writing' ? i % 2 === 0 : i % 2 === 1));
  }

  // Entwicklungsauftrag 17, Abschnitt 17.1: bei bekanntem Zielphasentyp bevorzugt
  // priorityScoreForPhase() (berücksichtigt zusätzlich passende Fehlertypen, z. B. Schreibfehler
  // bevorzugen eine spätere Schreibaufgabe) -- ohne phaseType (z. B. Rückwärtskompatibilität)
  // bleibt es exakt die bisherige, phasenunabhängige priorityScore().
  function priorityScoreFor(coverage, wordId, phaseType) {
    return phaseType
      ? SessionCoverageTracker.priorityScoreForPhase(coverage, wordId, phaseType)
      : SessionCoverageTracker.priorityScore(coverage, wordId);
  }

  function topUp(base, target, allWords, coverage, phaseType) {
    const list = [...base];
    if (list.length >= target || allWords.length === 0) return list;
    const sorted = [...allWords].sort(
      (a, b) => priorityScoreFor(coverage, b.id, phaseType) - priorityScoreFor(coverage, a.id, phaseType)
    );
    let i = 0;
    while (list.length < target) {
      list.push(sorted[i % sorted.length]);
      i += 1;
    }
    return list;
  }

  function selectWordsForPhase(allWords, coverage, count, random = Math.random, phaseType) {
    if (allWords.length === 0 || count <= 0) return [];
    const shuffled = SessionQueue.pickRandomOrder(allWords, random);
    const sorted = shuffled.sort(
      (a, b) => priorityScoreFor(coverage, b.id, phaseType) - priorityScoreFor(coverage, a.id, phaseType)
    );
    const result = [];
    for (let i = 0; i < count; i += 1) result.push(sorted[i % sorted.length]);
    return result;
  }

  /** Entwicklungsauftrag 16, Abschnitt 7.1: teilt `words` in ausgeglichene Gruppen von je
   * ungefähr `targetSize` Wörtern (typisch vier oder fünf) statt einer festen Blockgröße mit
   * evtl. sehr kleinem Restblock. */
  function buildMatchingGroups(words, targetSize = MATCHING_GROUP_TARGET_SIZE) {
    const n = words.length;
    if (n === 0) return [];
    const numGroups = Math.max(1, Math.round(n / targetSize));
    const base = Math.floor(n / numGroups);
    const remainder = n % numGroups;
    const groups = [];
    let idx = 0;
    for (let g = 0; g < numGroups; g += 1) {
      const size = base + (g < remainder ? 1 : 0);
      groups.push(words.slice(idx, idx + size));
      idx += size;
    }
    return groups;
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
    // gebaut, danach unverändert weiterverwendet (auch über Neustarts hinweg, Abschnitt 12/16).
    const phaseQueues = (resumedState && resumedState.phaseQueues) ? resumedState.phaseQueues : {};
    const phaseScores = (resumedState && resumedState.phaseScores) ? resumedState.phaseScores : {};
    const helpLevelState = HelpLevel.create(resumedState ? resumedState.helpLevel : 'C');

    function currentPhase() { return phases[phaseIndex] || null; }
    function currentPhaseType() { return currentPhase() ? currentPhase().type : null; }
    function isLastPhase() { return phaseIndex >= phases.length - 1; }

    // --- Wortexposition (Abschnitt 3: "exposed" darf nicht allein durchs Rendering entstehen) ---
    // Ein Wort gilt erst als "kennengelernt", wenn es sowohl in der Lernkarte gezeigt ALS AUCH
    // mindestens einmal aktiv wiedererkannt wurde (Stufe 6 schreibt über recordTaskResult in
    // recognition_attempts).
    function isWordExposed(wordId) {
      const entry = SessionCoverageTracker.entryFor(coverage, wordId);
      return entry.preview_seen && entry.recognition_attempts >= 1;
    }
    function allWordsExposed() {
      return words.every((w) => isWordExposed(w.id));
    }

    // --- Sessionabschluss-Bedingungen (Entwicklungsauftrag 16, Abschnitt 10.4) -------------------
    function allWordsRecognized() {
      return words.every((w) => SessionCoverageTracker.isRecognized(coverage, w.id));
    }
    function allWordsMatched() {
      return words.every((w) => SessionCoverageTracker.isMatched(coverage, w.id));
    }
    function allWordsWritten() {
      return words.every((w) => SessionCoverageTracker.isWritten(coverage, w.id));
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

    // --- Stufe 8 "Schreiben mit Hilfe": zwei feste, je intern vorgemischte Blöcke ---------------
    // (Abschnitt 8.4: "Teil 1: Wort zusammensetzen" -> "Teil 2: Wort mit Hilfe eingeben", nicht
    // miteinander vermischt). Die "geschrieben"-Abdeckungsgarantie (Abschnitt 8.3) hängt
    // ausschließlich am guided_typing-Teil (Teil 2) + independent_writing — order_pieces
    // (Teil 1) ist reines Zusammensetzen vorgegebener Teile, kein aktives Schreiben.
    function buildGuidedWritingItems() {
      const n = words.length;
      const typingBaseline = productionBaseline(words, 'guided_writing');
      const typingWords = topUp(typingBaseline, recommendedCount('guided_writing', n), words, coverage, 'guided_writing');
      const orderPiecesWords = typingWords.filter((w, i) => i % 2 === 0);
      const part1 = SessionQueue.pickRandomOrder(orderPiecesWords, random)
        .map((w) => ({ wordId: w.id, part: 'order_pieces', exerciseType: 'order_pieces' }));
      const part2 = SessionQueue.pickRandomOrder(typingWords, random)
        .map((w) => ({ wordId: w.id, part: 'guided_typing', exerciseType: 'guided_typing' }));
      return part1.concat(part2);
    }

    // --- Stufe 9 "Freies Schreiben": Baseline+topUp wie bisher, plus Audiodiktat-Variante -------
    // (Abschnitt 9.3) für einen Teil der Aufgaben, deterministisch anhand der (einmalig
    // gemischten, danach unveränderten) Position in der Warteschlange.
    function buildIndependentWritingItems() {
      const n = words.length;
      const baseline = productionBaseline(words, 'independent_writing');
      const selected = topUp(baseline, recommendedCount('independent_writing', n), words, coverage, 'independent_writing');
      return SessionQueue.pickRandomOrder(selected, random).map((w, i) => ({
        wordId: w.id,
        exerciseType: (i % 3 === 2) ? 'independent_typing_dictation' : 'independent_typing'
      }));
    }

    // --- Aufgaben-Warteschlangen je Phase (Abschnitte 6/7/8/9/10) -------------------------------
    function buildQueueItemsForCurrentPhase() {
      const phaseType = currentPhaseType();
      const n = words.length;

      if (phaseType === 'matching') {
        const groups = buildMatchingGroups(words);
        return groups.map((group, i) => ({
          wordId: group[0].id, // primär für die (bei matching ungenutzte) SessionQueue-Wiederholungszählung
          groupWordIds: group.map((w) => w.id),
          variant: ExerciseRegistry.MATCHING_VARIANTS[i % ExerciseRegistry.MATCHING_VARIANTS.length],
          exerciseType: 'matching'
        }));
      }
      if (phaseType === 'guided_writing') return buildGuidedWritingItems();
      if (phaseType === 'independent_writing') return buildIndependentWritingItems();

      // recognition (Stufe 6, Abschnitt 6.1/6.2): ALLE neuen Wörter, fünf gemischte Übungstypen.
      const selected = selectWordsForPhase(words, coverage, recommendedCount(phaseType, n), random, phaseType);
      let items = selected.map((w, i) => ({ wordId: w.id, exerciseType: ExerciseRegistry.RECOGNITION_TYPES[i % ExerciseRegistry.RECOGNITION_TYPES.length] }));
      // Fällige Wiederholungswörter werden nur in Wiedererkennen eingemischt (Abschnitt 10: "nur
      // in passende Übungsphasen eingemischt", keine komplette Wortvorschau) — zählen NICHT zur
      // "neue Wörter"-Abdeckung (task.isReview).
      if (allReviewWords.length > 0) {
        items = items.concat(allReviewWords.map((w, i) => ({
          wordId: w.id, isReview: true, exerciseType: ExerciseRegistry.RECOGNITION_TYPES[i % ExerciseRegistry.RECOGNITION_TYPES.length]
        })));
      }
      return items;
    }

    function hasStartedQueue() {
      return Object.prototype.hasOwnProperty.call(phaseQueues, currentPhaseType());
    }

    function startGradedQueue() {
      const phaseType = currentPhaseType();
      const items = buildQueueItemsForCurrentPhase();
      // Abschnitt 8.4: Stufe 8 baut ihre Reihenfolge bereits selbst als zwei feste Blöcke -- hier
      // NICHT nochmals mischen.
      const queue = SessionQueue.create(items, random, phaseType === 'guided_writing' ? { shuffle: false } : undefined);
      // Abschnitt 23 (unverändert seit Auftrag 5): der Fortschrittsbalken braucht die
      // URSPRÜNGLICH geplante Aufgabenzahl als stabilen Nenner -- q.total wächst durch spätere
      // Wiederholungen (scheduleRepeat), plannedTotal bewusst NICHT.
      queue.plannedTotal = items.length;
      phaseQueues[phaseType] = queue;
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
        // Entwicklungsauftrag 17, Abschnitt 17: der Fehlertyp kommt bereits fertig aus dem
        // Feedbackmodell (FeedbackModel#errorType) -- hier nur noch verzeichnet, keine zweite
        // Herleitung.
        // Bewusst NICHT an isCorrect gekoppelt: FeedbackModel liefert errorType nur für
        // tatsächlich verbesserungswürdige Kategorien (u. a. auch "diacritics_mismatch", die
        // trotz weiterhin bestehender Grundbuchstaben-Korrektheit -- Abschnitt 22 -- als
        // Vokalisierungshinweis für spätere Priorisierung zählen soll, Abschnitt 17.1).
        if (opts.errorType) SessionCoverageTracker.recordErrorType(coverage, task.wordId, opts.errorType);
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

    /**
     * Entwicklungsauftrag 16, Abschnitt 7 — Bewertung einer Zuordnungsaufgabe (mehrere Wörter
     * gleichzeitig). `perWordCorrect` kommt direkt aus ExerciseRegistry#renderMatching (Abschnitt
     * 7.4: "Fehler nur einmal pro erstem Fehlversuch"). Kein scheduleRepeat -- eine
     * Zuordnungsgruppe wird bereits durch die eingebauten erneuten Versuche vollständig gelöst,
     * bevor onDone überhaupt feuert (Abschnitt 7.4: "erneuten Versuch erlauben" passiert INNERHALB
     * derselben Aufgabe, keine spätere Wiederauflage nötig).
     */
    function recordGroupTaskResult(perWordCorrect, opts = {}) {
      const phaseType = currentPhaseType();
      const q = currentQueue();
      const wordIds = Object.keys(perWordCorrect);
      let anyWrong = false;
      for (const wordId of wordIds) {
        const isCorrect = !!perWordCorrect[wordId];
        if (isCorrect) correctCount += 1; else { wrongCount += 1; anyWrong = true; }
        SessionCoverageTracker.recordAttempt(coverage, wordId, phaseType, isCorrect);
        // Entwicklungsauftrag 17, Abschnitt 17: perWordCorrect[id]===false bedeutet bereits genau
        // "hatte einen ersten Fehlversuch in dieser Gruppe" -- eindeutig ein Zuordnungsfehler,
        // keine weitere Herleitung nötig.
        if (!isCorrect) SessionCoverageTracker.recordErrorType(coverage, wordId, 'matching');
      }
      if (opts.helpUsed) {
        for (const wordId of wordIds) SessionCoverageTracker.markHelpUsed(coverage, wordId);
      }
      helpLevelState.registerResult(!anyWrong);

      const scoreEntry = phaseScores[phaseType] || (phaseScores[phaseType] = { correct: 0, attempted: 0 });
      scoreEntry.attempted += wordIds.length;
      scoreEntry.correct += wordIds.filter((id) => perWordCorrect[id]).length;

      if (q) SessionQueue.advance(q);
      return { repeatScheduled: false };
    }

    function advancePhase() {
      phaseIndex += 1;
    }

    // --- Gewichtete Bewertung (Abschnitt 26/13) -------------------------------------------------
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

    // Entwicklungsauftrag 16, Abschnitt 10.4: eine Session darf erst als abgeschlossen gelten,
    // wenn zusätzlich zur Mindestbewertung auch jedes neue Wort erkannt, zugeordnet UND
    // geschrieben wurde -- bei normalem Ablauf durch die Aufgabenerzeugung oben ohnehin
    // garantiert, hier als expliziter, unabhängig geprüfter Vertrag verankert.
    function checkCompletion() {
      const rules = sessionDef.completion_rules || {};
      const scoreOk = weightedScorePercent() >= (rules.minimum_score || 0);
      const wordsOk = !rules.all_words_exposed || allWordsExposed();
      return scoreOk && wordsOk && allWordsRecognized() && allWordsMatched() && allWordsWritten();
    }

    // --- Fortschrittsbalken (Abschnitt 23, unverändert seit Auftrag 5): stabil, springt bei
    // neuen Fehlerwiederholungen NICHT zurück — berechnet aus abgeschlossenen Phasen + Anteil der
    // aktuellen Phase, wobei die URSPRÜNGLICH geplante Aufgabenzahl je Phase (queue.plannedTotal)
    // als Nenner dient, nicht die durch Repeats gewachsene Gesamtzahl.
    function progressPercent() {
      const gradedPhases = phases.filter((p) => PhaseRegistry.get(p.type).graded);
      if (gradedPhases.length === 0) return 100;
      const currentIdx = gradedPhases.findIndex((p) => p.type === currentPhaseType());
      const donePhases = currentIdx === -1 ? (isLastPhase() ? gradedPhases.length : 0) : currentIdx;
      let partial = 0;
      const q = currentQueue();
      if (q) {
        const plannedTotal = q.plannedTotal || Math.max(1, recommendedCount(currentPhaseType(), words.length));
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
        sessionFlowVersion: CURRENT_SESSION_FLOW_VERSION,
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
      allWordsRecognized,
      allWordsMatched,
      allWordsWritten,
      markWordPreviewSeen,
      markWordKnownAlready,
      markHelpUsedForWord,
      startGradedQueue,
      hasStartedQueue,
      currentTask,
      currentQueue,
      taskProgressLabel,
      recordTaskResult,
      recordGroupTaskResult,
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
    buildMatchingGroups,
    migrateResumedState,
    MAX_REPEATS_PER_WORD_PER_PHASE,
    MATCHING_GROUP_TARGET_SIZE,
    CURRENT_SESSION_FLOW_VERSION,
    RECOMMENDED_RATIO
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SessionEngine;
}
