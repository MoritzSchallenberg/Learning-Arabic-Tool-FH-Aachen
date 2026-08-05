// SessionRenderer (Entwicklungsauftrag 4, Schritt 3/13.1 + Abschnitt 16.1) — reine
// DOM-Bausteine für die Session-Oberfläche: Sessionkopf mit Schrittanzeige (welche Phase ist
// aktuell/erledigt), "Theorie ansehen"/"Session verlassen" jederzeit erreichbar, und die feste
// Aktionsleiste am unteren Rand (hier: der manuelle "Weiter"-Button — kein automatischer
// Wechsel nach 900/1400ms bei normalen Lernaufgaben, siehe Abschnitt 16.4).

const SessionRenderer = (() => {
  function el(tag, opts = {}) {
    const node = document.createElement(tag);
    if (opts.className) node.className = opts.className;
    if (opts.text !== undefined) node.textContent = opts.text;
    return node;
  }

  function renderStepIndicator(container, phases, currentIndex) {
    const wrap = el('div', { className: 'step-indicator' });
    phases.forEach((phase, i) => {
      const label = PhaseRegistry.get(phase.type).label;
      let cls = '';
      if (i < currentIndex) cls = 'done';
      else if (i === currentIndex) cls = 'current';
      wrap.appendChild(el('span', { className: `step-indicator-item ${cls}`, text: label }));
      if (i < phases.length - 1) wrap.appendChild(el('span', { className: 'step-indicator-sep', text: '—' }));
    });
    container.appendChild(wrap);
  }

  /**
   * Rendert den gemeinsamen Rahmen einer Session-Phase (Titel, Schrittanzeige, optionaler
   * Fortschrittstext, Theorie-/Verlassen-Schaltflächen) und gibt die Einhänge-Punkte für Inhalt
   * und Aktionsleiste zurück.
   */
  function renderSessionShell(container, { sessionDef, phaseIndex, progressLabel, onTheory, onLeave }) {
    while (container.firstChild) container.removeChild(container.firstChild);
    const view = el('div', { className: 'view page-content' });

    const topBar = el('div');
    topBar.style.display = 'flex';
    topBar.style.justifyContent = 'space-between';
    topBar.style.alignItems = 'center';
    topBar.style.flexWrap = 'wrap';
    topBar.style.gap = '10px';
    topBar.appendChild(el('h1', { className: 'text-page-title', text: sessionDef.title }));

    const btnGroup = el('div');
    btnGroup.style.display = 'flex';
    btnGroup.style.gap = '8px';
    const theoryBtn = el('button', { className: 'btn secondary', text: 'Theorie ansehen' });
    theoryBtn.type = 'button';
    theoryBtn.addEventListener('click', onTheory);
    const leaveBtn = el('button', { className: 'btn secondary', text: 'Session verlassen' });
    leaveBtn.type = 'button';
    leaveBtn.addEventListener('click', onLeave);
    btnGroup.appendChild(theoryBtn);
    btnGroup.appendChild(leaveBtn);
    topBar.appendChild(btnGroup);
    view.appendChild(topBar);

    renderStepIndicator(view, sessionDef.phases, phaseIndex);

    if (progressLabel) {
      view.appendChild(el('p', { className: 'text-hint', text: progressLabel }));
    }

    const bodyEl = el('div', { className: 'session-body' });
    view.appendChild(bodyEl);

    const actionBar = el('div', { className: 'action-bar' });
    view.appendChild(actionBar);

    container.appendChild(view);
    return { bodyEl, actionBar };
  }

  /** Manuelles "Weiter" — erscheint erst, NACHDEM Feedback gezeigt wurde. */
  function renderContinueButton(actionBar, label, onClick) {
    while (actionBar.firstChild) actionBar.removeChild(actionBar.firstChild);
    const right = el('div', { className: 'action-bar-right' });
    const btn = el('button', { className: 'btn', text: label || 'Weiter' });
    btn.type = 'button';
    btn.addEventListener('click', onClick);
    right.appendChild(btn);
    actionBar.appendChild(el('div', { className: 'action-bar-left' }));
    actionBar.appendChild(right);
  }

  function clearActionBar(actionBar) {
    while (actionBar.firstChild) actionBar.removeChild(actionBar.firstChild);
  }

  return { renderSessionShell, renderContinueButton, clearActionBar, renderStepIndicator, el };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SessionRenderer;
}
