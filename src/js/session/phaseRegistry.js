// PhaseRegistry (Entwicklungsauftrag 4, Schritt 3/13.1; Gewichtung ergänzt in
// Entwicklungsauftrag 5, Abschnitt 26) — Metadaten zu den 8 Phasentypen aus dem
// Session-Datenschema (Auftrag Abschnitt 14). `graded` markiert Phasen, die über die
// ExerciseRegistry aufgabenweise durchlaufen werden (recognition/reconstruction/
// guided_production/independent_production/application); theory/word_preview/summary sind
// eigene, nicht aufgabenbasierte Phasen, die die SessionEngine/SessionRenderer direkt behandeln.
//
// `weight` fließt in die Sessionbewertung ein (SessionEngine.weightedScorePercent): frühe,
// formative Phasen (Mini-Check/Theorie/Lernen) zählen 0%, spätere, produktivere Phasen zählen
// mehr — "Lernen bedeutet, Fehler machen zu dürfen" (Abschnitt 26). Die Gewichte summieren sich
// über die fünf gradierten Phasen auf 100%.

const PhaseRegistry = (() => {
  const PHASES = {
    theory: { label: 'Theorie', graded: false, weight: 0 },
    word_preview: { label: 'Lernen', graded: false, weight: 0 },
    recognition: { label: 'Wiedererkennen', graded: true, weight: 0.15 },
    reconstruction: { label: 'Rekonstruieren', graded: true, weight: 0.15 },
    guided_production: { label: 'Geführte Eingabe', graded: true, weight: 0.20 },
    independent_production: { label: 'Selbstständige Eingabe', graded: true, weight: 0.35 },
    application: { label: 'Anwendung', graded: true, weight: 0.15 },
    summary: { label: 'Abschluss', graded: false, weight: 0 }
  };

  function get(type) {
    return PHASES[type] || { label: type, graded: false, weight: 0 };
  }

  return { PHASES, get };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = PhaseRegistry;
}
