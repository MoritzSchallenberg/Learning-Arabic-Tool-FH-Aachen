// Startseite (Entwicklungsauftrag 3, Meilenstein B, Abschnitt 18; Hauptaktion korrigiert in
// Entwicklungsauftrag 5, Abschnitt 13). Zeigt heute fällige Wiederholungen, für heute verfügbare
// neue Wörter (begrenzt durch das Tageslimit), eine grobe Zeitschätzung und den Gesamtfortschritt
// von Kurs 1 — die Hauptaktion ist aber jetzt immer der nächste logische Kursfortschritt:
// eine unterbrochene Session wird direkt fortgesetzt (vorher führte "Heute weiterlernen" trotz
// erkannter unterbrochener Session immer in den freien Wiederholungsmodus), sonst wird die
// nächste noch nicht abgeschlossene Vokabel-Session vorgeschlagen. Sicher gerendert
// (createElement/textContent statt innerHTML mit dynamischen Werten, Abschnitt 29).

const DashboardView = (() => {
  const CATEGORY_ORDER = ['letters', 'vocabulary', 'connections'];
  // Entwicklungsauftrag 7, Abschnitt 23: derselbe Schwellenwert wie
  // srs.js/INTENSIVE_REVIEW_THRESHOLD — hier bewusst als eigene Konstante dupliziert statt als
  // impliziter globaler Bezeichner referenziert, damit dashboard.js in Tests unabhängig von der
  // srs.js-Ladereihenfolge bleibt (siehe dashboard.test.js, das srs.js nicht in den
  // gemeinsamen vm-Kontext lädt).
  const DIFFICULT_WORD_THRESHOLD = 3;
  const MAX_DIFFICULT_WORDS_SHOWN = 5;

  function el(tag, opts = {}) {
    const node = document.createElement(tag);
    if (opts.className) node.className = opts.className;
    if (opts.text !== undefined) node.textContent = opts.text;
    return node;
  }

  function renderProgressBar(container, label, percent) {
    const displayPercent = percent === null ? null : Math.round(percent);
    const row = el('div', { className: 'meter-row' });
    row.appendChild(el('span', { className: 'meter-label', text: label }));
    const track = el('div', { className: 'meter-track' });
    const fill = el('div', { className: 'meter-fill mastery' });
    fill.style.width = `${displayPercent ?? 0}%`;
    track.appendChild(fill);
    row.appendChild(track);
    row.appendChild(el('span', { className: 'meter-value', text: displayPercent === null ? 'keine Daten' : `${displayPercent}%` }));
    container.appendChild(row);
  }

  // Findet die Session/Unit zu einer Session-ID (für die Wiederaufnahme-Karte).
  function findSessionAndUnit(pack, sessionId) {
    if (!pack.vocabSessions) return null;
    const sessionDef = pack.vocabSessions.sessions.find((s) => s.session_id === sessionId);
    if (!sessionDef) return null;
    const unit = pack.vocabSessions.vocab_units.find((u) => u.session_ids.includes(sessionId));
    return { sessionDef, unit };
  }

  // Erste noch nicht abgeschlossene Vokabel-Session über alle Units, in Definitionsreihenfolge.
  function findNextSession(pack) {
    if (!pack.vocabSessions) return null;
    for (const unit of pack.vocabSessions.vocab_units) {
      for (const sessionId of unit.session_ids) {
        if (SessionState.getStatus(sessionId) !== 'completed') {
          const sessionDef = pack.vocabSessions.sessions.find((s) => s.session_id === sessionId);
          if (sessionDef) return { sessionDef, unit };
        }
      }
    }
    return null;
  }

  function currentPhaseLabel(sessionDef, sessionState) {
    const phaseIndex = sessionState ? sessionState.phaseIndex : 0;
    const phase = sessionDef.phases[phaseIndex];
    return phase ? PhaseRegistry.get(phase.type).label : PhaseRegistry.get('summary').label;
  }

  function taskProgressText(sessionDef, sessionState) {
    if (!sessionState || !sessionState.phaseQueues) return null;
    const phaseIndex = sessionState.phaseIndex;
    const phase = sessionDef.phases[phaseIndex];
    if (!phase) return null;
    const q = sessionState.phaseQueues[phase.type];
    if (!q) return null;
    return `Aufgabe ${Math.min(q.index + 1, q.pending.length)} von ${q.pending.length}`;
  }

  function renderContinueSessionCard(container, pack, activeSessionId) {
    const found = findSessionAndUnit(pack, activeSessionId);
    const card = el('div', { className: 'card' });
    card.appendChild(el('p', { className: 'lead', text: 'Weiterlernen' }));
    if (found) {
      const { sessionDef, unit } = found;
      const sessionState = AppState.getSessionState(activeSessionId);
      card.appendChild(el('p', { text: unit ? unit.title : sessionDef.title }));
      card.appendChild(el('p', { className: 'text-hint', text: currentPhaseLabel(sessionDef, sessionState) }));
      const taskText = taskProgressText(sessionDef, sessionState);
      if (taskText) card.appendChild(el('p', { className: 'text-hint', text: taskText }));
      const remaining = Math.max(1, Math.round((sessionDef.estimated_minutes || 10) * 0.5));
      card.appendChild(el('p', { className: 'text-hint', text: `ca. ${remaining} Minuten verbleibend` }));
      const btn = el('button', { className: 'btn', text: 'Session fortsetzen' });
      btn.type = 'button';
      btn.style.marginTop = '10px';
      btn.addEventListener('click', () => App.navigateToSession(unit ? unit.id : null, sessionDef.session_id));
      card.appendChild(btn);
    } else {
      card.appendChild(el('p', { className: 'text-hint', text: 'Eine unterbrochene Session wurde nicht mehr gefunden.' }));
    }
    container.appendChild(card);
  }

  function renderNextSessionCard(container, pack) {
    const found = findNextSession(pack);
    const card = el('div', { className: 'card' });
    if (!found) {
      card.appendChild(el('p', { className: 'lead', text: 'Alle vorhandenen Sessions sind abgeschlossen 🎉' }));
      container.appendChild(card);
      return;
    }
    const { sessionDef, unit } = found;
    card.appendChild(el('p', { className: 'lead', text: 'Nächste Session' }));
    card.appendChild(el('p', { text: unit.title }));
    card.appendChild(el('p', { className: 'text-hint', text: sessionDef.title }));
    const meta = [`${sessionDef.new_word_ids.length} neue Wörter`];
    if (sessionDef.review_count) meta.push(`${sessionDef.review_count} Wiederholungen`);
    meta.push(`ca. ${sessionDef.estimated_minutes} Minuten`);
    card.appendChild(el('p', { className: 'text-hint', text: meta.join(' · ') }));
    const btn = el('button', { className: 'btn', text: SessionState.getStatus(sessionDef.session_id) === 'not_started' ? 'Session starten' : 'Session fortsetzen' });
    btn.type = 'button';
    btn.style.marginTop = '10px';
    btn.addEventListener('click', () => App.navigateToSession(unit.id, sessionDef.session_id));
    card.appendChild(btn);
    container.appendChild(card);
  }

  // Entwicklungsauftrag 7, Abschnitt 23: bis zu fünf Wörter, die zuletzt wiederholt falsch
  // beantwortet wurden (consecutiveWrong >= Schwellenwert, für irgendeine Fähigkeit). Je Wort
  // wird nur der höchste Fehler-Zähler über alle Fähigkeiten hinweg berücksichtigt, damit
  // dasselbe Wort nicht doppelt erscheint (z. B. einmal für arabic_to_german, einmal für
  // german_to_arabic).
  function collectDifficultWords(pool) {
    const byWordId = new Map();
    for (const item of pool) {
      if (item.category !== 'vocabulary') continue;
      const card = AppState.getCard(item.cardId);
      const wrong = (card.consecutiveWrong && card.consecutiveWrong[item.skill]) || 0;
      if (wrong < DIFFICULT_WORD_THRESHOLD) continue;
      const existing = byWordId.get(item.cardId);
      if (!existing || wrong > existing.wrong) byWordId.set(item.cardId, { word: item.data, wrong });
    }
    return [...byWordId.values()].sort((a, b) => b.wrong - a.wrong).slice(0, MAX_DIFFICULT_WORDS_SHOWN);
  }

  // Gibt es im Pool einen Verbindungstrainer-Eintrag für dieses Wort? (Nicht jedes Wort ist dafür
  // geeignet — nur Wörter, die sich vollständig aus den 28 arabischen Grundbuchstaben ohne
  // Sonderzeichen zusammensetzen, siehe practicePool.js.)
  function hasConnectionEntry(pool, wordId) {
    return pool.some((item) => item.category === 'connections' && item.data && item.data.word && item.data.word.id === wordId);
  }

  function toggleDetailPanel(panel, btn, labelShown, labelHidden) {
    const isHidden = panel.style.display === 'none' || !panel.style.display;
    panel.style.display = isHidden ? 'block' : 'none';
    btn.textContent = isHidden ? labelHidden : labelShown;
  }

  function renderWordSpellingPanel(word) {
    const panel = el('div', { className: 'difficult-word-detail' });
    panel.style.display = 'none';
    panel.appendChild(el('p', { className: 'arabic-text', text: word.arabic_vocalized || word.arabic || '' }));
    if (word.arabic_unvocalized) panel.appendChild(el('p', { className: 'text-hint', text: `Unvokalisiert: ${word.arabic_unvocalized}` }));
    if (word.transliteration) panel.appendChild(el('p', { className: 'text-hint', text: `Umschrift: ${word.transliteration}` }));
    return panel;
  }

  function renderWordExamplesPanel(word) {
    const panel = el('div', { className: 'difficult-word-detail' });
    panel.style.display = 'none';
    const prompts = Array.isArray(word.application_prompts) ? word.application_prompts : [];
    if (prompts.length === 0) {
      panel.appendChild(el('p', { className: 'text-hint', text: 'Für dieses Wort sind noch keine Beispiele hinterlegt.' }));
    } else {
      for (const p of prompts) {
        panel.appendChild(el('p', { text: p.prompt }));
      }
    }
    return panel;
  }

  function renderDifficultWordRow(list, pool, word, wrong) {
    const row = el('div', { className: 'difficult-word-row' });
    row.appendChild(el('span', { className: 'arabic-text', text: word.arabic_vocalized || word.arabic || '' }));
    const germanText = Array.isArray(word.german_answers) && word.german_answers.length > 0 ? word.german_answers[0] : word.german;
    row.appendChild(el('span', { text: germanText || '' }));
    row.appendChild(el('span', { className: 'text-hint', text: `${wrong} Fehler in Folge` }));
    list.appendChild(row);

    const actions = el('div', { className: 'difficult-word-actions' });

    const relearnBtn = el('button', { className: 'btn secondary', text: 'Noch einmal lernen' });
    relearnBtn.type = 'button';
    relearnBtn.addEventListener('click', () => App.navigateToFreePractice({
      presetFilters: { categories: { letters: false, vocabulary: true, connections: false }, onlyWordIds: [word.id] },
      autoStart: true
    }));
    actions.appendChild(relearnBtn);

    const audioBtn = el('button', { className: 'btn secondary', text: '🔊 Audio anhören' });
    audioBtn.type = 'button';
    audioBtn.addEventListener('click', () => {
      AudioPlayer.speak(word.arabic_vocalized || word.arabic, 'ar-SA', { audioKey: word.audio_key || `vocabulary/${word.id}` }).catch(() => {});
    });
    actions.appendChild(audioBtn);

    const spellingPanel = renderWordSpellingPanel(word);
    const spellingBtn = el('button', { className: 'btn secondary', text: 'Schreibweise ansehen' });
    spellingBtn.type = 'button';
    spellingBtn.addEventListener('click', () => toggleDetailPanel(spellingPanel, spellingBtn, 'Schreibweise ansehen', 'Schreibweise ausblenden'));
    actions.appendChild(spellingBtn);

    const examplesPanel = renderWordExamplesPanel(word);
    const examplesBtn = el('button', { className: 'btn secondary', text: 'Beispiele ansehen' });
    examplesBtn.type = 'button';
    examplesBtn.addEventListener('click', () => toggleDetailPanel(examplesPanel, examplesBtn, 'Beispiele ansehen', 'Beispiele ausblenden'));
    actions.appendChild(examplesBtn);

    if (hasConnectionEntry(pool, word.id)) {
      const connectionBtn = el('button', { className: 'btn secondary', text: 'Verbindung ansehen' });
      connectionBtn.type = 'button';
      connectionBtn.addEventListener('click', () => App.navigateToFreePractice({
        presetFilters: { categories: { letters: false, vocabulary: false, connections: true }, onlyWordIds: [word.id] },
        autoStart: true
      }));
      actions.appendChild(connectionBtn);
    }

    list.appendChild(actions);
    list.appendChild(spellingPanel);
    list.appendChild(examplesPanel);
  }

  function renderDifficultWordsCard(container, pool, difficultWords) {
    if (difficultWords.length === 0) return;
    const card = el('div', { className: 'card' });
    card.appendChild(el('p', { className: 'lead', text: 'Deine schwierigen Wörter' }));
    card.appendChild(el('p', { className: 'text-hint', text: 'Diese Wörter fallen dir noch schwer — probiere eine der Optionen statt einfach dieselbe Aufgabe erneut zu sehen.' }));
    const list = el('div', { className: 'difficult-word-list' });
    for (const { word, wrong } of difficultWords) renderDifficultWordRow(list, pool, word, wrong);
    card.appendChild(list);
    const btn = el('button', { className: 'btn secondary', text: 'Alle üben' });
    btn.type = 'button';
    btn.style.marginTop = '10px';
    btn.addEventListener('click', () => App.navigateToFreePractice({ presetFilters: { recentlyWrongOnly: true }, autoStart: true }));
    card.appendChild(btn);
    container.appendChild(card);
  }

  async function mount(container) {
    container.innerHTML = '<div class="loading-placeholder">Lädt…</div>';
    const pack = await AppState.getLanguagePack();
    const settings = AppState.getSettings();
    const pool = PracticePool.buildPool(pack);
    const reviewItems = pool.map((i) => ({ cardId: i.cardId, skill: i.skill }));

    const dailyNewLimit = ReviewScheduler.ALLOWED_DAILY_LIMITS.includes(settings.dailyNewLimit)
      ? settings.dailyNewLimit
      : ReviewScheduler.DEFAULT_DAILY_NEW_LIMIT;
    const newItemsShownToday = AppState.getDailyNewCount();
    const summary = ReviewScheduler.summarize(reviewItems, AppState.getCard, { dailyNewLimit, newItemsShownToday });

    const overall = ProgressStats.computeOverallProgress(pool, AppState.getCard);
    const byCategory = ProgressStats.computeByCategory(pool, AppState.getCard);
    const difficultWords = collectDifficultWords(pool);

    const estimatedMinutes = Math.max(1, Math.round((summary.dueToday + summary.newAvailableToday) * 0.5));
    const activeSessionId = AppState.getActiveSessionId();

    while (container.firstChild) container.removeChild(container.firstChild);
    const view = el('div', { className: 'view' });
    view.appendChild(el('h1', { text: 'Willkommen zurück 👋' }));

    // Hauptaktion: unterbrochene Session direkt fortsetzen, sonst die nächste Session vorschlagen
    // (Abschnitt 13 — vorher führte der Button hier immer in den freien Übungsmodus).
    if (activeSessionId) {
      renderContinueSessionCard(view, pack, activeSessionId);
    } else if (pack.vocabSessions) {
      renderNextSessionCard(view, pack);
    }

    const todayCard = el('div', { className: 'card' });
    todayCard.appendChild(el('p', { className: 'lead', text: 'Tagesübersicht' }));
    todayCard.appendChild(el('p', { text: `📌 Fällige Wiederholungen: ${summary.dueToday}` }));
    todayCard.appendChild(el('p', { text: `🆕 Neue Wörter verfügbar: ${summary.newAvailableToday} (Tageslimit ${dailyNewLimit}, davon ${newItemsShownToday} bereits heute gezeigt)` }));
    todayCard.appendChild(el('p', { text: `⏱ Geschätzte Dauer: ca. ${estimatedMinutes} Minuten` }));
    const secondaryActions = el('div', { className: 'action-bar-left' });
    secondaryActions.style.marginTop = '10px';
    const dueBtn = el('button', { className: 'btn secondary', text: 'Fällige Wiederholungen' });
    dueBtn.type = 'button';
    dueBtn.addEventListener('click', () => App.navigateToFreePractice({ presetFilters: { dueOnly: true }, autoStart: true }));
    const freeBtn = el('button', { className: 'btn secondary', text: 'Frei üben' });
    freeBtn.type = 'button';
    freeBtn.addEventListener('click', () => App.navigateToFreePractice());
    secondaryActions.appendChild(dueBtn);
    secondaryActions.appendChild(freeBtn);
    todayCard.appendChild(secondaryActions);
    view.appendChild(todayCard);

    renderDifficultWordsCard(view, pool, difficultWords);

    const progressCard = el('div', { className: 'card' });
    progressCard.appendChild(el('p', { className: 'lead', text: 'Gesamtfortschritt Kurs 1' }));
    renderProgressBar(progressCard, 'Alle Bereiche', overall.percent);
    CATEGORY_ORDER.filter((c) => c in byCategory).forEach((c) => renderProgressBar(progressCard, PracticePool.CATEGORY_LABELS[c] || c, byCategory[c]));
    view.appendChild(progressCard);

    container.appendChild(view);
  }

  return { mount };
})();
