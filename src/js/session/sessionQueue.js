// SessionQueue (Entwicklungsauftrag 4, Schritt 3) — Aufgaben-Warteschlange für eine einzelne
// "graded" Phase (siehe phaseRegistry.js). Implementiert die in Abschnitt 14.1 des
// Entwicklungsauftrags 3 (und erneut in Auftrag 4, Abschnitt 24 "Lernreihenfolge") verlangte
// Regel: eine falsch beantwortete Aufgabe erscheint nicht sofort wieder, sondern erst nach
// 3 bis 5 anderen Aufgaben.

const SessionQueue = (() => {
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
    return { pending: pickRandomOrder(items), index: 0, total: items.length };
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

  /** Fügt `item` nach 3-5 weiteren Aufgaben erneut in die Warteschlange ein. */
  function scheduleRepeat(queueState, item) {
    const delay = 3 + Math.floor(Math.random() * 3); // 3, 4 oder 5
    const insertAt = Math.min(queueState.index + 1 + delay, queueState.pending.length);
    queueState.pending.splice(insertAt, 0, { ...item, isRepeat: true });
    queueState.total += 1;
  }

  return { create, current, isDone, advance, scheduleRepeat, pickRandomOrder };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SessionQueue;
}
