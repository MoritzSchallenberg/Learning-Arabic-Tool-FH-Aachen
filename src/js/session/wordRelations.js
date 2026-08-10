// WordRelations (Entwicklungsauftrag 15, Abschnitt 9.6) — löst die auf einem Wort gespeicherten
// Gruppen-/Referenz-IDs (confusion_group, homonym_group, opposite_id) zu den TATSÄCHLICH
// zugeordneten Wortobjekten auf, statt die rohe interne ID ungefiltert als Nutzertext
// anzuzeigen ("confusion_group: group_17" darf nicht erscheinen — stattdessen die Wörter, die
// diese Gruppe tatsächlich teilen). Reine Datenfunktionen, kein DOM-Zugriff, direkt mit
// node:test prüfbar.
//
// `allWords` muss der VOLLSTÄNDIGE Wortpool sein (alle 900 Wörter, nicht nur die 10 der
// aktuellen Session) — confusion_group/opposite_id können auf Wörter aus anderen Units zeigen.

const WordRelations = (() => {
  function sameGroupWords(word, allWords, groupField) {
    const groupValue = word && word[groupField];
    if (!groupValue) return [];
    return allWords.filter((w) => w.id !== word.id && w[groupField] === groupValue);
  }

  function confusionGroupWords(word, allWords) {
    return sameGroupWords(word, allWords, 'confusion_group');
  }

  function homonymGroupWords(word, allWords) {
    return sameGroupWords(word, allWords, 'homonym_group');
  }

  function oppositeWord(word, allWords) {
    if (!word || !word.opposite_id) return null;
    return allWords.find((w) => w.id === word.opposite_id) || null;
  }

  /** Weitere akzeptierte arabische Formen außer der bereits als Hauptform sichtbaren. */
  function otherAcceptedArabicForms(word) {
    if (!word) return [];
    const primary = word.arabic_vocalized || word.arabic;
    const answers = Array.isArray(word.accepted_arabic_answers) ? word.accepted_arabic_answers : [];
    const seen = new Set([primary]);
    const rest = [];
    for (const a of answers) {
      if (a && !seen.has(a)) {
        seen.add(a);
        rest.push(a);
      }
    }
    return rest;
  }

  function hasAnyExtraInfo(word, allWords) {
    return confusionGroupWords(word, allWords).length > 0
      || homonymGroupWords(word, allWords).length > 0
      || !!oppositeWord(word, allWords)
      || otherAcceptedArabicForms(word).length > 0;
  }

  return { confusionGroupWords, homonymGroupWords, oppositeWord, otherAcceptedArabicForms, hasAnyExtraInfo };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = WordRelations;
}
