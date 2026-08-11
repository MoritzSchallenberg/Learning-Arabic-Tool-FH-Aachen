// FeedbackModel (Entwicklungsauftrag 17, Abschnitt 5.2/6) — baut aus dem Ergebnis der
// bestehenden Grading-Logik (über AnswerAnalyzer verfeinert) das gemeinsame, strukturierte
// Feedbackmodell. Reine Datenfunktionen, kein DOM-Zugriff — feedbackRenderer.js übernimmt die
// Darstellung. Abschnitt 22: die hier erzeugte `isCorrect`/`resultCategory` wird NIE neu
// bestimmt, sondern unverändert aus der bereits feststehenden Bewertung übernommen.

const FeedbackModel = (() => {
  // Abschnitt 7/8.1 — Titel, Symbol (nicht nur Farbe) und ARIA-Rolle je Kategorie.
  const CATEGORY_META = {
    correct_full: { title: 'Richtig', icon: '✓', srRole: 'status', tone: 'correct' },
    accepted_alternative: { title: 'Richtig – zulässige Alternative', icon: '✓', srRole: 'status', tone: 'correct' },
    correct_no_diacritics: { title: 'Richtig – die Grundbuchstaben stimmen', icon: '✓', srRole: 'status', tone: 'correct' },
    // srRole 'status' (nicht 'alert'): gilt bewusst weiterhin als "richtig" (Abschnitt 22, siehe
    // isCorrectCategory) -- nur ein Hinweis, kein tatsächlicher Fehler.
    diacritics_mismatch: { title: 'Fast richtig – überprüfe die Vokalzeichen', icon: '◐', srRole: 'status', tone: 'partial' },
    typo: { title: 'Fast richtig – ein kleiner Schreibfehler', icon: '◐', srRole: 'alert', tone: 'partial' },
    wrong_word: { title: 'Noch nicht – du hast ein anderes Wort gewählt', icon: '✕', srRole: 'alert', tone: 'wrong' },
    wrong_meaning: { title: 'Noch nicht – du hast eine andere Bedeutung gewählt', icon: '✕', srRole: 'alert', tone: 'wrong' },
    empty: { title: 'Bitte gib eine Antwort ein', icon: '!', srRole: 'alert', tone: 'empty' },
    matching_error: { title: 'Diese beiden Elemente gehören nicht zusammen. Versuche es erneut.', icon: '✕', srRole: 'alert', tone: 'wrong' },
    technical_error: { title: 'Technisches Problem – zählt nicht als Lernfehler', icon: '⚠', srRole: 'alert', tone: 'technical' }
  };

  // Abschnitt 22: darf die bestehende Bewertung NIE widersprüchlich umdeuten. Die zugrunde
  // liegende srs.js-Regel liefert für "Grundbuchstaben stimmen" IMMER 'correct_no_diacritics' --
  // unabhängig davon, ob gar keine oder FALSCHE Vokalzeichen eingegeben wurden (diese
  // Unterscheidung trifft erst AnswerAnalyzer für die Anzeige, Abschnitt 7.3/7.4). Beide
  // Anzeige-Kategorien bleiben deshalb bei der bereits bestehenden Bewertung "richtig".
  function isCorrectCategory(category) {
    return category === 'correct_full' || category === 'accepted_alternative'
      || category === 'correct_no_diacritics' || category === 'diacritics_mismatch';
  }

  // Abschnitt 17: Fehlertyp für die gezielte Wiederholungsplanung -- rein aus der bereits
  // feststehenden Kategorie abgeleitet, keine zweite Bewertung. 'wrong_word' bedeutet bei einer
  // GETIPPTEN Aufgabe einen Schreibfehler, bei einer AUSWAHLAUFGABE (falsches arabisches Wort
  // angeklickt) dagegen eher eine verwechselte Bedeutung -- daher isTyped als Unterscheidung.
  function errorTypeForCategory(category, { isTyped = true } = {}) {
    switch (category) {
      case 'diacritics_mismatch': return 'diacritics';
      case 'typo': return 'spelling';
      case 'wrong_word': return isTyped ? 'spelling' : 'meaning';
      case 'wrong_meaning': return 'meaning';
      case 'empty': return 'empty';
      case 'matching_error': return 'matching';
      default: return null;
    }
  }

  /**
   * Vollständige Fehlertyp-Herleitung inkl. Verwechslungs-Verfeinerung (Abschnitt 11) -- von
   * buildForWord() UND sessionController.js (für die Coverage-Speicherung VOR dem eigentlichen
   * Modellaufbau) gemeinsam genutzt, damit beide niemals auseinanderlaufen können.
   */
  function errorTypeForAnalysis(analysis, { isTyped = true } = {}) {
    const isCorrect = isCorrectCategory(analysis.category);
    if (analysis.relation && !isCorrect) return 'confusion';
    return errorTypeForCategory(analysis.category, { isTyped });
  }

  /**
   * Gemeinsames Feedbackmodell für eine Einzelwort-Aufgabe (Wiedererkennen, geführtes/freies
   * Schreiben, Kontextauswahl). `analysis` kommt aus AnswerAnalyzer#analyzeTypedArabicAnswer()
   * oder #analyzeChoiceAnswer().
   * @param {object} params
   * @param {string} params.exerciseType
   * @param {object} params.word - Zielwort (vollständiges Wortobjekt aus vocabulary.json)
   * @param {object} params.analysis
   * @param {boolean} [params.repeatScheduled] - Abschnitt 8.5: nur dann Wiederholungshinweis
   * @param {boolean} [params.repeatLimitReached]
   * @param {boolean} [params.helpUsed] - Abschnitt 14: "Richtig mit Hilfestellung"
   * @param {boolean} [params.isReview]
   * @param {string} [params.prompt] - Situationstext bei Kontextaufgaben (Abschnitt 6 Vertrag)
   * @param {boolean} [params.firstAttempt]
   */
  function buildForWord({
    exerciseType, word, analysis, repeatScheduled = false, repeatLimitReached = false,
    helpUsed = false, isReview = false, prompt = null, firstAttempt = true, isTyped = true
  }) {
    const meta = CATEGORY_META[analysis.category] || CATEGORY_META.wrong_word;
    const isCorrect = isCorrectCategory(analysis.category);
    const errorType = errorTypeForAnalysis(analysis, { isTyped });

    return {
      // --- Abschnitt 6: einheitlicher Ergebnisvertrag ---
      exerciseType,
      resultCategory: analysis.category,
      isCorrect,
      submittedAnswer: analysis.submittedAnswer !== undefined ? analysis.submittedAnswer : null,
      expectedWordId: word.id,
      selectedWordId: analysis.selectedWordId !== undefined ? analysis.selectedWordId : null,
      matchedAcceptedAnswer: analysis.matchedAnswer !== undefined ? analysis.matchedAnswer : null,
      expectedAnswers: analysis.expectedAnswers || null,
      errorType,
      prompt,
      firstAttempt,
      // --- Abschnitt 5.2: Feedbackmodell für die Darstellung ---
      title: meta.title,
      icon: meta.icon,
      srRole: meta.srRole,
      tone: meta.tone,
      helpUsed,
      word,
      charDiff: analysis.charDiff || null,
      relation: analysis.relation || null,
      repeatScheduled,
      repeatLimitReached,
      isReview
    };
  }

  /**
   * Entwicklungsauftrag 17, Abschnitt 13 — Abschlussfeedback einer vollständig gelösten
   * Zuordnungsgruppe: alle Paare, Paare mit erstem Fehlversuch markiert, keine rohen Wort-IDs.
   * @param {object[]} groupWords
   * @param {object} perWordCorrect - { [wordId]: boolean }
   * @param {string[]} erroredWordIds - Wörter mit mindestens einem ersten Fehlversuch
   */
  function buildMatchingGroupSummary({ groupWords, perWordCorrect, erroredWordIds }) {
    const erroredSet = new Set(erroredWordIds || []);
    const pairs = groupWords.map((w) => ({
      word: w,
      correct: !!perWordCorrect[w.id],
      hadFirstError: erroredSet.has(w.id)
    }));
    const allCorrect = pairs.every((p) => p.correct);
    const problematicWords = pairs.filter((p) => p.hadFirstError).map((p) => p.word);
    return {
      exerciseType: 'matching',
      resultCategory: allCorrect ? 'correct_full' : 'matching_error',
      isCorrect: allCorrect,
      errorType: allCorrect ? null : 'matching',
      title: allCorrect ? 'Gruppe vollständig richtig zugeordnet' : 'Gruppe abgeschlossen — einige Paare brauchten mehrere Versuche',
      icon: allCorrect ? '✓' : '◐',
      srRole: allCorrect ? 'status' : 'alert',
      tone: allCorrect ? 'correct' : 'partial',
      pairs,
      problematicWords
    };
  }

  return { CATEGORY_META, isCorrectCategory, errorTypeForCategory, errorTypeForAnalysis, buildForWord, buildMatchingGroupSummary };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = FeedbackModel;
}
