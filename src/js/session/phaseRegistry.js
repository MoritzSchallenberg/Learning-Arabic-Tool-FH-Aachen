// PhaseRegistry (Entwicklungsauftrag 4, Schritt 3/13.1) — Metadaten zu den 8 Phasentypen aus
// dem Session-Datenschema (Auftrag Abschnitt 14). `graded` markiert Phasen, die über die
// ExerciseRegistry aufgabenweise durchlaufen werden (recognition/reconstruction/
// guided_production/independent_production/application); theory/word_preview/summary sind
// eigene, nicht aufgabenbasierte Phasen, die die SessionEngine/SessionRenderer direkt behandeln.

const PhaseRegistry = (() => {
  const PHASES = {
    theory: { label: 'Theorie', graded: false },
    word_preview: { label: 'Lernen', graded: false },
    recognition: { label: 'Wiedererkennen', graded: true },
    reconstruction: { label: 'Rekonstruieren', graded: true },
    guided_production: { label: 'Geführte Eingabe', graded: true },
    independent_production: { label: 'Selbstständige Eingabe', graded: true },
    application: { label: 'Anwendung', graded: true },
    summary: { label: 'Abschluss', graded: false }
  };

  function get(type) {
    return PHASES[type] || { label: type, graded: false };
  }

  return { PHASES, get };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = PhaseRegistry;
}
