// PhaseRegistry (Entwicklungsauftrag 4, Schritt 3/13.1; Gewichtung ergänzt in
// Entwicklungsauftrag 5, Abschnitt 26; auf das endgültige Zehn-Stufen-Modell umgestellt in
// Entwicklungsauftrag 16, Abschnitt 3/4/13) — Metadaten zu den 7 technischen Phasentypen aus dem
// Session-Datenschema (vocabSessions.json#phases). `graded` markiert Phasen, die über die
// ExerciseRegistry aufgabenweise durchlaufen werden (recognition/matching/guided_writing/
// independent_writing); theory/word_preview/summary sind eigene, nicht aufgabenbasierte Phasen,
// die die SessionEngine/SessionController direkt behandeln.
//
// `weight` fließt in die Sessionbewertung ein (SessionEngine.weightedScorePercent): die Gewichte
// der vier gradierten Phasen summieren sich auf 100% (Abschnitt 13: 20/20/25/35). Lernstufen 1-5
// und die Zusammenfassung erhalten kein Bewertungsgewicht.
//
// Die früheren Phasentypen 'reconstruction'/'guided_production'/'independent_production'/
// 'application' existieren als sichtbare Hauptphasen NICHT mehr (Abschnitt 3/4) -- ihre
// Aufgabentypen leben als Unteraufgaben innerhalb von 'guided_writing' (order_pieces+
// guided_typing) bzw. als Zuordnungsvariante innerhalb von 'matching' (vormals
// contextual_choice/application) weiter, siehe exerciseRegistry.js.

const PhaseRegistry = (() => {
  const PHASES = {
    theory: { label: 'Theorie', graded: false, weight: 0 },
    word_preview: { label: 'Lernen', graded: false, weight: 0 },
    recognition: { label: 'Leichtes Wiedererkennen', graded: true, weight: 0.20 },
    matching: { label: 'Zuordnungsaufgaben', graded: true, weight: 0.20 },
    guided_writing: { label: 'Schreiben mit Hilfe', graded: true, weight: 0.25 },
    independent_writing: { label: 'Freies Schreiben', graded: true, weight: 0.35 },
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
