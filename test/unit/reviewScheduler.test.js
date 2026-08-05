// Tests für src/js/reviewScheduler.js (Entwicklungsauftrag 3, Meilenstein B — echte Review Queue).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const ReviewScheduler = require('../../src/js/reviewScheduler.js');

function makeCardStore(initial = {}) {
  const cards = { ...initial };
  return (cardId) => cards[cardId] || {};
}

test('brandNew Items ohne bisherigen Versuch gelten als "neu", nicht als "fällig"', () => {
  const getCard = makeCardStore({ w1: {} });
  const result = ReviewScheduler.buildQueue([{ cardId: 'w1', skill: 'arabic_to_german' }], getCard);
  assert.equal(result.counts.overdue, 0);
  assert.equal(result.counts.new, 1);
});

test('überfällige Wiederholungen (nextReview in der Vergangenheit) kommen zuerst', () => {
  const past = new Date(Date.now() - 86400000).toISOString();
  const getCard = makeCardStore({
    overdue1: { difficulty: { arabic_to_german: 5 }, nextReview: { arabic_to_german: past } },
    new1: {}
  });
  const items = [
    { cardId: 'new1', skill: 'arabic_to_german' },
    { cardId: 'overdue1', skill: 'arabic_to_german' }
  ];
  const result = ReviewScheduler.buildQueue(items, getCard);
  assert.equal(result.queue[0].cardId, 'overdue1');
});

test('Priorität: überfällig > häufig falsch > niedrige Beherrschung > neu', () => {
  const past = new Date(Date.now() - 1000).toISOString();
  const future = new Date(Date.now() + 86400000).toISOString();
  const getCard = makeCardStore({
    overdue: { difficulty: { s: 5 }, nextReview: { s: past } },
    wrongStreak: { difficulty: { s: 5 }, consecutiveWrong: { s: 3 }, nextReview: { s: future } },
    lowMastery: { difficulty: { s: 8 }, nextReview: { s: future } },
    brandNew: {}
  });
  const items = ['brandNew', 'lowMastery', 'wrongStreak', 'overdue'].map((id) => ({ cardId: id, skill: 's' }));
  const result = ReviewScheduler.buildQueue(items, getCard);
  assert.deepEqual(result.queue.map((i) => i.cardId), ['overdue', 'wrongStreak', 'lowMastery', 'brandNew']);
});

test('gut beherrschte, nicht fällige Karten erscheinen NICHT in der Queue', () => {
  const future = new Date(Date.now() + 86400000).toISOString();
  const getCard = makeCardStore({
    mastered: { difficulty: { s: 1 }, nextReview: { s: future } }
  });
  const result = ReviewScheduler.buildQueue([{ cardId: 'mastered', skill: 's' }], getCard);
  assert.equal(result.queue.length, 0);
});

test('Tageslimit begrenzt neue Wörter, ändert aber nichts an fälligen/schwierigen', () => {
  const getCard = makeCardStore({}); // alle "neu"
  const items = Array.from({ length: 15 }, (_, i) => ({ cardId: `w${i}`, skill: 's' }));
  const result = ReviewScheduler.buildQueue(items, getCard, { dailyNewLimit: 10 });
  assert.equal(result.queue.length, 10);
  assert.equal(result.counts.newAvailable, 15);
  assert.equal(result.remainingNewSlots, 0);
});

test('bereits heute gezeigte neue Wörter reduzieren die verbleibenden Slots', () => {
  const getCard = makeCardStore({});
  const items = Array.from({ length: 15 }, (_, i) => ({ cardId: `w${i}`, skill: 's' }));
  const result = ReviewScheduler.buildQueue(items, getCard, { dailyNewLimit: 10, newItemsShownToday: 7 });
  assert.equal(result.queue.length, 3);
  assert.equal(result.remainingNewSlots, 0);
});

test('ungültiges Tageslimit fällt auf den Standardwert 10 zurück', () => {
  const getCard = makeCardStore({});
  const items = Array.from({ length: 12 }, (_, i) => ({ cardId: `w${i}`, skill: 's' }));
  const result = ReviewScheduler.buildQueue(items, getCard, { dailyNewLimit: 999 });
  assert.equal(result.dailyNewLimit, 10);
  assert.equal(result.queue.length, 10);
});

test('ALLOWED_DAILY_LIMITS enthält genau 5/10/15/20', () => {
  assert.deepEqual(ReviewScheduler.ALLOWED_DAILY_LIMITS, [5, 10, 15, 20]);
});

test('isOverdue() ohne gesetztes nextReview gilt als nicht fällig', () => {
  assert.equal(ReviewScheduler.isOverdue({}, 's', new Date()), false);
});

test('hasBeenAttempted() erkennt vorhandene Schwierigkeitswerte korrekt', () => {
  assert.equal(ReviewScheduler.hasBeenAttempted({ difficulty: { s: 5 } }, 's'), true);
  assert.equal(ReviewScheduler.hasBeenAttempted({ difficulty: {} }, 's'), false);
  assert.equal(ReviewScheduler.hasBeenAttempted({}, 's'), false);
});

test('summarize() liefert dueToday und newAvailableToday für die Startseite', () => {
  const past = new Date(Date.now() - 1000).toISOString();
  const getCard = makeCardStore({
    overdue: { difficulty: { s: 5 }, nextReview: { s: past } },
    new1: {},
    new2: {}
  });
  const items = [
    { cardId: 'overdue', skill: 's' },
    { cardId: 'new1', skill: 's' },
    { cardId: 'new2', skill: 's' }
  ];
  const summary = ReviewScheduler.summarize(items, getCard, { dailyNewLimit: 10 });
  assert.equal(summary.dueToday, 1);
  assert.equal(summary.newAvailableToday, 2);
});
