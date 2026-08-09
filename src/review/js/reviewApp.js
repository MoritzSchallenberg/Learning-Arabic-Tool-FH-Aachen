// Entwicklungsauftrag 12 — Bootstrap, zentraler Zustand und einfacher Hash-Router des
// Review-Modus. Lädt einmal alle Daten über window.reviewApi.loadAll() (IPC) und hält sie im
// Speicher; jede Ansicht liest aus diesem gemeinsamen Zustand, statt selbst nachzuladen.

const ReviewApp = (() => {
  const state = {
    words: [],
    theories: [],
    sessions: [],
    units: [],
    summary: null,
    constants: null,
    loading: true,
    error: null
  };

  const listeners = [];
  function onChange(fn) { listeners.push(fn); }
  function notify() { for (const fn of listeners) fn(state); }

  async function refresh() {
    state.loading = true;
    notify();
    try {
      if (!state.constants) state.constants = await window.reviewApi.loadConstants();
      const data = await window.reviewApi.loadAll();
      state.words = data.words;
      state.theories = data.theories;
      state.sessions = data.sessions;
      state.units = data.units;
      state.summary = data.summary;
      state.error = null;
    } catch (err) {
      state.error = err && err.message ? err.message : String(err);
    }
    state.loading = false;
    notify();
  }

  function wordById(id) { return state.words.find((w) => w.id === id); }
  function theoryById(id) { return state.theories.find((t) => t.theory_id === id); }
  function sessionOf(word) { return state.sessions.find((s) => s.session_id === word.session_id); }

  // --- einfacher Hash-Router: #dashboard | #words | #words/<id> | #theories | #theories/<id> ---
  const routeListeners = [];
  function onRouteChange(fn) { routeListeners.push(fn); }
  function currentRoute() {
    const hash = window.location.hash.replace(/^#/, '') || 'dashboard';
    const [view, id] = hash.split('/');
    return { view, id: id ? decodeURIComponent(id) : null };
  }
  function notifyRoute() { for (const fn of routeListeners) fn(currentRoute()); }
  function navigate(view, id) {
    window.location.hash = id ? `${view}/${encodeURIComponent(id)}` : view;
    // Nicht nur auf das native "hashchange"-Ereignis verlassen (in Tests ohne echten Browser
    // löst das Setzen von location.hash keins aus) -- direkt selbst benachrichtigen. Im echten
    // Browser feuert zusätzlich "hashchange", der zweite Aufruf ist dann ein harmloses,
    // idempotentes Re-Render.
    notifyRoute();
  }
  window.addEventListener('hashchange', notifyRoute);

  async function main() {
    await refresh();
    document.dispatchEvent(new CustomEvent('review:ready'));
    for (const fn of routeListeners) fn(currentRoute());
  }

  return { state, onChange, refresh, wordById, theoryById, sessionOf, onRouteChange, currentRoute, navigate, main };
})();

document.addEventListener('DOMContentLoaded', () => { ReviewApp.main(); });
