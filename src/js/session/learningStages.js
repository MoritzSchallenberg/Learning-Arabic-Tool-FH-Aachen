// LearningStages (Entwicklungsauftrag 15, Abschnitt 5; auf das vollständige Zehn-Stufen-Modell
// erweitert in Entwicklungsauftrag 16, Abschnitt 4) — EIN zentrales Modell für den gesamten
// sichtbaren Sessionablauf, gemeinsam verwendet von SessionController (Ablaufsteuerung),
// SessionRenderer (Anzeige "Stufe N von 10"), SessionEngine (Bewertungsgewichte über
// PhaseRegistry, dieselben Schlüssel wie Stufe 6-10 hier), dem Session-Snapshot und den Tests.
// Keine zweite, abweichende Definition an anderer Stelle im Code.
//
// Stufen 1-5 bilden weiterhin (unverändert seit Entwicklungsauftrag 15) nur die ersten beiden
// technischen Phasentypen ('theory', 'word_preview') feiner ab. NEU in Entwicklungsauftrag 16:
// Stufen 6-10 entsprechen jetzt DIREKT (1:1) den vier gradierten technischen Phasentypen plus
// 'summary' -- vocabSessions.json#phases enthält ab dieser Runde exakt diese sieben Einträge
// (theory, word_preview, recognition, matching, guided_writing, independent_writing, summary),
// keine der früheren sichtbaren Phasen 'reconstruction'/'guided_production'/
// 'independent_production'/'application' mehr (Abschnitt 3/4). Die frühere Übergangskonstante
// AFTER_STAGE_5_LABEL ("Als Nächstes: Übungen") entfällt ersatzlos (Abschnitt 4) -- nach Stufe 5
// erscheint jetzt direkt "Stufe 6 von 10: Leichtes Wiedererkennen".

const LearningStages = (() => {
  const STAGES = [
    { key: 'learning_goals', number: 1, label: 'Lernziele' },
    { key: 'theory', number: 2, label: 'Kurze Theorie' },
    { key: 'word_cards', number: 3, label: 'Neue Wörter kennenlernen' },
    { key: 'audio_familiarization', number: 4, label: 'Audio kennenlernen' },
    { key: 'word_overview', number: 5, label: 'Wortübersicht' },
    { key: 'recognition', number: 6, label: 'Leichtes Wiedererkennen' },
    { key: 'matching', number: 7, label: 'Zuordnungsaufgaben' },
    { key: 'guided_writing', number: 8, label: 'Schreiben mit Hilfe' },
    { key: 'independent_writing', number: 9, label: 'Freies Schreiben' },
    { key: 'summary', number: 10, label: 'Zusammenfassung' }
  ];

  const ORDER = STAGES.map((s) => s.key);
  const TOTAL_DISPLAY_STAGES = 10; // jetzt exakt STAGES.length -- keine "spätere" Restanzahl mehr.

  function get(key) {
    return STAGES.find((s) => s.key === key) || null;
  }

  function indexOf(key) {
    return ORDER.indexOf(key);
  }

  function first() {
    return ORDER[0];
  }

  /** @returns {string|null} nächste Stufe, oder null nach der letzten (Stufe 10). */
  function next(key) {
    const i = indexOf(key);
    if (i === -1 || i + 1 >= ORDER.length) return null;
    return ORDER[i + 1];
  }

  function previous(key) {
    const i = indexOf(key);
    if (i <= 0) return null;
    return ORDER[i - 1];
  }

  function isLast(key) {
    return indexOf(key) === ORDER.length - 1;
  }

  function isValid(key) {
    return indexOf(key) !== -1;
  }

  /**
   * Stufen-Fortschritt als 0-100-Wert, EIGENSTÄNDIG vom Übungsfortschritt innerhalb einer
   * einzelnen Stufe (SessionEngine.progressPercent() misst nur den Fortschritt INNERHALB der
   * jeweils aktuellen gradierten Phase). Hier: Fortschritt über ALLE zehn Stufen hinweg.
   * @param {string} key - aktuelle Stufe
   * @param {number} [subProgress=0] - Fortschritt INNERHALB der aktuellen Stufe, 0..1
   */
  function stageProgressPercent(key, subProgress = 0) {
    const idx = indexOf(key);
    if (idx === -1) return 0;
    const clampedSub = Math.max(0, Math.min(1, subProgress));
    return Math.round(((idx + clampedSub) / STAGES.length) * 100);
  }

  return {
    STAGES,
    ORDER,
    TOTAL_DISPLAY_STAGES,
    get,
    indexOf,
    first,
    next,
    previous,
    isLast,
    isValid,
    stageProgressPercent
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = LearningStages;
}
