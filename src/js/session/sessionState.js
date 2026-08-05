// SessionState (Entwicklungsauftrag 4, Schritt 3 + Abschnitt 15 "Session-Wiederaufnahme
// vollständig anschließen"). Dünner Wrapper um die bereits vorhandenen, aber bisher ungenutzten
// AppState-Speicherfunktionen (saveSessionState/getSessionState/clearSessionState), mit dem
// von Abschnitt 15 verlangten Feldsatz: Phase, Aufgabenindex, bereits vorgestellte Wörter,
// Theorie-/Mini-Check-Status, offene Fehlerwiederholungen, Hilfestufe, richtige/falsche
// Antworten, Start-/letzte Aktivitätszeit.

const SessionState = (() => {
  function getState(sessionId) {
    return AppState.getSessionState(sessionId);
  }

  /** @returns {'not_started'|'in_progress'|'completed'} */
  function getStatus(sessionId) {
    const state = getState(sessionId);
    if (!state) return 'not_started';
    return state.status === 'completed' ? 'completed' : 'in_progress';
  }

  async function initNew(sessionId) {
    const state = {
      sessionId,
      status: 'in_progress',
      phaseIndex: 0,
      taskIndex: 0,
      exposedWordIds: [],
      theoryDone: false,
      miniCheckResult: null,
      pendingRepeats: [],
      helpLevel: 'C',
      correctCount: 0,
      wrongCount: 0,
      startedAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString()
    };
    await AppState.saveSessionState(sessionId, state);
    return state;
  }

  async function save(sessionId, partialState) {
    const existing = getState(sessionId) || {};
    const merged = { ...existing, ...partialState, lastActivityAt: new Date().toISOString() };
    await AppState.saveSessionState(sessionId, merged);
    return merged;
  }

  async function complete(sessionId) {
    return save(sessionId, { status: 'completed' });
  }

  async function discard(sessionId) {
    await AppState.clearSessionState(sessionId);
  }

  return { getState, getStatus, initNew, save, complete, discard };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SessionState;
}
