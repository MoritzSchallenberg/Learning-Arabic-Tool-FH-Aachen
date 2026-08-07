// SessionQueue (Entwicklungsauftrag 4, Schritt 3; erweitert in Entwicklungsauftrag 5, Abschnitt 8)
// — Aufgaben-Warteschlange für eine einzelne "graded" Phase (siehe phaseRegistry.js). Eine falsch
// beantwortete Aufgabe erscheint nicht sofort wieder, sondern erst nach 3-5 anderen Aufgaben
// (Lernreihenfolge-Regel). Anders als zuvor darf ein Wort dabei MEHRFACH erneut eingeplant werden,
// wenn es auch beim wiederholten Versuch falsch ist — begrenzt durch max_repeats_per_word_per_phase
// (Standard 3), damit keine Endlosschleife entstehen kann.

const SessionQueue = (() => {
  const DEFAULT_MAX_REPEATS_PER_WORD = 3;

  function pickRandomOrder(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  /** @param {object[]} items - z. B. [{ wordId, ... }] */
  function create(items) {
    return { pending: pickRandomOrder(items), index: 0, total: items.length, repeatCounts: {} };
  }

  function current(queueState) {
    return queueState.pending[queueState.index] || null;
  }

  function isDone(queueState) {
    return queueState.index >= queueState.pending.length;
  }

  function advance(queueState) {
    queueState.index += 1;
  }

  function repeatCountFor(queueState, wordId) {
    return (queueState.repeatCounts && queueState.repeatCounts[wordId]) || 0;
  }

  /**
   * Fügt `item` nach 3-5 weiteren Aufgaben erneut in die Warteschlange ein, solange das Wort das
   * Limit `max_repeats_per_word_per_phase` in dieser Phase noch nicht erreicht hat.
   * @returns {boolean} true, wenn die Wiederholung eingeplant wurde; false, wenn das Limit für
   *   dieses Wort in dieser Phase bereits erreicht ist (kein weiterer Repeat mehr).
   */
  function scheduleRepeat(queueState, item, options = {}) {
    const maxRepeats = options.maxRepeats || DEFAULT_MAX_REPEATS_PER_WORD;
    if (!queueState.repeatCounts) queueState.repeatCounts = {};
    const count = repeatCountFor(queueState, item.wordId);
    if (count >= maxRepeats) return false;
    queueState.repeatCounts[item.wordId] = count + 1;
    const delay = 3 + Math.floor(Math.random() * 3); // 3, 4 oder 5
    const insertAt = Math.min(queueState.index + 1 + delay, queueState.pending.length);
    queueState.pending.splice(insertAt, 0, { ...item, isRepeat: true, repeatNumber: count + 1 });
    queueState.total += 1;
    return true;
  }

  return {
    create, current, isDone, advance, scheduleRepeat, repeatCountFor, pickRandomOrder,
    DEFAULT_MAX_REPEATS_PER_WORD
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SessionQueue;
}
