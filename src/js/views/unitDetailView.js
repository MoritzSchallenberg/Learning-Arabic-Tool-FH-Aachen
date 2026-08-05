// Unit-Detailansicht (Entwicklungsauftrag 4, Schritt 2, Abschnitt 6.3) — zeigt die Sessions
// einer Vokabel-Unit als Karten (Theorie/Lernphase/Übungsphase getrennt sichtbar über
// Phasen-Tags), mit Status (gesperrt/verfügbar/begonnen/abgeschlossen).

const UnitDetailView = (() => {
  function el(tag, opts = {}) {
    const node = document.createElement(tag);
    if (opts.className) node.className = opts.className;
    if (opts.text !== undefined) node.textContent = opts.text;
    return node;
  }

  const PHASE_TAG_LABELS = {
    theory: 'Theorie',
    word_preview: 'Lernen',
    recognition: 'Üben',
    reconstruction: 'Üben',
    guided_production: 'Üben',
    independent_production: 'Üben',
    application: 'Anwenden',
    summary: 'Abschluss'
  };

  function uniquePhaseTags(session) {
    const seen = new Set();
    const tags = [];
    for (const phase of session.phases) {
      const label = PHASE_TAG_LABELS[phase.type] || phase.type;
      if (!seen.has(label)) {
        seen.add(label);
        tags.push(label);
      }
    }
    return tags;
  }

  function sessionCard(session, index, unitId) {
    const status = SessionState.getStatus(session.session_id);
    const statusLabel = { not_started: 'Verfügbar', in_progress: 'Begonnen', completed: 'Abgeschlossen' }[status];
    const statusBadgeClass = { not_started: 'available', in_progress: 'started', completed: 'completed' }[status];

    const card = el('div', { className: 'session-card' });
    const indexEl = el('span', { className: 'unit-card-index', text: String(index) });
    card.appendChild(indexEl);

    const body = el('div', { className: 'session-card-body' });
    body.appendChild(el('p', { className: 'session-card-title', text: session.title }));
    body.appendChild(el('p', { className: 'session-card-meta', text: `${session.new_word_ids.length} neue Wörter · ca. ${session.estimated_minutes} Minuten` }));

    const phasesRow = el('div', { className: 'session-card-phases' });
    for (const tag of uniquePhaseTags(session)) {
      phasesRow.appendChild(el('span', { className: 'session-card-phase-tag', text: tag }));
    }
    body.appendChild(phasesRow);
    card.appendChild(body);

    const right = el('div');
    right.appendChild(el('span', { className: `status-badge ${statusBadgeClass}`, text: statusLabel }));
    const openBtn = el('button', { className: 'btn', text: status === 'not_started' ? 'Session starten' : (status === 'completed' ? 'Erneut üben' : 'Fortsetzen') });
    openBtn.type = 'button';
    openBtn.style.display = 'block';
    openBtn.style.marginTop = '8px';
    openBtn.addEventListener('click', () => App.navigateToSession(unitId, session.session_id));
    right.appendChild(openBtn);
    card.appendChild(right);

    return card;
  }

  async function mount(container, unitId) {
    container.innerHTML = '<div class="loading-placeholder">Lädt…</div>';
    const pack = await AppState.getLanguagePack();
    const vocabUnit = pack.vocabSessions.vocab_units.find((u) => u.id === unitId);

    App.renderHeader({
      breadcrumbs: [
        { label: 'Kurs', onClick: App.navigateToCourse },
        { label: vocabUnit ? vocabUnit.title : unitId }
      ],
      title: vocabUnit ? vocabUnit.title : unitId,
      onBack: App.navigateToCourse
    });

    while (container.firstChild) container.removeChild(container.firstChild);

    if (!vocabUnit) {
      const empty = el('div', { className: 'empty-state', text: 'Diese Unit wurde nicht gefunden.' });
      container.appendChild(empty);
      return;
    }

    const view = el('div', { className: 'view page-content' });
    view.appendChild(el('p', { className: 'lead', text: vocabUnit.description || '' }));

    const sessions = vocabUnit.session_ids
      .map((id) => pack.vocabSessions.sessions.find((s) => s.session_id === id))
      .filter(Boolean);

    const list = el('div', { className: 'unit-route' });
    sessions.forEach((session, i) => list.appendChild(sessionCard(session, i + 1, unitId)));
    view.appendChild(list);

    container.appendChild(view);
  }

  return { mount };
})();
