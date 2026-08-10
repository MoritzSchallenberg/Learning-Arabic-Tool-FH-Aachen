// Entwicklungsauftrag 13, Abschnitt 8 — zentrale, sichtbare Fehlerrückmeldung für
// Audiowiedergabeprobleme. Ersetzt die bisher verbreiteten stillen `.catch(() => {})`-Blöcke:
// technische Details gehen weiterhin an die Konsole, zusätzlich bekommt die Nutzerin/der Nutzer
// jetzt eine kurze, verständliche, nicht blockierende Meldung zu sehen (Abschnitt 8: "dem Nutzer
// eine kurze verständliche Meldung zeigt", "die Session nicht abstürzen lässt").
//
// Sichere DOM-Konstruktion (nur textContent/createElement), ein ARIA-Live-Bereich für
// Screenreader, automatisches Verschwinden nach kurzer Zeit, mehrere Meldungen stapeln sich
// nicht endlos (maximal 3 gleichzeitig sichtbar).

const AudioFeedback = (() => {
  const MAX_VISIBLE = 3;
  const AUTO_DISMISS_MS = 4000;

  function ensureContainer() {
    let container = document.getElementById('audio-feedback-region');
    if (!container) {
      container = document.createElement('div');
      container.id = 'audio-feedback-region';
      container.setAttribute('role', 'status');
      container.setAttribute('aria-live', 'polite');
      container.className = 'audio-feedback-region';
      document.body.appendChild(container);
    }
    return container;
  }

  /**
   * @param {string} message - kurzer, für Nutzer:innen verständlicher Text (kein technisches Detail)
   * @param {'error'|'info'} [kind]
   */
  function showNotice(message, kind = 'error') {
    const container = ensureContainer();
    while (container.children.length >= MAX_VISIBLE) {
      container.removeChild(container.firstChild);
    }
    const toast = document.createElement('div');
    toast.className = `audio-feedback-toast audio-feedback-toast--${kind}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, AUTO_DISMISS_MS);
    return toast;
  }

  function showError(message) {
    return showNotice(message, 'error');
  }

  /**
   * Zentrale Stelle, an der technische Fehlerdetails geloggt UND eine kurze, verständliche
   * Nutzer-Meldung gezeigt wird -- statt eines stillen `.catch(() => {})`.
   * @param {string} context - z. B. "Vokabelvorstellung", für die Konsolenmeldung
   * @param {Error} err
   */
  function reportAudioError(context, err) {
    // eslint-disable-next-line no-console
    console.error(`[Audio] Fehler in "${context}":`, err);
    showNotice('Audio konnte nicht abgespielt werden.', 'error');
  }

  /**
   * Sichtbarer, unaufdringlicher Hinweis, wenn statt der Aufnahme eine Computerstimme lief
   * (Abschnitt 8: "kenntlich macht, wenn TTS statt der Aufnahme verwendet wurde") -- kein Fehler,
   * deshalb eigene, neutrale Gestaltung (kind: 'info') statt der roten Fehler-Meldung.
   */
  function reportTtsFallback(context) {
    // eslint-disable-next-line no-console
    console.warn(`[Audio] "${context}": keine Aufnahme gefunden, Computerstimme (TTS) verwendet.`);
    showNotice('Computerstimme statt Aufnahme verwendet.', 'info');
  }

  return { showNotice, showError, reportAudioError, reportTtsFallback };
})();
