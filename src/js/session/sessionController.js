// SessionController (Entwicklungsauftrag 4, Schritt 3; grundlegend erweitert in
// Entwicklungsauftrag 5; Lernstufen 1-5 neu aufgebaut in Entwicklungsauftrag 15; Stufen 6-10
// endgültig umgesetzt in Entwicklungsauftrag 16) — verbindet SessionEngine (Logik),
// SessionRenderer (einheitlicher Stufenrahmen "Stufe N von 10"), ExerciseRegistry (Aufgaben,
// inkl. Zuordnungsgruppen), TheoryRenderer (Theorie/Mini-Check), WordRelations
// (Zusatzinformationen zu Wörtern) und SessionState (Wiederaufnahme) zu einer vollständigen
// Session. Einstiegspunkt: App.navigateToSession(unitId, sessionId) -> SessionController.mount().
//
// Vollständiger Ablauf (Entwicklungsauftrag 16, Abschnitt 1): Lernziele (1) -> kurze Theorie ohne
// Pflicht-Mini-Check (2) -> neue Wörter als Lernkarten (3) -> Audio kennenlernen (4) ->
// Wortübersicht (5) -> leichtes Wiedererkennen (6) -> Zuordnungsaufgaben (7) -> Schreiben mit
// Hilfe (8, zwei Unteraufgaben "Wort zusammensetzen"/"Wort mit Hilfe eingeben") -> freies
// Schreiben ohne Hilfe (9) -> Zusammenfassung (10). Feedback verschwindet nie automatisch — jede
// Aufgabe endet mit einem manuellen "Weiter"-Klick, außer die Einstellung
// "autoAdvanceAfterFeedback" ist aktiv UND die Antwort war richtig (Abschnitt 21 aus
// Entwicklungsauftrag 5, unverändert).
//
// Die fünf Lernstufen 1-5 bilden weiterhin (unverändert seit Auftrag 15) nur die ersten beiden
// technischen Phasentypen ('theory', 'word_preview') feiner ab. Stufen 6-10 entsprechen jetzt
// DIREKT den vier gradierten technischen Phasentypen (recognition/matching/guided_writing/
// independent_writing) plus 'summary' — siehe learningStages.js/phaseRegistry.js. Nur EIN
// sichtbares Fortschrittssystem (SessionRenderer.renderLearningStageShell) für die gesamte
// Session, kein separater alter Phasen-Stepper mehr (Abschnitt 14). Kein zweiter
// Speichermechanismus, keine zweite Session-Engine.

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
  let allPackWordsCache = null; // voller Wortpool aller Units — für WordRelations (Abschnitt 9.6)

  // Zustand der Lernstufen 1-5 (Entwicklungsauftrag 15, Abschnitt 11) — lebt im Session-Snapshot
  // (siehe persistSnapshot()/migrateLearningStageState()), NICHT nur im Speicher wie früher.
  let learningStageState = null;
  let lastAutoPlayedCardWordId = null; // Abschnitt 12.3: kein erneutes Auto-Abspielen bei bloßem Re-Render
  let lastAutoPlayedAudioWordId = null;
  let learningKeydownHandler = null; // aktueller document-weiter keydown-Listener (Stufe 3/4)

  const SKILL_BY_PHASE = {
    recognition: 'recognition',
    matching: 'matching',
    guided_writing: 'guided_writing',
    independent_writing: 'independent_writing'
  };

  // Kleine, rein grammatische Zahlwort-Tabelle für die Lernziel-Ersatzformulierung (Abschnitt 7) —
  // keine neuen sprachlichen INHALTE, nur die deutsche Schreibweise einer bereits bekannten Zahl
  // (der tatsächlichen Wortanzahl dieser Session).
  const GERMAN_COUNT_WORDS = {
    1: 'ein', 2: 'zwei', 3: 'drei', 4: 'vier', 5: 'fünf', 6: 'sechs', 7: 'sieben', 8: 'acht',
    9: 'neun', 10: 'zehn', 11: 'elf', 12: 'zwölf', 13: 'dreizehn', 14: 'vierzehn', 15: 'fünfzehn'
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

  function mkIconBtn(icon, label, onClick) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn icon';
    btn.textContent = icon;
    btn.setAttribute('aria-label', label);
    btn.addEventListener('click', () => onClick(btn));
    return btn;
  }

  function allSessionWords() {
    return words.concat(reviewWords);
  }

  function freshGuard() {
    if (activeGuard) activeGuard.destroy();
    activeGuard = ExerciseGuard.create();
    return activeGuard;
  }

  // --- Tastaturnavigation der Lernkarten/Audio-Phase (Entwicklungsauftrag 15, Abschnitt 10) ----
  // Pfeil links/rechts = vorherige/nächste Karte, Leertaste = Audio (NUR wenn der Fokus nicht auf
  // einem Button/Eingabefeld liegt, damit eine normale Buttonbedienung — z. B. per Leertaste einen
  // fokussierten Button auslösen — nicht überschrieben wird). Immer NUR EIN aktiver Listener
  // gleichzeitig (detachLearningKeydown() räumt vor jedem neuen attach zuerst auf).
  function detachLearningKeydown() {
    if (learningKeydownHandler) {
      document.removeEventListener('keydown', learningKeydownHandler);
      learningKeydownHandler = null;
    }
  }

  function attachWordCardKeydown(onNext, onPrev, onAudio) {
    detachLearningKeydown();
    learningKeydownHandler = (event) => {
      const tag = ((event.target && event.target.tagName) || '').toLowerCase();
      const isFormField = tag === 'input' || tag === 'textarea' || tag === 'select' || tag === 'button';
      if (event.key === 'ArrowRight') {
        if (isFormField && (tag === 'input' || tag === 'textarea')) return;
        onNext();
        return;
      }
      if (event.key === 'ArrowLeft') {
        if (isFormField && (tag === 'input' || tag === 'textarea')) return;
        onPrev();
        return;
      }
      if ((event.key === ' ' || event.key === 'Spacebar') && !isFormField) {
        if (onAudio) onAudio();
      }
    };
    document.addEventListener('keydown', learningKeydownHandler);
  }

  async function persistSnapshot() {
    await SessionState.save(sessionDef.session_id, {
      ...engine.snapshot(),
      activeNewWordIds: words.map((w) => w.id),
      learningStageState
    });
  }

  function unitTitle() {
    return vocabUnit ? vocabUnit.title : unitId;
  }

  function goToUnit() {
    detachLearningKeydown();
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

  // Entwicklungsauftrag 15, Abschnitt 8: normale/langsame Audiowiedergabe für die Wortkarten
  // INNERHALB der Theorie (theoryRenderer.js#renderWordPreview) — nutzt den vollwertigen
  // Wort-Einstiegspunkt AudioPlayer.speakWord() (zentraler Schlüssel, Doppelklick-Schutz,
  // sichtbares Fehlerfeedback), nicht den schlankeren Text-Wrapper oben.
  function playTheoryWordAudio(word, { slow, button }) {
    return AudioPlayer.speakWord(word, { slow, context: 'Theorie-Wortvorschau', button });
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

  // --- Lernstufen-Zustand: Standardwert, Migration alter Snapshots (Abschnitt 11/18) -----------
  function defaultLearningStageState() {
    return {
      stage: LearningStages.first(),
      cardIndex: 0,
      confirmedWordIds: [],
      audioIndex: 0,
      audioHeardNormal: [],
      audioHeardSlow: []
    };
  }

  /**
   * @param {object|null} raw - resumedState.learningStageState (kann fehlen: altes Snapshot-Format)
   * @param {object} coverage - engine.coverage (bereits migriert/vorhanden)
   * @param {object[]} sessionWords - words dieser Session
   */
  function migrateLearningStageState(raw, coverage, sessionWords) {
    if (raw && LearningStages.isValid(raw.stage)) {
      return {
        stage: raw.stage,
        cardIndex: typeof raw.cardIndex === 'number' && raw.cardIndex >= 0 ? raw.cardIndex : 0,
        confirmedWordIds: Array.isArray(raw.confirmedWordIds) ? raw.confirmedWordIds : [],
        audioIndex: typeof raw.audioIndex === 'number' && raw.audioIndex >= 0 ? raw.audioIndex : 0,
        audioHeardNormal: Array.isArray(raw.audioHeardNormal) ? raw.audioHeardNormal : [],
        audioHeardSlow: Array.isArray(raw.audioHeardSlow) ? raw.audioHeardSlow : []
      };
    }
    // Kein/kaputtes Feld -- ein Snapshot aus der Zeit vor Entwicklungsauftrag 15 (Abschnitt 18:
    // "alte Session-Snapshots ohne dieses Feld müssen weiterhin geladen werden können", "sichere
    // Standardposition bestimmen"). Wird NUR erreicht, wenn phaseIndex noch bei 'word_preview'
    // steht -- eine Session, die bereits eine Übungsphase (phaseIndex>=2) erreicht hat, durchläuft
    // diesen Pfad nie (renderCurrentPhase() befragt learningStageState dort gar nicht erst).
    const state = defaultLearningStageState();
    if (coverage && Array.isArray(sessionWords)) {
      const seenIds = sessionWords.filter((w) => coverage[w.id] && coverage[w.id].preview_seen).map((w) => w.id);
      state.confirmedWordIds = seenIds;
      state.cardIndex = Math.min(seenIds.length, Math.max(0, sessionWords.length - 1));
    }
    return state;
  }

  // --- Stufe 1: Lernziele/Sessionübersicht (Entwicklungsauftrag 15, Abschnitt 7) ---------------
  function fallbackLearningGoals() {
    const count = words.length;
    const countWord = GERMAN_COUNT_WORDS[count] || String(count);
    const topic = vocabUnit ? vocabUnit.title : sessionDef.title;
    return [
      `${countWord} Wörter zu ${topic}`,
      'die Wörter zu erkennen und auszusprechen',
      'sie anschließend in Übungen selbst anzuwenden'
    ];
  }

  function learningGoalsForOverview() {
    const doc = theoryDoc();
    return (doc && Array.isArray(doc.learning_objectives) && doc.learning_objectives.length > 0)
      ? doc.learning_objectives
      : fallbackLearningGoals();
  }

  /** "aktuelle gespeicherte Stufe nennen" bei Wiederaufnahme (Abschnitt 7) — ehrlich (Abschnitt 6):
   * ab den bestehenden Übungsphasen erscheint KEINE erfundene Stufe 6-10, sondern der neutrale
   * Übergangstext. */
  // Entwicklungsauftrag 16, Abschnitt 4/14: Stufen 6-10 entsprechen jetzt DIREKT den technischen
  // Phasentypen (recognition/matching/guided_writing/independent_writing/summary) — nur
  // theory/word_preview brauchen weiterhin die feinere Auflösung über learningStageState
  // (Stufen 1-5, unverändert seit Auftrag 15).
  function currentLearningStageKey() {
    if (!engine) return LearningStages.first();
    const type = engine.currentPhaseType();
    if (type === 'theory') return 'theory';
    if (type === 'word_preview') {
      return (learningStageState && LearningStages.isValid(learningStageState.stage)) ? learningStageState.stage : 'word_cards';
    }
    if (type && LearningStages.isValid(type)) return type;
    return 'summary';
  }

  function resumedStageLabel() {
    const stage = LearningStages.get(currentLearningStageKey());
    return `Stufe ${stage.number} von ${LearningStages.TOTAL_DISPLAY_STAGES} – ${stage.label}`;
  }

  function renderSessionOverview() {
    detachLearningKeydown();
    const view = el('div', 'view page-content');
    view.appendChild(el('h1', 'text-page-title', sessionDef.title));

    const metaCard = el('div', 'card');
    metaCard.appendChild(el('p', 'text-hint', `Unit: ${unitTitle()}`));
    metaCard.appendChild(el('p', 'lead', `${words.length} neue Wörter`));
    if (reviewWords.length > 0) metaCard.appendChild(el('p', 'text-body', `${reviewWords.length} eingemischte Wiederholungen aus früheren Sessions`));
    metaCard.appendChild(el('p', 'text-hint', `ca. ${sessionDef.estimated_minutes} Minuten`));
    view.appendChild(metaCard);

    const goalsCard = el('div', 'card');
    goalsCard.appendChild(el('p', 'lead', 'In dieser Session lernst du'));
    const ul = document.createElement('ul');
    learningGoalsForOverview().forEach((g) => ul.appendChild(el('li', null, g)));
    goalsCard.appendChild(ul);
    view.appendChild(goalsCard);

    const flowCard = el('div', 'card');
    flowCard.appendChild(el('p', 'lead', 'Ablauf'));
    // Entwicklungsauftrag 16: LearningStages.STAGES deckt bereits alle 10 sichtbaren Stufen ab
    // (inkl. Stufe 10 "Zusammenfassung") -- ein früher hier angehängtes zusätzliches "Übungen"
    // war ein Relikt aus der Zeit vor Auftrag 16 (als STAGES nur 1-5 kannte) und darf laut
    // Abschnitt 4 nicht mehr erscheinen.
    const stageLabels = LearningStages.STAGES.map((s) => s.label);
    flowCard.appendChild(el('p', 'text-hint', stageLabels.join(' → ')));
    view.appendChild(flowCard);

    const actions = document.createElement('div');
    actions.className = 'action-bar-left';
    actions.style.display = 'flex';
    actions.style.gap = '10px';
    actions.style.flexWrap = 'wrap';
    actions.style.marginTop = '8px';
    if (sessionWasResumable) {
      view.appendChild(el('p', 'text-hint', `Du bist bei: ${resumedStageLabel()}`));
      actions.appendChild(mkBtn('Session fortsetzen', 'btn', () => renderCurrentPhase()));
      actions.appendChild(mkBtn('Von vorne beginnen', 'btn secondary', () => confirmDiscard(() => mount(container, { unitId, sessionId: sessionDef.session_id }))));
    } else {
      actions.appendChild(mkBtn('Lernen beginnen', 'btn', () => renderCurrentPhase()));
      actions.appendChild(mkBtn('Theorie ansehen', 'btn secondary', () => renderTheoryReview(renderSessionOverview)));
    }
    actions.appendChild(mkBtn('Zurück', 'btn secondary', goToUnit));
    view.appendChild(actions);

    while (container.firstChild) container.removeChild(container.firstChild);
    container.appendChild(view);
  }

  // --- Tageslimit (Entwicklungsauftrag 5, Abschnitt 11) — nur beim allerersten Start relevant --
  function renderDailyLimitChoice(fullWordList, remainingToday, allPackWords) {
    detachLearningKeydown();
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
    learningStageState = defaultLearningStageState();
    sessionWasResumable = false;
    await SessionState.initNew(sessionDef.session_id);
    await persistSnapshot();
    renderSessionOverview();
  }

  // --- Stufe 2: Theorie (KEIN verpflichtender Mini-Check mehr, Abschnitt 8) --------------------
  function theoryDoc() {
    return pack.theory.theories.find((t) => t.theory_id === sessionDef.theory_id);
  }

  function renderTheoryPhase() {
    detachLearningKeydown();
    freshGuard();
    const { bodyEl, actionBar } = SessionRenderer.renderLearningStageShell(container, {
      sessionDef,
      stageKey: 'theory',
      onTheory: () => {}, // wir sind bereits in der Theorie
      onLeave: confirmLeave
    });
    SessionRenderer.clearActionBar(actionBar);

    TheoryRenderer.mount(bodyEl, theoryDoc(), {
      mode: 'learning_intro', // Abschnitt 8: keine Mini-Checks, kein Pflicht-Gate
      registerGuard: () => {},
      getWordById: (id) => allSessionWords().find((w) => w.id === id),
      onPlayAudio: playTheoryAudio,
      onPlayWordAudio: playTheoryWordAudio,
      onStart: async () => {
        engine.theoryDone = true;
        engine.advancePhase();
        learningStageState = defaultLearningStageState(); // frischer Eintritt in Stufe 3
        await persistSnapshot();
        renderCurrentPhase();
      }
    });
  }

  // Theorie jederzeit erneut ansehen, OHNE den Sessionfortschritt zu verändern (Abschnitt 16:
  // Audio stoppen, Zustand speichern, danach exakt zur vorherigen Ansicht zurückkehren, keine
  // Karte automatisch als gesehen markieren, keine Stufe automatisch abschließen). UNVERÄNDERT
  // gegenüber Entwicklungsauftrag 5/13: Mini-Checks bleiben hier weiterhin sichtbar (Abschnitt 8,
  // letzter Absatz — kein mode:'learning_intro').
  function renderTheoryReview(returnToPhase) {
    detachLearningKeydown();
    AudioPlayer.stopCurrentAudio();
    const { bodyEl, actionBar } = SessionRenderer.renderLearningStageShell(container, {
      sessionDef,
      stageKey: currentLearningStageKey(),
      subLabel: 'Theorie (erneut angesehen — dein Fortschritt bleibt erhalten)',
      onTheory: () => {},
      onLeave: confirmLeave
    });
    SessionRenderer.clearActionBar(actionBar);
    TheoryRenderer.mount(bodyEl, theoryDoc(), {
      getWordById: (id) => allSessionWords().find((w) => w.id === id),
      onPlayAudio: playTheoryAudio,
      onPlayWordAudio: playTheoryWordAudio,
      onMiniCheckComplete: () => {},
      startLabel: 'Zurück zur Übung',
      onStart: returnToPhase
    });
  }

  // --- Stufe 3: neue Wörter als Lernkarten (Entwicklungsauftrag 15, Abschnitt 9/10/11) ---------
  function currentWordCard() {
    return words[learningStageState.cardIndex];
  }

  // preview_seen (Tageslimit-Grundlage) wird ERST beim ausdrücklichen Weitergehen gesetzt, nie
  // durchs bloße Rendern (Abschnitt 10: "Bloßes Öffnen und sofortiges Schließen darf nicht alle
  // Wörter als gesehen markieren").
  function confirmWordCard(word) {
    const firstTime = engine.markWordPreviewSeen(word.id);
    if (firstTime) AppState.incrementDailyNewCount(1);
    if (!learningStageState.confirmedWordIds.includes(word.id)) {
      learningStageState.confirmedWordIds.push(word.id);
    }
  }

  function advanceFromWordCard() {
    const word = currentWordCard();
    if (!word) return;
    AudioPlayer.stopCurrentAudio(); // keine über die Kartennavigation hinweg weiterlaufende Wiedergabe
    confirmWordCard(word);
    if (learningStageState.cardIndex + 1 >= words.length) {
      learningStageState.stage = 'audio_familiarization';
      persistSnapshot();
      renderCurrentPhase();
      return;
    }
    learningStageState.cardIndex += 1;
    persistSnapshot();
    renderCurrentPhase();
  }

  function goBackWordCard() {
    if (learningStageState.cardIndex > 0) {
      AudioPlayer.stopCurrentAudio();
      learningStageState.cardIndex -= 1;
      persistSnapshot();
      renderCurrentPhase();
    }
  }

  function buildExtraInfoDetails(word) {
    const details = document.createElement('details');
    details.className = 'word-card-extra';
    const summary = document.createElement('summary');
    summary.textContent = 'Weitere Informationen';
    details.appendChild(summary);

    const homonyms = WordRelations.homonymGroupWords(word, allPackWordsCache);
    if (homonyms.length > 0) {
      details.appendChild(el('p', 'text-hint', `Homonyme (gleich geschrieben, andere Bedeutung): ${homonyms.map((w) => `${w.arabic} (${ExerciseRegistry.primaryGerman(w)})`).join(', ')}`));
    }
    const confusions = WordRelations.confusionGroupWords(word, allPackWordsCache);
    if (confusions.length > 0) {
      details.appendChild(el('p', 'text-hint', `Leicht zu verwechseln mit: ${confusions.map((w) => `${w.arabic} (${ExerciseRegistry.primaryGerman(w)})`).join(', ')}`));
    }
    const opposite = WordRelations.oppositeWord(word, allPackWordsCache);
    if (opposite) {
      details.appendChild(el('p', 'text-hint', `Gegenteil: ${opposite.arabic} (${ExerciseRegistry.primaryGerman(opposite)})`));
    }
    const otherForms = WordRelations.otherAcceptedArabicForms(word);
    if (otherForms.length > 0) {
      details.appendChild(el('p', 'text-hint arabic-text', `Weitere akzeptierte Schreibweisen: ${otherForms.join(', ')}`));
    }
    return details;
  }

  function renderDifficultToggle(word) {
    const isDifficult = AppState.isWordMarkedDifficult(word.id);
    return mkBtn(
      isDifficult ? 'Nicht mehr als schwierig markieren' : 'Als schwierig markieren',
      'btn secondary btn-small',
      async () => { await AppState.toggleWordDifficult(word.id); renderCurrentPhase(); }
    );
  }

  function renderWordCardsStage() {
    const word = currentWordCard();
    if (!word) { // Sicherheitsnetz: Session ohne neue Wörter (praktisch nie, aber kein Absturz)
      learningStageState.stage = 'word_overview';
      persistSnapshot();
      renderCurrentPhase();
      return;
    }
    const { bodyEl, actionBar } = SessionRenderer.renderLearningStageShell(container, {
      sessionDef,
      stageKey: 'word_cards',
      subProgress: words.length > 0 ? learningStageState.cardIndex / words.length : 0,
      subLabel: `Wort ${learningStageState.cardIndex + 1} von ${words.length}`,
      onTheory: () => renderTheoryReview(renderCurrentPhase),
      onLeave: confirmLeave
    });
    SessionRenderer.clearActionBar(actionBar);

    const settings = AppState.getSettings();
    const card = el('div', 'card word-card');
    card.appendChild(el('p', 'arabic-word-main', word.arabic_vocalized || word.arabic));
    card.appendChild(el('p', 'word-card-translation', ExerciseRegistry.primaryGerman(word)));
    if (settings.showTransliteration !== false && word.transliteration) {
      card.appendChild(el('p', 'word-card-translit', word.transliteration));
    }

    const audioActions = document.createElement('div');
    audioActions.className = 'word-card-actions';
    audioActions.appendChild(mkIconBtn('🔊', `${word.german} anhören`, (btn) => AudioPlayer.speakWord(word, { context: 'Lernkarte', button: btn })));
    audioActions.appendChild(mkIconBtn('🐢', `${word.german} langsam anhören`, (btn) => AudioPlayer.speakWord(word, { slow: true, context: 'Lernkarte', button: btn })));
    card.appendChild(audioActions);

    const metaBits = [];
    if (word.part_of_speech) metaBits.push(word.part_of_speech);
    if (word.gender) metaBits.push(word.gender);
    if (word.plural) metaBits.push(`Plural: ${word.plural}`);
    if (metaBits.length > 0) card.appendChild(el('p', 'word-card-meta', metaBits.join(' · ')));

    const altAnswers = ExerciseRegistry.germanAnswers(word).slice(1);
    if (altAnswers.length > 0) card.appendChild(el('p', 'text-hint', `Weitere Bedeutungen: ${altAnswers.join(', ')}`));

    const prompt = Array.isArray(word.application_prompts) && word.application_prompts.length > 0 ? word.application_prompts[0] : null;
    if (prompt && prompt.prompt) {
      const exWrap = el('div', 'theory-callout theory-callout-info');
      exWrap.appendChild(el('p', 'theory-callout-title', 'Anwendungsbeispiel'));
      exWrap.appendChild(el('p', null, prompt.prompt));
      if (prompt.expected_meaning) exWrap.appendChild(el('p', 'text-hint', `→ ${prompt.expected_meaning}`));
      card.appendChild(exWrap);
    }

    if (WordRelations.hasAnyExtraInfo(word, allPackWordsCache)) {
      card.appendChild(buildExtraInfoDetails(word));
    }

    card.appendChild(renderDifficultToggle(word));
    bodyEl.appendChild(card);

    // settings.slowPlayback (bereits vor Entwicklungsauftrag 15 vorhanden) bleibt hier wirksam --
    // die dedizierte langsame Wiedergabe wird erst in Stufe 4 unabhängig vom globalen Schalter
    // eingeführt (Abschnitt 12.3: dort ausdrücklich IMMER "einmal normal").
    if (settings.autoPlayWord && lastAutoPlayedCardWordId !== word.id) {
      AudioPlayer.speakWord(word, { slow: !!settings.slowPlayback, context: 'Lernkarte (automatisch)' });
    }
    lastAutoPlayedCardWordId = word.id;

    const isFirst = learningStageState.cardIndex === 0;
    SessionRenderer.renderActionBar(actionBar, {
      leftButtons: isFirst ? [] : [{ label: '← Zurück', className: 'btn secondary', onClick: goBackWordCard }],
      rightButtons: [{ label: 'Weiter →', onClick: advanceFromWordCard }]
    });

    attachWordCardKeydown(advanceFromWordCard, goBackWordCard, () => AudioPlayer.speakWord(word, { context: 'Lernkarte (Tastatur)' }));
  }

  // --- Stufe 4: Audio kennenlernen (Entwicklungsauftrag 15, Abschnitt 12) ----------------------
  function playAudioFamiliarization(word, slow, btn, statusEl) {
    AudioPlayer.stopCurrentAudio();
    if (statusEl) statusEl.textContent = 'Wird abgespielt …';
    const list = slow ? learningStageState.audioHeardSlow : learningStageState.audioHeardNormal;
    if (!list.includes(word.id)) list.push(word.id);
    persistSnapshot();
    return AudioPlayer.speakWord(word, { slow, context: 'Audio kennenlernen', button: btn }).then((result) => {
      if (statusEl) statusEl.textContent = result.source === 'failed' ? 'Wiedergabe nicht möglich' : 'Abgespielt';
      return result;
    });
  }

  function goToAudioIndex(idx) {
    if (idx < 0) return;
    // Abschnitt 12.2: "Audio beim Wort- oder Stufenwechsel stoppen" -- unabhängig davon, ob am
    // neuen Wort automatisch erneut abgespielt wird, darf eine noch laufende Wiedergabe vom
    // VORHERIGEN Wort nicht einfach unbemerkt weiterlaufen.
    AudioPlayer.stopCurrentAudio();
    if (idx >= words.length) {
      learningStageState.stage = 'word_overview';
      persistSnapshot();
      renderCurrentPhase();
      return;
    }
    learningStageState.audioIndex = idx;
    persistSnapshot();
    renderCurrentPhase();
  }

  function renderAudioFamiliarizationStage() {
    const word = words[learningStageState.audioIndex];
    if (!word) {
      learningStageState.stage = 'word_overview';
      persistSnapshot();
      renderCurrentPhase();
      return;
    }
    const { bodyEl, actionBar } = SessionRenderer.renderLearningStageShell(container, {
      sessionDef,
      stageKey: 'audio_familiarization',
      subProgress: words.length > 0 ? learningStageState.audioIndex / words.length : 0,
      subLabel: `Audio ${learningStageState.audioIndex + 1} von ${words.length}`,
      onTheory: () => renderTheoryReview(renderCurrentPhase),
      onLeave: confirmLeave
    });
    SessionRenderer.clearActionBar(actionBar);

    const settings = AppState.getSettings();
    const card = el('div', 'card word-card');
    card.appendChild(el('p', 'arabic-word-main', word.arabic_vocalized || word.arabic));
    card.appendChild(el('p', 'word-card-translation', ExerciseRegistry.primaryGerman(word)));
    if (settings.showTransliteration !== false && word.transliteration) {
      card.appendChild(el('p', 'word-card-translit', word.transliteration));
    }
    const statusEl = el('p', 'text-hint', 'Bereit');
    card.appendChild(statusEl);

    const audioActions = document.createElement('div');
    audioActions.className = 'word-card-actions';
    audioActions.appendChild(mkIconBtn('🔊', `${word.german} normal anhören`, (btn) => playAudioFamiliarization(word, false, btn, statusEl)));
    audioActions.appendChild(mkIconBtn('🐢', `${word.german} langsam anhören`, (btn) => playAudioFamiliarization(word, true, btn, statusEl)));
    card.appendChild(audioActions);
    bodyEl.appendChild(card);

    if (settings.autoPlayWord && lastAutoPlayedAudioWordId !== word.id) {
      playAudioFamiliarization(word, false, null, statusEl);
    }
    lastAutoPlayedAudioWordId = word.id;

    const isFirst = learningStageState.audioIndex === 0;
    SessionRenderer.renderActionBar(actionBar, {
      leftButtons: isFirst ? [] : [{ label: '← Vorheriges Wort', className: 'btn secondary', onClick: () => goToAudioIndex(learningStageState.audioIndex - 1) }],
      rightButtons: [{ label: 'Weiter →', onClick: () => goToAudioIndex(learningStageState.audioIndex + 1) }]
    });

    attachWordCardKeydown(
      () => goToAudioIndex(learningStageState.audioIndex + 1),
      () => goToAudioIndex(learningStageState.audioIndex - 1),
      () => playAudioFamiliarization(word, false, null, statusEl)
    );
  }

  // --- Stufe 5: gemeinsame Wortübersicht (Entwicklungsauftrag 15, Abschnitt 13) -----------------
  function renderWordOverviewStage() {
    detachLearningKeydown();
    const { bodyEl, actionBar } = SessionRenderer.renderLearningStageShell(container, {
      sessionDef,
      stageKey: 'word_overview',
      onTheory: () => renderTheoryReview(renderCurrentPhase),
      onLeave: confirmLeave
    });
    SessionRenderer.clearActionBar(actionBar);

    const settings = AppState.getSettings();
    const grid = document.createElement('div');
    grid.className = 'word-grid';
    words.forEach((w) => {
      const card = el('div', 'card word-card');
      // Abschnitt 13.2: "keine abgeschnittenen arabischen Wörter" -- in der kompakten Übersicht
      // die mittlere statt der großen Lernwort-Schriftgröße verwenden (.arabic-word-main ist für
      // Stufe 3 gedacht, wo genau EIN Wort/Ausdruck die ganze Kartenbreite für sich hat).
      card.appendChild(el('p', 'arabic-example', w.arabic_vocalized || w.arabic));
      card.appendChild(el('p', 'word-card-translation', ExerciseRegistry.primaryGerman(w)));
      if (settings.showTransliteration !== false && w.transliteration) card.appendChild(el('p', 'word-card-translit', w.transliteration));
      if (w.part_of_speech) card.appendChild(el('p', 'word-card-meta', w.part_of_speech));
      const actions = document.createElement('div');
      actions.className = 'word-card-actions';
      actions.appendChild(mkIconBtn('🔊', `${w.german} anhören`, (btn) => AudioPlayer.speakWord(w, { context: 'Wortübersicht', button: btn })));
      actions.appendChild(mkIconBtn('🐢', `${w.german} langsam anhören`, (btn) => AudioPlayer.speakWord(w, { slow: true, context: 'Wortübersicht', button: btn })));
      card.appendChild(actions);
      card.appendChild(renderDifficultToggle(w));
      grid.appendChild(card);
    });
    bodyEl.appendChild(grid);
    // Abschnitt 6: ehrlicher Übergang, statt eine bereits umgesetzte Stufe 6-10 zu behaupten.
    bodyEl.appendChild(el('p', 'text-hint', LearningStages.AFTER_STAGE_5_LABEL));

    SessionRenderer.renderActionBar(actionBar, {
      leftButtons: [
        {
          label: '← Zurück zu den Lernkarten',
          className: 'btn secondary',
          onClick: () => { learningStageState.stage = 'word_cards'; persistSnapshot(); renderCurrentPhase(); }
        },
        {
          label: 'Audio noch einmal üben',
          className: 'btn secondary',
          onClick: () => { learningStageState.stage = 'audio_familiarization'; learningStageState.audioIndex = 0; persistSnapshot(); renderCurrentPhase(); }
        }
      ],
      rightButtons: [{
        label: 'Weiter zu den Übungen',
        onClick: () => {
          engine.advancePhase();
          persistSnapshot();
          renderCurrentPhase();
        }
      }]
    });
  }

  // --- Wiedererkennen/Rekonstruieren/Produktion/Anwendung (aufgabenbasierte Phasen, UNVERÄNDERT
  // gegenüber Entwicklungsauftrag 13) -----------------------------------------------------------
  // Entwicklungsauftrag 16, Abschnitt 8.4/14: "Teil 1: Wort zusammensetzen"/"Teil 2: Wort mit
  // Hilfe eingeben" innerhalb von Stufe 8, plus die lokale Position INNERHALB des jeweiligen
  // Teils (nicht die globale Warteschlangen-Position, die beide Teile zusammenzählen würde).
  const GUIDED_WRITING_PART_LABEL = {
    order_pieces: 'Teil 1: Wort zusammensetzen',
    guided_typing: 'Teil 2: Wort mit Hilfe eingeben'
  };

  function gradedSubLabel(phaseType, task, queue) {
    const suffix = (task.isRepeat ? ' · Wiederholung' : '') + (task.isReview ? ' · Wiederholungswort' : '');
    if (phaseType === 'matching') {
      return `Gruppe ${queue.index + 1} von ${queue.pending.length}${suffix}`;
    }
    if (phaseType === 'guided_writing' && task.part) {
      const partItems = queue.pending.filter((t) => t.part === task.part);
      const localIndex = partItems.indexOf(task) + 1;
      return `${GUIDED_WRITING_PART_LABEL[task.part] || ''} — Aufgabe ${Math.max(1, localIndex)} von ${partItems.length}${suffix}`;
    }
    return engine.taskProgressLabel() + suffix;
  }

  function gradedSubProgress(queue) {
    const total = queue.plannedTotal || queue.pending.length || 1;
    return Math.max(0, Math.min(1, queue.index / total));
  }

  // --- Stufe 7 (Zuordnungsaufgaben): eine Aufgabe bewertet mehrere Wörter gleichzeitig ---------
  function renderMatchingTask(task, queue) {
    const groupWords = task.groupWordIds.map((id) => allSessionWords().find((w) => w.id === id)).filter(Boolean);
    const settings = AppState.getSettings();
    const guard = freshGuard();
    const { bodyEl, actionBar } = SessionRenderer.renderLearningStageShell(container, {
      sessionDef,
      stageKey: 'matching',
      subProgress: gradedSubProgress(queue),
      subLabel: gradedSubLabel('matching', task, queue),
      onTheory: () => renderTheoryReview(renderGradedPhase),
      onLeave: confirmLeave
    });
    SessionRenderer.clearActionBar(actionBar);

    // Entwicklungsauftrag 16, Abschnitt 16: bereits gelöste Paare/Fehlversuche dieser Gruppe
    // leben direkt auf dem Warteschlangen-Eintrag (task ist dieselbe Objektreferenz wie in
    // engine.currentQueue().pending) -- kein zweiter Speicherort, persistSnapshot() serialisiert
    // die gesamte Warteschlange ohnehin schon mit.
    ExerciseRegistry.render('matching', bodyEl, {
      groupWords,
      variant: task.variant,
      settings,
      alreadySolvedWordIds: task.solvedWordIds || [],
      alreadyErroredWordIds: task.firstErrorWordIds || [],
      onProgress: ({ lockedWordIds, erroredWordIds }) => {
        task.solvedWordIds = lockedWordIds;
        task.firstErrorWordIds = erroredWordIds;
        persistSnapshot();
      }
    }, guard, async (isCorrect, detail) => {
      const perWordCorrect = (detail && detail.perWordCorrect) || {};
      for (const wordId of Object.keys(perWordCorrect)) {
        const card = AppState.getCard(wordId);
        adjustDifficulty(card, SKILL_BY_PHASE.matching, perWordCorrect[wordId] ? 'correct' : 'wrong');
      }
      await AppState.persistProgress();
      engine.recordGroupTaskResult(perWordCorrect);
      await persistSnapshot();

      const doAdvance = () => renderCurrentPhase();
      SessionRenderer.renderActionBar(actionBar, { rightButtons: [{ label: 'Weiter', onClick: doAdvance }] });
    });
  }

  function renderGradedPhase() {
    detachLearningKeydown();
    if (!engine.hasStartedQueue()) engine.startGradedQueue();
    if (engine.isPhaseQueueDone()) {
      engine.advancePhase();
      persistSnapshot();
      renderCurrentPhase();
      return;
    }

    const phaseType = engine.currentPhaseType();
    const task = engine.currentTask();
    const queue = engine.currentQueue();

    if (task.groupWordIds) { renderMatchingTask(task, queue); return; }

    const exerciseType = task.exerciseType || ExerciseRegistry.PHASE_EXERCISE_TYPE[phaseType];
    const word = allSessionWords().find((w) => w.id === task.wordId);
    const settings = AppState.getSettings();

    const guard = freshGuard();
    const { bodyEl, actionBar } = SessionRenderer.renderLearningStageShell(container, {
      sessionDef,
      stageKey: phaseType,
      subProgress: gradedSubProgress(queue),
      subLabel: gradedSubLabel(phaseType, task, queue),
      onTheory: () => renderTheoryReview(renderGradedPhase),
      onLeave: confirmLeave
    });

    let helpUsedFlag = ['A', 'B'].includes(engine.helpLevelState.currentLevel()) || task.part === 'guided_typing';
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

    // Entwicklungsauftrag 16, Abschnitt 9.1: Stufe 9 ("Freies Schreiben OHNE Hilfe") darf -- im
    // Unterschied zu allen anderen Stufen (6-8, die weiterhin wie zuvor einen optionalen
    // Hinweis-Button anbieten dürfen) -- keine Lösungspreisgabe vor der Abgabe anbieten. Der
    // textuelle Hinweis-Button (zeigt Transliteration + deutsche Bedeutung direkt an) widerspräche
    // genau dieser Unterscheidung und wird deshalb nur noch dort ausgeblendet (gefunden bei der
    // visuellen Verifikation: er erschien zuvor unverändert auch bei Stufe 9).
    const inputLeftButtons = [];
    if (phaseType !== 'independent_writing') {
      inputLeftButtons.push({
        label: 'Hilfe',
        className: 'btn secondary',
        onClick: () => {
          helpUsedFlag = true;
          engine.markHelpUsedForWord(word.id);
          bodyEl.appendChild(el('p', 'text-hint', `Hinweis: ${word.transliteration || ''} — ${ExerciseRegistry.primaryGerman(word)}`.trim()));
        }
      });
    }
    inputLeftButtons.push({ label: 'Audio', className: 'btn secondary', onClick: (btn) => AudioPlayer.speakWord(word, { context: 'Geführte Eingabe', button: btn }) });
    SessionRenderer.renderActionBar(actionBar, {
      leftButtons: inputLeftButtons,
      rightButtons: checkAction ? [{ label: 'Prüfen', onClick: () => checkAction() }] : []
    });

    if (settings.autoPlayWord) {
      AudioPlayer.speakWord(word, { context: 'Geführte Eingabe (automatisch)' });
    }
  }

  // --- Abschluss (Entwicklungsauftrag 5, Abschnitt 25, UNVERÄNDERT) ----------------------------
  // --- Stufe 10: Zusammenfassung und schwierige Wörter (Entwicklungsauftrag 16, Abschnitt 10) --
  function renderSummaryPhase() {
    detachLearningKeydown();
    // Entwicklungsauftrag 13, Abschnitt 6.3 — die Zusammenfassung startet keine automatische
    // Wiedergabe; eine bis hierhin noch laufende Aufnahme (z. B. aus der letzten Aufgabe) darf
    // hier nicht unbemerkt weiterlaufen.
    AudioPlayer.stopCurrentAudio();
    const { bodyEl } = SessionRenderer.renderLearningStageShell(container, {
      sessionDef,
      stageKey: 'summary',
      subProgress: 1,
      onTheory: () => renderTheoryReview(renderSummaryPhase),
      onLeave: confirmLeave
    });

    const passed = engine.checkCompletion();
    const securelyKnown = words.filter((w) => SessionCoverageTracker.isSecurelyKnown(engine.coverage, w.id));
    const writtenCount = words.filter((w) => SessionCoverageTracker.isWritten(engine.coverage, w.id)).length;

    // Abschnitt 10.2: zwei UNTERSCHIEDLICHE Gründe, klar getrennt gehalten -- ein einzelner
    // Tippfehler markiert ein Wort noch nicht automatisch dauerhaft als schwierig (errors>=2,
    // nicht >=1). Die explizite Nutzer-Markierung ("Als schwierig markieren", Stufe 3/5) ist
    // davon komplett unabhängig.
    const userMarkedWords = words.filter((w) => AppState.isWordMarkedDifficult(w.id));
    const multiErrorWords = words.filter((w) => SessionCoverageTracker.entryFor(engine.coverage, w.id).errors >= 2);
    const difficultIds = new Set([...userMarkedWords.map((w) => w.id), ...multiErrorWords.map((w) => w.id)]);
    const difficultWords = words.filter((w) => difficultIds.has(w.id));

    const card = el('div', 'card');
    card.appendChild(el('p', 'lead', passed ? 'Session abgeschlossen 🎉' : 'Session beendet — noch nicht bestanden, ein erneuter Versuch könnte helfen.'));
    card.appendChild(el('p', null, `${words.length} Wörter bearbeitet`));
    card.appendChild(el('p', null, `${engine.correctCount} richtige, ${engine.wrongCount} falsche Antworten`));
    card.appendChild(el('p', null, `${securelyKnown.length} von ${words.length} Wörtern sicher erkannt`));
    card.appendChild(el('p', null, `${writtenCount} von ${words.length} aktiv geschrieben`));
    if (difficultWords.length > 0) card.appendChild(el('p', null, `${difficultWords.length} schwierige Wörter`));
    card.appendChild(el('p', null, `Gesamt: ${Math.round(engine.weightedScorePercent() * 100)} %`));
    bodyEl.appendChild(card);

    if (securelyKnown.length > 0) {
      const goodCard = el('div', 'card');
      goodCard.appendChild(el('p', 'lead', 'Sehr gut'));
      securelyKnown.forEach((w) => goodCard.appendChild(el('p', null, `${w.arabic} — ${ExerciseRegistry.primaryGerman(w)}`)));
      bodyEl.appendChild(goodCard);
    }
    if (difficultWords.length > 0) {
      const practiceCard = el('div', 'card');
      practiceCard.appendChild(el('p', 'lead', 'Schwierige Wörter'));
      difficultWords.forEach((w) => {
        const entry = SessionCoverageTracker.entryFor(engine.coverage, w.id);
        const isUserMarked = userMarkedWords.some((mw) => mw.id === w.id);
        const isMultiError = multiErrorWords.some((mw) => mw.id === w.id);
        const reasons = [];
        if (isUserMarked) reasons.push('von dir markiert');
        if (isMultiError) reasons.push(`${entry.errors} Fehler`);
        const row = el('div', 'word-card');
        row.appendChild(el('p', 'arabic-word-main', w.arabic));
        row.appendChild(el('p', 'word-card-translation', ExerciseRegistry.primaryGerman(w)));
        row.appendChild(el('p', 'text-hint', reasons.join(' · ')));
        row.appendChild(mkBtn('Noch einmal anhören', 'btn secondary', (btn) => AudioPlayer.speakWord(w, { context: 'Session-Zusammenfassung', button: btn })));
        row.appendChild(renderDifficultToggle(w));
        practiceCard.appendChild(row);
      });
      bodyEl.appendChild(practiceCard);
    }

    const actions = document.createElement('div');
    actions.style.display = 'flex';
    actions.style.gap = '10px';
    actions.style.flexWrap = 'wrap';
    actions.style.marginTop = '16px';
    if (difficultWords.length > 0) {
      actions.appendChild(mkBtn('Schwierige Wörter üben', 'btn secondary', () => {
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
    bodyEl.appendChild(mkBtn('Session neu starten', 'btn secondary', () => confirmDiscard(() => mount(container, { unitId, sessionId: sessionDef.session_id }))));
  }

  function renderCurrentPhase() {
    const type = engine.currentPhaseType();
    if (!type) { renderSummaryPhase(); return; }
    if (type === 'theory') {
      if (engine.theoryDone) { engine.advancePhase(); renderCurrentPhase(); return; }
      renderTheoryPhase();
      return;
    }
    if (type === 'word_preview') {
      if (words.length === 0) { // Sicherheitsnetz: Session ohne neue Wörter überspringt Stufe 3-5
        engine.advancePhase();
        persistSnapshot();
        renderCurrentPhase();
        return;
      }
      if (!learningStageState) learningStageState = defaultLearningStageState();
      if (!['word_cards', 'audio_familiarization', 'word_overview'].includes(learningStageState.stage)) {
        learningStageState.stage = 'word_cards';
      }
      if (learningStageState.stage === 'word_cards') { renderWordCardsStage(); return; }
      if (learningStageState.stage === 'audio_familiarization') { renderAudioFamiliarizationStage(); return; }
      renderWordOverviewStage();
      return;
    }
    if (type === 'summary') { renderSummaryPhase(); return; }
    renderGradedPhase();
  }

  async function mount(el2, { unitId: uid, sessionId }) {
    container = el2;
    unitId = uid;
    container.innerHTML = '<div class="loading-placeholder">Lädt…</div>';
    detachLearningKeydown();
    App.registerCleanup(() => { if (activeGuard) activeGuard.destroy(); detachLearningKeydown(); });

    pack = await AppState.getLanguagePack();
    sessionDef = pack.vocabSessions.sessions.find((s) => s.session_id === sessionId);
    vocabUnit = pack.vocabSessions.vocab_units.find((u) => u.id === unitId);
    if (!sessionDef) {
      container.innerHTML = '<div class="empty-state">Diese Session wurde nicht gefunden.</div>';
      return;
    }
    const allPackWords = pack.vocabulary.categories.flatMap((c) => c.words);
    allPackWordsCache = allPackWords;
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

    // Entwicklungsauftrag 16, Abschnitt 17: ein vor diesem Auftrag gespeichertes Snapshot bezieht
    // sich noch auf das alte Acht-Phasen-Modell -- VOR jeder weiteren Verwendung auf das neue
    // Sieben-Phasen-Modell ummappen (sessionFlowVersion), sonst würde dasselbe phaseIndex eine
    // andere, falsche Phase treffen.
    const rawResumedState = SessionState.getState(sessionDef.session_id);
    const resumedState = SessionEngine.migrateResumedState(rawResumedState);
    const canResume = !!resumedState && resumedState.status !== 'completed';
    sessionWasResumable = canResume;

    if (canResume) {
      const activeIds = resumedState.activeNewWordIds || sessionDef.new_word_ids;
      words = activeIds.map((id) => fullWordList.find((w) => w.id === id)).filter(Boolean);
      reviewWords = (resumedState.reviewWordIds || []).map((id) => allPackWords.find((w) => w.id === id)).filter(Boolean);
      engine = SessionEngine.create({ sessionDef, words, reviewWords, resumedState });
      learningStageState = migrateLearningStageState(resumedState.learningStageState, engine.coverage, words);
      if (rawResumedState !== resumedState) await persistSnapshot(); // migriertes Format sofort dauerhaft sichern
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

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SessionController;
}
