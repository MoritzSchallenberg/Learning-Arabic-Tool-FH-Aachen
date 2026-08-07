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

    const progressCard = el('div', { className: 'card' });
    progressCard.appendChild(el('p', { className: 'lead', text: 'Gesamtfortschritt Kurs 1' }));
    renderProgressBar(progressCard, 'Alle Bereiche', overall.percent);
    CATEGORY_ORDER.filter((c) => c in byCategory).forEach((c) => renderProgressBar(progressCard, PracticePool.CATEGORY_LABELS[c] || c, byCategory[c]));
    view.appendChild(progressCard);

    container.appendChild(view);
  }

  return { mount };
})();
