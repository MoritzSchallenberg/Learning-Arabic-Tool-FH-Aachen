// SessionController (Entwicklungsauftrag 4, Schritt 3/13.1) — verbindet SessionEngine (Logik),
// SessionRenderer (Rahmen/Schrittanzeige/Aktionsleiste), ExerciseRegistry (Aufgaben),
// TheoryRenderer (Theorie/Mini-Check) und SessionState (Wiederaufnahme) zu einer vollständigen
// Session. Einstiegspunkt: App.navigateToSession(unitId, sessionId) -> SessionController.mount().
//
// Setzt die in Auftrag 4 verlangte Reihenfolge durch: Theorie (beim ersten Durchlauf
// verpflichtend) -> Wörter kennenlernen -> Wiedererkennen -> Rekonstruieren -> Geführte
// Produktion -> Selbstständige Produktion -> Anwendung -> Abschluss. Feedback verschwindet nie
// automatisch — jede Aufgabe endet mit einem manuellen "Weiter"-Klick (Abschnitt 16.4).

const SessionController = (() => {
  let container = null;
  let pack = null;
  let sessionDef = null;
  let vocabUnit = null;
  let words = null;
  let engine = null;
  let activeGuard = null;
  let unitId = null;

  const SKILL_BY_PHASE = {
    recognition: 'recognition',
    reconstruction: 'reconstruction',
    guided_production: 'guided_production',
    independent_production: 'independent_production',
    application: 'application'
  };

  function freshGuard() {
    if (activeGuard) activeGuard.destroy();
    activeGuard = ExerciseGuard.create();
    return activeGuard;
  }

  async function persistSnapshot() {
    await SessionState.save(sessionDef.session_id, engine.snapshot());
  }

  function unitTitle() {
    return vocabUnit ? vocabUnit.title : unitId;
  }

  function goToUnit() {
    App.navigateToUnitDetail(unitId);
  }

  function confirmLeave() {
    showDialog({
      title: 'Session verlassen?',
      body: 'Dein Fortschritt in dieser Session wurde gespeichert. Du kannst später an derselben Stelle fortsetzen.',
      confirmLabel: 'Verlassen',
      cancelLabel: 'Weiterlernen',
      onConfirm: goToUnit
    });
  }

  function confirmDiscard(onConfirmed) {
    showDialog({
      title: 'Session verwerfen?',
      body: 'Der gesamte Fortschritt dieser Session (Theorie, gelernte Wörter, Übungen) geht verloren. Das kann nicht rückgängig gemacht werden.',
      confirmLabel: 'Verwerfen',
      cancelLabel: 'Abbrechen',
      onConfirm: async () => {
        await SessionState.discard(sessionDef.session_id);
        onConfirmed();
      }
    });
  }

  function showDialog({ title, body, confirmLabel, cancelLabel, onConfirm }) {
    const overlay = document.createElement('div');
    overlay.className = 'dialog-overlay';
    const box = document.createElement('div');
    box.className = 'dialog-box';
    const h = document.createElement('h2');
    h.className = 'text-section-title';
    h.textContent = title;
    const p = document.createElement('p');
    p.textContent = body;
    const actions = document.createElement('div');
    actions.className = 'dialog-actions';
    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'btn secondary';
    cancelBtn.textContent = cancelLabel;
    const confirmBtn = document.createElement('button');
    confirmBtn.type = 'button';
    confirmBtn.className = 'btn';
    confirmBtn.textContent = confirmLabel;
    cancelBtn.addEventListener('click', () => overlay.remove());
    confirmBtn.addEventListener('click', () => {
      overlay.remove();
      onConfirm();
    });
    actions.appendChild(cancelBtn);
    actions.appendChild(confirmBtn);
    box.appendChild(h);
    box.appendChild(p);
    box.appendChild(actions);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
  }

  // --- Theorie (verpflichtend beim ersten Durchlauf, danach jederzeit "Theorie ansehen") ------
  function theoryDoc() {
    return pack.theory.theories.find((t) => t.theory_id === sessionDef.theory_id);
  }

  function renderTheoryPhase() {
    const guard = freshGuard();
    const { bodyEl, actionBar } = SessionRenderer.renderSessionShell(container, {
      sessionDef,
      phaseIndex: engine.phaseIndex,
      progressLabel: null,
      onTheory: () => {}, // wir sind bereits in der Theorie
      onLeave: confirmLeave
    });
    SessionRenderer.clearActionBar(actionBar);

    TheoryRenderer.mount(bodyEl, theoryDoc(), {
      registerGuard: () => {}, // mini_check verwaltet seinen eigenen Guard intern
      getWordById: (id) => words.find((w) => w.id === id),
      onPlayAudio: (audioKey, text) => AudioPlayer.speak(text, 'ar-SA', { audioKey }).catch(() => {}),
      onMiniCheckComplete: async (correct, total) => {
        await AppState.markTheoryMiniCheckResult(sessionDef.theory_id, correct, total);
      },
      onStart: async () => {
        engine.theoryDone = true;
        engine.advancePhase();
        await persistSnapshot();
        renderCurrentPhase();
      }
    });
  }

  // Theorie jederzeit erneut ansehen, OHNE den Sessionfortschritt zu verändern (Abschnitt 10.2).
  function renderTheoryReview(returnToPhase) {
    const { bodyEl, actionBar } = SessionRenderer.renderSessionShell(container, {
      sessionDef,
      phaseIndex: engine.phaseIndex,
      progressLabel: 'Theorie (erneut angesehen — dein Fortschritt bleibt erhalten)',
      onTheory: () => {},
      onLeave: confirmLeave
    });
    SessionRenderer.clearActionBar(actionBar);
    TheoryRenderer.mount(bodyEl, theoryDoc(), {
      getWordById: (id) => words.find((w) => w.id === id),
      onPlayAudio: (audioKey, text) => AudioPlayer.speak(text, 'ar-SA', { audioKey }).catch(() => {}),
      onMiniCheckComplete: () => {},
      startLabel: 'Zurück zur Übung',
      onStart: returnToPhase
    });
  }

  // --- Wörter kennenlernen (Abschnitt 11) ------------------------------------------------------
  function renderWordCard(word) {
    const card = document.createElement('div');
    card.className = 'word-card';
    const arabic = document.createElement('p');
    arabic.className = 'arabic-word-main';
    arabic.textContent = word.arabic;
    card.appendChild(arabic);
    const translation = document.createElement('p');
    translation.className = 'word-card-translation';
    translation.textContent = word.german;
    card.appendChild(translation);
    if (word.transliteration) {
      const translit = document.createElement('p');
      translit.className = 'word-card-translit';
      translit.textContent = word.transliteration;
      card.appendChild(translit);
    }
    const actions = document.createElement('div');
    actions.className = 'word-card-actions';
    const audioBtn = document.createElement('button');
    audioBtn.type = 'button';
    audioBtn.className = 'btn icon';
    audioBtn.textContent = '🔊';
    audioBtn.setAttribute('aria-label', `${word.german} anhören`);
    audioBtn.addEventListener('click', () => AudioPlayer.speak(word.arabic, 'ar-SA', { audioKey: `vocabulary/${word.id}` }).catch(() => {}));
    const slowBtn = document.createElement('button');
    slowBtn.type = 'button';
    slowBtn.className = 'btn icon';
    slowBtn.textContent = '🐢';
    slowBtn.setAttribute('aria-label', `${word.german} langsam anhören`);
    slowBtn.addEventListener('click', () => AudioPlayer.speak(word.arabic, 'ar-SA', { slow: true, audioKey: `vocabulary/${word.id}` }).catch(() => {}));
    actions.appendChild(audioBtn);
    actions.appendChild(slowBtn);
    card.appendChild(actions);
    return card;
  }

  function renderWordPreviewPhase() {
    const { bodyEl, actionBar } = SessionRenderer.renderSessionShell(container, {
      sessionDef,
      phaseIndex: engine.phaseIndex,
      progressLabel: `${words.length} neue Wörter`,
      onTheory: () => renderTheoryReview(renderWordPreviewPhase),
      onLeave: confirmLeave
    });

    const grid = document.createElement('div');
    grid.className = 'word-grid';
    words.forEach((w) => {
      grid.appendChild(renderWordCard(w));
      engine.markWordExposed(w.id); // jedes Wort ist jetzt mindestens einmal sichtbar gewesen
    });
    bodyEl.appendChild(grid);
    persistSnapshot();

    SessionRenderer.renderContinueButton(actionBar, 'Weiter zu kurzen Erkennungsaufgaben', async () => {
      await persistSnapshot();
      runWordPreviewMiniChecks(0);
    });
  }

  // Sehr leichte Erkennungsaufgaben nach der Wortvorschau (Abschnitt 11.3/11.4) — jedes Wort
  // erscheint hier mindestens einmal in einer leichten Erkennungsaufgabe, bevor es in der
  // eigentlichen "Wiedererkennen"-Phase erneut (und gewertet) abgefragt wird.
  function runWordPreviewMiniChecks(index) {
    const sample = SessionQueue.pickRandomOrder(words).slice(0, Math.min(3, words.length));
    if (index >= sample.length) {
      engine.advancePhase();
      persistSnapshot();
      renderCurrentPhase();
      return;
    }
    const guard = freshGuard();
    const { bodyEl, actionBar } = SessionRenderer.renderSessionShell(container, {
      sessionDef,
      phaseIndex: engine.phaseIndex,
      progressLabel: `Kurzer Check ${index + 1} / ${sample.length}`,
      onTheory: () => renderTheoryReview(() => runWordPreviewMiniChecks(index)),
      onLeave: confirmLeave
    });
    SessionRenderer.clearActionBar(actionBar);
    ExerciseRegistry.render('multiple_choice', bodyEl, { word: sample[index], allWords: words }, guard, () => {
      SessionRenderer.renderContinueButton(actionBar, 'Weiter', () => runWordPreviewMiniChecks(index + 1));
    });
  }

  // --- Wiedererkennen/Rekonstruieren/Produktion/Anwendung (aufgabenbasierte Phasen) -----------
  function renderGradedPhase() {
    if (!engine.hasStartedQueue()) {
      engine.startGradedQueue();
    }
    if (engine.isPhaseQueueDone()) {
      engine.advancePhase();
      persistSnapshot();
      renderCurrentPhase();
      return;
    }

    const phaseType = engine.currentPhaseType();
    const exerciseType = ExerciseRegistry.PHASE_EXERCISE_TYPE[phaseType];
    const task = engine.currentTask();
    const word = words.find((w) => w.id === task.wordId);

    const guard = freshGuard();
    const { bodyEl, actionBar } = SessionRenderer.renderSessionShell(container, {
      sessionDef,
      phaseIndex: engine.phaseIndex,
      progressLabel: engine.taskProgressLabel() + (task.isRepeat ? ' · Wiederholung' : ''),
      onTheory: () => renderTheoryReview(renderGradedPhase),
      onLeave: confirmLeave
    });
    SessionRenderer.clearActionBar(actionBar);

    ExerciseRegistry.render(exerciseType, bodyEl, {
      word,
      allWords: words,
      keyboardLetters: pack.keyboard.letters,
      helpConfig: engine.helpLevelState.config()
    }, guard, async (isCorrect) => {
      const card = AppState.getCard(word.id);
      adjustDifficulty(card, SKILL_BY_PHASE[phaseType], isCorrect ? 'correct' : 'wrong');
      await AppState.persistProgress();
      engine.recordTaskResult(isCorrect);
      await persistSnapshot();
      SessionRenderer.renderContinueButton(actionBar, 'Weiter', () => {
        renderCurrentPhase();
      });
    });
  }

  // --- Abschluss --------------------------------------------------------------------------------
  function renderSummaryPhase() {
    const { bodyEl, actionBar } = SessionRenderer.renderSessionShell(container, {
      sessionDef,
      phaseIndex: engine.phases.length - 1,
      progressLabel: null,
      onTheory: () => renderTheoryReview(renderSummaryPhase),
      onLeave: confirmLeave
    });
    SessionRenderer.clearActionBar(actionBar);

    const passed = engine.checkCompletion();
    const card = document.createElement('div');
    card.className = 'card';
    const heading = document.createElement('p');
    heading.className = 'lead';
    heading.style.margin = '0';
    heading.textContent = passed ? 'Session abgeschlossen 🎉' : 'Session beendet — ein erneuter Versuch könnte helfen.';
    card.appendChild(heading);
    const scoreP = document.createElement('p');
    scoreP.textContent = `Richtig: ${engine.correctCount} / ${engine.correctCount + engine.wrongCount} (${Math.round(engine.scorePercent() * 100)}%)`;
    card.appendChild(scoreP);
    const wordsP = document.createElement('p');
    wordsP.textContent = `${words.length} Wörter kennengelernt.`;
    card.appendChild(wordsP);
    bodyEl.appendChild(card);

    const finishBtn = document.createElement('button');
    finishBtn.type = 'button';
    finishBtn.className = 'btn';
    finishBtn.textContent = 'Fertig';
    finishBtn.addEventListener('click', async () => {
      if (passed) await SessionState.complete(sessionDef.session_id);
      else await persistSnapshot();
      goToUnit();
    });
    bodyEl.appendChild(finishBtn);

    const discardBtn = document.createElement('button');
    discardBtn.type = 'button';
    discardBtn.className = 'btn secondary';
    discardBtn.style.marginLeft = '10px';
    discardBtn.textContent = 'Session verwerfen und neu starten';
    discardBtn.addEventListener('click', () => confirmDiscard(() => mount(container, { unitId, sessionId: sessionDef.session_id })));
    bodyEl.appendChild(discardBtn);
  }

  function renderCurrentPhase() {
    const type = engine.currentPhaseType();
    if (!type) { renderSummaryPhase(); return; }
    if (type === 'theory') {
      if (engine.theoryDone) { engine.advancePhase(); renderCurrentPhase(); return; }
      renderTheoryPhase();
      return;
    }
    if (type === 'word_preview') { renderWordPreviewPhase(); return; }
    if (type === 'summary') { renderSummaryPhase(); return; }
    renderGradedPhase();
  }

  async function mount(el, { unitId: uid, sessionId }) {
    container = el;
    unitId = uid;
    container.innerHTML = '<div class="loading-placeholder">Lädt…</div>';
    App.registerCleanup(() => { if (activeGuard) activeGuard.destroy(); });

    pack = await AppState.getLanguagePack();
    sessionDef = pack.vocabSessions.sessions.find((s) => s.session_id === sessionId);
    vocabUnit = pack.vocabSessions.vocab_units.find((u) => u.id === unitId);
    if (!sessionDef) {
      container.innerHTML = '<div class="empty-state">Diese Session wurde nicht gefunden.</div>';
      return;
    }
    words = SessionEngine.buildWordList(sessionDef, pack.vocabulary.categories.flatMap((c) => c.words));

    App.renderHeader({
      breadcrumbs: [
        { label: 'Kurs', onClick: App.navigateToCourse },
        { label: unitTitle(), onClick: goToUnit },
        { label: sessionDef.title }
      ],
      title: sessionDef.title,
      onBack: goToUnit
    });

    const resumedState = SessionState.getState(sessionDef.session_id);
    const canResume = resumedState && resumedState.status !== 'completed';
    engine = SessionEngine.create({ sessionDef, words, resumedState: canResume ? resumedState : null });
    if (!canResume) {
      await SessionState.initNew(sessionDef.session_id);
    }
    renderCurrentPhase();
  }

  return { mount };
})();
