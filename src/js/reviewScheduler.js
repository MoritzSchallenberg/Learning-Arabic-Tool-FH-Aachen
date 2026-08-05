// ReviewScheduler (Entwicklungsauftrag 3, Meilenstein B, Abschnitt 18 "Tatsächliche Review
// Queue"). Nutzt die bereits vorhandenen SRS-Felder card.nextReview/card.reviewStage/
// card.consecutiveWrong/card.difficulty (srs.js) tatsächlich zur Aufgabenauswahl, statt sie nur
// zu speichern:
//
//   Priorität: 1) überfällige Wiederholungen (nextReview <= jetzt)
//              2) mehrfach falsch beantwortete Inhalte (consecutiveWrong >= 2)
//              3) Inhalte mit niedriger Beherrschung (Schwierigkeit >= 6,5)
//              4) neue Inhalte, begrenzt durch das Tageslimit (Standard 10, wählbar 5/10/15/20)
//
// Bewusst unabhängig vom konkreten Inhaltstyp (Wort/Buchstabe/Grammatik/...) — arbeitet nur mit
// { cardId, skill }-Paaren und einer getCard(cardId)-Funktion, damit sowohl der freie
// Übungsmodus als auch künftige Vokabel-Sessions dieselbe Logik nutzen können.

const ReviewScheduler = (() => {
  const ALLOWED_DAILY_LIMITS = [5, 10, 15, 20];
  const DEFAULT_DAILY_NEW_LIMIT = 10;
  const FALLBACK_DIFFICULTY = 5; // entspricht srs.js DEFAULT_DIFFICULTY, hier dupliziert, damit
  // dieses Modul ohne Ladereihenfolge-Abhängigkeit von srs.js funktioniert.
  const FREQUENTLY_WRONG_THRESHOLD = 2;
  const LOW_MASTERY_THRESHOLD = 6.5;

  function isOverdue(card, skill, now) {
    const nextReview = card.nextReview && card.nextReview[skill];
    if (!nextReview) return false; // nie geplant -> gilt als "neu", nicht als "fällig"
    return new Date(nextReview).getTime() <= now.getTime();
  }

  function hasBeenAttempted(card, skill) {
    return !!(card.difficulty && Object.prototype.hasOwnProperty.call(card.difficulty, skill));
  }

  function getConsecutiveWrong(card, skill) {
    return (card.consecutiveWrong && card.consecutiveWrong[skill]) || 0;
  }

  function getDifficulty(card, skill) {
    const value = card.difficulty && card.difficulty[skill];
    return typeof value === 'number' ? value : FALLBACK_DIFFICULTY;
  }

  function normalizeDailyLimit(limit) {
    return ALLOWED_DAILY_LIMITS.includes(limit) ? limit : DEFAULT_DAILY_NEW_LIMIT;
  }

  /**
   * @param {{cardId:string, skill:string}[]} items - alle grundsätzlich in Frage kommenden
   *   Karten/Fähigkeiten-Paare (z. B. alle Wörter einer Session x alle Fähigkeiten)
   * @param {(cardId:string)=>object} getCard - z. B. AppState.getCard
   * @param {object} [options]
   * @param {Date} [options.now]
   * @param {number} [options.dailyNewLimit=10] - einer von 5/10/15/20
   * @param {number} [options.newItemsShownToday=0]
   * @returns {{queue: object[], counts: object, dailyNewLimit: number, remainingNewSlots: number}}
   */
  function buildQueue(items, getCard, options = {}) {
    const now = options.now || new Date();
    const dailyNewLimit = normalizeDailyLimit(options.dailyNewLimit);
    const alreadyShownToday = options.newItemsShownToday || 0;
    const remainingNewSlots = Math.max(0, dailyNewLimit - alreadyShownToday);

    const overdue = [];
    const frequentlyWrong = [];
    const lowMastery = [];
    const brandNew = [];

    for (const item of items) {
      const card = getCard(item.cardId);
      if (!hasBeenAttempted(card, item.skill)) {
        brandNew.push(item);
        continue;
      }
      if (isOverdue(card, item.skill, now)) {
        overdue.push(item);
      } else if (getConsecutiveWrong(card, item.skill) >= FREQUENTLY_WRONG_THRESHOLD) {
        frequentlyWrong.push(item);
      } else if (getDifficulty(card, item.skill) >= LOW_MASTERY_THRESHOLD) {
        lowMastery.push(item);
      }
      // sonst: aktuell beherrscht und nicht fällig -> bleibt außerhalb der Queue
    }

    const limitedNew = brandNew.slice(0, remainingNewSlots);

    return {
      queue: [...overdue, ...frequentlyWrong, ...lowMastery, ...limitedNew],
      counts: {
        overdue: overdue.length,
        frequentlyWrong: frequentlyWrong.length,
        lowMastery: lowMastery.length,
        new: limitedNew.length,
        newAvailable: brandNew.length
      },
      dailyNewLimit,
      remainingNewSlots: Math.max(0, remainingNewSlots - limitedNew.length)
    };
  }

  /** Für die Startseite (Abschnitt 18): kompakte Zusammenfassung ohne Tageslimit-Deckelung. */
  function summarize(items, getCard, options = {}) {
    const result = buildQueue(items, getCard, { ...options, dailyNewLimit: options.dailyNewLimit });
    return {
      dueToday: result.counts.overdue + result.counts.frequentlyWrong + result.counts.lowMastery,
      newAvailableToday: Math.min(result.counts.newAvailable, result.remainingNewSlots + result.counts.new),
      ...result
    };
  }

  return {
    buildQueue,
    summarize,
    isOverdue,
    hasBeenAttempted,
    ALLOWED_DAILY_LIMITS,
    DEFAULT_DAILY_NEW_LIMIT
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ReviewScheduler;
}
