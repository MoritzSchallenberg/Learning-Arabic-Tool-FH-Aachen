// Kursansicht (Entwicklungsauftrag 4, Schritt 2) — ersetzt die frühere, dauerhaft ausgeklappte
// Lesson-Liste in der Seitenleiste. Zeigt Kurskopf (Fortschritt, gelernte Wörter, fällige
// Wiederholungen) und die Units als Lernroute. Bestehende Kurs-1-Units (0-10 aus courses.json)
// bleiben über App.navigateTo() erreichbar (Rückwärtskompatibilität); die neue Vokabel-Unit
// (vocabSessions.json) führt zur neuen UnitDetailView mit Session-Karten.

const CourseView = (() => {
  const STATUS_BADGE = { not_started: 'available', in_progress: 'started', passed: 'completed', failed: 'repeat' };
  const STATUS_LABEL = {
    available: 'Verfügbar', started: 'Begonnen', completed: 'Abgeschlossen', repeat: 'Wiederholung empfohlen', locked: 'Gesperrt'
  };

  function el(tag, opts = {}) {
    const node = document.createElement(tag);
    if (opts.className) node.className = opts.className;
    if (opts.text !== undefined) node.textContent = opts.text;
    return node;
  }

  function statusBadge(status) {
    const badge = el('span', { className: `status-badge ${status}`, text: STATUS_LABEL[status] || status });
    return badge;
  }

  function unitNavKey(unit) {
    if (unit.type === 'existing_lesson_group') return unit.lesson_keys[0];
    if (unit.type === 'existing_lesson') return unit.lesson_key;
    return unit.id;
  }

  function legacyUnitCard(unit, index, pack) {
    const key = unitNavKey(unit);
    const progressStatus = LessonProgress.getStatus(key, pack);
    const badgeStatus = STATUS_BADGE[progressStatus] || 'available';

    const card = el('button', { className: 'unit-card' });
    card.type = 'button';
    card.appendChild(el('span', { className: 'unit-card-index', text: String(index) }));
    const body = el('div', { className: 'unit-card-body' });
    body.appendChild(el('p', { className: 'unit-card-title', text: unit.title }));
    body.appendChild(el('p', { className: 'unit-card-desc', text: 'Schriftgrundlagen' }));
    body.appendChild(statusBadge(badgeStatus));
    card.appendChild(body);
    card.addEventListener('click', () => App.navigateTo(key));
    return card;
  }

  function vocabUnitCard(vocabUnit, index, sessionsById) {
    const sessionIds = vocabUnit.session_ids || [];
    const statuses = sessionIds.map((id) => SessionState.getStatus(id));
    let badgeStatus = 'available';
    if (statuses.length > 0) {
      if (statuses.every((s) => s === 'completed')) badgeStatus = 'completed';
      else if (statuses.some((s) => s !== 'not_started')) badgeStatus = 'started';
    }

    const wordCount = sessionIds.reduce((sum, id) => sum + ((sessionsById[id] && sessionsById[id].new_word_ids.length) || 0), 0);

    const card = el('button', { className: 'unit-card' });
    card.type = 'button';
    card.appendChild(el('span', { className: 'unit-card-index', text: String(index) }));
    const body = el('div', { className: 'unit-card-body' });
    body.appendChild(el('p', { className: 'unit-card-title', text: vocabUnit.title }));
    body.appendChild(el('p', { className: 'unit-card-desc', text: vocabUnit.description || '' }));
    const meta = el('div', { className: 'unit-card-meta' });
    meta.appendChild(el('span', { text: `${sessionIds.length} Session${sessionIds.length === 1 ? '' : 's'}` }));
    meta.appendChild(el('span', { text: `${wordCount} Wörter` }));
    body.appendChild(meta);
    body.appendChild(statusBadge(badgeStatus));
    card.appendChild(body);
    card.addEventListener('click', () => App.navigateToUnitDetail(vocabUnit.id));
    return card;
  }

  // Einklappbarer Abschnitt mit eigener Fortschrittsanzeige (Entwicklungsauftrag 5, Abschnitt 27:
  // "Teil A: Arabische Schrift" / "Teil B: Grundwortschatz" statt eines einzigen unstrukturierten
  // Blocks mit allen Units).
  function renderSection(view, { title, percent }) {
    const heading = el('div');
    heading.style.display = 'flex';
    heading.style.alignItems = 'center';
    heading.style.gap = '10px';
    heading.style.marginTop = '18px';
    heading.appendChild(el('h2', { className: 'text-section-title', text: title }));
    heading.appendChild(el('span', { className: 'text-hint', text: `${Math.round(percent)} % abgeschlossen` }));
    const toggleBtn = el('button', { className: 'btn secondary', text: 'Einklappen' });
    toggleBtn.type = 'button';
    toggleBtn.style.marginLeft = 'auto';
    heading.appendChild(toggleBtn);
    view.appendChild(heading);

    const route = el('div', { className: 'unit-route' });
    view.appendChild(route);

    toggleBtn.addEventListener('click', () => {
      const collapsed = route.style.display === 'none';
      route.style.display = collapsed ? '' : 'none';
      toggleBtn.textContent = collapsed ? 'Einklappen' : 'Ausklappen';
    });

    return route;
  }

  function legacySectionPercent(course1, pack) {
    if (course1.units.length === 0) return 0;
    const passedCount = course1.units.filter((u) => LessonProgress.getStatus(unitNavKey(u), pack) === 'passed').length;
    return (passedCount / course1.units.length) * 100;
  }

  function vocabSectionPercent(vocabUnits) {
    const allSessionIds = vocabUnits.flatMap((u) => u.session_ids || []);
    if (allSessionIds.length === 0) return 0;
    const completedCount = allSessionIds.filter((id) => SessionState.getStatus(id) === 'completed').length;
    return (completedCount / allSessionIds.length) * 100;
  }

  async function mount(container) {
    container.innerHTML = '<div class="loading-placeholder">Lädt…</div>';
    const pack = await AppState.getLanguagePack();
    const course1 = pack.courses.courses.find((c) => c.id === 'course_1');
    const vocabUnits = (pack.vocabSessions && pack.vocabSessions.vocab_units) || [];
    const sessionsById = {};
    if (pack.vocabSessions) {
      for (const s of pack.vocabSessions.sessions) sessionsById[s.session_id] = s;
    }

    const pool = PracticePool.buildPool(pack);
    const overall = ProgressStats.computeOverallProgress(pool, AppState.getCard);
    const reviewItems = pool.map((i) => ({ cardId: i.cardId, skill: i.skill }));
    const reviewSummary = ReviewScheduler.summarize(reviewItems, AppState.getCard, {});

    while (container.firstChild) container.removeChild(container.firstChild);
    const view = el('div', { className: 'view page-content' });

    const head = el('div', { className: 'course-card' });
    const headTop = el('div', { className: 'course-card-head' });
    const headLeft = el('div');
    headLeft.appendChild(el('h1', { className: 'text-page-title', text: course1.title }));
    headLeft.appendChild(el('p', { className: 'text-hint', text: 'Arabische Schrift, virtuelle Tastatur, Verbindungstrainer und die ersten Grundwörter.' }));
    headTop.appendChild(headLeft);
    head.appendChild(headTop);

    const meterRow = el('div', { className: 'meter-row' });
    meterRow.appendChild(el('span', { className: 'meter-label', text: 'Gesamtfortschritt' }));
    const track = el('div', { className: 'meter-track' });
    const fill = el('div', { className: 'meter-fill mastery' });
    fill.style.width = `${Math.round(overall.percent)}%`;
    track.appendChild(fill);
    meterRow.appendChild(track);
    meterRow.appendChild(el('span', { className: 'meter-value', text: `${Math.round(overall.percent)}%` }));
    head.appendChild(meterRow);

    const stats = el('div', { className: 'course-card-stats' });
    const statDefs = [
      ['Fällige Wiederholungen', String(reviewSummary.dueToday)],
      ['Karten mit Fortschritt', String(overall.totalCards)]
    ];
    for (const [label, value] of statDefs) {
      const stat = el('div', { className: 'course-card-stat' });
      stat.appendChild(el('span', { className: 'stat-value', text: value }));
      stat.appendChild(el('span', { className: 'stat-label', text: label }));
      stats.appendChild(stat);
    }
    head.appendChild(stats);
    view.appendChild(head);

    // Teil A: Arabische Schrift (bestehende Kurs-1-Units) ---------------------------------------
    const partA = renderSection(view, { title: 'Teil A — Arabische Schrift', percent: legacySectionPercent(course1, pack) });
    course1.units.forEach((unit, i) => partA.appendChild(legacyUnitCard(unit, i + 1, pack)));

    // Teil B: Grundwortschatz (neue Vokabel-Units) -----------------------------------------------
    if (vocabUnits.length > 0) {
      const partB = renderSection(view, { title: 'Teil B — Grundwortschatz', percent: vocabSectionPercent(vocabUnits) });
      vocabUnits.forEach((vocabUnit, i) => partB.appendChild(vocabUnitCard(vocabUnit, i + 1, sessionsById)));
    }

    container.appendChild(view);
  }

  return { mount };
})();
