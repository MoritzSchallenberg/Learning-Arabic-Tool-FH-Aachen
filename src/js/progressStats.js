// Fortschritts-/Beherrschungsberechnung (Entwicklungsauftrag 3, Meilenstein B, Abschnitt 20
// "Fortschrittsbalken"). Behebt dabei einen bestehenden Darstellungsfehler in statistics.js:
// dort wurde bisher die durchschnittliche SCHWIERIGKEIT (1=leicht...10=schwer) direkt als
// Balkenfüllstand angezeigt — ein voller Balken sah dadurch wie "gut gelernt" aus, obwohl er
// eine HOHE Schwierigkeit (schlecht beherrscht) bedeutete. BEHERRSCHUNG (mastery, 0-100%,
// höher = besser) ist das Gegenteil von Schwierigkeit und wird hier explizit getrennt berechnet.
//
// Ein Wort/Buchstabe gilt außerdem nicht schon als "beherrscht", nur weil eine einzige Fähigkeit
// einmal richtig war (Auftrag Abschnitt 20: "Ein Wort erhöht den Kursfortschritt nicht
// vollständig, wenn es nur einmal erkannt wurde") — masteryFractionForCard() prüft ALLE für den
// Karten-Typ erwarteten Fähigkeiten und gewichtet anteilig.

const ProgressStats = (() => {
  const MASTERY_DIFFICULTY_THRESHOLD = 3.5; // konsistent mit lessonProgress.js PASSED_THRESHOLD

  // Fällt auf PracticePool zurück, falls einmal separat geladen — hält beide Module synchron,
  // ohne dieselbe Fähigkeitsliste zweimal von Hand pflegen zu müssen.
  const EXPECTED_SKILLS = {
    letters: (typeof PracticePool !== 'undefined' && PracticePool.LETTER_SKILLS) || ['spelling', 'guided_typing', 'independent_typing'],
    vocabulary: (typeof PracticePool !== 'undefined' && PracticePool.VOCAB_SKILLS) || ['arabic_to_german', 'german_to_arabic'],
    connections: ['connection']
  };

  function difficultyToMasteryPercent(difficulty) {
    // Schwierigkeit 1 (leicht) -> 100% Beherrschung, Schwierigkeit 10 (schwer) -> 0%.
    return Math.max(0, Math.min(100, ((10 - difficulty) / 9) * 100));
  }

  function masteryFractionForCard(card, expectedSkills) {
    if (!expectedSkills || expectedSkills.length === 0) return 0;
    let sum = 0;
    let attempted = 0;
    for (const skill of expectedSkills) {
      const value = card.difficulty && card.difficulty[skill];
      if (typeof value === 'number') {
        attempted += 1;
        sum += value <= MASTERY_DIFFICULTY_THRESHOLD ? 1 : 0;
      }
      // nicht versuchte Fähigkeiten zählen als 0 von expectedSkills.length (siehe Kommentar oben)
    }
    return sum / expectedSkills.length;
  }

  /**
   * @param {{cardId:string, category:string}[]} items - z. B. aus PracticePool.buildPool()
   * @param {(cardId:string)=>object} getCard
   */
  function computeOverallProgress(items, getCard) {
    const uniqueByCard = new Map(); // cardId -> category
    for (const item of items) uniqueByCard.set(item.cardId, item.category);
    if (uniqueByCard.size === 0) return { percent: 0, totalCards: 0 };

    let sum = 0;
    for (const [cardId, category] of uniqueByCard.entries()) {
      sum += masteryFractionForCard(getCard(cardId), EXPECTED_SKILLS[category]);
    }
    return { percent: (sum / uniqueByCard.size) * 100, totalCards: uniqueByCard.size };
  }

  function computeByCategory(items, getCard) {
    const byCategory = new Map();
    for (const item of items) {
      if (!byCategory.has(item.category)) byCategory.set(item.category, new Set());
      byCategory.get(item.category).add(item.cardId);
    }
    const result = {};
    for (const [category, cardIdSet] of byCategory.entries()) {
      let sum = 0;
      for (const cardId of cardIdSet) {
        sum += masteryFractionForCard(getCard(cardId), EXPECTED_SKILLS[category]);
      }
      result[category] = cardIdSet.size > 0 ? (sum / cardIdSet.size) * 100 : 0;
    }
    return result;
  }

  // Kompetenzbalken (Abschnitt 20): fasst konkrete Skill-IDs zu sechs pädagogischen Kompetenzen
  // zusammen. Bewusst grobkörnig — spiegelt, was aktuell tatsächlich getrackt wird (siehe
  // README "Card-ID/Skill-Konventionen"), keine erfundenen Fähigkeiten.
  const COMPETENCY_SKILLS = {
    Lesen: ['reading'],
    Schreiben: ['guided_typing', 'independent_typing', 'german_to_arabic'],
    Hören: ['listening', 'pronunciation'],
    Wortschatz: ['arabic_to_german', 'german_to_arabic'],
    Verbindungen: ['connection'],
    Satzanwendung: ['grammar_agreement', 'grammar_verb_present', 'grammar_verb_past', 'grammar_negation', 'application']
  };

  function computeCompetencyBars(cards) {
    const result = {};
    for (const [competency, skills] of Object.entries(COMPETENCY_SKILLS)) {
      const values = [];
      for (const card of Object.values(cards)) {
        for (const skill of skills) {
          if (card.difficulty && typeof card.difficulty[skill] === 'number') {
            values.push(card.difficulty[skill]);
          }
        }
      }
      if (values.length === 0) {
        result[competency] = { percent: null, count: 0 };
      } else {
        const avgDifficulty = values.reduce((a, b) => a + b, 0) / values.length;
        result[competency] = { percent: difficultyToMasteryPercent(avgDifficulty), count: values.length };
      }
    }
    return result;
  }

  return {
    MASTERY_DIFFICULTY_THRESHOLD,
    EXPECTED_SKILLS,
    COMPETENCY_SKILLS,
    difficultyToMasteryPercent,
    masteryFractionForCard,
    computeOverallProgress,
    computeByCategory,
    computeCompetencyBars
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ProgressStats;
}
