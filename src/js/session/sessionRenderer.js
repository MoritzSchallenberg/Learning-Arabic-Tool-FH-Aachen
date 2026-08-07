// SessionRenderer (Entwicklungsauftrag 4, Schritt 3 + Abschnitt 16.1; erweitert in
// Entwicklungsauftrag 5, Abschnitte 23/24) — reine DOM-Bausteine für die Session-Oberfläche:
// Sessionkopf mit Schrittanzeige, sichtbarer (stabiler) Fortschrittsbalken, "Theorie ansehen"/
// "Session verlassen" jederzeit erreichbar, und eine VEREINHEITLICHTE feste Aktionsleiste am
// unteren Rand mit linker/rechter Zone (Abschnitt 24: während einer Eingabeaufgabe links
// Hilfe/Audio/Theorie + rechts Prüfen; nach der Antwort links Audio erneut/Fehler erklären +
// rechts Weiter) — kein automatischer Wechsel nach 900/1400ms bei normalen Lernaufgaben.

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

  /** Stabiler Fortschrittsbalken (Abschnitt 23) — der übergebene Prozentwert kommt bereits
   * geglättet aus SessionEngine.progressPercent() und springt bei neuen Fehlerwiederholungen
   * nicht zurück. */
  function renderProgressBar(container, percent) {
    const wrap = el('div', { className: 'session-progress' });
    const track = el('div', { className: 'meter-track' });
    const fill = el('div', { className: 'meter-fill mastery' });
    fill.style.width = `${Math.max(0, Math.min(100, Math.round(percent)))}%`;
    track.appendChild(fill);
    wrap.appendChild(track);
    wrap.appendChild(el('span', { className: 'meter-value', text: `${Math.round(percent)} %` }));
    container.appendChild(wrap);
  }

  /**
   * Rendert den gemeinsamen Rahmen einer Session-Phase (Titel, Schrittanzeige, Fortschrittsbalken,
   * optionaler Fortschrittstext, Theorie-/Verlassen-Schaltflächen) und gibt die Einhänge-Punkte
   * für Inhalt und Aktionsleiste zurück.
   */
  function renderSessionShell(container, { sessionDef, phaseIndex, progressLabel, progressPercent, onTheory, onLeave }) {
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
    if (typeof progressPercent === 'number') renderProgressBar(view, progressPercent);

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

  /**
   * Vereinheitlichte Aktionsleiste (Abschnitt 24): links Sekundäraktionen (Hilfe/Audio/Theorie
   * bzw. nach der Antwort Audio erneut/Fehler erklären), rechts die Hauptaktion (Prüfen/Weiter).
   * @param {{label:string, onClick:Function, className?:string}[]} [leftButtons]
   * @param {{label:string, onClick:Function, className?:string}[]} [rightButtons]
   */
  function renderActionBar(actionBar, { leftButtons = [], rightButtons = [] } = {}) {
    while (actionBar.firstChild) actionBar.removeChild(actionBar.firstChild);
    const left = el('div', { className: 'action-bar-left' });
    leftButtons.forEach(({ label, onClick, className }) => {
      const btn = el('button', { className: className || 'btn secondary', text: label });
      btn.type = 'button';
      btn.addEventListener('click', onClick);
      left.appendChild(btn);
    });
    const right = el('div', { className: 'action-bar-right' });
    rightButtons.forEach(({ label, onClick, className }) => {
      const btn = el('button', { className: className || 'btn', text: label });
      btn.type = 'button';
      btn.addEventListener('click', onClick);
      right.appendChild(btn);
    });
    actionBar.appendChild(left);
    actionBar.appendChild(right);
  }

  /** Manuelles "Weiter" — erscheint erst, NACHDEM Feedback gezeigt wurde. */
  function renderContinueButton(actionBar, label, onClick, leftButtons = []) {
    renderActionBar(actionBar, { leftButtons, rightButtons: [{ label: label || 'Weiter', onClick }] });
  }

  function clearActionBar(actionBar) {
    while (actionBar.firstChild) actionBar.removeChild(actionBar.firstChild);
  }

  return {
    renderSessionShell, renderActionBar, renderContinueButton, clearActionBar,
    renderStepIndicator, renderProgressBar, el
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SessionRenderer;
}
