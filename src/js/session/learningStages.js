// LearningStages (Entwicklungsauftrag 15, Abschnitt 5) — EIN zentrales Modell für die ersten
// fünf Lernstufen des neuen pädagogischen Sessionablaufs, gemeinsam verwendet von
// SessionController (Ablaufsteuerung), SessionRenderer (Anzeige "Stufe N von 10"),
// SessionState-Snapshot (dauerhafte Speicherung, siehe sessionController.js#learningStageState)
// und den Tests. Keine zweite, abweichende Definition an anderer Stelle im Code.
//
// Bewusst KEINE neuen Einträge in sessionDef.phases (vocabSessions.json bleibt unverändert,
// Abschnitt 3 "keine zweite Session-Engine"): die 5 Stufen bilden stattdessen die bestehenden
// ersten zwei Phasentypen ('theory', 'word_preview') feiner auf:
//   Stufe 1 "learning_goals"         -> vor dem eigentlichen Phasendurchlauf (Sessionübersicht,
//                                        SessionEngine.phaseIndex existiert noch nicht)
//   Stufe 2 "theory"                 -> phaseIndex 0 (Phasentyp 'theory')
//   Stufe 3 "word_cards"             -> phaseIndex 1 (Phasentyp 'word_preview'), Unterstufe A
//   Stufe 4 "audio_familiarization"  -> phaseIndex 1 (Phasentyp 'word_preview'), Unterstufe B
//   Stufe 5 "word_overview"          -> phaseIndex 1 (Phasentyp 'word_preview'), Unterstufe C
// Ab phaseIndex 2 (recognition …) laufen die vorhandenen, in dieser Runde NICHT umgebauten
// Übungsphasen unverändert weiter (Entwicklungsauftrag 16 übernimmt die endgültige Stufen-6-10-
// Zuordnung) — deshalb TOTAL_DISPLAY_STAGES = 10, aber nur 5 STAGES real definiert.

const LearningStages = (() => {
  const STAGES = [
    { key: 'learning_goals', number: 1, label: 'Lernziele' },
    { key: 'theory', number: 2, label: 'Kurze Theorie' },
    { key: 'word_cards', number: 3, label: 'Neue Wörter kennenlernen' },
    { key: 'audio_familiarization', number: 4, label: 'Audio kennenlernen' },
    { key: 'word_overview', number: 5, label: 'Wortübersicht' }
  ];

  const ORDER = STAGES.map((s) => s.key);
  const TOTAL_DISPLAY_STAGES = 10; // Abschnitt 6: "Stufe 1 von 10" … "Stufe 5 von 10"
  const AFTER_STAGE_5_LABEL = 'Als Nächstes: Übungen'; // Abschnitt 6: ehrlicher Übergang, keine erfundenen Stufen 6-10

  function get(key) {
    return STAGES.find((s) => s.key === key) || null;
  }

  function indexOf(key) {
    return ORDER.indexOf(key);
  }

  function first() {
    return ORDER[0];
  }

  /** @returns {string|null} nächste Stufe, oder null nach der letzten (Stufe 5 -> Übungen). */
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
   * Stufen-Fortschritt als 0-100-Wert, EIGENSTÄNDIG vom späteren Übungsfortschritt
   * (SessionEngine.progressPercent(), der weiterhin ausschließlich die "graded"-Phasen misst,
   * Abschnitt 15: "Definiere klar den Unterschied … zum späteren Übungsfortschritt").
   * @param {string} key - aktuelle Stufe
   * @param {number} [subProgress=0] - Fortschritt INNERHALB der aktuellen Stufe, 0..1
   *   (z. B. cardIndex/words.length in Stufe 3/4) — steigt NIE durch bloßes erneutes Abspielen
   *   von Audio, nur durch tatsächliches Weiterschreiten (Abschnitt 15).
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
    AFTER_STAGE_5_LABEL,
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
