// SessionController (Entwicklungsauftrag 4, Schritt 3; grundlegend erweitert in
// Entwicklungsauftrag 5) — verbindet SessionEngine (Logik), SessionRenderer (Rahmen/
// Schrittanzeige/Aktionsleiste/Fortschrittsbalken), ExerciseRegistry (Aufgaben), TheoryRenderer
// (Theorie/Mini-Check) und SessionState (Wiederaufnahme) zu einer vollständigen Session.
// Einstiegspunkt: App.navigateToSession(unitId, sessionId) -> SessionController.mount().
//
// Ablauf (Entwicklungsauftrag 5, Abschnitt 14): Sessionübersicht -> Theorie (beim ersten
// Durchlauf verpflichtend inkl. vollständig zu bearbeitendem Mini-Check) -> Wörter in kleinen
// Gruppen kennenlernen (Einzelansicht, Gruppen-Mini-Checks) -> Wiedererkennen -> Rekonstruieren
// -> Geführte Produktion -> Selbstständige Produktion -> Anwendung -> Abschluss. Feedback
// verschwindet nie automatisch — jede Aufgabe endet mit einem manuellen "Weiter"-Klick, außer die
// Einstellung "autoAdvanceAfterFeedback" ist aktiv UND die Antwort war richtig (Abschnitt 21).

const SessionController = (() => {
  let container = null;
  let pack = null;
  let sessionDef = null;
  let vocabUnit = null;
  let words = null; // neue Wörter dieser Session (ggf. durchs Tageslimit gekürzt)
  let reviewWords = null; // fällige Wörter aus früheren Sessions (Abschnitt 10)
  let engine = null;
  let activeGuard = null;
  let unitId = null;
  let sessionWasResumable = false;

  // Zustand der Wortlernphase (Abschnitt 4/5) — lebt nur für die Dauer dieser Phase, wird beim
  // Wiederaufnehmen aus der Coverage rekonstruiert (siehe resumeLearnPosition()).
  let learnGroups = null;
  let learnGroupIndex = 0;
  let learnIndexInGroup = 0;
  let learnViewMode = 'single';
  let wordUiState = {};

  const SKILL_BY_PHASE = {
    recognition: 'recognition',
    reconstruction: 'reconstruction',
    guided_production: 'guided_production',
    independent_production: 'independent_production',
    application: 'application'
  };

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function mkBtn(label, className, onClick) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = className;
    btn.textContent = label;
    // Entwicklungsauftrag 13, Abschnitt 7: onClick bekommt das eigene Button-Element übergeben,
    // damit Audio-Handler es für den Doppelklick-Schutz an AudioPlayer.speakWord() weiterreichen
    // können, ohne den Button vorher separat anlegen zu müssen. Bestehende Handler, die das
    // Argument ignorieren, sind davon unberührt.
    btn.addEventListener('click', () => onClick(btn));
    return btn;
  }

  function chunk(arr, size) {
    const out = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
  }

  function allSessionWords() {
    return words.concat(reviewWords);
  }

  function freshGuard() {
    if (activeGuard) activeGuard.destroy();
    activeGuard = ExerciseGuard.create();
    return activeGuard;
  }

  async function persistSnapshot() {
    await SessionState.save(sessionDef.session_id, {
      ...engine.snapshot(),
      activeNewWordIds: words.map((w) => w.id)
    });
  }

  function unitTitle() {
    return vocabUnit ? vocabUnit.title : unitId;
  }

  function goToUnit() {
    App.navigateToUnitDetail(unitId);
  }

  function nextSessionInUnit() {
    if (!vocabUnit) return null;
    const idx = vocabUnit.session_ids.indexOf(sessionDef.session_id);
    if (idx === -1 || idx + 1 >= vocabUnit.session_ids.length) return null;
    return vocabUnit.session_ids[idx + 1];
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

  // Entwicklungsauftrag 13, Abschnitt 5/7/8: gemeinsamer Handler für Theorie-Beispielaudios
  // (theoryRenderer.js#renderAudioWord übergibt den rohen block.audio_key, kein Wort-Objekt --
  // AudioPlayer.speakWord() passt hier nicht direkt, deshalb ein eigener, ebenso abgesicherter
  // Wrapper: Doppelklick-Schutz über das übergebene Button-Element, sichtbares Fehlerfeedback
  // statt eines stillen Fehlschlags.
  function playTheoryAudio(audioKey, text, btn) {
    if (btn) { if (btn.disabled) return; btn.disabled = true; }
    AudioPlayer.speak(text, 'ar-SA', { audioKey }).then((result) => {
      if (result.source === 'failed' && typeof AudioFeedback !== 'undefined') {
        AudioFeedback.reportAudioError('Theorie-Beispiel', new Error(`Wiedergabe fehlgeschlagen für audioKey="${audioKey}"`));
      } else if (result.source === 'tts_fallback' && typeof AudioFeedback !== 'undefined') {
        AudioFeedback.reportTtsFallback('Theorie-Beispiel');
      }
    }).finally(() => { if (btn) btn.disabled = false; });
  }

  function showDialog({ title, body, confirmLabel, cancelLabel, onConfirm }) {
    // Entwicklungsauftrag 13, Abschnitt 6.3 — ein sich öffnender Dialog (z. B. "Session verwerfen?")
    // darf eine noch laufende Wiedergabe nicht ungestört weiterlaufen lassen.
    AudioPlayer.stopCurrentAudio();
    const overlay = document.createElement('div');
    overlay.className = 'dialog-overlay';
    const box = document.createElement('div');
    box.className = 'dialog-box';
    const h = el('h2', 'text-section-title', title);
    const p = el('p', null, body);
    const actions = document.createElement('div');
    actions.className = 'dialog-actions';
    const cancelBtn = mkBtn(cancelLabel, 'btn secondary', () => overlay.remove());
    const confirmBtn = mkBtn(confirmLabel, 'btn', () => { overlay.remove(); onConfirm(); });
    actions.appendChild(cancelBtn);
    actions.appendChild(confirmBtn);
    box.appendChild(h);
    box.appendChild(p);
    box.appendChild(actions);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
  }

  // --- Sessionübersicht (Entwicklungsauftrag 5, Abschnitt 14) ---------------------------------
  function renderSessionOverview() {
    const view = el('div', 'view page-content');
    view.appendChild(el('h1', 'text-page-title', sessionDef.title));

    const metaCard = el('div', 'card');
    metaCard.appendChild(el('p', 'lead', `${words.length} neue Wörter`));
    if (reviewWords.length > 0) metaCard.appendChild(el('p', 'text-body', `${reviewWords.length} Wiederholungen aus früheren Sessions`));
    metaCard.appendChild(el('p', 'text-hint', `ca. ${sessionDef.estimated_minutes} Minuten`));
    view.appendChild(metaCard);

    const goalsCard = el('div', 'card');
    goalsCard.appendChild(el('p', 'lead', 'Heute lernst du'));
    const doc = theoryDoc();
    const goals = doc && Array.isArray(doc.learning_objectives) && doc.learning_objectives.length > 0
      ? doc.learning_objectives
      : words.slice(0, 3).map((w) => ExerciseRegistry.primaryGerman(w));
    const ul = document.createElement('ul');
    goals.forEach((g) => ul.appendChild(el('li', null, g)));
    goalsCard.appendChild(ul);
    view.appendChild(goalsCard);

    const flowCard = el('div', 'card');
    flowCard.appendChild(el('p', 'lead', 'Ablauf'));
    flowCard.appendChild(el('p', 'text-hint', sessionDef.phases.map((p) => PhaseRegistry.get(p.type).label).join(' → ')));
    view.appendChild(flowCard);

    const actions = document.createElement('div');
    actions.className = 'action-bar-left';
    actions.style.display = 'flex';
    actions.style.gap = '10px';
    actions.style.flexWrap = 'wrap';
    actions.style.marginTop = '8px';
    if (sessionWasResumable) {
      actions.appendChild(mkBtn('Session fortsetzen', 'btn', () => renderCurrentPhase()));
      actions.appendChild(mkBtn('Von vorne beginnen', 'btn secondary', () => confirmDiscard(() => mount(container, { unitId, sessionId: sessionDef.session_id }))));
    } else {
      actions.appendChild(mkBtn('Session starten', 'btn', () => renderCurrentPhase()));
      actions.appendChild(mkBtn('Theorie ansehen', 'btn secondary', () => renderTheoryReview(renderSessionOverview)));
    }
    actions.appendChild(mkBtn('Zurück', 'btn secondary', goToUnit));
    view.appendChild(actions);

    while (container.firstChild) container.removeChild(container.firstChild);
    container.appendChild(view);
  }

  // --- Tageslimit (Entwicklungsauftrag 5, Abschnitt 11) — nur beim allerersten Start relevant --
  function renderDailyLimitChoice(fullWordList, remainingToday, allPackWords) {
    const view = el('div', 'view page-content');
    view.appendChild(el('h1', 'text-page-title', sessionDef.title));
    const card = el('div', 'card');
    card.appendChild(el('p', 'lead', `Dein Tagesziel sind noch ${remainingToday} neue Wörter.`));
    card.appendChild(el('p', 'text-hint', 'Das Tagesziel ist eine Empfehlung, kein Zwang — du kannst trotzdem alle Wörter dieser Session lernen.'));
    view.appendChild(card);

    const actions = document.createElement('div');
    actions.style.display = 'flex';
    actions.style.gap = '10px';
    actions.style.flexWrap = 'wrap';
    actions.appendChild(mkBtn(`${remainingToday} Wörter lernen`, 'btn', () => startFreshSession(fullWordList.slice(0, remainingToday), allPackWords)));
    actions.appendChild(mkBtn(`Trotzdem alle ${fullWordList.length} lernen`, 'btn secondary', () => startFreshSession(fullWordList, allPackWords)));
    view.appendChild(actions);

    while (container.firstChild) container.removeChild(container.firstChild);
    container.appendChild(view);
  }

  // --- Wiederholungswörter aus früheren Sessions einmischen (Abschnitt 10) --------------------
  function pickReviewWords(def, newWords, allPackWords) {
    const reviewCount = def.review_count || 0;
    if (reviewCount <= 0) return [];
    const newWordIds = new Set(newWords.map((w) => w.id));
    const candidates = allPackWords.filter((w) => !newWordIds.has(w.id));
    const skills = Object.values(SKILL_BY_PHASE);
    const items = [];
    for (const w of candidates) {
      for (const skill of skills) items.push({ cardId: w.id, skill });
    }
    const result = ReviewScheduler.buildQueue(items, AppState.getCard, { dailyNewLimit: 0, newItemsShownToday: 0 });
    const orderedIds = [];
    const seen = new Set();
    for (const item of result.queue) {
      if (!seen.has(item.cardId)) { seen.add(item.cardId); orderedIds.push(item.cardId); }
    }
    return orderedIds.slice(0, reviewCount).map((id) => allPackWords.find((w) => w.id === id)).filter(Boolean);
  }

  async function startFreshSession(selectedWords, allPackWords) {
    words = selectedWords;
    reviewWords = pickReviewWords(sessionDef, words, allPackWords);
    engine = SessionEngine.create({ sessionDef, words, reviewWords, resumedState: null });
    sessionWasResumable = false;
    await SessionState.initNew(sessionDef.session_id);
    await persistSnapshot();
    renderSessionOverview();
  }

  // --- Theorie (verpflichtend beim ersten Durchlauf, danach jederzeit "Theorie ansehen") ------
  function theoryDoc() {
    return pack.theory.theories.find((t) => t.theory_id === sessionDef.theory_id);
  }

  function renderTheoryPhase() {
    freshGuard();
    const { bodyEl, actionBar } = SessionRenderer.renderSessionShell(container, {
      sessionDef,
      phaseIndex: engine.phaseIndex,
      progressLabel: null,
      progressPercent: engine.progressPercent(),
      onTheory: () => {}, // wir sind bereits in der Theorie
      onLeave: confirmLeave
    });
    SessionRenderer.clearActionBar(actionBar);

    TheoryRenderer.mount(bodyEl, theoryDoc(), {
      registerGuard: () => {}, // mini_check verwaltet seinen eigenen Guard intern
      requireMiniCheckBeforeStart: true,
      getWordById: (id) => allSessionWords().find((w) => w.id === id),
      onPlayAudio: playTheoryAudio,
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
      phaseIndex: engine ? engine.phaseIndex : 0,
      progressLabel: 'Theorie (erneut angesehen — dein Fortschritt bleibt erhalten)',
      onTheory: () => {},
      onLeave: confirmLeave
    });
    SessionRenderer.clearActionBar(actionBar);
    TheoryRenderer.mount(bodyEl, theoryDoc(), {
      getWordById: (id) => allSessionWords().find((w) => w.id === id),
      onPlayAudio: playTheoryAudio,
      onMiniCheckComplete: () => {},
      startLabel: 'Zurück zur Übung',
      onStart: returnToPhase
    });
  }

  // --- Wörter in kleinen Gruppen kennenlernen (Entwicklungsauftrag 5, Abschnitte 3-5) ---------
  function mkIconBtn(icon, label, onClick) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn icon';
    btn.textContent = icon;
    btn.setAttribute('aria-label', label);
    btn.addEventListener('click', () => onClick(btn));
    return btn;
  }

  function renderWordCard(word) {
    const card = document.createElement('div');
    card.className = 'word-card';
    card.appendChild(el('p', 'arabic-word-main', word.arabic_vocalized || word.arabic));
    card.appendChild(el('p', 'word-card-translation', ExerciseRegistry.primaryGerman(word)));
    if (word.transliteration) card.appendChild(el('p', 'word-card-translit', word.transliteration));
    const actions = document.createElement('div');
    actions.className = 'word-card-actions';
    actions.appendChild(mkIconBtn('🔊', `${word.german} anhören`, (btn) => AudioPlayer.speakWord(word, { context: 'Wortkarte', button: btn })));
    actions.appendChild(mkIconBtn('🐢', `${word.german} langsam anhören`, (btn) => AudioPlayer.speakWord(word, { slow: true, context: 'Wortkarte', button: btn })));
    card.appendChild(actions);
    return card;
  }

  // Rekonstruiert nach einer Wiederaufnahme, an welcher Stelle der Gruppen-Lernphase der Nutzer
  // stand — anhand der Coverage (welche Wörter wurden schon gesehen/gecheckt), NICHT anhand
  // zusätzlich persistierter UI-Indizes (Abschnitt 3: "exposed" muss echt sein, kein Rate-Zustand).
  function resumeLearnPosition() {
    for (let g = 0; g < learnGroups.length; g += 1) {
      const group = learnGroups[g];
      const allSeen = group.every((w) => engine.coverage[w.id] && engine.coverage[w.id].preview_seen);
      if (!allSeen) {
        learnGroupIndex = g;
        learnIndexInGroup = group.findIndex((w) => !(engine.coverage[w.id] && engine.coverage[w.id].preview_seen));
        return;
      }
      const allChecked = group.every((w) => engine.coverage[w.id] && engine.coverage[w.id].recognition_attempts >= 1);
      if (!allChecked) {
        learnGroupIndex = g;
        learnIndexInGroup = group.length;
        return;
      }
    }
    learnGroupIndex = learnGroups.length;
    learnIndexInGroup = 0;
  }

  function renderWordLearningPhase() {
    if (!learnGroups) {
      learnGroups = chunk(words, 3);
      learnViewMode = 'single';
      wordUiState = {};
      words.forEach((w) => { wordUiState[w.id] = { hideSpelling: false, hideTranslation: false }; });
      resumeLearnPosition();
    }
    renderLearnStep();
  }

  function renderLearnStep() {
    if (learnGroupIndex >= learnGroups.length) {
      engine.advancePhase();
      persistSnapshot();
      renderCurrentPhase();
      return;
    }
    if (learnViewMode === 'grid') { renderLearnGrid(); return; }
    const group = learnGroups[learnGroupIndex];
    if (learnIndexInGroup >= group.length) { runGroupMiniCheck(learnGroupIndex, 0); return; }
    renderSingleWordStep(group, learnIndexInGroup);
  }

  function renderLearnGrid() {
    const { bodyEl, actionBar } = SessionRenderer.renderSessionShell(container, {
      sessionDef,
      phaseIndex: engine.phaseIndex,
      progressLabel: `${words.length} neue Wörter — Übersicht`,
      progressPercent: engine.progressPercent(),
      onTheory: () => renderTheoryReview(renderLearnGrid),
      onLeave: confirmLeave
    });
    SessionRenderer.clearActionBar(actionBar);
    const grid = document.createElement('div');
    grid.className = 'word-grid';
    words.forEach((w) => {
      grid.appendChild(renderWordCard(w));
      engine.markWordPreviewSeen(w.id);
    });
    bodyEl.appendChild(grid);
    persistSnapshot();
    SessionRenderer.renderContinueButton(actionBar, 'Zurück zur Einzelansicht', () => { learnViewMode = 'single'; renderLearnStep(); });
  }

  function renderSingleWordStep(group, indexInGroup) {
    const word = group[indexInGroup];
    const globalIndex = words.indexOf(word);
    const { bodyEl, actionBar } = SessionRenderer.renderSessionShell(container, {
      sessionDef,
      phaseIndex: engine.phaseIndex,
      progressLabel: `Wort ${globalIndex + 1} von ${words.length}`,
      progressPercent: engine.progressPercent(),
      onTheory: () => renderTheoryReview(() => renderSingleWordStep(group, indexInGroup)),
      onLeave: confirmLeave
    });

    const firstTimeSeen = engine.markWordPreviewSeen(word.id);
    if (firstTimeSeen) {
      AppState.incrementDailyNewCount(1);
      persistSnapshot();
    }

    const settings = AppState.getSettings();
    const ui = wordUiState[word.id];

    const card = el('div', 'card word-card');
    card.appendChild(el('p', 'arabic-word-main', ui.hideSpelling ? '؟ ؟ ؟' : (word.arabic_vocalized || word.arabic)));
    if (!ui.hideSpelling && settings.showTransliteration !== false && word.transliteration) {
      card.appendChild(el('p', 'word-card-translit', word.transliteration));
    }
    if (!ui.hideTranslation) {
      card.appendChild(el('p', 'word-card-translation', ExerciseRegistry.primaryGerman(word)));
      const altAnswers = ExerciseRegistry.germanAnswers(word).slice(1);
      if (altAnswers.length > 0) card.appendChild(el('p', 'text-hint', `auch: ${altAnswers.join(', ')}`));
    }
    const metaBits = [];
    if (word.part_of_speech) metaBits.push(word.part_of_speech);
    if (word.gender) metaBits.push(word.gender);
    if (word.plural) metaBits.push(`Plural: ${word.plural}`);
    if (metaBits.length > 0) card.appendChild(el('p', 'text-hint', metaBits.join(' · ')));

    const audioActions = document.createElement('div');
    audioActions.className = 'word-card-actions';
    audioActions.appendChild(mkIconBtn('🔊', `${word.german} anhören`, (btn) => AudioPlayer.speakWord(word, { context: 'Wortkarte', button: btn })));
    audioActions.appendChild(mkIconBtn('🐢', `${word.german} langsam anhören`, (btn) => AudioPlayer.speakWord(word, { slow: true, context: 'Wortkarte', button: btn })));
    card.appendChild(audioActions);

    const toggleRow = document.createElement('div');
    toggleRow.className = 'word-card-actions';
    toggleRow.appendChild(mkBtn(ui.hideSpelling ? 'Schreibweise anzeigen' : 'Schreibweise verbergen', 'btn secondary', () => {
      ui.hideSpelling = !ui.hideSpelling;
      renderSingleWordStep(group, indexInGroup);
    }));
    toggleRow.appendChild(mkBtn(ui.hideTranslation ? 'Übersetzung anzeigen' : 'Übersetzung verbergen', 'btn secondary', () => {
      ui.hideTranslation = !ui.hideTranslation;
      renderSingleWordStep(group, indexInGroup);
    }));
    toggleRow.appendChild(mkBtn('Noch einmal zeigen', 'btn secondary', () => {
      AudioPlayer.speakWord(word, { context: 'Wortkarte (erneut zeigen)' });
      ui.hideSpelling = false;
      ui.hideTranslation = false;
      renderSingleWordStep(group, indexInGroup);
    }));
    // "Kenne ich schon" markiert das Wort NICHT als beherrscht — es reduziert nur später die
    // zusätzliche (adaptive) Übungsmenge; aktive Abrufaufgaben bleiben verpflichtend (Abschnitt 4.3).
    toggleRow.appendChild(mkBtn('Kenne ich schon', 'btn secondary', () => {
      engine.markWordKnownAlready(word.id);
      goToNextLearnStep(group, indexInGroup);
    }));
    card.appendChild(toggleRow);
    bodyEl.appendChild(card);
    bodyEl.appendChild(mkBtn('Alle Wörter anzeigen', 'btn secondary', () => { learnViewMode = 'grid'; renderLearnStep(); }));

    if (settings.autoPlayWord) {
      AudioPlayer.speakWord(word, { slow: !!settings.slowPlayback, context: 'Wortkarte (automatisch)' });
    }

    const isFirstOverall = learnGroupIndex === 0 && indexInGroup === 0;
    SessionRenderer.renderActionBar(actionBar, {
      leftButtons: isFirstOverall ? [] : [{ label: '← Zurück', className: 'btn secondary', onClick: () => goToPrevLearnStep(group, indexInGroup) }],
      rightButtons: [{ label: 'Weiter →', onClick: () => goToNextLearnStep(group, indexInGroup) }]
    });
  }

  function goToNextLearnStep(group, indexInGroup) {
    learnIndexInGroup = indexInGroup + 1;
    persistSnapshot();
    renderLearnStep();
  }

  function goToPrevLearnStep(group, indexInGroup) {
    if (indexInGroup > 0) { learnIndexInGroup = indexInGroup - 1; renderLearnStep(); return; }
    if (learnGroupIndex > 0) {
      learnGroupIndex -= 1;
      learnIndexInGroup = learnGroups[learnGroupIndex].length - 1;
      renderLearnStep();
    }
  }

  // Leichter Mini-Check nach jeder Dreiergruppe (Abschnitt 5) — deckt ALLE Wörter der Gruppe ab,
  // in zufällig gewählter Form (Arabisch->Deutsch, Deutsch->Arabisch, Audio->Wort, Wort->Audio;
  // noch keine freie Tastatureingabe).
  function runGroupMiniCheck(groupIndex, checkIndex) {
    const group = learnGroups[groupIndex];
    if (checkIndex >= group.length) {
      if (groupIndex + 1 < learnGroups.length) {
        learnGroupIndex = groupIndex + 1;
        learnIndexInGroup = 0;
        persistSnapshot();
        renderLearnStep();
      } else {
        learnGroupIndex = learnGroups.length;
        engine.advancePhase();
        persistSnapshot();
        renderCurrentPhase();
      }
      return;
    }
    const word = group[checkIndex];
    const exerciseType = ExerciseRegistry.MINI_CHECK_TYPES[Math.floor(Math.random() * ExerciseRegistry.MINI_CHECK_TYPES.length)];
    const guard = freshGuard();
    const { bodyEl, actionBar } = SessionRenderer.renderSessionShell(container, {
      sessionDef,
      phaseIndex: engine.phaseIndex,
      progressLabel: `Kurzer Check — Wort ${checkIndex + 1} von ${group.length} (Gruppe ${groupIndex + 1}/${learnGroups.length})`,
      progressPercent: engine.progressPercent(),
      onTheory: () => renderTheoryReview(() => runGroupMiniCheck(groupIndex, checkIndex)),
      onLeave: confirmLeave
    });
    SessionRenderer.clearActionBar(actionBar);
    ExerciseRegistry.render(exerciseType, bodyEl, {
      word, allWords: words, helpConfig: HelpLevel.HELP_LEVEL_CONFIG.B, settings: AppState.getSettings()
    }, guard, (isCorrect) => {
      engine.recordMiniCheckResult(word.id, isCorrect);
      persistSnapshot();
      SessionRenderer.renderContinueButton(actionBar, 'Weiter', () => runGroupMiniCheck(groupIndex, checkIndex + 1));
    });
  }

  // --- Wiedererkennen/Rekonstruieren/Produktion/Anwendung (aufgabenbasierte Phasen) -----------
  function renderGradedPhase() {
    if (!engine.hasStartedQueue()) engine.startGradedQueue();
    if (engine.isPhaseQueueDone()) {
      engine.advancePhase();
      persistSnapshot();
      renderCurrentPhase();
      return;
    }

    const phaseType = engine.currentPhaseType();
    const exerciseType = ExerciseRegistry.PHASE_EXERCISE_TYPE[phaseType];
    const task = engine.currentTask();
    const word = allSessionWords().find((w) => w.id === task.wordId);
    const settings = AppState.getSettings();

    const guard = freshGuard();
    const { bodyEl, actionBar } = SessionRenderer.renderSessionShell(container, {
      sessionDef,
      phaseIndex: engine.phaseIndex,
      progressLabel: engine.taskProgressLabel() + (task.isRepeat ? ' · Wiederholung' : '') + (task.isReview ? ' · Wiederholungswort' : ''),
      progressPercent: engine.progressPercent(),
      onTheory: () => renderTheoryReview(renderGradedPhase),
      onLeave: confirmLeave
    });

    let helpUsedFlag = ['A', 'B'].includes(engine.helpLevelState.currentLevel()) || phaseType === 'guided_production';
    let checkAction = null;

    ExerciseRegistry.render(exerciseType, bodyEl, {
      word,
      allWords: words,
      keyboardLetters: pack.keyboard.letters,
      helpConfig: engine.helpLevelState.config(),
      settings,
      provideCheckAction: (fn) => { checkAction = fn; }
    }, guard, async (isCorrect, detail) => {
      const card = AppState.getCard(word.id);
      adjustDifficulty(card, SKILL_BY_PHASE[phaseType], isCorrect ? 'correct' : ((detail && detail.result) || 'wrong'));
      await AppState.persistProgress();
      const { repeatScheduled } = engine.recordTaskResult(isCorrect, { helpUsed: helpUsedFlag });
      await persistSnapshot();

      const leftButtons = [
        { label: 'Audio erneut', onClick: (btn) => AudioPlayer.speakWord(word, { context: 'Aufgaben-Feedback', button: btn }) }
      ];
      if (!isCorrect && detail && detail.errorExplanation) {
        leftButtons.push({
          label: 'Fehler erklären',
          onClick: () => bodyEl.appendChild(el('p', 'theory-callout theory-callout-info', detail.errorExplanation))
        });
      }
      if (!isCorrect && !repeatScheduled && !task.isReview) {
        bodyEl.appendChild(el('p', 'text-hint', `Kurz erklärt: ${word.arabic}${word.transliteration ? ` (${word.transliteration})` : ''} bedeutet „${ExerciseRegistry.primaryGerman(word)}". Dieses Wort taucht später in einer Wiederholung erneut auf.`));
      }
      if (settings.replayAfterAnswer) {
        AudioPlayer.speakWord(word, { context: 'Aufgaben-Feedback (automatisch)' });
      }

      const doAdvance = () => renderCurrentPhase();
      SessionRenderer.renderActionBar(actionBar, { leftButtons, rightButtons: [{ label: 'Weiter', onClick: doAdvance }] });
      if (isCorrect && settings.autoAdvanceAfterFeedback) {
        guard.setTimeout(doAdvance, 1500);
      }
    });

    const inputLeftButtons = [
      {
        label: 'Hilfe',
        className: 'btn secondary',
        onClick: () => {
          helpUsedFlag = true;
          engine.markHelpUsedForWord(word.id);
          bodyEl.appendChild(el('p', 'text-hint', `Hinweis: ${word.transliteration || ''} — ${ExerciseRegistry.primaryGerman(word)}`.trim()));
        }
      },
      { label: 'Audio', className: 'btn secondary', onClick: (btn) => AudioPlayer.speakWord(word, { context: 'Geführte Eingabe', button: btn }) }
    ];
    SessionRenderer.renderActionBar(actionBar, {
      leftButtons: inputLeftButtons,
      rightButtons: checkAction ? [{ label: 'Prüfen', onClick: () => checkAction() }] : []
    });

    if (settings.autoPlayWord) {
      AudioPlayer.speakWord(word, { context: 'Geführte Eingabe (automatisch)' });
    }
  }

  // --- Abschluss (Entwicklungsauftrag 5, Abschnitt 25) ----------------------------------------
  function renderSummaryPhase() {
    // Entwicklungsauftrag 13, Abschnitt 6.3 — die Zusammenfassung startet keine automatische
    // Wiedergabe; eine bis hierhin noch laufende Aufnahme (z. B. aus der letzten Aufgabe) darf
    // hier nicht unbemerkt weiterlaufen.
    AudioPlayer.stopCurrentAudio();
    const { bodyEl } = SessionRenderer.renderSessionShell(container, {
      sessionDef,
      phaseIndex: engine.phases.length - 1,
      progressLabel: null,
      progressPercent: 100,
      onTheory: () => renderTheoryReview(renderSummaryPhase),
      onLeave: confirmLeave
    });

    const passed = engine.checkCompletion();
    const securelyKnown = words.filter((w) => SessionCoverageTracker.isSecurelyKnown(engine.coverage, w.id));
    const needsPractice = words.filter((w) => !SessionCoverageTracker.isSecurelyKnown(engine.coverage, w.id));
    const independentCount = words.filter((w) => SessionCoverageTracker.entryFor(engine.coverage, w.id).independent_attempts > 0).length;

    const card = el('div', 'card');
    card.appendChild(el('p', 'lead', passed ? 'Session abgeschlossen 🎉' : 'Session beendet — ein erneuter Versuch könnte helfen.'));
    card.appendChild(el('p', null, `${securelyKnown.length} von ${words.length} Wörtern sicher erkannt`));
    card.appendChild(el('p', null, `${independentCount} von ${words.length} selbstständig geschrieben`));
    if (needsPractice.length > 0) card.appendChild(el('p', null, `${needsPractice.length} Wörter sollten wiederholt werden`));
    card.appendChild(el('p', null, `Gesamt: ${Math.round(engine.weightedScorePercent() * 100)} %`));
    bodyEl.appendChild(card);

    if (securelyKnown.length > 0) {
      const goodCard = el('div', 'card');
      goodCard.appendChild(el('p', 'lead', 'Sehr gut'));
      securelyKnown.forEach((w) => goodCard.appendChild(el('p', null, `${w.arabic} — ${ExerciseRegistry.primaryGerman(w)}`)));
      bodyEl.appendChild(goodCard);
    }
    if (needsPractice.length > 0) {
      const practiceCard = el('div', 'card');
      practiceCard.appendChild(el('p', 'lead', 'Noch üben'));
      needsPractice.forEach((w) => {
        const entry = SessionCoverageTracker.entryFor(engine.coverage, w.id);
        const row = el('div', 'word-card');
        row.appendChild(el('p', 'arabic-word-main', w.arabic));
        row.appendChild(el('p', 'word-card-translation', ExerciseRegistry.primaryGerman(w)));
        row.appendChild(el('p', 'text-hint', `${entry.errors} Fehler`));
        row.appendChild(mkBtn('Noch einmal anhören', 'btn secondary', (btn) => AudioPlayer.speakWord(w, { context: 'Session-Zusammenfassung', button: btn })));
        practiceCard.appendChild(row);
      });
      bodyEl.appendChild(practiceCard);
    }

    const actions = document.createElement('div');
    actions.style.display = 'flex';
    actions.style.gap = '10px';
    actions.style.flexWrap = 'wrap';
    actions.style.marginTop = '16px';
    if (needsPractice.length > 0) {
      actions.appendChild(mkBtn('Schwierige Wörter wiederholen', 'btn secondary', () => {
        App.navigateToFreePractice({ presetFilters: { categories: { letters: false, vocabulary: true, connections: false }, difficultOnly: true } });
      }));
    }
    actions.appendChild(mkBtn('Zur Unit', 'btn secondary', async () => {
      if (passed) await SessionState.complete(sessionDef.session_id); else await persistSnapshot();
      goToUnit();
    }));
    const nextId = nextSessionInUnit();
    if (nextId) {
      actions.appendChild(mkBtn('Nächste Session', 'btn', async () => {
        if (passed) await SessionState.complete(sessionDef.session_id); else await persistSnapshot();
        App.navigateToSession(unitId, nextId);
      }));
    }
    bodyEl.appendChild(actions);
    bodyEl.appendChild(mkBtn('Session verwerfen und neu starten', 'btn secondary', () => confirmDiscard(() => mount(container, { unitId, sessionId: sessionDef.session_id }))));
  }

  function renderCurrentPhase() {
    const type = engine.currentPhaseType();
    if (!type) { renderSummaryPhase(); return; }
    if (type === 'theory') {
      if (engine.theoryDone) { engine.advancePhase(); renderCurrentPhase(); return; }
      renderTheoryPhase();
      return;
    }
    if (type === 'word_preview') { renderWordLearningPhase(); return; }
    if (type === 'summary') { renderSummaryPhase(); return; }
    renderGradedPhase();
  }

  async function mount(el2, { unitId: uid, sessionId }) {
    container = el2;
    unitId = uid;
    container.innerHTML = '<div class="loading-placeholder">Lädt…</div>';
    App.registerCleanup(() => { if (activeGuard) activeGuard.destroy(); });
    learnGroups = null;

    pack = await AppState.getLanguagePack();
    sessionDef = pack.vocabSessions.sessions.find((s) => s.session_id === sessionId);
    vocabUnit = pack.vocabSessions.vocab_units.find((u) => u.id === unitId);
    if (!sessionDef) {
      container.innerHTML = '<div class="empty-state">Diese Session wurde nicht gefunden.</div>';
      return;
    }
    const allPackWords = pack.vocabulary.categories.flatMap((c) => c.words);
    const fullWordList = SessionEngine.buildWordList(sessionDef, allPackWords);

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
    const canResume = !!resumedState && resumedState.status !== 'completed';
    sessionWasResumable = canResume;

    if (canResume) {
      const activeIds = resumedState.activeNewWordIds || sessionDef.new_word_ids;
      words = activeIds.map((id) => fullWordList.find((w) => w.id === id)).filter(Boolean);
      reviewWords = (resumedState.reviewWordIds || []).map((id) => allPackWords.find((w) => w.id === id)).filter(Boolean);
      engine = SessionEngine.create({ sessionDef, words, reviewWords, resumedState });
      renderSessionOverview();
      return;
    }

    const settings = AppState.getSettings();
    const dailyNewLimit = ReviewScheduler.ALLOWED_DAILY_LIMITS.includes(settings.dailyNewLimit)
      ? settings.dailyNewLimit
      : ReviewScheduler.DEFAULT_DAILY_NEW_LIMIT;
    const remainingToday = Math.max(0, dailyNewLimit - AppState.getDailyNewCount());

    if (remainingToday > 0 && remainingToday < fullWordList.length) {
      renderDailyLimitChoice(fullWordList, remainingToday, allPackWords);
    } else {
      await startFreshSession(fullWordList, allPackWords);
    }
  }

  return { mount };
})();
